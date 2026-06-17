import express from "express";
import axios from "axios";
import dns from "dns";
import { promisify } from "util";
import net from "net";

const app = express();
app.use(express.json());

// --- HEALTH CHECKS ---
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
app.get("/livez", (req, res) => res.json({ status: "live" }));

const resolveMx = promisify(dns.resolveMx);

async function mineGitHubEmails(username) {
  try {
    const res = await axios.get(`https://api.github.com/users/${username}/events/public`);
    const emails = new Set();
    for (const event of res.data) {
      if (event.type === "PushEvent" && event.payload.commits) {
        for (const commit of event.payload.commits) {
          if (commit.author?.email && !commit.author.email.includes("noreply")) {
            emails.add(commit.author.email.toLowerCase());
          }
        }
      }
    }
    return Array.from(emails);
  } catch (err) { return []; }
}

async function verifyEmail(email) {
  const domain = email.split("@")[1];
  try {
    const addresses = await resolveMx(domain);
    if (!addresses || addresses.length === 0) return false;
    addresses.sort((a, b) => a.priority - b.priority);
    const mxHost = addresses[0].exchange;
    return new Promise((resolve) => {
      const socket = net.createConnection(25, mxHost);
      let step = 0;
      socket.setEncoding("ascii");
      socket.setTimeout(5000);
      socket.on("data", (data) => {
        if (data.indexOf("220") === 0 && step === 0) { socket.write("HELO recruit2result.com\r\n"); step++; }
        else if (data.indexOf("250") === 0 && step === 1) { socket.write("MAIL FROM:<verify@recruit2result.com>\r\n"); step++; }
        else if (data.indexOf("250") === 0 && step === 2) { socket.write(`RCPT TO:<${email}>\r\n`); step++; }
        else if (step === 3) { resolve(data.indexOf("250") === 0); socket.write("QUIT\r\n"); socket.end(); }
      });
      socket.on("error", () => resolve(false));
      socket.on("timeout", () => { socket.destroy(); resolve(false); });
    });
  } catch (err) { return false; }
}

app.post("/enrich", async (req, res) => {
  const { github } = req.body;
  if (!github) return res.status(400).json({ error: "No github handle" });
  const emails = await mineGitHubEmails(github);
  const verifiedEmails = [];
  for (const email of emails) {
    if (await verifyEmail(email)) verifiedEmails.push(email);
  }
  res.json({ emails: verifiedEmails });
});

const PORT = 5050;
app.listen(PORT, () => console.log(`Enrichment Service running on port ${PORT}`));
