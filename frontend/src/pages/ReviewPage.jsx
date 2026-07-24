import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  Spinner, EmptyState, ErrorState, Breadcrumb,
  timeAgo, IconGitHub, IconExternalLink, prUrl
} from '../components/ui.jsx';
import { FindingCard } from '../components/FindingCard.jsx';

const SEV_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

export default function ReviewPage() {
  const { reviewId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [filter, setFilter] = useState('all');

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

  const githubLink = prUrl(review.owner, review.repo, review.pullNumber);

  return (
    <div className="page">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: review.repoFullName, href: `/repos/${review.owner}/${review.repo}` },
        { label: `PR #${review.pullNumber}` },
      ]} />

      {/* PR header card */}
      <div className="pr-card fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="pr-number">Pull Request #{review.pullNumber} — {review.repoFullName}</p>
            <h1 className="pr-title-text">{review.prTitle || 'Untitled Pull Request'}</h1>
          </div>
          {/* GitHub link — prominent CTA */}
          <a
            href={githubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="gh-btn"
            id="btn-view-on-github"
            style={{ flexShrink: 0, marginTop: '0.25rem' }}
          >
            <IconGitHub />
            View on GitHub
            <IconExternalLink />
          </a>
        </div>

        <div className="pr-attrs">
          <span className="pr-attr">
            <span className="review-sha" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', background: 'var(--bg-raised)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-3)', border: '1px solid var(--border-dim)' }}>
              {review.headSha?.slice(0, 7)}
            </span>
          </span>
          <span className="pr-attr" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
            Analyzed {timeAgo(review.analyzedAt || review.createdAt)}
          </span>
          {review.reviewPosted
            ? <span className="pr-attr" style={{ color: 'var(--sev-low)', fontSize: '0.8rem', fontWeight: 600 }}>
                ✓ Posted to GitHub
              </span>
            : <span className="pr-attr" style={{ color: 'var(--sev-med)', fontSize: '0.8rem' }}>
                ⏳ Pending post
              </span>
          }
        </div>
      </div>

      {/* AI Summary */}
      {review.summary && (
        <div className="ai-banner fade-up delay-1">
          <p className="ai-banner-label">AI Summary</p>
          <p className="ai-banner-text">{review.summary}</p>
        </div>
      )}

      {/* Severity counts row */}
      <div className="stats-row fade-up delay-2" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'High',   count: findingCounts.high   || 0, mod: 'danger' },
          { label: 'Medium', count: findingCounts.medium || 0, mod: 'warn'   },
          { label: 'Low',    count: findingCounts.low    || 0, mod: ''       },
          { label: 'Info',   count: findingCounts.info   || 0, mod: 'accent' },
        ].map(({ label, count, mod }) => (
          <div key={label} className={`stat${mod ? ` ${mod}` : ''}`}>
            <p className="stat-label">{label}</p>
            <p className={`stat-value${mod ? ` ${mod}` : ''}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Findings section */}
      <div className="section fade-up delay-3">
        <div className="section-head">
          <h2 className="section-title">Findings</h2>
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

        {findings.length === 0 ? (
          <EmptyState
            icon="✓"
            title="No findings"
            text="The AI found no significant issues in this pull request."
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="◇" title={`No ${filter} severity findings`} text="Try a different filter." />
        ) : (
          <div className="findings">
            {filtered.map((f, i) => (
              <FindingCard
                key={f._id || i}
                finding={f}
                defaultOpen={f.severity === 'high' && i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
