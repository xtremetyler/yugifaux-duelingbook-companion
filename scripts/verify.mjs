import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const bundle = await readFile(resolve(root, "dist/yugifaux-companion.user.js"), "utf8");
const config = JSON.parse(await readFile(resolve(root, "config/companion.sample.json"), "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "config/animations.sample.json"), "utf8"));
const observerSource = await readFile(resolve(root, "src/event-observer.js"), "utf8");
const launcherSource = await readFile(resolve(root, "src/match-launcher.js"), "utf8");
const tokenMacrosSource = await readFile(resolve(root, "src/token-macros.js"), "utf8");
const chainMacrosSource = await readFile(resolve(root, "src/chain-macros.js"), "utf8");
const observerTests = {};
vm.runInNewContext(
  `${observerSource}\nglobalThis.observerTests = { classifyPublicLogLine, getNewLogText };`,
  observerTests
);
const launcherTestContext = {};
vm.runInNewContext(
  `${launcherSource}\nglobalThis.launcherTests = { LEAGUE_MATCH_DEFAULTS, validateMatchIdentifier };`,
  launcherTestContext
);
const tokenMacroTestContext = {
  APP: { ids: { tokenButton: "test-token-button", tokenModal: "test-token-modal", tokenToast: "test-token-toast" } }
};
vm.runInNewContext(
  `${tokenMacrosSource}\nglobalThis.tokenMacroTests = { BLOOM_TOKEN_VARIANTS, TOKEN_RECIPES, chooseDistinctTokenVariants, tokenCarrierFromUrl };`,
  tokenMacroTestContext
);
const chainMacroTestContext = {
  APP: { ids: { chainButton: "test-chain-button", chainMenu: "test-chain-menu", chainToast: "test-chain-toast" } }
};
vm.runInNewContext(
  `${chainMacrosSource}\nglobalThis.chainMacroTests = { CHAIN_LINKS, chainLinkMessage };`,
  chainMacroTestContext
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
assert(config.animations.some((item) => item.trigger?.cardName === "No Way Out!" && item.trigger.eventType === "effect-declaration"), "No Way Out effect-declaration trigger is missing");
assert(config.animations.some((item) => item.trigger?.cardName === "No Way Out!" && item.trigger.eventType === "activation"), "No Way Out Set activation trigger is missing");
assert(config.animations.some((item) => item.trigger?.cardName === "Iris the Radiant, the Celestial Eye of Infinite Reflections" && item.trigger.eventType === "effect-declaration"), "Iris effect-declaration trigger is missing");
assert(config.animations.some((item) => item.trigger?.cardName === "Sgt. Pepper's Lonely Hearts Club Band" && item.trigger.eventType === "effect-declaration"), "Sgt. Pepper effect-declaration trigger is missing");
assert(config.animations.some((item) => item.trigger?.cardName === "Painful Preference" && item.trigger.eventType === "activation"), "Painful Preference activation trigger is missing");
assert(config.animations.some((item) => item.presentation?.preset === "petal-bloom-v1"), "petal-bloom preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "arcane-bloom-v1"), "arcane-bloom preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "trap-chase-v1"), "trap-chase preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "celestial-excavate-v1"), "celestial-excavate preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "concert-rise-v1"), "concert-rise preset is missing");
assert(config.animations.some((item) => item.presentation?.preset === "ice-cream-choice-v1"), "ice-cream-choice preset is missing");
assert(bundle.includes("effect-declaration"), "effect declaration classifier is missing from the bundle");
assert(bundle.includes("res.cloudinary.com/vosvpv50"), "approved Ash Blossom asset is missing from the bundle");
assert(bundle.includes("v1787763973/polyflora.png"), "approved Polyflora asset is missing from the bundle");
assert(bundle.includes("v1787765186/i_want_to_animate_this_to_have.mp4"), "approved No Way Out video is missing from the bundle");
assert(bundle.includes("document.createElement(\"video\")"), "video playback support is missing from the bundle");
assert(bundle.includes("v1787768161/iriseff.png"), "approved Iris asset is missing from the bundle");
assert(bundle.includes("dhh7m81-c2929be0-8eda-42d9-840b-2ceb6ef6c44b.png"), "Iris card-back asset is missing from the bundle");
assert(bundle.includes("v1787769996/sgt._pepper.png"), "approved Sgt. Pepper asset is missing from the bundle");
assert(bundle.includes("v1787771135/painfulpref.png"), "approved Painful Preference asset is missing from the bundle");
assert(bundle.includes("class MatchLauncher"), "guided match launcher is missing from the bundle");
assert(bundle.includes("Confirm & Host"), "launcher confirmation gate is missing from the bundle");
assert(bundle.includes("YugiFAUX League Match - DM for info"), "approved league duel note is missing from the bundle");
assert(bundle.includes('formatValue: "cu"'), "Custom Cards host format is missing from the launcher");
assert(bundle.includes('matchTypeValue: "m"'), "2 out of 3 host type is missing from the launcher");
assert(bundle.includes("class TokenMacros"), "Token macro controller is missing from the bundle");
assert(bundle.includes("class ChainMacros"), "Chain macro controller is missing from the bundle");
assert(bundle.includes("Polyflora Hexbloom"), "Polyflora Token recipe is missing from the bundle");
assert(bundle.includes("Bloom Token"), "Bloom Token definition is missing from the bundle");
assert(bundle.includes("#duel .token_btn"), "native DuelingBook Token button integration is missing");
assert(!tokenMacrosSource.includes("Send("), "Token macros must not call DuelingBook's socket sender");
assert(!tokenMacrosSource.includes("view: window"), "sandboxed MouseEvents must not pass Tampermonkey's window wrapper as UIEvent.view");
assert(!tokenMacrosSource.includes("#field .yf-token-badge"), "field Token badges must not obscure or hang off rotated cards");
assert(!tokenMacrosSource.includes("#preview_txt.yf-token-preview-details"), "Token details must not override DuelingBook's shared preview styling");
assert(tokenMacrosSource.includes('document.getElementById("preview_txt")'), "custom Token details must use DuelingBook's readable preview panel");
assert(tokenMacrosSource.includes("#showTokenInNativePreview"), "custom Token artwork must be applied to DuelingBook's native preview");
assert(tokenMacrosSource.includes('preview.querySelector("img.pic")'), "custom Token artwork must target DuelingBook's native preview image");
assert(tokenMacrosSource.includes("[data-overlayscrollbars-viewport]"), "Token details must preserve DuelingBook's native scrollbar viewport");
assert(tokenMacrosSource.includes('document.addEventListener("mousemove"'), "Token preview must remain synchronized across the full field card");
assert(tokenMacrosSource.includes("repeat(2,minmax(0,160px))"), "Token confirmation artwork must remain compact");
assert(!chainMacrosSource.includes("Send("), "Chain macros must not call DuelingBook's socket sender");
assert(!chainMacrosSource.includes("unsafeWindow"), "Chain macros must not access DuelingBook page globals");
assert(chainMacrosSource.includes('#duel .cin_txt'), "Chain macros must use DuelingBook's visible duel chat input");
assert(chainMacrosSource.includes('new KeyboardEvent("keydown"'), "Chain macros must use DuelingBook's native Enter handler");
assert(chainMacrosSource.includes('font[message-id]'), "Chain flashes must synchronize from visible public chat messages");
assert(!chainMacrosSource.includes('document.addEventListener("pointerdown"'), "Chain menu must not be dismissed by DuelingBook pointer event propagation");
assert(!launcherSource.includes("GM."), "match launcher must not persist or transmit match identifiers");
assert(!launcherSource.includes("storage."), "match launcher must keep match identifiers out of storage");
assert(manifest.schemaVersion === 1, "sample animation manifest schemaVersion must be 1");
assert(manifest.animations.every((item) => item.trigger?.cardName), "each animation needs a card trigger");

const ashDeclaration = "Yugi declared the effect of Ash Blossom & Lonely Spring.";
const normalSummon = "Kaiba normal summoned Blue-Eyes White Dragon.";
const positionChange = "Kaiba changed Blue-Eyes White Dragon to Defense Position.";
const polyfloraDeclaration = "Yugi declared the effect of Polyflora Hexbloom.";
const noWayOutDeclaration = "Yugi declared the effect of No Way Out!.";
const noWayOutSetActivation = "Yugi Activated Set \"No Way Out!\".";
const irisDeclaration = "Yugi declared the effect of Iris the Radiant, the Celestial Eye of Infinite Reflections.";
const pepperDeclaration = "Yugi declared the effect of Sgt. Pepper's Lonely Hearts Club Band.";
const painfulPreferenceActivation = "Yugi Activated \"Painful Preference\".";
const { classifyPublicLogLine, getNewLogText } = observerTests.observerTests;
const { LEAGUE_MATCH_DEFAULTS, validateMatchIdentifier } = launcherTestContext.launcherTests;
const { BLOOM_TOKEN_VARIANTS, TOKEN_RECIPES, chooseDistinctTokenVariants, tokenCarrierFromUrl } = tokenMacroTestContext.tokenMacroTests;
const { CHAIN_LINKS, chainLinkMessage } = chainMacroTestContext.chainMacroTests;
assert(JSON.stringify([...CHAIN_LINKS]) === JSON.stringify([2, 3, 4, 5, 6, 7]), "Chain menu must provide links 2 through 7");
assert(chainLinkMessage(2) === "⛓️ Chain Link 2" && chainLinkMessage(7) === "⛓️ Chain Link 7", "Chain messages must use the approved emoji prefix");
assert(chainLinkMessage(1) === "" && chainLinkMessage(8) === "", "unsupported Chain Link messages must be rejected");
assert(validateMatchIdentifier(" YF-2026-001 ").identifier === "YF-2026-001", "valid match identifiers must be normalized");
assert(validateMatchIdentifier("   ").valid === false, "blank match identifiers must be rejected");
assert(validateMatchIdentifier("<script>").valid === false, "unsafe match identifier characters must be rejected");
assert(LEAGUE_MATCH_DEFAULTS.duelNote === "YugiFAUX League Match - DM for info", "league duel note must remain exact");
assert(LEAGUE_MATCH_DEFAULTS.formatValue === "cu" && LEAGUE_MATCH_DEFAULTS.matchTypeValue === "m", "league format defaults must remain fixed");
const deterministicVariants = chooseDistinctTokenVariants(BLOOM_TOKEN_VARIANTS, 2, () => 0);
assert(deterministicVariants.length === 2, "Polyflora must select two Token artworks");
assert(deterministicVariants[0].carrierId !== deterministicVariants[1].carrierId, "Polyflora Token artwork selection must not contain duplicates");
assert(TOKEN_RECIPES[0]?.count === 2 && TOKEN_RECIPES[0]?.token?.position === "Defense", "Polyflora must summon exactly two Defense Position Tokens");
const dragonScrollRecipe = TOKEN_RECIPES.find((recipe) => recipe.sourceName === "The Dragon Scroll");
assert(dragonScrollRecipe?.count === 1, "The Dragon Scroll must summon exactly one Token");
assert(dragonScrollRecipe?.token?.name === "Dragon Warrior Token", "The Dragon Scroll Token name is missing");
assert(dragonScrollRecipe?.token?.level === 1 && dragonScrollRecipe?.token?.attribute === "LIGHT", "Dragon Warrior Token Level or Attribute is incorrect");
assert(dragonScrollRecipe?.token?.monsterType === "Warrior / Tuner", "Dragon Warrior Token type and Tuner status are incorrect");
assert(dragonScrollRecipe?.variants?.[0]?.carrierId === 7, "Dragon Warrior Token must use its reserved native carrier");
assert(tokenCarrierFromUrl("https://images.duelingbook.com/tokens/6.jpg") === 6, "native Token carrier URLs must be recognized");
assert(tokenCarrierFromUrl("https://res.cloudinary.com/example/token.jpg") === null, "non-DuelingBook artwork must not be treated as a carrier");
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
assert(
  classifyPublicLogLine(getNewLogText(polyfloraDeclaration, `${polyfloraDeclaration}\n${noWayOutDeclaration}`))?.type === "effect-declaration",
  "a newly appended No Way Out declaration must remain detectable"
);
assert(
  classifyPublicLogLine(getNewLogText(noWayOutDeclaration, `${noWayOutDeclaration}\n${noWayOutSetActivation}`))?.type === "activation",
  "an Activated Set No Way Out line must be classified as an activation"
);
assert(
  classifyPublicLogLine(getNewLogText(noWayOutSetActivation, `${noWayOutSetActivation}\n${irisDeclaration}`))?.type === "effect-declaration",
  "a newly appended Iris declaration must remain detectable"
);
assert(
  classifyPublicLogLine(getNewLogText(irisDeclaration, `${irisDeclaration}\n${pepperDeclaration}`))?.type === "effect-declaration",
  "a newly appended Sgt. Pepper declaration must remain detectable"
);
assert(
  classifyPublicLogLine(getNewLogText(pepperDeclaration, `${pepperDeclaration}\n${painfulPreferenceActivation}`))?.type === "activation",
  "an Activated Painful Preference line must be classified as an activation"
);

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Verification passed: metadata, schemas, and safety invariants are valid.");
}
