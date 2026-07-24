/**
 * webhook.js — GitHub webhook handler (Phase 0 stub)
 *
 * ⚠️  This is a STUB. It only logs and acknowledges events.
 * Phase 1 will add:
 *   - HMAC-SHA256 signature verification (security)
 *   - Event type filtering (only handle pull_request events)
 *   - Async job queue (so the 200 response is sent before AI analysis runs)
 *   - Actual diff fetching + analysis trigger
 *
 * Critical design note — why express.raw() instead of express.json():
 * ─────────────────────────────────────────────────────────────────
 * GitHub signs each webhook payload with your WEBHOOK_SECRET using
 * HMAC-SHA256. To verify that signature, you need the raw bytes of
 * the request body — exactly as GitHub sent them.
 *
 * express.json() parses the body into a JS object BEFORE your handler
 * runs, destroying the raw bytes. If you try to re-stringify the object
 * to verify the signature, JSON key ordering may differ and the check fails.
 *
 * Solution: use express.raw() on this route only. You get the raw Buffer,
 * you verify the signature against it, THEN you parse it yourself.
 * We're setting this up correctly now even though verification is Phase 1.
 */

const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

router.post(
  '/',
  express.raw({ type: 'application/json' }), // raw body, not parsed
  (req, res) => {
    const event = req.headers['x-github-event'];
    const deliveryId = req.headers['x-github-delivery'];

    logger.info('Webhook received', {
      event: event || 'unknown',
      deliveryId: deliveryId || 'unknown',
      bodyLength: req.body?.length || 0,
    });

    // Always respond 200 quickly — GitHub will retry if we don't respond in 10s
    // The actual processing (AI analysis etc.) will be async in Phase 1
    res.status(200).json({ received: true });
  }
);

module.exports = router;
