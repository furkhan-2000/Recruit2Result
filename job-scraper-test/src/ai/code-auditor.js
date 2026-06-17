/**
 * Code Auditor Agent
 * AI that "reads" a candidate's GitHub code and gives a quality rating.
 */
import { getGroqCompletion } from "../groq-service.js";

/**
 * Audits a repository's quality using Groq AI.
 */
export async function auditCodeQuality(repoUrl, repoMetadata) {
  const prompt = `
    You are an Elite Technical Recruiter and Senior Architect. 
    Review the following repository data for a candidate:
    URL: ${repoUrl}
    Metadata: ${JSON.stringify(repoMetadata)}

    Evaluate the following:
    1. Code Architecture (Clean code, design patterns).
    2. Documentation (README quality, comments).
    3. Technical Complexity.
    4. Best Practices (Testing, CI/CD).

    Provide a Score (0-100) and a concise technical summary of why this candidate is a "Rockstar" or not.
    Return JSON format: { "score": number, "summary": "string", "strengths": [], "weaknesses": [] }
  `;

  try {
    const result = await getGroqCompletion(prompt, { model: "llama3-70b-8192", json: true });
    return result;
  } catch (err) {
    console.error(`[CodeAuditor] Error auditing ${repoUrl}:`, err.message);
    return { score: 0, summary: "Error auditing code.", strengths: [], weaknesses: [] };
  }
}
