/**
 * reviewPoster.js — Posts AI findings as GitHub PR review comments
 *
 * Key concept: line visibility
 * ─────────────────────────────
 * GitHub's review API only accepts inline comments on lines that appear
 * in the diff. If you try to comment on a line that isn't visible in the
 * diff, the ENTIRE review request fails with 422 (even if other comments
 * are on valid lines).
 *
 * Our strategy:
 *   1. Parse each file's patch to find which new-file line numbers are visible
 *   2. Findings whose line IS visible → inline PR comment (anchored to the line)
 *   3. Findings whose line is NOT visible → folded into the review body text
 *
 * This is the correct production approach. Many open-source review bots
 * get this wrong and silently drop findings or crash on 422 errors.
 *
 * Comment format:
 * We use emoji + severity + category to make comments scannable at a glance
 * in the Files Changed tab. GitHub renders markdown in review comments.
 *
 * Review event type:
 * We use "COMMENT" (not "APPROVE" or "REQUEST_CHANGES") because this tool
 * is an analysis assistant, not a gatekeeper. The human reviewer decides
 * whether to block the PR.
 */

const { createPRReview } = require('../github/api');
const logger = require('../utils/logger');

// Emoji prefix for each severity level — makes comments scannable in GitHub UI
const SEVERITY_EMOJI = {
  high: '🔴',
  medium: '🟠',
  low: '🟡',
  info: '🔵',
};

const SEVERITY_LABEL = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
};

/**
 * Parses a unified diff patch to determine which line numbers in the NEW file
 * are visible (either added lines or context lines shown in the diff).
 *
 * Only visible lines can receive inline comments via the GitHub review API.
 *
 * @param {string} patch - The unified diff string from GitHub API
 * @returns {Set<number>} Set of visible line numbers in the new file
 */
function getVisibleNewFileLines(patch) {
  if (!patch) return new Set();

  const visibleLines = new Set();
  const lines = patch.split('\n');
  let currentNewLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse new file start line from @@ -old_start,old_count +new_start,new_count @@
      const match = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) currentNewLine = parseInt(match[1], 10);
      // The @@ line itself is not a code line — don't add it to visibleLines
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      // Added line: visible in new file
      visibleLines.add(currentNewLine);
      currentNewLine++;
    } else if (line.startsWith(' ')) {
      // Context line: visible in new file (unchanged but shown for context)
      visibleLines.add(currentNewLine);
      currentNewLine++;
    }
    // Lines starting with '-' are removed lines — not in new file, skip
    // Lines starting with '---' or '+++' are file headers — skip
  }

  return visibleLines;
}

/**
 * Formats a single finding as a GitHub markdown comment body.
 *
 * @param {Object} finding
 * @returns {string}
 */
function formatFindingBody(finding) {
  const emoji = SEVERITY_EMOJI[finding.severity] || '⚪';
  const label = SEVERITY_LABEL[finding.severity] || finding.severity.toUpperCase();
  const category = finding.category.toUpperCase();

  return [
    `${emoji} **[${label}] ${category}: ${finding.title}**`,
    '',
    finding.explanation,
    '',
    `**Suggestion:** ${finding.suggestion || 'See explanation above.'}`,
    '',
    '---',
    '*AI Code Review Assistant — review findings before acting on suggestions*',
  ].join('\n');
}

/**
 * Formats the overall review body text.
 * Includes the AI summary + any findings that couldn't be posted inline.
 *
 * @param {string} summary - Overall PR quality summary from AI
 * @param {Array} bodyFindings - Findings that couldn't be posted inline
 * @param {number} inlineCount - Number of findings posted inline
 * @returns {string}
 */
function formatReviewBody(summary, bodyFindings, inlineCount, totalFindings) {
  const lines = [];

  lines.push('## 🤖 AI Code Review');
  lines.push('');
  lines.push(`**Summary:** ${summary}`);
  lines.push('');

  if (totalFindings === 0) {
    lines.push('✅ No significant issues found in this PR.');
  } else {
    lines.push(`**Found ${totalFindings} issue(s):** ${inlineCount} posted as inline comments below.`);
  }

  // Include non-inline findings in the body
  if (bodyFindings.length > 0) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('### Additional findings (lines not in diff):');
    lines.push('');

    for (const finding of bodyFindings) {
      const emoji = SEVERITY_EMOJI[finding.severity] || '⚪';
      const label = SEVERITY_LABEL[finding.severity] || finding.severity.toUpperCase();
      lines.push(`**${emoji} [${label}] \`${finding.file}\` line ${finding.line}: ${finding.title}**`);
      lines.push('');
      lines.push(finding.explanation);
      lines.push('');
      if (finding.suggestion) {
        lines.push(`**Suggestion:** ${finding.suggestion}`);
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

/**
 * Posts AI findings as a GitHub PR review with inline comments.
 *
 * @param {Object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {string} params.headSha
 * @param {string} params.token - Installation access token
 * @param {Object} params.analysis - { findings: Array, summary: string }
 * @param {Array} params.files - PR file objects (for patch parsing)
 * @returns {Promise<{ githubReviewId: number, inlineCount: number, bodyCount: number }>}
 */
async function postReview({ owner, repo, pullNumber, headSha, token, analysis, files }) {
  const { findings, summary } = analysis;

  // Build a map of filename → set of visible line numbers
  const visibilityMap = new Map();
  for (const file of files) {
    visibilityMap.set(file.filename, getVisibleNewFileLines(file.patch));
  }

  // Split findings: inline (visible line) vs. body (non-visible line)
  const inlineFindings = [];
  const bodyFindings = [];

  for (const finding of findings) {
    const visibleLines = visibilityMap.get(finding.file);
    const isVisible = visibleLines && visibleLines.has(finding.line);

    if (isVisible) {
      inlineFindings.push(finding);
    } else {
      bodyFindings.push(finding);
      logger.debug('Finding line not in diff — will include in review body', {
        file: finding.file,
        line: finding.line,
        title: finding.title,
      });
    }
  }

  logger.info('Posting PR review to GitHub', {
    owner, repo, pullNumber,
    inlineFindings: inlineFindings.length,
    bodyFindings: bodyFindings.length,
  });

  // Format inline comments for the API
  const comments = inlineFindings.map((finding) => ({
    path: finding.file,
    line: finding.line,
    side: 'RIGHT', // "RIGHT" = new file (after the change)
    body: formatFindingBody(finding),
  }));

  // Format the overall review body
  const reviewBody = formatReviewBody(
    summary,
    bodyFindings,
    inlineFindings.length,
    findings.length
  );

  // Submit the review (single API call, atomic)
  const githubReview = await createPRReview(
    owner,
    repo,
    pullNumber,
    headSha,
    reviewBody,
    comments,
    token
  );

  logger.info('PR review posted successfully', {
    owner, repo, pullNumber,
    githubReviewId: githubReview.id,
    inlineComments: inlineFindings.length,
    bodyFindings: bodyFindings.length,
  });

  // Return metadata to update the MongoDB record
  return {
    githubReviewId: githubReview.id,
    inlineCount: inlineFindings.length,
    bodyCount: bodyFindings.length,
  };
}

module.exports = { postReview, getVisibleNewFileLines };
