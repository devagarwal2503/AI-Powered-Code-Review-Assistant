/**
 * Review.js — Mongoose schema for a PR review and its findings
 *
 * Schema design decisions:
 *
 * 1. Embedded findings (not a separate collection):
 *    Findings are always read/written together with their review.
 *    Embedding avoids an extra JOIN-equivalent ($lookup) on every query.
 *    MongoDB's $unwind on the embedded array handles Phase 4 aggregations
 *    (e.g., count high-severity findings per repo over time).
 *    Tradeoff: 16MB document size limit — fine for text findings, never a concern.
 *
 * 2. repoFullName field (owner/repo string):
 *    Dashboard queries filter by repo constantly. Storing "owner/repo" as a
 *    single indexed field is simpler than a compound index on {owner, repo}.
 *
 * 3. findingCounts denormalized at write time:
 *    Computing count-by-severity from the array on every dashboard read is
 *    wasteful. We compute it once when saving and store it separately.
 *    Tradeoff: must keep in sync — acceptable since we only write reviews once.
 *
 * 4. reviewPosted / githubReviewId:
 *    Tracks whether we successfully posted to GitHub. If the post fails,
 *    we still have the analysis in MongoDB and can retry later (future work).
 */

const mongoose = require('mongoose');

// ─── Finding (embedded sub-document) ─────────────────────────────────────────

const findingSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    line: { type: Number, default: 0 },
    severity: {
      type: String,
      enum: ['high', 'medium', 'low', 'info'],
      required: true,
    },
    category: {
      type: String,
      enum: ['security', 'bug-risk', 'architecture', 'performance', 'style'],
      required: true,
    },
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    suggestion: { type: String, default: '' },

    // Was this finding posted as an inline GitHub comment?
    // (findings on lines not in the diff are folded into review body instead)
    postedInline: { type: Boolean, default: false },
  },
  { _id: true } // findings need IDs for Phase 4 drilldown
);

// ─── Review (top-level document) ─────────────────────────────────────────────

const reviewSchema = new mongoose.Schema(
  {
    // Repository
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    repoFullName: { type: String, required: true, index: true }, // "owner/repo"

    // Pull request
    pullNumber: { type: Number, required: true },
    prTitle: { type: String, default: '' },
    headSha: { type: String, required: true },

    // AI analysis results
    findings: [findingSchema],
    summary: { type: String, default: '' },

    // Denormalized counts (computed once at write time for fast dashboard reads)
    findingCounts: {
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },

    // GitHub review posting status
    reviewPosted: { type: Boolean, default: false },
    githubReviewId: { type: Number, default: null },
    reviewPostedAt: { type: Date, default: null },
    reviewPostError: { type: String, default: null }, // error message if posting failed

    // When analysis ran
    analyzedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Indexes for dashboard queries ───────────────────────────────────────────

// Most common query: "get reviews for this repo, newest first"
reviewSchema.index({ repoFullName: 1, createdAt: -1 });

// "get reviews for this specific PR" (for dedup check)
reviewSchema.index({ repoFullName: 1, pullNumber: 1, headSha: 1 });

// ─── Static helper methods ────────────────────────────────────────────────────

/**
 * Compute denormalized finding counts from a findings array.
 * Call this before saving a review.
 */
reviewSchema.statics.computeCounts = function (findings) {
  const counts = { high: 0, medium: 0, low: 0, info: 0, total: 0 };
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity]++;
    counts.total++;
  }
  return counts;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
