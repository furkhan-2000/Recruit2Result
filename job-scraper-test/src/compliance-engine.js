/**
 * Compliance & Privacy Engine
 * Tracks data processing activities for GDPR/CCPA compliance.
 */
import { appendFileSync } from "fs";
import { join } from "path";

const LOG_PATH = "C:/Users/furkh/OneDrive/Documents/projects/Recruit2Result/job-scraper-test/output/compliance.log";

/**
 * Logs a data processing event for privacy auditing.
 */
export function logComplianceEvent(candidateId, action, reason) {
  const event = {
    timestamp: new Date().toISOString(),
    candidateId,
    action,
    reason,
    legalBasis: "Legitimate Interest (Recruitment)"
  };
  
  try {
    appendFileSync(LOG_PATH, JSON.stringify(event) + "\n");
  } catch (err) {
    console.error("[Compliance] Failed to log event:", err.message);
  }
}
