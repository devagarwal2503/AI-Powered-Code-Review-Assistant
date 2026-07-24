import { useState } from 'react';
import { SeverityBadge } from './ui.jsx';

const CAT_COLORS = {
  security:     '#f87171',
  'bug-risk':   '#fbbf24',
  architecture: '#c084fc',
  performance:  '#34d399',
  style:        '#818cf8',
};

export function FindingCard({ finding, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const catColor = CAT_COLORS[finding.category] || 'var(--accent-3)';
  const loc = finding.line ? `${finding.file}:${finding.line}` : finding.file;

  return (
    <div className={`finding sev-${finding.severity}`}>
      <div
        className="finding-top"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        id={`finding-${finding._id}`}
      >
        <SeverityBadge severity={finding.severity} />

        <span
          style={{
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--r-sm)',
            fontSize: '0.67rem',
            fontWeight: 700,
            background: `${catColor}15`,
            color: catColor,
            border: `1px solid ${catColor}30`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {finding.category}
        </span>

        <span className="finding-title">{finding.title}</span>

        <span className="finding-loc">{loc}</span>

        <span className={`finding-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="finding-body">
          <div>
            <p className="finding-field-label">Explanation</p>
            <p className="finding-explanation">{finding.explanation}</p>
          </div>
          {finding.suggestion && (
            <div>
              <p className="finding-field-label">Suggestion</p>
              <div className="finding-suggestion">{finding.suggestion}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
