/**
 * GitHub Metadata Miner
 * Automatically pulls real emails from the "hidden" metadata in public code commits.
 */
import axios from "axios";

/**
 * Extracts emails from a user's public commits.
 * Most developers leave their personal email in commit metadata.
 */
export async function mineGitHubEmails(username, { token = null } = {}) {
  if (!username) return [];

  const headers = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    // 1. Get recent events
    const res = await axios.get(`https://api.github.com/users/${username}/events/public`, { headers });
    const events = res.data;
    const emails = new Set();

    for (const event of events) {
      if (event.type === "PushEvent" && event.payload.commits) {
        for (const commit of event.payload.commits) {
          if (commit.author && commit.author.email) {
            // Filter out common bot/placeholder emails
            const email = commit.author.email.toLowerCase();
            if (isValidRealEmail(email)) {
              emails.add(email);
            }
          }
        }
      }
    }

    return Array.from(emails);
  } catch (err) {
    console.error(`[GitHubMiner] Error mining emails for ${username}:`, err.message);
    return [];
  }
}

function isValidRealEmail(email) {
  const blacklist = ["users.noreply.github.com", "example.com", "local", "none"];
  if (!email.includes("@")) return false;
  return !blacklist.some(domain => email.includes(domain));
}
