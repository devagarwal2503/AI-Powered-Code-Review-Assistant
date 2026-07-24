import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Dashboard  from './pages/Dashboard.jsx';
import RepoPage   from './pages/RepoPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import './index.css';

// SVG icons — no emoji
const IconRobot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <line x1="12" y1="7" x2="12" y2="11"/>
    <line x1="8" y1="15" x2="8" y2="17"/>
    <line x1="16" y1="15" x2="16" y2="17"/>
  </svg>
);

const IconGitHub = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

function Navbar() {
  return (
    <header className="nav" role="banner">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand" id="nav-home">
          {/* SVG logomark — gradient background, code-review icon */}
          <div className="nav-logo" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          AI Code Review
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            id="nav-dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            Dashboard
          </NavLink>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-pill"
            id="nav-github"
          >
            <IconGitHub /> GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
      <p style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-4)', letterSpacing: '-0.04em', marginBottom: '0.75rem' }}>404</p>
      <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>This page doesn't exist.</p>
      <NavLink to="/" className="gh-btn">← Back to Dashboard</NavLink>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main>
          <ScrollReset />
          <Routes>
            <Route path="/"                   element={<Dashboard />}  />
            <Route path="/repos/:owner/:repo" element={<RepoPage />}   />
            <Route path="/reviews/:reviewId"  element={<ReviewPage />} />
            <Route path="*"                   element={<NotFound />}   />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
