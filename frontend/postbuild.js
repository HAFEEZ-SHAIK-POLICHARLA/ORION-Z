import fs from "node:fs";

const routes = [
  "threatlab",
  "lab-results",
  "threats",
  "dashboard",
  "realtime",
  "system-health",
];

for (const route of routes) {
  try {
    fs.copyFileSync("dist/index.html", `dist/${route}.html`);
  } catch (err) {
    console.error(`Failed to copy index.html to dist/${route}.html:`, err);
  }
}
