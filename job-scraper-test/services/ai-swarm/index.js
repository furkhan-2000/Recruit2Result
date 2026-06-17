import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import pRetry from "p-retry";

const app = express();

// Production-Grade CORS (Ready for Cloudflare Pages)
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// --- HEALTH CHECKS ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/livez", (req, res) => res.json({ status: "live" }));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function callGroq(messages, options = {}) {
  const { model = "llama3-70b-8192", temperature = 0.1, max_tokens = 500, response_format } = options;
  const run = async () => {
    const completion = await groq.chat.completions.create({ messages, model, temperature, max_tokens, response_format });
    return completion.choices[0]?.message?.content;
  };
  return pRetry(run, { retries: 3 });
}

app.post("/audit-code", async (req, res) => {
  const { repoUrl, repoMetadata } = req.body;
  const prompt = `Review repository ${repoUrl} with metadata ${JSON.stringify(repoMetadata)}. Provide a technical score (0-100) and summary in JSON: { "score": number, "summary": "string" }`;
  try {
    const result = await callGroq([{ role: "user", content: prompt }], { response_format: { type: "json_object" } });
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/culture-fit", async (req, res) => {
  const { candidateData } = req.body;
  const prompt = `Analyze culture fit for: ${JSON.stringify(candidateData)}. Return JSON: { "cultureFitScore": number, "recommendation": "string" }`;
  try {
    const result = await callGroq([{ role: "user", content: prompt }], { response_format: { type: "json_object" } });
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4020;
app.listen(PORT, () => console.log(`AI Swarm Service running on port ${PORT}`));
