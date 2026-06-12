"use strict";

const http = require("node:http");

const url = new URL(process.env.PORT ? `http://localhost:${process.env.PORT}/api/health` : "http://localhost:4173/api/health");

const request = http.get(url, (response) => {
  let body = "";
  response.setEncoding("utf8");
  response.on("data", (chunk) => {
    body += chunk;
  });
  response.on("end", () => {
    if (response.statusCode !== 200) {
      console.error(`Health check failed: HTTP ${response.statusCode}`);
      process.exitCode = 1;
      return;
    }

    console.log(body);
  });
});

request.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
