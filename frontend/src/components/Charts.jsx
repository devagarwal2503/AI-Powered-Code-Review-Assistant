/**
 * CategoryChart.jsx — Horizontal bar chart for finding categories
 *
 * Pure CSS/DOM — no chart library dependency.
 * Bars animate in with a CSS transition on mount.
 *
 * Why no Chart.js / Recharts?
 * For a simple horizontal bar chart, adding a 200KB+ library is overkill.
 * Pure CSS bars are faster to load, easier to theme, and demonstrate
 * understanding of layout — which is actually more impressive.
 */

const CATEGORY_META = {
  security:     { label: 'Security',     color: '#f85149' },
  'bug-risk':   { label: 'Bug Risk',     color: '#d29922' },
  architecture: { label: 'Architecture', color: '#a371f7' },
  performance:  { label: 'Performance',  color: '#3fb950' },
  style:        { label: 'Style',        color: '#58a6ff' },
};

export function CategoryChart({ data = [] }) {
  if (!data.length) return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
      No findings yet
    </p>
  );

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="category-bars">
      {data.map((item) => {
        const meta = CATEGORY_META[item._id] || { label: item._id, color: 'var(--accent)' };
        const pct = (item.count / max) * 100;
        return (
          <div key={item._id} className="category-row">
            <span className="category-label">{meta.label}</span>
            <div className="category-bar-track">
              <div
                className="category-bar-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <span className="category-count">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * TrendChart.jsx — SVG bar chart for daily finding counts
 *
 * Stacked bars: high (red) on bottom, medium (orange) above, low (green) top.
 * x-axis: dates. y-axis: finding count.
 */
export function TrendChart({ data = [] }) {
  if (!data.length) return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
      No trend data yet
    </p>
  );

  const W = 60; // bar column width
  const H = 140; // chart height
  const PADDING = { top: 10, right: 20, bottom: 32, left: 8 };
  const chartH = H - PADDING.top - PADDING.bottom;
  const totalW = data.length * W + PADDING.left + PADDING.right;

  const maxTotal = Math.max(...data.map(d => (d.high || 0) + (d.medium || 0) + (d.low || 0)), 1);

  function barHeight(val) {
    return (val / maxTotal) * chartH;
  }

  return (
    <div className="trend-svg-wrapper">
      <svg
        viewBox={`0 0 ${totalW} ${H}`}
        width={totalW}
        height={H}
        style={{ display: 'block', maxWidth: '100%', overflow: 'visible' }}
      >
        {data.map((day, i) => {
          const x = PADDING.left + i * W + 8;
          const barW = W - 16;
          const highH  = barHeight(day.high   || 0);
          const medH   = barHeight(day.medium  || 0);
          const lowH   = barHeight(day.low    || 0);
          const totalH = highH + medH + lowH;
          const baseY  = PADDING.top + chartH;

          const label = day._id ? day._id.slice(5) : ''; // MM-DD from YYYY-MM-DD

          return (
            <g key={day._id || i}>
              {/* low (top) */}
              {lowH > 0 && (
                <rect x={x} y={baseY - totalH} width={barW} height={lowH}
                  fill="#3fb950" opacity={0.85} rx={2} />
              )}
              {/* medium */}
              {medH > 0 && (
                <rect x={x} y={baseY - highH - medH} width={barW} height={medH}
                  fill="#d29922" opacity={0.85} rx={2} />
              )}
              {/* high (bottom) */}
              {highH > 0 && (
                <rect x={x} y={baseY - highH} width={barW} height={highH}
                  fill="#f85149" opacity={0.85} rx={2} />
              )}
              {/* date label */}
              <text
                x={x + barW / 2} y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#484f58"
              >
                {label}
              </text>
            </g>
          );
        })}
        {/* baseline */}
        <line
          x1={PADDING.left} y1={PADDING.top + chartH}
          x2={totalW - PADDING.right} y2={PADDING.top + chartH}
          stroke="#30363d" strokeWidth="1"
        />
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        {[['#f85149','High'],['#d29922','Medium'],['#3fb950','Low']].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
