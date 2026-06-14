import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const intelligenceDir = join(__dirname, "..", "output", "intelligence");
const indexPath = join(intelligenceDir, "jobs-index.json");
const sourceHealthPath = join(intelligenceDir, "source-health.json");

const DEFAULT_INDEX = {
  version: 1,
  updatedAt: null,
  totalJobs: 0,
  jobs: [],
  insights: {
    remoteJobs: 0,
    sources: 0,
    companies: 0,
    locations: 0,
  },
};

const DEFAULT_HEALTH = {
  version: 1,
  updatedAt: null,
  sources: {},
};

export function indexExtractionRun(run) {
  const normalizedJobs = (run.jobs ?? [])
    .map((job) => normalizeJob(job, run))
    .filter(Boolean);

  const index = loadJson(indexPath, DEFAULT_INDEX);
  const byKey = new Map(index.jobs.map((job) => [job.dedupeKey, job]));
  const now = new Date().toISOString();

  for (const job of normalizedJobs) {
    const existing = byKey.get(job.dedupeKey);
    if (existing) {
      byKey.set(job.dedupeKey, {
        ...existing,
        ...job,
        id: existing.id,
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: now,
        seenCount: (existing.seenCount ?? 1) + 1,
        runIds: unique([...(existing.runIds ?? []), run.id].filter(Boolean)),
      });
    } else {
      byKey.set(job.dedupeKey, {
        ...job,
        firstSeenAt: now,
        lastSeenAt: now,
        seenCount: 1,
        runIds: [run.id].filter(Boolean),
      });
    }
  }

  const jobs = Array.from(byKey.values()).sort((a, b) =>
    (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "")
  );
  const nextIndex = {
    version: 1,
    updatedAt: now,
    totalJobs: jobs.length,
    jobs,
    insights: buildInsights(jobs),
  };

  atomicWriteJson(indexPath, nextIndex);
  updateSourceHealth(run, normalizedJobs);
  return nextIndex;
}

export function getJobIndex(filters = {}) {
  const index = loadJson(indexPath, DEFAULT_INDEX);
  let jobs = index.jobs ?? [];

  const q = String(filters.q ?? "").trim().toLowerCase();
  const source = String(filters.source ?? "").trim().toLowerCase();
  const remote = String(filters.remote ?? "").trim();
  const limit = clampNumber(filters.limit, 1, 5000, 500);

  if (source) {
    jobs = jobs.filter((job) => job.source.toLowerCase() === source);
  }

  if (remote === "true") {
    jobs = jobs.filter((job) => job.remote);
  }

  if (q) {
    jobs = jobs.filter((job) =>
      [
        job.title,
        job.company,
        job.location,
        job.source,
        job.url,
        ...(job.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return {
    ...index,
    returned: jobs.slice(0, limit).length,
    jobs: jobs.slice(0, limit),
  };
}

export function getSourceHealth() {
  return loadJson(sourceHealthPath, DEFAULT_HEALTH);
}

export function normalizeJob(raw, run = {}) {
  const title = cleanText(raw.title);
  const company = cleanText(raw.company);
  const url = canonicalUrl(raw.url);

  if (!title || !company || !url) {
    return null;
  }

  const source = cleanText(raw.site || raw.source || "unknown").toLowerCase();
  const location = cleanText(raw.location || "");
  const runKeywords = cleanText(run.filters?.keywords || "");
  const dedupeKey = createId(
    [
      canonicalUrlForDedupe(url),
      title.toLowerCase(),
      company.toLowerCase(),
      location.toLowerCase(),
    ].join("|")
  );

  return {
    id: createId(`${source}|${dedupeKey}`),
    dedupeKey,
    source,
    title,
    company,
    location,
    remote: isRemote(location, title),
    url,
    qualityScore: localScoreJob({ title, company, location, url }),
    aiScore: null,
    aiReason: null,
    collectedAt: normalizeDate(raw.collectedAt) || new Date().toISOString(),
    postedAt: normalizeDate(raw.postedAt) || null,
    keywords: runKeywords ? unique(runKeywords.split(/\s+/).filter(Boolean)) : [],
    filters: run.filters ?? {},
  };
}

export function buildInsights(jobs) {
  const sources = new Set();
  const companies = new Set();
  const locations = new Set();
  let remoteJobs = 0;

  for (const job of jobs) {
    if (job.source) sources.add(job.source);
    if (job.company) companies.add(job.company.toLowerCase());
    if (job.location) locations.add(job.location.toLowerCase());
    if (job.remote) remoteJobs += 1;
  }

  return {
    remoteJobs,
    sources: sources.size,
    companies: companies.size,
    locations: locations.size,
  };
}

function updateSourceHealth(run, jobs) {
  const health = loadJson(sourceHealthPath, DEFAULT_HEALTH);
  const now = new Date().toISOString();
  const sites = run.sites?.length
    ? run.sites
    : unique(jobs.map((job) => job.source).filter(Boolean));

  for (const site of sites) {
    const key = String(site).toLowerCase();
    const result = run.siteResults?.[key] ?? run.siteResults?.[site] ?? {};
    const current = health.sources[key] ?? {
      source: key,
      totalRuns: 0,
      successfulRuns: 0,
      partialRuns: 0,
      failedRuns: 0,
      blockedRuns: 0,
      jobsCollected: 0,
      lastRunAt: null,
      lastStatus: "unknown",
      lastError: null,
      healthScore: 0,
    };

    const count = jobs.filter((job) => job.source === key).length;
    const status = result.block?.blocked
      ? "blocked"
      : result.error
        ? "failed"
        : count > 0
          ? "ok"
          : "empty";

    const next = {
      ...current,
      totalRuns: current.totalRuns + 1,
      successfulRuns: current.successfulRuns + (status === "ok" ? 1 : 0),
      partialRuns:
        current.partialRuns + (run.status === "partial" || run.status === "plateau" ? 1 : 0),
      failedRuns: current.failedRuns + (status === "failed" || status === "empty" ? 1 : 0),
      blockedRuns: current.blockedRuns + (status === "blocked" ? 1 : 0),
      jobsCollected: current.jobsCollected + count,
      lastRunAt: run.finishedAt || now,
      lastStatus: status,
      lastError: result.error || run.error || null,
    };

    next.healthScore = Math.max(
      0,
      Math.min(
        100,
        Math.round((next.successfulRuns / Math.max(1, next.totalRuns)) * 100) -
          next.blockedRuns * 10
      )
    );
    health.sources[key] = next;
  }

  health.updatedAt = now;
  atomicWriteJson(sourceHealthPath, health);
}

function localScoreJob(job) {
  let score = 40;
  if (job.title) score += 15;
  if (job.company) score += 15;
  if (job.location) score += 10;
  if (job.url.startsWith("http")) score += 15;
  if (job.title.length > 6) score += 5;
  return Math.min(100, score);
}

function isRemote(location, title) {
  return /\b(remote|work from home|wfh)\b/i.test(`${location} ${title}`);
}

function canonicalUrl(value) {
  const raw = cleanText(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|trk|ref|source)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }
    url.searchParams.sort();
    return url.toString();
  } catch {
    return raw;
  }
}

function canonicalUrlForDedupe(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function createId(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function unique(values) {
  return [...new Set(values)];
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function loadJson(path, fallback) {
  if (!existsSync(path)) {
    return structuredClone(fallback);
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return structuredClone(fallback);
  }
}

function atomicWriteJson(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`);
  renameSync(tempPath, path);
}
