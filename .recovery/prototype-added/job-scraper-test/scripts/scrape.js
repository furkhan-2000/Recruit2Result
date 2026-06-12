"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { scrapeAll } = require("../src/scrapers/adapters");

const outputPath = path.join(__dirname, "..", "output", "jobs.json");

async function main() {
  const result = await scrapeAll();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  console.log(`Saved ${result.jobs.length} jobs to ${outputPath}`);
  if (result.errors.length > 0) {
    console.warn("Some sources failed:");
    for (const error of result.errors) {
      console.warn(`- ${error.source}: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
