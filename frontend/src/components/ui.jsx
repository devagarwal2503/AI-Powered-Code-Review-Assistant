// Shared UI primitives

export function Spinner() {
  return <div className="spin-box"><div className="spinner" /></div>;
}

export function EmptyState({ title, text, icon = '○' }) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="empty">
      <span className="empty-icon" style={{ color: 'var(--sev-high)' }}>!</span>
      <p className="empty-title">Something went wrong</p>
      <p className="empty-text">{message}</p>
    </div>
  );
}

// ── Severity badge ──────────────────────────────────────────────────────────
const DOTS = { high: 'var(--sev-high)', medium: 'var(--sev-med)', low: 'var(--sev-low)', info: 'var(--sev-info)' };

export function SeverityBadge({ severity }) {
  return (
    <span className={`badge badge-${severity}`}>
      <span className="badge-dot" style={{ background: DOTS[severity] }} />
      {severity}
    </span>
  );
}

export function CategoryBadge({ category }) {
  const CAT = {
    security:     { label: 'Security',     color: 'var(--cat-security)' },
    'bug-risk':   { label: 'Bug Risk',     color: 'var(--cat-bug-risk)' },
    architecture: { label: 'Architecture', color: 'var(--cat-architecture)' },
    performance:  { label: 'Performance',  color: 'var(--cat-performance)' },
    style:        { label: 'Style',        color: 'var(--cat-style)' },
  };
  const meta = CAT[category] || { label: category, color: 'var(--t3)' };
  return (
    <span
      className="badge"
      style={{
        background: `${meta.color}14`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
      }}
    >
      {meta.label}
    </span>
  );
}

export function SeverityRow({ counts = {} }) {
  if (!counts.high && !counts.medium && !counts.low && !counts.info) {
    return <span className="badge badge-clean">✓ Clean</span>;
  }
  return (
    <div className="sev-row">
      {counts.high   > 0 && <SeverityBadge severity="high"   />}
      {counts.medium > 0 && <SeverityBadge severity="medium" />}
      {counts.low    > 0 && <SeverityBadge severity="low"    />}
      {counts.info   > 0 && <SeverityBadge severity="info"   />}
    </div>
  );
}

// Proportional severity mini bar
export function SevBar({ high = 0, medium = 0, low = 0 }) {
  const tot = high + medium + low;
  if (tot === 0) return <div className="sev-bar"><div className="sev-bar-empty" /></div>;
  return (
    <div className="sev-bar">
      {high   > 0 && <div className="sev-bar-seg h" style={{ flex: high   }} />}
      {medium > 0 && <div className="sev-bar-seg m" style={{ flex: medium }} />}
      {low    > 0 && <div className="sev-bar-seg l" style={{ flex: low    }} />}
    </div>
  );
}

// Breadcrumb
export function Breadcrumb({ items }) {
  return (
    <nav className="crumb" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {i > 0 && <span className="crumb-sep">›</span>}
          {item.href
            ? <a href={item.href}>{item.label}</a>
            : <span className="crumb-cur">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ── SVG icons ───────────────────────────────────────────────────────────────
export const IcoGitHub = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export const IcoExternal = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

export const IcoRepo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--t3)' }}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

export const IcoStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sev-info)' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export const IcoShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--t3)' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export const IcoClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export const IcoAI = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sev-info)' }}>
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
);

// Helper
export function prUrl(owner, repo, pullNumber) {
  return `https://github.com/${owner}/${repo}/pull/${pullNumber}`;
}

export function timeAgo(d) {
  if (!d) return '—';
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}
