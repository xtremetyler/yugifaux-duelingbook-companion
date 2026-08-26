import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  "src/header.js",
  "src/bootstrap.js",
  "src/diagnostics.js",
  "src/storage.js",
  "src/config.js",
  "src/event-observer.js",
  "src/animation-player.js",
  "src/match-launcher.js",
  "src/token-macros.js",
  "src/ui.js",
  "src/main.js",
  "src/footer.js"
];

const chunks = await Promise.all(
  sources.map((source) => readFile(resolve(projectRoot, source), "utf8"))
);

const output = `${chunks.map((chunk) => chunk.trimEnd()).join("\n\n")}\n`;
const outputPath = resolve(projectRoot, "dist/yugifaux-companion.user.js");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, "utf8");
console.log(`Built ${outputPath}`);
