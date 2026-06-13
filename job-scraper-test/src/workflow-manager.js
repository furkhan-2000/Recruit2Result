/**
 * Coordination Agent (Workflow Manager)
 * Bridges the gap between Job Extraction and HR Discovery.
 */

import { runHrSearchJob, runCompanyDiscoveryJob } from "../../HR Finding Automation/server/linkedinScraper.js";
import { generateOutreach } from "./ai-intelligence.js";

/**
 * Automatically triggers an HR search for a high-scoring job.
 */
export async function autoBridgeToHR(job, onLog) {
  onLog("info", `Coordination Agent: High-match detected (${job.qualityScore}%). Bridging to HR Discovery...`, job.company);
  
  try {
    // Step 1: Discover the company on LinkedIn
    const discovery = await runCompanyDiscoveryJob({
      companyQuery: job.company,
      companyLimit: 1,
      onLog: (level, msg, detail) => onLog(level, `[Discovery] ${msg}`, detail)
    });

    if (!discovery.companies || discovery.companies.length === 0) {
      onLog("warn", "Coordination Agent: Could not uniquely identify company on LinkedIn.", job.company);
      return null;
    }

    const targetCompany = discovery.companies[0];

    // Step 2: Find HR Contacts
    const hrResults = await runHrSearchJob({
      selectedCompanies: [targetCompany],
      hrPerCompany: 3,
      onLog: (level, msg, detail) => onLog(level, `[HR Search] ${msg}`, detail)
    });

    // Step 3: Generate Outreach for found contacts
    const enrichedResults = hrResults.results.map(res => ({
      ...res,
      people: res.people.map(person => ({
        ...person,
        outreachDraft: generateOutreach(job, person.personName)
      }))
    }));

    onLog("success", `Coordination Agent: Successfully bridged ${job.company}. Found ${enrichedResults[0]?.people?.length ?? 0} HR contacts with outreach drafts ready.`, job.company);
    
    return enrichedResults;
  } catch (err) {
    onLog("error", "Coordination Agent: Bridge failed", err.message);
    return null;
  }
}
