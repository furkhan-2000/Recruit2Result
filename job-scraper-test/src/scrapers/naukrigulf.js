import { launchBrowser, newPage, goto, sleep } from "./browser.js";
import { detectBlock } from "./detect-block.js";

export async function extractNaukrigulfJobsFromPage(page) {
  return await page.evaluate(() => {
    const jobCards = document.querySelectorAll(".ng-job-card, .job-card, [data-job-id]");
    const results = [];

    jobCards.forEach(card => {
      try {
        const titleEl = card.querySelector(".job-title, h2, h3, .title");
        const companyEl = card.querySelector(".company-name, .info-org, .org");
        const locationEl = card.querySelector(".location, .info-loc, .loc");
        const linkEl = card.querySelector("a[href*='/job-']");

        if (titleEl) {
          results.push({
            title: titleEl.innerText.trim(),
            company: companyEl ? companyEl.innerText.trim() : "Unknown",
            location: locationEl ? locationEl.innerText.trim() : "Unknown",
            url: linkEl ? linkEl.href : window.location.href,
            source: "naukrigulf"
          });
        }
      } catch (e) {}
    });

    return results;
  });
}

export async function scrapeNaukrigulf({
  searchUrl,
  quantity,
  headless = true,
  onEvent,
  proxyManager = null,
}) {
  const emit = (type, data) => onEvent?.({ type, ...data });
  const site = "naukrigulf";

  let proxyRotation = null;
  if (proxyManager) {
    proxyRotation = proxyManager.rotateForSite(site);
    emit("status", { message: `Using proxy for ${site}...`, phase: "init" });
  }

  const browser = await launchBrowser({
    headless,
    proxyServer: proxyRotation?.proxyServer,
  });

  const page = await newPage(browser, {
    proxyAuth: proxyRotation ? { username: proxyRotation.username, password: proxyRotation.password } : undefined
  });

  const collected = [];
  const seen = new Set();

  try {
    emit("status", { message: `Navigating to Naukrigulf...`, phase: "navigate" });
    const nav = await goto(page, searchUrl);

    if (nav.status === 403 || nav.status === 429) {
      throw new Error(`Blocked by Naukrigulf (HTTP ${nav.status})`);
    }

    const block = await detectBlock(page);
    if (block.blocked) {
      throw new Error(`Bot detection triggered on Naukrigulf: ${block.reasons.join(", ")}`);
    }

    // Wait for jobs to appear
    await page.waitForSelector(".ng-job-card, .job-card, .job-title", { timeout: 15000 }).catch(() => {});

    let stagnantRounds = 0;
    while (collected.length < quantity && stagnantRounds < 10) {
      const batch = await extractNaukrigulfJobsFromPage(page);
      let newInRound = 0;

      for (const job of batch) {
        const key = job.url || `${job.title}|${job.company}`;
        if (!seen.has(key)) {
          seen.add(key);
          collected.push({
            ...job,
            id: collected.length + 1,
            collectedAt: new Date().toISOString()
          });
          newInRound++;
          emit("progress", { site, current: collected.length, total: quantity, job });
          if (collected.length >= quantity) break;
        }
      }

      if (collected.length >= quantity) break;

      if (newInRound === 0) {
        stagnantRounds++;
        // Try to find "Next" button
        const nextButton = await page.$(".next, .pagination-next, [aria-label='Next']");
        if (nextButton) {
          emit("status", { message: "Moving to next page...", phase: "paginate" });
          await nextButton.click();
          await sleep(3000);
          await page.waitForSelector(".ng-job-card, .job-card, .job-title", { timeout: 10000 }).catch(() => {});
        } else {
          // Try scrolling
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await sleep(1500);
        }
      } else {
        stagnantRounds = 0;
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await sleep(1000);
      }
    }

    return { site, jobs: collected, ok: collected.length > 0 };
  } catch (err) {
    emit("error", { site, message: err.message });
    return { site, jobs: collected, ok: false, error: err.message };
  } finally {
    await browser.close().catch(() => {});
  }
}
