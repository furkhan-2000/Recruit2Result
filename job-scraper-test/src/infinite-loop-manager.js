/**
 * Infinite Loop Manager
 * The central orchestrator for the Recruit2Result autonomous workflow.
 */
import { mineGitHubEmails } from "./enrichment/github-miner.js";
import { verifyEmail } from "./enrichment/contact-verifier.js";
import { auditCodeQuality } from "./ai/code-auditor.js";
import { analyzeCultureFit } from "./ai/psychometric-agent.js";
import { orchestrateDualOutreach } from "./outreach/dual-intent-agent.js";
import { createInterviewBridge } from "./outreach/scheduler-bridge.js";

export class InfiniteLoopManager {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Orchestrates the full recruitment lifecycle for a candidate.
   */
  async processCandidate(candidate, job, hrContact) {
    console.log(`[InfiniteLoop] Starting cycle for candidate: ${candidate.name}`);

    // 1. Deep Enrichment (GitHub)
    if (candidate.github) {
      console.log(`[InfiniteLoop] Mining GitHub for ${candidate.github}...`);
      const emails = await mineGitHubEmails(candidate.github);
      if (emails.length > 0) {
        candidate.enrichedEmails = emails;
        // Verify primary email
        const verification = await verifyEmail(emails[0]);
        candidate.emailVerified = verification.valid;
      }
    }

    // 2. AI Vetting (Code Audit & Psychometric)
    console.log(`[InfiniteLoop] Launching Intelligence Swarm...`);
    const [codeAudit, psychProfile] = await Promise.all([
      candidate.github ? auditCodeQuality(candidate.github, {}) : Promise.resolve(null),
      analyzeCultureFit({ ...candidate, job })
    ]);

    candidate.codeAudit = codeAudit;
    candidate.psychProfile = psychProfile;
    candidate.eliteScore = this.calculateEliteScore(codeAudit, psychProfile);

    // 3. Dual-Intent Outreach
    console.log(`[InfiniteLoop] Orchestrating Outreach...`);
    const outreach = await orchestrateDualOutreach(candidate, job, hrContact);

    // 4. The Bridge (Scheduling)
    console.log(`[InfiniteLoop] Preparing Scheduling Bridge...`);
    const bridge = await createInterviewBridge(candidate, hrContact, job);

    return {
      candidate,
      outreach,
      bridge,
      status: "cycle_complete"
    };
  }

  calculateEliteScore(codeAudit, psychProfile) {
    const codeScore = codeAudit?.score ?? 50;
    const cultureScore = psychProfile?.cultureFitScore ?? 50;
    return Math.round((codeScore * 0.6) + (cultureScore * 0.4));
  }
}
