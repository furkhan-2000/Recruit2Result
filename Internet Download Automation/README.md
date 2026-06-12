# Internet Download Dashboard

Search the web and download images with **Puppeteer**, multi-platform search, **NodeMaven rotating proxy**, and a local dashboard.

## Quick start

```bash
cd "Internet Download Automation"
npm install
cp .env.example .env    # add NODEMAVEN_API_KEY if using proxy
npm start
```

Open **http://localhost:3939**

## Proxy (NodeMaven)

1. Copy **API key** from NodeMaven dashboard → **Profile → API key**
2. Set `NODEMAVEN_API_KEY=...` in `.env`
3. Test: `npm run test:proxy`
4. In the dashboard header, switch **Local** → **Proxy**

Each platform search gets a **new sticky session** (`-sid-…`) = fresh egress IP. Credentials resolve via `GET /api/v2/base/users/me` (API key is not sent to the proxy gateway).

Optional: `NODEMAVEN_PROXY_USER` + `NODEMAVEN_PROXY_PASSWORD` from Proxy Setup (skips API call). Optional: `NODEMAVEN_PROXY_COUNTRY=in`.

Docs: [API access](https://docs.nodemaven.com/en/articles/10329935-api-access) · [Swagger](https://dashboard.nodemaven.com/documentation/v2/swagger/) · [Puppeteer](https://nodemaven.com/integrations/proxies-for-puppeteer/)

**Universal AI prompt** (any Puppeteer project, not just this app): see `PROXY-SETUP-PROMPT.md`.

## Features

- **Auto** or manual platform pick: Bing, DuckDuckGo, Pinterest, Unsplash, Pixabay
- Browser-context downloads with retries
- Local IP or NodeMaven rotating proxy
- Live activity log + gallery + SQLite history

## API

- `GET /api/health` — includes proxy status
- `GET /api/proxy/status` — NodeMaven config snapshot
- `POST /api/jobs` — `{ query, count, autoMode, proxyMode, sources }`
- `GET /api/jobs/:id/stream` — SSE live log

## Storage

- `data/dashboard.sqlite` — jobs, logs, metadata
- `storage/downloads/{jobId}/` — image files
