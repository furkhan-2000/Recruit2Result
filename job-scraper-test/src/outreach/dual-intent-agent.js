/**
 * Dual-Intent Outreach Agent
 * Simultaneously messages HR and Candidates with personalized pitches.
 */
import { getGroqCompletion } from "../groq-service.js";

/**
 * Generates and orchestrates dual-intent outreach.
 */
export async function orchestrateDualOutreach(candidate, job, hrContact) {
  const candidatePitch = await generateCandidatePitch(candidate, job);
  const hrDossierPitch = await generateHRDossierPitch(candidate, hrContact, job);

  // In production, this would trigger Email/LinkedIn API calls.
  return {
    candidate: {
      recipient: candidate.email || candidate.name,
      pitch: candidatePitch,
      status: "ready_to_send"
    },
    hr: {
      recipient: hrContact.email || hrContact.company,
      pitch: hrDossierPitch,
      status: "ready_to_send"
    }
  };
}

async function generateCandidatePitch(candidate, job) {
  const prompt = `
    Write a highly personalized, non-spammy outreach message to a candidate.
    Candidate: ${candidate.name}
    Job: ${job.title} at ${job.company}
    Why them: Mention their specific skills or GitHub highlights.
    Goal: Get them interested in a discovery call.
    Tone: Professional, elite, and exciting.
  `;
  return getGroqCompletion(prompt, { model: "llama3-70b-8192" });
}

async function generateHRDossierPitch(candidate, hrContact, job) {
  const prompt = `
    Write a compelling "Digital Headhunter" pitch to an HR/Hiring Manager.
    HR: ${hrContact.name || "Hiring Manager"}
    Candidate: ${candidate.name} (Score: ${candidate.eliteScore}/100)
    Job: ${job.title}
    Highlight: Why this candidate is a perfect fit based on their technical audit and psychometric profile.
    Goal: Request a review of the attached dossier and schedule an interview.
  `;
  return getGroqCompletion(prompt, { model: "llama3-70b-8192" });
}
