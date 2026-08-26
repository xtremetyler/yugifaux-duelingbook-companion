import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const bundle = await readFile(resolve(root, "dist/yugifaux-companion.user.js"), "utf8");
const config = JSON.parse(await readFile(resolve(root, "config/companion.sample.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "config/animations.sample.json"), "utf8"));
const observerSource = await readFile(resolve(root, "src/event-observer.js"), "utf8");
const observerTests = {};
vm.runInNewContext(
  `${observerSource}\nglobalThis.observerTests = { classifyPublicLogLine, getNewLogText };`,
  observerTests
);

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
assert(config.animations.some((item) => item.trigger?.cardName === "Ash Blossom & Lonely Spring"), "Ash Blossom overlay trigger is missing");
assert(config.animations.some((item) => item.trigger?.cardName === "Polyflora Hexbloom"), "Polyflora overlay trigger is missing");
assert(config.animations.some((item) => item.presentation?.preset === "petal-bloom-v1"), "petal-bloom preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "arcane-bloom-v1"), "arcane-bloom preset is missing");
assert(bundle.includes("effect-declaration"), "effect declaration classifier is missing from the bundle");
assert(bundle.includes("res.cloudinary.com/vosvpv50"), "approved Ash Blossom asset is missing from the bundle");
assert(bundle.includes("v1787763973/polyflora.png"), "approved Polyflora asset is missing from the bundle");
assert(manifest.schemaVersion === 1, "sample animation manifest schemaVersion must be 1");
assert(manifest.animations.every((item) => item.trigger?.cardName), "each animation needs a card trigger");

const ashDeclaration = "Yugi declared the effect of Ash Blossom & Lonely Spring.";
const normalSummon = "Kaiba normal summoned Blue-Eyes White Dragon.";
const positionChange = "Kaiba changed Blue-Eyes White Dragon to Defense Position.";
const polyfloraDeclaration = "Yugi declared the effect of Polyflora Hexbloom.";
const { classifyPublicLogLine, getNewLogText } = observerTests.observerTests;
assert(
  classifyPublicLogLine(getNewLogText(ashDeclaration, `${ashDeclaration}\n${normalSummon}`))?.type === "normal-summon",
  "a summon after Ash Blossom must not replay the Ash overlay"
);
assert(
  classifyPublicLogLine(getNewLogText(`${ashDeclaration}\n${normalSummon}`, `${ashDeclaration}\n${normalSummon}\n${positionChange}`)) === null,
  "a position change after Ash Blossom must not replay the Ash overlay"
);
assert(
  classifyPublicLogLine(getNewLogText(normalSummon, `${normalSummon}\n${ashDeclaration}`))?.type === "effect-declaration",
  "a newly appended Ash Blossom declaration must remain detectable"
);
assert(
  classifyPublicLogLine(getNewLogText(ashDeclaration, `${ashDeclaration}\n${polyfloraDeclaration}`))?.type === "effect-declaration",
  "a newly appended Polyflora declaration must remain detectable"
);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verification passed: metadata, schemas, and safety invariants are valid.");
}
