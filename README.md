# 🤖 AI-Powered Code Review Assistant

> A production-grade tool that listens to GitHub Pull Requests, performs context-aware AI analysis, posts structured review comments directly on the PR, and tracks code-quality trends over time through a live dashboard.

[![CI](https://github.com/YOUR_USERNAME/ai-code-review-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ai-code-review-assistant/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## 🚀 Live Demo

| Service | URL | Status |
|---|---|---|
| Dashboard (Vercel) | _Deploy in Phase 5_ | 🏗️ Built, deploying soon |
| Backend API (Render) | _Deploy in Phase 5_ | 🏗️ Built, deploying soon |

> **Note:** The backend is hosted on Render's free tier. First load may take ~30 seconds to wake up — subsequent requests are fast.

---

## 🧩 The Problem This Solves

Manual code review is expensive, inconsistent, and often misses security or architectural issues under time pressure. Existing linting tools catch syntax/style but not context-sensitive problems like:

- SQL injection risks in a specific query pattern
- An architectural anti-pattern introduced across multiple files in the same PR
- A subtle race condition in async code

This tool bridges the gap: it doesn't replace human reviewers, it gives them a pre-review pass that surfaces high-priority issues before a human even opens the diff.

---

## ✨ Key Features

- **GitHub App integration** — installs on any repo, triggers on `pull_request` events via webhooks
- **Context-aware analysis** — fetches surrounding file context, not just the raw diff, so AI suggestions are specific and accurate
- **Structured findings** — AI returns JSON with `severity`, `category`, `file`, `line`, `explanation`, and `suggestion` — not freeform prose
- **PR review comments** — posts findings as inline review comments anchored to specific lines in the Files Changed tab
- **Trend dashboard** — React frontend showing issue counts by category/severity over time, per-repo metrics, and per-PR drilldown
- **Production-grade** — rate limit handling, exponential backoff, structured logging (Winston), environment-based config, CI/CD via GitHub Actions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub                                   │
│  ┌─────────────┐    pull_request    ┌──────────────────────┐   │
│  │  Developer  │ ──── event ──────▶ │   GitHub App         │   │
│  │  opens PR   │                    │   (Webhook trigger)  │   │
│  └─────────────┘                    └──────────┬───────────┘   │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │ POST /webhook
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js + Express)                 │
│                                                                 │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐  │
│  │  Webhook     │   │  GitHub API   │   │  Analysis        │  │
│  │  Handler     │──▶│  Client       │──▶│  Orchestrator    │  │
│  │  (verify +  │   │  (fetch diff  │   │  (chunk, context,│  │
│  │   enqueue)  │   │   + context)  │   │   prompt, parse) │  │
│  └──────────────┘   └───────────────┘   └────────┬─────────┘  │
│                                                   │            │
│  ┌──────────────────────────────┐                 │            │
│  │  OpenAI API (gpt-4o-mini)   │◀────────────────┘            │
│  │  Structured JSON output      │                              │
│  └──────────────┬───────────────┘                              │
│                 │ findings[]                                    │
│                 ▼                                              │
│  ┌──────────────────────┐   ┌────────────────────────────┐   │
│  │  GitHub Review       │   │  MongoDB                   │   │
│  │  Poster              │   │  (Reviews + Findings store) │   │
│  │  (inline PR comments)│   └────────────────────────────┘   │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (/api/*)
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Dashboard (React + Vite)                       │
│  • Repo overview cards         • PR drilldown (findings table) │
│  • Trend line charts           • Category/severity breakdown   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | Node.js 18 + Express | Production-familiar, async-first |
| Database | MongoDB Atlas (free tier) | Flexible schema for findings, good aggregation support for trends |
| Frontend | React + Vite | Fast dev experience, no overhead |
| AI | OpenAI `gpt-4o-mini` (dev), `gpt-4o` (benchmark) | Structured JSON output, cost-effective |
| GitHub Integration | GitHub App + manual webhook handler | Full control over auth flow, no framework magic |
| Logging | Winston | Structured JSON logs, production-ready |
| CI/CD | GitHub Actions | Native GitHub integration |
| Hosting | Render (backend, free tier) + Vercel (frontend, free tier) | Zero-cost, resume-linkable live URLs |

---

## 📁 Project Structure

```
ai-code-review-assistant/
├── backend/
│   ├── src/
│   │   ├── github/
│   │   │   ├── auth.js           # JWT signing + installation token caching
│   │   │   ├── api.js            # GitHub REST API calls (fetch PR files, post review)
│   │   │   └── webhookVerifier.js # HMAC-SHA256 signature check
│   │   ├── analysis/
│   │   │   ├── analysisOrchestrator.js  # Coordinates the full analysis pipeline
│   │   │   ├── diffChunker.js           # Splits large diffs into token-safe chunks
│   │   │   ├── contextFetcher.js        # Fetches ±25 lines of surrounding context
│   │   │   ├── promptBuilder.js         # Constructs the OpenAI system+user prompt
│   │   │   └── openaiClient.js          # Lazy-init OpenAI client with retry logic
│   │   ├── review/
│   │   │   ├── reviewPoster.js   # Posts findings as GitHub PR review comments
│   │   │   └── reviewStore.js    # MongoDB read/write for reviews and findings
│   │   ├── models/
│   │   │   ├── Review.js         # Mongoose schema (embedded findings, denorm counts)
│   │   │   └── db.js             # MongoDB connection with structured logging
│   │   ├── routes/
│   │   │   ├── webhook.js        # PR event handler + in-memory job queue
│   │   │   ├── api.js            # REST API for dashboard (repos, reviews, stats)
│   │   │   └── health.js         # Health check endpoint
│   │   └── utils/
│   │       ├── config.js         # Env var validation + typed config object
│   │       ├── logger.js         # Winston structured JSON logger
│   │       └── queue.js          # Serial in-memory job queue
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Overview: repo cards, global stats
│   │   │   ├── RepoPage.jsx      # Per-repo: charts + paginated review list
│   │   │   └── ReviewPage.jsx    # PR drilldown: findings with filter tabs
│   │   ├── components/
│   │   │   ├── FindingCard.jsx   # Expandable accordion per finding
│   │   │   ├── Charts.jsx        # Pure SVG TrendChart + CSS CategoryChart
│   │   │   └── ui.jsx            # Shared: Spinner, Badge, Breadcrumb, icons
│   │   ├── services/
│   │   │   └── api.js            # Fetch wrapper for all backend endpoints
│   │   ├── App.jsx               # BrowserRouter + Navbar + route definitions
│   │   └── index.css             # Full design system (tokens, layout, components)
│   ├── vite.config.js            # Dev proxy: /api → localhost:3000
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml                # Coming in Phase 5
├── .env.example
├── README.md
└── LICENSE
```

---

## ⚙️ Setup & Running Locally

### Prerequisites

- Node.js 18+
- A GitHub account (to create and install the GitHub App)
- An OpenAI API key
- [ngrok](https://ngrok.com/) (for local webhook testing in Phase 1)

---

### 1. MongoDB Atlas — Free Cluster Setup

> M0 is permanently free. No credit card required.

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and sign up (Google login works)
2. Click **"Build a Cluster"** → select **M0 Free** tier → pick any region → name it anything → **Create**
3. While it provisions (~2 min), go to **Database Access** → **Add New Database User**
   - Username: anything (e.g. `appuser`)
   - Password: click **"Autogenerate Secure Password"** → **Copy** it somewhere safe
   - Role: **"Read and write to any database"** → **Add User**
4. Go to **Network Access** → **Add IP Address** → click **"Allow Access From Anywhere"** → **Confirm**
   *(We'll restrict this to Render's IPs in Phase 5)*
5. Go to **Database** → **Connect** → **Drivers** → Driver: **Node.js**
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://appuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with the password you copied in step 3
   - Add a database name before the `?` — use `ai_code_review`:
     ```
     mongodb+srv://appuser:YOURPASSWORD@cluster0.xxxxx.mongodb.net/ai_code_review?retryWrites=true&w=majority
     ```
   - This full string is your `MONGODB_URI`

---

### 2. Environment Variables

**Important:** The `.env` file holds your real secrets. It is listed in `.gitignore` and will **never** be committed to git. The `.env.example` file (which contains no real values) is what gets committed.

```bash
# In the backend/ directory:
cp .env.example .env
```

Then open `backend/.env` and set `MONGODB_URI` to the connection string from step 1 above.

```env
# backend/.env  ← this file is gitignored, never commit it
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

MONGODB_URI=mongodb+srv://appuser:YOURPASSWORD@cluster0.xxxxx.mongodb.net/ai_code_review?retryWrites=true&w=majority

# Leave these blank until Phase 1
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_WEBHOOK_SECRET=

# Leave blank until Phase 2
OPENAI_API_KEY=
```

> **Security rule:** Never paste a connection string (or any secret) into a terminal command or share it in chat. It belongs only inside `.env`.


```bash
cd backend
npm install
npm run dev
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Benchmark Results

> Will be populated in Phase 6 — running the tool against 15–20 historical PRs from real open-source repos and comparing AI findings against actual human reviewer comments.

| Metric | Result |
|---|---|
| PRs analyzed | _TBD_ |
| Repos used | _TBD_ |
| Overlap with human reviewer comments | _TBD_ |
| Additional issues flagged (not in human review) | _TBD_ |
| Estimated precision (manual spot-check) | _TBD_ |

---

## 📅 Development Log

> This section is updated at the end of each phase. Each entry links to the relevant commit(s).

| Phase | What Was Built | Status | Date |
|---|---|---|---|
| **Phase 0** — Foundations | Project skeleton, GitHub App registration, MongoDB Atlas setup, Express boilerplate, Vite React boilerplate | ✅ Complete | Jul 2026 |
| **Phase 1** — Webhook Integration | Webhook signature verification, GitHub App JWT auth, PR diff fetcher, event queue | ✅ Complete | Jul 2026 |
| **Phase 2** — AI Analysis | Diff chunker, context fetcher, prompt builder, OpenAI structured output, analysis orchestrator | ✅ Complete | Jul 2026 |
| **Phase 3** — Post & Store | GitHub PR review comment poster, MongoDB persistence layer | ✅ Complete | Jul 2026 |
| **Phase 4** — Dashboard | React dashboard, REST API endpoints, pure-SVG charts, PR drilldown, "View on GitHub" links, full design system | ✅ Complete | Jul 2026 |
| **Phase 5** — CI/CD & Deploy | GitHub Actions CI (lint + build), Render backend deploy, Vercel frontend deploy, CORS production config, RSA private key via env var, end-to-end live test (26 findings on first PR) | ✅ Complete | Aug 2026 |
| **Phase 6** — Benchmark | 15–20 PR analysis, overlap metrics, resume bullets | ⏳ Upcoming | — |

---

## 🧠 Concepts Learned (Learning Log)

> Documenting the "why" behind each technical decision — useful for interview prep.

| Concept | Phase | Key Insight |
|---|---|---|
| GitHub App vs. PAT vs. OAuth App | Phase 0 | A GitHub App is an independent identity (not tied to your personal account). It uses a private key + JWT to authenticate, generates short-lived scoped tokens per repo installation. PATs are tied to a user account and don't expire unless revoked — dangerous for automation. |
| HMAC-SHA256 webhook signature verification | Phase 1 | GitHub signs every webhook payload with your secret using HMAC-SHA256 and sends the result in `X-Hub-Signature-256`. You recompute it independently and compare with `crypto.timingSafeEqual()` — not `===` — to prevent timing attacks where response time leaks how many characters matched. |
| JWT → Installation Access Token flow | Phase 1 | You sign a short-lived JWT (10 min) with your App's RSA private key. Exchange it with GitHub for an Installation Token (1 hr, scoped to one repo). Cache the Installation Token — regenerating it on every webhook wastes an API call. |
| Context window budgeting for LLMs | Phase 2 | LLMs have a hard token limit. We budget 50k tokens per chunk (1 token ≈ 4 chars) with a 25% safety margin. Priority order: diff itself → ±25 lines of surrounding context → rest of file skipped. Chunking lets us handle PRs with many changed files without hitting the limit. |
| OpenAI structured output (JSON mode) | Phase 2 | `response_format: { type: "json_object" }` guarantees the model returns valid parseable JSON — no markdown fences, no preamble. Without it, the model wraps JSON in ` ```json ``` ` blocks and `JSON.parse()` crashes. You must still say "return JSON" somewhere in the prompt (OpenAI requirement), but the format is guaranteed. |
| GitHub PR Review API vs. PR Comments API | Phase 3 | Three separate GitHub APIs look similar but behave differently. A PR Review bundles all inline comments into one atomic submission — if any comment references a line not in the diff, the entire request fails with 422. Solution: parse the unified diff patch before submitting to build a set of visible line numbers, then split findings into inline comments (visible lines) vs. review body text (non-visible lines). |
| MongoDB aggregation pipelines | Phase 4 | `$unwind` deconstructs an embedded array into one document per element, enabling `$group` to aggregate across findings from multiple reviews. We use this to build the category breakdown chart (`$unwind findings → $group by findings.category → $sum: 1`). Denormalizing `findingCounts` at write time (instead of computing on every read) avoids re-running `$unwind` on dashboard load — a trade-off: data duplication vs. read performance. At our scale, the cache is always correct because reviews are written once and never edited. |
| Vite dev proxy vs. CORS headers | Phase 4 | When the frontend (`:5173`) calls the backend (`:3000`), the browser's same-origin policy blocks the request unless the backend sends CORS headers. Two solutions: (1) add `cors()` middleware to Express, or (2) configure Vite's `server.proxy` to route `/api/*` to `:3000`. Vite proxy is better in development — the request appears same-origin to the browser, no preflight `OPTIONS` request is made, and you don't need to keep the frontend URL in backend config. In production (Vercel → Render), real CORS headers are needed and already configured. |
| SVG charts vs. chart library | Phase 4 | For this dashboard's two charts (horizontal bar + stacked bar), adding Chart.js or Recharts (100-300 KB minified) is unjustified. Pure SVG gives full design control, zero bundle cost, and is trivially themeable with CSS variables. The trade-off: manual axis/scaling calculations. Decision rule: use a library when you need 5+ chart types, interaction (zoom/brush), or real-time streaming. For 2 simple charts in a portfolio project, roll your own. |
| GitHub Actions CI/CD | Phase 5 | A CI workflow has two jobs running in parallel on `ubuntu-latest`. Job isolation means backend and frontend can fail independently — a frontend build error doesn't block a backend syntax check. `actions/setup-node@v4` with `cache: 'npm'` caches the npm cache dir based on `package-lock.json` hash, so cold installs only happen when dependencies change. `node --check` is the fastest backend validation: it parses every file for syntax errors without executing them, catching obvious bugs without needing a running database. |
| RSA private key as environment variable | Phase 5 | PaaS platforms (Render, Railway, Fly.io) use ephemeral filesystems — any file you upload is gone on the next deploy or restart. The GitHub App JWT requires the RSA private key (.pem file). Solution: store the full PEM content (including `-----BEGIN RSA PRIVATE KEY-----` header/footer and all newlines) as a string environment variable. Some platforms escape newlines as `\n` — detect and replace them with real newlines before passing to `jwt.sign()`. In code: `key.replace(/\\n/g, '\n')`. |
| PaaS cold start on free tier | Phase 5 | Render's free tier spins down a service after 15 minutes of inactivity. The next incoming request wakes it up, but the startup sequence (Node boot → dotenv → MongoDB connect) adds ~25–35 seconds of latency before the first response. This doesn't affect webhook delivery — GitHub retries failed webhooks for up to 3 days. It only affects dashboard API calls on first load. Fix: Render's paid tier ($7/mo) keeps the service always-on; or use a free external pinger (UptimeRobot) to hit `/health` every 14 minutes. |
| Vite build-time environment variables | Phase 5 | Vite only exposes env vars prefixed with `VITE_` to client-side JavaScript (`import.meta.env.VITE_*`). Unprefixed vars are available during the build process (Node.js) but are NOT bundled into the output — accessing them in the browser returns `undefined`. The value is baked into the bundle at build time, not at runtime. Consequence: if `VITE_API_URL` changes on Vercel, you must trigger a redeploy to pick up the new value. It is NOT read dynamically from the server on each page load. |

---

## 🐛 Challenges & How We Solved Them

> Real problems hit during development — documented for learning and to show engineering judgment, not just happy-path coding.

### Phase 0: MongoDB connection string run as a terminal command
**What happened:** The Atlas connection string (`mongodb+srv://user:pass@host/...`) was accidentally pasted into the terminal as a command instead of into the `.env` file. PowerShell threw a `CommandNotFoundException`.

**Root cause:** Confusion between "where does this value go" — the connection string is a *value for a config file*, not a command.

**Fix:** Created the `.env` file with the `MONGODB_URI=` key already present, so the user only needs to paste after the `=`. Added a clear security rule to the README: *never paste secrets into a terminal or chat*.

**Lesson:** Make the "pit of success" obvious. Pre-creating `.env` with placeholder keys means the correct action (fill in the value after `=`) is the path of least resistance.

---

### Phase 0: MongoDB Atlas IP whitelist blocking connection
**What happened:** Server started but immediately logged `"querySrv ECONNREFUSED _mongodb._tcp.cluster0..."` and exited.

**Root cause:** MongoDB Atlas clusters deny all connections by default. The cluster's Network Access list had no entries, so DNS SRV resolution for the cluster hostname was refused at the network level.

**Fix:** Added `0.0.0.0/0` (allow all IPs) to Atlas Network Access for development. Will restrict to Render's IP range in Phase 5.

**Lesson:** `ECONNREFUSED` on a `_mongodb._tcp.*` hostname is almost always an Atlas IP whitelist issue, not a code bug. Recognizing infrastructure errors vs. application errors saves significant debugging time.

---

### Phase 0: MongoDB connected to `test` database instead of `ai_code_review`
**What happened:** Logs showed `"db":"test"` instead of `"db":"ai_code_review"`. Data would have been written to the wrong database.

**Root cause:** The MongoDB connection string was missing the database name. Format requires: `...mongodb.net/<dbname>?...`. Without `<dbname>`, MongoDB defaults to `test`.

**Fix:** Added `ai_code_review` to the URI immediately before the `?`: `...mongodb.net/ai_code_review?ssl=true...`

**Lesson:** Always verify the connected database name in your startup log. Add it explicitly to your structured log output so it's visible on every start.

---

### Phase 2: OpenAI SDK crashed entire server on startup with missing API key
**What happened:** Server crashed at startup with a stack trace pointing to `openaiClient.js:40` — the line `new OpenAI({ apiKey: ... })`. Error message mentioned `workloadIdentity`, `adminAPIKey` (fragments of the SDK's error for missing key).

**Root cause:** The OpenAI client was initialized at **module load time** (top-level `const openai = new OpenAI({...})`). This code runs when the module is first `require()`d, before any webhook fires. If the API key is missing or env vars haven't loaded yet, the SDK throws immediately — crashing the whole server before it can even serve requests.

**Fix:** Switched to **lazy initialization** — the client is created on first use inside a `getOpenAIClient()` function. If the key is missing, the error surfaces only when a PR is analyzed (with a clear error message), not at startup.

```javascript
// Before (bad): throws at module load time
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// After (good): throws at call time with a clear message
let _openai = null;
function getOpenAIClient() {
  if (!_openai) {
    if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    _openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return _openai;
}
```

**Lesson:** Never initialize third-party clients at module level if their constructor can throw. Use lazy initialization so startup failures are isolated to the feature that needs them, not the entire server.

---

### Phase 2: AI returned 0 findings — is this a bug?
**What happened:** First live analysis returned `"findingCount":0` and `"summary":"No significant issues found"`. Initial reaction: is the prompt wrong? Is the model not working?

**Root cause:** Not a bug. The PR contained only a `README.md` and `hello.html` change — documentation and a trivial HTML file. There are genuinely no code-level issues to flag. The prompt explicitly instructs the model to skip non-issues.

**Validation:** The model's response is *correct calibration*. If it had hallucinated findings on a README change, that would be the problem. Zero findings on non-code changes = the severity calibration and "skip these" instructions are working.

**Lesson:** Test AI output with *known-good* changes first (expect 0 findings), then test with *deliberately flawed* code (expect findings). Both are needed to validate that the system is calibrated, not just that it produces output.

---

### Phase 4: "The first design looks like AI slop"
**What happened:** After building the full dashboard, the user's reaction was direct: *"The UI is not up to mark — it is like AI slop design."* The specific complaints: generic colors, emoji used as icons, no visual identity, timid typography.

**Root cause:** The v1 design used GitHub's exact color palette (`#0d1117`, `#161b22`) — which is a recognizable GitHub clone, not an original product. Emoji icons (`📦 🔍 📋`) are inconsistently rendered across OS/browser and look out of place on a technical dark-mode dashboard.

**Fix:** Complete visual redesign from scratch:
- **Color identity:** Deep navy (`#040812`) with an indigo→violet gradient brand accent (`#6366f1` → `#8b5cf6`). Not GitHub blue, not generic teal — a distinctive personality.
- **Icons:** SVG-only. The logo mark is a `<>` code-bracket SVG with a gradient fill. Severity indicators are colored dots, not emoji circles.
- **Typography:** 800-weight hero titles, `-0.04em` tracking on stat numbers, tabular-nums for dashboards.
- **Depth:** Three background levels, glowing top borders on stat cards matched to severity color, subtle radial gradient behind the hero section.
- **Severity mini-bar:** 4px proportional bar on repo cards showing high/medium/low distribution at a glance — more information density without more words.

**Lesson:** Design systems need a deliberate identity — not just a color swap from an existing product. The question to ask first is: *if someone saw a screenshot of this UI with no labels, would they recognize it as something distinct, or assume it's a GitHub UI component?* The answer determines whether you're designing or copying.

---

### Phase 4: Emoji as UI icons — why they fail
**What happened:** v1 used emoji as card icons (📦 for repo, 🔍 for findings, 📋 for reviews). On closer inspection they look out of place on a dark technical dashboard.

**Root cause:** Emoji are rendered by the OS, not the browser. On Windows they look different than on Mac, different on Android. They also don't inherit CSS `color`, can't be styled, and are fixed size. On a dark background with carefully chosen brand colors, emoji introduce uncontrolled visual noise.

**Fix:** All icons replaced with inline SVG elements that:
- Inherit `currentColor` (can be themed with CSS)
- Scale with `width`/`height` attributes
- Are 100% consistent across all platforms
- Render crisply at any pixel density

**Lesson:** In production web applications, always use SVG icons (inline SVG, icon component library, or SVG sprite). Emoji belong in text/chat contexts, not in UI chrome.

---

### Phase 4: CORS error when calling backend from Vite dev server
**What happened:** After starting both servers (`npm run dev` in backend on `:3000`, frontend on `:5173`), the first API call from the React app returned a browser CORS error: *"Access to fetch at 'http://localhost:3000/api/repos' from origin 'http://localhost:5173' has been blocked by CORS policy."*

**Root cause:** Browsers block cross-origin requests unless the server explicitly allows them. The backend already had `cors()` middleware configured for production URLs, but the dev frontend URL wasn't in the allowed list.

**Fix:** Added Vite proxy to `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```
Now all `/api/*` requests from the React app are forwarded by Vite to the backend — the browser sees the request as same-origin (`:5173`), so no CORS check is performed. No backend changes needed.

**Lesson:** In a monorepo with separate frontend/backend dev servers, Vite proxy is the cleanest development solution. Save CORS headers for the actual production cross-origin scenario.

---

### Phase 4: `require()` inside a React component caused a runtime error
**What happened:** The initial `ScrollToTop` component (which scrolls the page to the top on route change) used `require('react').useEffect(...)` inside the component body — a remnant of a bad copy-paste. The app crashed with `useEffect is not a function`.

**Root cause:** `require('react')` in an ES module context (Vite uses `import`) returns an object, but in a JSX file that mix of module systems doesn't resolve the hook correctly. More fundamentally, hooks should always be imported at the top of the file, not required inline.

**Fix:** Added `import { useEffect } from 'react'` at the top of `App.jsx` and removed the inline `require()`.

**Lesson:** Never use `require()` inside a React component. Always import at the module top level. `useEffect` called from a `require()` result bypasses React's rules-of-hooks static analysis — if the linter doesn't catch it, it will surface as a confusing runtime error.

---

## 🎨 Frontend Architecture Decisions

> Why each technical choice was made — useful for technical interviews.

### No Tailwind CSS
Vanilla CSS with custom properties gives full control over every pixel without fighting utility class specificity. For a portfolio project with a custom design system, Tailwind's presets constrain more than they help. The CSS file documents the intent of every token — `--sev-high-bd` is more readable than `border-[rgba(248,113,113,0.25)]`.

### No chart library (Chart.js, Recharts, etc.)
For two chart types (horizontal bar + stacked bar), a 200KB+ library is unjustified. Pure SVG for the trend chart and CSS `flex` for the category chart keeps the bundle small and shows understanding of layout primitives. The rule: use a library when you need 5+ chart types, zooming/brushing, or real-time data streaming.

### React Router (history mode, not hash mode)
History mode (`/repos/devagarwal2503/ai-review-test`) is cleaner than hash mode (`#/repos/...`). It requires the server to serve `index.html` for all paths — handled by Vite in dev and by Vercel's rewrite config in production (added in Phase 5).

### Vite proxy instead of CORS middleware
In development, Vite's `server.proxy` makes frontend API calls appear same-origin, avoiding CORS preflight entirely. In production, Vercel and Render are on different domains, so real CORS headers are needed on the Express app — and they're already configured.

### `save-before-post` pattern in webhook handler
MongoDB is written *before* posting to GitHub. If the GitHub API call fails (rate limit, network error), the analysis result is still in the database — visible in the dashboard and retryable. If the order were reversed and GitHub succeeded but MongoDB failed, the data would be lost forever with no indication to the user.

---

## 🗺️ Roadmap / Future Directions

Things deliberately left out of this version (to keep scope realistic) but worth mentioning in interviews as conscious decisions:

- **RAG over repo history** — vector-embed the repo's past issues/reviews so the AI has long-term memory of the codebase's conventions
- **Multi-VCS support** — GitLab, Bitbucket integration
- **Fine-tuned model** — fine-tune on high-quality open-source review comment datasets
- **Real-time dashboard** — WebSocket push instead of polling
- **Multi-tenant SaaS** — authentication, per-org billing, org-level analytics

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

_Built by [Dev](https://github.com/YOUR_USERNAME) · July 2026_
