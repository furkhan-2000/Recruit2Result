give them diff ports ( 3000, 5005, 5050, 4020, 8881) this u can assign and also say dot he all have health
   checks ? in backend ? /healthz healthcheck ?? and also make sure nothing is running as a root .. all shold be running like a
   non root .../livez make this as a health chekc and should be in all microservices
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

  Hardening & Health Checks: Production-Ready Microservices:
  Hardening microservices with non-root users, custom ports, and health checks.

  ✓  ReadFile  OneDrive\...\orchestrator\index.js
  ✓  Edit  index.js → Accepted (+8, -4)

       6   app.use(cors());
       7   app.use(express.json());
       8
       9 + // --- HEALTH CHECKS ---
      10 + app.get("/healthz", (req, res) => res.json({ status: "ok" }));
      11 + app.get("/livez", (req, res) => res.json({ status: "live" }));
      12 +
      13   const SERVICES = {
      10 -   scraper: process.env.SCRAPER_SERVICE_URL || "http://scraper:3001",
      11 -   enrichment: process.env.ENRICHMENT_SERVICE_URL || "http://enrichment:3000",
      12 -   ai_swarm: process.env.AI_SWARM_SERVICE_URL || "http://ai-swarm:3000",
      13 -   outreach: process.env.OUTREACH_SERVICE_URL || "http://outreach:3000"
      14 +   scraper: process.env.SCRAPER_SERVICE_URL || "http://scraper:5005",
      15 +   enrichment: process.env.ENRICHMENT_SERVICE_URL || "http://enrichment:5050",
      16 +   ai_swarm: process.env.AI_SWARM_SERVICE_URL || "http://ai-swarm:4020",
      17 +   outreach: process.env.OUTREACH_SERVICE_URL || "http://outreach:8881"
      18   };
      19
      20   app.post("/api/infinite-loop", async (req, res) => {

  ✓  ReadFile  OneDrive\...\scraper\index.js
  ✓  Edit  index.js → Accepted (+4, -0)

       5   const app = express();
       6   app.use(express.json());
       7
       8 + // --- HEALTH CHECKS ---
       9 + app.get("/healthz", (req, res) => res.json({ status: "ok" }));
      10 + app.get("/livez", (req, res) => res.json({ status: "live" }));
      11 +
      12  const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0
          Safari/537.36";
      13
      14   async function launchGodModeBrowser() {

  ✓  Edit  index.js → Accepted (+1, -1)

      57     }
      58   });
      59
      60 - const PORT = 3001;
      60 + const PORT = 5005;
      61   app.listen(PORT, () => console.log(`Scraper Service (God-Mode) running on port ${PORT}`));

  ✓  Edit  index.js → Accepted (+4, -0)

       7   const app = express();
       8   app.use(express.json());
       9
      10 + // --- HEALTH CHECKS ---
      11 + app.get("/healthz", (req, res) => res.json({ status: "ok" }));
      12 + app.get("/livez", (req, res) => res.json({ status: "live" }));
      13 +
      14   const resolveMx = promisify(dns.resolveMx);
      15
      16   async function mineGitHubEmails(username) {

  ✓  Edit  index.js → Accepted (+1, -1)

      65     res.json({ emails: verifiedEmails });
      66   });
      67
      68 - const PORT = 3000;
      68 + const PORT = 5050;
      69   app.listen(PORT, () => console.log(`Enrichment Service running on port ${PORT}`));

  ✓  Edit  index.js → Accepted (+4, -0)

       5   const app = express();
       6   app.use(express.json());
       7
       8 + // --- HEALTH CHECKS ---
       9 + app.get("/healthz", (req, res) => res.json({ status: "ok" }));
      10 + app.get("/livez", (req, res) => res.json({ status: "live" }));
      11 +
      12   const groq = new Groq({
      13     apiKey: process.env.GROQ_API_KEY,
      14   });

  ✓  Edit  index.js → Accepted (+1, -1)

      44     }
      45   });
      46
      47 - const PORT = 3000;
      47 + const PORT = 4020;
      48   app.listen(PORT, () => console.log(`AI Swarm Service running on port ${PORT}`));

  ✓  Edit  index.js → Accepted (+4, -0)

       4   const app = express();
       5   app.use(express.json());
       6
       7 + // --- HEALTH CHECKS ---
       8 + app.get("/healthz", (req, res) => res.json({ status: "ok" }));
       9 + app.get("/livez", (req, res) => res.json({ status: "live" }));
      10 +
      11   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      12
      13   async function generatePitch(prompt) {

  ✓  Edit  index.js → Accepted (+1, -1)

      30     res.json({ meetingId, status: "pending", times: ["Mon 10am", "Tue 2pm"] });
      31   });
      32
      33 - const PORT = 3000;
      33 + const PORT = 8881;
      34   app.listen(PORT, () => console.log(`Outreach Service running on port ${PORT}`));



ℹ Some internal tool attempts failed before this final error. Press F12 for diagnostics, or run /settings and change "Error
  Verbosity" to full for details.
✕ [API Error: An unknown error occurred.]