/**
 * logger.js — Lightweight structured logger
 *
 * Why not just console.log?
 * - console.log outputs unstructured strings. In production, you want
 *   JSON so logs can be searched/filtered by field (e.g., find all
 *   errors for a specific repo, or all events with duration > 5000ms).
 * - This is a minimal logger for Phase 0. In Phase 5 we'll swap the
 *   internals for Winston, but the API (logger.info, logger.error, etc.)
 *   stays identical — so no other file needs to change.
 *
 * Log levels (lowest → highest severity):
 *   debug → info → warn → error
 * Only logs at or above the current level are printed.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function log(level, message, meta = {}) {
  if (LEVELS[level] < LEVELS[currentLevel]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};

module.exports = logger;
