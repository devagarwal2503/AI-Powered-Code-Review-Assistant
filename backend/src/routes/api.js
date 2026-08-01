/**
 * api.js — REST API endpoints for the React dashboard
 *
 * All routes under /api — mounted in app.js.
 * Data comes entirely from reviewStore.js which uses the MongoDB
 * aggregation pipelines written in Phase 3.
 *
 * Route design:
 * We use /repos/:owner/:repo instead of /repos/:repoFullName because
 * "/" in a URL path segment is a reserved delimiter. "owner/repo" would
 * need encoding. Two separate params is cleaner.
 */

const express = require('express');
const {
  listTrackedRepos,
  getReviewsForRepo,
  getReviewById,
  getRepoStats,
  getRecentReviews,
} = require('../review/reviewStore');
const logger = require('../utils/logger');

const router = express.Router();

// ─── GET /api/repos ───────────────────────────────────────────────────────────
// Returns all repos that have at least one review, with summary stats.
// Used by: Dashboard overview page

router.get('/repos', async (req, res) => {
  try {
    const repos = await listTrackedRepos();
    res.json({ repos });
  } catch (err) {
    logger.error('GET /api/repos failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// ─── GET /api/repos/:owner/:repo/reviews ─────────────────────────────────────
// Returns paginated list of reviews for a repo.
// Query params: page (default 1), limit (default 20)
// Used by: Repo page reviews list

router.get('/repos/:owner/:repo/reviews', async (req, res) => {
  const { owner, repo } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

  try {
    const result = await getReviewsForRepo(`${owner}/${repo}`, { page, limit });
    res.json(result);
  } catch (err) {
    logger.error('GET /api/repos/:owner/:repo/reviews failed', { owner, repo, error: err.message });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─── GET /api/repos/:owner/:repo/stats ───────────────────────────────────────
// Returns aggregated stats for a repo: category breakdown + severity trend.
// Query params: days (default 30) — number of days for the trend chart
// Used by: Repo page charts

router.get('/repos/:owner/:repo/stats', async (req, res) => {
  const { owner, repo } = req.params;
  const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));

  try {
    const stats = await getRepoStats(`${owner}/${repo}`, days);
    res.json(stats);
  } catch (err) {
    logger.error('GET /api/repos/:owner/:repo/stats failed', { owner, repo, error: err.message });
    res.status(500).json({ error: 'Failed to fetch repo stats' });
  }
});

// ─── GET /api/reviews/:reviewId ───────────────────────────────────────────────
// Returns a single review with all findings.
// Used by: Review drilldown page

router.get('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const review = await getReviewById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ review });
  } catch (err) {
    logger.error('GET /api/reviews/:reviewId failed', { reviewId, error: err.message });
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// ─── GET /api/recent ─────────────────────────────────────────────────────────
// Returns most recent reviews across all repos.
// Query params: limit (default 8, max 20)
// Used by: Dashboard "Recent Analysis" activity feed

router.get('/recent', async (req, res) => {
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 8));
  try {
    const reviews = await getRecentReviews(limit);
    res.json({ reviews });
  } catch (err) {
    logger.error('GET /api/recent failed', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch recent reviews' });
  }
});

module.exports = router;
