// Shared small components

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" aria-label="Loading…" />
    </div>
  );
}

export function EmptyState({ icon = '📭', title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">⚠️</span>
      <p className="empty-title">Something went wrong</p>
      <p className="empty-text">{message}</p>
    </div>
  );
}

const SEVERITY_EMOJI = { high: '🔴', medium: '🟠', low: '🟡', info: '🔵' };

export function SeverityBadge({ severity }) {
  return (
    <span className={`badge badge-${severity}`}>
      {SEVERITY_EMOJI[severity]} {severity}
    </span>
  );
}

export function SeverityCounts({ counts = {} }) {
  return (
    <div className="severity-counts">
      {counts.high > 0   && <SeverityBadge severity="high"   />}
      {counts.medium > 0 && <SeverityBadge severity="medium" />}
      {counts.low > 0    && <SeverityBadge severity="low"    />}
      {counts.info > 0   && <SeverityBadge severity="info"   />}
      {(counts.total === 0 || !counts.total) && (
        <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
          ✅ Clean
        </span>
      )}
    </div>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {i > 0 && <span className="breadcrumb-sep">/</span>}
          {item.href
            ? <a href={item.href}>{item.label}</a>
            : <span className="breadcrumb-current">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function timeAgo(dateStr) {
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
