/**
 * ScrutineerLogo — crisp inline SVG wordmark
 * Props:
 *   height  — rendered height in px (default 30)
 *   mono    — if true, renders everything in white (for dark navbars without the blue/gradient)
 */
export default function ScrutineerLogo({ height = 30, mono = false }) {
  // Keep aspect ratio: viewBox is 220 × 36
  const width = Math.round((220 / 36) * height);

  const iconColor = mono ? '#ffffff' : '#38bdf8';
  const textColor = '#f0f6ff';
  const subColor = mono ? 'rgba(255,255,255,0.55)' : '#38bdf8';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Scrutineer AI"
      role="img"
    >
      {/* ── Icon: magnifying glass with <> inside ───────────────────────── */}
      {/* Lens circle */}
      <circle cx="16" cy="16" r="11" stroke={iconColor} strokeWidth="2.5" />
      {/* Code brackets inside lens */}
      <path d="M12 13L9.5 16L12 19" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 13L22.5 16L20 19" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Handle — angular, bottom-right */}
      <line x1="24.5" y1="24.5" x2="30" y2="30" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Wordmark: "Scrutineer" ───────────────────────────────────────── */}
      <text
        x="38"
        y="23"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontSize="17"
        letterSpacing="-0.4"
        fill={textColor}
      >
        Scrutineer
      </text>

      {/* ── Sub-label: "AI" ──────────────────────────────────────────────── */}
      <text
        x="131"
        y="23"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="17"
        letterSpacing="0.5"
        fill={subColor}
      >
        AI
      </text>
    </svg>
  );
}
