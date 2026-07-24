import { useState } from 'react';
import { SeverityBadge } from './ui.jsx';

const CATEGORY_COLORS = {
  security:     '#f85149',
  'bug-risk':   '#d29922',
  architecture: '#a371f7',
  performance:  '#3fb950',
  style:        '#58a6ff',
};

export function FindingCard({ finding, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`finding-card severity-${finding.severity}`}>
      <div
        id={`finding-${finding._id}`}
        className="finding-header"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <SeverityBadge severity={finding.severity} />

        <span className="finding-title">{finding.title}</span>

        <span className="finding-file">
          {finding.file}:{finding.line || '?'}
        </span>

        <span
          className={`badge`}
          style={{
            background: `${CATEGORY_COLORS[finding.category]}18`,
            color: CATEGORY_COLORS[finding.category],
            flexShrink: 0,
          }}
        >
          {finding.category}
        </span>

        <span className={`finding-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="finding-body">
          <div>
            <p className="finding-section-label">Explanation</p>
            <p className="finding-explanation">{finding.explanation}</p>
          </div>
          {finding.suggestion && (
            <div>
              <p className="finding-section-label">Suggestion</p>
              <div className="finding-suggestion">{finding.suggestion}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
