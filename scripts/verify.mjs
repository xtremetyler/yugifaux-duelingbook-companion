import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bundle = await readFile(resolve(root, "dist/yugifaux-companion.user.js"), "utf8");
const config = JSON.parse(await readFile(resolve(root, "config/companion.sample.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "config/animations.sample.json"), "utf8"));

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(bundle.startsWith("// ==UserScript=="), "bundle is missing its userscript header");
assert(!bundle.includes("@connect      *"), "wildcard @connect permission is forbidden");
assert(!/\beval\s*\(|\bnew\s+Function\s*\(/.test(bundle), "dynamic code execution is forbidden");
assert(!/document\.cookie|localStorage\s*\[/.test(bundle), "credential-adjacent browser storage access is forbidden");
assert(config.schemaVersion === 1, "sample config schemaVersion must be 1");
assert(Array.isArray(config.animations) && config.animations.length > 0, "sample config needs a test animation");
assert(manifest.schemaVersion === 1, "sample animation manifest schemaVersion must be 1");
assert(manifest.animations.every((item) => item.trigger?.cardName), "each animation needs a card trigger");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verification passed: metadata, schemas, and safety invariants are valid.");
}
