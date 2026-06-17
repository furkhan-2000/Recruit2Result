import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchableSelect from "./components/SearchableSelect.jsx";
import ProxyPanel from "./components/ProxyPanel.jsx";
import "./index.css";
import "./premium.css";
import {
  POSTED_OPTIONS,
  WORK_OPTIONS,
  SORT_OPTIONS,
  LINKEDIN_EXP_OPTIONS,
  INDEED_EXP_OPTIONS,
  INDEED_JOB_TYPE_OPTIONS,
  buildFilterParams,
  fetchBuiltUrls,
} from "./lib/filters.js";

const MAX_JOBS = 1000;

function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Premium Card with Cursor Tracking Effect
 */
function PremiumJobCard({ job, onRunInfiniteLoop }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = (y - centerY) / 10;
    const tiltY = (centerX - x) / 10;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <article
      ref={cardRef}
      className={`job-card ${job.site}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <header>
        <span className="mono">#{String(job.id).padStart(3, "0")}</span>
        <span className={`badge ${job.site}`}>{job.site}</span>
      </header>
      <h4>{job.title || "Untitled"}</h4>
      <p className="co">{job.company || "Unknown"}</p>
      {job.location && <p className="loc">{job.location}</p>}

      <div className="score-area">
        {job.aiScore ? (
          <div className="ai-insight">
            <div className="ai-score-header">
              <span className="ai-label">AI Match</span>
              <span className="ai-score">{job.aiScore}%</span>
            </div>
            <p className="ai-reason">{job.aiReason}</p>
          </div>
        ) : (
          <div className="local-insight">
            <span className="local-label">Local Match</span>
            <span className="local-score">{job.qualityScore}%</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="view-link">
            View posting →
          </a>
        )}
        <button 
          className="btn-mini infinite-btn"
          onClick={() => onRunInfiniteLoop(job)}
          title="Trigger Infinite Loop Agents"
        >
          ⚡ Agent Swarm
        </button>
      </div>
    </article>
  );
}

function ChipGroup({ label, options, value, onChange, disabled }) {
  return (
    <div className="chip-group">
      <span className="chip-label">{label}</span>
      <div className="chips">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`chip ${value === opt.id ? "active" : ""}`}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [linkedinOn, setLinkedinOn] = useState(true);
  const [indeedOn, setIndeedOn] = useState(true);
  const [keywords, setKeywords] = useState("software engineer");
  const [location, setLocation] = useState("United States");
  const [separateLocations, setSeparateLocations] = useState(false);
  const [linkedinLocation, setLinkedinLocation] = useState("United States");
  const [indeedLocation, setIndeedLocation] = useState("Remote");
  const [postedWithin, setPostedWithin] = useState("24h");
  const [customHours, setCustomHours] = useState(24);
  const [sort, setSort] = useState("date");
  const [linkedinWorkType, setLinkedinWorkType] = useState("any");
  const [indeedWorkType, setIndeedWorkType] = useState("remote");
  const [linkedinExperience, setLinkedinExperience] = useState("any");
  const [indeedExperience, setIndeedExperience] = useState("entry");
  const [indeedJobType, setIndeedJobType] = useState("any");
  const [quantity, setQuantity] = useState(50);
  const [headless, setHeadless] = useState(true);
  const [useCustomUrls, setUseCustomUrls] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [indeedUrl, setIndeedUrl] = useState("");
  const [builtUrls, setBuiltUrls] = useState({ linkedin: "", indeed: "" });
  const [viewMode, setViewMode] = useState("cards");
  const [jobFilter, setJobFilter] = useState("");

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Configure search and extract");
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeSite, setActiveSite] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [screenshots, setScreenshots] = useState({});
  const [historyRuns, setHistoryRuns] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [viewSource, setViewSource] = useState("live");
  const [serverBusy, setServerBusy] = useState(false);
  const [runSummary, setRunSummary] = useState(null);
  const [egressMode, setEgressMode] = useState("local");
  const [proxyConfigured, setProxyConfigured] = useState(false);
  const [proxyReport, setProxyReport] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  const [candidateProfile, setCandidateProfile] = useState({
    name: "Furkhan",
    github: "furkhan-2000",
    skills: "React, Node.js, Puppeteer, AI",
  });

  const [intelligence, setIntelligence] = useState({
    totalJobs: 0,
    insights: { remoteJobs: 0, sources: 0, companies: 0, locations: 0 },
    updatedAt: null,
  });
  const [sourceHealth, setSourceHealth] = useState({ sources: {} });

  const eventSourceRef = useRef(null);
  const streamDoneRef = useRef(false);
  const extractLockRef = useRef(false);

  // Parallax Effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pushLog = useCallback((text, level = "info") => {
    setLogs((prev) => [{ t: formatTime(), text, level }, ...prev.slice(0, 99)]);
  }, []);

  const selectedSites = useMemo(() => {
    const s = [];
    if (linkedinOn) s.push("linkedin");
    if (indeedOn) s.push("indeed");
    return s;
  }, [linkedinOn, indeedOn]);

  const targetTotal = quantity * selectedSites.length;
  const progressPct =
    targetTotal > 0 ? Math.min(100, (current / targetTotal) * 100) : 0;

  const linkedinCount = jobs.filter((j) => j.site === "linkedin").length;
  const indeedCount = jobs.filter((j) => j.site === "indeed").length;
  const healthRows = useMemo(
    () =>
      Object.values(sourceHealth.sources ?? {}).sort(
        (a, b) => (b.lastRunAt ?? "").localeCompare(a.lastRunAt ?? "")
      ),
    [sourceHealth]
  );

  const filteredJobs = useMemo(() => {
    const q = jobFilter.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
    );
  }, [jobs, jobFilter]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.defaults) {
          const d = cfg.defaults;
          setKeywords(d.keywords ?? keywords);
          setLocation(d.location ?? location);
          setSeparateLocations(d.separateLocations ?? false);
          setLinkedinLocation(d.linkedinLocation ?? linkedinLocation);
          setIndeedLocation(d.indeedLocation ?? indeedLocation);
          setPostedWithin(d.postedWithin ?? postedWithin);
          setCustomHours(d.customHours ?? customHours);
          setSort(d.sort ?? sort);
          setLinkedinWorkType(d.linkedinWorkType ?? linkedinWorkType);
          setIndeedWorkType(d.indeedWorkType ?? indeedWorkType);
          setLinkedinExperience(d.linkedinExperience ?? linkedinExperience);
          setIndeedExperience(d.indeedExperience ?? indeedExperience);
          setIndeedJobType(d.indeedJobType ?? indeedJobType);
          setQuantity(d.quantity ?? quantity);
        }
        if (cfg.built) setBuiltUrls(cfg.built);
        if (cfg.proxy) {
          setProxyConfigured(Boolean(cfg.proxy.configured));
        }
      })
      .catch(() => {});
  }, []);

  const filterState = useMemo(
    () => ({
      keywords,
      location,
      separateLocations,
      linkedinLocation: separateLocations ? linkedinLocation : location,
      indeedLocation: separateLocations ? indeedLocation : location,
      postedWithin,
      customHours,
      sort,
      linkedinWorkType,
      indeedWorkType,
      linkedinExperience,
      indeedExperience,
      indeedJobType,
    }),
    [
      keywords,
      location,
      separateLocations,
      linkedinLocation,
      indeedLocation,
      postedWithin,
      customHours,
      sort,
      linkedinWorkType,
      indeedWorkType,
      linkedinExperience,
      indeedExperience,
      indeedJobType,
    ]
  );

  useEffect(() => {
    if (useCustomUrls) return;
    const t = setTimeout(() => {
      fetchBuiltUrls(buildFilterParams(filterState))
        .then((urls) => {
          setBuiltUrls(urls);
          setLinkedinUrl(urls.linkedin);
          setIndeedUrl(urls.indeed);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [filterState, useCustomUrls]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistoryRuns(data.runs ?? []);
    } catch {
      pushLog("Could not load extraction history", "warn");
    }
  }, [pushLog]);

  const loadIntelligence = useCallback(async () => {
    try {
      const [jobsRes, healthRes] = await Promise.all([
        fetch("/api/jobs?limit=1"),
        fetch("/api/source-health"),
      ]);
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setIntelligence({
          totalJobs: data.totalJobs ?? 0,
          insights: data.insights ?? {
            remoteJobs: 0,
            sources: 0,
            companies: 0,
            locations: 0,
          },
          updatedAt: data.updatedAt ?? null,
        });
      }
      if (healthRes.ok) {
        setSourceHealth(await healthRes.json());
      }
    } catch {
      /* Intelligence panels are optional when the API is still booting. */
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadIntelligence();
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setServerBusy(Boolean(s.running)))
      .catch(() => {});
  }, [loadHistory, loadIntelligence]);

  const loadHistoryRun = useCallback(
    async (id) => {
      try {
        const res = await fetch(`/api/history/${id}`);
        if (!res.ok) throw new Error("Not found");
        const run = await res.json();
        setSelectedHistoryId(id);
        setViewSource("history");
        setJobs(run.jobs ?? []);
        setCurrent(run.totalCollected ?? run.jobs?.length ?? 0);
        setTotal((run.quantity ?? 0) * (run.sites?.length ?? 1));
        setStatus("done");
        setRunSummary(run.summary ?? null);
        setEgressMode(run.proxyMode ? "proxy" : "local");
        setProxyReport(run.proxyReport ?? null);
        setLogs(
          (run.activityLog ?? []).map((l) => ({
            t: l.t
              ? new Date(l.t).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "—",
            text: l.text,
            level: l.level ?? "info",
          }))
        );
        setMessage(
          run.summary?.title ??
            `History · ${run.totalCollected ?? 0} jobs · ${run.status}`
        );
        pushLog(`Loaded history: ${id} (${run.totalCollected ?? 0} jobs)`, "info");
      } catch {
        pushLog(`Failed to load run ${id}`, "error");
      }
    },
    [pushLog]
  );

  const resetServer = useCallback(async () => {
    await fetch("/api/extract/reset", { method: "POST" });
    setServerBusy(false);
    setRunning(false);
    setStatus("idle");
    pushLog("Server run lock cleared", "warn");
  }, [pushLog]);

  const cancel = useCallback(() => {
    fetch("/api/extract/cancel", { method: "POST" }).catch(() => {});
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setRunning(false);
    setStatus("idle");
    setMessage("Cancelled");
    pushLog("Extraction cancelled", "warn");
  }, [pushLog]);

  const startExtract = useCallback(async () => {
    if (extractLockRef.current) {
      pushLog("Extract already starting…", "warn");
      return;
    }
    if (selectedSites.length === 0) {
      pushLog("Select at least one platform", "warn");
      return;
    }

    const liUrl = useCustomUrls ? linkedinUrl.trim() : builtUrls.linkedin;
    const inUrl = useCustomUrls ? indeedUrl.trim() : builtUrls.indeed;

    if (linkedinOn && !liUrl) {
      pushLog("LinkedIn URL missing", "warn");
      return;
    }
    if (indeedOn && !inUrl) {
      pushLog("Indeed URL missing", "warn");
      return;
    }

    const statusRes = await fetch("/api/status").catch(() => null);
    if (statusRes?.ok) {
      const st = await statusRes.json();
      if (st.running) {
        setServerBusy(true);
        pushLog(
          `Server busy (run ${st.runId ?? "?"}). Wait or click Reset lock.`,
          "error"
        );
        return;
      }
    }

    extractLockRef.current = true;
    streamDoneRef.current = false;
    eventSourceRef.current?.close();

    setViewSource("live");
    setSelectedHistoryId(null);
    setRunSummary(null);
    setProxyReport(egressMode === "proxy" ? { mode: "proxy", totalRotations: 0, rotations: [], summary: null } : null);
    setLogs([]);
    setJobs([]);
    setScreenshots({});
    setCurrent(0);
    setTotal(targetTotal);
    setRunning(true);
    setServerBusy(true);
    setStatus("running");
    setMessage("Connecting to scraper…");
    setActiveSite(null);
    if (egressMode === "proxy" && !proxyConfigured) {
      pushLog("Proxy mode: add NODEMAVEN_API_KEY to .env and restart API", "error");
      extractLockRef.current = false;
      return;
    }

    pushLog(
      `Extract ${selectedSites.join(" + ")} · ${quantity} jobs each · ${postedWithin} · ${egressMode === "proxy" ? "NodeMaven proxy" : "local IP"}`,
      "success"
    );

    const params = new URLSearchParams({
      sites: selectedSites.join(","),
      quantity: String(quantity),
      headless: headless ? "true" : "false",
      proxyMode: egressMode === "proxy" ? "true" : "false",
      ...buildFilterParams(filterState),
      useCustomUrls: useCustomUrls ? "true" : "false",
      linkedinUrl: liUrl,
      indeedUrl: inUrl,
    });

    const es = new EventSource(`/api/extract/stream?${params}`);
    eventSourceRef.current = es;

    const finishStream = (finalStatus, msg) => {
      if (streamDoneRef.current) return;
      streamDoneRef.current = true;
      setRunning(false);
      setServerBusy(false);
      setStatus(finalStatus);
      setMessage(msg);
      extractLockRef.current = false;
      es.close();
      eventSourceRef.current = null;
      loadHistory();
      loadIntelligence();
    };

    es.addEventListener("open", () => {
      pushLog("Connected — live stream active", "success");
    });

    es.addEventListener("log", (e) => {
      const d = JSON.parse(e.data);
      const t = d.t
        ? new Date(d.t).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : formatTime();
      setLogs((prev) => [{ t, text: d.text, level: d.level ?? "info" }, ...prev.slice(0, 199)]);
    });

    es.addEventListener("ping", () => {
      setServerBusy(true);
      setRunning(true);
    });

    es.addEventListener("run-start", (e) => {
      const d = JSON.parse(e.data);
      setTotal(d.quantity * d.sites.length);
      setRunning(true);
      setMessage("Extraction running…");
      if (d.proxyReport) setProxyReport(d.proxyReport);
      pushLog(`Run ${d.runId} · ${d.quantity} jobs per site`, "info");
    });

    es.addEventListener("proxy-report", (e) => {
      const d = JSON.parse(e.data);
      if (d.proxyReport) setProxyReport(d.proxyReport);
    });

    es.addEventListener("proxy-summary", (e) => {
      const d = JSON.parse(e.data);
      if (d.proxyReport) setProxyReport(d.proxyReport);
    });

    es.addEventListener("proxy-rotation", () => {});
    es.addEventListener("proxy-ip", () => {});
    es.addEventListener("proxy-rotation-complete", () => {});

    es.addEventListener("screenshot", (e) => {
      const d = JSON.parse(e.data);
      setScreenshots((prev) => ({ ...prev, [d.site]: d.path }));
    });

    es.addEventListener("site-start", (e) => {
      const d = JSON.parse(e.data);
      setActiveSite(d.site);
      setMessage(`Extracting ${d.site}…`);
    });

    es.addEventListener("status", (e) => {
      const d = JSON.parse(e.data);
      setMessage(d.message);
    });

    es.addEventListener("progress", (e) => {
      const d = JSON.parse(e.data);
      const siteIndex = selectedSites.indexOf(d.site);
      setCurrent(siteIndex * quantity + d.current);
      const target = d.total ?? d.quantity ?? quantity;
      setMessage(`${d.site} · ${d.current} / ${target}`);
      setJobs((prev) => {
        if (prev.some((j) => j.url === d.job.url && j.site === d.job.site))
          return prev;
        return [d.job, ...prev];
      });
    });

    es.addEventListener("plateau", (e) => {
      const d = JSON.parse(e.data);
      setMessage(d.message ?? `Plateau at ${d.collected}/${d.target}`);
    });

    es.addEventListener("block", (e) => {
      const d = JSON.parse(e.data);
      setMessage(`Blocked: ${d.reasons?.join(", ")}`);
    });

    es.addEventListener("error", (e) => {
      try {
        const d = JSON.parse(e.data);
        pushLog(d.message ?? "Error", "error");
        setMessage(d.message ?? "Error");
      } catch {
        /* SSE transport error handled in onerror */
      }
    });

    es.addEventListener("site-complete", (e) => {
      const d = JSON.parse(e.data);
      setMessage(`${d.site}: ${d.count} jobs collected`);
    });

    es.addEventListener("history-saved", (e) => {
      const d = JSON.parse(e.data);
      pushLog(`Saved to output/history/${d.runId}.json`, "success");
      if (d.intelligence) {
        setIntelligence((prev) => ({
          ...prev,
          totalJobs: d.intelligence.totalJobs ?? prev.totalJobs,
          insights: d.intelligence.insights ?? prev.insights,
        }));
      }
      loadHistory();
      loadIntelligence();
    });

    es.addEventListener("run-complete", (e) => {
      const d = JSON.parse(e.data);
      setCurrent(d.totalCollected);
      setRunSummary(d.summary ?? null);
      if (d.proxyReport) setProxyReport(d.proxyReport);
      const outcome = d.summary?.outcome ?? d.status;
      pushLog(
        `${d.summary?.title ?? "Complete"}: ${d.totalCollected} jobs (${d.status})`,
        outcome === "success" ? "success" : "warn"
      );
      finishStream(
        outcome === "failed" ? "idle" : "done",
        d.summary?.title ?? `Done — ${d.totalCollected} jobs`
      );
    });

    es.onerror = async () => {
      if (streamDoneRef.current) return;

      if (es.readyState === EventSource.CONNECTING) {
        pushLog("Stream failed to connect (409 busy or server down?)", "error");
        finishStream("idle", "Connection failed");
        return;
      }

      if (es.readyState === EventSource.CLOSED) {
        const st = await fetch("/api/status")
          .then((r) => r.json())
          .catch(() => ({ running: false }));

        if (st.running) {
          pushLog(
            "Browser disconnected UI — scrape may still run on server. Wait or Reset.",
            "warn"
          );
          setRunning(true);
          setServerBusy(true);
          setMessage("Server still running…");
        } else if (!streamDoneRef.current) {
          pushLog("Stream closed before completion", "warn");
          finishStream("idle", "Stream ended");
        }
      }
    };
  }, [
    selectedSites,
    linkedinOn,
    indeedOn,
    linkedinUrl,
    indeedUrl,
    builtUrls,
    useCustomUrls,
    quantity,
    headless,
    filterState,
    targetTotal,
    pushLog,
    loadHistory,
    postedWithin,
    egressMode,
    proxyConfigured,
  ]);

  const runInfiniteLoop = useCallback(async (job) => {
    pushLog(`Triggering Infinite Loop for ${job.company}...`, "info");
    try {
      const res = await fetch("/api/workflow/infinite-loop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          candidate: candidateProfile,
          job: job
        }),
      });
      const data = await res.json();
      if (data.success) {
        pushLog(`Infinite Loop Cycle Complete for ${job.company}!`, "success");
        pushLog(`Elite Score: ${data.result.candidate.eliteScore}%`, "success");
      } else {
        pushLog(`Infinite Loop Failed: ${data.error}`, "error");
      }
    } catch (err) {
      pushLog(`Error triggering Infinite Loop: ${err.message}`, "error");
    }
  }, [candidateProfile, pushLog]);

  return (
   <div className={`shell status-${status}`}>
     <div className="smoke-layer" />
     <div className="parallax-bg" style={{ "--scroll-y": `${scrollY}px` }} />

     <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="#0071E3" />
              <path
                d="M9 22V10h4.2l3.1 8.2L19.4 10H23v12h-3.4v-7.5L16.2 22h-2.8l-3.4-7.5V22H9z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <h1>Recruit2Result</h1>
            <p>Ultra-Premium Job Intelligence OS</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="egress-toggle">
            <button
              className={egressMode === "local" ? "active" : ""}
              onClick={() => setEgressMode("local")}
            >
              Local
            </button>
            <button
              className={egressMode === "proxy" ? "active" : ""}
              onClick={() => setEgressMode("proxy")}
            >
              Proxy
            </button>
          </div>
          <span className={`pill ${running ? "live" : ""}`}>
            {running ? "● Active" : "Idle"}
          </span>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <section className="card">
            <h2>Candidate Profile</h2>
            <div className="field">
              <label>Name</label>
              <input 
                value={candidateProfile.name} 
                onChange={e => setCandidateProfile({...candidateProfile, name: e.target.value})}
              />
            </div>
            <div className="field">
              <label>GitHub Username</label>
              <input 
                value={candidateProfile.github} 
                onChange={e => setCandidateProfile({...candidateProfile, github: e.target.value})}
              />
            </div>
            <div className="field">
              <label>Skills (comma separated)</label>
              <input 
                value={candidateProfile.skills} 
                onChange={e => setCandidateProfile({...candidateProfile, skills: e.target.value})}
              />
            </div>
            <p className="filter-hint">Used for AI Swarm vetting & Email Mining</p>
          </section>

          <section className="card">
            <h2>Extraction Filters</h2>
            <div className="field">
              <label>Keywords</label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Lead Engineer"
              />
            </div>
            <SearchableSelect
              label="Location"
              value={location}
              onChange={setLocation}
            />
            <ChipGroup
              label="Posted"
              options={POSTED_OPTIONS}
              value={postedWithin}
              onChange={setPostedWithin}
            />
            <button
              className="btn primary"
              style={{ width: "100%", marginTop: "10px" }}
              disabled={running || serverBusy}
              onClick={startExtract}
            >
              Start Extraction
            </button>
          </section>

          <section className="card history-panel">
            <h2>History</h2>
            <ul className="history-list">
              {historyRuns.map((run) => (
                <li key={run.id}>
                  <button
                    className={`history-item ${selectedHistoryId === run.id ? "active" : ""}`}
                    onClick={() => loadHistoryRun(run.id)}
                  >
                    <span className="history-title">{run.id}</span>
                    <span className="history-meta">{run.totalCollected} jobs</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="main">
          <div className="hero-metrics">
            <div className="progress-metric">
              <div className="progress-ring" style={{ "--pct": progressPct }}>
                <svg viewBox="0 0 100 100">
                  <circle className="track" cx="50" cy="50" r="42" />
                  <circle className="fill" cx="50" cy="50" r="42" />
                </svg>
                <div className="ring-label">
                  <strong>{current}</strong>
                  <span>/ {targetTotal || "—"}</span>
                </div>
              </div>
              <div>
                <h3>{message}</h3>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <section className="intelligence-grid">
            <div className="stat">
              <span>Indexed</span>
              <strong>{intelligence.totalJobs}</strong>
            </div>
            <div className="stat">
              <span>Companies</span>
              <strong>{intelligence.insights.companies}</strong>
            </div>
            <div className="stat">
              <span>Remote</span>
              <strong>{intelligence.insights.remoteJobs}</strong>
            </div>
          </section>

          <div className="results-toolbar" style={{ marginTop: "30px" }}>
            <input
              className="search-jobs"
              placeholder="Filter results..."
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
            />
          </div>

          <div className="job-grid">
            {filteredJobs.map((job) => (
              <PremiumJobCard 
                key={`${job.site}-${job.url}-${job.id}`} 
                job={job} 
                onRunInfiniteLoop={runInfiniteLoop}
              />
            ))}
          </div>

          <section className="card log-card" style={{ marginTop: "40px" }}>
            <h2>Agent Activity Log</h2>
            <div className="log">
              {logs.map((l, i) => (
                <div key={i} className={`log-line ${l.level}`}>
                  <span className="mono">{l.t}</span> {l.text}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
