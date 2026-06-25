const fs = require("fs");
const path = require("path");

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function fail(message, details = []) {
  console.error(`LAM special palette validation failed: ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function main() {
  const generation = readJson("config/lam_generation_rules.json");
  const rarity = readJson("config/lam_rarity_rules.json");
  const palette = readJson("config/lam_special_backgrounds.json");
  const errors = [];
  const backgrounds = palette.backgrounds || [];

  if (fs.existsSync(path.join(root, "config", "lam_special_archetypes.json"))) {
    errors.push("config/lam_special_archetypes.json should be removed; only lam_special_backgrounds.json is kept");
  }

  if (palette.count !== backgrounds.length) {
    errors.push(`palette count ${palette.count} does not match background entries ${backgrounds.length}`);
  }
  if (backgrounds.length < 40) {
    errors.push(`expected at least 40 retained background/material color sets, found ${backgrounds.length}`);
  }

  const ids = new Set();
  for (const entry of backgrounds) {
    const label = entry.id || entry.label || "unknown background";
    for (const field of ["id", "label", "surface", "background", "primary", "secondary", "accent", "edge", "glow", "notes"]) {
      if (!isNonEmptyString(entry[field])) errors.push(`${label} palette entry missing ${field}`);
    }
    if (ids.has(entry.id)) errors.push(`duplicate palette id ${entry.id}`);
    ids.add(entry.id);
  }

  const specialSupply = generation.specialSupply || {};
  if (specialSupply.source !== "config/lam_special_backgrounds.json") {
    errors.push("generation specialSupply source must point to config/lam_special_backgrounds.json");
  }
  if (specialSupply.legendary !== 0 || specialSupply.mythic !== 0) {
    errors.push("generation specialSupply legendary/mythic counts must be zero after removing the rejected special pass");
  }
  if (specialSupply.normalGenerated !== generation.supply || specialSupply.total !== generation.supply) {
    errors.push("generation specialSupply should route the full supply through normal generated traits");
  }

  const specialEditions = rarity.specialEditions || {};
  if (specialEditions.source !== "config/lam_special_backgrounds.json") {
    errors.push("rarity specialEditions source must point to config/lam_special_backgrounds.json");
  }
  if (specialEditions.oneOfOneSpecials !== false) {
    errors.push("rarity specialEditions.oneOfOneSpecials must be false");
  }
  if (specialEditions.legendaryArchetypes !== 0 || specialEditions.mythicArchetypes !== 0) {
    errors.push("rarity special archetype counts must be zero after removing the rejected special pass");
  }
  if (specialEditions.normalGenerated !== rarity.supply) {
    errors.push("rarity specialEditions should route the full supply through normal generated traits");
  }

  if (errors.length) fail(`${errors.length} issue(s) found`, errors);

  console.log("LAM special background palette validation passed");
  console.log("one-of-one special machine pass: disabled");
  console.log(`background/material color sets kept: ${backgrounds.length}`);
}

if (require.main === module) main();
