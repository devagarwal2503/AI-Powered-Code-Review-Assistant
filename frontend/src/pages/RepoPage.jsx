import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { Spinner, EmptyState, ErrorState, SeverityCounts, Breadcrumb, timeAgo } from '../components/ui.jsx';
import { CategoryChart, TrendChart } from '../components/Charts.jsx';

export default function RepoPage() {
  const { owner, repo } = useParams();
  const repoFull = `${owner}/${repo}`;

  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getReviews(owner, repo, page),
      api.getRepoStats(owner, repo),
    ])
      .then(([reviewData, statsData]) => {
        setReviews(reviewData.reviews || []);
        setPagination({ total: reviewData.total, pages: reviewData.pages });
        setStats(statsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo, page]);

  return (
    <div className="page-content">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: repoFull },
      ]} />

      <div className="page-hero animate-in">
        <p className="page-hero-eyebrow">Repository</p>
        <h1 className="page-hero-title">{repo}</h1>
        <p className="page-hero-sub" style={{ fontFamily: 'var(--font-mono)' }}>{repoFull}</p>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="stats-grid animate-in animate-in-delay-1">
          <div className="stat-card">
            <p className="stat-label">Total Reviews</p>
            <p className="stat-value accent">{stats.summary?.totalReviews || 0}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Total Findings</p>
            <p className="stat-value">{stats.summary?.totalFindings || 0}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">High Severity</p>
            <p className="stat-value high">{stats.summary?.totalHigh || 0}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="two-col animate-in animate-in-delay-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Findings by Category</span>
            </div>
            <CategoryChart data={stats.categoryBreakdown} />
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Severity Trend (30 days)</span>
            </div>
            <TrendChart data={stats.severityTrend} />
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="section-header animate-in animate-in-delay-3">
        <h2 className="section-title">Pull Request Reviews</h2>
        {pagination.total > 0 && (
          <span className="section-subtitle">{pagination.total} total</span>
        )}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !error && reviews.length === 0 && (
        <EmptyState
          icon="🔍"
          title="No reviews yet"
          text="Open a pull request on this repository to trigger an AI review."
        />
      )}

      {!loading && !error && reviews.length > 0 && (
        <>
          <div className="review-list animate-in animate-in-delay-4">
            {reviews.map(review => (
              <Link
                key={review._id}
                to={`/reviews/${review._id}`}
                className="review-item"
                id={`review-${review._id}`}
              >
                <div className="review-item-info">
                  <p className="review-pr-title">
                    #{review.pullNumber} — {review.prTitle || 'Untitled PR'}
                  </p>
                  <div className="review-meta">
                    <span className="review-sha">{review.headSha?.slice(0, 7)}</span>
                    <span>{timeAgo(review.createdAt)}</span>
                    {review.reviewPosted
                      ? <span style={{ color: 'var(--low)' }}>✓ Posted to GitHub</span>
                      : <span style={{ color: 'var(--text-muted)' }}>⏳ Pending</span>}
                  </div>
                </div>
                <SeverityCounts counts={review.findingCounts} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  id={`page-btn-${p}`}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: p === page ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    color: p === page ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
