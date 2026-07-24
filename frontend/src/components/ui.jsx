// Shared primitive components — clean, no emoji icons

export function Spinner() {
  return <div className="spinner-box"><div className="spinner" aria-label="Loading…" /></div>;
}

export function EmptyState({ title, text, icon = '○' }) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true" style={{ fontFamily: 'monospace' }}>{icon}</span>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="empty">
      <span className="empty-icon">!</span>
      <p className="empty-title">Something went wrong</p>
      <p className="empty-text">{message}</p>
    </div>
  );
}

// Severity dot ● inline with text
const SEV_DOT = { high: '#f87171', medium: '#fbbf24', low: '#34d399', info: '#818cf8' };

export function SeverityBadge({ severity }) {
  return (
    <span className={`badge badge-${severity}`}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEV_DOT[severity], display: 'inline-block', flexShrink: 0 }} />
      {severity}
    </span>
  );
}

export function SeverityCounts({ counts = {} }) {
  const hasAny = counts.high || counts.medium || counts.low || counts.info;
  if (!hasAny) return <span className="badge badge-clean">✓ Clean</span>;
  return (
    <div className="sev-counts">
      {counts.high   > 0 && <SeverityBadge severity="high"   />}
      {counts.medium > 0 && <SeverityBadge severity="medium" />}
      {counts.low    > 0 && <SeverityBadge severity="low"    />}
      {counts.info   > 0 && <SeverityBadge severity="info"   />}
    </div>
  );
}

/**
 * SeverityMiniBar — horizontal distribution bar shown on repo cards
 * Shows proportion of high / medium / low as colored segments
 */
export function SeverityMiniBar({ high = 0, medium = 0, low = 0 }) {
  const total = high + medium + low;
  if (total === 0) {
    return (
      <div className="sev-bar">
        <div className="sev-bar-seg none" style={{ flex: 1 }} />
      </div>
    );
  }
  return (
    <div className="sev-bar">
      {high   > 0 && <div className="sev-bar-seg high"   style={{ flex: high   }} />}
      {medium > 0 && <div className="sev-bar-seg med"    style={{ flex: medium }} />}
      {low    > 0 && <div className="sev-bar-seg low"    style={{ flex: low    }} />}
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="crumb" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && <span className="crumb-sep">›</span>}
          {item.href
            ? <a href={item.href}>{item.label}</a>
            : <span className="crumb-current">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** GitHub external link icon */
export const IconExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

/** GitHub mark SVG */
export const IconGitHub = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export function prUrl(owner, repo, pullNumber) {
  return `https://github.com/${owner}/${repo}/pull/${pullNumber}`;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
