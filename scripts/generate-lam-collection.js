const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = process.cwd();

const TOKEN_FIELDS = [
  "chassis",
  "head",
  "expression",
  "clothes",
  "hat",
  "backAccessory",
  "neckTrait",
  "chestAccessory",
  "armItem",
  "background",
  "core"
];

const ID_BY_FIXED_TRAIT = {
  head: {
    "CRT TV": "head.crtTv",
    "Clock Head": "head.clock",
    "Cassette Player Head": "head.cassettePlayer",
    "Film Projector Head": "head.filmProjector",
    "Diving Helmet Head": "head.divingHelmet",
    "Old Computer Head": "head.oldComputer",
    "Gameboy Head": "head.gameboy",
    "Camera Head": "head.camera",
    "Radio Head": "head.radio",
    "Rotary Phone Head": "head.rotaryPhone",
    "Pressure Gauge Head": "head.pressureGauge",
    "Liquid Tank Head": "head.liquidTank",
    "Valve Head": "head.valve",
    "Slot Machine Head": "head.slotMachine",
    "Typewriter Head": "head.typewriter",
    "Satellite Head": "head.satellite",
    "Tesla Coil Head": "head.teslaCoil",
    "Lamp Head": "head.lamp",
    "Samurai Head": "head.samurai",
    "Frankenstein Head": "head.frankenstein",
    "Spaceman Head": "head.spaceman",
    "Ledger BTC Head": "head.ledgerBtc",
    "Ledger ETH Head": "head.ledgerEth",
    "Battery Head": "head.battery",
    "Magnet Head": "head.magnet"
  },
  clothes: {
    "Transparent Pinstripe Shirt": "clothes.transparentPinstripe",
    "Smoked Glass Jacket": "clothes.smokedGlassJacket",
    "Cyan Lab Glass Coat": "clothes.cyanLabGlassCoat",
    "Amber Resin Robe": "clothes.amberResinRobe",
    "Dirty Glass Mechanic Jacket": "clothes.dirtyGlassMechanic",
    "Mercury Hoodie": "clothes.mercuryHoodie",
    "Blue Reactor Vest": "clothes.blueReactorVest",
    "Gold Wire Suit": "clothes.goldWireSuit",
    "Black Chrome Harness": "clothes.blackChromeHarness",
    "Rusted Cage Vest": "clothes.rustedCageVest",
    "Fluid Tube Jacket": "clothes.fluidTubeJacket",
    "Speaker Chest Vest": "clothes.speakerChestVest",
    "Archive Trench Coat": "clothes.archiveTrench",
    "Crimson Pressure Coat": "clothes.crimsonPressureCoat",
    "Void Glass Cloak": "clothes.voidGlassCloak",
    "Porcelain Grid Suit": "clothes.porcelainGridSuit",
    "Copper Coil Harness": "clothes.copperCoilHarness",
    "Green Signal Poncho": "clothes.greenSignalPoncho",
    "Silver Mercury Coat": "clothes.silverMercuryCoat",
    "Rust Forge Apron": "clothes.rustForgeApron",
    "Royal Relic Mantle": "clothes.royalRelicMantle"
  },
  backAccessory: {
    "Skate Wheel Pack": "back.skateWheelPack",
    "Pressure Gauge Shoulder Bag": "back.pressureGaugeShoulderBag",
    "Chain Engine Bag": "back.chainEngineBag",
    "Fish Tank Backpack": "back.fishTankBackpack",
    "Cassette Bag": "back.cassetteBag",
    "Battery Meter Bag": "back.batteryMeterBag",
    "Gas Canister Pack": "back.gasCanisterPack",
    "Transaction Printer Bag": "back.transactionPrinterBag",
    "Mini Fan Pack": "back.miniFanPack",
    "Arcade Pack": "back.arcadePack",
    "Mercury Spine Pack": "back.mercurySpinePack",
    "Dragon Furnace Pack": "back.dragonFurnacePack",
    "Fire Extinguisher Pack": "back.fireExtinguisherPack",
    "Diving Tank Battery": "back.divingTankBattery",
    "Ledger Pack": "back.ledgerPack",
    "Mailbox Pack": "back.mailboxPack",
    "Floppy Disk Pack": "back.floppyDiskPack",
    "Road Barrier Pack": "back.roadBarrierPack",
    "Traffic Light Pack": "back.trafficLightPack",
    "Whale Vent Pack": "back.whaleVentPack"
  },
  neckTrait: {
    "Gear Collar": "neck.gearCollar",
    "Wire Scarf": "neck.wireScarf",
    "Liquid Tube Necklace": "neck.liquidTubeNecklace",
    "Pressure Hose": "neck.pressureHose",
    "Archive Tag": "neck.archiveTag"
  },
  chestAccessory: {
    "Gear Pendant": "chest.gearPendant",
    "Archive Key": "chest.archiveKey",
    "Speaker Core": "chest.speakerCore",
    "Gold Chain": "chest.goldChain"
  },
  armItem: {
    "Signal Tracker": "arm.signalTracker",
    "Floating Gauge": "arm.floatingGauge",
    "Valve Hand": "arm.valveHand"
  }
};

const DEFAULT_WEIGHTS = {
  chassis: [78, 112, 84, 54, 48, 30, 24],
  background: [96, 68, 70, 64, 48, 38, 34, 36, 38, 42, 34, 26, 24, 30, 30, 36, 14, 22],
  core: [100, 44, 18],
  hat: [150, 70, 64, 36, 46, 42, 30, 24, 12, 12, 8],
  backAccessory: [42, 52, 84, 68, 42, 62, 86, 44, 36, 58, 22, 18, 14],
  neckTrait: [72, 84, 78, 30, 56, 34],
  chestAccessory: [104, 86, 34],
  armItem: [122, 76]
};

const RARITY_BASE_WEIGHT = {
  Common: 96,
  Uncommon: 70,
  Rare: 42,
  Epic: 18,
  Legendary: 7,
  Mythic: 3
};

const CATEGORY_LABEL = {
  chassis: "Chassis",
  head: "Head",
  expression: "Expression",
  clothes: "Clothes",
  hat: "Hat",
  backAccessory: "Back Accessory",
  neckTrait: "Neck Trait",
  chestAccessory: "Chest Accessory",
  armItem: "Arm Item",
  background: "Background",
  core: "Core"
};

const CATEGORY_CONFIG_KEY = {
  backAccessory: "BackAccessory",
  neckTrait: "NeckTrait",
  chestAccessory: "ChestAccessory",
  armItem: "ArmSideItem"
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableUnitForToken(token, salt) {
  const hex = sha256(`${token.tokenId}:${traitHash(token)}:${salt}`).slice(0, 12);
  return parseInt(hex, 16) / 0xffffffffffff;
}

function stableUnitForTokenId(tokenId, seed, salt) {
  const hex = sha256(`${seed}:${tokenId}:${salt}`).slice(0, 12);
  return parseInt(hex, 16) / 0xffffffffffff;
}

function reservedGoldenTokenIds(supply, config) {
  const ids = Array.isArray(config.reservedTokenIds) ? config.reservedTokenIds : [];
  return new Set(
    ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id >= 1 && id <= supply)
  );
}

function selectGoldenTokenIds(supply, visualRules, seed) {
  const config = visualRules?.goldenEdition || {};
  if (config.enabled === false) return new Set();

  const count = Math.max(0, Math.min(supply, Number(config.count) || 0));
  if (!count) return new Set();

  const reserved = reservedGoldenTokenIds(supply, config);
  if (reserved.size > count) {
    throw new Error(`Golden Edition reservedTokenIds has ${reserved.size} tokens but count is ${count}.`);
  }

  const salt = config.seedSalt || "lam-full-gold-lucky-mint-v1";
  const ranked = Array.from({ length: supply }, (_, index) => index + 1)
    .filter((tokenId) => !reserved.has(tokenId))
    .map((tokenId) => ({
      tokenId,
      rank: stableUnitForTokenId(tokenId, seed, salt)
    }))
    .sort((a, b) => a.rank - b.rank || a.tokenId - b.tokenId);

  return new Set([...reserved, ...ranked.slice(0, count - reserved.size).map((entry) => entry.tokenId)]);
}

function pickWeightedStable(entries, unit, weightForEntry) {
  const weighted = entries
    .map((entry) => ({ entry, weight: Math.max(0.01, Number(weightForEntry(entry)) || 1) }))
    .filter((item) => item.weight > 0);
  if (!weighted.length) return null;
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = unit * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.entry;
  }
  return weighted[weighted.length - 1].entry;
}

function pickStable(entries, token, salt, fallback = null) {
  if (!Array.isArray(entries) || !entries.length) return fallback;
  const index = Math.floor(stableUnitForToken(token, salt) * entries.length) % entries.length;
  return entries[index];
}

function paletteForToken(token, context) {
  const palettes = context.materialPalettes || [];
  if (!palettes.length) return null;

  if (context.goldenTokenIds?.has(token.tokenId)) {
    const paletteId = String(context.visualRules?.goldenEdition?.paletteId || "goldenEdition").toLowerCase();
    const goldenPalette = palettes.find((palette) => String(palette.id || "").toLowerCase() === paletteId);
    if (goldenPalette) return goldenPalette;
  }

  const weights = context.visualRules?.paletteWeights || {};
  return pickWeightedStable(
    palettes,
    stableUnitForToken(token, "materialPalette"),
    (palette) => weights[palette.surface] || 1
  );
}

function isGoldenEditionPalette(palette) {
  return String(palette?.id || "").toLowerCase() === "goldenedition"
    || String(palette?.surface || "").toLowerCase() === "royalgold";
}

function buildBaseDna(token, labels) {
  return {
    schemaVersion: 1,
    tokenId: token.tokenId,
    traitHash: traitHash(token),
    indexes: TOKEN_FIELDS.reduce((output, field) => {
      output[field] = token[field];
      return output;
    }, {}),
    traits: labels
  };
}

function visualModifiersForToken(catalog, token, labels, context) {
  const palette = paletteForToken(token, context);
  const goldenEdition = Boolean(context.goldenTokenIds?.has(token.tokenId)) || isGoldenEditionPalette(palette);
  const counterStyles = context.visualRules?.counterStyles || {};
  const digitColors = context.visualRules?.counterDigitColors || [];
  const saleCounterStyle = goldenEdition ? "vaultSeal" : pickStable(counterStyles.sale, token, "saleCounterStyle", "pixelPocket");
  const blockCounterStyle = goldenEdition ? "brassGearbox" : pickStable(counterStyles.block, token, "blockCounterStyle", "flipBlack");
  const saleDigitColor = goldenEdition ? "#fff0a6" : pickStable(digitColors, token, "saleDigitColor", palette?.accent || "#66f5dd");
  const blockDigitColor = goldenEdition ? "#fff0a6" : pickStable(digitColors, token, "blockDigitColor", palette?.accent || "#66f5dd");
  const backgroundColor = palette?.background || catalog.backgroundPalette?.[labels.Background] || "#12D8BA";
  const accent = palette?.accent || "#5effd1";
  const edge = palette?.edge || accent;
  const primary = palette?.primary || "#1d2b2c";
  const secondary = palette?.secondary || "#101819";

  return {
    schemaVersion: 1,
    rendererVersion: context.visualRules?.rendererVersion || "LAM_RENDER_V1",
    edition: goldenEdition ? "Full Gold Edition" : "Base Visual",
    palette: palette ? { ...palette } : null,
    slots: {
      backgroundColor,
      bodyMaterial: goldenEdition ? "fullGold" : (palette?.id || "baseMachine"),
      headMaterial: goldenEdition ? "fullGold" : (palette?.id || "baseHead"),
      clothesColor: goldenEdition ? "#e6a42f" : primary,
      bagColor: goldenEdition ? "#3a2107" : secondary,
      eyeColor: goldenEdition ? "#fff0a6" : accent,
      coreColor: goldenEdition ? "#ffc43f" : accent,
      metalTrim: goldenEdition ? "#ffc43f" : edge,
      glowColor: goldenEdition ? "rgba(255,207,82,0.62)" : (palette?.glow || `rgba(94,255,209,0.5)`),
      liquidType: palette?.liquidType || null,
      liquidTexture: palette?.liquidTexture || null,
      saleCounterStyle,
      blockCounterStyle,
      saleDigitColor,
      blockDigitColor
    }
  };
}

function aliveStateForToken(token, rules) {
  const protocol = rules.aliveProtocol || {};
  const stateTemplate = protocol.stateUriTemplate || "";
  const agentTemplate = protocol.agentCardUriTemplate || "";

  return {
    schemaVersion: protocol.schemaVersion || 1,
    protocol: protocol.id || "LAM_ALIVE_V1",
    tokenId: token.tokenId,
    awakenable: protocol.awakenable !== false,
    awakened: false,
    burnRequired: protocol.burnRequired === true ? true : false,
    baseTraitsMutable: protocol.baseTraitsMutable === true ? true : false,
    ownerCanCustomizeVisuals: protocol.ownerCanCustomizeVisuals !== false,
    registryAddress: protocol.futureRegistryAddress || null,
    tokenBoundAccountStandard: protocol.tokenBoundAccountStandard || "ERC-6551-ready",
    tokenBoundAccount: null,
    agentIdentityStandard: protocol.agentIdentityStandard || "ERC-8004-ready",
    agentId: null,
    aliveStateUri: stateTemplate ? stateTemplate.replace(/\{tokenId\}/g, String(token.tokenId)) : null,
    agentCardUri: agentTemplate ? agentTemplate.replace(/\{tokenId\}/g, String(token.tokenId)) : null,
    evolutionDrivers: [
      "archiveAge",
      "holderBond",
      "transferScars",
      "verifiedSales",
      "blockHeartbeat",
      "ownerCustomization"
    ]
  };
}

function customizationForToken(token, baseDna, visualModifiers, context) {
  const rules = context.visualRules || {};
  const template = rules.customStateUriTemplate || "";
  const alive = aliveStateForToken(token, rules);
  return {
    schemaVersion: 1,
    enabled: rules.customizationEnabled !== false,
    stateVersion: rules.customizationStateVersion || "LAM_CUSTOM_STATE_V1",
    rendererVersion: rules.rendererVersion || "LAM_RENDER_V1",
    baseLocked: true,
    lockedBaseTraitHash: baseDna.traitHash,
    editableSlots: (rules.editableSlots || []).map((slot) => slot.id),
    customStateUri: template ? template.replace(/\{tokenId\}/g, String(token.tokenId)) : null,
    partManifestUri: rules.partManifestUri || null,
    paletteManifestUri: rules.paletteManifestUri || null,
    alive,
    defaultState: {
      schemaVersion: 1,
      tokenId: token.tokenId,
      stateVersion: rules.customizationStateVersion || "LAM_CUSTOM_STATE_V1",
      rendererVersion: rules.rendererVersion || "LAM_RENDER_V1",
      lockedBaseTraitHash: baseDna.traitHash,
      baseTraitsMutable: false,
      overrides: {},
      extraParts: [],
      defaultVisualSlots: visualModifiers.slots,
      alive
    }
  };
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function nextHash() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function sfc32(a, b, c, d) {
  return function random() {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const result = (t + d) | 0;
    c = (c + result) | 0;
    return (result >>> 0) / 4294967296;
  };
}

function makeRng(seed) {
  const seedHash = xmur3(seed);
  return sfc32(seedHash(), seedHash(), seedHash(), seedHash());
}

function traitIdFor(category, name) {
  if (!name || name === "None") return null;
  return ID_BY_FIXED_TRAIT[category]?.[name] || null;
}

function labelsForToken(catalog, token) {
  const head = catalog.head[token.head];
  const expressions = catalog.expressionByHead[head] || ["Neutral Signal"];
  return {
    Chassis: catalog.chassis[token.chassis],
    Head: head,
    Expression: expressions[token.expression % expressions.length],
    Clothes: catalog.clothes[token.clothes],
    Hat: catalog.hat[token.hat],
    "Back Accessory": catalog.backAccessory?.[token.backAccessory] || "None",
    "Neck Trait": catalog.neckTrait?.[token.neckTrait] || "None",
    "Chest Accessory": catalog.chestAccessory[token.chestAccessory],
    "Arm Item": catalog.armItem[token.armItem],
    Background: catalog.background[token.background],
    Core: catalog.core[token.core]
  };
}

function traitIdsForToken(catalog, token) {
  const labels = labelsForToken(catalog, token);
  return {
    head: traitIdFor("head", labels.Head),
    clothes: traitIdFor("clothes", labels.Clothes),
    backAccessory: traitIdFor("backAccessory", labels["Back Accessory"]),
    neckTrait: traitIdFor("neckTrait", labels["Neck Trait"]),
    chestAccessory: traitIdFor("chestAccessory", labels["Chest Accessory"]),
    armItem: traitIdFor("armItem", labels["Arm Item"])
  };
}

function buildFixedOptionIndex(catalog) {
  const index = new Map();
  for (const category of Object.keys(ID_BY_FIXED_TRAIT)) {
    for (const [name, id] of Object.entries(ID_BY_FIXED_TRAIT[category])) {
      const fixedList = catalog[category];
      if (!Array.isArray(fixedList)) continue;
      const optionIndex = fixedList.indexOf(name);
      if (optionIndex === -1) continue;
      index.set(id, { category, index: optionIndex, name });
    }
  }
  return index;
}

function weightForOption(category, name, index, context) {
  const { rarity, reactionById, scoreWeightModifiers, selectedIds, connectionRules } = context;
  const id = traitIdFor(category, name);

  let weight = DEFAULT_WEIGHTS[category]?.[index];
  if (id && rarity.traitWeights?.[id]) {
    weight = rarity.traitWeights[id];
  } else if (id && reactionById.has(id)) {
    const reaction = reactionById.get(id);
    weight = RARITY_BASE_WEIGHT[reaction.rarityTier] || 38;
    weight *= Number(scoreWeightModifiers?.[String(reaction.qualityScore)] || 1);
  } else if (weight == null) {
    weight = category === "head" ? 42 : 32;
  }

  if (id) {
    const reaction = reactionById.get(id);
    if (reaction?.compatibleWith?.some((compatibleId) => selectedIds.has(compatibleId))) weight *= 1.5;
    if (reaction?.receives?.length || reaction?.emits?.length) weight *= 1.03;

    for (const rule of connectionRules) {
      const hasFrom = rule.fromTrait === id && selectedIds.has(rule.toTrait);
      const hasTo = rule.toTrait === id && selectedIds.has(rule.fromTrait);
      if (hasFrom || hasTo) weight *= 1 + (rule.strength || 1) * 0.65;
    }
  }

  return Math.max(0.1, weight);
}

function weightedChoice(options, rng) {
  const total = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = rng() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[options.length - 1];
}

function chooseIndex(catalog, category, rng, context, filter = () => true) {
  const options = catalog[category]
    .map((name, index) => ({ name, index }))
    .filter((option) => filter(option.name, option.index))
    .map((option) => ({
      ...option,
      weight: weightForOption(category, option.name, option.index, context)
    }));

  if (!options.length) return 0;
  return weightedChoice(options, rng).index;
}

function expressionIndexFor(catalog, headIndex, rng) {
  const head = catalog.head[headIndex];
  const expressions = catalog.expressionByHead[head] || ["Neutral Signal"];
  return Math.floor(rng() * expressions.length);
}

function isHatCompatible(hat, head) {
  if (hat === "No Hat") return true;
  if (hat === "Tesla Conductor Crown") return head === "Tesla Coil Head";
  if (hat === "Lamp Shade Cap") return head === "Lamp Head";

  const softHatHeads = new Set([
    "CRT TV",
    "Cassette Player Head",
    "Arcade Machine Head",
    "Old Computer Head",
    "Gameboy Head",
    "Camera Head",
    "Radio Head",
    "Typewriter Head",
    "Slot Machine Head"
  ]);
  if (hat === "Black Beanie" || hat === "Flat Cap") return softHatHeads.has(head);
  if (hat === "Top Hat") return !["Diving Helmet Head", "Rotary Phone Head", "Tesla Coil Head", "Lamp Head"].includes(head);
  if (hat === "Broken Antenna Crown") {
    return ["CRT TV", "Radio Head", "Old Computer Head", "Gameboy Head", "Satellite Head", "Tesla Coil Head"].includes(head);
  }
  return true;
}

function currentIdSet(catalog, token) {
  return new Set(Object.values(traitIdsForToken(catalog, token)).filter(Boolean));
}

function applyConnectionBias(catalog, token, rng, fixedOptionById, connectionRules) {
  const selectedIds = currentIdSet(catalog, token);
  const headId = traitIdsForToken(catalog, token).head;
  if (!headId || rng() > 0.94) return;

  const candidates = connectionRules
    .filter((rule) => rule.fromTrait === headId || rule.toTrait === headId)
    .flatMap((rule) => {
      const otherId = rule.fromTrait === headId ? rule.toTrait : rule.fromTrait;
      const option = fixedOptionById.get(otherId);
      if (!option || selectedIds.has(otherId)) return [];
      return [{ ...option, weight: Math.max(1, rule.strength || 1) ** 2, rule }];
    });

  if (!candidates.length) return;
  const picked = weightedChoice(candidates, rng);
  if (picked.category === "clothes" && rng() > 0.42) return;
  token[picked.category] = picked.index;
}

function makeCandidate(catalog, rng, context, tokenId) {
  const token = { tokenId };
  const emptyIds = new Set();
  const baseContext = { ...context, selectedIds: emptyIds };

  token.background = chooseIndex(catalog, "background", rng, baseContext);
  token.chassis = chooseIndex(catalog, "chassis", rng, baseContext);
  token.core = chooseIndex(catalog, "core", rng, baseContext);
  token.head = chooseIndex(catalog, "head", rng, baseContext);
  token.expression = expressionIndexFor(catalog, token.head, rng);

  let selectedIds = currentIdSet(catalog, token);
  token.clothes = chooseIndex(catalog, "clothes", rng, { ...context, selectedIds });

  selectedIds = currentIdSet(catalog, token);
  token.backAccessory = chooseIndex(catalog, "backAccessory", rng, { ...context, selectedIds });

  selectedIds = currentIdSet(catalog, token);
  token.neckTrait = chooseIndex(catalog, "neckTrait", rng, { ...context, selectedIds });

  selectedIds = currentIdSet(catalog, token);
  token.chestAccessory = chooseIndex(catalog, "chestAccessory", rng, { ...context, selectedIds });

  selectedIds = currentIdSet(catalog, token);
  token.armItem = chooseIndex(catalog, "armItem", rng, { ...context, selectedIds });

  applyConnectionBias(catalog, token, rng, context.fixedOptionById, context.connectionRules);

  selectedIds = currentIdSet(catalog, token);
  const headName = catalog.head[token.head];
  token.hat = chooseIndex(
    catalog,
    "hat",
    rng,
    { ...context, selectedIds },
    (hatName) => isHatCompatible(hatName, headName)
  );

  return token;
}

function tokenKey(token) {
  return TOKEN_FIELDS
    .filter((field) => field !== "expression")
    .map((field) => token[field])
    .join(".");
}

function traitHash(token) {
  const input = TOKEN_FIELDS.map((field) => `${field}:${token[field]}`).join("|");
  return sha256(input).slice(0, 24);
}

function connectedRulesForIds(ids, rules) {
  const set = new Set(ids.filter(Boolean));
  return rules.filter((rule) => set.has(rule.fromTrait) && set.has(rule.toTrait));
}

function compatibilityLinksForIds(ids, reactionById) {
  const set = new Set(ids.filter(Boolean));
  const links = new Set();
  for (const id of set) {
    const reaction = reactionById.get(id);
    if (!reaction) continue;
    for (const compatibleId of reaction.compatibleWith || []) {
      if (!set.has(compatibleId)) continue;
      links.add([id, compatibleId].sort().join("<->"));
    }
  }
  return [...links].sort();
}

function makeAssignment(catalog, token, context, lockedPrototype) {
  const labels = labelsForToken(catalog, token);
  const ids = traitIdsForToken(catalog, token);
  const baseDna = buildBaseDna(token, labels);
  const visualModifiers = visualModifiersForToken(catalog, token, labels, context);
  const customization = customizationForToken(token, baseDna, visualModifiers, context);
  const connectedRules = connectedRulesForIds(Object.values(ids), context.connectionRules);
  const compatibilityLinks = compatibilityLinksForIds(Object.values(ids), context.reactionById);
  const reactions = Object.values(ids)
    .filter(Boolean)
    .map((id) => context.reactionById.get(id))
    .filter(Boolean);

  return {
    tokenId: token.tokenId,
    lockedPrototype,
    traitHash: traitHash(token),
    baseDna,
    indexes: TOKEN_FIELDS.reduce((output, field) => {
      output[field] = token[field];
      return output;
    }, {}),
    traits: labels,
    traitIds: ids,
    visualModifiers,
    customization,
    connectionRuleIds: connectedRules.map((rule) => rule.id),
    compatibilityLinkIds: compatibilityLinks,
    connectionStrength: connectedRules.reduce((sum, rule) => sum + (rule.strength || 0), 0),
    maxQualityScore: reactions.reduce((score, trait) => Math.max(score, trait.qualityScore || 0), 0),
    animationCosts: [...new Set(reactions.map((trait) => trait.animationCost).filter(Boolean))].sort()
  };
}

function incrementCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function underCaps(candidate, caps, counts, pairCounts, supply) {
  const maxHead = Math.floor((supply * (caps.maxSameHeadPercent || 100)) / 100);
  const maxClothes = Math.floor((supply * (caps.maxSameClothesPercent || 100)) / 100);
  const headName = candidate.traits.Head;
  const clothesName = candidate.traits.Clothes;
  const pairKey = `${headName} + ${clothesName}`;

  if ((counts.head.get(headName) || 0) >= maxHead) return false;
  if ((counts.clothes.get(clothesName) || 0) >= maxClothes) return false;
  if ((pairCounts.get(pairKey) || 0) >= (caps.maxSameHeadClothesPairCount || Number.MAX_SAFE_INTEGER)) return false;
  return true;
}

function commitAssignment(assignment, counts, pairCounts) {
  incrementCount(counts.head, assignment.traits.Head);
  incrementCount(counts.clothes, assignment.traits.Clothes);
  incrementCount(pairCounts, `${assignment.traits.Head} + ${assignment.traits.Clothes}`);
}

function buildCategoryCounts(assignments) {
  const counts = {};
  const fields = [
    ["Head", "Head"],
    ["Chassis", "Chassis"],
    ["Clothes", "Clothes"],
    ["Hat", "Hat"],
    ["Back Accessory", "Back Accessory"],
    ["Neck Trait", "Neck Trait"],
    ["Chest Accessory", "Chest Accessory"],
    ["Arm Item", "Arm Item"],
    ["Background", "Background"],
    ["Core", "Core"]
  ];

  for (const [key, label] of fields) {
    counts[key] = {};
    for (const assignment of assignments) {
      const value = assignment.traits[label];
      counts[key][value] = (counts[key][value] || 0) + 1;
    }
    counts[key] = Object.fromEntries(
      Object.entries(counts[key]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    );
  }

  return counts;
}

function buildCoverageWarnings(catalog, rarity) {
  const warnings = [];
  const categoryTargets = rarity.categoryTargets || {};
  const fixedCategories = {
    Background: catalog.background?.length || 0,
    Chassis: catalog.chassis?.length || 0,
    Head: catalog.head?.length || 0,
    Clothes: catalog.clothes?.length || 0,
    Hat: catalog.hat?.length || 0,
    BackAccessory: catalog.backAccessory?.filter((value) => value !== "None").length || 0,
    NeckTrait: catalog.neckTrait?.filter((value) => value !== "None").length || 0,
    ChestAccessory: catalog.chestAccessory?.filter((value) => value !== "None").length || 0,
    ArmSideItem: catalog.armItem?.filter((value) => value !== "None").length || 0,
    Core: catalog.core?.length || 0
  };

  for (const [category, count] of Object.entries(fixedCategories)) {
    const target = categoryTargets[category];
    if (!target) continue;
    const minimum = target.minOptionsBefore5555;
    if (minimum && count < minimum) {
      warnings.push(`${category} has ${count} current options; target before final 5555 is ${minimum}+.`);
    }
  }

  return warnings;
}

function buildSummary({ assignments, catalog, rarity, generation, seed, seedMode, duplicateRejects, capRejects, attempts, connectionRules, visualRules, materialPalettes, goldenTokenIds }) {
  const connectionHits = new Map();
  for (const assignment of assignments) {
    for (const ruleId of assignment.connectionRuleIds) incrementCount(connectionHits, ruleId);
  }

  const connectedTokens = assignments.filter((assignment) => assignment.connectionRuleIds.length > 0).length;
  const compatibleConnectedTokens = assignments.filter((assignment) => assignment.compatibilityLinkIds.length > 0).length;
  const anyConnectedTokens = assignments.filter(
    (assignment) => assignment.connectionRuleIds.length > 0 || assignment.compatibilityLinkIds.length > 0
  ).length;
  const signatureConnectedTokens = assignments.filter((assignment) => assignment.connectionStrength >= 3).length;
  const uncoveredConnectionRules = connectionRules
    .map((rule) => rule.id)
    .filter((ruleId) => !connectionHits.has(ruleId));

  const categoryCounts = buildCategoryCounts(assignments);
  const provenanceInput = assignments.map((assignment) => `${assignment.tokenId}:${assignment.traitHash}`).join("|");

  return {
    schemaVersion: 1,
    collection: catalog.collectionName,
    supply: assignments.length,
    generatedAt: new Date().toISOString(),
    seedMode,
    seedHash: sha256(seed),
    provenanceHash: sha256(provenanceInput),
    prototypeTokensPreserved: catalog.prototypeCount,
    deterministic: generation.seedPolicy?.deterministic === true,
    currentCatalogSize: {
      heads: catalog.head.length,
      clothes: catalog.clothes.length,
      hats: catalog.hat.length,
      backAccessories: catalog.backAccessory.length,
      neckTraits: catalog.neckTrait.length,
      chestAccessories: catalog.chestAccessory.length,
      armItems: catalog.armItem.length,
      backgrounds: catalog.background.length,
      cores: catalog.core.length,
      materialPalettes: materialPalettes?.length || 0,
      editableColorSlots: visualRules?.editableSlots?.length || 0
    },
    goldenEdition: {
      enabled: visualRules?.goldenEdition?.enabled !== false,
      targetCount: Number(visualRules?.goldenEdition?.count || 0),
      actualCount: goldenTokenIds?.size || 0,
      selection: visualRules?.goldenEdition?.selection || "deterministicTokenIdLottery",
      paletteId: visualRules?.goldenEdition?.paletteId || "goldenEdition",
      reservedTokenIds: Array.isArray(visualRules?.goldenEdition?.reservedTokenIds)
        ? visualRules.goldenEdition.reservedTokenIds
        : [],
      luckyTokenCount: Math.max(
        0,
        (goldenTokenIds?.size || 0)
          - (Array.isArray(visualRules?.goldenEdition?.reservedTokenIds)
            ? visualRules.goldenEdition.reservedTokenIds.length
            : 0)
      ),
      tokenIds: [...(goldenTokenIds || new Set())].sort((a, b) => a - b)
    },
    generationStats: {
      attempts,
      duplicateRejects,
      capRejects
    },
    connectionStats: {
      connectedTokens: anyConnectedTokens,
      connectedTokenPercent: Number(((anyConnectedTokens / assignments.length) * 100).toFixed(2)),
      compatibleConnectedTokens,
      compatibleConnectedTokenPercent: Number(((compatibleConnectedTokens / assignments.length) * 100).toFixed(2)),
      signatureConnectedTokens,
      signatureConnectedTokenPercent: Number(((signatureConnectedTokens / assignments.length) * 100).toFixed(2)),
      explicitRuleConnectedTokens: connectedTokens,
      explicitRuleConnectedTokenPercent: Number(((connectedTokens / assignments.length) * 100).toFixed(2)),
      hitRules: Object.fromEntries([...connectionHits.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
      uncoveredConnectionRules
    },
    categoryCounts,
    warnings: buildCoverageWarnings(catalog, rarity)
  };
}

function selectReviewSample(assignments, count, goldenTokenIds = new Set()) {
  const selected = new Map();
  for (const assignment of assignments.filter((item) => item.lockedPrototype)) {
    selected.set(assignment.tokenId, assignment);
  }

  for (const assignment of assignments) {
    if (selected.size >= count) break;
    if (goldenTokenIds.has(assignment.tokenId)) selected.set(assignment.tokenId, assignment);
  }

  for (const assignment of assignments) {
    if (selected.size >= count) break;
    if (assignment.connectionStrength >= 4) selected.set(assignment.tokenId, assignment);
  }

  for (const assignment of assignments) {
    if (selected.size >= count) break;
    selected.set(assignment.tokenId, assignment);
  }

  return [...selected.values()].sort((a, b) => a.tokenId - b.tokenId);
}

function main() {
  const catalog = readJson("config/fixed_trait_catalog.json");
  const generation = readJson("config/lam_generation_rules.json");
  const rarity = readJson("config/lam_rarity_rules.json");
  const connections = readJson("config/lam_connection_rules.json");
  const reactionCatalog = readJson("config/lam_trait_reaction_catalog.json");
  const visualRules = readJson("config/lam_visual_randomizer_rules.json");
  const paletteCatalog = readJson("config/lam_special_backgrounds.json");
  const materialPalettes = paletteCatalog.backgrounds || [];

  const supply = Number(process.env.LAM_COLLECTION_COUNT || generation.supply || 5555);
  const reviewCount = Number(process.env.LAM_REVIEW_COUNT || generation.previewRules?.previewCount || 100);
  const productionSeed = (process.env.LAM_PRODUCTION_SEED || generation.seedPolicy?.productionSeed || "").trim();
  const previewSeed = generation.seedPolicy?.previewSeed || "living-archive-machines-preview-v1";
  const seed = productionSeed && productionSeed !== generation.seedPolicy?.productionSeedPlaceholder
    ? productionSeed
    : previewSeed;
  const seedMode = seed === previewSeed ? "preview" : "production";
  const rng = makeRng(seed);
  const outputDir = path.join(root, "build", "collection");
  const goldenTokenIds = selectGoldenTokenIds(supply, visualRules, seed);

  ensureDir(outputDir);

  const reactionById = new Map((reactionCatalog.traits || []).map((trait) => [trait.id, trait]));
  const fixedOptionById = buildFixedOptionIndex(catalog);
  const context = {
    rarity,
    reactionById,
    fixedOptionById,
    connectionRules: connections.rules || [],
    scoreWeightModifiers: rarity.scoreWeightModifiers || {},
    visualRules,
    materialPalettes,
    goldenTokenIds
  };

  const counts = { head: new Map(), clothes: new Map() };
  const pairCounts = new Map();
  const assignments = [];
  const usedKeys = new Set();
  let duplicateRejects = 0;
  let capRejects = 0;
  let attempts = 0;

  for (const prototype of catalog.prototypeTokens.slice(0, catalog.prototypeCount)) {
    const assignment = makeAssignment(catalog, { ...prototype }, context, true);
    assignments.push(assignment);
    usedKeys.add(tokenKey(prototype));
    commitAssignment(assignment, counts, pairCounts);
  }

  const maxAttemptsPerToken = generation.productionRules?.maxAttemptsPerToken || 400;
  for (let tokenId = assignments.length + 1; tokenId <= supply; tokenId += 1) {
    let accepted = null;
    for (let attempt = 0; attempt < maxAttemptsPerToken; attempt += 1) {
      attempts += 1;
      const candidateToken = makeCandidate(catalog, rng, context, tokenId);
      const key = tokenKey(candidateToken);
      if (usedKeys.has(key)) {
        duplicateRejects += 1;
        continue;
      }

      const candidate = makeAssignment(catalog, candidateToken, context, false);
      if (!underCaps(candidate, rarity.caps || {}, counts, pairCounts, supply)) {
        capRejects += 1;
        continue;
      }

      accepted = { candidateToken, candidate, key };
      break;
    }

    if (!accepted) {
      throw new Error(`Could not generate compatible unique token ${tokenId} after ${maxAttemptsPerToken} attempts`);
    }

    usedKeys.add(accepted.key);
    assignments.push(accepted.candidate);
    commitAssignment(accepted.candidate, counts, pairCounts);
  }

  const summary = buildSummary({
    assignments,
    catalog,
    rarity,
    generation,
    seed,
    seedMode,
    duplicateRejects,
    capRejects,
    attempts,
    connectionRules: connections.rules || [],
    visualRules,
    materialPalettes,
    goldenTokenIds
  });
  const reviewSample = selectReviewSample(assignments, reviewCount, goldenTokenIds);

  fs.writeFileSync(path.join(outputDir, "trait-assignments.json"), `${JSON.stringify(assignments, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "trait-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, "review-sample.json"), `${JSON.stringify(reviewSample, null, 2)}\n`);

  console.log(`LAM collection assignments generated: ${assignments.length}`);
  console.log(`seed mode: ${seedMode}`);
  console.log(`connected tokens: ${summary.connectionStats.connectedTokens} (${summary.connectionStats.connectedTokenPercent}%)`);
  console.log(`golden edition tokens: ${summary.goldenEdition.actualCount}`);
  console.log(`provenance hash: ${summary.provenanceHash}`);
  if (summary.warnings.length) {
    console.log("catalog expansion notes:");
    for (const warning of summary.warnings) console.log(`- ${warning}`);
  }
}

if (require.main === module) main();

module.exports = { main, labelsForToken, traitIdsForToken };
