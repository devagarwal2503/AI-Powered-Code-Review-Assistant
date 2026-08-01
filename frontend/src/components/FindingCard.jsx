import { useState } from 'react';
import { SeverityBadge, CategoryBadge } from './ui.jsx';

/**
 * FindingCard — matches the reference design exactly:
 *
 * ┌──────────────────────────────────────────────────────┐
 * │ [● HIGH] [SECURITY]  Title text         src/x.js:2 ▼ │
 * ├──────────────────────────────────────────────────────┤
 * │ EXPLANATION                                          │
 * │ The explanation text...                              │
 * │                                                      │
 * │ SUGGESTION                                           │
 * │ ┌────────────────────────────────────────────────┐   │
 * │ │ Suggestion text or code snippet                │   │
 * │ └────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────┘
 */
export function FindingCard({ finding, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const loc = finding.line ? `${finding.file}:${finding.line}` : finding.file;

  return (
    <div className={`finding s-${finding.severity}`}>
      {/* Header row */}
      <div
        className="finding-top"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
        id={`finding-${finding._id}`}
      >
        {/* Severity + category badges — separate pills like the reference */}
        <div className="finding-badges">
          <SeverityBadge severity={finding.severity} />
          <CategoryBadge category={finding.category} />
        </div>

        <span className="finding-title">{finding.title}</span>

        {/* File location pill */}
        <span className="file-pill" title={loc}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {loc}
        </span>

        <span className={`finding-chevron${open ? ' open' : ''}`}>▼</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="finding-body">
          {/* Explanation */}
          <div>
            <p className="field-lbl">Explanation</p>
            <p className="field-text">{finding.explanation}</p>
          </div>

          {/* Suggestion */}
          {finding.suggestion && (
            <div>
              <p className="field-lbl">Suggestion</p>
              <div className="field-code">{finding.suggestion}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
