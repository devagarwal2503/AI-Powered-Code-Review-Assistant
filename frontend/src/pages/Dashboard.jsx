import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState,
  SeverityCounts, SeverityMiniBar, timeAgo
} from '../components/ui.jsx';

// SVG icons
const IconRepo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)' }}>
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
  </svg>
);

const IconReviews = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconFindings = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function Dashboard() {
  const [repos, setRepos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.getRepos()
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalReviews  = repos.reduce((s, r) => s + (r.reviewCount   || 0), 0);
  const totalFindings = repos.reduce((s, r) => s + (r.totalFindings  || 0), 0);
  const totalHigh     = repos.reduce((s, r) => s + (r.highFindings   || 0), 0);

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero fade-up">
        <p className="hero-label">
          <span className="hero-label-dot" />
          AI-Powered
        </p>
        <h1 className="hero-title">
          Code Review <span>Dashboard</span>
        </h1>
        <p className="hero-sub">
          Automated analysis across every pull request — security vulnerabilities, bug risks,
          performance issues, and architectural concerns surfaced before code ships.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row fade-up delay-1">
        <div className="stat accent">
          <p className="stat-label">Repositories</p>
          <p className="stat-value accent">{loading ? '–' : repos.length}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Total Reviews</p>
          <p className="stat-value">{loading ? '–' : totalReviews}</p>
        </div>
        <div className="stat">
          <p className="stat-label">Total Findings</p>
          <p className="stat-value">{loading ? '–' : totalFindings}</p>
        </div>
        <div className="stat danger">
          <p className="stat-label">High Severity</p>
          <p className="stat-value danger">{loading ? '–' : totalHigh}</p>
        </div>
      </div>

      {/* Repos section */}
      <div className="section fade-up delay-2">
        <div className="section-head">
          <h2 className="section-title">Tracked Repositories</h2>
          <span className="section-count">{repos.length} repo{repos.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && <Spinner />}
        {error   && <ErrorState message={error} />}

        {!loading && !error && repos.length === 0 && (
          <EmptyState
            icon="◇"
            title="No repositories tracked yet"
            text="Install your GitHub App on a repository and open a pull request. The AI review will appear here automatically."
          />
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="repos-grid">
            {repos.map((repo, i) => {
              // Count total to compute bar proportions
              const high   = repo.highFindings || 0;
              const total  = repo.totalFindings || 0;
              const medium = Math.max(0, total - high - Math.floor(total * 0.3));
              const low    = Math.max(0, total - high - medium);

              return (
                <Link
                  key={repo._id}
                  to={`/repos/${repo.owner}/${repo.repo}`}
                  className="repo-card fade-up"
                  style={{ animationDelay: `${0.06 * i + 0.2}s` }}
                  id={`repo-${repo._id.replace('/', '-')}`}
                >
                  <div className="repo-header">
                    <div className="repo-info">
                      <p className="repo-owner">{repo.owner}</p>
                      <p className="repo-name">{repo.repo}</p>
                    </div>
                    <div className="repo-mark">
                      <IconRepo />
                    </div>
                  </div>

                  <SeverityMiniBar high={high} medium={medium} low={low} />

                  <SeverityCounts counts={{ high, medium, low }} />

                  <div className="repo-footer">
                    <span className="repo-meta-item">
                      <IconReviews /> {repo.reviewCount} review{repo.reviewCount !== 1 ? 's' : ''}
                    </span>
                    <span className="repo-meta-item">
                      <IconFindings /> {total} finding{total !== 1 ? 's' : ''}
                    </span>
                    <span className="repo-meta-item" style={{ marginLeft: 'auto' }}>
                      <IconClock /> {timeAgo(repo.lastReviewedAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
