/**
 * AI Intelligence Module for AiJobs
 * Handles job matching, scoring, and automated outreach generation using Groq.
 */

import { callGroq } from "./groq-service.js";
import { optimizeText, shouldInvokeAI, getMinifiedSystemPrompt } from "./token-utils.js";
import { hasSecret } from "./secrets-manager.js";

const AI_CONFIG = {
  hasGroq: hasSecret("GROQ_API_KEY"),
};

/**
 * Intelligent Job Scoring using Groq (gpt-oss-120b)
 */
export async function scoreJob(job, resumeKeywords = []) {
  // 1. Local Pre-Score (Zero-Token Guard)
  const text = `${job.title} ${job.company} ${job.description ?? ""}`.toLowerCase();
  let localScore = 0;
  
  if (resumeKeywords.length) {
    for (const kw of resumeKeywords) {
      if (text.includes(kw.toLowerCase())) {
        localScore += 10;
      }
    }
  } else {
    localScore = 50; // Neutral fallback
  }

  const result = {
    localScore: Math.min(100, localScore),
    aiScore: null,
    aiReason: null,
  };

  // 2. AI Scoring (Only if local score is high enough)
  if (AI_CONFIG.hasGroq && shouldInvokeAI(result.localScore)) {
    const cleanDescription = optimizeText(job.description);
    
    const messages = [
      { role: "system", content: getMinifiedSystemPrompt() },
      { 
        role: "user", 
        content: JSON.stringify({
          job: { title: job.title, desc: cleanDescription },
          resume: resumeKeywords.join(", ")
        })
      }
    ];

    const aiResponse = await callGroq(messages);
    
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        result.aiScore = parsed.score;
        result.aiReason = parsed.reason;
      } catch (e) {
        console.error("Failed to parse AI response:", e.message);
      }
    }
  }

  return result;
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
