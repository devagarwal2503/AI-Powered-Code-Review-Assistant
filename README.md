# 🤖 AI-Powered Code Review Assistant

> A production-grade tool that listens to GitHub Pull Requests, performs context-aware AI analysis, posts structured review comments directly on the PR, and tracks code-quality trends over time through a live dashboard.

[![CI](https://github.com/YOUR_USERNAME/ai-code-review-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ai-code-review-assistant/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## 🚀 Live Demo

| Service | URL | Status |
|---|---|---|
| Dashboard | _Coming in Phase 4_ | 🔧 In Progress |
| Backend API | _Coming in Phase 5_ | 🔧 In Progress |

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
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── github/           # GitHub App auth, webhook handler, API client
│   │   ├── analysis/         # Diff chunker, context fetcher, prompt builder, OpenAI client
│   │   ├── review/           # Review poster, review store
│   │   ├── api/              # REST API routes for dashboard
│   │   ├── models/           # MongoDB schemas
│   │   └── utils/            # Logger, error handler, config
│   ├── tests/
│   └── package.json
├── frontend/                 # React + Vite dashboard
│   ├── src/
│   │   ├── pages/            # Overview, RepoDetail, PRDrilldown
│   │   ├── components/       # Charts, tables, cards
│   │   └── api/              # API client for backend
│   └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint + test on every PR
│       └── deploy.yml        # Deploy on merge to main
├── .env.example              # Environment variable template (no secrets)
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
| **Phase 4** — Dashboard | React dashboard, REST API endpoints, charts, PR drilldown | ⏳ Upcoming | — |
| **Phase 5** — CI/CD & Deploy | GitHub Actions, Render deploy, Vercel deploy, Winston logging | ⏳ Upcoming | — |
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
| MongoDB aggregation pipelines | Phase 4 | _To be filled_ |
| GitHub Actions CI/CD | Phase 5 | _To be filled_ |

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
