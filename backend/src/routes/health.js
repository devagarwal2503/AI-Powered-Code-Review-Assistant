/**
 * health.js — Health check route
 *
 * A health endpoint is the first thing you add to any production service.
 * It lets you (and deployment platforms like Render) verify the service
 * is alive and all its dependencies are reachable — without exposing
 * any business logic or data.
 *
 * Render uses this to know when your app has started and when to restart it.
 * We'll configure it in Phase 5. For now it's useful for manual verification.
 */

const express = require('express');
const { getConnectionState } = require('../models/db');

const router = express.Router();

router.get('/', (req, res) => {
  const dbState = getConnectionState();

  // Return 503 if DB is not connected — the service is not healthy
  const isHealthy = dbState === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    dependencies: {
      mongodb: dbState,
    },
  });
});

module.exports = router;
