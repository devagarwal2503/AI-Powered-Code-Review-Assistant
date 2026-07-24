/**
 * contextFetcher.js — Fetches surrounding file context for changed code
 *
 * Why surrounding context matters:
 * A diff shows you the changed lines, but often the issue is in what
 * surrounds them. For example:
 *
 *   - Changed line:  const result = db.query(userInput);
 *   - Without context: looks fine, maybe just a query
 *   - With context: we can see userInput comes from req.body with no sanitization
 *
 * Strategy:
 * For each file in the chunk, we fetch the full file content at the PR's
 * head commit SHA. We then extract lines around each changed hunk (±CONTEXT_LINES).
 * This gives the model enough code to make a meaningful judgment.
 *
 * Why use head SHA (not branch name)?
 * A branch name like "feature/auth" can move (new commits). Using the exact
 * commit SHA guarantees we're looking at the same code the PR diff was generated from.
 *
 * How unified diff line numbers work:
 * A hunk header like @@ -10,6 +10,8 @@ means:
 *   - In the OLD file: starts at line 10, covers 6 lines
 *   - In the NEW file: starts at line 10, covers 8 lines
 * We care about the NEW file line numbers (the +10 part) since that's what
 * we're reviewing and what we'll reference in findings.
 */

const { fetchFileContent } = require('../github/api');
const logger = require('../utils/logger');

const CONTEXT_LINES = 25; // lines of context above and below each changed hunk

/**
 * Parses a unified diff patch to extract hunk start line numbers in the new file.
 *
 * @param {string} patch - The unified diff string from GitHub API
 * @returns {Array<number>} Array of line numbers in the new file where hunks start
 */
function parseHunkStartLines(patch) {
  if (!patch) return [];

  const hunkStartLines = [];
  const hunkHeaderRegex = /@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/g;
  let match;

  while ((match = hunkHeaderRegex.exec(patch)) !== null) {
    hunkStartLines.push(parseInt(match[1], 10));
  }

  return hunkStartLines;
}

/**
 * Given file content (as a string) and hunk start line numbers,
 * extracts the relevant sections of the file with context padding.
 * Merges overlapping context windows to avoid duplication.
 *
 * @param {string} content - Full file content
 * @param {Array<number>} hunkStartLines - Line numbers where changes begin
 * @returns {string} Formatted excerpt with line numbers
 */
function extractContextWindow(content, hunkStartLines) {
  const lines = content.split('\n');

  if (hunkStartLines.length === 0) {
    // No hunk info — return first 50 lines as a fallback
    return lines.slice(0, 50).map((l, i) => `${i + 1}: ${l}`).join('\n');
  }

  // Build set of line indices to include (0-indexed internally)
  const includedLineIndices = new Set();

  for (const startLine of hunkStartLines) {
    const start = Math.max(0, startLine - CONTEXT_LINES - 1); // -1 for 0-index
    const end = Math.min(lines.length - 1, startLine + CONTEXT_LINES + 20); // +20 for hunk body estimate

    for (let i = start; i <= end; i++) {
      includedLineIndices.add(i);
    }
  }

  // Sort indices and build output with line numbers
  const sortedIndices = Array.from(includedLineIndices).sort((a, b) => a - b);
  const result = [];
  let previousIndex = -2;

  for (const idx of sortedIndices) {
    if (idx > previousIndex + 1) {
      result.push('... [lines omitted] ...');
    }
    result.push(`${idx + 1}: ${lines[idx]}`);
    previousIndex = idx;
  }

  return result.join('\n');
}

/**
 * For a given file in the PR, fetches its full content and extracts
 * the relevant context window around changed lines.
 *
 * @param {Object} file - GitHub file object (has .filename, .patch)
 * @param {string} headSha - The PR head commit SHA
 * @param {string} owner
 * @param {string} repo
 * @param {string} token - Installation access token
 * @returns {Promise<string|null>} Context excerpt, or null if file can't be fetched
 */
async function fetchContextForFile(file, headSha, owner, repo, token) {
  try {
    const content = await fetchFileContent(owner, repo, file.filename, headSha, token);

    if (!content) {
      logger.debug('No content fetched for file', { filename: file.filename });
      return null;
    }

    const hunkStartLines = parseHunkStartLines(file.patch);
    const context = extractContextWindow(content, hunkStartLines);

    logger.debug('Context fetched for file', {
      filename: file.filename,
      hunks: hunkStartLines.length,
      contextLines: context.split('\n').length,
    });

    return context;
  } catch (err) {
    // Non-fatal: if we can't get context, we'll analyze with the diff only
    logger.warn('Failed to fetch context for file', {
      filename: file.filename,
      error: err.message,
    });
    return null;
  }
}

/**
 * Fetches context for all files in a chunk.
 * Returns a Map of filename → context string.
 *
 * @param {Array} files - Array of GitHub file objects
 * @param {string} headSha
 * @param {string} owner
 * @param {string} repo
 * @param {string} token
 * @returns {Promise<Map<string, string>>}
 */
async function fetchContextForChunk(files, headSha, owner, repo, token) {
  const contextMap = new Map();

  // Sequential (not Promise.all) to avoid rate-limiting the GitHub Contents API
  for (const file of files) {
    const context = await fetchContextForFile(file, headSha, owner, repo, token);
    if (context) {
      contextMap.set(file.filename, context);
    }
  }

  return contextMap;
}

module.exports = { fetchContextForChunk, parseHunkStartLines };
