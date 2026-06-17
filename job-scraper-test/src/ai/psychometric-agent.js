/**
 * Psychometric Profiler Agent
 * AI that analyzes public writing to predict "Culture Fit" and "Leadership Potential".
 */
import { getGroqCompletion } from "../groq-service.js";

/**
 * Analyzes candidate text (blogs, social posts, resume) for psychometric insights.
 */
export async function analyzeCultureFit(candidateData) {
  const prompt = `
    Analyze the following candidate data to predict culture fit and leadership potential:
    Data: ${JSON.stringify(candidateData)}

    Focus on:
    1. Communication Style (Direct, empathetic, professional).
    2. Leadership Potential (Mentoring, project ownership).
    3. Adaptability & Learning Mindset.
    4. Mission Alignment.

    Provide a concise profile.
    Return JSON format: { "cultureFitScore": number, "leadershipPotential": "High|Medium|Low", "traits": [], "recommendation": "string" }
  `;

  try {
    const result = await getGroqCompletion(prompt, { model: "llama3-70b-8192", json: true });
    return result;
  } catch (err) {
    console.error(`[PsychometricAgent] Error analyzing candidate:`, err.message);
    return { cultureFitScore: 0, leadershipPotential: "Unknown", traits: [], recommendation: "Analysis failed." };
  }
}
