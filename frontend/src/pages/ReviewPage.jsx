import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState, SeverityBadge, Breadcrumb, timeAgo
} from '../components/ui.jsx';
import { FindingCard } from '../components/FindingCard.jsx';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

export default function ReviewPage() {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | severity

  useEffect(() => {
    api.getReview(reviewId)
      .then(setReview)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading) return <div className="page-content"><Spinner /></div>;
  if (error)   return <div className="page-content"><ErrorState message={error} /></div>;
  if (!review) return <div className="page-content"><EmptyState icon="🔍" title="Review not found" /></div>;

  const { findingCounts = {}, findings = [] } = review;

  const filteredFindings = (filter === 'all'
    ? [...findings]
    : findings.filter(f => f.severity === filter)
  ).sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  const FILTERS = [
    { key: 'all',    label: `All  (${findings.length})` },
    { key: 'high',   label: `🔴 High (${findingCounts.high || 0})` },
    { key: 'medium', label: `🟠 Medium (${findingCounts.medium || 0})` },
    { key: 'low',    label: `🟡 Low (${findingCounts.low || 0})` },
    { key: 'info',   label: `🔵 Info (${findingCounts.info || 0})` },
  ];

  return (
    <div className="page-content">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: review.repoFullName, href: `/repos/${review.owner}/${review.repo}` },
        { label: `PR #${review.pullNumber}` },
      ]} />

      {/* PR header */}
      <div className="pr-header animate-in">
        <h1 className="pr-title">
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>#{review.pullNumber} — </span>
          {review.prTitle || 'Untitled PR'}
        </h1>
        <div className="pr-meta">
          <span>📦 {review.repoFullName}</span>
          <span className="review-sha font-mono">{review.headSha?.slice(0, 7)}</span>
          <span>🕐 {timeAgo(review.analyzedAt || review.createdAt)}</span>
          {review.reviewPosted
            ? <span style={{ color: 'var(--low)' }}>✅ Posted to GitHub</span>
            : <span style={{ color: 'var(--medium)' }}>⏳ Not yet posted</span>}
        </div>
      </div>

      {/* AI Summary */}
      {review.summary && (
        <div className="pr-summary-banner animate-in animate-in-delay-1">
          <p className="pr-summary-label">🤖 AI Summary</p>
          <p>{review.summary}</p>
        </div>
      )}

      {/* Finding counts row */}
      <div className="stats-grid animate-in animate-in-delay-2" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'High',   count: findingCounts.high   || 0, cls: 'high'   },
          { label: 'Medium', count: findingCounts.medium || 0, cls: 'medium' },
          { label: 'Low',    count: findingCounts.low    || 0, cls: ''       },
          { label: 'Info',   count: findingCounts.info   || 0, cls: 'accent' },
        ].map(({ label, count, cls }) => (
          <div key={label} className="stat-card">
            <p className="stat-label">{label}</p>
            <p className={`stat-value ${cls}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Findings */}
      <div className="section-header animate-in animate-in-delay-3">
        <h2 className="section-title">Findings</h2>

        {/* Severity filter tabs */}
        {findings.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                id={`filter-${f.key}`}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: filter === f.key ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                  color: filter === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {findings.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No findings"
          text="The AI found no significant issues in this pull request."
        />
      ) : filteredFindings.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={`No ${filter} severity findings`}
          text="Try a different filter."
        />
      ) : (
        <div className="findings-list animate-in animate-in-delay-4">
          {filteredFindings.map((finding, i) => (
            <FindingCard
              key={finding._id || i}
              finding={finding}
              defaultOpen={finding.severity === 'high' && i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
