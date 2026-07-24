/**
 * webhook.js — GitHub webhook event handler
 *
 * Flow for each incoming request:
 * 1. express.raw() gives us the raw Buffer body (not parsed)
 * 2. verifyWebhookSignature() checks HMAC-SHA256 signature → 401 if bad
 *    (also parses body into req.webhookPayload if valid)
 * 3. We filter: only handle pull_request events with action=opened|synchronize
 * 4. Respond 200 immediately (GitHub's 10s timeout)
 * 5. Enqueue the analysis job for async processing
 *
 * pull_request event actions we care about:
 * - "opened": new PR created → analyze it
 * - "synchronize": new commits pushed to an existing PR → re-analyze
 * - "closed", "merged", "labeled", etc. → skip
 */

const express = require('express');
const logger = require('../utils/logger');
const { verifyWebhookSignature } = require('../github/webhookVerifier');
const { enqueue } = require('../utils/queue');
const { getInstallationToken } = require('../github/auth');
const { fetchPRFiles } = require('../github/api');

const router = express.Router();

// Events we want to process (other actions are silently ignored)
const HANDLED_ACTIONS = new Set(['opened', 'synchronize']);

router.post(
  '/',
  express.raw({ type: 'application/json' }), // keep body as raw Buffer for HMAC check
  verifyWebhookSignature,                     // verify → attach req.webhookPayload
  async (req, res) => {
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];
    const payload = req.webhookPayload;

    // Only handle pull_request events
    if (event !== 'pull_request') {
      logger.debug('Ignoring non-PR event', { event, deliveryId });
      return res.status(200).json({ received: true, processed: false, reason: 'not a pull_request event' });
    }

    // Only handle relevant actions
    if (!HANDLED_ACTIONS.has(payload.action)) {
      logger.debug('Ignoring PR action', { action: payload.action, deliveryId });
      return res.status(200).json({ received: true, processed: false, reason: `action '${payload.action}' not handled` });
    }

    // ─── Respond immediately before doing any async work ─────────────────────
    // GitHub requires a 200 within 10 seconds. We respond now and do the
    // heavy lifting (token fetch, API calls, AI analysis) asynchronously.
    res.status(200).json({ received: true, processed: true, deliveryId });

    // ─── Snapshot the data we need from the payload ───────────────────────────
    const {
      repository,
      pull_request: pullRequest,
      installation,
    } = payload;

    const jobContext = {
      owner: repository.owner.login,
      repo: repository.name,
      pullNumber: pullRequest.number,
      prTitle: pullRequest.title,
      headSha: pullRequest.head.sha,
      baseSha: pullRequest.base.sha,
      installationId: installation.id,
      deliveryId,
      action: payload.action,
    };

    logger.info('PR event accepted — enqueuing analysis job', jobContext);

    // ─── Enqueue the async job ────────────────────────────────────────────────
    enqueue(async () => {
      const { owner, repo, pullNumber, headSha, installationId } = jobContext;

      try {
        // Step 1: Get an installation token scoped to this repo
        const token = await getInstallationToken(installationId);

        // Step 2: Fetch the list of changed files with their diffs
        const files = await fetchPRFiles(owner, repo, pullNumber, token);

        logger.info('PR files fetched — ready for analysis', {
          owner, repo, pullNumber,
          fileCount: files.length,
          totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
          totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
          files: files.map((f) => ({
            name: f.filename,
            status: f.status,
            changes: f.changes,
          })),
        });

        // ── Phase 2 hook: AI analysis will be inserted here ──────────────────
        // analysisOrchestrator.analyze({ files, headSha, owner, repo, token });

      } catch (err) {
        logger.error('PR analysis job failed', {
          owner, repo, pullNumber,
          error: err.message,
          stack: err.stack,
        });
      }
    });
  }
);

module.exports = router;
