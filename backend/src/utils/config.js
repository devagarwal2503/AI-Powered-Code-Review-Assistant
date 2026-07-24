/**
 * config.js — Central environment variable reader
 *
 * Why a dedicated config module instead of reading process.env directly?
 *
 * 1. Single source of truth: if a var name changes, you fix it here,
 *    not in 10 different files.
 * 2. Validation on startup: the app crashes immediately with a clear error
 *    if a required var is missing — not silently at the point of use.
 * 3. Default values: keeps defaults in one place.
 * 4. Testability: tests can import this and stub it easily.
 */

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,

  // GitHub App credentials
  // These come from GitHub when you create the App (Phase 1 setup)
  GITHUB_APP_ID: process.env.GITHUB_APP_ID,
  GITHUB_APP_PRIVATE_KEY_PATH: process.env.GITHUB_APP_PRIVATE_KEY_PATH || './private-key.pem',
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};

/**
 * Call this once at startup to catch missing required vars early.
 * We separate "required now" from "required later" so Phase 0
 * works without a GitHub App being registered yet.
 */
function validateConfig(requiredKeys = ['MONGODB_URI']) {
  const missing = requiredKeys.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env file against .env.example'
    );
  }
}

module.exports = { config, validateConfig };
