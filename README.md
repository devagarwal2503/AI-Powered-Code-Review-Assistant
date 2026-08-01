<div align="center">

<br />

<img src="https://img.shields.io/badge/%3C%2F%3E-Scrutineer-38bdf8?style=for-the-badge&labelColor=0a0f1e" alt="Scrutineer" height="40" />

<h3>Scrutineer — AI-Powered Code Review</h3>

<p>A production-grade GitHub App that automatically reviews pull requests — catching security vulnerabilities,<br />bug risks, and architectural issues before a human opens the diff.</p>

<br />

[![CI](https://github.com/devagarwal2503/Scrutineer-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/devagarwal2503/Scrutineer-AI/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)](https://ai-code-review-backend-dsot.onrender.com/health)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)](https://ai-powered-code-review-assistant-ten.vercel.app)

<br />

[🚀 Live Dashboard](https://ai-powered-code-review-assistant-ten.vercel.app) · [📡 API Health](https://ai-code-review-backend-dsot.onrender.com/health) · [⚙️ Install Scrutineer](https://github.com/apps/scrutineer-ai) · [🐛 Issues](https://github.com/devagarwal2503/Scrutineer-AI/issues)

<br />

</div>

---

## 🚀 Live Demo

| Service | URL | Status |
|---|---|---|
| 🌐 Dashboard | [ai-powered-code-review-assistant-ten.vercel.app](https://ai-powered-code-review-assistant-ten.vercel.app) | ✅ Live |
| 📡 Backend API | [ai-code-review-backend-dsot.onrender.com](https://ai-code-review-backend-dsot.onrender.com/health) | ✅ Live |

> ⚡ **Cold start note:** The backend runs on Render's free tier. The first request after a period of inactivity may take ~30 seconds to wake up — subsequent requests are fast. This doesn't affect webhook delivery; GitHub retries for up to 3 days.

---

## ⚙️ Install Scrutineer on Your Repository

> Scrutineer is a **public GitHub App** — anyone can install it on their repos in 30 seconds. No backend setup, no API keys, no config.

### One-click install

**[→ Install Scrutineer on GitHub](https://github.com/apps/scrutineer-ai)**

### What happens after you install

1. Choose which repositories Scrutineer can access (one repo or all)
2. Open (or push to) any pull request on those repos
3. Scrutineer automatically analyzes the diff — no action needed from you
4. Inline review comments appear on the **Files Changed** tab within seconds
5. The findings are visible in the [live dashboard](https://ai-powered-code-review-assistant-ten.vercel.app) under your repo name

### What gets analyzed

Scrutineer catches issues that linters miss — things that require understanding *context*, not just syntax:

| Category | Examples |
|---|---|
| 🔴 **Security** | SQL injection, hardcoded secrets, `eval()` on user input, timing attacks |
| 🟠 **Bug Risk** | Missing `await`, loose equality, unhandled Promise rejection, type coercion |
| 🟡 **Performance** | N+1 queries, O(n²) loops, missing exponential backoff, synchronous I/O |
| 🔵 **Architecture** | Violations of separation of concerns, god objects, tight coupling |
| ⚪ **Style** | `var` usage, debug logs left in, unused variables |

> **Note:** The shared backend uses a single MongoDB instance and OpenAI API key. Each PR analysis costs ~$0.002 (gpt-4o-mini). Fine for team use — not intended for large-scale public traffic.

---

## 🧩 The Problem This Solves

Manual code review is expensive, inconsistent, and often misses security or architectural issues under time pressure. Existing linting tools catch syntax and style — but not context-sensitive problems like:

- SQL injection risks in a specific query pattern
- An architectural anti-pattern introduced across multiple files in the same PR
- A subtle race condition in async code
- Hardcoded secrets that a rushed reviewer might miss

This tool bridges the gap. It doesn't replace human reviewers — it gives them a **pre-review pass** that surfaces high-priority issues before a human even opens the diff.

---

## ⚡ How It Works

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 Developer
    participant GH as GitHub
    participant BE as Backend (Render)
    participant AI as OpenAI
    participant DB as MongoDB
    participant FE as Dashboard (Vercel)

    Dev->>GH: Opens Pull Request
    GH->>BE: POST /webhook (HMAC signed)
    BE->>BE: Verify HMAC-SHA256 signature
    BE->>GH: Fetch PR diff + file context
    GH-->>BE: Diff + surrounding code
    BE->>BE: Chunk into token-safe windows
    BE->>AI: Analyze with gpt-4o-mini
    AI-->>BE: Structured JSON findings
    BE->>DB: Save review + findings
    BE->>GH: Post inline PR review
    GH-->>Dev: Review notification ✅
    FE->>BE: GET /api/repos, /api/reviews
    BE-->>FE: Reviews + stats
```

**5 steps, fully automated:**

1. **Webhook** — GitHub fires a `pull_request` event to the Render backend
2. **Verification** — HMAC-SHA256 signature check ensures the payload is from GitHub
3. **Analysis** — PR diff + ±25 lines of surrounding context fed to `gpt-4o-mini` in token-safe chunks
4. **Review** — Findings posted as inline comments on the PR's Files Changed tab
5. **Dashboard** — MongoDB stores all findings; Vercel frontend shows trends and drilldown

---

## ✨ Key Features

| Feature | Details |
|---|---|
| **GitHub App integration** | Installs on any repo; triggers on `pull_request` opened/synchronized events |
| **Context-aware analysis** | Fetches ±25 lines of surrounding file context — AI suggestions are specific, not generic |
| **Structured findings** | AI returns JSON with `severity`, `category`, `file`, `line`, `explanation`, `suggestion` |
| **Inline PR comments** | Findings posted as review comments anchored to the exact line in Files Changed |
| **26 issues found** | First live test on a 2-file PR detected 26 real security/bug/performance issues |
| **Trend dashboard** | Per-repo charts, severity breakdown, paginated review history, PR drilldown |
| **Production-grade ops** | HMAC verification, token caching, exponential backoff, Winston structured logging |
| **CI/CD** | GitHub Actions: lint + build on every push; auto-deploy via Render + Vercel |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    Dev([👨‍💻 Developer]) -->|opens PR| GH[GitHub]
    GH -->|pull_request webhook| WH

    subgraph BE["⚙️ Backend — Node.js + Express on Render"]
        WH["🔐 Webhook Handler\nverify + enqueue"]
        WH --> GHC["📥 GitHub API Client\nfetch diff + context"]
        GHC --> AO["🧠 Analysis Orchestrator\nchunk · prompt · parse"]
        AO --> OAI["✨ OpenAI gpt-4o-mini\nStructured JSON output"]
        OAI --> RP["💬 Review Poster\npost inline PR comments"]
        OAI --> DB[("🗄️ MongoDB Atlas\nReviews + Findings")]
    end

    RP -->|inline review comments| GH
    GH -->|notification| Dev
    DB --> API["REST API /api/*"]

    subgraph FE["🖥️ Dashboard — React + Vite on Vercel"]
        API --> OV["📊 Repo Overview\n+ Severity Stats"]
        API --> PR["🔍 PR Drilldown\n+ Finding Details"]
        API --> CH["📈 Trend Charts\n+ Activity Feed"]
    end
```

---

## 🛠️ Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend | Node.js 18 + Express | Production-familiar, async-first, no framework overhead |
| Database | MongoDB Atlas (free tier) | Flexible schema for findings; native `$unwind`/`$group` for trend aggregation |
| Frontend | React 19 + Vite | Fast dev experience; no SSR complexity needed |
| AI | OpenAI `gpt-4o-mini` | Structured JSON output (`response_format`), cost-effective, fast |
| GitHub Integration | GitHub App + manual webhook handler | Full control over auth flow; no black-box SDK magic |
| Logging | Winston | Structured JSON logs — parseable by log aggregators in production |
| CI/CD | GitHub Actions | Parallel backend syntax check + frontend lint/build on every push |
| Hosting | Render (backend) + Vercel (frontend) | Zero-cost, live URLs, auto-deploy on `git push` |

---

## 📁 Project Structure

```
ai-code-review-assistant/
├── backend/
│   ├── src/
│   │   ├── github/
│   │   │   ├── auth.js              # JWT signing + installation token caching
│   │   │   ├── api.js               # GitHub REST API calls (fetch diff, post review)
│   │   │   └── webhookVerifier.js   # HMAC-SHA256 signature verification
│   │   ├── analysis/
│   │   │   ├── analysisOrchestrator.js  # Coordinates the full analysis pipeline
│   │   │   ├── diffChunker.js           # Splits large diffs into token-safe chunks
│   │   │   ├── contextFetcher.js        # Fetches ±25 lines of surrounding context
│   │   │   ├── promptBuilder.js         # Constructs the OpenAI system+user prompt
│   │   │   └── openaiClient.js          # Lazy-init OpenAI client with retry logic
│   │   ├── review/
│   │   │   ├── reviewPoster.js      # Posts findings as GitHub PR review comments
│   │   │   └── reviewStore.js       # MongoDB read/write for reviews and findings
│   │   ├── models/
│   │   │   ├── Review.js            # Mongoose schema (embedded findings, denorm counts)
│   │   │   └── db.js                # MongoDB connection with structured logging
│   │   ├── routes/
│   │   │   ├── webhook.js           # PR event handler + in-memory job queue
│   │   │   ├── api.js               # REST API for dashboard (repos, reviews, stats)
│   │   │   └── health.js            # Health check endpoint
│   │   └── utils/
│   │       ├── config.js            # Env var validation + typed config object
│   │       ├── logger.js            # Winston structured JSON logger
│   │       └── queue.js             # Serial in-memory job queue
│   ├── .env.example                 # Env var template (no secrets)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Overview: repo cards, stats, activity feed
│   │   │   ├── RepoPage.jsx         # Per-repo: SVG charts + paginated review list
│   │   │   └── ReviewPage.jsx       # PR drilldown: findings with filter tabs
│   │   ├── components/
│   │   │   ├── FindingCard.jsx      # Expandable accordion per finding
│   │   │   ├── Charts.jsx           # Pure SVG TrendChart + CSS CategoryChart
│   │   │   └── ui.jsx               # Shared: Spinner, Badge, Breadcrumb, SVG icons
│   │   ├── services/
│   │   │   └── api.js               # Fetch wrapper for all backend endpoints
│   │   ├── App.jsx                  # BrowserRouter + Navbar + route definitions
│   │   └── index.css                # Full design system (tokens, layout, components)
│   ├── vercel.json                  # SPA history-mode rewrites
│   ├── .env.example                 # Documents VITE_API_URL
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml                   # Parallel CI: backend syntax check + frontend build
├── render.yaml                      # Render Blueprint (Infrastructure as Code)
├── .env.example
├── README.md
└── LICENSE
```

---

## ⚙️ Local Development

### Prerequisites

- Node.js 18+
- A GitHub account (to create and install the GitHub App)
- An OpenAI API key
- [ngrok](https://ngrok.com/) — for local webhook testing

---

### 1. MongoDB Atlas — Free Cluster Setup

> M0 is permanently free. No credit card required.

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) → sign up → **Build a Cluster** → **M0 Free** → Create
2. **Database Access** → Add New Database User → Role: *Read and write to any database* → save the password
3. **Network Access** → Add IP Address → **Allow Access From Anywhere** → Confirm
4. **Database → Connect → Drivers → Node.js** → copy the connection string:
   ```
   mongodb+srv://appuser:<password>@cluster0.xxxxx.mongodb.net/ai_code_review?retryWrites=true&w=majority
   ```

---

### 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Then fill in MONGODB_URI, GITHUB_APP_ID, GITHUB_WEBHOOK_SECRET, OPENAI_API_KEY
```

> **Security rule:** Never paste secrets into a terminal command or share them in chat. They belong only inside `.env` — which is gitignored.

---

### 3. Run the Servers

```bash
# Terminal 1 — Backend (Express on :3000)
cd backend
npm install
npm run dev

# Terminal 2 — Frontend (Vite on :5173)
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## 📊 Benchmark Results

> Running the tool against real open-source PRs to compare AI findings against actual human reviewer comments — Phase 6.

| Metric | Result |
|---|---|
| PRs analyzed | _TBD_ |
| Repos used | _TBD_ |
| Overlap with human reviewer comments | _TBD_ |
| Additional issues flagged (not in human review) | _TBD_ |
| Estimated precision (manual spot-check) | _TBD_ |

**Live test (Phase 5 validation):**
- **2 files, 1 PR** → **26 findings** detected
- Categories: Security (SQL injection, hardcoded secrets, eval RCE), Bug Risk (timing attack, Math.random tokens, unhandled Promise rejection), Performance (N+1 queries, O(n²) deduplication, no exponential backoff)

---

## 📅 Development Log

> Updated at the end of each phase.

| Phase | What Was Built | Status | Date |
|---|---|---|---|
| **Phase 0** — Foundations | Project skeleton, GitHub App registration, MongoDB Atlas setup, Express boilerplate, Vite React boilerplate | ✅ Complete | Jul 2026 |
| **Phase 1** — Webhook Integration | Webhook signature verification, GitHub App JWT auth, PR diff fetcher, event queue | ✅ Complete | Jul 2026 |
| **Phase 2** — AI Analysis | Diff chunker, context fetcher, prompt builder, OpenAI structured output, analysis orchestrator | ✅ Complete | Jul 2026 |
| **Phase 3** — Post & Store | GitHub PR review comment poster, MongoDB persistence layer | ✅ Complete | Jul 2026 |
| **Phase 4** — Dashboard | React dashboard, REST API endpoints, pure-SVG charts, PR drilldown, "View on GitHub" links, full custom design system | ✅ Complete | Jul 2026 |
| **Phase 5** — CI/CD & Deploy | GitHub Actions CI (lint + build), Render backend deploy, Vercel frontend deploy, CORS production config, RSA private key via env var, live test: 26 findings on first PR | ✅ Complete | Aug 2026 |
| **Phase 6** — Benchmark | 15–20 PR analysis, overlap metrics, resume bullets | ⏳ Upcoming | — |

---

## 🧠 Concepts Learned (Learning Log)

> Documenting the "why" behind each technical decision — for interview prep and future reference.

| Concept | Phase | Key Insight |
|---|---|---|
| GitHub App vs. PAT vs. OAuth App | Phase 0 | A GitHub App is an independent identity (not tied to your personal account). It uses a private key + JWT to authenticate, generates short-lived scoped tokens per repo installation. PATs are tied to a user account and don't expire unless revoked — dangerous for automation. |
| HMAC-SHA256 webhook signature verification | Phase 1 | GitHub signs every webhook payload with your secret using HMAC-SHA256 and sends the result in `X-Hub-Signature-256`. You recompute it independently and compare with `crypto.timingSafeEqual()` — not `===` — to prevent timing attacks where response time leaks how many characters matched. |
| JWT → Installation Access Token flow | Phase 1 | You sign a short-lived JWT (10 min) with your App's RSA private key. Exchange it with GitHub for an Installation Token (1 hr, scoped to one repo). Cache the Installation Token — regenerating it on every webhook wastes an API call. |
| Context window budgeting for LLMs | Phase 2 | LLMs have a hard token limit. We budget 50k tokens per chunk (1 token ≈ 4 chars) with a 25% safety margin. Priority order: diff itself → ±25 lines of surrounding context → rest of file skipped. Chunking lets us handle PRs with many changed files without hitting the limit. |
| OpenAI structured output (JSON mode) | Phase 2 | `response_format: { type: "json_object" }` guarantees the model returns valid parseable JSON — no markdown fences, no preamble. Without it, the model wraps JSON in ` ```json ``` ` blocks and `JSON.parse()` crashes. You must still say "return JSON" somewhere in the prompt (OpenAI requirement), but the format is guaranteed. |
| GitHub PR Review API vs. PR Comments API | Phase 3 | Three separate GitHub APIs look similar but behave differently. A PR Review bundles all inline comments into one atomic submission — if any comment references a line not in the diff, the entire request fails with 422. Solution: parse the unified diff patch before submitting to build a set of visible line numbers, then split findings into inline comments (visible lines) vs. review body text (non-visible lines). |
| MongoDB aggregation pipelines | Phase 4 | `$unwind` deconstructs an embedded array into one document per element, enabling `$group` to aggregate across findings from multiple reviews. We use this to build the category breakdown chart (`$unwind findings → $group by findings.category → $sum: 1`). Denormalizing `findingCounts` at write time avoids re-running `$unwind` on dashboard load — a trade-off: data duplication vs. read performance. |
| Vite dev proxy vs. CORS headers | Phase 4 | When the frontend (`:5173`) calls the backend (`:3000`), the browser's same-origin policy blocks the request. Solution: Vite `server.proxy` routes `/api/*` to `:3000` — the request appears same-origin, no preflight `OPTIONS` round-trip. In production (Vercel → Render), real CORS headers are needed and configured via `FRONTEND_URL` env var. |
| SVG charts vs. chart library | Phase 4 | For two chart types, adding Chart.js or Recharts (100–300 KB) is unjustified. Pure SVG gives full design control, zero bundle cost, and is trivially themeable with CSS variables. Rule: use a library for 5+ chart types, zoom/brush interaction, or real-time streaming. |
| GitHub Actions CI/CD | Phase 5 | Two parallel jobs on `ubuntu-latest` — backend and frontend fail independently. `actions/setup-node@v4` with `cache: 'npm'` caches based on `package-lock.json` hash, so cold installs only happen when dependencies change. `node --check` parses all files for syntax errors without executing them — fastest backend validation without needing a live database. |
| RSA private key as environment variable | Phase 5 | PaaS platforms use ephemeral filesystems — files disappear on redeploy. Solution: store the full PEM content (including `-----BEGIN RSA PRIVATE KEY-----` header/footer) as a string environment variable. Some platforms escape newlines as `\n` — detect and replace with `key.replace(/\\n/g, '\n')` before passing to `jwt.sign()`. |
| PaaS cold start on free tier | Phase 5 | Render's free tier spins down after 15 min of inactivity. Wake-up adds ~30s latency. This doesn't affect webhook delivery — GitHub retries for up to 3 days. Workaround: UptimeRobot pings `/health` every 14 min (free). |
| Vite build-time environment variables | Phase 5 | Vite only exposes `VITE_`-prefixed env vars to client-side code (`import.meta.env.VITE_*`). The value is baked into the bundle at build time, not read dynamically at runtime. If `VITE_API_URL` changes on Vercel, a redeploy is required to pick up the new value. |

---

## 🐛 Challenges & How We Solved Them

> Real problems hit during development — documented to show engineering judgment beyond happy-path coding.

### Phase 0: MongoDB connection string pasted into terminal
**What happened:** The Atlas URI (`mongodb+srv://user:pass@host/...`) was accidentally pasted into PowerShell instead of `.env`. Threw `CommandNotFoundException`.

**Root cause:** The connection string is a *config file value*, not a command.

**Fix:** Pre-created `.env` with `MONGODB_URI=` already present so the correct action (paste after `=`) is the path of least resistance.

**Lesson:** Make the "pit of success" obvious. Scaffold config file keys before asking users to fill them in.

---

### Phase 0: MongoDB Atlas IP whitelist blocking connection
**What happened:** Server logged `"querySrv ECONNREFUSED _mongodb._tcp.cluster0..."` and exited immediately.

**Root cause:** Atlas clusters deny all connections by default. No IP whitelist entries = DNS SRV resolution refused at the network layer.

**Fix:** Added `0.0.0.0/0` to Atlas Network Access for development.

**Lesson:** `ECONNREFUSED` on a `_mongodb._tcp.*` hostname is almost always an Atlas whitelist issue, not a code bug. Recognizing infrastructure errors vs. application errors saves significant debugging time.

---

### Phase 0: MongoDB connected to `test` instead of `ai_code_review`
**What happened:** Logs showed `"db":"test"`. Data was going to the wrong database.

**Root cause:** Missing database name in the URI. Format: `...mongodb.net/<dbname>?...`. Without `<dbname>`, MongoDB defaults to `test`.

**Fix:** Added `ai_code_review` before the `?` in the URI.

**Lesson:** Always log the connected database name at startup. Make it impossible to miss.

---

### Phase 2: OpenAI SDK crashed the server on startup
**What happened:** Server crashed at `new OpenAI({ apiKey: ... })` before serving any requests.

**Root cause:** Client initialized at module load time — before env vars were validated. SDK throws if key is missing.

**Fix:** Switched to lazy initialization — client created on first use inside `getOpenAIClient()`.

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

**Lesson:** Never initialize third-party clients at module level if their constructor can throw. Lazy init isolates failures to the feature that needs them.

---

### Phase 2: AI returned 0 findings — is this a bug?
**What happened:** First live analysis returned `"findingCount":0`. Initial reaction: is the prompt wrong?

**Root cause:** Not a bug. The PR contained only `README.md` and `hello.html` — no code. Zero findings on non-code changes = correct calibration.

**Lesson:** Test with *known-good* input first (expect 0), then *deliberately flawed* code (expect findings). Both are needed to validate calibration, not just output.

---

### Phase 3: GitHub PR Review API returned 422 on every submission
**What happened:** Every call to the Reviews API returned `422 Unprocessable Entity`.

**Root cause:** A PR Review is atomic — if *any* comment references a line not in the diff, the entire request fails. The AI was suggesting lines from surrounding context that weren't part of the actual diff.

**Fix:** Parse the unified diff `patch` string before submitting to build a set of valid line numbers. Split findings into inline comments (on valid lines) vs. review body text (everything else).

**Lesson:** Read the API contract carefully. "Atomic submission" means a single bad line number aborts all 25 valid comments.

---

### Phase 4: "The first design looks like AI slop"
**What happened:** After building the full dashboard, the reaction was direct: *"The UI is not up to mark — it is like AI slop design."* Complaints: generic colors, emoji as icons, no visual identity.

**Root cause:** The v1 design cloned GitHub's palette (`#0d1117`, `#161b22`) — recognizable as a GitHub component, not an original product. Emoji icons are OS-rendered, inconsistent across platforms, and can't inherit CSS `color`.

**Fix:** Complete redesign — sky-blue brand (`#38bdf8`), orange/amber hero gradient, SVG-only icons, proportional severity mini-bars, glassmorphic stat cards, three background depth levels.

**Lesson:** Design needs a deliberate identity. Ask: *if someone saw a screenshot with no labels, would they recognize it as something distinct?* If not, you're copying, not designing.

---

### Phase 4: CORS error on first API call from Vite dev server
**What happened:** `"Access to fetch at 'http://localhost:3000/api/repos' blocked by CORS policy"`

**Root cause:** Browser blocks cross-origin requests. The backend's `cors()` middleware didn't list `:5173`.

**Fix:** Vite `server.proxy` in `vite.config.js` routes `/api/*` to `:3000`. The browser sees it as same-origin — no CORS check performed, no backend change needed.

**Lesson:** In a monorepo dev setup, Vite proxy is cleaner than adding `localhost:5173` to your CORS allowlist. Save CORS headers for the actual production cross-origin scenario.

---

### Phase 5: GitHub App private key on Render's ephemeral filesystem
**What happened:** The backend needs a `.pem` file to sign JWTs. Render's filesystem is ephemeral — files don't survive redeployment.

**Fix:** Read from `GITHUB_APP_PRIVATE_KEY` environment variable (full PEM string) with `process.env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n')` to handle platforms that escape newlines. Falls back to file path for local dev.

**Lesson:** Any secret that's a file in local dev needs an env-var strategy for PaaS deployment. Build the dual-mode support from the start.

---

## 🎨 Frontend Architecture Decisions

> Why each technical choice was made — for technical interviews.

### No Tailwind CSS
Vanilla CSS with custom properties (`--sev-high-bd`, `--brand-grd`) gives full control without fighting utility class specificity. The CSS file documents intent — token names are self-explanatory. Tailwind's presets would constrain the custom design system.

### No chart library (Chart.js, Recharts, etc.)
For two chart types (horizontal bar + proportional bar), a 100–300 KB library is unjustified. Pure SVG for the trend chart and CSS `flex` for the category chart keeps the bundle lean and demonstrates layout fundamentals. Rule: use a library for 5+ chart types, zoom/brush, or real-time streaming.

### React Router in history mode
`/repos/devagarwal2503/ai-review-test` is cleaner than `#/repos/...`. Requires the server to serve `index.html` for all paths — handled by Vite's dev server and Vercel's `rewrites` config in `vercel.json`.

### `save-before-post` ordering in the webhook handler
MongoDB is written **before** posting the review to GitHub. If the GitHub API call fails, the analysis result is still in the database — visible in the dashboard and retryable. Reversed order would silently lose data if MongoDB fails after a successful GitHub post.

---

## 🗺️ Roadmap — Future Directions

> Deliberately left out to keep scope realistic — but worth mentioning as conscious decisions in interviews.

- **RAG over repo history** — vector-embed past issues/reviews so the AI has long-term memory of codebase conventions
- **Multi-VCS support** — GitLab, Bitbucket integration
- **Fine-tuned model** — train on high-quality open-source review comment datasets
- **Real-time dashboard** — WebSocket push instead of polling
- **Multi-tenant SaaS** — authentication, per-org billing, org-level analytics

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built by [Dev Agarwal](https://github.com/devagarwal2503) · July – August 2026

[🚀 Live Demo](https://ai-powered-code-review-assistant-ten.vercel.app) · [⚙️ Install Scrutineer](https://github.com/apps/scrutineer-ai) · [⭐ Star on GitHub](https://github.com/devagarwal2503/Scrutineer-AI)

</div>
