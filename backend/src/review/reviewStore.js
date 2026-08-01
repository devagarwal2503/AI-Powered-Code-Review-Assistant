/**
 * reviewStore.js — MongoDB persistence layer for reviews and findings
 *
 * Responsibility: save reviews, prevent duplicates, retrieve for dashboard.
 * This module owns all database reads/writes for reviews. No other module
 * should import the Review model directly.
 *
 * Idempotency:
 * GitHub can deliver the same webhook twice (retries on timeout).
 * We use findOneAndUpdate with upsert to handle this: if a review for
 * this exact PR + headSha already exists, we update it rather than
 * creating a duplicate. This is safe because the analysis result for
 * the same commit SHA is deterministic.
 */

const Review = require('../models/Review');
const logger = require('../utils/logger');

/**
 * Saves or updates a PR review in MongoDB.
 * Uses upsert on (repoFullName + pullNumber + headSha) as the natural key.
 *
 * @param {Object} params
 * @param {string} params.owner
 * @param {string} params.repo
 * @param {number} params.pullNumber
 * @param {string} params.prTitle
 * @param {string} params.headSha
 * @param {Object} params.analysis - { findings: Array, summary: string }
 * @returns {Promise<Review>} The saved/updated Mongoose document
 */
async function saveReview({ owner, repo, pullNumber, prTitle, headSha, analysis }) {
  const repoFullName = `${owner}/${repo}`;
  const findingCounts = Review.computeCounts(analysis.findings);

  const reviewData = {
    owner,
    repo,
    repoFullName,
    pullNumber,
    prTitle,
    headSha,
    findings: analysis.findings,
    summary: analysis.summary,
    findingCounts,
    analyzedAt: new Date(),
  };

  // Upsert: insert if not exists, update if exists
  // { new: true } returns the updated document instead of the pre-update one
  const review = await Review.findOneAndUpdate(
    { repoFullName, pullNumber, headSha }, // find by natural key
    { $set: reviewData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info('Review saved to MongoDB', {
    reviewId: review._id,
    repoFullName,
    pullNumber,
    headSha: headSha.substring(0, 7), // short SHA for readability
    totalFindings: findingCounts.total,
    bySeverity: { high: findingCounts.high, medium: findingCounts.medium, low: findingCounts.low },
  });

  return review;
}

/**
 * Marks a review as successfully posted to GitHub.
 *
 * @param {string} reviewId - MongoDB _id of the review
 * @param {number} githubReviewId - The review ID returned by GitHub API
 */
async function markReviewPosted(reviewId, githubReviewId) {
  await Review.findByIdAndUpdate(reviewId, {
    $set: {
      reviewPosted: true,
      githubReviewId,
      reviewPostedAt: new Date(),
      reviewPostError: null,
    },
  });
}

/**
 * Marks a review as having failed to post to GitHub, storing the error.
 *
 * @param {string} reviewId - MongoDB _id of the review
 * @param {string} errorMessage
 */
async function markReviewPostFailed(reviewId, errorMessage) {
  await Review.findByIdAndUpdate(reviewId, {
    $set: {
      reviewPosted: false,
      reviewPostError: errorMessage,
    },
  });
}

/**
 * Gets paginated reviews for a repo, newest first.
 * Used by the Phase 4 dashboard API.
 *
 * @param {string} repoFullName - "owner/repo"
 * @param {number} page - 1-indexed page number
 * @param {number} limit - results per page
 */
async function getReviewsForRepo(repoFullName, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ repoFullName })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-findings') // exclude findings array for the list view (fetch on drilldown)
      .lean(),
    Review.countDocuments({ repoFullName }),
  ]);

  return { reviews, total, page, limit, pages: Math.ceil(total / limit) };
}

/**
 * Gets a single review with all findings.
 * Used by the Phase 4 PR drilldown view.
 *
 * @param {string} reviewId - MongoDB _id
 */
async function getReviewById(reviewId) {
  return Review.findById(reviewId).lean();
}

/**
 * Gets aggregated stats for a repo.
 * Used by the Phase 4 dashboard trend charts.
 * Returns: findings by category, findings by severity, reviews per day.
 *
 * @param {string} repoFullName
 * @param {number} daysBack - number of days of history to include
 */
async function getRepoStats(repoFullName, daysBack = 30) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const [categoryBreakdown, severityTrend, recentCounts] = await Promise.all([
    // Findings by category (all time for this repo)
    Review.aggregate([
      { $match: { repoFullName } },
      { $unwind: '$findings' },
      { $group: { _id: '$findings.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Daily finding counts for the last N days (for trend chart)
    Review.aggregate([
      { $match: { repoFullName, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          high: { $sum: '$findingCounts.high' },
          medium: { $sum: '$findingCounts.medium' },
          low: { $sum: '$findingCounts.low' },
          reviews: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Quick summary counts
    Review.aggregate([
      { $match: { repoFullName } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          totalFindings: { $sum: '$findingCounts.total' },
          totalHigh: { $sum: '$findingCounts.high' },
        },
      },
    ]),
  ]);

  return {
    categoryBreakdown,
    severityTrend,
    summary: recentCounts[0] || { totalReviews: 0, totalFindings: 0, totalHigh: 0 },
  };
}

/**
 * Lists all tracked repos with their latest review date and total review count.
 * Used by the Phase 4 dashboard overview page.
 */
async function listTrackedRepos() {
  return Review.aggregate([
    {
      $group: {
        _id: '$repoFullName',
        owner: { $first: '$owner' },
        repo: { $first: '$repo' },
        reviewCount: { $sum: 1 },
        lastReviewedAt: { $max: '$createdAt' },
        totalFindings: { $sum: '$findingCounts.total' },
        highFindings: { $sum: '$findingCounts.high' },
      },
    },
    { $sort: { lastReviewedAt: -1 } },
  ]);
}

/**
 * Gets the most recent reviews across ALL repos.
 * Used by the dashboard "Recent Analysis" activity feed.
 *
 * @param {number} limit - max number to return
 */
async function getRecentReviews(limit = 8) {
  return Review.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('owner repo repoFullName pullNumber prTitle headSha findingCounts reviewPosted analyzedAt createdAt')
    .lean();
}

module.exports = {
  saveReview,
  markReviewPosted,
  markReviewPostFailed,
  getReviewsForRepo,
  getReviewById,
  getRepoStats,
  listTrackedRepos,
  getRecentReviews,
};
