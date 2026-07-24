import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { Spinner, EmptyState, ErrorState, SeverityCounts, timeAgo } from '../components/ui.jsx';

export default function Dashboard() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getRepos()
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate stats across all repos
  const totalReviews  = repos.reduce((s, r) => s + (r.reviewCount  || 0), 0);
  const totalFindings = repos.reduce((s, r) => s + (r.totalFindings || 0), 0);
  const totalHigh     = repos.reduce((s, r) => s + (r.highFindings  || 0), 0);

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="page-hero animate-in">
        <p className="page-hero-eyebrow">Overview</p>
        <h1 className="page-hero-title">Code Review Dashboard</h1>
        <p className="page-hero-sub">
          AI-generated analysis for every pull request — security vulnerabilities, bug risks, and architectural issues.
        </p>
      </div>

      {/* Stats row */}
      <div className="stats-grid animate-in animate-in-delay-1">
        <div className="stat-card">
          <p className="stat-label">Repositories</p>
          <p className="stat-value accent">{loading ? '–' : repos.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Reviews</p>
          <p className="stat-value">{loading ? '–' : totalReviews}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Findings</p>
          <p className="stat-value">{loading ? '–' : totalFindings}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High Severity</p>
          <p className="stat-value high">{loading ? '–' : totalHigh}</p>
        </div>
      </div>

      {/* Repos */}
      <div className="section-header animate-in animate-in-delay-2">
        <h2 className="section-title">Tracked Repositories</h2>
        <span className="section-subtitle">{repos.length} repo{repos.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !error && repos.length === 0 && (
        <EmptyState
          icon="🤖"
          title="No repositories yet"
          text="Open a pull request on a repo where your GitHub App is installed. The AI review will appear here automatically."
        />
      )}

      {!loading && !error && repos.length > 0 && (
        <div className="repos-grid animate-in animate-in-delay-3">
          {repos.map(repo => (
            <Link
              key={repo._id}
              to={`/repos/${repo.owner}/${repo.repo}`}
              className="repo-card"
              id={`repo-${repo._id.replace('/', '-')}`}
            >
              <div className="repo-card-header">
                <div className="repo-icon">📦</div>
                <div>
                  <p className="repo-owner">{repo.owner}</p>
                  <p className="repo-name">{repo.repo}</p>
                </div>
              </div>

              <SeverityCounts counts={{ high: repo.highFindings, total: repo.totalFindings }} />

              <div className="repo-meta">
                <span>📋 {repo.reviewCount} review{repo.reviewCount !== 1 ? 's' : ''}</span>
                <span>🔍 {repo.totalFindings} finding{repo.totalFindings !== 1 ? 's' : ''}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {repo.lastReviewedAt ? timeAgo(repo.lastReviewedAt) : '—'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
