/**
 * Token Optimization Utilities
 * Focused on reducing token consumption for LLM calls.
 */

/**
 * Clean and truncate text to minimize tokens while preserving core meaning.
 */
export function optimizeText(text, limit = 1500) {
  if (!text) return "";

  let cleaned = text
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Remove common job board boilerplate (EEO, "About Us", etc.)
    .replace(/\b(equal opportunity employer|affirmative action|eeo|disability|veteran)\b.*/gi, "")
    // Remove multiple spaces and newlines
    .replace(/\s+/g, " ")
    .trim();

  // Strict truncation
  if (cleaned.length > limit) {
    cleaned = cleaned.substring(0, limit) + "...";
  }

  return cleaned;
}

/**
 * Local Guard: Should we even call the AI?
 * Returns true if the local pre-score is high enough.
 */
export function shouldInvokeAI(localScore, threshold = 40) {
  return localScore >= threshold;
}

/**
 * Minify prompt instructions for the system role.
 */
export function getMinifiedSystemPrompt() {
  return `Role:Digital Headhunter. Task:Evaluate Elite Fit (0-100). Input:JSON{job,resume}. Output:JSON{score,reason(1 elite sentence)}. Focus on leadership & high-value skills.`;
}
