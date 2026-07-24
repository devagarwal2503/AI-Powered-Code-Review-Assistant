/**
 * Charts.jsx — Pure SVG / CSS charts. No chart library.
 *
 * CategoryChart: horizontal bar chart with full-width track
 * TrendChart: multi-bar SVG (stacked: high, medium, low)
 *
 * Why no library? For these specific charts, the library overhead (100-300 KB)
 * is not justified. SVG gives us full design control and is trivially themeable.
 */

const CAT_META = {
  security:     { label: 'Security',     color: '#f87171' },
  'bug-risk':   { label: 'Bug Risk',     color: '#fbbf24' },
  architecture: { label: 'Architecture', color: '#c084fc' },
  performance:  { label: 'Performance',  color: '#34d399' },
  style:        { label: 'Style',        color: '#818cf8' },
};

export function CategoryChart({ data = [] }) {
  if (!data.length) {
    return <p style={{ color: 'var(--text-4)', fontSize: '0.825rem', textAlign: 'center', padding: '2rem 0' }}>No findings yet</p>;
  }

  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="cat-bars">
      {data.map(item => {
        const meta = CAT_META[item._id] || { label: item._id, color: 'var(--accent-3)' };
        const pct = (item.count / max) * 100;
        return (
          <div key={item._id} className="cat-row">
            <span className="cat-name">{meta.label}</span>
            <div className="cat-track">
              <div
                className="cat-fill"
                style={{ width: `${pct}%`, background: meta.color }}
              />
            </div>
            <span className="cat-num">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TrendChart({ data = [] }) {
  if (!data.length) {
    return <p style={{ color: 'var(--text-4)', fontSize: '0.825rem', textAlign: 'center', padding: '2rem 0' }}>No trend data yet</p>;
  }

  const BAR_W = 56;
  const H = 120;
  const PAD = { top: 8, right: 16, bottom: 28, left: 8 };
  const chartH = H - PAD.top - PAD.bottom;
  const totalW = data.length * BAR_W + PAD.left + PAD.right;

  const maxTotal = Math.max(...data.map(d => (d.high || 0) + (d.medium || 0) + (d.low || 0)), 1);

  const bh = val => (val / maxTotal) * chartH;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${totalW} ${H}`}
        width={totalW}
        height={H}
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(r => {
          const y = PAD.top + chartH * (1 - r);
          return (
            <line
              key={r}
              x1={PAD.left} y1={y}
              x2={totalW - PAD.right} y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          );
        })}

        {data.map((day, i) => {
          const x = PAD.left + i * BAR_W + 6;
          const bw = BAR_W - 12;
          const highH = bh(day.high   || 0);
          const medH  = bh(day.medium || 0);
          const lowH  = bh(day.low    || 0);
          const base  = PAD.top + chartH;
          const label = day._id ? day._id.slice(5) : ''; // "MM-DD"

          return (
            <g key={day._id || i}>
              {/* Background hover area */}
              <rect x={PAD.left + i * BAR_W} y={PAD.top} width={BAR_W} height={chartH}
                fill="transparent" />

              {/* Stacked bars */}
              {lowH > 0 && (
                <rect x={x} y={base - highH - medH - lowH} width={bw} height={lowH}
                  fill="#34d399" opacity={0.8} rx={2} />
              )}
              {medH > 0 && (
                <rect x={x} y={base - highH - medH} width={bw} height={medH}
                  fill="#fbbf24" opacity={0.8} rx={2} />
              )}
              {highH > 0 && (
                <rect x={x} y={base - highH} width={bw} height={highH}
                  fill="#f87171" opacity={0.85} rx={2} />
              )}

              <text
                x={x + bw / 2} y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(75,98,128,0.9)"
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD.left} y1={PAD.top + chartH}
          x2={totalW - PAD.right} y2={PAD.top + chartH}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.625rem' }}>
        {[['#f87171', 'High'], ['#fbbf24', 'Medium'], ['#34d399', 'Low']].map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
