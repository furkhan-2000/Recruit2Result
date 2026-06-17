/**
 * Human Simulation Utility
 * Provides realistic mouse movements (Bezier curves) and typing behavior.
 */
import { createCursor } from "ghost-cursor";

/**
 * Creates a human-like cursor for a page.
 */
export async function createHumanCursor(page) {
  return createCursor(page);
}

/**
 * Types text with human-like delays and "stutter" (random speed).
 */
export async function humanType(page, selector, text, { delayMin = 50, delayMax = 150 } = {}) {
  await page.waitForSelector(selector);
  await page.focus(selector);
  
  for (const char of text) {
    const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
    await page.type(selector, char, { delay });
  }
}

/**
 * Randomized human-like scroll.
 */
export async function humanScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          clearInterval(timer);
          resolve();
        }
      }, Math.floor(Math.random() * 200) + 100);
    });
  });
}
