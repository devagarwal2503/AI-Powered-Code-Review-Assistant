/**
 * api.js — GitHub REST API client
 *
 * Why we use Node 18's built-in fetch instead of axios or node-fetch:
 * - No extra dependency
 * - Identical API to browser fetch (transferable knowledge)
 * - Available in Node 18+ (our minimum version)
 *
 * All functions accept a token parameter (the installation token from auth.js).
 * We never store tokens here — auth.js owns that concern.
 *
 * GitHub API versioning:
 * We always send X-GitHub-Api-Version: 2022-11-28 to pin to a stable version.
 * Without this, GitHub may silently change response shapes on us.
 */

const logger = require('../utils/logger');

const GITHUB_API_BASE = 'https://api.github.com';
const USER_AGENT = 'AI-Code-Review-Assistant';

/**
 * Builds the standard GitHub API headers for an authenticated request.
 */
function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  };
}

/**
 * Fetches the list of changed files in a Pull Request.
 * Each file object contains:
 *   - filename: path of the file
 *   - status: added | modified | removed | renamed
 *   - additions, deletions, changes: line counts
 *   - patch: the unified diff string (the actual changed lines)
 *   - blob_url: URL to the full file on GitHub
 *
 * Note: GitHub paginates this at 30 files/page, max 300 files.
 * For Phase 1, we handle up to 300 files (5 pages). If a PR has
 * more than 300 changed files, we log a warning and process what we get.
 *
 * @param {string} owner - Repo owner (user or org)
 * @param {string} repo - Repo name
 * @param {number} pullNumber - PR number
 * @param {string} token - Installation access token
 * @returns {Promise<Array>} Array of file objects
 */
async function fetchPRFiles(owner, repo, pullNumber, token) {
  const allFiles = [];
  let page = 1;
  const perPage = 100; // Max allowed by GitHub

  while (page <= 3) { // Cap at 300 files (3 pages × 100)
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${perPage}&page=${page}`;

    logger.debug('Fetching PR files page', { owner, repo, pullNumber, page });

    const response = await fetch(url, { headers: githubHeaders(token) });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch PR files (${response.status}): ${body}`);
    }

    const files = await response.json();
    allFiles.push(...files);

    // If we got fewer than perPage results, this is the last page
    if (files.length < perPage) break;

    page++;
  }

  if (allFiles.length === 300) {
    logger.warn('PR has 300+ changed files — only first 300 will be analyzed', {
      owner, repo, pullNumber,
    });
  }

  // Filter out binary files and deleted files (no patch to analyze)
  const analyzableFiles = allFiles.filter(
    (f) => f.patch && f.status !== 'removed'
  );

  logger.info('PR files fetched', {
    owner, repo, pullNumber,
    total: allFiles.length,
    analyzable: analyzableFiles.length,
    skipped: allFiles.length - analyzableFiles.length,
  });

  return analyzableFiles;
}

/**
 * Fetches the full content of a file at a specific git ref (commit SHA or branch).
 * Used in Phase 2 to get surrounding context for changed lines.
 *
 * Returns null if the file doesn't exist at that ref (e.g. it was just added).
 *
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath - Path to the file within the repo
 * @param {string} ref - Git ref (commit SHA, branch name, tag)
 * @param {string} token
 * @returns {Promise<string|null>} File content as a string, or null if not found
 */
async function fetchFileContent(owner, repo, filePath, ref, token) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${ref}`;

  const response = await fetch(url, { headers: githubHeaders(token) });

  if (response.status === 404) {
    logger.debug('File not found at ref', { filePath, ref });
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch file content (${response.status}): ${body}`);
  }

  const data = await response.json();

  // GitHub returns file content base64-encoded
  return Buffer.from(data.content, 'base64').toString('utf8');
}

/**
 * Posts a pull request review with inline comments.
 * Used in Phase 3.
 *
 * @param {string} owner
 * @param {string} repo
 * @param {number} pullNumber
 * @param {string} commitId - The head commit SHA of the PR
 * @param {string} body - Overall review summary text
 * @param {Array} comments - Array of { path, line, body } objects
 * @param {string} token
 */
async function createPRReview(owner, repo, pullNumber, commitId, body, comments, token) {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commit_id: commitId,
      body,
      event: 'COMMENT', // COMMENT = post without approving/requesting changes
      comments,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Failed to create PR review (${response.status}): ${errBody}`);
  }

  return response.json();
}

module.exports = { fetchPRFiles, fetchFileContent, createPRReview };
