import puppeteer from "puppeteer";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Registry to track active browsers for clean closure on process exit.
 * Prevents "zombie" Chrome processes.
 */
const browserRegistry = new Set();

process.on("exit", () => {
  for (const b of browserRegistry) {
    try { b.close(); } catch (e) {}
  }
});

process.on("SIGINT", async () => {
  for (const b of browserRegistry) {
    try { await b.close(); } catch (e) {}
  }
  process.exit(0);
});

export async function launchBrowser({ headless, proxyServer } = {}) {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled", // Stealth: hide automation
    "--disable-features=IsolateOrigins,site-per-process",
    "--window-size=1920,1080",
  ];

  if (proxyServer) {
    args.push(`--proxy-server=${proxyServer}`);
  }

  const browser = await puppeteer.launch({
    headless: headless ? "shell" : false,
    args,
    defaultViewport: { width: 1366, height: 900 },
  });

  browserRegistry.add(browser);
  browser.once("disconnected", () => browserRegistry.delete(browser));

  return browser;
}

export async function newPage(browser, { proxyAuth } = {}) {
  const page = await browser.newPage();
  return setupPage(page, { proxyAuth });
}

export async function setupPage(page, { proxyAuth } = {}) {
  if (proxyAuth?.username && proxyAuth?.password) {
    await page.authenticate({
      username: proxyAuth.username,
      password: proxyAuth.password,
    });
  }

  // Stealth: Mask fingerprint
  await page.setUserAgent(USER_AGENT);
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.google.com/",
  });

  // Stealth: Extra navigator protections
  await page.evaluateOnNewDocument(() => {
    // Hide webdriver
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    // Mock chrome object
    window.chrome = { runtime: {} };

    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters);

    // Mock plugins
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
  });

  return page;
}

export async function goto(page, url, { timeout = 45000 } = {}) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout,
  });

  await sleep(2000);

  return {
    status: response?.status() ?? null,
    finalUrl: page.url(),
  };
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
