/**
 * db.js — MongoDB connection module
 *
 * Why a separate module instead of connecting in app.js?
 * - Testability: tests can import db.js and control when the DB connects.
 * - Reusability: any module can import { getDB } if it needs the connection.
 * - Separation of concerns: app.js orchestrates startup, db.js owns DB logic.
 *
 * Why Mongoose over the raw MongoDB driver?
 * - Schema validation: we define what a Review document looks like;
 *   Mongoose rejects malformed data before it hits the DB.
 * - Query API: cleaner syntax for the aggregation queries we'll write
 *   in Phase 4 for the dashboard.
 * - The tradeoff: Mongoose adds a small overhead and "magic" (virtuals,
 *   middleware hooks). For a project this size, the DX benefit is worth it.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { config } = require('../utils/config');

async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      // These are the recommended settings for production Mongoose connections.
      // serverSelectionTimeoutMS: how long to try to connect before giving up.
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('MongoDB connected', {
      host: mongoose.connection.host,
      db: mongoose.connection.name,
    });
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    // Exit the process — there's no point running the server without a DB.
    // In production, the process manager (Render) will restart us.
    process.exit(1);
  }
}

// Expose connection state so other modules (e.g., health check) can read it
function getConnectionState() {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] || 'unknown';
}

module.exports = { connectDB, getConnectionState };
