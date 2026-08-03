// web/src/schema.js
var MATERIALS = {
  graphiteInk: {
    label: "Graphite Ink",
    stroke: "#171b1d",
    fill: "rgba(18, 22, 25, 0.04)",
    dim: "#5c6468",
    tint: "rgba(20,24,27,0.16)",
    highlight: "rgba(255,255,255,0.34)"
  },
  blueprintSteel: {
    label: "Blueprint Steel",
    stroke: "#17384a",
    fill: "rgba(40, 120, 159, 0.095)",
    dim: "#28789f",
    tint: "rgba(40,120,159,0.22)",
    highlight: "rgba(196,239,255,0.38)"
  },
  brass: {
    label: "Brass",
    stroke: "#3f2a08",
    fill: "rgba(180, 130, 38, 0.24)",
    dim: "#b98528",
    tint: "rgba(210,151,42,0.32)",
    highlight: "rgba(255,232,139,0.48)",
    edge: "rgba(255,211,104,0.52)",
    metal: true,
    grit: "rgba(80,48,12,0.16)"
  },
  copper: {
    label: "Copper",
    stroke: "#55200f",
    fill: "rgba(200, 84, 38, 0.24)",
    dim: "#c95d2f",
    tint: "rgba(221,92,45,0.34)",
    highlight: "rgba(255,190,126,0.42)",
    edge: "rgba(255,132,65,0.46)",
    metal: true,
    grit: "rgba(96,38,14,0.2)"
  },
  pressureRed: {
    label: "Pressure Red",
    stroke: "#4a0907",
    fill: "rgba(205, 36, 28, 0.28)",
    dim: "#d8322b",
    tint: "rgba(235,52,42,0.36)",
    highlight: "rgba(255,176,126,0.5)",
    edge: "rgba(255,94,72,0.56)",
    innerGlow: "rgba(255,56,42,0.2)",
    metal: true,
    grit: "rgba(112,20,12,0.22)"
  },
  signalGreen: {
    label: "Signal Green",
    stroke: "#082b1f",
    fill: "rgba(58, 195, 104, 0.2)",
    dim: "#3ce070",
    tint: "rgba(68,232,126,0.32)",
    highlight: "rgba(198,255,204,0.5)",
    edge: "rgba(108,255,159,0.44)",
    innerGlow: "rgba(84,255,143,0.18)",
    glass: true,
    grit: "rgba(10,70,36,0.14)"
  },
  rustedIron: {
    label: "Rusted Iron",
    stroke: "#32251e",
    fill: "rgba(92, 58, 38, 0.14)",
    dim: "#89522e",
    tint: "rgba(137,82,46,0.25)",
    highlight: "rgba(255,194,129,0.2)",
    grit: "rgba(118,52,23,0.26)"
  },
  blackChrome: {
    label: "Black Chrome",
    stroke: "#030506",
    fill: "rgba(12, 24, 26, 0.16)",
    dim: "#263238",
    tint: "rgba(9,34,34,0.24)",
    highlight: "rgba(218,245,255,0.38)",
    edge: "rgba(145,188,198,0.32)",
    metal: true,
    grit: "rgba(0,0,0,0.1)"
  },
  boneWhite: {
    label: "Bone White",
    stroke: "#36342e",
    fill: "rgba(231, 224, 202, 0.18)",
    dim: "#9b927d",
    tint: "rgba(226,215,186,0.22)",
    highlight: "rgba(255,255,239,0.42)"
  },
  goldRelic: {
    label: "Gold Relic",
    stroke: "#5c4214",
    fill: "rgba(210, 151, 34, 0.26)",
    dim: "#d29c2d",
    tint: "rgba(229,170,42,0.34)",
    highlight: "rgba(255,239,148,0.5)",
    edge: "rgba(255,214,90,0.48)",
    metal: true,
    grit: "rgba(98,59,15,0.2)"
  },
  glass: {
    label: "Glass",
    stroke: "#14596d",
    fill: "rgba(75, 205, 230, 0.12)",
    dim: "#34aac6",
    tint: "rgba(77,220,244,0.22)",
    highlight: "rgba(255,255,255,0.6)",
    edge: "rgba(112,255,238,0.42)",
    innerGlow: "rgba(64,255,225,0.12)",
    glass: true
  },
  dirtyGlass: {
    label: "Dirty Glass",
    stroke: "#34484a",
    fill: "rgba(69, 124, 112, 0.14)",
    dim: "#507f74",
    tint: "rgba(95,142,122,0.24)",
    highlight: "rgba(235,255,238,0.36)",
    edge: "rgba(169,224,198,0.26)",
    innerGlow: "rgba(58,212,183,0.08)",
    grit: "rgba(74,61,42,0.22)",
    glass: true
  },
  cyanGlass: {
    label: "Cyan Glass",
    stroke: "#07535e",
    fill: "rgba(26, 214, 205, 0.17)",
    dim: "#24d7d0",
    tint: "rgba(29,232,217,0.28)",
    highlight: "rgba(224,255,250,0.62)",
    edge: "rgba(94,255,231,0.52)",
    innerGlow: "rgba(34,255,226,0.18)",
    glass: true
  },
  violetGlass: {
    label: "Violet Ether Glass",
    stroke: "#251342",
    fill: "rgba(110, 64, 190, 0.18)",
    dim: "#9c75ff",
    tint: "rgba(126,74,220,0.28)",
    highlight: "rgba(230,214,255,0.5)",
    edge: "rgba(194,142,255,0.5)",
    innerGlow: "rgba(160,92,255,0.2)",
    glass: true
  },
  amberGlass: {
    label: "Amber Resin Glass",
    stroke: "#5b2a0e",
    fill: "rgba(219, 101, 30, 0.2)",
    dim: "#ff8a37",
    tint: "rgba(255,126,44,0.3)",
    highlight: "rgba(255,218,128,0.5)",
    edge: "rgba(255,136,52,0.5)",
    innerGlow: "rgba(255,112,35,0.18)",
    grit: "rgba(110,42,12,0.16)",
    glass: true
  },
  mercuryGlass: {
    label: "Mercury Glass",
    stroke: "#33434a",
    fill: "rgba(196, 218, 226, 0.18)",
    dim: "#d7edf5",
    tint: "rgba(205,230,238,0.3)",
    highlight: "rgba(255,255,255,0.68)",
    edge: "rgba(180,231,246,0.42)",
    innerGlow: "rgba(228,255,255,0.16)",
    glass: true,
    metal: true
  },
  voidGlass: {
    label: "Void Glass",
    stroke: "#09060f",
    fill: "rgba(24, 12, 36, 0.24)",
    dim: "#39244f",
    tint: "rgba(28,15,42,0.38)",
    highlight: "rgba(190,158,255,0.3)",
    edge: "rgba(129,76,210,0.32)",
    innerGlow: "rgba(148,68,255,0.12)",
    glass: true,
    grit: "rgba(0,0,0,0.18)"
  },
  reactorGlass: {
    label: "Reactor Blue Glass",
    stroke: "#063f57",
    fill: "rgba(0, 137, 210, 0.18)",
    dim: "#1db8ff",
    tint: "rgba(0,168,232,0.3)",
    highlight: "rgba(198,246,255,0.56)",
    edge: "rgba(79,225,255,0.52)",
    innerGlow: "rgba(0,210,255,0.2)",
    glass: true
  },
  archiveTeal: {
    label: "Archive Teal",
    stroke: "#0a342f",
    fill: "rgba(33, 122, 111, 0.2)",
    dim: "#2aa996",
    tint: "rgba(41,160,142,0.28)",
    highlight: "rgba(180,255,235,0.4)",
    edge: "rgba(78,232,205,0.32)",
    grit: "rgba(10,48,42,0.18)",
    metal: true
  },
  pfpBlack: {
    label: "PFP Black",
    stroke: "#0c1516",
    fill: "rgba(20, 34, 35, 0.32)",
    dim: "#26383a",
    tint: "rgba(8,42,40,0.24)",
    highlight: "rgba(195,235,228,0.34)",
    edge: "rgba(88,150,150,0.24)",
    grit: "rgba(0,0,0,0.12)",
    metal: true
  },
  pfpGold: {
    label: "PFP Gold",
    stroke: "#3a2608",
    fill: "rgba(226, 157, 26, 0.48)",
    dim: "#d49b2f",
    tint: "rgba(236,174,42,0.48)",
    highlight: "rgba(255,232,120,0.58)",
    edge: "rgba(255,207,82,0.52)",
    metal: true,
    grit: "rgba(88,52,12,0.22)"
  },
  fullGold: {
    label: "Full Gold Edition",
    stroke: "#2f1c05",
    fill: "rgba(231, 166, 31, 0.58)",
    dim: "#c5871e",
    tint: "rgba(246,183,43,0.58)",
    highlight: "rgba(255,244,166,0.72)",
    edge: "rgba(255,204,69,0.68)",
    innerGlow: "rgba(255,198,58,0.16)",
    metal: true,
    grit: "rgba(72,42,10,0.24)"
  },
  darkGold: {
    label: "Dark Gold Shadow",
    stroke: "#1c1205",
    fill: "rgba(83, 56, 15, 0.62)",
    dim: "#8b6420",
    tint: "rgba(101,68,18,0.5)",
    highlight: "rgba(218,166,58,0.36)",
    edge: "rgba(255,190,65,0.3)",
    metal: true,
    grit: "rgba(0,0,0,0.22)"
  },
  goldenGlow: {
    label: "Golden Glow",
    stroke: "#6b4108",
    fill: "rgba(255, 204, 67, 0.26)",
    dim: "#ffd65d",
    tint: "rgba(255,210,68,0.42)",
    highlight: "rgba(255,252,206,0.78)",
    edge: "rgba(255,224,104,0.66)",
    innerGlow: "rgba(255,205,68,0.28)",
    glass: true,
    metal: true
  },
  pfpSteel: {
    label: "PFP Steel",
    stroke: "#16232a",
    fill: "rgba(116, 146, 154, 0.38)",
    dim: "#6f8992",
    tint: "rgba(139,168,176,0.36)",
    highlight: "rgba(235,255,255,0.34)",
    edge: "rgba(184,224,234,0.34)",
    metal: true,
    grit: "rgba(18,26,31,0.18)"
  },
  pfpGlow: {
    label: "PFP Glow",
    stroke: "#0c5660",
    fill: "rgba(70, 255, 207, 0.18)",
    dim: "#46ffcf",
    tint: "rgba(70,255,207,0.34)",
    highlight: "rgba(222,255,245,0.62)",
    glass: true
  },
  pfpScreen: {
    label: "PFP Screen",
    stroke: "#020908",
    fill: "rgba(2, 15, 13, 0.72)",
    dim: "#0f2b28",
    tint: "rgba(0,0,0,0.62)",
    highlight: "rgba(84,255,210,0.18)",
    grit: "rgba(0,0,0,0.24)",
    glass: true
  },
  pfpFace: {
    label: "PFP Face Glow",
    stroke: "#baffdf",
    fill: "rgba(155, 255, 205, 0.72)",
    dim: "#76ffc4",
    tint: "rgba(132,255,197,0.48)",
    highlight: "rgba(245,255,238,0.74)"
  },
  /* Legacy aliases kept for old saved layouts. */
  ink: { stroke: "#171b1d", fill: "rgba(18, 22, 25, 0.04)", dim: "#5c6468", tint: "rgba(20,24,27,0.16)", highlight: "rgba(255,255,255,0.34)" },
  iron: { stroke: "#32251e", fill: "rgba(92, 58, 38, 0.14)", dim: "#89522e", tint: "rgba(137,82,46,0.25)", highlight: "rgba(255,194,129,0.2)", grit: "rgba(118,52,23,0.26)" },
  black: { stroke: "#090b0d", fill: "rgba(0, 0, 0, 0.14)", dim: "#3b4246", tint: "rgba(0,0,0,0.28)", highlight: "rgba(180,210,220,0.34)" },
  gold: { stroke: "#5c4214", fill: "rgba(184, 139, 32, 0.18)", dim: "#b88b20", tint: "rgba(214,161,37,0.27)", highlight: "rgba(255,239,148,0.38)", grit: "rgba(98,59,15,0.18)" },
  blueSteel: { stroke: "#17384a", fill: "rgba(40, 120, 159, 0.095)", dim: "#28789f", tint: "rgba(40,120,159,0.22)", highlight: "rgba(196,239,255,0.38)" },
  bone: { stroke: "#36342e", fill: "rgba(231, 224, 202, 0.18)", dim: "#9b927d", tint: "rgba(226,215,186,0.22)", highlight: "rgba(255,255,239,0.42)" }
};
var LIQUID_PALETTE = [
  "#0a5d58",
  "#249bd4",
  "#ff553f",
  "#45d87a",
  "#ffb833",
  "#d9edf7",
  "#9b68ff",
  "#9b5729",
  "#63e7ff",
  "#7d42db",
  "#ff6d24",
  "#4ef2c3",
  "#009fe3",
  "#ecf8ff",
  "#d48435",
  "#2b123f"
];
var LIQUID_ACCENTS = [
  "#9ff8e7",
  "#b9f2ff",
  "#ffb27a",
  "#b4ffc8",
  "#fff07b",
  "#ffffff",
  "#dac2ff",
  "#e59a52",
  "#f5ff9f",
  "#e9a2ff",
  "#ffd87a",
  "#c9ffef",
  "#71ffff",
  "#ffffff",
  "#ffd39a",
  "#ff69d8"
];
var LIQUID_GLOWS = [
  "rgba(24,198,181,0.34)",
  "rgba(36,155,212,0.48)",
  "rgba(255,85,63,0.48)",
  "rgba(69,216,122,0.42)",
  "rgba(255,184,51,0.44)",
  "rgba(217,237,247,0.48)",
  "rgba(155,104,255,0.48)",
  "rgba(155,87,41,0.36)",
  "rgba(99,231,255,0.58)",
  "rgba(125,66,219,0.5)",
  "rgba(255,109,36,0.58)",
  "rgba(78,242,195,0.5)",
  "rgba(0,190,230,0.52)",
  "rgba(236,248,255,0.52)",
  "rgba(212,132,53,0.46)",
  "rgba(255,74,210,0.5)"
];

// web/src/parts.js
var INK = "rgba(18, 22, 25, 0.72)";
var SOFT_INK = "rgba(18, 22, 25, 0.38)";
var CLEAN_GEAR_SPOKES = /* @__PURE__ */ new Set(["gear.large", "gear.web", "gear.spoked.large", "ring.sprocket", "gear.crown"]);
var SELF_OUTLINED_PARTS = /* @__PURE__ */ new Set([
  "samurai.kabuto",
  "samurai.katana.peek",
  "lamp.bulb.head",
  "frankenstein.monster.head",
  "spaceman.helmet.head",
  "oldcomputer.crt.head",
  "gameboy.dmg.head",
  "ledger.btc.head",
  "ledger.eth.head",
  "battery.charge.head",
  "magnet.u.head",
  "special.rare.head",
  "special.rare.body",
  "counter.saleScreen",
  "counter.transferTally",
  "pack.gas.reader"
]);
var STATIC_PART_CACHE = /* @__PURE__ */ new Map();
var STATIC_PART_CACHE_LIMIT = 360;
var staticPartCacheHits = 0;
var staticPartCacheMisses = 0;
function staticPartCacheKey(part, state = {}, shadeStyle = "pencilSketch", width = 0, height = 0) {
  if (state.previewMotion !== false) return null;
  if (state.mouseLook?.active) return null;
  const key = String(part.key || "");
  if (!key || key.startsWith("counter.") || key === "pack.gas.reader") return null;
  const usesLiquidState = key === "drop.liquid" || key.includes("tank") || key.includes("vial") || key.includes("fluid") || part.traitLayer === "fluid" || part.role === "fluid";
  const skin = state.specialMaterialSkin || state.materialSkin || part.specialMaterialSkinData || null;
  const skinKey = skin ? [
    skin.id,
    skin.surface,
    skin.primary,
    skin.secondary,
    skin.accent,
    skin.edge,
    skin.glow
  ].join("/") : "";
  return [
    key,
    width,
    height,
    part.material || "",
    part.shadeStyle || "",
    shadeStyle,
    part.locked ? 1 : 0,
    part.owned === false ? 0 : 1,
    usesLiquidState ? state.fillLevel ?? "" : "",
    usesLiquidState ? state.colorIndex ?? "" : "",
    usesLiquidState ? state.liquidColor ?? "" : "",
    usesLiquidState ? state.liquidAccent ?? "" : "",
    usesLiquidState ? state.liquidGlow ?? "" : "",
    usesLiquidState ? state.texture ?? "" : "",
    skinKey,
    // Face parts share the keys "face.stroke"/"face.pupil" and differ only by these — include them so a
    // paused/still face can never reuse a sibling's cached bitmap (e.g. a donut "O-mouth" vs an eye pupil).
    part.arc ?? "",
    part.facePart || "",
    part.faceGlow || ""
  ].join("|");
}
function rememberStaticPartCanvas(cacheKey, canvas2) {
  if (!cacheKey) return;
  if (STATIC_PART_CACHE.size >= STATIC_PART_CACHE_LIMIT) {
    const firstKey = STATIC_PART_CACHE.keys().next().value;
    if (firstKey) STATIC_PART_CACHE.delete(firstKey);
  }
  STATIC_PART_CACHE.set(cacheKey, canvas2);
}
function colorAlpha(color, alpha) {
  if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color || `rgba(40,120,159,${alpha})`;
}
function liquidTheme(state = {}) {
  const index = Number(state.colorIndex ?? 1);
  return {
    base: state.liquidColor || LIQUID_PALETTE[index % LIQUID_PALETTE.length] || LIQUID_PALETTE[1],
    accent: state.liquidAccent || LIQUID_ACCENTS[index % LIQUID_ACCENTS.length] || LIQUID_ACCENTS[1],
    glow: state.liquidGlow || LIQUID_GLOWS[index % LIQUID_GLOWS.length] || LIQUID_GLOWS[1]
  };
}
var LEGACY_MATERIALS = {
  ink: "graphiteInk",
  iron: "rustedIron",
  black: "blackChrome",
  blueSteel: "blueprintSteel",
  bone: "boneWhite",
  gold: "goldRelic"
};
function styleFor(part) {
  const id = LEGACY_MATERIALS[part.material] || part.material || "graphiteInk";
  return MATERIALS[id] || MATERIALS.graphiteInk || MATERIALS.ink;
}
function shadeStyleFor(part, state = {}) {
  return part.shadeStyle || state.shadeStyle || "pencilSketch";
}
function setup(ctx2, part, width = 2.2, alpha = 0.86) {
  const style = styleFor(part);
  ctx2.globalAlpha *= part.opacity ?? 1;
  ctx2.lineWidth = width;
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  ctx2.strokeStyle = colorAlpha(style.stroke || "#1a1f22", alpha === 0.86 ? 0.74 : alpha * 0.86);
  ctx2.fillStyle = style.fill;
  ctx2.shadowBlur = 0;
  return style;
}
function drawFinishLine(ctx2, x1, y1, x2, y2, color, width = 1) {
  ctx2.save();
  ctx2.strokeStyle = color;
  ctx2.lineWidth = width;
  ctx2.beginPath();
  ctx2.moveTo(x1, y1);
  ctx2.lineTo(x2, y2);
  ctx2.stroke();
  ctx2.restore();
}
function applyMaterialFinish(ctx2, part, state = {}) {
  if (part.key === "pack.icon" || part.key === "pack.shoulder.shell" || part.key === "pack.shoulder.band") return;
  if (String(part.key || "").startsWith("counter.") || String(part.key || "").startsWith("face.") || part.key === "pack.gas.reader") return;
  const style = styleFor(part);
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  ctx2.save();
  ctx2.globalCompositeOperation = "source-atop";
  ctx2.fillStyle = style.tint || "rgba(18,22,25,0.12)";
  ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  if (style.metal || style.glass || style.innerGlow) {
    const finish = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    finish.addColorStop(0, style.highlight || "rgba(255,255,255,0.24)");
    finish.addColorStop(0.18, style.tint || "rgba(255,255,255,0.08)");
    finish.addColorStop(0.56, style.fill || "rgba(18,22,25,0.14)");
    finish.addColorStop(1, style.edge || "rgba(18,22,25,0.18)");
    ctx2.fillStyle = finish;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  if (style.glass) {
    const gleam = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gleam.addColorStop(0, style.highlight || "rgba(255,255,255,0.28)");
    gleam.addColorStop(0.42, "rgba(255,255,255,0.02)");
    gleam.addColorStop(1, style.innerGlow || "rgba(120,220,255,0.14)");
    ctx2.fillStyle = gleam;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  if (style.innerGlow) {
    ctx2.fillStyle = style.innerGlow;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  if (part.traitLayer === "clothes" || part.role === "clothes") {
    ctx2.strokeStyle = style.edge || style.highlight || "rgba(255,255,255,0.22)";
    ctx2.lineWidth = style.glass ? 1.1 : 0.9;
    for (let i = 0; i < 3; i += 1) {
      const y = bounds.y + bounds.h * (0.24 + i * 0.22);
      drawFinishLine(ctx2, bounds.x + bounds.w * 0.16, y, bounds.x + bounds.w * 0.84, y - bounds.h * 0.08, ctx2.strokeStyle, ctx2.lineWidth);
    }
    if (style.glass) {
      drawSkinEdgeGlints(ctx2, bounds, (part.id || 1) * 37, "rgba(255,255,255,0.16)", 0.65);
    }
  }
  ctx2.restore();
  const def = getPart(part.key);
  const suppressLooseFinishLines = part.key === "ring.bolted" || part.key === "frame.box" || part.key === "pack.shoulder.shell" || SELF_OUTLINED_PARTS.has(part.key) || part.role === "expression" || part.traitLayer === "expression" || ["gear", "wheel", "bevel", "face", "panel"].includes(def?.kind);
  if (!suppressLooseFinishLines && style.highlight) {
    drawFinishLine(ctx2, bounds.x + bounds.w * 0.16, bounds.y + bounds.h * 0.18, bounds.x + bounds.w * 0.76, bounds.y + bounds.h * 0.08, style.highlight, style.glass ? 1.5 : 0.9);
  }
  if (!suppressLooseFinishLines && style.edge) {
    drawFinishLine(ctx2, bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.82, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.74, style.edge, style.glass ? 1.1 : 0.8);
  }
  if (style.grit || part.material === "rustedIron" || part.material === "goldRelic" || part.material === "dirtyGlass") {
    ctx2.save();
    ctx2.globalCompositeOperation = "source-atop";
    ctx2.fillStyle = style.grit || "rgba(118,52,23,0.18)";
    for (let i = 0; i < 34; i++) {
      const x = bounds.x + (i * 41 + (part.id || 1) * 7) % Math.max(1, bounds.w);
      const y = bounds.y + (i * 59 + (part.id || 1) * 11) % Math.max(1, bounds.h);
      ctx2.beginPath();
      ctx2.arc(x, y, 0.7 + i % 4 * 0.25, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
}
function applyShadeFinish(ctx2, part, shadeStyle = "pencilSketch", state = {}) {
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  ctx2.save();
  ctx2.globalCompositeOperation = "source-atop";
  if (shadeStyle === "cleanLine") {
    ctx2.fillStyle = "rgba(255,255,255,0.06)";
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  } else if (shadeStyle === "crosshatch") {
    drawHatching(ctx2, bounds, -0.72, 7, 0.12, 0.72);
    drawHatching(ctx2, bounds, 0.78, 10, 0.075, 0.58);
  } else if (shadeStyle === "stippleDots") {
    drawGraphiteTexture(ctx2, bounds, 0.2);
  } else if (shadeStyle === "blueprintFade") {
    ctx2.fillStyle = "rgba(40,120,159,0.2)";
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawHatching(ctx2, bounds, -0.66, 11, 0.065, 0.62);
  } else if (shadeStyle === "heavyInk") {
    ctx2.fillStyle = "rgba(0,0,0,0.2)";
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  } else if (shadeStyle === "rustWash") {
    const wash = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    wash.addColorStop(0, "rgba(137,82,46,0.08)");
    wash.addColorStop(0.66, "rgba(92,42,20,0.2)");
    wash.addColorStop(1, "rgba(177,98,43,0.1)");
    ctx2.fillStyle = wash;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawGraphiteTexture(ctx2, bounds, 0.14);
  } else if (shadeStyle === "terminalGlow") {
    ctx2.fillStyle = "rgba(48,255,190,0.18)";
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  ctx2.restore();
  const partKey = String(part.key || "");
  const showTerminalDisplayFrame = shadeStyle === "terminalGlow" && isFunctionalDisplayPart(part) && !partKey.startsWith("counter.") && partKey !== "pack.gas.reader";
  if (showTerminalDisplayFrame) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = shadeStyle === "terminalGlow" ? "rgba(94,255,209,0.38)" : "rgba(94,255,209,0.22)";
    ctx2.lineWidth = 1.2;
    ctx2.strokeRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
    ctx2.restore();
  }
}
function specialSkinFor(part, state = {}) {
  if (part.specialMaterialSkin === null || part.specialMaterialSkin === false) return null;
  const skin = state.specialMaterialSkin || state.materialSkin || part.specialMaterialSkinData;
  if (skin && typeof skin === "object") return skin;
  return null;
}
function isGoldenEditionSkin(skin) {
  const id = String(skin?.id || "").toLowerCase();
  const surface = String(skin?.surface || "").toLowerCase();
  return id === "goldenedition" || id === "fullgold" || surface === "royalgold";
}
function applyGoldenFunctionalDisplayFinish(ctx2, part, bounds, skin) {
  const key = String(part.key || "");
  const isLiveReadout = key.startsWith("counter.") || key === "pack.gas.reader";
  if (isLiveReadout) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha(skin?.edge || "#ffd45d", 0.24);
    ctx2.shadowColor = colorAlpha(skin?.glow || skin?.edge || "#ffd45d", 0.22);
    ctx2.shadowBlur = 5;
    ctx2.lineWidth = 0.9;
    ctx2.strokeRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);
    ctx2.fillStyle = "rgba(255,212,74,0.035)";
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx2.restore();
    return;
  }
  ctx2.save();
  ctx2.globalCompositeOperation = "source-atop";
  const sheen = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  sheen.addColorStop(0, "rgba(255,246,170,0.2)");
  sheen.addColorStop(0.34, "rgba(255,194,45,0.1)");
  sheen.addColorStop(0.72, "rgba(59,35,7,0.16)");
  sheen.addColorStop(1, "rgba(255,224,101,0.16)");
  ctx2.fillStyle = sheen;
  ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  drawSkinEdgeGlints(ctx2, bounds, (part.id || 1) * 71, "rgba(255,244,175,0.28)", 0.72);
  ctx2.restore();
  if (!String(part.key || "").startsWith("counter.") && part.key !== "pack.gas.reader") {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha(skin?.edge || "#ffd45d", 0.2);
    ctx2.lineWidth = 0.85;
    roughLine(ctx2, bounds.x + bounds.w * 0.14, bounds.y + bounds.h * 0.24, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.17, 0.22, 5, (part.id || 1) * 91);
    ctx2.restore();
  }
}
function isFunctionalDisplayPart(part) {
  return String(part.key || "").startsWith("counter.") || part.role === "expression" || part.traitLayer === "expression" || part.expression === true || part.material === "pfpFace";
}
function skinUnit(seed, salt) {
  const raw = Math.sin((seed + salt * 977) * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}
function drawSkinCracks(ctx2, bounds, seed, color, accent, count, glow = 0) {
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.strokeStyle = color;
  ctx2.lineWidth = 1.1;
  if (glow) {
    ctx2.shadowColor = accent;
    ctx2.shadowBlur = 4 + glow * 6;
  }
  for (let i = 0; i < count; i += 1) {
    const sx = bounds.x + skinUnit(seed, i + 1) * bounds.w;
    const sy = bounds.y + skinUnit(seed, i + 12) * bounds.h;
    const ex = sx + (skinUnit(seed, i + 22) - 0.5) * bounds.w * 0.32;
    const ey = sy + (skinUnit(seed, i + 32) - 0.5) * bounds.h * 0.28;
    roughLine(ctx2, sx, sy, ex, ey, 0.7, 5, seed + i * 17);
    if (i % 3 === 0) {
      roughLine(ctx2, sx + (ex - sx) * 0.48, sy + (ey - sy) * 0.48, sx + (skinUnit(seed, i + 42) - 0.5) * bounds.w * 0.22, sy + (skinUnit(seed, i + 52) - 0.5) * bounds.h * 0.2, 0.5, 3, seed + i * 23);
    }
  }
  if (accent) {
    ctx2.strokeStyle = colorAlpha(accent, 0.5);
    ctx2.lineWidth = 0.7;
    for (let i = 0; i < Math.max(1, Math.floor(count / 3)); i += 1) {
      const y = bounds.y + skinUnit(seed, i + 62) * bounds.h;
      roughLine(ctx2, bounds.x + bounds.w * 0.18, y, bounds.x + bounds.w * 0.82, y + (skinUnit(seed, i + 72) - 0.5) * 12, 0.35, 5, seed + i * 31);
    }
  }
  ctx2.restore();
}
function drawSkinDrops(ctx2, bounds, seed, color, accent, count, molten = false) {
  ctx2.save();
  ctx2.fillStyle = color;
  ctx2.strokeStyle = colorAlpha(accent, 0.46);
  ctx2.lineWidth = 0.8;
  for (let i = 0; i < count; i += 1) {
    const x = bounds.x + skinUnit(seed, i + 7) * bounds.w;
    const y = bounds.y + skinUnit(seed, i + 17) * bounds.h;
    const r = 2 + skinUnit(seed, i + 27) * (molten ? 5 : 3.2);
    ctx2.beginPath();
    ctx2.ellipse(x, y, r * (0.75 + skinUnit(seed, i + 37) * 0.5), r * (molten ? 1.45 : 1.05), skinUnit(seed, i + 47) * Math.PI, 0, Math.PI * 2);
    ctx2.fill();
    if (i % 2 === 0) ctx2.stroke();
  }
  ctx2.restore();
}
function drawSkinSpecks(ctx2, bounds, seed, color, count, maxR = 1.8) {
  ctx2.save();
  ctx2.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = bounds.x + skinUnit(seed, i + 80) * bounds.w;
    const y = bounds.y + skinUnit(seed, i + 180) * bounds.h;
    const r = 0.55 + skinUnit(seed, i + 280) * maxR;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();
}
function drawSkinTechnicalLines(ctx2, bounds, seed, color, accent, blueprint = false) {
  ctx2.save();
  ctx2.strokeStyle = color;
  ctx2.lineWidth = blueprint ? 0.8 : 1.1;
  for (let i = 0; i < 5; i += 1) {
    const y = bounds.y + bounds.h * (0.18 + i * 0.16);
    roughLine(ctx2, bounds.x + bounds.w * 0.12, y, bounds.x + bounds.w * 0.88, y + (skinUnit(seed, i + 3) - 0.5) * 6, blueprint ? 0.22 : 0.45, 8, seed + i * 9);
  }
  ctx2.strokeStyle = colorAlpha(accent, blueprint ? 0.58 : 0.34);
  ctx2.lineWidth = blueprint ? 0.7 : 0.9;
  roughLine(ctx2, bounds.x + bounds.w * 0.16, bounds.y + bounds.h * 0.18, bounds.x + bounds.w * 0.44, bounds.y + bounds.h * 0.16, 0.2, 4, seed + 101);
  roughLine(ctx2, bounds.x + bounds.w * 0.58, bounds.y + bounds.h * 0.82, bounds.x + bounds.w * 0.84, bounds.y + bounds.h * 0.78, 0.2, 4, seed + 103);
  ctx2.restore();
}
function drawSkinEdgeGlints(ctx2, bounds, seed, color, width = 0.8) {
  const padX = Math.max(4, Math.min(16, bounds.w * 0.13));
  const padY = Math.max(4, Math.min(14, bounds.h * 0.13));
  const spanX = Math.max(12, bounds.w * 0.22);
  const spanY = Math.max(10, bounds.h * 0.18);
  const glints = [
    [bounds.x + padX, bounds.y + padY, bounds.x + padX + spanX, bounds.y + padY - spanY * 0.18],
    [bounds.x + bounds.w - padX - spanX, bounds.y + bounds.h - padY + spanY * 0.12, bounds.x + bounds.w - padX, bounds.y + bounds.h - padY],
    [bounds.x + padX * 0.8, bounds.y + bounds.h * 0.62, bounds.x + padX * 0.8 + spanX * 0.65, bounds.y + bounds.h * 0.62 - spanY * 0.2]
  ];
  ctx2.save();
  ctx2.strokeStyle = color;
  ctx2.lineWidth = width;
  for (let i = 0; i < glints.length; i += 1) {
    roughLine(ctx2, glints[i][0], glints[i][1], glints[i][2], glints[i][3], 0.18, 4, seed + i * 29);
  }
  ctx2.restore();
}
function drawSkinSpecialMarks(ctx2, bounds, seed, skin, surface) {
  const primary = skin.primary || "#111111";
  const secondary = skin.secondary || primary;
  const accent = skin.accent || skin.edge || "#ffffff";
  const edge = skin.edge || accent;
  if (surface === "soft") {
    ctx2.save();
    ctx2.globalCompositeOperation = "source-atop";
    ctx2.fillStyle = "rgba(83,45,13,0.42)";
    for (let i = 0; i < 5; i += 1) {
      const x = bounds.x + skinUnit(seed, i + 10) * bounds.w;
      const y = bounds.y + skinUnit(seed, i + 20) * bounds.h;
      const r = 3 + skinUnit(seed, i + 30) * 7;
      ctx2.beginPath();
      ctx2.ellipse(x, y, r, r * (0.72 + skinUnit(seed, i + 40) * 0.45), skinUnit(seed, i + 50) * Math.PI, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  } else if (surface === "paper") {
    drawSkinTechnicalLines(ctx2, bounds, seed, "rgba(12,12,12,0.48)", skin.accent || "#b6312a", true);
    drawSkinSpecks(ctx2, bounds, seed, "rgba(128,54,34,0.18)", 12, 1.2);
  } else if (surface === "leather" || surface === "wood") {
    ctx2.save();
    ctx2.strokeStyle = colorAlpha(edge, 0.38);
    ctx2.lineWidth = 1.2;
    for (let i = 0; i < 6; i += 1) {
      const y = bounds.y + bounds.h * (0.12 + i * 0.16);
      roughLine(ctx2, bounds.x + 6, y, bounds.x + bounds.w - 6, y + Math.sin(seed + i) * 4, 0.6, 9, seed + i * 13);
    }
    if (surface === "leather") {
      ctx2.setLineDash([2, 6]);
      ctx2.strokeStyle = colorAlpha(skin.accent, 0.5);
      roughLine(ctx2, bounds.x + 8, bounds.y + bounds.h * 0.22, bounds.x + bounds.w - 8, bounds.y + bounds.h * 0.2, 0.22, 5, seed + 410);
      roughLine(ctx2, bounds.x + 8, bounds.y + bounds.h * 0.78, bounds.x + bounds.w - 8, bounds.y + bounds.h * 0.8, 0.22, 5, seed + 420);
      ctx2.setLineDash([]);
    }
    ctx2.restore();
  } else if (surface === "blueprint") {
    drawSkinTechnicalLines(ctx2, bounds, seed, "rgba(18,22,25,0.64)", accent, true);
  } else if (surface === "royalgold" || skin.id === "goldenEdition") {
    ctx2.save();
    ctx2.strokeStyle = "rgba(75,44,9,0.34)";
    ctx2.lineWidth = 1.1;
    for (let i = 0; i < 4; i += 1) {
      const y = bounds.y + bounds.h * (0.18 + i * 0.18);
      roughLine(ctx2, bounds.x + bounds.w * 0.15, y, bounds.x + bounds.w * 0.84, y + (skinUnit(seed, i + 33) - 0.5) * 7, 0.24, 6, seed + i * 19);
    }
    ctx2.strokeStyle = colorAlpha(accent, 0.34);
    ctx2.lineWidth = 0.85;
    roughLine(ctx2, bounds.x + bounds.w * 0.2, bounds.y + bounds.h * 0.25, bounds.x + bounds.w * 0.36, bounds.y + bounds.h * 0.19, 0.18, 4, seed + 120);
    roughLine(ctx2, bounds.x + bounds.w * 0.63, bounds.y + bounds.h * 0.79, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.72, 0.18, 4, seed + 130);
    ctx2.restore();
    drawSkinSpecks(ctx2, bounds, seed + 222, "rgba(255,238,145,0.28)", 12, 1.45);
    drawSkinSpecks(ctx2, bounds, seed + 333, "rgba(73,42,8,0.18)", 10, 1.15);
    drawSkinEdgeGlints(ctx2, bounds, seed + 444, "rgba(255,246,175,0.3)", 0.9);
  } else if (surface === "cosmic" || surface === "void") {
    drawSkinSpecks(ctx2, bounds, seed, colorAlpha("#ffffff", 0.72), 12, 1.3);
    drawSkinSpecks(ctx2, bounds, seed + 111, colorAlpha(accent, 0.5), 6, 1.8);
  } else if (surface === "stone" || surface === "marble" || surface === "porcelain" || surface === "ceramic" || surface === "volcanic" || surface === "ash") {
    drawSkinCracks(ctx2, bounds, seed, colorAlpha(surface === "volcanic" ? "#080503" : secondary, 0.58), colorAlpha(accent, surface === "volcanic" ? 0.9 : 0.5), surface === "marble" || surface === "porcelain" ? 6 : 8, surface === "volcanic" ? 0.7 : 0.2);
  } else if (surface === "rubber" || surface === "carbon") {
    drawSkinTechnicalLines(ctx2, bounds, seed, colorAlpha(accent, 0.5), edge, false);
  } else if (["liquid", "organic", "sludge", "molten", "resin", "ink"].includes(surface)) {
    drawSkinDrops(ctx2, bounds, seed, colorAlpha(primary, 0.42), accent, surface === "molten" || surface === "sludge" ? 8 : 6, surface === "molten");
  } else if (surface === "chrome" || surface === "glass" || surface === "crystal" || surface === "opal" || surface === "ice" || surface === "electric" || surface === "coolant") {
    drawSkinEdgeGlints(ctx2, bounds, seed, colorAlpha(edge, 0.32), 0.85);
    drawSkinSpecks(ctx2, bounds, seed + 77, colorAlpha(accent, 0.2), 4, 1.2);
  } else {
    drawSkinSpecks(ctx2, bounds, seed, colorAlpha(secondary, 0.24), 10, 1.3);
  }
}
function applySpecialSkinFinish(ctx2, part, state = {}) {
  const skin = specialSkinFor(part, state);
  const goldenEdition = isGoldenEditionSkin(skin);
  if (!skin || !goldenEdition && isFunctionalDisplayPart(part)) return;
  const isSpecialRareShell = part.key === "special.rare.head" || part.key === "special.rare.body";
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  const surface = String(skin.surface || "").toLowerCase();
  const seed = (part.id || 1) * 409 + String(skin.id || skin.label || "skin").length * 37;
  const primary = skin.primary || "#111111";
  const secondary = skin.secondary || primary;
  const accent = skin.accent || skin.edge || "#ffffff";
  const edge = skin.edge || accent;
  const isTransparent = ["glass", "crystal", "opal", "chrome", "ice", "resin", "coolant", "electric"].includes(surface);
  const isDark = ["blackMatter", "voidEther", "inkVoid", "obsidianGlass", "neonCarbon", "neonSludge"].includes(skin.id) || ["void", "ink", "carbon", "rubber"].includes(surface);
  if (goldenEdition && isFunctionalDisplayPart(part)) {
    applyGoldenFunctionalDisplayFinish(ctx2, part, bounds, skin);
    return;
  }
  if (goldenEdition) {
    const key = String(part.key || "");
    const isPackPart = key.startsWith("pack.");
    ctx2.save();
    ctx2.globalCompositeOperation = "source-atop";
    const gold = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gold.addColorStop(0, `rgba(255,248,172,${isPackPart ? 0.68 : 0.52})`);
    gold.addColorStop(0.18, `rgba(255,214,83,${isPackPart ? 0.66 : 0.5})`);
    gold.addColorStop(0.48, `rgba(216,145,25,${isPackPart ? 0.68 : 0.54})`);
    gold.addColorStop(0.74, `rgba(71,42,10,${isPackPart ? 0.42 : 0.32})`);
    gold.addColorStop(1, `rgba(255,225,92,${isPackPart ? 0.62 : 0.46})`);
    ctx2.fillStyle = gold;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    if (isPackPart) {
      ctx2.fillStyle = "rgba(236,166,36,0.22)";
      ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }
    const shadow = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w * 0.3, bounds.y + bounds.h);
    shadow.addColorStop(0, "rgba(0,0,0,0)");
    shadow.addColorStop(0.66, "rgba(42,22,5,0.16)");
    shadow.addColorStop(1, "rgba(42,22,5,0.24)");
    ctx2.fillStyle = shadow;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawSkinSpecialMarks(ctx2, bounds, seed, skin, "royalgold");
    ctx2.restore();
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = "rgba(255,236,135,0.18)";
    ctx2.lineWidth = 1.1;
    roughLine(ctx2, bounds.x + bounds.w * 0.12, bounds.y + bounds.h * 0.12, bounds.x + bounds.w * 0.72, bounds.y + bounds.h * 0.05, 0.18, 5, seed + 520);
    ctx2.restore();
    return;
  }
  ctx2.save();
  ctx2.globalCompositeOperation = "source-atop";
  const wash = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  wash.addColorStop(0, colorAlpha(isTransparent ? edge : primary, isTransparent ? 0.24 : 0.42));
  wash.addColorStop(0.42, colorAlpha(primary, isDark ? 0.68 : 0.36));
  wash.addColorStop(0.72, colorAlpha(secondary, isTransparent ? 0.28 : 0.42));
  wash.addColorStop(1, colorAlpha(accent, isTransparent ? 0.18 : 0.22));
  ctx2.fillStyle = wash;
  ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  if (isTransparent) {
    const gleam = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gleam.addColorStop(0, colorAlpha("#ffffff", 0.2));
    gleam.addColorStop(0.35, "rgba(255,255,255,0)");
    gleam.addColorStop(0.7, colorAlpha(edge, 0.18));
    gleam.addColorStop(1, colorAlpha(accent, 0.12));
    ctx2.fillStyle = gleam;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  if (skin.id === "holoGlass" || skin.id === "opalMachine" || skin.id === "pearlChrome") {
    const prism = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y);
    prism.addColorStop(0, "rgba(255,96,206,0.18)");
    prism.addColorStop(0.35, "rgba(84,245,255,0.16)");
    prism.addColorStop(0.68, "rgba(255,232,90,0.14)");
    prism.addColorStop(1, "rgba(142,112,255,0.14)");
    ctx2.fillStyle = prism;
    ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  if (!isSpecialRareShell) drawSkinSpecialMarks(ctx2, bounds, seed, skin, surface);
  ctx2.restore();
  if (!isSpecialRareShell && ["electric", "void", "cosmic", "sludge", "molten", "volcanic"].includes(surface)) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha(edge, 0.28);
    ctx2.lineWidth = 1.1;
    ctx2.shadowColor = skin.glow || colorAlpha(edge, 0.5);
    ctx2.shadowBlur = 6;
    roughLine(ctx2, bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.16, bounds.x + bounds.w * 0.52, bounds.y + bounds.h * 0.12, 0.28, 5, seed + 180);
    roughLine(ctx2, bounds.x + bounds.w * 0.52, bounds.y + bounds.h * 0.88, bounds.x + bounds.w * 0.84, bounds.y + bounds.h * 0.82, 0.28, 5, seed + 190);
    ctx2.restore();
  }
}
function drawCastShadow(ctx2, drawPath, dx = 5, dy = 7, alpha = 0.07) {
  ctx2.save();
  ctx2.translate(dx, dy);
  ctx2.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  drawPath();
  ctx2.fill();
  ctx2.restore();
}
function drawGraphiteWash(ctx2, bounds, alpha = 0.12) {
  const gradient = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  gradient.addColorStop(0, "rgba(255,255,255,0.28)");
  gradient.addColorStop(0.42, `rgba(18,22,25,${alpha * 0.24})`);
  gradient.addColorStop(0.74, `rgba(18,22,25,${alpha})`);
  gradient.addColorStop(1, `rgba(18,22,25,${alpha * 0.58})`);
  ctx2.fillStyle = gradient;
  ctx2.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
}
function drawHatching(ctx2, bounds, angle = -0.72, spacing = 8, alpha = 0.08, lineWidth = 0.8) {
  const reach = Math.hypot(bounds.w, bounds.h) + Math.max(Math.abs(bounds.x), Math.abs(bounds.y)) * 2 + 40;
  ctx2.save();
  ctx2.rotate(angle);
  ctx2.strokeStyle = `rgba(18,22,25,${alpha})`;
  ctx2.lineWidth = lineWidth;
  for (let x = -reach; x <= reach; x += spacing) {
    ctx2.beginPath();
    ctx2.moveTo(x, -reach);
    ctx2.lineTo(x, reach);
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawGraphiteTexture(ctx2, bounds, alpha = 0.08) {
  ctx2.save();
  ctx2.fillStyle = `rgba(18,22,25,${alpha})`;
  const count = Math.max(18, Math.floor(bounds.w * bounds.h / 520));
  for (let i = 0; i < count; i++) {
    const x = bounds.x + i * 37 % Math.max(1, bounds.w);
    const y = bounds.y + i * 61 % Math.max(1, bounds.h);
    const r = 0.45 + i % 3 * 0.18;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();
}
function pencilShade(ctx2, drawPath, bounds, options = {}) {
  const {
    wash = 0.12,
    hatch = 0.08,
    cross = 0.035,
    spacing = 8,
    texture = 0.07
  } = options;
  ctx2.save();
  drawPath();
  ctx2.clip();
  drawGraphiteWash(ctx2, bounds, wash);
  drawHatching(ctx2, bounds, -0.66, spacing, hatch);
  if (cross) drawHatching(ctx2, bounds, 0.78, spacing * 1.55, cross, 0.65);
  drawGraphiteTexture(ctx2, bounds, texture);
  ctx2.restore();
}
function sketchStroke(ctx2, drawPath, alpha = 0.3, width = 1.1) {
  ctx2.save();
  ctx2.strokeStyle = `rgba(18,22,25,${alpha})`;
  ctx2.lineWidth = width;
  for (const offset of [[-0.8, 0.4], [0.55, -0.35]]) {
    ctx2.save();
    ctx2.translate(offset[0], offset[1]);
    drawPath();
    ctx2.stroke();
    ctx2.restore();
  }
  ctx2.restore();
}
function pathGear(ctx2, radius, teeth) {
  ctx2.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = i / (teeth * 2) * Math.PI * 2;
    const r = i % 2 === 0 ? radius + 8 : radius - 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
  }
  ctx2.closePath();
}
function pathRoundRect(ctx2, x, y, w, h, r) {
  roundedRect(ctx2, x, y, w, h, r);
}
function drawPencilRect(ctx2, x, y, w, h, radius = 0, options = {}) {
  const drawPath = () => {
    if (radius) pathRoundRect(ctx2, x, y, w, h, radius);
    else {
      ctx2.beginPath();
      ctx2.rect(x, y, w, h);
    }
  };
  drawCastShadow(ctx2, drawPath, options.shadowX ?? 4, options.shadowY ?? 6, options.shadow ?? 0.055);
  drawPath();
  ctx2.fillStyle = options.fill || "rgba(255,255,255,0.2)";
  ctx2.fill();
  pencilShade(ctx2, drawPath, { x, y, w, h }, {
    wash: options.wash ?? 0.1,
    hatch: options.hatch ?? 0.065,
    cross: options.cross ?? 0.025,
    spacing: options.spacing ?? 7,
    texture: options.texture ?? 0.055
  });
  ctx2.strokeStyle = options.stroke || INK;
  ctx2.lineWidth = options.lineWidth || 2;
  drawPath();
  ctx2.stroke();
  sketchStroke(ctx2, drawPath, options.sketch ?? 0.16, 0.7);
  ctx2.save();
  ctx2.strokeStyle = "rgba(255,255,255,0.45)";
  ctx2.lineWidth = 1.1;
  ctx2.beginPath();
  ctx2.moveTo(x + Math.min(14, w * 0.16), y + Math.min(10, h * 0.28));
  ctx2.lineTo(x + w - Math.min(14, w * 0.16), y + Math.min(8, h * 0.24));
  ctx2.stroke();
  ctx2.restore();
}
function drawRivet(ctx2, x, y, r = 3.4) {
  ctx2.save();
  const gradient = ctx2.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x, y, r);
  gradient.addColorStop(0, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.6, "rgba(18,22,25,0.08)");
  gradient.addColorStop(1, "rgba(18,22,25,0.28)");
  ctx2.fillStyle = gradient;
  ctx2.strokeStyle = "rgba(18,22,25,0.62)";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.arc(x, y, r, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.restore();
}
function jitter(seed, amount = 1) {
  return Math.sin(seed * 12.9898 + 78.233) * amount;
}
function roughLine(ctx2, x1, y1, x2, y2, amount = 1.4, segments = 10, seed = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  ctx2.beginPath();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const taper = Math.sin(t * Math.PI);
    const offset = jitter(seed + i * 1.7, amount) * taper;
    const x = x1 + dx * t + nx * offset;
    const y = y1 + dy * t + ny * offset;
    i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
  }
  ctx2.stroke();
}
function roughRect(ctx2, x, y, w, h, amount = 1.25, seed = 1) {
  roughLine(ctx2, x, y, x + w, y, amount, 12, seed);
  roughLine(ctx2, x + w, y, x + w, y + h, amount, 8, seed + 31);
  roughLine(ctx2, x + w, y + h, x, y + h, amount, 12, seed + 67);
  roughLine(ctx2, x, y + h, x, y, amount, 8, seed + 101);
}
function roughCircle(ctx2, cx, cy, r, amount = 1.25, seed = 1, scaleY = 1, start = 0, end = Math.PI * 2) {
  const total = Math.abs(end - start);
  const steps = Math.max(18, Math.ceil(total / (Math.PI * 2) * 86));
  ctx2.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + (end - start) * t;
    const radius = r + jitter(seed + i * 2.3, amount);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * scaleY;
    i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
  }
  ctx2.stroke();
}
function roughGearOutline(ctx2, radius, teeth, amount = 1.2, seed = 1) {
  const steps = teeth * 2;
  ctx2.beginPath();
  for (let i = 0; i <= steps; i++) {
    const angle = i / steps * Math.PI * 2;
    const base = i % 2 === 0 ? radius + 8 : radius - 2;
    const r = base + jitter(seed + i * 1.9, amount);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
  }
  ctx2.closePath();
  ctx2.stroke();
}
function roughBezier(ctx2, points, amount = 1.1, seed = 1) {
  let previous = null;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const mt = 1 - t;
    const x = mt * mt * mt * points[0][0] + 3 * mt * mt * t * points[1][0] + 3 * mt * t * t * points[2][0] + t * t * t * points[3][0];
    const y = mt * mt * mt * points[0][1] + 3 * mt * mt * t * points[1][1] + 3 * mt * t * t * points[2][1] + t * t * t * points[3][1];
    const wobbleX = jitter(seed + i, amount) * Math.sin(t * Math.PI);
    const wobbleY = jitter(seed + i + 99, amount) * Math.sin(t * Math.PI);
    if (previous) roughLine(ctx2, previous[0], previous[1], x + wobbleX, y + wobbleY, amount * 0.45, 2, seed + i * 11);
    previous = [x + wobbleX, y + wobbleY];
  }
}
function drawOuterPencilEdge(ctx2, part) {
  const def = getPart(part.key);
  if (!def) return;
  if (part.key === "pack.icon" || part.key === "pack.shoulder.shell" || part.key === "pack.shoulder.band") return;
  if (SELF_OUTLINED_PARTS.has(part.key)) return;
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.38)";
  ctx2.lineWidth = 0.95;
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  for (let pass = 0; pass < 3; pass++) {
    ctx2.save();
    ctx2.translate(jitter(pass + part.id, 0.55), jitter(pass + part.id + 40, 0.55));
    ctx2.strokeStyle = pass === 0 ? "rgba(18,22,25,0.43)" : "rgba(18,22,25,0.16)";
    ctx2.lineWidth = pass === 0 ? 0.9 : 0.56;
    const amount = pass === 0 ? 1.25 : 1.95;
    const seed = (part.id || 1) * 17 + pass * 131;
    if (part.key === "gear.bevel") {
      ctx2.save();
      ctx2.rotate(-0.34);
      roughCircle(ctx2, 0, 0, 66, amount, seed, 0.58);
      roughCircle(ctx2, 0, 0, 46, amount * 0.62, seed + 10, 0.58);
      roughCircle(ctx2, 0, 0, 20, amount * 0.48, seed + 20, 0.52);
      for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2;
        roughLine(
          ctx2,
          Math.cos(angle) * 25,
          Math.sin(angle) * 25 * 0.58,
          Math.cos(angle + 0.1) * 55,
          Math.sin(angle + 0.1) * 55 * 0.58,
          amount * 0.42,
          4,
          seed + i * 17
        );
      }
      ctx2.restore();
      roughLine(ctx2, -54, 23, 54, -16, amount * 0.35, 11, seed + 140);
    } else if (part.key === "pulley.wheel") {
      roughCircle(ctx2, 0, 0, 46, amount, seed);
      roughCircle(ctx2, 0, 0, 35, amount * 0.65, seed + 10);
      roughCircle(ctx2, 0, 0, 14, amount * 0.45, seed + 20);
      roughRect(ctx2, -18, -61, 36, 12, amount * 0.52, seed + 40);
      roughRect(ctx2, -18, 49, 36, 12, amount * 0.52, seed + 60);
    } else if (part.key === "pulley.wheel.large") {
      roughCircle(ctx2, 0, 0, 64, amount, seed);
      roughCircle(ctx2, 0, 0, 54, amount * 0.68, seed + 10);
      roughCircle(ctx2, 0, 0, 38, amount * 0.58, seed + 20);
      roughCircle(ctx2, 0, 0, 16, amount * 0.45, seed + 30);
      for (let i = 0; i < 12; i++) {
        const angle = i / 12 * Math.PI * 2;
        roughLine(ctx2, Math.cos(angle) * 22, Math.sin(angle) * 22, Math.cos(angle) * 55, Math.sin(angle) * 55, amount * 0.38, 4, seed + i * 13);
      }
    } else if (def.kind === "gear") {
      roughGearOutline(ctx2, def.radius || 50, def.teeth || 22, amount, seed);
      roughCircle(ctx2, 0, 0, (def.radius || 50) * 0.74, amount * 0.6, seed + 10);
      roughCircle(ctx2, 0, 0, (def.radius || 50) * 0.18, amount * 0.45, seed + 20);
    } else if (part.key === "ring.bolted") {
      roughCircle(ctx2, 0, 0, 58, amount, seed);
    } else if (def.kind === "wheel") {
      const r = def.radius || 64;
      roughCircle(ctx2, 0, 0, r, amount, seed);
      roughCircle(ctx2, 0, 0, r * 0.66, amount * 0.65, seed + 10);
      roughCircle(ctx2, 0, 0, r * 0.19, amount * 0.45, seed + 20);
    } else if (part.key === "pipe.straight" || part.key === "valve.steam") {
      roughRect(ctx2, -70, -18, 140, 36, amount, seed);
      roughRect(ctx2, -82, -27, 28, 54, amount * 0.75, seed + 20);
      roughRect(ctx2, 54, -27, 28, 54, amount * 0.75, seed + 40);
    } else if (part.key === "pipe.elbow") {
      drawElbowBodyPath(ctx2);
      ctx2.stroke();
      roughLine(ctx2, -57, -94, -23, -94, amount * 0.55, 5, seed + 30);
      roughLine(ctx2, -64, -87, -64, -55, amount * 0.55, 5, seed + 32);
      roughLine(ctx2, -16, -87, -16, -55, amount * 0.55, 5, seed + 34);
      roughLine(ctx2, 56, 16, 89, 16, amount * 0.55, 5, seed + 60);
      roughLine(ctx2, 96, 23, 96, 57, amount * 0.55, 5, seed + 62);
      roughLine(ctx2, 56, 64, 89, 64, amount * 0.55, 5, seed + 64);
    } else if (part.key === "pipe.curve" || part.key === "wire.arc") {
      roughBezier(ctx2, [[-68, 34], [-30, -42], [32, -58], [74, 18]], amount, seed);
      roughBezier(ctx2, [[-52, 38], [-22, -18], [24, -30], [58, 17]], amount * 0.75, seed + 30);
    } else if (part.key === "pipe.ghost") {
      roughBezier(ctx2, [[-72, 16], [-38, -38], [30, -36], [72, 10]], amount, seed);
      roughBezier(ctx2, [[-56, 16], [-30, -16], [22, -16], [56, 10]], amount * 0.72, seed + 30);
    } else if (part.key === "tank.round") {
      roughCircle(ctx2, 0, 0, 66, amount, seed);
      roughCircle(ctx2, 0, 0, 46, amount * 0.6, seed + 18);
      roughRect(ctx2, -48, -92, 96, 22, amount * 0.72, seed + 30);
      roughRect(ctx2, -48, 70, 96, 22, amount * 0.72, seed + 60);
    } else if (part.key === "tank.core") {
      roughCircle(ctx2, 0, 0, 60, amount, seed);
      roughCircle(ctx2, 0, 0, 36, amount * 0.62, seed + 18);
      roughRect(ctx2, -92, -18, 184, 36, amount * 0.6, seed + 40);
    } else if (part.key === "tank.vials") {
      roughRect(ctx2, -62, -98, 124, 196, amount, seed);
      roughRect(ctx2, -48, -70, 32, 140, amount * 0.68, seed + 20);
      roughRect(ctx2, 16, -70, 32, 140, amount * 0.68, seed + 40);
    } else if (part.key === "tank.head.square") {
      roughRect(ctx2, -92, -112, 184, 224, amount, seed);
      roughRect(ctx2, -76, -88, 152, 176, amount * 0.62, seed + 18);
      roughRect(ctx2, -86, -124, 172, 26, amount * 0.58, seed + 30);
      roughRect(ctx2, -86, 98, 172, 26, amount * 0.58, seed + 50);
    } else if (def.kind === "sealedTube") {
      drawSealedTubeOuterEdge(ctx2, part.key, amount, seed);
    } else if (def.kind === "tank") {
      roughRect(ctx2, -46, -108, 92, 216, amount, seed);
      roughRect(ctx2, -58, -96, 116, 28, amount * 0.7, seed + 25);
      roughRect(ctx2, -58, 68, 116, 28, amount * 0.7, seed + 50);
      roughCircle(ctx2, 0, 0, 64, amount * 0.55, seed + 75, 1.88, -Math.PI * 0.42, Math.PI * 0.42);
    } else if (def.kind === "gauge") {
      roughCircle(ctx2, 0, 0, 52, amount, seed);
      roughCircle(ctx2, 0, 0, 42, amount * 0.58, seed + 14);
    } else if (part.key === "chain.segment") {
      for (let i = -3; i <= 3; i++) {
        const x = i * 26;
        roughCircle(ctx2, x, i % 2 ? -1 : 1, i % 2 ? 20 : 26, amount * 0.45, seed + i * 13, i % 2 ? 0.5 : 0.46);
      }
      roughLine(ctx2, -92, 0, 92, 0, amount * 0.32, 18, seed + 80);
    } else if (def.kind === "chain") {
      for (let i = -4; i <= 4; i++) roughCircle(ctx2, i * 18, 0, 14, amount * 0.55, seed + i * 9, 0.58);
    } else if (def.kind === "coil") {
      roughRect(ctx2, -30, -90, 60, 180, amount, seed);
      for (let y = -70; y <= 70; y += 18) {
        roughBezier(ctx2, [[-42, y], [-10, y - 16], [10, y + 16], [42, y]], amount * 0.6, seed + y);
      }
    } else if (part.key === "spring.compact") {
      for (let x = -62; x <= 62; x += 14) roughCircle(ctx2, x, 0, 12, amount * 0.5, seed + x, 1.55);
      roughLine(ctx2, -86, 0, 86, 0, amount * 0.42, 18, seed + 18);
    } else if (part.key === "bracket.corner") {
      roughLine(ctx2, -60, -44, 36, -44, amount, 10, seed);
      roughLine(ctx2, 36, -44, 36, -20, amount, 4, seed + 2);
      roughLine(ctx2, 36, -20, -32, -20, amount, 8, seed + 4);
      roughLine(ctx2, -32, -20, -32, 48, amount, 8, seed + 6);
      roughLine(ctx2, -32, 48, -60, 48, amount, 4, seed + 8);
      roughLine(ctx2, -60, 48, -60, -44, amount, 10, seed + 10);
    } else if (part.key === "strip.rivet") {
      roughRect(ctx2, -82, -14, 164, 28, amount * 0.65, seed);
    } else if (part.key === "hand.clock") {
      roughLine(ctx2, -16, -5, 88, 0, amount * 0.55, 12, seed);
      roughLine(ctx2, -16, 5, 88, 0, amount * 0.55, 12, seed + 7);
      roughCircle(ctx2, -16, 0, 9, amount * 0.45, seed + 11);
    } else if (part.key === "tooth.shard") {
      roughLine(ctx2, -32, 28, -10, -30, amount, 8, seed);
      roughLine(ctx2, -10, -30, 14, -10, amount, 5, seed + 2);
      roughLine(ctx2, 14, -10, 34, -34, amount, 5, seed + 4);
      roughLine(ctx2, 34, -34, 28, 28, amount, 8, seed + 6);
      roughLine(ctx2, 28, 28, -32, 28, amount, 8, seed + 8);
    } else if (part.key === "arc.lightning") {
      roughLine(ctx2, -58, 12, -26, -24, amount * 0.65, 6, seed);
      roughLine(ctx2, -26, -24, -6, -8, amount * 0.65, 5, seed + 2);
      roughLine(ctx2, -6, -8, 22, -38, amount * 0.65, 6, seed + 4);
      roughLine(ctx2, 22, -38, 10, -6, amount * 0.65, 5, seed + 6);
      roughLine(ctx2, 10, -6, 54, -12, amount * 0.65, 7, seed + 8);
    } else if (part.key === "lens.aperture") {
      roughCircle(ctx2, 0, 0, 48, amount, seed);
      roughCircle(ctx2, 0, 0, 28, amount * 0.62, seed + 10);
    } else if (part.key === "rail.notched") {
      roughRect(ctx2, -96, -18, 192, 36, amount * 0.7, seed);
    } else if (part.key === "rig.pulley") {
      roughCircle(ctx2, -70, 24, 27, amount * 0.7, seed + 11);
      roughCircle(ctx2, 56, -16, 43, amount * 0.7, seed + 22);
      roughBezier(ctx2, [[-86, 0], [-42, -40], [8, -58], [72, -56]], amount * 0.58, seed + 33);
      roughBezier(ctx2, [[-58, 48], [-10, 36], [36, 26], [92, 16]], amount * 0.58, seed + 44);
    } else if (part.key === "pulley.belt") {
      roughBezier(ctx2, [[-86, 0], [-42, -40], [8, -58], [72, -56]], amount * 0.58, seed + 33);
      roughBezier(ctx2, [[-58, 48], [-10, 36], [36, 26], [92, 16]], amount * 0.58, seed + 44);
    } else if (part.key === "clamp.u") {
      roughCircle(ctx2, 0, -4, 46, amount, seed, 1, Math.PI, Math.PI * 2);
      roughLine(ctx2, -46, -4, -46, 46, amount * 0.7, 7, seed + 20);
      roughLine(ctx2, 46, -4, 46, 46, amount * 0.7, 7, seed + 40);
    } else if (part.key === "bracket.foot") {
      roughRect(ctx2, -62, 14, 124, 36, amount * 0.72, seed);
      roughRect(ctx2, -48, -58, 34, 92, amount * 0.72, seed + 20);
    } else if (part.key === "plate.riveted" || part.key === "vent.grille" || part.key === "mesh.panel") {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      roughRect(ctx2, bounds.x, bounds.y, bounds.w, bounds.h, amount * 0.7, seed);
    } else if (part.key === "axle.rod") {
      roughRect(ctx2, -88, -11, 176, 22, amount * 0.5, seed);
      roughRect(ctx2, -97, -19, 30, 38, amount * 0.42, seed + 20);
      roughRect(ctx2, 67, -19, 30, 38, amount * 0.42, seed + 40);
      roughCircle(ctx2, -108, 0, 3, amount * 0.32, seed + 60);
      roughCircle(ctx2, 108, 0, 3, amount * 0.32, seed + 80);
    } else if (part.key === "kit.fastener") {
      roughRect(ctx2, -66, -38, 132, 76, amount * 0.45, seed);
    } else if (part.key?.startsWith("fastener.")) {
      if (part.key === "fastener.pin") roughRect(ctx2, -34, -18, 68, 36, amount * 0.55, seed);
      else roughCircle(ctx2, 0, 0, 20, amount * 0.5, seed);
    } else if (part.key === "samurai.kabuto") {
      roughBezier(ctx2, [[-152, 26], [-96, -4], [-52, 8], [0, 16], [54, 6], [102, -4], [154, 28]], amount * 0.62, seed);
      roughBezier(ctx2, [[-84, 28], [-74, -48], [-28, -78], [0, -80], [34, -78], [76, -48], [86, 28]], amount * 0.72, seed + 20);
      for (let i = 0; i < 4; i += 1) {
        const y = 34 + i * 15;
        const w = 94 + i * 26;
        roughBezier(ctx2, [[-w, y - 8], [-44, y + 12], [0, y + 8], [48, y + 12], [w, y - 8]], amount * 0.5, seed + 40 + i);
      }
      roughBezier(ctx2, [[-11, -67], [-48, -92], [-82, -86], [-104, -58]], amount * 0.48, seed + 80);
      roughBezier(ctx2, [[11, -67], [48, -92], [82, -86], [104, -58]], amount * 0.48, seed + 90);
    } else if (part.key === "samurai.katana.peek") {
      roughBezier(ctx2, [[-9, -118], [-28, -66], [-24, -16], [-8, 58]], amount * 0.58, seed);
      roughBezier(ctx2, [[6, -118], [-8, -68], [-8, -16], [6, 58]], amount * 0.52, seed + 10);
      roughRect(ctx2, -30, 58, 60, 16, amount * 0.45, seed + 20);
      roughRect(ctx2, -12, 70, 24, 84, amount * 0.5, seed + 30);
    } else if (part.key === "pipe.sleeved") {
      roughRect(ctx2, -104, -16, 208, 32, amount * 0.58, seed);
      for (const x of [-112, -48, 0, 48, 84]) roughRect(ctx2, x, -24, x === 0 ? 36 : 28, 48, amount * 0.5, seed + x);
    } else if (part.key === "pipe.elbow.segment") {
      drawElbowBodyPath(ctx2);
      ctx2.stroke();
      roughLine(ctx2, -57, -94, -23, -94, amount * 0.55, 5, seed + 30);
      roughLine(ctx2, -64, -87, -64, -55, amount * 0.55, 5, seed + 32);
      roughLine(ctx2, -16, -87, -16, -55, amount * 0.55, 5, seed + 34);
      roughLine(ctx2, 56, 16, 89, 16, amount * 0.55, 5, seed + 60);
      roughLine(ctx2, 96, 23, 96, 57, amount * 0.55, 5, seed + 62);
      roughLine(ctx2, 56, 64, 89, 64, amount * 0.55, 5, seed + 64);
    } else if (part.key === "pipe.arc.coupled") {
      roughBezier(ctx2, [[-84, 24], [-42, -48], [42, -48], [84, 24]], amount, seed);
      roughBezier(ctx2, [[-66, 28], [-32, -20], [32, -20], [66, 28]], amount * 0.72, seed + 30);
    } else if (part.key === "tube.flex") {
      roughBezier(ctx2, [[-86, 28], [-54, -46], [44, -48], [86, 14]], amount, seed);
      roughBezier(ctx2, [[-68, 28], [-40, -18], [34, -20], [68, 14]], amount * 0.72, seed + 30);
    } else if (part.key === "hinge.leaf" || part.key === "joint.link" || part.key === "joint.ball") {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      roughRect(ctx2, bounds.x, bounds.y, bounds.w, bounds.h, amount * 0.58, seed);
    } else if (def.kind === "liquid") {
      roughBezier(ctx2, [[0, -26], [28, 8], [18, 38], [0, 38]], amount * 0.72, seed);
      roughBezier(ctx2, [[0, 38], [-18, 38], [-28, 8], [0, -26]], amount * 0.72, seed + 33);
    } else {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      if (Math.max(bounds.w, bounds.h) < 70) roughCircle(ctx2, 0, 0, Math.max(bounds.w, bounds.h) * 0.28, amount * 0.75, seed);
      else roughRect(ctx2, bounds.x, bounds.y, bounds.w, bounds.h, amount, seed);
    }
    ctx2.restore();
  }
  ctx2.restore();
}
function drawFlowLine(ctx2, x1, y1, x2, y2, state = {}) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const pulse = time * 0.72 % 1;
  const theme = liquidTheme(state);
  ctx2.save();
  ctx2.strokeStyle = theme.glow;
  ctx2.lineWidth = 5.2;
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 32;
  ctx2.beginPath();
  ctx2.moveTo(x1, y1);
  ctx2.lineTo(x2, y2);
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha(theme.base, 0.56);
  ctx2.lineWidth = 1.35;
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 32;
  ctx2.beginPath();
  ctx2.moveTo(x1, y1);
  ctx2.lineTo(x2, y2);
  ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.fillStyle = theme.glow;
  ctx2.beginPath();
  ctx2.arc(x1 + (x2 - x1) * pulse, y1 + (y2 - y1) * pulse, 7.2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = colorAlpha(theme.accent, 0.88);
  ctx2.beginPath();
  ctx2.arc(x1 + (x2 - x1) * pulse, y1 + (y2 - y1) * pulse, 3.2, 0, Math.PI * 2);
  ctx2.fill();
  const secondPulse = (pulse + 0.42) % 1;
  ctx2.fillStyle = colorAlpha(theme.base, 0.62);
  ctx2.beginPath();
  ctx2.arc(x1 + (x2 - x1) * secondPulse, y1 + (y2 - y1) * secondPulse, 2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
}
function elbowFlowPoint(t) {
  const topLen = 64;
  const arcRadius = 54;
  const arcLen = arcRadius * Math.PI / 2;
  const sideLen = 66;
  const total = topLen + arcLen + sideLen;
  const distance = (t % 1 + 1) % 1 * total;
  if (distance < topLen) {
    const k2 = distance / topLen;
    return { x: -40, y: -78 + (-14 + 78) * k2 };
  }
  if (distance < topLen + arcLen) {
    const k2 = (distance - topLen) / arcLen;
    const angle = -Math.PI / 2 + k2 * Math.PI / 2;
    return {
      x: -40 + Math.cos(angle) * arcRadius,
      y: 40 + Math.sin(angle) * arcRadius
    };
  }
  const k = (distance - topLen - arcLen) / sideLen;
  return { x: 14 + (80 - 14) * k, y: 40 };
}
function drawElbowFlow(ctx2, state = {}) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const theme = liquidTheme(state);
  const drawPath = () => {
    ctx2.beginPath();
    ctx2.moveTo(-40, -78);
    ctx2.lineTo(-40, -14);
    ctx2.arc(-40, 40, 54, -Math.PI / 2, 0);
    ctx2.lineTo(80, 40);
  };
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  ctx2.strokeStyle = theme.glow;
  ctx2.lineWidth = 6.2;
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 34;
  drawPath();
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha(theme.base, 0.58);
  ctx2.lineWidth = 1.55;
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 34;
  drawPath();
  ctx2.stroke();
  ctx2.setLineDash([]);
  for (const [offset, radius, color] of [
    [0, 3.4, colorAlpha(theme.accent, 0.9)],
    [0.42, 2.1, colorAlpha(theme.base, 0.65)]
  ]) {
    const point = elbowFlowPoint(time * 0.72 + offset);
    ctx2.fillStyle = radius > 3 ? theme.glow : colorAlpha(theme.base, 0.45);
    ctx2.beginPath();
    ctx2.arc(point.x, point.y, radius + 3.6, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();
}
function drawElbowSocket(ctx2, x, y, w, h, orientation) {
  const socketPath = () => roundedRect(ctx2, x, y, w, h, 5);
  drawCastShadow(ctx2, socketPath, 3, 5, 0.04);
  socketPath();
  ctx2.fillStyle = "rgba(251,250,245,0.82)";
  ctx2.fill();
  pencilShade(ctx2, socketPath, { x, y, w, h }, {
    wash: 0.12,
    hatch: 0.07,
    cross: 0.02,
    spacing: 5,
    texture: 0.045
  });
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.56)";
  ctx2.lineWidth = 1.55;
  if (orientation === "vertical") {
    roughLine(ctx2, x + 7, y + 1, x + w - 7, y + 1, 0.3, 5, 551);
    roughLine(ctx2, x + 1, y + 7, x + 1, y + h - 11, 0.32, 5, 552);
    roughLine(ctx2, x + w - 1, y + 7, x + w - 1, y + h - 11, 0.32, 5, 553);
    ctx2.strokeStyle = "rgba(18,22,25,0.14)";
    roughLine(ctx2, x + 8, y + h - 6, x + w - 8, y + h - 6, 0.24, 5, 554);
    ctx2.strokeStyle = "rgba(255,255,255,0.42)";
    roughLine(ctx2, x + w * 0.5 - 7, y + 14, x + w * 0.5 - 7, y + h - 12, 0.18, 4, 555);
  } else {
    roughLine(ctx2, x + 10, y + 1, x + w - 7, y + 1, 0.3, 5, 556);
    roughLine(ctx2, x + w - 1, y + 7, x + w - 1, y + h - 7, 0.32, 5, 557);
    roughLine(ctx2, x + 10, y + h - 1, x + w - 7, y + h - 1, 0.3, 5, 558);
    ctx2.strokeStyle = "rgba(18,22,25,0.14)";
    roughLine(ctx2, x + 6, y + 8, x + 6, y + h - 8, 0.24, 4, 559);
    ctx2.strokeStyle = "rgba(255,255,255,0.42)";
    roughLine(ctx2, x + 10, y + h * 0.5 - 7, x + w - 14, y + h * 0.5 - 7, 0.18, 5, 560);
  }
  ctx2.restore();
}
function drawStraightPipeSocket(ctx2, x, y, w, h, side) {
  drawPencilRect(ctx2, x, y, w, h, 5, {
    fill: "rgba(251,250,245,0.9)",
    wash: 0.13,
    hatch: 0.08,
    spacing: 5,
    shadow: 0.04
  });
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.48)";
  ctx2.lineWidth = 1.35;
  const outerX = side === "west" ? x + 8 : x + w - 8;
  const innerX = side === "west" ? x + w - 8 : x + 8;
  ctx2.beginPath();
  ctx2.moveTo(outerX, y + 8);
  ctx2.lineTo(outerX, y + h - 8);
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.42)";
  ctx2.beginPath();
  ctx2.moveTo(innerX, y + 10);
  ctx2.lineTo(innerX, y + h - 10);
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(18,22,25,0.22)";
  ctx2.beginPath();
  ctx2.moveTo(x + 7, y + 12);
  ctx2.lineTo(x + w - 7, y + 12);
  ctx2.moveTo(x + 7, y + h - 12);
  ctx2.lineTo(x + w - 7, y + h - 12);
  ctx2.stroke();
  ctx2.restore();
}
function drawElbowBodyPath(ctx2) {
  ctx2.beginPath();
  ctx2.moveTo(-62, -80);
  ctx2.lineTo(-62, -35);
  ctx2.bezierCurveTo(-62, 8, -22, 62, 31, 63);
  ctx2.lineTo(84, 63);
  ctx2.lineTo(84, 17);
  ctx2.lineTo(33, 17);
  ctx2.bezierCurveTo(13, 18, -18, -17, -18, -80);
  ctx2.closePath();
}
function drawElbowJoinCollars(ctx2) {
  const paintCollar = (path, bounds) => {
    ctx2.save();
    drawCastShadow(ctx2, path, 2, 3, 0.032);
    path();
    ctx2.fillStyle = "rgba(251,250,245,0.64)";
    ctx2.fill();
    pencilShade(ctx2, path, bounds, { wash: 0.048, hatch: 0.026, cross: 8e-3, spacing: 7, texture: 0.018 });
    path();
    ctx2.strokeStyle = "rgba(18,22,25,0.24)";
    ctx2.lineWidth = 0.95;
    ctx2.stroke();
    sketchStroke(ctx2, path, 0.055, 0.4);
    ctx2.restore();
  };
  const topJoin = () => {
    ctx2.beginPath();
    ctx2.moveTo(-64, -80);
    ctx2.lineTo(-16, -80);
    ctx2.lineTo(-16, -44);
    ctx2.bezierCurveTo(-18, -29, -28, -18, -40, -18);
    ctx2.bezierCurveTo(-53, -19, -64, -36, -64, -54);
    ctx2.closePath();
  };
  const sideJoin = () => {
    ctx2.beginPath();
    ctx2.moveTo(14, 17);
    ctx2.lineTo(86, 17);
    ctx2.lineTo(86, 63);
    ctx2.lineTo(32, 63);
    ctx2.bezierCurveTo(22, 59, 15, 49, 14, 40);
    ctx2.bezierCurveTo(13, 32, 13, 24, 14, 17);
    ctx2.closePath();
  };
  paintCollar(topJoin, { x: -66, y: -82, w: 54, h: 66 });
  paintCollar(sideJoin, { x: 12, y: 15, w: 76, h: 50 });
}
function drawLiquidInnerArt(ctx2, fillY, theme, state = {}, bounds = { x: -34, y: -64, w: 68, h: 128 }) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const texture = String(state.texture || "").toLowerCase();
  const special = Number(state.colorIndex ?? 1) >= 8;
  const starLike = special || texture.includes("star") || texture.includes("luminous") || texture.includes("electric");
  const earthLike = texture.includes("mineral") || texture.includes("ancient") || texture.includes("molten") || texture.includes("crystal");
  const molten = texture.includes("molten");
  const metallic = texture.includes("metallic");
  const smoky = texture.includes("smoky");
  const electric = texture.includes("electric") || texture.includes("luminous");
  const left = bounds.x + bounds.w * 0.08;
  const right = bounds.x + bounds.w * 0.92;
  const bottom = bounds.y + bounds.h * 0.95;
  const top = fillY + bounds.h * 0.04;
  const width = Math.max(8, right - left);
  const height = Math.max(16, bottom - top);
  const midX = bounds.x + bounds.w / 2;
  ctx2.save();
  if (starLike) {
    for (let i = 0; i < 30; i++) {
      const x = left + i * 17 % width;
      const y = top + (i * 29 + Math.sin(time + i) * 7) % height;
      const r = i % 5 === 0 ? 1.7 : 0.8;
      ctx2.fillStyle = i % 4 === 0 ? colorAlpha(theme.accent, 0.88) : "rgba(255,255,255,0.56)";
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  if (earthLike || !starLike) {
    ctx2.strokeStyle = colorAlpha(theme.accent, earthLike ? 0.56 : 0.34);
    ctx2.lineWidth = earthLike ? 1.2 : 0.8;
    for (let i = 0; i < 7; i++) {
      const y = top + 8 + i * Math.max(6, height / 8) + Math.sin(time * 1.2 + i) * 2.4;
      ctx2.beginPath();
      ctx2.moveTo(left + i % 3 * 4, y);
      ctx2.bezierCurveTo(midX - width * 0.22, y - 9, midX + width * 0.22, y + 10, right, y - 3);
      ctx2.stroke();
    }
  }
  if (molten) {
    ctx2.strokeStyle = "rgba(255,238,142,0.64)";
    ctx2.lineWidth = 1.2;
    for (let i = 0; i < 5; i += 1) {
      const x = left + width * (0.16 + i * 0.18);
      ctx2.beginPath();
      ctx2.moveTo(x, top + 6);
      ctx2.lineTo(x + Math.sin(time + i) * 8, top + height * 0.44);
      ctx2.lineTo(x - 10 + Math.cos(time * 0.8 + i) * 5, bottom - 4);
      ctx2.stroke();
    }
  }
  if (metallic) {
    for (let i = 0; i < 6; i += 1) {
      const y = top + height * (0.14 + i * 0.13) + Math.sin(time * 1.4 + i) * 1.8;
      ctx2.strokeStyle = i % 2 ? "rgba(255,255,255,0.58)" : colorAlpha(theme.accent, 0.46);
      ctx2.lineWidth = i % 2 ? 1.1 : 0.7;
      ctx2.beginPath();
      ctx2.moveTo(left + width * 0.12, y);
      ctx2.lineTo(right - width * 0.08, y - 3);
      ctx2.stroke();
    }
  }
  if (smoky) {
    ctx2.strokeStyle = "rgba(255,255,255,0.2)";
    ctx2.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = top + height * (0.18 + i * 0.14);
      ctx2.beginPath();
      ctx2.moveTo(left + 2, y);
      ctx2.bezierCurveTo(midX - 18, y - 14 - Math.sin(time + i) * 4, midX + 16, y + 12, right - 2, y - 6);
      ctx2.stroke();
    }
  }
  if (electric) {
    ctx2.strokeStyle = colorAlpha(theme.accent, 0.72);
    ctx2.lineWidth = 1.05;
    for (let i = 0; i < 4; i += 1) {
      const y = top + height * (0.2 + i * 0.18);
      ctx2.beginPath();
      ctx2.moveTo(left + 5, y);
      for (let step = 1; step <= 5; step += 1) {
        ctx2.lineTo(left + width / 5 * step, y + (step % 2 ? -7 : 6) + Math.sin(time * 3 + i) * 2);
      }
      ctx2.stroke();
    }
  }
  ctx2.strokeStyle = colorAlpha(theme.base, 0.28);
  ctx2.lineWidth = 0.9;
  for (let i = 0; i < 9; i++) {
    const y = top + i * Math.max(5, height / 10);
    ctx2.beginPath();
    ctx2.moveTo(left, y);
    ctx2.lineTo(right, y + Math.sin(time + i) * 3);
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawGlassLiquid(ctx2, glassPath, bounds, state = {}, wave = 4) {
  const theme = liquidTheme(state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const fill = Math.max(0, Math.min(100, state.fillLevel ?? 72));
  const fillY = bounds.y + bounds.h - fill / 100 * bounds.h + Math.sin(time * 2.4) * wave;
  const liquidPath = () => {
    ctx2.beginPath();
    ctx2.moveTo(bounds.x, fillY);
    for (let x = bounds.x; x <= bounds.x + bounds.w + 2; x += 5) {
      ctx2.lineTo(x, fillY + Math.sin(x * 0.1 + time * 4) * wave);
    }
    ctx2.lineTo(bounds.x + bounds.w, bounds.y + bounds.h);
    ctx2.lineTo(bounds.x, bounds.y + bounds.h);
    ctx2.closePath();
  };
  ctx2.save();
  glassPath();
  ctx2.clip();
  ctx2.fillStyle = theme.glow;
  liquidPath();
  ctx2.fill();
  const liquid = ctx2.createLinearGradient(bounds.x, fillY, bounds.x + bounds.w, bounds.y + bounds.h);
  liquid.addColorStop(0, colorAlpha(theme.accent, 0.38));
  liquid.addColorStop(0.48, colorAlpha(theme.base, 0.5));
  liquid.addColorStop(1, "rgba(18,22,25,0.2)");
  ctx2.fillStyle = liquid;
  liquidPath();
  ctx2.fill();
  ctx2.save();
  liquidPath();
  ctx2.clip();
  drawLiquidInnerArt(ctx2, fillY, theme, state, bounds);
  ctx2.restore();
  ctx2.strokeStyle = colorAlpha(theme.accent, 0.58);
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(bounds.x + 4, fillY);
  for (let x = bounds.x + 4; x <= bounds.x + bounds.w - 4; x += 6) {
    ctx2.lineTo(x, fillY + Math.sin(x * 0.1 + time * 4) * wave);
  }
  ctx2.stroke();
  ctx2.restore();
}
function drawSealedTubeFlow(ctx2, path, state = {}, width = 24, phase = 0) {
  const theme = liquidTheme(state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = state.previewMotion === false ? 0 : 28;
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  ctx2.translate(4, 6);
  ctx2.strokeStyle = "rgba(0,0,0,0.055)";
  ctx2.lineWidth = width + 7;
  path();
  ctx2.stroke();
  ctx2.restore();
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  ctx2.strokeStyle = "rgba(18,22,25,0.3)";
  ctx2.lineWidth = width + 3;
  path();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(251,250,245,0.58)";
  ctx2.lineWidth = width;
  path();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(18,22,25,0.1)";
  ctx2.lineWidth = width * 0.72;
  path();
  ctx2.stroke();
  ctx2.strokeStyle = theme.glow;
  ctx2.lineWidth = Math.max(5, width * 0.34);
  ctx2.setLineDash([11, 10]);
  ctx2.lineDashOffset = -time * speed - phase;
  path();
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha(theme.base, 0.62);
  ctx2.lineWidth = Math.max(1.4, width * 0.11);
  ctx2.setLineDash([11, 10]);
  ctx2.lineDashOffset = -time * speed - phase;
  path();
  ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.strokeStyle = "rgba(255,255,255,0.38)";
  ctx2.lineWidth = 1.05;
  ctx2.translate(-2, -4);
  path();
  ctx2.stroke();
  ctx2.restore();
}
function drawSealedTubeCap(ctx2, x, y, rotation = 0, scale = 1) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(rotation);
  ctx2.scale(scale, scale);
  drawPencilRect(ctx2, -16, -8, 32, 16, 4, {
    fill: "rgba(251,250,245,0.78)",
    wash: 0.13,
    hatch: 0.065,
    cross: 0.018,
    spacing: 5,
    shadow: 0.026,
    lineWidth: 1.4
  });
  drawRivet(ctx2, 0, 0, 2.4);
  ctx2.restore();
}
function drawVialGlassDesign(ctx2, variant) {
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  if (variant === "ornate") {
    ctx2.strokeStyle = "rgba(18,22,25,0.5)";
    ctx2.lineWidth = 1.35;
    roughLine(ctx2, 0, -55, 0, 54, 0.32, 11, 2100);
    for (const y of [-38, -16, 8, 32]) {
      ctx2.beginPath();
      ctx2.moveTo(0, y);
      ctx2.bezierCurveTo(-18, y - 8, -19, y + 12, -3, y + 10);
      ctx2.bezierCurveTo(15, y + 8, 16, y - 11, 0, y - 8);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.ellipse(-11, y + 2, 4, 8, -0.62, 0, Math.PI * 2);
      ctx2.ellipse(11, y - 2, 4, 8, 0.62, 0, Math.PI * 2);
      ctx2.stroke();
    }
    ctx2.beginPath();
    ctx2.moveTo(0, -12);
    ctx2.lineTo(12, 0);
    ctx2.lineTo(0, 12);
    ctx2.lineTo(-12, 0);
    ctx2.closePath();
    ctx2.stroke();
    for (const y of [-52, 52]) drawRivet(ctx2, 0, y, 1.8);
    ctx2.strokeStyle = "rgba(255,255,255,0.42)";
    ctx2.lineWidth = 1;
    roughLine(ctx2, -16, -50, -16, 50, 0.24, 8, 2118);
  } else if (variant === "crystal") {
    ctx2.strokeStyle = "rgba(18,22,25,0.52)";
    ctx2.lineWidth = 1.25;
    const facets = [
      [[-18, -56], [5, -36], [-15, -14], [10, 2], [-12, 26], [16, 52]],
      [[18, -56], [-4, -34], [16, -12], [-10, 8], [14, 30], [-16, 52]],
      [[0, -62], [0, 58]],
      [[-22, -26], [22, -26]],
      [[-22, 18], [22, 18]]
    ];
    for (const points of facets) {
      ctx2.beginPath();
      points.forEach(([x, y], index) => index ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y));
      ctx2.stroke();
    }
    ctx2.fillStyle = "rgba(255,255,255,0.12)";
    for (const shape of [
      [[0, -56], [16, -28], [0, -26]],
      [[-15, -14], [10, 2], [0, 18]],
      [[14, 30], [-16, 52], [0, 54]]
    ]) {
      ctx2.beginPath();
      shape.forEach(([x, y], index) => index ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y));
      ctx2.closePath();
      ctx2.fill();
      ctx2.stroke();
    }
    ctx2.strokeStyle = "rgba(255,255,255,0.48)";
    ctx2.lineWidth = 1;
    roughLine(ctx2, 12, -50, 4, 45, 0.28, 8, 2255);
  } else {
    ctx2.strokeStyle = "rgba(18,22,25,0.5)";
    ctx2.lineWidth = 1.25;
    for (const y of [-48, -23, 2, 27, 52]) {
      roughLine(ctx2, -23, y, 23, y, 0.28, 5, 2300 + y);
      drawRivet(ctx2, -18, y, 1.55);
      drawRivet(ctx2, 18, y, 1.55);
    }
    ctx2.lineWidth = 1.4;
    for (const x of [-18, -9, 0, 9, 18]) {
      roughLine(ctx2, x, -56, x, 56, 0.3, 10, 2360 + x);
    }
    ctx2.strokeStyle = "rgba(255,255,255,0.38)";
    ctx2.lineWidth = 1;
    for (const x of [-13, 13]) roughLine(ctx2, x, -52, x, 52, 0.22, 8, 2390 + x);
  }
  ctx2.restore();
}
function drawSealedVial(ctx2, part, state = {}, variant = "ornate") {
  setup(ctx2, part, 1.9, 0.82);
  const glass = () => roundedRect(ctx2, -28, -70, 56, 140, 24);
  drawCastShadow(ctx2, glass, 4, 6, 0.055);
  glass();
  ctx2.fillStyle = "rgba(255,255,255,0.12)";
  ctx2.fill();
  pencilShade(ctx2, glass, { x: -30, y: -72, w: 60, h: 144 }, {
    wash: 0.045,
    hatch: 0.022,
    cross: 0.01,
    spacing: 8,
    texture: 0.022
  });
  drawGlassLiquid(ctx2, glass, { x: -32, y: -70, w: 64, h: 140 }, {
    ...state,
    fillLevel: variant === "column" ? (state.fillLevel ?? 72) - 8 : state.fillLevel
  }, 3);
  ctx2.save();
  glass();
  ctx2.clip();
  drawVialGlassDesign(ctx2, variant);
  ctx2.restore();
  glass();
  ctx2.stroke();
  sketchStroke(ctx2, glass, 0.09, 0.55);
  for (const y of [-78, 78]) {
    drawPencilRect(ctx2, -24, y - 10, 48, 20, 5, {
      fill: "rgba(251,250,245,0.78)",
      wash: 0.13,
      hatch: 0.07,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.5
    });
    drawRivet(ctx2, -14, y, 2.2);
    drawRivet(ctx2, 14, y, 2.2);
  }
  for (const y of [-93, 93]) {
    ctx2.beginPath();
    ctx2.arc(0, y, 9, 0, Math.PI * 2);
    ctx2.stroke();
    drawRivet(ctx2, 0, y, 2.5);
  }
}
function drawStraightSealedTube(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const glass = () => roundedRect(ctx2, -19, -76, 38, 152, 15);
  drawCastShadow(ctx2, glass, 3, 5, 0.052);
  pencilShade(ctx2, glass, { x: -22, y: -78, w: 44, h: 156 }, { wash: 0.043, hatch: 0.022, cross: 0.01, spacing: 8, texture: 0.02 });
  drawGlassLiquid(ctx2, glass, { x: -22, y: -72, w: 44, h: 144 }, state, 2.6);
  glass();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.38)";
  roughLine(ctx2, -8, -62, -8, 62, 0.26, 10, 2388);
  drawSealedTubeCap(ctx2, 0, -85, 0, 0.9);
  drawSealedTubeCap(ctx2, 0, 85, 0, 0.9);
}
function drawMiniFluidCell(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  if (part.liveGasMeter) {
    const gasLevel = gasLevelFor(state);
    state = {
      ...state,
      fillLevel: 28 + gasLevel * 68,
      texture: gasLevel > 0.68 ? "Boiling" : gasLevel > 0.36 ? "Bubbly" : "Still"
    };
  }
  const glass = () => roundedRect(ctx2, -31, -38, 62, 76, 18);
  drawCastShadow(ctx2, glass, 3, 5, 0.052);
  glass();
  ctx2.fillStyle = "rgba(255,255,255,0.12)";
  ctx2.fill();
  pencilShade(ctx2, glass, { x: -34, y: -40, w: 68, h: 80 }, {
    wash: 0.045,
    hatch: 0.022,
    cross: 0.01,
    spacing: 7,
    texture: 0.02
  });
  drawGlassLiquid(ctx2, glass, { x: -36, y: -38, w: 72, h: 76 }, state, 2.8);
  glass();
  ctx2.stroke();
  for (const y of [-48, 48]) {
    drawPencilRect(ctx2, -28, y - 9, 56, 18, 5, {
      fill: "rgba(251,250,245,0.78)",
      wash: 0.13,
      hatch: 0.067,
      spacing: 5,
      shadow: 0.028,
      lineWidth: 1.45
    });
    for (const x of [-18, 0, 18]) drawRivet(ctx2, x, y, 2.1);
  }
  for (const x of [-36, 36]) {
    ctx2.beginPath();
    ctx2.arc(x, 0, 5.5, 0, Math.PI * 2);
    ctx2.stroke();
    drawRivet(ctx2, x, 0, 2);
  }
  ctx2.strokeStyle = "rgba(255,255,255,0.35)";
  roughLine(ctx2, -14, -28, -14, 28, 0.22, 6, 2366);
}
function drawBoltedFluidPort(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 48, 0, Math.PI * 2);
  };
  const glass = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 34, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 4, 5, 0.055);
  outer();
  ctx2.fillStyle = "rgba(251,250,245,0.42)";
  ctx2.fill();
  pencilShade(ctx2, outer, { x: -50, y: -50, w: 100, h: 100 }, {
    wash: 0.09,
    hatch: 0.045,
    cross: 0.015,
    spacing: 6,
    texture: 0.032
  });
  outer();
  ctx2.stroke();
  roughCircle(ctx2, 0, 0, 48, 0.7, 2414);
  roughCircle(ctx2, 0, 0, 36, 0.45, 2415);
  glass();
  ctx2.fillStyle = "rgba(255,255,255,0.12)";
  ctx2.fill();
  drawGlassLiquid(ctx2, glass, { x: -42, y: -36, w: 84, h: 72 }, state, 2.8);
  glass();
  ctx2.stroke();
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * 45, Math.sin(angle) * 45, 2.7);
  }
  ctx2.strokeStyle = "rgba(255,255,255,0.38)";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.arc(-7, -8, 22, Math.PI * 1.05, Math.PI * 1.6);
  ctx2.stroke();
}
function drawRingFluidTube(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const ring = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 60, 0, Math.PI * 2);
  };
  drawSealedTubeFlow(ctx2, ring, state, 20, 4);
  roughCircle(ctx2, 0, 0, 60, 0.65, 2401);
  roughCircle(ctx2, 0, 0, 42, 0.45, 2402);
  for (const angle of [-Math.PI / 2, Math.PI / 2]) {
    ctx2.save();
    ctx2.translate(Math.cos(angle) * 60, Math.sin(angle) * 60);
    ctx2.rotate(angle + Math.PI / 2);
    drawSealedTubeCap(ctx2, 0, 0, 0, 0.75);
    ctx2.restore();
  }
}
function drawOvalFluidLoop(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const loop = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 52, 76, 0.18, 0, Math.PI * 2);
  };
  drawSealedTubeFlow(ctx2, loop, state, 18, 12);
  roughCircle(ctx2, 0, 0, 62, 0.65, 2441, 1.38);
  roughCircle(ctx2, 0, 0, 42, 0.45, 2442, 1.5);
  drawSealedTubeCap(ctx2, 44, -42, Math.PI * 0.45, 0.72);
  drawSealedTubeCap(ctx2, -40, 48, Math.PI * 0.45, 0.72);
}
function drawUTubeSealed(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const u = () => {
    ctx2.beginPath();
    ctx2.moveTo(-44, 58);
    ctx2.lineTo(-44, -18);
    ctx2.bezierCurveTo(-44, -72, 44, -72, 44, -18);
    ctx2.lineTo(44, 58);
  };
  drawSealedTubeFlow(ctx2, u, state, 22, 20);
  roughLine(ctx2, -44, 58, -44, -18, 0.55, 9, 2500);
  roughLine(ctx2, 44, -18, 44, 58, 0.55, 9, 2501);
  roughCircle(ctx2, 0, -18, 44, 0.6, 2502, 1, Math.PI, Math.PI * 2);
  drawSealedTubeCap(ctx2, -44, 66, 0, 0.86);
  drawSealedTubeCap(ctx2, 44, 66, 0, 0.86);
}
function drawCurvedSealedTube(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.82);
  const curve = () => {
    ctx2.beginPath();
    ctx2.moveTo(-46, 58);
    ctx2.bezierCurveTo(-34, 8, -16, -40, 42, -64);
  };
  drawSealedTubeFlow(ctx2, curve, state, 22, 28);
  roughBezier(ctx2, [[-46, 58], [-34, 8], [-16, -40], [42, -64]], 0.7, 2550);
  drawSealedTubeCap(ctx2, -48, 64, -0.22, 0.85);
  drawSealedTubeCap(ctx2, 47, -68, -0.62, 0.85);
}
function drawSealedTubePart(ctx2, part, state = {}) {
  if (part.key === "tube.vial.ornate") return drawSealedVial(ctx2, part, state, "ornate");
  if (part.key === "tube.vial.crystal") return drawSealedVial(ctx2, part, state, "crystal");
  if (part.key === "tube.vial.column") return drawSealedVial(ctx2, part, state, "column");
  if (part.key === "tube.loop.ring") return drawRingFluidTube(ctx2, part, state);
  if (part.key === "tube.loop.oval") return drawOvalFluidLoop(ctx2, part, state);
  if (part.key === "tube.sealed.u") return drawUTubeSealed(ctx2, part, state);
  if (part.key === "tube.sealed.curve") return drawCurvedSealedTube(ctx2, part, state);
  if (part.key === "tube.cell.mini") return drawMiniFluidCell(ctx2, part, state);
  if (part.key === "tube.port.bolted") return drawBoltedFluidPort(ctx2, part, state);
  return drawStraightSealedTube(ctx2, part, state);
}
function drawSealedTubeOuterEdge(ctx2, key, amount, seed) {
  if (key === "tube.loop.ring") {
    roughCircle(ctx2, 0, 0, 60, amount * 0.55, seed);
    roughCircle(ctx2, 0, 0, 42, amount * 0.42, seed + 10);
  } else if (key === "tube.loop.oval") {
    roughCircle(ctx2, 0, 0, 58, amount * 0.55, seed, 1.45);
    roughCircle(ctx2, 0, 0, 40, amount * 0.42, seed + 10, 1.55);
  } else if (key === "tube.sealed.u") {
    roughLine(ctx2, -44, 58, -44, -18, amount * 0.5, 9, seed);
    roughLine(ctx2, 44, -18, 44, 58, amount * 0.5, 9, seed + 10);
    roughCircle(ctx2, 0, -18, 44, amount * 0.5, seed + 20, 1, Math.PI, Math.PI * 2);
  } else if (key === "tube.sealed.curve") {
    roughBezier(ctx2, [[-46, 58], [-34, 8], [-16, -40], [42, -64]], amount * 0.5, seed);
  } else if (key === "tube.cell.mini") {
    roughRect(ctx2, -34, -56, 68, 112, amount * 0.42, seed);
    roughCircle(ctx2, -36, 0, 6, amount * 0.32, seed + 8);
    roughCircle(ctx2, 36, 0, 6, amount * 0.32, seed + 16);
  } else if (key === "tube.port.bolted") {
    roughCircle(ctx2, 0, 0, 48, amount * 0.5, seed);
    roughCircle(ctx2, 0, 0, 34, amount * 0.42, seed + 10);
  } else if (key === "tube.sealed.straight") {
    roughRect(ctx2, -22, -88, 44, 176, amount * 0.42, seed);
  } else {
    roughRect(ctx2, -30, -96, 60, 192, amount * 0.42, seed);
  }
}
function roundedRect(ctx2, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx2.beginPath();
  ctx2.moveTo(x + radius, y);
  ctx2.lineTo(x + w - radius, y);
  ctx2.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx2.lineTo(x + w, y + h - radius);
  ctx2.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx2.lineTo(x + radius, y + h);
  ctx2.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx2.lineTo(x, y + radius);
  ctx2.quadraticCurveTo(x, y, x + radius, y);
  ctx2.closePath();
}
function drawConnectorMark(ctx2, x, y) {
  ctx2.save();
  ctx2.strokeStyle = "rgba(0,0,0,0.36)";
  ctx2.lineWidth = 1.2;
  ctx2.beginPath();
  ctx2.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.restore();
}
function drawGear(ctx2, part, state, radius = 58, teeth = 24) {
  setup(ctx2, part, 2.2, 0.86);
  const bounds = { x: -radius - 12, y: -radius - 12, w: radius * 2 + 24, h: radius * 2 + 24 };
  const outer = () => pathGear(ctx2, radius, teeth);
  drawCastShadow(ctx2, outer, 6, 8, 0.075);
  outer();
  ctx2.fill();
  ctx2.stroke();
  pencilShade(ctx2, outer, bounds, { wash: 0.13, hatch: 0.09, cross: 0.038, spacing: 7, texture: 0.075 });
  sketchStroke(ctx2, outer, 0.22, 0.8);
  ctx2.save();
  ctx2.beginPath();
  ctx2.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx2.clip();
  const radial = ctx2.createRadialGradient(-radius * 0.34, -radius * 0.42, radius * 0.08, 0, 0, radius * 0.78);
  radial.addColorStop(0, "rgba(255,255,255,0.62)");
  radial.addColorStop(0.48, "rgba(18,22,25,0.02)");
  radial.addColorStop(1, "rgba(18,22,25,0.18)");
  ctx2.fillStyle = radial;
  ctx2.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx2.restore();
  ctx2.strokeStyle = SOFT_INK;
  for (const ring of [radius * 0.74, radius * 0.52, radius * 0.32, radius * 0.18]) {
    ctx2.beginPath();
    ctx2.arc(0, 0, ring, 0, Math.PI * 2);
    ctx2.stroke();
  }
  if (!CLEAN_GEAR_SPOKES.has(part.key)) {
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      ctx2.beginPath();
      ctx2.moveTo(Math.cos(angle) * radius * 0.28, Math.sin(angle) * radius * 0.28);
      ctx2.lineTo(Math.cos(angle) * radius * 0.58, Math.sin(angle) * radius * 0.58);
      ctx2.stroke();
    }
  }
  for (let i = 0; i < teeth; i += Math.max(1, Math.floor(teeth / 16))) {
    const angle = i / teeth * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * radius * 0.86, Math.sin(angle) * radius * 0.86, 2.5);
  }
}
function drawBevelGear(ctx2, part, state = {}) {
  setup(ctx2, part, 1.85, 0.78);
  const phase = state.previewMotion === false ? 0 : (state.time || 0) * Math.max(0.45, Math.abs(state.motionSpeed ?? 0.72));
  const tilt = -0.34;
  const body = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 66, 38, tilt, 0, Math.PI * 2);
  };
  const backLip = () => {
    ctx2.beginPath();
    ctx2.ellipse(9, 13, 58, 30, tilt, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, backLip, 5, 7, 0.06);
  ctx2.save();
  ctx2.fillStyle = "rgba(18,22,25,0.065)";
  backLip();
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.22)";
  ctx2.lineWidth = 1.15;
  backLip();
  ctx2.stroke();
  ctx2.restore();
  body();
  ctx2.fill();
  ctx2.stroke();
  pencilShade(ctx2, body, { x: -72, y: -48, w: 144, h: 96 }, { wash: 0.12, hatch: 0.07, cross: 0.028, spacing: 7, texture: 0.06 });
  sketchStroke(ctx2, body, 0.22, 0.75);
  ctx2.save();
  ctx2.rotate(tilt);
  ctx2.scale(1, 0.58);
  ctx2.strokeStyle = SOFT_INK;
  ctx2.lineWidth = 1.2;
  for (const r of [58, 45, 28]) {
    ctx2.beginPath();
    ctx2.arc(0, 0, r, 0, Math.PI * 2);
    ctx2.stroke();
  }
  for (let i = 0; i < 28; i++) {
    const angle = i / 28 * Math.PI * 2 + phase * 0.18;
    const inner = i % 2 ? 50 : 46;
    roughLine(ctx2, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle + 0.045) * 69, Math.sin(angle + 0.045) * 69, 0.36, 3, i * 19 + 60);
  }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2 + phase * 0.18;
    roughLine(ctx2, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle + 0.12) * 43, Math.sin(angle + 0.12) * 43, 0.45, 4, i * 31 + 90);
  }
  ctx2.restore();
  ctx2.save();
  ctx2.fillStyle = "rgba(255,255,255,0.42)";
  ctx2.strokeStyle = "rgba(18,22,25,0.52)";
  ctx2.lineWidth = 1.35;
  ctx2.beginPath();
  ctx2.ellipse(0, 0, 20, 12, tilt, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.ellipse(0, 0, 8, 5, tilt, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.restore();
}
function drawWheel(ctx2, part, state = {}) {
  setup(ctx2, part, 2.2, 0.84);
  const gasLevel = part.liveGasMeter ? gasLevelFor(state) : 0;
  const pressureColor = pressureColorFor(gasLevel);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 64, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 5, 7, 0.065);
  pencilShade(ctx2, outer, { x: -68, y: -68, w: 136, h: 136 }, { wash: 0.1, hatch: 0.065, cross: 0.03 });
  ctx2.beginPath();
  ctx2.arc(0, 0, 64, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, 42, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, 12, 0, Math.PI * 2);
  ctx2.stroke();
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    ctx2.beginPath();
    ctx2.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
    ctx2.lineTo(Math.cos(angle) * 58, Math.sin(angle) * 58);
    ctx2.stroke();
    drawRivet(ctx2, Math.cos(angle) * 48, Math.sin(angle) * 48, 3);
  }
  if (part.liveGasMeter) {
    ctx2.save();
    ctx2.lineWidth = 5;
    ctx2.lineCap = "round";
    ctx2.strokeStyle = colorAlpha(pressureColor, 0.58);
    ctx2.beginPath();
    ctx2.arc(0, 0, 74, -Math.PI * 0.72, -Math.PI * 0.72 + Math.PI * 1.44 * gasLevel);
    ctx2.stroke();
    ctx2.strokeStyle = colorAlpha(pressureColor, 0.24);
    ctx2.lineWidth = 1.8;
    const spin = (state.time || 0) * (1.5 + gasLevel * 6);
    for (let i = 0; i < 4; i += 1) {
      const a = spin + i * Math.PI * 0.5;
      roughLine(ctx2, Math.cos(a) * 78, Math.sin(a) * 78, Math.cos(a) * 90, Math.sin(a) * 90, 0.24, 3, 3300 + i);
    }
    ctx2.restore();
  }
}
function drawStraightPipe(ctx2, part, state) {
  setup(ctx2, part, 2.3, 0.82);
  drawPencilRect(ctx2, -70, -18, 140, 36, 13, { wash: 0.11, hatch: 0.075, cross: 0.03, spacing: 6 });
  ctx2.strokeStyle = "rgba(255,255,255,0.44)";
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(-60, -8);
  ctx2.lineTo(60, -8);
  ctx2.stroke();
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.1;
  ctx2.beginPath();
  ctx2.moveTo(-50, 0);
  ctx2.lineTo(50, 0);
  ctx2.stroke();
  drawFlowLine(ctx2, -42, 0, 42, 0, state);
  drawStraightPipeSocket(ctx2, -82, -27, 28, 54, "west");
  drawStraightPipeSocket(ctx2, 54, -27, 28, 54, "east");
  drawConnectorMark(ctx2, -82, 0);
  drawConnectorMark(ctx2, 82, 0);
}
function drawElbowPipe(ctx2, part, state) {
  setup(ctx2, part, 2.3, 0.82);
  const bodyPath = () => drawElbowBodyPath(ctx2);
  drawCastShadow(ctx2, bodyPath, 5, 7, 0.06);
  bodyPath();
  ctx2.fillStyle = "rgba(248,247,242,0.66)";
  ctx2.fill();
  pencilShade(ctx2, bodyPath, { x: -70, y: -88, w: 164, h: 158 }, {
    wash: 0.1,
    hatch: 0.055,
    cross: 0.018,
    spacing: 7,
    texture: 0.045
  });
  ctx2.save();
  bodyPath();
  ctx2.clip();
  ctx2.strokeStyle = "rgba(255,255,255,0.34)";
  ctx2.lineWidth = 1.05;
  roughLine(ctx2, -51, -73, -51, -38, 0.26, 5, 964);
  ctx2.beginPath();
  ctx2.arc(-40, 40, 48, -Math.PI / 2, -0.08);
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(18,22,25,0.12)";
  ctx2.lineWidth = 0.9;
  ctx2.beginPath();
  ctx2.arc(-40, 40, 57, -Math.PI / 2, 0);
  ctx2.stroke();
  ctx2.restore();
  bodyPath();
  ctx2.strokeStyle = "rgba(18,22,25,0.5)";
  ctx2.lineWidth = 1.8;
  ctx2.stroke();
  sketchStroke(ctx2, bodyPath, 0.12, 0.65);
  drawElbowJoinCollars(ctx2);
  drawElbowSocket(ctx2, -64, -94, 48, 48, "vertical");
  drawElbowSocket(ctx2, 46, 16, 50, 48, "horizontal");
  drawElbowFlow(ctx2, state);
  drawConnectorMark(ctx2, -40, -94);
  drawConnectorMark(ctx2, 96, 40);
}
function drawCurvePipe(ctx2, part, state) {
  setup(ctx2, part, 2.2, 0.78);
  ctx2.save();
  ctx2.translate(5, 7);
  ctx2.strokeStyle = "rgba(0,0,0,0.065)";
  ctx2.lineWidth = 36;
  ctx2.beginPath();
  ctx2.moveTo(-68, 34);
  ctx2.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.08)";
  ctx2.lineWidth = 31;
  ctx2.beginPath();
  ctx2.moveTo(-68, 34);
  ctx2.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx2.stroke();
  drawHatching(ctx2, { x: -78, y: -60, w: 166, h: 120 }, -0.78, 9, 0.04, 0.65);
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.2;
  ctx2.beginPath();
  ctx2.moveTo(-68, 34);
  ctx2.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(-52, 38);
  ctx2.bezierCurveTo(-22, -18, 24, -30, 58, 17);
  ctx2.stroke();
  drawFlowLine(ctx2, -56, 32, 58, 18, state);
}
function drawTank(ctx2, part, state = {}) {
  const theme = liquidTheme(state);
  setup(ctx2, part, 2.2, 0.84);
  drawPencilRect(ctx2, -46, -108, 92, 216, 14, { wash: 0.1, hatch: 0.06, cross: 0.025, spacing: 7, shadow: 0.065 });
  drawPencilRect(ctx2, -58, -96, 116, 28, 5, { wash: 0.14, hatch: 0.09, cross: 0.035, spacing: 5, shadow: 0.04 });
  drawPencilRect(ctx2, -58, 68, 116, 28, 5, { wash: 0.14, hatch: 0.09, cross: 0.035, spacing: 5, shadow: 0.04 });
  const glass = () => roundedRect(ctx2, -34, -64, 68, 128, 24);
  glass();
  ctx2.stroke();
  pencilShade(ctx2, glass, { x: -34, y: -64, w: 68, h: 128 }, { wash: 0.045, hatch: 0.025, cross: 0.012, spacing: 9, texture: 0.025 });
  ctx2.save();
  glass();
  ctx2.clip();
  const fill = Math.max(0, Math.min(100, state.fillLevel ?? 72));
  const fillY = 64 - fill / 100 * 128 + Math.sin((state.time || 0) * 2.4) * 4;
  const liquidPath = () => {
    ctx2.beginPath();
    ctx2.moveTo(-34, fillY);
    for (let x = -34; x <= 36; x += 4) {
      ctx2.lineTo(x, fillY + Math.sin(x * 0.1 + (state.time || 0) * 4) * 4);
    }
    ctx2.lineTo(34, 64);
    ctx2.lineTo(-34, 64);
    ctx2.closePath();
  };
  ctx2.fillStyle = theme.glow;
  liquidPath();
  ctx2.fill();
  const liquid = ctx2.createLinearGradient(-34, fillY, 34, 64);
  liquid.addColorStop(0, colorAlpha(theme.accent, 0.38));
  liquid.addColorStop(0.46, colorAlpha(theme.base, 0.48));
  liquid.addColorStop(1, "rgba(18,22,25,0.2)");
  ctx2.fillStyle = liquid;
  liquidPath();
  ctx2.fill();
  ctx2.save();
  liquidPath();
  ctx2.clip();
  drawLiquidInnerArt(ctx2, fillY, theme, state, { x: -34, y: -64, w: 68, h: 128 });
  ctx2.restore();
  ctx2.strokeStyle = colorAlpha(theme.accent, 0.58);
  ctx2.lineWidth = 1;
  ctx2.beginPath();
  ctx2.moveTo(-31, fillY);
  for (let x = -31; x <= 32; x += 5) {
    ctx2.lineTo(x, fillY + Math.sin(x * 0.1 + (state.time || 0) * 4) * 4);
  }
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.35)";
  ctx2.lineWidth = 1.2;
  ctx2.beginPath();
  ctx2.moveTo(-18, -48);
  ctx2.bezierCurveTo(-26, -8, -24, 28, -15, 54);
  ctx2.stroke();
  ctx2.restore();
  for (const y of [-74, 82]) {
    for (let x = -38; x <= 38; x += 19) {
      drawRivet(ctx2, x, y, 3);
    }
  }
  drawConnectorMark(ctx2, 0, -126);
  drawConnectorMark(ctx2, 0, 126);
}
function drawRoundTank(ctx2, part, state = {}) {
  setup(ctx2, part, 2.1, 0.84);
  const glass = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 62, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, glass, 5, 7, 0.06);
  pencilShade(ctx2, glass, { x: -66, y: -66, w: 132, h: 132 }, { wash: 0.055, hatch: 0.026, cross: 0.012, spacing: 9, texture: 0.03 });
  drawGlassLiquid(ctx2, glass, { x: -72, y: -62, w: 144, h: 124 }, state, 3.6);
  glass();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, 46, 0, Math.PI * 2);
  ctx2.stroke();
  drawPencilRect(ctx2, -48, -92, 96, 22, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx2, -48, 70, 96, 22, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * 74, Math.sin(angle) * 74, 2.6);
  }
  drawConnectorMark(ctx2, 0, -92);
  drawConnectorMark(ctx2, 0, 92);
  drawConnectorMark(ctx2, -92, 0);
  drawConnectorMark(ctx2, 92, 0);
}
function drawCoreTank(ctx2, part, state = {}) {
  setup(ctx2, part, 2.1, 0.84);
  const glass = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 64, 50, 0, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, glass, 5, 7, 0.06);
  pencilShade(ctx2, glass, { x: -66, y: -52, w: 132, h: 104 }, { wash: 0.06, hatch: 0.03, cross: 0.014, spacing: 8, texture: 0.032 });
  drawGlassLiquid(ctx2, glass, { x: -58, y: -44, w: 116, h: 88 }, state, 3.2);
  glass();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.ellipse(0, 0, 42, 28, 0, 0, Math.PI * 2);
  ctx2.stroke();
  drawPencilRect(ctx2, -96, -18, 32, 36, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx2, 64, -18, 32, 36, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  for (const angle of [-0.65, 0, 0.65]) {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 68, 18, angle, 0, Math.PI * 2);
    ctx2.stroke();
  }
  drawConnectorMark(ctx2, -96, 0);
  drawConnectorMark(ctx2, 96, 0);
  drawConnectorMark(ctx2, 0, -76);
  drawConnectorMark(ctx2, 0, 76);
}
function drawTwinVials(ctx2, part, state = {}) {
  setup(ctx2, part, 2.1, 0.84);
  drawPencilRect(ctx2, -62, -98, 124, 28, 5, { wash: 0.13, hatch: 0.08, spacing: 5, shadow: 0.045 });
  drawPencilRect(ctx2, -62, 70, 124, 28, 5, { wash: 0.13, hatch: 0.08, spacing: 5, shadow: 0.045 });
  for (const x of [-32, 32]) {
    const glass = () => roundedRect(ctx2, x - 19, -70, 38, 140, 16);
    drawCastShadow(ctx2, glass, 3, 5, 0.045);
    glass();
    ctx2.stroke();
    pencilShade(ctx2, glass, { x: x - 19, y: -70, w: 38, h: 140 }, { wash: 0.045, hatch: 0.022, cross: 0.01, spacing: 8, texture: 0.022 });
    drawGlassLiquid(ctx2, glass, { x: x - 17, y: -64, w: 34, h: 128 }, { ...state, fillLevel: (state.fillLevel ?? 72) - (x < 0 ? 6 : -5) }, 3);
    ctx2.strokeStyle = "rgba(255,255,255,0.34)";
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(x - 8, -55);
    ctx2.lineTo(x - 8, 54);
    ctx2.stroke();
    ctx2.strokeStyle = INK;
  }
  for (const x of [-42, -18, 18, 42]) {
    drawRivet(ctx2, x, -84, 2.8);
    drawRivet(ctx2, x, 84, 2.8);
  }
  drawConnectorMark(ctx2, 0, -112);
  drawConnectorMark(ctx2, 0, 112);
}
function drawSquareHeadTank(ctx2, part, state = {}) {
  setup(ctx2, part, 2.2, 0.84);
  const body = () => roundedRect(ctx2, -92, -112, 184, 224, 18);
  const glass = () => roundedRect(ctx2, -76, -88, 152, 176, 18);
  drawCastShadow(ctx2, body, 6, 8, 0.065);
  body();
  ctx2.fillStyle = "rgba(241,249,246,0.28)";
  ctx2.fill();
  pencilShade(ctx2, body, { x: -92, y: -112, w: 184, h: 224 }, {
    wash: 0.055,
    hatch: 0.026,
    cross: 0.01,
    spacing: 9,
    texture: 0.03
  });
  body();
  ctx2.strokeStyle = "rgba(18,22,25,0.56)";
  ctx2.lineWidth = 2.4;
  ctx2.stroke();
  drawPencilRect(ctx2, -86, -124, 172, 26, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx2, -86, 98, 172, 26, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx2, -102, -74, 26, 148, 5, { wash: 0.1, hatch: 0.052, spacing: 6, shadow: 0.032 });
  drawPencilRect(ctx2, 76, -74, 26, 148, 5, { wash: 0.1, hatch: 0.052, spacing: 6, shadow: 0.032 });
  glass();
  ctx2.strokeStyle = "rgba(18,22,25,0.46)";
  ctx2.lineWidth = 1.8;
  ctx2.stroke();
  pencilShade(ctx2, glass, { x: -76, y: -88, w: 152, h: 176 }, {
    wash: 0.03,
    hatch: 0.016,
    cross: 6e-3,
    spacing: 10,
    texture: 0.014
  });
  drawGlassLiquid(ctx2, glass, { x: -72, y: -82, w: 144, h: 164 }, { ...state, fillLevel: state.fillLevel ?? 88 }, 3.4);
  ctx2.save();
  glass();
  ctx2.clip();
  ctx2.strokeStyle = "rgba(255,255,255,0.32)";
  ctx2.lineWidth = 1.1;
  roughLine(ctx2, -54, -72, -58, 72, 0.26, 12, 3250);
  roughLine(ctx2, 32, -78, 54, 68, 0.22, 12, 3251);
  drawHatching(ctx2, { x: -72, y: -82, w: 144, h: 164 }, -0.7, 13, 0.035, 0.65);
  ctx2.restore();
  for (const x of [-58, -26, 26, 58]) {
    drawRivet(ctx2, x, -110, 3.1);
    drawRivet(ctx2, x, 110, 3.1);
  }
  for (const y of [-62, -22, 22, 62]) {
    drawRivet(ctx2, -89, y, 2.6);
    drawRivet(ctx2, 89, y, 2.6);
  }
  drawConnectorMark(ctx2, 0, -124);
  drawConnectorMark(ctx2, 0, 124);
  drawConnectorMark(ctx2, -102, 0);
  drawConnectorMark(ctx2, 102, 0);
}
function drawGauge(ctx2, part, state) {
  setup(ctx2, part, 2.1, 0.83);
  const liveGasMeter = part.liveGasMeter === true || part.role === "backAccessory" || part.traitLayer === "backAccessory";
  const gasLevel = liveGasMeter ? gasLevelFor(state) : 0.18;
  const pressureColor = pressureColorFor(gasLevel);
  const beat = gasHeartbeatFor(state, gasLevel, 0.04);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 52, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 4, 6, 0.065);
  pencilShade(ctx2, outer, { x: -56, y: -56, w: 112, h: 112 }, { wash: 0.1, hatch: 0.055, cross: 0.02, spacing: 7 });
  ctx2.save();
  ctx2.beginPath();
  ctx2.arc(0, 0, 47, 0, Math.PI * 2);
  ctx2.fillStyle = "rgba(245,241,226,0.55)";
  ctx2.fill();
  ctx2.restore();
  ctx2.beginPath();
  ctx2.arc(0, 0, 52, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, 42, 0, Math.PI * 2);
  ctx2.stroke();
  const start = Math.PI * 1.12;
  const end = Math.PI * 1.88;
  ctx2.save();
  ctx2.lineWidth = 5.5;
  ctx2.lineCap = "round";
  const segments = [
    [start, start + (end - start) * 0.36, "#46c7d1", 0.48],
    [start + (end - start) * 0.38, start + (end - start) * 0.68, "#d8a33a", 0.48],
    [start + (end - start) * 0.7, end, "#d7372f", 0.54]
  ];
  for (const [a, b, color, alpha] of segments) {
    ctx2.strokeStyle = colorAlpha(color, alpha);
    ctx2.beginPath();
    ctx2.arc(0, 4, 34, a, b);
    ctx2.stroke();
  }
  if (liveGasMeter) {
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha(pressureColor, 0.18 + beat * 0.32 + gasLevel * 0.14);
    ctx2.lineWidth = 8 + beat * 5;
    ctx2.beginPath();
    ctx2.arc(0, 4, 28, start, start + (end - start) * gasLevel);
    ctx2.stroke();
  }
  ctx2.restore();
  for (let i = 0; i < 9; i += 1) {
    const angle = start + (end - start) * (i / 8);
    const longTick = i === 0 || i === 4 || i === 8;
    ctx2.beginPath();
    ctx2.moveTo(Math.cos(angle) * (longTick ? 29 : 33), 4 + Math.sin(angle) * (longTick ? 29 : 33));
    ctx2.lineTo(Math.cos(angle) * 42, 4 + Math.sin(angle) * 42);
    ctx2.stroke();
  }
  ctx2.save();
  ctx2.font = "bold 8px ui-monospace, Menlo, monospace";
  ctx2.textAlign = "center";
  ctx2.fillStyle = "rgba(12,16,17,0.76)";
  ctx2.fillText("LOW", -29, 30);
  ctx2.fillText("MID", 0, -25);
  ctx2.fillStyle = "rgba(180,20,16,0.82)";
  ctx2.fillText("HIGH", 30, 30);
  ctx2.restore();
  ctx2.save();
  ctx2.strokeStyle = "rgba(255,255,255,0.42)";
  ctx2.lineWidth = 1.2;
  ctx2.beginPath();
  ctx2.arc(-7, -8, 26, Math.PI * 1.1, Math.PI * 1.65);
  ctx2.stroke();
  ctx2.restore();
  const wobble = Math.sin((state.time || 0) * (1.2 + gasLevel * 3.2)) * (0.012 + gasLevel * 0.045);
  const needle = start + (end - start) * gasLevel + wobble;
  ctx2.save();
  ctx2.shadowColor = colorAlpha(pressureColor, 0.16 + beat * 0.34);
  ctx2.shadowBlur = 5 + beat * 10;
  ctx2.strokeStyle = colorAlpha(pressureColor, 0.88);
  ctx2.lineWidth = 3;
  ctx2.beginPath();
  ctx2.moveTo(Math.cos(needle + Math.PI) * 8, 4 + Math.sin(needle + Math.PI) * 8);
  ctx2.lineTo(Math.cos(needle) * 34, 4 + Math.sin(needle) * 34);
  ctx2.stroke();
  ctx2.fillStyle = "rgba(12,16,17,0.86)";
  ctx2.beginPath();
  ctx2.arc(0, 4, 5.8, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  if (liveGasMeter) {
    drawGasStatePill(ctx2, gasLevel, state, 0, 58, 0.62, { w: 76, h: 24, fontSize: 10 });
  }
  drawConnectorMark(ctx2, 0, 56);
}
function drawShoulderPackBand(ctx2, part) {
  const style = setup(ctx2, part, 2.1, 0.78);
  const band = () => {
    ctx2.beginPath();
    ctx2.moveTo(-54, -164);
    ctx2.bezierCurveTo(-84, -90, -84, 72, -56, 246);
    ctx2.bezierCurveTo(-42, 274, -10, 278, 8, 252);
    ctx2.bezierCurveTo(-22, 84, -20, -78, 10, -150);
    ctx2.bezierCurveTo(-10, -172, -38, -178, -54, -164);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, band, 5, 7, 0.045);
  band();
  ctx2.fillStyle = colorAlpha(style.fill || "#efe4cf", 0.48);
  ctx2.fill();
  pencilShade(ctx2, band, { x: -92, y: -180, w: 120, h: 466 }, {
    wash: 0.09,
    hatch: 0.045,
    cross: 0.014,
    spacing: 8,
    texture: 0.02
  });
  ctx2.lineWidth = 2.2;
  band();
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = colorAlpha(style.highlight || "#d7a13a", 0.24);
  ctx2.lineWidth = 1.8;
  roughBezier(ctx2, [[-42, -144], [-60, -34], [-58, 112], [-34, 236]], 0.32, 1612);
  ctx2.restore();
  for (const [x, y] of [[-44, -126], [-48, -28], [-42, 88], [-30, 202], [-16, 254]]) {
    drawRivet(ctx2, x, y, 2.5);
  }
}
function drawPackGasReaderPart(ctx2, part, state = {}) {
  const style = setup(ctx2, part, 1.35, 0.86);
  const level = gasLevelFor(state);
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(state, level, 0.22);
  const fillW = 56 * Math.max(0.08, Math.min(1, level));
  ctx2.save();
  ctx2.rotate(-0.015);
  drawPencilRect(ctx2, -54, -18, 108, 36, 9, {
    fill: palette.panel,
    wash: 0.045,
    hatch: 0.018,
    cross: 6e-3,
    spacing: 5,
    shadow: 0.035,
    lineWidth: 1.25
  });
  ctx2.fillStyle = palette.golden ? colorAlpha("#ffe47a", 0.92) : colorAlpha(style.highlight || "#d7a13a", 0.88);
  ctx2.font = "bold 7px ui-monospace, Menlo, Consolas, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "left";
  ctx2.textBaseline = "middle";
  ctx2.fillText("GAS", -43, -8);
  ctx2.beginPath();
  ctx2.roundRect(-42, -1, 56, 9, 4);
  ctx2.fillStyle = palette.track;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(8,11,12,0.52)";
  ctx2.lineWidth = 0.8;
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.roundRect(-42, -1, fillW, 9, 4);
  ctx2.shadowColor = palette.glow || colorAlpha(color, 0.26 + beat * 0.42 + level * 0.12);
  ctx2.shadowBlur = 8 + beat * 15;
  ctx2.fillStyle = colorAlpha(color, Math.min(1, (label === "EXT" ? 0.98 : 0.9) + beat * 0.22));
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.strokeStyle = colorAlpha(color, 0.48 + beat * 0.34);
  ctx2.lineWidth = 1.5 + beat * 1.2;
  ctx2.beginPath();
  ctx2.roundRect(-45, -4, 63, 15, 6);
  ctx2.stroke();
  ctx2.fillStyle = colorAlpha(color, 0.13 + level * 0.1 + beat * 0.18);
  ctx2.fillRect(-48, -12, 96, 24);
  ctx2.restore();
  ctx2.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.96));
  ctx2.font = "bold 9px ui-monospace, Menlo, Consolas, monospace";
  ctx2.textAlign = "center";
  ctx2.fillText(label, 33, 4);
  ctx2.shadowColor = colorAlpha(style.highlight || "#d7a13a", 0.18 + beat * 0.22);
  ctx2.shadowBlur = 3 + beat * 8;
  ctx2.fillStyle = colorAlpha(style.highlight || "#d7a13a", 0.78 + beat * 0.18);
  ctx2.beginPath();
  ctx2.arc(43, -8, 4.2 + beat * 1.1, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.strokeStyle = "rgba(8,11,12,0.62)";
  ctx2.lineWidth = 0.8;
  ctx2.stroke();
  ctx2.restore();
}
function drawShoulderPackShell(ctx2, part, state = {}) {
  const style = setup(ctx2, part, 2.2, 0.82);
  const shape = part.packShape || "classic";
  const liveGasMeter = part.liveGasMeter === true || part.role === "backAccessory" || part.traitLayer === "backAccessory";
  const gasLevel = liveGasMeter ? gasLevelFor(state) : 0;
  const gasColor = gasDisplayPaletteFor(gasLevel, state).color;
  const beat = gasHeartbeatFor(state, gasLevel, 0.44);
  ctx2.save();
  if (part.peek) {
    const bottom = Number.isFinite(part.peekClipBottom) ? part.peekClipBottom : 54;
    ctx2.beginPath();
    ctx2.rect(-104, -156, 208, bottom + 156);
    ctx2.clip();
  }
  const shell = () => {
    ctx2.beginPath();
    if (shape === "skate") {
      ctx2.moveTo(-52, -112);
      ctx2.bezierCurveTo(-84, -88, -86, 70, -48, 122);
      ctx2.bezierCurveTo(-16, 142, 52, 124, 62, 80);
      ctx2.bezierCurveTo(34, 62, 32, -50, 62, -92);
      ctx2.bezierCurveTo(26, -132, -24, -138, -52, -112);
    } else if (shape === "cassette") {
      ctx2.moveTo(-62, -118);
      ctx2.lineTo(42, -128);
      ctx2.quadraticCurveTo(66, -116, 64, -90);
      ctx2.lineTo(58, 102);
      ctx2.quadraticCurveTo(34, 132, -28, 122);
      ctx2.quadraticCurveTo(-70, 92, -72, 24);
      ctx2.lineTo(-70, -92);
      ctx2.quadraticCurveTo(-70, -108, -62, -118);
    } else if (shape === "printer") {
      ctx2.moveTo(-54, -126);
      ctx2.lineTo(50, -116);
      ctx2.quadraticCurveTo(72, -98, 62, -66);
      ctx2.lineTo(62, 70);
      ctx2.quadraticCurveTo(44, 108, 8, 126);
      ctx2.lineTo(-44, 118);
      ctx2.quadraticCurveTo(-76, 86, -70, 20);
      ctx2.lineTo(-70, -94);
      ctx2.quadraticCurveTo(-68, -116, -54, -126);
    } else if (shape === "arcade") {
      ctx2.moveTo(-60, -128);
      ctx2.lineTo(28, -128);
      ctx2.quadraticCurveTo(60, -116, 66, -82);
      ctx2.lineTo(54, 114);
      ctx2.quadraticCurveTo(18, 140, -38, 116);
      ctx2.lineTo(-74, 28);
      ctx2.lineTo(-68, -96);
      ctx2.quadraticCurveTo(-68, -116, -60, -128);
    } else if (shape === "battery") {
      ctx2.moveTo(-44, -138);
      ctx2.lineTo(44, -130);
      ctx2.quadraticCurveTo(64, -102, 58, -66);
      ctx2.lineTo(58, 94);
      ctx2.quadraticCurveTo(38, 134, -8, 138);
      ctx2.quadraticCurveTo(-54, 130, -68, 88);
      ctx2.lineTo(-68, -86);
      ctx2.quadraticCurveTo(-66, -122, -44, -138);
    } else if (shape === "tank") {
      ctx2.moveTo(-38, -136);
      ctx2.bezierCurveTo(-76, -118, -82, -58, -70, 16);
      ctx2.bezierCurveTo(-64, 86, -36, 134, 6, 136);
      ctx2.bezierCurveTo(52, 128, 68, 78, 62, 12);
      ctx2.bezierCurveTo(54, -66, 42, -124, -2, -140);
      ctx2.bezierCurveTo(-14, -144, -28, -142, -38, -136);
    } else if (shape === "canister") {
      ctx2.moveTo(-30, -138);
      ctx2.bezierCurveTo(-70, -120, -74, -68, -62, 12);
      ctx2.lineTo(-52, 96);
      ctx2.quadraticCurveTo(-26, 140, 24, 132);
      ctx2.quadraticCurveTo(62, 96, 58, 20);
      ctx2.lineTo(46, -94);
      ctx2.quadraticCurveTo(28, -140, -30, -138);
    } else if (shape === "spine") {
      ctx2.moveTo(-28, -142);
      ctx2.bezierCurveTo(-66, -112, -72, -34, -58, 44);
      ctx2.bezierCurveTo(-50, 102, -18, 136, 24, 126);
      ctx2.bezierCurveTo(56, 90, 60, 18, 46, -58);
      ctx2.bezierCurveTo(38, -116, 14, -144, -28, -142);
    } else if (shape === "fan" || shape === "gauge") {
      ctx2.moveTo(-48, -128);
      ctx2.bezierCurveTo(-88, -94, -84, 54, -48, 112);
      ctx2.bezierCurveTo(-16, 140, 52, 118, 64, 72);
      ctx2.bezierCurveTo(72, 12, 58, -74, 30, -118);
      ctx2.bezierCurveTo(4, -136, -26, -142, -48, -128);
    } else if (shape === "engine") {
      ctx2.moveTo(-52, -120);
      ctx2.bezierCurveTo(-86, -96, -82, 38, -54, 104);
      ctx2.lineTo(18, 134);
      ctx2.quadraticCurveTo(58, 112, 68, 62);
      ctx2.lineTo(52, -84);
      ctx2.quadraticCurveTo(18, -136, -52, -120);
    } else if (shape === "furnace") {
      ctx2.moveTo(-44, -130);
      ctx2.bezierCurveTo(-86, -94, -82, 54, -48, 112);
      ctx2.quadraticCurveTo(-4, 142, 46, 108);
      ctx2.quadraticCurveTo(74, 48, 54, -80);
      ctx2.quadraticCurveTo(20, -142, -44, -130);
    } else if (shape === "fire") {
      ctx2.moveTo(-28, -142);
      ctx2.bezierCurveTo(-68, -128, -76, -64, -62, 30);
      ctx2.lineTo(-50, 112);
      ctx2.quadraticCurveTo(-14, 142, 34, 118);
      ctx2.quadraticCurveTo(60, 58, 50, -70);
      ctx2.quadraticCurveTo(26, -136, -28, -142);
    } else if (shape === "diving") {
      ctx2.moveTo(-46, -136);
      ctx2.bezierCurveTo(-86, -118, -86, -42, -66, 80);
      ctx2.quadraticCurveTo(-42, 132, 12, 136);
      ctx2.quadraticCurveTo(62, 114, 60, 52);
      ctx2.bezierCurveTo(54, -28, 38, -124, -8, -140);
      ctx2.quadraticCurveTo(-26, -146, -46, -136);
    } else if (shape === "ledger") {
      ctx2.moveTo(-62, -104);
      ctx2.lineTo(34, -126);
      ctx2.quadraticCurveTo(68, -114, 70, -76);
      ctx2.lineTo(54, 96);
      ctx2.quadraticCurveTo(20, 130, -34, 116);
      ctx2.lineTo(-72, 42);
      ctx2.lineTo(-70, -78);
      ctx2.quadraticCurveTo(-70, -96, -62, -104);
    } else if (shape === "mailbox") {
      ctx2.moveTo(-64, -44);
      ctx2.bezierCurveTo(-56, -126, 44, -136, 66, -52);
      ctx2.lineTo(62, 90);
      ctx2.quadraticCurveTo(26, 128, -38, 114);
      ctx2.quadraticCurveTo(-70, 78, -72, 18);
      ctx2.closePath();
    } else if (shape === "floppy") {
      ctx2.moveTo(-66, -122);
      ctx2.lineTo(56, -120);
      ctx2.quadraticCurveTo(72, -104, 68, -78);
      ctx2.lineTo(60, 112);
      ctx2.quadraticCurveTo(18, 136, -40, 114);
      ctx2.quadraticCurveTo(-76, 70, -72, -82);
      ctx2.quadraticCurveTo(-72, -108, -66, -122);
    } else if (shape === "barrier") {
      ctx2.moveTo(-72, -92);
      ctx2.lineTo(68, -110);
      ctx2.quadraticCurveTo(76, -86, 64, -58);
      ctx2.lineTo(56, 84);
      ctx2.quadraticCurveTo(20, 128, -44, 108);
      ctx2.quadraticCurveTo(-80, 62, -74, -70);
      ctx2.closePath();
    } else if (shape === "traffic") {
      ctx2.moveTo(-38, -140);
      ctx2.quadraticCurveTo(48, -132, 60, -72);
      ctx2.lineTo(58, 102);
      ctx2.quadraticCurveTo(18, 136, -36, 120);
      ctx2.quadraticCurveTo(-72, 76, -66, -72);
      ctx2.quadraticCurveTo(-62, -118, -38, -140);
    } else if (shape === "whale") {
      ctx2.moveTo(-70, -72);
      ctx2.bezierCurveTo(-44, -132, 42, -124, 72, -54);
      ctx2.lineTo(56, 86);
      ctx2.quadraticCurveTo(12, 136, -48, 106);
      ctx2.bezierCurveTo(-78, 54, -88, -14, -70, -72);
    } else {
      ctx2.moveTo(-48, -126);
      ctx2.bezierCurveTo(-82, -96, -84, 44, -50, 112);
      ctx2.bezierCurveTo(-20, 134, 42, 124, 58, 92);
      ctx2.bezierCurveTo(42, 48, 42, -64, 56, -102);
      ctx2.bezierCurveTo(28, -128, -18, -140, -48, -126);
    }
    ctx2.closePath();
  };
  const sideRail = () => {
    ctx2.beginPath();
    ctx2.moveTo(-56, -112);
    ctx2.bezierCurveTo(-78, -74, -76, 44, -48, 100);
    ctx2.bezierCurveTo(-38, 112, -22, 114, -12, 106);
    ctx2.bezierCurveTo(-38, 52, -38, -70, -18, -112);
    ctx2.bezierCurveTo(-28, -122, -44, -122, -56, -112);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, shell, 4, 5, 0.035);
  shell();
  ctx2.fillStyle = colorAlpha(style.fill || "#efe4cf", 0.72);
  ctx2.fill();
  pencilShade(ctx2, shell, { x: -88, y: -142, w: 160, h: 278 }, {
    wash: 0.12,
    hatch: 0.055,
    cross: 0.018,
    spacing: 7,
    texture: 0.035
  });
  if (liveGasMeter) {
    ctx2.save();
    shell();
    ctx2.clip();
    ctx2.globalCompositeOperation = "lighter";
    const glow = ctx2.createRadialGradient(12, -18, 10, 12, -18, 142);
    glow.addColorStop(0, colorAlpha(gasColor, 0.04 + gasLevel * 0.14 + beat * 0.18));
    glow.addColorStop(0.54, colorAlpha(gasColor, gasLevel >= 0.68 ? 0.08 + beat * 0.1 : 0.035 + beat * 0.04));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = glow;
    ctx2.fillRect(-100, -150, 210, 300);
    if (gasLevel >= 0.68) {
      ctx2.strokeStyle = colorAlpha(gasColor, 0.26 + beat * 0.22);
      ctx2.lineWidth = 3.6 + beat * 2;
      roughBezier(ctx2, [[-50, -82], [-16, -104], [34, -66], [44, -18]], 0.36, 1440);
      roughBezier(ctx2, [[-42, 36], [-6, 10], [38, 32], [48, 82]], 0.34, 1441);
    }
    ctx2.restore();
  }
  ctx2.save();
  sideRail();
  ctx2.fillStyle = "rgba(12,16,17,0.5)";
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.58)";
  ctx2.lineWidth = 1.8;
  ctx2.stroke();
  ctx2.restore();
  ctx2.save();
  ctx2.strokeStyle = colorAlpha(style.highlight || "#d7a13a", 0.55);
  ctx2.lineWidth = 3.4;
  roughBezier(ctx2, [[-42, -104], [-58, -54], [-56, 42], [-30, 98]], 0.55, 1410);
  roughBezier(ctx2, [[42, -88], [32, -42], [34, 46], [45, 86]], 0.45, 1411);
  ctx2.strokeStyle = "rgba(255,255,255,0.26)";
  ctx2.lineWidth = 1.2;
  roughBezier(ctx2, [[-28, -104], [-46, -48], [-44, 38], [-22, 92]], 0.45, 1412);
  ctx2.restore();
  drawPencilRect(ctx2, -48, -116, 72, 22, 7, {
    fill: colorAlpha(style.highlight || "#d7a13a", 0.18),
    wash: 0.08,
    hatch: 0.04,
    cross: 0.012,
    spacing: 6,
    shadow: 0.025,
    lineWidth: 1.2
  });
  for (const [x, y] of [[-30, -96], [24, -82], [-38, 66], [28, 72], [-18, 112]]) {
    drawRivet(ctx2, x, y, 3.2);
  }
  ctx2.restore();
}
function counterPalette(part, state = {}, type = "block") {
  const digitKey = type === "sale" ? "saleDigitColor" : "blockDigitColor";
  const accentKey = type === "sale" ? "saleCounterAccent" : "blockCounterAccent";
  const goldenEdition = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const rawDigit = goldenEdition ? state[digitKey] || state.counterColor || "#fff0a6" : part.counterColor || state[digitKey] || state.counterColor || state.liquidAccent || "#66f5dd";
  const rawAccent = goldenEdition ? state[accentKey] || state.counterAccent || "#f0b233" : part.counterAccent || state[accentKey] || state.counterAccent || "#d7a13a";
  return {
    digit: /^#[0-9a-f]{6}$/i.test(String(rawDigit)) ? rawDigit : rawDigit || "#66f5dd",
    accent: /^#[0-9a-f]{6}$/i.test(String(rawAccent)) ? rawAccent : rawAccent || "#d7a13a",
    cream: goldenEdition ? "#fff5bd" : "#f5f5f1",
    paper: goldenEdition ? "#f0d98a" : "#efe6d2",
    dark: goldenEdition ? "#100a03" : "#090d0e",
    red: goldenEdition ? "#9c5a18" : "#d84a3a",
    orange: goldenEdition ? "#ffc44d" : "#ff9d37",
    goldenEdition
  };
}
function drawBlockCounter(ctx2, part, state) {
  setup(ctx2, part, 1.7, 0.92);
  const palette = counterPalette(part, state, "block");
  if (part.counterLabel) {
    const label = String(part.counterLabel).slice(0, 5).toUpperCase();
    const w = 132;
    const h = 64;
    const frame2 = () => {
      ctx2.beginPath();
      ctx2.roundRect(-w / 2, -h / 2, w, h, 8);
    };
    drawCastShadow(ctx2, frame2, 3, 4, 0.05);
    frame2();
    ctx2.fillStyle = "rgba(9,13,14,0.86)";
    ctx2.fill();
    ctx2.strokeStyle = colorAlpha(palette.accent, 0.66);
    ctx2.lineWidth = 1.7;
    ctx2.stroke();
    drawPencilRect(ctx2, -w / 2 + 12, -h / 2 + 13, w - 24, h - 25, 6, {
      fill: "rgba(9,35,35,0.76)",
      wash: 0.035,
      hatch: 0.016,
      spacing: 5,
      shadow: 0.015,
      lineWidth: 1.1
    });
    if (part.tickerScroll) {
      const time = state.previewMotion === false ? 0 : state.time || 0;
      ctx2.save();
      ctx2.beginPath();
      ctx2.rect(-w / 2 + 12, -h / 2 + 13, w - 24, h - 25);
      ctx2.clip();
      ctx2.font = "bold 19px ui-monospace, Menlo, Consolas, monospace";
      ctx2.textAlign = "left";
      ctx2.textBaseline = "middle";
      const symW = ctx2.measureText(label).width;
      const arrow = 8;
      const tile = symW + arrow * 2 + 26;
      const scroll = (time * 26 % tile + tile) % tile;
      for (let x = -w / 2 - tile + scroll; x < w / 2 + tile; x += tile) {
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.shadowColor = colorAlpha(palette.digit, 0.6);
        ctx2.shadowBlur = 6;
        ctx2.fillStyle = colorAlpha(palette.digit, 0.95);
        ctx2.fillText(label, x, 1);
        ctx2.restore();
        const ax = x + symW + 9;
        ctx2.save();
        ctx2.fillStyle = "#5dffa0";
        ctx2.shadowColor = "#5dffa0";
        ctx2.shadowBlur = 5;
        ctx2.beginPath();
        ctx2.moveTo(ax, -arrow);
        ctx2.lineTo(ax + arrow * 0.9, arrow * 0.75);
        ctx2.lineTo(ax - arrow * 0.9, arrow * 0.75);
        ctx2.closePath();
        ctx2.fill();
        ctx2.restore();
      }
      ctx2.restore();
    } else {
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      ctx2.shadowColor = colorAlpha(palette.digit, 0.62);
      ctx2.shadowBlur = 7;
      ctx2.fillStyle = colorAlpha(palette.digit, 0.94);
      ctx2.font = "bold 22px ui-monospace, Menlo, Consolas, monospace";
      ctx2.letterSpacing = "0px";
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      ctx2.fillText(label, 0, 0);
      ctx2.restore();
    }
    ctx2.fillStyle = colorAlpha(palette.accent, 0.76);
    ctx2.font = "bold 6px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(part.tickerScroll ? "LIVE" : "VAULT", 0, h / 2 - 8);
    for (const [x, y2] of [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8], [-w / 2 + 8, h / 2 - 8], [w / 2 - 8, h / 2 - 8]]) {
      drawRivet(ctx2, x, y2, 2.5);
    }
    return;
  }
  const styleName = part.counterStyle || "flipBlack";
  const liveBlock = Number(state.blockNumber ?? 0);
  const tokenSeed = Number(state.tokenId ?? state.tokenID ?? state.id ?? part.id ?? 1);
  const seededOffset = Number.isFinite(tokenSeed) ? Math.floor(Math.abs(tokenSeed) * 137 % 9e5) : 137;
  const fallback = 25e6 + seededOffset + Math.floor((state.time || 0) * 0.45);
  const block = Number.isFinite(liveBlock) && liveBlock > 0 ? Math.floor(liveBlock) : fallback;
  const formatCompact = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`;
    if (value >= 1e3) return `${Math.floor(value / 1e3)}K`;
    return String(value);
  };
  const specs = {
    flipBlack: { shell: "rgba(12,16,17,0.84)", tile: "rgba(11,13,14,0.92)", text: palette.digit, label: "BLOCK", prefix: "#", split: true, radius: 7 },
    whiteOdometer: { shell: "rgba(214,218,214,0.86)", tile: "rgba(242,240,232,0.94)", text: "#111416", label: "BLOCK", prefix: "#", roller: true, radius: 11 },
    blackOdometer: { shell: "rgba(5,6,7,0.9)", tile: "rgba(10,10,12,0.96)", text: palette.cream, label: "BLOCK", prefix: "#", roller: true, radius: 11 },
    redCapsule: { shell: "rgba(174,47,38,0.88)", tile: "rgba(245,239,224,0.94)", text: "#182021", label: "BLOCK", prefix: "#", capsule: true, radius: 18 },
    orangeClicker: { shell: "rgba(224,105,36,0.9)", tile: "rgba(25,44,34,0.9)", text: palette.digit, label: "CLICK", prefix: "", knob: true, radius: 10 },
    lcdGreen: { shell: "rgba(13,18,17,0.92)", tile: "rgba(11,54,35,0.86)", text: "#95ff29", label: "CHAIN", prefix: "#", lcd: true, radius: 6 },
    brassGearbox: { shell: "rgba(101,67,22,0.9)", tile: "rgba(20,18,15,0.92)", text: palette.digit, label: "BLOCK", prefix: "#", gear: true, radius: 5 },
    glassTube: { shell: "rgba(190,230,228,0.32)", tile: "rgba(10,32,34,0.76)", text: palette.digit, label: "BLOCK", prefix: "#", tube: true, radius: 18 },
    paperTicker: { shell: "rgba(239,230,210,0.92)", tile: "rgba(255,248,223,0.96)", text: "#161918", label: "TICKER", prefix: "#", paper: true, radius: 4 },
    verticalDrums: { shell: "rgba(20,24,24,0.84)", tile: "rgba(31,35,34,0.94)", text: palette.digit, label: "DRUM", prefix: "", drum: true, radius: 9 }
  };
  const spec = specs[styleName] || specs.flipBlack;
  const digits = String(block % 1e6).padStart(6, "0");
  const compact = formatCompact(block);
  const tileW = spec.drum ? 17 : spec.roller ? 19 : 20;
  const tileH = spec.drum ? 39 : 31;
  const gap = spec.roller ? 3.4 : 2.6;
  const totalW = 22 + digits.length * tileW + (digits.length - 1) * gap + 9;
  const startX = -totalW / 2;
  const y = -tileH / 2 + 6;
  const frameX = startX - 9;
  const frameY = y - 19;
  const frameW = totalW + 18;
  const frameH = tileH + 28;
  const frame = () => {
    ctx2.beginPath();
    ctx2.roundRect(frameX, frameY, frameW, frameH, spec.radius);
  };
  drawCastShadow(ctx2, frame, 3, 4, 0.05);
  frame();
  ctx2.fillStyle = spec.shell;
  ctx2.fill();
  ctx2.strokeStyle = colorAlpha(palette.accent, 0.64);
  ctx2.lineWidth = spec.gear ? 2.1 : 1.6;
  ctx2.stroke();
  if (spec.tube) {
    ctx2.save();
    const tube = ctx2.createLinearGradient(frameX, frameY, frameX, frameY + frameH);
    tube.addColorStop(0, "rgba(255,255,255,0.34)");
    tube.addColorStop(0.45, "rgba(255,255,255,0.03)");
    tube.addColorStop(1, colorAlpha(palette.digit, 0.18));
    ctx2.fillStyle = tube;
    frame();
    ctx2.fill();
    ctx2.restore();
  }
  if (spec.paper) {
    ctx2.save();
    ctx2.fillStyle = "rgba(18,22,25,0.24)";
    for (let px = frameX + 10; px < frameX + frameW - 6; px += 12) {
      ctx2.beginPath();
      ctx2.arc(px, frameY + 6, 1.5, 0, Math.PI * 2);
      ctx2.arc(px, frameY + frameH - 6, 1.5, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
  if (spec.gear) {
    ctx2.save();
    ctx2.fillStyle = colorAlpha(palette.accent, 0.68);
    for (let i = 0; i < 11; i += 1) {
      const gx = frameX + 8 + i * ((frameW - 16) / 10);
      ctx2.fillRect(gx - 2, frameY - 4, 4, 6);
      ctx2.fillRect(gx - 2, frameY + frameH - 2, 4, 6);
    }
    ctx2.restore();
  }
  if (spec.knob || spec.capsule) {
    ctx2.save();
    ctx2.fillStyle = spec.capsule ? "rgba(235,230,218,0.86)" : colorAlpha(palette.accent, 0.82);
    ctx2.beginPath();
    ctx2.roundRect(frameX + frameW + 2, frameY + frameH * 0.28, 13, frameH * 0.44, 5);
    ctx2.fill();
    ctx2.strokeStyle = "rgba(18,22,25,0.46)";
    ctx2.stroke();
    ctx2.restore();
  }
  ctx2.save();
  ctx2.font = "bold 10px ui-monospace, Menlo, Consolas, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "left";
  ctx2.textBaseline = "middle";
  ctx2.fillStyle = spec.paper ? "rgba(18,22,25,0.72)" : colorAlpha(palette.accent, 0.84);
  ctx2.fillText(spec.label, startX + 10, y - 9);
  ctx2.textAlign = "right";
  ctx2.fillStyle = spec.paper ? "rgba(18,22,25,0.66)" : "rgba(245,245,241,0.82)";
  ctx2.fillText(`#${compact}`, startX + totalW - 7, y - 9);
  ctx2.restore();
  ctx2.save();
  ctx2.font = "bold 20px ui-monospace, Menlo, Consolas, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillStyle = spec.text;
  ctx2.fillText(spec.prefix, startX + 10, y + tileH / 2);
  ctx2.restore();
  for (let i = 0; i < digits.length; i += 1) {
    const x = startX + 24 + i * (tileW + gap);
    const card = () => {
      ctx2.beginPath();
      ctx2.roundRect(x, y, tileW, tileH, spec.roller || spec.drum ? 8 : 4);
    };
    card();
    ctx2.fillStyle = spec.tile;
    ctx2.fill();
    if (spec.roller || spec.drum) {
      const wheel = ctx2.createLinearGradient(x, y, x + tileW, y);
      wheel.addColorStop(0, "rgba(0,0,0,0.24)");
      wheel.addColorStop(0.48, "rgba(255,255,255,0.14)");
      wheel.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx2.fillStyle = wheel;
      card();
      ctx2.fill();
    }
    ctx2.save();
    ctx2.strokeStyle = spec.split ? "rgba(255,255,255,0.18)" : colorAlpha(palette.accent, 0.2);
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(x + 2, y + tileH / 2);
    ctx2.lineTo(x + tileW - 2, y + tileH / 2);
    ctx2.stroke();
    if (spec.drum) {
      ctx2.fillStyle = colorAlpha(spec.text, 0.32);
      ctx2.font = "bold 13px ui-monospace, Menlo, Consolas, monospace";
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      ctx2.fillText(String((Number(digits[i]) + 9) % 10), x + tileW / 2, y + 7);
      ctx2.fillText(String((Number(digits[i]) + 1) % 10), x + tileW / 2, y + tileH - 5);
    }
    ctx2.globalCompositeOperation = spec.lcd || palette.goldenEdition ? "lighter" : "source-over";
    ctx2.shadowColor = spec.lcd || palette.goldenEdition ? colorAlpha(spec.text, palette.goldenEdition ? 0.58 : 0.72) : "transparent";
    ctx2.shadowBlur = spec.lcd ? 5 : palette.goldenEdition ? 4 : 0;
    ctx2.fillStyle = spec.text;
    ctx2.font = `bold ${spec.drum ? 19 : 20}px ui-monospace, Menlo, Consolas, monospace`;
    ctx2.letterSpacing = "0px";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    const tx = x + tileW / 2;
    const ty = y + tileH / 2 + 1;
    ctx2.lineWidth = palette.goldenEdition ? 1.15 : 0.75;
    ctx2.strokeStyle = colorAlpha(spec.text, palette.goldenEdition ? 0.44 : 0.32);
    ctx2.strokeText(digits[i], tx, ty);
    ctx2.fillText(digits[i], tx, ty);
    ctx2.globalAlpha *= 0.54;
    ctx2.fillText(digits[i], tx + 0.45, ty);
    ctx2.restore();
  }
}
function drawTransferScarLedger(ctx2, part, state) {
  setup(ctx2, part, 1.55, 0.94);
  const rawCount = Number(state.transferCount ?? state.transfers ?? 0);
  const transferCount = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
  const formatCompact = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}K`;
    return String(value);
  };
  const plateW = 222;
  const plateH = 92;
  const x = -plateW / 2;
  const y = -plateH / 2;
  const age = Math.min(1, transferCount / 120);
  const pulse = Math.max(0, Math.min(1, Number(state.heartbeatPulse || 0)));
  const pressure = gasLevelFor(state);
  const heat = pressure > 0.68 ? pressure : 0;
  const scarInk = heat > 0.68 ? "rgba(198,42,34,0.88)" : "rgba(20,24,23,0.78)";
  const gold = "rgba(215,161,58,0.86)";
  const darkGold = "rgba(121,78,22,0.76)";
  const plate = () => {
    ctx2.beginPath();
    ctx2.roundRect(x, y, plateW, plateH, 9);
  };
  drawCastShadow(ctx2, plate, 3, 4, 0.045);
  plate();
  ctx2.fillStyle = `rgba(30,39,38,${0.58 + age * 0.12})`;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(12,16,17,0.62)";
  ctx2.lineWidth = 1.8;
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = "rgba(255,255,255,0.16)";
  ctx2.lineWidth = 1;
  roughLine(ctx2, x + 12, y + 20, x + plateW - 12, y + 14, 0.5, 12, 2311);
  roughLine(ctx2, x + 15, y + plateH - 16, x + plateW - 18, y + plateH - 20, 0.45, 12, 2312);
  ctx2.stroke();
  ctx2.restore();
  pencilShade(ctx2, plate, { x, y, w: plateW, h: plateH }, {
    wash: 0.08 + age * 0.04,
    hatch: 0.045,
    cross: 0.014 + age * 0.01,
    spacing: 7,
    texture: 0.035
  });
  ctx2.save();
  ctx2.font = "bold 10px ui-monospace, Menlo, Consolas, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textBaseline = "middle";
  ctx2.fillStyle = "rgba(245,245,241,0.74)";
  ctx2.textAlign = "left";
  ctx2.fillText("TRANSFER SCARS", x + 13, y + 15);
  ctx2.textAlign = "right";
  ctx2.fillStyle = transferCount ? gold : "rgba(245,245,241,0.56)";
  ctx2.fillText(transferCount ? `#${formatCompact(transferCount)}` : "CLEAN", x + plateW - 13, y + 15);
  ctx2.restore();
  for (const [rx, ry, rr] of [[x + 10, y + 10, 3], [x + plateW - 10, y + 10, 3], [x + 10, y + plateH - 10, 3], [x + plateW - 10, y + plateH - 10, 3]]) {
    drawRivet(ctx2, rx, ry, rr);
  }
  const drawTallyBundle = (cx, cy, scale = 1, strong = false, seed = 1) => {
    ctx2.save();
    ctx2.lineCap = "round";
    ctx2.strokeStyle = strong ? scarInk : "rgba(16,20,19,0.76)";
    ctx2.lineWidth = strong ? 2.8 * scale : 2.1 * scale;
    for (let i = 0; i < 4; i += 1) {
      const ox = (i - 1.5) * 8 * scale;
      roughLine(ctx2, cx + ox - 4 * scale, cy + 17 * scale, cx + ox + 5 * scale, cy - 17 * scale, 0.55 * scale, 6, seed + i);
    }
    ctx2.strokeStyle = strong ? colorAlpha("#d7a13a", 0.92) : "rgba(215,161,58,0.78)";
    ctx2.lineWidth = strong ? 2.5 * scale : 1.8 * scale;
    roughLine(ctx2, cx - 21 * scale, cy + 10 * scale, cx + 22 * scale, cy - 12 * scale, 0.5 * scale, 7, seed + 9);
    ctx2.restore();
  };
  const drawBurnBundle = (cx, cy, seed = 1) => {
    ctx2.save();
    ctx2.fillStyle = heat ? colorAlpha("#d72d2a", 0.18 + heat * 0.1) : "rgba(82,43,24,0.18)";
    ctx2.beginPath();
    ctx2.ellipse(cx, cy, 26, 16, -0.13, 0, Math.PI * 2);
    ctx2.fill();
    drawTallyBundle(cx, cy, 0.82, true, seed);
    ctx2.restore();
  };
  const drawSeal = (cx, cy, label, seed = 1) => {
    ctx2.save();
    ctx2.translate(cx, cy);
    ctx2.fillStyle = "rgba(10,13,13,0.76)";
    ctx2.strokeStyle = gold;
    ctx2.lineWidth = 1.6;
    ctx2.beginPath();
    ctx2.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
    ctx2.strokeStyle = pulse ? colorAlpha("#66f5dd", 0.48 + pulse * 0.24) : darkGold;
    ctx2.lineWidth = 1.2;
    roughLine(ctx2, -6, -5, 6, 5, 0.28, 4, seed);
    roughLine(ctx2, -6, 5, 6, -5, 0.28, 4, seed + 1);
    ctx2.fillStyle = "rgba(245,245,241,0.78)";
    ctx2.font = "bold 7px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(label, 0, 0.5);
    ctx2.restore();
  };
  const drawStamp = (label) => {
    ctx2.save();
    const sx = x + 12;
    const sy = y + 28;
    ctx2.fillStyle = "rgba(8,10,10,0.8)";
    ctx2.strokeStyle = gold;
    ctx2.lineWidth = 1.3;
    ctx2.beginPath();
    ctx2.roundRect(sx, sy, 42, 20, 4);
    ctx2.fill();
    ctx2.stroke();
    ctx2.fillStyle = "rgba(245,245,241,0.86)";
    ctx2.font = "bold 12px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(label, sx + 21, sy + 10.5);
    ctx2.restore();
  };
  if (!transferCount) {
    ctx2.save();
    ctx2.strokeStyle = "rgba(245,245,241,0.2)";
    ctx2.lineWidth = 1.2;
    roughLine(ctx2, x + 24, y + 56, x + plateW - 24, y + 50, 0.65, 12, 2460);
    ctx2.fillStyle = "rgba(245,245,241,0.44)";
    ctx2.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText("NO MARKS", 0, y + 61);
    ctx2.restore();
    return;
  }
  if (transferCount >= 1e3) {
    drawStamp(formatCompact(transferCount));
  }
  let remainder = transferCount % 1e3;
  const hundreds = Math.min(5, Math.floor(remainder / 100));
  remainder %= 100;
  const twentyFives = Math.min(4, Math.floor(remainder / 25));
  remainder %= 25;
  const fives = Math.min(4, Math.floor(remainder / 5));
  const ones = Math.min(4, remainder % 5);
  for (let i = 0; i < hundreds; i += 1) {
    drawSeal(x + 74 + i * 27, y + 39, "100", 2500 + i);
  }
  for (let i = 0; i < twentyFives; i += 1) {
    drawBurnBundle(x + 73 + i * 36, y + 64, 2600 + i);
  }
  for (let i = 0; i < fives; i += 1) {
    drawTallyBundle(x + 70 + i * 34, y + 68, 0.62, false, 2700 + i);
  }
  ctx2.save();
  ctx2.strokeStyle = scarInk;
  ctx2.lineWidth = 2;
  ctx2.lineCap = "round";
  const singleStart = x + plateW - 30 - ones * 8;
  for (let i = 0; i < ones; i += 1) {
    roughLine(ctx2, singleStart + i * 11, y + 79, singleStart + i * 11 + 7, y + 50, 0.42, 5, 2800 + i);
  }
  ctx2.restore();
}
function historyNumberFromState(state = {}, keys = []) {
  for (const key of keys) {
    const value = Number(state[key]);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 0;
}
function saleCountForState(state = {}) {
  const explicit = historyNumberFromState(state, [
    "saleCount",
    "sellCount",
    "sales",
    "saleTransfers",
    "soldTransfers",
    "verifiedSaleCount"
  ]);
  if (explicit) return explicit;
  const tier = String(state.saleTier || state.sale || "").toLowerCase();
  if (tier.includes("mythic") || tier.includes("legendary") || tier.includes("royal") || tier.includes("gold") || tier.includes("silver")) return 1;
  return 0;
}
function transferCountForState(state = {}) {
  return historyNumberFromState(state, ["transferCount", "transfers"]);
}
function saleScreenPaletteForState(state = {}) {
  const raw = String(state.scarScreenColor || state.scarColor || "").trim().toLowerCase();
  const presets = {
    teal: { glass: "#123a35", accent: "#66f5dd", frame: "#d7a13a" },
    cyan: { glass: "#0d3740", accent: "#55e7ff", frame: "#d7a13a" },
    gold: { glass: "#3a3110", accent: "#ffd94d", frame: "#d7a13a" },
    red: { glass: "#3a1714", accent: "#ff5a4d", frame: "#c06738" },
    violet: { glass: "#221941", accent: "#c899ff", frame: "#d7a13a" }
  };
  if (/^#[0-9a-f]{6}$/i.test(raw)) return { glass: raw, accent: raw, frame: "#d7a13a" };
  return presets[raw] || presets.teal;
}
function drawSalePixelGlyph(ctx2, pattern, x, y, pixel, color) {
  ctx2.save();
  ctx2.fillStyle = color;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== "1") continue;
      ctx2.beginPath();
      ctx2.roundRect(x + col * pixel, y + row * pixel, pixel * 0.82, pixel * 0.82, pixel * 0.18);
      ctx2.fill();
    }
  }
  ctx2.restore();
}
function drawSalePixelNumber(ctx2, count, x, y, pixel, color) {
  const digits = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "+": ["000", "010", "111", "010", "000"]
  };
  const label = count > 99 ? "99+" : String(Math.max(0, count)).padStart(count < 10 ? 2 : 0, "0");
  const glyphW = 3 * pixel;
  const gap = pixel * 0.85;
  let cx = x - (label.length * glyphW + (label.length - 1) * gap) / 2;
  for (const char of label) {
    drawSalePixelGlyph(ctx2, digits[char] || digits["0"], cx, y, pixel, color);
    cx += glyphW + gap;
  }
}
function drawSaleScarScreenPart(ctx2, part, state = {}) {
  setup(ctx2, part, 1.35, 0.94);
  const sales = saleCountForState(state);
  const basePalette = saleScreenPaletteForState(state);
  const customPalette = counterPalette(part, state, "sale");
  const palette = {
    glass: basePalette.glass,
    frame: part.counterAccent || basePalette.frame,
    accent: part.counterColor || basePalette.accent || customPalette.digit
  };
  const styleName = part.counterStyle || "pixelPocket";
  const pulse = Math.max(0, Math.min(1, Number(state.heartbeatPulse || 0)));
  const heat = Math.min(1, sales / 12);
  const styles = {
    pixelPocket: { w: 64, h: 48, fill: "rgba(226,216,190,0.78)", screen: "dark", label: "SALE", dot: true, radius: 9 },
    redRoller: { w: 72, h: 42, fill: "rgba(198,61,45,0.9)", screen: "roller", label: "SOLD", knob: true, radius: 17 },
    blackFlip: { w: 70, h: 44, fill: "rgba(7,9,10,0.92)", screen: "flip", label: "SALE", radius: 7 },
    ticketStub: { w: 74, h: 44, fill: "rgba(239,230,210,0.9)", screen: "paper", label: "SALE", holes: true, radius: 5 },
    vaultSeal: { w: 62, h: 58, fill: "rgba(20,23,22,0.88)", screen: "seal", label: "SEAL", gear: true, radius: 11 },
    glassTube: { w: 76, h: 38, fill: "rgba(170,220,218,0.34)", screen: "tube", label: "SALE", radius: 17 },
    stampTag: { w: 66, h: 54, fill: "rgba(228,206,168,0.86)", screen: "stamp", label: "SOLD", tag: true, radius: 6 },
    punchCard: { w: 74, h: 48, fill: "rgba(231,221,190,0.9)", screen: "punch", label: "SALE", holes: true, radius: 4 },
    dialBadge: { w: 58, h: 58, fill: "rgba(17,21,21,0.88)", screen: "dial", label: "ETH", radius: 29 },
    ledgerStrip: { w: 78, h: 36, fill: "rgba(8,12,13,0.9)", screen: "ledger", label: "SALE", radius: 6 }
  };
  const style = styles[styleName] || styles.pixelPocket;
  const plateW = style.w;
  const plateH = style.h;
  const x = -plateW / 2;
  const y = -plateH / 2;
  const plate = () => {
    ctx2.beginPath();
    ctx2.roundRect(x, y, plateW, plateH, style.radius);
  };
  drawCastShadow(ctx2, plate, 3, 4, 0.055);
  plate();
  ctx2.fillStyle = style.fill;
  ctx2.fill();
  ctx2.strokeStyle = style.screen === "paper" || style.screen === "punch" ? "rgba(18,22,21,0.58)" : colorAlpha(palette.frame, 0.72);
  ctx2.lineWidth = 1.5;
  ctx2.stroke();
  if (style.knob) {
    ctx2.save();
    ctx2.fillStyle = "rgba(235,230,218,0.86)";
    ctx2.beginPath();
    ctx2.roundRect(x + plateW - 3, y + 8, 12, plateH - 16, 5);
    ctx2.fill();
    ctx2.strokeStyle = "rgba(18,22,25,0.42)";
    ctx2.stroke();
    ctx2.restore();
  }
  if (style.gear) {
    ctx2.save();
    ctx2.translate(0, 0);
    ctx2.strokeStyle = colorAlpha(palette.frame, 0.72);
    ctx2.lineWidth = 1.2;
    for (let i = 0; i < 18; i += 1) {
      const a = i / 18 * Math.PI * 2;
      const r1 = 23;
      const r2 = 28;
      ctx2.beginPath();
      ctx2.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx2.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx2.stroke();
    }
    ctx2.restore();
  }
  if (style.tag) {
    ctx2.save();
    ctx2.fillStyle = colorAlpha(palette.frame, 0.78);
    ctx2.beginPath();
    ctx2.arc(x + 10, y + 10, 3, 0, Math.PI * 2);
    ctx2.fill();
    roughLine(ctx2, x + 10, y + 10, x + 22, y - 4, 0.45, 5, 9221);
    ctx2.restore();
  }
  if (style.holes) {
    ctx2.save();
    ctx2.fillStyle = "rgba(18,22,25,0.2)";
    for (let hy = y + 8; hy < y + plateH - 6; hy += 9) {
      ctx2.beginPath();
      ctx2.arc(x + 5, hy, 1.3, 0, Math.PI * 2);
      ctx2.arc(x + plateW - 5, hy, 1.3, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
  const screenInsetX = style.screen === "dial" ? 11 : style.screen === "ledger" ? 8 : 7;
  const screenInsetY = style.screen === "ledger" ? 7 : style.screen === "tube" ? 7 : 6;
  const screenW = plateW - screenInsetX * 2;
  const screenH = style.screen === "dial" ? 34 : style.screen === "ledger" ? 22 : style.screen === "tube" ? 24 : 29;
  const screen = () => {
    ctx2.beginPath();
    if (style.screen === "dial") {
      ctx2.arc(0, y + 28, 17, 0, Math.PI * 2);
    } else {
      ctx2.roundRect(x + screenInsetX, y + screenInsetY, screenW, screenH, style.screen === "tube" ? 12 : 6);
    }
  };
  screen();
  const glass = ctx2.createRadialGradient(0, y + 20, 0, 0, y + 20, 34);
  if (style.screen === "paper" || style.screen === "punch") {
    glass.addColorStop(0, "rgba(255,248,223,0.96)");
    glass.addColorStop(1, "rgba(224,210,177,0.94)");
  } else if (style.screen === "roller") {
    glass.addColorStop(0, "rgba(245,245,241,0.96)");
    glass.addColorStop(1, "rgba(190,196,190,0.92)");
  } else {
    glass.addColorStop(0, colorAlpha(palette.glass, 0.98));
    glass.addColorStop(0.52, "rgba(6,12,11,0.92)");
    glass.addColorStop(1, "rgba(3,5,5,0.98)");
  }
  ctx2.fillStyle = glass;
  ctx2.fill();
  ctx2.strokeStyle = colorAlpha(palette.frame, 0.82);
  ctx2.lineWidth = 1.2;
  screen();
  ctx2.stroke();
  ctx2.save();
  screen();
  ctx2.clip();
  ctx2.fillStyle = colorAlpha(palette.accent, 0.04 + heat * 0.03);
  if (style.screen !== "paper" && style.screen !== "punch" && style.screen !== "roller") {
    for (let col = x + 10; col < x + plateW - 10; col += 5) ctx2.fillRect(col, y + 10, 1, Math.max(12, screenH - 7));
    for (let row = y + 11; row < y + screenInsetY + screenH - 2; row += 5) ctx2.fillRect(x + 9, row, plateW - 18, 1);
  }
  if (style.screen === "flip") {
    ctx2.strokeStyle = "rgba(255,255,255,0.24)";
    ctx2.beginPath();
    ctx2.moveTo(x + screenInsetX + 2, y + screenInsetY + screenH / 2);
    ctx2.lineTo(x + screenInsetX + screenW - 2, y + screenInsetY + screenH / 2);
    ctx2.stroke();
  }
  if (style.screen === "punch") {
    ctx2.fillStyle = colorAlpha(palette.frame, 0.18);
    for (let px = x + 14; px < x + plateW - 12; px += 10) {
      ctx2.beginPath();
      ctx2.roundRect(px, y + 12, 3, 5, 1.2);
      ctx2.fill();
    }
  }
  ctx2.globalCompositeOperation = style.screen === "paper" || style.screen === "roller" || style.screen === "punch" ? "source-over" : "lighter";
  ctx2.shadowColor = colorAlpha(palette.accent, 0.7);
  ctx2.shadowBlur = style.screen === "paper" || style.screen === "roller" || style.screen === "punch" ? 0 : 4 + pulse * 4;
  const digitColor = style.screen === "paper" || style.screen === "roller" || style.screen === "punch" ? colorAlpha("#151817", sales ? 0.88 : 0.42) : colorAlpha(palette.accent, sales ? 0.92 + pulse * 0.08 : 0.38);
  const digitY = style.screen === "dial" ? y + 18 : style.screen === "ledger" ? y + 10 : y + 12;
  const pixel = style.screen === "ledger" ? 2.4 : style.screen === "dial" ? 2.85 : 3.05;
  drawSalePixelNumber(ctx2, sales, 0, digitY, pixel, digitColor);
  ctx2.restore();
  ctx2.save();
  ctx2.fillStyle = style.screen === "paper" || style.screen === "punch" ? "rgba(18,22,25,0.62)" : colorAlpha(palette.accent, sales ? 0.86 : 0.42);
  ctx2.font = "bold 4.8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(style.label, -9, y + plateH - 9);
  ctx2.fillStyle = sales > 9 ? colorAlpha(palette.frame, 0.86) : "rgba(176,42,37,0.82)";
  ctx2.beginPath();
  ctx2.arc(x + plateW - 11, y + plateH - 9, 2.1, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  for (const [rx, ry] of [[x + 6, y + 8], [x + plateW - 6, y + 8], [x + 7, y + plateH - 7], [x + plateW - 7, y + plateH - 7]]) {
    drawRivet(ctx2, rx, ry, 1.6);
  }
}
function drawTransferScarCutPart(ctx2, x1, y1, x2, y2, seed, color, width = 2, glow = 0) {
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.strokeStyle = "rgba(5,8,8,0.48)";
  ctx2.lineWidth = width + 2.2;
  roughLine(ctx2, x1 + 1.2, y1 + 1.6, x2 + 1.2, y2 + 1.6, 0.65, 6, seed + 31);
  if (glow) {
    ctx2.globalCompositeOperation = "lighter";
    ctx2.shadowColor = color;
    ctx2.shadowBlur = 5 + glow * 7;
    ctx2.strokeStyle = colorAlpha(color, 0.16 + glow * 0.24);
    ctx2.lineWidth = width + 3;
    roughLine(ctx2, x1, y1, x2, y2, 0.42, 6, seed + 61);
    ctx2.globalCompositeOperation = "source-over";
    ctx2.shadowBlur = 0;
  }
  ctx2.strokeStyle = colorAlpha(color, 0.9);
  ctx2.lineWidth = width;
  roughLine(ctx2, x1, y1, x2, y2, 0.56, 6, seed);
  ctx2.strokeStyle = "rgba(255,245,190,0.28)";
  ctx2.lineWidth = Math.max(0.7, width * 0.36);
  roughLine(ctx2, x1 + 0.8, y1 - 1, x2 + 0.8, y2 - 1, 0.28, 5, seed + 91);
  ctx2.restore();
}
function drawTransferTallyPartBundle(ctx2, x, y, scale, seed, options = {}) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  for (let i = 0; i < 4; i += 1) {
    const ox = (i - 1.5) * 8.4 * scale;
    drawTransferScarCutPart(ctx2, ox - 4 * scale, 15 * scale, ox + 4.5 * scale, -16 * scale, seed + i * 19, options.color || "#24221b", 2.1 * scale, options.glow || 0);
  }
  drawTransferScarCutPart(ctx2, -22 * scale, 10 * scale, 23 * scale, -12 * scale, seed + 101, options.slashColor || "#a46624", 2.35 * scale, options.glow || 0);
  ctx2.restore();
}
function drawTransferSingleCutsPart(ctx2, x, y, count, scale, seed, options = {}) {
  if (!count) return;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  for (let i = 0; i < count; i += 1) {
    const ox = (i - (count - 1) / 2) * 8.5 * scale;
    drawTransferScarCutPart(ctx2, ox - 2.8 * scale, 13 * scale, ox + 5.2 * scale, -14 * scale, seed + i * 23, options.color || "#24221b", 1.9 * scale, options.glow || 0);
  }
  ctx2.restore();
}
function drawTransferBurnPart(ctx2, x, y, scale, seed, options = {}) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  const heat = options.heat || 0;
  ctx2.fillStyle = options.aura || (heat > 0.58 ? "rgba(111,28,20,0.24)" : "rgba(70,42,24,0.18)");
  ctx2.beginPath();
  ctx2.ellipse(0, 1, 28 * scale, 16 * scale, -0.1, 0, Math.PI * 2);
  ctx2.fill();
  drawTransferTallyPartBundle(ctx2, 0, 0, scale * 0.82, seed, {
    color: options.color || (heat > 0.58 ? "#80231d" : "#25221a"),
    slashColor: options.slashColor || "#d7a13a",
    glow: options.glow || 0
  });
  ctx2.restore();
}
function drawTransferSealPart(ctx2, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  const glow = options.glow || 0;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  ctx2.fillStyle = "rgba(14,17,16,0.66)";
  ctx2.strokeStyle = "rgba(215,161,58,0.86)";
  ctx2.lineWidth = 1.5 * scale;
  ctx2.beginPath();
  ctx2.arc(0, 0, 11.5 * scale, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.strokeStyle = glow ? colorAlpha("#66f5dd", 0.18 + glow * 0.24) : "rgba(215,161,58,0.52)";
  ctx2.lineWidth = 1.05 * scale;
  roughLine(ctx2, -6 * scale, -5 * scale, 6 * scale, 5 * scale, 0.26, 4, seed);
  roughLine(ctx2, -6 * scale, 5 * scale, 6 * scale, -5 * scale, 0.26, 4, seed + 1);
  ctx2.fillStyle = "rgba(245,236,206,0.82)";
  ctx2.font = `bold ${Math.max(5, 6.4 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, 0.5);
  ctx2.restore();
}
function drawTransferStampPart(ctx2, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  const w = 54 * scale;
  const h = 22 * scale;
  ctx2.fillStyle = "rgba(8,10,10,0.76)";
  ctx2.strokeStyle = "rgba(215,161,58,0.72)";
  ctx2.lineWidth = 1.3 * scale;
  ctx2.beginPath();
  ctx2.roundRect(-w / 2, -h / 2, w, h, 5 * scale);
  ctx2.fill();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,236,151,0.16)";
  ctx2.lineWidth = 0.8 * scale;
  roughLine(ctx2, -w * 0.34, -h * 0.18, w * 0.36, -h * 0.26, 0.38, 6, seed);
  ctx2.fillStyle = "rgba(245,236,206,0.84)";
  ctx2.font = `bold ${Math.max(7, 9.5 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, 0.7);
  ctx2.restore();
}
function compactTransferPartLabel(value) {
  if (value >= 1e6) return `${Math.floor(value / 1e6)}M`;
  if (value >= 1e3) return `${Math.floor(value / 1e3)}K`;
  return String(value);
}
function drawTransferTallyScarsPart(ctx2, part, state = {}) {
  setup(ctx2, part, 1.25, 0.92);
  const transfers = transferCountForState(state);
  if (!transfers) return;
  const goldenEdition = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const heat = Math.min(1, transfers / 120);
  const pulse = Math.max(0, Math.min(1, Number(state.heartbeatPulse || 0)));
  const glow = transfers >= 8 ? Math.min(1, heat * (0.38 + pulse * 0.46)) : 0;
  const seed = 9300 + transfers * 23 + (part.scarVariant === "minor" ? 400 : 0);
  const cutColor = goldenEdition ? heat > 0.65 ? "#8e5a18" : heat > 0.32 ? "#6a4210" : "#2a1905" : heat > 0.65 ? "#7f2b22" : heat > 0.32 ? "#5e351e" : "#141715";
  const slashColor = goldenEdition ? heat > 0.52 ? "#ffed91" : "#d19a2c" : heat > 0.52 ? "#d7a13a" : "#a86724";
  let remainder = transfers;
  const thousands = Math.floor(remainder / 1e3);
  remainder %= 1e3;
  const hundreds = Math.floor(remainder / 100);
  remainder %= 100;
  const twentyFives = Math.floor(remainder / 25);
  remainder %= 25;
  const fives = Math.floor(remainder / 5);
  const ones = remainder % 5;
  ctx2.save();
  ctx2.globalCompositeOperation = "source-over";
  if (part.scarVariant === "minor") {
    const visibleFives = Math.min(3, fives);
    for (let i = 0; i < visibleFives; i += 1) {
      drawTransferTallyPartBundle(ctx2, -22 + i * 28, -5 + i % 2 * 15, 0.58, seed + i, {
        rotation: -0.02 + i * 0.12,
        color: cutColor,
        slashColor,
        glow
      });
    }
    drawTransferSingleCutsPart(ctx2, 24, 22, Math.min(4, ones), 0.62, seed + 90, {
      rotation: 0.1,
      color: cutColor,
      glow
    });
    ctx2.restore();
    return;
  }
  if (thousands) {
    drawTransferStampPart(ctx2, 27, 21, compactTransferPartLabel(transfers), seed + 4, { scale: 0.68, rotation: 0.18 });
  }
  const visibleHundreds = Math.min(3, hundreds);
  for (let i = 0; i < visibleHundreds; i += 1) {
    drawTransferSealPart(ctx2, -34 + i * 27, -19 + i % 2 * 10, "100", seed + 100 + i, {
      scale: 0.72,
      rotation: 0.1 + i * 0.06,
      glow
    });
  }
  const visibleTwentyFives = Math.min(3, twentyFives);
  for (let i = 0; i < visibleTwentyFives; i += 1) {
    drawTransferBurnPart(ctx2, -28 + i * 35, 14 + i % 2 * 5, 0.76, seed + 220 + i, {
      rotation: 0.13 + i * 0.04,
      heat,
      glow,
      color: cutColor,
      slashColor,
      aura: goldenEdition ? "rgba(255,200,64,0.12)" : void 0
    });
  }
  if (!visibleHundreds && !visibleTwentyFives) {
    drawTransferTallyPartBundle(ctx2, -14, 7, 0.72, seed + 360, {
      rotation: 0.14,
      color: cutColor,
      slashColor,
      glow
    });
  }
  ctx2.restore();
}
function gasLevelFor(state = {}) {
  const pressure = typeof state.pressureLevel === "string" ? state.pressureLevel.toLowerCase() : "";
  if (pressure === "extreme") return 1;
  if (pressure === "high") return 0.78;
  if (pressure === "medium") return 0.48;
  if (pressure === "low") return 0.16;
  const raw = Number(state.gasPressure ?? state.baseFeeGwei ?? state.baseFee ?? 0);
  if (!Number.isFinite(raw)) return 0.18;
  if (raw >= 140) return 1;
  if (raw >= 60) return 0.78;
  if (raw >= 20) return 0.48;
  return 0.16;
}
function gasLabelFor(level) {
  if (level >= 0.96) return "EXT";
  if (level >= 0.68) return "HIGH";
  if (level >= 0.36) return "MED";
  return "LOW";
}
function pressureColorFor(level) {
  if (level >= 0.96) return "#ff2f2f";
  if (level >= 0.68) return "#ff5938";
  if (level >= 0.36) return "#ffd23f";
  return "#55f277";
}
function gasDisplayPaletteFor(level, state = {}) {
  const skin = state.specialMaterialSkin || state.materialSkin;
  if (!isGoldenEditionSkin(skin)) {
    const color2 = pressureColorFor(level);
    return {
      golden: false,
      color: color2,
      panel: "rgba(5,8,7,0.9)",
      panelStroke: colorAlpha(color2, 0.52),
      track: "rgba(11,18,16,0.72)",
      text: colorAlpha(color2, 0.98),
      glow: colorAlpha(color2, 0.34),
      softGlow: colorAlpha(color2, 0.12)
    };
  }
  const clamped = clamp01(level);
  const color = clamped >= 0.96 ? "#fff0a6" : clamped >= 0.68 ? "#ffc43f" : clamped >= 0.36 ? "#d7a13a" : "#a66d1d";
  return {
    golden: true,
    color,
    panel: "rgba(4,5,4,0.93)",
    panelStroke: "rgba(255,203,68,0.66)",
    track: "rgba(22,16,6,0.86)",
    text: clamped >= 0.96 ? "rgba(255,250,206,0.98)" : "rgba(255,224,98,0.98)",
    glow: colorAlpha(color, 0.42),
    softGlow: "rgba(255,202,66,0.13)"
  };
}
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
function gasHeartbeatFor(state = {}, level = 0, offset = 0) {
  const rawTime = Number(state.time || 0);
  const cycleLength = 2.05 - clamp01(level) * 0.32;
  const cycle = ((rawTime + offset * cycleLength) % cycleLength + cycleLength) % cycleLength;
  const phase = cycle / cycleLength;
  const rise = clamp01(phase / 0.14);
  const hold = phase < 0.58 ? 1 : clamp01(1 - (phase - 0.58) / 0.24);
  const pulse = phase < 0.14 ? rise : phase < 0.58 ? 1 : phase < 0.82 ? hold : 0;
  return clamp01(0.1 + pulse * 0.9);
}
function drawPackGaugeFace(ctx2, x, y, r, level, state = {}) {
  const clamped = Math.max(0, Math.min(1, level));
  const start = Math.PI * 1.08;
  const end = Math.PI * 1.92;
  const palette = gasDisplayPaletteFor(clamped, state);
  const pressureColor = palette.color;
  const goldenGas = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const label = gasLabelFor(clamped);
  const beat = gasHeartbeatFor(state, clamped, 0.08);
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = colorAlpha(pressureColor, 0.04 + clamped * 0.05 + beat * 0.12);
  ctx2.beginPath();
  ctx2.arc(0, 4, r + 9 + beat * 5, Math.PI, Math.PI * 2);
  ctx2.lineTo(r + 10, r * 0.5);
  ctx2.lineTo(-r - 10, r * 0.5);
  ctx2.closePath();
  ctx2.fill();
  ctx2.restore();
  ctx2.fillStyle = goldenGas ? "rgba(4,5,4,0.93)" : "rgba(246,241,229,0.88)";
  ctx2.strokeStyle = goldenGas ? "rgba(255,203,68,0.68)" : "rgba(18,22,25,0.78)";
  ctx2.lineWidth = 2.2;
  ctx2.beginPath();
  ctx2.arc(0, 0, r, Math.PI, Math.PI * 2);
  ctx2.lineTo(r, r * 0.42);
  ctx2.lineTo(-r, r * 0.42);
  ctx2.closePath();
  ctx2.fill();
  ctx2.stroke();
  ctx2.strokeStyle = goldenGas ? "rgba(138,90,24,0.88)" : "rgba(85,242,119,0.86)";
  ctx2.lineWidth = 3;
  ctx2.beginPath();
  ctx2.arc(0, 0, r - 8, start, start + (end - start) * 0.34);
  ctx2.stroke();
  ctx2.strokeStyle = goldenGas ? "rgba(215,161,58,0.92)" : "rgba(255,210,63,0.88)";
  ctx2.beginPath();
  ctx2.arc(0, 0, r - 8, start + (end - start) * 0.38, start + (end - start) * 0.66);
  ctx2.stroke();
  ctx2.strokeStyle = goldenGas ? "rgba(255,240,166,0.96)" : "rgba(255,89,56,0.92)";
  ctx2.beginPath();
  ctx2.arc(0, 0, r - 8, start + (end - start) * 0.7, end);
  ctx2.stroke();
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.lineCap = "round";
  ctx2.lineWidth = 6 + beat * 5;
  ctx2.strokeStyle = colorAlpha(pressureColor, 0.14 + clamped * 0.12 + beat * 0.28);
  ctx2.beginPath();
  ctx2.arc(0, 0, r - 13, start, start + (end - start) * clamped);
  ctx2.stroke();
  ctx2.restore();
  for (let i = 0; i <= 5; i += 1) {
    const a = start + (end - start) * (i / 5);
    ctx2.strokeStyle = goldenGas ? "rgba(255,224,98,0.56)" : "rgba(18,22,25,0.58)";
    ctx2.lineWidth = i === 0 || i === 5 ? 2.2 : 1.3;
    ctx2.beginPath();
    ctx2.moveTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12));
    ctx2.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx2.stroke();
  }
  const needle = start + (end - start) * clamped;
  ctx2.strokeStyle = goldenGas || clamped > 0.68 ? colorAlpha(pressureColor, 0.98) : "rgba(18,22,25,0.8)";
  ctx2.shadowColor = colorAlpha(pressureColor, 0.12 + beat * 0.32);
  ctx2.shadowBlur = 4 + beat * 9;
  ctx2.lineWidth = 3.4;
  ctx2.beginPath();
  ctx2.moveTo(0, 0);
  ctx2.lineTo(Math.cos(needle) * (r - 14), Math.sin(needle) * (r - 14));
  ctx2.stroke();
  ctx2.shadowBlur = 0;
  ctx2.fillStyle = goldenGas ? "rgba(255,224,98,0.92)" : "rgba(18,22,25,0.82)";
  ctx2.beginPath();
  ctx2.arc(0, 0, 4.6, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = goldenGas || clamped > 0.68 ? colorAlpha(pressureColor, 0.98) : colorAlpha(pressureColor, 0.92);
  ctx2.font = `bold ${Math.max(9, Math.round(r * 0.25))}px ui-monospace, Menlo, Consolas, monospace`;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, r * 0.25);
  ctx2.restore();
}
function drawPackUtilityPort(ctx2, x, y, r, style = {}) {
  const color = style.color || "#d7a13a";
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.fillStyle = style.fill || "rgba(34,44,44,0.74)";
  ctx2.strokeStyle = "rgba(18,22,25,0.72)";
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.arc(0, 0, r, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.fillStyle = colorAlpha(color, 0.54);
  ctx2.beginPath();
  ctx2.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.5)";
  ctx2.lineWidth = 1.2;
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha(style.line || "#fff2b8", 0.46);
  ctx2.lineWidth = 1.1;
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4;
    ctx2.beginPath();
    ctx2.moveTo(Math.cos(angle) * r * 0.25, Math.sin(angle) * r * 0.25);
    ctx2.lineTo(Math.cos(angle) * r * 0.62, Math.sin(angle) * r * 0.62);
    ctx2.stroke();
  }
  ctx2.fillStyle = "rgba(18,22,25,0.76)";
  ctx2.beginPath();
  ctx2.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx2.fill();
  for (const [rx, ry] of [[-0.68, -0.68], [0.68, -0.68], [-0.68, 0.68], [0.68, 0.68]]) {
    drawRivet(ctx2, rx * r, ry * r, Math.max(2, r * 0.1));
  }
  ctx2.restore();
}
function drawPackIconReaderBadge(ctx2, level, style = {}, options = {}) {
  const palette = gasDisplayPaletteFor(level, options);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(options, level, options.offset || 0.18);
  const levelGlow = clamp01(level);
  const fillAlpha = Math.min(1, 0.74 + beat * 0.2 + levelGlow * 0.1);
  const glowAlpha = 0.09 + levelGlow * 0.1 + beat * 0.24;
  ctx2.save();
  ctx2.translate(options.x ?? 35, options.y ?? 18);
  const scale = options.scale ?? 0.88;
  ctx2.scale(scale, scale);
  drawPencilRect(ctx2, -46, -16, 92, 32, 7, {
    fill: palette.panel,
    wash: 0.045,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.032,
    lineWidth: 1.18
  });
  ctx2.beginPath();
  ctx2.roundRect(-33, -6, 45, 10, 5);
  ctx2.fillStyle = palette.track;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(8,11,12,0.5)";
  ctx2.lineWidth = 0.8;
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.roundRect(-33, -6, 45 * Math.max(0.08, Math.min(1, level)), 10, 5);
  ctx2.shadowColor = palette.glow || colorAlpha(color, glowAlpha);
  ctx2.shadowBlur = 6 + beat * 12 + levelGlow * 5;
  ctx2.fillStyle = colorAlpha(color, fillAlpha);
  ctx2.fill();
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = colorAlpha(color, 0.06 + beat * 0.16 + levelGlow * 0.07);
  ctx2.fillRect(-41, -13, 82, 26);
  ctx2.restore();
  ctx2.shadowColor = colorAlpha(style.highlight || "#d7a13a", 0.22 + beat * 0.2);
  ctx2.shadowBlur = 4 + beat * 8;
  ctx2.fillStyle = colorAlpha(palette.golden ? "#ffe47a" : style.highlight || "#d7a13a", 0.82 + beat * 0.16);
  ctx2.beginPath();
  ctx2.arc(29, -1, 5.5 + beat * 1.3, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.strokeStyle = "rgba(8,11,12,0.64)";
  ctx2.lineWidth = 0.9;
  ctx2.stroke();
  ctx2.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.95 + beat * 0.05));
  ctx2.font = "bold 9.5px ui-monospace, Menlo, Consolas, monospace";
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 2, 10.5);
  ctx2.restore();
}
function drawGasStatePill(ctx2, level, state = {}, x = 0, y = 0, scale = 1, options = {}) {
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = String(options.text || gasLabelFor(level)).toUpperCase();
  const beat = gasHeartbeatFor(state, level, options.offset || 0.36);
  const w = options.w || 82;
  const h = options.h || 28;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  ctx2.scale(scale, scale);
  drawPencilRect(ctx2, -w / 2, -h / 2, w, h, 7, {
    fill: palette.panel,
    wash: 0.04,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.028,
    lineWidth: 1.15
  });
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.shadowColor = palette.glow || colorAlpha(color, 0.24 + beat * 0.42 + level * 0.12);
  ctx2.shadowBlur = 7 + beat * 18 + level * 8;
  ctx2.fillStyle = colorAlpha(color, (palette.golden ? 0.06 : 0.1) + beat * 0.22 + level * 0.12);
  ctx2.fillRect(-w / 2 + 5, -h / 2 + 4, w - 10, h - 8);
  ctx2.restore();
  ctx2.beginPath();
  ctx2.roundRect(-w / 2 + 9, -h / 2 + 7, (w - 18) * Math.max(0.1, Math.min(1, level)), 5, 3);
  ctx2.fillStyle = colorAlpha(color, 0.78 + beat * 0.2);
  ctx2.fill();
  ctx2.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.94 + beat * 0.06));
  ctx2.shadowColor = colorAlpha(color, 0.26 + beat * 0.35);
  ctx2.shadowBlur = 4 + beat * 8;
  ctx2.font = `bold ${options.fontSize || 11}px ui-monospace, Menlo, Consolas, monospace`;
  ctx2.letterSpacing = "0px";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, 4);
  ctx2.shadowBlur = 0;
  if (options.caption) {
    ctx2.fillStyle = colorAlpha(options.captionColor || palette.color || "#d7a13a", 0.82);
    ctx2.font = "bold 6px ui-monospace, Menlo, Consolas, monospace";
    ctx2.fillText(String(options.caption).toUpperCase(), 0, -7);
  }
  ctx2.restore();
}
function drawPackIconGasReadoutOverlay(ctx2, part, state = {}) {
  const icon = part.packIcon || "pressureGauge";
  const level = gasLevelFor(state);
  const style = styleFor(part);
  const overlayState = { ...state };
  const pill = (x, y, scale, options = {}) => drawGasStatePill(ctx2, level, overlayState, x, y, scale, options);
  ctx2.save();
  ctx2.globalCompositeOperation = "source-over";
  if (icon === "pressureGauge") {
    drawPackGaugeFace(ctx2, 0, -8, 52, level, overlayState);
    drawPencilRect(ctx2, -24, 24, 48, 18, 6, {
      fill: "rgba(4,5,4,0.9)",
      wash: 0.035,
      hatch: 0.012,
      spacing: 5,
      shadow: 0.02,
      lineWidth: 1.1
    });
  } else if (icon === "engineReader" || icon === "cassetteReader") {
    drawPackIconReaderBadge(ctx2, level, style, { ...overlayState, x: 0, y: -1, scale: 1, offset: 0.1 });
  } else if (icon === "ledger") {
    drawPackIconReaderBadge(ctx2, level, style, { ...overlayState, x: -27, y: -2, scale: 0.72, offset: 0.16 });
  } else if (icon === "skateboard") {
    pill(2, 8, 0.84, { w: 82, h: 26, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level), caption: "GAS" });
  } else if (icon === "fireExtinguisher") {
    pill(0, 28, 0.54, { w: 68, h: 21, fontSize: 8, caption: "PSI" });
  } else if (icon === "divingTankBattery" || icon === "fishTank") {
    pill(-6, icon === "fishTank" ? 13 : 9, 0.78, { w: 80, h: 26, fontSize: 10, caption: icon === "fishTank" ? "TANK" : "O2" });
  } else if (icon === "transactionPrinter") {
    pill(0, 22, 0.62, { w: 70, h: 23, fontSize: 10, caption: "TX" });
  } else if (icon === "mercurySpine") {
    pill(0, 58, 0.54, { w: 70, h: 21, fontSize: 8, caption: "FLOW" });
  } else if (icon === "mailbox") {
    pill(24, 8, 0.82, { w: 80, h: 26, fontSize: 10, caption: "GAS" });
  } else if (icon === "trafficLight") {
    pill(0, 78, 0.7, { w: 78, h: 25, fontSize: 10 });
  } else if (icon === "whaleVent") {
    pill(12, 21, 0.82, { w: 80, h: 26, fontSize: 10, caption: "VENT" });
  } else if (icon === "battery") {
    pill(0, 68, 0.66, { w: 74, h: 25, fontSize: 10 });
  } else if (icon === "gasCanister" || icon === "dragonFurnace") {
    pill(0, 6, 0.7, { w: 74, h: 25, fontSize: 10, caption: icon === "dragonFurnace" ? "BURN" : "GAS" });
  } else if (icon === "miniFan") {
    pill(0, 54, 0.66, { w: 76, h: 24, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level) });
  } else {
    drawPackIconReaderBadge(ctx2, level, style, { ...overlayState });
  }
  ctx2.restore();
}
function drawPackIcon(ctx2, part, state = {}) {
  const style = setup(ctx2, part, 2.2, 0.84);
  const icon = part.packIcon || "pressureGauge";
  const level = gasLevelFor(state);
  const goldenPack = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const liquid = goldenPack ? { base: "#e6a42f", accent: "#fff0a6", glow: "rgba(255,207,82,0.62)" } : liquidTheme(state);
  const gasPalette = gasDisplayPaletteFor(level, state);
  const cyan = goldenPack ? "#fff0a6" : style.highlight || "#35d8df";
  const brass = goldenPack ? "#ffc43f" : "#d7a13a";
  const pressure = gasPalette.color;
  const red = goldenPack ? level >= 0.68 ? "#fff0a6" : "#d7a13a" : level >= 0.68 ? pressure : "#d84a3a";
  const cream = goldenPack ? "#f0d98a" : "#efe6d2";
  const ink = "rgba(12,16,17,0.84)";
  const beat = gasHeartbeatFor(state, level, 0.12);
  const integratedGasIcons = /* @__PURE__ */ new Set([
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
  ctx2.save();
  if (part.peek) {
    const bottom = Number.isFinite(part.peekClipBottom) ? part.peekClipBottom : 22;
    ctx2.beginPath();
    ctx2.rect(-126, -134, 252, bottom + 134);
    ctx2.clip();
  }
  try {
    if (icon === "engineReader" || icon === "cassetteReader") {
      drawPencilRect(ctx2, -54, -26, 108, 52, 10, {
        fill: "rgba(18,23,24,0.74)",
        wash: 0.05,
        hatch: 0.025,
        spacing: 5,
        shadow: 0.035,
        lineWidth: 1.35
      });
      drawPackIconReaderBadge(ctx2, level, style, { ...state, x: 0, y: -1, scale: 1, offset: 0.1 });
      return;
    }
    if (icon === "pressureGauge") {
      drawPackGaugeFace(ctx2, 0, -8, 52, level, state);
      drawPencilRect(ctx2, -24, 24, 48, 18, 6, { fill: colorAlpha(brass, 0.36), wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.025 });
      return;
    }
    if (icon === "skateboard") {
      const deck = () => {
        ctx2.beginPath();
        ctx2.moveTo(-74, -20);
        ctx2.quadraticCurveTo(-62, -40, -34, -34);
        ctx2.lineTo(54, -18);
        ctx2.quadraticCurveTo(78, -12, 68, 10);
        ctx2.quadraticCurveTo(14, 30, -54, 16);
        ctx2.quadraticCurveTo(-82, 8, -74, -20);
        ctx2.closePath();
      };
      drawCastShadow(ctx2, deck, 3, 4, 0.055);
      deck();
      ctx2.fillStyle = "rgba(16,18,19,0.82)";
      ctx2.fill();
      ctx2.strokeStyle = "rgba(18,22,25,0.9)";
      ctx2.lineWidth = 2.2;
      ctx2.stroke();
      ctx2.strokeStyle = colorAlpha(brass, 0.88);
      ctx2.lineWidth = 3;
      roughBezier(ctx2, [[-68, 10], [-18, 20], [34, 18], [64, 2]], 0.5, 2031);
      drawPencilRect(ctx2, -48, -4, 96, 25, 7, { fill: "rgba(4,10,12,0.84)", wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1 });
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      ctx2.strokeStyle = colorAlpha(pressure, 0.38 + beat * 0.3);
      ctx2.lineWidth = 2.8;
      roughBezier(ctx2, [[-42, 16], [-12, 21], [20, 18], [42, 8]], 0.35, 2032);
      ctx2.restore();
      drawGasStatePill(ctx2, level, state, 2, 8, 0.84, { w: 82, h: 26, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level), caption: "GAS" });
      for (const [x, y] of [[-44, 16], [42, 8]]) drawRivet(ctx2, x, y, 3.2);
      return;
    }
    if (icon === "fireExtinguisher") {
      const body = () => {
        ctx2.beginPath();
        ctx2.roundRect(-34, -72, 68, 134, 24);
      };
      drawCastShadow(ctx2, body, 4, 5, 0.06);
      body();
      ctx2.fillStyle = "rgba(210,48,36,0.9)";
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 2.4;
      ctx2.stroke();
      drawPencilRect(ctx2, -25, 2, 50, 32, 8, { fill: "rgba(255,236,141,0.74)", wash: 0.07, hatch: 0.035, spacing: 6, lineWidth: 1.4 });
      ctx2.fillStyle = ink;
      ctx2.font = "bold 9px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.fillText("CO2", 0, 20);
      drawGasStatePill(ctx2, level, state, 0, 28, 0.54, { w: 68, h: 21, fontSize: 8, caption: "PSI" });
      drawPackUtilityPort(ctx2, 0, -36, 34, { color: brass, fill: "rgba(72,38,30,0.66)" });
      drawPencilRect(ctx2, -21, -83, 42, 20, 8, { fill: colorAlpha(brass, 0.72), wash: 0.05, hatch: 0.03, spacing: 5, lineWidth: 1.4 });
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 4;
      roughBezier(ctx2, [[20, -78], [56, -60], [50, -16], [32, 18]], 0.6, 2201);
      ctx2.strokeStyle = colorAlpha(cream, 0.62);
      ctx2.lineWidth = 2;
      roughBezier(ctx2, [[-18, -58], [-26, -16], [-20, 32], [-5, 54]], 0.35, 2202);
      return;
    }
    if (icon === "divingTankBattery" || icon === "fishTank") {
      for (const x of [-22, 22]) {
        const tank = () => {
          ctx2.beginPath();
          ctx2.roundRect(x - 18, -74, 36, 132, 18);
        };
        drawCastShadow(ctx2, tank, 2, 3, 0.04);
        tank();
        ctx2.fillStyle = colorAlpha(liquid.accent, icon === "fishTank" ? 0.44 : 0.78);
        ctx2.fill();
        ctx2.strokeStyle = ink;
        ctx2.lineWidth = 2.1;
        ctx2.stroke();
        ctx2.save();
        const fillH = 88 * Math.max(0.08, Math.min(1, level));
        ctx2.fillStyle = colorAlpha(pressure, icon === "fishTank" ? 0.18 + level * 0.28 + beat * 0.18 : 0.3 + level * 0.34 + beat * 0.18);
        ctx2.fillRect(x - 13, 38 - fillH, 26, fillH);
        ctx2.restore();
        ctx2.fillStyle = "rgba(255,255,255,0.22)";
        ctx2.fillRect(x - 8, -62, 4, 94);
      }
      drawPencilRect(ctx2, -54, -18, 108, 18, 7, { fill: "rgba(12,16,17,0.64)", wash: 0.04, hatch: 0.02, spacing: 6, lineWidth: 1.2 });
      drawPencilRect(ctx2, -54, 34, 108, 18, 7, { fill: "rgba(12,16,17,0.64)", wash: 0.04, hatch: 0.02, spacing: 6, lineWidth: 1.2 });
      drawPackUtilityPort(ctx2, 0, -54, 31, { color: liquid.accent, fill: "rgba(20,58,58,0.52)" });
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 4;
      roughBezier(ctx2, [[12, -84], [72, -64], [70, 18], [42, 64]], 0.5, 2203);
      ctx2.fillStyle = colorAlpha(brass, 0.82);
      ctx2.beginPath();
      ctx2.moveTo(-6, -2);
      ctx2.lineTo(12, -2);
      ctx2.lineTo(0, 24);
      ctx2.lineTo(16, 24);
      ctx2.lineTo(-10, 56);
      ctx2.lineTo(-2, 28);
      ctx2.lineTo(-18, 28);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 1.3;
      ctx2.stroke();
      drawPencilRect(ctx2, 31, -48, 28, 70, 8, { fill: "rgba(4,10,12,0.72)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1 });
      for (let i = 0; i < 4; i += 1) {
        const lit = level >= (i + 1) / 4 - 0.02;
        ctx2.fillStyle = lit ? colorAlpha(pressure, 0.64 + beat * 0.26) : "rgba(255,255,255,0.12)";
        ctx2.fillRect(37, 7 - i * 14, 16, 9);
      }
      ctx2.fillStyle = colorAlpha(pressure, 0.92);
      ctx2.font = "bold 7px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.fillText("GAS", 45, -33);
      drawGasStatePill(ctx2, level, state, -6, icon === "fishTank" ? 13 : 9, 0.78, { w: 80, h: 26, fontSize: 10, caption: icon === "fishTank" ? "TANK" : "O2" });
      return;
    }
    if (icon === "ledger") {
      ctx2.save();
      ctx2.rotate(-0.12);
      drawPencilRect(ctx2, -78, -28, 116, 56, 10, { fill: "rgba(22,24,26,0.86)", wash: 0.08, hatch: 0.04, spacing: 7, shadow: 0.05 });
      drawPencilRect(ctx2, 8, -34, 60, 68, 10, { fill: "rgba(242,242,236,0.82)", wash: 0.08, hatch: 0.035, spacing: 6, lineWidth: 1.6 });
      drawPencilRect(ctx2, -54, -14, 54, 26, 4, { fill: "rgba(6,12,14,0.78)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.1 });
      ctx2.fillStyle = colorAlpha(pressure, 0.92 + beat * 0.08);
      ctx2.shadowColor = colorAlpha(pressure, 0.18 + beat * 0.28);
      ctx2.shadowBlur = 4 + beat * 7;
      ctx2.font = "bold 13px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      ctx2.fillText(gasLabelFor(level), -27, -2);
      ctx2.shadowBlur = 0;
      ctx2.font = "bold 5.8px ui-monospace, Menlo, monospace";
      ctx2.fillText("GAS", -27, 11);
      drawRivet(ctx2, 44, 0, 5);
      ctx2.restore();
      return;
    }
    if (icon === "transactionPrinter") {
      drawPencilRect(ctx2, -58, -54, 116, 82, 12, { fill: "rgba(237,230,214,0.84)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.045 });
      drawPencilRect(ctx2, -42, -30, 84, 18, 5, { fill: "rgba(18,22,25,0.76)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1.1 });
      drawPencilRect(ctx2, -36, -2, 72, 44, 4, { fill: level >= 0.68 ? colorAlpha(pressure, 0.36 + beat * 0.22) : "rgba(255,246,219,0.82)", wash: 0.035, hatch: 0.018, spacing: 6, lineWidth: 1.1 });
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 1.2;
      for (let y = 8; y <= 28; y += 9) {
        roughLine(ctx2, -26, y, 22, y + Math.sin(y) * 2, 0.25, 5, 2800 + y);
      }
      drawGasStatePill(ctx2, level, state, 0, 22, 0.62, { w: 70, h: 23, fontSize: 10, caption: "TX" });
      drawRivet(ctx2, -42, -42, 3);
      drawRivet(ctx2, 42, -42, 3);
      return;
    }
    if (icon === "arcadePack") {
      drawPencilRect(ctx2, -56, -60, 112, 106, 12, { fill: "rgba(18,21,23,0.84)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.045 });
      drawPencilRect(ctx2, -44, -46, 88, 50, 7, { fill: colorAlpha(pressure, 0.2 + level * 0.18 + beat * 0.1), wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1.1 });
      ctx2.save();
      ctx2.beginPath();
      ctx2.roundRect(-40, -42, 80, 42, 5);
      ctx2.clip();
      ctx2.fillStyle = colorAlpha(pressure, 0.1 + level * 0.16 + beat * 0.16);
      for (let y = -40; y < 0; y += 6) ctx2.fillRect(-40, y + (state.time || 0) * (2 + level * 8) % 6, 80, 1.4);
      if (level >= 0.68) {
        ctx2.fillStyle = colorAlpha("#fff0a4", 0.08 + beat * 0.12);
        for (let x = -34; x <= 32; x += 16) ctx2.fillRect(x, -40, 5, 42);
      }
      ctx2.restore();
      ctx2.fillStyle = level >= 0.96 ? "rgba(255,238,205,0.98)" : colorAlpha(pressure, 0.92 + beat * 0.08);
      ctx2.shadowColor = colorAlpha(pressure, 0.35 + beat * 0.34);
      ctx2.shadowBlur = 7 + level * 8 + beat * 8;
      ctx2.font = "bold 16px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.textBaseline = "middle";
      ctx2.fillText(gasLabelFor(level), 0, -26);
      ctx2.font = "bold 6.5px ui-monospace, Menlo, monospace";
      ctx2.fillText(level >= 0.96 ? "OVERHEAT" : "GAS PLAY", 0, -9);
      ctx2.shadowBlur = 0;
      ctx2.strokeStyle = colorAlpha(brass, 0.82);
      ctx2.lineWidth = 3;
      roughLine(ctx2, -26, 16, -8, 0, 0.32, 5, 2810);
      drawRivet(ctx2, -8, 0, 4.5);
      for (let i = 0; i < 4; i += 1) {
        ctx2.fillStyle = i % 2 ? colorAlpha(brass, 0.86) : colorAlpha(pressure, 0.82);
        ctx2.beginPath();
        ctx2.arc(12 + i * 10, 16 + Math.sin(i) * 2, 4.2, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.strokeStyle = ink;
        ctx2.lineWidth = 1;
        ctx2.stroke();
      }
      return;
    }
    if (icon === "mercurySpine") {
      for (let i = 0; i < 3; i += 1) {
        const x = -24 + i * 24;
        const tube = () => {
          ctx2.beginPath();
          ctx2.roundRect(x - 8, -70, 16, 112, 8);
        };
        tube();
        ctx2.fillStyle = "rgba(221,235,230,0.36)";
        ctx2.fill();
        ctx2.strokeStyle = ink;
        ctx2.lineWidth = 1.5;
        ctx2.stroke();
        const fill = Math.max(12, 78 * level);
        ctx2.fillStyle = colorAlpha(pressure, level >= 0.68 ? 0.72 : 0.52);
        ctx2.fillRect(x - 5, 34 - fill, 10, fill);
        if (level >= 0.68) {
          ctx2.fillStyle = colorAlpha("#fff4c8", 0.2);
          ctx2.fillRect(x - 5, 34 - fill, 10, 4);
        }
        ctx2.fillStyle = "rgba(255,255,255,0.28)";
        ctx2.fillRect(x - 3, -58, 2, 84);
      }
      drawPencilRect(ctx2, -44, -80, 88, 16, 5, { fill: colorAlpha(brass, 0.62), wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1.1 });
      drawPencilRect(ctx2, -44, 38, 88, 16, 5, { fill: colorAlpha(brass, 0.62), wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1.1 });
      ctx2.fillStyle = level > 0.7 ? colorAlpha(red, 0.86) : ink;
      ctx2.font = "bold 9px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.fillText("Hg", 0, -46);
      drawGasStatePill(ctx2, level, state, 0, 58, 0.54, { w: 70, h: 21, fontSize: 8, caption: "FLOW" });
      return;
    }
    if (icon === "mailbox") {
      const box = () => {
        ctx2.beginPath();
        ctx2.moveTo(-64, 20);
        ctx2.lineTo(-64, -16);
        ctx2.bezierCurveTo(-52, -64, 52, -64, 64, -16);
        ctx2.lineTo(64, 34);
        ctx2.quadraticCurveTo(34, 54, -42, 44);
        ctx2.quadraticCurveTo(-66, 36, -64, 20);
        ctx2.closePath();
      };
      drawCastShadow(ctx2, box, 4, 5, 0.055);
      box();
      ctx2.fillStyle = "rgba(211,48,42,0.9)";
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 2.4;
      ctx2.stroke();
      drawPencilRect(ctx2, -52, 0, 42, 24, 4, { fill: "rgba(245,237,218,0.78)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
      ctx2.fillStyle = level > 0.7 ? colorAlpha(red, 0.92) : ink;
      ctx2.font = "bold 9px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.fillText("MAIL", -31, 15);
      ctx2.fillStyle = colorAlpha(brass, 0.86);
      ctx2.beginPath();
      ctx2.moveTo(34, -36);
      ctx2.lineTo(58, -22 + level * 14);
      ctx2.lineTo(36, -8);
      ctx2.closePath();
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.stroke();
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      ctx2.fillStyle = colorAlpha(pressure, 0.16 + beat * 0.28);
      ctx2.fillRect(4, -5, 58, 23);
      ctx2.restore();
      drawGasStatePill(ctx2, level, state, 24, 8, 0.82, { w: 80, h: 26, fontSize: 10, caption: "GAS" });
      return;
    }
    if (icon === "floppy") {
      drawPencilRect(ctx2, -58, -58, 116, 116, 10, { fill: "rgba(82,93,150,0.82)", wash: 0.1, hatch: 0.045, spacing: 7, shadow: 0.045 });
      drawPencilRect(ctx2, -42, -44, 72, 34, 3, { fill: "rgba(42,45,50,0.76)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
      drawPencilRect(ctx2, -42, -2, 84, 46, 5, { fill: level >= 0.68 ? colorAlpha(pressure, 0.28 + beat * 0.18) : "rgba(246,223,157,0.82)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 2.2;
      ctx2.beginPath();
      ctx2.arc(-16, 18, 9, 0, Math.PI * 2);
      ctx2.moveTo(22, 10);
      ctx2.quadraticCurveTo(4, 34, -18, 32);
      ctx2.stroke();
      ctx2.shadowColor = colorAlpha(pressure, 0.14 + beat * 0.3);
      ctx2.shadowBlur = 4 + beat * 8;
      ctx2.fillStyle = colorAlpha(pressure, level >= 0.96 ? 0.98 : 0.78 + beat * 0.14);
      ctx2.fillRect(30, -38, 10, 24);
      ctx2.shadowBlur = 0;
      ctx2.fillStyle = level > 0.7 ? colorAlpha(red, 0.96) : ink;
      ctx2.font = "bold 13px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.fillText(gasLabelFor(level), 0, 23);
      return;
    }
    if (icon === "roadBarrier") {
      for (let row = 0; row < 2; row += 1) {
        const y = row ? 24 : -22;
        drawPencilRect(ctx2, -76, y - 12, 152, 24, 4, { fill: "rgba(22,24,25,0.88)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.4 });
        for (let i = -3; i <= 3; i += 1) {
          ctx2.save();
          ctx2.translate(i * 22, y);
          ctx2.rotate(-0.44);
          ctx2.fillStyle = colorAlpha(brass, 0.92);
          ctx2.fillRect(-6, -18, 12, 36);
          ctx2.restore();
        }
      }
      ctx2.strokeStyle = "rgba(121,72,32,0.86)";
      ctx2.lineWidth = 4;
      ctx2.beginPath();
      ctx2.moveTo(-58, 44);
      ctx2.lineTo(-82, 82);
      ctx2.moveTo(56, 44);
      ctx2.lineTo(82, 82);
      ctx2.stroke();
      drawPencilRect(ctx2, -35, -7, 70, 18, 4, {
        fill: level > 0.7 ? "rgba(214,52,40,0.68)" : "rgba(245,237,218,0.64)",
        wash: 0.03,
        hatch: 0.015,
        spacing: 5,
        lineWidth: 1.1
      });
      ctx2.fillStyle = level > 0.7 ? "rgba(255,244,204,0.92)" : ink;
      ctx2.font = "bold 10px ui-monospace, Menlo, monospace";
      ctx2.textAlign = "center";
      ctx2.shadowColor = colorAlpha(pressure, 0.2 + beat * 0.28);
      ctx2.shadowBlur = 3 + beat * 7;
      ctx2.fillText(gasLabelFor(level), 0, 2);
      ctx2.shadowBlur = 0;
      drawRivet(ctx2, -54, -22, 3.2);
      drawRivet(ctx2, 54, 24, 3.2);
      return;
    }
    if (icon === "trafficLight") {
      drawPencilRect(ctx2, -35, -86, 70, 172, 16, { fill: "rgba(28,82,70,0.86)", wash: 0.1, hatch: 0.05, spacing: 6, shadow: 0.05 });
      const lights = [
        { y: -60, color: "#ff2f2f", label: "E", lit: level >= 0.96 },
        { y: -20, color: "#ff8a22", label: "H", lit: level >= 0.68 && level < 0.96 },
        { y: 20, color: "#ffcf57", label: "M", lit: level >= 0.36 && level < 0.68 },
        { y: 60, color: "#48d27a", label: "L", lit: level < 0.36 }
      ];
      for (const light of lights) {
        const lightBeat = light.lit ? beat : beat * 0.22;
        ctx2.save();
        ctx2.shadowColor = colorAlpha(light.color, light.lit ? 0.18 + beat * 0.42 : 0.06 + beat * 0.08);
        ctx2.shadowBlur = light.lit ? 8 + beat * 16 : 2 + beat * 4;
        ctx2.fillStyle = colorAlpha(light.color, light.lit ? 0.82 + lightBeat * 0.18 : 0.22 + lightBeat * 0.12);
        ctx2.beginPath();
        ctx2.arc(0, light.y, 13.8 + (light.lit ? beat * 1.8 : 0), 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
        ctx2.strokeStyle = ink;
        ctx2.lineWidth = 1.8;
        ctx2.stroke();
        ctx2.fillStyle = light.lit ? "rgba(12,16,17,0.76)" : colorAlpha(light.color, 0.72);
        ctx2.font = "bold 7px ui-monospace, Menlo, monospace";
        ctx2.textAlign = "center";
        ctx2.textBaseline = "middle";
        ctx2.fillText(light.label, 0, light.y + 0.5);
        if (light.lit) {
          ctx2.save();
          ctx2.globalCompositeOperation = "lighter";
          ctx2.fillStyle = colorAlpha(light.color, 0.18 + beat * 0.3);
          ctx2.beginPath();
          ctx2.arc(0, light.y, 26 + beat * 8, 0, Math.PI * 2);
          ctx2.fill();
          ctx2.restore();
          ctx2.strokeStyle = colorAlpha(light.color, 0.42 + beat * 0.28);
          ctx2.lineWidth = 3.6 + beat * 2;
          ctx2.beginPath();
          ctx2.arc(0, light.y, 20 + beat * 2.4, 0, Math.PI * 2);
          ctx2.stroke();
        }
      }
      drawGasStatePill(ctx2, level, state, 0, 78, 0.7, { w: 78, h: 25, fontSize: 10 });
      return;
    }
    if (icon === "whaleVent") {
      const whale = () => {
        ctx2.beginPath();
        ctx2.moveTo(-70, 8);
        ctx2.bezierCurveTo(-34, -54, 56, -52, 78, 2);
        ctx2.quadraticCurveTo(48, 44, -24, 42);
        ctx2.quadraticCurveTo(-58, 38, -70, 8);
        ctx2.closePath();
      };
      drawCastShadow(ctx2, whale, 4, 5, 0.045);
      whale();
      ctx2.fillStyle = colorAlpha(liquid.accent, 0.68);
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 2.2;
      ctx2.stroke();
      ctx2.fillStyle = "rgba(255,255,255,0.38)";
      ctx2.beginPath();
      ctx2.ellipse(-22, -12, 22, 10, -0.25, 0, Math.PI * 2);
      ctx2.fill();
      ctx2.strokeStyle = colorAlpha(liquid.accent, 0.72);
      ctx2.lineWidth = 3;
      const pulse = Math.sin((state.time || 0) * (3 + level * 4)) * 8;
      roughBezier(ctx2, [[2, -42], [-18, -78 - pulse], [-44, -70], [-54, -102 - pulse]], 0.6, 2301);
      roughBezier(ctx2, [[8, -42], [24, -80 - pulse], [48, -72], [60, -104 - pulse]], 0.6, 2302);
      ctx2.beginPath();
      ctx2.arc(44, -8, 4, 0, Math.PI * 2);
      ctx2.fillStyle = ink;
      ctx2.fill();
      ctx2.fillStyle = level > 0.68 ? colorAlpha(pressure, 0.84) : colorAlpha(cyan, 0.72);
      ctx2.beginPath();
      ctx2.arc(6, -26, 7 + level * 4, 0, Math.PI * 2);
      ctx2.fill();
      drawPencilRect(ctx2, -30, 9, 82, 27, 8, { fill: "rgba(4,10,12,0.68)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1 });
      drawGasStatePill(ctx2, level, state, 12, 21, 0.82, { w: 80, h: 26, fontSize: 10, caption: "VENT" });
      return;
    }
    if (icon === "battery") {
      drawPencilRect(ctx2, -44, -62, 88, 124, 12, { fill: "rgba(202,232,232,0.76)", wash: 0.09, hatch: 0.04, spacing: 6, shadow: 0.04 });
      drawPencilRect(ctx2, -20, -78, 40, 18, 7, { fill: colorAlpha(brass, 0.7), wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
      const barColors = ["#48d27a", "#46c7d1", "#ffcf57", "#ff8a22", "#ff2f2f"];
      for (let i = 0; i < 5; i += 1) {
        const lit = i / 4 <= level;
        const barColor = barColors[i] || pressure;
        if (lit) {
          ctx2.save();
          ctx2.globalCompositeOperation = "lighter";
          ctx2.fillStyle = colorAlpha(barColor, 0.05 + beat * 0.16 + level * 0.05);
          ctx2.fillRect(-34, 32 - i * 22, 68, 20);
          ctx2.restore();
        }
        drawPencilRect(ctx2, -28, 36 - i * 22, 56, 12, 4, { fill: lit ? colorAlpha(barColor, Math.min(1, (level >= 0.68 ? 0.8 : 0.68) + beat * 0.2)) : "rgba(18,22,25,0.18)", wash: 0.02, hatch: 0.015, spacing: 5, lineWidth: 1 });
        if (lit && i >= 3) {
          ctx2.fillStyle = colorAlpha(barColor, 0.12 + beat * 0.18);
          ctx2.fillRect(-34, 32 - i * 22, 68, 20);
        }
      }
      drawGasStatePill(ctx2, level, state, 0, 68, 0.66, { w: 74, h: 25, fontSize: 10 });
      return;
    }
    if (icon === "gasCanister" || icon === "dragonFurnace") {
      const can = () => {
        ctx2.beginPath();
        ctx2.roundRect(-34, -72, 68, 132, 24);
      };
      if (level >= 0.68) {
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        ctx2.fillStyle = colorAlpha(pressure, 0.1 + beat * 0.18 + level * 0.08);
        ctx2.beginPath();
        ctx2.ellipse(0, -6, 56 + beat * 10, 90 + beat * 12, 0, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
      }
      can();
      ctx2.fillStyle = icon === "dragonFurnace" ? "rgba(88,45,32,0.82)" : "rgba(140,68,46,0.82)";
      ctx2.fill();
      ctx2.strokeStyle = ink;
      ctx2.lineWidth = 2.2;
      ctx2.stroke();
      drawPackUtilityPort(ctx2, 0, -42, 32, { color: brass, fill: "rgba(70,45,32,0.68)" });
      drawPencilRect(ctx2, -29, -20, 58, 48, 8, { fill: level > 0.75 ? colorAlpha(pressure, 0.78 + beat * 0.14) : colorAlpha(cyan, 0.46), wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
      drawGasStatePill(ctx2, level, state, 0, 6, 0.7, { w: 74, h: 25, fontSize: 10, caption: icon === "dragonFurnace" ? "BURN" : "GAS" });
      ctx2.strokeStyle = colorAlpha(brass, 0.82);
      ctx2.lineWidth = 3;
      roughBezier(ctx2, [[-18, -48], [6, -32], [8, 4], [-8, 36]], 0.5, 2402);
      return;
    }
    if (icon === "miniFan") {
      drawPencilRect(ctx2, -54, -54, 108, 108, 18, { fill: "rgba(235,226,207,0.82)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.04 });
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      ctx2.strokeStyle = colorAlpha(pressure, 0.12 + level * 0.18 + beat * 0.2);
      ctx2.lineWidth = 2 + level * 3;
      ctx2.setLineDash([10, 9 - Math.min(6, level * 6)]);
      const swirl = (state.time || 0) * (1.2 + level * 7);
      for (const r of [34, 48, 62]) {
        ctx2.beginPath();
        ctx2.arc(0, 0, r, swirl, swirl + Math.PI * (0.7 + level * 0.5));
        ctx2.stroke();
      }
      ctx2.setLineDash([]);
      ctx2.restore();
      ctx2.save();
      ctx2.rotate((state.time || 0) * (0.8 + level * 18));
      for (let i = 0; i < 4; i += 1) {
        ctx2.rotate(Math.PI / 2);
        ctx2.fillStyle = level >= 0.68 ? colorAlpha(pressure, 0.35 + beat * 0.2) : "rgba(18,22,25,0.55)";
        ctx2.beginPath();
        ctx2.ellipse(0, -24, 11, 31, 0.3, 0, Math.PI * 2);
        ctx2.fill();
      }
      ctx2.restore();
      drawRivet(ctx2, 0, 0, 6);
      drawGasStatePill(ctx2, level, state, 0, 54, 0.66, { w: 76, h: 24, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level) });
      return;
    }
    drawPackUtilityPort(ctx2, 0, -8, 38, { color: brass, fill: "rgba(30,42,42,0.66)" });
  } finally {
    if (part.liveGasMeter && !integratedGasIcons.has(icon)) {
      drawPackIconReaderBadge(ctx2, level, style, { ...state });
    }
    ctx2.restore();
  }
}
function drawBolt(ctx2, part) {
  setup(ctx2, part, 1.8, 0.82);
  const boltPath = () => {
    ctx2.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(angle) * 16;
      const y = Math.sin(angle) * 16;
      i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y);
    }
    ctx2.closePath();
  };
  drawCastShadow(ctx2, boltPath, 2.5, 3.5, 0.06);
  pencilShade(ctx2, boltPath, { x: -17, y: -17, w: 34, h: 34 }, { wash: 0.14, hatch: 0.07, cross: 0.03, spacing: 5 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.8;
  boltPath();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, 5, 0, Math.PI * 2);
  ctx2.stroke();
}
function drawDot(ctx2, part) {
  ctx2.fillStyle = INK;
  ctx2.beginPath();
  ctx2.arc(0, 0, 5, 0, Math.PI * 2);
  ctx2.fill();
}
function drawChain(ctx2, part) {
  setup(ctx2, part, 2, 0.7);
  for (let i = -4; i <= 4; i++) {
    ctx2.save();
    ctx2.translate(3, 4);
    ctx2.strokeStyle = "rgba(0,0,0,0.08)";
    ctx2.lineWidth = 5;
    ctx2.beginPath();
    ctx2.ellipse(i * 18, 0, 14, 8, i % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.restore();
    ctx2.strokeStyle = INK;
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.ellipse(i * 18, 0, 14, 8, i % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
    ctx2.stroke();
  }
}
function drawValve(ctx2, part, state) {
  drawStraightPipe(ctx2, part, state);
  setup(ctx2, part, 2, 0.82);
  const knob = () => {
    ctx2.beginPath();
    ctx2.arc(0, -48, 26, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, knob, 3, 5, 0.06);
  pencilShade(ctx2, knob, { x: -28, y: -76, w: 56, h: 56 }, { wash: 0.11, hatch: 0.065, cross: 0.025, spacing: 6 });
  ctx2.beginPath();
  ctx2.arc(0, -48, 26, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(-20, -48);
  ctx2.lineTo(20, -48);
  ctx2.moveTo(0, -68);
  ctx2.lineTo(0, -28);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(0, -18);
  ctx2.lineTo(0, -48);
  ctx2.stroke();
}
function drawCoil(ctx2, part) {
  setup(ctx2, part, 2, 0.82);
  drawPencilRect(ctx2, -30, -90, 60, 180, 8, { wash: 0.13, hatch: 0.075, cross: 0.03, spacing: 6, shadow: 0.065 });
  for (let y = -70; y <= 70; y += 18) {
    ctx2.save();
    ctx2.translate(3, 4);
    ctx2.strokeStyle = "rgba(0,0,0,0.08)";
    ctx2.lineWidth = 6;
    ctx2.beginPath();
    ctx2.moveTo(-42, y);
    ctx2.bezierCurveTo(-10, y - 16, 10, y + 16, 42, y);
    ctx2.stroke();
    ctx2.restore();
    ctx2.strokeStyle = INK;
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(-42, y);
    ctx2.bezierCurveTo(-10, y - 16, 10, y + 16, 42, y);
    ctx2.stroke();
  }
  drawConnectorMark(ctx2, 0, 100);
}
function drawLiquidDrop(ctx2, part, state) {
  const theme = liquidTheme(state);
  setup(ctx2, part, 1.8, 0.7);
  ctx2.strokeStyle = colorAlpha(theme.accent, 0.82);
  const dropPath = () => {
    ctx2.beginPath();
    ctx2.moveTo(0, -26);
    ctx2.bezierCurveTo(28, 8, 18, 38, 0, 38);
    ctx2.bezierCurveTo(-18, 38, -28, 8, 0, -26);
  };
  drawCastShadow(ctx2, dropPath, 3, 4, 0.05);
  const gradient = ctx2.createRadialGradient(-9, -8, 2, 0, 9, 42);
  gradient.addColorStop(0, "rgba(255,255,255,0.58)");
  gradient.addColorStop(0.32, colorAlpha(theme.accent, 0.42));
  gradient.addColorStop(0.62, colorAlpha(theme.base, 0.5));
  gradient.addColorStop(1, "rgba(18,22,25,0.16)");
  ctx2.fillStyle = gradient;
  dropPath();
  ctx2.fill();
  ctx2.save();
  dropPath();
  ctx2.clip();
  drawLiquidInnerArt(ctx2, -18, theme, { ...state, fillLevel: 80 }, { x: -28, y: -28, w: 56, h: 70 });
  ctx2.restore();
  pencilShade(ctx2, dropPath, { x: -28, y: -28, w: 56, h: 70 }, { wash: 0.035, hatch: 0.018, cross: 0, spacing: 7, texture: 0.025 });
  dropPath();
  ctx2.stroke();
}
function drawSmokeCurl(ctx2, part) {
  setup(ctx2, part, 2, 0.58);
  ctx2.strokeStyle = "rgba(18,22,25,0.2)";
  ctx2.lineWidth = 6;
  ctx2.beginPath();
  ctx2.moveTo(-18, 28);
  ctx2.bezierCurveTo(-44, 0, 22, -4, -12, -34);
  ctx2.bezierCurveTo(-32, -55, 38, -56, 10, -84);
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.36)";
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(-20, 27);
  ctx2.bezierCurveTo(-40, 2, 18, -6, -9, -32);
  ctx2.bezierCurveTo(-27, -52, 32, -54, 8, -82);
  ctx2.stroke();
}
function drawSpark(ctx2, part) {
  setup(ctx2, part, 1.8, 0.74);
  const spark = () => {
    ctx2.beginPath();
    ctx2.moveTo(0, -34);
    ctx2.lineTo(8, -8);
    ctx2.lineTo(34, 0);
    ctx2.lineTo(8, 8);
    ctx2.lineTo(0, 34);
    ctx2.lineTo(-8, 8);
    ctx2.lineTo(-34, 0);
    ctx2.lineTo(-8, -8);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, spark, 2, 3, 0.04);
  pencilShade(ctx2, spark, { x: -34, y: -34, w: 68, h: 68 }, { wash: 0.08, hatch: 0.04, cross: 0.015, spacing: 7 });
  ctx2.strokeStyle = INK;
  ctx2.beginPath();
  spark();
  ctx2.stroke();
}
function drawFrameBox(ctx2, part) {
  const style = setup(ctx2, part, 1.4, 0.28);
  const isDarkFrame = part.material === "pfpBlack" || part.material === "blackChrome";
  ctx2.fillStyle = isDarkFrame ? "rgba(23,58,57,0.3)" : colorAlpha(style.fill || "#cad3d4", 0.28);
  ctx2.fillRect(-64, -64, 128, 128);
  if (isDarkFrame) {
    const wash = ctx2.createLinearGradient(-64, -64, 64, 64);
    wash.addColorStop(0, "rgba(255,255,255,0.1)");
    wash.addColorStop(0.58, "rgba(32,91,88,0.08)");
    wash.addColorStop(1, "rgba(4,18,18,0.16)");
    ctx2.fillStyle = wash;
    ctx2.fillRect(-64, -64, 128, 128);
  }
  ctx2.strokeRect(-64, -64, 128, 128);
  ctx2.strokeStyle = "rgba(255,255,255,0.18)";
  ctx2.lineWidth = 0.9;
  ctx2.strokeRect(-56, -56, 112, 112);
}
function drawCrownGear(ctx2, part, state) {
  drawGear(ctx2, part, state, 66, 34);
  setup(ctx2, part, 1.6, 0.7);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    ctx2.save();
    ctx2.rotate(angle);
    const tooth = () => {
      ctx2.beginPath();
      ctx2.moveTo(58, -7);
      ctx2.lineTo(84, 0);
      ctx2.lineTo(58, 7);
      ctx2.closePath();
    };
    pencilShade(ctx2, tooth, { x: 54, y: -10, w: 32, h: 20 }, { wash: 0.08, hatch: 0.045, cross: 0.015, spacing: 5 });
    tooth();
    ctx2.stroke();
    ctx2.restore();
  }
}
function drawMercuryTank(ctx2, part, state = {}) {
  drawTank(ctx2, part, {
    ...state,
    colorIndex: 5,
    liquidColor: LIQUID_PALETTE[5],
    liquidAccent: LIQUID_ACCENTS[5],
    liquidGlow: LIQUID_GLOWS[5],
    texture: state.texture || "Metallic",
    fillLevel: state.fillLevel ?? 82
  });
  setup(ctx2, part, 1.4, 0.58);
  ctx2.strokeStyle = "rgba(18,22,25,0.36)";
  for (let i = 0; i < 5; i++) {
    const y = -34 + i * 18;
    ctx2.beginPath();
    ctx2.ellipse(0, y, 24 - i * 2, 8, Math.sin((state.time || 0) + i) * 0.25, 0, Math.PI * 2);
    ctx2.stroke();
  }
}
function drawGhostPipe(ctx2, part, state) {
  setup(ctx2, part, 1.9, 0.74);
  ctx2.save();
  ctx2.translate(5, 7);
  ctx2.strokeStyle = "rgba(0,0,0,0.06)";
  ctx2.lineWidth = 38;
  ctx2.beginPath();
  ctx2.moveTo(-72, 16);
  ctx2.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.16)";
  ctx2.lineWidth = 34;
  ctx2.beginPath();
  ctx2.moveTo(-72, 16);
  ctx2.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx2.stroke();
  drawHatching(ctx2, { x: -82, y: -48, w: 164, h: 86 }, -0.7, 9, 0.05, 0.65);
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(-72, 16);
  ctx2.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(-56, 16);
  ctx2.bezierCurveTo(-30, -16, 22, -16, 56, 10);
  ctx2.stroke();
  drawPencilRect(ctx2, -82, 4, 26, 34, 5, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawPencilRect(ctx2, 56, -6, 26, 34, 5, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawFlowLine(ctx2, -54, 16, 54, 10, state);
  drawConnectorMark(ctx2, -76, 16);
  drawConnectorMark(ctx2, 76, 10);
}
function drawCompactSpring(ctx2, part) {
  setup(ctx2, part, 1.8, 0.72);
  ctx2.save();
  ctx2.translate(4, 5);
  ctx2.strokeStyle = "rgba(0,0,0,0.07)";
  ctx2.lineWidth = 7;
  for (let x = -62; x <= 62; x += 14) {
    ctx2.beginPath();
    ctx2.ellipse(x, 0, 12, 19, Math.PI / 2, 0, Math.PI * 2);
    ctx2.stroke();
  }
  ctx2.restore();
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.8;
  for (let x = -62; x <= 62; x += 14) {
    ctx2.beginPath();
    ctx2.ellipse(x, 0, 12, 19, Math.PI / 2, 0, Math.PI * 2);
    ctx2.stroke();
  }
  roughLine(ctx2, -86, 0, -66, 0, 0.8, 5, 9);
  roughLine(ctx2, 66, 0, 86, 0, 0.8, 5, 19);
}
function drawCornerBracket(ctx2, part) {
  setup(ctx2, part, 1.8, 0.78);
  const bracket = () => {
    ctx2.beginPath();
    ctx2.moveTo(-60, -44);
    ctx2.lineTo(36, -44);
    ctx2.lineTo(36, -20);
    ctx2.lineTo(-32, -20);
    ctx2.lineTo(-32, 48);
    ctx2.lineTo(-60, 48);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, bracket, 4, 6, 0.055);
  pencilShade(ctx2, bracket, { x: -62, y: -46, w: 102, h: 98 }, { wash: 0.11, hatch: 0.07, cross: 0.025, spacing: 6 });
  bracket();
  ctx2.stroke();
  for (const [x, y] of [[-46, -32], [20, -32], [-46, 34], [-46, 0]]) drawRivet(ctx2, x, y, 3.2);
}
function drawRivetStrip(ctx2, part) {
  setup(ctx2, part, 1.5, 0.7);
  drawPencilRect(ctx2, -82, -14, 164, 28, 5, { wash: 0.095, hatch: 0.055, cross: 0.018, spacing: 6, shadow: 0.045 });
  for (let x = -60; x <= 60; x += 24) drawRivet(ctx2, x, 0, 4);
}
function drawClockHand(ctx2, part) {
  setup(ctx2, part, 1.5, 0.78);
  const hand = () => {
    ctx2.beginPath();
    ctx2.moveTo(-16, -5);
    ctx2.lineTo(74, -3);
    ctx2.lineTo(88, 0);
    ctx2.lineTo(74, 3);
    ctx2.lineTo(-16, 5);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, hand, 3, 4, 0.045);
  pencilShade(ctx2, hand, { x: -18, y: -8, w: 108, h: 16 }, { wash: 0.09, hatch: 0.05, cross: 0.01, spacing: 5 });
  hand();
  ctx2.stroke();
  roughCircle(ctx2, -16, 0, 9, 0.7, 34);
  roughCircle(ctx2, 26, 0, 3, 0.4, 35);
}
function drawGearToothShard(ctx2, part) {
  setup(ctx2, part, 1.6, 0.76);
  const shard = () => {
    ctx2.beginPath();
    ctx2.moveTo(-32, 28);
    ctx2.lineTo(-10, -30);
    ctx2.lineTo(14, -10);
    ctx2.lineTo(34, -34);
    ctx2.lineTo(28, 28);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, shard, 3, 4, 0.045);
  pencilShade(ctx2, shard, { x: -34, y: -36, w: 70, h: 66 }, { wash: 0.12, hatch: 0.075, cross: 0.03, spacing: 6 });
  shard();
  ctx2.stroke();
  roughLine(ctx2, -18, 18, 22, 18, 0.8, 8, 52);
}
function drawGraphiteMark(ctx2, part) {
  setup(ctx2, part, 1.2, 0.42);
  ctx2.strokeStyle = "rgba(18,22,25,0.26)";
  for (let i = 0; i < 7; i++) {
    roughBezier(ctx2, [
      [-52 + i * 4, 16 - i * 3],
      [-24, -20 - i],
      [28, -18 + i],
      [58 - i * 3, 12 + i * 2]
    ], 1.8, 80 + i * 17);
  }
}
function drawLightningArc(ctx2, part) {
  setup(ctx2, part, 1.5, 0.72);
  const arc = () => {
    ctx2.beginPath();
    ctx2.moveTo(-58, 12);
    ctx2.lineTo(-26, -24);
    ctx2.lineTo(-6, -8);
    ctx2.lineTo(22, -38);
    ctx2.lineTo(10, -6);
    ctx2.lineTo(54, -12);
  };
  ctx2.strokeStyle = "rgba(18,22,25,0.16)";
  ctx2.lineWidth = 7;
  arc();
  ctx2.stroke();
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.5;
  arc();
  ctx2.stroke();
}
function drawApertureLens(ctx2, part) {
  setup(ctx2, part, 1.8, 0.8);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 48, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 4, 5, 0.055);
  pencilShade(ctx2, outer, { x: -50, y: -50, w: 100, h: 100 }, { wash: 0.11, hatch: 0.055, cross: 0.02, spacing: 7 });
  outer();
  ctx2.stroke();
  roughCircle(ctx2, 0, 0, 28, 0.8, 22);
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    ctx2.save();
    ctx2.rotate(angle);
    ctx2.beginPath();
    ctx2.moveTo(8, -6);
    ctx2.lineTo(34, -18);
    ctx2.lineTo(28, 10);
    ctx2.closePath();
    ctx2.stroke();
    ctx2.restore();
  }
}
function drawNotchedRail(ctx2, part) {
  setup(ctx2, part, 1.7, 0.76);
  drawPencilRect(ctx2, -96, -18, 192, 36, 4, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 7, shadow: 0.045 });
  for (let x = -72; x <= 72; x += 24) {
    roughLine(ctx2, x, -16, x + 10, 16, 0.8, 5, x + 200);
  }
}
function drawSamuraiKabuto(ctx2, part) {
  const style = setup(ctx2, part, 2, 0.82);
  const gold = style.highlight || "#d7a13a";
  const shellFill = colorAlpha(style.fill || "#24282a", 0.9);
  const brim = () => {
    ctx2.beginPath();
    ctx2.moveTo(-152, 26);
    ctx2.quadraticCurveTo(-96, -4, -52, 8);
    ctx2.quadraticCurveTo(0, 18, 54, 6);
    ctx2.quadraticCurveTo(102, -4, 154, 28);
    ctx2.lineTo(124, 44);
    ctx2.quadraticCurveTo(48, 34, 0, 40);
    ctx2.quadraticCurveTo(-54, 34, -126, 44);
    ctx2.closePath();
  };
  const bowl = () => {
    ctx2.beginPath();
    ctx2.moveTo(-84, 28);
    ctx2.bezierCurveTo(-74, -48, -28, -78, 0, -80);
    ctx2.bezierCurveTo(34, -78, 76, -48, 86, 28);
    ctx2.quadraticCurveTo(34, 52, 0, 48);
    ctx2.quadraticCurveTo(-38, 52, -84, 28);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, brim, 4, 7, 0.06);
  brim();
  ctx2.fillStyle = colorAlpha(gold, 0.74);
  ctx2.fill();
  pencilShade(ctx2, brim, { x: -154, y: -6, w: 308, h: 54 }, { wash: 0.12, hatch: 0.065, cross: 0.02, spacing: 7, texture: 0.04 });
  ctx2.strokeStyle = "rgba(55,35,14,0.82)";
  ctx2.lineWidth = 2.2;
  brim();
  ctx2.stroke();
  drawCastShadow(ctx2, bowl, 3, 5, 0.055);
  bowl();
  ctx2.fillStyle = shellFill;
  ctx2.fill();
  pencilShade(ctx2, bowl, { x: -88, y: -84, w: 176, h: 136 }, { wash: 0.16, hatch: 0.09, cross: 0.032, spacing: 7, texture: 0.065 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.2;
  bowl();
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = colorAlpha(gold, 0.74);
  ctx2.lineWidth = 3.2;
  roughBezier(ctx2, [[0, -72], [-10, -24], [-8, 18], [0, 42]], 0.5, 701);
  roughBezier(ctx2, [[-46, -36], [-26, -54], [28, -54], [50, -34]], 0.55, 702);
  ctx2.restore();
  for (let i = 0; i < 4; i += 1) {
    const y = 34 + i * 15;
    const w = 94 + i * 26;
    const guard = () => {
      ctx2.beginPath();
      ctx2.moveTo(-w, y - 8);
      ctx2.quadraticCurveTo(-44, y + 12, 0, y + 8);
      ctx2.quadraticCurveTo(48, y + 12, w, y - 8);
      ctx2.lineTo(w - 10, y + 9);
      ctx2.quadraticCurveTo(42, y + 24, 0, y + 20);
      ctx2.quadraticCurveTo(-42, y + 24, -w + 10, y + 9);
      ctx2.closePath();
    };
    guard();
    ctx2.fillStyle = i % 2 ? colorAlpha(gold, 0.52) : "rgba(23,29,28,0.78)";
    ctx2.fill();
    pencilShade(ctx2, guard, { x: -w, y: y - 10, w: w * 2, h: 34 }, { wash: 0.09, hatch: 0.048, cross: 0.014, spacing: 7, texture: 0.032 });
    ctx2.strokeStyle = i % 2 ? "rgba(98,61,14,0.74)" : "rgba(18,22,25,0.78)";
    ctx2.lineWidth = 1.45;
    guard();
    ctx2.stroke();
    for (let x = -w + 26; x <= w - 20; x += 32) drawRivet(ctx2, x, y + 5, 2.4);
  }
  ctx2.save();
  ctx2.strokeStyle = colorAlpha(gold, 0.88);
  ctx2.lineWidth = 4.2;
  roughBezier(ctx2, [[-11, -67], [-48, -92], [-82, -86], [-104, -58]], 0.7, 703);
  roughBezier(ctx2, [[11, -67], [48, -92], [82, -86], [104, -58]], 0.7, 704);
  ctx2.lineWidth = 2.2;
  roughBezier(ctx2, [[0, -82], [-16, -108], [0, -124], [18, -106]], 0.6, 705);
  ctx2.restore();
  drawRivet(ctx2, 0, -22, 5.4);
  for (const x of [-122, 122, -68, 68]) drawRivet(ctx2, x, 32, 3.2);
}
function drawKatanaPeek(ctx2, part) {
  const style = setup(ctx2, part, 1.6, 0.82);
  const steel = style.highlight || "#d9e4df";
  ctx2.rotate(-0.34);
  const blade = () => {
    ctx2.beginPath();
    ctx2.moveTo(-8, -132);
    ctx2.bezierCurveTo(-22, -94, -20, -54, -8, -20);
    ctx2.lineTo(10, 42);
    ctx2.lineTo(22, 40);
    ctx2.bezierCurveTo(10, -24, 8, -82, 10, -132);
    ctx2.quadraticCurveTo(1, -148, -8, -132);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, blade, 3, 5, 0.05);
  blade();
  const bladeFill = ctx2.createLinearGradient(-18, -126, 24, 42);
  bladeFill.addColorStop(0, "rgba(247,252,241,0.82)");
  bladeFill.addColorStop(0.46, colorAlpha(steel, 0.64));
  bladeFill.addColorStop(1, "rgba(129,151,142,0.68)");
  ctx2.fillStyle = bladeFill;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.66)";
  ctx2.lineWidth = 1.8;
  blade();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.48)";
  ctx2.lineWidth = 1;
  roughBezier(ctx2, [[-1, -118], [-7, -74], [-4, -28], [10, 36]], 0.35, 711);
  ctx2.save();
  ctx2.translate(12, 54);
  ctx2.rotate(0.22);
  drawPencilRect(ctx2, -42, -9, 84, 18, 8, { fill: colorAlpha("#d7a13a", 0.78), wash: 0.08, hatch: 0.04, cross: 0.01, spacing: 5, shadow: 0.025, lineWidth: 1.3 });
  drawRivet(ctx2, -22, 0, 2.6);
  drawRivet(ctx2, 22, 0, 2.6);
  ctx2.restore();
  const handle = () => {
    ctx2.beginPath();
    ctx2.roundRect(-14, 66, 28, 112, 8);
  };
  handle();
  ctx2.fillStyle = "rgba(22,24,25,0.88)";
  ctx2.fill();
  pencilShade(ctx2, handle, { x: -14, y: 66, w: 28, h: 112 }, { wash: 0.09, hatch: 0.045, cross: 0.015, spacing: 5, texture: 0.03 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.7;
  handle();
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha("#d7a13a", 0.82);
  ctx2.lineWidth = 1.5;
  for (let y = 76; y <= 160; y += 14) {
    roughLine(ctx2, -12, y, 12, y + 8, 0.35, 4, 720 + y);
    roughLine(ctx2, 12, y, -12, y + 8, 0.35, 4, 820 + y);
  }
  drawRivet(ctx2, 0, 182, 3.2);
}
function drawLampBulbHead(ctx2, part) {
  setup(ctx2, part, 2, 0.78);
  const bulb = () => {
    ctx2.beginPath();
    ctx2.moveTo(0, -118);
    ctx2.bezierCurveTo(-74, -112, -116, -56, -108, 12);
    ctx2.bezierCurveTo(-102, 62, -58, 84, -34, 104);
    ctx2.lineTo(-28, 126);
    ctx2.lineTo(28, 126);
    ctx2.lineTo(34, 104);
    ctx2.bezierCurveTo(58, 84, 102, 62, 108, 12);
    ctx2.bezierCurveTo(116, -56, 74, -112, 0, -118);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, bulb, 5, 8, 0.05);
  bulb();
  const glass = ctx2.createRadialGradient(-26, -42, 6, 0, 8, 130);
  glass.addColorStop(0, "rgba(255,255,205,0.5)");
  glass.addColorStop(0.46, "rgba(126,232,212,0.18)");
  glass.addColorStop(1, "rgba(30,82,78,0.12)");
  ctx2.fillStyle = glass;
  ctx2.fill();
  pencilShade(ctx2, bulb, { x: -112, y: -122, w: 224, h: 250 }, { wash: 0.045, hatch: 0.018, cross: 6e-3, spacing: 10, texture: 0.018 });
  ctx2.strokeStyle = "rgba(16,22,22,0.72)";
  ctx2.lineWidth = 2.2;
  bulb();
  ctx2.stroke();
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.strokeStyle = "rgba(255,230,96,0.72)";
  ctx2.lineWidth = 5;
  roughBezier(ctx2, [[-44, 26], [-24, -10], [-10, 34], [0, 8]], 0.55, 910);
  roughBezier(ctx2, [[0, 8], [16, -16], [24, 34], [44, 20]], 0.55, 911);
  ctx2.strokeStyle = "rgba(255,255,198,0.46)";
  ctx2.lineWidth = 2;
  roughBezier(ctx2, [[-36, 44], [-18, 18], [18, 18], [36, 44]], 0.4, 912);
  ctx2.restore();
  ctx2.strokeStyle = "rgba(215,161,58,0.84)";
  ctx2.lineWidth = 2.4;
  roughLine(ctx2, -32, 90, -12, 44, 0.4, 5, 913);
  roughLine(ctx2, 32, 90, 12, 44, 0.4, 5, 914);
  for (let i = 0; i < 5; i += 1) {
    const y = 112 + i * 16;
    drawPencilRect(ctx2, -52 + i % 2 * 4, y, 104 - i % 2 * 8, 13, 5, {
      fill: i % 2 ? "rgba(188,136,44,0.78)" : "rgba(219,172,64,0.86)",
      wash: 0.07,
      hatch: 0.035,
      cross: 0.012,
      spacing: 5,
      shadow: 0.025,
      lineWidth: 1.2
    });
  }
  drawRivet(ctx2, -78, 30, 3);
  drawRivet(ctx2, 78, 30, 3);
}
function drawFrankensteinMonsterHead(ctx2, part) {
  setup(ctx2, part, 2.1, 0.82);
  const head = () => {
    ctx2.beginPath();
    ctx2.moveTo(-84, -112);
    ctx2.lineTo(82, -108);
    ctx2.lineTo(92, 54);
    ctx2.quadraticCurveTo(54, 106, 0, 108);
    ctx2.quadraticCurveTo(-58, 106, -94, 52);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, head, 5, 7, 0.055);
  head();
  ctx2.fillStyle = "rgba(86,138,77,0.86)";
  ctx2.fill();
  pencilShade(ctx2, head, { x: -96, y: -116, w: 192, h: 226 }, { wash: 0.13, hatch: 0.07, cross: 0.026, spacing: 7, texture: 0.06 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.3;
  head();
  ctx2.stroke();
  drawPencilRect(ctx2, -88, -122, 176, 28, 5, { fill: "rgba(18,22,25,0.9)", wash: 0.07, hatch: 0.035, spacing: 5, shadow: 0.03, lineWidth: 1.5 });
  drawPencilRect(ctx2, -80, -38, 160, 24, 6, { fill: "rgba(18,22,25,0.7)", wash: 0.04, hatch: 0.02, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  ctx2.strokeStyle = "rgba(18,22,25,0.74)";
  ctx2.lineWidth = 2;
  roughBezier(ctx2, [[-52, -76], [-32, -58], [-12, -82], [12, -58]], 0.55, 930);
  roughBezier(ctx2, [[18, -58], [36, -82], [58, -66], [74, -84]], 0.55, 931);
  for (let x = -38; x <= 54; x += 18) {
    roughLine(ctx2, x, -72, x + 8, -60, 0.3, 3, 940 + x);
  }
  for (const [x, y, rot] of [[-112, 10, 1.5708], [112, 10, 1.5708]]) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(rot);
    drawPencilRect(ctx2, -28, -9, 56, 18, 7, { fill: "rgba(210,196,166,0.78)", wash: 0.06, hatch: 0.03, spacing: 5, shadow: 0.025, lineWidth: 1.3 });
    ctx2.restore();
  }
  drawPencilRect(ctx2, -48, 90, 96, 28, 8, { fill: "rgba(18,22,25,0.58)", wash: 0.06, hatch: 0.03, spacing: 6, shadow: 0.025, lineWidth: 1.2 });
  drawRivet(ctx2, -72, -92, 3.4);
  drawRivet(ctx2, 72, -88, 3.4);
  drawRivet(ctx2, -70, 58, 3.2);
  drawRivet(ctx2, 70, 58, 3.2);
}
function drawSpacemanHelmetHead(ctx2, part) {
  setup(ctx2, part, 2.2, 0.78);
  const ring = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 114, 124, -0.04, 0, Math.PI * 2);
  };
  const visor = () => {
    ctx2.beginPath();
    ctx2.moveTo(-76, -34);
    ctx2.bezierCurveTo(-46, -74, 48, -76, 82, -30);
    ctx2.lineTo(72, 34);
    ctx2.bezierCurveTo(28, 60, -40, 58, -74, 26);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, ring, 5, 7, 0.045);
  ring();
  ctx2.fillStyle = "rgba(201,238,232,0.28)";
  ctx2.fill();
  pencilShade(ctx2, ring, { x: -116, y: -126, w: 232, h: 252 }, { wash: 0.045, hatch: 0.018, cross: 6e-3, spacing: 10, texture: 0.02 });
  ctx2.strokeStyle = "rgba(18,22,25,0.58)";
  ctx2.lineWidth = 2.4;
  ring();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.ellipse(0, 0, 98, 106, -0.04, 0, Math.PI * 2);
  ctx2.strokeStyle = "rgba(215,161,58,0.78)";
  ctx2.lineWidth = 6;
  ctx2.stroke();
  visor();
  const visorFill = ctx2.createLinearGradient(-70, -70, 80, 52);
  visorFill.addColorStop(0, "rgba(5,16,18,0.86)");
  visorFill.addColorStop(0.5, "rgba(12,55,58,0.76)");
  visorFill.addColorStop(1, "rgba(8,12,13,0.9)");
  ctx2.fillStyle = visorFill;
  ctx2.fill();
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.2;
  visor();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.42)";
  ctx2.lineWidth = 2;
  roughBezier(ctx2, [[-58, -50], [-22, -68], [30, -66], [62, -38]], 0.35, 950);
  roughBezier(ctx2, [[-52, -22], [-16, -34], [34, -34], [58, -16]], 0.3, 951);
  for (const [x, y] of [[-116, 0], [116, 2]]) {
    drawPencilRect(ctx2, x - 18, y - 38, 36, 76, 9, { fill: "rgba(221,234,230,0.62)", wash: 0.06, hatch: 0.025, spacing: 6, shadow: 0.025, lineWidth: 1.3 });
  }
  drawPencilRect(ctx2, -74, 102, 148, 32, 11, { fill: "rgba(218,223,208,0.76)", wash: 0.07, hatch: 0.032, spacing: 6, shadow: 0.025, lineWidth: 1.4 });
  for (const x of [-70, -35, 0, 35, 70]) drawRivet(ctx2, x, 116, 3);
}
function drawOldComputerCrtHead(ctx2, part) {
  setup(ctx2, part, 2, 0.82);
  const body = () => {
    ctx2.beginPath();
    ctx2.moveTo(-120, -100);
    ctx2.lineTo(102, -112);
    ctx2.quadraticCurveTo(132, -92, 130, -50);
    ctx2.lineTo(120, 88);
    ctx2.quadraticCurveTo(100, 120, 58, 124);
    ctx2.lineTo(-88, 112);
    ctx2.quadraticCurveTo(-130, 96, -134, 56);
    ctx2.lineTo(-134, -56);
    ctx2.quadraticCurveTo(-134, -86, -120, -100);
    ctx2.closePath();
  };
  const screen = () => {
    ctx2.beginPath();
    ctx2.roundRect(-82, -58, 142, 88, 13);
  };
  drawCastShadow(ctx2, body, 5, 7, 0.055);
  body();
  const shell = ctx2.createLinearGradient(-132, -112, 132, 124);
  shell.addColorStop(0, "rgba(232,228,203,0.92)");
  shell.addColorStop(0.46, "rgba(178,181,162,0.88)");
  shell.addColorStop(1, "rgba(114,120,112,0.84)");
  ctx2.fillStyle = shell;
  ctx2.fill();
  pencilShade(ctx2, body, { x: -130, y: -112, w: 260, h: 236 }, { wash: 0.12, hatch: 0.06, cross: 0.02, spacing: 7, texture: 0.055 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.3;
  body();
  ctx2.stroke();
  drawPencilRect(ctx2, -98, -74, 174, 120, 16, {
    fill: "rgba(78,86,82,0.72)",
    wash: 0.07,
    hatch: 0.034,
    spacing: 6,
    shadow: 0.03,
    lineWidth: 1.5
  });
  screen();
  const glass = ctx2.createRadialGradient(-28, -22, 7, -4, -12, 96);
  glass.addColorStop(0, "rgba(20,46,43,0.96)");
  glass.addColorStop(0.48, "rgba(4,11,12,0.94)");
  glass.addColorStop(1, "rgba(0,0,0,0.98)");
  ctx2.fillStyle = glass;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(12,16,17,0.82)";
  ctx2.lineWidth = 2.4;
  screen();
  ctx2.stroke();
  ctx2.save();
  screen();
  ctx2.clip();
  ctx2.fillStyle = "rgba(0,0,0,0.18)";
  ctx2.fillRect(-82, -58, 142, 88);
  ctx2.strokeStyle = "rgba(104,255,220,0.14)";
  ctx2.lineWidth = 1;
  for (let y = -48; y <= 18; y += 10) roughLine(ctx2, -74, y, 50, y + 1, 0.25, 5, 970 + y);
  ctx2.strokeStyle = "rgba(255,255,255,0.16)";
  roughLine(ctx2, -68, -44, 44, -50, 0.24, 4, 976);
  ctx2.restore();
  drawPencilRect(ctx2, 70, -48, 36, 90, 7, { fill: "rgba(152,158,148,0.76)", wash: 0.07, hatch: 0.032, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  for (let y = -31; y <= 13; y += 11) roughLine(ctx2, 76, y, 100, y, 0.25, 4, 980 + y);
  for (const [x, y] of [[86, 48], [102, 58], [74, 62]]) drawRivet(ctx2, x, y, 3.1);
  drawPencilRect(ctx2, -78, 70, 168, 28, 7, { fill: "rgba(28,32,32,0.82)", wash: 0.04, hatch: 0.02, spacing: 5, shadow: 0.025, lineWidth: 1.2 });
  drawPencilRect(ctx2, -60, 96, 126, 22, 6, { fill: "rgba(179,181,165,0.72)", wash: 0.055, hatch: 0.024, spacing: 5, shadow: 0.02, lineWidth: 1.1 });
  for (const x of [-96, -34, 30, 94]) drawRivet(ctx2, x, -88, 3.2);
  for (const x of [-86, -28, 34, 92]) drawRivet(ctx2, x, 92, 2.8);
}
function drawGameboyDmgHead(ctx2, part) {
  setup(ctx2, part, 2.05, 0.82);
  const body = () => {
    ctx2.beginPath();
    ctx2.moveTo(-86, -118);
    ctx2.lineTo(82, -118);
    ctx2.quadraticCurveTo(104, -112, 106, -88);
    ctx2.lineTo(100, 104);
    ctx2.quadraticCurveTo(92, 128, 64, 132);
    ctx2.lineTo(-52, 132);
    ctx2.quadraticCurveTo(-86, 126, -92, 92);
    ctx2.lineTo(-96, -88);
    ctx2.quadraticCurveTo(-98, -110, -86, -118);
    ctx2.closePath();
  };
  const screenBezel = () => {
    ctx2.beginPath();
    ctx2.moveTo(-74, -90);
    ctx2.lineTo(78, -98);
    ctx2.lineTo(68, 4);
    ctx2.quadraticCurveTo(6, 22, -78, 6);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, body, 5, 7, 0.055);
  body();
  ctx2.fillStyle = "rgba(205,200,176,0.9)";
  ctx2.fill();
  pencilShade(ctx2, body, { x: -98, y: -122, w: 204, h: 258 }, { wash: 0.11, hatch: 0.052, cross: 0.018, spacing: 7, texture: 0.05 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.2;
  body();
  ctx2.stroke();
  screenBezel();
  ctx2.fillStyle = "rgba(28,32,32,0.84)";
  ctx2.fill();
  ctx2.strokeStyle = "rgba(12,16,17,0.76)";
  ctx2.lineWidth = 1.8;
  screenBezel();
  ctx2.stroke();
  drawPencilRect(ctx2, -44, -68, 88, 54, 6, {
    fill: "rgba(62,245,206,0.28)",
    wash: 0.04,
    hatch: 0.018,
    spacing: 6,
    shadow: 0.02,
    lineWidth: 1.2
  });
  ctx2.save();
  ctx2.strokeStyle = "rgba(104,255,220,0.16)";
  ctx2.lineWidth = 1;
  for (let y = -62; y <= -18; y += 10) roughLine(ctx2, -38, y, 38, y + 1, 0.25, 4, 1200 + y);
  ctx2.restore();
  ctx2.save();
  ctx2.translate(-54, 56);
  drawPencilRect(ctx2, -29, -7, 58, 14, 4, { fill: "rgba(18,22,25,0.88)", wash: 0.04, hatch: 0.018, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  drawPencilRect(ctx2, -7, -29, 14, 58, 4, { fill: "rgba(18,22,25,0.88)", wash: 0.04, hatch: 0.018, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  drawRivet(ctx2, 0, 0, 3.2);
  ctx2.restore();
  for (const [x, y, s] of [[44, 46, 12], [76, 34, 11], [48, 86, 6], [72, 78, 6]]) {
    ctx2.beginPath();
    ctx2.arc(x, y, s, 0, Math.PI * 2);
    ctx2.fillStyle = s > 8 ? colorAlpha("#d7a13a", 0.82) : "rgba(18,22,25,0.76)";
    ctx2.fill();
    ctx2.strokeStyle = "rgba(18,22,25,0.62)";
    ctx2.lineWidth = 1.1;
    ctx2.stroke();
  }
  ctx2.strokeStyle = "rgba(18,22,25,0.46)";
  ctx2.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) roughLine(ctx2, 34 + i * 9, 108 + i * 1.6, 48 + i * 9, 104 + i * 1.6, 0.22, 4, 1270 + i);
  drawPencilRect(ctx2, -40, 94, 58, 12, 5, { fill: colorAlpha("#d7a13a", 0.52), wash: 0.035, hatch: 0.016, spacing: 4, shadow: 0.016, lineWidth: 1 });
}
function drawLedgerBtcHead(ctx2, part) {
  setup(ctx2, part, 2.05, 0.82);
  const ticker = part.key === "ledger.eth.head" ? "ETH" : "BTC";
  const body = () => {
    ctx2.beginPath();
    ctx2.moveTo(-110, -36);
    ctx2.lineTo(44, -60);
    ctx2.quadraticCurveTo(72, -56, 78, -30);
    ctx2.lineTo(88, 74);
    ctx2.quadraticCurveTo(72, 96, 36, 92);
    ctx2.lineTo(-104, 68);
    ctx2.quadraticCurveTo(-126, 42, -122, -12);
    ctx2.quadraticCurveTo(-122, -30, -110, -36);
    ctx2.closePath();
  };
  const cover = () => {
    ctx2.beginPath();
    ctx2.moveTo(20, -106);
    ctx2.lineTo(116, -88);
    ctx2.quadraticCurveTo(132, -80, 130, -56);
    ctx2.lineTo(112, 106);
    ctx2.quadraticCurveTo(98, 124, 74, 116);
    ctx2.lineTo(18, 96);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, cover, 5, 8, 0.052);
  cover();
  const coverFill = ctx2.createLinearGradient(20, -100, 128, 112);
  coverFill.addColorStop(0, "rgba(241,245,242,0.9)");
  coverFill.addColorStop(1, "rgba(142,154,160,0.84)");
  ctx2.fillStyle = coverFill;
  ctx2.fill();
  pencilShade(ctx2, cover, { x: 16, y: -108, w: 118, h: 228 }, { wash: 0.08, hatch: 0.036, cross: 0.012, spacing: 7, texture: 0.032 });
  ctx2.strokeStyle = "rgba(18,22,25,0.62)";
  ctx2.lineWidth = 2;
  cover();
  ctx2.stroke();
  drawCastShadow(ctx2, body, 4, 6, 0.06);
  body();
  ctx2.fillStyle = "rgba(14,18,20,0.92)";
  ctx2.fill();
  pencilShade(ctx2, body, { x: -124, y: -64, w: 212, h: 160 }, { wash: 0.12, hatch: 0.056, cross: 0.018, spacing: 6, texture: 0.05 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.2;
  body();
  ctx2.stroke();
  drawPencilRect(ctx2, -86, -22, 92, 38, 8, {
    fill: "rgba(20,54,58,0.9)",
    wash: 0.04,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.02,
    lineWidth: 1.2
  });
  ctx2.fillStyle = "rgba(80,255,224,0.96)";
  ctx2.font = "bold 22px ui-monospace, Menlo, Consolas, monospace";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(ticker, -40, -3);
  ctx2.font = "bold 8px ui-monospace, Menlo, Consolas, monospace";
  ctx2.fillText("LEDGER", -78, 30);
  ctx2.beginPath();
  ctx2.arc(90, 34, 16, 0, Math.PI * 2);
  ctx2.fillStyle = "rgba(236,241,236,0.82)";
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.48)";
  ctx2.lineWidth = 1.4;
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(90, 34, 7, 0, Math.PI * 2);
  ctx2.strokeStyle = "rgba(18,22,25,0.34)";
  ctx2.stroke();
  drawRivet(ctx2, 56, -28, 3);
  drawRivet(ctx2, 66, 78, 3);
}
function drawBatteryChargeHead(ctx2, part, state = {}) {
  setup(ctx2, part, 2.05, 0.82);
  const level = gasLevelFor(state);
  const beat = gasHeartbeatFor(state, level, 0.31);
  const charge = clamp01(0.56 + level * 0.34 + beat * 0.08);
  const liveColor = level > 0.78 ? "#ff5d3d" : level > 0.52 ? "#ffd24a" : "#77f04f";
  const screenGlow = colorAlpha(liveColor, 0.2 + beat * 0.22);
  const body = () => {
    ctx2.beginPath();
    ctx2.moveTo(-124, -76);
    ctx2.quadraticCurveTo(-104, -116, -52, -112);
    ctx2.lineTo(88, -104);
    ctx2.quadraticCurveTo(126, -94, 128, -54);
    ctx2.lineTo(122, 76);
    ctx2.quadraticCurveTo(114, 118, 72, 126);
    ctx2.lineTo(-82, 116);
    ctx2.quadraticCurveTo(-126, 104, -132, 60);
    ctx2.lineTo(-136, -38);
    ctx2.quadraticCurveTo(-138, -62, -124, -76);
    ctx2.closePath();
  };
  const screen = () => {
    ctx2.beginPath();
    ctx2.roundRect(-84, -50, 168, 94, 12);
  };
  drawCastShadow(ctx2, body, 5, 8, 0.06);
  body();
  const shell = ctx2.createLinearGradient(-138, -116, 130, 126);
  shell.addColorStop(0, "rgba(71,55,35,0.94)");
  shell.addColorStop(0.38, "rgba(142,104,52,0.9)");
  shell.addColorStop(0.68, "rgba(82,68,45,0.92)");
  shell.addColorStop(1, "rgba(28,32,31,0.9)");
  ctx2.fillStyle = shell;
  ctx2.fill();
  pencilShade(ctx2, body, { x: -140, y: -116, w: 280, h: 250 }, { wash: 0.13, hatch: 0.066, cross: 0.025, spacing: 7, texture: 0.06 });
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2.35;
  body();
  ctx2.stroke();
  for (const [x, label, side] of [[-106, "+", -1], [106, "-", 1]]) {
    drawPencilRect(ctx2, x - 20, -38, 40, 80, 11, {
      fill: "rgba(18,22,25,0.48)",
      wash: 0.05,
      hatch: 0.03,
      spacing: 6,
      shadow: 0.026,
      lineWidth: 1.2
    });
    ctx2.fillStyle = "rgba(7,10,10,0.76)";
    ctx2.font = "bold 34px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(label, x, -1);
    roughLine(ctx2, x - side * 13, -92, x - side * 33, -120, 0.35, 4, 1330 + x);
  }
  for (const [x, scale, label] of [[-58, 1.04, "+"], [58, 0.92, "-"]]) {
    ctx2.save();
    ctx2.translate(x, -128);
    drawPencilRect(ctx2, -38 * scale, 0, 76 * scale, 30, 10, {
      fill: "rgba(22,25,24,0.88)",
      wash: 0.08,
      hatch: 0.04,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.3
    });
    ctx2.beginPath();
    ctx2.arc(0, 0, 25 * scale, 0, Math.PI * 2);
    ctx2.fillStyle = "rgba(176,162,124,0.88)";
    ctx2.fill();
    ctx2.strokeStyle = INK;
    ctx2.lineWidth = 1.7;
    ctx2.stroke();
    drawRivet(ctx2, 0, 0, 4.5 * scale);
    ctx2.fillStyle = "rgba(18,22,25,0.62)";
    ctx2.font = "bold 13px ui-monospace, Menlo, Consolas, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(label, 0, 2);
    ctx2.restore();
  }
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.72)";
  ctx2.lineWidth = 10;
  roughBezier(ctx2, [[-62, -132], [-76, -178], [42, -180], [62, -130]], 0.55, 1390);
  ctx2.strokeStyle = "rgba(255,83,70,0.72)";
  ctx2.lineWidth = 4;
  roughBezier(ctx2, [[-68, -136], [-78, -166], [12, -172], [38, -138]], 0.45, 1391);
  ctx2.restore();
  screen();
  ctx2.fillStyle = "rgba(4,12,12,0.9)";
  ctx2.fill();
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.shadowColor = screenGlow;
  ctx2.shadowBlur = 16 + beat * 12;
  ctx2.strokeStyle = colorAlpha(liveColor, 0.48 + beat * 0.22);
  ctx2.lineWidth = 2.8;
  screen();
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(14,18,18,0.9)";
  ctx2.lineWidth = 2;
  screen();
  ctx2.stroke();
  ctx2.fillStyle = "rgba(225,230,208,0.78)";
  ctx2.font = "bold 11px ui-monospace, Menlo, Consolas, monospace";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText("BATTERY", 0, -34);
  ctx2.fillStyle = colorAlpha(liveColor, 0.86 + beat * 0.12);
  ctx2.font = "bold 9px ui-monospace, Menlo, Consolas, monospace";
  ctx2.fillText(`CHARGE ${Math.round(charge * 100)}%`, 0, 30);
  const lit = Math.max(1, Math.round(charge * 7));
  for (let i = 0; i < 7; i += 1) {
    const x = -61 + i * 20;
    drawPencilRect(ctx2, x, -12, 15, 26, 3, {
      fill: i < lit ? colorAlpha(liveColor, 0.86 + beat * 0.12) : "rgba(46,60,46,0.54)",
      wash: 0.02,
      hatch: 0.01,
      spacing: 4,
      shadow: 0.014,
      lineWidth: 0.9
    });
  }
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = "rgba(102,255,220,0.78)";
  for (const x of [-34, 34]) {
    ctx2.beginPath();
    ctx2.roundRect(x - 9, -24, 18, 9, 3);
    ctx2.fill();
  }
  ctx2.strokeStyle = "rgba(118,255,224,0.82)";
  ctx2.lineWidth = 2;
  roughBezier(ctx2, [[-30, 18], [-10, 24], [14, 24], [34, 16]], 0.32, 1400);
  ctx2.restore();
  ctx2.strokeStyle = "rgba(255,238,170,0.48)";
  ctx2.lineWidth = 1.2;
  roughLine(ctx2, -70, -74, 70, -70, 0.34, 4, 1410);
  roughLine(ctx2, -74, 60, 74, 54, 0.34, 4, 1411);
  for (const [x, y] of [[-100, -82], [-34, -88], [36, -84], [102, -72], [-100, 78], [-38, 92], [38, 88], [98, 74]]) {
    drawRivet(ctx2, x, y, 3.2);
  }
  if (level > 0.72) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha("#ff5d3d", 0.28 + beat * 0.24);
    ctx2.lineWidth = 3;
    roughBezier(ctx2, [[-96, 92], [-42, 114], [26, 114], [96, 82]], 0.55, 1420);
    ctx2.strokeStyle = colorAlpha("#ffd24a", 0.38 + beat * 0.22);
    roughBezier(ctx2, [[70, -56], [90, -30], [72, -4], [96, 26]], 0.5, 1421);
    ctx2.restore();
  }
}
function drawMagnetUHead(ctx2, part, state = {}) {
  setup(ctx2, part, 2.05, 0.84);
  const level = gasLevelFor(state);
  const beat = gasHeartbeatFor(state, level, 0.47);
  const field = 0.28 + level * 0.38 + beat * 0.22;
  const bodyStroke = "rgba(18,22,25,0.72)";
  const leftArm = () => {
    ctx2.beginPath();
    ctx2.moveTo(-132, -142);
    ctx2.quadraticCurveTo(-104, -160, -74, -146);
    ctx2.lineTo(-64, 22);
    ctx2.bezierCurveTo(-58, 74, -34, 104, 0, 104);
    ctx2.lineTo(0, 154);
    ctx2.bezierCurveTo(-66, 154, -112, 106, -122, 30);
    ctx2.closePath();
  };
  const rightArm = () => {
    ctx2.beginPath();
    ctx2.moveTo(74, -146);
    ctx2.quadraticCurveTo(104, -160, 132, -142);
    ctx2.lineTo(122, 30);
    ctx2.bezierCurveTo(112, 106, 66, 154, 0, 154);
    ctx2.lineTo(0, 104);
    ctx2.bezierCurveTo(34, 104, 58, 74, 64, 22);
    ctx2.closePath();
  };
  const cap = (x, color) => {
    ctx2.save();
    ctx2.translate(x, -136);
    drawPencilRect(ctx2, -48, -42, 96, 74, 10, {
      fill: color,
      wash: 0.06,
      hatch: 0.03,
      spacing: 6,
      shadow: 0.035,
      lineWidth: 1.5
    });
    ctx2.restore();
  };
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.strokeStyle = colorAlpha("#72ffe8", field * 0.34);
  ctx2.lineWidth = 2.2;
  for (let i = 0; i < 4; i += 1) {
    const spread = 44 + i * 17;
    roughBezier(ctx2, [[-52, -38 + i * 9], [-22, -72 - spread * 0.1], [24, -72 - spread * 0.1], [54, -38 + i * 9]], 0.45, 1510 + i);
    roughBezier(ctx2, [[-76, 44 + i * 8], [-34, 72 + spread], [34, 72 + spread], [76, 44 + i * 8]], 0.45, 1530 + i);
  }
  ctx2.restore();
  drawCastShadow(ctx2, leftArm, 5, 8, 0.055);
  leftArm();
  const leftFill = ctx2.createLinearGradient(-138, -146, -22, 150);
  leftFill.addColorStop(0, "rgba(212,218,207,0.9)");
  leftFill.addColorStop(0.55, "rgba(154,158,150,0.86)");
  leftFill.addColorStop(1, "rgba(84,90,88,0.84)");
  ctx2.fillStyle = leftFill;
  ctx2.fill();
  pencilShade(ctx2, leftArm, { x: -138, y: -152, w: 150, h: 314 }, { wash: 0.11, hatch: 0.056, cross: 0.02, spacing: 7, texture: 0.045 });
  ctx2.strokeStyle = bodyStroke;
  ctx2.lineWidth = 2.4;
  leftArm();
  ctx2.stroke();
  drawCastShadow(ctx2, rightArm, 5, 8, 0.055);
  rightArm();
  const rightFill = ctx2.createLinearGradient(22, -146, 138, 150);
  rightFill.addColorStop(0, "rgba(232,234,222,0.88)");
  rightFill.addColorStop(0.58, "rgba(158,162,154,0.86)");
  rightFill.addColorStop(1, "rgba(86,92,90,0.84)");
  ctx2.fillStyle = rightFill;
  ctx2.fill();
  pencilShade(ctx2, rightArm, { x: -4, y: -152, w: 142, h: 314 }, { wash: 0.11, hatch: 0.056, cross: 0.02, spacing: 7, texture: 0.045 });
  ctx2.strokeStyle = bodyStroke;
  ctx2.lineWidth = 2.4;
  rightArm();
  ctx2.stroke();
  cap(-90, "rgba(205,50,42,0.92)");
  cap(90, "rgba(48,96,184,0.92)");
  ctx2.fillStyle = "rgba(246,242,222,0.96)";
  ctx2.font = "bold 32px ui-monospace, Menlo, Consolas, monospace";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText("N", -90, -138);
  ctx2.fillText("S", 90, -138);
  for (const [x, color, side] of [[-138, "#ff6848", -1], [138, "#4ca4ff", 1]]) {
    ctx2.save();
    ctx2.translate(x, -8);
    ctx2.rotate(side * -0.03);
    drawPencilRect(ctx2, -12, -44, 24, 88, 8, {
      fill: "rgba(18,22,25,0.78)",
      wash: 0.06,
      hatch: 0.028,
      spacing: 5,
      shadow: 0.026,
      lineWidth: 1.2
    });
    ctx2.strokeStyle = colorAlpha(color, 0.82);
    ctx2.lineWidth = 3.2;
    for (let y = -34; y <= 34; y += 11) roughLine(ctx2, -11, y, 11, y + 5, 0.28, 4, 1550 + y + x);
    ctx2.restore();
    ctx2.strokeStyle = colorAlpha(color, 0.5);
    ctx2.lineWidth = 3.4;
    roughBezier(ctx2, [[x - side * 8, 26], [x - side * 38, 62], [side * 54, 142], [side * 22, 166]], 0.55, 1600 + x);
  }
  drawPencilRect(ctx2, -82, 76, 164, 68, 16, {
    fill: "rgba(16,20,21,0.9)",
    wash: 0.07,
    hatch: 0.03,
    spacing: 5,
    shadow: 0.04,
    lineWidth: 1.5
  });
  drawPencilRect(ctx2, -44, 92, 88, 32, 8, {
    fill: "rgba(6,20,22,0.9)",
    wash: 0.035,
    hatch: 0.015,
    spacing: 5,
    shadow: 0.02,
    lineWidth: 1.1
  });
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = colorAlpha("#74ffea", 0.72 + beat * 0.2);
  ctx2.shadowColor = colorAlpha("#74ffea", 0.72);
  ctx2.shadowBlur = 8 + beat * 8;
  ctx2.beginPath();
  ctx2.roundRect(-32, 100, 18, 16, 4);
  ctx2.roundRect(14, 100, 18, 16, 4);
  ctx2.fill();
  ctx2.strokeStyle = colorAlpha("#74ffea", 0.64);
  ctx2.lineWidth = 2;
  roughBezier(ctx2, [[-26, 126], [-10, 134], [10, 134], [28, 126]], 0.22, 1640);
  ctx2.restore();
  for (const [x, y] of [[-116, -94], [-60, -16], [-86, 58], [116, -94], [60, -16], [86, 58], [-54, 112], [54, 112]]) {
    drawRivet(ctx2, x, y, 3.5);
  }
  ctx2.fillStyle = "rgba(218,224,211,0.82)";
  ctx2.font = "bold 8px ui-monospace, Menlo, Consolas, monospace";
  ctx2.textAlign = "center";
  ctx2.fillText("MAG-01", 0, 84);
}
function specialShapeFor(part) {
  return String(part.specialShape || part.rareShape || "oracle").toLowerCase();
}
function drawSpecialRarePath(ctx2, shape, type) {
  const head = type === "head";
  ctx2.beginPath();
  if (head) {
    if (shape.includes("pressure") || shape.includes("oracle") || shape.includes("gauge")) {
      ctx2.ellipse(0, 0, 116, 98, 0, 0, Math.PI * 2);
    } else if (shape.includes("forge") || shape.includes("harvest") || shape.includes("pilot")) {
      ctx2.moveTo(-162, -58);
      ctx2.lineTo(-92, -92);
      ctx2.lineTo(96, -88);
      ctx2.lineTo(164, -52);
      ctx2.lineTo(130, 64);
      ctx2.lineTo(-126, 70);
      ctx2.closePath();
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral") || shape.includes("infinite")) {
      ctx2.moveTo(-98, 84);
      ctx2.lineTo(-104, -36);
      ctx2.lineTo(-58, -38);
      ctx2.lineTo(-34, -108);
      ctx2.lineTo(0, -140);
      ctx2.lineTo(34, -108);
      ctx2.lineTo(58, -38);
      ctx2.lineTo(104, -36);
      ctx2.lineTo(98, 84);
      ctx2.closePath();
    } else if (shape.includes("scar") || shape.includes("crown") || shape.includes("king")) {
      ctx2.moveTo(-142, 78);
      ctx2.lineTo(-128, -54);
      ctx2.lineTo(-82, -92);
      ctx2.lineTo(-42, -42);
      ctx2.lineTo(0, -118);
      ctx2.lineTo(42, -42);
      ctx2.lineTo(82, -92);
      ctx2.lineTo(128, -54);
      ctx2.lineTo(142, 78);
      ctx2.closePath();
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury") || shape.includes("diver") || shape.includes("polar") || shape.includes("glass") || shape.includes("holo") || shape.includes("crystal") || shape.includes("opal") || shape.includes("void") || shape.includes("blackmatter") || shape.includes("slime")) {
      ctx2.moveTo(-86, 94);
      ctx2.bezierCurveTo(-128, 50, -124, -52, -62, -100);
      ctx2.bezierCurveTo(-28, -126, 28, -126, 62, -100);
      ctx2.bezierCurveTo(124, -52, 128, 50, 86, 94);
      ctx2.closePath();
    } else if (shape.includes("signal") || shape.includes("radio") || shape.includes("crt")) {
      ctx2.moveTo(-154, -82);
      ctx2.lineTo(154, -82);
      ctx2.lineTo(132, 82);
      ctx2.lineTo(-132, 82);
      ctx2.closePath();
    } else if (shape.includes("vault") || shape.includes("sale")) {
      ctx2.roundRect(-112, -106, 224, 212, 24);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      ctx2.moveTo(-158, 64);
      ctx2.lineTo(-120, -52);
      ctx2.lineTo(-168, -108);
      ctx2.lineTo(-72, -76);
      ctx2.lineTo(-34, -122);
      ctx2.lineTo(0, -80);
      ctx2.lineTo(34, -122);
      ctx2.lineTo(72, -76);
      ctx2.lineTo(168, -108);
      ctx2.lineTo(120, -52);
      ctx2.lineTo(158, 64);
      ctx2.lineTo(54, 96);
      ctx2.lineTo(0, 74);
      ctx2.lineTo(-54, 96);
      ctx2.closePath();
    } else if (shape.includes("archive") || shape.includes("typewriter") || shape.includes("contract") || shape.includes("memory") || shape.includes("genesis") || shape.includes("museum") || shape.includes("stone") || shape.includes("rune") || shape.includes("paper") || shape.includes("server") || shape.includes("eink")) {
      ctx2.moveTo(-128, -86);
      ctx2.lineTo(112, -96);
      ctx2.lineTo(140, -28);
      ctx2.lineTo(104, 88);
      ctx2.lineTo(-122, 78);
      ctx2.lineTo(-146, -18);
      ctx2.closePath();
    } else if (shape.includes("swan")) {
      ctx2.moveTo(-154, 42);
      ctx2.bezierCurveTo(-112, -78, -42, -126, 0, -60);
      ctx2.bezierCurveTo(42, -126, 112, -78, 154, 42);
      ctx2.bezierCurveTo(76, 94, -76, 94, -154, 42);
      ctx2.closePath();
    } else if (shape.includes("tesla")) {
      ctx2.moveTo(-128, 84);
      ctx2.lineTo(-96, -122);
      ctx2.lineTo(-34, -122);
      ctx2.lineTo(-12, 28);
      ctx2.lineTo(12, 28);
      ctx2.lineTo(34, -122);
      ctx2.lineTo(96, -122);
      ctx2.lineTo(128, 84);
      ctx2.closePath();
    } else if (shape.includes("satellite") || shape.includes("orbit")) {
      ctx2.ellipse(0, -12, 142, 76, -0.08, 0, Math.PI * 2);
      ctx2.moveTo(-64, 54);
      ctx2.lineTo(64, 54);
      ctx2.lineTo(96, 108);
      ctx2.lineTo(-96, 108);
      ctx2.closePath();
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      ctx2.roundRect(-150, -80, 300, 160, 18);
    } else if (shape.includes("boss") || shape.includes("idol")) {
      ctx2.moveTo(0, -136);
      ctx2.lineTo(118, -48);
      ctx2.lineTo(92, 82);
      ctx2.lineTo(0, 126);
      ctx2.lineTo(-92, 82);
      ctx2.lineTo(-118, -48);
      ctx2.closePath();
    } else {
      ctx2.roundRect(-122, -92, 244, 184, 22);
    }
  } else {
    if (shape.includes("pressure") || shape.includes("oracle") || shape.includes("gauge") || shape.includes("volcanic") || shape.includes("lava")) {
      ctx2.moveTo(-174, -92);
      ctx2.lineTo(174, -92);
      ctx2.lineTo(140, 126);
      ctx2.lineTo(62, 174);
      ctx2.lineTo(-62, 174);
      ctx2.lineTo(-140, 126);
      ctx2.closePath();
    } else if (shape.includes("forge") || shape.includes("harvest") || shape.includes("pilot") || shape.includes("runner") || shape.includes("wheel") || shape.includes("skate")) {
      ctx2.moveTo(-204, -84);
      ctx2.lineTo(204, -84);
      ctx2.lineTo(154, 116);
      ctx2.lineTo(66, 168);
      ctx2.lineTo(-66, 168);
      ctx2.lineTo(-154, 116);
      ctx2.closePath();
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral") || shape.includes("infinite")) {
      ctx2.moveTo(-142, 174);
      ctx2.lineTo(-158, -42);
      ctx2.lineTo(-72, -78);
      ctx2.lineTo(0, -122);
      ctx2.lineTo(72, -78);
      ctx2.lineTo(158, -42);
      ctx2.lineTo(142, 174);
      ctx2.closePath();
    } else if (shape.includes("scar") || shape.includes("archive") || shape.includes("contract") || shape.includes("memory") || shape.includes("genesis") || shape.includes("museum") || shape.includes("stone") || shape.includes("rune") || shape.includes("paper") || shape.includes("server") || shape.includes("eink")) {
      ctx2.moveTo(-190, -70);
      ctx2.lineTo(168, -98);
      ctx2.lineTo(202, 94);
      ctx2.lineTo(112, 170);
      ctx2.lineTo(-150, 150);
      ctx2.lineTo(-206, 42);
      ctx2.closePath();
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury") || shape.includes("diver") || shape.includes("polar") || shape.includes("glass") || shape.includes("holo") || shape.includes("crystal") || shape.includes("opal") || shape.includes("void") || shape.includes("blackmatter") || shape.includes("slime")) {
      ctx2.ellipse(0, 24, 178, 164, 0, 0, Math.PI * 2);
    } else if (shape.includes("signal") || shape.includes("radio") || shape.includes("crt")) {
      ctx2.moveTo(-214, -70);
      ctx2.lineTo(214, -70);
      ctx2.lineTo(184, 88);
      ctx2.lineTo(92, 150);
      ctx2.lineTo(-92, 150);
      ctx2.lineTo(-184, 88);
      ctx2.closePath();
    } else if (shape.includes("vault") || shape.includes("sale") || shape.includes("king")) {
      ctx2.roundRect(-162, -116, 324, 292, 28);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      ctx2.moveTo(-224, -34);
      ctx2.lineTo(-146, -112);
      ctx2.lineTo(-42, -78);
      ctx2.lineTo(0, -122);
      ctx2.lineTo(42, -78);
      ctx2.lineTo(146, -112);
      ctx2.lineTo(224, -34);
      ctx2.lineTo(154, 132);
      ctx2.lineTo(54, 176);
      ctx2.lineTo(0, 134);
      ctx2.lineTo(-54, 176);
      ctx2.lineTo(-154, 132);
      ctx2.closePath();
    } else if (shape.includes("swan")) {
      ctx2.moveTo(-244, 0);
      ctx2.bezierCurveTo(-160, -118, -68, -82, 0, -34);
      ctx2.bezierCurveTo(68, -82, 160, -118, 244, 0);
      ctx2.bezierCurveTo(150, 164, -150, 164, -244, 0);
      ctx2.closePath();
    } else if (shape.includes("tesla")) {
      ctx2.moveTo(-178, 168);
      ctx2.lineTo(-118, -106);
      ctx2.lineTo(-46, -86);
      ctx2.lineTo(-26, 46);
      ctx2.lineTo(26, 46);
      ctx2.lineTo(46, -86);
      ctx2.lineTo(118, -106);
      ctx2.lineTo(178, 168);
      ctx2.closePath();
    } else if (shape.includes("satellite") || shape.includes("orbit")) {
      ctx2.ellipse(0, 22, 214, 128, 0.02, 0, Math.PI * 2);
      ctx2.moveTo(-86, 106);
      ctx2.lineTo(86, 106);
      ctx2.lineTo(136, 176);
      ctx2.lineTo(-136, 176);
      ctx2.closePath();
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      ctx2.roundRect(-198, -102, 396, 264, 24);
    } else if (shape.includes("boss") || shape.includes("idol")) {
      ctx2.moveTo(0, -140);
      ctx2.lineTo(178, -42);
      ctx2.lineTo(148, 118);
      ctx2.lineTo(0, 190);
      ctx2.lineTo(-148, 118);
      ctx2.lineTo(-178, -42);
      ctx2.closePath();
    } else {
      ctx2.roundRect(-176, -102, 352, 270, 26);
    }
  }
}
function drawSpecialRareShell(ctx2, part, state = {}, type = "head") {
  const shape = specialShapeFor(part);
  const variant = Math.abs(Number(part.specialVariant || 0)) % 4;
  const style = setup(ctx2, part, type === "head" ? 2.35 : 2.15, 0.9);
  const bounds = type === "head" ? { x: -176, y: -154, w: 352, h: 298 } : { x: -250, y: -150, w: 500, h: 370 };
  const shell = () => drawSpecialRarePath(ctx2, shape, type);
  const pulse = Math.sin((state.time || 0) * 2.1 + (part.id || 0)) * 0.5 + 0.5;
  drawCastShadow(ctx2, shell, type === "head" ? 6 : 8, type === "head" ? 8 : 10, 0.07);
  const fill = ctx2.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  fill.addColorStop(0, colorAlpha(style.highlight || style.fill || "#d8dee0", 0.58));
  fill.addColorStop(0.42, colorAlpha(style.fill || "#8b9696", type === "head" ? 0.9 : 0.8));
  fill.addColorStop(1, colorAlpha(style.stroke || "#1a1f22", 0.28));
  ctx2.fillStyle = fill;
  shell();
  ctx2.fill();
  pencilShade(ctx2, shell, bounds, {
    wash: type === "head" ? 0.075 : 0.09,
    hatch: type === "head" ? 0.036 : 0.044,
    cross: 0.016,
    spacing: type === "head" ? 8 : 10,
    texture: 0.04
  });
  ctx2.strokeStyle = colorAlpha(style.stroke || "#111", 0.82);
  ctx2.lineWidth = type === "head" ? 2.5 : 2.25;
  shell();
  ctx2.stroke();
  ctx2.save();
  shell();
  ctx2.clip();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.strokeStyle = colorAlpha(style.glow || style.highlight || "#72ffe8", 0.16 + pulse * 0.12);
  ctx2.lineWidth = type === "head" ? 2 : 2.6;
  if (type === "head") {
    for (let y = -78; y <= 78; y += 42) roughLine(ctx2, -118, y, 118, y - 12, 0.42, 8, 1700 + y);
    roughBezier(ctx2, [[-96, 74], [-34, 100], [46, 96], [106, 66]], 0.42, 1800);
  } else {
    for (let y = -74; y <= 132; y += 54) roughLine(ctx2, -164, y, 164, y - 18, 0.46, 9, 1850 + y);
    roughBezier(ctx2, [[-190, 18], [-88, -52], [96, -54], [190, 26]], 0.52, 1900);
  }
  ctx2.restore();
  ctx2.save();
  ctx2.strokeStyle = colorAlpha(style.stroke || "#111", 0.56);
  ctx2.lineWidth = 1.4;
  if (type === "head") {
    if (shape.includes("vault") || shape.includes("sale")) {
      roughCircle(ctx2, 0, 2, 52, 0.55, 2100);
      roughCircle(ctx2, 0, 2, 24, 0.45, 2101);
      roughLine(ctx2, -18, 2, 40, -18, 0.34, 4, 2102);
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      roughCircle(ctx2, -64, 0, 30, 0.44, 2110);
      roughCircle(ctx2, 64, 0, 30, 0.44, 2111);
      roughLine(ctx2, -112, 46, 112, 40, 0.3, 5, 2112);
    } else if (shape.includes("tesla")) {
      roughLine(ctx2, -76, -108, -52, 72, 0.38, 6, 2120);
      roughLine(ctx2, 76, -108, 52, 72, 0.38, 6, 2121);
      roughBezier(ctx2, [[-50, -22], [-16, -52], [18, -52], [50, -22]], 0.42, 2122);
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury")) {
      roughBezier(ctx2, [[-72, -28], [-36, -48], [38, -44], [74, -24]], 0.4, 2130);
      roughBezier(ctx2, [[-78, 44], [-28, 64], [36, 60], [78, 36]], 0.4, 2131);
      for (const x of [-54, 0, 54]) roughCircle(ctx2, x, 10 + Math.sin(x) * 6, 6, 0.28, 2132 + x);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      for (const x of [-54, -18, 18, 54]) roughLine(ctx2, x, 46, x + 18, 78, 0.36, 4, 2140 + x);
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral")) {
      roughCircle(ctx2, 0, -10, 48, 0.45, 2150);
      roughLine(ctx2, 0, -10, 34, -38, 0.24, 4, 2151);
      roughLine(ctx2, 0, -10, -8, 28, 0.24, 4, 2152);
    } else {
      roughLine(ctx2, -92, -38, 92, -44, 0.36, 6, 2160);
      roughLine(ctx2, -90, 42, 90, 34, 0.36, 6, 2161);
    }
    if (variant === 0) {
      drawPencilRect(ctx2, -78, -142, 156, 20, 5, { fill: colorAlpha(style.fill || "#d8dee0", 0.48), wash: 0.045, hatch: 0.02, spacing: 6, shadow: 0.02, lineWidth: 1.1 });
      for (const x of [-52, 0, 52]) drawRivet(ctx2, x, -132, 2.6);
    } else if (variant === 1) {
      for (const side of [-1, 1]) {
        drawPencilRect(ctx2, side * 128 - 14, -34, 28, 88, 7, { fill: colorAlpha(style.fill || "#d8dee0", 0.4), wash: 0.05, hatch: 0.02, spacing: 5, shadow: 0.02, lineWidth: 1.1 });
        roughLine(ctx2, side * 128, -20, side * 160, -48, 0.28, 4, 2170 + side);
      }
    } else if (variant === 2) {
      drawMiniPulley(ctx2, -86, -108, 18, 6, (state.time || 0) * 0.3);
      drawMiniPulley(ctx2, 86, -108, 18, 6, -(state.time || 0) * 0.28);
      roughBezier(ctx2, [[-66, -116], [-28, -142], [28, -142], [66, -116]], 0.36, 2178);
    } else {
      roughLine(ctx2, -104, -124, -166, -168, 0.34, 5, 2180);
      roughLine(ctx2, 104, -124, 166, -168, 0.34, 5, 2181);
      drawRivet(ctx2, -104, -124, 2.8);
      drawRivet(ctx2, 104, -124, 2.8);
    }
    for (const [x, y] of [[-108, -66], [108, -66], [-112, 66], [112, 66], [-42, -100], [42, -100]]) drawRivet(ctx2, x, y, 3.1);
  } else {
    if (shape.includes("dragon") || shape.includes("primal")) {
      for (let i = -3; i <= 3; i += 1) roughLine(ctx2, i * 38, -54 + Math.abs(i) * 7, i * 25, 120, 0.4, 7, 2200 + i);
    } else if (shape.includes("swan")) {
      for (const side of [-1, 1]) {
        roughBezier(ctx2, [[side * 12, -40], [side * 86, -84], [side * 168, -54], [side * 224, 18]], 0.5, 2210 + side);
        roughBezier(ctx2, [[side * 18, 26], [side * 90, 72], [side * 160, 76], [side * 210, 40]], 0.42, 2214 + side);
      }
    } else if (shape.includes("archive") || shape.includes("memory") || shape.includes("contract")) {
      for (let y = -42; y <= 96; y += 34) roughLine(ctx2, -150, y, 156, y - 14, 0.34, 6, 2220 + y);
    } else if (shape.includes("vault") || shape.includes("sale")) {
      roughCircle(ctx2, 0, 4, 72, 0.5, 2230);
      roughCircle(ctx2, 0, 4, 34, 0.4, 2231);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        roughLine(ctx2, Math.cos(angle) * 34, Math.sin(angle) * 34 + 4, Math.cos(angle) * 78, Math.sin(angle) * 78 + 4, 0.3, 4, 2232 + angle * 10);
      }
    } else {
      roughBezier(ctx2, [[-168, 92], [-74, 130], [74, 130], [168, 84]], 0.42, 2240);
      roughLine(ctx2, -132, -44, 132, -60, 0.38, 7, 2241);
    }
    if (variant === 0) {
      for (const side of [-1, 1]) drawPencilRect(ctx2, side * 208 - 24, 36, 48, 122, 8, { fill: colorAlpha(style.fill || "#d8dee0", 0.34), wash: 0.05, hatch: 0.02, spacing: 6, shadow: 0.02, lineWidth: 1.1 });
    } else if (variant === 1) {
      for (const side of [-1, 1]) {
        roughBezier(ctx2, [[side * 62, -92], [side * 136, -132], [side * 210, -84], [side * 236, -12]], 0.5, 2250 + side);
        drawMiniPulley(ctx2, side * 166, -62, 18, 6, side * (state.time || 0) * 0.28);
      }
    } else if (variant === 2) {
      for (let i = -3; i <= 3; i += 1) drawRivet(ctx2, i * 44, -112 + Math.abs(i) * 5, 2.8);
      drawPencilRect(ctx2, -126, 134, 252, 28, 7, { fill: colorAlpha(style.fill || "#d8dee0", 0.36), wash: 0.045, hatch: 0.018, spacing: 6, shadow: 0.018, lineWidth: 1 });
    } else {
      roughLine(ctx2, -188, -116, 186, 132, 0.42, 9, 2260);
      roughLine(ctx2, -168, 130, 180, -88, 0.36, 8, 2261);
    }
    for (const [x, y] of [[-170, -58], [170, -58], [-188, 62], [188, 62], [-102, 144], [102, 144], [0, -104], [0, 150]]) drawRivet(ctx2, x, y, 3.4);
  }
  ctx2.restore();
}
function drawSpecialRareHead(ctx2, part, state = {}) {
  drawSpecialRareShell(ctx2, part, state, "head");
}
function drawSpecialRareBody(ctx2, part, state = {}) {
  drawSpecialRareShell(ctx2, part, state, "body");
}
function drawMiniPulley(ctx2, x, y, radius, spokes = 6, phase = 0) {
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(x, y, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 3, 4, 0.052);
  pencilShade(ctx2, outer, { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 }, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 6 });
  outer();
  ctx2.stroke();
  roughCircle(ctx2, x, y, radius * 0.68, 0.6, radius + 10);
  roughCircle(ctx2, x, y, radius * 0.2, 0.4, radius + 20);
  for (let i = 0; i < spokes; i++) {
    const angle = i / spokes * Math.PI * 2 + phase;
    roughLine(ctx2, x, y, x + Math.cos(angle) * radius * 0.58, y + Math.sin(angle) * radius * 0.58, 0.55, 4, i * 12 + radius);
  }
  drawRivet(ctx2, x, y, Math.max(3.2, radius * 0.11));
}
function drawPulleyBeltPath(ctx2) {
  ctx2.beginPath();
  ctx2.moveTo(-86, 0);
  ctx2.bezierCurveTo(-42, -40, 8, -58, 72, -56);
  ctx2.moveTo(-58, 48);
  ctx2.bezierCurveTo(-10, 36, 36, 26, 92, 16);
}
function drawPulleyBeltLoop(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.74);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = Math.max(0.4, Math.abs(state.motionSpeed ?? 0.8));
  ctx2.save();
  ctx2.strokeStyle = "rgba(0,0,0,0.065)";
  ctx2.lineWidth = 14;
  drawPulleyBeltPath(ctx2);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.28)";
  ctx2.lineWidth = 7.5;
  drawPulleyBeltPath(ctx2);
  ctx2.stroke();
  drawHatching(ctx2, { x: -92, y: -62, w: 188, h: 122 }, -0.72, 8, 0.035, 0.55);
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.38)";
  ctx2.lineWidth = 2.2;
  ctx2.setLineDash([9, 8]);
  ctx2.lineDashOffset = -time * speed * 34;
  drawPulleyBeltPath(ctx2);
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(42,137,174,0.48)";
  ctx2.lineWidth = 1.15;
  ctx2.setLineDash([5, 12]);
  ctx2.lineDashOffset = -time * speed * 40;
  drawPulleyBeltPath(ctx2);
  ctx2.stroke();
  ctx2.restore();
}
function drawCompactPulleyWheel(ctx2, phase) {
  const radius = 46;
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 4, 5, 0.055);
  pencilShade(ctx2, outer, { x: -52, y: -52, w: 104, h: 104 }, { wash: 0.11, hatch: 0.065, cross: 0.026, spacing: 6, texture: 0.06 });
  outer();
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.27)";
  ctx2.lineWidth = 5.5;
  ctx2.beginPath();
  ctx2.arc(0, 0, radius * 0.82, Math.PI * 0.16, Math.PI * 0.84);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, 0, radius * 0.82, Math.PI * 1.16, Math.PI * 1.84);
  ctx2.stroke();
  ctx2.restore();
  roughCircle(ctx2, 0, 0, radius * 0.74, 0.55, 170);
  roughCircle(ctx2, 0, 0, radius * 0.48, 0.48, 190);
  roughCircle(ctx2, 0, 0, radius * 0.22, 0.38, 210);
  for (let i = 0; i < 4; i++) {
    const angle = i / 4 * Math.PI * 2 + phase * 0.45;
    ctx2.save();
    ctx2.strokeStyle = "rgba(18,22,25,0.34)";
    ctx2.lineWidth = 3.1;
    roughLine(ctx2, Math.cos(angle) * 12, Math.sin(angle) * 12, Math.cos(angle) * radius * 0.56, Math.sin(angle) * radius * 0.56, 0.5, 4, i * 23 + 40);
    ctx2.restore();
  }
  drawPencilRect(ctx2, -18, -61, 36, 12, 3, { wash: 0.08, hatch: 0.04, cross: 0.012, lineWidth: 1.2, sketch: 0.1 });
  drawPencilRect(ctx2, -18, 49, 36, 12, 3, { wash: 0.08, hatch: 0.04, cross: 0.012, lineWidth: 1.2, sketch: 0.1 });
  drawRivet(ctx2, 0, 0, 6);
}
function drawLargeIndustrialPulley(ctx2, phase) {
  const radius = 64;
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 5, 7, 0.065);
  pencilShade(ctx2, outer, { x: -70, y: -70, w: 140, h: 140 }, { wash: 0.13, hatch: 0.072, cross: 0.03, spacing: 7, texture: 0.065 });
  outer();
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.3)";
  ctx2.lineWidth = 4.5;
  ctx2.beginPath();
  ctx2.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.restore();
  roughCircle(ctx2, 0, 0, radius * 0.84, 0.6, 230);
  roughCircle(ctx2, 0, 0, radius * 0.58, 0.55, 250);
  roughCircle(ctx2, 0, 0, radius * 0.24, 0.42, 270);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2 + phase * 0.28;
    ctx2.save();
    ctx2.strokeStyle = i % 3 === 0 ? "rgba(18,22,25,0.4)" : "rgba(18,22,25,0.28)";
    ctx2.lineWidth = i % 3 === 0 ? 2.4 : 1.25;
    roughLine(ctx2, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, 0.42, 4, i * 29 + 70);
    ctx2.restore();
  }
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78, 2.4);
  }
  drawRivet(ctx2, 0, 0, 8);
}
function drawPulleyWheel(ctx2, part, state = {}) {
  setup(ctx2, part, part.key === "pulley.wheel.large" ? 1.65 : 1.85, 0.76);
  const phase = state.previewMotion === false ? 0 : (state.time || 0) * Math.max(0.45, Math.abs(state.motionSpeed ?? 0.65));
  if (part.key === "pulley.wheel.large") {
    drawLargeIndustrialPulley(ctx2, phase);
  } else {
    drawCompactPulleyWheel(ctx2, phase);
  }
}
function drawPulleyRig(ctx2, part, state = {}) {
  drawPulleyBeltLoop(ctx2, part, state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  drawMiniPulley(ctx2, -70, 24, 27, 5, time * 0.8);
  drawMiniPulley(ctx2, 56, -16, 43, 7, -time * 0.54);
}
function drawSprocketRing(ctx2, part, state) {
  drawGear(ctx2, part, state, 58, 38);
  setup(ctx2, part, 1.45, 0.68);
  ctx2.fillStyle = "rgba(255,255,255,0.68)";
  ctx2.beginPath();
  ctx2.arc(0, 0, 34, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  roughCircle(ctx2, 0, 0, 46, 0.75, 170);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * 47, Math.sin(angle) * 47, 2.7);
  }
}
function drawBoltedRing(ctx2, part) {
  const style = setup(ctx2, part, 1.9, 0.78);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 58, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 5, 6, 0.055);
  outer();
  ctx2.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.76);
  ctx2.fill();
  ctx2.stroke();
  ctx2.fillStyle = "rgba(255,255,255,0.72)";
  ctx2.beginPath();
  ctx2.arc(0, 0, 34, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.save();
  ctx2.globalAlpha *= 0.28;
  ctx2.stroke();
  ctx2.restore();
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    drawRivet(ctx2, Math.cos(angle) * 46, Math.sin(angle) * 46, 4);
  }
}
function drawUClamp(ctx2, part) {
  setup(ctx2, part, 2, 0.78);
  ctx2.save();
  ctx2.strokeStyle = "rgba(0,0,0,0.06)";
  ctx2.lineWidth = 19;
  ctx2.beginPath();
  ctx2.arc(0, -4, 46, Math.PI, Math.PI * 2);
  ctx2.moveTo(-46, -4);
  ctx2.lineTo(-46, 46);
  ctx2.moveTo(46, -4);
  ctx2.lineTo(46, 46);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.24)";
  ctx2.lineWidth = 15;
  ctx2.beginPath();
  ctx2.arc(0, -4, 46, Math.PI, Math.PI * 2);
  ctx2.moveTo(-46, -4);
  ctx2.lineTo(-46, 46);
  ctx2.moveTo(46, -4);
  ctx2.lineTo(46, 46);
  ctx2.stroke();
  drawHatching(ctx2, { x: -58, y: -56, w: 116, h: 112 }, -0.68, 7, 0.045, 0.55);
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2;
  roughCircle(ctx2, 0, -4, 46, 0.85, 90, 1, Math.PI, Math.PI * 2);
  roughLine(ctx2, -46, -4, -46, 46, 0.65, 8, 91);
  roughLine(ctx2, 46, -4, 46, 46, 0.65, 8, 92);
  drawPencilRect(ctx2, -66, 42, 40, 24, 5, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.04 });
  drawPencilRect(ctx2, 26, 42, 40, 24, 5, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.04 });
  drawRivet(ctx2, -46, 54, 3.4);
  drawRivet(ctx2, 46, 54, 3.4);
}
function drawFootBracket(ctx2, part) {
  setup(ctx2, part, 1.9, 0.78);
  drawPencilRect(ctx2, -62, 14, 124, 36, 5, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6, shadow: 0.045 });
  drawPencilRect(ctx2, -48, -58, 34, 92, 5, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6, shadow: 0.045 });
  const gusset = () => {
    ctx2.beginPath();
    ctx2.moveTo(-14, 14);
    ctx2.lineTo(38, 14);
    ctx2.lineTo(-14, -38);
    ctx2.closePath();
  };
  drawCastShadow(ctx2, gusset, 3, 4, 0.045);
  pencilShade(ctx2, gusset, { x: -18, y: -42, w: 60, h: 60 }, { wash: 0.1, hatch: 0.055, cross: 0.02, spacing: 6 });
  gusset();
  ctx2.stroke();
  for (const point of [[-42, 32], [42, 32], [-31, -38], [-31, -8]]) drawRivet(ctx2, point[0], point[1], 3.4);
}
function drawRivetedPlate(ctx2, part) {
  setup(ctx2, part, 1.7, 0.76);
  drawPencilRect(ctx2, -70, -46, 140, 92, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 7, shadow: 0.04 });
  for (const point of [[-52, -28], [0, -28], [52, -28], [-52, 28], [0, 28], [52, 28]]) drawRivet(ctx2, point[0], point[1], 3.3);
  ctx2.strokeStyle = "rgba(18,22,25,0.2)";
  ctx2.lineWidth = 1;
  if (!part.cleanPlate) {
    roughLine(ctx2, -48, 0, 48, 0, 0.6, 10, 311);
  }
}
function drawVentGrille(ctx2, part) {
  setup(ctx2, part, 1.7, 0.76);
  drawPencilRect(ctx2, -70, -42, 140, 84, 5, { wash: 0.085, hatch: 0.045, cross: 0.018, spacing: 8, shadow: 0.04 });
  ctx2.strokeStyle = "rgba(18,22,25,0.48)";
  ctx2.lineWidth = 2.2;
  for (let y = -26; y <= 26; y += 13) roughLine(ctx2, -52, y, 52, y, 0.55, 12, y + 220);
  ctx2.strokeStyle = "rgba(255,255,255,0.36)";
  ctx2.lineWidth = 1;
  for (let y = -20; y <= 32; y += 13) roughLine(ctx2, -46, y, 46, y, 0.35, 10, y + 240);
  for (const point of [[-58, -31], [58, -31], [-58, 31], [58, 31]]) drawRivet(ctx2, point[0], point[1], 2.9);
}
function drawMeshPanel(ctx2, part) {
  setup(ctx2, part, 1.45, 0.68);
  drawPencilRect(ctx2, -74, -44, 148, 88, 4, { fill: "rgba(255,255,255,0.12)", wash: 0.05, hatch: 0.025, cross: 0.01, spacing: 9, shadow: 0.035 });
  ctx2.save();
  roundedRect(ctx2, -66, -36, 132, 72, 3);
  ctx2.clip();
  ctx2.strokeStyle = "rgba(18,22,25,0.32)";
  ctx2.lineWidth = 0.9;
  for (let x = -78; x <= 78; x += 9) roughLine(ctx2, x, -48, x + 62, 48, 0.35, 8, x + 370);
  for (let x = -78; x <= 78; x += 9) roughLine(ctx2, x, 48, x + 62, -48, 0.35, 8, x + 470);
  ctx2.restore();
}
function drawPencilChainLink(ctx2, x, y, angle, seed, major = 28, minor = 13) {
  const link = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, major, minor, 0, 0, Math.PI * 2);
  };
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(angle);
  drawCastShadow(ctx2, link, 2.3, 3, 0.045);
  ctx2.strokeStyle = "rgba(18,22,25,0.14)";
  ctx2.lineWidth = 8;
  link();
  ctx2.stroke();
  pencilShade(ctx2, link, { x: -major, y: -minor, w: major * 2, h: minor * 2 }, {
    wash: 0.075,
    hatch: 0.035,
    cross: 0.012,
    spacing: 5,
    texture: 0.03
  });
  ctx2.strokeStyle = "rgba(18,22,25,0.54)";
  ctx2.lineWidth = 2.15;
  link();
  ctx2.stroke();
  roughCircle(ctx2, 0, 0, major, 0.45, seed, minor / major);
  ctx2.strokeStyle = "rgba(255,255,255,0.36)";
  ctx2.lineWidth = 1;
  roughLine(ctx2, -major * 0.54, -minor * 0.45, major * 0.54, -minor * 0.45, 0.3, 5, seed + 33);
  ctx2.restore();
}
function drawChainSegment(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.76);
  const gasLevel = part.liveGasMeter ? gasLevelFor(state) : 0;
  const offset = part.liveGasMeter ? Math.sin((state.time || 0) * (2 + gasLevel * 7)) * (2 + gasLevel * 5) : 0;
  ctx2.save();
  ctx2.strokeStyle = "rgba(0,0,0,0.045)";
  ctx2.lineWidth = 5;
  roughLine(ctx2, -88, 4, 88, 4, 0.55, 18, 520);
  ctx2.restore();
  for (let i = -3; i <= 3; i++) {
    const x = i * 26 + offset;
    drawPencilChainLink(ctx2, x, i % 2 ? -1 : 1, i % 2 ? Math.PI / 2 : 0, 610 + i * 21, i % 2 ? 20 : 26, i % 2 ? 10 : 12);
  }
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.34)";
  ctx2.lineWidth = 1.15;
  for (let x = -78; x <= 78; x += 26) {
    roughLine(ctx2, x - 7, -9, x + 7, 9, 0.32, 3, 700 + x);
    drawRivet(ctx2, x, 0, 2.3);
  }
  ctx2.restore();
}
function drawAxleRod(ctx2, part) {
  setup(ctx2, part, 1.7, 0.78);
  const shaft = () => roundedRect(ctx2, -88, -11, 176, 22, 11);
  drawCastShadow(ctx2, shaft, 3, 4, 0.045);
  shaft();
  ctx2.fillStyle = "rgba(251,250,245,0.5)";
  ctx2.fill();
  pencilShade(ctx2, shaft, { x: -90, y: -14, w: 180, h: 28 }, {
    wash: 0.105,
    hatch: 0.052,
    cross: 0.016,
    spacing: 6,
    texture: 0.04
  });
  ctx2.strokeStyle = "rgba(18,22,25,0.5)";
  ctx2.lineWidth = 1.7;
  shaft();
  ctx2.stroke();
  ctx2.save();
  ctx2.strokeStyle = "rgba(255,255,255,0.38)";
  ctx2.lineWidth = 1.05;
  roughLine(ctx2, -76, -5.5, 76, -5.5, 0.35, 16, 560);
  ctx2.strokeStyle = "rgba(18,22,25,0.2)";
  ctx2.lineWidth = 1.05;
  roughLine(ctx2, -76, 6, 76, 6, 0.35, 16, 561);
  ctx2.restore();
  for (const x of [-82, 82]) {
    drawPencilRect(ctx2, x - 15, -19, 30, 38, 5, {
      fill: "rgba(251,250,245,0.68)",
      wash: 0.12,
      hatch: 0.062,
      cross: 0.018,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.55
    });
    drawRivet(ctx2, x, 0, 3.1);
  }
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.36)";
  ctx2.lineWidth = 1.05;
  for (let x = -58; x <= 58; x += 14) {
    roughLine(ctx2, x - 5, 10, x + 5, -10, 0.26, 3, 580 + x);
  }
  for (const x of [-46, 0, 46]) {
    roughLine(ctx2, x, -11, x, 11, 0.28, 4, 640 + x);
  }
  ctx2.restore();
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.48)";
  ctx2.lineWidth = 1.35;
  roughLine(ctx2, -106, 0, -97, 0, 0.25, 2, 660);
  roughLine(ctx2, 97, 0, 106, 0, 0.25, 2, 661);
  drawRivet(ctx2, -108, 0, 2.4);
  drawRivet(ctx2, 108, 0, 2.4);
  ctx2.restore();
}
function drawFaceStroke(ctx2, part, state = {}) {
  const style = setup(ctx2, part, 1.45, 0.96);
  const tint = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin) ? "#ffd257" : part.faceGlow;
  const strokeColor = colorAlpha(tint || style.stroke || "#baffdf", 0.96);
  const glowColor = colorAlpha(tint || style.dim || style.stroke || "#76ffc4", 0.5);
  const highlightColor = colorAlpha(style.highlight || "#f5ffee", 0.76);
  const isMouth = part.facePart === "mouth";
  const half = isMouth ? 78 : 70;
  const lift = isMouth ? 2 : -1;
  const arc = Number(part.arc || 0);
  const mid = lift + arc * (isMouth ? 22 : 20);
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  const tf = ctx2.getTransform();
  const sx = Math.hypot(tf.a, tf.b) || 1;
  const sy = Math.hypot(tf.c, tf.d) || 1;
  const weightPx = Math.max(isMouth ? 2.8 : 3, sx * (isMouth ? 6 : 6.5));
  const tracePath = () => {
    ctx2.beginPath();
    if (arc) {
      ctx2.moveTo(-half, lift);
      ctx2.quadraticCurveTo(0, mid, half, lift);
    } else {
      ctx2.moveTo(-half, lift + (isMouth ? 3 : 1));
      ctx2.quadraticCurveTo(-half * 0.35, lift - 4, 0, lift - 2);
      ctx2.quadraticCurveTo(half * 0.4, lift, half, lift - (isMouth ? 5 : 7));
    }
  };
  ctx2.strokeStyle = "rgba(6,10,12,0.6)";
  ctx2.lineWidth = (weightPx + 2.8) / sy;
  tracePath();
  ctx2.stroke();
  ctx2.shadowColor = glowColor;
  ctx2.shadowBlur = 10;
  ctx2.strokeStyle = strokeColor;
  ctx2.lineWidth = weightPx / sy;
  tracePath();
  ctx2.stroke();
  ctx2.shadowBlur = 0;
  ctx2.strokeStyle = highlightColor;
  ctx2.lineWidth = Math.max(0.85, weightPx * 0.3) / sy;
  const hy = arc ? lift + mid * 0.35 : lift - 2;
  roughLine(ctx2, -half + 10, hy, half - 12, arc ? hy : lift - (isMouth ? 6 : 8), 0.14, 8, 2230);
  ctx2.restore();
}
function drawFacePupil(ctx2, part, state = {}) {
  const style = setup(ctx2, part, 1.25, 0.96);
  const tint = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin) ? "#ffd257" : part.faceGlow;
  const glowColor = colorAlpha(tint || style.dim || style.stroke || "#76ffc4", 0.58);
  const tf = ctx2.getTransform();
  const s = Math.hypot(tf.a, tf.b) || 1;
  if (part.facePart === "mouth") {
    const rr = 15 * s < 12 ? 12 / s : 15;
    const lw = rr * 0.42;
    const ring = () => {
      ctx2.beginPath();
      ctx2.ellipse(0, 0, rr, rr, 0, 0, Math.PI * 2);
    };
    ctx2.save();
    ctx2.lineCap = "round";
    ctx2.shadowBlur = 0;
    ctx2.strokeStyle = "rgba(6,10,12,0.55)";
    ctx2.lineWidth = lw + 3 / s;
    ring();
    ctx2.stroke();
    ctx2.shadowColor = glowColor;
    ctx2.shadowBlur = 10;
    ctx2.strokeStyle = colorAlpha(tint || style.stroke || "#baffdf", 0.96);
    ctx2.lineWidth = lw;
    ring();
    ctx2.stroke();
    ctx2.restore();
    return;
  }
  const r = 20 * s < 6 ? 6 / s : 20;
  const k = r / 20;
  const pupilPath = () => {
    ctx2.beginPath();
    ctx2.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  };
  ctx2.save();
  ctx2.shadowBlur = 0;
  ctx2.strokeStyle = "rgba(6,10,12,0.55)";
  ctx2.lineWidth = Math.max(1.6, 3.4 / s);
  pupilPath();
  ctx2.stroke();
  ctx2.shadowColor = glowColor;
  ctx2.shadowBlur = 10;
  ctx2.fillStyle = colorAlpha(tint || style.fill || "#9bffcd", 0.82);
  pupilPath();
  ctx2.fill();
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = colorAlpha(style.highlight || "#f5ffee", 0.12);
  ctx2.beginPath();
  ctx2.ellipse(-2 * k, -2 * k, 13 * k, 12 * k, -0.16, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.shadowBlur = 0;
  ctx2.strokeStyle = colorAlpha(tint || style.stroke || "#baffdf", 0.82);
  ctx2.lineWidth = 1;
  pupilPath();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,255,255,0.45)";
  ctx2.lineWidth = 0.8;
  roughLine(ctx2, -7 * k, -6 * k, 7 * k, -7 * k, 0.1, 3, 2248);
  ctx2.restore();
}
function drawFastenerKit(ctx2, part) {
  setup(ctx2, part, 1.45, 0.72);
  const positions = [
    [-50, -22, "rivet"],
    [-25, -22, "washer"],
    [0, -22, "slot"],
    [25, -22, "cross"],
    [50, -22, "bolt"],
    [-50, 2, "cross"],
    [-25, 2, "rivet"],
    [0, 2, "washer"],
    [25, 2, "bolt"],
    [50, 2, "slot"],
    [-50, 26, "bolt"],
    [-25, 26, "slot"],
    [0, 26, "rivet"],
    [25, 26, "washer"],
    [50, 26, "cross"]
  ];
  for (const [x, y, type] of positions) {
    drawFastenerShape(ctx2, x, y, type, 1, x + y + 700);
  }
}
function drawFastenerShape(ctx2, x, y, type, scale = 1, seed = 1) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.scale(scale, scale);
  if (type === "rivet") {
    drawRivet(ctx2, 0, 0, 5.8);
    ctx2.strokeStyle = "rgba(255,255,255,0.46)";
    ctx2.lineWidth = 0.8;
    roughLine(ctx2, -2.8, -2.8, 2.4, -3.2, 0.18, 2, seed + 1);
  } else if (type === "washer") {
    const outer = () => {
      ctx2.beginPath();
      ctx2.arc(0, 0, 8.2, 0, Math.PI * 2);
    };
    drawCastShadow(ctx2, outer, 1.4, 1.8, 0.04);
    pencilShade(ctx2, outer, { x: -9, y: -9, w: 18, h: 18 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    outer();
    ctx2.strokeStyle = "rgba(18,22,25,0.58)";
    ctx2.lineWidth = 1.1;
    ctx2.stroke();
    ctx2.fillStyle = "rgba(251,250,245,0.86)";
    ctx2.beginPath();
    ctx2.arc(0, 0, 3.3, 0, Math.PI * 2);
    ctx2.fill();
    roughCircle(ctx2, 0, 0, 3.3, 0.25, seed + 7);
  } else if (type === "slot") {
    drawFastenerShape(ctx2, 0, 0, "rivet", 1.02, seed + 9);
    ctx2.strokeStyle = "rgba(18,22,25,0.56)";
    ctx2.lineWidth = 1.15;
    roughLine(ctx2, -5.5, 0, 5.5, 0, 0.22, 3, seed + 12);
  } else if (type === "cross") {
    drawFastenerShape(ctx2, 0, 0, "rivet", 1.02, seed + 14);
    ctx2.strokeStyle = "rgba(18,22,25,0.56)";
    ctx2.lineWidth = 1.05;
    roughLine(ctx2, -4.9, 0, 4.9, 0, 0.2, 2, seed + 16);
    roughLine(ctx2, 0, -4.9, 0, 4.9, 0.2, 2, seed + 18);
  } else if (type === "nut") {
    const nut = () => {
      ctx2.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(angle) * 9.5;
        const py = Math.sin(angle) * 9.5;
        i ? ctx2.lineTo(px, py) : ctx2.moveTo(px, py);
      }
      ctx2.closePath();
    };
    drawCastShadow(ctx2, nut, 1.5, 2, 0.045);
    pencilShade(ctx2, nut, { x: -10, y: -10, w: 20, h: 20 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    nut();
    ctx2.strokeStyle = "rgba(18,22,25,0.58)";
    ctx2.lineWidth = 1.15;
    ctx2.stroke();
    ctx2.fillStyle = "rgba(251,250,245,0.84)";
    ctx2.beginPath();
    ctx2.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx2.fill();
    roughCircle(ctx2, 0, 0, 3.8, 0.25, seed + 22);
  } else if (type === "pin") {
    drawPencilRect(ctx2, -11, -3.5, 22, 7, 3.5, { wash: 0.075, hatch: 0.03, cross: 8e-3, spacing: 4, shadow: 0.022, lineWidth: 1.1 });
    drawRivet(ctx2, -12.5, 0, 3.1);
    drawRivet(ctx2, 12.5, 0, 3.1);
  } else {
    const bolt = () => {
      ctx2.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        const px = Math.cos(angle) * 8.2;
        const py = Math.sin(angle) * 8.2;
        i === 0 ? ctx2.moveTo(px, py) : ctx2.lineTo(px, py);
      }
      ctx2.closePath();
    };
    drawCastShadow(ctx2, bolt, 1.5, 2, 0.045);
    pencilShade(ctx2, bolt, { x: -9, y: -9, w: 18, h: 18 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    bolt();
    ctx2.strokeStyle = "rgba(18,22,25,0.58)";
    ctx2.lineWidth = 1.1;
    ctx2.stroke();
    drawRivet(ctx2, 0, 0, 2.6);
  }
  ctx2.restore();
}
function drawFastenerPart(ctx2, part) {
  setup(ctx2, part, 1.45, 0.78);
  const type = {
    "fastener.rivet": "rivet",
    "fastener.washer": "washer",
    "fastener.slotted": "slot",
    "fastener.cross": "cross",
    "fastener.hex": "bolt",
    "fastener.nut": "nut",
    "fastener.pin": "pin"
  }[part.key] || "bolt";
  drawFastenerShape(ctx2, 0, 0, type, 1.9, (part.id || 1) * 17);
}
function drawLighteningHole(ctx2, x, y, radius, seed) {
  const hole = () => {
    ctx2.beginPath();
    ctx2.arc(x, y, radius, 0, Math.PI * 2);
  };
  ctx2.save();
  ctx2.fillStyle = "rgba(255,255,255,0.68)";
  hole();
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,25,0.36)";
  ctx2.lineWidth = 1.25;
  hole();
  ctx2.stroke();
  roughCircle(ctx2, x, y, radius, 0.45, seed);
  ctx2.restore();
}
function drawWebGear(ctx2, part, state) {
  drawGear(ctx2, part, state, 64, 30);
  setup(ctx2, part, 1.35, 0.68);
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    drawLighteningHole(ctx2, Math.cos(angle) * 39, Math.sin(angle) * 39, 8.5, 810 + i);
  }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2 + Math.PI / 8;
    drawRivet(ctx2, Math.cos(angle) * 52, Math.sin(angle) * 52, 2.6);
  }
}
function drawLargeSpokeGear(ctx2, part, state) {
  drawGear(ctx2, part, state, 84, 36);
  setup(ctx2, part, 1.65, 0.72);
  ctx2.save();
  ctx2.strokeStyle = "rgba(18,22,25,0.48)";
  ctx2.lineWidth = 8;
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2 + Math.sin((state?.time || 0) * 0.2) * 0.02;
    roughLine(ctx2, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * 70, Math.sin(angle) * 70, 0.6, 8, 840 + i);
    drawRivet(ctx2, Math.cos(angle) * 58, Math.sin(angle) * 58, 3.2);
  }
  ctx2.restore();
  drawLighteningHole(ctx2, 0, 0, 16, 848);
  roughCircle(ctx2, 0, 0, 73, 0.7, 849);
  roughCircle(ctx2, 0, 0, 31, 0.55, 850);
}
function drawFineSpokeWheel(ctx2, part) {
  setup(ctx2, part, 1.8, 0.78);
  const outer = () => {
    ctx2.beginPath();
    ctx2.arc(0, 0, 62, 0, Math.PI * 2);
  };
  drawCastShadow(ctx2, outer, 5, 6, 0.055);
  pencilShade(ctx2, outer, { x: -66, y: -66, w: 132, h: 132 }, { wash: 0.09, hatch: 0.052, cross: 0.02, spacing: 7 });
  outer();
  ctx2.stroke();
  roughCircle(ctx2, 0, 0, 48, 0.65, 870);
  roughCircle(ctx2, 0, 0, 18, 0.45, 871);
  ctx2.strokeStyle = "rgba(18,22,25,0.5)";
  ctx2.lineWidth = 1.45;
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    roughLine(ctx2, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * 58, Math.sin(angle) * 58, 0.48, 6, 880 + i);
  }
  drawRivet(ctx2, 0, 0, 5.2);
}
function drawBevelGearPair(ctx2, part, state = {}) {
  setup(ctx2, part, 1.8, 0.76);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = state.previewMotion === false ? 0 : Math.max(0.45, Math.abs(state.motionSpeed ?? 0.82));
  const direction = (state.motionSpeed ?? 1) < 0 ? -1 : 1;
  const drivePhase = time * speed * direction * 1.9;
  const drawConeGear = (x, y, scaleX, scaleY, teeth, tilt, phase, seed) => {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(tilt);
    ctx2.scale(scaleX, scaleY);
    const body = () => {
      ctx2.beginPath();
      ctx2.ellipse(0, 0, 42, 24, 0, 0, Math.PI * 2);
    };
    drawCastShadow(ctx2, body, 4, 5, 0.052);
    pencilShade(ctx2, body, { x: -44, y: -26, w: 88, h: 52 }, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6 });
    body();
    ctx2.stroke();
    ctx2.save();
    ctx2.rotate(phase);
    ctx2.strokeStyle = "rgba(18,22,25,0.44)";
    ctx2.lineWidth = 1.35;
    for (let i = 0; i < 5; i++) {
      const angle = i / 5 * Math.PI * 2;
      roughLine(ctx2, Math.cos(angle) * 8, Math.sin(angle) * 4, Math.cos(angle) * 34, Math.sin(angle) * 19, 0.35, 4, seed + i);
    }
    ctx2.strokeStyle = "rgba(255,255,255,0.35)";
    ctx2.lineWidth = 0.9;
    roughLine(ctx2, Math.cos(phase) * -22, -10, Math.cos(phase) * 18, -12, 0.25, 4, seed + 25);
    ctx2.restore();
    for (let i = 0; i < teeth; i++) {
      const angle = i / teeth * Math.PI * 2 + phase;
      const x1 = Math.cos(angle) * 43;
      const y1 = Math.sin(angle) * 24;
      const x2 = Math.cos(angle) * 54;
      const y2 = Math.sin(angle) * 29;
      roughLine(ctx2, x1, y1, x2, y2, 0.42, 2, 900 + i);
    }
    roughCircle(ctx2, 0, 0, 21, 0.46, 930, 0.58);
    roughLine(ctx2, Math.cos(phase) * 7, Math.sin(phase) * 4, Math.cos(phase) * 26, Math.sin(phase) * 15, 0.24, 3, 932);
    drawRivet(ctx2, 0, 0, 4);
    ctx2.restore();
  };
  drawConeGear(-42, 4, 1, 1, 22, -0.34, drivePhase, 910);
  drawConeGear(42, -6, 0.88, 0.92, 20, 0.48, -drivePhase * 1.16 + Math.PI / 9, 960);
  ctx2.strokeStyle = "rgba(18,22,25,0.32)";
  ctx2.lineWidth = 1.3;
  roughLine(ctx2, -2, -31, 8, 30, 0.55, 8, 940);
  ctx2.save();
  ctx2.strokeStyle = "rgba(42,137,174,0.38)";
  ctx2.lineWidth = 1.4;
  ctx2.setLineDash([6, 9]);
  ctx2.lineDashOffset = -time * speed * 22;
  roughLine(ctx2, -13, -20, 22, 20, 0.35, 7, 947);
  ctx2.restore();
}
function drawCoupledStraightPipe(ctx2, part, state) {
  setup(ctx2, part, 2.1, 0.8);
  drawPencilRect(ctx2, -104, -16, 208, 32, 12, { wash: 0.09, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.045 });
  ctx2.strokeStyle = "rgba(255,255,255,0.42)";
  ctx2.lineWidth = 1;
  roughLine(ctx2, -84, -7, 84, -7, 0.35, 18, 950);
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.8;
  roughLine(ctx2, -88, 0, 88, 0, 0.45, 18, 951);
  drawFlowLine(ctx2, -80, 0, 80, 0, state);
  drawStraightPipeSocket(ctx2, -112, -24, 28, 48, "west");
  drawStraightPipeSocket(ctx2, 84, -24, 28, 48, "east");
  for (const x of [-52, 0, 52]) {
    drawPencilRect(ctx2, x - 14, -22, 28, 44, 4, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 5, shadow: 0.032 });
    drawRivet(ctx2, x, -16, 2.6);
    drawRivet(ctx2, x, 16, 2.6);
  }
  drawConnectorMark(ctx2, -112, 0);
  drawConnectorMark(ctx2, 112, 0);
}
function drawSegmentElbowPipe(ctx2, part, state) {
  drawElbowPipe(ctx2, part, state);
  setup(ctx2, part, 1.55, 0.7);
  ctx2.save();
  ctx2.globalAlpha *= 0.72;
  ctx2.strokeStyle = "rgba(18,22,25,0.22)";
  ctx2.lineWidth = 1.25;
  roughLine(ctx2, -56, -52, -24, -52, 0.28, 5, 982);
  roughLine(ctx2, -54, -40, -25, -40, 0.28, 5, 983);
  roughLine(ctx2, 43, 26, 71, 26, 0.28, 5, 984);
  roughLine(ctx2, 43, 54, 71, 54, 0.28, 5, 985);
  ctx2.restore();
}
function cubicPoint(points, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * points[0][0] + 3 * mt * mt * t * points[1][0] + 3 * mt * t * t * points[2][0] + t * t * t * points[3][0],
    y: mt * mt * mt * points[0][1] + 3 * mt * mt * t * points[1][1] + 3 * mt * t * t * points[2][1] + t * t * t * points[3][1]
  };
}
function drawBezierFlow(ctx2, points, state = {}, width = 5.4) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const theme = liquidTheme(state);
  const flowPath = () => {
    ctx2.beginPath();
    ctx2.moveTo(points[0][0], points[0][1]);
    ctx2.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  };
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.lineJoin = "round";
  ctx2.strokeStyle = theme.glow;
  ctx2.lineWidth = width;
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 33;
  flowPath();
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha(theme.base, 0.58);
  ctx2.lineWidth = Math.max(1.3, width * 0.28);
  ctx2.setLineDash([8, 10]);
  ctx2.lineDashOffset = -time * 33;
  flowPath();
  ctx2.stroke();
  ctx2.setLineDash([]);
  const pulse = time * 0.72 % 1;
  const p = cubicPoint(points, pulse);
  ctx2.fillStyle = theme.glow;
  ctx2.beginPath();
  ctx2.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.fillStyle = colorAlpha(theme.accent, 0.88);
  ctx2.beginPath();
  ctx2.arc(p.x, p.y, 2.9, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
}
function drawCoupledArcPipe(ctx2, part, state) {
  const points = [[-84, 24], [-42, -48], [42, -48], [84, 24]];
  setup(ctx2, part, 2, 0.78);
  ctx2.save();
  ctx2.translate(5, 7);
  ctx2.strokeStyle = "rgba(0,0,0,0.06)";
  ctx2.lineWidth = 38;
  ctx2.beginPath();
  ctx2.moveTo(points[0][0], points[0][1]);
  ctx2.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.14)";
  ctx2.lineWidth = 34;
  ctx2.beginPath();
  ctx2.moveTo(points[0][0], points[0][1]);
  ctx2.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx2.stroke();
  drawHatching(ctx2, { x: -94, y: -56, w: 188, h: 104 }, -0.72, 7, 0.05, 0.68);
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 2;
  roughBezier(ctx2, points, 0.65, 990);
  roughBezier(ctx2, [[-66, 28], [-32, -20], [32, -20], [66, 28]], 0.5, 991);
  drawBezierFlow(ctx2, [[-64, 20], [-30, -24], [30, -24], [64, 20]], state, 5.6);
  drawPencilRect(ctx2, -98, 3, 32, 46, 5, { wash: 0.13, hatch: 0.075, cross: 0.025, spacing: 5, shadow: 0.035 });
  drawPencilRect(ctx2, 66, 3, 32, 46, 5, { wash: 0.13, hatch: 0.075, cross: 0.025, spacing: 5, shadow: 0.035 });
  drawPencilRect(ctx2, -18, -50, 36, 20, 4, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.028 });
  drawConnectorMark(ctx2, -98, 24);
  drawConnectorMark(ctx2, 98, 24);
}
function drawFlexibleTube(ctx2, part, state) {
  const points = [[-86, 28], [-54, -46], [44, -48], [86, 14]];
  setup(ctx2, part, 1.9, 0.78);
  ctx2.save();
  ctx2.translate(5, 7);
  ctx2.strokeStyle = "rgba(0,0,0,0.055)";
  ctx2.lineWidth = 34;
  ctx2.beginPath();
  ctx2.moveTo(points[0][0], points[0][1]);
  ctx2.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx2.stroke();
  ctx2.restore();
  ctx2.strokeStyle = "rgba(18,22,25,0.17)";
  ctx2.lineWidth = 31;
  ctx2.beginPath();
  ctx2.moveTo(points[0][0], points[0][1]);
  ctx2.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx2.stroke();
  ctx2.strokeStyle = INK;
  ctx2.lineWidth = 1.7;
  roughBezier(ctx2, points, 0.7, 1010);
  roughBezier(ctx2, [[-68, 28], [-40, -18], [34, -20], [68, 14]], 0.52, 1011);
  ctx2.strokeStyle = "rgba(18,22,25,0.5)";
  ctx2.lineWidth = 2.1;
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const p = cubicPoint(points, t);
    const before = cubicPoint(points, Math.max(0, t - 0.02));
    const after = cubicPoint(points, Math.min(1, t + 0.02));
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    roughLine(ctx2, p.x - nx * 18, p.y - ny * 18, p.x + nx * 18, p.y + ny * 18, 0.38, 3, 1020 + i);
  }
  drawBezierFlow(ctx2, [[-66, 22], [-38, -18], [32, -20], [66, 12]], state, 4.8);
  drawStraightPipeSocket(ctx2, -102, 6, 28, 44, "west");
  drawStraightPipeSocket(ctx2, 74, -8, 28, 44, "east");
  drawConnectorMark(ctx2, -102, 28);
  drawConnectorMark(ctx2, 102, 14);
}
function drawHingeLeaf(ctx2, part) {
  setup(ctx2, part, 1.7, 0.76);
  drawPencilRect(ctx2, -78, -48, 54, 96, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx2, 24, -48, 54, 96, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.04 });
  ctx2.strokeStyle = "rgba(18,22,25,0.56)";
  ctx2.lineWidth = 2;
  for (const y of [-30, 0, 30]) {
    drawPencilRect(ctx2, -16, y - 14, 32, 28, 14, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  }
  roughLine(ctx2, 0, -48, 0, 48, 0.45, 12, 1040);
  for (const point of [[-58, -30], [-44, 30], [44, -30], [58, 30]]) drawRivet(ctx2, point[0], point[1], 3.6);
}
function drawLinkJoint(ctx2, part) {
  setup(ctx2, part, 1.8, 0.76);
  drawPencilRect(ctx2, -18, -54, 36, 108, 12, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 6, shadow: 0.04 });
  for (const y of [-64, 64]) {
    const ring = () => {
      ctx2.beginPath();
      ctx2.arc(0, y, 25, 0, Math.PI * 2);
    };
    drawCastShadow(ctx2, ring, 3, 4, 0.042);
    pencilShade(ctx2, ring, { x: -27, y: y - 27, w: 54, h: 54 }, { wash: 0.09, hatch: 0.045, cross: 0.016, spacing: 6 });
    ring();
    ctx2.stroke();
    drawLighteningHole(ctx2, 0, y, 11, 1050 + y);
  }
  drawRivet(ctx2, 0, 0, 4.2);
}
function drawBallJoint(ctx2, part) {
  setup(ctx2, part, 1.8, 0.76);
  drawPencilRect(ctx2, -84, -10, 168, 20, 10, { wash: 0.09, hatch: 0.05, cross: 0.018, spacing: 6, shadow: 0.035 });
  for (const x of [-58, 58]) {
    const cup = () => {
      ctx2.beginPath();
      ctx2.arc(x, 0, 27, 0, Math.PI * 2);
    };
    drawCastShadow(ctx2, cup, 3, 4, 0.045);
    pencilShade(ctx2, cup, { x: x - 29, y: -29, w: 58, h: 58 }, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 6 });
    cup();
    ctx2.stroke();
    drawLighteningHole(ctx2, x, 0, 11, 1060 + x);
  }
  drawPencilRect(ctx2, -14, -18, 28, 36, 6, { wash: 0.12, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawRivet(ctx2, 0, 0, 3.8);
}
var PARTS = {
  "gear.small": {
    id: 1,
    label: "Small Gear",
    category: "mechanical",
    kind: "gear",
    radius: 36,
    teeth: 18,
    owned: true,
    canDuplicate: true,
    draw: (ctx2, p, s) => drawGear(ctx2, p, s, 36, 18)
  },
  "gear.medium": {
    id: 2,
    label: "Medium Gear",
    category: "mechanical",
    kind: "gear",
    radius: 58,
    teeth: 24,
    owned: true,
    canDuplicate: true,
    draw: (ctx2, p, s) => drawGear(ctx2, p, s, 58, 24)
  },
  "gear.large": {
    id: 3,
    label: "Large Gear",
    category: "mechanical",
    kind: "gear",
    radius: 92,
    teeth: 32,
    owned: true,
    canDuplicate: true,
    draw: (ctx2, p, s) => drawGear(ctx2, p, s, 92, 32)
  },
  "wheel.belt": {
    id: 4,
    label: "Belt Wheel",
    category: "mechanical",
    kind: "wheel",
    radius: 62,
    owned: true,
    canDuplicate: true,
    draw: drawWheel
  },
  "pipe.straight": {
    id: 5,
    label: "Pipe Straight",
    category: "pipe",
    kind: "pipe",
    owned: true,
    canDuplicate: true,
    connectors: [
      { id: "west", x: -82, y: 0, kind: "pipe" },
      { id: "east", x: 82, y: 0, kind: "pipe" }
    ],
    draw: drawStraightPipe
  },
  "pipe.elbow": {
    id: 6,
    label: "Pipe Elbow",
    category: "pipe",
    kind: "pipe",
    owned: true,
    canDuplicate: true,
    connectors: [
      { id: "north", x: -40, y: -94, kind: "pipe" },
      { id: "east", x: 96, y: 40, kind: "pipe" }
    ],
    draw: drawElbowPipe
  },
  "tank.fluid": {
    id: 7,
    label: "Fluid Tank",
    category: "liquid",
    kind: "tank",
    owned: true,
    canDuplicate: false,
    connectors: [
      { id: "top", x: 0, y: -126, kind: "pipe" },
      { id: "bottom", x: 0, y: 126, kind: "pipe" }
    ],
    draw: drawTank
  },
  "tank.round": {
    id: 11,
    label: "Round Tank",
    category: "liquid",
    kind: "tank",
    owned: true,
    canDuplicate: true,
    connectors: [
      { id: "top", x: 0, y: -92, kind: "pipe" },
      { id: "bottom", x: 0, y: 92, kind: "pipe" },
      { id: "west", x: -92, y: 0, kind: "pipe" },
      { id: "east", x: 92, y: 0, kind: "pipe" }
    ],
    draw: drawRoundTank
  },
  "tank.core": {
    id: 12,
    label: "Core Tank",
    category: "liquid",
    kind: "tank",
    owned: true,
    canDuplicate: true,
    showInLibrary: false,
    connectors: [
      { id: "west", x: -96, y: 0, kind: "pipe" },
      { id: "east", x: 96, y: 0, kind: "pipe" },
      { id: "top", x: 0, y: -76, kind: "pipe" },
      { id: "bottom", x: 0, y: 76, kind: "pipe" }
    ],
    draw: drawCoreTank
  },
  "tank.vials": {
    id: 13,
    label: "Twin Vials",
    category: "liquid",
    kind: "tank",
    owned: true,
    canDuplicate: true,
    connectors: [
      { id: "top", x: 0, y: -112, kind: "pipe" },
      { id: "bottom", x: 0, y: 112, kind: "pipe" }
    ],
    draw: drawTwinVials
  },
  "tank.head.square": {
    id: 193,
    label: "Square Head Tank",
    category: "liquid",
    kind: "tank",
    owned: true,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -112, y: -136, w: 224, h: 272 },
    connectors: [
      { id: "top", x: 0, y: -124, kind: "pipe" },
      { id: "bottom", x: 0, y: 124, kind: "pipe" },
      { id: "west", x: -102, y: 0, kind: "pipe" },
      { id: "east", x: 102, y: 0, kind: "pipe" }
    ],
    draw: drawSquareHeadTank
  },
  "tube.vial.ornate": {
    id: 149,
    label: "Ornate Vial",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.42,
    bounds: { x: -42, y: -108, w: 84, h: 216 },
    draw: drawSealedTubePart
  },
  "tube.vial.crystal": {
    id: 150,
    label: "Crystal Vial",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.42,
    bounds: { x: -42, y: -108, w: 84, h: 216 },
    draw: drawSealedTubePart
  },
  "tube.vial.column": {
    id: 151,
    label: "Column Vial",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.42,
    bounds: { x: -42, y: -108, w: 84, h: 216 },
    draw: drawSealedTubePart
  },
  "tube.loop.ring": {
    id: 152,
    label: "Fluid Ring",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.58,
    bounds: { x: -74, y: -74, w: 148, h: 148 },
    draw: drawSealedTubePart
  },
  "tube.loop.oval": {
    id: 153,
    label: "Oval Fluid Loop",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.48,
    bounds: { x: -70, y: -92, w: 140, h: 184 },
    draw: drawSealedTubePart
  },
  "tube.sealed.u": {
    id: 154,
    label: "Sealed U Tube",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.48,
    bounds: { x: -68, y: -88, w: 136, h: 176 },
    draw: drawSealedTubePart
  },
  "tube.sealed.curve": {
    id: 155,
    label: "Curved Ampoule",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.5,
    bounds: { x: -72, y: -92, w: 144, h: 184 },
    draw: drawSealedTubePart
  },
  "tube.sealed.straight": {
    id: 156,
    label: "Sealed Tube",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.48,
    bounds: { x: -36, y: -104, w: 72, h: 208 },
    draw: drawSealedTubePart
  },
  "tube.cell.mini": {
    id: 157,
    label: "Mini Fluid Cell",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.68,
    bounds: { x: -46, y: -62, w: 92, h: 124 },
    draw: drawSealedTubePart
  },
  "tube.port.bolted": {
    id: 158,
    label: "Bolted Fluid Port",
    category: "premium",
    kind: "sealedTube",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.7,
    bounds: { x: -58, y: -58, w: 116, h: 116 },
    draw: drawSealedTubePart
  },
  "gauge.pressure": {
    id: 8,
    label: "Pressure Gauge",
    category: "pipe",
    kind: "gauge",
    owned: true,
    canDuplicate: true,
    connectors: [{ id: "bottom", x: 0, y: 56, kind: "pipe" }],
    draw: drawGauge
  },
  "bolt.micro": {
    id: 9,
    label: "Micro Bolt",
    category: "micro",
    kind: "micro",
    owned: true,
    canDuplicate: true,
    draw: drawBolt
  },
  "dot.micro": {
    id: 10,
    label: "Draw Dot",
    category: "micro",
    kind: "micro",
    owned: true,
    canDuplicate: true,
    draw: drawDot
  },
  "gear.bevel": {
    id: 101,
    label: "Bevel Gear",
    category: "premium",
    kind: "gear",
    radius: 58,
    teeth: 28,
    premium: true,
    owned: false,
    canDuplicate: true,
    noExternalRotate: true,
    previewMaxScale: 0.66,
    bounds: { x: -84, y: -62, w: 168, h: 124 },
    draw: drawBevelGear
  },
  "drive.chain": {
    id: 102,
    label: "Chain Drive",
    category: "premium",
    kind: "chain",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    draw: drawChain
  },
  "valve.steam": {
    id: 103,
    label: "Steam Valve",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    connectors: [
      { id: "west", x: -82, y: 0, kind: "pipe" },
      { id: "east", x: 82, y: 0, kind: "pipe" }
    ],
    draw: drawValve
  },
  "coil.tesla": {
    id: 104,
    label: "Tesla Coil",
    category: "premium",
    kind: "coil",
    premium: true,
    owned: false,
    canDuplicate: false,
    connectors: [{ id: "base", x: 0, y: 100, kind: "pipe" }],
    draw: drawCoil
  },
  "gear.crown": {
    id: 105,
    label: "Crown Gear",
    category: "premium",
    kind: "gear",
    radius: 66,
    teeth: 34,
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawCrownGear
  },
  "tank.mercury": {
    id: 106,
    label: "Mercury Tank",
    category: "premium",
    kind: "tank",
    premium: true,
    owned: false,
    canDuplicate: false,
    connectors: [
      { id: "top", x: 0, y: -126, kind: "pipe" },
      { id: "bottom", x: 0, y: 126, kind: "pipe" }
    ],
    draw: drawMercuryTank
  },
  "pipe.ghost": {
    id: 107,
    label: "Ghost Pipe",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    connectors: [
      { id: "west", x: -76, y: 16, kind: "pipe" },
      { id: "east", x: 76, y: 10, kind: "pipe" }
    ],
    draw: drawGhostPipe
  },
  "spring.compact": {
    id: 108,
    label: "Compact Spring",
    category: "premium",
    kind: "spring",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawCompactSpring
  },
  "bracket.corner": {
    id: 109,
    label: "Corner Bracket",
    category: "premium",
    kind: "frame",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawCornerBracket
  },
  "strip.rivet": {
    id: 110,
    label: "Rivet Strip",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawRivetStrip
  },
  "hand.clock": {
    id: 111,
    label: "Clock Hand",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawClockHand
  },
  "tooth.shard": {
    id: 112,
    label: "Gear Tooth Shard",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawGearToothShard
  },
  "mark.graphite": {
    id: 113,
    label: "Graphite Sweep",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawGraphiteMark
  },
  "arc.lightning": {
    id: 114,
    label: "Lightning Arc",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawLightningArc
  },
  "lens.aperture": {
    id: 115,
    label: "Aperture Lens",
    category: "premium",
    kind: "face",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawApertureLens
  },
  "rail.notched": {
    id: 116,
    label: "Notched Rail",
    category: "premium",
    kind: "frame",
    premium: true,
    owned: false,
    canDuplicate: true,
    draw: drawNotchedRail
  },
  "rig.pulley": {
    id: 117,
    label: "Pulley Rig",
    category: "premium",
    kind: "rig",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    previewScale: 0.36,
    bounds: { x: -108, y: -76, w: 220, h: 144 },
    draw: drawPulleyRig
  },
  "pulley.wheel": {
    id: 146,
    label: "Pulley Wheel",
    category: "premium",
    kind: "wheel",
    radius: 46,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.72,
    bounds: { x: -62, y: -62, w: 124, h: 124 },
    draw: drawPulleyWheel
  },
  "pulley.wheel.large": {
    id: 148,
    label: "Large Pulley",
    category: "premium",
    kind: "wheel",
    radius: 64,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.56,
    bounds: { x: -82, y: -82, w: 164, h: 164 },
    draw: drawPulleyWheel
  },
  "pulley.belt": {
    id: 147,
    label: "Pulley Belt",
    category: "premium",
    kind: "belt",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 0.62,
    bounds: { x: -108, y: -76, w: 220, h: 144 },
    draw: drawPulleyBeltLoop
  },
  "ring.sprocket": {
    id: 118,
    label: "Sprocket Ring",
    category: "premium",
    kind: "gear",
    radius: 58,
    teeth: 38,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.4,
    draw: drawSprocketRing
  },
  "ring.bolted": {
    id: 119,
    label: "Bolt Ring",
    category: "premium",
    kind: "wheel",
    radius: 58,
    noExternalRotate: true,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    draw: drawBoltedRing
  },
  "clamp.u": {
    id: 120,
    label: "U Clamp",
    category: "premium",
    kind: "bracket",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -76, y: -62, w: 152, h: 138 },
    draw: drawUClamp
  },
  "bracket.foot": {
    id: 121,
    label: "Foot Bracket",
    category: "premium",
    kind: "bracket",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.44,
    bounds: { x: -72, y: -68, w: 148, h: 128 },
    draw: drawFootBracket
  },
  "plate.riveted": {
    id: 122,
    label: "Rivet Plate",
    category: "premium",
    kind: "panel",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -78, y: -54, w: 156, h: 108 },
    draw: drawRivetedPlate
  },
  "vent.grille": {
    id: 123,
    label: "Vent Grille",
    category: "premium",
    kind: "panel",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -78, y: -50, w: 156, h: 100 },
    draw: drawVentGrille
  },
  "mesh.panel": {
    id: 124,
    label: "Mesh Panel",
    category: "premium",
    kind: "panel",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -82, y: -52, w: 164, h: 104 },
    draw: drawMeshPanel
  },
  "chain.segment": {
    id: 125,
    label: "Chain Segment",
    category: "premium",
    kind: "chain",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -104, y: -34, w: 208, h: 68 },
    draw: drawChainSegment
  },
  "axle.rod": {
    id: 126,
    label: "Axle Rod",
    category: "premium",
    kind: "rod",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.4,
    bounds: { x: -116, y: -28, w: 232, h: 56 },
    draw: drawAxleRod
  },
  "kit.fastener": {
    id: 127,
    label: "Fastener Sheet",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    previewScale: 0.48,
    bounds: { x: -66, y: -38, w: 132, h: 76 },
    draw: drawFastenerKit
  },
  "fastener.rivet": {
    id: 139,
    label: "Rivet",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -22, y: -22, w: 44, h: 44 },
    draw: drawFastenerPart
  },
  "fastener.washer": {
    id: 140,
    label: "Washer",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFastenerPart
  },
  "fastener.slotted": {
    id: 141,
    label: "Slotted Screw",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFastenerPart
  },
  "fastener.cross": {
    id: 142,
    label: "Cross Screw",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFastenerPart
  },
  "fastener.hex": {
    id: 143,
    label: "Hex Bolt",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFastenerPart
  },
  "fastener.nut": {
    id: 144,
    label: "Hex Nut",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.18,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFastenerPart
  },
  "fastener.pin": {
    id: 145,
    label: "Link Pin",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewMaxScale: 1.05,
    bounds: { x: -34, y: -18, w: 68, h: 36 },
    draw: drawFastenerPart
  },
  "gear.web": {
    id: 128,
    label: "Web Gear",
    category: "premium",
    kind: "gear",
    radius: 64,
    teeth: 30,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.4,
    draw: drawWebGear
  },
  "gear.spoked.large": {
    id: 129,
    label: "Spoked Gear",
    category: "premium",
    kind: "gear",
    radius: 84,
    teeth: 36,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.32,
    draw: drawLargeSpokeGear
  },
  "wheel.spoke.fine": {
    id: 130,
    label: "Fine Spoke Wheel",
    category: "premium",
    kind: "wheel",
    radius: 62,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    draw: drawFineSpokeWheel
  },
  "gear.bevel.pair": {
    id: 131,
    label: "Bevel Pair",
    category: "premium",
    kind: "bevel",
    radius: 54,
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.46,
    bounds: { x: -96, y: -52, w: 192, h: 104 },
    draw: drawBevelGearPair
  },
  "pipe.sleeved": {
    id: 132,
    label: "Sleeved Pipe",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.38,
    bounds: { x: -122, y: -34, w: 244, h: 68 },
    connectors: [
      { id: "west", x: -112, y: 0, kind: "pipe" },
      { id: "east", x: 112, y: 0, kind: "pipe" }
    ],
    draw: drawCoupledStraightPipe
  },
  "pipe.elbow.segment": {
    id: 133,
    label: "Segment Elbow",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    previewScale: 0.35,
    bounds: { x: -88, y: -108, w: 196, h: 190 },
    connectors: [
      { id: "north", x: -40, y: -94, kind: "pipe" },
      { id: "east", x: 96, y: 40, kind: "pipe" }
    ],
    draw: drawSegmentElbowPipe
  },
  "pipe.arc.coupled": {
    id: 134,
    label: "Coupled Arc Pipe",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.38,
    bounds: { x: -108, y: -62, w: 216, h: 124 },
    connectors: [
      { id: "west", x: -98, y: 24, kind: "pipe" },
      { id: "east", x: 98, y: 24, kind: "pipe" }
    ],
    draw: drawCoupledArcPipe
  },
  "tube.flex": {
    id: 135,
    label: "Flex Tube",
    category: "premium",
    kind: "pipe",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.38,
    bounds: { x: -112, y: -62, w: 224, h: 122 },
    connectors: [
      { id: "west", x: -102, y: 28, kind: "pipe" },
      { id: "east", x: 102, y: 14, kind: "pipe" }
    ],
    draw: drawFlexibleTube
  },
  "hinge.leaf": {
    id: 136,
    label: "Leaf Hinge",
    category: "premium",
    kind: "hinge",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.42,
    bounds: { x: -86, y: -58, w: 172, h: 116 },
    draw: drawHingeLeaf
  },
  "joint.link": {
    id: 137,
    label: "Link Joint",
    category: "premium",
    kind: "hinge",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.38,
    bounds: { x: -38, y: -96, w: 76, h: 192 },
    draw: drawLinkJoint
  },
  "joint.ball": {
    id: 138,
    label: "Ball Joint",
    category: "premium",
    kind: "hinge",
    premium: true,
    owned: false,
    canDuplicate: true,
    previewScale: 0.44,
    bounds: { x: -96, y: -38, w: 192, h: 76 },
    draw: drawBallJoint
  },
  "pipe.curve": { id: 15, label: "Curved Pipe", category: "pipe", kind: "pipe", owned: true, showInLibrary: false, draw: drawCurvePipe },
  "wire.arc": { id: 16, label: "Arc Wire", category: "pipe", kind: "pipe", owned: true, showInLibrary: false, draw: drawCurvePipe },
  "samurai.kabuto": {
    id: 201,
    label: "Samurai Kabuto",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -164, y: -132, w: 328, h: 236 },
    draw: drawSamuraiKabuto
  },
  "samurai.katana.peek": {
    id: 202,
    label: "Katana Peek",
    category: "head",
    kind: "accessory",
    owned: true,
    showInLibrary: false,
    bounds: { x: -42, y: -138, w: 84, h: 306 },
    draw: drawKatanaPeek
  },
  "pack.gas.reader": {
    id: 203,
    label: "Backpack Gas Reader",
    category: "back",
    kind: "pack",
    owned: true,
    showInLibrary: false,
    bounds: { x: -58, y: -24, w: 116, h: 48 },
    draw: drawPackGasReaderPart
  },
  "lamp.bulb.head": {
    id: 204,
    label: "Lamp Bulb Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -118, y: -126, w: 236, h: 326 },
    draw: drawLampBulbHead
  },
  "frankenstein.monster.head": {
    id: 205,
    label: "Frankenstein Monster Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -124, y: -130, w: 248, h: 260 },
    draw: drawFrankensteinMonsterHead
  },
  "spaceman.helmet.head": {
    id: 206,
    label: "Spaceman Helmet Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -132, y: -132, w: 264, h: 284 },
    draw: drawSpacemanHelmetHead
  },
  "oldcomputer.crt.head": {
    id: 207,
    label: "Old Computer CRT Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -140, y: -120, w: 280, h: 252 },
    draw: drawOldComputerCrtHead
  },
  "gameboy.dmg.head": {
    id: 208,
    label: "Game Boy DMG Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -112, y: -132, w: 224, h: 280 },
    draw: drawGameboyDmgHead
  },
  "ledger.btc.head": {
    id: 209,
    label: "Ledger BTC Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -134, y: -128, w: 276, h: 260 },
    draw: drawLedgerBtcHead
  },
  "ledger.eth.head": {
    id: 214,
    label: "Ledger ETH Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -134, y: -128, w: 276, h: 260 },
    draw: drawLedgerBtcHead
  },
  "battery.charge.head": {
    id: 215,
    label: "Battery Charge Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -150, y: -190, w: 300, h: 328 },
    draw: drawBatteryChargeHead
  },
  "magnet.u.head": {
    id: 216,
    label: "Magnet Head",
    category: "head",
    kind: "head",
    owned: true,
    showInLibrary: false,
    bounds: { x: -170, y: -190, w: 340, h: 370 },
    draw: drawMagnetUHead
  },
  "face.stroke": {
    id: 190,
    label: "Face Stroke",
    category: "face",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -88, y: -12, w: 176, h: 24 },
    draw: drawFaceStroke
  },
  "face.pupil": {
    id: 191,
    label: "Face Pupil",
    category: "face",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -24, y: -24, w: 48, h: 48 },
    draw: drawFacePupil
  },
  "drop.liquid": { id: 18, label: "Liquid Drop", category: "liquid", kind: "liquid", owned: true, showInLibrary: false, draw: drawLiquidDrop },
  "smoke.curl": { id: 19, label: "Smoke Curl", category: "micro", kind: "micro", owned: true, showInLibrary: false, draw: drawSmokeCurl },
  "spark.star": { id: 20, label: "Spark Star", category: "micro", kind: "micro", owned: true, showInLibrary: false, draw: drawSpark },
  "frame.box": { id: 21, label: "Frame Box", category: "frame", kind: "frame", owned: true, showInLibrary: false, draw: drawFrameBox },
  "pack.shoulder.shell": {
    id: 194,
    label: "One Shoulder Pack Shell",
    category: "back",
    kind: "pack",
    owned: true,
    showInLibrary: false,
    bounds: { x: -92, y: -148, w: 176, h: 296 },
    draw: drawShoulderPackShell
  },
  "pack.shoulder.band": {
    id: 195,
    label: "One Shoulder Pack Band",
    category: "back",
    kind: "pack",
    owned: true,
    showInLibrary: false,
    bounds: { x: -92, y: -170, w: 136, h: 340 },
    draw: drawShoulderPackBand
  },
  "counter.block": {
    id: 196,
    label: "Block Flip Counter",
    category: "chain",
    kind: "counter",
    owned: true,
    showInLibrary: false,
    bounds: { x: -108, y: -28, w: 216, h: 56 },
    draw: drawBlockCounter
  },
  "counter.transferScars": {
    id: 198,
    label: "Transfer Scar Ledger",
    category: "chain",
    kind: "counter",
    owned: true,
    showInLibrary: false,
    bounds: { x: -116, y: -50, w: 232, h: 100 },
    draw: drawTransferScarLedger
  },
  "counter.saleScreen": {
    id: 199,
    label: "Sale Scar Screen",
    category: "chain",
    kind: "counter",
    owned: true,
    showInLibrary: false,
    bounds: { x: -34, y: -27, w: 68, h: 54 },
    draw: drawSaleScarScreenPart
  },
  "counter.transferTally": {
    id: 200,
    label: "Transfer Tally Scars",
    category: "chain",
    kind: "counter",
    owned: true,
    showInLibrary: false,
    bounds: { x: -54, y: -38, w: 108, h: 76 },
    draw: drawTransferTallyScarsPart
  },
  "special.rare.head": {
    id: 201,
    label: "Special Rare Head Shell",
    category: "special",
    kind: "special",
    owned: true,
    showInLibrary: false,
    bounds: { x: -184, y: -164, w: 368, h: 324 },
    draw: drawSpecialRareHead
  },
  "special.rare.body": {
    id: 202,
    label: "Special Rare Body Shell",
    category: "special",
    kind: "special",
    owned: true,
    showInLibrary: false,
    bounds: { x: -260, y: -160, w: 520, h: 400 },
    draw: drawSpecialRareBody
  },
  "pack.icon": {
    id: 197,
    label: "Backpack Icon",
    category: "back",
    kind: "pack",
    owned: true,
    showInLibrary: false,
    bounds: { x: -92, y: -112, w: 184, h: 210 },
    draw: drawPackIcon
  }
};
function getPart(key) {
  return PARTS[key];
}
function partBounds(part) {
  const def = getPart(part.key);
  if (!def) return { x: -44, y: -44, w: 88, h: 88 };
  if (def.bounds) return { ...def.bounds };
  if (def.kind === "gear" || def.kind === "wheel") {
    const r = (def.radius || 54) + 30;
    return { x: -r, y: -r, w: r * 2, h: r * 2 };
  }
  if (part.key === "tank.round") return { x: -104, y: -108, w: 208, h: 216 };
  if (part.key === "tank.head.square") return { x: -112, y: -136, w: 224, h: 272 };
  if (part.key === "tank.core") return { x: -108, y: -88, w: 216, h: 176 };
  if (part.key === "tank.vials") return { x: -76, y: -124, w: 152, h: 248 };
  if (def.kind === "tank") return { x: -70, y: -140, w: 140, h: 280 };
  if (part.key === "pipe.straight" || part.key === "valve.steam") return { x: -92, y: -34, w: 184, h: 68 };
  if (part.key === "pipe.elbow") return { x: -88, y: -108, w: 196, h: 190 };
  if (part.key === "pipe.ghost") return { x: -88, y: -52, w: 176, h: 100 };
  if (def.kind === "coil") return { x: -54, y: -104, w: 108, h: 218 };
  if (def.kind === "chain") return { x: -92, y: -32, w: 184, h: 64 };
  if (part.key === "spring.compact") return { x: -92, y: -30, w: 184, h: 60 };
  if (part.key === "bracket.corner") return { x: -68, y: -52, w: 112, h: 108 };
  if (part.key === "strip.rivet") return { x: -88, y: -22, w: 176, h: 44 };
  if (part.key === "hand.clock") return { x: -28, y: -18, w: 124, h: 36 };
  if (part.key === "tooth.shard") return { x: -42, y: -42, w: 84, h: 84 };
  if (part.key === "mark.graphite") return { x: -68, y: -42, w: 136, h: 84 };
  if (part.key === "arc.lightning") return { x: -66, y: -48, w: 132, h: 72 };
  if (part.key === "lens.aperture") return { x: -58, y: -58, w: 116, h: 116 };
  if (part.key === "rail.notched") return { x: -104, y: -28, w: 208, h: 56 };
  return { x: -42, y: -42, w: 84, h: 84 };
}
function getPartRadius(part) {
  const def = getPart(part.key);
  const scale = ((part.scaleX || 1) + (part.scaleY || 1)) / 2;
  return (def?.radius || 48) * scale;
}
function transformConnector(part, connector) {
  const sx = part.scaleX || 1;
  const sy = part.scaleY || 1;
  const rotation = part.rotation || 0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const x = connector.x * sx;
  const y = connector.y * sy;
  return {
    id: connector.id,
    kind: connector.kind,
    placementId: part.id,
    x: part.x + x * cos - y * sin,
    y: part.y + x * sin + y * cos
  };
}
function getConnectors(part) {
  const def = getPart(part.key);
  return (def?.connectors || []).map((connector) => transformConnector(part, connector));
}
function getVisualConnectors(part) {
  const def = getPart(part.key);
  const connectors = getConnectors(part);
  if (connectors.length) return connectors;
  if (def?.kind === "gear" || def?.kind === "wheel" || def?.kind === "bevel") {
    const r = getPartRadius(part) / (((part.scaleX || 1) + (part.scaleY || 1)) / 2);
    return [
      { id: "north", x: 0, y: -r, kind: "gear" },
      { id: "east", x: r, y: 0, kind: "gear" },
      { id: "south", x: 0, y: r, kind: "gear" },
      { id: "west", x: -r, y: 0, kind: "gear" }
    ].map((connector) => transformConnector(part, connector));
  }
  return [];
}
function createEffectCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas2 = document.createElement("canvas");
  canvas2.width = width;
  canvas2.height = height;
  return canvas2;
}
function drawPart(ctx2, part, state) {
  const def = getPart(part.key);
  if (!def) return;
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  const pad = 96;
  const width = Math.max(1, Math.ceil(bounds.w + pad * 2));
  const height = Math.max(1, Math.ceil(bounds.h + pad * 2));
  const localPart = {
    ...part,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1
  };
  const shadeStyle = shadeStyleFor(localPart, state);
  const drawState = { ...state, shadeStyle };
  const cacheKey = staticPartCacheKey(localPart, drawState, shadeStyle, width, height);
  let effectCanvas = cacheKey ? STATIC_PART_CACHE.get(cacheKey) : null;
  if (cacheKey && effectCanvas) staticPartCacheHits += 1;
  if (!effectCanvas) {
    if (cacheKey) staticPartCacheMisses += 1;
    effectCanvas = createEffectCanvas(width, height);
    const effectCtx = effectCanvas.getContext("2d");
    effectCtx.save();
    effectCtx.translate(pad - bounds.x, pad - bounds.y);
    def.draw(effectCtx, localPart, drawState);
    applyMaterialFinish(effectCtx, localPart, drawState);
    if (shadeStyle !== "cleanLine" && drawState.fastStill !== true) drawOuterPencilEdge(effectCtx, localPart);
    applyShadeFinish(effectCtx, localPart, shadeStyle, drawState);
    applySpecialSkinFinish(effectCtx, localPart, drawState);
    const activeSkin = drawState.specialMaterialSkin || drawState.materialSkin;
    if (isGoldenEditionSkin(activeSkin) && localPart.key === "pack.icon") {
      drawPackIconGasReadoutOverlay(effectCtx, localPart, drawState);
    }
    if (part.locked || part.owned === false) drawLockedHatch(effectCtx, localPart);
    effectCtx.restore();
    rememberStaticPartCanvas(cacheKey, effectCanvas);
  }
  ctx2.save();
  ctx2.globalAlpha *= part.opacity ?? 1;
  ctx2.globalAlpha *= part.locked || part.owned === false ? 0.42 : 1;
  ctx2.translate(part.x, part.y);
  ctx2.rotate(part.rotation || 0);
  ctx2.scale((part.flipX ? -1 : 1) * (part.scaleX || 1), (part.flipY ? -1 : 1) * (part.scaleY || 1));
  if (state?.canvasMode === "tealPfp") {
    ctx2.shadowColor = "rgba(0,0,0,0.28)";
    ctx2.shadowBlur = 5;
    ctx2.shadowOffsetY = 2;
    ctx2.filter = "contrast(1.45) saturate(1.2)";
    ctx2.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx2.shadowBlur = 0;
    const boostedAlpha = ctx2.globalAlpha;
    ctx2.globalAlpha = boostedAlpha * 0.9;
    ctx2.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx2.globalAlpha = boostedAlpha * 0.72;
    ctx2.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx2.globalAlpha = boostedAlpha * 0.54;
    ctx2.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx2.filter = "none";
  } else {
    ctx2.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
  }
  ctx2.restore();
}
function drawLockedHatch(ctx2, part) {
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  ctx2.save();
  ctx2.strokeStyle = "rgba(0,0,0,0.26)";
  ctx2.lineWidth = 1;
  ctx2.setLineDash([5, 5]);
  ctx2.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx2.setLineDash([]);
  for (let x = bounds.x - bounds.h; x < bounds.x + bounds.w; x += 16) {
    ctx2.beginPath();
    ctx2.moveTo(x, bounds.y + bounds.h);
    ctx2.lineTo(x + bounds.h, bounds.y);
    ctx2.stroke();
  }
  ctx2.restore();
}

// web/src/renderer.js
var BASE_BLUEPRINT_URL = "/concepts/base-mechanical-canvas-blueprint.png";
var baseBlueprintImage;
var CANVAS_LOOKS = {
  tealPfp: {
    pfp: true,
    paper: "#12d8ba",
    glow: "rgba(255,255,255,0)",
    grid: "rgba(13,82,76,0.08)",
    gridFine: "rgba(13,82,76,0.035)",
    border: "rgba(5,74,70,0.26)",
    borderSoft: "rgba(255,255,255,0.18)",
    text: "rgba(7,24,24,0.74)",
    textSoft: "rgba(7,24,24,0.46)",
    guide: "rgba(87,255,222,0.64)",
    guideWeak: "rgba(87,255,222,0.24)",
    nodeFill: "#12d8ba",
    imageAlpha: 0
  },
  whiteBlueprint: {
    paper: "#fbfaf5",
    glow: "rgba(255,255,255,0)",
    grid: "rgba(0,0,0,0.07)",
    gridFine: "rgba(0,0,0,0.035)",
    border: "rgba(47,58,57,0.22)",
    borderSoft: "rgba(0,0,0,0.13)",
    text: "rgba(0,0,0,0.78)",
    textSoft: "rgba(0,0,0,0.48)",
    guide: "rgba(0,0,0,0.34)",
    guideWeak: "rgba(0,0,0,0.16)",
    nodeFill: "#fbfaf5",
    imageAlpha: 0.16
  },
  darkTerminal: {
    paper: "#0e7b70",
    glow: "rgba(179,255,232,0.08)",
    grid: "rgba(215,255,244,0.12)",
    gridFine: "rgba(215,255,244,0.045)",
    border: "rgba(225,255,246,0.36)",
    borderSoft: "rgba(225,255,246,0.16)",
    text: "rgba(241,255,250,0.86)",
    textSoft: "rgba(241,255,250,0.58)",
    guide: "rgba(176,255,232,0.46)",
    guideWeak: "rgba(176,255,232,0.18)",
    nodeFill: "#0e7b70",
    imageAlpha: 0.05
  },
  rustArchive: {
    paper: "#efe5d0",
    glow: "rgba(141,73,31,0.11)",
    grid: "rgba(82,43,24,0.11)",
    gridFine: "rgba(82,43,24,0.052)",
    border: "rgba(82,43,24,0.38)",
    borderSoft: "rgba(82,43,24,0.18)",
    text: "rgba(49,31,22,0.78)",
    textSoft: "rgba(49,31,22,0.52)",
    guide: "rgba(82,43,24,0.38)",
    guideWeak: "rgba(82,43,24,0.18)",
    nodeFill: "#efe5d0",
    imageAlpha: 0.18
  },
  labGlass: {
    paper: "#f5fbfc",
    glow: "rgba(83,180,207,0.08)",
    grid: "rgba(40,120,159,0.11)",
    gridFine: "rgba(40,120,159,0.045)",
    border: "rgba(40,120,159,0.34)",
    borderSoft: "rgba(40,120,159,0.16)",
    text: "rgba(20,59,72,0.78)",
    textSoft: "rgba(20,59,72,0.5)",
    guide: "rgba(40,120,159,0.38)",
    guideWeak: "rgba(40,120,159,0.17)",
    nodeFill: "#f5fbfc",
    imageAlpha: 0.14
  },
  relic: {
    paper: "#f3ead1",
    glow: "rgba(204,150,38,0.12)",
    grid: "rgba(96,65,20,0.1)",
    gridFine: "rgba(96,65,20,0.045)",
    border: "rgba(96,65,20,0.42)",
    borderSoft: "rgba(96,65,20,0.19)",
    text: "rgba(66,45,17,0.8)",
    textSoft: "rgba(66,45,17,0.52)",
    guide: "rgba(96,65,20,0.4)",
    guideWeak: "rgba(96,65,20,0.18)",
    nodeFill: "#f3ead1",
    imageAlpha: 0.16
  }
};
function canvasLook(layout) {
  return CANVAS_LOOKS[layout?.canvas?.mode] || CANVAS_LOOKS.whiteBlueprint;
}
function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(-1, Math.min(1, number));
}
function buildMouseLook(width, height, chainState2 = {}, options = {}) {
  const source = options.mouseLook || chainState2.mouseLook || {};
  const x = Number(source.x ?? source.canvasX);
  const y = Number(source.y ?? source.canvasY);
  const hasPoint = Number.isFinite(x) && Number.isFinite(y);
  const hasNorm = Number.isFinite(Number(source.xNorm ?? source.lookX)) || Number.isFinite(Number(source.yNorm ?? source.lookY));
  const active = source.active !== false && (hasPoint || hasNorm);
  const strength = active ? Math.max(0, Math.min(1.35, Number(source.strength ?? 1))) : 0;
  const lookX = clampUnit(hasPoint ? (x / Math.max(1, width) - 0.5) * 2 : Number(source.xNorm ?? source.lookX ?? 0));
  const lookY = clampUnit(hasPoint ? (y / Math.max(1, height) - 0.5) * 2 : Number(source.yNorm ?? source.lookY ?? 0));
  return {
    active,
    x: hasPoint ? x : width * 0.5,
    y: hasPoint ? y : height * 0.5,
    lookX,
    lookY,
    eyeX: lookX * 22 * strength,
    eyeY: lookY * 15 * strength,
    leanX: lookX * strength,
    leanY: lookY * strength,
    strength
  };
}
function applyMouseLean(ctx2, width, height, mouseLook2, look) {
  if (!mouseLook2?.active || !mouseLook2.strength) return;
  const x = mouseLook2.leanX || 0;
  const y = mouseLook2.leanY || 0;
  const pivotX = width * 0.5;
  const pivotY = height * (look?.pfp ? 0.78 : 0.72);
  ctx2.translate(pivotX + x * 7.5, pivotY + y * 4.2);
  ctx2.rotate(x * 0.018);
  ctx2.transform(1, -y * 6e-3, -x * 5e-3, 1, 0, 0);
  ctx2.translate(-pivotX, -pivotY);
}
var marketplaceBaseCache = null;
var dragFrameCache = null;
function createLayerCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas2 = document.createElement("canvas");
  canvas2.width = width;
  canvas2.height = height;
  return canvas2;
}
function isMarketplaceDynamicPart(part, def) {
  const key = String(part?.key || "");
  if (key.startsWith("counter.") || key === "pack.gas.reader") return true;
  if (part?.liveGasMeter || part?.role === "chain" || part?.traitLayer === "chain") return true;
  if (part?.expression || key.startsWith("face.") || String(part?.facePart || "")) return true;
  return part?.motion !== false && part?.static !== true && !def?.noExternalRotate && (def?.kind === "gear" || def?.kind === "wheel");
}
function marketplaceBaseCacheKey(layout, chainState2, width, height) {
  const skin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || {};
  return [
    layout?.tokenId,
    layout?.traitHash,
    layout?.__renderRevision || layout?.cacheRevision || 0,
    width,
    height,
    layout?.canvas?.backgroundColor,
    layout?.canvas?.mode,
    skin.id || skin.label || "",
    pressureLevel(chainState2),
    Math.round(Number(chainState2?.gasPressure ?? chainState2?.baseFeeGwei ?? 0) || 0),
    Number(chainState2?.saleCount || 0),
    Number(chainState2?.transferCount || 0)
    // blockNumber intentionally omitted: it increments every block and is only drawn by the LIVE
    // counter (a `counter.` part, never baked), so including it needlessly re-baked the static layer each poll.
  ].join("|");
}
function createStaticSegmentLayer(width, height, parts, staticState) {
  if (!parts.length) return null;
  const pad = 96;
  let box = null;
  for (const part of parts) {
    const bounds = placementBounds(part);
    const next = {
      x: Math.max(0, Math.floor(bounds.x - pad)),
      y: Math.max(0, Math.floor(bounds.y - pad)),
      w: Math.ceil(bounds.w + pad * 2),
      h: Math.ceil(bounds.h + pad * 2)
    };
    next.w = Math.min(width - next.x, next.w);
    next.h = Math.min(height - next.y, next.h);
    if (!box) {
      box = next;
    } else {
      const x1 = Math.min(box.x, next.x);
      const y1 = Math.min(box.y, next.y);
      const x2 = Math.max(box.x + box.w, next.x + next.w);
      const y2 = Math.max(box.y + box.h, next.y + next.h);
      box = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
  }
  if (!box || box.w <= 0 || box.h <= 0) return null;
  const canvas2 = createLayerCanvas(box.w, box.h);
  const layerCtx = canvas2.getContext("2d");
  layerCtx.clearRect(0, 0, box.w, box.h);
  layerCtx.save();
  layerCtx.translate(-box.x, -box.y);
  for (const part of parts) {
    drawPart(layerCtx, { ...part }, staticState);
  }
  layerCtx.restore();
  return { canvas: canvas2, x: box.x, y: box.y };
}
function pushMarketplaceStaticStep(steps, parts, width, height, staticState) {
  const layer = createStaticSegmentLayer(width, height, parts, staticState);
  if (layer) steps.push({ type: "static", layer });
}
function getMarketplaceRenderCache(width, height, layout, chainState2, look, placements, liquidState, specialMaterialSkin) {
  const key = marketplaceBaseCacheKey(layout, chainState2, width, height);
  if (marketplaceBaseCache?.key === key && marketplaceBaseCache.background && marketplaceBaseCache.steps) return marketplaceBaseCache;
  const background = createLayerCanvas(width, height);
  const backgroundCtx = background.getContext("2d");
  backgroundCtx.clearRect(0, 0, width, height);
  drawBackground(backgroundCtx, width, height, layout, chainState2, 0, look);
  const staticState = {
    ...liquidState,
    time: 0,
    previewMotion: false,
    mouseLook: { active: false, x: width * 0.5, y: height * 0.5, eyeX: 0, eyeY: 0 },
    specialMaterialSkin,
    fastStill: true,
    motionSpeed: 0
  };
  const steps = [];
  let staticRun = [];
  for (const original of placements) {
    const def = getPart(original.key);
    if (isMarketplaceDynamicPart(original, def)) {
      pushMarketplaceStaticStep(steps, staticRun, width, height, staticState);
      staticRun = [];
      steps.push({ type: "dynamic", part: { ...original } });
    } else {
      staticRun.push(original);
    }
  }
  pushMarketplaceStaticStep(steps, staticRun, width, height, staticState);
  marketplaceBaseCache = { key, background, steps };
  return marketplaceBaseCache;
}
function dragFrameCacheKey(layout, chainState2, width, height, placements, selectedId) {
  const skin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || {};
  const staticSignature = placements.filter((part) => part.id !== selectedId).map((part) => [
    part.id,
    Math.round(Number(part.x || 0) * 10),
    Math.round(Number(part.y || 0) * 10),
    Math.round(Number(part.rotation || 0) * 1e3),
    Math.round(Number(part.scaleX || 1) * 100),
    Math.round(Number(part.scaleY || part.scaleX || 1) * 100)
  ].join(",")).join(";");
  return [
    "drag",
    layout?.tokenId,
    layout?.traitHash,
    width,
    height,
    selectedId,
    layout?.canvas?.backgroundColor,
    layout?.canvas?.mode,
    skin.id || skin.label || "",
    pressureLevel(chainState2),
    Math.round(Number(chainState2?.gasPressure ?? chainState2?.baseFeeGwei ?? 0) || 0),
    Number(chainState2?.saleCount || 0),
    Number(chainState2?.transferCount || 0),
    staticSignature
  ].join("|");
}
function getDragFrameLayer(width, height, layout, chainState2, look, placements, liquidState, specialMaterialSkin, selectedId) {
  const key = dragFrameCacheKey(layout, chainState2, width, height, placements, selectedId);
  if (dragFrameCache?.key === key && dragFrameCache.canvas) return dragFrameCache.canvas;
  const canvas2 = createLayerCanvas(width, height);
  const layerCtx = canvas2.getContext("2d");
  layerCtx.clearRect(0, 0, width, height);
  drawBackground(layerCtx, width, height, layout, chainState2, 0, look);
  const staticState = {
    ...liquidState,
    time: 0,
    previewMotion: false,
    mouseLook: { active: false, x: width * 0.5, y: height * 0.5, eyeX: 0, eyeY: 0 },
    specialMaterialSkin,
    fastStill: true,
    motionSpeed: 0
  };
  for (const original of placements) {
    if (original.id === selectedId) continue;
    drawPart(layerCtx, { ...original }, staticState);
  }
  dragFrameCache = { key, canvas: canvas2 };
  return canvas2;
}
function applyMarketplaceBodyBounce(ctx2, width, height, time, chainState2, look) {
  const pressure = pressureLevel(chainState2);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState2.heartbeatPulse || 0)));
  const pressureBoost = pressure === "extreme" ? 1.24 : pressure === "high" ? 1.12 : pressure === "medium" ? 1.04 : 0.96;
  const bondSeconds = holderBondSeconds(chainState2);
  const bondStability = bondSeconds >= 365 * 86400 ? 0.58 : bondSeconds >= 90 * 86400 ? 0.72 : bondSeconds >= 7 * 86400 ? 0.86 : 1;
  const amp = pressureBoost * bondStability * (look?.pfp ? 1.18 : 1.06);
  const x = Math.sin(time * 0.74) * 0.78 * amp;
  const y = Math.sin(time * 1.54) * 2.65 * amp - heartbeat * 1.05;
  const rotation = Math.sin(time * 0.86) * 32e-4 * amp + heartbeat * 18e-4;
  const pivotX = width * 0.5;
  const pivotY = height * (look?.pfp ? 0.74 : 0.7);
  ctx2.translate(pivotX + x, pivotY + y);
  ctx2.rotate(rotation);
  ctx2.translate(-pivotX, -pivotY);
}
function drawMachine(ctx2, layout, chainState2 = {}, options = {}) {
  const width = layout?.canvas?.width || 1600;
  const height = layout?.canvas?.height || 1100;
  const suppliedMotionTime = Number(options.motionTime);
  const time = options.previewMotion === false ? 0 : Number.isFinite(suppliedMotionTime) ? suppliedMotionTime : performance.now() / 1e3;
  const performanceMode = options.performanceMode || "normal";
  const dragFastPath = performanceMode === "drag";
  const marketplaceFastPath = performanceMode === "marketplace";
  blinkPhaseOffset = Math.abs(Number(layout?.tokenId) || 1) * 1.371 % 3.25;
  if (ctx2.canvas.width !== width) ctx2.canvas.width = width;
  if (ctx2.canvas.height !== height) ctx2.canvas.height = height;
  const look = canvasLook(layout);
  const mouseLook2 = buildMouseLook(width, height, chainState2, options);
  const specialMaterialSkin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || null;
  const liquidState = buildLiquidState(layout, chainState2, time, options.previewMotion !== false);
  const liveMotion = buildLiveMotionState(chainState2);
  const placements = [...layout?.placements || []].sort((a, b) => (a.z ?? a.zIndex ?? 0) - (b.z ?? b.zIndex ?? 0));
  const connections = options.connections || layout?.connections || [];
  const editMode = options.editMode !== false;
  const useMarketplaceStaticCache = marketplaceFastPath && options.previewMotion !== false && editMode === false && !options.selected;
  const useDragStaticCache = dragFastPath && editMode === false && Boolean(options.selected);
  const selectedId = options.selected?.id;
  let marketplaceRenderCache = null;
  ctx2.clearRect(0, 0, width, height);
  if (useMarketplaceStaticCache) {
    marketplaceRenderCache = getMarketplaceRenderCache(width, height, layout, chainState2, look, placements, liquidState, specialMaterialSkin);
    ctx2.drawImage(marketplaceRenderCache.background, 0, 0);
  } else if (useDragStaticCache) {
    const dragLayer = getDragFrameLayer(width, height, layout, chainState2, look, placements, liquidState, specialMaterialSkin, selectedId);
    ctx2.drawImage(dragLayer, 0, 0);
  } else {
    drawBackground(ctx2, width, height, layout, chainState2, time, look);
  }
  const machineLean = mouseLook2.active && !useDragStaticCache && options.previewMotion !== false && options.mouseLean !== false && (!editMode || options.mouseLeanInEdit === true);
  const marketplaceBodyBounce = useMarketplaceStaticCache && options.marketplaceBounce !== false;
  const lifeMotion = buildLifeMotion(layout, chainState2, time, {
    enabled: options.previewMotion !== false && !marketplaceFastPath && options.lifeMotion !== false && (!editMode || options.lifeMotionInEdit === true),
    pfp: Boolean(look.pfp)
  });
  if (machineLean || marketplaceBodyBounce) {
    ctx2.save();
    if (machineLean) applyMouseLean(ctx2, width, height, mouseLook2, look);
    if (marketplaceBodyBounce) applyMarketplaceBodyBounce(ctx2, width, height, time, chainState2, look);
  }
  if (editMode) {
    drawConnectionGuides(ctx2, placements, connections, time, options.previewMotion !== false, liquidState, look);
  }
  const rotationMap = buildRotationMap(placements, connections);
  const drawAnimatedPart = (original) => {
    const part = { ...original };
    const def = getPart(part.key);
    const partCanMove = original.motion !== false && original.static !== true;
    const isExpressionLayer = part.role === "expression" || part.expression === true || part.material === "pfpFace" || def?.kind === "face" || String(part.key || "").startsWith("face.");
    applyLifeMotion(part, lifeMotion, def);
    if (marketplaceFastPath && options.previewMotion !== false && isExpressionLayer) {
      applyBlinkMotion(part, { blink: blinkAmount(time) });
    }
    if (mouseLook2.active && part.facePart && String(part.facePart).includes("EyePupil")) {
      part.x += mouseLook2.eyeX * 0.82;
      part.y += mouseLook2.eyeY * 0.68;
    }
    if (options.previewMotion !== false && partCanMove && !def?.noExternalRotate && (def?.kind === "gear" || def?.kind === "wheel")) {
      const defaultSpeed = def.kind === "wheel" ? 0.42 : 0.3;
      const speed = part.spinSpeed != null ? part.spinSpeed : rotationMap.get(part.id) || defaultSpeed;
      part.rotation = (part.rotation || 0) + time * speed * liveMotion.speedMultiplier;
    }
    drawPart(ctx2, part, {
      ...liquidState,
      mouseLook: mouseLook2,
      specialMaterialSkin,
      fastStill: options.fastStill === true,
      previewMotion: partCanMove ? liquidState.previewMotion : false,
      motionSpeed: partCanMove ? (rotationMap.get(part.id) || (def?.kind === "wheel" ? 0.42 : def?.kind === "gear" ? 0.3 : 0)) * liveMotion.speedMultiplier : 0
    });
  };
  if (useDragStaticCache && options.selected) {
    drawAnimatedPart(options.selected);
  } else if (useMarketplaceStaticCache && marketplaceRenderCache) {
    for (const step of marketplaceRenderCache.steps) {
      if (step.type === "static") {
        ctx2.drawImage(step.layer.canvas, step.layer.x, step.layer.y);
      } else {
        drawAnimatedPart(step.part);
      }
    }
  } else {
    for (const original of placements) {
      drawAnimatedPart(original);
    }
  }
  if (!dragFastPath && !marketplaceFastPath) {
    drawSpecialMaterialAtmosphere(ctx2, width, height, layout, chainState2, time, look, specialMaterialSkin);
  }
  if (!dragFastPath && !marketplaceFastPath) {
    drawLiveChainEffects(ctx2, width, height, layout, placements, chainState2, time, look);
  }
  if (!dragFastPath && !marketplaceFastPath) {
    drawHistoryEvolution(ctx2, width, height, layout, placements, chainState2, time, look);
  }
  if (typeof options.drawOverlay === "function") options.drawOverlay(ctx2, { width, height, mouseLook: mouseLook2, time });
  if (machineLean || marketplaceBodyBounce) ctx2.restore();
  if (editMode && options.selected) {
    const selected2 = { ...options.selected };
    applyLifeMotion(selected2, lifeMotion, getPart(selected2.key));
    drawSelection(ctx2, selected2, look);
  }
}
function pressureLevel(chainState2 = {}) {
  const raw = Number(chainState2.gasPressure ?? chainState2.baseFeeGwei ?? chainState2.baseFee ?? 0);
  if (!Number.isFinite(raw)) return "low";
  if (raw >= 140) return "extreme";
  if (raw >= 60) return "high";
  if (raw >= 20) return "medium";
  return "low";
}
function secondsFromState(chainState2 = {}, secondsKey, daysKey) {
  const seconds = Number(chainState2[secondsKey]);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  const days = Number(chainState2[daysKey]);
  if (Number.isFinite(days) && days > 0) return days * 86400;
  return 0;
}
function archiveAgeSeconds(chainState2 = {}) {
  return secondsFromState(chainState2, "archiveAgeSeconds", "ageDays") || secondsFromState(chainState2, "ageSeconds", "age");
}
function holderBondSeconds(chainState2 = {}) {
  return secondsFromState(chainState2, "holderBondSeconds", "holderBondDays") || secondsFromState(chainState2, "bondSeconds", "bondDays");
}
function parseSaleWei(value) {
  if (typeof value === "bigint") return value;
  const text = String(value ?? "0").trim().toLowerCase();
  if (!text || text === "none" || text === "no major sale") return 0n;
  if (text === "mythic") return 10000000000000000000n;
  if (text === "legendary") return 7000000000000000000n;
  if (text === "royal") return 5000000000000000000n;
  if (text === "gold") return 2000000000000000000n;
  if (text === "silver") return 1000000000000000000n;
  if (text.startsWith("0x")) {
    try {
      return BigInt(text);
    } catch (_) {
      return 0n;
    }
  }
  if (/^\d+$/.test(text) && text.length > 15) return BigInt(text);
  if (!/^\d+(\.\d+)?(eth)?$/.test(text)) return 0n;
  const [whole, fraction = ""] = text.replace(/eth$/, "").split(".");
  return BigInt(whole || "0") * 1000000000000000000n + BigInt(fraction.padEnd(18, "0").slice(0, 18) || "0");
}
function saleTierRank(chainState2 = {}) {
  const label = String(chainState2.saleTier || chainState2.sale || "").toLowerCase();
  if (label.includes("mythic") || label === "10" || label === "10eth") return 5;
  if (label.includes("legendary") || label === "7" || label === "7eth") return 4;
  if (label.includes("royal") || label === "5" || label === "5eth") return 3;
  if (label.includes("gold") || label === "2" || label === "2eth") return 2;
  if (label.includes("silver") || label === "1" || label === "1eth") return 1;
  const wei = parseSaleWei(chainState2.highestVerifiedSaleWei ?? chainState2.highestSaleWei ?? chainState2.saleWei);
  if (wei >= 10000000000000000000n) return 5;
  if (wei >= 7000000000000000000n) return 4;
  if (wei >= 5000000000000000000n) return 3;
  if (wei >= 2000000000000000000n) return 2;
  if (wei >= 1000000000000000000n) return 1;
  return 0;
}
function buildLiveMotionState(chainState2 = {}) {
  const pressure = pressureLevel(chainState2);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState2.heartbeatPulse || 0)));
  const pressureBoost = pressure === "extreme" ? 2.05 : pressure === "high" ? 1.55 : pressure === "medium" ? 1.22 : 1;
  return {
    pressure,
    heartbeat,
    speedMultiplier: pressureBoost + heartbeat * 0.12
  };
}
function buildLifeMotion(layout, chainState2, time, options = {}) {
  if (!options.enabled) return { enabled: false };
  const pressure = pressureLevel(chainState2);
  const pressureBoost = pressure === "extreme" ? 2.15 : pressure === "high" ? 1.55 : pressure === "medium" ? 1.12 : 0.92;
  const heartbeat = Math.max(0, Math.min(1, Number(chainState2.heartbeatPulse || 0)));
  const bondSeconds = holderBondSeconds(chainState2);
  const bondStability = bondSeconds >= 365 * 86400 ? 0.5 : bondSeconds >= 90 * 86400 ? 0.68 : bondSeconds >= 7 * 86400 ? 0.84 : 1;
  const transferShake = Math.min(0.55, Number(chainState2.transferCount || 0) * 0.035);
  const pfpBoost = options.pfp ? 1.15 : 1;
  const amp = pfpBoost * pressureBoost * bondStability;
  return {
    enabled: true,
    time,
    bodyY: Math.sin(time * 1.55) * 2.2 * amp,
    bodyX: Math.sin(time * 0.73) * 0.7 * amp,
    headY: Math.sin((time - 0.18) * 1.55) * 3.1 * amp - heartbeat * 1.6,
    headX: Math.sin((time - 0.18) * 0.78) * 0.95 * amp,
    faceY: Math.sin((time - 0.46) * 1.72) * 3.9 * amp + Math.sin(time * 4.1) * 0.22 * pressureBoost - heartbeat * 2.4,
    faceX: Math.sin((time - 0.55) * 0.88) * 1.25 * amp + Math.sin(time * 2.35) * 0.2 * pressureBoost,
    faceRotation: Math.sin((time - 0.62) * 1.28) * 6e-3 * pressureBoost * bondStability + heartbeat * 4e-3,
    faceScale: 1 + Math.sin((time - 0.34) * 2.1) * 7e-3 * pressureBoost * bondStability + heartbeat * 0.01,
    facePulse: 0.5 + Math.sin((time - 0.26) * 2.8) * 0.5,
    blink: blinkAmount(time),
    jitter: (0.18 + transferShake + heartbeat * 0.18) * pressureBoost * bondStability,
    rotation: 25e-4 * pressureBoost * bondStability,
    corePulse: Math.min(1, 0.5 + Math.sin(time * 2.2) * 0.5 + heartbeat * 0.42)
  };
}
var blinkPhaseOffset = 0;
function blinkAmount(time) {
  const cycle = 3.25;
  const phase = (time + 0.42 + blinkPhaseOffset) % cycle;
  if (phase > 0.42) return 0;
  if (phase < 0.1) return phase / 0.1;
  if (phase < 0.24) return 1;
  return 1 - (phase - 0.24) / 0.18;
}
function partNoise(id, time, salt) {
  return Math.sin(Number(id || 1) * 12.9898 + salt + time * (1.7 + Number(id || 1) % 5 * 0.11));
}
function applyBlinkMotion(part, motion) {
  const blink = Math.max(0, Math.min(1, motion.blink || 0));
  if (!blink || !part.blink) return;
  if (part.blink === "eyePupil") {
    part.scaleY = (part.scaleY || 1) * Math.max(0.035, 1 - blink * 0.965);
    part.scaleX = (part.scaleX || 1) * (1 + blink * 0.12);
    part.opacity = Math.max(0.03, (part.opacity ?? 1) * (1 - blink * 0.94));
    return;
  }
  if (part.blink === "eyeLine") {
    part.scaleX = (part.scaleX || 1) * (1 + blink * 0.12);
    part.scaleY = (part.scaleY || 1) * Math.max(0.52, 1 - blink * 0.36);
    part.rotation = (part.rotation || 0) * (1 - blink * 0.32);
    part.opacity = Math.min(1, (part.opacity ?? 1) + blink * 0.18);
  }
}
function applyLifeMotion(part, motion, def) {
  if (!motion?.enabled || part.static === true || part.motion === false) return part;
  const z = part.z ?? part.zIndex ?? 0;
  const isHeadLayer = z >= 40 && z < 73;
  const isCoreLayer = z >= 12 && z <= 18;
  const isExpressionLayer = part.role === "expression" || part.expression === true || part.material === "pfpFace" || def?.kind === "face" && z >= 55;
  const isBackLayer = part.role === "backAccessory" || part.traitLayer === "backAccessory" || def?.kind === "pack";
  const bodyX = isExpressionLayer ? motion.faceX : isHeadLayer ? motion.headX : motion.bodyX;
  const bodyY = isExpressionLayer ? motion.faceY : isHeadLayer ? motion.headY : motion.bodyY;
  const jitterScale = isExpressionLayer ? 1.42 : isHeadLayer ? 0.16 : isCoreLayer ? 0.65 : isBackLayer ? 0.38 : 1;
  const rotationScale = isExpressionLayer ? 1.25 : isHeadLayer ? 0.12 : isCoreLayer ? 0.45 : isBackLayer ? 0.35 : 1;
  part.x += bodyX + partNoise(part.id, motion.time, 3.2) * motion.jitter * jitterScale;
  part.y += bodyY + partNoise(part.id, motion.time, 8.7) * motion.jitter * jitterScale;
  if (part.lifeRotation !== false) {
    part.rotation = (part.rotation || 0) + partNoise(part.id, motion.time, 14.4) * motion.rotation * rotationScale;
  }
  if (isExpressionLayer) {
    part.rotation += motion.faceRotation;
    part.scaleX = (part.scaleX || 1) * motion.faceScale;
    part.scaleY = (part.scaleY || 1) * (1 + (motion.faceScale - 1) * 0.72);
    if (part.opacity != null && part.opacity < 0.98 && part.blink !== "eyePupil") {
      part.opacity = Math.min(1, part.opacity + motion.facePulse * 0.08);
    }
    applyBlinkMotion(part, motion);
  }
  if (isCoreLayer && part.opacity != null) {
    part.opacity = Math.min(1, part.opacity + motion.corePulse * 0.06);
  }
  return part;
}
function getBaseBlueprintImage() {
  if (typeof Image === "undefined") return null;
  if (!baseBlueprintImage) {
    baseBlueprintImage = new Image();
    baseBlueprintImage.src = BASE_BLUEPRINT_URL;
  }
  return baseBlueprintImage.complete && baseBlueprintImage.naturalWidth ? baseBlueprintImage : null;
}
function drawBackground(ctx2, width, height, layout, chainState2, time, look) {
  ctx2.save();
  ctx2.fillStyle = look.paper;
  ctx2.fillRect(0, 0, width, height);
  if (look.pfp) {
    ctx2.fillStyle = layout?.canvas?.backgroundColor || look.paper;
    ctx2.fillRect(0, 0, width, height);
    drawPfpSpecialBackdrop(ctx2, width, height, layout, time);
    ctx2.restore();
    return;
  }
  if (look.glow !== "rgba(255,255,255,0)") {
    const glow = ctx2.createRadialGradient(width * 0.5, height * 0.25, 0, width * 0.5, height * 0.25, width * 0.82);
    glow.addColorStop(0, look.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = glow;
    ctx2.fillRect(0, 0, width, height);
  }
  const image = getBaseBlueprintImage();
  if (image) {
    ctx2.globalAlpha = look.imageAlpha;
    ctx2.drawImage(image, 0, 0, width, height);
    ctx2.globalAlpha = 1;
  }
  ctx2.strokeStyle = look.grid;
  ctx2.lineWidth = 1;
  for (let x = 60; x < width; x += 80) {
    ctx2.beginPath();
    ctx2.moveTo(x, 0);
    ctx2.lineTo(x, height);
    ctx2.stroke();
  }
  for (let y = 60; y < height; y += 80) {
    ctx2.beginPath();
    ctx2.moveTo(0, y);
    ctx2.lineTo(width, y);
    ctx2.stroke();
  }
  ctx2.strokeStyle = look.border;
  ctx2.lineWidth = 2;
  ctx2.strokeRect(24, 24, width - 48, height - 48);
  ctx2.setLineDash([10, 12]);
  ctx2.strokeStyle = look.borderSoft;
  ctx2.strokeRect(54, 54, width - 108, height - 108);
  ctx2.setLineDash([]);
  drawBlueprintCross(ctx2, width / 2, height / 2, 74, look);
  drawBlueprintCross(ctx2, width * 0.62, height * 0.36, 42, look);
  drawBlueprintCross(ctx2, width * 0.36, height * 0.58, 38, look);
  ctx2.font = "18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx2.fillStyle = look.text;
  ctx2.fillText(`MECHANICAL CANVAS // TOKEN ${String(layout?.tokenId || 1).padStart(4, "0")}`, 48, 62);
  ctx2.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx2.fillStyle = look.textSoft;
  ctx2.fillText(`parts:${layout?.placements?.length || 0}  transfers:${chainState2.transferCount || 0}  wind:${chainState2.windCount || 0}`, 48, height - 42);
  ctx2.restore();
}
function hashSeed(value = "") {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
function seededUnit(seed, salt) {
  const raw = Math.sin((seed + salt * 1013) * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}
function drawPfpSpecialBackdrop(ctx2, width, height, layout, time) {
  const backdrop = layout?.canvas?.specialBackdrop || defaultPfpBackdrop(layout);
  const skin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || null;
  const seed = hashSeed(`${layout?.special?.id || layout?.name || "special"}:${backdrop.mode || "aura"}`);
  const accent = backdrop.accent || skin?.accent || "#6fffe2";
  const secondary = backdrop.secondary || skin?.secondary || "#d7a13a";
  const intensity = Math.max(0.25, Math.min(1.4, Number(backdrop.intensity || 0.8)));
  const pulse = 0.5 + Math.sin(time * (backdrop.pulseSpeed || 1.2)) * 0.5;
  ctx2.save();
  ctx2.globalCompositeOperation = "source-over";
  const aura = ctx2.createRadialGradient(width * 0.54, height * 0.43, 0, width * 0.54, height * 0.43, width * 0.72);
  aura.addColorStop(0, colorAlpha2(accent, 0.16 * intensity + pulse * 0.03));
  aura.addColorStop(0.46, colorAlpha2(secondary, 0.08 * intensity));
  aura.addColorStop(1, "rgba(255,255,255,0)");
  ctx2.fillStyle = aura;
  ctx2.fillRect(0, 0, width, height);
  ctx2.fillStyle = colorAlpha2("#ffffff", 0.08 * intensity);
  for (let i = 0; i < 46; i += 1) {
    const x = seededUnit(seed, i + 120) * width;
    const y = seededUnit(seed, i + 220) * height;
    const r = 0.8 + seededUnit(seed, i + 320) * 1.6;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    ctx2.fill();
  }
  drawMaterialSkinBackdropMotifs(ctx2, width, height, seed, skin, intensity, pulse);
  ctx2.restore();
}
function drawMaterialSkinBackdropMotifs(ctx2, width, height, seed, skin, intensity, pulse) {
  if (!skin) return;
  const surface = String(skin.surface || "").toLowerCase();
  const accent = skin.accent || "#6fffe2";
  const edge = skin.edge || accent;
  const primary = skin.primary || "#111111";
  if (["void", "cosmic"].includes(surface)) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.fillStyle = colorAlpha2("#ffffff", 0.22 * intensity);
    for (let i = 0; i < 70; i += 1) {
      const x = seededUnit(seed, i + 500) * width;
      const y = seededUnit(seed, i + 600) * height;
      const r = 0.6 + seededUnit(seed, i + 700) * (surface === "cosmic" ? 2.1 : 1.4);
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  } else if (["steam", "fog"].includes(surface)) {
    ctx2.save();
    ctx2.globalCompositeOperation = "screen";
    for (let i = 0; i < 12; i += 1) {
      const x = seededUnit(seed, i + 710) * width;
      const y = seededUnit(seed, i + 810) * height;
      const r = 46 + seededUnit(seed, i + 910) * 94;
      const fog = ctx2.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, colorAlpha2(edge, 0.08 + pulse * 0.03));
      fog.addColorStop(1, "rgba(255,255,255,0)");
      ctx2.fillStyle = fog;
      ctx2.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx2.restore();
  } else if (surface === "royalgold") {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha2(edge, 0.055 + pulse * 0.025);
    ctx2.lineWidth = 0.85;
    for (let i = 0; i < 8; i += 1) {
      const x = seededUnit(seed, i + 840) * width;
      const y = seededUnit(seed, i + 940) * height;
      const len = 10 + seededUnit(seed, i + 1040) * 22;
      ctx2.beginPath();
      ctx2.moveTo(x, y);
      ctx2.lineTo(x + len, y - len * (0.12 + seededUnit(seed, i + 1140) * 0.16));
      ctx2.stroke();
    }
    ctx2.fillStyle = colorAlpha2("#fff2a6", 0.14 * intensity);
    for (let i = 0; i < 54; i += 1) {
      const x = seededUnit(seed, i + 1240) * width;
      const y = seededUnit(seed, i + 1340) * height;
      const r = 0.8 + seededUnit(seed, i + 1440) * 2.6;
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  } else if (["molten", "volcanic", "electric", "sludge"].includes(surface)) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = colorAlpha2(accent, 0.12 + pulse * 0.08);
    ctx2.lineWidth = 1.4;
    for (let i = 0; i < 16; i += 1) {
      const x = seededUnit(seed, i + 930) * width;
      const y = seededUnit(seed, i + 1030) * height;
      const len = 22 + seededUnit(seed, i + 1130) * 68;
      ctx2.beginPath();
      ctx2.moveTo(x, y);
      ctx2.lineTo(x + (seededUnit(seed, i + 1230) - 0.5) * len, y + (seededUnit(seed, i + 1330) - 0.5) * len);
      ctx2.stroke();
    }
    ctx2.restore();
  } else if (["paper", "blueprint"].includes(surface)) {
    ctx2.save();
    ctx2.strokeStyle = colorAlpha2(surface === "blueprint" ? accent : primary, 0.06);
    ctx2.lineWidth = 1;
    for (let y = 80; y < height; y += 42) {
      ctx2.beginPath();
      ctx2.moveTo(40, y);
      ctx2.lineTo(width - 40, y + Math.sin(y * 0.1) * 4);
      ctx2.stroke();
    }
    ctx2.restore();
  }
}
function drawSpecialMaterialAtmosphere(ctx2, width, height, layout, chainState2, time, look, skin) {
  if (!skin || !look.pfp) return;
  const placements = layout?.placements || [];
  const body = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 8 && z <= 84 && part.assembly !== false;
  }) || { cx: width * 0.5, cy: height * 0.68, w: width * 0.52, h: height * 0.48 };
  const surface = String(skin.surface || "").toLowerCase();
  const seed = hashSeed(`${layout?.special?.id || layout?.name || "skin"}:${skin.id || skin.label}`);
  const pulse = 0.5 + Math.sin(time * 1.6 + seed * 1e-3) * 0.5;
  const accent = skin.accent || "#6fffe2";
  const edge = skin.edge || accent;
  const glow = skin.glow || colorAlpha2(edge, 0.42);
  ctx2.save();
  if (["void", "cosmic", "electric", "sludge", "molten", "volcanic", "royalgold"].includes(surface)) {
    const aura = ctx2.createRadialGradient(body.cx, body.cy, 0, body.cx, body.cy, Math.max(body.w, body.h) * 0.72);
    aura.addColorStop(0, colorAlpha2(edge, surface === "royalgold" ? 0.09 + pulse * 0.04 : 0.05 + pulse * 0.03));
    aura.addColorStop(0.52, colorAlpha2(accent, surface === "royalgold" ? 0.07 : 0.045));
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.globalCompositeOperation = "lighter";
    ctx2.fillStyle = aura;
    ctx2.fillRect(body.cx - body.w, body.cy - body.h, body.w * 2, body.h * 2);
  }
  if (surface === "royalgold") {
    ctx2.globalCompositeOperation = "lighter";
    ctx2.fillStyle = colorAlpha2("#fff2a6", 0.16 + pulse * 0.05);
    for (let i = 0; i < 28; i += 1) {
      const x = body.cx - body.w * 0.55 + seededUnit(seed, i + 730) * body.w * 1.1;
      const y = body.cy - body.h * 0.62 + seededUnit(seed, i + 830) * body.h * 1.12;
      const r = 1.2 + seededUnit(seed, i + 930) * 3.2;
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  if (["liquid", "chrome", "resin", "organic", "sludge", "molten", "blackMatter"].includes(surface) || ["blackMatter", "mercuryChrome", "moltenGold"].includes(skin.id)) {
    ctx2.globalCompositeOperation = "lighter";
    ctx2.fillStyle = colorAlpha2(edge, 0.12 + pulse * 0.08);
    ctx2.shadowColor = glow;
    ctx2.shadowBlur = 12;
    for (let i = 0; i < 12; i += 1) {
      const x = body.cx - body.w * 0.48 + seededUnit(seed, i + 5) * body.w * 0.96;
      const y = body.cy - body.h * 0.42 + seededUnit(seed, i + 15) * body.h * 0.88;
      const r = 2 + seededUnit(seed, i + 25) * 6;
      ctx2.beginPath();
      ctx2.ellipse(x, y, r, r * (1.1 + seededUnit(seed, i + 35) * 0.9), seededUnit(seed, i + 45) * Math.PI, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  if (["steam", "fog", "void"].includes(surface)) {
    ctx2.globalCompositeOperation = "screen";
    for (let i = 0; i < 7; i += 1) {
      const x = body.cx - body.w * 0.55 + seededUnit(seed, i + 105) * body.w * 1.1;
      const y = body.cy - body.h * 0.6 + seededUnit(seed, i + 205) * body.h * 1.12;
      const r = 38 + seededUnit(seed, i + 305) * 72;
      const fog = ctx2.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, colorAlpha2(surface === "void" ? edge : "#ffffff", surface === "void" ? 0.06 : 0.08));
      fog.addColorStop(1, "rgba(255,255,255,0)");
      ctx2.fillStyle = fog;
      ctx2.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  ctx2.restore();
}
function defaultPfpBackdrop(layout) {
  const seed = hashSeed(`${layout?.tokenId || 1}:${layout?.traits?.head || ""}:${layout?.traits?.clothes || ""}`);
  const modes = ["signal", "liquid", "time", "relic", "radio", "vault"];
  const mode2 = modes[seed % modes.length];
  const base = layout?.canvas?.backgroundColor || "#12d8ba";
  const accents = ["#73ffe1", "#d7a13a", "#aefcff", "#b78cff", "#fff0a4", "#ffb27a"];
  return {
    mode: mode2,
    accent: accents[(seed >>> 3) % accents.length],
    secondary: base,
    intensity: 0.34,
    pulseSpeed: 0.72 + seed % 5 * 0.06
  };
}
function drawBlueprintCross(ctx2, x, y, size, look) {
  ctx2.save();
  ctx2.strokeStyle = look.borderSoft;
  ctx2.lineWidth = 1;
  ctx2.setLineDash([12, 12]);
  ctx2.beginPath();
  ctx2.moveTo(x - size, y);
  ctx2.lineTo(x + size, y);
  ctx2.moveTo(x, y - size);
  ctx2.lineTo(x, y + size);
  ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.beginPath();
  ctx2.arc(x, y, 4, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.restore();
}
function buildLiquidState(layout, chainState2, time, previewMotion2) {
  const colorIndex = Number(chainState2.liquidColor ?? layout?.liquid?.colorIndex ?? 1);
  const baseFill = Number(chainState2.fillLevel ?? layout?.liquid?.fillLevel ?? 72);
  const lastChanged = Number(chainState2.liquidLastChangedAt || Date.now() / 1e3);
  const days = Math.max(0, (Date.now() / 1e3 - lastChanged) / 86400);
  const leakPenalty = chainState2.leaking ? days * 2.2 : days * 0.25;
  return {
    colorIndex,
    fillLevel: Math.max(0, Math.min(100, baseFill - leakPenalty)),
    liquidColor: LIQUID_PALETTE[colorIndex % LIQUID_PALETTE.length],
    liquidAccent: LIQUID_ACCENTS[colorIndex % LIQUID_ACCENTS.length],
    liquidGlow: LIQUID_GLOWS[colorIndex % LIQUID_GLOWS.length],
    texture: chainState2.liquidTexture ?? layout?.liquid?.texture ?? "Bubbly",
    tokenId: layout?.tokenId,
    canvasMode: layout?.canvas?.mode || "whiteBlueprint",
    shadeStyle: layout?.canvas?.shadeStyle || layout?.defaults?.shadeStyle || "pencilSketch",
    time,
    previewMotion: previewMotion2,
    gasPressure: chainState2.gasPressure ?? chainState2.baseFeeGwei ?? chainState2.baseFee ?? 0,
    baseFeeGwei: chainState2.baseFeeGwei,
    blockNumber: chainState2.blockNumber,
    heartbeatPulse: chainState2.heartbeatPulse,
    pressureLevel: pressureLevel(chainState2),
    archiveAgeSeconds: archiveAgeSeconds(chainState2),
    holderBondSeconds: holderBondSeconds(chainState2),
    transferCount: Number(chainState2.transferCount ?? chainState2.transfers ?? 0),
    transfers: Number(chainState2.transferCount ?? chainState2.transfers ?? 0),
    saleCount: Number(chainState2.saleCount ?? chainState2.sellCount ?? chainState2.sales ?? chainState2.saleTransfers ?? chainState2.soldTransfers ?? 0),
    saleTier: chainState2.saleTier,
    highestVerifiedSaleWei: chainState2.highestVerifiedSaleWei ?? chainState2.highestSaleWei ?? chainState2.saleWei,
    scarScreenColor: chainState2.scarScreenColor ?? chainState2.scarColor,
    unlockFlags: chainState2.unlockFlags,
    globalPhase: chainState2.globalPhase,
    mood: chainState2.mood
  };
}
function colorAlpha2(color, alpha) {
  if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color || `rgba(40,120,159,${alpha})`;
}
function liquidTheme2(state = {}) {
  const index = Number(state.colorIndex ?? 1);
  return {
    base: state.liquidColor || LIQUID_PALETTE[index % LIQUID_PALETTE.length] || LIQUID_PALETTE[1],
    accent: state.liquidAccent || LIQUID_ACCENTS[index % LIQUID_ACCENTS.length] || LIQUID_ACCENTS[1],
    glow: state.liquidGlow || LIQUID_GLOWS[index % LIQUID_GLOWS.length] || LIQUID_GLOWS[1]
  };
}
function buildRotationMap(placements, connections) {
  const map = /* @__PURE__ */ new Map();
  for (const part of placements) {
    const def = getPart(part.key);
    if (def?.kind === "gear" || def?.kind === "wheel" || def?.kind === "bevel") {
      map.set(part.id, def.kind === "wheel" ? 0.36 : part.id % 2 ? 0.42 : -0.42);
    }
  }
  for (const conn of connections) {
    if (!conn.active) continue;
    const a = placements.find((p) => p.id === conn.from);
    const b = placements.find((p) => p.id === conn.to);
    if (!a || !b) continue;
    if (conn.type === "gearMesh") {
      const ratio = Math.max(0.2, getPartRadius(a) / Math.max(1, getPartRadius(b)));
      const aSpeed = map.get(a.id) || 0.5;
      map.set(b.id, -aSpeed * ratio);
    }
    if (conn.type === "belt") {
      const aSpeed = map.get(a.id) || 0.35;
      map.set(b.id, aSpeed);
    }
  }
  return map;
}
function drawConnectionGuides(ctx2, placements, connections, time, previewMotion2, liquidState, look) {
  ctx2.save();
  ctx2.lineCap = "round";
  for (const conn of connections) {
    const a = placements.find((p) => p.id === conn.from);
    const b = placements.find((p) => p.id === conn.to);
    if (!a || !b) continue;
    if (conn.type === "belt") {
      drawBelt(ctx2, a, b, time, previewMotion2, conn.active, look);
    } else if (conn.type === "gearMesh") {
      drawGearMesh(ctx2, a, b, conn.active, look);
    } else if (conn.type === "pipe") {
      drawPipeLink(ctx2, conn.a, conn.b, time, previewMotion2, conn.active, liquidState, look);
    }
  }
  ctx2.restore();
}
function drawGearMesh(ctx2, a, b, active, look) {
  ctx2.save();
  ctx2.strokeStyle = active ? look.guide : look.guideWeak;
  ctx2.lineWidth = 1.4;
  ctx2.setLineDash([5, 7]);
  ctx2.beginPath();
  ctx2.moveTo(a.x, a.y);
  ctx2.lineTo(b.x, b.y);
  ctx2.stroke();
  ctx2.setLineDash([]);
  drawNode(ctx2, a.x, a.y, active, look);
  drawNode(ctx2, b.x, b.y, active, look);
  ctx2.restore();
}
function drawBelt(ctx2, a, b, time, previewMotion2, active, look) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const offsetX = Math.sin(angle) * 10;
  const offsetY = -Math.cos(angle) * 10;
  ctx2.save();
  ctx2.strokeStyle = active ? look.textSoft : look.guideWeak;
  ctx2.lineWidth = 3;
  ctx2.setLineDash([14, 10]);
  ctx2.lineDashOffset = previewMotion2 ? -time * 58 : 0;
  ctx2.beginPath();
  ctx2.moveTo(a.x + offsetX, a.y + offsetY);
  ctx2.lineTo(b.x + offsetX, b.y + offsetY);
  ctx2.moveTo(a.x - offsetX, a.y - offsetY);
  ctx2.lineTo(b.x - offsetX, b.y - offsetY);
  ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.lineDashOffset = 0;
  drawFlowDot(ctx2, a.x, a.y, b.x, b.y, time, active ? look.text : look.guideWeak);
  ctx2.restore();
}
function drawPipeLink(ctx2, a, b, time, previewMotion2, active, liquidState = {}, look = CANVAS_LOOKS.whiteBlueprint) {
  if (!a || !b) return;
  const theme = liquidTheme2(liquidState);
  ctx2.save();
  ctx2.strokeStyle = active ? theme.glow : look.guideWeak;
  ctx2.lineWidth = 5;
  ctx2.setLineDash([8, 9]);
  ctx2.lineDashOffset = previewMotion2 ? -time * 42 : 0;
  ctx2.beginPath();
  ctx2.moveTo(a.x, a.y);
  ctx2.lineTo(b.x, b.y);
  ctx2.stroke();
  ctx2.strokeStyle = active ? colorAlpha2(theme.base, 0.56) : look.guideWeak;
  ctx2.lineWidth = 2;
  ctx2.setLineDash([8, 9]);
  ctx2.lineDashOffset = previewMotion2 ? -time * 42 : 0;
  ctx2.beginPath();
  ctx2.moveTo(a.x, a.y);
  ctx2.lineTo(b.x, b.y);
  ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.lineDashOffset = 0;
  drawFlowDot(ctx2, a.x, a.y, b.x, b.y, time, active ? colorAlpha2(theme.accent, 0.84) : look.guideWeak);
  ctx2.restore();
}
function drawFlowDot(ctx2, x1, y1, x2, y2, time, color) {
  const phase = time * 0.65 % 1;
  const x = x1 + (x2 - x1) * phase;
  const y = y1 + (y2 - y1) * phase;
  ctx2.fillStyle = color;
  ctx2.beginPath();
  ctx2.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx2.fill();
}
function drawNode(ctx2, x, y, active, look) {
  ctx2.fillStyle = look.nodeFill;
  ctx2.strokeStyle = active ? look.text : look.guideWeak;
  ctx2.lineWidth = 1.4;
  ctx2.beginPath();
  ctx2.arc(x, y, 5, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
}
function placementBounds(part) {
  const bounds = partBounds(part);
  const sx = Math.abs(part.scaleX || 1);
  const sy = Math.abs(part.scaleY || 1);
  const radius = Math.hypot(bounds.w * sx, bounds.h * sy) / 2;
  return {
    x: part.x - radius,
    y: part.y - radius,
    w: radius * 2,
    h: radius * 2,
    cx: part.x,
    cy: part.y
  };
}
function combinedBounds(placements, predicate) {
  let box = null;
  for (const part of placements) {
    if (!predicate(part)) continue;
    const bounds = placementBounds(part);
    if (!box) {
      box = { ...bounds };
      continue;
    }
    const minX = Math.min(box.x, bounds.x);
    const minY = Math.min(box.y, bounds.y);
    const maxX = Math.max(box.x + box.w, bounds.x + bounds.w);
    const maxY = Math.max(box.y + box.h, bounds.y + bounds.h);
    box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }
  return box;
}
function headReactionFamily(name = "") {
  const lower = String(name).toLowerCase();
  if (lower.includes("radio") || lower.includes("cassette")) return "signal";
  if (lower.includes("clock") || lower.includes("gauge") || lower.includes("valve")) return "pressure";
  if (lower.includes("diving") || lower.includes("liquid") || lower.includes("tank") || lower.includes("lamp")) return "fluid";
  if (lower.includes("tesla") || lower.includes("satellite")) return "electric";
  if (lower.includes("typewriter")) return "archive";
  if (lower.includes("vault") || lower.includes("safe")) return "vault";
  return "screen";
}
function historyLevelFromAge(seconds) {
  const days = seconds / 86400;
  if (days >= 3650) return 1;
  if (days >= 1825) return 0.92;
  if (days >= 365) return 0.78;
  if (days >= 180) return 0.64;
  if (days >= 30) return 0.48;
  if (days >= 7) return 0.34;
  if (days >= 3) return 0.22;
  if (days >= 1) return 0.12;
  return 0;
}
function bondStrengthFromSeconds(seconds) {
  const days = seconds / 86400;
  if (days >= 365) return 1;
  if (days >= 180) return 0.82;
  if (days >= 90) return 0.68;
  if (days >= 30) return 0.52;
  if (days >= 7) return 0.34;
  if (days >= 3) return 0.2;
  if (days >= 1) return 0.1;
  return 0;
}
function holderBondMilestone(seconds) {
  const days = seconds / 86400;
  const tiers = [
    { days: 3650, label: "10Y", color: "#fff8c7", rust: 1, gold: 1 },
    { days: 1825, label: "5Y", color: "#fff0a4", rust: 0.94, gold: 1 },
    { days: 730, label: "2Y", color: "#ffef7a", rust: 0.86, gold: 0.96 },
    { days: 365, label: "1Y", color: "#ffef7a", rust: 0.76, gold: 0.9 },
    { days: 300, label: "10M", color: "#ffd56a", rust: 0.66, gold: 0.82 },
    { days: 150, label: "5M", color: "#e3a747", rust: 0.56, gold: 0.72 },
    { days: 60, label: "2M", color: "#d7a13a", rust: 0.44, gold: 0.58 },
    { days: 30, label: "1M", color: "#c89234", rust: 0.34, gold: 0.48 },
    { days: 14, label: "2W", color: "#d9bd66", rust: 0.18, gold: 0.34 },
    { days: 7, label: "1W", color: "#d7a13a", rust: 0.1, gold: 0.26 },
    { days: 3, label: "3D", color: "#9df5df", rust: 0.03, gold: 0.12 },
    { days: 1, label: "1D", color: "#73ffe1", rust: 0, gold: 0.06 }
  ];
  const index = tiers.findIndex((tier2) => days >= tier2.days);
  if (index < 0) return null;
  const tier = tiers[index];
  return { ...tier, level: (tiers.length - index) / tiers.length };
}
function drawHistoryLine(ctx2, x1, y1, x2, y2, seed, amount = 2.2) {
  ctx2.beginPath();
  for (let i = 0; i <= 5; i += 1) {
    const t = i / 5;
    const wobble = Math.sin(seed * 12.9898 + i * 5.31) * amount * Math.sin(t * Math.PI);
    const x = x1 + (x2 - x1) * t + wobble;
    const y = y1 + (y2 - y1) * t - wobble * 0.45;
    i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
  }
  ctx2.stroke();
}
function drawAgePatina(ctx2, width, height, layout, seconds, time, look) {
  const level = historyLevelFromAge(seconds);
  if (!level) return;
  const seed = hashSeed(`${layout?.tokenId || 1}:age:${layout?.traits?.head || ""}`);
  ctx2.save();
  ctx2.globalCompositeOperation = look.pfp ? "multiply" : "source-over";
  const dustCount = Math.floor(18 + level * 90);
  ctx2.fillStyle = colorAlpha2(level > 0.6 ? "#8a642d" : "#5a4d35", look.pfp ? 0.025 + level * 0.035 : 0.035 + level * 0.05);
  for (let i = 0; i < dustCount; i += 1) {
    const x = seededUnit(seed, i + 10) * width;
    const y = seededUnit(seed, i + 80) * height;
    const r = 0.7 + seededUnit(seed, i + 160) * (1.2 + level * 2.4);
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, Math.PI * 2);
    ctx2.fill();
  }
  if (seconds >= 30 * 86400) {
    ctx2.globalCompositeOperation = "source-over";
    const glow = ctx2.createRadialGradient(width * 0.5, height * 0.82, 0, width * 0.5, height * 0.82, width * 0.58);
    glow.addColorStop(0, colorAlpha2("#d7a13a", 0.025 + level * 0.055));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = glow;
    ctx2.fillRect(0, 0, width, height);
  }
  ctx2.restore();
}
function drawHolderBondAura(ctx2, width, height, placements, seconds, time) {
  const strength = bondStrengthFromSeconds(seconds);
  if (!strength) return;
  const core = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 12 && z <= 18;
  }) || { cx: width * 0.5, cy: height * 0.78, w: width * 0.22, h: height * 0.22 };
  const head = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 40 && z < 73;
  }) || { cx: width * 0.5, cy: height * 0.38, w: width * 0.3, h: height * 0.28 };
  const pulse = 0.5 + Math.sin(time * (0.85 - strength * 0.18)) * 0.5;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  for (const bounds of [core, head]) {
    const radius = Math.max(bounds.w, bounds.h) * (0.22 + strength * 0.08);
    const glow = ctx2.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, radius);
    glow.addColorStop(0, colorAlpha2("#73ffe1", 0.04 + strength * 0.09 + pulse * 0.018));
    glow.addColorStop(0.48, colorAlpha2("#d7a13a", strength * 0.055));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = glow;
    ctx2.fillRect(bounds.cx - radius, bounds.cy - radius, radius * 2, radius * 2);
  }
  ctx2.restore();
}
function drawHolderBondGearMilestones(ctx2, width, height, placements, seconds, time, look) {
  const milestone = holderBondMilestone(seconds);
  if (!milestone) return;
  const gears = placements.filter((part) => {
    const key = String(part.key || "");
    const z = part.z ?? part.zIndex ?? 0;
    const x = Number(part.x || 0);
    const y = Number(part.y || 0);
    return z >= 8 && y > height * 0.34 && x > width * 0.12 && x < width * 0.88 && (key.includes("gear") || key.includes("wheel") || key.includes("ring.sprocket") || key.includes("ring.bolted"));
  }).sort((a, b) => {
    const az = a.z ?? a.zIndex ?? 0;
    const bz = b.z ?? b.zIndex ?? 0;
    return bz - az;
  }).slice(0, 14);
  if (!gears.length) return;
  const pulse = 0.5 + Math.sin(time * (0.55 + milestone.level * 0.22)) * 0.5;
  const color = milestone.color;
  const glowAlpha = look.pfp ? 0.09 + milestone.level * 0.18 : 0.1 + milestone.level * 0.19;
  const ringAlpha = 0.18 + milestone.gold * 0.34 + pulse * 0.04;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  for (let i = 0; i < gears.length; i += 1) {
    const part = gears[i];
    const local = partBounds(part);
    const sx = Math.abs(Number(part.scaleX || 1));
    const sy = Math.abs(Number(part.scaleY ?? part.scaleX ?? 1));
    const radius = Math.max(local.w * sx, local.h * sy) * (0.34 + milestone.level * 0.025);
    const x = Number(part.x || 0);
    const y = Number(part.y || 0);
    const offset = i * 0.37;
    const glow = ctx2.createRadialGradient(x, y, radius * 0.12, x, y, radius * (1.35 + milestone.level * 0.25));
    glow.addColorStop(0, colorAlpha2(color, glowAlpha + pulse * 0.012));
    glow.addColorStop(0.45, colorAlpha2("#d7a13a", milestone.gold * 0.038));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx2.fillStyle = glow;
    ctx2.beginPath();
    ctx2.arc(x, y, radius * (1.35 + milestone.level * 0.25), 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = colorAlpha2(color, ringAlpha);
    ctx2.lineWidth = 1.4 + milestone.level * 1.5;
    ctx2.beginPath();
    ctx2.arc(x, y, radius * (0.64 + pulse * 0.025), -0.75 + offset, 1.15 + offset);
    ctx2.stroke();
    if (milestone.rust > 0.12) {
      ctx2.globalCompositeOperation = "source-over";
      ctx2.strokeStyle = colorAlpha2("#8b5a24", look.pfp ? 0.045 + milestone.rust * 0.08 : 0.12 + milestone.rust * 0.18);
      ctx2.lineWidth = look.pfp ? 0.8 + milestone.rust * 0.35 : 1.1 + milestone.rust * 0.7;
      const rustCuts = look.pfp ? 2 + Math.floor(milestone.rust * 3) : 4 + Math.floor(milestone.rust * 5);
      for (let j = 0; j < rustCuts; j += 1) {
        const angle = seededUnit((part.id || i) * 43.7, j + 20) * Math.PI * 2;
        const inner = radius * (look.pfp ? 0.72 + seededUnit((part.id || i) * 19.3, j + 1) * 0.1 : 0.62 + seededUnit((part.id || i) * 19.3, j + 1) * 0.18);
        const outer = look.pfp ? Math.min(radius * 0.9, inner + Math.min(18, radius * 0.16)) : radius * (0.86 + seededUnit((part.id || i) * 23.9, j + 3) * 0.12);
        drawHistoryLine(ctx2, x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, x + Math.cos(angle) * outer, y + Math.sin(angle) * outer, 8100 + i * 17 + j, 0.7);
      }
      ctx2.globalCompositeOperation = "lighter";
    }
  }
  ctx2.restore();
}
function drawSaleProvenanceSeal(ctx2, width, height, placements, rank, time) {
  if (!rank) return;
  const labels = ["", "1E", "2E", "5E", "7E", "10E"];
  const colors = ["", "#d7a13a", "#ffcf57", "#f1c75b", "#ffae4a", "#ffef7a"];
  const core = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 12 && z <= 18;
  }) || { cx: width * 0.5, cy: height * 0.78, w: width * 0.22, h: height * 0.22 };
  const rightShoulder = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 20 && z <= 38 && Number(part.x || 0) > width * 0.5;
  }) || core;
  const rightArm = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    const x = Number(part.x || 0);
    const y = Number(part.y || 0);
    return z >= 12 && z <= 34 && x > width * 0.56 && y > height * 0.68;
  }) || rightShoulder;
  const highSale = rank >= 3;
  const cx = Math.min(width - 50, Math.max(width * 0.74, rightArm.x + rightArm.w * 0.78));
  const cy = Math.min(height - 60, Math.max(height * 0.78, rightArm.y + rightArm.h * 0.66));
  const r = highSale ? 24 + rank * 2.5 : 18 + rank * 2.5;
  const pulse = 0.5 + Math.sin(time * 1.4) * 0.5;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  ctx2.fillStyle = colorAlpha2(highSale ? "#ffef7a" : colors[rank], 0.075 + rank * 0.025 + pulse * 0.018);
  ctx2.beginPath();
  ctx2.arc(cx, cy, r * (highSale ? 2.15 : 1.65), 0, Math.PI * 2);
  ctx2.fill();
  ctx2.globalCompositeOperation = "source-over";
  if (highSale) {
    ctx2.save();
    ctx2.translate(cx, cy);
    ctx2.rotate(-0.08 + Math.sin(time * 0.7) * 0.025);
    ctx2.shadowColor = colorAlpha2("#ffef7a", 0.5 + pulse * 0.2);
    ctx2.shadowBlur = 10 + rank * 1.5;
    const diamond = () => {
      ctx2.beginPath();
      ctx2.moveTo(0, -r * 1.26);
      ctx2.lineTo(r * 1.03, -r * 0.16);
      ctx2.lineTo(0, r * 1.3);
      ctx2.lineTo(-r * 1.03, -r * 0.16);
      ctx2.closePath();
    };
    ctx2.fillStyle = "rgba(7,8,9,0.9)";
    ctx2.strokeStyle = colorAlpha2("#ffef7a", 0.94);
    ctx2.lineWidth = 2.4;
    diamond();
    ctx2.fill();
    ctx2.stroke();
    ctx2.shadowBlur = 0;
    ctx2.save();
    ctx2.clip();
    const facet = ctx2.createLinearGradient(-r, -r, r, r);
    facet.addColorStop(0, "rgba(255,255,255,0.18)");
    facet.addColorStop(0.35, "rgba(255,239,122,0.13)");
    facet.addColorStop(0.66, "rgba(14,19,20,0.72)");
    facet.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx2.fillStyle = facet;
    ctx2.fillRect(-r * 1.15, -r * 1.3, r * 2.3, r * 2.6);
    ctx2.strokeStyle = "rgba(255,239,122,0.42)";
    ctx2.lineWidth = 1.1;
    for (const line of [
      [0, -r * 1.24, 0, r * 1.26],
      [-r * 0.92, -r * 0.16, r * 0.92, -r * 0.16],
      [-r * 0.55, -r * 0.78, r * 0.55, -r * 0.78],
      [-r * 0.82, -r * 0.12, 0, r * 1.18],
      [r * 0.82, -r * 0.12, 0, r * 1.18]
    ]) {
      drawHistoryLine(ctx2, line[0], line[1], line[2], line[3], 6200 + rank, 0.9);
    }
    ctx2.restore();
    ctx2.strokeStyle = colorAlpha2("#d7a13a", 0.7 + pulse * 0.18);
    ctx2.lineWidth = 1.25;
    for (let i = 0; i < 12; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 6;
      const inner = r * 1.34;
      const outer = r * (1.5 + i % 2 * 0.14);
      drawHistoryLine(ctx2, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer, 6300 + i, 0.7);
    }
    ctx2.fillStyle = colorAlpha2("#fff8d7", 0.96);
    ctx2.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(labels[rank], 0, 0.5);
    ctx2.restore();
  } else {
    ctx2.save();
    ctx2.translate(cx, cy);
    ctx2.rotate(0.07 + Math.sin(time * 0.9) * 0.02);
    const gear = () => {
      ctx2.beginPath();
      const teeth = 18;
      for (let i = 0; i < teeth * 2; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / teeth;
        const pr = i % 2 ? r * 0.96 : r * 1.18;
        const x = Math.cos(angle) * pr;
        const y = Math.sin(angle) * pr;
        i === 0 ? ctx2.moveTo(x, y) : ctx2.lineTo(x, y);
      }
      ctx2.closePath();
    };
    ctx2.shadowColor = colorAlpha2("#d7a13a", 0.5 + pulse * 0.2);
    ctx2.shadowBlur = 9;
    gear();
    const gearFill = ctx2.createRadialGradient(-r * 0.18, -r * 0.24, r * 0.12, 0, 0, r * 1.18);
    gearFill.addColorStop(0, "rgba(255,237,141,0.96)");
    gearFill.addColorStop(0.48, colorAlpha2(colors[rank], 0.92));
    gearFill.addColorStop(1, "rgba(151,86,17,0.92)");
    ctx2.fillStyle = gearFill;
    ctx2.fill();
    ctx2.strokeStyle = "rgba(77,47,12,0.88)";
    ctx2.lineWidth = 2.1;
    ctx2.stroke();
    ctx2.shadowBlur = 0;
    ctx2.beginPath();
    ctx2.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx2.fillStyle = "rgba(255,215,92,0.74)";
    ctx2.fill();
    ctx2.strokeStyle = "rgba(104,67,16,0.68)";
    ctx2.lineWidth = 1.4;
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    ctx2.fillStyle = "rgba(255,240,170,0.82)";
    ctx2.fill();
    ctx2.strokeStyle = "rgba(111,71,18,0.58)";
    ctx2.lineWidth = 1.2;
    ctx2.stroke();
    ctx2.strokeStyle = "rgba(255,255,255,0.24)";
    ctx2.lineWidth = 1;
    for (let i = 0; i < 8; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 4;
      const inner = r * 0.58;
      const outer = r * 0.92;
      drawHistoryLine(ctx2, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer, 6400 + i, 0.55);
    }
    ctx2.fillStyle = "rgba(17,13,8,0.82)";
    ctx2.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    ctx2.fillText(labels[rank], 0, 0.5);
    ctx2.restore();
  }
  ctx2.restore();
}
function scarScreenPalette(chainState2 = {}) {
  const raw = String(chainState2.scarScreenColor || chainState2.scarColor || "").trim().toLowerCase();
  const presets = {
    teal: { glass: "#123c38", accent: "#66f5dd", frame: "#d7a13a" },
    gold: { glass: "#38270b", accent: "#ffcf57", frame: "#d7a13a" },
    amber: { glass: "#3b2410", accent: "#ffae4a", frame: "#d7a13a" },
    black: { glass: "#07090a", accent: "#d7a13a", frame: "#262f31" },
    diamond: { glass: "#060709", accent: "#ffef7a", frame: "#d7a13a" },
    red: { glass: "#35100d", accent: "#ff6a4d", frame: "#d7a13a" }
  };
  if (/^#[0-9a-f]{6}$/i.test(raw)) return { glass: raw, accent: raw, frame: "#d7a13a" };
  return presets[raw] || presets.teal;
}
function saleEventCount(chainState2 = {}) {
  const explicit = Number(
    chainState2.saleCount ?? chainState2.sellCount ?? chainState2.sales ?? chainState2.saleTransfers ?? chainState2.soldTransfers ?? chainState2.verifiedSaleCount ?? 0
  );
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  return saleTierRank(chainState2) ? 1 : 0;
}
function transferEventCount(chainState2 = {}) {
  const raw = Number(chainState2.transferCount ?? chainState2.transfers ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}
function drawPixelGlyph(ctx2, pattern, x, y, pixel, color) {
  ctx2.save();
  ctx2.fillStyle = color;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== "1") continue;
      ctx2.fillRect(x + col * pixel, y + row * pixel, pixel * 0.78, pixel * 0.78);
    }
  }
  ctx2.restore();
}
function drawPixelSaleCount(ctx2, count, x, y, pixel, color) {
  const digits = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "+": ["000", "010", "111", "010", "000"]
  };
  const label = count > 99 ? "99+" : String(Math.max(0, count)).padStart(count < 10 ? 2 : 0, "0");
  const glyphW = 3 * pixel;
  const gap = pixel * 0.85;
  let cx = x - (label.length * glyphW + (label.length - 1) * gap) / 2;
  for (const char of label) {
    drawPixelGlyph(ctx2, digits[char] || digits["0"], cx, y, pixel, color);
    cx += glyphW + gap;
  }
}
function drawBodyPlateSaleScarScreen(ctx2, width, height, placements, chainState2, look = CANVAS_LOOKS.whiteBlueprint) {
  const sales = saleEventCount(chainState2);
  if (!sales) return;
  const body = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 12 && z <= 28;
  }) || { cx: width * 0.5, cy: height * 0.8, w: width * 0.48, h: height * 0.24 };
  const leftShoulder = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 20 && z <= 38 && Number(part.x || 0) < width * 0.52;
  }) || body;
  const anchorX = Math.max(width * 0.18, Math.min(width * 0.39, leftShoulder.cx - leftShoulder.w * 0.17));
  const anchorY = Math.max(height * 0.65, Math.min(height * 0.83, leftShoulder.cy + leftShoulder.h * 0.21));
  const heat = Math.min(1, sales / 12);
  const seed = 7200 + sales * 17;
  const palette = scarScreenPalette(chainState2);
  const plateW = 58;
  const plateH = 46;
  const x = -plateW / 2;
  const y = -plateH / 2;
  ctx2.save();
  ctx2.translate(anchorX, anchorY);
  ctx2.rotate(-0.12);
  ctx2.globalCompositeOperation = "source-over";
  ctx2.lineCap = "round";
  const plate = () => {
    ctx2.beginPath();
    ctx2.roundRect(x, y, plateW, plateH, 10);
  };
  ctx2.save();
  ctx2.shadowColor = "rgba(0,0,0,0.24)";
  ctx2.shadowBlur = 6;
  ctx2.shadowOffsetY = 4;
  plate();
  ctx2.fillStyle = "rgba(226,216,190,0.76)";
  ctx2.fill();
  ctx2.restore();
  const screen = () => {
    ctx2.beginPath();
    ctx2.roundRect(x + 7, y + 6, plateW - 14, 28, 7);
  };
  screen();
  const glass = ctx2.createRadialGradient(0, y + 20, 0, 0, y + 20, 32);
  glass.addColorStop(0, colorAlpha2(palette.glass, 0.98));
  glass.addColorStop(0.5, "rgba(6,12,11,0.92)");
  glass.addColorStop(1, "rgba(3,5,5,0.98)");
  ctx2.fillStyle = glass;
  ctx2.fill();
  ctx2.strokeStyle = "rgba(18,22,21,0.72)";
  ctx2.lineWidth = 1.8;
  plate();
  ctx2.stroke();
  ctx2.strokeStyle = colorAlpha2(palette.frame, 0.82);
  ctx2.lineWidth = 1.35;
  screen();
  ctx2.stroke();
  ctx2.save();
  screen();
  ctx2.clip();
  ctx2.fillStyle = colorAlpha2(palette.accent, 0.04 + heat * 0.02);
  for (let col = x + 10; col < x + plateW - 10; col += 5) ctx2.fillRect(col, y + 10, 1, 22);
  for (let row = y + 11; row < y + 33; row += 5) ctx2.fillRect(x + 9, row, plateW - 18, 1);
  ctx2.shadowColor = colorAlpha2(palette.accent, 0.7);
  ctx2.shadowBlur = 4;
  drawPixelSaleCount(ctx2, sales, 0, y + 12, 3.05, colorAlpha2(palette.accent, 0.95));
  ctx2.shadowBlur = 0;
  ctx2.restore();
  ctx2.save();
  ctx2.fillStyle = colorAlpha2(palette.accent, 0.84);
  ctx2.font = "bold 4.8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText("SALE", -8, y + 38);
  ctx2.fillStyle = sales > 9 ? colorAlpha2(palette.frame, 0.86) : "rgba(176,42,37,0.82)";
  ctx2.beginPath();
  ctx2.arc(x + plateW - 11, y + 38, 2.1, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  for (const [rx, ry] of [[x + 6, y + 8], [x + plateW - 6, y + 8], [x + 7, y + plateH - 7], [x + plateW - 7, y + plateH - 7]]) {
    ctx2.fillStyle = colorAlpha2(palette.frame, 0.88);
    ctx2.beginPath();
    ctx2.arc(rx, ry, 1.35, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = "rgba(8,10,10,0.46)";
    ctx2.lineWidth = 0.7;
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawTransferCut(ctx2, x1, y1, x2, y2, seed, color, width = 2.1, glow = 0) {
  ctx2.save();
  ctx2.lineCap = "round";
  ctx2.strokeStyle = "rgba(5,8,8,0.52)";
  ctx2.lineWidth = width + 2.5;
  drawHistoryLine(ctx2, x1 + 1.4, y1 + 1.8, x2 + 1.4, y2 + 1.8, seed + 30, 0.85);
  if (glow) {
    ctx2.globalCompositeOperation = "lighter";
    ctx2.shadowColor = color;
    ctx2.shadowBlur = 7 + glow * 7;
    ctx2.strokeStyle = colorAlpha2(color, 0.18 + glow * 0.22);
    ctx2.lineWidth = width + 4;
    drawHistoryLine(ctx2, x1, y1, x2, y2, seed + 60, 0.55);
    ctx2.globalCompositeOperation = "source-over";
    ctx2.shadowBlur = 0;
  }
  ctx2.strokeStyle = colorAlpha2(color, 0.92);
  ctx2.lineWidth = width;
  drawHistoryLine(ctx2, x1, y1, x2, y2, seed, 0.72);
  ctx2.strokeStyle = "rgba(255,245,190,0.32)";
  ctx2.lineWidth = Math.max(0.7, width * 0.38);
  drawHistoryLine(ctx2, x1 + 1, y1 - 1.2, x2 + 1, y2 - 1.2, seed + 90, 0.35);
  ctx2.restore();
}
function drawTransferTallyBundle(ctx2, x, y, scale, seed, options = {}) {
  const color = options.color || "#24221b";
  const glow = options.glow || 0;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  for (let i = 0; i < 4; i += 1) {
    const ox = (i - 1.5) * 8.6 * scale;
    drawTransferCut(ctx2, ox - 4 * scale, 15 * scale, ox + 4.5 * scale, -17 * scale, seed + i * 19, color, 2.1 * scale, glow);
  }
  drawTransferCut(ctx2, -22 * scale, 10 * scale, 23 * scale, -12 * scale, seed + 101, options.slashColor || "#a46624", 2.45 * scale, glow);
  ctx2.restore();
}
function drawTransferSingleCuts(ctx2, x, y, count, scale, seed, options = {}) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  for (let i = 0; i < count; i += 1) {
    const ox = (i - (count - 1) / 2) * 9.5 * scale;
    drawTransferCut(ctx2, ox - 2.8 * scale, 13 * scale, ox + 5.5 * scale, -14 * scale, seed + i * 23, options.color || "#24221b", 2 * scale, options.glow || 0);
  }
  ctx2.restore();
}
function drawTransferBurnBundle(ctx2, x, y, scale, seed, options = {}) {
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  const heat = options.heat || 0;
  ctx2.fillStyle = heat > 0.58 ? "rgba(111,28,20,0.24)" : "rgba(70,42,24,0.18)";
  ctx2.beginPath();
  ctx2.ellipse(0, 1, 30 * scale, 17 * scale, -0.1, 0, Math.PI * 2);
  ctx2.fill();
  drawTransferTallyBundle(ctx2, 0, 0, scale * 0.82, seed, {
    color: heat > 0.58 ? "#80231d" : "#25221a",
    slashColor: "#d7a13a",
    glow: options.glow || 0
  });
  ctx2.restore();
}
function drawTransferSeal(ctx2, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  const glow = options.glow || 0;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  ctx2.fillStyle = "rgba(14,17,16,0.64)";
  ctx2.strokeStyle = "rgba(215,161,58,0.84)";
  ctx2.lineWidth = 1.6 * scale;
  ctx2.beginPath();
  ctx2.arc(0, 0, 12 * scale, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.stroke();
  ctx2.strokeStyle = glow ? colorAlpha2("#66f5dd", 0.18 + glow * 0.24) : "rgba(215,161,58,0.5)";
  ctx2.lineWidth = 1.1 * scale;
  drawHistoryLine(ctx2, -6 * scale, -5 * scale, 6 * scale, 5 * scale, seed, 0.24 * scale);
  drawHistoryLine(ctx2, -6 * scale, 5 * scale, 6 * scale, -5 * scale, seed + 1, 0.24 * scale);
  ctx2.fillStyle = "rgba(245,236,206,0.82)";
  ctx2.font = `bold ${Math.max(5, 6.6 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, 0.5);
  ctx2.restore();
}
function drawTransferArchiveStamp(ctx2, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  ctx2.save();
  ctx2.translate(x, y);
  ctx2.rotate(options.rotation || 0);
  const w = 58 * scale;
  const h = 23 * scale;
  ctx2.fillStyle = "rgba(8,10,10,0.78)";
  ctx2.strokeStyle = "rgba(215,161,58,0.72)";
  ctx2.lineWidth = 1.4 * scale;
  ctx2.beginPath();
  ctx2.roundRect(-w / 2, -h / 2, w, h, 5 * scale);
  ctx2.fill();
  ctx2.stroke();
  ctx2.strokeStyle = "rgba(255,236,151,0.16)";
  ctx2.lineWidth = 0.8 * scale;
  drawHistoryLine(ctx2, -w * 0.34, -h * 0.18, w * 0.36, -h * 0.26, seed, 0.38);
  ctx2.fillStyle = "rgba(245,236,206,0.84)";
  ctx2.font = `bold ${Math.max(7, 10 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx2.textAlign = "center";
  ctx2.textBaseline = "middle";
  ctx2.fillText(label, 0, 0.7);
  ctx2.restore();
}
function compactTransferLabel(value) {
  if (value >= 1e6) return `${Math.floor(value / 1e6)}M`;
  if (value >= 1e3) return `${Math.floor(value / 1e3)}K`;
  return String(value);
}
function drawBodyPlateTransferTallyScars(ctx2, width, height, placements, chainState2 = {}, time = 0, look = CANVAS_LOOKS.whiteBlueprint) {
  const transfers = transferEventCount(chainState2);
  if (!transfers) return;
  const clothes = combinedBounds(placements, (part) => {
    const role = part.role || part.traitLayer;
    return role === "clothes";
  });
  const body = clothes || combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 12 && z <= 34;
  }) || { cx: width * 0.5, cy: height * 0.78, w: width * 0.5, h: height * 0.25 };
  const heat = Math.min(1, transfers / 120);
  const pulse = 0.5 + Math.sin(time * 2.1 + transfers * 0.07) * 0.5;
  const glow = transfers >= 8 ? Math.min(1, heat * (0.42 + pulse * 0.34)) : 0;
  const seed = 8300 + transfers * 29;
  const cutColor = heat > 0.65 ? "#7f2b22" : heat > 0.32 ? "#5e351e" : "#141715";
  const slashColor = heat > 0.52 ? "#d7a13a" : "#a86724";
  const anchors = look.pfp ? [
    { x: width * 0.62, y: height * 0.755, r: 0.2, scale: 0.96 },
    { x: width * 0.69, y: height * 0.795, r: 0.24, scale: 0.92 },
    { x: width * 0.61, y: height * 0.85, r: 0.1, scale: 0.86 },
    { x: width * 0.72, y: height * 0.865, r: 0.14, scale: 0.74 }
  ] : [
    { x: body.cx + body.w * 0.16, y: body.cy - body.h * 0.19, r: 0.12, scale: 0.86 },
    { x: body.cx + body.w * 0.31, y: body.cy - body.h * 0.1, r: 0.18, scale: 0.82 },
    { x: body.cx + body.w * 0.13, y: body.cy + body.h * 0.14, r: 0.08, scale: 0.78 },
    { x: body.cx + body.w * 0.34, y: body.cy + body.h * 0.05, r: 0.16, scale: 0.72 }
  ];
  let remainder = transfers;
  const thousands = Math.floor(remainder / 1e3);
  remainder %= 1e3;
  const hundreds = Math.floor(remainder / 100);
  remainder %= 100;
  const twentyFives = Math.floor(remainder / 25);
  remainder %= 25;
  const fives = Math.floor(remainder / 5);
  const ones = remainder % 5;
  ctx2.save();
  ctx2.globalCompositeOperation = "source-over";
  if (thousands) {
    drawTransferArchiveStamp(ctx2, anchors[3].x, anchors[3].y + 10, compactTransferLabel(transfers), seed + 4, {
      scale: 0.78,
      rotation: anchors[3].r
    });
  }
  const visibleHundreds = Math.min(5, hundreds);
  for (let i = 0; i < visibleHundreds; i += 1) {
    const a = anchors[i % 2];
    drawTransferSeal(ctx2, a.x + (i - (visibleHundreds - 1) / 2) * 28, a.y - 10 + i % 2 * 11, "100", seed + 100 + i, {
      scale: 0.78,
      rotation: a.r,
      glow
    });
  }
  const visibleTwentyFives = Math.min(4, twentyFives);
  for (let i = 0; i < visibleTwentyFives; i += 1) {
    const a = anchors[(i + 1) % anchors.length];
    drawTransferBurnBundle(ctx2, a.x + (i - (visibleTwentyFives - 1) / 2) * 34, a.y + 18 + i % 2 * 7, a.scale, seed + 220 + i, {
      rotation: a.r,
      heat,
      glow
    });
  }
  const visibleFives = Math.min(4, fives);
  for (let i = 0; i < visibleFives; i += 1) {
    const a = anchors[i % anchors.length];
    drawTransferTallyBundle(ctx2, a.x + (i - (visibleFives - 1) / 2) * 40, a.y + 2 + i % 2 * 16, a.scale * 0.92, seed + 360 + i, {
      rotation: a.r,
      color: cutColor,
      slashColor,
      glow
    });
  }
  if (ones) {
    const a = anchors[2];
    drawTransferSingleCuts(ctx2, a.x + 48, a.y + 25, ones, a.scale, seed + 520, {
      rotation: a.r,
      color: cutColor,
      glow
    });
  }
  if (transfers >= 500 && !thousands) {
    drawTransferArchiveStamp(ctx2, anchors[3].x, anchors[3].y + 12, compactTransferLabel(transfers), seed + 700, {
      scale: 0.68,
      rotation: anchors[3].r
    });
  }
  ctx2.restore();
}
function drawHistoryEvolution(ctx2, width, height, layout, placements, chainState2 = {}, time, look) {
  const ageSeconds = archiveAgeSeconds(chainState2);
  const bondSeconds = holderBondSeconds(chainState2);
  const sales = saleEventCount(chainState2);
  const transfers = transferEventCount(chainState2);
  const saleRank = saleTierRank(chainState2);
  if (!ageSeconds && !bondSeconds && !sales && !transfers && !saleRank) return;
  drawAgePatina(ctx2, width, height, layout, ageSeconds, time, look);
  if (bondSeconds) {
    drawHolderBondAura(ctx2, width, height, placements, bondSeconds, time);
    drawHolderBondGearMilestones(ctx2, width, height, placements, bondSeconds, time, look);
  }
  const hasTransferTallyPart = placements.some((part) => part.key === "counter.transferTally");
  const hasSaleScreenPart = placements.some((part) => part.key === "counter.saleScreen");
  if (transfers && !hasTransferTallyPart) drawBodyPlateTransferTallyScars(ctx2, width, height, placements, { ...chainState2, transferCount: transfers }, time, look);
  if (sales && !hasSaleScreenPart) drawBodyPlateSaleScarScreen(ctx2, width, height, placements, { ...chainState2, saleCount: sales }, look);
  drawSaleProvenanceSeal(ctx2, width, height, placements, saleRank, time);
}
function drawLiveChainEffects(ctx2, width, height, layout, placements, chainState2 = {}, time, look) {
  const pressure = pressureLevel(chainState2);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState2.heartbeatPulse || 0)));
  const live = Boolean(chainState2.liveMode || chainState2.showLiveEffects || heartbeat || pressure === "high" || pressure === "extreme");
  if (!live) return;
  const headBounds = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 40 && z < 73;
  }) || { x: width * 0.36, y: height * 0.18, w: width * 0.28, h: height * 0.28, cx: width * 0.5, cy: height * 0.32 };
  const family = headReactionFamily(layout?.traits?.head);
  const pressureColor = pressure === "extreme" ? "#ff3b2f" : pressure === "high" ? "#ff9c2f" : "#6fffe2";
  const accent = family === "fluid" ? LIQUID_GLOWS[Number(chainState2.liquidColor ?? layout?.liquid?.colorIndex ?? 1) % LIQUID_GLOWS.length] || "#6fffe2" : pressureColor;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  if (family === "signal" || family === "screen") drawScreenPulse(ctx2, headBounds, heartbeat, pressure, time, accent);
  if (family === "fluid") drawFluidReaction(ctx2, headBounds, heartbeat, pressure, time, accent);
  if (family === "electric") drawElectricReaction(ctx2, headBounds, heartbeat, pressure, time, pressureColor);
  if (family === "archive") drawArchiveReaction(ctx2, headBounds, heartbeat, pressure, time, accent);
  if (family === "vault") drawVaultReaction(ctx2, headBounds, heartbeat, pressure, time, accent);
  ctx2.restore();
}
function drawScreenPulse(ctx2, bounds, heartbeat, pressure, time, color) {
  const pressureBoost = pressure === "extreme" ? 1 : pressure === "high" ? 0.72 : pressure === "medium" ? 0.36 : 0.16;
  ctx2.save();
  const alpha = 0.015 + heartbeat * 0.035 + pressureBoost * 0.018;
  ctx2.strokeStyle = colorAlpha2(color, alpha);
  ctx2.lineWidth = 0.55 + pressureBoost * 0.35;
  const lineCount = pressure === "extreme" ? 9 : pressure === "high" ? 7 : 5;
  for (let i = 0; i < lineCount; i += 1) {
    const y = bounds.y + bounds.h * (0.28 + i * 0.065) + Math.sin(time * 4 + i) * (1 + pressureBoost * 2.5);
    const jitter2 = Math.sin(time * 9 + i * 2.7) * pressureBoost * 4;
    ctx2.beginPath();
    ctx2.moveTo(bounds.x + bounds.w * 0.2 + jitter2, y);
    ctx2.lineTo(bounds.x + bounds.w * 0.82 + jitter2 * 0.4, y + Math.sin(i + time) * 2);
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawFluidReaction(ctx2, bounds, heartbeat, pressure, time, color) {
  const boil = pressure === "extreme" ? 1 : pressure === "high" ? 0.72 : pressure === "medium" ? 0.38 : 0.18;
  ctx2.save();
  ctx2.strokeStyle = colorAlpha2(color, 0.2 + heartbeat * 0.18);
  ctx2.fillStyle = colorAlpha2(color, 0.08 + boil * 0.05);
  for (let i = 0; i < 12; i += 1) {
    const phase = (time * (0.35 + boil * 0.52) + i * 0.131) % 1;
    const x = bounds.x + bounds.w * (0.24 + i * 37 % 48 / 100);
    const y = bounds.y + bounds.h * (0.78 - phase * 0.54);
    const r = 2.4 + i % 4 + heartbeat * 2;
    ctx2.beginPath();
    ctx2.arc(x + Math.sin(time + i) * 4, y, r, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawElectricReaction(ctx2, bounds, heartbeat, pressure, time, color) {
  const active = pressure === "extreme" || pressure === "high" || heartbeat > 0.1;
  if (!active) return;
  ctx2.save();
  ctx2.strokeStyle = colorAlpha2(pressure === "extreme" ? "#ffef7a" : color, 0.18 + heartbeat * 0.3);
  ctx2.lineWidth = pressure === "extreme" ? 2.4 : 1.5;
  for (let i = 0; i < 4; i += 1) {
    const startX = bounds.cx + Math.sin(time * 2 + i) * bounds.w * 0.18;
    const startY = bounds.y + bounds.h * (0.16 + i * 0.08);
    ctx2.beginPath();
    ctx2.moveTo(startX, startY);
    for (let j = 1; j <= 4; j += 1) {
      ctx2.lineTo(startX + (j % 2 ? 18 : -12) + i * 5, startY - j * (12 + i));
    }
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawArchiveReaction(ctx2, bounds, heartbeat, pressure, time, color) {
  ctx2.save();
  ctx2.strokeStyle = colorAlpha2(color, 0.16 + heartbeat * 0.22);
  ctx2.fillStyle = colorAlpha2("#fff4c8", 0.05 + heartbeat * 0.05);
  for (let i = 0; i < 5; i += 1) {
    const x = bounds.x + bounds.w * (0.2 + i * 0.13);
    const y = bounds.y + bounds.h * (0.64 + Math.sin(time * 2.4 + i) * 0.018);
    ctx2.strokeRect(x, y, bounds.w * 0.08, bounds.h * 0.045);
    ctx2.fillRect(x, y, bounds.w * 0.08, bounds.h * 0.045);
  }
  if (pressure === "high" || pressure === "extreme") {
    ctx2.beginPath();
    ctx2.moveTo(bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.72);
    ctx2.lineTo(bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.72 + Math.sin(time * 16) * 4);
    ctx2.stroke();
  }
  ctx2.restore();
}
function drawVaultReaction(ctx2, bounds, heartbeat, pressure, time, color) {
  ctx2.save();
  ctx2.strokeStyle = colorAlpha2(color, 0.16 + heartbeat * 0.25);
  ctx2.lineWidth = 2;
  const radius = Math.min(bounds.w, bounds.h) * (0.22 + heartbeat * 0.05);
  ctx2.beginPath();
  ctx2.arc(bounds.cx, bounds.cy, radius, time * 0.7, time * 0.7 + Math.PI * 1.4);
  ctx2.stroke();
  if (pressure === "high" || pressure === "extreme") {
    ctx2.strokeStyle = colorAlpha2("#ffb347", 0.16);
    ctx2.strokeRect(bounds.cx - radius, bounds.cy - radius, radius * 2, radius * 2);
  }
  ctx2.restore();
}
function drawSelection(ctx2, part, look = CANVAS_LOOKS.whiteBlueprint) {
  const bounds = partBounds(part);
  ctx2.save();
  ctx2.translate(part.x, part.y);
  ctx2.rotate(part.rotation || 0);
  ctx2.scale(part.scaleX || 1, part.scaleY || 1);
  ctx2.strokeStyle = look.text;
  ctx2.lineWidth = 1.6;
  ctx2.setLineDash([8, 7]);
  ctx2.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx2.setLineDash([]);
  for (const [x, y] of [
    [bounds.x, bounds.y],
    [bounds.x + bounds.w, bounds.y],
    [bounds.x, bounds.y + bounds.h],
    [bounds.x + bounds.w, bounds.y + bounds.h]
  ]) {
    ctx2.fillStyle = look.nodeFill;
    ctx2.beginPath();
    ctx2.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
  }
  const handleY = bounds.y - 42;
  ctx2.beginPath();
  ctx2.moveTo(0, bounds.y - 8);
  ctx2.lineTo(0, handleY + 12);
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.arc(0, handleY, 14, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.font = "15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx2.fillStyle = look.text;
  ctx2.fillText("R", -5, handleY + 5);
  ctx2.restore();
  ctx2.save();
  for (const connector of getVisualConnectors(part)) {
    ctx2.strokeStyle = connector.kind === "pipe" ? "rgba(28, 118, 154, 0.82)" : look.text;
    ctx2.fillStyle = look.nodeFill;
    ctx2.lineWidth = 1.8;
    ctx2.beginPath();
    ctx2.arc(connector.x, connector.y, 7, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
  }
  ctx2.restore();
}

// renderer/anim-entry.js
var BASE_LAYOUT = window.__LAM_BASE_LAYOUT__;
var canvas = document.getElementById("render");
var stage = document.querySelector(".stage");
var ctx = canvas.getContext("2d");
var params = new URLSearchParams(location.search);
var storageKey = ["lamOpenSeaAssembly", "v3-cache-fix", params.get("contract") || "collection", BASE_LAYOUT.tokenId, params.get("owner") || "viewer"].join(":");
var assemblyParts = () => (renderLayout.placements || []).filter((part) => part.assembly !== false);
var renderLayout = JSON.parse(JSON.stringify(BASE_LAYOUT));
var captureMode = params.has("capture");
var clamp012 = (value) => Math.max(0, Math.min(1, value));
var ease = (value) => 1 - Math.pow(1 - clamp012(value), 3);
var lerp = (a, b, t) => a + (b - a) * t;
var mode = "dismantled";
var previewMotion = false;
var transition = null;
var selected = null;
var dragOffset = { x: 0, y: 0 };
var dragTarget = null;
var mouseLook = { active: false, x: canvas.width / 2, y: canvas.height / 2 };
var cursorRings = [];
var lastRingAt = 0;
var lastRenderAt = 0;
var motionClock = 0;
var lastMotionClockAt = 0;
var lastBackendPollAt = -Infinity;
var backendBusy = false;
var backendOnline = false;
var livePulseStartedAt = 0;
var renderRevision = 0;
var partsUrl = window.__LAM_PARTS_URL__ || "";
var partsImg = null;
if (partsUrl) {
  partsImg = new Image();
  partsImg.crossOrigin = "anonymous";
  partsImg.decoding = "async";
  partsImg.src = partsUrl;
}
var overlayAlpha = 0;
function drawPartsOverlay(c, info) {
  if (!partsImg || !partsImg.complete || !partsImg.naturalWidth || overlayAlpha < 0.01) return;
  c.save();
  c.globalAlpha = Math.min(1, overlayAlpha);
  c.drawImage(partsImg, 0, 0, info.width, info.height);
  c.restore();
}
var BACKEND_BASE_URL = String(params.get("backend") || "https://motorheads-backend.zacbosugame.workers.dev").replace(/\/+$/, "");
var backendEnabled = params.get("backend") !== "0" && params.get("liveBackend") !== "0" && !captureMode;
var backendPollMs = Math.max(15e3, Number(params.get("pollMs") || 45e3));
var backendFetchTimeoutMs = Math.max(900, Math.min(5e3, Number(params.get("fetchTimeoutMs") || params.get("fetchTimeout") || 2200)));
var motionMode = String(params.get("motion") || "marketplace").toLowerCase();
var fullMotion = motionMode === "full" || motionMode === "studio";
var ecoMotion = motionMode === "eco" || params.get("eco") === "1";
var controls = {
  dismantle: document.getElementById("dismantle"),
  assemble: document.getElementById("assemble"),
  stop: document.getElementById("stopMotion")
};
var gasMode = String(params.get("gas") || "").toLowerCase();
var gasPressure = gasMode === "extreme" ? 160 : gasMode === "high" ? 90 : gasMode === "medium" ? 42 : gasMode === "low" ? 9 : Number(params.get("gasPressure") || params.get("baseFee") || 0);
var secondsFromParams = (secondsKey, daysKey) => {
  if (params.has(secondsKey)) return Math.max(0, Number(params.get(secondsKey) || 0));
  if (params.has(daysKey)) return Math.max(0, Number(params.get(daysKey) || 0) * 86400);
  return 0;
};
var chainState = {
  liveMode: true,
  showLiveEffects: true,
  gasPressure,
  baseFeeGwei: gasPressure,
  blockNumber: Number(params.get("block") || params.get("blockNumber") || 25e6 + Math.abs(BASE_LAYOUT.tokenId) * 137 % 9e5),
  heartbeatPulse: Number(params.get("heartbeat") || 0.18),
  archiveAgeSeconds: secondsFromParams("ageSeconds", "ageDays"),
  holderBondSeconds: secondsFromParams("bondSeconds", "bondDays"),
  transferCount: Number(params.get("transfers") || params.get("transferCount") || 0),
  saleCount: Number(params.get("saleCount") || params.get("sales") || 0),
  saleTier: params.get("saleTier") || params.get("sale") || "",
  highestVerifiedSaleWei: params.get("highestSaleWei") || params.get("saleWei") || "",
  scarScreenColor: params.get("scarScreenColor") || params.get("scarColor") || "",
  globalPhase: params.get("phase") || "Archive Awakening",
  source: "fallback"
};
function numberOrFallback(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function gasFromLevel(level, fallback) {
  const value = String(level || "").toLowerCase();
  if (value === "extreme") return 160;
  if (value === "high") return 90;
  if (value === "medium") return 42;
  if (value === "low") return 9;
  return fallback;
}
function updateLivePulse(now = performance.now()) {
  if (!livePulseStartedAt) return;
  const age = (now - livePulseStartedAt) / 1e3;
  chainState.heartbeatPulse = Math.max(0.12, 0.78 * Math.max(0, 1 - age / 1.8));
  if (age > 2.4) livePulseStartedAt = 0;
}
async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller?.signal,
      headers: { accept: "application/json" }
    });
    if (!response.ok) throw new Error("Backend returned " + response.status);
    return await response.json();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
function applyBackendChainState(payload) {
  const chain = payload?.chainState;
  if (!chain) return false;
  const gasGwei = numberOrFallback(chain.gasGwei, null);
  const fallbackGas = gasFromLevel(chain.gasLevel, chainState.gasPressure);
  const nextGas = gasGwei == null ? fallbackGas : Math.max(0, gasGwei);
  const holderAgeDays = numberOrFallback(chain.holderAgeDays, null);
  const saleCount = Math.max(0, Math.floor(numberOrFallback(chain.saleCount, chainState.saleCount)));
  chainState.liveMode = true;
  chainState.showLiveEffects = true;
  chainState.backendOnline = true;
  chainState.backendError = "";
  chainState.source = chain.source || "indexer";
  chainState.gasPressure = nextGas;
  chainState.baseFeeGwei = nextGas;
  chainState.gasLevel = chain.gasLevel || "";
  chainState.blockNumber = Math.floor(numberOrFallback(chain.latestBlock, chainState.blockNumber));
  chainState.transferCount = Math.max(0, Math.floor(numberOrFallback(chain.transferCount, chainState.transferCount)));
  chainState.saleCount = saleCount;
  chainState.sellCount = saleCount;
  chainState.highestVerifiedSaleWei = chain.lastSalePriceWei || chainState.highestVerifiedSaleWei || "";
  chainState.saleTier = saleCount > 0 ? chain.lastSalePriceWei || "verified" : "";
  chainState.evolutionTier = chain.evolutionTier || "";
  if (holderAgeDays != null) {
    const seconds = Math.max(0, Math.floor(holderAgeDays * 86400));
    chainState.archiveAgeSeconds = seconds;
    chainState.holderBondSeconds = seconds;
  }
  livePulseStartedAt = performance.now();
  backendOnline = true;
  return true;
}
async function pollBackendChainState(force = false) {
  if (!backendEnabled || backendBusy || !BACKEND_BASE_URL) return;
  const now = performance.now();
  if (!force && now - lastBackendPollAt < backendPollMs) return;
  lastBackendPollAt = now;
  backendBusy = true;
  try {
    const url = BACKEND_BASE_URL + "/v1/tokens/" + encodeURIComponent(BASE_LAYOUT.tokenId) + "/chain-state";
    applyBackendChainState(await fetchJsonWithTimeout(url, backendFetchTimeoutMs));
  } catch (_) {
    backendOnline = false;
    chainState.backendOnline = false;
    chainState.source = chainState.source === "indexer" ? "stale-indexer" : "fallback";
    chainState.backendError = _?.name || _?.message || "fetch_failed";
  } finally {
    backendBusy = false;
  }
}
function placementPoint(part, key) {
  const source = part[key] || part.target || part;
  return {
    x: Number(source.x ?? part.x ?? 0),
    y: Number(source.y ?? part.y ?? 0),
    rotation: Number(source.rotation ?? part.rotation ?? 0),
    scaleX: Number(source.scaleX ?? part.scaleX ?? 1),
    scaleY: Number(source.scaleY ?? part.scaleY ?? part.scaleX ?? 1)
  };
}
function currentPoint(part) {
  return {
    x: Number(part.x ?? 0),
    y: Number(part.y ?? 0),
    rotation: Number(part.rotation ?? 0),
    scaleX: Number(part.scaleX ?? 1),
    scaleY: Number(part.scaleY ?? part.scaleX ?? 1)
  };
}
function applyPoint(part, point) {
  part.x = point.x;
  part.y = point.y;
  part.rotation = point.rotation;
  part.scaleX = point.scaleX;
  part.scaleY = point.scaleY;
}
function invalidateRenderCache() {
  renderRevision += 1;
  renderLayout.__renderRevision = renderRevision;
}
function applyAll(key) {
  for (const part of renderLayout.placements || []) applyPoint(part, placementPoint(part, key));
  invalidateRenderCache();
}
function saveAssemblyState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      mode,
      previewMotion,
      parts: Object.fromEntries((renderLayout.placements || []).map((part) => [part.id, currentPoint(part)]))
    }));
  } catch (_) {
  }
}
function loadAssemblyState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved?.parts) return false;
    for (const part of renderLayout.placements || []) {
      if (saved.parts[part.id]) applyPoint(part, saved.parts[part.id]);
    }
    mode = saved.mode === "assembled" ? "assembled" : "dismantled";
    previewMotion = Boolean(saved.previewMotion && mode === "assembled");
    if (mode === "assembled" && !allPartsAssembled()) {
      applyAll("target");
      previewMotion = Boolean(saved.previewMotion);
    } else {
      invalidateRenderCache();
    }
    return true;
  } catch (_) {
    return false;
  }
}
function setActiveButton() {
  controls.dismantle.classList.toggle("is-active", mode === "dismantled");
  controls.assemble.classList.toggle("is-active", mode === "assembled");
  controls.stop.classList.toggle("is-active", previewMotion === false);
  controls.stop.textContent = previewMotion ? "S" : "P";
  controls.stop.title = previewMotion ? "Stop animation" : "Start animation";
  controls.stop.setAttribute("aria-label", controls.stop.title);
}
function transitionTo(destinationKey, nextMode) {
  const from = /* @__PURE__ */ new Map();
  for (const part of renderLayout.placements || []) from.set(part.id, currentPoint(part));
  transition = {
    from,
    destinationKey,
    nextMode,
    startedAt: performance.now(),
    duration: 820
  };
  mode = nextMode;
  previewMotion = false;
  invalidateRenderCache();
  setActiveButton();
}
function updateTransition() {
  if (!transition) return;
  const t = ease((performance.now() - transition.startedAt) / transition.duration);
  for (const part of renderLayout.placements || []) {
    const from = transition.from.get(part.id) || currentPoint(part);
    const to = placementPoint(part, transition.destinationKey);
    applyPoint(part, {
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t),
      rotation: lerp(from.rotation, to.rotation, t),
      scaleX: lerp(from.scaleX, to.scaleX, t),
      scaleY: lerp(from.scaleY, to.scaleY, t)
    });
  }
  if (t >= 1) {
    mode = transition.nextMode;
    applyAll(transition.destinationKey);
    transition = null;
    if (mode === "assembled") previewMotion = true;
    saveAssemblyState();
    setActiveButton();
  }
}
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}
function updateMouseLook(event) {
  const point = canvasPoint(event);
  mouseLook = { active: true, x: point.x, y: point.y };
  return point;
}
function updateDragCursor(point) {
  if (selected) {
    stage.classList.add("is-over-part");
    return selected;
  }
  const part = findPartAt(point);
  stage.classList.toggle("is-over-part", Boolean(part));
  return part;
}
function openLargeView() {
  if (document.fullscreenElement) return;
  if (stage.requestFullscreen) {
    stage.requestFullscreen().catch(() => {
      window.open(location.href, "_blank", "noopener,noreferrer");
    });
    return;
  }
  window.open(location.href, "_blank", "noopener,noreferrer");
}
function spawnCursorRings(point, burst = false) {
  const now = performance.now();
  if (!burst && now - lastRingAt < 58) return;
  lastRingAt = now;
  const count = fullMotion ? burst ? 9 : 3 : burst ? 5 : 1;
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (burst ? 16 : 8);
    cursorRings.push({
      x: point.x + Math.cos(angle) * distance,
      y: point.y + Math.sin(angle) * distance,
      createdAt: now,
      life: fullMotion ? burst ? 640 + Math.random() * 160 : 430 + Math.random() * 110 : burst ? 520 + Math.random() * 120 : 320 + Math.random() * 90,
      radius: 4 + Math.random() * 8,
      grow: fullMotion ? 15 + Math.random() * (burst ? 30 : 18) : 10 + Math.random() * (burst ? 20 : 12),
      lineWidth: 1 + Math.random() * 1.6,
      color: index % 3 === 0 ? "11,25,28" : index % 3 === 1 ? "31,77,78" : "126,94,34"
    });
  }
  cursorRings = cursorRings.filter((ring) => now - ring.createdAt < ring.life).slice(fullMotion ? -58 : -28);
}
function updateDragMotion() {
  if (!selected || !dragTarget) return;
  selected.x = dragTarget.x;
  selected.y = dragTarget.y;
}
function partAttachmentDistance(part) {
  const target = placementPoint(part, "target");
  return Math.hypot(Number(part.x || 0) - target.x, Number(part.y || 0) - target.y);
}
function allPartsAssembled() {
  return assemblyParts().every((part) => partAttachmentDistance(part) <= 9);
}
function partGripHit(part, point) {
  const bounds = partBounds(part);
  const sx = (part.flipX ? -1 : 1) * Number(part.scaleX || 1);
  const sy = (part.flipY ? -1 : 1) * Number(part.scaleY || part.scaleX || 1);
  const rotation = Number(part.rotation || 0);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const dx = point.x - Number(part.x || 0);
  const dy = point.y - Number(part.y || 0);
  const localX = (dx * cos + dy * sin) / (sx || 1);
  const localY = (-dx * sin + dy * cos) / (sy || 1);
  const gripPad = part.key === "face.stroke" || part.key === "face.pupil" ? 16 : 12;
  const minX = bounds.x - gripPad;
  const minY = bounds.y - gripPad;
  const maxX = bounds.x + bounds.w + gripPad;
  const maxY = bounds.y + bounds.h + gripPad;
  const insideBounds = localX >= minX && localX <= maxX && localY >= minY && localY <= maxY;
  const radius = Math.max(20, Math.min(92, getPartRadius(part) * 0.82));
  const insideRadius = Math.hypot(dx, dy) <= radius;
  if (!insideBounds && !insideRadius) return null;
  const clampedX = Math.max(bounds.x, Math.min(bounds.x + bounds.w, localX));
  const clampedY = Math.max(bounds.y, Math.min(bounds.y + bounds.h, localY));
  const edgeDistance = Math.hypot(localX - clampedX, localY - clampedY);
  const area = Math.max(1, bounds.w * bounds.h * Math.abs(sx || 1) * Math.abs(sy || 1));
  const attached = partAttachmentDistance(part) <= 10;
  return { part, attached, edgeDistance, area, z: Number(part.z ?? part.zIndex ?? 0) };
}
function findPartAt(point) {
  const hits = (renderLayout.placements || []).map((part) => partGripHit(part, point)).filter(Boolean);
  if (!hits.length) return null;
  hits.sort((a, b) => {
    if (a.attached !== b.attached) return a.attached ? 1 : -1;
    if (a.z !== b.z) return b.z - a.z;
    if (a.edgeDistance !== b.edgeDistance) return a.edgeDistance - b.edgeDistance;
    return a.area - b.area;
  });
  return hits[0].part;
}
function snapSelected() {
  if (!selected) return false;
  const target = placementPoint(selected, "target");
  const snapRadius = Math.max(104, Math.min(150, getPartRadius(selected) * 1.65));
  if (Math.hypot(selected.x - target.x, selected.y - target.y) <= snapRadius) {
    applyPoint(selected, target);
    spawnCursorRings(target, true);
    return true;
  }
  return false;
}
function drawSnapHints() {
  if (!selected || transition) return;
  const now = performance.now();
  const pulse = 0.5 + Math.sin(now / 160) * 0.5;
  const target = placementPoint(selected, "target");
  const distance = Math.hypot(Number(selected.x || 0) - target.x, Number(selected.y || 0) - target.y);
  const close = clamp012(1 - distance / 180);
  const size = 24 + pulse * 8 + close * 12;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(31,77,78," + (0.42 + close * 0.26) + ")";
  ctx.fillStyle = "rgba(8,20,22," + (0.08 + close * 0.1) + ")";
  ctx.shadowColor = "rgba(220,168,45," + (0.22 + close * 0.28) + ")";
  ctx.shadowBlur = 10 + close * 10;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(target.x, target.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function drawCursorRings() {
  const now = performance.now();
  cursorRings = cursorRings.filter((ring) => now - ring.createdAt < ring.life);
  if (!cursorRings.length && !selected) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const ring of cursorRings) {
    const t = clamp012((now - ring.createdAt) / ring.life);
    const alpha = (1 - t) * (1 - t) * (fullMotion ? 0.34 : 0.24);
    const radius = ring.radius + ring.grow * ease(t);
    ctx.strokeStyle = "rgba(" + ring.color + "," + alpha + ")";
    ctx.lineWidth = ring.lineWidth * (1 - t * 0.45);
    ctx.shadowColor = "rgba(212,161,49," + alpha * 0.52 + ")";
    ctx.shadowBlur = (fullMotion ? 10 : 6) * (1 - t);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (selected && mouseLook.active) {
    const pulse = 0.5 + Math.sin(now / 90) * 0.5;
    const glow = 10 + pulse * 7;
    ctx.fillStyle = "rgba(8,18,20,0.2)";
    ctx.shadowColor = "rgba(218,163,43,0.38)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(mouseLook.x, mouseLook.y, glow, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function render(now = performance.now()) {
  void pollBackendChainState();
  updateLivePulse(now);
  const activeMotion = previewMotion || transition || selected || cursorRings.length;
  const frameMs = selected ? 1e3 / (fullMotion ? 42 : ecoMotion ? 26 : 32) : transition ? 1e3 / (fullMotion ? 36 : ecoMotion ? 18 : 24) : previewMotion ? 1e3 / (fullMotion ? 36 : ecoMotion ? 12 : 24) : activeMotion ? 1e3 / (fullMotion ? 28 : ecoMotion ? 12 : 18) : 1e3 / (fullMotion ? 12 : ecoMotion ? 5 : 8);
  if (!captureMode && lastRenderAt && now - lastRenderAt < frameMs) {
    requestAnimationFrame(render);
    return;
  }
  lastRenderAt = now;
  if (previewMotion || transition) {
    motionClock = now / 1e3;
  }
  lastMotionClockAt = now;
  updateTransition();
  updateDragMotion();
  const performanceMode = selected ? "drag" : !fullMotion && previewMotion ? "marketplace" : "normal";
  const overlayTarget = partsImg && mode === "assembled" && !selected && !transition ? 1 : 0;
  overlayAlpha += (overlayTarget - overlayAlpha) * 0.14;
  drawMachine(ctx, renderLayout, chainState, { previewMotion, editMode: false, selected, mouseLook, performanceMode, motionTime: motionClock, drawOverlay: partsImg ? drawPartsOverlay : void 0 });
  drawCursorRings();
  drawSnapHints();
  document.body.dataset.ready = "true";
  document.body.dataset.chainSource = chainState.source || "";
  document.body.dataset.chainBlock = String(chainState.blockNumber || "");
  document.body.dataset.backendOnline = backendOnline ? "true" : "false";
  document.body.dataset.backendError = chainState.backendError || "";
  document.body.dataset.motionMode = motionMode;
  document.body.dataset.motionFps = String(Math.round(1e3 / frameMs));
  if (!captureMode) requestAnimationFrame(render);
}
controls.dismantle.addEventListener("click", () => {
  transition = null;
  applyAll("start");
  mode = "dismantled";
  previewMotion = false;
  selected = null;
  dragTarget = null;
  saveAssemblyState();
  setActiveButton();
});
controls.assemble.addEventListener("click", () => transitionTo("target", "assembled"));
controls.stop.addEventListener("click", () => {
  previewMotion = !previewMotion;
  if (!previewMotion) transition = null;
  saveAssemblyState();
  setActiveButton();
});
canvas.addEventListener("pointerdown", (event) => {
  const point = updateMouseLook(event);
  selected = updateDragCursor(point);
  if (!selected) return;
  event.preventDefault();
  transition = null;
  mode = "dismantled";
  previewMotion = false;
  dragOffset = { x: selected.x - point.x, y: selected.y - point.y };
  dragTarget = { x: selected.x, y: selected.y };
  spawnCursorRings(point, true);
  stage.classList.add("is-dragging");
  canvas.setPointerCapture(event.pointerId);
  setActiveButton();
});
canvas.addEventListener("pointermove", (event) => {
  const point = updateMouseLook(event);
  if (!selected) {
    updateDragCursor(point);
    return;
  }
  spawnCursorRings(point);
  dragTarget = { x: point.x + dragOffset.x, y: point.y + dragOffset.y };
  selected.x = dragTarget.x;
  selected.y = dragTarget.y;
  const target = placementPoint(selected, "target");
  selected.rotation = Number(selected.rotation || 0) + (target.rotation - Number(selected.rotation || 0)) * 0.04;
  lastRenderAt = 0;
});
canvas.addEventListener("pointerup", (event) => {
  if (!selected) return;
  updateMouseLook(event);
  if (dragTarget) {
    selected.x = dragTarget.x;
    selected.y = dragTarget.y;
  }
  snapSelected();
  invalidateRenderCache();
  selected = null;
  dragTarget = null;
  spawnCursorRings(mouseLook, true);
  stage.classList.remove("is-dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  if (allPartsAssembled()) {
    mode = "assembled";
    previewMotion = true;
  }
  saveAssemblyState();
  setActiveButton();
  updateDragCursor(canvasPoint(event));
});
canvas.addEventListener("pointercancel", () => {
  if (selected && dragTarget) {
    selected.x = dragTarget.x;
    selected.y = dragTarget.y;
  }
  snapSelected();
  invalidateRenderCache();
  selected = null;
  dragTarget = null;
  spawnCursorRings(mouseLook, true);
  stage.classList.remove("is-dragging", "is-over-part");
  saveAssemblyState();
  setActiveButton();
});
canvas.addEventListener("dblclick", (event) => {
  const point = updateMouseLook(event);
  if (findPartAt(point)) return;
  event.preventDefault();
  openLargeView();
});
canvas.addEventListener("pointerleave", () => {
  mouseLook = { ...mouseLook, active: false };
  stage.classList.remove("is-over-part");
});
var forcedStart = String(params.get("start") || (params.get("assembled") === "1" ? "assembled" : "")).toLowerCase();
if (params.get("resetAssembly") === "1") {
  try {
    localStorage.removeItem(storageKey);
  } catch (_) {
  }
}
if (forcedStart === "assembled") {
  applyAll("target");
  mode = "assembled";
  previewMotion = params.get("play") !== "0";
} else if (forcedStart === "dismantled") {
  applyAll("start");
  mode = "dismantled";
  previewMotion = false;
} else if (!loadAssemblyState()) {
  applyAll("start");
  mode = "dismantled";
  previewMotion = false;
}
overlayAlpha = mode === "assembled" ? 1 : 0;
setActiveButton();
void pollBackendChainState(true);
render();
