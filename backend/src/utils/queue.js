/**
 * queue.js — In-memory async job queue
 *
 * Why we need this:
 * ─────────────────
 * GitHub sends a webhook and waits for a response. If no response
 * arrives within 10 seconds, it marks the delivery as failed and retries.
 *
 * Our AI analysis pipeline takes 30–60 seconds. If we process synchronously:
 *   GitHub sends webhook → we start analysis → 10s timeout → GitHub retries
 *   → we're now processing the same PR twice → duplicate review comments.
 *
 * Solution:
 *   GitHub sends webhook → we respond 200 immediately → enqueue job → process async
 *
 * How it works:
 * ─────────────
 * Jobs are plain async functions. They're pushed into an array. processNext()
 * runs them one at a time (serial, not parallel). When one finishes, the next
 * starts automatically.
 *
 * Serial vs. parallel:
 * We process one job at a time by choice. Parallel processing would require
 * careful rate-limit management (OpenAI + GitHub both have limits). Serial
 * keeps it simple — for a portfolio project, the throughput is fine.
 *
 * What this doesn't handle (and why it's OK for now):
 * ─────────────────────────────────────────────────────
 * - Server restart loses queued jobs → acceptable for dev/portfolio use
 * - No retry logic on job failure → we log the error and move on
 * - No priority queue → all PRs are equal
 *
 * Production upgrade path:
 * Replace enqueue() with a BullMQ job queue backed by Redis.
 * The rest of the codebase doesn't need to change — just the internals here.
 */

const logger = require('./logger');

const jobQueue = [];
let isProcessing = false;

/**
 * Add a job to the queue and trigger processing.
 * @param {Function} job - An async function to execute
 */
function enqueue(job) {
  jobQueue.push(job);
  logger.debug('Job enqueued', { queueDepth: jobQueue.length });
  processNext();
}

/**
 * Process the next job in the queue (if not already processing).
 * Called automatically after enqueue() and after each job completes.
 */
async function processNext() {
  if (isProcessing || jobQueue.length === 0) return;

  isProcessing = true;
  const job = jobQueue.shift();

  logger.debug('Processing job', { remainingInQueue: jobQueue.length });

  try {
    await job();
  } catch (err) {
    // Log but don't crash — move on to the next job
    logger.error('Queue job failed unexpectedly', {
      error: err.message,
      stack: err.stack,
    });
  } finally {
    isProcessing = false;
    processNext(); // Chain to next job
  }
}

/**
 * Returns current queue status — useful for the health endpoint later.
 */
function getQueueStatus() {
  return {
    depth: jobQueue.length,
    isProcessing,
  };
}

module.exports = { enqueue, getQueueStatus };
