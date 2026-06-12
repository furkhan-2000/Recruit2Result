"use strict";

const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { scrapeAll } = require("../src/scrapers/adapters");

const PORT = Number(process.env.PORT || 4173);
const rootDir = path.join(__dirname, "..");
const dashboardDir = path.join(rootDir, "dashboard");
const outputPath = path.join(rootDir, "output", "jobs.json");

let scrapeState = {
  running: false,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastError: null,
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname === "/api/health") {
      return sendJson(response, 200, {
        ok: true,
        service: "AI OS Job Portal",
        time: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/jobs") {
      const data = await readJobStore();
      const query = url.searchParams.get("q") || "";
      const remote = url.searchParams.get("remote");
      const source = url.searchParams.get("source") || "";
      const jobs = filterJobs(data.jobs, { query, remote, source });

      return sendJson(response, 200, {
        ...data,
        total: data.jobs.length,
        returned: jobs.length,
        jobs,
      });
    }

    if (url.pathname === "/api/scrape" && request.method === "POST") {
      const result = await runScrape();
      return sendJson(response, result.started ? 202 : 409, result);
    }

    if (url.pathname === "/api/sources") {
      const data = await readJobStore();
      const sources = Array.from(new Set(data.jobs.map((job) => job.source).filter(Boolean))).sort();
      return sendJson(response, 200, { sources });
    }

    return serveStatic(url.pathname, response);
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, {
      error: "Internal server error",
      message: error.message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`AI OS Job Portal running at http://localhost:${PORT}`);
});

async function readJobStore() {
  try {
    const raw = await fs.readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      updatedAt: parsed.updatedAt || null,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      scrapeState,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { updatedAt: null, jobs: [], errors: [], scrapeState };
    }

    throw error;
  }
}

function filterJobs(jobs, filters) {
  const query = filters.query.trim().toLowerCase();
  const source = filters.source.trim().toLowerCase();

  return jobs.filter((job) => {
    if (filters.remote === "true" && !job.remote) {
      return false;
    }

    if (source && String(job.source || "").toLowerCase() !== source) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      job.title,
      job.company,
      job.location,
      job.source,
      job.description,
      ...(job.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

async function runScrape() {
  if (scrapeState.running) {
    return {
      started: false,
      message: "A scrape is already running.",
      scrapeState,
    };
  }

  scrapeState = {
    ...scrapeState,
    running: true,
    lastStartedAt: new Date().toISOString(),
    lastError: null,
  };

  scrapeAll()
    .then(async (result) => {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
      scrapeState = {
        ...scrapeState,
        running: false,
        lastFinishedAt: new Date().toISOString(),
      };
    })
    .catch((error) => {
      scrapeState = {
        ...scrapeState,
        running: false,
        lastFinishedAt: new Date().toISOString(),
        lastError: error.message,
      };
      console.error(error);
    });

  return {
    started: true,
    message: "Scrape started.",
    scrapeState,
  };
}

async function serveStatic(requestPath, response) {
  const cleanPath = requestPath === "/" ? "/index.html" : requestPath;
  const resolved = path.normalize(path.join(dashboardDir, cleanPath));

  if (!resolved.startsWith(dashboardDir)) {
    return sendText(response, 403, "Forbidden");
  }

  try {
    const body = await fs.readFile(resolved);
    const type = mimeTypes[path.extname(resolved)] || "application/octet-stream";
    response.writeHead(200, { "content-type": type });
    response.end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = await fs.readFile(path.join(dashboardDir, "index.html"));
      response.writeHead(200, { "content-type": mimeTypes[".html"] });
      response.end(fallback);
      return;
    }

    throw error;
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  response.end(text);
}
