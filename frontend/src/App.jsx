import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import RepoPage  from './pages/RepoPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import './index.css';

function Navbar() {
  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <a href="/" className="navbar-brand">
          <div className="brand-icon" aria-hidden="true">🤖</div>
          AI Code Review
        </a>

        <nav className="navbar-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            id="nav-dashboard"
          >
            Dashboard
          </NavLink>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            id="nav-github"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Navbar />
        <main>
          <Routes>
            <Route path="/"                      element={<Dashboard />} />
            <Route path="/repos/:owner/:repo"    element={<RepoPage />}  />
            <Route path="/reviews/:reviewId"     element={<ReviewPage />} />
            <Route path="*" element={
              <div className="page-content" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</p>
                <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
                <a href="/" style={{ display: 'block', marginTop: '1rem' }}>← Back to Dashboard</a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
