/**
 * auth.js — GitHub App authentication: JWT → Installation Access Token
 *
 * The two-token flow in detail:
 *
 * TOKEN 1: App JWT
 * ─────────────────
 * - Signed with your App's RSA private key using RS256 algorithm
 * - Payload: { iss: APP_ID, iat: <now - 60s>, exp: <now + 10min> }
 * - iat is set 60 seconds in the past as a clock drift buffer —
 *   if your server clock and GitHub's clock are slightly out of sync,
 *   GitHub might reject a token that appears to be from the future.
 * - Used only to call /app/installations endpoints
 * - Max valid for 10 minutes
 *
 * TOKEN 2: Installation Access Token
 * ────────────────────────────────────
 * - Returned by GitHub in exchange for the App JWT
 * - Scoped to a specific installation (one repo or org)
 * - Valid for 1 hour
 * - Used to call all other GitHub API endpoints (fetch files, post comments, etc.)
 *
 * Caching strategy:
 * Generating a new token on every webhook would hammer the GitHub API
 * and slow things down. We cache the token and reuse it until 60 seconds
 * before expiry (safety margin for clock drift and slow requests).
 *
 * Note: In a multi-process or multi-server setup, you'd store this cache
 * in Redis so all instances share the same token. For this single-server
 * setup, module-level variables are fine.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { config } = require('../utils/config');
const logger = require('../utils/logger');

// Per-installation token cache
// Key: installationId (string), Value: { token, expiresAt (ms timestamp) }
const tokenCache = new Map();

/**
 * Reads and signs a short-lived JWT to authenticate as the GitHub App.
 *
 * Private key source (checked in order):
 * 1. GITHUB_APP_PRIVATE_KEY env var — the full PEM content as a string.
 *    Use this in production (Render, etc.) where you can't upload files.
 *    Render stores multi-line env vars as-is. If yours uses literal \n
 *    instead of real newlines (some CI systems do this), we replace them.
 * 2. GITHUB_APP_PRIVATE_KEY_PATH — path to a .pem file on disk.
 *    Use this in local development.
 */
function createAppJWT() {
  let privateKey;

  if (process.env.GITHUB_APP_PRIVATE_KEY) {
    // Env var — may have literal '\n' strings (some deployment platforms
    // escape newlines when setting env vars). Replace them with real newlines.
    privateKey = process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else {
    const privateKeyPath = path.resolve(config.GITHUB_APP_PRIVATE_KEY_PATH);
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error(
        `GitHub App private key not found.\n` +
          `Set GITHUB_APP_PRIVATE_KEY env var (PEM string) OR place the .pem file at: ${privateKeyPath}`
      );
    }
    privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    iat: nowSeconds - 60,       // 60s in the past (clock drift buffer)
    exp: nowSeconds + (9 * 60), // expires in 9 min (GitHub max = 10)
    iss: String(config.GITHUB_APP_ID),
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

/**
 * Gets a valid installation token for the given installation ID.
 * Returns a cached token if still valid, otherwise fetches a new one.
 *
 * @param {number} installationId - The installation ID from the webhook payload
 * @returns {Promise<string>} The installation access token
 */
async function getInstallationToken(installationId) {
  const cacheKey = String(installationId);
  const cached = tokenCache.get(cacheKey);
  const BUFFER_MS = 60_000; // refresh 60s before actual expiry

  if (cached && Date.now() < cached.expiresAt - BUFFER_MS) {
    logger.debug('Using cached installation token', { installationId });
    return cached.token;
  }

  logger.info('Requesting new installation token', { installationId });

  const appJWT = createAppJWT();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJWT}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'AI-Code-Review-Assistant',
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get installation token (${response.status}): ${body}`
    );
  }

  const data = await response.json();

  // Cache it
  tokenCache.set(cacheKey, {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
  });

  logger.info('Installation token obtained and cached', {
    installationId,
    expiresAt: data.expires_at,
  });

  return data.token;
}

module.exports = { getInstallationToken };
