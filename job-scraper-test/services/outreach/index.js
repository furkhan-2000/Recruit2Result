import express from "express";
import Groq from "groq-sdk";

const app = express();
app.use(express.json());

// --- HEALTH CHECKS ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/livez", (req, res) => res.json({ status: "live" }));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generatePitch(prompt) {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-70b-8192",
  });
  return completion.choices[0]?.message?.content;
}

app.post("/generate-outreach", async (req, res) => {
  const { candidate, job, hrContact } = req.body;
  const candidatePitch = await generatePitch(`Write a pitch to ${candidate.name} for ${job.title} at ${job.company}.`);
  const hrPitch = await generatePitch(`Write a dossier pitch for HR ${hrContact.name} about candidate ${candidate.name}.`);
  res.json({ candidatePitch, hrPitch });
});

app.post("/schedule", async (req, res) => {
  const meetingId = `MEET-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  res.json({ meetingId, status: "pending", times: ["Mon 10am", "Tue 2pm"] });
});

const PORT = 8881;
app.listen(PORT, () => console.log(`Outreach Service running on port ${PORT}`));
