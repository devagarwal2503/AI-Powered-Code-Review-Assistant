import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import '../landing.css';
import ScrutineerLogo from '../components/ScrutineerLogo.jsx';

/* ── Scroll-reveal hook ──────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('revealed');
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Landing Navbar ──────────────────────────────────────────────────────── */
function LandingNav() {
  return (
    <header className="lnav">
      <div className="lnav-inner">
        <a href="/" className="lnav-logo" aria-label="Scrutineer AI home">
          <ScrutineerLogo height={28} />
        </a>
        <nav className="lnav-links" aria-label="Landing navigation">
          <a href="#how-it-works" className="lnav-link">How it works</a>
          <a href="#features"     className="lnav-link">Features</a>
          <Link to="/dashboard"   className="lnav-link">Dashboard</Link>
          <a
            href="https://github.com/devagarwal2503/Scrutineer-AI"
            target="_blank" rel="noopener noreferrer"
            className="lnav-link"
          >GitHub</a>
        </nav>
        <a
          href="https://github.com/apps/scrutineer-ai"
          target="_blank" rel="noopener noreferrer"
          className="lnav-cta"
          id="lnav-install"
        >
          Install free
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </header>
  );
}

/* ── Mock PR Review Card ─────────────────────────────────────────────────── */
function MockCard() {
  return (
    <div className="mock-card" aria-hidden="true">
      {/* Header row */}
      <div className="mock-hdr">
        <div className="mock-avatar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div className="mock-hdr-meta">
          <span className="mock-bot-name">scrutineer-ai</span>
          <span className="mock-bot-tag">[bot]</span>
          <span className="mock-hdr-verb"> commented</span>
        </div>
        <span className="mock-time">just now</span>
      </div>

      {/* File path badge */}
      <div className="mock-file">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        userService.js &nbsp;·&nbsp; Line 47
      </div>

      {/* Code diff */}
      <div className="mock-diff">
        <div className="mock-diff-line mock-del">
          <span className="mock-ln">47</span>
          <code className="mock-code">{`const q = \`SELECT * FROM users WHERE id = \${userId}\`;`}</code>
        </div>
        <div className="mock-diff-line mock-add">
          <span className="mock-ln">47</span>
          <code className="mock-code">{"db.query('SELECT * FROM users WHERE id = ?', [userId]);"}</code>
        </div>
      </div>

      {/* Finding body */}
      <div className="mock-finding">
        <div className="mock-finding-hdr">
          <span className="mock-sev">HIGH</span>
          <span className="mock-cat-pill">Security</span>
          <span className="mock-sep">·</span>
          <span className="mock-finding-name">SQL Injection Vulnerability</span>
        </div>
        <p className="mock-finding-body">
          User input is interpolated directly into the SQL query string, allowing attackers to inject arbitrary SQL code.
        </p>
      </div>

      {/* More pill */}
      <div className="mock-more">
        <span className="mock-more-dot" />
        <span className="mock-more-dot" />
        <span className="mock-more-dot" />
        <span className="mock-more-text">+25 more findings on this PR</span>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="l-hero">
      <div className="l-hero-glow" aria-hidden="true" />
      <div className="l-wrap l-hero-layout">

        {/* Left: copy */}
        <div className="l-hero-copy">
          <div className="l-chip">
            <span className="l-chip-dot" />
            GitHub App &nbsp;·&nbsp; Free to install
          </div>

          <h1 className="l-h1">
            Catch what<br />
            <span className="l-grd-text">linters miss.</span>
          </h1>

          <p className="l-hero-sub">
            Scrutineer AI reviews every pull request automatically —
            flagging security vulnerabilities, bug risks, and architectural
            issues as inline comments before a human opens the diff.
          </p>

          <div className="l-hero-btns">
            <a
              href="https://github.com/apps/scrutineer-ai"
              target="_blank" rel="noopener noreferrer"
              className="l-btn-primary"
              id="hero-install"
            >
              Install Scrutineer AI
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <Link to="/dashboard" className="l-btn-ghost" id="hero-dashboard">
              View Dashboard →
            </Link>
          </div>

          <div className="l-hero-stats">
            <div className="l-hstat">
              <span className="l-hstat-n">26</span>
              <span className="l-hstat-l">issues on first PR</span>
            </div>
            <div className="l-hstat-div" />
            <div className="l-hstat">
              <span className="l-hstat-n">5</span>
              <span className="l-hstat-l">issue categories</span>
            </div>
            <div className="l-hstat-div" />
            <div className="l-hstat">
              <span className="l-hstat-n">0</span>
              <span className="l-hstat-l">reviewer setup</span>
            </div>
          </div>
        </div>

        {/* Right: floating card */}
        <div className="l-hero-visual">
          <div className="l-hero-card-wrap">
            <MockCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ────────────────────────────────────────────────────────── */
const STEPS = [
  {
    n: '01',
    title: 'Install in one click',
    desc: 'Visit the GitHub App page and click Install. Choose which repos get covered. No server setup, no API keys — ever.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Open a pull request',
    desc: 'Work exactly as you do today. Scrutineer AI triggers automatically on every PR open and every new push — zero friction.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
        <path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Get an instant AI review',
    desc: 'Findings appear as inline review comments anchored to the exact line in Files Changed within seconds of your push.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

function HowItWorks() {
  return (
    <section className="l-section" id="how-it-works">
      <div className="l-wrap">
        <div className="l-sec-hdr reveal">
          <div className="l-sec-label">How it works</div>
          <h2 className="l-h2">From push to review<br />in under a minute.</h2>
        </div>
        <div className="l-steps">
          {STEPS.map((s, i) => (
            <div
              className="l-step reveal"
              key={s.n}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="l-step-top">
                <span className="l-step-n">{s.n}</span>
                <div className="l-step-icon">{s.icon}</div>
              </div>
              <h3 className="l-step-title">{s.title}</h3>
              <p className="l-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ────────────────────────────────────────────────────────────── */
const FEATS = [
  { icon: '🔎', title: 'Context-aware analysis',   desc: 'Fetches ±25 lines of surrounding code — AI suggestions reference real logic, not just the raw diff line.' },
  { icon: '📌', title: 'Inline PR comments',       desc: 'Findings posted as review comments anchored to the exact line in Files Changed. No separate report to open.' },
  { icon: '🧱', title: 'Structured JSON findings', desc: 'Every finding has severity, category, file, line, explanation, and a concrete suggestion — never freeform.' },
  { icon: '📈', title: 'Trend dashboard',          desc: 'Track code quality over time with per-repo charts, severity breakdowns, and paginated review history.' },
  { icon: '⚡', title: 'Zero setup for your team', desc: 'Install once on the repo. Everyone who opens a PR automatically gets an AI review — no per-user config.' },
  { icon: '🛡️', title: 'Production-grade ops',    desc: 'HMAC webhook verification, installation token caching, exponential backoff, and structured Winston logging.' },
];

function Features() {
  return (
    <section className="l-section l-section-alt" id="features">
      <div className="l-wrap">
        <div className="l-sec-hdr reveal">
          <div className="l-sec-label">Features</div>
          <h2 className="l-h2">Built for real codebases,<br />not toy examples.</h2>
        </div>
        <div className="l-feats">
          {FEATS.map((f, i) => (
            <div
              className="l-feat reveal"
              key={f.title}
              style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
            >
              <div className="l-feat-icon">{f.icon}</div>
              <h3 className="l-feat-title">{f.title}</h3>
              <p className="l-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── What It Catches ─────────────────────────────────────────────────────── */
const CATS = [
  { label: 'Security',     color: '#f87171', bg: 'rgba(248,113,113,0.07)', bd: 'rgba(248,113,113,0.20)', items: ['SQL injection', 'Hardcoded secrets', 'eval() on user input', 'Timing attacks', 'SSRF vulnerabilities'] },
  { label: 'Bug Risk',     color: '#fb923c', bg: 'rgba(251,146,60,0.07)',  bd: 'rgba(251,146,60,0.20)',  items: ['Missing await', 'Unhandled rejection', 'Type coercion pitfalls', 'Off-by-one errors', 'Race conditions'] },
  { label: 'Performance',  color: '#34d399', bg: 'rgba(52,211,153,0.07)', bd: 'rgba(52,211,153,0.20)',  items: ['N+1 queries', 'O(n²) loops', 'Synchronous I/O', 'No connection pooling', 'Missing backoff'] },
  { label: 'Architecture', color: '#c084fc', bg: 'rgba(192,132,252,0.07)',bd: 'rgba(192,132,252,0.20)', items: ['God objects', 'Tight coupling', 'Leaky abstractions', 'Missing SoC', 'Anti-patterns'] },
];

function WhatItCatches() {
  return (
    <section className="l-section">
      <div className="l-wrap">
        <div className="l-sec-hdr reveal">
          <div className="l-sec-label">Coverage</div>
          <h2 className="l-h2">Issues that linters<br />can't see.</h2>
        </div>
        <div className="l-cats">
          {CATS.map((c, i) => (
            <div
              className="l-cat reveal"
              key={c.label}
              style={{ '--cc': c.color, '--cb': c.bg, '--cbd': c.bd, transitionDelay: `${(i % 2) * 0.1}s` }}
            >
              <div className="l-cat-hdr">
                <span className="l-cat-dot" />
                <span className="l-cat-label">{c.label}</span>
              </div>
              <ul className="l-cat-list">
                {c.items.map(it => (
                  <li className="l-cat-item" key={it}>
                    <span className="l-cat-item-dot" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="l-cta">
      <div className="l-cta-glow" aria-hidden="true" />
      <div className="l-wrap l-cta-inner reveal">
        <h2 className="l-cta-h2">Ready to ship better code?</h2>
        <p className="l-cta-sub">
          Free to install. No credit card. Works on any GitHub repo in 30 seconds.
        </p>
        <div className="l-cta-btns">
          <a
            href="https://github.com/apps/scrutineer-ai"
            target="_blank" rel="noopener noreferrer"
            className="l-btn-primary l-btn-lg"
            id="cta-install"
          >
            Install Scrutineer AI — it's free
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <Link to="/dashboard" className="l-btn-ghost" id="cta-dashboard">
            Explore the live dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer className="l-footer">
      <div className="l-wrap l-footer-inner">
        <div className="l-footer-left">
          <ScrutineerLogo height={24} />
          <p className="l-footer-tagline">AI-powered code review for every PR.</p>
        </div>
        <nav className="l-footer-links" aria-label="Footer navigation">
          <Link  to="/dashboard" className="l-footer-link">Dashboard</Link>
          <a href="https://github.com/devagarwal2503/Scrutineer-AI" target="_blank" rel="noopener noreferrer" className="l-footer-link">GitHub</a>
          <a href="https://github.com/apps/scrutineer-ai"           target="_blank" rel="noopener noreferrer" className="l-footer-link">Install</a>
          <a href="https://scrutineer-ai-backend.onrender.com/health" target="_blank" rel="noopener noreferrer" className="l-footer-link">API Status</a>
        </nav>
        <p className="l-footer-copy">© 2026 Dev Agarwal · MIT License</p>
      </div>
    </footer>
  );
}

/* ── Page export ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  useScrollReveal();
  return (
    <div className="landing">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <WhatItCatches />
      <CTA />
      <LandingFooter />
    </div>
  );
}
