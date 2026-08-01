/**
 * api.js — Fetch wrapper for backend REST API calls
 *
 * BASE URL resolution:
 * - Development: '/api' — Vite's server.proxy forwards this to localhost:3000.
 *   No CORS issue because the browser sees it as same-origin.
 * - Production: VITE_API_URL (set in Vercel env vars to the full Render URL,
 *   e.g. https://ai-code-review-backend.onrender.com)
 *   Vite bakes this value into the bundle at build time (import.meta.env.*).
 *
 * Why VITE_ prefix?
 * Vite only exposes env vars prefixed with VITE_ to client-side code.
 * Unprefixed vars stay server-side only (build-time Node context).
 */

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

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
