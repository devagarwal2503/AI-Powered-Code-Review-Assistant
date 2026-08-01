import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState,
  SeverityRow, SevBar, timeAgo,
  IcoRepo, IcoClock, IcoStar, IcoShield, IcoAI, IcoGitHub, IcoExternal, prUrl
} from '../components/ui.jsx';

// Stat card icons — each stat has a distinct SVG icon (ref image shows icons top-right)
function StatCard({ label, value, cls = '', iconEl, borderCls = '' }) {
  return (
    <div className={`stat-card ${borderCls}`}>
      <div className="stat-top">
        <div>
          <p className="stat-lbl">{label}</p>
          <p className={`stat-val ${cls}`}>{value}</p>
        </div>
        <div className="stat-icon">
          {iconEl}
        </div>
      </div>
    </div>
  );
}

// Activity feed item
function FeedItem({ review }) {
  const hasHigh = review.findingCounts?.high > 0;
  const total   = review.findingCounts?.total || 0;
  return (
    <Link to={`/reviews/${review._id}`} className="feed-item" id={`feed-${review._id}`}>
      <div className="feed-icon">
        <IcoAI />
      </div>
      <div className="feed-body">
        <p className="feed-title">
          {review.repoFullName} — PR #{review.pullNumber}
          {review.prTitle ? `: ${review.prTitle}` : ''}
        </p>
        <div className="feed-sub">
          <span>{timeAgo(review.createdAt)}</span>
          {total > 0 && <span>· {total} finding{total !== 1 ? 's' : ''}</span>}
          {review.reviewPosted && <span style={{ color: 'var(--sev-low)' }}>· Posted</span>}
        </div>
      </div>
      <div className="feed-right">
        {hasHigh
          ? <span className="badge badge-high">High</span>
          : (total > 0
              ? <span className="badge badge-medium">Issues</span>
              : <span className="badge badge-clean">Clean</span>
            )
        }
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [repos,   setRepos]   = useState([]);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([api.getRepos(), api.getRecent(6)])
      .then(([r, rc]) => { setRepos(r); setRecent(rc); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalReviews  = repos.reduce((s, r) => s + (r.reviewCount   || 0), 0);
  const totalFindings = repos.reduce((s, r) => s + (r.totalFindings  || 0), 0);
  const totalHigh     = repos.reduce((s, r) => s + (r.highFindings   || 0), 0);

  const IcoReviews = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--t3)' }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  const IcoWarning = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sev-high)' }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  const IcoFindings = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--t3)' }}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );

  return (
    <div className="page">
      {/* Hero — "Code Review" plain + "Dashboard" in orange gradient */}
      <div className="hero fu">
        <p className="hero-tag"><span className="hero-dot" />AI-Powered</p>
        <h1 className="hero-h1">
          Code Review<br /><span className="accent">Dashboard</span>
        </h1>
        <p className="hero-sub">
          Automated analysis across every pull request — security vulnerabilities,
          bug risks, performance issues, and architectural concerns surfaced before code ships.
        </p>
      </div>

      {/* Stats — with icons in top-right of each card */}
      <div className="stats-grid fu d1">
        <StatCard label="Repositories"  value={loading ? '–' : repos.length}   cls="brand"  iconEl={<IcoRepo />} />
        <StatCard label="Total Reviews"  value={loading ? '–' : totalReviews}               iconEl={<IcoReviews />} />
        <StatCard label="Total Findings" value={loading ? '–' : totalFindings}              iconEl={<IcoFindings />} />
        <StatCard label="High Severity"  value={loading ? '–' : totalHigh}      cls="danger" iconEl={<IcoWarning />} borderCls="danger" />
      </div>

      {/* Tracked Repos */}
      <div className="fu d2" style={{ marginBottom: '2rem' }}>
        <div className="sec-head">
          <h2 className="sec-title">Tracked Repositories</h2>
          <span className="sec-count">{repos.length} repo{repos.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && <Spinner />}
        {error   && <ErrorState message={error} />}

        {!loading && !error && repos.length === 0 && (
          <EmptyState
            icon="◇"
            title="No repositories tracked yet"
            text="Install your GitHub App on a repository and open a pull request."
          />
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="repos-grid">
            {repos.map((repo, i) => {
              const high   = repo.highFindings || 0;
              const total  = repo.totalFindings || 0;
              // approximate medium/low split from total - high
              const rest   = total - high;
              const medium = Math.ceil(rest * 0.55);
              const low    = Math.max(0, rest - medium);

              return (
                <Link
                  key={repo._id}
                  to={`/repos/${repo.owner}/${repo.repo}`}
                  className="repo-card fu"
                  style={{ animationDelay: `${0.05 * i + 0.18}s` }}
                  id={`repo-${repo._id.replace('/', '-')}`}
                >
                  <div className="repo-top">
                    <div>
                      <p className="repo-owner">{repo.owner}</p>
                      <p className="repo-name">{repo.repo}</p>
                    </div>
                    <div className="repo-grid-icon"><IcoRepo /></div>
                  </div>

                  <SevBar high={high} medium={medium} low={low} />
                  <SeverityRow counts={{ high, medium, low }} />

                  <div className="repo-foot">
                    <span className="repo-foot-item"><IcoReviews /> {repo.reviewCount} review{repo.reviewCount !== 1 ? 's' : ''}</span>
                    <span className="repo-foot-item"><IcoFindings /> {total} finding{total !== 1 ? 's' : ''}</span>
                    <span className="repo-foot-item" style={{ marginLeft: 'auto' }}><IcoClock /> {timeAgo(repo.lastReviewedAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Analysis feed */}
      {!loading && recent.length > 0 && (
        <div className="fu d3">
          <div className="sec-head">
            <h2 className="sec-title">Recent Analysis</h2>
          </div>
          <div className="feed">
            {recent.map(r => <FeedItem key={r._id} review={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
