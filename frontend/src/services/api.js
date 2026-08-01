/**
 * api.js — Fetch wrapper for backend REST API calls
 *
 * All requests go to /api/* which Vite proxies to the Express backend.
 * Centralizing API calls here means if an endpoint changes, we fix it
 * in one place rather than hunting through component files.
 */

const BASE = '/api';

async function request(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Returns list of all repos with review stats */
  getRepos: () => request('/repos').then(d => d.repos),

  /** Returns paginated reviews for a repo */
  getReviews: (owner, repo, page = 1) =>
    request(`/repos/${owner}/${repo}/reviews?page=${page}&limit=20`),

  /** Returns category breakdown + severity trend for a repo */
  getRepoStats: (owner, repo, days = 30) =>
    request(`/repos/${owner}/${repo}/stats?days=${days}`),

  /** Returns a single review with all findings */
  getReview: (reviewId) =>
    request(`/reviews/${reviewId}`).then(d => d.review),

  /** Returns most recent reviews across all repos (activity feed) */
  getRecent: (limit = 8) =>
    request(`/recent?limit=${limit}`).then(d => d.reviews),
};
