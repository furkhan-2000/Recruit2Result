import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- HEALTH CHECKS ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/livez", (req, res) => res.json({ status: "live" }));

const SERVICES = {
  scraper: process.env.SCRAPER_SERVICE_URL || "http://scraper:5005",
  enrichment: process.env.ENRICHMENT_SERVICE_URL || "http://enrichment:5050",
  ai_swarm: process.env.AI_SWARM_SERVICE_URL || "http://ai-swarm:4020",
  outreach: process.env.OUTREACH_SERVICE_URL || "http://outreach:8881"
};

app.post("/api/infinite-loop", async (req, res) => {
  const { candidate, job, hrContact } = req.body;
  const results = { logs: [] };

  try {
    // 1. Scrape (Muscle)
    results.logs.push("Sourcing from Global Swarm...");
    const scrapeRes = await axios.post(`${SERVICES.scraper}/extract-jobs`, { site: "linkedin", searchUrl: job.url });
    results.jobs = scrapeRes.data.jobs;

    // 2. Enrich (Hunter)
    results.logs.push("Mining deep-web contacts...");
    const enrichRes = await axios.post(`${SERVICES.enrichment}/enrich`, { github: candidate.github });
    candidate.emails = enrichRes.data.emails;

    // 3. Vetting (Brain)
    results.logs.push("Analyzing code quality & culture fit...");
    const [auditRes, cultureRes] = await Promise.all([
      axios.post(`${SERVICES.ai_swarm}/audit-code`, { repoUrl: candidate.github, repoMetadata: {} }),
      axios.post(`${SERVICES.ai_swarm}/culture-fit`, { candidateData: candidate })
    ]);
    candidate.eliteScore = Math.round((auditRes.data.score * 0.6) + (cultureRes.data.cultureFitScore * 0.4));

    // 4. Outreach (Closer)
    results.logs.push("Generating dual-intent outreach...");
    const outreachRes = await axios.post(`${SERVICES.outreach}/generate-outreach`, { candidate, job, hrContact });
    results.outreach = outreachRes.data;

    res.json({ success: true, candidate, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Command Center (Orchestrator) running on port ${PORT}`));
