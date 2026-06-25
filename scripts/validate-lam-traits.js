const fs = require("fs");
const path = require("path");

const root = process.cwd();

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function fail(message, details = []) {
  console.error(`LAM trait validation failed: ${message}`);
  for (const detail of details) console.error(`- ${detail}`);
  process.exit(1);
}

function requireString(trait, field, errors) {
  if (typeof trait[field] !== "string" || !trait[field].trim()) {
    errors.push(`${trait.id || "unknown"} missing string field ${field}`);
  }
}

function requireArray(trait, field, errors) {
  if (!Array.isArray(trait[field]) || trait[field].length === 0) {
    errors.push(`${trait.id || "unknown"} missing non-empty array field ${field}`);
  }
}

function main() {
  const catalog = readJson("config/lam_trait_reaction_catalog.json");
  const connections = readJson("config/lam_connection_rules.json");
  const rarity = readJson("config/lam_rarity_rules.json");
  const generation = readJson("config/lam_generation_rules.json");
  const animation = readJson("config/lam_animation_behaviors.json");

  const errors = [];
  const traits = catalog.traits || [];
  const ids = new Set();
  const categoryCounts = new Map();
  const scoreCounts = new Map();

  if (!Array.isArray(traits) || traits.length === 0) {
    fail("trait catalog has no traits");
  }

  const requiredStrings = [
    "id",
    "traitName",
    "category",
    "rarityTier",
    "visualIdentity",
    "animationComponent",
    "idleAnimation",
    "heartbeatReaction",
    "pressureReaction",
    "ageReaction",
    "bondReaction",
    "historyReaction",
    "milestoneReaction",
    "animationCost"
  ];
  const requiredNonEmptyArrays = [
    "moodStates",
    "connectionPoints"
  ];
  const requiredArrays = [
    "emits",
    "receives",
    "compatibleWith",
    "incompatibleWith"
  ];

  for (const trait of traits) {
    for (const field of requiredStrings) requireString(trait, field, errors);
    for (const field of requiredNonEmptyArrays) requireArray(trait, field, errors);
    for (const field of requiredArrays) {
      if (!Array.isArray(trait[field])) errors.push(`${trait.id || "unknown"} missing array field ${field}`);
    }

    if (ids.has(trait.id)) errors.push(`duplicate trait id ${trait.id}`);
    ids.add(trait.id);

    if (typeof trait.qualityScore !== "number") {
      errors.push(`${trait.id} missing numeric qualityScore`);
    } else {
      scoreCounts.set(trait.qualityScore, (scoreCounts.get(trait.qualityScore) || 0) + 1);
      if (trait.approved && trait.qualityScore < catalog.approvalRules.minimumApprovedQualityScore) {
        errors.push(`${trait.id} approved with qualityScore ${trait.qualityScore}`);
      }
    }

    if (trait.approved !== true) {
      errors.push(`${trait.id} is not approved; only approved traits belong in this production catalog`);
    }

    if ((trait.connectionPoints || []).length < catalog.approvalRules.requiredConnectionPointCount) {
      errors.push(`${trait.id} does not expose enough connection points`);
    }

    const emitsOrReceives = (trait.emits || []).length + (trait.receives || []).length;
    if (!emitsOrReceives) errors.push(`${trait.id} must emit or receive at least one channel`);

    categoryCounts.set(trait.category, (categoryCounts.get(trait.category) || 0) + 1);
  }

  for (const traitId of Object.keys(rarity.traitWeights || {})) {
    if (!ids.has(traitId)) errors.push(`rarity weight references unknown trait ${traitId}`);
  }

  const connectionRules = connections.rules || [];
  if (connectionRules.length < 10) {
    errors.push(`expected at least 10 connection rules, found ${connectionRules.length}`);
  }

  for (const rule of connectionRules) {
    if (!rule.id) errors.push("connection rule missing id");
    if (!ids.has(rule.fromTrait)) errors.push(`${rule.id} fromTrait unknown: ${rule.fromTrait}`);
    if (!ids.has(rule.toTrait)) errors.push(`${rule.id} toTrait unknown: ${rule.toTrait}`);
    if (!catalog.connectionChannels.includes(rule.channel)) {
      errors.push(`${rule.id} uses unknown channel ${rule.channel}`);
    }
    if (typeof rule.strength !== "number" || rule.strength < 1) {
      errors.push(`${rule.id} missing positive numeric strength`);
    }
  }

  for (const behavior of ["globalLifeMotion", "chainSignals", "components", "moodModel"]) {
    if (!animation[behavior]) errors.push(`animation behaviors missing ${behavior}`);
  }

  if (generation.supply !== 5555) {
    errors.push(`generation supply must be 5555, got ${generation.supply}`);
  }

  const requiredMinimums = {
    Head: 10,
    Clothes: 10
  };
  for (const [category, minimum] of Object.entries(requiredMinimums)) {
    const count = categoryCounts.get(category) || 0;
    if (count < minimum) errors.push(`category ${category} needs at least ${minimum} traits, found ${count}`);
  }

  const accessoryCount =
    (categoryCounts.get("BackAccessory") || 0) +
    (categoryCounts.get("NeckTrait") || 0) +
    (categoryCounts.get("ChestAccessory") || 0) +
    (categoryCounts.get("ArmSideItem") || 0);
  if (accessoryCount < 10) errors.push(`accessory categories need at least 10 traits total, found ${accessoryCount}`);

  const scoreFiveCount = scoreCounts.get(5) || 0;
  if (scoreFiveCount < 10) errors.push(`expected at least 10 score-5 traits, found ${scoreFiveCount}`);

  if (errors.length) fail(`${errors.length} issue(s) found`, errors);

  console.log("LAM trait validation passed");
  console.log(`traits: ${traits.length}`);
  console.log(`connection rules: ${connectionRules.length}`);
  console.log(`score-5 traits: ${scoreFiveCount}`);
  console.log("categories:");
  for (const [category, count] of [...categoryCounts.entries()].sort()) {
    console.log(`- ${category}: ${count}`);
  }
}

if (require.main === module) main();
