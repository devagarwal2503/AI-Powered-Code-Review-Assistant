/**
 * webhookVerifier.js — HMAC-SHA256 GitHub webhook signature verification
 *
 * How it works:
 * 1. GitHub computes HMAC-SHA256 of the raw request body using your webhook secret
 * 2. It sends the result as: X-Hub-Signature-256: sha256=<hex_digest>
 * 3. We compute the same HMAC independently and compare results
 * 4. If they match → request is genuinely from GitHub
 * 5. If they don't → reject with 401
 *
 * Why timingSafeEqual instead of ===:
 * A normal string comparison short-circuits as soon as it finds a mismatch.
 * An attacker can measure response time to figure out how many characters
 * of their forged signature matched — a "timing attack". timingSafeEqual
 * always compares every byte, so response time reveals nothing.
 *
 * Why req.body must be a Buffer (raw bytes):
 * If we had parsed the body with express.json() first, we'd be re-stringifying
 * a JS object. JSON serialization doesn't guarantee key ordering, so the bytes
 * would differ from what GitHub signed → signature check always fails.
 * express.raw() on the webhook route gives us the unmodified buffer.
 */

const crypto = require('crypto');
const { config } = require('../utils/config');
const logger = require('../utils/logger');

function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const deliveryId = req.headers['x-github-delivery'];

  if (!signature) {
    logger.warn('Webhook received without signature header', { deliveryId });
    return res.status(401).json({ error: 'Missing X-Hub-Signature-256 header' });
  }

  if (!config.GITHUB_WEBHOOK_SECRET) {
    logger.error('GITHUB_WEBHOOK_SECRET is not configured — cannot verify webhooks');
    return res.status(500).json({ error: 'Server misconfiguration: missing webhook secret' });
  }

  // Compute expected signature
  const hmac = crypto.createHmac('sha256', config.GITHUB_WEBHOOK_SECRET);
  hmac.update(req.body); // req.body is a Buffer — raw bytes, unmodified
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  // Convert both to Buffers for timing-safe comparison
  // Note: both must be the same byte length for timingSafeEqual
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  const signaturesMatch =
    sigBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(sigBuffer, expectedBuffer);

  if (!signaturesMatch) {
    logger.warn('Webhook signature verification FAILED — possible spoofed request', {
      deliveryId,
      // Never log the full received signature — log just enough to debug
      receivedPrefix: signature.substring(0, 15) + '...',
    });
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // Signature verified — safe to parse the body
  // Attach parsed payload to req so the route handler can use it
  try {
    req.webhookPayload = JSON.parse(req.body.toString('utf8'));
  } catch (err) {
    logger.error('Webhook body is not valid JSON', { deliveryId, error: err.message });
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  logger.debug('Webhook signature verified', { deliveryId });
  next();
}

module.exports = { verifyWebhookSignature };
