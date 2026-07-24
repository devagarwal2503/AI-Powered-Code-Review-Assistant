/**
 * diffChunker.js — Groups changed files into token-safe chunks
 *
 * Why chunking matters:
 * If a PR has 20 files changed, the combined diff + context can easily
 * exceed the model's context window and cause a hard API error.
 * We split files into groups where each group fits comfortably within budget.
 *
 * Token estimation:
 * We don't import tiktoken (native bindings, complex on Windows) for a rough
 * estimate. Instead: 1 token ≈ 4 characters — a well-known approximation that
 * holds for English and code. We add a 25% safety margin on top.
 *
 * What this doesn't handle (and why it's OK):
 * A single file whose patch alone exceeds the budget. We truncate its patch
 * rather than splitting mid-hunk (splitting hunks mid-way breaks line mapping).
 * In practice, a single-file patch that's >200k chars is extremely rare.
 */

// Budget per chunk in estimated tokens
const MAX_TOKENS_PER_CHUNK = 50_000;

// 1 token ≈ 4 chars (rough but reliable for code)
const CHARS_PER_TOKEN = 4;

// We set the char budget at 75% of the max to give a safety margin
const MAX_CHARS_PER_CHUNK = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN * 0.75;

// If a single file's patch is this large, truncate it
const MAX_PATCH_CHARS = MAX_CHARS_PER_CHUNK * 0.9;

/**
 * Splits an array of GitHub file objects into chunks.
 * Each chunk is an array of files whose combined patch size fits within budget.
 *
 * @param {Array} files - Array of file objects from GitHub API (each has .patch, .filename)
 * @returns {Array<Array>} Array of file groups (chunks)
 */
function chunkFiles(files) {
  const chunks = [];
  let currentChunk = [];
  let currentChunkChars = 0;

  for (let rawFile of files) {
    let file = rawFile; // mutable local copy so we can truncate patch if needed
    let patch = file.patch || '';

    // Truncate oversized patches rather than crashing
    if (patch.length > MAX_PATCH_CHARS) {
      patch = patch.substring(0, MAX_PATCH_CHARS);
      patch += '\n... [patch truncated — too large for context window]';
      file = { ...file, patch, patchTruncated: true };
    }

    // Each file's footprint = filename + patch + some overhead for prompt formatting
    const fileChars = file.filename.length + patch.length + 200;

    // If adding this file would exceed the budget, start a new chunk
    if (currentChunkChars + fileChars > MAX_CHARS_PER_CHUNK && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkChars = 0;
    }

    currentChunk.push(file);
    currentChunkChars += fileChars;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Estimates the token count of a string.
 * Used for logging and debugging — not for hard budget enforcement.
 */
function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

module.exports = { chunkFiles, estimateTokens };
