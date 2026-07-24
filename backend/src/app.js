/**
 * app.js — Express application entry point
 *
 * Startup sequence:
 *  1. Load env vars from .env (dotenv)
 *  2. Validate required config
 *  3. Connect to MongoDB
 *  4. Register middleware and routes
 *  5. Start HTTP server
 *
 * Why do we call dotenv.config() as the very first line?
 * Because every other module (config.js, db.js, etc.) reads from
 * process.env when they're imported. If dotenv hasn't run yet,
 * those reads return undefined — a subtle bug that only appears
 * in production where .env doesn't exist.
 */

require('dotenv').config(); // Must be first — loads .env into process.env

const express = require('express');
const cors = require('cors');

const { validateConfig, config } = require('./utils/config');
const logger = require('./utils/logger');
const { connectDB } = require('./models/db');

const healthRouter = require('./routes/health');
const webhookRouter = require('./routes/webhook');
const apiRouter = require('./routes/api');

// Validate required env vars before doing anything else
// This will throw and crash immediately if MONGODB_URI is missing —
// which is exactly what we want (fast failure, clear error message)
validateConfig(['MONGODB_URI']);

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

// CORS: allow the frontend (Vite dev server on :5173, or Vercel in prod)
// to call our API. We'll tighten the origin list in Phase 5.
app.use(
  cors({
    origin:
      config.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL // set on Render in Phase 5
        : 'http://localhost:5173', // Vite default port
    methods: ['GET', 'POST'],
  })
);

// JSON parsing for all routes EXCEPT /webhook
// (webhook uses express.raw() — see routes/webhook.js for the explanation)
app.use((req, res, next) => {
  if (req.path.startsWith('/webhook')) return next();
  express.json()(req, res, next);
});

// Request logger — logs every incoming request
app.use((req, res, next) => {
  logger.debug('Incoming request', { method: req.method, path: req.path });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);
app.use('/webhook', webhookRouter);
app.use('/api', apiRouter);

// 404 handler — must come after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler — must have 4 params (err, req, res, next)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error:
      config.NODE_ENV === 'production'
        ? 'Internal server error' // don't leak stack traces in prod
        : err.message,
  });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start() {
  await connectDB();

  app.listen(config.PORT, () => {
    logger.info('Server started', {
      port: config.PORT,
      env: config.NODE_ENV,
    });
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

// Export for testing (Jest can import the app without calling start())
module.exports = app;
