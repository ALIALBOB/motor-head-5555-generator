const fs = require("fs");
const path = require("path");

const root = process.cwd();
const quiet = process.env.LAM_LAYOUT_QUIET === "1";
const catalog = JSON.parse(fs.readFileSync(path.join(root, "config", "fixed_trait_catalog.json"), "utf8"));

const buildLayoutsDir = path.join(root, "build", "layouts");
const buildAssembliesDir = path.join(root, "build", "assemblies");
const buildTraitsDir = path.join(root, "build", "traits");
const publicLayoutsDir = path.join(root, "web", "public", "living-archive", "layouts");
const collectionAssignmentsPath = path.join(root, "build", "collection", "trait-assignments.json");

const MATERIAL_BY_CHASSIS = [
  "pfpSteel",
  "pfpBlack",
  "pfpGold",
  "rustedIron",
  "pfpSteel",
  "boneWhite",
  "pfpGold"
];

const CORE_BY_TRAIT = ["pfpGlow", "pfpGold", "copper"];
const SHADE_BY_TOKEN = ["pencilSketch", "crosshatch", "stippleDots", "blueprintFade", "rustWash"];
const FALLBACK_PFP_BACKGROUND = "#12D8BA";
const GOLDEN_EDITION_SKIN = {
  id: "goldenEdition",
  label: "GOLDEN EDITION",
  surface: "royalGold",
  background: "#4b2a08",
  primary: "#e6a42f",
  secondary: "#3a2107",
  accent: "#fff0a6",
  edge: "#ffc43f",
  glow: "rgba(255,207,82,0.62)",
  liquidType: "Gold Resin",
  liquidTexture: "Metallic",
  rarity: "Special Edition"
};

const DEFAULT_TOP_ANCHOR = { x: 512, y: 220, rotation: 0, scaleX: 1, scaleY: 1 };
const HEAD_TOP_ANCHORS = {
  "CRT TV": { x: 512, y: 214, rotation: -0.04, scaleX: 1.05, scaleY: 0.94 },
  "Clock Head": { x: 512, y: 220, rotation: -0.02, scaleX: 0.8, scaleY: 0.86 },
  "Cassette Player Head": { x: 512, y: 236, rotation: -0.04, scaleX: 1.06, scaleY: 0.84 },
  "Film Projector Head": { x: 512, y: 208, rotation: -0.02, scaleX: 0.96, scaleY: 0.88 },
  "Diving Helmet Head": { x: 512, y: 190, rotation: -0.03, scaleX: 0.76, scaleY: 0.74 },
  "Old Computer Head": { x: 512, y: 224, rotation: -0.03, scaleX: 1.02, scaleY: 0.84 },
  "Gameboy Head": { x: 512, y: 226, rotation: -0.08, scaleX: 0.98, scaleY: 0.84 },
  "Camera Head": { x: 512, y: 230, rotation: -0.04, scaleX: 0.92, scaleY: 0.82 },
  "Radio Head": { x: 512, y: 208, rotation: 0.03, scaleX: 1.04, scaleY: 0.84 },
  "Rotary Phone Head": { x: 512, y: 198, rotation: 0, scaleX: 0.8, scaleY: 0.8 },
  "Pressure Gauge Head": { x: 512, y: 218, rotation: -0.03, scaleX: 0.82, scaleY: 0.84 },
  "Liquid Tank Head": { x: 512, y: 186, rotation: 0, scaleX: 0.74, scaleY: 0.8 },
  "Valve Head": { x: 512, y: 218, rotation: 0, scaleX: 0.84, scaleY: 0.82 },
  "Slot Machine Head": { x: 512, y: 206, rotation: -0.02, scaleX: 0.94, scaleY: 0.86 },
  "Typewriter Head": { x: 512, y: 254, rotation: -0.04, scaleX: 1.06, scaleY: 0.82 },
  "Satellite Head": { x: 512, y: 194, rotation: -0.04, scaleX: 0.78, scaleY: 0.82 },
  "Tesla Coil Head": { x: 512, y: 184, rotation: 0, scaleX: 0.74, scaleY: 0.8 },
  "Lamp Head": { x: 512, y: 172, rotation: 0, scaleX: 0.66, scaleY: 0.72 },
  "Samurai Head": { x: 512, y: 166, rotation: -0.02, scaleX: 0.82, scaleY: 0.78 },
  "Frankenstein Head": { x: 512, y: 178, rotation: 0.02, scaleX: 0.88, scaleY: 0.8 },
  "Spaceman Head": { x: 512, y: 174, rotation: -0.03, scaleX: 0.78, scaleY: 0.78 },
  "Ledger BTC Head": { x: 512, y: 230, rotation: -0.04, scaleX: 1.0, scaleY: 0.9 },
  "Ledger ETH Head": { x: 512, y: 230, rotation: -0.04, scaleX: 1.0, scaleY: 0.9 },
  "Battery Head": { x: 512, y: 176, rotation: -0.02, scaleX: 0.9, scaleY: 0.82 },
  "Magnet Head": { x: 512, y: 164, rotation: -0.02, scaleX: 0.82, scaleY: 0.78 }
};

const HEAD_PRESENTATION = {
  "Camera Head": { scale: 1.04, y: -16, rotation: -0.002 },
  "Liquid Tank Head": { scale: 1.18, y: 30, rotation: 0.004 },
  "Valve Head": { scale: 1.24, y: 34, rotation: -0.006 },
  "Satellite Head": { scale: 1.12, y: 24, rotation: 0.004 },
  "Tesla Coil Head": { scale: 1.14, y: 30, rotation: -0.004 },
  "Lamp Head": { scale: 1.12, y: 24, rotation: 0.004 },
  "Pressure Gauge Head": { scale: 1.08, y: 18, rotation: -0.004 },
  "Samurai Head": { scale: 1.08, y: 18, rotation: -0.004 },
  "Frankenstein Head": { scale: 1.08, y: 16, rotation: 0.004 },
  "Spaceman Head": { scale: 1.08, y: 18, rotation: -0.004 },
  "Ledger BTC Head": { scale: 1.24, y: 44, rotation: -0.004 },
  "Ledger ETH Head": { scale: 1.24, y: 44, rotation: -0.004 },
  "Battery Head": { scale: 1.1, y: 30, rotation: -0.004 },
  "Magnet Head": { scale: 1.08, y: 22, rotation: -0.004 }
};

function ensureDirs() {
  for (const dir of [buildLayoutsDir, buildAssembliesDir, buildTraitsDir, publicLayoutsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function tokenFromAssignment(assignment) {
  return {
    tokenId: assignment.tokenId,
    ...(assignment.indexes || {}),
    traitHash: assignment.traitHash,
    baseDna: assignment.baseDna,
    visualModifiers: assignment.visualModifiers,
    customization: assignment.customization
  };
}

function tokensForLayouts() {
  const forcePrototypes = process.env.LAM_LAYOUT_SOURCE === "prototypes";
  let tokens = catalog.prototypeTokens.slice(0, catalog.prototypeCount);

  if (!forcePrototypes && fs.existsSync(collectionAssignmentsPath)) {
    const assignments = JSON.parse(fs.readFileSync(collectionAssignmentsPath, "utf8"));
    tokens = assignments.map(tokenFromAssignment);
  }

  const limit = Number(process.env.LAM_LAYOUT_COUNT || 0);
  if (Number.isFinite(limit) && limit > 0) tokens = tokens.slice(0, limit);
  return tokens.sort((a, b) => a.tokenId - b.tokenId);
}

function label(catalogData, token) {
  const head = catalogData.head[token.head];
  const expressions = catalogData.expressionByHead[head] || ["Neutral Signal"];
  return {
    tokenId: token.tokenId,
    chassis: catalogData.chassis[token.chassis],
    head,
    expression: expressions[token.expression % expressions.length],
    clothes: catalogData.clothes[token.clothes],
    hat: catalogData.hat[token.hat],
    backAccessory: catalogData.backAccessory?.[token.backAccessory] || "None",
    neckTrait: catalogData.neckTrait?.[token.neckTrait] || "None",
    chestAccessory: catalogData.chestAccessory[token.chestAccessory],
    armItem: catalogData.armItem[token.armItem],
    background: catalogData.background[token.background],
    core: catalogData.core[token.core]
  };
}

function scatterStart(tokenId, index) {
  const side = index % 4;
  const seed = Math.sin((tokenId * 1009 + index * 9176) * 12.9898) * 43758.5453;
  const rand = seed - Math.floor(seed);
  const seed2 = Math.sin((tokenId * 409 + index * 7127) * 4.123) * 19341.842;
  const rand2 = seed2 - Math.floor(seed2);
  const margin = 92;
  const x = side === 0 ? margin + rand * 160 : side === 1 ? 1024 - margin - rand * 160 : margin + rand * (1024 - margin * 2);
  const y = side === 2 ? margin + rand2 * 160 : side === 3 ? 1024 - margin - rand2 * 160 : margin + rand2 * (1024 - margin * 2);
  return {
    x: Math.round(x),
    y: Math.round(y),
    rotation: (rand - 0.5) * 1.4
  };
}

function makePlacementFactory(tokenId, placements, defaults) {
  return function place(key, x, y, rotation, scaleX, scaleY, z, options = {}) {
    const id = placements.length + 1;
    const role = options.role;
    const traitLayer = options.traitLayer;
    let opacity = options.opacity ?? 1;
    if (role === "clothes" || traitLayer === "clothes") {
      const lift = opacity < 0.5 ? 0.3 : opacity < 0.75 ? 0.22 : 0.1;
      opacity = Math.min(0.96, Math.max(0.68, opacity + lift));
      opacity = Math.min(0.98, opacity + (1 - opacity) * 0.25);
    }
    const placement = {
      id,
      placementId: id,
      key,
      x,
      y,
      rotation,
      scaleX,
      scaleY: scaleY ?? scaleX,
      z,
      zIndex: z,
      material: options.material || defaults.material,
      shadeStyle: options.shadeStyle || defaults.shadeStyle,
      opacity,
      assembly: options.assembly ?? true,
      flipX: Boolean(options.flipX),
      flipY: Boolean(options.flipY),
      owned: true,
      locked: false,
      role,
      expression: options.expression,
      blink: options.blink,
      facePart: options.facePart,
      traitLayer,
      liveGasMeter: options.liveGasMeter,
      motion: options.motion,
      static: options.static,
      lifeRotation: options.lifeRotation,
      packShape: options.packShape,
      packIcon: options.packIcon,
      peek: options.peek,
      peekClipBottom: options.peekClipBottom,
      meterStyle: options.meterStyle,
      counterStyle: options.counterStyle,
      counterLabel: options.counterLabel,
      counterColor: options.counterColor,
      counterAccent: options.counterAccent,
      scarVariant: options.scarVariant,
      cleanPlate: options.cleanPlate ?? (key === "plate.riveted" && z >= 40 && z < 60)
    };
    placement.target = {
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
      scaleX: placement.scaleX,
      scaleY: placement.scaleY
    };
    placement.start = scatterStart(tokenId, id);
    placements.push(placement);
    return placement;
  };
}

function isGoldenEditionPalette(palette) {
  return String(palette?.id || "").toLowerCase() === "goldenedition"
    || String(palette?.surface || "").toLowerCase() === "royalgold";
}

function applyGoldenEditionLayout(layout) {
  const palette = layout.visualModifiers?.palette || layout.canvas?.materialSkin;
  if (!isGoldenEditionPalette(palette)) return layout;

  layout.special = {
    ...(layout.special || {}),
    id: "goldenEdition",
    name: "Full Gold Edition",
    materialSkin: GOLDEN_EDITION_SKIN
  };
  layout.visualModifiers = {
    ...(layout.visualModifiers || {}),
    edition: "Full Gold Edition",
    palette: GOLDEN_EDITION_SKIN,
    slots: {
      ...(layout.visualModifiers?.slots || {}),
      backgroundColor: GOLDEN_EDITION_SKIN.background,
      bodyMaterial: "fullGold",
      headMaterial: "fullGold",
      clothesColor: "#e6a42f",
      bagColor: "#3a2107",
      eyeColor: "#fff0a6",
      coreColor: "#ffc43f",
      metalTrim: "#ffc43f",
      glowColor: GOLDEN_EDITION_SKIN.glow,
      saleCounterStyle: "vaultSeal",
      blockCounterStyle: "brassGearbox",
      saleDigitColor: "#fff0a6",
      blockDigitColor: "#fff0a6"
    }
  };
  layout.canvas = {
    ...layout.canvas,
    backgroundColor: GOLDEN_EDITION_SKIN.background,
    backgroundName: "Golden Edition",
    materialSkin: GOLDEN_EDITION_SKIN,
    specialBackdrop: {
      mode: "royalGold",
      accent: GOLDEN_EDITION_SKIN.accent,
      secondary: GOLDEN_EDITION_SKIN.background,
      intensity: 0.9,
      pulseSpeed: 0.82
    }
  };
  layout.traits = {
    ...layout.traits,
    visualEdition: "Full Gold Edition"
  };
  layout.liquid = {
    ...layout.liquid,
    type: "Gold Resin",
    texture: "Metallic",
    colorIndex: 4,
    fillLevel: Math.max(82, Number(layout.liquid?.fillLevel || 0))
  };

  for (const part of layout.placements || []) {
    const key = String(part.key || "");
    const role = part.role || part.traitLayer;
    const isCounter = key.startsWith("counter.");
    const isExpression = role === "expression" || part.expression === true || part.material === "pfpFace";
    const isLiveDisplay = isCounter || key === "pack.gas.reader";
    if (isCounter) {
      part.counterColor = "#fff0a6";
      part.counterAccent = "#ffc43f";
      if (key === "counter.saleScreen") part.counterStyle = "vaultSeal";
      if (key === "counter.block") part.counterStyle = "brassGearbox";
      part.material = "darkGold";
      part.shadeStyle = "cleanLine";
    } else if (isExpression) {
      part.material = "goldenGlow";
      part.shadeStyle = "terminalGlow";
    } else if (isLiveDisplay) {
      part.material = "darkGold";
    } else if (part.material !== "pfpScreen") {
      part.material = part.z >= 70 ? "goldenGlow" : "fullGold";
      if (part.shadeStyle === "terminalGlow") part.shadeStyle = "rustWash";
    }
  }
  return layout;
}

function addBolts(place, points, z = 90, material = "pfpBlack") {
  for (const [x, y, scale = 0.42] of points) {
    place("fastener.cross", x, y, 0, scale, scale, z, { material, shadeStyle: "heavyInk" });
  }
}

function addChainCurve(place, centerX, centerY, width, z, accessory) {
  for (let i = 0; i < 7; i += 1) {
    const t = i / 6;
    const x = centerX - width / 2 + width * t;
    const y = centerY + Math.sin(t * Math.PI) * 42;
    place("chain.segment", x, y, 0.08 * (i - 3), 0.2, 0.18, z, {
      material: accessory === "Archive Key" ? "pfpSteel" : "pfpGold",
      shadeStyle: accessory === "Archive Key" ? "cleanLine" : "rustWash"
    });
  }
}

function addNeckAndBody(place, token, traits, defaults) {
  const chassis = MATERIAL_BY_CHASSIS[token.chassis] || "pfpSteel";
  const core = CORE_BY_TRAIT[token.core] || "pfpGlow";

  place("frame.box", 512, 820, 0, 2.6, 1.65, 1, { material: "graphiteInk", opacity: 0.13 });
  place("mesh.panel", 512, 768, 0.02, 1.72, 1.22, 2, { material: chassis, shadeStyle: "crosshatch", opacity: 0.72 });
  place("plate.riveted", 365, 765, -0.23, 1.18, 0.68, 3, { material: chassis, shadeStyle: "pencilSketch" });
  place("plate.riveted", 660, 770, 0.19, 1.16, 0.68, 3, { material: chassis, shadeStyle: "pencilSketch" });
  place("rail.notched", 512, 610, 0.03, 1.08, 0.46, 4, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 430, 644, -0.52, 0.58, 0.38, 5, { material: "pfpSteel", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 596, 646, 0.48, 0.58, 0.38, 5, { material: "pfpSteel", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 512, 566, 1.5708, 0.52, 0.42, 6, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("tube.flex", 486, 570, 1.5708, 0.22, 0.34, 7, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.78 });
  place("tube.flex", 540, 570, 1.5708, 0.22, 0.34, 7, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.78 });
  place("tank.round", 512, 780, 0, 0.82, 0.82, 12, { material: core, shadeStyle: "blueprintFade" });
  place("gear.large", 512, 780, 0.08, 0.78, 0.78, 13, { material: "pfpGold", shadeStyle: "crosshatch" });
  place("ring.sprocket", 512, 780, -0.08, 0.58, 0.58, 14, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("lens.aperture", 512, 780, 0, 0.44, 0.44, 15, { material: "pfpGlow", shadeStyle: "terminalGlow" });
  place("gear.medium", 392, 720, 0.24, 0.55, 0.55, 16, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gear.web", 638, 720, -0.28, 0.5, 0.5, 16, { material: "pfpSteel", shadeStyle: "crosshatch" });
  place("pulley.wheel", 394, 830, 0.18, 0.5, 0.5, 17, { material: "pfpGold", shadeStyle: "crosshatch" });
  place("gear.bevel", 626, 842, -0.18, 0.48, 0.48, 17, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("tank.vials", 690, 770, 1.24, 0.42, 0.42, 18, { material: "pfpGlow", shadeStyle: "blueprintFade" });
  place("tank.fluid", 332, 782, -0.22, 0.46, 0.46, 18, { material: "pfpGlow", shadeStyle: "blueprintFade" });
  place("plate.riveted", 386, 888, -0.14, 1.04, 0.66, 19, { material: chassis, shadeStyle: "pencilSketch", opacity: 0.9 });
  place("plate.riveted", 638, 890, 0.14, 1.04, 0.66, 19, { material: chassis, shadeStyle: "pencilSketch", opacity: 0.9 });
  place("mesh.panel", 512, 902, 0, 1.34, 0.56, 19.2, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.3 });
  place("rail.notched", 512, 930, 0, 1.14, 0.16, 19.5, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.72 });

  if (traits.clothes === "Black Pinstripe Shirt") addPinstripeClothes(place);
  if (traits.clothes === "Tech Hoodie") addHoodieClothes(place);
  if (traits.clothes === "Lab Coat") addLabCoat(place);
  if (traits.clothes === "Mechanic Jacket") addMechanicJacket(place);
  if (traits.clothes === "Archive Robe") addArchiveRobe(place);
  if (traits.clothes === "Royal Coat") addRoyalCoat(place);
  if (traits.clothes === "Transparent Pinstripe Shirt") addTransparentPinstripeShirt(place);
  if (traits.clothes === "Smoked Glass Jacket") addSmokedGlassJacket(place);
  if (traits.clothes === "Cyan Lab Glass Coat") addCyanLabGlassCoat(place);
  if (traits.clothes === "Amber Resin Robe") addAmberResinRobe(place);
  if (traits.clothes === "Dirty Glass Mechanic Jacket") addDirtyGlassMechanicJacket(place);
  if (traits.clothes === "Mercury Hoodie") addMercuryHoodie(place);
  if (traits.clothes === "Blue Reactor Vest") addBlueReactorVest(place);
  if (traits.clothes === "Gold Wire Suit") addGoldWireSuit(place);
  if (traits.clothes === "Black Chrome Harness") addBlackChromeHarness(place);
  if (traits.clothes === "Rusted Cage Vest") addRustedCageVest(place);
  if (traits.clothes === "Fluid Tube Jacket") addFluidTubeJacket(place);
  if (traits.clothes === "Speaker Chest Vest") addSpeakerChestVest(place);
  if (traits.clothes === "Archive Trench Coat") addArchiveTrenchCoat(place);
  if (traits.clothes === "Crimson Pressure Coat") addCrimsonPressureCoat(place);
  if (traits.clothes === "Void Glass Cloak") addVoidGlassCloak(place);
  if (traits.clothes === "Porcelain Grid Suit") addPorcelainGridSuit(place);
  if (traits.clothes === "Copper Coil Harness") addCopperCoilHarness(place);
  if (traits.clothes === "Green Signal Poncho") addGreenSignalPoncho(place);
  if (traits.clothes === "Silver Mercury Coat") addSilverMercuryCoat(place);
  if (traits.clothes === "Rust Forge Apron") addRustForgeApron(place);
  if (traits.clothes === "Royal Relic Mantle") addRoyalRelicMantle(place);
  if (traits.clothes === "Raw Machine") {
    place("vent.grille", 512, 872, 0, 1.2, 0.62, 20, { material: "pfpBlack", shadeStyle: "cleanLine" });
    place("pipe.sleeved", 456, 826, 1.5708, 0.62, 0.28, 21, { material: "pfpSteel", shadeStyle: "cleanLine" });
    place("pipe.sleeved", 568, 826, 1.5708, 0.62, 0.28, 21, { material: "pfpSteel", shadeStyle: "cleanLine" });
    place("coil.tesla", 512, 852, 0, 0.34, 0.34, 22, { material: "pfpBlack", shadeStyle: "terminalGlow" });
  }

  addMechanicalArms(place, chassis);
  addBolts(place, [
    [360, 708], [430, 658], [512, 628], [600, 660], [672, 718]
  ], 88);
  addBolts(place, [
    [390, 880], [512, 920], [632, 888]
  ], 34);
}

function addMechanicalArms(place, chassis) {
  const sleeveMaterial = chassis === "boneWhite" ? "boneWhite" : "pfpBlack";
  const metalMaterial = chassis === "rustedIron" ? "rustedIron" : "pfpSteel";
  const goldMaterial = "pfpGold";

  for (const side of [-1, 1]) {
    const mirror = side === 1;
    place("plate.riveted", 512 + side * 214, 766, side * 0.12, 0.54, 0.3, 26, {
      material: sleeveMaterial,
      shadeStyle: "heavyInk",
      opacity: 0.94,
      flipX: mirror
    });
    place("pipe.sleeved", 512 + side * 234, 858, 1.5708, 0.7, 0.2, 27, {
      material: metalMaterial,
      shadeStyle: "cleanLine",
      flipX: mirror
    });
    place("pipe.sleeved", 512 + side * 234, 923, 1.5708, 0.58, 0.18, 27, {
      material: metalMaterial,
      shadeStyle: "cleanLine",
      opacity: 0.92,
      flipX: mirror
    });
    place("joint.ball", 512 + side * 234, 794, 0, 0.3, 0.3, 28, {
      material: goldMaterial,
      shadeStyle: "rustWash"
    });
    place("joint.ball", 512 + side * 234, 915, 0, 0.28, 0.28, 28, {
      material: goldMaterial,
      shadeStyle: "rustWash",
      opacity: 0.9
    });
    place("bracket.corner", 512 + side * 234, 928, 0, 0.24, 0.24, 29, {
      material: sleeveMaterial,
      shadeStyle: "heavyInk",
      flipX: mirror
    });
  }
}

function addClothingRivets(place, points, z, material = "pfpGold") {
  for (const [x, y, scale = 0.24] of points) {
    place("fastener.rivet", x, y, 0, scale, scale, z, { material, shadeStyle: "heavyInk" });
  }
}

function addSleeveShells(place, options = {}) {
  const {
    material = "pfpBlack",
    shadeStyle = "pencilSketch",
    accent = "pfpGold",
    glow = "pfpGlow",
    opacity = 0.72,
    cuff = accent,
    lineMaterial = "boneWhite"
  } = options;
  const sleeveLayer = {
    role: options.role || "clothes",
    traitLayer: options.traitLayer || "clothes"
  };

  for (const side of [-1, 1]) {
    const mirror = side === 1;
    const x = 512 + side * 234;
    place("mesh.panel", x, 845, side * 0.04, 0.46, 0.9, 30, {
      ...sleeveLayer,
      material,
      shadeStyle,
      opacity,
      flipX: mirror
    });
    place("plate.riveted", x, 915, side * 0.03, 0.42, 0.82, 30, {
      ...sleeveLayer,
      material,
      shadeStyle,
      opacity: Math.min(0.96, opacity + 0.08),
      flipX: mirror
    });
    place("rail.notched", x, 802, 0, 0.36, 0.12, 31, {
      ...sleeveLayer,
      material: cuff,
      shadeStyle: "rustWash",
      opacity: 0.88
    });
    place("rail.notched", x, 918, 0, 0.34, 0.12, 31, {
      ...sleeveLayer,
      material: cuff,
      shadeStyle: "rustWash",
      opacity: 0.82
    });
    place("tube.flex", x + side * 18, 884, 1.5708, 0.2, 0.4, 32, {
      ...sleeveLayer,
      material: glow,
      shadeStyle: "terminalGlow",
      opacity: 0.42,
      flipX: mirror
    });
    place("rail.notched", x - side * 18, 888, 1.5708, 0.62, 0.07, 32, {
      ...sleeveLayer,
      material: lineMaterial,
      shadeStyle: "cleanLine",
      opacity: 0.32
    });
  }
}

function addSplitTorsoPanels(place, leftMaterial, rightMaterial, options = {}) {
  const {
    shadeStyle = "pencilSketch",
    opacity = 0.92,
    centerMaterial = "pfpGold",
    z = 20
  } = options;

  place("plate.riveted", 392, 862, -0.22, 1.18, 0.78, z, { material: leftMaterial, shadeStyle, opacity });
  place("plate.riveted", 632, 862, 0.22, 1.18, 0.78, z, { material: rightMaterial, shadeStyle, opacity });
  place("mesh.panel", 512, 842, 0, 1.22, 1.08, z + 1, {
    material: "dirtyGlass",
    shadeStyle: "blueprintFade",
    opacity: 0.26
  });
  place("strip.rivet", 512, 838, 1.5708, 1.06, 0.34, z + 2, {
    material: centerMaterial,
    shadeStyle: "rustWash",
    opacity: 0.88
  });
}

function addCollarSet(place, material = "pfpBlack", accent = "pfpGold", glow = "pfpGlow", z = 23) {
  place("rail.notched", 512, 666, 0, 0.76, 0.22, z, { material, shadeStyle: "cleanLine", opacity: 0.88 });
  place("plate.riveted", 456, 690, -0.5, 0.7, 0.36, z + 1, { material, shadeStyle: "heavyInk", opacity: 0.82 });
  place("plate.riveted", 568, 690, 0.5, 0.7, 0.36, z + 1, { material, shadeStyle: "heavyInk", opacity: 0.82 });
  place("pipe.curve", 458, 680, -0.62, 0.45, 0.34, z + 2, { material: accent, shadeStyle: "rustWash", opacity: 0.72 });
  place("pipe.curve", 566, 680, 0.62, 0.45, 0.34, z + 2, { material: accent, shadeStyle: "rustWash", opacity: 0.72, flipX: true });
  place("tube.flex", 512, 682, 0, 0.3, 0.18, z + 3, { material: glow, shadeStyle: "terminalGlow", opacity: 0.45 });
}

function addPinstripeClothes(place) {
  addSplitTorsoPanels(place, "pfpBlack", "pfpBlack", { shadeStyle: "heavyInk", opacity: 0.9, centerMaterial: "pfpGold" });
  addCollarSet(place, "pfpBlack", "pfpGold", "pfpGlow", 23);
  addSleeveShells(place, {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    accent: "pfpGold",
    glow: "pfpGlow",
    opacity: 0.68,
    lineMaterial: "boneWhite"
  });

  for (let i = -4; i <= 4; i += 1) {
    place("rail.notched", 512 + i * 28, 846, 1.5708 + i * 0.01, 0.66, 0.12, 24, {
      material: "boneWhite",
      shadeStyle: "cleanLine",
      opacity: 0.42
    });
  }
  for (const side of [-1, 1]) {
    const x = 512 + side * 235;
    for (let i = -1; i <= 1; i += 1) {
      place("rail.notched", x + i * 10, 895, 1.5708, 0.62, 0.055, 33, {
        material: "boneWhite",
        shadeStyle: "cleanLine",
        opacity: 0.28
      });
    }
  }
  place("plate.riveted", 610, 834, 0.12, 0.42, 0.3, 25, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.76 });
  place("strip.rivet", 610, 812, 0.05, 0.28, 0.1, 26, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.88 });
  addClothingRivets(place, [[512, 720], [512, 774], [512, 828], [512, 884]], 27, "pfpGold");
}

function addHoodieClothes(place) {
  addSplitTorsoPanels(place, "dirtyGlass", "dirtyGlass", { shadeStyle: "blueprintFade", opacity: 0.6, centerMaterial: "pfpGlow" });
  place("tube.loop.oval", 512, 664, 0, 1.04, 0.38, 23, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.76 });
  place("pipe.curve", 442, 672, -0.72, 0.78, 0.72, 24, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.78 });
  place("pipe.curve", 582, 672, 0.72, 0.78, 0.72, 24, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.78, flipX: true });
  place("mesh.panel", 512, 812, 0, 1.06, 0.42, 25, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.34 });
  place("pipe.sleeved", 492, 822, 1.5708, 0.9, 0.16, 26, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.92 });
  place("pipe.sleeved", 532, 822, 1.5708, 0.9, 0.16, 26, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.92 });
  place("fastener.hex", 492, 742, 0, 0.3, 0.3, 27, { material: "pfpGold", shadeStyle: "heavyInk" });
  place("fastener.hex", 532, 742, 0, 0.3, 0.3, 27, { material: "pfpGold", shadeStyle: "heavyInk" });
  addSleeveShells(place, {
    material: "dirtyGlass",
    shadeStyle: "blueprintFade",
    accent: "pfpSteel",
    glow: "pfpGlow",
    opacity: 0.5,
    lineMaterial: "pfpGlow"
  });
  addClothingRivets(place, [[448, 784], [576, 784], [448, 876], [576, 876]], 34, "pfpGlow");
}

function addLabCoat(place) {
  addSplitTorsoPanels(place, "boneWhite", "boneWhite", { shadeStyle: "cleanLine", opacity: 0.74, centerMaterial: "pfpBlack" });
  place("plate.riveted", 454, 700, -0.56, 0.76, 0.42, 23, { material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.78 });
  place("plate.riveted", 570, 700, 0.56, 0.76, 0.42, 23, { material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.78 });
  place("mesh.panel", 512, 838, 0, 1.02, 0.92, 24, { material: "glass", shadeStyle: "blueprintFade", opacity: 0.34 });
  place("tube.cell.mini", 646, 828, 0.08, 0.34, 0.34, 25, { material: "pfpGlow", shadeStyle: "terminalGlow" });
  place("gauge.pressure", 386, 810, -0.08, 0.34, 0.34, 25, { material: "boneWhite", shadeStyle: "cleanLine" });
  place("pipe.curve", 426, 768, -0.12, 0.42, 0.34, 26, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.5 });
  place("pipe.curve", 598, 768, 0.12, 0.42, 0.34, 26, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.5, flipX: true });
  addSleeveShells(place, {
    material: "boneWhite",
    shadeStyle: "cleanLine",
    accent: "pfpSteel",
    glow: "pfpGlow",
    opacity: 0.52,
    lineMaterial: "pfpSteel"
  });
  addClothingRivets(place, [[452, 768], [572, 768], [512, 900], [646, 804]], 34, "pfpBlack");
}

function addMechanicJacket(place) {
  addSplitTorsoPanels(place, "rustedIron", "rustedIron", { shadeStyle: "rustWash", opacity: 0.86, centerMaterial: "pfpBlack" });
  place("plate.riveted", 396, 770, -0.12, 0.9, 0.38, 23, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.76 });
  place("plate.riveted", 628, 770, 0.12, 0.9, 0.38, 23, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.76 });
  place("rail.notched", 512, 812, 1.5708, 1.16, 0.18, 24, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("chain.segment", 438, 708, -0.4, 0.34, 0.22, 25, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("chain.segment", 590, 708, 0.4, 0.34, 0.22, 25, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("strip.rivet", 640, 812, 1.5708, 0.76, 0.32, 26, { material: "pfpGold", shadeStyle: "rustWash" });
  place("vent.grille", 390, 812, -0.2, 0.42, 0.42, 26, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("tube.flex", 594, 874, 1.5708, 0.3, 0.38, 27, { material: "copper", shadeStyle: "rustWash", opacity: 0.74 });
  addSleeveShells(place, {
    material: "rustedIron",
    shadeStyle: "rustWash",
    accent: "pfpGold",
    glow: "copper",
    opacity: 0.62,
    lineMaterial: "pfpBlack"
  });
  addClothingRivets(place, [[430, 712], [600, 712], [512, 782], [512, 854], [372, 842], [652, 842]], 34, "pfpGold");
}

function addArchiveRobe(place) {
  place("mesh.panel", 512, 862, 0, 1.86, 1.18, 20, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.78 });
  place("plate.riveted", 414, 842, -0.12, 0.98, 1.0, 21, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.64 });
  place("plate.riveted", 610, 842, 0.12, 0.98, 1.0, 21, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.64 });
  place("mesh.panel", 512, 852, 0, 1.46, 0.94, 22, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.3 });
  place("pipe.curve", 452, 674, -0.62, 0.86, 0.56, 23, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pipe.curve", 572, 674, 0.62, 0.86, 0.56, 23, { material: "pfpGold", shadeStyle: "rustWash", flipX: true });
  place("strip.rivet", 512, 840, 1.5708, 1.1, 0.36, 24, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gear.small", 512, 714, 0.12, 0.5, 0.5, 25, { material: "pfpGold", shadeStyle: "rustWash" });
  for (let i = -3; i <= 3; i += 1) {
    place("rail.notched", 512 + i * 42, 898, 1.5708 + i * 0.02, 0.8, 0.08, 26, {
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.28
    });
  }
  addSleeveShells(place, {
    material: "graphiteInk",
    shadeStyle: "pencilSketch",
    accent: "pfpGold",
    glow: "pfpGlow",
    opacity: 0.46,
    lineMaterial: "pfpGold"
  });
}

function addRoyalCoat(place) {
  addSplitTorsoPanels(place, "pfpSteel", "pfpSteel", { shadeStyle: "cleanLine", opacity: 0.78, centerMaterial: "pfpGold" });
  place("plate.riveted", 448, 688, -0.48, 0.74, 0.42, 23, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 });
  place("plate.riveted", 576, 688, 0.48, 0.74, 0.42, 23, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 });
  place("ring.bolted", 512, 724, 0.08, 0.4, 0.4, 24, { material: "pfpGold", shadeStyle: "rustWash" });
  place("tube.cell.mini", 512, 828, 0, 0.38, 0.38, 25, { material: "pfpGlow", shadeStyle: "terminalGlow" });
  for (let i = 0; i < 5; i += 1) {
    place("rail.notched", 464 + i * 24, 802 + i * 18, 0.55, 0.3, 0.08, 26, {
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.72
    });
    place("rail.notched", 560 - i * 24, 802 + i * 18, -0.55, 0.3, 0.08, 26, {
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.72
    });
  }
  addSleeveShells(place, {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    accent: "pfpGold",
    glow: "pfpGlow",
    opacity: 0.58,
    lineMaterial: "pfpGold"
  });
  addClothingRivets(place, [[470, 752], [554, 752], [470, 818], [554, 818], [512, 884], [278, 806], [746, 806]], 34, "pfpGold");
}

function traitOptions(traitLayer, options = {}) {
  return {
    ...options,
    role: traitLayer,
    traitLayer
  };
}

function clothesOptions(options = {}) {
  const boosted = { ...options };
  if (typeof boosted.opacity === "number") {
    const lift = boosted.opacity < 0.56 ? 0.22 : boosted.opacity < 0.74 ? 0.16 : 0.08;
    boosted.opacity = Math.min(0.94, boosted.opacity + lift);
  } else {
    boosted.opacity = 0.86;
  }
  return traitOptions("clothes", boosted);
}

function addWardrobeSilhouette(place, options = {}) {
  const {
    material = "dirtyGlass",
    accent = "pfpGold",
    glow = "pfpGlow",
    shoulderOpacity = 0.66,
    lowerOpacity = 0.44,
    z = 31
  } = options;

  place("plate.riveted", 398, 742, -0.34, 1.08, 0.46, z, clothesOptions({
    material,
    shadeStyle: "pencilSketch",
    opacity: shoulderOpacity
  }));
  place("plate.riveted", 626, 742, 0.34, 1.08, 0.46, z, clothesOptions({
    material,
    shadeStyle: "pencilSketch",
    opacity: shoulderOpacity
  }));
  place("rail.notched", 430, 708, -0.32, 0.82, 0.1, z + 1, clothesOptions({
    material: accent,
    shadeStyle: "rustWash",
    opacity: 0.86
  }));
  place("rail.notched", 594, 708, 0.32, 0.82, 0.1, z + 1, clothesOptions({
    material: accent,
    shadeStyle: "rustWash",
    opacity: 0.86
  }));
  place("plate.riveted", 392, 910, -0.12, 1.02, 0.58, z, clothesOptions({
    material,
    shadeStyle: "pencilSketch",
    opacity: lowerOpacity
  }));
  place("plate.riveted", 632, 910, 0.12, 1.02, 0.58, z, clothesOptions({
    material,
    shadeStyle: "pencilSketch",
    opacity: lowerOpacity
  }));
  place("rail.notched", 512, 928, 0, 1.18, 0.09, z + 1, clothesOptions({
    material: accent,
    shadeStyle: "rustWash",
    opacity: 0.72
  }));
  place("tube.loop.oval", 512, 704, 0, 1.0, 0.24, z + 2, clothesOptions({
    material: glow,
    shadeStyle: "terminalGlow",
    opacity: 0.36
  }));
}

function addGlassPanelShell(place, leftMaterial, rightMaterial, options = {}) {
  const {
    opacity = 0.56,
    accent = "pfpGold",
    glow = "pfpGlow",
    center = accent,
    overlay = "dirtyGlass",
    shadeStyle = "blueprintFade"
  } = options;

  addSplitTorsoPanels(place, leftMaterial, rightMaterial, {
    shadeStyle,
    opacity,
    centerMaterial: center,
    z: 20
  });
  place("mesh.panel", 512, 828, 0, 1.18, 0.92, 22, clothesOptions({
    material: overlay,
    shadeStyle: "blueprintFade",
    opacity: Math.min(0.42, opacity * 0.68)
  }));
  place("tube.loop.oval", 512, 704, 0, 0.88, 0.28, 23, clothesOptions({
    material: glow,
    shadeStyle: "terminalGlow",
    opacity: 0.36
  }));
  place("strip.rivet", 512, 842, 1.5708, 1.02, 0.26, 24, clothesOptions({
    material: center,
    shadeStyle: "rustWash",
    opacity: 0.78
  }));
  addSleeveShells(place, {
    material: leftMaterial,
    shadeStyle,
    accent,
    glow,
    opacity: Math.max(0.38, opacity - 0.14),
    lineMaterial: accent
  });
  addWardrobeSilhouette(place, {
    material: leftMaterial,
    accent,
    glow,
    shoulderOpacity: Math.min(0.82, opacity + 0.12),
    lowerOpacity: Math.max(0.38, opacity - 0.02)
  });
}

function addTransparentPinstripeShirt(place) {
  addGlassPanelShell(place, "blackChrome", "voidGlass", {
    opacity: 0.58,
    accent: "goldRelic",
    glow: "pfpGlow",
    center: "pfpGold",
    overlay: "cyanGlass",
    shadeStyle: "heavyInk"
  });
  for (let i = -5; i <= 5; i += 1) {
    const opacity = i % 2 ? 0.24 : 0.36;
    place("rail.notched", 512 + i * 24, 838, 1.5708 + i * 0.008, 0.74, 0.055, 27, clothesOptions({
      material: i === 0 ? "pfpGlow" : "boneWhite",
      shadeStyle: i === 0 ? "terminalGlow" : "cleanLine",
      opacity
    }));
  }
  place("plate.riveted", 610, 814, 0.1, 0.42, 0.28, 28, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.68
  }));
  place("strip.rivet", 610, 794, 0.05, 0.3, 0.1, 29, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.9
  }));
  addClothingRivets(place, [[512, 718], [512, 772], [512, 826], [512, 884]], 30, "pfpGold");
}

function addSmokedGlassJacket(place) {
  addGlassPanelShell(place, "voidGlass", "blackChrome", {
    opacity: 0.54,
    accent: "mercuryGlass",
    glow: "violetGlass",
    center: "blackChrome",
    overlay: "voidGlass",
    shadeStyle: "blueprintFade"
  });
  place("plate.riveted", 392, 760, -0.28, 0.92, 0.42, 27, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.68
  }));
  place("plate.riveted", 632, 760, 0.28, 0.92, 0.42, 27, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.68
  }));
  for (const side of [-1, 1]) {
    place("bracket.corner", 512 + side * 116, 735, side * 0.64, 0.34, 0.34, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.84,
      flipX: side > 0
    }));
    place("wire.arc", 512 + side * 108, 808, side * 0.16, 0.3, 0.12, 29, clothesOptions({
      material: "graphiteInk",
      shadeStyle: "pencilSketch",
      opacity: 0.34,
      flipX: side > 0
    }));
  }
  addClothingRivets(place, [[424, 740], [600, 740], [382, 820], [642, 820]], 30, "pfpGold");
}

function addCyanLabGlassCoat(place) {
  addGlassPanelShell(place, "cyanGlass", "glass", {
    opacity: 0.54,
    accent: "boneWhite",
    glow: "pfpGlow",
    center: "mercuryGlass",
    overlay: "cyanGlass",
    shadeStyle: "cleanLine"
  });
  place("plate.riveted", 450, 700, -0.58, 0.78, 0.42, 27, clothesOptions({
    material: "boneWhite",
    shadeStyle: "cleanLine",
    opacity: 0.74
  }));
  place("plate.riveted", 574, 700, 0.58, 0.78, 0.42, 27, clothesOptions({
    material: "boneWhite",
    shadeStyle: "cleanLine",
    opacity: 0.74
  }));
  for (const [x, rot] of [[374, -0.12], [650, 0.12]]) {
    place("tube.cell.mini", x, 824, rot, 0.32, 0.32, 28, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.9
    }));
  }
  place("gauge.pressure", 512, 778, 0, 0.3, 0.3, 29, clothesOptions({
    material: "boneWhite",
    shadeStyle: "cleanLine"
  }));
  place("pipe.curve", 430, 768, -0.22, 0.44, 0.34, 30, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  }));
  place("pipe.curve", 594, 768, 0.22, 0.44, 0.34, 30, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.62,
    flipX: true
  }));
  addClothingRivets(place, [[452, 764], [572, 764], [512, 904], [650, 804]], 34, "pfpBlack");
}

function addAmberResinRobe(place) {
  addGlassPanelShell(place, "amberGlass", "goldRelic", {
    opacity: 0.58,
    accent: "pfpGold",
    glow: "amberGlass",
    center: "pfpGold",
    overlay: "amberGlass",
    shadeStyle: "rustWash"
  });
  place("mesh.panel", 512, 858, 0, 1.55, 0.95, 25, clothesOptions({
    material: "goldRelic",
    shadeStyle: "rustWash",
    opacity: 0.32
  }));
  for (const [x, y, scale, rot] of [[424, 780, 0.36, -0.14], [512, 812, 0.5, 0.08], [602, 780, 0.34, 0.16]]) {
    place("gear.small", x, y, rot, scale, scale, 27, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.78
    }));
  }
  for (let i = -3; i <= 3; i += 1) {
    place("rail.notched", 512 + i * 42, 902, 1.5708 + i * 0.025, 0.76, 0.08, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.34
    }));
  }
  place("arc.lightning", 512, 752, 0.12, 0.42, 0.36, 30, clothesOptions({
    material: "copper",
    shadeStyle: "terminalGlow",
    opacity: 0.5
  }));
}

function addDirtyGlassMechanicJacket(place) {
  addGlassPanelShell(place, "archiveTeal", "rustedIron", {
    opacity: 0.56,
    accent: "pfpGold",
    glow: "amberGlass",
    center: "blackChrome",
    overlay: "dirtyGlass",
    shadeStyle: "rustWash"
  });
  place("plate.riveted", 390, 774, -0.14, 0.9, 0.38, 27, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.7
  }));
  place("plate.riveted", 632, 774, 0.14, 0.9, 0.38, 27, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.7
  }));
  for (const side of [-1, 1]) {
    place("pipe.sleeved", 512 + side * 86, 824, 1.5708 + side * 0.12, 0.58, 0.14, 28, clothesOptions({
      material: "pfpSteel",
      shadeStyle: "cleanLine",
      opacity: 0.82
    }));
    place("spring.compact", 512 + side * 118, 842, 1.5708, 0.26, 0.22, 29, clothesOptions({
      material: "rustedIron",
      shadeStyle: "rustWash",
      opacity: 0.72
    }));
  }
  place("vent.grille", 390, 818, -0.18, 0.4, 0.36, 30, clothesOptions({
    material: "blackChrome",
    shadeStyle: "cleanLine"
  }));
  addClothingRivets(place, [[430, 712], [600, 712], [512, 782], [512, 854], [372, 842], [652, 842]], 34, "pfpGold");
}

function addMercuryHoodie(place) {
  addGlassPanelShell(place, "mercuryGlass", "blackChrome", {
    opacity: 0.52,
    accent: "mercuryGlass",
    glow: "mercuryGlass",
    center: "pfpSteel",
    overlay: "mercuryGlass",
    shadeStyle: "blueprintFade"
  });
  place("tube.loop.oval", 512, 658, 0, 1.1, 0.4, 27, clothesOptions({
    material: "pfpSteel",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  }));
  place("pipe.curve", 438, 676, -0.74, 0.7, 0.62, 28, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.66
  }));
  place("pipe.curve", 586, 676, 0.74, 0.7, 0.62, 28, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.66,
    flipX: true
  }));
  place("pipe.sleeved", 486, 820, 1.5708, 0.88, 0.14, 29, clothesOptions({
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.92
  }));
  place("pipe.sleeved", 538, 820, 1.5708, 0.88, 0.14, 29, clothesOptions({
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.92
  }));
  addClothingRivets(place, [[488, 738], [536, 738], [448, 884], [576, 884]], 34, "pfpGlow");
}

function addBlueReactorVest(place) {
  addGlassPanelShell(place, "blackChrome", "reactorGlass", {
    opacity: 0.56,
    accent: "pfpSteel",
    glow: "reactorGlass",
    center: "pfpGlow",
    overlay: "reactorGlass",
    shadeStyle: "blueprintFade"
  });
  place("tank.round", 512, 796, 0, 0.52, 0.52, 27, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.85
  }));
  for (const side of [-1, 1]) {
    place("tube.cell.mini", 512 + side * 108, 806, side * 0.1, 0.3, 0.3, 28, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow"
    }));
    place("pipe.curve", 512 + side * 76, 748, side * 0.45, 0.48, 0.36, 29, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.72,
      flipX: side > 0
    }));
    place("rail.notched", 512 + side * 122, 874, 1.5708, 0.66, 0.08, 30, clothesOptions({
      material: "pfpSteel",
      shadeStyle: "cleanLine",
      opacity: 0.76
    }));
  }
  addClothingRivets(place, [[430, 724], [594, 724], [440, 900], [584, 900]], 34, "pfpSteel");
}

function addGoldWireSuit(place) {
  addGlassPanelShell(place, "blackChrome", "blackChrome", {
    opacity: 0.62,
    accent: "pfpGold",
    glow: "pfpGold",
    center: "pfpGold",
    shadeStyle: "heavyInk"
  });
  for (let i = -4; i <= 4; i += 1) {
    const x = 512 + i * 34;
    place("rail.notched", x, 824, 1.5708 + i * 0.018, 0.72, 0.06, 27, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.56
    }));
  }
  for (let i = 0; i < 5; i += 1) {
    place("wire.arc", 512, 744 + i * 34, 0, 0.48 + i * 0.06, 0.12, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "terminalGlow",
      opacity: 0.42
    }));
  }
  place("ring.bolted", 512, 790, 0, 0.36, 0.36, 30, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash"
  }));
}

function addBlackChromeHarness(place) {
  addWardrobeSilhouette(place, {
    material: "blackChrome",
    accent: "pfpGold",
    glow: "mercuryGlass",
    shoulderOpacity: 0.74,
    lowerOpacity: 0.5,
    z: 31
  });
  place("mesh.panel", 512, 842, 0, 1.48, 1.02, 20, clothesOptions({
    material: "dirtyGlass",
    shadeStyle: "blueprintFade",
    opacity: 0.28
  }));
  place("rail.notched", 462, 822, 0.7, 1.22, 0.18, 24, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.9
  }));
  place("rail.notched", 562, 822, -0.7, 1.22, 0.18, 24, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.9
  }));
  place("rail.notched", 512, 914, 0, 1.08, 0.16, 25, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.84
  }));
  for (const [x, y, rot] of [[462, 790, 0.7], [562, 790, -0.7], [512, 914, 0]]) {
    place("fastener.hex", x, y, rot, 0.32, 0.32, 27, clothesOptions({
      material: "pfpGold",
      shadeStyle: "heavyInk"
    }));
  }
  place("rail.notched", 512, 676, 0, 0.96, 0.18, 35, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.92
  }));
  place("ring.bolted", 512, 812, 0, 0.34, 0.34, 36, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.95
  }));
  place("lens.aperture", 512, 812, 0, 0.22, 0.22, 37, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.9
  }));
  addSleeveShells(place, {
    material: "blackChrome",
    shadeStyle: "heavyInk",
    accent: "pfpGold",
    glow: "pfpGlow",
    opacity: 0.48,
    lineMaterial: "pfpGold"
  });
}

function addRustedCageVest(place) {
  addWardrobeSilhouette(place, {
    material: "amberGlass",
    accent: "rustedIron",
    glow: "amberGlass",
    shoulderOpacity: 0.5,
    lowerOpacity: 0.38,
    z: 31
  });
  place("mesh.panel", 512, 842, 0, 1.48, 1.05, 20, clothesOptions({
    material: "dirtyGlass",
    shadeStyle: "blueprintFade",
    opacity: 0.22
  }));
  for (let i = -3; i <= 3; i += 1) {
    place("axle.rod", 512 + i * 38, 838, 1.5708 + i * 0.02, 0.86, 0.06, 24, clothesOptions({
      material: "rustedIron",
      shadeStyle: "rustWash",
      opacity: 0.84
    }));
  }
  place("rail.notched", 512, 704, 0, 1.06, 0.12, 25, clothesOptions({
    material: "rustedIron",
    shadeStyle: "rustWash",
    opacity: 0.94
  }));
  place("rail.notched", 512, 918, 0, 1.2, 0.12, 25, clothesOptions({
    material: "rustedIron",
    shadeStyle: "rustWash",
    opacity: 0.92
  }));
  addClothingRivets(place, [[390, 706], [634, 706], [380, 918], [644, 918], [512, 706], [512, 918]], 28, "pfpGold");
  addSleeveShells(place, {
    material: "rustedIron",
    shadeStyle: "rustWash",
    accent: "pfpGold",
    glow: "copper",
    opacity: 0.34,
    lineMaterial: "rustedIron"
  });
}

function addFluidTubeJacket(place) {
  addGlassPanelShell(place, "violetGlass", "cyanGlass", {
    opacity: 0.54,
    accent: "mercuryGlass",
    glow: "violetGlass",
    center: "pfpGlow",
    overlay: "violetGlass",
    shadeStyle: "blueprintFade"
  });
  for (const side of [-1, 1]) {
    place("pipe.curve", 512 + side * 72, 746, side * 0.52, 0.62, 0.48, 27, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.76,
      flipX: side > 0
    }));
    place("tube.vial.crystal", 512 + side * 122, 824, side * 0.08, 0.24, 0.24, 28, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.92
    }));
    place("clamp.u", 512 + side * 82, 690, 0, 0.22, 0.22, 29, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash"
    }));
  }
  place("tube.loop.oval", 512, 700, 0, 0.9, 0.22, 30, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.68
  }));
}

function addSpeakerChestVest(place) {
  addGlassPanelShell(place, "voidGlass", "blackChrome", {
    opacity: 0.58,
    accent: "pfpGold",
    glow: "violetGlass",
    center: "blackChrome",
    overlay: "voidGlass",
    shadeStyle: "heavyInk"
  });
  place("ring.bolted", 512, 800, 0.02, 0.52, 0.52, 27, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash"
  }));
  place("vent.grille", 512, 800, 0.02, 0.64, 0.54, 28, clothesOptions({
    material: "blackChrome",
    shadeStyle: "cleanLine",
    opacity: 0.9
  }));
  place("tube.loop.oval", 512, 800, 0, 0.82, 0.2, 29, clothesOptions({
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.28
  }));
  for (const side of [-1, 1]) {
    place("wire.arc", 512 + side * 86, 806, side * 0.08, 0.34, 0.16, 30, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.34,
      flipX: side > 0
    }));
  }
}

function addArchiveTrenchCoat(place) {
  addGlassPanelShell(place, "archiveTeal", "dirtyGlass", {
    opacity: 0.56,
    accent: "pfpGold",
    glow: "pfpGlow",
    center: "pfpGold",
    overlay: "archiveTeal",
    shadeStyle: "pencilSketch"
  });
  place("mesh.panel", 512, 884, 0, 1.78, 1.08, 25, clothesOptions({
    material: "graphiteInk",
    shadeStyle: "pencilSketch",
    opacity: 0.32
  }));
  for (let i = -3; i <= 3; i += 1) {
    const x = 512 + i * 46;
    place("plate.riveted", x, 908 + Math.abs(i) * 8, i * 0.04, 0.28, 0.22, 27, clothesOptions({
      material: i % 2 ? "boneWhite" : "goldRelic",
      shadeStyle: "pencilSketch",
      opacity: 0.58
    }));
    place("fastener.rivet", x, 890 + Math.abs(i) * 6, 0, 0.14, 0.14, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "heavyInk"
    }));
  }
  place("bracket.corner", 512, 742, -0.78, 0.42, 0.42, 29, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash"
  }));
  addChainCurve(place, 512, 704, 150, 30, "Archive Key");
}

function addCrimsonPressureCoat(place) {
  addGlassPanelShell(place, "pressureRed", "blackChrome", {
    opacity: 0.62,
    accent: "pfpGold",
    glow: "pressureRed",
    center: "pressureRed",
    overlay: "amberGlass",
    shadeStyle: "rustWash"
  });
  place("gauge.pressure", 512, 784, 0, 0.48, 0.48, 27, clothesOptions({
    material: "pressureRed",
    shadeStyle: "heavyInk",
    opacity: 0.96
  }));
  for (const side of [-1, 1]) {
    place("tube.cell.mini", 512 + side * 118, 800, side * 0.1, 0.34, 0.34, 28, clothesOptions({
      material: "pressureRed",
      shadeStyle: "terminalGlow",
      opacity: 0.92
    }));
    place("pipe.curve", 512 + side * 84, 742, side * 0.52, 0.5, 0.38, 29, clothesOptions({
      material: "pressureRed",
      shadeStyle: "terminalGlow",
      opacity: 0.72,
      flipX: side > 0
    }));
    place("vent.grille", 512 + side * 120, 890, side * 0.08, 0.36, 0.34, 30, clothesOptions({
      material: "blackChrome",
      shadeStyle: "heavyInk",
      opacity: 0.84
    }));
  }
  place("rail.notched", 512, 910, 0, 1.16, 0.12, 31, clothesOptions({
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.64
  }));
  addClothingRivets(place, [[424, 726], [600, 726], [404, 900], [620, 900], [512, 720]], 34, "pfpGold");
}

function addVoidGlassCloak(place) {
  addGlassPanelShell(place, "voidGlass", "violetGlass", {
    opacity: 0.54,
    accent: "mercuryGlass",
    glow: "violetGlass",
    center: "pfpGold",
    overlay: "voidGlass",
    shadeStyle: "blueprintFade"
  });
  place("mesh.panel", 512, 884, 0, 1.92, 1.2, 25, clothesOptions({
    material: "voidGlass",
    shadeStyle: "blueprintFade",
    opacity: 0.34
  }));
  for (let i = -3; i <= 3; i += 1) {
    place("wire.arc", 512, 772 + i * 30, i * 0.03, 0.54 + Math.abs(i) * 0.035, 0.12, 27, clothesOptions({
      material: i === 0 ? "pfpGlow" : "violetGlass",
      shadeStyle: "terminalGlow",
      opacity: i === 0 ? 0.46 : 0.34
    }));
  }
  for (const side of [-1, 1]) {
    place("plate.riveted", 512 + side * 132, 802, side * 0.32, 0.46, 0.78, 28, clothesOptions({
      material: "voidGlass",
      shadeStyle: "heavyInk",
      opacity: 0.56,
      flipX: side > 0
    }));
    place("tube.loop.oval", 512 + side * 104, 748, side * 0.18, 0.32, 0.14, 29, clothesOptions({
      material: "violetGlass",
      shadeStyle: "terminalGlow",
      opacity: 0.5
    }));
  }
  place("lens.aperture", 512, 816, 0, 0.34, 0.34, 31, clothesOptions({
    material: "violetGlass",
    shadeStyle: "terminalGlow",
    opacity: 0.7
  }));
}

function addPorcelainGridSuit(place) {
  addGlassPanelShell(place, "boneWhite", "boneWhite", {
    opacity: 0.72,
    accent: "pfpSteel",
    glow: "pfpGlow",
    center: "pfpGold",
    overlay: "glass",
    shadeStyle: "cleanLine"
  });
  place("mesh.panel", 512, 838, 0, 1.32, 0.96, 25, clothesOptions({
    material: "boneWhite",
    shadeStyle: "cleanLine",
    opacity: 0.28
  }));
  for (let i = -3; i <= 3; i += 1) {
    place("rail.notched", 512 + i * 36, 842, 1.5708, 0.72, 0.055, 27, clothesOptions({
      material: i === 0 ? "pfpGold" : "pfpSteel",
      shadeStyle: "cleanLine",
      opacity: i === 0 ? 0.64 : 0.38
    }));
  }
  for (const side of [-1, 1]) {
    place("tube.cell.mini", 512 + side * 108, 824, side * 0.06, 0.28, 0.28, 28, clothesOptions({
      material: "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: 0.84
    }));
    place("plate.riveted", 512 + side * 98, 730, side * 0.38, 0.56, 0.32, 29, clothesOptions({
      material: "boneWhite",
      shadeStyle: "cleanLine",
      opacity: 0.82
    }));
  }
  addClothingRivets(place, [[420, 732], [604, 732], [420, 908], [604, 908], [512, 780]], 34, "pfpGold");
}

function addCopperCoilHarness(place) {
  addWardrobeSilhouette(place, {
    material: "blackChrome",
    accent: "copper",
    glow: "amberGlass",
    shoulderOpacity: 0.7,
    lowerOpacity: 0.5,
    z: 31
  });
  addSleeveShells(place, {
    material: "blackChrome",
    shadeStyle: "heavyInk",
    accent: "copper",
    cuff: "copper",
    glow: "amberGlass",
    lineMaterial: "copper",
    opacity: 0.64
  });
  place("mesh.panel", 512, 842, 0, 1.42, 1.02, 20, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.44
  }));
  place("coil.tesla", 512, 730, 0, 0.56, 0.56, 27, clothesOptions({
    material: "copper",
    shadeStyle: "terminalGlow",
    opacity: 0.96
  }));
  for (const side of [-1, 1]) {
    place("rail.notched", 512 + side * 94, 718, side * 0.26, 0.72, 0.12, 28, clothesOptions({
      material: "copper",
      shadeStyle: "rustWash",
      opacity: 0.92
    }));
    place("spring.compact", 512 + side * 122, 746, 1.5708, 0.34, 0.28, 29, clothesOptions({
      material: "copper",
      shadeStyle: "rustWash",
      opacity: 0.88
    }));
    place("arc.lightning", 512 + side * 102, 698, side * 0.12, 0.32, 0.3, 30, clothesOptions({
      material: "amberGlass",
      shadeStyle: "terminalGlow",
      opacity: 0.68,
      flipX: side > 0
    }));
  }
  addClothingRivets(place, [[394, 716], [630, 716], [412, 804], [612, 804]], 34, "copper");
}

function addGreenSignalPoncho(place) {
  addGlassPanelShell(place, "signalGreen", "archiveTeal", {
    opacity: 0.56,
    accent: "pfpGlow",
    glow: "signalGreen",
    center: "pfpGlow",
    overlay: "signalGreen",
    shadeStyle: "blueprintFade"
  });
  place("mesh.panel", 512, 822, 0, 1.82, 0.76, 25, clothesOptions({
    material: "signalGreen",
    shadeStyle: "blueprintFade",
    opacity: 0.32
  }));
  for (let i = 0; i < 4; i += 1) {
    place("wire.arc", 512, 724 + i * 34, 0, 0.42 + i * 0.08, 0.12, 27, clothesOptions({
      material: "signalGreen",
      shadeStyle: "terminalGlow",
      opacity: 0.42
    }));
  }
  for (const side of [-1, 1]) {
    place("axle.rod", 512 + side * 132, 772, side * 0.64, 0.46, 0.07, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "cleanLine",
      opacity: 0.72
    }));
    place("fastener.hex", 512 + side * 110, 730, 0, 0.24, 0.24, 29, clothesOptions({
      material: "signalGreen",
      shadeStyle: "terminalGlow",
      opacity: 0.86
    }));
  }
  addClothingRivets(place, [[388, 778], [636, 778], [432, 904], [592, 904]], 34, "pfpGold");
}

function addSilverMercuryCoat(place) {
  addGlassPanelShell(place, "mercuryGlass", "glass", {
    opacity: 0.6,
    accent: "pfpSteel",
    glow: "mercuryGlass",
    center: "mercuryGlass",
    overlay: "glass",
    shadeStyle: "cleanLine"
  });
  place("tube.loop.oval", 512, 762, 0, 0.94, 0.2, 27, clothesOptions({
    material: "mercuryGlass",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  }));
  for (let i = -2; i <= 2; i += 1) {
    place("pipe.sleeved", 512 + i * 42, 842, 1.5708 + i * 0.01, 0.82, 0.1, 28, clothesOptions({
      material: "mercuryGlass",
      shadeStyle: "cleanLine",
      opacity: 0.72
    }));
  }
  place("tank.round", 512, 812, 0, 0.36, 0.36, 29, clothesOptions({
    material: "mercuryGlass",
    shadeStyle: "terminalGlow",
    opacity: 0.88
  }));
  for (const side of [-1, 1]) {
    place("tube.vial.crystal", 512 + side * 120, 848, side * 0.08, 0.28, 0.28, 30, clothesOptions({
      material: "mercuryGlass",
      shadeStyle: "terminalGlow",
      opacity: 0.92
    }));
  }
}

function addRustForgeApron(place) {
  addGlassPanelShell(place, "rustedIron", "copper", {
    opacity: 0.64,
    accent: "copper",
    glow: "pressureRed",
    center: "pfpGold",
    overlay: "amberGlass",
    shadeStyle: "rustWash"
  });
  place("plate.riveted", 512, 872, 0, 1.18, 0.74, 27, clothesOptions({
    material: "rustedIron",
    shadeStyle: "rustWash",
    opacity: 0.82
  }));
  place("vent.grille", 512, 826, 0, 0.72, 0.46, 28, clothesOptions({
    material: "blackChrome",
    shadeStyle: "heavyInk",
    opacity: 0.86
  }));
  place("arc.lightning", 512, 772, 0.06, 0.42, 0.38, 29, clothesOptions({
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.56
  }));
  for (const side of [-1, 1]) {
    place("rail.notched", 512 + side * 76, 798, side * 0.62, 0.8, 0.12, 30, clothesOptions({
      material: "copper",
      shadeStyle: "rustWash",
      opacity: 0.82
    }));
    place("fastener.cross", 512 + side * 132, 890, 0, 0.24, 0.24, 31, clothesOptions({
      material: "pfpGold",
      shadeStyle: "heavyInk"
    }));
  }
}

function addRoyalRelicMantle(place) {
  addGlassPanelShell(place, "goldRelic", "violetGlass", {
    opacity: 0.58,
    accent: "pfpGold",
    glow: "violetGlass",
    center: "pfpGold",
    overlay: "amberGlass",
    shadeStyle: "rustWash"
  });
  place("mesh.panel", 512, 866, 0, 1.62, 1.04, 25, clothesOptions({
    material: "violetGlass",
    shadeStyle: "blueprintFade",
    opacity: 0.24
  }));
  for (const side of [-1, 1]) {
    place("gear.small", 512 + side * 122, 734, side * 0.18, 0.44, 0.44, 27, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.9
    }));
    place("chain.segment", 512 + side * 82, 786, side * 0.32, 0.32, 0.22, 28, clothesOptions({
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.82
    }));
    place("plate.riveted", 512 + side * 118, 832, side * 0.18, 0.5, 0.38, 29, clothesOptions({
      material: "goldRelic",
      shadeStyle: "rustWash",
      opacity: 0.72
    }));
  }
  place("ring.bolted", 512, 804, 0.04, 0.4, 0.4, 30, clothesOptions({
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.92
  }));
  addClothingRivets(place, [[420, 728], [604, 728], [454, 906], [570, 906], [512, 746]], 34, "pfpGold");
}

function addBackAccessory(place, traits) {
  if (!traits.backAccessory || traits.backAccessory === "None") return;

  const variants = {
    "Skate Wheel Pack": addSkateWheelPack,
    "Pressure Gauge Shoulder Bag": addPressureGaugeShoulderBag,
    "Chain Engine Bag": addChainEngineBag,
    "Fish Tank Backpack": addFishTankBackpack,
    "Cassette Bag": addCassetteBag,
    "Battery Meter Bag": addBatteryMeterBag,
    "Gas Canister Pack": addGasCanisterPack,
    "Transaction Printer Bag": addTransactionPrinterBag,
    "Mini Fan Pack": addMiniFanPack,
    "Arcade Pack": addArcadePack,
    "Mercury Spine Pack": addMercurySpinePack,
    "Dragon Furnace Pack": addDragonFurnacePack,
    "Fire Extinguisher Pack": addFireExtinguisherPack,
    "Diving Tank Battery": addDivingTankBatteryPack,
    "Ledger Pack": addLedgerPack,
    "Mailbox Pack": addMailboxPack,
    "Floppy Disk Pack": addFloppyDiskPack,
    "Road Barrier Pack": addRoadBarrierPack,
    "Traffic Light Pack": addTrafficLightPack,
    "Whale Vent Pack": addWhaleVentPack
  };
  variants[traits.backAccessory]?.(place);
}

function backOptions(options = {}) {
  return traitOptions("backAccessory", options);
}

function addShoulderPackBase(place, options = {}) {
  const {
    x = 694,
    y = 716,
    rotation = 0.08,
    material = "boneWhite",
    accent = "pfpGold",
    glow = "pfpGlow",
    packShape = "classic",
    meterStyle = "none",
    shellOpacity = 0.88,
    z = 0
  } = options;

  const packDropY = options.packDropY ?? 24;
  const packX = options.fitBehind === false ? x : Math.max(684, x);
  const packY = (options.fitBehind === false ? y : Math.min(y, 716)) + packDropY;
  const shellScaleX = options.shellScaleX ?? 1.08;
  const shellScaleY = options.shellScaleY ?? 1.3;
  const layerZ = options.layerZ ?? 0.12;
  const withShell = options.withShell !== false;
  if (withShell) {
    place("pack.shoulder.shell", packX, packY, rotation, shellScaleX, shellScaleY, layerZ + 0.04 + z, backOptions({
      material,
      shadeStyle: "pencilSketch",
      opacity: shellOpacity,
      packShape,
      peek: options.peekShell ?? true,
      peekClipBottom: options.shellClipBottom ?? 36,
      liveGasMeter: true,
      static: false,
      motion: true
    }));
    if (meterStyle === "gauge") {
      place("gauge.pressure", packX - 10, packY - 148, -0.04, 0.72, 0.72, layerZ + 0.2 + z, backOptions({
        material: "boneWhite",
        shadeStyle: "cleanLine",
        opacity: 0.94,
        liveGasMeter: true
      }));
    }
    addBolts(place, [[packX - 42, packY - 118, 0.15], [packX + 28, packY - 112, 0.15], [packX - 46, packY - 12, 0.15], [packX + 26, packY - 18, 0.15]], layerZ + 0.28 + z, accent);
  }
  return { x: packX, y: packY, rotation, material, accent, glow, packShape };
}

function addPackIcon(place, pack, packIcon, options = {}) {
  const peek = options.peek ?? true;
  const peekLift = peek ? (options.peekLift ?? -18) : 0;
  const iconScale = options.iconScale ?? 1.48;
  const scaleX = (options.scaleX ?? 0.66) * iconScale;
  const scaleY = (options.scaleY ?? 0.66) * iconScale;
  const clipBottom = options.peekClipBottom ?? 38;
  const builtInReaders = new Set([
    "pressureGauge",
    "skateboard",
    "fishTank",
    "battery",
    "fireExtinguisher",
    "divingTankBattery",
    "ledger",
    "mailbox",
    "floppy",
    "roadBarrier",
    "trafficLight",
    "whaleVent",
    "engineReader",
    "cassetteReader",
    "transactionPrinter",
    "arcadePack",
    "gasCanister",
    "dragonFurnace",
    "mercurySpine",
    "miniFan"
  ]);
  const needsStandaloneReader = (options.standaloneGasReader ?? !builtInReaders.has(packIcon)) === true;
  place("pack.icon", pack.x + (options.dx ?? 12), pack.y + (options.dy ?? -58) + peekLift, pack.rotation + (options.rotation ?? -0.02), scaleX, scaleY, options.z ?? 0.82, backOptions({
    material: options.material || pack.material,
    shadeStyle: options.shadeStyle || "pencilSketch",
    opacity: options.opacity ?? 0.96,
    packIcon,
    liveGasMeter: needsStandaloneReader ? false : (options.liveGasMeter ?? true),
    peek,
    peekClipBottom: clipBottom,
    static: options.static ?? false,
    motion: options.motion ?? true
  }));
  if (needsStandaloneReader) {
    place("pack.gas.reader", pack.x + (options.readerDx ?? 12), pack.y + (options.readerDy ?? -18), pack.rotation + (options.readerRotation ?? -0.02), options.readerScaleX ?? 0.56, options.readerScaleY ?? 0.52, options.readerZ ?? 1.04, backOptions({
      material: options.readerMaterial || "pfpBlack",
      shadeStyle: "terminalGlow",
      opacity: 0.98,
      liveGasMeter: true,
      static: false,
      motion: true
    }));
  }
}

function addSkateWheelPack(place) {
  const pack = addShoulderPackBase(place, { material: "boneWhite", glow: "pfpGlow", packShape: "skate", meterStyle: "none", x: 678, y: 762 });
  addPackIcon(place, pack, "skateboard", { dy: -86, scaleX: 0.74, scaleY: 0.54 });
  place("wheel.belt", pack.x - 12, pack.y - 48, 0, 0.2, 0.2, 0.86, backOptions({ material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.86, liveGasMeter: true }));
  place("wheel.belt", pack.x + 48, pack.y - 48, 0, 0.2, 0.2, 0.86, backOptions({ material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.86, liveGasMeter: true }));
}

function addPressureGaugeShoulderBag(place) {
  const pack = addShoulderPackBase(place, { material: "boneWhite", glow: "pressureRed", packShape: "gauge", x: 678, y: 760, showGasReader: false });
  addPackIcon(place, pack, "pressureGauge", { dy: -74, scaleX: 0.6, scaleY: 0.6 });
  place("valve.steam", pack.x + 34, pack.y - 24, 1.5708, 0.18, 0.14, 0.84, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 }));
}

function addChainEngineBag(place) {
  const pack = addShoulderPackBase(place, { material: "blackChrome", glow: "amberGlass", packShape: "engine", meterStyle: "none", x: 680, y: 760, shellOpacity: 0.7 });
  addPackIcon(place, pack, "engineReader", { dx: 28, dy: -96, scaleX: 0.75, scaleY: 0.72, iconScale: 1.12, material: "pfpBlack", peekClipBottom: 32, z: 0.9 });
  place("gear.small", pack.x - 2, pack.y - 18, 0.08, 0.3, 0.3, 0.82, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 }));
  place("gear.small", pack.x + 44, pack.y + 54, -0.08, 0.28, 0.28, 0.82, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 }));
  for (let i = 0; i < 6; i += 1) {
    place("chain.segment", pack.x + 18 + Math.sin(i * 0.9) * 18, pack.y - 4 + i * 15, i % 2 ? 0.18 : -0.18, 0.2, 0.14, 0.86, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.82, liveGasMeter: true }));
  }
}

function addFishTankBackpack(place) {
  const pack = addShoulderPackBase(place, { material: "glass", glow: "pfpGlow", packShape: "tank", meterStyle: "none", x: 680, y: 762, shellOpacity: 0.66 });
  addPackIcon(place, pack, "fishTank", { dy: -74, scaleX: 0.6, scaleY: 0.66, material: "glass" });
  place("pipe.elbow", pack.x + 4, pack.y - 46, -0.4, 0.16, 0.16, 0.84, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 }));
}

function addCassetteBag(place) {
  const pack = addShoulderPackBase(place, { material: "pfpBlack", glow: "pfpGlow", packShape: "cassette", meterStyle: "none", x: 678, y: 760, shellOpacity: 0.68 });
  addPackIcon(place, pack, "cassetteReader", { dx: 28, dy: -92, scaleX: 0.75, scaleY: 0.72, iconScale: 1.12, material: "pfpBlack", peekClipBottom: 32, z: 0.9 });
  place("mesh.panel", pack.x + 16, pack.y - 6, 0, 0.34, 0.2, 0.82, backOptions({ material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.26 }));
  place("wheel.belt", pack.x - 8, pack.y - 2, 0, 0.18, 0.18, 0.86, backOptions({ material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.88, liveGasMeter: true }));
  place("wheel.belt", pack.x + 42, pack.y - 2, 0, 0.18, 0.18, 0.86, backOptions({ material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.88, liveGasMeter: true }));
  place("rail.notched", pack.x + 18, pack.y + 42, 0, 0.34, 0.08, 0.86, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.82 }));
}

function addBatteryMeterBag(place) {
  const pack = addShoulderPackBase(place, { material: "boneWhite", glow: "pfpGlow", packShape: "battery", meterStyle: "none", x: 680, y: 762, shellOpacity: 0.72, showGasReader: false });
  addPackIcon(place, pack, "battery", { dy: -78, scaleX: 0.64, scaleY: 0.58 });
}

function addGasCanisterPack(place) {
  const pack = addShoulderPackBase(place, { material: "rustedIron", glow: "pressureRed", packShape: "canister", meterStyle: "none", x: 680, y: 760, shellOpacity: 0.7 });
  addPackIcon(place, pack, "gasCanister", { dy: -72, scaleX: 0.58, scaleY: 0.66, material: "pressureRed", peekClipBottom: 56 });
  place("valve.steam", pack.x + 28, pack.y - 32, 1.5708, 0.28, 0.18, 0.86, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.82 }));
}

function addTransactionPrinterBag(place) {
  const pack = addShoulderPackBase(place, { material: "boneWhite", glow: "amberGlass", packShape: "printer", meterStyle: "none", x: 678, y: 762, shellOpacity: 0.74 });
  addPackIcon(place, pack, "transactionPrinter", { dy: -76, scaleX: 0.64, scaleY: 0.58, material: "boneWhite", peekClipBottom: 52 });
}

function addMiniFanPack(place) {
  const pack = addShoulderPackBase(place, { material: "boneWhite", glow: "pfpGlow", packShape: "fan", meterStyle: "none", x: 678, y: 760 });
  addPackIcon(place, pack, "miniFan", { dy: -72, scaleX: 0.62, scaleY: 0.62, peekClipBottom: 66 });
  place("wheel.spoke.fine", pack.x + 10, pack.y - 68, 0, 0.24, 0.24, 0.86, backOptions({ material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.74, liveGasMeter: true }));
  place("rail.notched", pack.x + 20, pack.y + 66, 0, 0.34, 0.1, 0.86, backOptions({ material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.72 }));
}

function addArcadePack(place) {
  const pack = addShoulderPackBase(place, { material: "blackChrome", glow: "violetGlass", packShape: "arcade", meterStyle: "none", x: 680, y: 760, shellOpacity: 0.72 });
  addPackIcon(place, pack, "arcadePack", { dy: -76, scaleX: 0.64, scaleY: 0.58, material: "pfpBlack", peekClipBottom: 58 });
}

function addMercurySpinePack(place) {
  const pack = addShoulderPackBase(place, { material: "glass", glow: "glass", packShape: "spine", meterStyle: "none", x: 680, y: 762, shellOpacity: 0.64 });
  addPackIcon(place, pack, "mercurySpine", { dy: -76, scaleX: 0.58, scaleY: 0.68, material: "glass", peekClipBottom: 16 });
}

function addDragonFurnacePack(place) {
  const pack = addShoulderPackBase(place, { material: "rustedIron", glow: "pressureRed", packShape: "furnace", meterStyle: "none", x: 680, y: 760, shellOpacity: 0.72 });
  addPackIcon(place, pack, "dragonFurnace", { dy: -70, scaleX: 0.64, scaleY: 0.62, material: "pressureRed", peekClipBottom: 56 });
  place("gear.small", pack.x + 38, pack.y - 18, 0, 0.3, 0.3, 0.86, backOptions({ material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 }));
  place("smoke.curl", pack.x - 8, pack.y - 82, -0.12, 0.32, 0.36, 0.86, backOptions({ material: "pressureRed", shadeStyle: "terminalGlow", opacity: 0.42 }));
}

function addFireExtinguisherPack(place) {
  const pack = addShoulderPackBase(place, { material: "pressureRed", glow: "pressureRed", packShape: "fire", meterStyle: "none", shellOpacity: 0.78 });
  addPackIcon(place, pack, "fireExtinguisher", { dy: -76, scaleX: 0.58, scaleY: 0.68, material: "pressureRed", peekClipBottom: 34 });
}

function addDivingTankBatteryPack(place) {
  const pack = addShoulderPackBase(place, { material: "pfpGlow", glow: "pfpGlow", packShape: "diving", meterStyle: "none", shellOpacity: 0.68 });
  addPackIcon(place, pack, "divingTankBattery", { dy: -74, scaleX: 0.62, scaleY: 0.66, material: "pfpGlow", peekClipBottom: 12 });
}

function addLedgerPack(place) {
  const pack = addShoulderPackBase(place, { material: "blackChrome", glow: "pfpGlow", packShape: "ledger", meterStyle: "none", shellOpacity: 0.72 });
  addPackIcon(place, pack, "ledger", { dy: -76, scaleX: 0.68, scaleY: 0.56, material: "pfpBlack" });
}

function addMailboxPack(place) {
  const pack = addShoulderPackBase(place, { material: "pressureRed", glow: "amberGlass", packShape: "mailbox", meterStyle: "none", shellOpacity: 0.72 });
  addPackIcon(place, pack, "mailbox", { dy: -74, scaleX: 0.68, scaleY: 0.56, material: "pressureRed", peekClipBottom: 12 });
}

function addFloppyDiskPack(place) {
  const pack = addShoulderPackBase(place, { material: "violetGlass", glow: "amberGlass", packShape: "floppy", meterStyle: "none", shellOpacity: 0.72 });
  addPackIcon(place, pack, "floppy", { dy: -76, scaleX: 0.64, scaleY: 0.64, material: "violetGlass" });
}

function addRoadBarrierPack(place) {
  const pack = addShoulderPackBase(place, { material: "pfpGold", glow: "pressureRed", packShape: "barrier", meterStyle: "none", shellOpacity: 0.66 });
  addPackIcon(place, pack, "roadBarrier", { dy: -78, scaleX: 0.72, scaleY: 0.56, material: "pfpGold" });
}

function addTrafficLightPack(place) {
  const pack = addShoulderPackBase(place, { material: "pfpBlack", glow: "pressureRed", packShape: "traffic", meterStyle: "none", shellOpacity: 0.72, showGasReader: false });
  addPackIcon(place, pack, "trafficLight", { dy: -50, scaleX: 0.46, scaleY: 0.5, material: "pfpBlack", peekClipBottom: 90 });
}

function addWhaleVentPack(place) {
  const pack = addShoulderPackBase(place, { material: "pfpGlow", glow: "pfpGlow", packShape: "whale", meterStyle: "none", shellOpacity: 0.64 });
  addPackIcon(place, pack, "whaleVent", { dy: -76, scaleX: 0.76, scaleY: 0.56, material: "pfpGlow" });
}

function addLiveBlockCounter(place, token = {}) {
  const slots = token.visualModifiers?.slots || {};
  place("counter.block", 364, 968, -0.08, 0.72, 0.56, 38, {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.94,
    assembly: false,
    lifeRotation: false,
    counterStyle: slots.blockCounterStyle || "flipBlack",
    counterColor: slots.blockDigitColor || slots.eyeColor || "#66f5dd",
    counterAccent: slots.metalTrim || slots.coreColor || "#d7a13a"
  });
}

function addLiveHistoryStateParts(place, token = {}) {
  const slots = token.visualModifiers?.slots || {};
  place("counter.saleScreen", 333, 810, -0.12, 0.82, 0.82, 83, {
    material: "pfpBlack",
    shadeStyle: "terminalGlow",
    opacity: 0.98,
    role: "chain",
    traitLayer: "chain",
    lifeRotation: false,
    counterStyle: slots.saleCounterStyle || "pixelPocket",
    counterColor: slots.saleDigitColor || slots.eyeColor || "#66f5dd",
    counterAccent: slots.metalTrim || slots.coreColor || "#d7a13a"
  });
  place("counter.transferTally", 648, 784, 0.2, 0.94, 0.94, 84, {
    material: "pressureRed",
    shadeStyle: "rustWash",
    opacity: 0.98,
    role: "chain",
    traitLayer: "chain",
    scarVariant: "major",
    lifeRotation: false
  });
  place("counter.transferTally", 706, 848, 0.14, 0.78, 0.78, 84.2, {
    material: "pressureRed",
    shadeStyle: "rustWash",
    opacity: 0.98,
    role: "chain",
    traitLayer: "chain",
    scarVariant: "minor",
    lifeRotation: false
  });
}

function addNeckTrait(place, traits) {
  if (!traits.neckTrait || traits.neckTrait === "None") return;

  if (traits.neckTrait === "Gear Collar") addGearCollarTrait(place);
  if (traits.neckTrait === "Wire Scarf") addWireScarfTrait(place);
  if (traits.neckTrait === "Liquid Tube Necklace") addLiquidTubeNecklaceTrait(place);
  if (traits.neckTrait === "Pressure Hose") addPressureHoseTrait(place);
  if (traits.neckTrait === "Archive Tag") addArchiveTagTrait(place);
}

function addGearCollarTrait(place) {
  for (let i = 0; i < 7; i += 1) {
    const t = (i - 3) / 3;
    const x = 512 + t * 104;
    const y = 632 + Math.abs(t) * 22;
    place("gear.small", x, y, t * 0.18, 0.28, 0.28, 36, traitOptions("neckTrait", {
      material: "pfpGold",
      shadeStyle: i % 2 ? "rustWash" : "crosshatch"
    }));
  }
  place("tube.loop.oval", 512, 646, 0, 0.72, 0.2, 35, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.48
  }));
}

function addWireScarfTrait(place) {
  place("tube.loop.oval", 512, 648, -0.03, 0.96, 0.28, 35, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.62
  }));
  place("pipe.curve", 428, 646, -0.72, 0.54, 0.42, 36, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.86
  }));
  place("pipe.curve", 596, 646, 0.72, 0.54, 0.42, 36, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.86,
    flipX: true
  }));
  for (let i = 0; i < 5; i += 1) {
    place("fastener.rivet", 456 + i * 28, 654 + Math.sin(i) * 8, 0, 0.18, 0.18, 37, traitOptions("neckTrait", {
      material: i === 2 ? "pfpGlow" : "pfpGold",
      shadeStyle: i === 2 ? "terminalGlow" : "heavyInk",
      opacity: 0.88
    }));
  }
}

function addLiquidTubeNecklaceTrait(place) {
  place("tube.loop.oval", 512, 652, 0, 0.94, 0.26, 35, traitOptions("neckTrait", {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.74
  }));
  for (const x of [426, 598]) {
    place("clamp.u", x, 650, 0, 0.22, 0.22, 36, traitOptions("neckTrait", {
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.86
    }));
  }
  place("tube.cell.mini", 512, 666, 0, 0.24, 0.24, 37, traitOptions("neckTrait", {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.84
  }));
}

function addPressureHoseTrait(place) {
  place("tube.flex", 512, 650, 0, 0.74, 0.24, 35, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.72
  }));
  place("pipe.curve", 452, 650, -0.48, 0.52, 0.4, 36, traitOptions("neckTrait", {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.78
  }));
  place("pipe.curve", 572, 650, 0.48, 0.52, 0.4, 36, traitOptions("neckTrait", {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.78,
    flipX: true
  }));
  place("tube.cell.mini", 512, 678, 0, 0.18, 0.18, 37, traitOptions("neckTrait", {
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.58
  }));
}

function addArchiveTagTrait(place) {
  addChainCurve(place, 512, 620, 126, 35, "Archive Key");
  place("plate.riveted", 512, 684, -0.05, 0.38, 0.32, 37, traitOptions("neckTrait", {
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.9
  }));
  place("rail.notched", 512, 678, -0.05, 0.26, 0.06, 38, traitOptions("neckTrait", {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.86
  }));
  addClothingRivets(place, [[494, 684, 0.16], [530, 684, 0.16]], 38, "pfpBlack");
}

function addHead(place, token, traits) {
  const chassis = MATERIAL_BY_CHASSIS[token.chassis] || "pfpSteel";
  if (traits.head === "CRT TV") addTvHead(place, chassis, traits);
  if (traits.head === "Clock Head") addClockHead(place, chassis, traits);
  if (traits.head === "Cassette Player Head") addCassetteHead(place, chassis, traits);
  if (traits.head === "Film Projector Head") addFilmProjectorHead(place, chassis, traits);
  if (traits.head === "Diving Helmet Head") addDivingHelmetHead(place, chassis, traits);
  if (traits.head === "Old Computer Head") addComputerHead(place, chassis, traits);
  if (traits.head === "Gameboy Head") addGameboyHead(place, chassis, traits);
  if (traits.head === "Camera Head") addCameraHead(place, chassis, traits);
  if (traits.head === "Radio Head") addRadioHead(place, chassis, traits);
  if (traits.head === "Rotary Phone Head") addPhoneHead(place, chassis, traits);
  if (traits.head === "Pressure Gauge Head") addPressureGaugeHead(place, chassis, traits);
  if (traits.head === "Liquid Tank Head") addLiquidTankHead(place, chassis, traits);
  if (traits.head === "Valve Head") addValveHead(place, chassis, traits);
  if (traits.head === "Slot Machine Head") addSlotMachineHead(place, chassis, traits);
  if (traits.head === "Typewriter Head") addTypewriterHead(place, chassis, traits);
  if (traits.head === "Satellite Head") addSatelliteHead(place, chassis, traits);
  if (traits.head === "Tesla Coil Head") addTeslaCoilHead(place, chassis, traits);
  if (traits.head === "Lamp Head") addLampHead(place, chassis, traits);
  if (traits.head === "Samurai Head") addSamuraiHead(place, chassis, traits);
  if (traits.head === "Frankenstein Head") addFrankensteinHead(place, chassis, traits);
  if (traits.head === "Spaceman Head") addSpacemanHead(place, chassis, traits);
  if (traits.head === "Ledger BTC Head") addLedgerBtcHead(place, chassis, traits);
  if (traits.head === "Ledger ETH Head") addLedgerEthHead(place, chassis, traits);
  if (traits.head === "Battery Head") addBatteryHead(place, chassis, traits);
  if (traits.head === "Magnet Head") addMagnetHead(place, chassis, traits);
}

function addPanelBolts(place, x, y, w, h, z = 58, material = "pfpGold") {
  addBolts(place, [
    [x - w / 2, y - h / 2], [x + w / 2, y - h / 2],
    [x - w / 2, y + h / 2], [x + w / 2, y + h / 2]
  ], z, material);
}

function addButtonRow(place, x, y, count, gap, z, material = "pfpGold") {
  for (let i = 0; i < count; i += 1) {
    place("fastener.rivet", x + (i - (count - 1) / 2) * gap, y, 0, 0.36, 0.36, z, {
      material,
      shadeStyle: "heavyInk"
    });
  }
}

function addScreenExpression(place, expression, cx = 488, cy = 328, scale = 1, z = 70) {
  const warning = expression.includes("Warning") || expression.includes("Glitch") || expression.includes("Pressure") || expression.includes("Battery");
  const mat = "pfpFace";
  const smile = expression.includes("Happy") || expression.includes("Smirk") || expression.includes("Dial Smile");
  const tired = expression.includes("Sleep") || expression.includes("Bored") || expression.includes("Dead") || expression.includes("No Answer");
  const eyeTilt = smile ? -0.18 : tired ? -0.08 : 0.04;
  const mouthTilt = smile ? -0.18 : warning ? 0.08 : -0.1;
  const faceBase = { role: "expression", expression: true };
  const eyelid = { ...faceBase, material: mat, shadeStyle: "terminalGlow", opacity: 1, blink: "eyeLine" };
  const pupil = { ...faceBase, material: mat, shadeStyle: "terminalGlow", opacity: 0.98, blink: "eyePupil" };
  place("face.stroke", cx - 50 * scale, cy - 12 * scale, eyeTilt, 0.38 * scale, 0.14 * scale, z, { ...eyelid, facePart: "leftEyeLine" });
  place("face.stroke", cx + 44 * scale, cy - 22 * scale, eyeTilt, 0.38 * scale, 0.14 * scale, z, { ...eyelid, facePart: "rightEyeLine" });
  place("face.pupil", cx - 44 * scale, cy + 7 * scale, 0, 0.39 * scale, 0.39 * scale, z + 2, { ...pupil, facePart: "leftEyePupil" });
  place("face.pupil", cx + 50 * scale, cy - 3 * scale, 0, 0.39 * scale, 0.39 * scale, z + 2, { ...pupil, facePart: "rightEyePupil" });
  place("face.stroke", cx, cy + 54 * scale, mouthTilt, smile ? 0.38 * scale : 0.34 * scale, 0.11 * scale, z + 1, {
    ...faceBase,
    material: mat,
    shadeStyle: "terminalGlow",
    opacity: 1,
    facePart: "mouth"
  });
  if (warning) {
    place("arc.lightning", cx + 62 * scale, cy + 18 * scale, 0.35, 0.42 * scale, 0.42 * scale, z + 3, {
      ...faceBase,
      material: "copper",
      shadeStyle: "terminalGlow",
      facePart: "warningSpark"
    });
  }
}

function addLabelPlate(place, x, y, rotation, scaleX, z) {
  place("strip.rivet", x, y, rotation, scaleX, 0.22, z, { material: "pfpGold", shadeStyle: "rustWash" });
  place("rail.notched", x, y, rotation, scaleX * 0.55, 0.08, z + 1, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.82 });
}

function addTvHead(place, chassis, traits) {
  const shell = chassis === "boneWhite" ? "boneWhite" : "pfpBlack";
  place("frame.box", 512, 330, -0.04, 2.18, 1.34, 40, { material: shell, shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 330, -0.04, 1.98, 1.12, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.7 });
  place("mesh.panel", 474, 326, -0.04, 1.18, 0.78, 42, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.76 });
  place("frame.box", 474, 326, -0.04, 1.34, 0.88, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.58 });
  place("plate.riveted", 624, 330, -0.04, 0.5, 1.0, 44, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.78 });
  place("vent.grille", 626, 358, -0.04, 0.36, 0.62, 45, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("pulley.wheel", 624, 278, 0, 0.32, 0.32, 46, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pulley.wheel", 624, 314, 0, 0.28, 0.28, 46, { material: "pfpGold", shadeStyle: "rustWash" });
  addButtonRow(place, 624, 404, 3, 18, 47, "pfpGold");
  addLabelPlate(place, 610, 238, -0.04, 0.34, 48);
  place("joint.ball", 512, 230, 0, 0.22, 0.22, 48, { material: "pfpGold", shadeStyle: "rustWash" });
  place("axle.rod", 472, 200, -1.84, 0.48, 0.11, 49, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("axle.rod", 552, 198, -1.28, 0.5, 0.11, 49, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("fastener.rivet", 450, 166, 0, 0.16, 0.16, 50, { material: "pfpGold", shadeStyle: "heavyInk" });
  place("fastener.rivet", 574, 164, 0, 0.16, 0.16, 50, { material: "pfpGold", shadeStyle: "heavyInk" });
  addPanelBolts(place, 512, 330, 160, 94, 59);
  addScreenExpression(place, traits.expression, 478, 326, 1.02, 70);
}

function addClockHead(place, chassis, traits) {
  place("tank.round", 512, 330, -0.04, 1.32, 1.32, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("ring.bolted", 512, 330, -0.04, 1.24, 1.24, 41, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pulley.wheel.large", 512, 330, 0, 0.9, 0.9, 42, { material: "pfpBlack", shadeStyle: "crosshatch" });
  place("ring.bolted", 512, 330, 0, 0.82, 0.82, 43, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.7 });
  place("tube.loop.oval", 512, 218, -0.02, 0.44, 0.22, 44, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.86 });
  place("pipe.sleeved", 512, 246, 0, 0.42, 0.14, 45, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("gear.small", 624, 326, 0.1, 0.32, 0.32, 45, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pipe.sleeved", 628, 326, 1.5708, 0.28, 0.1, 46, { material: "pfpGold", shadeStyle: "cleanLine" });
  for (let i = 0; i < 12; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 12;
    const r = i % 3 === 0 ? 86 : 78;
    place("rail.notched", 512 + Math.cos(a) * r, 330 + Math.sin(a) * r, a + Math.PI / 2, i % 3 === 0 ? 0.18 : 0.12, 0.06, 54, {
      material: "pfpGold",
      shadeStyle: "rustWash",
      opacity: 0.9
    });
  }
  place("hand.clock", 512, 330, -1.18, 0.62, 0.16, 66, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.9 });
  place("hand.clock", 512, 330, 0.44, 0.46, 0.13, 67, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.86 });
  place("gear.small", 430, 354, 0.16, 0.38, 0.38, 46, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gear.small", 604, 306, -0.2, 0.34, 0.34, 46, { material: "pfpGold", shadeStyle: "crosshatch" });
  place("fastener.rivet", 620, 332, 0, 0.44, 0.44, 47, { material: "pfpGold", shadeStyle: "heavyInk" });
  place("fastener.rivet", 512, 330, 0, 0.34, 0.34, 72, { material: "pfpGold", shadeStyle: "heavyInk" });
  addScreenExpression(place, traits.expression, 512, 326, 0.94, 70);
}

function addCassetteHead(place, chassis, traits) {
  place("frame.box", 512, 330, -0.04, 2.32, 1.18, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 328, -0.04, 2.14, 1.0, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.78 });
  place("mesh.panel", 496, 324, -0.04, 1.24, 0.55, 42, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.76 });
  place("frame.box", 496, 324, -0.04, 1.34, 0.62, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.62 });
  place("pulley.wheel", 454, 342, 0, 0.4, 0.4, 44, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("pulley.wheel", 540, 336, 0, 0.4, 0.4, 44, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("gear.small", 628, 310, 0, 0.5, 0.5, 45, { material: "pfpGold", shadeStyle: "rustWash" });
  place("vent.grille", 632, 382, -0.04, 0.42, 0.48, 45, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("vent.grille", 380, 344, -0.04, 0.38, 0.62, 45, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("rail.notched", 512, 254, -0.04, 0.88, 0.14, 46, { material: "pfpGold", shadeStyle: "rustWash" });
  place("plate.riveted", 512, 414, -0.04, 1.7, 0.24, 46, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.82 });
  addButtonRow(place, 508, 400, 5, 26, 47, "pfpGold");
  addLabelPlate(place, 424, 272, -0.04, 0.42, 48);
  addPanelBolts(place, 512, 330, 174, 84, 59);
  addScreenExpression(place, traits.expression, 496, 324, 0.92, 70);
}

function addFilmProjectorHead(place, chassis, traits) {
  place("frame.box", 508, 348, -0.02, 1.62, 1.02, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 508, 348, -0.02, 1.38, 0.84, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.66 });
  place("pulley.wheel.large", 436, 240, -0.04, 0.5, 0.5, 42, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.9 });
  place("pulley.wheel.large", 570, 238, 0.04, 0.44, 0.44, 42, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.86 });
  place("pipe.sleeved", 504, 242, 0, 0.62, 0.12, 43, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.9 });
  place("mesh.panel", 492, 340, -0.02, 0.82, 0.58, 44, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.52 });
  place("frame.box", 492, 340, -0.02, 0.98, 0.68, 45, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.45 });
  place("ring.bolted", 594, 338, -0.02, 0.58, 0.58, 46, { material: "pfpGold", shadeStyle: "rustWash" });
  place("lens.aperture", 594, 338, -0.02, 0.54, 0.54, 47, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.78 });
  place("pipe.sleeved", 648, 338, 0, 0.48, 0.16, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.82 });
  place("tank.round", 676, 338, 0, 0.24, 0.18, 49, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.62 });
  place("strip.rivet", 444, 414, -0.04, 0.62, 0.18, 50, { material: "pfpGold", shadeStyle: "rustWash" });
  place("vent.grille", 552, 420, -0.02, 0.48, 0.24, 50, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.82 });
  place("wire.arc", 420, 346, -0.24, 0.34, 0.16, 51, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.6 });
  addPanelBolts(place, 508, 348, 126, 74, 59);
  addScreenExpression(place, traits.expression, 492, 342, 0.78, 70);
}

function addDivingHelmetHead(place, chassis, traits) {
  place("tank.round", 512, 330, -0.04, 1.42, 1.28, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("ring.bolted", 512, 330, -0.04, 1.08, 1.02, 41, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.58 });
  place("plate.riveted", 512, 228, -0.04, 0.58, 0.2, 42, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.86 });
  place("rail.notched", 512, 218, -0.04, 0.44, 0.08, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.9 });
  place("tank.round", 512, 228, -0.04, 0.24, 0.18, 44, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.78 });
  place("rail.notched", 512, 438, -0.04, 1.12, 0.18, 42, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 });
  place("ring.bolted", 478, 326, -0.04, 0.76, 0.76, 42, { material: "pfpGold", shadeStyle: "rustWash" });
  place("mesh.panel", 478, 326, -0.04, 0.58, 0.5, 43, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.58 });
  place("ring.bolted", 622, 326, -0.04, 0.54, 0.54, 42, { material: "pfpGold", shadeStyle: "rustWash" });
  place("vent.grille", 622, 326, -0.04, 0.36, 0.34, 43, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("ring.bolted", 394, 338, -0.04, 0.42, 0.42, 42, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.8 });
  place("pipe.sleeved", 408, 344, -0.22, 0.28, 0.18, 45, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 612, 380, 0.2, 0.28, 0.18, 45, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("tube.loop.oval", 430, 386, 0.32, 0.24, 0.22, 46, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.68 });
  addPanelBolts(place, 512, 330, 170, 118, 59);
  addScreenExpression(place, traits.expression, 478, 324, 0.62, 70);
}

function addComputerHead(place, chassis, traits) {
  place("oldcomputer.crt.head", 512, 318, -0.025, 1.02, 1.02, 40, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.98 });
  place("plate.riveted", 500, 296, -0.025, 1.22, 0.82, 42, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.36 });
  place("frame.box", 498, 296, -0.025, 1.08, 0.72, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.72 });
  place("mesh.panel", 498, 296, -0.025, 0.78, 0.48, 44, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.62 });
  place("plate.riveted", 618, 318, -0.025, 0.36, 0.88, 44, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.62 });
  place("vent.grille", 620, 306, -0.025, 0.3, 0.38, 46, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.86 });
  place("rail.notched", 618, 362, -0.025, 0.24, 0.05, 47, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.92 });
  place("fastener.rivet", 638, 384, 0, 0.13, 0.13, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.78 });
  place("pulley.wheel", 650, 388, 0, 0.18, 0.18, 49, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.88 });
  place("pipe.sleeved", 512, 372, -0.025, 0.66, 0.15, 46, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.84 });

  place("plate.riveted", 512, 386, -0.025, 1.62, 0.34, 47, { material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.88 });
  place("mesh.panel", 512, 381, -0.025, 1.32, 0.13, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.32 });
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      place("fastener.hex", 382 + col * 21 + (row % 2) * 7, 370 + row * 12, 0, 0.1, 0.1, 49, {
        material: row === 0 && col % 4 === 0 ? "pfpGold" : "pfpBlack",
        shadeStyle: "heavyInk",
        opacity: 0.88
      });
    }
  }
  place("rail.notched", 512, 406, -0.025, 0.9, 0.06, 50, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 });
  place("tube.flex", 430, 384, -0.5, 0.2, 0.12, 51, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.3 });
  addPanelBolts(place, 500, 296, 150, 96, 59, "pfpGold");
  addScreenExpression(place, traits.expression, 498, 296, 0.58, 70);
}

function addGameboyHead(place, chassis, traits) {
  place("plate.riveted", 512, 356, -0.06, 1.12, 1.66, 40, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.96 });
  place("rail.notched", 512, 258, -0.06, 0.58, 0.05, 42, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.68 });
  place("frame.box", 508, 302, -0.06, 0.98, 0.58, 44, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.88 });
  place("mesh.panel", 508, 302, -0.06, 0.56, 0.3, 45, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.7 });
  place("rail.notched", 508, 266, -0.06, 0.6, 0.045, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  place("fastener.rivet", 452, 270, 0, 0.1, 0.1, 46, { material: "pressureRed", shadeStyle: "heavyInk", opacity: 0.82 });

  place("ring.bolted", 466, 410, -0.06, 0.31, 0.31, 45, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.72 });
  place("rail.notched", 466, 410, -0.06, 0.35, 0.075, 47, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.96 });
  place("rail.notched", 466, 410, 1.5108, 0.35, 0.075, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.96 });
  place("fastener.rivet", 560, 402, 0, 0.3, 0.3, 45, { material: "pressureRed", shadeStyle: "heavyInk", opacity: 0.94 });
  place("fastener.rivet", 590, 430, 0, 0.27, 0.27, 45, { material: "pressureRed", shadeStyle: "heavyInk", opacity: 0.9 });
  place("ring.bolted", 560, 402, 0, 0.16, 0.16, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.42 });
  place("ring.bolted", 590, 430, 0, 0.15, 0.15, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.38 });
  place("rail.notched", 492, 454, -0.06, 0.24, 0.036, 46, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.74 });
  place("rail.notched", 536, 454, -0.06, 0.24, 0.036, 46, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.74 });
  for (let i = 0; i < 6; i += 1) {
    place("rail.notched", 550 + i * 9, 472 - i * 3, -0.45, 0.13, 0.03, 46, {
      material: "pfpBlack",
      shadeStyle: "cleanLine",
      opacity: 0.68
    });
  }
  place("pipe.sleeved", 512, 498, 0, 0.64, 0.16, 44, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.82 });
  addPanelBolts(place, 512, 352, 96, 150, 58, "pfpGold");
  addScreenExpression(place, traits.expression, 508, 302, 0.38, 70);
}

function addCameraHead(place, chassis, traits) {
  place("frame.box", 512, 330, -0.04, 1.96, 1.08, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 330, -0.04, 1.76, 0.96, 41, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("tank.round", 512, 334, 0, 0.94, 0.84, 44, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.78 });
  place("ring.bolted", 512, 334, 0.02, 0.98, 0.98, 45, { material: "pfpGold", shadeStyle: "rustWash" });
  place("lens.aperture", 512, 334, 0, 0.82, 0.82, 46, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.86 });
  place("mesh.panel", 512, 334, 0, 0.5, 0.44, 47, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.34 });
  place("ring.bolted", 512, 334, 0.02, 0.48, 0.48, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.42 });
  place("gear.web", 404, 282, -0.24, 0.38, 0.38, 47, { material: "pfpGold", shadeStyle: "crosshatch" });
  place("plate.riveted", 590, 242, -0.02, 0.36, 0.18, 47, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.84 });
  place("joint.ball", 612, 234, 0, 0.24, 0.18, 48, { material: "pfpGold", shadeStyle: "rustWash" });
  place("fastener.rivet", 590, 242, 0, 0.16, 0.16, 49, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.74 });
  place("fastener.rivet", 450, 252, 0, 0.18, 0.18, 48, { material: "pfpGold", shadeStyle: "heavyInk" });
  addPanelBolts(place, 512, 330, 144, 84, 59);
  addScreenExpression(place, traits.expression, 512, 334, 0.9, 70);
}

function addRadioHead(place, chassis, traits) {
  place("frame.box", 512, 330, 0.04, 2.18, 1.14, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("vent.grille", 430, 330, 0.04, 0.82, 0.86, 42, { material: "pfpBlack", shadeStyle: "cleanLine" });
  place("mesh.panel", 450, 330, 0.04, 0.7, 0.7, 43, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.18 });
  place("mesh.panel", 542, 324, 0.04, 0.86, 0.34, 43, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.2 });
  for (let i = 0; i < 6; i += 1) {
    place("fastener.rivet", 446 + i * 24, 324, 0, 0.12, 0.12, 44, { material: i % 2 ? "pfpGold" : "pfpBlack", shadeStyle: "heavyInk", opacity: 0.9 });
  }
  place("gear.medium", 606, 308, 0, 0.46, 0.46, 44, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gear.small", 608, 376, 0, 0.34, 0.34, 44, { material: "pfpGold", shadeStyle: "crosshatch" });
  place("coil.tesla", 512, 218, -1.5708, 0.36, 0.36, 45, { material: "pfpBlack", shadeStyle: "terminalGlow" });
  place("axle.rod", 610, 238, -0.9, 0.44, 0.07, 45, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.72 });
  place("fastener.rivet", 638, 196, 0, 0.16, 0.16, 46, { material: "pfpGold", shadeStyle: "heavyInk" });
  addButtonRow(place, 510, 392, 5, 24, 47, "pfpGold");
  place("mesh.panel", 520, 330, 0.04, 0.98, 0.5, 48, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.22 });
  addScreenExpression(place, traits.expression, 512, 326, 0.88, 70);
}

function addPhoneHead(place, chassis, traits) {
  place("frame.box", 512, 358, -0.04, 1.76, 1.02, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 374, -0.04, 1.55, 0.82, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.56 });
  place("tube.loop.oval", 512, 266, 0, 1.2, 0.3, 42, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("tank.round", 416, 268, -0.1, 0.34, 0.24, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.9 });
  place("tank.round", 608, 268, 0.1, 0.34, 0.24, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.9 });
  place("pipe.sleeved", 426, 286, 0.12, 0.32, 0.16, 43, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 598, 286, -0.12, 0.32, 0.16, 43, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("ring.bolted", 512, 348, -0.04, 1.02, 1.02, 44, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gear.crown", 512, 348, 0.08, 0.74, 0.74, 45, { material: "pfpBlack", shadeStyle: "heavyInk" });
  for (let i = 0; i < 12; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 12;
    place("fastener.rivet", 512 + Math.cos(a) * 66, 348 + Math.sin(a) * 66, 0, 0.24, 0.24, 46, {
      material: "boneWhite",
      shadeStyle: "cleanLine"
    });
  }
  place("lens.aperture", 512, 348, -0.04, 0.48, 0.48, 47, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.62 });
  place("ring.bolted", 512, 348, -0.04, 0.42, 0.42, 48, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.62 });
  place("fastener.rivet", 512, 348, 0, 0.28, 0.28, 49, { material: "pfpGold", shadeStyle: "heavyInk", opacity: 0.9 });
  place("plate.riveted", 512, 426, -0.04, 0.92, 0.3, 49, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.78 });
  place("vent.grille", 512, 426, -0.04, 0.74, 0.24, 50, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.94 });
  place("rail.notched", 512, 422, -0.04, 0.86, 0.08, 51, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 });
  addButtonRow(place, 512, 432, 5, 18, 51.5, "pfpGold");
  place("wire.arc", 420, 392, -0.2, 0.26, 0.18, 50, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.72 });
  place("pipe.sleeved", 604, 384, -0.34, 0.18, 0.13, 50, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.86 });
  addScreenExpression(place, traits.expression, 512, 344, 0.68, 70);
}

function addPressureGaugeHead(place, chassis, traits) {
  place("pipe.sleeved", 512, 456, 0, 0.74, 0.2, 40.2, { material: "pfpGold", shadeStyle: "cleanLine", lifeRotation: false });
  place("tank.round", 512, 330, -0.05, 1.26, 1.18, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("ring.bolted", 512, 330, -0.05, 1.16, 1.16, 41, { material: "pfpGold", shadeStyle: "rustWash" });
  place("gauge.pressure", 512, 330, -0.05, 1.28, 1.28, 42, { material: "boneWhite", shadeStyle: "pencilSketch" });
  place("ring.bolted", 512, 330, -0.05, 0.76, 0.76, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.5 });
  for (let i = 0; i < 11; i += 1) {
    const a = -2.35 + i * 0.47;
    place("rail.notched", 512 + Math.cos(a) * 72, 330 + Math.sin(a) * 72, a + 1.5708, i % 2 ? 0.12 : 0.18, 0.035, 44, {
      material: i > 7 ? "copper" : "pfpBlack",
      shadeStyle: "cleanLine",
      opacity: 0.82
    });
  }
  place("rail.notched", 560, 286, -0.2, 0.34, 0.08, 44, { material: "copper", shadeStyle: "terminalGlow", opacity: 0.7 });
  place("tube.cell.mini", 410, 370, 1.5708, 0.24, 0.24, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.56 });
  place("hand.clock", 512, 330, -0.74, 0.58, 0.1, 68, { material: "copper", shadeStyle: "terminalGlow", opacity: 0.96 });
  addScreenExpression(place, traits.expression, 512, 330, 0.7, 70);
  place("arc.lightning", 614, 278, 0.28, 0.42, 0.42, 71, { material: "copper", shadeStyle: "terminalGlow", opacity: 0.7 });
  addPanelBolts(place, 512, 330, 152, 110, 59);
}

function addLiquidTankHead(place, chassis, traits) {
  const mounted = { lifeRotation: false };
  place("tank.head.square", 512, 330, 0.02, 0.9, 0.86, 40, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.9, ...mounted });
  place("mesh.panel", 512, 330, 0.02, 0.9, 0.64, 42, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.18, ...mounted });
  place("rail.notched", 512, 238, 0.02, 0.92, 0.1, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92, ...mounted });
  place("rail.notched", 512, 424, 0.02, 0.92, 0.1, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92, ...mounted });
  place("pipe.sleeved", 512, 212, 0, 0.58, 0.17, 44, { material: "pfpGold", shadeStyle: "cleanLine", ...mounted });
  place("pipe.sleeved", 512, 450, 0, 0.58, 0.17, 44, { material: "pfpGold", shadeStyle: "cleanLine", ...mounted });
  for (const [x, y, scale] of [[436, 260, 0.16], [588, 260, 0.16], [436, 402, 0.14], [588, 402, 0.14], [512, 224, 0.14], [512, 436, 0.14]]) {
    place("fastener.rivet", x, y, 0, scale, scale, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.82, ...mounted });
  }
  addScreenExpression(place, traits.expression, 512, 326, 0.82, 70);
  place("tube.cell.mini", 622, 326, 1.5708, 0.24, 0.24, 46, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.82, ...mounted });
}

function addValveHead(place, chassis, traits) {
  place("pipe.sleeved", 512, 354, 0, 1.22, 0.34, 40, { material: "pfpSteel", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 412, 354, 1.5708, 0.38, 0.18, 40, { material: "pfpSteel", shadeStyle: "cleanLine" });
  place("pipe.sleeved", 612, 354, 1.5708, 0.38, 0.18, 40, { material: "pfpSteel", shadeStyle: "cleanLine" });
  place("valve.steam", 512, 356, 0, 1.08, 0.76, 41, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("gear.web", 512, 312, 0.08, 0.94, 0.94, 42, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pipe.sleeved", 512, 262, 0, 0.62, 0.14, 43, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("ring.bolted", 512, 312, 0.08, 0.76, 0.76, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.76 });
  place("tank.round", 512, 326, 0.08, 0.56, 0.5, 44, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.86 });
  place("ring.sprocket", 512, 326, 0.08, 0.44, 0.44, 45, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  addScreenExpression(place, traits.expression, 512, 326, 0.78, 70);
  addPanelBolts(place, 512, 356, 152, 76, 59);
}

function addSlotMachineHead(place, chassis, traits) {
  place("frame.box", 512, 342, -0.03, 1.72, 1.52, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 342, -0.03, 1.5, 1.26, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.72 });
  place("plate.riveted", 512, 226, -0.03, 1.22, 0.32, 42, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 });
  place("rail.notched", 512, 226, -0.03, 0.9, 0.08, 43, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.68 });
  place("frame.box", 512, 306, -0.03, 1.42, 0.56, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.48 });
  for (let i = -1; i <= 1; i += 1) {
    const x = 512 + i * 58;
    place("frame.box", x, 306, 0, 0.34, 0.42, 44, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.78 });
    place("gear.small", x, 298, 0.12 * i, 0.24, 0.24, 45, { material: i === 0 ? "pfpGold" : "pfpBlack", shadeStyle: "rustWash" });
    place("rail.notched", x, 326, 0, 0.24, 0.04, 46, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.78 });
  }
  place("pipe.sleeved", 666, 354, 1.5708, 0.7, 0.13, 46, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("joint.ball", 666, 270, 0, 0.32, 0.32, 47, { material: "pfpGold", shadeStyle: "rustWash" });
  place("fastener.rivet", 666, 432, 0, 0.22, 0.22, 47, { material: "pfpGold", shadeStyle: "heavyInk" });
  place("frame.box", 414, 382, 0, 0.38, 0.24, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.76 });
  place("rail.notched", 438, 400, 0, 0.34, 0.08, 49, { material: "pfpGold", shadeStyle: "rustWash" });
  place("vent.grille", 512, 438, -0.03, 0.92, 0.24, 49, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.84 });
  addButtonRow(place, 584, 396, 4, 20, 49, "pfpGold");
  place("rail.notched", 512, 382, -0.03, 0.96, 0.08, 50, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.55 });
  addScreenExpression(place, traits.expression, 512, 382, 0.76, 70);
  addPanelBolts(place, 512, 340, 134, 122, 59);
}

function addTypewriterHead(place, chassis, traits) {
  place("plate.riveted", 512, 270, -0.04, 1.42, 0.52, 40, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.68 });
  place("rail.notched", 512, 238, -0.04, 1.34, 0.12, 41, { material: "pfpGold", shadeStyle: "rustWash" });
  place("pipe.sleeved", 512, 252, -0.04, 1.0, 0.12, 42, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.9 });
  place("frame.box", 512, 346, -0.04, 2.08, 0.7, 43, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("plate.riveted", 512, 344, -0.04, 1.84, 0.48, 44, { material: "boneWhite", shadeStyle: "pencilSketch", opacity: 0.68 });
  place("mesh.panel", 508, 318, -0.04, 0.92, 0.28, 45, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.58 });
  place("plate.riveted", 512, 426, -0.04, 1.88, 0.5, 46, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("mesh.panel", 512, 430, -0.04, 1.56, 0.34, 46.2, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.18 });
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      place("fastener.rivet", 396 + col * 26 + (row % 2) * 11, 396 + row * 20, 0, row === 1 ? 0.17 : 0.15, row === 1 ? 0.17 : 0.15, 47, {
        material: row === 1 || col % 4 === 0 ? "pfpGold" : "pfpBlack",
        shadeStyle: "heavyInk"
      });
    }
  }
  place("strip.rivet", 512, 464, -0.04, 0.96, 0.18, 48, { material: "pfpGold", shadeStyle: "rustWash" });
  place("joint.ball", 390, 338, 0, 0.24, 0.24, 49, { material: "pfpGold", shadeStyle: "rustWash" });
  place("joint.ball", 636, 338, 0, 0.24, 0.24, 49, { material: "pfpGold", shadeStyle: "rustWash" });
  addScreenExpression(place, traits.expression, 508, 318, 0.64, 70);
  addPanelBolts(place, 512, 354, 164, 60, 59);
}

function addSatelliteHead(place, chassis, traits) {
  place("tank.round", 512, 330, -0.06, 0.82, 0.82, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("ring.bolted", 512, 330, -0.06, 0.74, 0.74, 41, { material: "pfpGold", shadeStyle: "rustWash" });
  place("lens.aperture", 512, 330, -0.06, 0.52, 0.52, 42, { material: "pfpGlow", shadeStyle: "terminalGlow" });
  place("plate.riveted", 382, 314, -0.24, 1.0, 0.42, 43, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.7 });
  place("plate.riveted", 642, 342, -0.24, 1.0, 0.42, 43, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.7 });
  place("mesh.panel", 512, 384, -0.04, 0.9, 0.34, 43, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.3 });
  place("fastener.hex", 512, 330, 0, 0.22, 0.22, 44, { material: "pfpGold", shadeStyle: "heavyInk", opacity: 0.78 });
  place("ring.bolted", 512, 330, -0.06, 0.46, 0.46, 44.2, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.62 });
  place("wire.arc", 512, 268, 0, 0.48, 0.2, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.58 });
  place("pipe.sleeved", 512, 238, 1.5708, 0.38, 0.16, 45, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("arc.lightning", 512, 202, 0, 0.42, 0.42, 46, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.82 });
  addScreenExpression(place, traits.expression, 512, 330, 0.52, 70);
}

function addTeslaCoilHead(place, chassis, traits) {
  place("frame.box", 512, 374, 0, 1.2, 0.8, 40, { material: "pfpBlack", shadeStyle: "heavyInk" });
  place("rail.notched", 512, 242, 0, 0.72, 0.1, 40, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.86 });
  place("coil.tesla", 512, 304, 0, 0.96, 0.96, 41, { material: "pfpBlack", shadeStyle: "terminalGlow" });
  place("plate.riveted", 512, 408, 0, 1.02, 0.36, 42, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.62 });
  place("mesh.panel", 512, 390, 0, 0.82, 0.42, 43, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.5 });
  place("frame.box", 512, 390, 0, 0.78, 0.46, 43.5, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.42 });
  place("pipe.sleeved", 512, 456, 0, 0.6, 0.18, 44, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("fastener.rivet", 512, 230, 0, 0.2, 0.2, 44, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.9 });
  place("arc.lightning", 430, 236, -0.16, 0.48, 0.48, 44, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.92 });
  place("arc.lightning", 586, 230, 0.2, 0.5, 0.5, 44, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.92, flipX: true });
  place("tube.flex", 438, 380, 1.5708, 0.24, 0.42, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.58 });
  place("tube.flex", 586, 380, 1.5708, 0.24, 0.42, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.58 });
  addScreenExpression(place, traits.expression, 512, 390, 0.78, 70);
}

function addLampHead(place, chassis, traits) {
  place("lamp.bulb.head", 512, 328, 0.02, 0.96, 0.96, 40, { material: "glass", shadeStyle: "blueprintFade", opacity: 0.96 });
  place("pipe.sleeved", 512, 458, 0, 0.66, 0.18, 45, { material: "pfpGold", shadeStyle: "cleanLine" });
  addScreenExpression(place, traits.expression, 512, 330, 0.62, 70);
}

function addSamuraiHead(place, chassis, traits) {
  place("tank.round", 512, 354, -0.04, 0.96, 0.88, 40, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.86 });
  place("plate.riveted", 512, 348, -0.04, 1.18, 0.7, 41, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.62 });
  place("mesh.panel", 512, 342, -0.04, 0.9, 0.4, 42, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.78 });
  place("frame.box", 512, 342, -0.04, 0.98, 0.46, 43, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.48 });
  place("pipe.sleeved", 512, 424, -0.04, 0.74, 0.14, 44, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 });
  place("samurai.kabuto", 512, 266, -0.02, 0.98, 0.9, 48, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.95 });
  place("rail.notched", 402, 366, 0.92, 0.34, 0.055, 49, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.72 });
  place("rail.notched", 624, 350, -0.92, 0.34, 0.055, 49, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.72 });
  place("chain.segment", 416, 396, 1.5708, 0.18, 0.1, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.68 });
  place("chain.segment", 608, 394, 1.5708, 0.18, 0.1, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.68 });
  addPanelBolts(place, 512, 344, 124, 64, 59);
  addScreenExpression(place, traits.expression, 512, 340, 0.72, 70);
}

function addFrankensteinHead(place, chassis, traits) {
  place("frame.box", 512, 342, 0.015, 1.42, 1.32, 38.5, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.64 });
  place("plate.riveted", 512, 342, 0.015, 1.24, 1.12, 40, { material: "signalGreen", shadeStyle: "pencilSketch", opacity: 0.88 });
  place("plate.riveted", 512, 260, 0.015, 1.2, 0.24, 42, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.82 });
  place("mesh.panel", 512, 330, 0.015, 0.9, 0.56, 43, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.34 });
  place("frame.box", 512, 330, 0.015, 0.96, 0.62, 44, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.32 });
  place("vent.grille", 512, 416, 0.015, 0.76, 0.22, 45, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.84 });
  place("pipe.sleeved", 392, 350, 0, 0.36, 0.14, 46, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.84 });
  place("pipe.sleeved", 632, 350, 0, 0.36, 0.14, 46, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.84 });
  place("ring.bolted", 390, 350, 0, 0.26, 0.26, 47, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  place("ring.bolted", 634, 350, 0, 0.26, 0.26, 47, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  place("rail.notched", 458, 238, -0.22, 0.32, 0.055, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  place("rail.notched", 566, 238, 0.22, 0.32, 0.055, 46, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.72 });
  place("arc.lightning", 410, 248, -0.12, 0.34, 0.34, 48, { material: "pressureRed", shadeStyle: "terminalGlow", opacity: 0.58 });
  place("arc.lightning", 614, 248, 0.12, 0.34, 0.34, 48, { material: "pressureRed", shadeStyle: "terminalGlow", opacity: 0.58, flipX: true });
  addPanelBolts(place, 512, 342, 112, 96, 59, "pfpGold");
  addScreenExpression(place, traits.expression, 512, 334, 0.66, 70);
}

function addSpacemanHead(place, chassis, traits) {
  place("spaceman.helmet.head", 512, 344, -0.03, 0.98, 0.98, 40, { material: "glass", shadeStyle: "blueprintFade", opacity: 0.96 });
  place("pipe.sleeved", 512, 466, 0, 0.64, 0.18, 44, { material: "pfpGold", shadeStyle: "cleanLine" });
  place("tank.vials", 638, 358, 0.08, 0.26, 0.34, 45, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.66 });
  place("pipe.curve", 596, 416, 0.72, 0.38, 0.28, 46, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.72 });
  addScreenExpression(place, traits.expression, 512, 348, 0.58, 70);
}

function addLedgerHardwareHead(place, traits, label, accent = "pfpGlow") {
  place("plate.riveted", 450, 334, -0.06, 1.25, 0.64, 40, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.84 });
  place("plate.riveted", 580, 330, -0.025, 0.42, 0.86, 41, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.76 });
  place("mesh.panel", 450, 332, -0.06, 0.76, 0.24, 44, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.5 });
  place("counter.block", 448, 330, -0.06, 0.48, 0.34, 49, { material: "pfpBlack", shadeStyle: "cleanLine", opacity: 0.98, counterLabel: label, lifeRotation: false });
  place("ring.bolted", 606, 358, -0.02, 0.2, 0.2, 47, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.72 });
  place("fastener.washer", 606, 358, 0, 0.28, 0.28, 50, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.88 });
  place("plate.riveted", 392, 296, -0.06, 0.48, 0.17, 46, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.68 });
  place("rail.notched", 504, 404, -0.04, 0.82, 0.055, 48, { material: accent, shadeStyle: "terminalGlow", opacity: 0.72 });
  place("pipe.sleeved", 512, 444, 0, 0.56, 0.14, 44, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.78 });
  place("tube.flex", 386, 390, -0.32, 0.26, 0.18, 46, { material: accent, shadeStyle: "terminalGlow", opacity: 0.46 });
  addButtonRow(place, 558, 392, 3, 18, 50, "pfpGold");
  addScreenExpression(place, traits.expression, 448, 314, 0.34, 70);
  place("face.stroke", 450, 350, -0.08, 0.2, 0.055, 73, {
    role: "expression",
    expression: true,
    material: "pfpFace",
    shadeStyle: "terminalGlow",
    opacity: 0.96,
    facePart: "mouth"
  });
}

function addLedgerBtcHead(place, chassis, traits) {
  addLedgerHardwareHead(place, traits, "BTC", "pfpGold");
}

function addLedgerEthHead(place, chassis, traits) {
  addLedgerHardwareHead(place, traits, "ETH", "pfpGlow");
  place("arc.lightning", 622, 300, 0.18, 0.18, 0.18, 50, { material: "pfpGold", shadeStyle: "terminalGlow", opacity: 0.48, flipX: true });
}

function addBatteryHead(place, chassis, traits) {
  place("plate.riveted", 512, 342, -0.014, 1.48, 1.06, 40, {
    material: "rustedIron",
    shadeStyle: "rustWash",
    opacity: 0.82,
    cleanPlate: true
  });
  place("plate.riveted", 422, 342, -0.014, 0.46, 0.96, 41, {
    material: "pressureRed",
    shadeStyle: "rustWash",
    opacity: 0.58,
    cleanPlate: true
  });
  place("plate.riveted", 602, 340, -0.014, 0.46, 0.96, 41, {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.62,
    cleanPlate: true
  });
  place("mesh.panel", 512, 342, -0.014, 1.02, 0.54, 43, {
    material: "pfpScreen",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  });
  place("plate.riveted", 512, 342, -0.014, 1.18, 0.68, 44, {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.28,
    cleanPlate: true
  });
  place("rail.notched", 512, 266, -0.014, 1.08, 0.09, 45, {
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.86
  });
  place("rail.notched", 512, 420, -0.014, 1.16, 0.12, 45, {
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.82
  });
  place("tube.flex", 512, 232, 0.02, 0.62, 0.18, 46, {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.82
  });
  place("ring.bolted", 456, 244, -0.02, 0.28, 0.28, 47, {
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.88
  });
  place("ring.bolted", 572, 244, -0.02, 0.26, 0.26, 47, {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.82
  });
  place("pipe.sleeved", 512, 470, -0.01, 0.56, 0.14, 47, {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.72
  });
  place("pipe.sleeved", 392, 350, 0, 0.26, 0.12, 48, {
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  });
  place("pipe.sleeved", 632, 350, 0, 0.26, 0.12, 48, {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.56
  });
  for (let i = 0; i < 5; i += 1) {
    place("tube.cell.mini", 464 + i * 24, 356, 1.5708, 0.16, 0.18, 49, {
      material: i < 4 ? "signalGreen" : "pfpGlow",
      shadeStyle: "terminalGlow",
      opacity: i < 4 ? 0.76 : 0.38
    });
  }
  place("counter.block", 512, 304, -0.014, 0.38, 0.22, 50, {
    material: "pfpBlack",
    shadeStyle: "cleanLine",
    opacity: 0.9,
    counterLabel: "BATT",
    counterStyle: "lcdGreen",
    counterColor: "#95ff29",
    lifeRotation: false
  });
  place("arc.lightning", 614, 388, 0.08, 0.22, 0.18, 51, {
    material: "pfpGold",
    shadeStyle: "terminalGlow",
    opacity: 0.48,
    flipX: true
  });
  addPanelBolts(place, 512, 342, 162, 116, 59, "pfpGold");
  addButtonRow(place, 600, 398, 2, 18, 60, "pfpGold");
  addScreenExpression(place, traits.expression, 512, 342, 0.46, 70);
}

function addMagnetHead(place, chassis, traits) {
  place("magnet.u.head", 512, 330, -0.012, 0.94, 0.94, 40, {
    material: "pfpSteel",
    shadeStyle: "cleanLine",
    opacity: 0.98
  });
  place("tube.flex", 396, 346, -0.62, 0.3, 0.14, 45, {
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.48
  });
  place("tube.flex", 628, 346, 0.62, 0.3, 0.14, 45, {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.48
  });
  place("tube.cell.mini", 382, 328, 1.5708, 0.2, 0.18, 46, {
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  });
  place("tube.cell.mini", 642, 328, 1.5708, 0.2, 0.18, 46, {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.62
  });
  place("plate.riveted", 512, 444, -0.012, 0.86, 0.32, 47, {
    material: "pfpBlack",
    shadeStyle: "heavyInk",
    opacity: 0.64
  });
  place("mesh.panel", 512, 430, -0.012, 0.54, 0.18, 48, {
    material: "pfpScreen",
    shadeStyle: "terminalGlow",
    opacity: 0.5
  });
  place("rail.notched", 512, 484, -0.012, 0.66, 0.075, 48, {
    material: "pfpGold",
    shadeStyle: "rustWash",
    opacity: 0.78
  });
  place("arc.lightning", 418, 226, -0.18, 0.16, 0.16, 49, {
    material: "pressureRed",
    shadeStyle: "terminalGlow",
    opacity: 0.42
  });
  place("arc.lightning", 606, 226, 0.18, 0.16, 0.16, 49, {
    material: "pfpGlow",
    shadeStyle: "terminalGlow",
    opacity: 0.42,
    flipX: true
  });
  addPanelBolts(place, 512, 330, 180, 156, 59, "pfpGold");
  addScreenExpression(place, traits.expression, 512, 428, 0.4, 70);
}

function topAnchorFor(traits) {
  return {
    ...DEFAULT_TOP_ANCHOR,
    head: traits.head,
    ...(HEAD_TOP_ANCHORS[traits.head] || {})
  };
}

function placeTop(place, anchor, key, dx, dy, rotation, scaleX, scaleY, z, options = {}) {
  const anchorRotation = anchor.rotation || 0;
  const cos = Math.cos(anchorRotation);
  const sin = Math.sin(anchorRotation);
  const x = anchor.x + dx * cos - dy * sin;
  const y = anchor.y + dx * sin + dy * cos;
  return place(
    key,
    x,
    y,
    (rotation || 0) + anchorRotation,
    scaleX * (anchor.scaleX || 1),
    scaleY * (anchor.scaleY || 1),
    z,
    options
  );
}

function addTopBolts(place, anchor, points, z = 72, material = "pfpGold") {
  for (const [dx, dy, scale = 0.24] of points) {
    placeTop(place, anchor, "fastener.rivet", dx, dy, 0, scale, scale, z, { material, shadeStyle: "heavyInk" });
  }
}

function addBlackBeanieTop(place, anchor) {
  placeTop(place, anchor, "plate.riveted", 0, 10, -0.02, 0.82, 0.26, 70, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.74 });
  placeTop(place, anchor, "mesh.panel", 0, 6, -0.02, 0.76, 0.18, 71, { material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 0.22 });
  for (let i = -2; i <= 2; i += 1) {
    placeTop(place, anchor, "wire.arc", i * 20, -2, i * 0.02, 0.13, 0.08, 71, {
      material: "graphiteInk",
      shadeStyle: "pencilSketch",
      opacity: 0.62
    });
  }
  placeTop(place, anchor, "rail.notched", 0, 31, -0.01, 0.88, 0.12, 71, { material: "pfpBlack", shadeStyle: "cleanLine" });
  placeTop(place, anchor, "strip.rivet", -38, 22, -0.06, 0.34, 0.14, 72, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.9 });
  addTopBolts(place, anchor, [[-50, 28, 0.18], [0, 24, 0.18], [50, 28, 0.18]], 72, "pfpGold");
}

function addFlatCapTop(place, anchor) {
  placeTop(place, anchor, "plate.riveted", -16, 16, -0.04, 0.98, 0.26, 70, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.9 });
  placeTop(place, anchor, "rail.notched", 64, 28, 0.02, 0.52, 0.18, 71, { material: "pfpBlack", shadeStyle: "cleanLine" });
  placeTop(place, anchor, "strip.rivet", -48, 15, -0.04, 0.38, 0.14, 72, { material: "pfpGold", shadeStyle: "rustWash" });
  addTopBolts(place, anchor, [[-76, 14, 0.18], [-18, 8, 0.18], [40, 14, 0.18]], 72, "pfpGold");
}

function addTopHatTop(place, anchor) {
  placeTop(place, anchor, "plate.riveted", 0, -18, 0, 0.62, 0.54, 70, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.9 });
  placeTop(place, anchor, "rail.notched", 0, 36, 0, 0.94, 0.18, 71, { material: "pfpBlack", shadeStyle: "cleanLine" });
  placeTop(place, anchor, "strip.rivet", 0, -2, 0, 0.52, 0.14, 72, { material: "pfpGold", shadeStyle: "rustWash" });
  addTopBolts(place, anchor, [[-34, -28, 0.16], [34, -28, 0.16], [-54, 34, 0.17], [54, 34, 0.17]], 72, "pfpGold");
}

function addArchiveVisorTop(place, anchor) {
  placeTop(place, anchor, "mesh.panel", 0, 22, 0, 0.8, 0.22, 70, { material: "dirtyGlass", shadeStyle: "blueprintFade", opacity: 0.32 });
  placeTop(place, anchor, "rail.notched", 0, 12, 0, 0.86, 0.08, 71, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.78 });
  placeTop(place, anchor, "rail.notched", 0, 30, 0, 0.74, 0.055, 71, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.44 });
  placeTop(place, anchor, "arc.lightning", 34, 8, -0.18, 0.18, 0.14, 72, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.5 });
  addTopBolts(place, anchor, [[-72, 20, 0.16], [72, 20, 0.16]], 72, "pfpGold");
}

function addGearCrownTop(place, anchor) {
  placeTop(place, anchor, "strip.rivet", 0, 28, 0, 0.76, 0.14, 70, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.88 });
  placeTop(place, anchor, "gear.small", -48, 10, -0.18, 0.28, 0.28, 71, { material: "pfpGold", shadeStyle: "rustWash" });
  placeTop(place, anchor, "gear.medium", 0, 2, 0.1, 0.34, 0.34, 71, { material: "pfpGold", shadeStyle: "crosshatch" });
  placeTop(place, anchor, "gear.small", 48, 10, 0.18, 0.28, 0.28, 71, { material: "pfpGold", shadeStyle: "rustWash" });
  placeTop(place, anchor, "ring.sprocket", 0, 2, -0.12, 0.22, 0.22, 72, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.82 });
}

function addSignalHaloTop(place, anchor) {
  placeTop(place, anchor, "tube.loop.oval", 0, -10, 0, 0.68, 0.2, 70, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.44 });
  placeTop(place, anchor, "wire.arc", -54, -2, -0.22, 0.24, 0.14, 71, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.56 });
  placeTop(place, anchor, "wire.arc", 54, -2, 0.22, 0.24, 0.14, 71, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.56, flipX: true });
  placeTop(place, anchor, "fastener.hex", -42, 26, 0, 0.18, 0.18, 72, { material: "pfpGold", shadeStyle: "heavyInk" });
  placeTop(place, anchor, "fastener.hex", 42, 26, 0, 0.18, 0.18, 72, { material: "pfpGold", shadeStyle: "heavyInk" });
}

function addBrokenAntennaCrownTop(place, anchor) {
  placeTop(place, anchor, "axle.rod", -28, -4, -0.72, 0.34, 0.07, 70, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.78 });
  placeTop(place, anchor, "axle.rod", 32, -5, 0.7, 0.32, 0.07, 70, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.78 });
  placeTop(place, anchor, "arc.lightning", 0, 4, 0, 0.26, 0.2, 71, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.62 });
  placeTop(place, anchor, "fastener.rivet", -48, -32, 0, 0.16, 0.16, 72, { material: "pfpGold", shadeStyle: "heavyInk" });
  placeTop(place, anchor, "fastener.rivet", 50, -32, 0, 0.16, 0.16, 72, { material: "pfpGold", shadeStyle: "heavyInk" });
  placeTop(place, anchor, "strip.rivet", 0, 28, 0, 0.62, 0.1, 72, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.74 });
}

function addTeslaConductorTop(place, anchor) {
  placeTop(place, anchor, "coil.tesla", 0, -6, -1.5708, 0.38, 0.38, 70, { material: "pfpBlack", shadeStyle: "terminalGlow" });
  placeTop(place, anchor, "axle.rod", -42, 6, -0.58, 0.42, 0.08, 71, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.86 });
  placeTop(place, anchor, "axle.rod", 42, 6, 0.58, 0.42, 0.08, 71, { material: "pfpGold", shadeStyle: "cleanLine", opacity: 0.86 });
  placeTop(place, anchor, "arc.lightning", -36, -28, -0.12, 0.28, 0.24, 72, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.82 });
  placeTop(place, anchor, "arc.lightning", 36, -28, 0.12, 0.28, 0.24, 72, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.82, flipX: true });
}

function addLampShadeTop(place, anchor) {
  placeTop(place, anchor, "plate.riveted", 0, 8, 0, 0.74, 0.26, 70, { material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.62 });
  placeTop(place, anchor, "rail.notched", 0, -8, 0, 0.7, 0.08, 71, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.82 });
  placeTop(place, anchor, "rail.notched", 0, 25, 0, 0.84, 0.08, 71, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.82 });
  placeTop(place, anchor, "tube.loop.oval", 0, -3, 0, 0.5, 0.16, 72, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.28 });
  addTopBolts(place, anchor, [[-54, 18, 0.16], [54, 18, 0.16]], 72, "pfpGold");
}

function addRoyalArchiveCrownTop(place, anchor) {
  if (anchor.head !== "Camera Head") {
    placeTop(place, anchor, "strip.rivet", 0, 30, 0, 0.82, 0.14, 70, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.92 });
  }
  placeTop(place, anchor, "tooth.shard", -54, -2, -0.36, 0.34, 0.34, 71, { material: "pfpGold", shadeStyle: "rustWash" });
  placeTop(place, anchor, "tooth.shard", 0, -18, 0, 0.42, 0.42, 71, { material: "pfpGold", shadeStyle: "crosshatch" });
  placeTop(place, anchor, "tooth.shard", 54, -2, 0.36, 0.34, 0.34, 71, { material: "pfpGold", shadeStyle: "rustWash", flipX: true });
  placeTop(place, anchor, "gear.small", 0, 8, 0.12, 0.28, 0.28, 72, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.72 });
  addTopBolts(place, anchor, [[-68, 28, 0.18], [-28, 26, 0.16], [28, 26, 0.16], [68, 28, 0.18]], 72, "pfpGold");
}

function addHat(place, traits) {
  if (!traits.hat || traits.hat === "No Hat") return;
  const anchor = topAnchorFor(traits);

  if (traits.hat === "Black Beanie") addBlackBeanieTop(place, anchor);
  if (traits.hat === "Flat Cap") addFlatCapTop(place, anchor);
  if (traits.hat === "Top Hat") addTopHatTop(place, anchor);
  if (traits.hat === "Archive Visor") addArchiveVisorTop(place, anchor);
  if (traits.hat === "Gear Crown") addGearCrownTop(place, anchor);
  if (traits.hat === "Signal Halo") addSignalHaloTop(place, anchor);
  if (traits.hat === "Broken Antenna Crown") addBrokenAntennaCrownTop(place, anchor);
  if (traits.hat === "Tesla Conductor Crown") addTeslaConductorTop(place, anchor);
  if (traits.hat === "Lamp Shade Cap") addLampShadeTop(place, anchor);
  if (traits.hat === "Royal Archive Crown") addRoyalArchiveCrownTop(place, anchor);
}

function addAccessories(place, traits) {
  if (traits.chestAccessory !== "None") {
    addChainCurve(place, 512, 635, 170, 74, traits.chestAccessory);
    if (traits.chestAccessory === "Gear Pendant") {
      place("gear.small", 512, 704, 0.12, 0.58, 0.58, 76, { material: "pfpGold", shadeStyle: "rustWash" });
    } else if (traits.chestAccessory === "Speaker Core") {
      place("ring.bolted", 512, 706, 0, 0.5, 0.5, 76, { material: "pfpBlack", shadeStyle: "heavyInk", opacity: 0.86 });
      place("mesh.panel", 512, 706, 0, 0.54, 0.34, 77, { material: "pfpScreen", shadeStyle: "terminalGlow", opacity: 0.54 });
      place("tube.loop.oval", 512, 706, 0, 0.48, 0.2, 78, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.58 });
      place("arc.lightning", 512, 690, 0, 0.28, 0.18, 79, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.54 });
    } else if (traits.chestAccessory === "Gold Chain") {
      addChainCurve(place, 512, 650, 206, 76, traits.chestAccessory);
      place("fastener.hex", 512, 708, 0, 0.32, 0.32, 78, { material: "pfpGold", shadeStyle: "heavyInk", opacity: 0.92 });
      place("ring.bolted", 512, 708, 0.08, 0.28, 0.28, 79, { material: "pfpGold", shadeStyle: "rustWash", opacity: 0.74 });
    } else {
      place("bracket.corner", 512, 704, -0.78, 0.46, 0.46, 76, { material: "pfpGold", shadeStyle: "rustWash" });
      place("axle.rod", 536, 730, 0.12, 0.42, 0.22, 77, { material: "pfpGold", shadeStyle: "cleanLine" });
    }
  }
  if (traits.armItem !== "None") {
    if (traits.armItem === "Floating Gauge") {
      place("pipe.sleeved", 694, 748, 0.28, 0.38, 0.16, 80, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.82 });
      place("gauge.pressure", 744, 718, -0.08, 0.42, 0.42, 81, { material: "boneWhite", shadeStyle: "cleanLine", opacity: 0.9 });
      place("tube.loop.oval", 744, 718, 0, 0.34, 0.16, 82, { material: "pfpGlow", shadeStyle: "terminalGlow", opacity: 0.36 });
    } else if (traits.armItem === "Valve Hand") {
      place("pipe.sleeved", 710, 742, 0.2, 0.5, 0.2, 80, { material: "pfpSteel", shadeStyle: "cleanLine", opacity: 0.86 });
      place("valve.steam", 750, 732, 0.18, 0.42, 0.3, 81, { material: "rustedIron", shadeStyle: "rustWash", opacity: 0.88 });
      place("arc.lightning", 762, 706, -0.2, 0.28, 0.24, 82, { material: "pressureRed", shadeStyle: "terminalGlow", opacity: 0.48 });
    } else {
      place("plate.riveted", 720, 735, 0.18, 0.64, 0.38, 80, { material: "pfpBlack", shadeStyle: "heavyInk" });
      place("gear.small", 720, 735, 0.08, 0.42, 0.42, 81, { material: "pfpGold", shadeStyle: "rustWash" });
      place("arc.lightning", 738, 706, -0.2, 0.36, 0.36, 82, { material: "pfpGlow", shadeStyle: "terminalGlow" });
    }
  }
}

function makeLayout(token) {
  const traits = label(catalog, token);
  const material = MATERIAL_BY_CHASSIS[token.chassis] || "pfpSteel";
  const shadeStyle = SHADE_BY_TOKEN[token.tokenId % SHADE_BY_TOKEN.length] || "pencilSketch";
  const defaults = { material, shadeStyle: "pencilSketch" };
  const placements = [];
  const place = makePlacementFactory(token.tokenId, placements, defaults);

  addBackAccessory(place, traits);
  addNeckAndBody(place, token, traits, defaults);
  addNeckTrait(place, traits);
  addHead(place, token, traits);
  addHat(place, traits);
  addAccessories(place, traits);
  addLiveBlockCounter(place, token);

  // Keep head/hat layers close to the neck so the prototype reads as a PFP
  // character instead of a separated exploded diagram.
  for (const placement of placements) {
    if ((placement.z ?? 0) >= 40 && (placement.z ?? 0) < 74) {
      placement.y += 84;
      placement.target.y += 84;
    }
  }

  const headScale = 1.24;
  const headAnchor = { x: 512, y: 405 };
  for (const placement of placements) {
    if ((placement.z ?? 0) < 40 || (placement.z ?? 0) >= 74) continue;
    placement.x = Math.round(headAnchor.x + (placement.x - headAnchor.x) * headScale);
    placement.y = Math.round(headAnchor.y + (placement.y - headAnchor.y) * headScale);
    placement.scaleX = Number((placement.scaleX * headScale).toFixed(3));
    placement.scaleY = Number((placement.scaleY * headScale).toFixed(3));
    placement.target.x = placement.x;
    placement.target.y = placement.y;
    placement.target.scaleX = placement.scaleX;
    placement.target.scaleY = placement.scaleY;
  }
  applyHeadPresentation(placements, traits.head);

  const pfpScale = 1.11;
  const pfpOffsetY = 58;
  const anchor = { x: 512, y: 650 };
  for (const placement of placements) {
    if (placement.assembly === false) continue;
    placement.x = Math.round(anchor.x + (placement.x - anchor.x) * pfpScale);
    placement.y = Math.round(anchor.y + (placement.y - anchor.y) * pfpScale + pfpOffsetY);
    placement.scaleX = Number((placement.scaleX * pfpScale).toFixed(3));
    placement.scaleY = Number((placement.scaleY * pfpScale).toFixed(3));
    placement.target.x = placement.x;
    placement.target.y = placement.y;
    placement.target.scaleX = placement.scaleX;
    placement.target.scaleY = placement.scaleY;
  }

  applyPfpPose(placements, token);
  addLiveHistoryStateParts(place, token);

  const baseLiquid = liquidForTraits(token, traits);
  const visualSlots = token.visualModifiers?.slots || {};
  const liquid = {
    ...baseLiquid,
    type: visualSlots.liquidType || baseLiquid.type,
    texture: visualSlots.liquidTexture || baseLiquid.texture,
    color: visualSlots.coreColor || baseLiquid.color,
    glow: visualSlots.glowColor || baseLiquid.glow
  };
  const backgroundColor = visualSlots.backgroundColor || catalog.backgroundPalette?.[traits.background] || FALLBACK_PFP_BACKGROUND;
  const traitsWithLiquid = {
    ...traits,
    liquidType: liquid.type,
    liquidTexture: liquid.texture
  };

  const layout = {
    schema: "mechanical-canvas-layout/v1",
    version: 1,
    tokenId: token.tokenId,
    name: `Motorhead #${token.tokenId}`,
    collection: "Motorheads",
    traitHash: token.traitHash || token.baseDna?.traitHash,
    baseDna: token.baseDna || null,
    visualModifiers: token.visualModifiers || null,
    customization: token.customization || null,
    traits: traitsWithLiquid,
    canvas: {
      width: 1024,
      height: 1024,
      style: "tealPfp",
      baseCanvas: "pfp-mechanical-assembly",
      mode: "tealPfp",
      backgroundColor,
      backgroundName: traits.background,
      materialSkin: token.visualModifiers?.palette || null,
      shadeStyle
    },
    defaults,
    liquid,
    placements: placements.sort((a, b) => (a.z ?? 0) - (b.z ?? 0)),
    connections: []
  };
  return applyGoldenEditionLayout(layout);
}

function liquidForTraits(token, traits) {
  if (traits.head === "Lamp Head") {
    return { type: "Gold Resin", texture: "Metallic", colorIndex: 4, fillLevel: 98 };
  }
  if (traits.head === "Liquid Tank Head") {
    return { type: "Abyssal Glow", texture: "Electric", colorIndex: 12, fillLevel: 92 };
  }

  const byCore = token.core === 2
    ? { type: "Red Pressure", texture: "Molten", colorIndex: 2, fillLevel: 82 }
    : token.core === 1
      ? { type: "Gold Resin", texture: "Metallic", colorIndex: 4, fillLevel: 76 }
      : { type: "Blue Coolant", texture: "Starfield", colorIndex: 1, fillLevel: 78 };

  const byClothes = {
    "Cyan Lab Glass Coat": { type: "Cosmic Aurora", texture: "Luminous", colorIndex: 8, fillLevel: 74 },
    "Amber Resin Robe": { type: "Deep Core Magma", texture: "Molten", colorIndex: 10, fillLevel: 82 },
    "Mercury Hoodie": { type: "Starlight Mercury", texture: "Metallic", colorIndex: 13, fillLevel: 70 },
    "Blue Reactor Vest": { type: "Abyssal Glow", texture: "Electric", colorIndex: 12, fillLevel: 86 },
    "Fluid Tube Jacket": { type: "Purple Ether", texture: "Starfield", colorIndex: 6, fillLevel: 80 },
    "Rusted Cage Vest": { type: "Root Amber", texture: "Ancient Sediment", colorIndex: 14, fillLevel: 68 },
    "Dirty Glass Mechanic Jacket": { type: "Geode Brine", texture: "Mineral Vein", colorIndex: 11, fillLevel: 72 },
    "Speaker Chest Vest": { type: "Nebula Ink", texture: "Smoky", colorIndex: 9, fillLevel: 78 },
    "Archive Trench Coat": { type: "Void Bloom", texture: "Ancient Sediment", colorIndex: 15, fillLevel: 66 },
    "Transparent Pinstripe Shirt": { type: "Blue Coolant", texture: "Starfield", colorIndex: 1, fillLevel: 78 },
    "Smoked Glass Jacket": { type: "Deep Teal Oil", texture: "Smoky", colorIndex: 0, fillLevel: 62 },
    "Gold Wire Suit": { type: "Gold Resin", texture: "Electric", colorIndex: 4, fillLevel: 76 },
    "Black Chrome Harness": { type: "Silver Mercury", texture: "Metallic", colorIndex: 5, fillLevel: 70 },
    "Crimson Pressure Coat": { type: "Red Pressure", texture: "Molten", colorIndex: 2, fillLevel: 86 },
    "Void Glass Cloak": { type: "Void Bloom", texture: "Starfield", colorIndex: 15, fillLevel: 72 },
    "Porcelain Grid Suit": { type: "Silver Mercury", texture: "Metallic", colorIndex: 5, fillLevel: 74 },
    "Copper Coil Harness": { type: "Deep Core Magma", texture: "Electric", colorIndex: 10, fillLevel: 82 },
    "Green Signal Poncho": { type: "Green Biofluid", texture: "Luminous", colorIndex: 3, fillLevel: 78 },
    "Silver Mercury Coat": { type: "Starlight Mercury", texture: "Metallic", colorIndex: 13, fillLevel: 76 },
    "Rust Forge Apron": { type: "Root Amber", texture: "Molten", colorIndex: 14, fillLevel: 70 },
    "Royal Relic Mantle": { type: "Gold Resin", texture: "Ancient Sediment", colorIndex: 4, fillLevel: 82 }
  };

  return byClothes[traits.clothes] || byCore;
}

const PFP_POSES = [
  { bodyDx: -11, bodyDy: 5, bodyRot: -0.028, headDx: 18, headDy: -6, headRot: 0.044 },
  { bodyDx: -8, bodyDy: 4, bodyRot: -0.022, headDx: 15, headDy: -5, headRot: 0.036 },
  { bodyDx: -13, bodyDy: 6, bodyRot: -0.034, headDx: 20, headDy: -7, headRot: 0.05 },
  { bodyDx: -9, bodyDy: 5, bodyRot: -0.024, headDx: 17, headDy: -6, headRot: 0.04 }
];

function transformPlacement(placement, transform) {
  const {
    anchor = { x: 512, y: 760 },
    dx = 0,
    dy = 0,
    rotation = 0,
    scale = 1
  } = transform;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const relX = (placement.x - anchor.x) * scale;
  const relY = (placement.y - anchor.y) * scale;

  placement.x = Math.round(anchor.x + relX * cos - relY * sin + dx);
  placement.y = Math.round(anchor.y + relX * sin + relY * cos + dy);
  placement.rotation = Number(((placement.rotation || 0) + rotation).toFixed(4));
  placement.scaleX = Number(((placement.scaleX || 1) * scale).toFixed(3));
  placement.scaleY = Number(((placement.scaleY || 1) * scale).toFixed(3));
  placement.target.x = placement.x;
  placement.target.y = placement.y;
  placement.target.rotation = placement.rotation;
  placement.target.scaleX = placement.scaleX;
  placement.target.scaleY = placement.scaleY;
}

function applyHeadPresentation(placements, head) {
  const presentation = HEAD_PRESENTATION[head];
  if (!presentation) return;

  for (const placement of placements) {
    const z = placement.z ?? 0;
    if (z < 40 || z >= 74 || placement.assembly === false) continue;
    transformPlacement(placement, {
      anchor: { x: 512, y: 405 },
      dx: presentation.x || 0,
      dy: presentation.y || 0,
      rotation: presentation.rotation || 0,
      scale: presentation.scale || 1
    });
  }
}

function applyPfpPose(placements, token) {
  const pose = PFP_POSES[token.tokenId % PFP_POSES.length] || PFP_POSES[0];
  const transforms = {
    innerBody: {
      anchor: { x: 512, y: 842 },
      dx: pose.bodyDx,
      dy: pose.bodyDy + 4,
      rotation: pose.bodyRot,
      scale: 0.925
    },
    outfit: {
      anchor: { x: 512, y: 850 },
      dx: pose.bodyDx * 0.54,
      dy: pose.bodyDy,
      rotation: pose.bodyRot * 0.62,
      scale: 1
    },
    bridge: {
      anchor: { x: 512, y: 655 },
      dx: pose.bodyDx * 0.18 + pose.headDx * 0.34,
      dy: pose.bodyDy * 0.3,
      rotation: pose.headRot * 0.28,
      scale: 0.99
    },
    head: {
      anchor: { x: 512, y: 405 },
      dx: pose.headDx,
      dy: pose.headDy + 34,
      rotation: pose.headRot,
      scale: 1
    }
  };

  for (const placement of placements) {
    if (placement.assembly === false) continue;
    const z = placement.z ?? 0;
    const role = placement.role || placement.traitLayer;

    if (z >= 40 && z < 74) {
      transformPlacement(placement, transforms.head);
    } else if (role === "neckTrait" || (z >= 35 && z < 40 && role !== "backAccessory")) {
      transformPlacement(placement, transforms.bridge);
    } else if (role === "clothes") {
      transformPlacement(placement, transforms.outfit);
    } else if (role === "backAccessory") {
      transformPlacement(placement, transforms.outfit);
    } else if (z > 0 && z < 30) {
      transformPlacement(placement, transforms.innerBody);
    } else if (z >= 74 || z >= 88) {
      transformPlacement(placement, transforms.outfit);
    }
  }
}

function writeLayout(layout) {
  const tokenId = layout.tokenId;
  const json = `${JSON.stringify(layout, null, 2)}\n`;
  fs.writeFileSync(path.join(buildLayoutsDir, `${tokenId}.json`), json);
  fs.writeFileSync(path.join(buildAssembliesDir, `${tokenId}.json`), json);
  fs.writeFileSync(path.join(publicLayoutsDir, `${tokenId}.json`), json);
  fs.writeFileSync(path.join(buildTraitsDir, `${tokenId}.json`), `${JSON.stringify(layout.traits, null, 2)}\n`);
  if (!quiet) console.log(`layout Motorhead #${tokenId}: ${layout.traits.head}, ${layout.placements.length} canvas parts`);
}

function main() {
  ensureDirs();
  for (const token of tokensForLayouts()) {
    writeLayout(makeLayout(token));
  }
}

if (require.main === module) main();

module.exports = { main, makeLayout };


