import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState,
  SeverityCounts, Breadcrumb, timeAgo,
  IconGitHub, IconExternalLink, prUrl
} from '../components/ui.jsx';
import { CategoryChart, TrendChart } from '../components/Charts.jsx';

export default function RepoPage() {
  const { owner, repo } = useParams();

  const [reviews, setReviews]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getReviews(owner, repo, page),
      api.getRepoStats(owner, repo),
    ])
      .then(([rev, st]) => {
        setReviews(rev.reviews || []);
        setPagination({ total: rev.total, pages: rev.pages });
        setStats(st);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo, page]);

  const repoFull = `${owner}/${repo}`;

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: repoFull },
      ]} />

      {/* Repo hero */}
      <div className="hero fade-up">
        <p className="hero-label"><span className="hero-label-dot" /> Repository</p>
        <h1 className="hero-title">{repo}</h1>
        <p className="hero-sub" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
          {repoFull}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-row fade-up delay-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat accent">
            <p className="stat-label">Total Reviews</p>
            <p className="stat-value accent">{stats.summary?.totalReviews || 0}</p>
          </div>
          <div className="stat">
            <p className="stat-label">Total Findings</p>
            <p className="stat-value">{stats.summary?.totalFindings || 0}</p>
          </div>
          <div className="stat danger">
            <p className="stat-label">High Severity</p>
            <p className="stat-value danger">{stats.summary?.totalHigh || 0}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="two-col fade-up delay-2">
          <div className="card">
            <p className="card-title">Findings by Category</p>
            <CategoryChart data={stats.categoryBreakdown} />
          </div>
          <div className="card">
            <p className="card-title">Severity Trend — 30 Days</p>
            <TrendChart data={stats.severityTrend} />
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="section fade-up delay-3">
        <div className="section-head">
          <h2 className="section-title">Pull Request Reviews</h2>
          {pagination.total > 0 && (
            <span className="section-count">{pagination.total} total</span>
          )}
        </div>

        {loading && <Spinner />}
        {error   && <ErrorState message={error} />}

        {!loading && !error && reviews.length === 0 && (
          <EmptyState
            icon="◇"
            title="No reviews yet"
            text="Open a pull request on this repository to trigger an AI analysis."
          />
        )}

        {!loading && !error && reviews.length > 0 && (
          <>
            <div className="review-list">
              {reviews.map(review => (
                <div
                  key={review._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}
                >
                  <Link
                    to={`/reviews/${review._id}`}
                    className="review-row"
                    id={`review-${review._id}`}
                    style={{ flex: 1 }}
                  >
                    <span className="review-pr-num">#{review.pullNumber}</span>
                    <span className="review-title">{review.prTitle || 'Untitled PR'}</span>
                    <SeverityCounts counts={review.findingCounts} />
                    <span className="review-sha">{review.headSha?.slice(0, 7)}</span>
                    <span className="review-time">{timeAgo(review.createdAt)}</span>
                  </Link>

                  {/* Direct GitHub PR link */}
                  <a
                    href={prUrl(owner, repo, review.pullNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-btn gh-btn-sm"
                    title="View PR on GitHub"
                    id={`gh-link-${review._id}`}
                  >
                    <IconGitHub /> View PR <IconExternalLink />
                  </a>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    id={`page-${p}`}
                    className={`pg-btn${p === page ? ' active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
