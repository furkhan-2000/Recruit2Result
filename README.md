# Recruit2Result — Scraping Agents

**By [Khan Mohammed](https://github.com/KhanMohammed)**

[![Repository](https://img.shields.io/badge/GitHub-Recruit2Result-blue)](https://github.com/KhanMohammed/Recruit2Result)

A collection of browser-based data extraction tools with live dashboards — built for research, lead generation, and workflow automation. Each app runs independently with its own API, UI, and SQLite history where applicable.

> Public learning and productivity workspace. Use responsibly and in line with each platform’s terms of service.

**Repository:** [github.com/vivekmishraishere/AI-OS-3-scrapping-agents](https://github.com/vivekmishraishere/AI-OS-3-scrapping-agents)

---

## What’s inside

| Tool | Port | Stack | Best for |
|------|------|-------|----------|
| [**Job Extract OS**](./job-scraper-test/) | `3847` | Node · Puppeteer · React · Vite | Job market research across LinkedIn & Indeed |
| [**Google Search OS**](./google-search-scraper/) | `3848` | Node · Puppeteer · React · Vite | SERP extraction, lead lists, competitive research |
| [**Internet Download Dashboard**](./Internet%20Download%20Automation/) | `3939` | Node · Puppeteer · SQLite | Bulk image search & download from the open web |
| [**HR Finding Automation**](./HR%20Finding%20Automation/) | `3940` | Node · Puppeteer · SQLite | Company discovery → HR contact lists |
| [**Google Maps Scraper**](./google-maps-scraper/) | `3942` | Node · Puppeteer · SQLite | Local business leads from Maps search |

All proxy-enabled apps support **[NodeMaven](https://nodemaven.com/)** residential proxy rotation (optional). Works on local IP for light testing.

---

## Use cases

### For recruiters & HR teams
- **HR Finding Automation** — Search a company name (e.g. Razorpay, Infosys), discover matching companies, then pull HR / People-team contacts into an exportable sheet.
- **Job Extract OS** — Monitor open roles by keyword, location, experience, and work type across LinkedIn and Indeed; export structured job data for pipeline tracking.

### For sales, marketing & agencies
- **Google Search OS** — Build prospect lists from Google results (agencies, SaaS, local services) with domain, snippet, and remark columns; export to CSV.
- **Google Maps Scraper** — Extract business names, addresses, phones, ratings, and websites for a niche + location (e.g. “digital marketing agency in Mumbai”).
- **Internet Download Dashboard** — Collect visual assets from Bing, DuckDuckGo, Pinterest, Unsplash, and Pixabay for mood boards, competitive audits, or content research.

### For developers & automation builders
- Reference implementations for **Puppeteer** scraping with headless Chrome, proxy sessions, job queues, SSE live logs, and SQLite persistence.
- Patterns for **guest (no-login) scraping**, rate-aware retries, and when to add residential proxies vs. split queries.
- Ready-to-deploy Node apps with `bean.conf` examples for [KloudBean](https://www.kloudbean.com/) or any VPS.
- **Build your own scraper** — use [`Nodemaven-setup-prompt.md`](./Nodemaven-setup-prompt.md), a universal AI prompt to add NodeMaven rotating proxy to any Node.js + Puppeteer project (not tied to these apps).

### For educators & content creators
- Companion code for scraping strategy research — see [`SCRAPING-RESEARCH-NOTES.md`](./SCRAPING-RESEARCH-NOTES.md) for proxy decision frameworks, plateau vs. IP-block diagnostics, and responsible scaling guidance.

---

## Tool highlights

### Job Extract OS
Research-oriented job extraction with a React dashboard.

- LinkedIn & Indeed URL builder with filters (location, posted date, work type, experience)
- Live extraction stream with progress and screenshots
- Extraction history stored locally
- Optional NodeMaven proxy mode for geo-accurate, higher-volume runs

```bash
cd job-scraper-test
cp .env.example .env   # add NODEMAVEN_API_KEY if using proxy mode
npm install
npm run dev            # API + Vite UI
# or: npm start        # production build + server
```

---

### Google Search OS
Google SERP scraper with a table dashboard, proxy support, and CSV export.

- Configurable query, location, and max results
- Result table with remarks, history, and full-view modal
- Proxy rotation per site via NodeMaven
- Built-in settings for download directory and run history

```bash
cd google-search-scraper
cp .env.example .env
npm install
npm run dev
```

---

### Internet Download Dashboard
Search and download images from multiple platforms in one place.

- Multi-platform search: Bing, DuckDuckGo, Pinterest, Unsplash, Pixabay
- Snapshot, review, and batch-download workflows
- Per-job history and on-disk storage
- Optional proxy mode for blocked or geo-sensitive sources

```bash
cd "Internet Download Automation"
cp .env.example .env
npm install
npm start
```

---

### HR Finding Automation
Two-step workflow: find companies, then find HR contacts.

- **Step 1** — Company discovery from a brand-name query
- **Step 2** — Select companies and scrape HR / People profiles
- Live job logs via Server-Sent Events
- CSV export per run
- Optional LinkedIn session cookie (`LINKEDIN_LI_AT`) for deeper people search

```bash
cd "HR Finding Automation"
cp .env.example .env
npm install
npm start
```

---

### Google Maps Scraper
Google Maps business listing extraction with unlimited scroll.

- Query + location search with parallel job queue
- Proxy rotation and IP rotation limits
- SQLite history and CSV export
- Detail reports per scrape run

```bash
cd google-maps-scraper
cp .env.example .env
npm install
npm start
```

---

## Requirements

- **Node.js** 20+ (LTS recommended)
- **npm** 9+
- macOS, Linux, or Windows with enough RAM for headless Chrome (~2–4 GB free per active browser)
- **NodeMaven API key** (optional) — for proxy-enabled apps when scaling beyond local IP limits

---
## Security & Secret Management (Production Ready)

This application is designed for enterprise-grade security. Secrets are kept **indirectly**, never directly inside the application code or configuration.

**Production Workflow:**
1.  **OCI Vault** stores the API keys (Groq, NodeMaven, etc.) securely as the source-of-truth.
2.  **Kubernetes (K8s)** pulls those secrets from the Vault into a **K8s Secret**.
3.  **The Backend** receives these secrets injected as environment variables at runtime.

This pattern isolates storage, access, rotation, and runtime usage cleanly. It ensures that keys are never exposed in code, Git, or ConfigMaps. The backend never talks to Vault directly and never sees Vault OCIDs, maintaining a strict security boundary.

---

## Environment variables

The app is entirely environment-driven. In production, these should be injected via K8s Secrets or your CI/CD pipeline.

| Variable | Purpose | Injection Source |
|----------|---------|------------------|
| `GROQ_API_KEY` | AI Intelligence (gpt-oss-120b) | OCI Vault → K8s Secret |
| `NODEMAVEN_API_KEY` | Residential Proxy Rotation | OCI Vault → K8s Secret |
| `PORT` | App Port (Default 3847) | Deployment Manifest |
| `NODE_ENV` | Set to `production` | Deployment Manifest |

---

## Responsible use

These tools automate browser interactions with third-party websites. Before using them in production or at scale:

## NodeMaven proxy — use in this repo or your own project

Four apps here already ship with NodeMaven integration. If you are building a **new, unique scraper**, you do not need to copy this repo wholesale — use the included prompt:

| Resource | Purpose |
|----------|---------|
| [`Nodemaven-setup-prompt.md`](./Nodemaven-setup-prompt.md) | **Universal AI prompt** — paste into Cursor, ChatGPT, or Claude to implement rotating residential proxy in any Puppeteer project |
| [`SCRAPING-RESEARCH-NOTES.md`](./SCRAPING-RESEARCH-NOTES.md) | When proxies help vs. guest-search plateaus, scaling, and ban risk |
| `src/nodemaven-proxy.js` (per app) | Working reference implementation already used in this suite |

**Quick start with the prompt:**
1. Open `Nodemaven-setup-prompt.md`
2. Copy the prompt block into your AI assistant
3. Fill in **My project** (path, what you scrape, rotation preference)
4. Run `npm run test:proxy` after implementation to verify egress IP

---

## Project structure

```
AI-OS-3-scrapping-agents/
├── job-scraper-test/           # Job Extract OS
├── google-search-scraper/      # Google Search OS
├── Internet Download Automation/
├── HR Finding Automation/
├── google-maps-scraper/
├── Nodemaven-setup-prompt.md   # Universal AI prompt for proxy setup
├── SCRAPING-RESEARCH-NOTES.md  # Proxy & scraping strategy notes
└── README.md                   # You are here
```

---

## Deployment (KloudBean / VPS)

Each app can be deployed as a **separate Node.js application**. See `bean.conf.example` inside each project folder.

**Recommended server specs for Puppeteer apps:**
- 4 GB RAM minimum (8 GB if running multiple scrapers)
- Node 20 LTS
- Set secrets in the host environment panel — never commit `.env`

**Monorepo deploy:** Set `PROJECT_DIR` in `bean.conf` to the subfolder name (e.g. `google-search-scraper`).

---

## Responsible use

These tools automate browser interactions with third-party websites. Before using them in production or at scale:

1. **Read each platform’s Terms of Service** — LinkedIn, Indeed, Google, and others restrict automated access.
2. **Respect rate limits** — Start with low volume; add proxies only when you have evidence of IP-based blocking (not “empty results” plateaus).
3. **No credentials in git** — `.env` files are gitignored; rotate keys if they were ever exposed.
4. **Research & education first** — This repo is intended for learning, internal workflows, and building automation skills — not for circumventing platform protections or harvesting data without permission.

See [`SCRAPING-RESEARCH-NOTES.md`](./SCRAPING-RESEARCH-NOTES.md) for a deeper breakdown of when proxies help, when they don’t, and how to scale without getting blocked.

---

## Tech stack

- **Runtime:** Node.js (ES modules)
- **Server:** Express
- **Browser automation:** Puppeteer (headless Chrome)
- **Dashboards:** Vanilla HTML/CSS or React + Vite
- **Storage:** SQLite (`better-sqlite3`) where history is needed
- **Proxies:** NodeMaven API integration (optional)

---

## Author

**[Vivek Mishra](https://github.com/vivekmishraishere)**

Builder of automation tools for scraping, lead research, and workflow productivity. This public repo documents real-world patterns for browser-based data extraction — from first prototype on a home IP to proxy-backed production deploys.

- GitHub: [@vivekmishraishere](https://github.com/vivekmishraishere)
- Repo: [AI-OS-3-scrapping-agents](https://github.com/vivekmishraishere/AI-OS-3-scrapping-agents)

If you use this repo in a video, article, or course — a mention or link back is appreciated.

---

## License

This project is provided as-is for educational and research purposes. Third-party platforms, APIs, and data accessed through these tools remain subject to their own terms. Review and comply with applicable laws and platform policies in your jurisdiction before use.
