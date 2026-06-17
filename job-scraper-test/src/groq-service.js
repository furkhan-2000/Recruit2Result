import Groq from "groq-sdk";
import pRetry from "p-retry";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { getSecret } from "./secrets-manager.js";

const groq = new Groq({
  apiKey: getSecret("GROQ_API_KEY"),
});

const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Resilient call to Groq API with retries and timeouts.
 */
export async function callGroq(messages, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.1,
    max_tokens = 500,
    response_format = { type: "json_object" },
  } = options;

  const run = async () => {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens,
        response_format,
      });

      return completion.choices[0]?.message?.content;
    } catch (error) {
      // Handle rate limits (429) specifically if needed
      if (error.status === 429) {
        console.warn("Groq API Rate Limit hit. Retrying...");
      }
      throw error; // Let p-retry handle the rest
    }
  };

  try {
    return await pRetry(run, {
      retries: 3,
      onFailedAttempt: (error) => {
        console.warn(
          `Groq attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    });
  } catch (error) {
    console.error("Groq API failed after all retries:", error.message);
    return null;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const usagePath = join(__dirname, "..", "output", "intelligence", "token-usage.json");

/**
 * Usage tracker for production monitoring
 */
export function logTokenUsage(promptTokens, completionTokens) {
  try {
    mkdirSync(dirname(usagePath), { recursive: true });
    
    let stats = { totalPrompt: 0, totalCompletion: 0, history: [] };
    if (existsSync(usagePath)) {
      stats = JSON.parse(readFileSync(usagePath, "utf8"));
    }

    stats.totalPrompt += promptTokens;
    stats.totalCompletion += completionTokens;
    stats.history.push({
      t: new Date().toISOString(),
      p: promptTokens,
      c: completionTokens
    });

    // Keep history to last 100 entries
    if (stats.history.length > 100) stats.history.shift();

    writeFileSync(usagePath, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error("Failed to log token usage:", e.message);
  }
}

/**
 * Enterprise Candidate Scoring
 * Evaluates a candidate against job requirements.
 * Returns { score: 0-100, reason: string }
 */
export async function scoreCandidate(candidate, jobRequirements) {
  const messages = [
    {
      role: "system",
      content: `You are an Elite Executive Recruiter. Your task is to score a candidate against specific job requirements.
Return a JSON object with:
- "score": A number between 0 and 100 representing the match percentage.
- "reason": A one-sentence "Why this candidate?" summary.

Be extremely critical. Only 90+ for perfect matches.`
    },
    {
      role: "user",
      content: JSON.stringify({
        candidate: {
          skills: candidate.skills,
          experience: candidate.experience,
          currentRole: candidate.currentRole
        },
        requirements: jobRequirements
      })
    }
  ];

  const response = await callGroq(messages, {
    model: "llama3-70b-8192", // Using a capable model for scoring
    temperature: 0.2
  });

  if (response) {
    try {
      const parsed = JSON.parse(response);
      return {
        score: parsed.score || 0,
        reason: parsed.reason || "Unable to determine match reason."
      };
    } catch (e) {
      console.error("Failed to parse scoring response:", e.message);
    }
  }

  return { score: 0, reason: "AI scoring failed." };
}

/**
 * Simple helper for generating text completions with Groq.
 */
export async function getGroqCompletion(prompt, { model = "llama3-70b-8192", json = false } = {}) {
  const messages = [{ role: "user", content: prompt }];
  const response = await callGroq(messages, {
    model,
    response_format: json ? { type: "json_object" } : null
  });

  if (json && response) {
    try {
      return JSON.parse(response);
    } catch (e) {
      console.error("Failed to parse JSON response:", e.message);
      return null;
    }
  }
  return response;
}
