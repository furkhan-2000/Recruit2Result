import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { createCursor } from "ghost-cursor";

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

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function launchGodModeBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"]
  });
  return browser;
}

async function preparePage(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    window.chrome = { runtime: {} };
    const concurrency = [4, 8, 12, 16][Math.floor(Math.random() * 4)];
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => concurrency });
  });
  return page;
}

app.post("/extract-jobs", async (req, res) => {
  const { site, searchUrl } = req.body;
  const browser = await launchGodModeBrowser();
  try {
    const page = await preparePage(browser);
    const cursor = await createCursor(page);
    await page.goto(searchUrl, { waitUntil: "networkidle2" });
    
    // Mock extraction logic (In prod, this uses extractors.js)
    const jobs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("h3")).map((el, i) => ({
        id: i,
        title: el.innerText,
        company: "Unknown",
        url: window.location.href
      }));
    });
    
    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = 5005;
app.listen(PORT, () => console.log(`Scraper Service (God-Mode) running on port ${PORT}`));
