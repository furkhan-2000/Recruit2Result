"use strict";

const crypto = require("node:crypto");

const USER_AGENT =
  "AI-OS-Job-Portal/0.1 (+local development; contact: admin@example.com)";

const DEFAULT_TIMEOUT_MS = 15000;

const sources = [
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    type: "json",
    url: "https://www.arbeitnow.com/api/job-board-api",
    parse: (payload) =>
      (payload.data || []).map((job) => ({
        source: "Arbeitnow",
        sourceId: String(job.slug || job.url || ""),
        title: job.title,
        company: job.company_name,
        location: job.location || "Remote / Not specified",
        remote: Boolean(job.remote),
        url: job.url,
        tags: job.tags || [],
        description: stripHtml(job.description || ""),
        postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : null,
      })),
  },
  {
    id: "remoteok",
    name: "Remote OK",
    type: "json",
    url: "https://remoteok.com/api",
    parse: (payload) =>
      (Array.isArray(payload) ? payload.slice(1) : []).map((job) => ({
        source: "Remote OK",
        sourceId: String(job.id || job.slug || job.url || ""),
        title: job.position,
        company: job.company,
        location: job.location || "Remote",
        remote: true,
        salary: job.salary_min || job.salary_max ? formatSalary(job.salary_min, job.salary_max) : "",
        url: job.url,
        tags: job.tags || [],
        description: stripHtml(job.description || ""),
        postedAt: job.date ? new Date(job.date).toISOString() : null,
      })),
  },
  {
    id: "remotive",
    name: "Remotive",
    type: "json",
    url: "https://remotive.com/api/remote-jobs",
    parse: (payload) =>
      (payload.jobs || []).map((job) => ({
        source: "Remotive",
        sourceId: String(job.id || job.url || ""),
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location || "Remote",
        remote: true,
        salary: job.salary || "",
        url: job.url,
        tags: [job.category].filter(Boolean),
        description: stripHtml(job.description || ""),
        postedAt: job.publication_date ? new Date(job.publication_date).toISOString() : null,
      })),
  },
];

async function scrapeAll(options = {}) {
  const results = await Promise.allSettled(sources.map((source) => scrapeSource(source, options)));
  const jobs = [];
  const errors = [];

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    const source = sources[index];

    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      errors.push({
        source: source.id,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    jobs: dedupeJobs(jobs.map(normalizeJob).filter(Boolean)),
    errors,
  };
}

async function scrapeSource(source, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const response = await fetchWithTimeout(source.url, timeoutMs);

  if (!response.ok) {
    throw new Error(`${source.name} returned HTTP ${response.status}`);
  }

  const payload = source.type === "json" ? await response.json() : await response.text();
  return source.parse(payload).map((job) => ({
    ...job,
    sourceId: job.sourceId || createStableId(source.id, job.url || job.title || ""),
  }));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/json,text/plain,*/*",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeJob(job) {
  if (!job.title || !job.company || !job.url) {
    return null;
  }

  const url = String(job.url).trim();
  const title = cleanText(job.title);
  const company = cleanText(job.company);

  return {
    id: createStableId(job.source || "source", `${title}|${company}|${url}`),
    title,
    company,
    location: cleanText(job.location || "Not specified"),
    remote: Boolean(job.remote || /remote/i.test(job.location || "")),
    salary: cleanText(job.salary || ""),
    url,
    source: cleanText(job.source || "Unknown"),
    sourceId: cleanText(job.sourceId || ""),
    tags: Array.from(new Set((job.tags || []).map(cleanText).filter(Boolean))).slice(0, 8),
    description: cleanText(job.description || "").slice(0, 1200),
    postedAt: normalizeDate(job.postedAt),
    scrapedAt: new Date().toISOString(),
  };
}

function dedupeJobs(jobs) {
  const seen = new Map();

  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${canonicalUrl(job.url)}`;
    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const left = a.postedAt ? Date.parse(a.postedAt) : 0;
    const right = b.postedAt ? Date.parse(b.postedAt) : 0;
    return right - left;
  });
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return url.toString();
  } catch {
    return String(value).trim();
  }
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return cleanText(
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
  );
}

function formatSalary(min, max) {
  const parts = [min, max].filter(Boolean).map((value) => Number(value).toLocaleString("en-US"));
  return parts.length === 2 ? `$${parts[0]} - $${parts[1]}` : `$${parts[0]}`;
}

function createStableId(source, value) {
  return crypto.createHash("sha256").update(`${source}:${value}`).digest("hex").slice(0, 16);
}

module.exports = {
  sources,
  scrapeAll,
  scrapeSource,
  normalizeJob,
  dedupeJobs,
};
