import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState, Breadcrumb,
  timeAgo, IcoGitHub, IcoExternal, prUrl, IcoAI, IcoClock
} from '../components/ui.jsx';
import { FindingCard } from '../components/FindingCard.jsx';

const SEV_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

export default function ReviewPage() {
  const { reviewId } = useParams();
  const [review,  setReview]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    api.getReview(reviewId)
      .then(setReview)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [reviewId]);

  if (loading) return <div className="page"><Spinner /></div>;
  if (error)   return <div className="page"><ErrorState message={error} /></div>;
  if (!review) return <div className="page"><EmptyState icon="◇" title="Review not found" /></div>;

  const { findings = [], findingCounts = {} } = review;

  const filtered = (filter === 'all' ? [...findings] : findings.filter(f => f.severity === filter))
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9));

  const FILTERS = [
    { key: 'all',    label: `All (${findings.length})` },
    { key: 'high',   label: `High (${findingCounts.high   || 0})` },
    { key: 'medium', label: `Medium (${findingCounts.medium || 0})` },
    { key: 'low',    label: `Low (${findingCounts.low    || 0})` },
    { key: 'info',   label: `Info (${findingCounts.info   || 0})` },
  ];

  const link = prUrl(review.owner, review.repo, review.pullNumber);

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: review.repoFullName, href: `/repos/${review.owner}/${review.repo}` },
        { label: `PR #${review.pullNumber}` },
      ]} />

      {/* PR header card — matches reference: title prominent, metadata row, View on GitHub right-aligned */}
      <div className="pr-card fu">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.875rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="pr-num-label">Pull Request #{review.pullNumber} · {review.repoFullName}</p>
            <h1 className="pr-title-h1">{review.prTitle || 'Untitled Pull Request'}</h1>
          </div>
          {/* Prominent teal View on GitHub button — matches reference */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="gh-btn"
            id="btn-view-github"
            style={{ flexShrink: 0, marginTop: '0.125rem' }}
          >
            <IcoGitHub /> View on GitHub <IcoExternal />
          </a>
        </div>

        <div className="pr-meta-row">
          <span className="pr-meta-item sha-pill">{review.headSha?.slice(0, 7)}</span>
          <span className="pr-meta-item" style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>
            <IcoClock /> Analyzed {timeAgo(review.analyzedAt || review.createdAt)}
          </span>
          {review.reviewPosted
            ? <span className="pr-meta-item" style={{ color: 'var(--sev-low)', fontWeight: 600, fontSize: '0.8rem' }}>✓ Posted to GitHub</span>
            : <span className="pr-meta-item" style={{ color: 'var(--sev-med)', fontSize: '0.8rem' }}>⏳ Pending post</span>
          }
        </div>
      </div>

      {/* AI Summary */}
      {review.summary && (
        <div className="ai-banner fu d1">
          <p className="ai-banner-lbl">
            <IcoAI /> AI Summary
          </p>
          <p className="ai-banner-txt">{review.summary}</p>
        </div>
      )}

      {/* Finding counts */}
      <div className="stats-grid fu d2" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'High',   count: findingCounts.high   || 0, cls: 'danger', border: 'danger' },
          { label: 'Medium', count: findingCounts.medium || 0, cls: 'warn',   border: 'warn'   },
          { label: 'Low',    count: findingCounts.low    || 0, cls: ''                          },
          { label: 'Info',   count: findingCounts.info   || 0, cls: 'brand'                    },
        ].map(({ label, count, cls, border }) => (
          <div key={label} className={`stat-card ${border || ''}`}>
            <p className="stat-lbl">{label}</p>
            <p className={`stat-val ${cls}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Findings list */}
      <div className="fu d3">
        <div className="sec-head">
          <h2 className="sec-title">Findings</h2>
          {findings.length > 0 && (
            <div className="filter-tabs">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  id={`filter-${f.key}`}
                  onClick={() => setFilter(f.key)}
                  className={`filter-tab${filter === f.key ? ' active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {findings.length === 0
          ? <EmptyState icon="✓" title="No findings" text="The AI found no significant issues in this pull request." />
          : filtered.length === 0
            ? <EmptyState icon="◇" title={`No ${filter} findings`} text="Try a different filter." />
            : (
              <div className="findings">
                {filtered.map((f, i) => (
                  <FindingCard key={f._id || i} finding={f} defaultOpen={f.severity === 'high' && i === 0} />
                ))}
              </div>
            )
        }
      </div>
    </div>
  );
}
