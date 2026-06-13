/**
 * AI Intelligence Module for AiJobs
 * Handles job matching, scoring, and automated outreach generation.
 */

import { loadProxyEnv } from "./nodemaven-proxy.js";
loadProxyEnv();

const AI_CONFIG = {
  geminiKey: process.env.GEMINI_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
};

/**
 * Mock AI Scoring (can be extended to use real LLMs)
 */
export async function scoreJob(job, resumeKeywords = []) {
  if (!resumeKeywords.length) return 50; // Default middle score

  const text = `${job.title} ${job.company} ${job.description ?? ""}`.toLowerCase();
  let score = 0;
  
  for (const kw of resumeKeywords) {
    if (text.includes(kw.toLowerCase())) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

/**
 * Generate a personalized outreach message.
 */
export async function generateOutreach(job, candidateName = "Candidate") {
  return `Hi Hiring Team at ${job.company},\n\nI'm ${candidateName}, and I'm very interested in the ${job.title} position I found on ${job.site}. I'm impressed by your company's work and would love to discuss how my skills can contribute to your team.\n\nBest regards,\n${candidateName}`;
}

/**
 * Generate a tailored cover letter.
 */
export async function generateCoverLetter(job, resumeSummary) {
  return `Subject: Application for ${job.title} at ${job.company}\n\nDear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${job.title} position at ${job.company}. With a background in ${resumeSummary}, I am confident that my experience aligns perfectly with the requirements of this role.\n\n[Tailored Content Placeholder]\n\nThank you for your time and consideration.\n\nSincerely,\nCandidate`;
}
