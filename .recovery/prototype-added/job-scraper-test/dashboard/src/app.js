"use strict";

const state = {
  jobs: [],
  sources: [],
  updatedAt: null,
  errors: [],
};

const elements = {
  totalJobs: document.querySelector("#totalJobs"),
  remoteJobs: document.querySelector("#remoteJobs"),
  sourceCount: document.querySelector("#sourceCount"),
  lastUpdated: document.querySelector("#lastUpdated"),
  searchInput: document.querySelector("#searchInput"),
  sourceSelect: document.querySelector("#sourceSelect"),
  remoteOnly: document.querySelector("#remoteOnly"),
  statusText: document.querySelector("#statusText"),
  jobList: document.querySelector("#jobList"),
  scrapeButton: document.querySelector("#scrapeButton"),
  template: document.querySelector("#jobCardTemplate"),
};

init();

function init() {
  elements.searchInput.addEventListener("input", renderJobs);
  elements.sourceSelect.addEventListener("change", renderJobs);
  elements.remoteOnly.addEventListener("change", renderJobs);
  elements.scrapeButton.addEventListener("click", startScrape);
  loadJobs();
}

async function loadJobs() {
  setStatus("Loading jobs...");

  try {
    const response = await fetch("/api/jobs");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    state.jobs = data.jobs || [];
    state.updatedAt = data.updatedAt;
    state.errors = data.errors || [];
    state.sources = Array.from(new Set(state.jobs.map((job) => job.source).filter(Boolean))).sort();

    renderSourceOptions();
    renderMetrics();
    renderJobs();
  } catch (error) {
    setStatus(`Could not load jobs: ${error.message}`);
  }
}

async function startScrape() {
  elements.scrapeButton.disabled = true;
  setStatus("Starting scraper agents...");

  try {
    const response = await fetch("/api/scrape", { method: "POST" });
    const data = await response.json();

    if (!response.ok && response.status !== 409) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    setStatus(data.message || "Scrape started.");
    await waitForScrape();
  } catch (error) {
    setStatus(`Scrape failed: ${error.message}`);
  } finally {
    elements.scrapeButton.disabled = false;
  }
}

async function waitForScrape() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(1500);
    const response = await fetch("/api/jobs");
    const data = await response.json();

    if (!data.scrapeState || !data.scrapeState.running) {
      state.jobs = data.jobs || [];
      state.updatedAt = data.updatedAt;
      state.errors = data.errors || [];
      state.sources = Array.from(new Set(state.jobs.map((job) => job.source).filter(Boolean))).sort();
      renderSourceOptions();
      renderMetrics();
      renderJobs();
      return;
    }

    setStatus("Scraper agents are collecting jobs...");
  }

  await loadJobs();
}

function renderMetrics() {
  const remoteCount = state.jobs.filter((job) => job.remote).length;
  elements.totalJobs.textContent = formatNumber(state.jobs.length);
  elements.remoteJobs.textContent = formatNumber(remoteCount);
  elements.sourceCount.textContent = formatNumber(state.sources.length);
  elements.lastUpdated.textContent = state.updatedAt ? relativeTime(state.updatedAt) : "Never";
}

function renderSourceOptions() {
  const currentValue = elements.sourceSelect.value;
  elements.sourceSelect.innerHTML = '<option value="">All sources</option>';

  for (const source of state.sources) {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = source;
    elements.sourceSelect.append(option);
  }

  elements.sourceSelect.value = state.sources.includes(currentValue) ? currentValue : "";
}

function renderJobs() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const source = elements.sourceSelect.value;
  const remoteOnly = elements.remoteOnly.checked;

  const jobs = state.jobs.filter((job) => {
    if (remoteOnly && !job.remote) {
      return false;
    }

    if (source && job.source !== source) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [job.title, job.company, job.location, job.source, job.description, ...(job.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  elements.jobList.replaceChildren();

  if (jobs.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      state.jobs.length === 0
        ? "No jobs yet. Run the scraper to collect fresh listings."
        : "No jobs match the current filters.";
    elements.jobList.append(empty);
  } else {
    const fragment = document.createDocumentFragment();
    jobs.forEach((job) => fragment.append(renderJobCard(job)));
    elements.jobList.append(fragment);
  }

  const errorText = state.errors.length ? ` ${state.errors.length} source issue(s) detected.` : "";
  setStatus(`Showing ${formatNumber(jobs.length)} of ${formatNumber(state.jobs.length)} jobs.${errorText}`);
}

function renderJobCard(job) {
  const card = elements.template.content.firstElementChild.cloneNode(true);

  card.querySelector(".job-source").textContent = job.source || "Unknown source";
  card.querySelector("h2").textContent = job.title;
  card.querySelector(".company").textContent = `${job.company} • ${job.location || "Location not specified"}`;
  card.querySelector(".description").textContent = job.description || "No description available.";

  const applyLink = card.querySelector(".apply-link");
  applyLink.href = job.url;
  applyLink.setAttribute("aria-label", `Apply for ${job.title} at ${job.company}`);

  const meta = card.querySelector(".job-meta");
  meta.append(createPill(job.remote ? "Remote" : "On-site / Hybrid", job.remote ? "remote" : ""));
  if (job.salary) {
    meta.append(createPill(job.salary, "salary"));
  }
  if (job.postedAt) {
    meta.append(createPill(`Posted ${relativeTime(job.postedAt)}`, ""));
  }

  const tags = card.querySelector(".tag-list");
  (job.tags || []).forEach((tag) => tags.append(createPill(tag, "")));

  return card;
}

function createPill(text, className) {
  const pill = document.createElement("span");
  pill.textContent = text;
  if (className) {
    pill.className = className;
  }
  return pill;
}

function setStatus(text) {
  elements.statusText.textContent = text;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function relativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, amount] of units) {
    const interval = Math.trunc(seconds / amount);
    if (Math.abs(interval) >= 1) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(interval, unit);
    }
  }

  return "just now";
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
