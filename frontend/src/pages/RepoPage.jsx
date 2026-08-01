import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState, SeverityRow, Breadcrumb,
  timeAgo, IcoGitHub, IcoExternal, prUrl, IcoAI, IcoClock
} from '../components/ui.jsx';
import { CategoryChart, TrendChart } from '../components/Charts.jsx';

export default function RepoPage() {
  const { owner, repo } = useParams();

  const [reviews, setReviews]     = useState([]);
  const [stats,   setStats]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);
  const [page,    setPage]        = useState(1);
  const [pages,   setPages]       = useState(1);
  const [total,   setTotal]       = useState(0);

  useEffect(() => {
    setLoading(true); setError(null);
    Promise.all([api.getReviews(owner, repo, page), api.getRepoStats(owner, repo)])
      .then(([rv, st]) => {
        setReviews(rv.reviews || []);
        setPages(rv.pages || 1); setTotal(rv.total || 0);
        setStats(st);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo, page]);

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: `${owner}/${repo}` }]} />

      <div className="hero fu">
        <p className="hero-tag"><span className="hero-dot" />Repository</p>
        <h1 className="hero-h1">{repo}</h1>
        <p className="hero-sub" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.84rem' }}>
          {owner}/{repo}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid fu d1" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { label: 'Total Reviews',  val: stats.summary?.totalReviews  || 0, cls: 'brand'  },
            { label: 'Total Findings', val: stats.summary?.totalFindings || 0, cls: ''       },
            { label: 'High Severity',  val: stats.summary?.totalHigh     || 0, cls: 'danger', border: 'danger' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.border || ''}`}>
              <p className="stat-lbl">{s.label}</p>
              <p className={`stat-val ${s.cls}`}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="two-col fu d2">
          <div className="card"><p className="card-title">Findings by Category</p><CategoryChart data={stats.categoryBreakdown} /></div>
          <div className="card"><p className="card-title">Severity Trend — 30 Days</p><TrendChart data={stats.severityTrend} /></div>
        </div>
      )}

      {/* Reviews list */}
      <div className="fu d3">
        <div className="sec-head">
          <h2 className="sec-title">Pull Request Reviews</h2>
          {total > 0 && <span className="sec-count">{total} total</span>}
        </div>

        {loading && <Spinner />}
        {error   && <ErrorState message={error} />}

        {!loading && !error && reviews.length === 0 && (
          <EmptyState icon="◇" title="No reviews yet" text="Open a pull request on this repository." />
        )}

        {!loading && !error && reviews.length > 0 && (
          <>
            <div className="review-list">
              {reviews.map(review => (
                <div key={review._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Link
                    to={`/reviews/${review._id}`}
                    className="review-row"
                    id={`review-${review._id}`}
                    style={{ flex: 1 }}
                  >
                    <span className="review-pr-num">#{review.pullNumber}</span>
                    <span className="review-title">{review.prTitle || 'Untitled PR'}</span>
                    <SeverityRow counts={review.findingCounts} />
                    <span className="sha-pill">{review.headSha?.slice(0, 7)}</span>
                    <span className="time-label">{timeAgo(review.createdAt)}</span>
                  </Link>

                  {/* GitHub PR link — prominent per the reference */}
                  <a
                    href={prUrl(owner, repo, review.pullNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-btn gh-btn-sm"
                    id={`gh-${review._id}`}
                    title="View on GitHub"
                  >
                    <IcoGitHub /> View PR <IcoExternal />
                  </a>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="pagination">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} id={`pg-${p}`} className={`pg-btn${p === page ? ' on' : ''}`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
