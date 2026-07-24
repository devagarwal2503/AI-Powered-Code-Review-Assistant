/**
 * analysisOrchestrator.js — Wires the entire AI analysis pipeline together
 *
 * Pipeline for a single PR:
 *
 *   files (from Phase 1)
 *     │
 *     ▼
 *   chunkFiles()          — split into token-safe groups
 *     │
 *     ▼ (for each chunk)
 *   fetchContextForChunk() — fetch surrounding code from GitHub
 *     │
 *     ▼
 *   buildPrompts()         — assemble system + user prompt
 *     │
 *     ▼
 *   callOpenAI()           — get structured JSON findings
 *     │
 *     ▼
 *   mergeAndNormalize()    — combine findings from all chunks
 *     │
 *     ▼
 *   { findings[], summary } — ready for Phase 3 (post to PR + store in DB)
 *
 * Why process chunks sequentially (not in parallel)?
 * Each chunk is a separate OpenAI API call. Parallel calls would be faster
 * but multiply our token-per-minute usage. On a free/low-tier key, this
 * immediately triggers rate limits. Sequential processing with natural delays
 * stays safely within limits.
 */

const { chunkFiles } = require('./diffChunker');
const { fetchContextForChunk } = require('./contextFetcher');
const { buildPrompts } = require('./promptBuilder');
const { callOpenAI } = require('./openaiClient');
const logger = require('../utils/logger');

/**
 * Normalizes and deduplicates findings from multiple chunk results.
 * Also validates that each finding has the required fields.
 *
 * @param {Array} chunkResults - Array of { findings, summary } objects
 * @param {Array} files - Original file list (to validate file references)
 * @returns {{ findings: Array, summary: string }}
 */
function mergeAndNormalize(chunkResults, files) {
  const validFilenames = new Set(files.map((f) => f.filename));
  const allFindings = [];
  const summaries = [];

  const VALID_SEVERITIES = new Set(['high', 'medium', 'low', 'info']);
  const VALID_CATEGORIES = new Set(['security', 'bug-risk', 'architecture', 'performance', 'style']);

  for (const result of chunkResults) {
    if (!result || !Array.isArray(result.findings)) continue;

    for (const finding of result.findings) {
      // Validate required fields
      if (!finding.file || !finding.title || !finding.explanation) {
        logger.warn('Skipping malformed finding', { finding });
        continue;
      }

      // Normalize severity (default to 'low' if invalid)
      if (!VALID_SEVERITIES.has(finding.severity)) {
        finding.severity = 'low';
      }

      // Normalize category (default to 'style' if invalid)
      if (!VALID_CATEGORIES.has(finding.category)) {
        finding.category = 'style';
      }

      // Normalize line to integer
      finding.line = parseInt(finding.line, 10) || 0;

      allFindings.push(finding);
    }

    if (result.summary) {
      summaries.push(result.summary);
    }
  }

  // Deduplicate findings on same file + line + title
  const seen = new Set();
  const deduplicated = allFindings.filter((f) => {
    const key = `${f.file}:${f.line}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: high severity first, then by file, then by line number
  const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
  deduplicated.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
    if (sevDiff !== 0) return sevDiff;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  const summary =
    summaries.length === 1
      ? summaries[0]
      : summaries.length > 1
        ? summaries.join(' | ')
        : 'Analysis complete.';

  return { findings: deduplicated, summary };
}

/**
 * Runs the full AI analysis pipeline for a PR.
 *
 * @param {Object} params
 * @param {Array} params.files - Changed files with patches (from Phase 1)
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {string} params.prTitle
 * @param {string} params.headSha
 * @param {string} params.token - Installation access token
 * @returns {Promise<{ findings: Array, summary: string }>}
 */
async function analyzePR({ files, owner, repo, pullNumber, prTitle, headSha, token }) {
  logger.info('Starting PR analysis', {
    owner, repo, pullNumber, fileCount: files.length,
  });

  // Step 1: Split files into token-safe chunks
  const chunks = chunkFiles(files);
  logger.info('Files chunked for analysis', {
    totalFiles: files.length,
    chunkCount: chunks.length,
  });

  const prMeta = { owner, repo, pullNumber, prTitle, headSha };
  const chunkResults = [];

  // Step 2: Process each chunk sequentially
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    logger.info(`Processing chunk ${i + 1}/${chunks.length}`, {
      filesInChunk: chunk.map((f) => f.filename),
    });

    try {
      // Fetch surrounding file context from GitHub
      const contextMap = await fetchContextForChunk(chunk, headSha, owner, repo, token);

      // Build the prompts
      const { systemPrompt, userPrompt } = buildPrompts(chunk, contextMap, prMeta);

      // Call OpenAI
      const result = await callOpenAI(systemPrompt, userPrompt);
      chunkResults.push(result);

      logger.info(`Chunk ${i + 1} analysis complete`, {
        findingsInChunk: result?.findings?.length || 0,
      });
    } catch (err) {
      logger.error(`Chunk ${i + 1} analysis failed`, {
        error: err.message,
        files: chunk.map((f) => f.filename),
      });
      // Don't abort the whole PR — skip this chunk and continue
      chunkResults.push({ findings: [], summary: `Analysis failed for chunk ${i + 1}: ${err.message}` });
    }
  }

  // Step 3: Merge all chunk results into a single normalized response
  const result = mergeAndNormalize(chunkResults, files);

  logger.info('PR analysis complete', {
    owner, repo, pullNumber,
    totalFindings: result.findings.length,
    bySeverity: {
      high: result.findings.filter((f) => f.severity === 'high').length,
      medium: result.findings.filter((f) => f.severity === 'medium').length,
      low: result.findings.filter((f) => f.severity === 'low').length,
      info: result.findings.filter((f) => f.severity === 'info').length,
    },
  });

  return result;
}

module.exports = { analyzePR };
