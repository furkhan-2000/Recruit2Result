# Google Search OS

Google search extraction with a table dashboard, proxy support (NodeMaven), run history, remarks, and CSV export to your Desktop folder.

## Quick start

```bash
cd google-search-scraper
npm install
cp .env.example .env   # add NODEMAVEN_API_KEY for proxy mode
npm run dev
```

Open **http://localhost:5174**

| Command | Purpose |
|---------|---------|
| `npm run dev` | API (`:3848`) + UI (`:5174`) |
| `npm run server` | API only |
| `npm run build:dashboard && npm start` | Production UI from API |

## Features

- **Google search** — paginates through results until the end (or max cap)
- **Table view** — title, domain, snippet, website ✓/✗, remarks, page
- **Full view** — expanded table with editable remarks per row (saved to history)
- **Proxy toggle** — Proxy is **default**; switch to Local system when testing
- **History** — every run saved to `output/history/`
- **CSV export** — downloads file and saves copy to your configured Desktop folder

## Proxy (NodeMaven)

1. Set `NODEMAVEN_API_KEY=...` in `.env` (same as job-scraper-test)
2. Restart the server
3. **Proxy** mode is selected by default in the dashboard

Country targeting uses the **Location bias** field (e.g. India → `country-in`).

## Download folder

In the sidebar **Download** section, set the folder path (defaults to your Desktop) and click **Save folder**. CSV exports are written there and also trigger a browser download.

## Website ✓ / ✗

| Badge | Meaning |
|-------|---------|
| ✓ | Result links to a likely company website |
| ✗ | Directory, social, maps, or aggregator (LinkedIn, Yelp, etc.) |

## Warnings

- Google may show CAPTCHA on heavy or datacenter traffic — residential proxy helps
- Respect robots.txt and applicable laws for your use case
- Research / lead enrichment only — not for spam automation
