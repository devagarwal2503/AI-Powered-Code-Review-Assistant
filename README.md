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
| **Phase 2** — AI Analysis | Diff chunker, context fetcher, prompt builder, OpenAI structured output, analysis orchestrator | ⏳ Upcoming | — |
| **Phase 3** — Post & Store | GitHub PR review comment poster, MongoDB persistence layer | ⏳ Upcoming | — |
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
| Context window budgeting for LLMs | Phase 2 | _To be filled_ |
| OpenAI structured output (JSON mode) | Phase 2 | _To be filled_ |
| GitHub PR Review API vs. PR Comments API | Phase 3 | _To be filled_ |
| MongoDB aggregation pipelines | Phase 4 | _To be filled_ |
| GitHub Actions CI/CD | Phase 5 | _To be filled_ |

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
