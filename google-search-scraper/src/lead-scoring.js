import Groq from "groq-sdk";
import { getSecret } from "./secrets-manager.js";

const groq = new Groq({
  apiKey: getSecret("GROQ_API_KEY"),
});

/**
 * Score a search result as a potential B2B lead.
 */
export async function scoreLead(result) {
  try {
    const messages = [
      {
        role: "system",
        content: `You are a B2B Sales Intelligence Agent. Score the search result based on its potential as a high-value recruitment or software lead.
Return JSON: { "score": 0-100, "reason": "Why this lead?" }`
      },
      {
        role: "user",
        content: JSON.stringify(result)
      }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama3-70b-8192",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      score: parsed.score || 0,
      reason: parsed.reason || "Unable to determine lead value."
    };
  } catch (error) {
    console.error("Lead scoring failed:", error.message);
    return { score: 0, reason: "AI scoring failed." };
  }
}
