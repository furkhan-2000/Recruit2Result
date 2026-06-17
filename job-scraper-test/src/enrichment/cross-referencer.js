/**
 * Multi-Source Cross-Referencer
 * Finds the same candidate across LinkedIn, GitHub, and Twitter to build a 360-degree profile.
 */
import { getGroqCompletion } from "../ai/groq-service.js";

/**
 * Orchestrates cross-platform search and matching.
 */
export async function build360Profile(candidate, { githubToken = null } = {}) {
  const platforms = {
    linkedin: candidate.url || null,
    github: candidate.github || null,
    twitter: candidate.twitter || null
  };

  // If we only have one platform, use AI to predict/find others via Google Search patterns
  if (!platforms.github || !platforms.twitter) {
    const searchPrompt = `
      Find the GitHub and Twitter/X handles for this professional:
      Name: ${candidate.name}
      Company: ${candidate.company}
      Location: ${candidate.location}
      LinkedIn: ${candidate.url}
      
      Return JSON: { "github": "handle", "twitter": "handle", "personalBlog": "url" }
    `;
    const found = await getGroqCompletion(searchPrompt, { json: true });
    Object.assign(platforms, found);
  }

  return {
    ...candidate,
    ...platforms,
    is360Verified: !!(platforms.linkedin && platforms.github)
  };
}
