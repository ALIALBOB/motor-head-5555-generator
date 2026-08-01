import { LIQUID_ACCENTS, LIQUID_GLOWS, LIQUID_PALETTE, MATERIALS } from "./schema.js";

const INK = "rgba(18, 22, 25, 0.72)";
const SOFT_INK = "rgba(18, 22, 25, 0.38)";
const GRAPHITE = "rgba(18, 22, 25, 0.16)";
const CLEAN_GEAR_SPOKES = new Set(["gear.large", "gear.web", "gear.spoked.large", "ring.sprocket", "gear.crown"]);
const SELF_OUTLINED_PARTS = new Set([
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

const STATIC_PART_CACHE = new Map();
const STATIC_PART_CACHE_LIMIT = 360;
let staticPartCacheHits = 0;
let staticPartCacheMisses = 0;

function staticPartCacheKey(part, state = {}, shadeStyle = "pencilSketch", width = 0, height = 0) {
  if (state.previewMotion !== false) return null;
  if (state.mouseLook?.active) return null;
  const key = String(part.key || "");
  if (!key || key.startsWith("counter.") || key === "pack.gas.reader") return null;
  const usesLiquidState = key === "drop.liquid"
    || key.includes("tank")
    || key.includes("vial")
    || key.includes("fluid")
    || part.traitLayer === "fluid"
    || part.role === "fluid";
  const skin = state.specialMaterialSkin || state.materialSkin || part.specialMaterialSkinData || null;
  const skinKey = skin
    ? [
        skin.id,
        skin.surface,
        skin.primary,
        skin.secondary,
        skin.accent,
        skin.edge,
        skin.glow
      ].join("/")
    : "";
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
    skinKey
  ].join("|");
}

function rememberStaticPartCanvas(cacheKey, canvas) {
  if (!cacheKey) return;
  if (STATIC_PART_CACHE.size >= STATIC_PART_CACHE_LIMIT) {
    const firstKey = STATIC_PART_CACHE.keys().next().value;
    if (firstKey) STATIC_PART_CACHE.delete(firstKey);
  }
  STATIC_PART_CACHE.set(cacheKey, canvas);
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

const LEGACY_MATERIALS = {
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

function setup(ctx, part, width = 2.2, alpha = 0.86) {
  const style = styleFor(part);
  ctx.globalAlpha *= part.opacity ?? 1;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = colorAlpha(style.stroke || "#1a1f22", alpha === 0.86 ? 0.74 : alpha * 0.86);
  ctx.fillStyle = style.fill;
  ctx.shadowBlur = 0;
  return style;
}

function drawFinishLine(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function applyMaterialFinish(ctx, part, state = {}) {
  if (part.key === "pack.icon" || part.key === "pack.shoulder.shell" || part.key === "pack.shoulder.band") return;
  if (String(part.key || "").startsWith("counter.") || part.key === "pack.gas.reader") return;
  const style = styleFor(part);
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = style.tint || "rgba(18,22,25,0.12)";
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  if (style.metal || style.glass || style.innerGlow) {
    const finish = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    finish.addColorStop(0, style.highlight || "rgba(255,255,255,0.24)");
    finish.addColorStop(0.18, style.tint || "rgba(255,255,255,0.08)");
    finish.addColorStop(0.56, style.fill || "rgba(18,22,25,0.14)");
    finish.addColorStop(1, style.edge || "rgba(18,22,25,0.18)");
    ctx.fillStyle = finish;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (style.glass) {
    const gleam = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gleam.addColorStop(0, style.highlight || "rgba(255,255,255,0.28)");
    gleam.addColorStop(0.42, "rgba(255,255,255,0.02)");
    gleam.addColorStop(1, style.innerGlow || "rgba(120,220,255,0.14)");
    ctx.fillStyle = gleam;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (style.innerGlow) {
    ctx.fillStyle = style.innerGlow;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (part.traitLayer === "clothes" || part.role === "clothes") {
    ctx.strokeStyle = style.edge || style.highlight || "rgba(255,255,255,0.22)";
    ctx.lineWidth = style.glass ? 1.1 : 0.9;
    for (let i = 0; i < 3; i += 1) {
      const y = bounds.y + bounds.h * (0.24 + i * 0.22);
      drawFinishLine(ctx, bounds.x + bounds.w * 0.16, y, bounds.x + bounds.w * 0.84, y - bounds.h * 0.08, ctx.strokeStyle, ctx.lineWidth);
    }
    if (style.glass) {
      drawSkinEdgeGlints(ctx, bounds, (part.id || 1) * 37, "rgba(255,255,255,0.16)", 0.65);
    }
  }
  ctx.restore();

  const def = getPart(part.key);
  const suppressLooseFinishLines =
    part.key === "ring.bolted" ||
    part.key === "frame.box" ||
    part.key === "pack.shoulder.shell" ||
    SELF_OUTLINED_PARTS.has(part.key) ||
    part.role === "expression" ||
    part.traitLayer === "expression" ||
    ["gear", "wheel", "bevel", "face", "panel"].includes(def?.kind);
  if (!suppressLooseFinishLines && style.highlight) {
    drawFinishLine(ctx, bounds.x + bounds.w * 0.16, bounds.y + bounds.h * 0.18, bounds.x + bounds.w * 0.76, bounds.y + bounds.h * 0.08, style.highlight, style.glass ? 1.5 : 0.9);
  }
  if (!suppressLooseFinishLines && style.edge) {
    drawFinishLine(ctx, bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.82, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.74, style.edge, style.glass ? 1.1 : 0.8);
  }

  if (style.grit || part.material === "rustedIron" || part.material === "goldRelic" || part.material === "dirtyGlass") {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = style.grit || "rgba(118,52,23,0.18)";
    for (let i = 0; i < 34; i++) {
      const x = bounds.x + ((i * 41 + (part.id || 1) * 7) % Math.max(1, bounds.w));
      const y = bounds.y + ((i * 59 + (part.id || 1) * 11) % Math.max(1, bounds.h));
      ctx.beginPath();
      ctx.arc(x, y, 0.7 + (i % 4) * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function applyShadeFinish(ctx, part, shadeStyle = "pencilSketch", state = {}) {
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";

  if (shadeStyle === "cleanLine") {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  } else if (shadeStyle === "crosshatch") {
    drawHatching(ctx, bounds, -0.72, 7, 0.12, 0.72);
    drawHatching(ctx, bounds, 0.78, 10, 0.075, 0.58);
  } else if (shadeStyle === "stippleDots") {
    drawGraphiteTexture(ctx, bounds, 0.2);
  } else if (shadeStyle === "blueprintFade") {
    ctx.fillStyle = "rgba(40,120,159,0.2)";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawHatching(ctx, bounds, -0.66, 11, 0.065, 0.62);
  } else if (shadeStyle === "heavyInk") {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  } else if (shadeStyle === "rustWash") {
    const wash = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    wash.addColorStop(0, "rgba(137,82,46,0.08)");
    wash.addColorStop(0.66, "rgba(92,42,20,0.2)");
    wash.addColorStop(1, "rgba(177,98,43,0.1)");
    ctx.fillStyle = wash;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawGraphiteTexture(ctx, bounds, 0.14);
  } else if (shadeStyle === "terminalGlow") {
    ctx.fillStyle = "rgba(48,255,190,0.18)";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }
  ctx.restore();

  const partKey = String(part.key || "");
  const showTerminalDisplayFrame =
    shadeStyle === "terminalGlow" &&
    isFunctionalDisplayPart(part) &&
    !partKey.startsWith("counter.") &&
    partKey !== "pack.gas.reader";
  if (showTerminalDisplayFrame) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = shadeStyle === "terminalGlow" ? "rgba(94,255,209,0.38)" : "rgba(94,255,209,0.22)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.w + 4, bounds.h + 4);
    ctx.restore();
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

function applyGoldenFunctionalDisplayFinish(ctx, part, bounds, skin) {
  const key = String(part.key || "");
  const isLiveReadout = key.startsWith("counter.") || key === "pack.gas.reader";
  if (isLiveReadout) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(skin?.edge || "#ffd45d", 0.24);
    ctx.shadowColor = colorAlpha(skin?.glow || skin?.edge || "#ffd45d", 0.22);
    ctx.shadowBlur = 5;
    ctx.lineWidth = 0.9;
    ctx.strokeRect(bounds.x + 3, bounds.y + 3, bounds.w - 6, bounds.h - 6);
    ctx.fillStyle = "rgba(255,212,74,0.035)";
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const sheen = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  sheen.addColorStop(0, "rgba(255,246,170,0.2)");
  sheen.addColorStop(0.34, "rgba(255,194,45,0.1)");
  sheen.addColorStop(0.72, "rgba(59,35,7,0.16)");
  sheen.addColorStop(1, "rgba(255,224,101,0.16)");
  ctx.fillStyle = sheen;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  drawSkinEdgeGlints(ctx, bounds, (part.id || 1) * 71, "rgba(255,244,175,0.28)", 0.72);
  ctx.restore();

  if (!String(part.key || "").startsWith("counter.") && part.key !== "pack.gas.reader") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(skin?.edge || "#ffd45d", 0.2);
    ctx.lineWidth = 0.85;
    roughLine(ctx, bounds.x + bounds.w * 0.14, bounds.y + bounds.h * 0.24, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.17, 0.22, 5, (part.id || 1) * 91);
    ctx.restore();
  }
}

function isFunctionalDisplayPart(part) {
  return String(part.key || "").startsWith("counter.")
    || part.role === "expression"
    || part.traitLayer === "expression"
    || part.expression === true
    || part.material === "pfpFace";
}

function skinUnit(seed, salt) {
  const raw = Math.sin((seed + salt * 977) * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function drawSkinCracks(ctx, bounds, seed, color, accent, count, glow = 0) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.1;
  if (glow) {
    ctx.shadowColor = accent;
    ctx.shadowBlur = 4 + glow * 6;
  }
  for (let i = 0; i < count; i += 1) {
    const sx = bounds.x + skinUnit(seed, i + 1) * bounds.w;
    const sy = bounds.y + skinUnit(seed, i + 12) * bounds.h;
    const ex = sx + (skinUnit(seed, i + 22) - 0.5) * bounds.w * 0.32;
    const ey = sy + (skinUnit(seed, i + 32) - 0.5) * bounds.h * 0.28;
    roughLine(ctx, sx, sy, ex, ey, 0.7, 5, seed + i * 17);
    if (i % 3 === 0) {
      roughLine(ctx, sx + (ex - sx) * 0.48, sy + (ey - sy) * 0.48, sx + (skinUnit(seed, i + 42) - 0.5) * bounds.w * 0.22, sy + (skinUnit(seed, i + 52) - 0.5) * bounds.h * 0.2, 0.5, 3, seed + i * 23);
    }
  }
  if (accent) {
    ctx.strokeStyle = colorAlpha(accent, 0.5);
    ctx.lineWidth = 0.7;
    for (let i = 0; i < Math.max(1, Math.floor(count / 3)); i += 1) {
      const y = bounds.y + skinUnit(seed, i + 62) * bounds.h;
      roughLine(ctx, bounds.x + bounds.w * 0.18, y, bounds.x + bounds.w * 0.82, y + (skinUnit(seed, i + 72) - 0.5) * 12, 0.35, 5, seed + i * 31);
    }
  }
  ctx.restore();
}

function drawSkinDrops(ctx, bounds, seed, color, accent, count, molten = false) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = colorAlpha(accent, 0.46);
  ctx.lineWidth = 0.8;
  for (let i = 0; i < count; i += 1) {
    const x = bounds.x + skinUnit(seed, i + 7) * bounds.w;
    const y = bounds.y + skinUnit(seed, i + 17) * bounds.h;
    const r = 2 + skinUnit(seed, i + 27) * (molten ? 5 : 3.2);
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.75 + skinUnit(seed, i + 37) * 0.5), r * (molten ? 1.45 : 1.05), skinUnit(seed, i + 47) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    if (i % 2 === 0) ctx.stroke();
  }
  ctx.restore();
}

function drawSkinSpecks(ctx, bounds, seed, color, count, maxR = 1.8) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = bounds.x + skinUnit(seed, i + 80) * bounds.w;
    const y = bounds.y + skinUnit(seed, i + 180) * bounds.h;
    const r = 0.55 + skinUnit(seed, i + 280) * maxR;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSkinTechnicalLines(ctx, bounds, seed, color, accent, blueprint = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = blueprint ? 0.8 : 1.1;
  for (let i = 0; i < 5; i += 1) {
    const y = bounds.y + bounds.h * (0.18 + i * 0.16);
    roughLine(ctx, bounds.x + bounds.w * 0.12, y, bounds.x + bounds.w * 0.88, y + (skinUnit(seed, i + 3) - 0.5) * 6, blueprint ? 0.22 : 0.45, 8, seed + i * 9);
  }
  ctx.strokeStyle = colorAlpha(accent, blueprint ? 0.58 : 0.34);
  ctx.lineWidth = blueprint ? 0.7 : 0.9;
  roughLine(ctx, bounds.x + bounds.w * 0.16, bounds.y + bounds.h * 0.18, bounds.x + bounds.w * 0.44, bounds.y + bounds.h * 0.16, 0.2, 4, seed + 101);
  roughLine(ctx, bounds.x + bounds.w * 0.58, bounds.y + bounds.h * 0.82, bounds.x + bounds.w * 0.84, bounds.y + bounds.h * 0.78, 0.2, 4, seed + 103);
  ctx.restore();
}

function drawSkinEdgeGlints(ctx, bounds, seed, color, width = 0.8) {
  const padX = Math.max(4, Math.min(16, bounds.w * 0.13));
  const padY = Math.max(4, Math.min(14, bounds.h * 0.13));
  const spanX = Math.max(12, bounds.w * 0.22);
  const spanY = Math.max(10, bounds.h * 0.18);
  const glints = [
    [bounds.x + padX, bounds.y + padY, bounds.x + padX + spanX, bounds.y + padY - spanY * 0.18],
    [bounds.x + bounds.w - padX - spanX, bounds.y + bounds.h - padY + spanY * 0.12, bounds.x + bounds.w - padX, bounds.y + bounds.h - padY],
    [bounds.x + padX * 0.8, bounds.y + bounds.h * 0.62, bounds.x + padX * 0.8 + spanX * 0.65, bounds.y + bounds.h * 0.62 - spanY * 0.2]
  ];

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let i = 0; i < glints.length; i += 1) {
    roughLine(ctx, glints[i][0], glints[i][1], glints[i][2], glints[i][3], 0.18, 4, seed + i * 29);
  }
  ctx.restore();
}

function drawSkinSpecialMarks(ctx, bounds, seed, skin, surface) {
  const primary = skin.primary || "#111111";
  const secondary = skin.secondary || primary;
  const accent = skin.accent || skin.edge || "#ffffff";
  const edge = skin.edge || accent;
  if (surface === "soft") {
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(83,45,13,0.42)";
    for (let i = 0; i < 5; i += 1) {
      const x = bounds.x + skinUnit(seed, i + 10) * bounds.w;
      const y = bounds.y + skinUnit(seed, i + 20) * bounds.h;
      const r = 3 + skinUnit(seed, i + 30) * 7;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.72 + skinUnit(seed, i + 40) * 0.45), skinUnit(seed, i + 50) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (surface === "paper") {
    drawSkinTechnicalLines(ctx, bounds, seed, "rgba(12,12,12,0.48)", skin.accent || "#b6312a", true);
    drawSkinSpecks(ctx, bounds, seed, "rgba(128,54,34,0.18)", 12, 1.2);
  } else if (surface === "leather" || surface === "wood") {
    ctx.save();
    ctx.strokeStyle = colorAlpha(edge, 0.38);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i += 1) {
      const y = bounds.y + bounds.h * (0.12 + i * 0.16);
      roughLine(ctx, bounds.x + 6, y, bounds.x + bounds.w - 6, y + Math.sin(seed + i) * 4, 0.6, 9, seed + i * 13);
    }
    if (surface === "leather") {
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = colorAlpha(skin.accent, 0.5);
      roughLine(ctx, bounds.x + 8, bounds.y + bounds.h * 0.22, bounds.x + bounds.w - 8, bounds.y + bounds.h * 0.2, 0.22, 5, seed + 410);
      roughLine(ctx, bounds.x + 8, bounds.y + bounds.h * 0.78, bounds.x + bounds.w - 8, bounds.y + bounds.h * 0.8, 0.22, 5, seed + 420);
      ctx.setLineDash([]);
    }
    ctx.restore();
  } else if (surface === "blueprint") {
    drawSkinTechnicalLines(ctx, bounds, seed, "rgba(18,22,25,0.64)", accent, true);
  } else if (surface === "royalgold" || skin.id === "goldenEdition") {
    ctx.save();
    ctx.strokeStyle = "rgba(75,44,9,0.34)";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 4; i += 1) {
      const y = bounds.y + bounds.h * (0.18 + i * 0.18);
      roughLine(ctx, bounds.x + bounds.w * 0.15, y, bounds.x + bounds.w * 0.84, y + (skinUnit(seed, i + 33) - 0.5) * 7, 0.24, 6, seed + i * 19);
    }
    ctx.strokeStyle = colorAlpha(accent, 0.34);
    ctx.lineWidth = 0.85;
    roughLine(ctx, bounds.x + bounds.w * 0.2, bounds.y + bounds.h * 0.25, bounds.x + bounds.w * 0.36, bounds.y + bounds.h * 0.19, 0.18, 4, seed + 120);
    roughLine(ctx, bounds.x + bounds.w * 0.63, bounds.y + bounds.h * 0.79, bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.72, 0.18, 4, seed + 130);
    ctx.restore();
    drawSkinSpecks(ctx, bounds, seed + 222, "rgba(255,238,145,0.28)", 12, 1.45);
    drawSkinSpecks(ctx, bounds, seed + 333, "rgba(73,42,8,0.18)", 10, 1.15);
    drawSkinEdgeGlints(ctx, bounds, seed + 444, "rgba(255,246,175,0.3)", 0.9);
  } else if (surface === "cosmic" || surface === "void") {
    drawSkinSpecks(ctx, bounds, seed, colorAlpha("#ffffff", 0.72), 12, 1.3);
    drawSkinSpecks(ctx, bounds, seed + 111, colorAlpha(accent, 0.5), 6, 1.8);
  } else if (surface === "stone" || surface === "marble" || surface === "porcelain" || surface === "ceramic" || surface === "volcanic" || surface === "ash") {
    drawSkinCracks(ctx, bounds, seed, colorAlpha(surface === "volcanic" ? "#080503" : secondary, 0.58), colorAlpha(accent, surface === "volcanic" ? 0.9 : 0.5), surface === "marble" || surface === "porcelain" ? 6 : 8, surface === "volcanic" ? 0.7 : 0.2);
  } else if (surface === "rubber" || surface === "carbon") {
    drawSkinTechnicalLines(ctx, bounds, seed, colorAlpha(accent, 0.5), edge, false);
  } else if (["liquid", "organic", "sludge", "molten", "resin", "ink"].includes(surface)) {
    drawSkinDrops(ctx, bounds, seed, colorAlpha(primary, 0.42), accent, surface === "molten" || surface === "sludge" ? 8 : 6, surface === "molten");
  } else if (surface === "chrome" || surface === "glass" || surface === "crystal" || surface === "opal" || surface === "ice" || surface === "electric" || surface === "coolant") {
    drawSkinEdgeGlints(ctx, bounds, seed, colorAlpha(edge, 0.32), 0.85);
    drawSkinSpecks(ctx, bounds, seed + 77, colorAlpha(accent, 0.2), 4, 1.2);
  } else {
    drawSkinSpecks(ctx, bounds, seed, colorAlpha(secondary, 0.24), 10, 1.3);
  }
}

function applySpecialSkinFinish(ctx, part, state = {}) {
  const skin = specialSkinFor(part, state);
  const goldenEdition = isGoldenEditionSkin(skin);
  if (!skin || (!goldenEdition && isFunctionalDisplayPart(part))) return;
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
    applyGoldenFunctionalDisplayFinish(ctx, part, bounds, skin);
    return;
  }

  if (goldenEdition) {
    const key = String(part.key || "");
    const isPackPart = key.startsWith("pack.");
    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    const gold = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gold.addColorStop(0, `rgba(255,248,172,${isPackPart ? 0.68 : 0.52})`);
    gold.addColorStop(0.18, `rgba(255,214,83,${isPackPart ? 0.66 : 0.5})`);
    gold.addColorStop(0.48, `rgba(216,145,25,${isPackPart ? 0.68 : 0.54})`);
    gold.addColorStop(0.74, `rgba(71,42,10,${isPackPart ? 0.42 : 0.32})`);
    gold.addColorStop(1, `rgba(255,225,92,${isPackPart ? 0.62 : 0.46})`);
    ctx.fillStyle = gold;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    if (isPackPart) {
      ctx.fillStyle = "rgba(236,166,36,0.22)";
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }

    const shadow = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w * 0.3, bounds.y + bounds.h);
    shadow.addColorStop(0, "rgba(0,0,0,0)");
    shadow.addColorStop(0.66, "rgba(42,22,5,0.16)");
    shadow.addColorStop(1, "rgba(42,22,5,0.24)");
    ctx.fillStyle = shadow;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    drawSkinSpecialMarks(ctx, bounds, seed, skin, "royalgold");
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,236,135,0.18)";
    ctx.lineWidth = 1.1;
    roughLine(ctx, bounds.x + bounds.w * 0.12, bounds.y + bounds.h * 0.12, bounds.x + bounds.w * 0.72, bounds.y + bounds.h * 0.05, 0.18, 5, seed + 520);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const wash = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  wash.addColorStop(0, colorAlpha(isTransparent ? edge : primary, isTransparent ? 0.24 : 0.42));
  wash.addColorStop(0.42, colorAlpha(primary, isDark ? 0.68 : 0.36));
  wash.addColorStop(0.72, colorAlpha(secondary, isTransparent ? 0.28 : 0.42));
  wash.addColorStop(1, colorAlpha(accent, isTransparent ? 0.18 : 0.22));
  ctx.fillStyle = wash;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

  if (isTransparent) {
    const gleam = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
    gleam.addColorStop(0, colorAlpha("#ffffff", 0.2));
    gleam.addColorStop(0.35, "rgba(255,255,255,0)");
    gleam.addColorStop(0.7, colorAlpha(edge, 0.18));
    gleam.addColorStop(1, colorAlpha(accent, 0.12));
    ctx.fillStyle = gleam;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (skin.id === "holoGlass" || skin.id === "opalMachine" || skin.id === "pearlChrome") {
    const prism = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y);
    prism.addColorStop(0, "rgba(255,96,206,0.18)");
    prism.addColorStop(0.35, "rgba(84,245,255,0.16)");
    prism.addColorStop(0.68, "rgba(255,232,90,0.14)");
    prism.addColorStop(1, "rgba(142,112,255,0.14)");
    ctx.fillStyle = prism;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (!isSpecialRareShell) drawSkinSpecialMarks(ctx, bounds, seed, skin, surface);
  ctx.restore();

  if (!isSpecialRareShell && ["electric", "void", "cosmic", "sludge", "molten", "volcanic"].includes(surface)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(edge, 0.28);
    ctx.lineWidth = 1.1;
    ctx.shadowColor = skin.glow || colorAlpha(edge, 0.5);
    ctx.shadowBlur = 6;
    roughLine(ctx, bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.16, bounds.x + bounds.w * 0.52, bounds.y + bounds.h * 0.12, 0.28, 5, seed + 180);
    roughLine(ctx, bounds.x + bounds.w * 0.52, bounds.y + bounds.h * 0.88, bounds.x + bounds.w * 0.84, bounds.y + bounds.h * 0.82, 0.28, 5, seed + 190);
    ctx.restore();
  }
}

function drawCastShadow(ctx, drawPath, dx = 5, dy = 7, alpha = 0.07) {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  drawPath();
  ctx.fill();
  ctx.restore();
}

function drawGraphiteWash(ctx, bounds, alpha = 0.12) {
  const gradient = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  gradient.addColorStop(0, "rgba(255,255,255,0.28)");
  gradient.addColorStop(0.42, `rgba(18,22,25,${alpha * 0.24})`);
  gradient.addColorStop(0.74, `rgba(18,22,25,${alpha})`);
  gradient.addColorStop(1, `rgba(18,22,25,${alpha * 0.58})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
}

function drawHatching(ctx, bounds, angle = -0.72, spacing = 8, alpha = 0.08, lineWidth = 0.8) {
  const reach = Math.hypot(bounds.w, bounds.h) + Math.max(Math.abs(bounds.x), Math.abs(bounds.y)) * 2 + 40;
  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = `rgba(18,22,25,${alpha})`;
  ctx.lineWidth = lineWidth;
  for (let x = -reach; x <= reach; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, -reach);
    ctx.lineTo(x, reach);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGraphiteTexture(ctx, bounds, alpha = 0.08) {
  ctx.save();
  ctx.fillStyle = `rgba(18,22,25,${alpha})`;
  const count = Math.max(18, Math.floor((bounds.w * bounds.h) / 520));
  for (let i = 0; i < count; i++) {
    const x = bounds.x + ((i * 37) % Math.max(1, bounds.w));
    const y = bounds.y + ((i * 61) % Math.max(1, bounds.h));
    const r = 0.45 + (i % 3) * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function pencilShade(ctx, drawPath, bounds, options = {}) {
  const {
    wash = 0.12,
    hatch = 0.08,
    cross = 0.035,
    spacing = 8,
    texture = 0.07
  } = options;

  ctx.save();
  drawPath();
  ctx.clip();
  drawGraphiteWash(ctx, bounds, wash);
  drawHatching(ctx, bounds, -0.66, spacing, hatch);
  if (cross) drawHatching(ctx, bounds, 0.78, spacing * 1.55, cross, 0.65);
  drawGraphiteTexture(ctx, bounds, texture);
  ctx.restore();
}

function sketchStroke(ctx, drawPath, alpha = 0.3, width = 1.1) {
  ctx.save();
  ctx.strokeStyle = `rgba(18,22,25,${alpha})`;
  ctx.lineWidth = width;
  for (const offset of [[-0.8, 0.4], [0.55, -0.35]]) {
    ctx.save();
    ctx.translate(offset[0], offset[1]);
    drawPath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function pathGear(ctx, radius, teeth) {
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius + 8 : radius - 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function pathRoundRect(ctx, x, y, w, h, r) {
  roundedRect(ctx, x, y, w, h, r);
}

function drawPencilRect(ctx, x, y, w, h, radius = 0, options = {}) {
  const drawPath = () => {
    if (radius) pathRoundRect(ctx, x, y, w, h, radius);
    else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    }
  };

  drawCastShadow(ctx, drawPath, options.shadowX ?? 4, options.shadowY ?? 6, options.shadow ?? 0.055);
  drawPath();
  ctx.fillStyle = options.fill || "rgba(255,255,255,0.2)";
  ctx.fill();
  pencilShade(ctx, drawPath, { x, y, w, h }, {
    wash: options.wash ?? 0.1,
    hatch: options.hatch ?? 0.065,
    cross: options.cross ?? 0.025,
    spacing: options.spacing ?? 7,
    texture: options.texture ?? 0.055
  });
  ctx.strokeStyle = options.stroke || INK;
  ctx.lineWidth = options.lineWidth || 2;
  drawPath();
  ctx.stroke();
  sketchStroke(ctx, drawPath, options.sketch ?? 0.16, 0.7);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x + Math.min(14, w * 0.16), y + Math.min(10, h * 0.28));
  ctx.lineTo(x + w - Math.min(14, w * 0.16), y + Math.min(8, h * 0.24));
  ctx.stroke();
  ctx.restore();
}

function drawRivet(ctx, x, y, r = 3.4) {
  ctx.save();
  const gradient = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x, y, r);
  gradient.addColorStop(0, "rgba(255,255,255,0.75)");
  gradient.addColorStop(0.6, "rgba(18,22,25,0.08)");
  gradient.addColorStop(1, "rgba(18,22,25,0.28)");
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(18,22,25,0.62)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function jitter(seed, amount = 1) {
  return Math.sin(seed * 12.9898 + 78.233) * amount;
}

function roughLine(ctx, x1, y1, x2, y2, amount = 1.4, segments = 10, seed = 1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;

  ctx.beginPath();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const taper = Math.sin(t * Math.PI);
    const offset = jitter(seed + i * 1.7, amount) * taper;
    const x = x1 + dx * t + nx * offset;
    const y = y1 + dy * t + ny * offset;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function roughRect(ctx, x, y, w, h, amount = 1.25, seed = 1) {
  roughLine(ctx, x, y, x + w, y, amount, 12, seed);
  roughLine(ctx, x + w, y, x + w, y + h, amount, 8, seed + 31);
  roughLine(ctx, x + w, y + h, x, y + h, amount, 12, seed + 67);
  roughLine(ctx, x, y + h, x, y, amount, 8, seed + 101);
}

function roughCircle(ctx, cx, cy, r, amount = 1.25, seed = 1, scaleY = 1, start = 0, end = Math.PI * 2) {
  const total = Math.abs(end - start);
  const steps = Math.max(18, Math.ceil(total / (Math.PI * 2) * 86));
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = start + (end - start) * t;
    const radius = r + jitter(seed + i * 2.3, amount);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * scaleY;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function roughGearOutline(ctx, radius, teeth, amount = 1.2, seed = 1) {
  const steps = teeth * 2;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const base = i % 2 === 0 ? radius + 8 : radius - 2;
    const r = base + jitter(seed + i * 1.9, amount);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function roughBezier(ctx, points, amount = 1.1, seed = 1) {
  let previous = null;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const mt = 1 - t;
    const x =
      mt * mt * mt * points[0][0] +
      3 * mt * mt * t * points[1][0] +
      3 * mt * t * t * points[2][0] +
      t * t * t * points[3][0];
    const y =
      mt * mt * mt * points[0][1] +
      3 * mt * mt * t * points[1][1] +
      3 * mt * t * t * points[2][1] +
      t * t * t * points[3][1];
    const wobbleX = jitter(seed + i, amount) * Math.sin(t * Math.PI);
    const wobbleY = jitter(seed + i + 99, amount) * Math.sin(t * Math.PI);
    if (previous) roughLine(ctx, previous[0], previous[1], x + wobbleX, y + wobbleY, amount * 0.45, 2, seed + i * 11);
    previous = [x + wobbleX, y + wobbleY];
  }
}

function drawOuterPencilEdge(ctx, part) {
  const def = getPart(part.key);
  if (!def) return;
  if (part.key === "pack.icon" || part.key === "pack.shoulder.shell" || part.key === "pack.shoulder.band") return;
  if (SELF_OUTLINED_PARTS.has(part.key)) return;

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.38)";
  ctx.lineWidth = 0.95;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let pass = 0; pass < 3; pass++) {
    ctx.save();
    ctx.translate(jitter(pass + part.id, 0.55), jitter(pass + part.id + 40, 0.55));
    ctx.strokeStyle = pass === 0 ? "rgba(18,22,25,0.43)" : "rgba(18,22,25,0.16)";
    ctx.lineWidth = pass === 0 ? 0.9 : 0.56;
    const amount = pass === 0 ? 1.25 : 1.95;
    const seed = (part.id || 1) * 17 + pass * 131;

    if (part.key === "gear.bevel") {
      ctx.save();
      ctx.rotate(-0.34);
      roughCircle(ctx, 0, 0, 66, amount, seed, 0.58);
      roughCircle(ctx, 0, 0, 46, amount * 0.62, seed + 10, 0.58);
      roughCircle(ctx, 0, 0, 20, amount * 0.48, seed + 20, 0.52);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        roughLine(
          ctx,
          Math.cos(angle) * 25,
          Math.sin(angle) * 25 * 0.58,
          Math.cos(angle + 0.1) * 55,
          Math.sin(angle + 0.1) * 55 * 0.58,
          amount * 0.42,
          4,
          seed + i * 17
        );
      }
      ctx.restore();
      roughLine(ctx, -54, 23, 54, -16, amount * 0.35, 11, seed + 140);
    } else if (part.key === "pulley.wheel") {
      roughCircle(ctx, 0, 0, 46, amount, seed);
      roughCircle(ctx, 0, 0, 35, amount * 0.65, seed + 10);
      roughCircle(ctx, 0, 0, 14, amount * 0.45, seed + 20);
      roughRect(ctx, -18, -61, 36, 12, amount * 0.52, seed + 40);
      roughRect(ctx, -18, 49, 36, 12, amount * 0.52, seed + 60);
    } else if (part.key === "pulley.wheel.large") {
      roughCircle(ctx, 0, 0, 64, amount, seed);
      roughCircle(ctx, 0, 0, 54, amount * 0.68, seed + 10);
      roughCircle(ctx, 0, 0, 38, amount * 0.58, seed + 20);
      roughCircle(ctx, 0, 0, 16, amount * 0.45, seed + 30);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        roughLine(ctx, Math.cos(angle) * 22, Math.sin(angle) * 22, Math.cos(angle) * 55, Math.sin(angle) * 55, amount * 0.38, 4, seed + i * 13);
      }
    } else if (def.kind === "gear") {
      roughGearOutline(ctx, def.radius || 50, def.teeth || 22, amount, seed);
      roughCircle(ctx, 0, 0, (def.radius || 50) * 0.74, amount * 0.6, seed + 10);
      roughCircle(ctx, 0, 0, (def.radius || 50) * 0.18, amount * 0.45, seed + 20);
    } else if (part.key === "ring.bolted") {
      roughCircle(ctx, 0, 0, 58, amount, seed);
    } else if (def.kind === "wheel") {
      const r = def.radius || 64;
      roughCircle(ctx, 0, 0, r, amount, seed);
      roughCircle(ctx, 0, 0, r * 0.66, amount * 0.65, seed + 10);
      roughCircle(ctx, 0, 0, r * 0.19, amount * 0.45, seed + 20);
    } else if (part.key === "pipe.straight" || part.key === "valve.steam") {
      roughRect(ctx, -70, -18, 140, 36, amount, seed);
      roughRect(ctx, -82, -27, 28, 54, amount * 0.75, seed + 20);
      roughRect(ctx, 54, -27, 28, 54, amount * 0.75, seed + 40);
    } else if (part.key === "pipe.elbow") {
      drawElbowBodyPath(ctx);
      ctx.stroke();
      roughLine(ctx, -57, -94, -23, -94, amount * 0.55, 5, seed + 30);
      roughLine(ctx, -64, -87, -64, -55, amount * 0.55, 5, seed + 32);
      roughLine(ctx, -16, -87, -16, -55, amount * 0.55, 5, seed + 34);
      roughLine(ctx, 56, 16, 89, 16, amount * 0.55, 5, seed + 60);
      roughLine(ctx, 96, 23, 96, 57, amount * 0.55, 5, seed + 62);
      roughLine(ctx, 56, 64, 89, 64, amount * 0.55, 5, seed + 64);
    } else if (part.key === "pipe.curve" || part.key === "wire.arc") {
      roughBezier(ctx, [[-68, 34], [-30, -42], [32, -58], [74, 18]], amount, seed);
      roughBezier(ctx, [[-52, 38], [-22, -18], [24, -30], [58, 17]], amount * 0.75, seed + 30);
    } else if (part.key === "pipe.ghost") {
      roughBezier(ctx, [[-72, 16], [-38, -38], [30, -36], [72, 10]], amount, seed);
      roughBezier(ctx, [[-56, 16], [-30, -16], [22, -16], [56, 10]], amount * 0.72, seed + 30);
    } else if (part.key === "tank.round") {
      roughCircle(ctx, 0, 0, 66, amount, seed);
      roughCircle(ctx, 0, 0, 46, amount * 0.6, seed + 18);
      roughRect(ctx, -48, -92, 96, 22, amount * 0.72, seed + 30);
      roughRect(ctx, -48, 70, 96, 22, amount * 0.72, seed + 60);
    } else if (part.key === "tank.core") {
      roughCircle(ctx, 0, 0, 60, amount, seed);
      roughCircle(ctx, 0, 0, 36, amount * 0.62, seed + 18);
      roughRect(ctx, -92, -18, 184, 36, amount * 0.6, seed + 40);
    } else if (part.key === "tank.vials") {
      roughRect(ctx, -62, -98, 124, 196, amount, seed);
      roughRect(ctx, -48, -70, 32, 140, amount * 0.68, seed + 20);
      roughRect(ctx, 16, -70, 32, 140, amount * 0.68, seed + 40);
    } else if (part.key === "tank.head.square") {
      roughRect(ctx, -92, -112, 184, 224, amount, seed);
      roughRect(ctx, -76, -88, 152, 176, amount * 0.62, seed + 18);
      roughRect(ctx, -86, -124, 172, 26, amount * 0.58, seed + 30);
      roughRect(ctx, -86, 98, 172, 26, amount * 0.58, seed + 50);
    } else if (def.kind === "sealedTube") {
      drawSealedTubeOuterEdge(ctx, part.key, amount, seed);
    } else if (def.kind === "tank") {
      roughRect(ctx, -46, -108, 92, 216, amount, seed);
      roughRect(ctx, -58, -96, 116, 28, amount * 0.7, seed + 25);
      roughRect(ctx, -58, 68, 116, 28, amount * 0.7, seed + 50);
      roughCircle(ctx, 0, 0, 64, amount * 0.55, seed + 75, 1.88, -Math.PI * 0.42, Math.PI * 0.42);
    } else if (def.kind === "gauge") {
      roughCircle(ctx, 0, 0, 52, amount, seed);
      roughCircle(ctx, 0, 0, 42, amount * 0.58, seed + 14);
    } else if (part.key === "chain.segment") {
      for (let i = -3; i <= 3; i++) {
        const x = i * 26;
        roughCircle(ctx, x, i % 2 ? -1 : 1, i % 2 ? 20 : 26, amount * 0.45, seed + i * 13, i % 2 ? 0.5 : 0.46);
      }
      roughLine(ctx, -92, 0, 92, 0, amount * 0.32, 18, seed + 80);
    } else if (def.kind === "chain") {
      for (let i = -4; i <= 4; i++) roughCircle(ctx, i * 18, 0, 14, amount * 0.55, seed + i * 9, 0.58);
    } else if (def.kind === "coil") {
      roughRect(ctx, -30, -90, 60, 180, amount, seed);
      for (let y = -70; y <= 70; y += 18) {
        roughBezier(ctx, [[-42, y], [-10, y - 16], [10, y + 16], [42, y]], amount * 0.6, seed + y);
      }
    } else if (part.key === "spring.compact") {
      for (let x = -62; x <= 62; x += 14) roughCircle(ctx, x, 0, 12, amount * 0.5, seed + x, 1.55);
      roughLine(ctx, -86, 0, 86, 0, amount * 0.42, 18, seed + 18);
    } else if (part.key === "bracket.corner") {
      roughLine(ctx, -60, -44, 36, -44, amount, 10, seed);
      roughLine(ctx, 36, -44, 36, -20, amount, 4, seed + 2);
      roughLine(ctx, 36, -20, -32, -20, amount, 8, seed + 4);
      roughLine(ctx, -32, -20, -32, 48, amount, 8, seed + 6);
      roughLine(ctx, -32, 48, -60, 48, amount, 4, seed + 8);
      roughLine(ctx, -60, 48, -60, -44, amount, 10, seed + 10);
    } else if (part.key === "strip.rivet") {
      roughRect(ctx, -82, -14, 164, 28, amount * 0.65, seed);
    } else if (part.key === "hand.clock") {
      roughLine(ctx, -16, -5, 88, 0, amount * 0.55, 12, seed);
      roughLine(ctx, -16, 5, 88, 0, amount * 0.55, 12, seed + 7);
      roughCircle(ctx, -16, 0, 9, amount * 0.45, seed + 11);
    } else if (part.key === "tooth.shard") {
      roughLine(ctx, -32, 28, -10, -30, amount, 8, seed);
      roughLine(ctx, -10, -30, 14, -10, amount, 5, seed + 2);
      roughLine(ctx, 14, -10, 34, -34, amount, 5, seed + 4);
      roughLine(ctx, 34, -34, 28, 28, amount, 8, seed + 6);
      roughLine(ctx, 28, 28, -32, 28, amount, 8, seed + 8);
    } else if (part.key === "arc.lightning") {
      roughLine(ctx, -58, 12, -26, -24, amount * 0.65, 6, seed);
      roughLine(ctx, -26, -24, -6, -8, amount * 0.65, 5, seed + 2);
      roughLine(ctx, -6, -8, 22, -38, amount * 0.65, 6, seed + 4);
      roughLine(ctx, 22, -38, 10, -6, amount * 0.65, 5, seed + 6);
      roughLine(ctx, 10, -6, 54, -12, amount * 0.65, 7, seed + 8);
    } else if (part.key === "lens.aperture") {
      roughCircle(ctx, 0, 0, 48, amount, seed);
      roughCircle(ctx, 0, 0, 28, amount * 0.62, seed + 10);
    } else if (part.key === "rail.notched") {
      roughRect(ctx, -96, -18, 192, 36, amount * 0.7, seed);
    } else if (part.key === "rig.pulley") {
      roughCircle(ctx, -70, 24, 27, amount * 0.7, seed + 11);
      roughCircle(ctx, 56, -16, 43, amount * 0.7, seed + 22);
      roughBezier(ctx, [[-86, 0], [-42, -40], [8, -58], [72, -56]], amount * 0.58, seed + 33);
      roughBezier(ctx, [[-58, 48], [-10, 36], [36, 26], [92, 16]], amount * 0.58, seed + 44);
    } else if (part.key === "pulley.belt") {
      roughBezier(ctx, [[-86, 0], [-42, -40], [8, -58], [72, -56]], amount * 0.58, seed + 33);
      roughBezier(ctx, [[-58, 48], [-10, 36], [36, 26], [92, 16]], amount * 0.58, seed + 44);
    } else if (part.key === "clamp.u") {
      roughCircle(ctx, 0, -4, 46, amount, seed, 1, Math.PI, Math.PI * 2);
      roughLine(ctx, -46, -4, -46, 46, amount * 0.7, 7, seed + 20);
      roughLine(ctx, 46, -4, 46, 46, amount * 0.7, 7, seed + 40);
    } else if (part.key === "bracket.foot") {
      roughRect(ctx, -62, 14, 124, 36, amount * 0.72, seed);
      roughRect(ctx, -48, -58, 34, 92, amount * 0.72, seed + 20);
    } else if (part.key === "plate.riveted" || part.key === "vent.grille" || part.key === "mesh.panel") {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      roughRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, amount * 0.7, seed);
    } else if (part.key === "axle.rod") {
      roughRect(ctx, -88, -11, 176, 22, amount * 0.5, seed);
      roughRect(ctx, -97, -19, 30, 38, amount * 0.42, seed + 20);
      roughRect(ctx, 67, -19, 30, 38, amount * 0.42, seed + 40);
      roughCircle(ctx, -108, 0, 3, amount * 0.32, seed + 60);
      roughCircle(ctx, 108, 0, 3, amount * 0.32, seed + 80);
    } else if (part.key === "kit.fastener") {
      roughRect(ctx, -66, -38, 132, 76, amount * 0.45, seed);
    } else if (part.key?.startsWith("fastener.")) {
      if (part.key === "fastener.pin") roughRect(ctx, -34, -18, 68, 36, amount * 0.55, seed);
      else roughCircle(ctx, 0, 0, 20, amount * 0.5, seed);
    } else if (part.key === "samurai.kabuto") {
      roughBezier(ctx, [[-152, 26], [-96, -4], [-52, 8], [0, 16], [54, 6], [102, -4], [154, 28]], amount * 0.62, seed);
      roughBezier(ctx, [[-84, 28], [-74, -48], [-28, -78], [0, -80], [34, -78], [76, -48], [86, 28]], amount * 0.72, seed + 20);
      for (let i = 0; i < 4; i += 1) {
        const y = 34 + i * 15;
        const w = 94 + i * 26;
        roughBezier(ctx, [[-w, y - 8], [-44, y + 12], [0, y + 8], [48, y + 12], [w, y - 8]], amount * 0.5, seed + 40 + i);
      }
      roughBezier(ctx, [[-11, -67], [-48, -92], [-82, -86], [-104, -58]], amount * 0.48, seed + 80);
      roughBezier(ctx, [[11, -67], [48, -92], [82, -86], [104, -58]], amount * 0.48, seed + 90);
    } else if (part.key === "samurai.katana.peek") {
      roughBezier(ctx, [[-9, -118], [-28, -66], [-24, -16], [-8, 58]], amount * 0.58, seed);
      roughBezier(ctx, [[6, -118], [-8, -68], [-8, -16], [6, 58]], amount * 0.52, seed + 10);
      roughRect(ctx, -30, 58, 60, 16, amount * 0.45, seed + 20);
      roughRect(ctx, -12, 70, 24, 84, amount * 0.5, seed + 30);
    } else if (part.key === "pipe.sleeved") {
      roughRect(ctx, -104, -16, 208, 32, amount * 0.58, seed);
      for (const x of [-112, -48, 0, 48, 84]) roughRect(ctx, x, -24, x === 0 ? 36 : 28, 48, amount * 0.5, seed + x);
    } else if (part.key === "pipe.elbow.segment") {
      drawElbowBodyPath(ctx);
      ctx.stroke();
      roughLine(ctx, -57, -94, -23, -94, amount * 0.55, 5, seed + 30);
      roughLine(ctx, -64, -87, -64, -55, amount * 0.55, 5, seed + 32);
      roughLine(ctx, -16, -87, -16, -55, amount * 0.55, 5, seed + 34);
      roughLine(ctx, 56, 16, 89, 16, amount * 0.55, 5, seed + 60);
      roughLine(ctx, 96, 23, 96, 57, amount * 0.55, 5, seed + 62);
      roughLine(ctx, 56, 64, 89, 64, amount * 0.55, 5, seed + 64);
    } else if (part.key === "pipe.arc.coupled") {
      roughBezier(ctx, [[-84, 24], [-42, -48], [42, -48], [84, 24]], amount, seed);
      roughBezier(ctx, [[-66, 28], [-32, -20], [32, -20], [66, 28]], amount * 0.72, seed + 30);
    } else if (part.key === "tube.flex") {
      roughBezier(ctx, [[-86, 28], [-54, -46], [44, -48], [86, 14]], amount, seed);
      roughBezier(ctx, [[-68, 28], [-40, -18], [34, -20], [68, 14]], amount * 0.72, seed + 30);
    } else if (part.key === "hinge.leaf" || part.key === "joint.link" || part.key === "joint.ball") {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      roughRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, amount * 0.58, seed);
    } else if (def.kind === "liquid") {
      roughBezier(ctx, [[0, -26], [28, 8], [18, 38], [0, 38]], amount * 0.72, seed);
      roughBezier(ctx, [[0, 38], [-18, 38], [-28, 8], [0, -26]], amount * 0.72, seed + 33);
    } else {
      const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
      if (Math.max(bounds.w, bounds.h) < 70) roughCircle(ctx, 0, 0, Math.max(bounds.w, bounds.h) * 0.28, amount * 0.75, seed);
      else roughRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, amount, seed);
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawArrowHead(ctx, x, y, angle, size = 8) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.45);
  ctx.lineTo(-size * 0.7, size * 0.55);
  ctx.closePath();
  ctx.fillStyle = SOFT_INK;
  ctx.fill();
  ctx.restore();
}

function drawFlowLine(ctx, x1, y1, x2, y2, state = {}) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const pulse = (time * 0.72) % 1;
  const theme = liquidTheme(state);
  ctx.save();
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = 5.2;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 32;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(theme.base, 0.56);
  ctx.lineWidth = 1.35;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 32;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = theme.glow;
  ctx.beginPath();
  ctx.arc(x1 + (x2 - x1) * pulse, y1 + (y2 - y1) * pulse, 7.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colorAlpha(theme.accent, 0.88);
  ctx.beginPath();
  ctx.arc(x1 + (x2 - x1) * pulse, y1 + (y2 - y1) * pulse, 3.2, 0, Math.PI * 2);
  ctx.fill();
  const secondPulse = (pulse + 0.42) % 1;
  ctx.fillStyle = colorAlpha(theme.base, 0.62);
  ctx.beginPath();
  ctx.arc(x1 + (x2 - x1) * secondPulse, y1 + (y2 - y1) * secondPulse, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function elbowFlowPoint(t) {
  const topLen = 64;
  const arcRadius = 54;
  const arcLen = arcRadius * Math.PI / 2;
  const sideLen = 66;
  const total = topLen + arcLen + sideLen;
  const distance = ((t % 1) + 1) % 1 * total;

  if (distance < topLen) {
    const k = distance / topLen;
    return { x: -40, y: -78 + (-14 + 78) * k };
  }

  if (distance < topLen + arcLen) {
    const k = (distance - topLen) / arcLen;
    const angle = -Math.PI / 2 + k * Math.PI / 2;
    return {
      x: -40 + Math.cos(angle) * arcRadius,
      y: 40 + Math.sin(angle) * arcRadius
    };
  }

  const k = (distance - topLen - arcLen) / sideLen;
  return { x: 14 + (80 - 14) * k, y: 40 };
}

function drawElbowFlow(ctx, state = {}) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const theme = liquidTheme(state);
  const drawPath = () => {
    ctx.beginPath();
    ctx.moveTo(-40, -78);
    ctx.lineTo(-40, -14);
    ctx.arc(-40, 40, 54, -Math.PI / 2, 0);
    ctx.lineTo(80, 40);
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = 6.2;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 34;
  drawPath();
  ctx.stroke();

  ctx.strokeStyle = colorAlpha(theme.base, 0.58);
  ctx.lineWidth = 1.55;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 34;
  drawPath();
  ctx.stroke();
  ctx.setLineDash([]);

  for (const [offset, radius, color] of [
    [0, 3.4, colorAlpha(theme.accent, 0.9)],
    [0.42, 2.1, colorAlpha(theme.base, 0.65)]
  ]) {
    const point = elbowFlowPoint(time * 0.72 + offset);
    ctx.fillStyle = radius > 3 ? theme.glow : colorAlpha(theme.base, 0.45);
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawElbowSocket(ctx, x, y, w, h, orientation) {
  const socketPath = () => roundedRect(ctx, x, y, w, h, 5);

  drawCastShadow(ctx, socketPath, 3, 5, 0.04);
  socketPath();
  ctx.fillStyle = "rgba(251,250,245,0.82)";
  ctx.fill();
  pencilShade(ctx, socketPath, { x, y, w, h }, {
    wash: 0.12,
    hatch: 0.07,
    cross: 0.02,
    spacing: 5,
    texture: 0.045
  });

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.56)";
  ctx.lineWidth = 1.55;
  if (orientation === "vertical") {
    roughLine(ctx, x + 7, y + 1, x + w - 7, y + 1, 0.3, 5, 551);
    roughLine(ctx, x + 1, y + 7, x + 1, y + h - 11, 0.32, 5, 552);
    roughLine(ctx, x + w - 1, y + 7, x + w - 1, y + h - 11, 0.32, 5, 553);
    ctx.strokeStyle = "rgba(18,22,25,0.14)";
    roughLine(ctx, x + 8, y + h - 6, x + w - 8, y + h - 6, 0.24, 5, 554);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    roughLine(ctx, x + w * 0.5 - 7, y + 14, x + w * 0.5 - 7, y + h - 12, 0.18, 4, 555);
  } else {
    roughLine(ctx, x + 10, y + 1, x + w - 7, y + 1, 0.3, 5, 556);
    roughLine(ctx, x + w - 1, y + 7, x + w - 1, y + h - 7, 0.32, 5, 557);
    roughLine(ctx, x + 10, y + h - 1, x + w - 7, y + h - 1, 0.3, 5, 558);
    ctx.strokeStyle = "rgba(18,22,25,0.14)";
    roughLine(ctx, x + 6, y + 8, x + 6, y + h - 8, 0.24, 4, 559);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    roughLine(ctx, x + 10, y + h * 0.5 - 7, x + w - 14, y + h * 0.5 - 7, 0.18, 5, 560);
  }
  ctx.restore();
}

function drawStraightPipeSocket(ctx, x, y, w, h, side) {
  drawPencilRect(ctx, x, y, w, h, 5, {
    fill: "rgba(251,250,245,0.9)",
    wash: 0.13,
    hatch: 0.08,
    spacing: 5,
    shadow: 0.04
  });

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.48)";
  ctx.lineWidth = 1.35;
  const outerX = side === "west" ? x + 8 : x + w - 8;
  const innerX = side === "west" ? x + w - 8 : x + 8;

  ctx.beginPath();
  ctx.moveTo(outerX, y + 8);
  ctx.lineTo(outerX, y + h - 8);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath();
  ctx.moveTo(innerX, y + 10);
  ctx.lineTo(innerX, y + h - 10);
  ctx.stroke();

  ctx.strokeStyle = "rgba(18,22,25,0.22)";
  ctx.beginPath();
  ctx.moveTo(x + 7, y + 12);
  ctx.lineTo(x + w - 7, y + 12);
  ctx.moveTo(x + 7, y + h - 12);
  ctx.lineTo(x + w - 7, y + h - 12);
  ctx.stroke();
  ctx.restore();
}

function drawElbowSideSeal(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(251,250,245,0.72)";
  ctx.strokeStyle = "rgba(18,22,25,0.54)";
  ctx.lineWidth = 1.6;

  const topCollar = () => {
    ctx.beginPath();
    ctx.moveTo(-65, -80);
    ctx.bezierCurveTo(-76, -62, -74, -36, -60, -22);
    ctx.lineTo(-40, -36);
    ctx.bezierCurveTo(-49, -48, -50, -63, -43, -78);
    ctx.closePath();
  };

  const sideCollar = () => {
    ctx.beginPath();
    ctx.moveTo(24, 60);
    ctx.bezierCurveTo(42, 74, 70, 74, 88, 62);
    ctx.lineTo(74, 40);
    ctx.bezierCurveTo(61, 48, 44, 48, 31, 38);
    ctx.closePath();
  };

  for (const collar of [topCollar, sideCollar]) {
    drawCastShadow(ctx, collar, 2, 3, 0.035);
    collar();
    ctx.fill();
    pencilShade(ctx, collar, { x: -78, y: -84, w: 178, h: 160 }, { wash: 0.06, hatch: 0.032, cross: 0.012, spacing: 7, texture: 0.025 });
    collar();
    ctx.stroke();
    sketchStroke(ctx, collar, 0.12, 0.55);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-61, -72);
  ctx.bezierCurveTo(-68, -55, -66, -39, -57, -29);
  ctx.moveTo(36, 61);
  ctx.bezierCurveTo(51, 68, 68, 68, 80, 60);
  ctx.stroke();
  ctx.restore();
}

function drawElbowBodyPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-62, -80);
  ctx.lineTo(-62, -35);
  ctx.bezierCurveTo(-62, 8, -22, 62, 31, 63);
  ctx.lineTo(84, 63);
  ctx.lineTo(84, 17);
  ctx.lineTo(33, 17);
  ctx.bezierCurveTo(13, 18, -18, -17, -18, -80);
  ctx.closePath();
}

function drawElbowJoinCollars(ctx) {
  const paintCollar = (path, bounds) => {
    ctx.save();
    drawCastShadow(ctx, path, 2, 3, 0.032);
    path();
    ctx.fillStyle = "rgba(251,250,245,0.64)";
    ctx.fill();
    pencilShade(ctx, path, bounds, { wash: 0.048, hatch: 0.026, cross: 0.008, spacing: 7, texture: 0.018 });
    path();
    ctx.strokeStyle = "rgba(18,22,25,0.24)";
    ctx.lineWidth = 0.95;
    ctx.stroke();
    sketchStroke(ctx, path, 0.055, 0.4);
    ctx.restore();
  };

  const topJoin = () => {
    ctx.beginPath();
    ctx.moveTo(-64, -80);
    ctx.lineTo(-16, -80);
    ctx.lineTo(-16, -44);
    ctx.bezierCurveTo(-18, -29, -28, -18, -40, -18);
    ctx.bezierCurveTo(-53, -19, -64, -36, -64, -54);
    ctx.closePath();
  };

  const sideJoin = () => {
    ctx.beginPath();
    ctx.moveTo(14, 17);
    ctx.lineTo(86, 17);
    ctx.lineTo(86, 63);
    ctx.lineTo(32, 63);
    ctx.bezierCurveTo(22, 59, 15, 49, 14, 40);
    ctx.bezierCurveTo(13, 32, 13, 24, 14, 17);
    ctx.closePath();
  };

  paintCollar(topJoin, { x: -66, y: -82, w: 54, h: 66 });
  paintCollar(sideJoin, { x: 12, y: 15, w: 76, h: 50 });
}

function drawLiquidInnerArt(ctx, fillY, theme, state = {}, bounds = { x: -34, y: -64, w: 68, h: 128 }) {
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

  ctx.save();
  if (starLike) {
    for (let i = 0; i < 30; i++) {
      const x = left + ((i * 17) % width);
      const y = top + ((i * 29 + Math.sin(time + i) * 7) % height);
      const r = i % 5 === 0 ? 1.7 : 0.8;
      ctx.fillStyle = i % 4 === 0 ? colorAlpha(theme.accent, 0.88) : "rgba(255,255,255,0.56)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (earthLike || !starLike) {
    ctx.strokeStyle = colorAlpha(theme.accent, earthLike ? 0.56 : 0.34);
    ctx.lineWidth = earthLike ? 1.2 : 0.8;
    for (let i = 0; i < 7; i++) {
      const y = top + 8 + i * Math.max(6, height / 8) + Math.sin(time * 1.2 + i) * 2.4;
      ctx.beginPath();
      ctx.moveTo(left + (i % 3) * 4, y);
      ctx.bezierCurveTo(midX - width * 0.22, y - 9, midX + width * 0.22, y + 10, right, y - 3);
      ctx.stroke();
    }
  }

  if (molten) {
    ctx.strokeStyle = "rgba(255,238,142,0.64)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i += 1) {
      const x = left + width * (0.16 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, top + 6);
      ctx.lineTo(x + Math.sin(time + i) * 8, top + height * 0.44);
      ctx.lineTo(x - 10 + Math.cos(time * 0.8 + i) * 5, bottom - 4);
      ctx.stroke();
    }
  }

  if (metallic) {
    for (let i = 0; i < 6; i += 1) {
      const y = top + height * (0.14 + i * 0.13) + Math.sin(time * 1.4 + i) * 1.8;
      ctx.strokeStyle = i % 2 ? "rgba(255,255,255,0.58)" : colorAlpha(theme.accent, 0.46);
      ctx.lineWidth = i % 2 ? 1.1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(left + width * 0.12, y);
      ctx.lineTo(right - width * 0.08, y - 3);
      ctx.stroke();
    }
  }

  if (smoky) {
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const y = top + height * (0.18 + i * 0.14);
      ctx.beginPath();
      ctx.moveTo(left + 2, y);
      ctx.bezierCurveTo(midX - 18, y - 14 - Math.sin(time + i) * 4, midX + 16, y + 12, right - 2, y - 6);
      ctx.stroke();
    }
  }

  if (electric) {
    ctx.strokeStyle = colorAlpha(theme.accent, 0.72);
    ctx.lineWidth = 1.05;
    for (let i = 0; i < 4; i += 1) {
      const y = top + height * (0.2 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(left + 5, y);
      for (let step = 1; step <= 5; step += 1) {
        ctx.lineTo(left + (width / 5) * step, y + (step % 2 ? -7 : 6) + Math.sin(time * 3 + i) * 2);
      }
      ctx.stroke();
    }
  }

  ctx.strokeStyle = colorAlpha(theme.base, 0.28);
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 9; i++) {
    const y = top + i * Math.max(5, height / 10);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y + Math.sin(time + i) * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlassLiquid(ctx, glassPath, bounds, state = {}, wave = 4) {
  const theme = liquidTheme(state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const fill = Math.max(0, Math.min(100, state.fillLevel ?? 72));
  const fillY = bounds.y + bounds.h - (fill / 100) * bounds.h + Math.sin(time * 2.4) * wave;
  const liquidPath = () => {
    ctx.beginPath();
    ctx.moveTo(bounds.x, fillY);
    for (let x = bounds.x; x <= bounds.x + bounds.w + 2; x += 5) {
      ctx.lineTo(x, fillY + Math.sin((x * 0.1) + time * 4) * wave);
    }
    ctx.lineTo(bounds.x + bounds.w, bounds.y + bounds.h);
    ctx.lineTo(bounds.x, bounds.y + bounds.h);
    ctx.closePath();
  };

  ctx.save();
  glassPath();
  ctx.clip();
  ctx.fillStyle = theme.glow;
  liquidPath();
  ctx.fill();
  const liquid = ctx.createLinearGradient(bounds.x, fillY, bounds.x + bounds.w, bounds.y + bounds.h);
  liquid.addColorStop(0, colorAlpha(theme.accent, 0.38));
  liquid.addColorStop(0.48, colorAlpha(theme.base, 0.5));
  liquid.addColorStop(1, "rgba(18,22,25,0.2)");
  ctx.fillStyle = liquid;
  liquidPath();
  ctx.fill();
  ctx.save();
  liquidPath();
  ctx.clip();
  drawLiquidInnerArt(ctx, fillY, theme, state, bounds);
  ctx.restore();
  ctx.strokeStyle = colorAlpha(theme.accent, 0.58);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bounds.x + 4, fillY);
  for (let x = bounds.x + 4; x <= bounds.x + bounds.w - 4; x += 6) {
    ctx.lineTo(x, fillY + Math.sin((x * 0.1) + time * 4) * wave);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSealedTubeFlow(ctx, path, state = {}, width = 24, phase = 0) {
  const theme = liquidTheme(state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = state.previewMotion === false ? 0 : 28;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.translate(4, 6);
  ctx.strokeStyle = "rgba(0,0,0,0.055)";
  ctx.lineWidth = width + 7;
  path();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(18,22,25,0.3)";
  ctx.lineWidth = width + 3;
  path();
  ctx.stroke();
  ctx.strokeStyle = "rgba(251,250,245,0.58)";
  ctx.lineWidth = width;
  path();
  ctx.stroke();
  ctx.strokeStyle = "rgba(18,22,25,0.1)";
  ctx.lineWidth = width * 0.72;
  path();
  ctx.stroke();
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = Math.max(5, width * 0.34);
  ctx.setLineDash([11, 10]);
  ctx.lineDashOffset = -time * speed - phase;
  path();
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(theme.base, 0.62);
  ctx.lineWidth = Math.max(1.4, width * 0.11);
  ctx.setLineDash([11, 10]);
  ctx.lineDashOffset = -time * speed - phase;
  path();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 1.05;
  ctx.translate(-2, -4);
  path();
  ctx.stroke();
  ctx.restore();
}

function drawSealedTubeCap(ctx, x, y, rotation = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  drawPencilRect(ctx, -16, -8, 32, 16, 4, {
    fill: "rgba(251,250,245,0.78)",
    wash: 0.13,
    hatch: 0.065,
    cross: 0.018,
    spacing: 5,
    shadow: 0.026,
    lineWidth: 1.4
  });
  drawRivet(ctx, 0, 0, 2.4);
  ctx.restore();
}

function drawVialGlassDesign(ctx, variant) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (variant === "ornate") {
    ctx.strokeStyle = "rgba(18,22,25,0.5)";
    ctx.lineWidth = 1.35;
    roughLine(ctx, 0, -55, 0, 54, 0.32, 11, 2100);
    for (const y of [-38, -16, 8, 32]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(-18, y - 8, -19, y + 12, -3, y + 10);
      ctx.bezierCurveTo(15, y + 8, 16, y - 11, 0, y - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-11, y + 2, 4, 8, -0.62, 0, Math.PI * 2);
      ctx.ellipse(11, y - 2, 4, 8, 0.62, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(-12, 0);
    ctx.closePath();
    ctx.stroke();
    for (const y of [-52, 52]) drawRivet(ctx, 0, y, 1.8);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    roughLine(ctx, -16, -50, -16, 50, 0.24, 8, 2118);
  } else if (variant === "crystal") {
    ctx.strokeStyle = "rgba(18,22,25,0.52)";
    ctx.lineWidth = 1.25;
    const facets = [
      [[-18, -56], [5, -36], [-15, -14], [10, 2], [-12, 26], [16, 52]],
      [[18, -56], [-4, -34], [16, -12], [-10, 8], [14, 30], [-16, 52]],
      [[0, -62], [0, 58]],
      [[-22, -26], [22, -26]],
      [[-22, 18], [22, 18]]
    ];
    for (const points of facets) {
      ctx.beginPath();
      points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (const shape of [
      [[0, -56], [16, -28], [0, -26]],
      [[-15, -14], [10, 2], [0, 18]],
      [[14, 30], [-16, 52], [0, 54]]
    ]) {
      ctx.beginPath();
      shape.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.48)";
    ctx.lineWidth = 1;
    roughLine(ctx, 12, -50, 4, 45, 0.28, 8, 2255);
  } else {
    ctx.strokeStyle = "rgba(18,22,25,0.5)";
    ctx.lineWidth = 1.25;
    for (const y of [-48, -23, 2, 27, 52]) {
      roughLine(ctx, -23, y, 23, y, 0.28, 5, 2300 + y);
      drawRivet(ctx, -18, y, 1.55);
      drawRivet(ctx, 18, y, 1.55);
    }
    ctx.lineWidth = 1.4;
    for (const x of [-18, -9, 0, 9, 18]) {
      roughLine(ctx, x, -56, x, 56, 0.3, 10, 2360 + x);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 1;
    for (const x of [-13, 13]) roughLine(ctx, x, -52, x, 52, 0.22, 8, 2390 + x);
  }

  ctx.restore();
}

function drawSealedVial(ctx, part, state = {}, variant = "ornate") {
  setup(ctx, part, 1.9, 0.82);
  const glass = () => roundedRect(ctx, -28, -70, 56, 140, 24);
  drawCastShadow(ctx, glass, 4, 6, 0.055);
  glass();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  pencilShade(ctx, glass, { x: -30, y: -72, w: 60, h: 144 }, {
    wash: 0.045,
    hatch: 0.022,
    cross: 0.01,
    spacing: 8,
    texture: 0.022
  });
  drawGlassLiquid(ctx, glass, { x: -32, y: -70, w: 64, h: 140 }, {
    ...state,
    fillLevel: variant === "column" ? (state.fillLevel ?? 72) - 8 : state.fillLevel
  }, 3);

  ctx.save();
  glass();
  ctx.clip();
  drawVialGlassDesign(ctx, variant);
  ctx.restore();

  glass();
  ctx.stroke();
  sketchStroke(ctx, glass, 0.09, 0.55);

  for (const y of [-78, 78]) {
    drawPencilRect(ctx, -24, y - 10, 48, 20, 5, {
      fill: "rgba(251,250,245,0.78)",
      wash: 0.13,
      hatch: 0.07,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.5
    });
    drawRivet(ctx, -14, y, 2.2);
    drawRivet(ctx, 14, y, 2.2);
  }

  for (const y of [-93, 93]) {
    ctx.beginPath();
    ctx.arc(0, y, 9, 0, Math.PI * 2);
    ctx.stroke();
    drawRivet(ctx, 0, y, 2.5);
  }
}

function drawStraightSealedTube(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const glass = () => roundedRect(ctx, -19, -76, 38, 152, 15);
  drawCastShadow(ctx, glass, 3, 5, 0.052);
  pencilShade(ctx, glass, { x: -22, y: -78, w: 44, h: 156 }, { wash: 0.043, hatch: 0.022, cross: 0.01, spacing: 8, texture: 0.02 });
  drawGlassLiquid(ctx, glass, { x: -22, y: -72, w: 44, h: 144 }, state, 2.6);
  glass();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  roughLine(ctx, -8, -62, -8, 62, 0.26, 10, 2388);
  drawSealedTubeCap(ctx, 0, -85, 0, 0.9);
  drawSealedTubeCap(ctx, 0, 85, 0, 0.9);
}

function drawMiniFluidCell(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  if (part.liveGasMeter) {
    const gasLevel = gasLevelFor(state);
    state = {
      ...state,
      fillLevel: 28 + gasLevel * 68,
      texture: gasLevel > 0.68 ? "Boiling" : gasLevel > 0.36 ? "Bubbly" : "Still"
    };
  }
  const glass = () => roundedRect(ctx, -31, -38, 62, 76, 18);
  drawCastShadow(ctx, glass, 3, 5, 0.052);
  glass();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  pencilShade(ctx, glass, { x: -34, y: -40, w: 68, h: 80 }, {
    wash: 0.045,
    hatch: 0.022,
    cross: 0.01,
    spacing: 7,
    texture: 0.02
  });
  drawGlassLiquid(ctx, glass, { x: -36, y: -38, w: 72, h: 76 }, state, 2.8);
  glass();
  ctx.stroke();

  for (const y of [-48, 48]) {
    drawPencilRect(ctx, -28, y - 9, 56, 18, 5, {
      fill: "rgba(251,250,245,0.78)",
      wash: 0.13,
      hatch: 0.067,
      spacing: 5,
      shadow: 0.028,
      lineWidth: 1.45
    });
    for (const x of [-18, 0, 18]) drawRivet(ctx, x, y, 2.1);
  }

  for (const x of [-36, 36]) {
    ctx.beginPath();
    ctx.arc(x, 0, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    drawRivet(ctx, x, 0, 2);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  roughLine(ctx, -14, -28, -14, 28, 0.22, 6, 2366);
}

function drawBoltedFluidPort(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
  };
  const glass = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
  };

  drawCastShadow(ctx, outer, 4, 5, 0.055);
  outer();
  ctx.fillStyle = "rgba(251,250,245,0.42)";
  ctx.fill();
  pencilShade(ctx, outer, { x: -50, y: -50, w: 100, h: 100 }, {
    wash: 0.09,
    hatch: 0.045,
    cross: 0.015,
    spacing: 6,
    texture: 0.032
  });
  outer();
  ctx.stroke();
  roughCircle(ctx, 0, 0, 48, 0.7, 2414);
  roughCircle(ctx, 0, 0, 36, 0.45, 2415);

  glass();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  drawGlassLiquid(ctx, glass, { x: -42, y: -36, w: 84, h: 72 }, state, 2.8);
  glass();
  ctx.stroke();

  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * 45, Math.sin(angle) * 45, 2.7);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-7, -8, 22, Math.PI * 1.05, Math.PI * 1.6);
  ctx.stroke();
}

function drawRingFluidTube(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const ring = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
  };
  drawSealedTubeFlow(ctx, ring, state, 20, 4);
  roughCircle(ctx, 0, 0, 60, 0.65, 2401);
  roughCircle(ctx, 0, 0, 42, 0.45, 2402);
  for (const angle of [-Math.PI / 2, Math.PI / 2]) {
    ctx.save();
    ctx.translate(Math.cos(angle) * 60, Math.sin(angle) * 60);
    ctx.rotate(angle + Math.PI / 2);
    drawSealedTubeCap(ctx, 0, 0, 0, 0.75);
    ctx.restore();
  }
}

function drawOvalFluidLoop(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const loop = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 76, 0.18, 0, Math.PI * 2);
  };
  drawSealedTubeFlow(ctx, loop, state, 18, 12);
  roughCircle(ctx, 0, 0, 62, 0.65, 2441, 1.38);
  roughCircle(ctx, 0, 0, 42, 0.45, 2442, 1.5);
  drawSealedTubeCap(ctx, 44, -42, Math.PI * 0.45, 0.72);
  drawSealedTubeCap(ctx, -40, 48, Math.PI * 0.45, 0.72);
}

function drawUTubeSealed(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const u = () => {
    ctx.beginPath();
    ctx.moveTo(-44, 58);
    ctx.lineTo(-44, -18);
    ctx.bezierCurveTo(-44, -72, 44, -72, 44, -18);
    ctx.lineTo(44, 58);
  };
  drawSealedTubeFlow(ctx, u, state, 22, 20);
  roughLine(ctx, -44, 58, -44, -18, 0.55, 9, 2500);
  roughLine(ctx, 44, -18, 44, 58, 0.55, 9, 2501);
  roughCircle(ctx, 0, -18, 44, 0.6, 2502, 1, Math.PI, Math.PI * 2);
  drawSealedTubeCap(ctx, -44, 66, 0, 0.86);
  drawSealedTubeCap(ctx, 44, 66, 0, 0.86);
}

function drawCurvedSealedTube(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.82);
  const curve = () => {
    ctx.beginPath();
    ctx.moveTo(-46, 58);
    ctx.bezierCurveTo(-34, 8, -16, -40, 42, -64);
  };
  drawSealedTubeFlow(ctx, curve, state, 22, 28);
  roughBezier(ctx, [[-46, 58], [-34, 8], [-16, -40], [42, -64]], 0.7, 2550);
  drawSealedTubeCap(ctx, -48, 64, -0.22, 0.85);
  drawSealedTubeCap(ctx, 47, -68, -0.62, 0.85);
}

function drawSealedTubePart(ctx, part, state = {}) {
  if (part.key === "tube.vial.ornate") return drawSealedVial(ctx, part, state, "ornate");
  if (part.key === "tube.vial.crystal") return drawSealedVial(ctx, part, state, "crystal");
  if (part.key === "tube.vial.column") return drawSealedVial(ctx, part, state, "column");
  if (part.key === "tube.loop.ring") return drawRingFluidTube(ctx, part, state);
  if (part.key === "tube.loop.oval") return drawOvalFluidLoop(ctx, part, state);
  if (part.key === "tube.sealed.u") return drawUTubeSealed(ctx, part, state);
  if (part.key === "tube.sealed.curve") return drawCurvedSealedTube(ctx, part, state);
  if (part.key === "tube.cell.mini") return drawMiniFluidCell(ctx, part, state);
  if (part.key === "tube.port.bolted") return drawBoltedFluidPort(ctx, part, state);
  return drawStraightSealedTube(ctx, part, state);
}

function drawSealedTubeOuterEdge(ctx, key, amount, seed) {
  if (key === "tube.loop.ring") {
    roughCircle(ctx, 0, 0, 60, amount * 0.55, seed);
    roughCircle(ctx, 0, 0, 42, amount * 0.42, seed + 10);
  } else if (key === "tube.loop.oval") {
    roughCircle(ctx, 0, 0, 58, amount * 0.55, seed, 1.45);
    roughCircle(ctx, 0, 0, 40, amount * 0.42, seed + 10, 1.55);
  } else if (key === "tube.sealed.u") {
    roughLine(ctx, -44, 58, -44, -18, amount * 0.5, 9, seed);
    roughLine(ctx, 44, -18, 44, 58, amount * 0.5, 9, seed + 10);
    roughCircle(ctx, 0, -18, 44, amount * 0.5, seed + 20, 1, Math.PI, Math.PI * 2);
  } else if (key === "tube.sealed.curve") {
    roughBezier(ctx, [[-46, 58], [-34, 8], [-16, -40], [42, -64]], amount * 0.5, seed);
  } else if (key === "tube.cell.mini") {
    roughRect(ctx, -34, -56, 68, 112, amount * 0.42, seed);
    roughCircle(ctx, -36, 0, 6, amount * 0.32, seed + 8);
    roughCircle(ctx, 36, 0, 6, amount * 0.32, seed + 16);
  } else if (key === "tube.port.bolted") {
    roughCircle(ctx, 0, 0, 48, amount * 0.5, seed);
    roughCircle(ctx, 0, 0, 34, amount * 0.42, seed + 10);
  } else if (key === "tube.sealed.straight") {
    roughRect(ctx, -22, -88, 44, 176, amount * 0.42, seed);
  } else {
    roughRect(ctx, -30, -96, 60, 192, amount * 0.42, seed);
  }
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawConnectorMark(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.36)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGear(ctx, part, state, radius = 58, teeth = 24) {
  setup(ctx, part, 2.2, 0.86);
  const bounds = { x: -radius - 12, y: -radius - 12, w: radius * 2 + 24, h: radius * 2 + 24 };
  const outer = () => pathGear(ctx, radius, teeth);
  drawCastShadow(ctx, outer, 6, 8, 0.075);
  outer();
  ctx.fill();
  ctx.stroke();
  pencilShade(ctx, outer, bounds, { wash: 0.13, hatch: 0.09, cross: 0.038, spacing: 7, texture: 0.075 });
  sketchStroke(ctx, outer, 0.22, 0.8);

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.clip();
  const radial = ctx.createRadialGradient(-radius * 0.34, -radius * 0.42, radius * 0.08, 0, 0, radius * 0.78);
  radial.addColorStop(0, "rgba(255,255,255,0.62)");
  radial.addColorStop(0.48, "rgba(18,22,25,0.02)");
  radial.addColorStop(1, "rgba(18,22,25,0.18)");
  ctx.fillStyle = radial;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.strokeStyle = SOFT_INK;
  for (const ring of [radius * 0.74, radius * 0.52, radius * 0.32, radius * 0.18]) {
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!CLEAN_GEAR_SPOKES.has(part.key)) {
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * 0.28, Math.sin(angle) * radius * 0.28);
      ctx.lineTo(Math.cos(angle) * radius * 0.58, Math.sin(angle) * radius * 0.58);
      ctx.stroke();
    }
  }

  for (let i = 0; i < teeth; i += Math.max(1, Math.floor(teeth / 16))) {
    const angle = i / teeth * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * radius * 0.86, Math.sin(angle) * radius * 0.86, 2.5);
  }

}

function drawBevelGear(ctx, part, state = {}) {
  setup(ctx, part, 1.85, 0.78);
  const phase = state.previewMotion === false ? 0 : (state.time || 0) * Math.max(0.45, Math.abs(state.motionSpeed ?? 0.72));
  const tilt = -0.34;
  const body = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 66, 38, tilt, 0, Math.PI * 2);
  };
  const backLip = () => {
    ctx.beginPath();
    ctx.ellipse(9, 13, 58, 30, tilt, 0, Math.PI * 2);
  };

  drawCastShadow(ctx, backLip, 5, 7, 0.06);
  ctx.save();
  ctx.fillStyle = "rgba(18,22,25,0.065)";
  backLip();
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.22)";
  ctx.lineWidth = 1.15;
  backLip();
  ctx.stroke();
  ctx.restore();

  body();
  ctx.fill();
  ctx.stroke();
  pencilShade(ctx, body, { x: -72, y: -48, w: 144, h: 96 }, { wash: 0.12, hatch: 0.07, cross: 0.028, spacing: 7, texture: 0.06 });
  sketchStroke(ctx, body, 0.22, 0.75);

  ctx.save();
  ctx.rotate(tilt);
  ctx.scale(1, 0.58);
  ctx.strokeStyle = SOFT_INK;
  ctx.lineWidth = 1.2;
  for (const r of [58, 45, 28]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2 + phase * 0.18;
    const inner = i % 2 ? 50 : 46;
    roughLine(ctx, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle + 0.045) * 69, Math.sin(angle + 0.045) * 69, 0.36, 3, i * 19 + 60);
  }
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + phase * 0.18;
    roughLine(ctx, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle + 0.12) * 43, Math.sin(angle + 0.12) * 43, 0.45, 4, i * 31 + 90);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.strokeStyle = "rgba(18,22,25,0.52)";
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 12, tilt, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 5, tilt, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

}

function drawWheel(ctx, part, state = {}) {
  setup(ctx, part, 2.2, 0.84);
  const gasLevel = part.liveGasMeter ? gasLevelFor(state) : 0;
  const pressureColor = pressureColorFor(gasLevel);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 64, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 5, 7, 0.065);
  pencilShade(ctx, outer, { x: -68, y: -68, w: 136, h: 136 }, { wash: 0.1, hatch: 0.065, cross: 0.03 });
  ctx.beginPath();
  ctx.arc(0, 0, 64, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
    ctx.lineTo(Math.cos(angle) * 58, Math.sin(angle) * 58);
    ctx.stroke();
    drawRivet(ctx, Math.cos(angle) * 48, Math.sin(angle) * 48, 3);
  }
  if (part.liveGasMeter) {
    ctx.save();
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = colorAlpha(pressureColor, 0.58);
    ctx.beginPath();
    ctx.arc(0, 0, 74, -Math.PI * 0.72, -Math.PI * 0.72 + Math.PI * 1.44 * gasLevel);
    ctx.stroke();
    ctx.strokeStyle = colorAlpha(pressureColor, 0.24);
    ctx.lineWidth = 1.8;
    const spin = (state.time || 0) * (1.5 + gasLevel * 6);
    for (let i = 0; i < 4; i += 1) {
      const a = spin + i * Math.PI * 0.5;
      roughLine(ctx, Math.cos(a) * 78, Math.sin(a) * 78, Math.cos(a) * 90, Math.sin(a) * 90, 0.24, 3, 3300 + i);
    }
    ctx.restore();
  }
}

function drawStraightPipe(ctx, part, state) {
  setup(ctx, part, 2.3, 0.82);
  drawPencilRect(ctx, -70, -18, 140, 36, 13, { wash: 0.11, hatch: 0.075, cross: 0.03, spacing: 6 });
  ctx.strokeStyle = "rgba(255,255,255,0.44)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-60, -8);
  ctx.lineTo(60, -8);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(50, 0);
  ctx.stroke();
  drawFlowLine(ctx, -42, 0, 42, 0, state);
  drawStraightPipeSocket(ctx, -82, -27, 28, 54, "west");
  drawStraightPipeSocket(ctx, 54, -27, 28, 54, "east");
  drawConnectorMark(ctx, -82, 0);
  drawConnectorMark(ctx, 82, 0);
}

function drawElbowPipe(ctx, part, state) {
  setup(ctx, part, 2.3, 0.82);
  const bodyPath = () => drawElbowBodyPath(ctx);
  drawCastShadow(ctx, bodyPath, 5, 7, 0.06);
  bodyPath();
  ctx.fillStyle = "rgba(248,247,242,0.66)";
  ctx.fill();
  pencilShade(ctx, bodyPath, { x: -70, y: -88, w: 164, h: 158 }, {
    wash: 0.1,
    hatch: 0.055,
    cross: 0.018,
    spacing: 7,
    texture: 0.045
  });

  ctx.save();
  bodyPath();
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.34)";
  ctx.lineWidth = 1.05;
  roughLine(ctx, -51, -73, -51, -38, 0.26, 5, 964);
  ctx.beginPath();
  ctx.arc(-40, 40, 48, -Math.PI / 2, -0.08);
  ctx.stroke();
  ctx.strokeStyle = "rgba(18,22,25,0.12)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(-40, 40, 57, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.restore();

  bodyPath();
  ctx.strokeStyle = "rgba(18,22,25,0.5)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  sketchStroke(ctx, bodyPath, 0.12, 0.65);

  drawElbowJoinCollars(ctx);
  drawElbowSocket(ctx, -64, -94, 48, 48, "vertical");
  drawElbowSocket(ctx, 46, 16, 50, 48, "horizontal");
  drawElbowFlow(ctx, state);
  drawConnectorMark(ctx, -40, -94);
  drawConnectorMark(ctx, 96, 40);
}

function drawCurvePipe(ctx, part, state) {
  setup(ctx, part, 2.2, 0.78);
  ctx.save();
  ctx.translate(5, 7);
  ctx.strokeStyle = "rgba(0,0,0,0.065)";
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(-68, 34);
  ctx.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(18,22,25,0.08)";
  ctx.lineWidth = 31;
  ctx.beginPath();
  ctx.moveTo(-68, 34);
  ctx.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx.stroke();
  drawHatching(ctx, { x: -78, y: -60, w: 166, h: 120 }, -0.78, 9, 0.04, 0.65);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-68, 34);
  ctx.bezierCurveTo(-30, -42, 32, -58, 74, 18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-52, 38);
  ctx.bezierCurveTo(-22, -18, 24, -30, 58, 17);
  ctx.stroke();
  drawFlowLine(ctx, -56, 32, 58, 18, state);
}

function drawTank(ctx, part, state = {}) {
  const theme = liquidTheme(state);
  setup(ctx, part, 2.2, 0.84);
  drawPencilRect(ctx, -46, -108, 92, 216, 14, { wash: 0.1, hatch: 0.06, cross: 0.025, spacing: 7, shadow: 0.065 });
  drawPencilRect(ctx, -58, -96, 116, 28, 5, { wash: 0.14, hatch: 0.09, cross: 0.035, spacing: 5, shadow: 0.04 });
  drawPencilRect(ctx, -58, 68, 116, 28, 5, { wash: 0.14, hatch: 0.09, cross: 0.035, spacing: 5, shadow: 0.04 });
  const glass = () => roundedRect(ctx, -34, -64, 68, 128, 24);
  glass();
  ctx.stroke();
  pencilShade(ctx, glass, { x: -34, y: -64, w: 68, h: 128 }, { wash: 0.045, hatch: 0.025, cross: 0.012, spacing: 9, texture: 0.025 });

  ctx.save();
  glass();
  ctx.clip();
  const fill = Math.max(0, Math.min(100, state.fillLevel ?? 72));
  const fillY = 64 - (fill / 100) * 128 + Math.sin((state.time || 0) * 2.4) * 4;
  const liquidPath = () => {
    ctx.beginPath();
    ctx.moveTo(-34, fillY);
    for (let x = -34; x <= 36; x += 4) {
      ctx.lineTo(x, fillY + Math.sin((x * 0.1) + (state.time || 0) * 4) * 4);
    }
    ctx.lineTo(34, 64);
    ctx.lineTo(-34, 64);
    ctx.closePath();
  };
  ctx.fillStyle = theme.glow;
  liquidPath();
  ctx.fill();
  const liquid = ctx.createLinearGradient(-34, fillY, 34, 64);
  liquid.addColorStop(0, colorAlpha(theme.accent, 0.38));
  liquid.addColorStop(0.46, colorAlpha(theme.base, 0.48));
  liquid.addColorStop(1, "rgba(18,22,25,0.2)");
  ctx.fillStyle = liquid;
  liquidPath();
  ctx.fill();
  ctx.save();
  liquidPath();
  ctx.clip();
  drawLiquidInnerArt(ctx, fillY, theme, state, { x: -34, y: -64, w: 68, h: 128 });
  ctx.restore();
  ctx.strokeStyle = colorAlpha(theme.accent, 0.58);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-31, fillY);
  for (let x = -31; x <= 32; x += 5) {
    ctx.lineTo(x, fillY + Math.sin((x * 0.1) + (state.time || 0) * 4) * 4);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-18, -48);
  ctx.bezierCurveTo(-26, -8, -24, 28, -15, 54);
  ctx.stroke();
  ctx.restore();

  for (const y of [-74, 82]) {
    for (let x = -38; x <= 38; x += 19) {
      drawRivet(ctx, x, y, 3);
    }
  }
  drawConnectorMark(ctx, 0, -126);
  drawConnectorMark(ctx, 0, 126);
}

function drawRoundTank(ctx, part, state = {}) {
  setup(ctx, part, 2.1, 0.84);
  const glass = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, glass, 5, 7, 0.06);
  pencilShade(ctx, glass, { x: -66, y: -66, w: 132, h: 132 }, { wash: 0.055, hatch: 0.026, cross: 0.012, spacing: 9, texture: 0.03 });
  drawGlassLiquid(ctx, glass, { x: -72, y: -62, w: 144, h: 124 }, state, 3.6);
  glass();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();
  drawPencilRect(ctx, -48, -92, 96, 22, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx, -48, 70, 96, 22, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * 74, Math.sin(angle) * 74, 2.6);
  }
  drawConnectorMark(ctx, 0, -92);
  drawConnectorMark(ctx, 0, 92);
  drawConnectorMark(ctx, -92, 0);
  drawConnectorMark(ctx, 92, 0);
}

function drawCoreTank(ctx, part, state = {}) {
  setup(ctx, part, 2.1, 0.84);
  const glass = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 64, 50, 0, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, glass, 5, 7, 0.06);
  pencilShade(ctx, glass, { x: -66, y: -52, w: 132, h: 104 }, { wash: 0.06, hatch: 0.03, cross: 0.014, spacing: 8, texture: 0.032 });
  drawGlassLiquid(ctx, glass, { x: -58, y: -44, w: 116, h: 88 }, state, 3.2);
  glass();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 28, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawPencilRect(ctx, -96, -18, 32, 36, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx, 64, -18, 32, 36, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  for (const angle of [-0.65, 0, 0.65]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 68, 18, angle, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawConnectorMark(ctx, -96, 0);
  drawConnectorMark(ctx, 96, 0);
  drawConnectorMark(ctx, 0, -76);
  drawConnectorMark(ctx, 0, 76);
}

function drawTwinVials(ctx, part, state = {}) {
  setup(ctx, part, 2.1, 0.84);
  drawPencilRect(ctx, -62, -98, 124, 28, 5, { wash: 0.13, hatch: 0.08, spacing: 5, shadow: 0.045 });
  drawPencilRect(ctx, -62, 70, 124, 28, 5, { wash: 0.13, hatch: 0.08, spacing: 5, shadow: 0.045 });

  for (const x of [-32, 32]) {
    const glass = () => roundedRect(ctx, x - 19, -70, 38, 140, 16);
    drawCastShadow(ctx, glass, 3, 5, 0.045);
    glass();
    ctx.stroke();
    pencilShade(ctx, glass, { x: x - 19, y: -70, w: 38, h: 140 }, { wash: 0.045, hatch: 0.022, cross: 0.01, spacing: 8, texture: 0.022 });
    drawGlassLiquid(ctx, glass, { x: x - 17, y: -64, w: 34, h: 128 }, { ...state, fillLevel: (state.fillLevel ?? 72) - (x < 0 ? 6 : -5) }, 3);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 8, -55);
    ctx.lineTo(x - 8, 54);
    ctx.stroke();
    ctx.strokeStyle = INK;
  }

  for (const x of [-42, -18, 18, 42]) {
    drawRivet(ctx, x, -84, 2.8);
    drawRivet(ctx, x, 84, 2.8);
  }
  drawConnectorMark(ctx, 0, -112);
  drawConnectorMark(ctx, 0, 112);
}

function drawSquareHeadTank(ctx, part, state = {}) {
  setup(ctx, part, 2.2, 0.84);
  const body = () => roundedRect(ctx, -92, -112, 184, 224, 18);
  const glass = () => roundedRect(ctx, -76, -88, 152, 176, 18);

  drawCastShadow(ctx, body, 6, 8, 0.065);
  body();
  ctx.fillStyle = "rgba(241,249,246,0.28)";
  ctx.fill();
  pencilShade(ctx, body, { x: -92, y: -112, w: 184, h: 224 }, {
    wash: 0.055,
    hatch: 0.026,
    cross: 0.01,
    spacing: 9,
    texture: 0.03
  });
  body();
  ctx.strokeStyle = "rgba(18,22,25,0.56)";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  drawPencilRect(ctx, -86, -124, 172, 26, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx, -86, 98, 172, 26, 5, { wash: 0.12, hatch: 0.07, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx, -102, -74, 26, 148, 5, { wash: 0.1, hatch: 0.052, spacing: 6, shadow: 0.032 });
  drawPencilRect(ctx, 76, -74, 26, 148, 5, { wash: 0.1, hatch: 0.052, spacing: 6, shadow: 0.032 });

  glass();
  ctx.strokeStyle = "rgba(18,22,25,0.46)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  pencilShade(ctx, glass, { x: -76, y: -88, w: 152, h: 176 }, {
    wash: 0.03,
    hatch: 0.016,
    cross: 0.006,
    spacing: 10,
    texture: 0.014
  });
  drawGlassLiquid(ctx, glass, { x: -72, y: -82, w: 144, h: 164 }, { ...state, fillLevel: state.fillLevel ?? 88 }, 3.4);

  ctx.save();
  glass();
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = 1.1;
  roughLine(ctx, -54, -72, -58, 72, 0.26, 12, 3250);
  roughLine(ctx, 32, -78, 54, 68, 0.22, 12, 3251);
  drawHatching(ctx, { x: -72, y: -82, w: 144, h: 164 }, -0.7, 13, 0.035, 0.65);
  ctx.restore();

  for (const x of [-58, -26, 26, 58]) {
    drawRivet(ctx, x, -110, 3.1);
    drawRivet(ctx, x, 110, 3.1);
  }
  for (const y of [-62, -22, 22, 62]) {
    drawRivet(ctx, -89, y, 2.6);
    drawRivet(ctx, 89, y, 2.6);
  }
  drawConnectorMark(ctx, 0, -124);
  drawConnectorMark(ctx, 0, 124);
  drawConnectorMark(ctx, -102, 0);
  drawConnectorMark(ctx, 102, 0);
}

function drawGauge(ctx, part, state) {
  setup(ctx, part, 2.1, 0.83);
  const liveGasMeter = part.liveGasMeter === true || part.role === "backAccessory" || part.traitLayer === "backAccessory";
  const gasLevel = liveGasMeter ? gasLevelFor(state) : 0.18;
  const pressureColor = pressureColorFor(gasLevel);
  const beat = gasHeartbeatFor(state, gasLevel, 0.04);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 4, 6, 0.065);
  pencilShade(ctx, outer, { x: -56, y: -56, w: 112, h: 112 }, { wash: 0.1, hatch: 0.055, cross: 0.02, spacing: 7 });
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 47, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,241,226,0.55)";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.stroke();

  const start = Math.PI * 1.12;
  const end = Math.PI * 1.88;
  ctx.save();
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  const segments = [
    [start, start + (end - start) * 0.36, "#46c7d1", 0.48],
    [start + (end - start) * 0.38, start + (end - start) * 0.68, "#d8a33a", 0.48],
    [start + (end - start) * 0.7, end, "#d7372f", 0.54]
  ];
  for (const [a, b, color, alpha] of segments) {
    ctx.strokeStyle = colorAlpha(color, alpha);
    ctx.beginPath();
    ctx.arc(0, 4, 34, a, b);
    ctx.stroke();
  }
  if (liveGasMeter) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(pressureColor, 0.18 + beat * 0.32 + gasLevel * 0.14);
    ctx.lineWidth = 8 + beat * 5;
    ctx.beginPath();
    ctx.arc(0, 4, 28, start, start + (end - start) * gasLevel);
    ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 9; i += 1) {
    const angle = start + (end - start) * (i / 8);
    const longTick = i === 0 || i === 4 || i === 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * (longTick ? 29 : 33), 4 + Math.sin(angle) * (longTick ? 29 : 33));
    ctx.lineTo(Math.cos(angle) * 42, 4 + Math.sin(angle) * 42);
    ctx.stroke();
  }

  ctx.save();
  ctx.font = "bold 8px ui-monospace, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(12,16,17,0.76)";
  ctx.fillText("LOW", -29, 30);
  ctx.fillText("MID", 0, -25);
  ctx.fillStyle = "rgba(180,20,16,0.82)";
  ctx.fillText("HIGH", 30, 30);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-7, -8, 26, Math.PI * 1.1, Math.PI * 1.65);
  ctx.stroke();
  ctx.restore();

  const wobble = Math.sin((state.time || 0) * (1.2 + gasLevel * 3.2)) * (0.012 + gasLevel * 0.045);
  const needle = start + (end - start) * gasLevel + wobble;
  ctx.save();
  ctx.shadowColor = colorAlpha(pressureColor, 0.16 + beat * 0.34);
  ctx.shadowBlur = 5 + beat * 10;
  ctx.strokeStyle = colorAlpha(pressureColor, 0.88);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(Math.cos(needle + Math.PI) * 8, 4 + Math.sin(needle + Math.PI) * 8);
  ctx.lineTo(Math.cos(needle) * 34, 4 + Math.sin(needle) * 34);
  ctx.stroke();
  ctx.fillStyle = "rgba(12,16,17,0.86)";
  ctx.beginPath();
  ctx.arc(0, 4, 5.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (liveGasMeter) {
    drawGasStatePill(ctx, gasLevel, state, 0, 58, 0.62, { w: 76, h: 24, fontSize: 10 });
  }
  drawConnectorMark(ctx, 0, 56);
}

function drawShoulderPackBand(ctx, part) {
  const style = setup(ctx, part, 2.1, 0.78);
  const band = () => {
    ctx.beginPath();
    ctx.moveTo(-54, -164);
    ctx.bezierCurveTo(-84, -90, -84, 72, -56, 246);
    ctx.bezierCurveTo(-42, 274, -10, 278, 8, 252);
    ctx.bezierCurveTo(-22, 84, -20, -78, 10, -150);
    ctx.bezierCurveTo(-10, -172, -38, -178, -54, -164);
    ctx.closePath();
  };
  drawCastShadow(ctx, band, 5, 7, 0.045);
  band();
  ctx.fillStyle = colorAlpha(style.fill || "#efe4cf", 0.48);
  ctx.fill();
  pencilShade(ctx, band, { x: -92, y: -180, w: 120, h: 466 }, {
    wash: 0.09,
    hatch: 0.045,
    cross: 0.014,
    spacing: 8,
    texture: 0.02
  });
  ctx.lineWidth = 2.2;
  band();
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = colorAlpha(style.highlight || "#d7a13a", 0.24);
  ctx.lineWidth = 1.8;
  roughBezier(ctx, [[-42, -144], [-60, -34], [-58, 112], [-34, 236]], 0.32, 1612);
  ctx.restore();
  for (const [x, y] of [[-44, -126], [-48, -28], [-42, 88], [-30, 202], [-16, 254]]) {
    drawRivet(ctx, x, y, 2.5);
  }
}

function drawPackStatusWindow(ctx, level, state = {}) {
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(state, level, 0.18);
  const fillW = 46 * Math.max(0.1, Math.min(1, level));

  ctx.save();
  ctx.translate(10, -106);
  ctx.beginPath();
  ctx.roundRect(-42, -14, 84, 28, 7);
  ctx.fillStyle = palette.panel;
  ctx.fill();
  ctx.strokeStyle = palette.panelStroke || "rgba(245,241,225,0.64)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-32, -7, 46, 9, 4);
  ctx.fillStyle = palette.track;
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.38)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-32, -7, fillW, 9, 4);
  ctx.shadowColor = palette.glow || colorAlpha(color, 0.26);
  ctx.shadowBlur = 5 + beat * 8;
  ctx.fillStyle = colorAlpha(color, label === "EXT" ? 0.96 : 0.82);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha(color, 0.34 + beat * 0.34);
  ctx.lineWidth = 1.2 + beat * 0.8;
  ctx.beginPath();
  ctx.roundRect(-34, -9, 51, 13, 5);
  ctx.stroke();
  ctx.fillStyle = colorAlpha(color, 0.08 + beat * 0.1);
  ctx.fillRect(-39, -13, 78, 25);
  ctx.restore();

  ctx.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.95));
  ctx.font = "bold 9px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 25, -2);
  ctx.restore();
}

function drawPackShellReader(ctx, level, style = {}, state = {}) {
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(state, level, 0.28);
  const fillW = 46 * Math.max(0.08, Math.min(1, level));

  ctx.save();
  ctx.translate(-2, 22);
  drawPencilRect(ctx, -42, -13, 84, 26, 8, {
    fill: palette.panel,
    wash: 0.06,
    hatch: 0.03,
    cross: 0.01,
    spacing: 6,
    shadow: 0.028,
    lineWidth: 1.35
  });
  ctx.beginPath();
  ctx.roundRect(-30, -6, 46, 8, 4);
  ctx.fillStyle = palette.track;
  ctx.fill();
  ctx.strokeStyle = "rgba(10,14,15,0.48)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-30, -6, fillW, 8, 4);
  ctx.shadowColor = palette.glow || colorAlpha(color, 0.24 + beat * 0.38 + level * 0.1);
  ctx.shadowBlur = 7 + beat * 13;
  ctx.fillStyle = colorAlpha(color, Math.min(1, (label === "EXT" ? 0.98 : 0.88) + beat * 0.2));
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha(color, 0.42 + beat * 0.32);
  ctx.lineWidth = 1.3 + beat;
  ctx.beginPath();
  ctx.roundRect(-32, -8, 51, 12, 5);
  ctx.stroke();
  ctx.fillStyle = colorAlpha(color, 0.09 + beat * 0.12);
  ctx.fillRect(-39, -11, 78, 22);
  ctx.restore();
  ctx.shadowColor = colorAlpha(style.highlight || "#d7a13a", 0.18 + beat * 0.22);
  ctx.shadowBlur = 3 + beat * 7;
  ctx.fillStyle = colorAlpha(style.highlight || "#d7a13a", 0.78 + beat * 0.16);
  ctx.beginPath();
  ctx.arc(30, -2, 4.4 + beat * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(8,11,12,0.62)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.96));
  ctx.font = "bold 8px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 5, 7);
  ctx.restore();
}

function drawPackGasReaderPart(ctx, part, state = {}) {
  const style = setup(ctx, part, 1.35, 0.86);
  const level = gasLevelFor(state);
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(state, level, 0.22);
  const fillW = 56 * Math.max(0.08, Math.min(1, level));

  ctx.save();
  ctx.rotate(-0.015);
  drawPencilRect(ctx, -54, -18, 108, 36, 9, {
    fill: palette.panel,
    wash: 0.045,
    hatch: 0.018,
    cross: 0.006,
    spacing: 5,
    shadow: 0.035,
    lineWidth: 1.25
  });

  ctx.fillStyle = palette.golden ? colorAlpha("#ffe47a", 0.92) : colorAlpha(style.highlight || "#d7a13a", 0.88);
  ctx.font = "bold 7px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("GAS", -43, -8);

  ctx.beginPath();
  ctx.roundRect(-42, -1, 56, 9, 4);
  ctx.fillStyle = palette.track;
  ctx.fill();
  ctx.strokeStyle = "rgba(8,11,12,0.52)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-42, -1, fillW, 9, 4);
  ctx.shadowColor = palette.glow || colorAlpha(color, 0.26 + beat * 0.42 + level * 0.12);
  ctx.shadowBlur = 8 + beat * 15;
  ctx.fillStyle = colorAlpha(color, Math.min(1, (label === "EXT" ? 0.98 : 0.9) + beat * 0.22));
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha(color, 0.48 + beat * 0.34);
  ctx.lineWidth = 1.5 + beat * 1.2;
  ctx.beginPath();
  ctx.roundRect(-45, -4, 63, 15, 6);
  ctx.stroke();
  ctx.fillStyle = colorAlpha(color, 0.13 + level * 0.1 + beat * 0.18);
  ctx.fillRect(-48, -12, 96, 24);
  ctx.restore();

  ctx.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.96));
  ctx.font = "bold 9px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, 33, 4);

  ctx.shadowColor = colorAlpha(style.highlight || "#d7a13a", 0.18 + beat * 0.22);
  ctx.shadowBlur = 3 + beat * 8;
  ctx.fillStyle = colorAlpha(style.highlight || "#d7a13a", 0.78 + beat * 0.18);
  ctx.beginPath();
  ctx.arc(43, -8, 4.2 + beat * 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(8,11,12,0.62)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function drawShoulderPackShell(ctx, part, state = {}) {
  const style = setup(ctx, part, 2.2, 0.82);
  const shape = part.packShape || "classic";
  const liveGasMeter = part.liveGasMeter === true || part.role === "backAccessory" || part.traitLayer === "backAccessory";
  const gasLevel = liveGasMeter ? gasLevelFor(state) : 0;
  const gasColor = gasDisplayPaletteFor(gasLevel, state).color;
  const beat = gasHeartbeatFor(state, gasLevel, 0.44);
  ctx.save();
  if (part.peek) {
    const bottom = Number.isFinite(part.peekClipBottom) ? part.peekClipBottom : 54;
    ctx.beginPath();
    ctx.rect(-104, -156, 208, bottom + 156);
    ctx.clip();
  }
  const shell = () => {
    ctx.beginPath();
    if (shape === "skate") {
      ctx.moveTo(-52, -112);
      ctx.bezierCurveTo(-84, -88, -86, 70, -48, 122);
      ctx.bezierCurveTo(-16, 142, 52, 124, 62, 80);
      ctx.bezierCurveTo(34, 62, 32, -50, 62, -92);
      ctx.bezierCurveTo(26, -132, -24, -138, -52, -112);
    } else if (shape === "cassette") {
      ctx.moveTo(-62, -118);
      ctx.lineTo(42, -128);
      ctx.quadraticCurveTo(66, -116, 64, -90);
      ctx.lineTo(58, 102);
      ctx.quadraticCurveTo(34, 132, -28, 122);
      ctx.quadraticCurveTo(-70, 92, -72, 24);
      ctx.lineTo(-70, -92);
      ctx.quadraticCurveTo(-70, -108, -62, -118);
    } else if (shape === "printer") {
      ctx.moveTo(-54, -126);
      ctx.lineTo(50, -116);
      ctx.quadraticCurveTo(72, -98, 62, -66);
      ctx.lineTo(62, 70);
      ctx.quadraticCurveTo(44, 108, 8, 126);
      ctx.lineTo(-44, 118);
      ctx.quadraticCurveTo(-76, 86, -70, 20);
      ctx.lineTo(-70, -94);
      ctx.quadraticCurveTo(-68, -116, -54, -126);
    } else if (shape === "arcade") {
      ctx.moveTo(-60, -128);
      ctx.lineTo(28, -128);
      ctx.quadraticCurveTo(60, -116, 66, -82);
      ctx.lineTo(54, 114);
      ctx.quadraticCurveTo(18, 140, -38, 116);
      ctx.lineTo(-74, 28);
      ctx.lineTo(-68, -96);
      ctx.quadraticCurveTo(-68, -116, -60, -128);
    } else if (shape === "battery") {
      ctx.moveTo(-44, -138);
      ctx.lineTo(44, -130);
      ctx.quadraticCurveTo(64, -102, 58, -66);
      ctx.lineTo(58, 94);
      ctx.quadraticCurveTo(38, 134, -8, 138);
      ctx.quadraticCurveTo(-54, 130, -68, 88);
      ctx.lineTo(-68, -86);
      ctx.quadraticCurveTo(-66, -122, -44, -138);
    } else if (shape === "tank") {
      ctx.moveTo(-38, -136);
      ctx.bezierCurveTo(-76, -118, -82, -58, -70, 16);
      ctx.bezierCurveTo(-64, 86, -36, 134, 6, 136);
      ctx.bezierCurveTo(52, 128, 68, 78, 62, 12);
      ctx.bezierCurveTo(54, -66, 42, -124, -2, -140);
      ctx.bezierCurveTo(-14, -144, -28, -142, -38, -136);
    } else if (shape === "canister") {
      ctx.moveTo(-30, -138);
      ctx.bezierCurveTo(-70, -120, -74, -68, -62, 12);
      ctx.lineTo(-52, 96);
      ctx.quadraticCurveTo(-26, 140, 24, 132);
      ctx.quadraticCurveTo(62, 96, 58, 20);
      ctx.lineTo(46, -94);
      ctx.quadraticCurveTo(28, -140, -30, -138);
    } else if (shape === "spine") {
      ctx.moveTo(-28, -142);
      ctx.bezierCurveTo(-66, -112, -72, -34, -58, 44);
      ctx.bezierCurveTo(-50, 102, -18, 136, 24, 126);
      ctx.bezierCurveTo(56, 90, 60, 18, 46, -58);
      ctx.bezierCurveTo(38, -116, 14, -144, -28, -142);
    } else if (shape === "fan" || shape === "gauge") {
      ctx.moveTo(-48, -128);
      ctx.bezierCurveTo(-88, -94, -84, 54, -48, 112);
      ctx.bezierCurveTo(-16, 140, 52, 118, 64, 72);
      ctx.bezierCurveTo(72, 12, 58, -74, 30, -118);
      ctx.bezierCurveTo(4, -136, -26, -142, -48, -128);
    } else if (shape === "engine") {
      ctx.moveTo(-52, -120);
      ctx.bezierCurveTo(-86, -96, -82, 38, -54, 104);
      ctx.lineTo(18, 134);
      ctx.quadraticCurveTo(58, 112, 68, 62);
      ctx.lineTo(52, -84);
      ctx.quadraticCurveTo(18, -136, -52, -120);
    } else if (shape === "furnace") {
      ctx.moveTo(-44, -130);
      ctx.bezierCurveTo(-86, -94, -82, 54, -48, 112);
      ctx.quadraticCurveTo(-4, 142, 46, 108);
      ctx.quadraticCurveTo(74, 48, 54, -80);
      ctx.quadraticCurveTo(20, -142, -44, -130);
    } else if (shape === "fire") {
      ctx.moveTo(-28, -142);
      ctx.bezierCurveTo(-68, -128, -76, -64, -62, 30);
      ctx.lineTo(-50, 112);
      ctx.quadraticCurveTo(-14, 142, 34, 118);
      ctx.quadraticCurveTo(60, 58, 50, -70);
      ctx.quadraticCurveTo(26, -136, -28, -142);
    } else if (shape === "diving") {
      ctx.moveTo(-46, -136);
      ctx.bezierCurveTo(-86, -118, -86, -42, -66, 80);
      ctx.quadraticCurveTo(-42, 132, 12, 136);
      ctx.quadraticCurveTo(62, 114, 60, 52);
      ctx.bezierCurveTo(54, -28, 38, -124, -8, -140);
      ctx.quadraticCurveTo(-26, -146, -46, -136);
    } else if (shape === "ledger") {
      ctx.moveTo(-62, -104);
      ctx.lineTo(34, -126);
      ctx.quadraticCurveTo(68, -114, 70, -76);
      ctx.lineTo(54, 96);
      ctx.quadraticCurveTo(20, 130, -34, 116);
      ctx.lineTo(-72, 42);
      ctx.lineTo(-70, -78);
      ctx.quadraticCurveTo(-70, -96, -62, -104);
    } else if (shape === "mailbox") {
      ctx.moveTo(-64, -44);
      ctx.bezierCurveTo(-56, -126, 44, -136, 66, -52);
      ctx.lineTo(62, 90);
      ctx.quadraticCurveTo(26, 128, -38, 114);
      ctx.quadraticCurveTo(-70, 78, -72, 18);
      ctx.closePath();
    } else if (shape === "floppy") {
      ctx.moveTo(-66, -122);
      ctx.lineTo(56, -120);
      ctx.quadraticCurveTo(72, -104, 68, -78);
      ctx.lineTo(60, 112);
      ctx.quadraticCurveTo(18, 136, -40, 114);
      ctx.quadraticCurveTo(-76, 70, -72, -82);
      ctx.quadraticCurveTo(-72, -108, -66, -122);
    } else if (shape === "barrier") {
      ctx.moveTo(-72, -92);
      ctx.lineTo(68, -110);
      ctx.quadraticCurveTo(76, -86, 64, -58);
      ctx.lineTo(56, 84);
      ctx.quadraticCurveTo(20, 128, -44, 108);
      ctx.quadraticCurveTo(-80, 62, -74, -70);
      ctx.closePath();
    } else if (shape === "traffic") {
      ctx.moveTo(-38, -140);
      ctx.quadraticCurveTo(48, -132, 60, -72);
      ctx.lineTo(58, 102);
      ctx.quadraticCurveTo(18, 136, -36, 120);
      ctx.quadraticCurveTo(-72, 76, -66, -72);
      ctx.quadraticCurveTo(-62, -118, -38, -140);
    } else if (shape === "whale") {
      ctx.moveTo(-70, -72);
      ctx.bezierCurveTo(-44, -132, 42, -124, 72, -54);
      ctx.lineTo(56, 86);
      ctx.quadraticCurveTo(12, 136, -48, 106);
      ctx.bezierCurveTo(-78, 54, -88, -14, -70, -72);
    } else {
      ctx.moveTo(-48, -126);
      ctx.bezierCurveTo(-82, -96, -84, 44, -50, 112);
      ctx.bezierCurveTo(-20, 134, 42, 124, 58, 92);
      ctx.bezierCurveTo(42, 48, 42, -64, 56, -102);
      ctx.bezierCurveTo(28, -128, -18, -140, -48, -126);
    }
    ctx.closePath();
  };
  const sideRail = () => {
    ctx.beginPath();
    ctx.moveTo(-56, -112);
    ctx.bezierCurveTo(-78, -74, -76, 44, -48, 100);
    ctx.bezierCurveTo(-38, 112, -22, 114, -12, 106);
    ctx.bezierCurveTo(-38, 52, -38, -70, -18, -112);
    ctx.bezierCurveTo(-28, -122, -44, -122, -56, -112);
    ctx.closePath();
  };

  drawCastShadow(ctx, shell, 4, 5, 0.035);
  shell();
  ctx.fillStyle = colorAlpha(style.fill || "#efe4cf", 0.72);
  ctx.fill();
  pencilShade(ctx, shell, { x: -88, y: -142, w: 160, h: 278 }, {
    wash: 0.12,
    hatch: 0.055,
    cross: 0.018,
    spacing: 7,
    texture: 0.035
  });
  if (liveGasMeter) {
    ctx.save();
    shell();
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(12, -18, 10, 12, -18, 142);
    glow.addColorStop(0, colorAlpha(gasColor, 0.04 + gasLevel * 0.14 + beat * 0.18));
    glow.addColorStop(0.54, colorAlpha(gasColor, gasLevel >= 0.68 ? 0.08 + beat * 0.1 : 0.035 + beat * 0.04));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-100, -150, 210, 300);
    if (gasLevel >= 0.68) {
      ctx.strokeStyle = colorAlpha(gasColor, 0.26 + beat * 0.22);
      ctx.lineWidth = 3.6 + beat * 2;
      roughBezier(ctx, [[-50, -82], [-16, -104], [34, -66], [44, -18]], 0.36, 1440);
      roughBezier(ctx, [[-42, 36], [-6, 10], [38, 32], [48, 82]], 0.34, 1441);
    }
    ctx.restore();
  }

  ctx.save();
  sideRail();
  ctx.fillStyle = "rgba(12,16,17,0.5)";
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.58)";
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colorAlpha(style.highlight || "#d7a13a", 0.55);
  ctx.lineWidth = 3.4;
  roughBezier(ctx, [[-42, -104], [-58, -54], [-56, 42], [-30, 98]], 0.55, 1410);
  roughBezier(ctx, [[42, -88], [32, -42], [34, 46], [45, 86]], 0.45, 1411);
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = 1.2;
  roughBezier(ctx, [[-28, -104], [-46, -48], [-44, 38], [-22, 92]], 0.45, 1412);
  ctx.restore();

  drawPencilRect(ctx, -48, -116, 72, 22, 7, {
    fill: colorAlpha(style.highlight || "#d7a13a", 0.18),
    wash: 0.08,
    hatch: 0.04,
    cross: 0.012,
    spacing: 6,
    shadow: 0.025,
    lineWidth: 1.2
  });

  for (const [x, y] of [[-30, -96], [24, -82], [-38, 66], [28, 72], [-18, 112]]) {
    drawRivet(ctx, x, y, 3.2);
  }
  ctx.restore();
}

function counterPalette(part, state = {}, type = "block") {
  const digitKey = type === "sale" ? "saleDigitColor" : "blockDigitColor";
  const accentKey = type === "sale" ? "saleCounterAccent" : "blockCounterAccent";
  const goldenEdition = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const rawDigit = goldenEdition
    ? (state[digitKey] || state.counterColor || "#fff0a6")
    : (part.counterColor || state[digitKey] || state.counterColor || state.liquidAccent || "#66f5dd");
  const rawAccent = goldenEdition
    ? (state[accentKey] || state.counterAccent || "#f0b233")
    : (part.counterAccent || state[accentKey] || state.counterAccent || "#d7a13a");
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

function drawBlockCounter(ctx, part, state) {
  setup(ctx, part, 1.7, 0.92);
  const palette = counterPalette(part, state, "block");
  if (part.counterLabel) {
    const label = String(part.counterLabel).slice(0, 5).toUpperCase();
    const w = 132;
    const h = 64;
    const frame = () => {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    };
    drawCastShadow(ctx, frame, 3, 4, 0.05);
    frame();
    ctx.fillStyle = "rgba(9,13,14,0.86)";
    ctx.fill();
    ctx.strokeStyle = colorAlpha(palette.accent, 0.66);
    ctx.lineWidth = 1.7;
    ctx.stroke();
    drawPencilRect(ctx, -w / 2 + 12, -h / 2 + 13, w - 24, h - 25, 6, {
      fill: "rgba(9,35,35,0.76)",
      wash: 0.035,
      hatch: 0.016,
      spacing: 5,
      shadow: 0.015,
      lineWidth: 1.1
    });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = colorAlpha(palette.digit, 0.62);
    ctx.shadowBlur = 7;
    ctx.fillStyle = colorAlpha(palette.digit, 0.94);
    ctx.font = "bold 22px ui-monospace, Menlo, Consolas, monospace";
    ctx.letterSpacing = "0px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.fillStyle = colorAlpha(palette.accent, 0.76);
    ctx.font = "bold 6px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VAULT", 0, h / 2 - 8);
    for (const [x, y] of [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8], [-w / 2 + 8, h / 2 - 8], [w / 2 - 8, h / 2 - 8]]) {
      drawRivet(ctx, x, y, 2.5);
    }
    return;
  }

  const styleName = part.counterStyle || "flipBlack";
  const liveBlock = Number(state.blockNumber ?? 0);
  const tokenSeed = Number(state.tokenId ?? state.tokenID ?? state.id ?? part.id ?? 1);
  const seededOffset = Number.isFinite(tokenSeed) ? Math.floor((Math.abs(tokenSeed) * 137) % 900000) : 137;
  const fallback = 25000000 + seededOffset + Math.floor((state.time || 0) * 0.45);
  const block = Number.isFinite(liveBlock) && liveBlock > 0 ? Math.floor(liveBlock) : fallback;
  const formatCompact = (value) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(value >= 10000000000 ? 0 : 1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    if (value >= 1000) return `${Math.floor(value / 1000)}K`;
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
  const digits = String(block % 1000000).padStart(6, "0");
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
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, spec.radius);
  };
  drawCastShadow(ctx, frame, 3, 4, 0.05);
  frame();
  ctx.fillStyle = spec.shell;
  ctx.fill();
  ctx.strokeStyle = colorAlpha(palette.accent, 0.64);
  ctx.lineWidth = spec.gear ? 2.1 : 1.6;
  ctx.stroke();

  if (spec.tube) {
    ctx.save();
    const tube = ctx.createLinearGradient(frameX, frameY, frameX, frameY + frameH);
    tube.addColorStop(0, "rgba(255,255,255,0.34)");
    tube.addColorStop(0.45, "rgba(255,255,255,0.03)");
    tube.addColorStop(1, colorAlpha(palette.digit, 0.18));
    ctx.fillStyle = tube;
    frame();
    ctx.fill();
    ctx.restore();
  }
  if (spec.paper) {
    ctx.save();
    ctx.fillStyle = "rgba(18,22,25,0.24)";
    for (let px = frameX + 10; px < frameX + frameW - 6; px += 12) {
      ctx.beginPath();
      ctx.arc(px, frameY + 6, 1.5, 0, Math.PI * 2);
      ctx.arc(px, frameY + frameH - 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (spec.gear) {
    ctx.save();
    ctx.fillStyle = colorAlpha(palette.accent, 0.68);
    for (let i = 0; i < 11; i += 1) {
      const gx = frameX + 8 + i * ((frameW - 16) / 10);
      ctx.fillRect(gx - 2, frameY - 4, 4, 6);
      ctx.fillRect(gx - 2, frameY + frameH - 2, 4, 6);
    }
    ctx.restore();
  }
  if (spec.knob || spec.capsule) {
    ctx.save();
    ctx.fillStyle = spec.capsule ? "rgba(235,230,218,0.86)" : colorAlpha(palette.accent, 0.82);
    ctx.beginPath();
    ctx.roundRect(frameX + frameW + 2, frameY + frameH * 0.28, 13, frameH * 0.44, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(18,22,25,0.46)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.font = "bold 10px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = spec.paper ? "rgba(18,22,25,0.72)" : colorAlpha(palette.accent, 0.84);
  ctx.fillText(spec.label, startX + 10, y - 9);
  ctx.textAlign = "right";
  ctx.fillStyle = spec.paper ? "rgba(18,22,25,0.66)" : "rgba(245,245,241,0.82)";
  ctx.fillText(`#${compact}`, startX + totalW - 7, y - 9);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 20px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = spec.text;
  ctx.fillText(spec.prefix, startX + 10, y + tileH / 2);
  ctx.restore();

  for (let i = 0; i < digits.length; i += 1) {
    const x = startX + 24 + i * (tileW + gap);
    const card = () => {
      ctx.beginPath();
      ctx.roundRect(x, y, tileW, tileH, spec.roller || spec.drum ? 8 : 4);
    };
    card();
    ctx.fillStyle = spec.tile;
    ctx.fill();
    if (spec.roller || spec.drum) {
      const wheel = ctx.createLinearGradient(x, y, x + tileW, y);
      wheel.addColorStop(0, "rgba(0,0,0,0.24)");
      wheel.addColorStop(0.48, "rgba(255,255,255,0.14)");
      wheel.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = wheel;
      card();
      ctx.fill();
    }
    ctx.save();
    ctx.strokeStyle = spec.split ? "rgba(255,255,255,0.18)" : colorAlpha(palette.accent, 0.2);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + tileH / 2);
    ctx.lineTo(x + tileW - 2, y + tileH / 2);
    ctx.stroke();
    if (spec.drum) {
      ctx.fillStyle = colorAlpha(spec.text, 0.32);
      ctx.font = "bold 13px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String((Number(digits[i]) + 9) % 10), x + tileW / 2, y + 7);
      ctx.fillText(String((Number(digits[i]) + 1) % 10), x + tileW / 2, y + tileH - 5);
    }
    ctx.globalCompositeOperation = spec.lcd || palette.goldenEdition ? "lighter" : "source-over";
    ctx.shadowColor = spec.lcd || palette.goldenEdition ? colorAlpha(spec.text, palette.goldenEdition ? 0.58 : 0.72) : "transparent";
    ctx.shadowBlur = spec.lcd ? 5 : palette.goldenEdition ? 4 : 0;
    ctx.fillStyle = spec.text;
    ctx.font = `bold ${spec.drum ? 19 : 20}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.letterSpacing = "0px";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tx = x + tileW / 2;
    const ty = y + tileH / 2 + 1;
    ctx.lineWidth = palette.goldenEdition ? 1.15 : 0.75;
    ctx.strokeStyle = colorAlpha(spec.text, palette.goldenEdition ? 0.44 : 0.32);
    ctx.strokeText(digits[i], tx, ty);
    ctx.fillText(digits[i], tx, ty);
    ctx.globalAlpha *= 0.54;
    ctx.fillText(digits[i], tx + 0.45, ty);
    ctx.restore();
  }
}

function drawTransferScarLedger(ctx, part, state) {
  setup(ctx, part, 1.55, 0.94);
  const rawCount = Number(state.transferCount ?? state.transfers ?? 0);
  const transferCount = Number.isFinite(rawCount) ? Math.max(0, Math.floor(rawCount)) : 0;
  const formatCompact = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
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
    ctx.beginPath();
    ctx.roundRect(x, y, plateW, plateH, 9);
  };
  drawCastShadow(ctx, plate, 3, 4, 0.045);
  plate();
  ctx.fillStyle = `rgba(30,39,38,${0.58 + age * 0.12})`;
  ctx.fill();
  ctx.strokeStyle = "rgba(12,16,17,0.62)";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  roughLine(ctx, x + 12, y + 20, x + plateW - 12, y + 14, 0.5, 12, 2311);
  roughLine(ctx, x + 15, y + plateH - 16, x + plateW - 18, y + plateH - 20, 0.45, 12, 2312);
  ctx.stroke();
  ctx.restore();

  pencilShade(ctx, plate, { x, y, w: plateW, h: plateH }, {
    wash: 0.08 + age * 0.04,
    hatch: 0.045,
    cross: 0.014 + age * 0.01,
    spacing: 7,
    texture: 0.035
  });

  ctx.save();
  ctx.font = "bold 10px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(245,245,241,0.74)";
  ctx.textAlign = "left";
  ctx.fillText("TRANSFER SCARS", x + 13, y + 15);
  ctx.textAlign = "right";
  ctx.fillStyle = transferCount ? gold : "rgba(245,245,241,0.56)";
  ctx.fillText(transferCount ? `#${formatCompact(transferCount)}` : "CLEAN", x + plateW - 13, y + 15);
  ctx.restore();

  for (const [rx, ry, rr] of [[x + 10, y + 10, 3], [x + plateW - 10, y + 10, 3], [x + 10, y + plateH - 10, 3], [x + plateW - 10, y + plateH - 10, 3]]) {
    drawRivet(ctx, rx, ry, rr);
  }

  const drawTallyBundle = (cx, cy, scale = 1, strong = false, seed = 1) => {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = strong ? scarInk : "rgba(16,20,19,0.76)";
    ctx.lineWidth = strong ? 2.8 * scale : 2.1 * scale;
    for (let i = 0; i < 4; i += 1) {
      const ox = (i - 1.5) * 8 * scale;
      roughLine(ctx, cx + ox - 4 * scale, cy + 17 * scale, cx + ox + 5 * scale, cy - 17 * scale, 0.55 * scale, 6, seed + i);
    }
    ctx.strokeStyle = strong ? colorAlpha("#d7a13a", 0.92) : "rgba(215,161,58,0.78)";
    ctx.lineWidth = strong ? 2.5 * scale : 1.8 * scale;
    roughLine(ctx, cx - 21 * scale, cy + 10 * scale, cx + 22 * scale, cy - 12 * scale, 0.5 * scale, 7, seed + 9);
    ctx.restore();
  };

  const drawBurnBundle = (cx, cy, seed = 1) => {
    ctx.save();
    ctx.fillStyle = heat ? colorAlpha("#d72d2a", 0.18 + heat * 0.1) : "rgba(82,43,24,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 16, -0.13, 0, Math.PI * 2);
    ctx.fill();
    drawTallyBundle(cx, cy, 0.82, true, seed);
    ctx.restore();
  };

  const drawSeal = (cx, cy, label, seed = 1) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(10,13,13,0.76)";
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = pulse ? colorAlpha("#66f5dd", 0.48 + pulse * 0.24) : darkGold;
    ctx.lineWidth = 1.2;
    roughLine(ctx, -6, -5, 6, 5, 0.28, 4, seed);
    roughLine(ctx, -6, 5, 6, -5, 0.28, 4, seed + 1);
    ctx.fillStyle = "rgba(245,245,241,0.78)";
    ctx.font = "bold 7px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0.5);
    ctx.restore();
  };

  const drawStamp = (label) => {
    ctx.save();
    const sx = x + 12;
    const sy = y + 28;
    ctx.fillStyle = "rgba(8,10,10,0.8)";
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(sx, sy, 42, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(245,245,241,0.86)";
    ctx.font = "bold 12px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, sx + 21, sy + 10.5);
    ctx.restore();
  };

  if (!transferCount) {
    ctx.save();
    ctx.strokeStyle = "rgba(245,245,241,0.2)";
    ctx.lineWidth = 1.2;
    roughLine(ctx, x + 24, y + 56, x + plateW - 24, y + 50, 0.65, 12, 2460);
    ctx.fillStyle = "rgba(245,245,241,0.44)";
    ctx.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NO MARKS", 0, y + 61);
    ctx.restore();
    return;
  }

  if (transferCount >= 1000) {
    drawStamp(formatCompact(transferCount));
  }

  let remainder = transferCount % 1000;
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

  ctx.save();
  ctx.strokeStyle = scarInk;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  const singleStart = x + plateW - 30 - ones * 8;
  for (let i = 0; i < ones; i += 1) {
    roughLine(ctx, singleStart + i * 11, y + 79, singleStart + i * 11 + 7, y + 50, 0.42, 5, 2800 + i);
  }
  ctx.restore();
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

function drawSalePixelGlyph(ctx, pattern, x, y, pixel, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== "1") continue;
      ctx.beginPath();
      ctx.roundRect(x + col * pixel, y + row * pixel, pixel * 0.82, pixel * 0.82, pixel * 0.18);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSalePixelNumber(ctx, count, x, y, pixel, color) {
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
    drawSalePixelGlyph(ctx, digits[char] || digits["0"], cx, y, pixel, color);
    cx += glyphW + gap;
  }
}

function drawSaleScarScreenPart(ctx, part, state = {}) {
  setup(ctx, part, 1.35, 0.94);
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
    ctx.beginPath();
    ctx.roundRect(x, y, plateW, plateH, style.radius);
  };
  drawCastShadow(ctx, plate, 3, 4, 0.055);
  plate();
  ctx.fillStyle = style.fill;
  ctx.fill();
  ctx.strokeStyle = style.screen === "paper" || style.screen === "punch" ? "rgba(18,22,21,0.58)" : colorAlpha(palette.frame, 0.72);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (style.knob) {
    ctx.save();
    ctx.fillStyle = "rgba(235,230,218,0.86)";
    ctx.beginPath();
    ctx.roundRect(x + plateW - 3, y + 8, 12, plateH - 16, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(18,22,25,0.42)";
    ctx.stroke();
    ctx.restore();
  }
  if (style.gear) {
    ctx.save();
    ctx.translate(0, 0);
    ctx.strokeStyle = colorAlpha(palette.frame, 0.72);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const r1 = 23;
      const r2 = 28;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (style.tag) {
    ctx.save();
    ctx.fillStyle = colorAlpha(palette.frame, 0.78);
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
    roughLine(ctx, x + 10, y + 10, x + 22, y - 4, 0.45, 5, 9221);
    ctx.restore();
  }
  if (style.holes) {
    ctx.save();
    ctx.fillStyle = "rgba(18,22,25,0.2)";
    for (let hy = y + 8; hy < y + plateH - 6; hy += 9) {
      ctx.beginPath();
      ctx.arc(x + 5, hy, 1.3, 0, Math.PI * 2);
      ctx.arc(x + plateW - 5, hy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const screenInsetX = style.screen === "dial" ? 11 : style.screen === "ledger" ? 8 : 7;
  const screenInsetY = style.screen === "ledger" ? 7 : style.screen === "tube" ? 7 : 6;
  const screenW = plateW - screenInsetX * 2;
  const screenH = style.screen === "dial" ? 34 : style.screen === "ledger" ? 22 : style.screen === "tube" ? 24 : 29;
  const screen = () => {
    ctx.beginPath();
    if (style.screen === "dial") {
      ctx.arc(0, y + 28, 17, 0, Math.PI * 2);
    } else {
      ctx.roundRect(x + screenInsetX, y + screenInsetY, screenW, screenH, style.screen === "tube" ? 12 : 6);
    }
  };
  screen();
  const glass = ctx.createRadialGradient(0, y + 20, 0, 0, y + 20, 34);
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
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = colorAlpha(palette.frame, 0.82);
  ctx.lineWidth = 1.2;
  screen();
  ctx.stroke();

  ctx.save();
  screen();
  ctx.clip();
  ctx.fillStyle = colorAlpha(palette.accent, 0.04 + heat * 0.03);
  if (style.screen !== "paper" && style.screen !== "punch" && style.screen !== "roller") {
    for (let col = x + 10; col < x + plateW - 10; col += 5) ctx.fillRect(col, y + 10, 1, Math.max(12, screenH - 7));
    for (let row = y + 11; row < y + screenInsetY + screenH - 2; row += 5) ctx.fillRect(x + 9, row, plateW - 18, 1);
  }
  if (style.screen === "flip") {
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.beginPath();
    ctx.moveTo(x + screenInsetX + 2, y + screenInsetY + screenH / 2);
    ctx.lineTo(x + screenInsetX + screenW - 2, y + screenInsetY + screenH / 2);
    ctx.stroke();
  }
  if (style.screen === "punch") {
    ctx.fillStyle = colorAlpha(palette.frame, 0.18);
    for (let px = x + 14; px < x + plateW - 12; px += 10) {
      ctx.beginPath();
      ctx.roundRect(px, y + 12, 3, 5, 1.2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = style.screen === "paper" || style.screen === "roller" || style.screen === "punch" ? "source-over" : "lighter";
  ctx.shadowColor = colorAlpha(palette.accent, 0.7);
  ctx.shadowBlur = style.screen === "paper" || style.screen === "roller" || style.screen === "punch" ? 0 : 4 + pulse * 4;
  const digitColor = style.screen === "paper" || style.screen === "roller" || style.screen === "punch"
    ? colorAlpha("#151817", sales ? 0.88 : 0.42)
    : colorAlpha(palette.accent, sales ? 0.92 + pulse * 0.08 : 0.38);
  const digitY = style.screen === "dial" ? y + 18 : style.screen === "ledger" ? y + 10 : y + 12;
  const pixel = style.screen === "ledger" ? 2.4 : style.screen === "dial" ? 2.85 : 3.05;
  drawSalePixelNumber(ctx, sales, 0, digitY, pixel, digitColor);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = style.screen === "paper" || style.screen === "punch" ? "rgba(18,22,25,0.62)" : colorAlpha(palette.accent, sales ? 0.86 : 0.42);
  ctx.font = "bold 4.8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(style.label, -9, y + plateH - 9);
  ctx.fillStyle = sales > 9 ? colorAlpha(palette.frame, 0.86) : "rgba(176,42,37,0.82)";
  ctx.beginPath();
  ctx.arc(x + plateW - 11, y + plateH - 9, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const [rx, ry] of [[x + 6, y + 8], [x + plateW - 6, y + 8], [x + 7, y + plateH - 7], [x + plateW - 7, y + plateH - 7]]) {
    drawRivet(ctx, rx, ry, 1.6);
  }
}

function drawTransferScarCutPart(ctx, x1, y1, x2, y2, seed, color, width = 2, glow = 0) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(5,8,8,0.48)";
  ctx.lineWidth = width + 2.2;
  roughLine(ctx, x1 + 1.2, y1 + 1.6, x2 + 1.2, y2 + 1.6, 0.65, 6, seed + 31);
  if (glow) {
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = color;
    ctx.shadowBlur = 5 + glow * 7;
    ctx.strokeStyle = colorAlpha(color, 0.16 + glow * 0.24);
    ctx.lineWidth = width + 3;
    roughLine(ctx, x1, y1, x2, y2, 0.42, 6, seed + 61);
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = colorAlpha(color, 0.9);
  ctx.lineWidth = width;
  roughLine(ctx, x1, y1, x2, y2, 0.56, 6, seed);
  ctx.strokeStyle = "rgba(255,245,190,0.28)";
  ctx.lineWidth = Math.max(0.7, width * 0.36);
  roughLine(ctx, x1 + 0.8, y1 - 1, x2 + 0.8, y2 - 1, 0.28, 5, seed + 91);
  ctx.restore();
}

function drawTransferTallyPartBundle(ctx, x, y, scale, seed, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  for (let i = 0; i < 4; i += 1) {
    const ox = (i - 1.5) * 8.4 * scale;
    drawTransferScarCutPart(ctx, ox - 4 * scale, 15 * scale, ox + 4.5 * scale, -16 * scale, seed + i * 19, options.color || "#24221b", 2.1 * scale, options.glow || 0);
  }
  drawTransferScarCutPart(ctx, -22 * scale, 10 * scale, 23 * scale, -12 * scale, seed + 101, options.slashColor || "#a46624", 2.35 * scale, options.glow || 0);
  ctx.restore();
}

function drawTransferSingleCutsPart(ctx, x, y, count, scale, seed, options = {}) {
  if (!count) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  for (let i = 0; i < count; i += 1) {
    const ox = (i - (count - 1) / 2) * 8.5 * scale;
    drawTransferScarCutPart(ctx, ox - 2.8 * scale, 13 * scale, ox + 5.2 * scale, -14 * scale, seed + i * 23, options.color || "#24221b", 1.9 * scale, options.glow || 0);
  }
  ctx.restore();
}

function drawTransferBurnPart(ctx, x, y, scale, seed, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  const heat = options.heat || 0;
  ctx.fillStyle = options.aura || (heat > 0.58 ? "rgba(111,28,20,0.24)" : "rgba(70,42,24,0.18)");
  ctx.beginPath();
  ctx.ellipse(0, 1, 28 * scale, 16 * scale, -0.1, 0, Math.PI * 2);
  ctx.fill();
  drawTransferTallyPartBundle(ctx, 0, 0, scale * 0.82, seed, {
    color: options.color || (heat > 0.58 ? "#80231d" : "#25221a"),
    slashColor: options.slashColor || "#d7a13a",
    glow: options.glow || 0
  });
  ctx.restore();
}

function drawTransferSealPart(ctx, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  const glow = options.glow || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  ctx.fillStyle = "rgba(14,17,16,0.66)";
  ctx.strokeStyle = "rgba(215,161,58,0.86)";
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 11.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = glow ? colorAlpha("#66f5dd", 0.18 + glow * 0.24) : "rgba(215,161,58,0.52)";
  ctx.lineWidth = 1.05 * scale;
  roughLine(ctx, -6 * scale, -5 * scale, 6 * scale, 5 * scale, 0.26, 4, seed);
  roughLine(ctx, -6 * scale, 5 * scale, 6 * scale, -5 * scale, 0.26, 4, seed + 1);
  ctx.fillStyle = "rgba(245,236,206,0.82)";
  ctx.font = `bold ${Math.max(5, 6.4 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0.5);
  ctx.restore();
}

function drawTransferStampPart(ctx, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  const w = 54 * scale;
  const h = 22 * scale;
  ctx.fillStyle = "rgba(8,10,10,0.76)";
  ctx.strokeStyle = "rgba(215,161,58,0.72)";
  ctx.lineWidth = 1.3 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 5 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,236,151,0.16)";
  ctx.lineWidth = 0.8 * scale;
  roughLine(ctx, -w * 0.34, -h * 0.18, w * 0.36, -h * 0.26, 0.38, 6, seed);
  ctx.fillStyle = "rgba(245,236,206,0.84)";
  ctx.font = `bold ${Math.max(7, 9.5 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0.7);
  ctx.restore();
}

function compactTransferPartLabel(value) {
  if (value >= 1000000) return `${Math.floor(value / 1000000)}M`;
  if (value >= 1000) return `${Math.floor(value / 1000)}K`;
  return String(value);
}

function drawTransferTallyScarsPart(ctx, part, state = {}) {
  setup(ctx, part, 1.25, 0.92);
  const transfers = transferCountForState(state);
  if (!transfers) return;
  const goldenEdition = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const heat = Math.min(1, transfers / 120);
  const pulse = Math.max(0, Math.min(1, Number(state.heartbeatPulse || 0)));
  const glow = transfers >= 8 ? Math.min(1, heat * (0.38 + pulse * 0.46)) : 0;
  const seed = 9300 + transfers * 23 + (part.scarVariant === "minor" ? 400 : 0);
  const cutColor = goldenEdition
    ? (heat > 0.65 ? "#8e5a18" : heat > 0.32 ? "#6a4210" : "#2a1905")
    : (heat > 0.65 ? "#7f2b22" : heat > 0.32 ? "#5e351e" : "#141715");
  const slashColor = goldenEdition
    ? (heat > 0.52 ? "#ffed91" : "#d19a2c")
    : (heat > 0.52 ? "#d7a13a" : "#a86724");

  let remainder = transfers;
  const thousands = Math.floor(remainder / 1000);
  remainder %= 1000;
  const hundreds = Math.floor(remainder / 100);
  remainder %= 100;
  const twentyFives = Math.floor(remainder / 25);
  remainder %= 25;
  const fives = Math.floor(remainder / 5);
  const ones = remainder % 5;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  if (part.scarVariant === "minor") {
    const visibleFives = Math.min(3, fives);
    for (let i = 0; i < visibleFives; i += 1) {
      drawTransferTallyPartBundle(ctx, -22 + i * 28, -5 + (i % 2) * 15, 0.58, seed + i, {
        rotation: -0.02 + i * 0.12,
        color: cutColor,
        slashColor,
        glow
      });
    }
    drawTransferSingleCutsPart(ctx, 24, 22, Math.min(4, ones), 0.62, seed + 90, {
      rotation: 0.1,
      color: cutColor,
      glow
    });
    ctx.restore();
    return;
  }

  if (thousands) {
    drawTransferStampPart(ctx, 27, 21, compactTransferPartLabel(transfers), seed + 4, { scale: 0.68, rotation: 0.18 });
  }
  const visibleHundreds = Math.min(3, hundreds);
  for (let i = 0; i < visibleHundreds; i += 1) {
    drawTransferSealPart(ctx, -34 + i * 27, -19 + (i % 2) * 10, "100", seed + 100 + i, {
      scale: 0.72,
      rotation: 0.1 + i * 0.06,
      glow
    });
  }
  const visibleTwentyFives = Math.min(3, twentyFives);
  for (let i = 0; i < visibleTwentyFives; i += 1) {
    drawTransferBurnPart(ctx, -28 + i * 35, 14 + (i % 2) * 5, 0.76, seed + 220 + i, {
      rotation: 0.13 + i * 0.04,
      heat,
      glow,
      color: cutColor,
      slashColor,
      aura: goldenEdition ? "rgba(255,200,64,0.12)" : undefined
    });
  }
  if (!visibleHundreds && !visibleTwentyFives) {
    drawTransferTallyPartBundle(ctx, -14, 7, 0.72, seed + 360, {
      rotation: 0.14,
      color: cutColor,
      slashColor,
      glow
    });
  }

  ctx.restore();
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
    const color = pressureColorFor(level);
    return {
      golden: false,
      color,
      panel: "rgba(5,8,7,0.9)",
      panelStroke: colorAlpha(color, 0.52),
      track: "rgba(11,18,16,0.72)",
      text: colorAlpha(color, 0.98),
      glow: colorAlpha(color, 0.34),
      softGlow: colorAlpha(color, 0.12)
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

function drawPackGaugeFace(ctx, x, y, r, level, state = {}) {
  const clamped = Math.max(0, Math.min(1, level));
  const start = Math.PI * 1.08;
  const end = Math.PI * 1.92;
  const palette = gasDisplayPaletteFor(clamped, state);
  const pressureColor = palette.color;
  const goldenGas = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const label = gasLabelFor(clamped);
  const beat = gasHeartbeatFor(state, clamped, 0.08);

  ctx.save();
  ctx.translate(x, y);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = colorAlpha(pressureColor, 0.04 + clamped * 0.05 + beat * 0.12);
  ctx.beginPath();
  ctx.arc(0, 4, r + 9 + beat * 5, Math.PI, Math.PI * 2);
  ctx.lineTo(r + 10, r * 0.5);
  ctx.lineTo(-r - 10, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = goldenGas ? "rgba(4,5,4,0.93)" : "rgba(246,241,229,0.88)";
  ctx.strokeStyle = goldenGas ? "rgba(255,203,68,0.68)" : "rgba(18,22,25,0.78)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
  ctx.lineTo(r, r * 0.42);
  ctx.lineTo(-r, r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = goldenGas ? "rgba(138,90,24,0.88)" : "rgba(85,242,119,0.86)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r - 8, start, start + (end - start) * 0.34);
  ctx.stroke();
  ctx.strokeStyle = goldenGas ? "rgba(215,161,58,0.92)" : "rgba(255,210,63,0.88)";
  ctx.beginPath();
  ctx.arc(0, 0, r - 8, start + (end - start) * 0.38, start + (end - start) * 0.66);
  ctx.stroke();
  ctx.strokeStyle = goldenGas ? "rgba(255,240,166,0.96)" : "rgba(255,89,56,0.92)";
  ctx.beginPath();
  ctx.arc(0, 0, r - 8, start + (end - start) * 0.7, end);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineWidth = 6 + beat * 5;
  ctx.strokeStyle = colorAlpha(pressureColor, 0.14 + clamped * 0.12 + beat * 0.28);
  ctx.beginPath();
  ctx.arc(0, 0, r - 13, start, start + (end - start) * clamped);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i <= 5; i += 1) {
    const a = start + (end - start) * (i / 5);
    ctx.strokeStyle = goldenGas ? "rgba(255,224,98,0.56)" : "rgba(18,22,25,0.58)";
    ctx.lineWidth = i === 0 || i === 5 ? 2.2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 12), Math.sin(a) * (r - 12));
    ctx.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx.stroke();
  }
  const needle = start + (end - start) * clamped;
  ctx.strokeStyle = goldenGas || clamped > 0.68 ? colorAlpha(pressureColor, 0.98) : "rgba(18,22,25,0.8)";
  ctx.shadowColor = colorAlpha(pressureColor, 0.12 + beat * 0.32);
  ctx.shadowBlur = 4 + beat * 9;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(needle) * (r - 14), Math.sin(needle) * (r - 14));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = goldenGas ? "rgba(255,224,98,0.92)" : "rgba(18,22,25,0.82)";
  ctx.beginPath();
  ctx.arc(0, 0, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = goldenGas || clamped > 0.68 ? colorAlpha(pressureColor, 0.98) : colorAlpha(pressureColor, 0.92);
  ctx.font = `bold ${Math.max(9, Math.round(r * 0.25))}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, r * 0.25);
  ctx.restore();
}

function drawPackUtilityPort(ctx, x, y, r, style = {}) {
  const color = style.color || "#d7a13a";
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = style.fill || "rgba(34,44,44,0.74)";
  ctx.strokeStyle = "rgba(18,22,25,0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = colorAlpha(color, 0.54);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.5)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(style.line || "#fff2b8", 0.46);
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.25, Math.sin(angle) * r * 0.25);
    ctx.lineTo(Math.cos(angle) * r * 0.62, Math.sin(angle) * r * 0.62);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(18,22,25,0.76)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  for (const [rx, ry] of [[-0.68, -0.68], [0.68, -0.68], [-0.68, 0.68], [0.68, 0.68]]) {
    drawRivet(ctx, rx * r, ry * r, Math.max(2, r * 0.1));
  }
  ctx.restore();
}

function drawPackIconReaderBadge(ctx, level, style = {}, options = {}) {
  const palette = gasDisplayPaletteFor(level, options);
  const color = palette.color;
  const label = gasLabelFor(level);
  const beat = gasHeartbeatFor(options, level, options.offset || 0.18);
  const levelGlow = clamp01(level);
  const fillAlpha = Math.min(1, 0.74 + beat * 0.2 + levelGlow * 0.1);
  const glowAlpha = 0.09 + levelGlow * 0.1 + beat * 0.24;
  ctx.save();
  ctx.translate(options.x ?? 35, options.y ?? 18);
  const scale = options.scale ?? 0.88;
  ctx.scale(scale, scale);
  drawPencilRect(ctx, -46, -16, 92, 32, 7, {
    fill: palette.panel,
    wash: 0.045,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.032,
    lineWidth: 1.18
  });
  ctx.beginPath();
  ctx.roundRect(-33, -6, 45, 10, 5);
  ctx.fillStyle = palette.track;
  ctx.fill();
  ctx.strokeStyle = "rgba(8,11,12,0.5)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-33, -6, 45 * Math.max(0.08, Math.min(1, level)), 10, 5);
  ctx.shadowColor = palette.glow || colorAlpha(color, glowAlpha);
  ctx.shadowBlur = 6 + beat * 12 + levelGlow * 5;
  ctx.fillStyle = colorAlpha(color, fillAlpha);
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = colorAlpha(color, 0.06 + beat * 0.16 + levelGlow * 0.07);
  ctx.fillRect(-41, -13, 82, 26);
  ctx.restore();
  ctx.shadowColor = colorAlpha(style.highlight || "#d7a13a", 0.22 + beat * 0.2);
  ctx.shadowBlur = 4 + beat * 8;
  ctx.fillStyle = colorAlpha(palette.golden ? "#ffe47a" : (style.highlight || "#d7a13a"), 0.82 + beat * 0.16);
  ctx.beginPath();
  ctx.arc(29, -1, 5.5 + beat * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(8,11,12,0.64)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.95 + beat * 0.05));
  ctx.font = "bold 9.5px ui-monospace, Menlo, Consolas, monospace";
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 2, 10.5);
  ctx.restore();
}

function drawGasStatePill(ctx, level, state = {}, x = 0, y = 0, scale = 1, options = {}) {
  const palette = gasDisplayPaletteFor(level, state);
  const color = palette.color;
  const label = String(options.text || gasLabelFor(level)).toUpperCase();
  const beat = gasHeartbeatFor(state, level, options.offset || 0.36);
  const w = options.w || 82;
  const h = options.h || 28;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  ctx.scale(scale, scale);
  drawPencilRect(ctx, -w / 2, -h / 2, w, h, 7, {
    fill: palette.panel,
    wash: 0.04,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.028,
    lineWidth: 1.15
  });
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = palette.glow || colorAlpha(color, 0.24 + beat * 0.42 + level * 0.12);
  ctx.shadowBlur = 7 + beat * 18 + level * 8;
  ctx.fillStyle = colorAlpha(color, (palette.golden ? 0.06 : 0.1) + beat * 0.22 + level * 0.12);
  ctx.fillRect(-w / 2 + 5, -h / 2 + 4, w - 10, h - 8);
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 9, -h / 2 + 7, (w - 18) * Math.max(0.1, Math.min(1, level)), 5, 3);
  ctx.fillStyle = colorAlpha(color, 0.78 + beat * 0.2);
  ctx.fill();
  ctx.fillStyle = palette.text || (label === "EXT" ? "rgba(255,238,205,0.98)" : colorAlpha(color, 0.94 + beat * 0.06));
  ctx.shadowColor = colorAlpha(color, 0.26 + beat * 0.35);
  ctx.shadowBlur = 4 + beat * 8;
  ctx.font = `bold ${options.fontSize || 11}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 4);
  ctx.shadowBlur = 0;
  if (options.caption) {
    ctx.fillStyle = colorAlpha(options.captionColor || palette.color || "#d7a13a", 0.82);
    ctx.font = "bold 6px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(String(options.caption).toUpperCase(), 0, -7);
  }
  ctx.restore();
}

function drawPackIconGasReadoutOverlay(ctx, part, state = {}) {
  const icon = part.packIcon || "pressureGauge";
  const level = gasLevelFor(state);
  const style = styleFor(part);
  const overlayState = { ...state };
  const pill = (x, y, scale, options = {}) => drawGasStatePill(ctx, level, overlayState, x, y, scale, options);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  if (icon === "pressureGauge") {
    drawPackGaugeFace(ctx, 0, -8, 52, level, overlayState);
    drawPencilRect(ctx, -24, 24, 48, 18, 6, {
      fill: "rgba(4,5,4,0.9)",
      wash: 0.035,
      hatch: 0.012,
      spacing: 5,
      shadow: 0.02,
      lineWidth: 1.1
    });
  } else if (icon === "engineReader" || icon === "cassetteReader") {
    drawPackIconReaderBadge(ctx, level, style, { ...overlayState, x: 0, y: -1, scale: 1, offset: 0.1 });
  } else if (icon === "ledger") {
    drawPackIconReaderBadge(ctx, level, style, { ...overlayState, x: -27, y: -2, scale: 0.72, offset: 0.16 });
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
    drawPackIconReaderBadge(ctx, level, style, { ...overlayState });
  }
  ctx.restore();
}

function drawPackIcon(ctx, part, state = {}) {
  const style = setup(ctx, part, 2.2, 0.84);
  const icon = part.packIcon || "pressureGauge";
  const level = gasLevelFor(state);
  const goldenPack = isGoldenEditionSkin(state.specialMaterialSkin || state.materialSkin);
  const liquid = goldenPack
    ? { base: "#e6a42f", accent: "#fff0a6", glow: "rgba(255,207,82,0.62)" }
    : liquidTheme(state);
  const gasPalette = gasDisplayPaletteFor(level, state);
  const cyan = goldenPack ? "#fff0a6" : (style.highlight || "#35d8df");
  const brass = goldenPack ? "#ffc43f" : "#d7a13a";
  const pressure = gasPalette.color;
  const red = goldenPack ? (level >= 0.68 ? "#fff0a6" : "#d7a13a") : (level >= 0.68 ? pressure : "#d84a3a");
  const cream = goldenPack ? "#f0d98a" : "#efe6d2";
  const ink = "rgba(12,16,17,0.84)";
  const beat = gasHeartbeatFor(state, level, 0.12);
  const integratedGasIcons = new Set([
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

  ctx.save();
  if (part.peek) {
    const bottom = Number.isFinite(part.peekClipBottom) ? part.peekClipBottom : 22;
    ctx.beginPath();
    ctx.rect(-126, -134, 252, bottom + 134);
    ctx.clip();
  }

  try {
  if (icon === "engineReader" || icon === "cassetteReader") {
    drawPencilRect(ctx, -54, -26, 108, 52, 10, {
      fill: "rgba(18,23,24,0.74)",
      wash: 0.05,
      hatch: 0.025,
      spacing: 5,
      shadow: 0.035,
      lineWidth: 1.35
    });
    drawPackIconReaderBadge(ctx, level, style, { ...state, x: 0, y: -1, scale: 1, offset: 0.1 });
    return;
  }

  if (icon === "pressureGauge") {
    drawPackGaugeFace(ctx, 0, -8, 52, level, state);
    drawPencilRect(ctx, -24, 24, 48, 18, 6, { fill: colorAlpha(brass, 0.36), wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.025 });
    return;
  }

  if (icon === "skateboard") {
    const deck = () => {
      ctx.beginPath();
      ctx.moveTo(-74, -20);
      ctx.quadraticCurveTo(-62, -40, -34, -34);
      ctx.lineTo(54, -18);
      ctx.quadraticCurveTo(78, -12, 68, 10);
      ctx.quadraticCurveTo(14, 30, -54, 16);
      ctx.quadraticCurveTo(-82, 8, -74, -20);
      ctx.closePath();
    };
    drawCastShadow(ctx, deck, 3, 4, 0.055);
    deck();
    ctx.fillStyle = "rgba(16,18,19,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(18,22,25,0.9)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = colorAlpha(brass, 0.88);
    ctx.lineWidth = 3;
    roughBezier(ctx, [[-68, 10], [-18, 20], [34, 18], [64, 2]], 0.5, 2031);
    drawPencilRect(ctx, -48, -4, 96, 25, 7, { fill: "rgba(4,10,12,0.84)", wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1 });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(pressure, 0.38 + beat * 0.3);
    ctx.lineWidth = 2.8;
    roughBezier(ctx, [[-42, 16], [-12, 21], [20, 18], [42, 8]], 0.35, 2032);
    ctx.restore();
    drawGasStatePill(ctx, level, state, 2, 8, 0.84, { w: 82, h: 26, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level), caption: "GAS" });
    for (const [x, y] of [[-44, 16], [42, 8]]) drawRivet(ctx, x, y, 3.2);
    return;
  }

  if (icon === "fireExtinguisher") {
    const body = () => {
      ctx.beginPath();
      ctx.roundRect(-34, -72, 68, 134, 24);
    };
    drawCastShadow(ctx, body, 4, 5, 0.06);
    body();
    ctx.fillStyle = "rgba(210,48,36,0.9)";
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawPencilRect(ctx, -25, 2, 50, 32, 8, { fill: "rgba(255,236,141,0.74)", wash: 0.07, hatch: 0.035, spacing: 6, lineWidth: 1.4 });
    ctx.fillStyle = ink;
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("CO2", 0, 20);
    drawGasStatePill(ctx, level, state, 0, 28, 0.54, { w: 68, h: 21, fontSize: 8, caption: "PSI" });
    drawPackUtilityPort(ctx, 0, -36, 34, { color: brass, fill: "rgba(72,38,30,0.66)" });
    drawPencilRect(ctx, -21, -83, 42, 20, 8, { fill: colorAlpha(brass, 0.72), wash: 0.05, hatch: 0.03, spacing: 5, lineWidth: 1.4 });
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    roughBezier(ctx, [[20, -78], [56, -60], [50, -16], [32, 18]], 0.6, 2201);
    ctx.strokeStyle = colorAlpha(cream, 0.62);
    ctx.lineWidth = 2;
    roughBezier(ctx, [[-18, -58], [-26, -16], [-20, 32], [-5, 54]], 0.35, 2202);
    return;
  }

  if (icon === "divingTankBattery" || icon === "fishTank") {
    for (const x of [-22, 22]) {
      const tank = () => {
        ctx.beginPath();
        ctx.roundRect(x - 18, -74, 36, 132, 18);
      };
      drawCastShadow(ctx, tank, 2, 3, 0.04);
      tank();
      ctx.fillStyle = colorAlpha(liquid.accent, icon === "fishTank" ? 0.44 : 0.78);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.save();
      const fillH = 88 * Math.max(0.08, Math.min(1, level));
      ctx.fillStyle = colorAlpha(pressure, icon === "fishTank" ? 0.18 + level * 0.28 + beat * 0.18 : 0.3 + level * 0.34 + beat * 0.18);
      ctx.fillRect(x - 13, 38 - fillH, 26, fillH);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(x - 8, -62, 4, 94);
    }
    drawPencilRect(ctx, -54, -18, 108, 18, 7, { fill: "rgba(12,16,17,0.64)", wash: 0.04, hatch: 0.02, spacing: 6, lineWidth: 1.2 });
    drawPencilRect(ctx, -54, 34, 108, 18, 7, { fill: "rgba(12,16,17,0.64)", wash: 0.04, hatch: 0.02, spacing: 6, lineWidth: 1.2 });
    drawPackUtilityPort(ctx, 0, -54, 31, { color: liquid.accent, fill: "rgba(20,58,58,0.52)" });
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    roughBezier(ctx, [[12, -84], [72, -64], [70, 18], [42, 64]], 0.5, 2203);
    ctx.fillStyle = colorAlpha(brass, 0.82);
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(12, -2);
    ctx.lineTo(0, 24);
    ctx.lineTo(16, 24);
    ctx.lineTo(-10, 56);
    ctx.lineTo(-2, 28);
    ctx.lineTo(-18, 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    drawPencilRect(ctx, 31, -48, 28, 70, 8, { fill: "rgba(4,10,12,0.72)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1 });
    for (let i = 0; i < 4; i += 1) {
      const lit = level >= (i + 1) / 4 - 0.02;
      ctx.fillStyle = lit ? colorAlpha(pressure, 0.64 + beat * 0.26) : "rgba(255,255,255,0.12)";
      ctx.fillRect(37, 7 - i * 14, 16, 9);
    }
    ctx.fillStyle = colorAlpha(pressure, 0.92);
    ctx.font = "bold 7px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAS", 45, -33);
    drawGasStatePill(ctx, level, state, -6, icon === "fishTank" ? 13 : 9, 0.78, { w: 80, h: 26, fontSize: 10, caption: icon === "fishTank" ? "TANK" : "O2" });
    return;
  }

  if (icon === "ledger") {
    ctx.save();
    ctx.rotate(-0.12);
    drawPencilRect(ctx, -78, -28, 116, 56, 10, { fill: "rgba(22,24,26,0.86)", wash: 0.08, hatch: 0.04, spacing: 7, shadow: 0.05 });
    drawPencilRect(ctx, 8, -34, 60, 68, 10, { fill: "rgba(242,242,236,0.82)", wash: 0.08, hatch: 0.035, spacing: 6, lineWidth: 1.6 });
    drawPencilRect(ctx, -54, -14, 54, 26, 4, { fill: "rgba(6,12,14,0.78)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.1 });
    ctx.fillStyle = colorAlpha(pressure, 0.92 + beat * 0.08);
    ctx.shadowColor = colorAlpha(pressure, 0.18 + beat * 0.28);
    ctx.shadowBlur = 4 + beat * 7;
    ctx.font = "bold 13px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(gasLabelFor(level), -27, -2);
    ctx.shadowBlur = 0;
    ctx.font = "bold 5.8px ui-monospace, Menlo, monospace";
    ctx.fillText("GAS", -27, 11);
    drawRivet(ctx, 44, 0, 5);
    ctx.restore();
    return;
  }

  if (icon === "transactionPrinter") {
    drawPencilRect(ctx, -58, -54, 116, 82, 12, { fill: "rgba(237,230,214,0.84)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.045 });
    drawPencilRect(ctx, -42, -30, 84, 18, 5, { fill: "rgba(18,22,25,0.76)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1.1 });
    drawPencilRect(ctx, -36, -2, 72, 44, 4, { fill: level >= 0.68 ? colorAlpha(pressure, 0.36 + beat * 0.22) : "rgba(255,246,219,0.82)", wash: 0.035, hatch: 0.018, spacing: 6, lineWidth: 1.1 });
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    for (let y = 8; y <= 28; y += 9) {
      roughLine(ctx, -26, y, 22, y + Math.sin(y) * 2, 0.25, 5, 2800 + y);
    }
    drawGasStatePill(ctx, level, state, 0, 22, 0.62, { w: 70, h: 23, fontSize: 10, caption: "TX" });
    drawRivet(ctx, -42, -42, 3);
    drawRivet(ctx, 42, -42, 3);
    return;
  }

  if (icon === "arcadePack") {
    drawPencilRect(ctx, -56, -60, 112, 106, 12, { fill: "rgba(18,21,23,0.84)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.045 });
    drawPencilRect(ctx, -44, -46, 88, 50, 7, { fill: colorAlpha(pressure, 0.2 + level * 0.18 + beat * 0.1), wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1.1 });
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-40, -42, 80, 42, 5);
    ctx.clip();
    ctx.fillStyle = colorAlpha(pressure, 0.1 + level * 0.16 + beat * 0.16);
    for (let y = -40; y < 0; y += 6) ctx.fillRect(-40, y + ((state.time || 0) * (2 + level * 8)) % 6, 80, 1.4);
    if (level >= 0.68) {
      ctx.fillStyle = colorAlpha("#fff0a4", 0.08 + beat * 0.12);
      for (let x = -34; x <= 32; x += 16) ctx.fillRect(x, -40, 5, 42);
    }
    ctx.restore();
    ctx.fillStyle = level >= 0.96 ? "rgba(255,238,205,0.98)" : colorAlpha(pressure, 0.92 + beat * 0.08);
    ctx.shadowColor = colorAlpha(pressure, 0.35 + beat * 0.34);
    ctx.shadowBlur = 7 + level * 8 + beat * 8;
    ctx.font = "bold 16px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(gasLabelFor(level), 0, -26);
    ctx.font = "bold 6.5px ui-monospace, Menlo, monospace";
    ctx.fillText(level >= 0.96 ? "OVERHEAT" : "GAS PLAY", 0, -9);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = colorAlpha(brass, 0.82);
    ctx.lineWidth = 3;
    roughLine(ctx, -26, 16, -8, 0, 0.32, 5, 2810);
    drawRivet(ctx, -8, 0, 4.5);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = i % 2 ? colorAlpha(brass, 0.86) : colorAlpha(pressure, 0.82);
      ctx.beginPath();
      ctx.arc(12 + i * 10, 16 + Math.sin(i) * 2, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    return;
  }

  if (icon === "mercurySpine") {
    for (let i = 0; i < 3; i += 1) {
      const x = -24 + i * 24;
      const tube = () => {
        ctx.beginPath();
        ctx.roundRect(x - 8, -70, 16, 112, 8);
      };
      tube();
      ctx.fillStyle = "rgba(221,235,230,0.36)";
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const fill = Math.max(12, 78 * level);
      ctx.fillStyle = colorAlpha(pressure, level >= 0.68 ? 0.72 : 0.52);
      ctx.fillRect(x - 5, 34 - fill, 10, fill);
      if (level >= 0.68) {
        ctx.fillStyle = colorAlpha("#fff4c8", 0.2);
        ctx.fillRect(x - 5, 34 - fill, 10, 4);
      }
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(x - 3, -58, 2, 84);
    }
    drawPencilRect(ctx, -44, -80, 88, 16, 5, { fill: colorAlpha(brass, 0.62), wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1.1 });
    drawPencilRect(ctx, -44, 38, 88, 16, 5, { fill: colorAlpha(brass, 0.62), wash: 0.035, hatch: 0.018, spacing: 5, lineWidth: 1.1 });
    ctx.fillStyle = level > 0.7 ? colorAlpha(red, 0.86) : ink;
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("Hg", 0, -46);
    drawGasStatePill(ctx, level, state, 0, 58, 0.54, { w: 70, h: 21, fontSize: 8, caption: "FLOW" });
    return;
  }

  if (icon === "mailbox") {
    const box = () => {
      ctx.beginPath();
      ctx.moveTo(-64, 20);
      ctx.lineTo(-64, -16);
      ctx.bezierCurveTo(-52, -64, 52, -64, 64, -16);
      ctx.lineTo(64, 34);
      ctx.quadraticCurveTo(34, 54, -42, 44);
      ctx.quadraticCurveTo(-66, 36, -64, 20);
      ctx.closePath();
    };
    drawCastShadow(ctx, box, 4, 5, 0.055);
    box();
    ctx.fillStyle = "rgba(211,48,42,0.9)";
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawPencilRect(ctx, -52, 0, 42, 24, 4, { fill: "rgba(245,237,218,0.78)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
    ctx.fillStyle = level > 0.7 ? colorAlpha(red, 0.92) : ink;
    ctx.font = "bold 9px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("MAIL", -31, 15);
    ctx.fillStyle = colorAlpha(brass, 0.86);
    ctx.beginPath();
    ctx.moveTo(34, -36);
    ctx.lineTo(58, -22 + level * 14);
    ctx.lineTo(36, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorAlpha(pressure, 0.16 + beat * 0.28);
    ctx.fillRect(4, -5, 58, 23);
    ctx.restore();
    drawGasStatePill(ctx, level, state, 24, 8, 0.82, { w: 80, h: 26, fontSize: 10, caption: "GAS" });
    return;
  }

  if (icon === "floppy") {
    drawPencilRect(ctx, -58, -58, 116, 116, 10, { fill: "rgba(82,93,150,0.82)", wash: 0.1, hatch: 0.045, spacing: 7, shadow: 0.045 });
    drawPencilRect(ctx, -42, -44, 72, 34, 3, { fill: "rgba(42,45,50,0.76)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
    drawPencilRect(ctx, -42, -2, 84, 46, 5, { fill: level >= 0.68 ? colorAlpha(pressure, 0.28 + beat * 0.18) : "rgba(246,223,157,0.82)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-16, 18, 9, 0, Math.PI * 2);
    ctx.moveTo(22, 10);
    ctx.quadraticCurveTo(4, 34, -18, 32);
    ctx.stroke();
    ctx.shadowColor = colorAlpha(pressure, 0.14 + beat * 0.3);
    ctx.shadowBlur = 4 + beat * 8;
    ctx.fillStyle = colorAlpha(pressure, level >= 0.96 ? 0.98 : 0.78 + beat * 0.14);
    ctx.fillRect(30, -38, 10, 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = level > 0.7 ? colorAlpha(red, 0.96) : ink;
    ctx.font = "bold 13px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(gasLabelFor(level), 0, 23);
    return;
  }

  if (icon === "roadBarrier") {
    for (let row = 0; row < 2; row += 1) {
      const y = row ? 24 : -22;
      drawPencilRect(ctx, -76, y - 12, 152, 24, 4, { fill: "rgba(22,24,25,0.88)", wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.4 });
      for (let i = -3; i <= 3; i += 1) {
        ctx.save();
        ctx.translate(i * 22, y);
        ctx.rotate(-0.44);
        ctx.fillStyle = colorAlpha(brass, 0.92);
        ctx.fillRect(-6, -18, 12, 36);
        ctx.restore();
      }
    }
    ctx.strokeStyle = "rgba(121,72,32,0.86)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-58, 44);
    ctx.lineTo(-82, 82);
    ctx.moveTo(56, 44);
    ctx.lineTo(82, 82);
    ctx.stroke();
    drawPencilRect(ctx, -35, -7, 70, 18, 4, {
      fill: level > 0.7 ? "rgba(214,52,40,0.68)" : "rgba(245,237,218,0.64)",
      wash: 0.03,
      hatch: 0.015,
      spacing: 5,
      lineWidth: 1.1
    });
    ctx.fillStyle = level > 0.7 ? "rgba(255,244,204,0.92)" : ink;
    ctx.font = "bold 10px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = colorAlpha(pressure, 0.2 + beat * 0.28);
    ctx.shadowBlur = 3 + beat * 7;
    ctx.fillText(gasLabelFor(level), 0, 2);
    ctx.shadowBlur = 0;
    drawRivet(ctx, -54, -22, 3.2);
    drawRivet(ctx, 54, 24, 3.2);
    return;
  }

  if (icon === "trafficLight") {
    drawPencilRect(ctx, -35, -86, 70, 172, 16, { fill: "rgba(28,82,70,0.86)", wash: 0.1, hatch: 0.05, spacing: 6, shadow: 0.05 });
    const lights = [
      { y: -60, color: "#ff2f2f", label: "E", lit: level >= 0.96 },
      { y: -20, color: "#ff8a22", label: "H", lit: level >= 0.68 && level < 0.96 },
      { y: 20, color: "#ffcf57", label: "M", lit: level >= 0.36 && level < 0.68 },
      { y: 60, color: "#48d27a", label: "L", lit: level < 0.36 }
    ];
    for (const light of lights) {
      const lightBeat = light.lit ? beat : beat * 0.22;
      ctx.save();
      ctx.shadowColor = colorAlpha(light.color, light.lit ? 0.18 + beat * 0.42 : 0.06 + beat * 0.08);
      ctx.shadowBlur = light.lit ? 8 + beat * 16 : 2 + beat * 4;
      ctx.fillStyle = colorAlpha(light.color, light.lit ? 0.82 + lightBeat * 0.18 : 0.22 + lightBeat * 0.12);
      ctx.beginPath();
      ctx.arc(0, light.y, 13.8 + (light.lit ? beat * 1.8 : 0), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = light.lit ? "rgba(12,16,17,0.76)" : colorAlpha(light.color, 0.72);
      ctx.font = "bold 7px ui-monospace, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(light.label, 0, light.y + 0.5);
      if (light.lit) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = colorAlpha(light.color, 0.18 + beat * 0.3);
        ctx.beginPath();
        ctx.arc(0, light.y, 26 + beat * 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = colorAlpha(light.color, 0.42 + beat * 0.28);
        ctx.lineWidth = 3.6 + beat * 2;
        ctx.beginPath();
        ctx.arc(0, light.y, 20 + beat * 2.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    drawGasStatePill(ctx, level, state, 0, 78, 0.7, { w: 78, h: 25, fontSize: 10 });
    return;
  }

  if (icon === "whaleVent") {
    const whale = () => {
      ctx.beginPath();
      ctx.moveTo(-70, 8);
      ctx.bezierCurveTo(-34, -54, 56, -52, 78, 2);
      ctx.quadraticCurveTo(48, 44, -24, 42);
      ctx.quadraticCurveTo(-58, 38, -70, 8);
      ctx.closePath();
    };
    drawCastShadow(ctx, whale, 4, 5, 0.045);
    whale();
    ctx.fillStyle = colorAlpha(liquid.accent, 0.68);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    ctx.ellipse(-22, -12, 22, 10, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colorAlpha(liquid.accent, 0.72);
    ctx.lineWidth = 3;
    const pulse = Math.sin((state.time || 0) * (3 + level * 4)) * 8;
    roughBezier(ctx, [[2, -42], [-18, -78 - pulse], [-44, -70], [-54, -102 - pulse]], 0.6, 2301);
    roughBezier(ctx, [[8, -42], [24, -80 - pulse], [48, -72], [60, -104 - pulse]], 0.6, 2302);
    ctx.beginPath();
    ctx.arc(44, -8, 4, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
    ctx.fillStyle = level > 0.68 ? colorAlpha(pressure, 0.84) : colorAlpha(cyan, 0.72);
    ctx.beginPath();
    ctx.arc(6, -26, 7 + level * 4, 0, Math.PI * 2);
    ctx.fill();
    drawPencilRect(ctx, -30, 9, 82, 27, 8, { fill: "rgba(4,10,12,0.68)", wash: 0.03, hatch: 0.015, spacing: 5, lineWidth: 1 });
    drawGasStatePill(ctx, level, state, 12, 21, 0.82, { w: 80, h: 26, fontSize: 10, caption: "VENT" });
    return;
  }

  if (icon === "battery") {
    drawPencilRect(ctx, -44, -62, 88, 124, 12, { fill: "rgba(202,232,232,0.76)", wash: 0.09, hatch: 0.04, spacing: 6, shadow: 0.04 });
    drawPencilRect(ctx, -20, -78, 40, 18, 7, { fill: colorAlpha(brass, 0.7), wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
    const barColors = ["#48d27a", "#46c7d1", "#ffcf57", "#ff8a22", "#ff2f2f"];
    for (let i = 0; i < 5; i += 1) {
      const lit = i / 4 <= level;
      const barColor = barColors[i] || pressure;
      if (lit) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = colorAlpha(barColor, 0.05 + beat * 0.16 + level * 0.05);
        ctx.fillRect(-34, 32 - i * 22, 68, 20);
        ctx.restore();
      }
      drawPencilRect(ctx, -28, 36 - i * 22, 56, 12, 4, { fill: lit ? colorAlpha(barColor, Math.min(1, (level >= 0.68 ? 0.8 : 0.68) + beat * 0.2)) : "rgba(18,22,25,0.18)", wash: 0.02, hatch: 0.015, spacing: 5, lineWidth: 1 });
      if (lit && i >= 3) {
        ctx.fillStyle = colorAlpha(barColor, 0.12 + beat * 0.18);
        ctx.fillRect(-34, 32 - i * 22, 68, 20);
      }
    }
    drawGasStatePill(ctx, level, state, 0, 68, 0.66, { w: 74, h: 25, fontSize: 10 });
    return;
  }

  if (icon === "gasCanister" || icon === "dragonFurnace") {
    const can = () => {
      ctx.beginPath();
      ctx.roundRect(-34, -72, 68, 132, 24);
    };
    if (level >= 0.68) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = colorAlpha(pressure, 0.1 + beat * 0.18 + level * 0.08);
      ctx.beginPath();
      ctx.ellipse(0, -6, 56 + beat * 10, 90 + beat * 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    can();
    ctx.fillStyle = icon === "dragonFurnace" ? "rgba(88,45,32,0.82)" : "rgba(140,68,46,0.82)";
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    drawPackUtilityPort(ctx, 0, -42, 32, { color: brass, fill: "rgba(70,45,32,0.68)" });
    drawPencilRect(ctx, -29, -20, 58, 48, 8, { fill: level > 0.75 ? colorAlpha(pressure, 0.78 + beat * 0.14) : colorAlpha(cyan, 0.46), wash: 0.04, hatch: 0.02, spacing: 5, lineWidth: 1.2 });
    drawGasStatePill(ctx, level, state, 0, 6, 0.7, { w: 74, h: 25, fontSize: 10, caption: icon === "dragonFurnace" ? "BURN" : "GAS" });
    ctx.strokeStyle = colorAlpha(brass, 0.82);
    ctx.lineWidth = 3;
    roughBezier(ctx, [[-18, -48], [6, -32], [8, 4], [-8, 36]], 0.5, 2402);
    return;
  }

  if (icon === "miniFan") {
    drawPencilRect(ctx, -54, -54, 108, 108, 18, { fill: "rgba(235,226,207,0.82)", wash: 0.08, hatch: 0.04, spacing: 6, shadow: 0.04 });
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(pressure, 0.12 + level * 0.18 + beat * 0.2);
    ctx.lineWidth = 2 + level * 3;
    ctx.setLineDash([10, 9 - Math.min(6, level * 6)]);
    const swirl = (state.time || 0) * (1.2 + level * 7);
    for (const r of [34, 48, 62]) {
      ctx.beginPath();
      ctx.arc(0, 0, r, swirl, swirl + Math.PI * (0.7 + level * 0.5));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
    ctx.save();
    ctx.rotate((state.time || 0) * (0.8 + level * 18));
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = level >= 0.68 ? colorAlpha(pressure, 0.35 + beat * 0.2) : "rgba(18,22,25,0.55)";
      ctx.beginPath();
      ctx.ellipse(0, -24, 11, 31, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    drawRivet(ctx, 0, 0, 6);
    drawGasStatePill(ctx, level, state, 0, 54, 0.66, { w: 76, h: 24, fontSize: 10, text: level >= 0.68 ? "FAST" : gasLabelFor(level) });
    return;
  }

  drawPackUtilityPort(ctx, 0, -8, 38, { color: brass, fill: "rgba(30,42,42,0.66)" });
  } finally {
    if (part.liveGasMeter && !integratedGasIcons.has(icon)) {
      drawPackIconReaderBadge(ctx, level, style, { ...state });
    }
    ctx.restore();
  }
}

function drawBolt(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const boltPath = () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(angle) * 16;
      const y = Math.sin(angle) * 16;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  };
  drawCastShadow(ctx, boltPath, 2.5, 3.5, 0.06);
  pencilShade(ctx, boltPath, { x: -17, y: -17, w: 34, h: 34 }, { wash: 0.14, hatch: 0.07, cross: 0.03, spacing: 5 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  boltPath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDot(ctx, part) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawChain(ctx, part) {
  setup(ctx, part, 2, 0.7);
  for (let i = -4; i <= 4; i++) {
    ctx.save();
    ctx.translate(3, 4);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(i * 18, 0, 14, 8, i % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(i * 18, 0, 14, 8, i % 2 ? Math.PI / 2 : 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawValve(ctx, part, state) {
  drawStraightPipe(ctx, part, state);
  setup(ctx, part, 2, 0.82);
  const knob = () => {
    ctx.beginPath();
    ctx.arc(0, -48, 26, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, knob, 3, 5, 0.06);
  pencilShade(ctx, knob, { x: -28, y: -76, w: 56, h: 56 }, { wash: 0.11, hatch: 0.065, cross: 0.025, spacing: 6 });
  ctx.beginPath();
  ctx.arc(0, -48, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-20, -48);
  ctx.lineTo(20, -48);
  ctx.moveTo(0, -68);
  ctx.lineTo(0, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -48);
  ctx.stroke();
}

function drawCoil(ctx, part) {
  setup(ctx, part, 2, 0.82);
  drawPencilRect(ctx, -30, -90, 60, 180, 8, { wash: 0.13, hatch: 0.075, cross: 0.03, spacing: 6, shadow: 0.065 });
  for (let y = -70; y <= 70; y += 18) {
    ctx.save();
    ctx.translate(3, 4);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-42, y);
    ctx.bezierCurveTo(-10, y - 16, 10, y + 16, 42, y);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-42, y);
    ctx.bezierCurveTo(-10, y - 16, 10, y + 16, 42, y);
    ctx.stroke();
  }
  drawConnectorMark(ctx, 0, 100);
}

function drawLiquidDrop(ctx, part, state) {
  const theme = liquidTheme(state);
  setup(ctx, part, 1.8, 0.7);
  ctx.strokeStyle = colorAlpha(theme.accent, 0.82);
  const dropPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(28, 8, 18, 38, 0, 38);
    ctx.bezierCurveTo(-18, 38, -28, 8, 0, -26);
  };
  drawCastShadow(ctx, dropPath, 3, 4, 0.05);
  const gradient = ctx.createRadialGradient(-9, -8, 2, 0, 9, 42);
  gradient.addColorStop(0, "rgba(255,255,255,0.58)");
  gradient.addColorStop(0.32, colorAlpha(theme.accent, 0.42));
  gradient.addColorStop(0.62, colorAlpha(theme.base, 0.5));
  gradient.addColorStop(1, "rgba(18,22,25,0.16)");
  ctx.fillStyle = gradient;
  dropPath();
  ctx.fill();
  ctx.save();
  dropPath();
  ctx.clip();
  drawLiquidInnerArt(ctx, -18, theme, { ...state, fillLevel: 80 }, { x: -28, y: -28, w: 56, h: 70 });
  ctx.restore();
  pencilShade(ctx, dropPath, { x: -28, y: -28, w: 56, h: 70 }, { wash: 0.035, hatch: 0.018, cross: 0, spacing: 7, texture: 0.025 });
  dropPath();
  ctx.stroke();
}

function drawSmokeCurl(ctx, part) {
  setup(ctx, part, 2, 0.58);
  ctx.strokeStyle = "rgba(18,22,25,0.2)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-18, 28);
  ctx.bezierCurveTo(-44, 0, 22, -4, -12, -34);
  ctx.bezierCurveTo(-32, -55, 38, -56, 10, -84);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-20, 27);
  ctx.bezierCurveTo(-40, 2, 18, -6, -9, -32);
  ctx.bezierCurveTo(-27, -52, 32, -54, 8, -82);
  ctx.stroke();
}

function drawSpark(ctx, part) {
  setup(ctx, part, 1.8, 0.74);
  const spark = () => {
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(8, -8);
    ctx.lineTo(34, 0);
    ctx.lineTo(8, 8);
    ctx.lineTo(0, 34);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-34, 0);
    ctx.lineTo(-8, -8);
    ctx.closePath();
  };
  drawCastShadow(ctx, spark, 2, 3, 0.04);
  pencilShade(ctx, spark, { x: -34, y: -34, w: 68, h: 68 }, { wash: 0.08, hatch: 0.04, cross: 0.015, spacing: 7 });
  ctx.strokeStyle = INK;
  ctx.beginPath();
  spark();
  ctx.stroke();
}

function drawFrameBox(ctx, part) {
  const style = setup(ctx, part, 1.4, 0.28);
  const isDarkFrame = part.material === "pfpBlack" || part.material === "blackChrome";
  ctx.fillStyle = isDarkFrame ? "rgba(23,58,57,0.3)" : colorAlpha(style.fill || "#cad3d4", 0.28);
  ctx.fillRect(-64, -64, 128, 128);
  if (isDarkFrame) {
    const wash = ctx.createLinearGradient(-64, -64, 64, 64);
    wash.addColorStop(0, "rgba(255,255,255,0.1)");
    wash.addColorStop(0.58, "rgba(32,91,88,0.08)");
    wash.addColorStop(1, "rgba(4,18,18,0.16)");
    ctx.fillStyle = wash;
    ctx.fillRect(-64, -64, 128, 128);
  }
  ctx.strokeRect(-64, -64, 128, 128);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-56, -56, 112, 112);
}

function drawCrownGear(ctx, part, state) {
  drawGear(ctx, part, state, 66, 34);
  setup(ctx, part, 1.6, 0.7);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    const tooth = () => {
      ctx.beginPath();
      ctx.moveTo(58, -7);
      ctx.lineTo(84, 0);
      ctx.lineTo(58, 7);
      ctx.closePath();
    };
    pencilShade(ctx, tooth, { x: 54, y: -10, w: 32, h: 20 }, { wash: 0.08, hatch: 0.045, cross: 0.015, spacing: 5 });
    tooth();
    ctx.stroke();
    ctx.restore();
  }
}

function drawMercuryTank(ctx, part, state = {}) {
  drawTank(ctx, part, {
    ...state,
    colorIndex: 5,
    liquidColor: LIQUID_PALETTE[5],
    liquidAccent: LIQUID_ACCENTS[5],
    liquidGlow: LIQUID_GLOWS[5],
    texture: state.texture || "Metallic",
    fillLevel: state.fillLevel ?? 82
  });
  setup(ctx, part, 1.4, 0.58);
  ctx.strokeStyle = "rgba(18,22,25,0.36)";
  for (let i = 0; i < 5; i++) {
    const y = -34 + i * 18;
    ctx.beginPath();
    ctx.ellipse(0, y, 24 - i * 2, 8, Math.sin((state.time || 0) + i) * 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGhostPipe(ctx, part, state) {
  setup(ctx, part, 1.9, 0.74);
  ctx.save();
  ctx.translate(5, 7);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 38;
  ctx.beginPath();
  ctx.moveTo(-72, 16);
  ctx.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(18,22,25,0.16)";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(-72, 16);
  ctx.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx.stroke();
  drawHatching(ctx, { x: -82, y: -48, w: 164, h: 86 }, -0.7, 9, 0.05, 0.65);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-72, 16);
  ctx.bezierCurveTo(-38, -38, 30, -36, 72, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-56, 16);
  ctx.bezierCurveTo(-30, -16, 22, -16, 56, 10);
  ctx.stroke();
  drawPencilRect(ctx, -82, 4, 26, 34, 5, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawPencilRect(ctx, 56, -6, 26, 34, 5, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawFlowLine(ctx, -54, 16, 54, 10, state);
  drawConnectorMark(ctx, -76, 16);
  drawConnectorMark(ctx, 76, 10);
}

function drawCompactSpring(ctx, part) {
  setup(ctx, part, 1.8, 0.72);
  ctx.save();
  ctx.translate(4, 5);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 7;
  for (let x = -62; x <= 62; x += 14) {
    ctx.beginPath();
    ctx.ellipse(x, 0, 12, 19, Math.PI / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  for (let x = -62; x <= 62; x += 14) {
    ctx.beginPath();
    ctx.ellipse(x, 0, 12, 19, Math.PI / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  roughLine(ctx, -86, 0, -66, 0, 0.8, 5, 9);
  roughLine(ctx, 66, 0, 86, 0, 0.8, 5, 19);
}

function drawCornerBracket(ctx, part) {
  setup(ctx, part, 1.8, 0.78);
  const bracket = () => {
    ctx.beginPath();
    ctx.moveTo(-60, -44);
    ctx.lineTo(36, -44);
    ctx.lineTo(36, -20);
    ctx.lineTo(-32, -20);
    ctx.lineTo(-32, 48);
    ctx.lineTo(-60, 48);
    ctx.closePath();
  };
  drawCastShadow(ctx, bracket, 4, 6, 0.055);
  pencilShade(ctx, bracket, { x: -62, y: -46, w: 102, h: 98 }, { wash: 0.11, hatch: 0.07, cross: 0.025, spacing: 6 });
  bracket();
  ctx.stroke();
  for (const [x, y] of [[-46, -32], [20, -32], [-46, 34], [-46, 0]]) drawRivet(ctx, x, y, 3.2);
}

function drawRivetStrip(ctx, part) {
  setup(ctx, part, 1.5, 0.7);
  drawPencilRect(ctx, -82, -14, 164, 28, 5, { wash: 0.095, hatch: 0.055, cross: 0.018, spacing: 6, shadow: 0.045 });
  for (let x = -60; x <= 60; x += 24) drawRivet(ctx, x, 0, 4);
}

function drawClockHand(ctx, part) {
  setup(ctx, part, 1.5, 0.78);
  const hand = () => {
    ctx.beginPath();
    ctx.moveTo(-16, -5);
    ctx.lineTo(74, -3);
    ctx.lineTo(88, 0);
    ctx.lineTo(74, 3);
    ctx.lineTo(-16, 5);
    ctx.closePath();
  };
  drawCastShadow(ctx, hand, 3, 4, 0.045);
  pencilShade(ctx, hand, { x: -18, y: -8, w: 108, h: 16 }, { wash: 0.09, hatch: 0.05, cross: 0.01, spacing: 5 });
  hand();
  ctx.stroke();
  roughCircle(ctx, -16, 0, 9, 0.7, 34);
  roughCircle(ctx, 26, 0, 3, 0.4, 35);
}

function drawGearToothShard(ctx, part) {
  setup(ctx, part, 1.6, 0.76);
  const shard = () => {
    ctx.beginPath();
    ctx.moveTo(-32, 28);
    ctx.lineTo(-10, -30);
    ctx.lineTo(14, -10);
    ctx.lineTo(34, -34);
    ctx.lineTo(28, 28);
    ctx.closePath();
  };
  drawCastShadow(ctx, shard, 3, 4, 0.045);
  pencilShade(ctx, shard, { x: -34, y: -36, w: 70, h: 66 }, { wash: 0.12, hatch: 0.075, cross: 0.03, spacing: 6 });
  shard();
  ctx.stroke();
  roughLine(ctx, -18, 18, 22, 18, 0.8, 8, 52);
}

function drawGraphiteMark(ctx, part) {
  setup(ctx, part, 1.2, 0.42);
  ctx.strokeStyle = "rgba(18,22,25,0.26)";
  for (let i = 0; i < 7; i++) {
    roughBezier(ctx, [
      [-52 + i * 4, 16 - i * 3],
      [-24, -20 - i],
      [28, -18 + i],
      [58 - i * 3, 12 + i * 2]
    ], 1.8, 80 + i * 17);
  }
}

function drawLightningArc(ctx, part) {
  setup(ctx, part, 1.5, 0.72);
  const arc = () => {
    ctx.beginPath();
    ctx.moveTo(-58, 12);
    ctx.lineTo(-26, -24);
    ctx.lineTo(-6, -8);
    ctx.lineTo(22, -38);
    ctx.lineTo(10, -6);
    ctx.lineTo(54, -12);
  };
  ctx.strokeStyle = "rgba(18,22,25,0.16)";
  ctx.lineWidth = 7;
  arc();
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  arc();
  ctx.stroke();
}

function drawApertureLens(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 4, 5, 0.055);
  pencilShade(ctx, outer, { x: -50, y: -50, w: 100, h: 100 }, { wash: 0.11, hatch: 0.055, cross: 0.02, spacing: 7 });
  outer();
  ctx.stroke();
  roughCircle(ctx, 0, 0, 28, 0.8, 22);
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(34, -18);
    ctx.lineTo(28, 10);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

function drawNotchedRail(ctx, part) {
  setup(ctx, part, 1.7, 0.76);
  drawPencilRect(ctx, -96, -18, 192, 36, 4, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 7, shadow: 0.045 });
  for (let x = -72; x <= 72; x += 24) {
    roughLine(ctx, x, -16, x + 10, 16, 0.8, 5, x + 200);
  }
}

function drawSamuraiKabuto(ctx, part) {
  const style = setup(ctx, part, 2, 0.82);
  const gold = style.highlight || "#d7a13a";
  const shellFill = colorAlpha(style.fill || "#24282a", 0.9);

  const brim = () => {
    ctx.beginPath();
    ctx.moveTo(-152, 26);
    ctx.quadraticCurveTo(-96, -4, -52, 8);
    ctx.quadraticCurveTo(0, 18, 54, 6);
    ctx.quadraticCurveTo(102, -4, 154, 28);
    ctx.lineTo(124, 44);
    ctx.quadraticCurveTo(48, 34, 0, 40);
    ctx.quadraticCurveTo(-54, 34, -126, 44);
    ctx.closePath();
  };
  const bowl = () => {
    ctx.beginPath();
    ctx.moveTo(-84, 28);
    ctx.bezierCurveTo(-74, -48, -28, -78, 0, -80);
    ctx.bezierCurveTo(34, -78, 76, -48, 86, 28);
    ctx.quadraticCurveTo(34, 52, 0, 48);
    ctx.quadraticCurveTo(-38, 52, -84, 28);
    ctx.closePath();
  };

  drawCastShadow(ctx, brim, 4, 7, 0.06);
  brim();
  ctx.fillStyle = colorAlpha(gold, 0.74);
  ctx.fill();
  pencilShade(ctx, brim, { x: -154, y: -6, w: 308, h: 54 }, { wash: 0.12, hatch: 0.065, cross: 0.02, spacing: 7, texture: 0.04 });
  ctx.strokeStyle = "rgba(55,35,14,0.82)";
  ctx.lineWidth = 2.2;
  brim();
  ctx.stroke();

  drawCastShadow(ctx, bowl, 3, 5, 0.055);
  bowl();
  ctx.fillStyle = shellFill;
  ctx.fill();
  pencilShade(ctx, bowl, { x: -88, y: -84, w: 176, h: 136 }, { wash: 0.16, hatch: 0.09, cross: 0.032, spacing: 7, texture: 0.065 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  bowl();
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = colorAlpha(gold, 0.74);
  ctx.lineWidth = 3.2;
  roughBezier(ctx, [[0, -72], [-10, -24], [-8, 18], [0, 42]], 0.5, 701);
  roughBezier(ctx, [[-46, -36], [-26, -54], [28, -54], [50, -34]], 0.55, 702);
  ctx.restore();

  for (let i = 0; i < 4; i += 1) {
    const y = 34 + i * 15;
    const w = 94 + i * 26;
    const guard = () => {
      ctx.beginPath();
      ctx.moveTo(-w, y - 8);
      ctx.quadraticCurveTo(-44, y + 12, 0, y + 8);
      ctx.quadraticCurveTo(48, y + 12, w, y - 8);
      ctx.lineTo(w - 10, y + 9);
      ctx.quadraticCurveTo(42, y + 24, 0, y + 20);
      ctx.quadraticCurveTo(-42, y + 24, -w + 10, y + 9);
      ctx.closePath();
    };
    guard();
    ctx.fillStyle = i % 2 ? colorAlpha(gold, 0.52) : "rgba(23,29,28,0.78)";
    ctx.fill();
    pencilShade(ctx, guard, { x: -w, y: y - 10, w: w * 2, h: 34 }, { wash: 0.09, hatch: 0.048, cross: 0.014, spacing: 7, texture: 0.032 });
    ctx.strokeStyle = i % 2 ? "rgba(98,61,14,0.74)" : "rgba(18,22,25,0.78)";
    ctx.lineWidth = 1.45;
    guard();
    ctx.stroke();
    for (let x = -w + 26; x <= w - 20; x += 32) drawRivet(ctx, x, y + 5, 2.4);
  }

  ctx.save();
  ctx.strokeStyle = colorAlpha(gold, 0.88);
  ctx.lineWidth = 4.2;
  roughBezier(ctx, [[-11, -67], [-48, -92], [-82, -86], [-104, -58]], 0.7, 703);
  roughBezier(ctx, [[11, -67], [48, -92], [82, -86], [104, -58]], 0.7, 704);
  ctx.lineWidth = 2.2;
  roughBezier(ctx, [[0, -82], [-16, -108], [0, -124], [18, -106]], 0.6, 705);
  ctx.restore();

  drawRivet(ctx, 0, -22, 5.4);
  for (const x of [-122, 122, -68, 68]) drawRivet(ctx, x, 32, 3.2);
}

function drawKatanaPeek(ctx, part) {
  const style = setup(ctx, part, 1.6, 0.82);
  const steel = style.highlight || "#d9e4df";
  ctx.rotate(-0.34);

  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-8, -132);
    ctx.bezierCurveTo(-22, -94, -20, -54, -8, -20);
    ctx.lineTo(10, 42);
    ctx.lineTo(22, 40);
    ctx.bezierCurveTo(10, -24, 8, -82, 10, -132);
    ctx.quadraticCurveTo(1, -148, -8, -132);
    ctx.closePath();
  };

  drawCastShadow(ctx, blade, 3, 5, 0.05);
  blade();
  const bladeFill = ctx.createLinearGradient(-18, -126, 24, 42);
  bladeFill.addColorStop(0, "rgba(247,252,241,0.82)");
  bladeFill.addColorStop(0.46, colorAlpha(steel, 0.64));
  bladeFill.addColorStop(1, "rgba(129,151,142,0.68)");
  ctx.fillStyle = bladeFill;
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.66)";
  ctx.lineWidth = 1.8;
  blade();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 1;
  roughBezier(ctx, [[-1, -118], [-7, -74], [-4, -28], [10, 36]], 0.35, 711);

  ctx.save();
  ctx.translate(12, 54);
  ctx.rotate(0.22);
  drawPencilRect(ctx, -42, -9, 84, 18, 8, { fill: colorAlpha("#d7a13a", 0.78), wash: 0.08, hatch: 0.04, cross: 0.01, spacing: 5, shadow: 0.025, lineWidth: 1.3 });
  drawRivet(ctx, -22, 0, 2.6);
  drawRivet(ctx, 22, 0, 2.6);
  ctx.restore();

  const handle = () => {
    ctx.beginPath();
    ctx.roundRect(-14, 66, 28, 112, 8);
  };
  handle();
  ctx.fillStyle = "rgba(22,24,25,0.88)";
  ctx.fill();
  pencilShade(ctx, handle, { x: -14, y: 66, w: 28, h: 112 }, { wash: 0.09, hatch: 0.045, cross: 0.015, spacing: 5, texture: 0.03 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  handle();
  ctx.stroke();
  ctx.strokeStyle = colorAlpha("#d7a13a", 0.82);
  ctx.lineWidth = 1.5;
  for (let y = 76; y <= 160; y += 14) {
    roughLine(ctx, -12, y, 12, y + 8, 0.35, 4, 720 + y);
    roughLine(ctx, 12, y, -12, y + 8, 0.35, 4, 820 + y);
  }
  drawRivet(ctx, 0, 182, 3.2);
}

function drawLampBulbHead(ctx, part) {
  setup(ctx, part, 2, 0.78);
  const bulb = () => {
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.bezierCurveTo(-74, -112, -116, -56, -108, 12);
    ctx.bezierCurveTo(-102, 62, -58, 84, -34, 104);
    ctx.lineTo(-28, 126);
    ctx.lineTo(28, 126);
    ctx.lineTo(34, 104);
    ctx.bezierCurveTo(58, 84, 102, 62, 108, 12);
    ctx.bezierCurveTo(116, -56, 74, -112, 0, -118);
    ctx.closePath();
  };

  drawCastShadow(ctx, bulb, 5, 8, 0.05);
  bulb();
  const glass = ctx.createRadialGradient(-26, -42, 6, 0, 8, 130);
  glass.addColorStop(0, "rgba(255,255,205,0.5)");
  glass.addColorStop(0.46, "rgba(126,232,212,0.18)");
  glass.addColorStop(1, "rgba(30,82,78,0.12)");
  ctx.fillStyle = glass;
  ctx.fill();
  pencilShade(ctx, bulb, { x: -112, y: -122, w: 224, h: 250 }, { wash: 0.045, hatch: 0.018, cross: 0.006, spacing: 10, texture: 0.018 });
  ctx.strokeStyle = "rgba(16,22,22,0.72)";
  ctx.lineWidth = 2.2;
  bulb();
  ctx.stroke();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,230,96,0.72)";
  ctx.lineWidth = 5;
  roughBezier(ctx, [[-44, 26], [-24, -10], [-10, 34], [0, 8]], 0.55, 910);
  roughBezier(ctx, [[0, 8], [16, -16], [24, 34], [44, 20]], 0.55, 911);
  ctx.strokeStyle = "rgba(255,255,198,0.46)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-36, 44], [-18, 18], [18, 18], [36, 44]], 0.4, 912);
  ctx.restore();

  ctx.strokeStyle = "rgba(215,161,58,0.84)";
  ctx.lineWidth = 2.4;
  roughLine(ctx, -32, 90, -12, 44, 0.4, 5, 913);
  roughLine(ctx, 32, 90, 12, 44, 0.4, 5, 914);

  for (let i = 0; i < 5; i += 1) {
    const y = 112 + i * 16;
    drawPencilRect(ctx, -52 + (i % 2) * 4, y, 104 - (i % 2) * 8, 13, 5, {
      fill: i % 2 ? "rgba(188,136,44,0.78)" : "rgba(219,172,64,0.86)",
      wash: 0.07,
      hatch: 0.035,
      cross: 0.012,
      spacing: 5,
      shadow: 0.025,
      lineWidth: 1.2
    });
  }
  drawRivet(ctx, -78, 30, 3);
  drawRivet(ctx, 78, 30, 3);
}

function drawFrankensteinMonsterHead(ctx, part) {
  setup(ctx, part, 2.1, 0.82);
  const head = () => {
    ctx.beginPath();
    ctx.moveTo(-84, -112);
    ctx.lineTo(82, -108);
    ctx.lineTo(92, 54);
    ctx.quadraticCurveTo(54, 106, 0, 108);
    ctx.quadraticCurveTo(-58, 106, -94, 52);
    ctx.closePath();
  };

  drawCastShadow(ctx, head, 5, 7, 0.055);
  head();
  ctx.fillStyle = "rgba(86,138,77,0.86)";
  ctx.fill();
  pencilShade(ctx, head, { x: -96, y: -116, w: 192, h: 226 }, { wash: 0.13, hatch: 0.07, cross: 0.026, spacing: 7, texture: 0.06 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.3;
  head();
  ctx.stroke();

  drawPencilRect(ctx, -88, -122, 176, 28, 5, { fill: "rgba(18,22,25,0.9)", wash: 0.07, hatch: 0.035, spacing: 5, shadow: 0.03, lineWidth: 1.5 });
  drawPencilRect(ctx, -80, -38, 160, 24, 6, { fill: "rgba(18,22,25,0.7)", wash: 0.04, hatch: 0.02, spacing: 5, shadow: 0.02, lineWidth: 1.2 });

  ctx.strokeStyle = "rgba(18,22,25,0.74)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-52, -76], [-32, -58], [-12, -82], [12, -58]], 0.55, 930);
  roughBezier(ctx, [[18, -58], [36, -82], [58, -66], [74, -84]], 0.55, 931);
  for (let x = -38; x <= 54; x += 18) {
    roughLine(ctx, x, -72, x + 8, -60, 0.3, 3, 940 + x);
  }

  for (const [x, y, rot] of [[-112, 10, 1.5708], [112, 10, 1.5708]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawPencilRect(ctx, -28, -9, 56, 18, 7, { fill: "rgba(210,196,166,0.78)", wash: 0.06, hatch: 0.03, spacing: 5, shadow: 0.025, lineWidth: 1.3 });
    ctx.restore();
  }
  drawPencilRect(ctx, -48, 90, 96, 28, 8, { fill: "rgba(18,22,25,0.58)", wash: 0.06, hatch: 0.03, spacing: 6, shadow: 0.025, lineWidth: 1.2 });
  drawRivet(ctx, -72, -92, 3.4);
  drawRivet(ctx, 72, -88, 3.4);
  drawRivet(ctx, -70, 58, 3.2);
  drawRivet(ctx, 70, 58, 3.2);
}

function drawSpacemanHelmetHead(ctx, part) {
  setup(ctx, part, 2.2, 0.78);
  const ring = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 114, 124, -0.04, 0, Math.PI * 2);
  };
  const visor = () => {
    ctx.beginPath();
    ctx.moveTo(-76, -34);
    ctx.bezierCurveTo(-46, -74, 48, -76, 82, -30);
    ctx.lineTo(72, 34);
    ctx.bezierCurveTo(28, 60, -40, 58, -74, 26);
    ctx.closePath();
  };

  drawCastShadow(ctx, ring, 5, 7, 0.045);
  ring();
  ctx.fillStyle = "rgba(201,238,232,0.28)";
  ctx.fill();
  pencilShade(ctx, ring, { x: -116, y: -126, w: 232, h: 252 }, { wash: 0.045, hatch: 0.018, cross: 0.006, spacing: 10, texture: 0.02 });
  ctx.strokeStyle = "rgba(18,22,25,0.58)";
  ctx.lineWidth = 2.4;
  ring();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 98, 106, -0.04, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(215,161,58,0.78)";
  ctx.lineWidth = 6;
  ctx.stroke();

  visor();
  const visorFill = ctx.createLinearGradient(-70, -70, 80, 52);
  visorFill.addColorStop(0, "rgba(5,16,18,0.86)");
  visorFill.addColorStop(0.5, "rgba(12,55,58,0.76)");
  visorFill.addColorStop(1, "rgba(8,12,13,0.9)");
  ctx.fillStyle = visorFill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  visor();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-58, -50], [-22, -68], [30, -66], [62, -38]], 0.35, 950);
  roughBezier(ctx, [[-52, -22], [-16, -34], [34, -34], [58, -16]], 0.3, 951);

  for (const [x, y] of [[-116, 0], [116, 2]]) {
    drawPencilRect(ctx, x - 18, y - 38, 36, 76, 9, { fill: "rgba(221,234,230,0.62)", wash: 0.06, hatch: 0.025, spacing: 6, shadow: 0.025, lineWidth: 1.3 });
  }
  drawPencilRect(ctx, -74, 102, 148, 32, 11, { fill: "rgba(218,223,208,0.76)", wash: 0.07, hatch: 0.032, spacing: 6, shadow: 0.025, lineWidth: 1.4 });
  for (const x of [-70, -35, 0, 35, 70]) drawRivet(ctx, x, 116, 3);
}

function drawOldComputerCrtHead(ctx, part) {
  setup(ctx, part, 2, 0.82);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-120, -100);
    ctx.lineTo(102, -112);
    ctx.quadraticCurveTo(132, -92, 130, -50);
    ctx.lineTo(120, 88);
    ctx.quadraticCurveTo(100, 120, 58, 124);
    ctx.lineTo(-88, 112);
    ctx.quadraticCurveTo(-130, 96, -134, 56);
    ctx.lineTo(-134, -56);
    ctx.quadraticCurveTo(-134, -86, -120, -100);
    ctx.closePath();
  };
  const screen = () => {
    ctx.beginPath();
    ctx.roundRect(-82, -58, 142, 88, 13);
  };

  drawCastShadow(ctx, body, 5, 7, 0.055);
  body();
  const shell = ctx.createLinearGradient(-132, -112, 132, 124);
  shell.addColorStop(0, "rgba(232,228,203,0.92)");
  shell.addColorStop(0.46, "rgba(178,181,162,0.88)");
  shell.addColorStop(1, "rgba(114,120,112,0.84)");
  ctx.fillStyle = shell;
  ctx.fill();
  pencilShade(ctx, body, { x: -130, y: -112, w: 260, h: 236 }, { wash: 0.12, hatch: 0.06, cross: 0.02, spacing: 7, texture: 0.055 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.3;
  body();
  ctx.stroke();

  drawPencilRect(ctx, -98, -74, 174, 120, 16, {
    fill: "rgba(78,86,82,0.72)",
    wash: 0.07,
    hatch: 0.034,
    spacing: 6,
    shadow: 0.03,
    lineWidth: 1.5
  });
  screen();
  const glass = ctx.createRadialGradient(-28, -22, 7, -4, -12, 96);
  glass.addColorStop(0, "rgba(20,46,43,0.96)");
  glass.addColorStop(0.48, "rgba(4,11,12,0.94)");
  glass.addColorStop(1, "rgba(0,0,0,0.98)");
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = "rgba(12,16,17,0.82)";
  ctx.lineWidth = 2.4;
  screen();
  ctx.stroke();
  ctx.save();
  screen();
  ctx.clip();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(-82, -58, 142, 88);
  ctx.strokeStyle = "rgba(104,255,220,0.14)";
  ctx.lineWidth = 1;
  for (let y = -48; y <= 18; y += 10) roughLine(ctx, -74, y, 50, y + 1, 0.25, 5, 970 + y);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  roughLine(ctx, -68, -44, 44, -50, 0.24, 4, 976);
  ctx.restore();

  drawPencilRect(ctx, 70, -48, 36, 90, 7, { fill: "rgba(152,158,148,0.76)", wash: 0.07, hatch: 0.032, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  for (let y = -31; y <= 13; y += 11) roughLine(ctx, 76, y, 100, y, 0.25, 4, 980 + y);
  for (const [x, y] of [[86, 48], [102, 58], [74, 62]]) drawRivet(ctx, x, y, 3.1);
  drawPencilRect(ctx, -78, 70, 168, 28, 7, { fill: "rgba(28,32,32,0.82)", wash: 0.04, hatch: 0.02, spacing: 5, shadow: 0.025, lineWidth: 1.2 });
  drawPencilRect(ctx, -60, 96, 126, 22, 6, { fill: "rgba(179,181,165,0.72)", wash: 0.055, hatch: 0.024, spacing: 5, shadow: 0.02, lineWidth: 1.1 });
  for (const x of [-96, -34, 30, 94]) drawRivet(ctx, x, -88, 3.2);
  for (const x of [-86, -28, 34, 92]) drawRivet(ctx, x, 92, 2.8);
}

function drawGameboyDmgHead(ctx, part) {
  setup(ctx, part, 2.05, 0.82);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-86, -118);
    ctx.lineTo(82, -118);
    ctx.quadraticCurveTo(104, -112, 106, -88);
    ctx.lineTo(100, 104);
    ctx.quadraticCurveTo(92, 128, 64, 132);
    ctx.lineTo(-52, 132);
    ctx.quadraticCurveTo(-86, 126, -92, 92);
    ctx.lineTo(-96, -88);
    ctx.quadraticCurveTo(-98, -110, -86, -118);
    ctx.closePath();
  };
  const screenBezel = () => {
    ctx.beginPath();
    ctx.moveTo(-74, -90);
    ctx.lineTo(78, -98);
    ctx.lineTo(68, 4);
    ctx.quadraticCurveTo(6, 22, -78, 6);
    ctx.closePath();
  };

  drawCastShadow(ctx, body, 5, 7, 0.055);
  body();
  ctx.fillStyle = "rgba(205,200,176,0.9)";
  ctx.fill();
  pencilShade(ctx, body, { x: -98, y: -122, w: 204, h: 258 }, { wash: 0.11, hatch: 0.052, cross: 0.018, spacing: 7, texture: 0.05 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  body();
  ctx.stroke();

  screenBezel();
  ctx.fillStyle = "rgba(28,32,32,0.84)";
  ctx.fill();
  ctx.strokeStyle = "rgba(12,16,17,0.76)";
  ctx.lineWidth = 1.8;
  screenBezel();
  ctx.stroke();
  drawPencilRect(ctx, -44, -68, 88, 54, 6, {
    fill: "rgba(62,245,206,0.28)",
    wash: 0.04,
    hatch: 0.018,
    spacing: 6,
    shadow: 0.02,
    lineWidth: 1.2
  });

  ctx.save();
  ctx.strokeStyle = "rgba(104,255,220,0.16)";
  ctx.lineWidth = 1;
  for (let y = -62; y <= -18; y += 10) roughLine(ctx, -38, y, 38, y + 1, 0.25, 4, 1200 + y);
  ctx.restore();

  ctx.save();
  ctx.translate(-54, 56);
  drawPencilRect(ctx, -29, -7, 58, 14, 4, { fill: "rgba(18,22,25,0.88)", wash: 0.04, hatch: 0.018, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  drawPencilRect(ctx, -7, -29, 14, 58, 4, { fill: "rgba(18,22,25,0.88)", wash: 0.04, hatch: 0.018, spacing: 5, shadow: 0.02, lineWidth: 1.2 });
  drawRivet(ctx, 0, 0, 3.2);
  ctx.restore();

  for (const [x, y, s] of [[44, 46, 12], [76, 34, 11], [48, 86, 6], [72, 78, 6]]) {
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fillStyle = s > 8 ? colorAlpha("#d7a13a", 0.82) : "rgba(18,22,25,0.76)";
    ctx.fill();
    ctx.strokeStyle = "rgba(18,22,25,0.62)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(18,22,25,0.46)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) roughLine(ctx, 34 + i * 9, 108 + i * 1.6, 48 + i * 9, 104 + i * 1.6, 0.22, 4, 1270 + i);
  drawPencilRect(ctx, -40, 94, 58, 12, 5, { fill: colorAlpha("#d7a13a", 0.52), wash: 0.035, hatch: 0.016, spacing: 4, shadow: 0.016, lineWidth: 1 });
}

function drawLedgerBtcHead(ctx, part) {
  setup(ctx, part, 2.05, 0.82);
  const ticker = part.key === "ledger.eth.head" ? "ETH" : "BTC";
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-110, -36);
    ctx.lineTo(44, -60);
    ctx.quadraticCurveTo(72, -56, 78, -30);
    ctx.lineTo(88, 74);
    ctx.quadraticCurveTo(72, 96, 36, 92);
    ctx.lineTo(-104, 68);
    ctx.quadraticCurveTo(-126, 42, -122, -12);
    ctx.quadraticCurveTo(-122, -30, -110, -36);
    ctx.closePath();
  };
  const cover = () => {
    ctx.beginPath();
    ctx.moveTo(20, -106);
    ctx.lineTo(116, -88);
    ctx.quadraticCurveTo(132, -80, 130, -56);
    ctx.lineTo(112, 106);
    ctx.quadraticCurveTo(98, 124, 74, 116);
    ctx.lineTo(18, 96);
    ctx.closePath();
  };

  drawCastShadow(ctx, cover, 5, 8, 0.052);
  cover();
  const coverFill = ctx.createLinearGradient(20, -100, 128, 112);
  coverFill.addColorStop(0, "rgba(241,245,242,0.9)");
  coverFill.addColorStop(1, "rgba(142,154,160,0.84)");
  ctx.fillStyle = coverFill;
  ctx.fill();
  pencilShade(ctx, cover, { x: 16, y: -108, w: 118, h: 228 }, { wash: 0.08, hatch: 0.036, cross: 0.012, spacing: 7, texture: 0.032 });
  ctx.strokeStyle = "rgba(18,22,25,0.62)";
  ctx.lineWidth = 2;
  cover();
  ctx.stroke();

  drawCastShadow(ctx, body, 4, 6, 0.06);
  body();
  ctx.fillStyle = "rgba(14,18,20,0.92)";
  ctx.fill();
  pencilShade(ctx, body, { x: -124, y: -64, w: 212, h: 160 }, { wash: 0.12, hatch: 0.056, cross: 0.018, spacing: 6, texture: 0.05 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  body();
  ctx.stroke();

  drawPencilRect(ctx, -86, -22, 92, 38, 8, {
    fill: "rgba(20,54,58,0.9)",
    wash: 0.04,
    hatch: 0.018,
    spacing: 5,
    shadow: 0.02,
    lineWidth: 1.2
  });
  ctx.fillStyle = "rgba(80,255,224,0.96)";
  ctx.font = "bold 22px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ticker, -40, -3);
  ctx.font = "bold 8px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText("LEDGER", -78, 30);

  ctx.beginPath();
  ctx.arc(90, 34, 16, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(236,241,236,0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.48)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(90, 34, 7, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(18,22,25,0.34)";
  ctx.stroke();
  drawRivet(ctx, 56, -28, 3);
  drawRivet(ctx, 66, 78, 3);
}

function drawBatteryChargeHead(ctx, part, state = {}) {
  setup(ctx, part, 2.05, 0.82);
  const level = gasLevelFor(state);
  const beat = gasHeartbeatFor(state, level, 0.31);
  const charge = clamp01(0.56 + level * 0.34 + beat * 0.08);
  const liveColor = level > 0.78 ? "#ff5d3d" : level > 0.52 ? "#ffd24a" : "#77f04f";
  const screenGlow = colorAlpha(liveColor, 0.2 + beat * 0.22);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-124, -76);
    ctx.quadraticCurveTo(-104, -116, -52, -112);
    ctx.lineTo(88, -104);
    ctx.quadraticCurveTo(126, -94, 128, -54);
    ctx.lineTo(122, 76);
    ctx.quadraticCurveTo(114, 118, 72, 126);
    ctx.lineTo(-82, 116);
    ctx.quadraticCurveTo(-126, 104, -132, 60);
    ctx.lineTo(-136, -38);
    ctx.quadraticCurveTo(-138, -62, -124, -76);
    ctx.closePath();
  };
  const screen = () => {
    ctx.beginPath();
    ctx.roundRect(-84, -50, 168, 94, 12);
  };

  drawCastShadow(ctx, body, 5, 8, 0.06);
  body();
  const shell = ctx.createLinearGradient(-138, -116, 130, 126);
  shell.addColorStop(0, "rgba(71,55,35,0.94)");
  shell.addColorStop(0.38, "rgba(142,104,52,0.9)");
  shell.addColorStop(0.68, "rgba(82,68,45,0.92)");
  shell.addColorStop(1, "rgba(28,32,31,0.9)");
  ctx.fillStyle = shell;
  ctx.fill();
  pencilShade(ctx, body, { x: -140, y: -116, w: 280, h: 250 }, { wash: 0.13, hatch: 0.066, cross: 0.025, spacing: 7, texture: 0.06 });
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.35;
  body();
  ctx.stroke();

  for (const [x, label, side] of [[-106, "+", -1], [106, "-", 1]]) {
    drawPencilRect(ctx, x - 20, -38, 40, 80, 11, {
      fill: "rgba(18,22,25,0.48)",
      wash: 0.05,
      hatch: 0.03,
      spacing: 6,
      shadow: 0.026,
      lineWidth: 1.2
    });
    ctx.fillStyle = "rgba(7,10,10,0.76)";
    ctx.font = "bold 34px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, -1);
    roughLine(ctx, x - side * 13, -92, x - side * 33, -120, 0.35, 4, 1330 + x);
  }

  for (const [x, scale, label] of [[-58, 1.04, "+"], [58, 0.92, "-"]]) {
    ctx.save();
    ctx.translate(x, -128);
    drawPencilRect(ctx, -38 * scale, 0, 76 * scale, 30, 10, {
      fill: "rgba(22,25,24,0.88)",
      wash: 0.08,
      hatch: 0.04,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.3
    });
    ctx.beginPath();
    ctx.arc(0, 0, 25 * scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(176,162,124,0.88)";
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.stroke();
    drawRivet(ctx, 0, 0, 4.5 * scale);
    ctx.fillStyle = "rgba(18,22,25,0.62)";
    ctx.font = "bold 13px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 2);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.72)";
  ctx.lineWidth = 10;
  roughBezier(ctx, [[-62, -132], [-76, -178], [42, -180], [62, -130]], 0.55, 1390);
  ctx.strokeStyle = "rgba(255,83,70,0.72)";
  ctx.lineWidth = 4;
  roughBezier(ctx, [[-68, -136], [-78, -166], [12, -172], [38, -138]], 0.45, 1391);
  ctx.restore();

  screen();
  ctx.fillStyle = "rgba(4,12,12,0.9)";
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = screenGlow;
  ctx.shadowBlur = 16 + beat * 12;
  ctx.strokeStyle = colorAlpha(liveColor, 0.48 + beat * 0.22);
  ctx.lineWidth = 2.8;
  screen();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(14,18,18,0.9)";
  ctx.lineWidth = 2;
  screen();
  ctx.stroke();

  ctx.fillStyle = "rgba(225,230,208,0.78)";
  ctx.font = "bold 11px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BATTERY", 0, -34);
  ctx.fillStyle = colorAlpha(liveColor, 0.86 + beat * 0.12);
  ctx.font = "bold 9px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillText(`CHARGE ${Math.round(charge * 100)}%`, 0, 30);

  const lit = Math.max(1, Math.round(charge * 7));
  for (let i = 0; i < 7; i += 1) {
    const x = -61 + i * 20;
    drawPencilRect(ctx, x, -12, 15, 26, 3, {
      fill: i < lit ? colorAlpha(liveColor, 0.86 + beat * 0.12) : "rgba(46,60,46,0.54)",
      wash: 0.02,
      hatch: 0.01,
      spacing: 4,
      shadow: 0.014,
      lineWidth: 0.9
    });
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(102,255,220,0.78)";
  for (const x of [-34, 34]) {
    ctx.beginPath();
    ctx.roundRect(x - 9, -24, 18, 9, 3);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(118,255,224,0.82)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-30, 18], [-10, 24], [14, 24], [34, 16]], 0.32, 1400);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,238,170,0.48)";
  ctx.lineWidth = 1.2;
  roughLine(ctx, -70, -74, 70, -70, 0.34, 4, 1410);
  roughLine(ctx, -74, 60, 74, 54, 0.34, 4, 1411);
  for (const [x, y] of [[-100, -82], [-34, -88], [36, -84], [102, -72], [-100, 78], [-38, 92], [38, 88], [98, 74]]) {
    drawRivet(ctx, x, y, 3.2);
  }

  if (level > 0.72) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha("#ff5d3d", 0.28 + beat * 0.24);
    ctx.lineWidth = 3;
    roughBezier(ctx, [[-96, 92], [-42, 114], [26, 114], [96, 82]], 0.55, 1420);
    ctx.strokeStyle = colorAlpha("#ffd24a", 0.38 + beat * 0.22);
    roughBezier(ctx, [[70, -56], [90, -30], [72, -4], [96, 26]], 0.5, 1421);
    ctx.restore();
  }
}

function drawMagnetUHead(ctx, part, state = {}) {
  setup(ctx, part, 2.05, 0.84);
  const level = gasLevelFor(state);
  const beat = gasHeartbeatFor(state, level, 0.47);
  const field = 0.28 + level * 0.38 + beat * 0.22;
  const bodyStroke = "rgba(18,22,25,0.72)";
  const leftArm = () => {
    ctx.beginPath();
    ctx.moveTo(-132, -142);
    ctx.quadraticCurveTo(-104, -160, -74, -146);
    ctx.lineTo(-64, 22);
    ctx.bezierCurveTo(-58, 74, -34, 104, 0, 104);
    ctx.lineTo(0, 154);
    ctx.bezierCurveTo(-66, 154, -112, 106, -122, 30);
    ctx.closePath();
  };
  const rightArm = () => {
    ctx.beginPath();
    ctx.moveTo(74, -146);
    ctx.quadraticCurveTo(104, -160, 132, -142);
    ctx.lineTo(122, 30);
    ctx.bezierCurveTo(112, 106, 66, 154, 0, 154);
    ctx.lineTo(0, 104);
    ctx.bezierCurveTo(34, 104, 58, 74, 64, 22);
    ctx.closePath();
  };
  const cap = (x, color) => {
    ctx.save();
    ctx.translate(x, -136);
    drawPencilRect(ctx, -48, -42, 96, 74, 10, {
      fill: color,
      wash: 0.06,
      hatch: 0.03,
      spacing: 6,
      shadow: 0.035,
      lineWidth: 1.5
    });
    ctx.restore();
  };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha("#72ffe8", field * 0.34);
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; i += 1) {
    const spread = 44 + i * 17;
    roughBezier(ctx, [[-52, -38 + i * 9], [-22, -72 - spread * 0.1], [24, -72 - spread * 0.1], [54, -38 + i * 9]], 0.45, 1510 + i);
    roughBezier(ctx, [[-76, 44 + i * 8], [-34, 72 + spread], [34, 72 + spread], [76, 44 + i * 8]], 0.45, 1530 + i);
  }
  ctx.restore();

  drawCastShadow(ctx, leftArm, 5, 8, 0.055);
  leftArm();
  const leftFill = ctx.createLinearGradient(-138, -146, -22, 150);
  leftFill.addColorStop(0, "rgba(212,218,207,0.9)");
  leftFill.addColorStop(0.55, "rgba(154,158,150,0.86)");
  leftFill.addColorStop(1, "rgba(84,90,88,0.84)");
  ctx.fillStyle = leftFill;
  ctx.fill();
  pencilShade(ctx, leftArm, { x: -138, y: -152, w: 150, h: 314 }, { wash: 0.11, hatch: 0.056, cross: 0.02, spacing: 7, texture: 0.045 });
  ctx.strokeStyle = bodyStroke;
  ctx.lineWidth = 2.4;
  leftArm();
  ctx.stroke();

  drawCastShadow(ctx, rightArm, 5, 8, 0.055);
  rightArm();
  const rightFill = ctx.createLinearGradient(22, -146, 138, 150);
  rightFill.addColorStop(0, "rgba(232,234,222,0.88)");
  rightFill.addColorStop(0.58, "rgba(158,162,154,0.86)");
  rightFill.addColorStop(1, "rgba(86,92,90,0.84)");
  ctx.fillStyle = rightFill;
  ctx.fill();
  pencilShade(ctx, rightArm, { x: -4, y: -152, w: 142, h: 314 }, { wash: 0.11, hatch: 0.056, cross: 0.02, spacing: 7, texture: 0.045 });
  ctx.strokeStyle = bodyStroke;
  ctx.lineWidth = 2.4;
  rightArm();
  ctx.stroke();

  cap(-90, "rgba(205,50,42,0.92)");
  cap(90, "rgba(48,96,184,0.92)");
  ctx.fillStyle = "rgba(246,242,222,0.96)";
  ctx.font = "bold 32px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("N", -90, -138);
  ctx.fillText("S", 90, -138);

  for (const [x, color, side] of [[-138, "#ff6848", -1], [138, "#4ca4ff", 1]]) {
    ctx.save();
    ctx.translate(x, -8);
    ctx.rotate(side * -0.03);
    drawPencilRect(ctx, -12, -44, 24, 88, 8, {
      fill: "rgba(18,22,25,0.78)",
      wash: 0.06,
      hatch: 0.028,
      spacing: 5,
      shadow: 0.026,
      lineWidth: 1.2
    });
    ctx.strokeStyle = colorAlpha(color, 0.82);
    ctx.lineWidth = 3.2;
    for (let y = -34; y <= 34; y += 11) roughLine(ctx, -11, y, 11, y + 5, 0.28, 4, 1550 + y + x);
    ctx.restore();
    ctx.strokeStyle = colorAlpha(color, 0.5);
    ctx.lineWidth = 3.4;
    roughBezier(ctx, [[x - side * 8, 26], [x - side * 38, 62], [side * 54, 142], [side * 22, 166]], 0.55, 1600 + x);
  }

  drawPencilRect(ctx, -82, 76, 164, 68, 16, {
    fill: "rgba(16,20,21,0.9)",
    wash: 0.07,
    hatch: 0.03,
    spacing: 5,
    shadow: 0.04,
    lineWidth: 1.5
  });
  drawPencilRect(ctx, -44, 92, 88, 32, 8, {
    fill: "rgba(6,20,22,0.9)",
    wash: 0.035,
    hatch: 0.015,
    spacing: 5,
    shadow: 0.02,
    lineWidth: 1.1
  });
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = colorAlpha("#74ffea", 0.72 + beat * 0.2);
  ctx.shadowColor = colorAlpha("#74ffea", 0.72);
  ctx.shadowBlur = 8 + beat * 8;
  ctx.beginPath();
  ctx.roundRect(-32, 100, 18, 16, 4);
  ctx.roundRect(14, 100, 18, 16, 4);
  ctx.fill();
  ctx.strokeStyle = colorAlpha("#74ffea", 0.64);
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-26, 126], [-10, 134], [10, 134], [28, 126]], 0.22, 1640);
  ctx.restore();

  for (const [x, y] of [[-116, -94], [-60, -16], [-86, 58], [116, -94], [60, -16], [86, 58], [-54, 112], [54, 112]]) {
    drawRivet(ctx, x, y, 3.5);
  }
  ctx.fillStyle = "rgba(218,224,211,0.82)";
  ctx.font = "bold 8px ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.fillText("MAG-01", 0, 84);
}

function specialShapeFor(part) {
  return String(part.specialShape || part.rareShape || "oracle").toLowerCase();
}

function drawSpecialRarePath(ctx, shape, type) {
  const head = type === "head";
  ctx.beginPath();
  if (head) {
    if (shape.includes("pressure") || shape.includes("oracle") || shape.includes("gauge")) {
      ctx.ellipse(0, 0, 116, 98, 0, 0, Math.PI * 2);
    } else if (shape.includes("forge") || shape.includes("harvest") || shape.includes("pilot")) {
      ctx.moveTo(-162, -58);
      ctx.lineTo(-92, -92);
      ctx.lineTo(96, -88);
      ctx.lineTo(164, -52);
      ctx.lineTo(130, 64);
      ctx.lineTo(-126, 70);
      ctx.closePath();
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral") || shape.includes("infinite")) {
      ctx.moveTo(-98, 84);
      ctx.lineTo(-104, -36);
      ctx.lineTo(-58, -38);
      ctx.lineTo(-34, -108);
      ctx.lineTo(0, -140);
      ctx.lineTo(34, -108);
      ctx.lineTo(58, -38);
      ctx.lineTo(104, -36);
      ctx.lineTo(98, 84);
      ctx.closePath();
    } else if (shape.includes("scar") || shape.includes("crown") || shape.includes("king")) {
      ctx.moveTo(-142, 78);
      ctx.lineTo(-128, -54);
      ctx.lineTo(-82, -92);
      ctx.lineTo(-42, -42);
      ctx.lineTo(0, -118);
      ctx.lineTo(42, -42);
      ctx.lineTo(82, -92);
      ctx.lineTo(128, -54);
      ctx.lineTo(142, 78);
      ctx.closePath();
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury") || shape.includes("diver") || shape.includes("polar") || shape.includes("glass") || shape.includes("holo") || shape.includes("crystal") || shape.includes("opal") || shape.includes("void") || shape.includes("blackmatter") || shape.includes("slime")) {
      ctx.moveTo(-86, 94);
      ctx.bezierCurveTo(-128, 50, -124, -52, -62, -100);
      ctx.bezierCurveTo(-28, -126, 28, -126, 62, -100);
      ctx.bezierCurveTo(124, -52, 128, 50, 86, 94);
      ctx.closePath();
    } else if (shape.includes("signal") || shape.includes("radio") || shape.includes("crt")) {
      ctx.moveTo(-154, -82);
      ctx.lineTo(154, -82);
      ctx.lineTo(132, 82);
      ctx.lineTo(-132, 82);
      ctx.closePath();
    } else if (shape.includes("vault") || shape.includes("sale")) {
      ctx.roundRect(-112, -106, 224, 212, 24);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      ctx.moveTo(-158, 64);
      ctx.lineTo(-120, -52);
      ctx.lineTo(-168, -108);
      ctx.lineTo(-72, -76);
      ctx.lineTo(-34, -122);
      ctx.lineTo(0, -80);
      ctx.lineTo(34, -122);
      ctx.lineTo(72, -76);
      ctx.lineTo(168, -108);
      ctx.lineTo(120, -52);
      ctx.lineTo(158, 64);
      ctx.lineTo(54, 96);
      ctx.lineTo(0, 74);
      ctx.lineTo(-54, 96);
      ctx.closePath();
    } else if (shape.includes("archive") || shape.includes("typewriter") || shape.includes("contract") || shape.includes("memory") || shape.includes("genesis") || shape.includes("museum") || shape.includes("stone") || shape.includes("rune") || shape.includes("paper") || shape.includes("server") || shape.includes("eink")) {
      ctx.moveTo(-128, -86);
      ctx.lineTo(112, -96);
      ctx.lineTo(140, -28);
      ctx.lineTo(104, 88);
      ctx.lineTo(-122, 78);
      ctx.lineTo(-146, -18);
      ctx.closePath();
    } else if (shape.includes("swan")) {
      ctx.moveTo(-154, 42);
      ctx.bezierCurveTo(-112, -78, -42, -126, 0, -60);
      ctx.bezierCurveTo(42, -126, 112, -78, 154, 42);
      ctx.bezierCurveTo(76, 94, -76, 94, -154, 42);
      ctx.closePath();
    } else if (shape.includes("tesla")) {
      ctx.moveTo(-128, 84);
      ctx.lineTo(-96, -122);
      ctx.lineTo(-34, -122);
      ctx.lineTo(-12, 28);
      ctx.lineTo(12, 28);
      ctx.lineTo(34, -122);
      ctx.lineTo(96, -122);
      ctx.lineTo(128, 84);
      ctx.closePath();
    } else if (shape.includes("satellite") || shape.includes("orbit")) {
      ctx.ellipse(0, -12, 142, 76, -0.08, 0, Math.PI * 2);
      ctx.moveTo(-64, 54);
      ctx.lineTo(64, 54);
      ctx.lineTo(96, 108);
      ctx.lineTo(-96, 108);
      ctx.closePath();
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      ctx.roundRect(-150, -80, 300, 160, 18);
    } else if (shape.includes("boss") || shape.includes("idol")) {
      ctx.moveTo(0, -136);
      ctx.lineTo(118, -48);
      ctx.lineTo(92, 82);
      ctx.lineTo(0, 126);
      ctx.lineTo(-92, 82);
      ctx.lineTo(-118, -48);
      ctx.closePath();
    } else {
      ctx.roundRect(-122, -92, 244, 184, 22);
    }
  } else {
    if (shape.includes("pressure") || shape.includes("oracle") || shape.includes("gauge") || shape.includes("volcanic") || shape.includes("lava")) {
      ctx.moveTo(-174, -92);
      ctx.lineTo(174, -92);
      ctx.lineTo(140, 126);
      ctx.lineTo(62, 174);
      ctx.lineTo(-62, 174);
      ctx.lineTo(-140, 126);
      ctx.closePath();
    } else if (shape.includes("forge") || shape.includes("harvest") || shape.includes("pilot") || shape.includes("runner") || shape.includes("wheel") || shape.includes("skate")) {
      ctx.moveTo(-204, -84);
      ctx.lineTo(204, -84);
      ctx.lineTo(154, 116);
      ctx.lineTo(66, 168);
      ctx.lineTo(-66, 168);
      ctx.lineTo(-154, 116);
      ctx.closePath();
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral") || shape.includes("infinite")) {
      ctx.moveTo(-142, 174);
      ctx.lineTo(-158, -42);
      ctx.lineTo(-72, -78);
      ctx.lineTo(0, -122);
      ctx.lineTo(72, -78);
      ctx.lineTo(158, -42);
      ctx.lineTo(142, 174);
      ctx.closePath();
    } else if (shape.includes("scar") || shape.includes("archive") || shape.includes("contract") || shape.includes("memory") || shape.includes("genesis") || shape.includes("museum") || shape.includes("stone") || shape.includes("rune") || shape.includes("paper") || shape.includes("server") || shape.includes("eink")) {
      ctx.moveTo(-190, -70);
      ctx.lineTo(168, -98);
      ctx.lineTo(202, 94);
      ctx.lineTo(112, 170);
      ctx.lineTo(-150, 150);
      ctx.lineTo(-206, 42);
      ctx.closePath();
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury") || shape.includes("diver") || shape.includes("polar") || shape.includes("glass") || shape.includes("holo") || shape.includes("crystal") || shape.includes("opal") || shape.includes("void") || shape.includes("blackmatter") || shape.includes("slime")) {
      ctx.ellipse(0, 24, 178, 164, 0, 0, Math.PI * 2);
    } else if (shape.includes("signal") || shape.includes("radio") || shape.includes("crt")) {
      ctx.moveTo(-214, -70);
      ctx.lineTo(214, -70);
      ctx.lineTo(184, 88);
      ctx.lineTo(92, 150);
      ctx.lineTo(-92, 150);
      ctx.lineTo(-184, 88);
      ctx.closePath();
    } else if (shape.includes("vault") || shape.includes("sale") || shape.includes("king")) {
      ctx.roundRect(-162, -116, 324, 292, 28);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      ctx.moveTo(-224, -34);
      ctx.lineTo(-146, -112);
      ctx.lineTo(-42, -78);
      ctx.lineTo(0, -122);
      ctx.lineTo(42, -78);
      ctx.lineTo(146, -112);
      ctx.lineTo(224, -34);
      ctx.lineTo(154, 132);
      ctx.lineTo(54, 176);
      ctx.lineTo(0, 134);
      ctx.lineTo(-54, 176);
      ctx.lineTo(-154, 132);
      ctx.closePath();
    } else if (shape.includes("swan")) {
      ctx.moveTo(-244, 0);
      ctx.bezierCurveTo(-160, -118, -68, -82, 0, -34);
      ctx.bezierCurveTo(68, -82, 160, -118, 244, 0);
      ctx.bezierCurveTo(150, 164, -150, 164, -244, 0);
      ctx.closePath();
    } else if (shape.includes("tesla")) {
      ctx.moveTo(-178, 168);
      ctx.lineTo(-118, -106);
      ctx.lineTo(-46, -86);
      ctx.lineTo(-26, 46);
      ctx.lineTo(26, 46);
      ctx.lineTo(46, -86);
      ctx.lineTo(118, -106);
      ctx.lineTo(178, 168);
      ctx.closePath();
    } else if (shape.includes("satellite") || shape.includes("orbit")) {
      ctx.ellipse(0, 22, 214, 128, 0.02, 0, Math.PI * 2);
      ctx.moveTo(-86, 106);
      ctx.lineTo(86, 106);
      ctx.lineTo(136, 176);
      ctx.lineTo(-136, 176);
      ctx.closePath();
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      ctx.roundRect(-198, -102, 396, 264, 24);
    } else if (shape.includes("boss") || shape.includes("idol")) {
      ctx.moveTo(0, -140);
      ctx.lineTo(178, -42);
      ctx.lineTo(148, 118);
      ctx.lineTo(0, 190);
      ctx.lineTo(-148, 118);
      ctx.lineTo(-178, -42);
      ctx.closePath();
    } else {
      ctx.roundRect(-176, -102, 352, 270, 26);
    }
  }
}

function drawSpecialRareShell(ctx, part, state = {}, type = "head") {
  const shape = specialShapeFor(part);
  const variant = Math.abs(Number(part.specialVariant || 0)) % 4;
  const style = setup(ctx, part, type === "head" ? 2.35 : 2.15, 0.9);
  const bounds = type === "head" ? { x: -176, y: -154, w: 352, h: 298 } : { x: -250, y: -150, w: 500, h: 370 };
  const shell = () => drawSpecialRarePath(ctx, shape, type);
  const pulse = Math.sin((state.time || 0) * 2.1 + (part.id || 0)) * 0.5 + 0.5;

  drawCastShadow(ctx, shell, type === "head" ? 6 : 8, type === "head" ? 8 : 10, 0.07);
  const fill = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.w, bounds.y + bounds.h);
  fill.addColorStop(0, colorAlpha(style.highlight || style.fill || "#d8dee0", 0.58));
  fill.addColorStop(0.42, colorAlpha(style.fill || "#8b9696", type === "head" ? 0.9 : 0.8));
  fill.addColorStop(1, colorAlpha(style.stroke || "#1a1f22", 0.28));
  ctx.fillStyle = fill;
  shell();
  ctx.fill();
  pencilShade(ctx, shell, bounds, {
    wash: type === "head" ? 0.075 : 0.09,
    hatch: type === "head" ? 0.036 : 0.044,
    cross: 0.016,
    spacing: type === "head" ? 8 : 10,
    texture: 0.04
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#111", 0.82);
  ctx.lineWidth = type === "head" ? 2.5 : 2.25;
  shell();
  ctx.stroke();

  ctx.save();
  shell();
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colorAlpha(style.glow || style.highlight || "#72ffe8", 0.16 + pulse * 0.12);
  ctx.lineWidth = type === "head" ? 2 : 2.6;
  if (type === "head") {
    for (let y = -78; y <= 78; y += 42) roughLine(ctx, -118, y, 118, y - 12, 0.42, 8, 1700 + y);
    roughBezier(ctx, [[-96, 74], [-34, 100], [46, 96], [106, 66]], 0.42, 1800);
  } else {
    for (let y = -74; y <= 132; y += 54) roughLine(ctx, -164, y, 164, y - 18, 0.46, 9, 1850 + y);
    roughBezier(ctx, [[-190, 18], [-88, -52], [96, -54], [190, 26]], 0.52, 1900);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = colorAlpha(style.stroke || "#111", 0.56);
  ctx.lineWidth = 1.4;
  if (type === "head") {
    if (shape.includes("vault") || shape.includes("sale")) {
      roughCircle(ctx, 0, 2, 52, 0.55, 2100);
      roughCircle(ctx, 0, 2, 24, 0.45, 2101);
      roughLine(ctx, -18, 2, 40, -18, 0.34, 4, 2102);
    } else if (shape.includes("cassette") || shape.includes("blackbox")) {
      roughCircle(ctx, -64, 0, 30, 0.44, 2110);
      roughCircle(ctx, 64, 0, 30, 0.44, 2111);
      roughLine(ctx, -112, 46, 112, 40, 0.3, 5, 2112);
    } else if (shape.includes("tesla")) {
      roughLine(ctx, -76, -108, -52, 72, 0.38, 6, 2120);
      roughLine(ctx, 76, -108, 52, 72, 0.38, 6, 2121);
      roughBezier(ctx, [[-50, -22], [-16, -52], [18, -52], [50, -22]], 0.42, 2122);
    } else if (shape.includes("liquid") || shape.includes("aqua") || shape.includes("mercury")) {
      roughBezier(ctx, [[-72, -28], [-36, -48], [38, -44], [74, -24]], 0.4, 2130);
      roughBezier(ctx, [[-78, 44], [-28, 64], [36, 60], [78, 36]], 0.4, 2131);
      for (const x of [-54, 0, 54]) roughCircle(ctx, x, 10 + Math.sin(x) * 6, 6, 0.28, 2132 + x);
    } else if (shape.includes("dragon") || shape.includes("primal")) {
      for (const x of [-54, -18, 18, 54]) roughLine(ctx, x, 46, x + 18, 78, 0.36, 4, 2140 + x);
    } else if (shape.includes("clock") || shape.includes("chrono") || shape.includes("cathedral")) {
      roughCircle(ctx, 0, -10, 48, 0.45, 2150);
      roughLine(ctx, 0, -10, 34, -38, 0.24, 4, 2151);
      roughLine(ctx, 0, -10, -8, 28, 0.24, 4, 2152);
    } else {
      roughLine(ctx, -92, -38, 92, -44, 0.36, 6, 2160);
      roughLine(ctx, -90, 42, 90, 34, 0.36, 6, 2161);
    }
    if (variant === 0) {
      drawPencilRect(ctx, -78, -142, 156, 20, 5, { fill: colorAlpha(style.fill || "#d8dee0", 0.48), wash: 0.045, hatch: 0.02, spacing: 6, shadow: 0.02, lineWidth: 1.1 });
      for (const x of [-52, 0, 52]) drawRivet(ctx, x, -132, 2.6);
    } else if (variant === 1) {
      for (const side of [-1, 1]) {
        drawPencilRect(ctx, side * 128 - 14, -34, 28, 88, 7, { fill: colorAlpha(style.fill || "#d8dee0", 0.4), wash: 0.05, hatch: 0.02, spacing: 5, shadow: 0.02, lineWidth: 1.1 });
        roughLine(ctx, side * 128, -20, side * 160, -48, 0.28, 4, 2170 + side);
      }
    } else if (variant === 2) {
      drawMiniPulley(ctx, -86, -108, 18, 6, (state.time || 0) * 0.3);
      drawMiniPulley(ctx, 86, -108, 18, 6, -(state.time || 0) * 0.28);
      roughBezier(ctx, [[-66, -116], [-28, -142], [28, -142], [66, -116]], 0.36, 2178);
    } else {
      roughLine(ctx, -104, -124, -166, -168, 0.34, 5, 2180);
      roughLine(ctx, 104, -124, 166, -168, 0.34, 5, 2181);
      drawRivet(ctx, -104, -124, 2.8);
      drawRivet(ctx, 104, -124, 2.8);
    }
    for (const [x, y] of [[-108, -66], [108, -66], [-112, 66], [112, 66], [-42, -100], [42, -100]]) drawRivet(ctx, x, y, 3.1);
  } else {
    if (shape.includes("dragon") || shape.includes("primal")) {
      for (let i = -3; i <= 3; i += 1) roughLine(ctx, i * 38, -54 + Math.abs(i) * 7, i * 25, 120, 0.4, 7, 2200 + i);
    } else if (shape.includes("swan")) {
      for (const side of [-1, 1]) {
        roughBezier(ctx, [[side * 12, -40], [side * 86, -84], [side * 168, -54], [side * 224, 18]], 0.5, 2210 + side);
        roughBezier(ctx, [[side * 18, 26], [side * 90, 72], [side * 160, 76], [side * 210, 40]], 0.42, 2214 + side);
      }
    } else if (shape.includes("archive") || shape.includes("memory") || shape.includes("contract")) {
      for (let y = -42; y <= 96; y += 34) roughLine(ctx, -150, y, 156, y - 14, 0.34, 6, 2220 + y);
    } else if (shape.includes("vault") || shape.includes("sale")) {
      roughCircle(ctx, 0, 4, 72, 0.5, 2230);
      roughCircle(ctx, 0, 4, 34, 0.4, 2231);
      for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        roughLine(ctx, Math.cos(angle) * 34, Math.sin(angle) * 34 + 4, Math.cos(angle) * 78, Math.sin(angle) * 78 + 4, 0.3, 4, 2232 + angle * 10);
      }
    } else {
      roughBezier(ctx, [[-168, 92], [-74, 130], [74, 130], [168, 84]], 0.42, 2240);
      roughLine(ctx, -132, -44, 132, -60, 0.38, 7, 2241);
    }
    if (variant === 0) {
      for (const side of [-1, 1]) drawPencilRect(ctx, side * 208 - 24, 36, 48, 122, 8, { fill: colorAlpha(style.fill || "#d8dee0", 0.34), wash: 0.05, hatch: 0.02, spacing: 6, shadow: 0.02, lineWidth: 1.1 });
    } else if (variant === 1) {
      for (const side of [-1, 1]) {
        roughBezier(ctx, [[side * 62, -92], [side * 136, -132], [side * 210, -84], [side * 236, -12]], 0.5, 2250 + side);
        drawMiniPulley(ctx, side * 166, -62, 18, 6, side * (state.time || 0) * 0.28);
      }
    } else if (variant === 2) {
      for (let i = -3; i <= 3; i += 1) drawRivet(ctx, i * 44, -112 + Math.abs(i) * 5, 2.8);
      drawPencilRect(ctx, -126, 134, 252, 28, 7, { fill: colorAlpha(style.fill || "#d8dee0", 0.36), wash: 0.045, hatch: 0.018, spacing: 6, shadow: 0.018, lineWidth: 1 });
    } else {
      roughLine(ctx, -188, -116, 186, 132, 0.42, 9, 2260);
      roughLine(ctx, -168, 130, 180, -88, 0.36, 8, 2261);
    }
    for (const [x, y] of [[-170, -58], [170, -58], [-188, 62], [188, 62], [-102, 144], [102, 144], [0, -104], [0, 150]]) drawRivet(ctx, x, y, 3.4);
  }
  ctx.restore();
}

function drawSpecialRareHead(ctx, part, state = {}) {
  drawSpecialRareShell(ctx, part, state, "head");
}

function drawSpecialRareBody(ctx, part, state = {}) {
  drawSpecialRareShell(ctx, part, state, "body");
}

function drawMiniPulley(ctx, x, y, radius, spokes = 6, phase = 0) {
  const outer = () => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 3, 4, 0.052);
  pencilShade(ctx, outer, { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 }, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 6 });
  outer();
  ctx.stroke();
  roughCircle(ctx, x, y, radius * 0.68, 0.6, radius + 10);
  roughCircle(ctx, x, y, radius * 0.2, 0.4, radius + 20);
  for (let i = 0; i < spokes; i++) {
    const angle = i / spokes * Math.PI * 2 + phase;
    roughLine(ctx, x, y, x + Math.cos(angle) * radius * 0.58, y + Math.sin(angle) * radius * 0.58, 0.55, 4, i * 12 + radius);
  }
  drawRivet(ctx, x, y, Math.max(3.2, radius * 0.11));
}

function drawPulleyBeltPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-86, 0);
  ctx.bezierCurveTo(-42, -40, 8, -58, 72, -56);
  ctx.moveTo(-58, 48);
  ctx.bezierCurveTo(-10, 36, 36, 26, 92, 16);
}

function drawPulleyBeltLoop(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.74);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = Math.max(0.4, Math.abs(state.motionSpeed ?? 0.8));

  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.065)";
  ctx.lineWidth = 14;
  drawPulleyBeltPath(ctx);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(18,22,25,0.28)";
  ctx.lineWidth = 7.5;
  drawPulleyBeltPath(ctx);
  ctx.stroke();
  drawHatching(ctx, { x: -92, y: -62, w: 188, h: 122 }, -0.72, 8, 0.035, 0.55);

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.38)";
  ctx.lineWidth = 2.2;
  ctx.setLineDash([9, 8]);
  ctx.lineDashOffset = -time * speed * 34;
  drawPulleyBeltPath(ctx);
  ctx.stroke();
  ctx.strokeStyle = "rgba(42,137,174,0.48)";
  ctx.lineWidth = 1.15;
  ctx.setLineDash([5, 12]);
  ctx.lineDashOffset = -time * speed * 40;
  drawPulleyBeltPath(ctx);
  ctx.stroke();
  ctx.restore();
}

function drawCompactPulleyWheel(ctx, phase) {
  const radius = 46;
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 4, 5, 0.055);
  pencilShade(ctx, outer, { x: -52, y: -52, w: 104, h: 104 }, { wash: 0.11, hatch: 0.065, cross: 0.026, spacing: 6, texture: 0.06 });
  outer();
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.27)";
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, Math.PI * 0.16, Math.PI * 0.84);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, Math.PI * 1.16, Math.PI * 1.84);
  ctx.stroke();
  ctx.restore();

  roughCircle(ctx, 0, 0, radius * 0.74, 0.55, 170);
  roughCircle(ctx, 0, 0, radius * 0.48, 0.48, 190);
  roughCircle(ctx, 0, 0, radius * 0.22, 0.38, 210);
  for (let i = 0; i < 4; i++) {
    const angle = i / 4 * Math.PI * 2 + phase * 0.45;
    ctx.save();
    ctx.strokeStyle = "rgba(18,22,25,0.34)";
    ctx.lineWidth = 3.1;
    roughLine(ctx, Math.cos(angle) * 12, Math.sin(angle) * 12, Math.cos(angle) * radius * 0.56, Math.sin(angle) * radius * 0.56, 0.5, 4, i * 23 + 40);
    ctx.restore();
  }
  drawPencilRect(ctx, -18, -61, 36, 12, 3, { wash: 0.08, hatch: 0.04, cross: 0.012, lineWidth: 1.2, sketch: 0.1 });
  drawPencilRect(ctx, -18, 49, 36, 12, 3, { wash: 0.08, hatch: 0.04, cross: 0.012, lineWidth: 1.2, sketch: 0.1 });
  drawRivet(ctx, 0, 0, 6);
}

function drawLargeIndustrialPulley(ctx, phase) {
  const radius = 64;
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 5, 7, 0.065);
  pencilShade(ctx, outer, { x: -70, y: -70, w: 140, h: 140 }, { wash: 0.13, hatch: 0.072, cross: 0.03, spacing: 7, texture: 0.065 });
  outer();
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.3)";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  roughCircle(ctx, 0, 0, radius * 0.84, 0.6, 230);
  roughCircle(ctx, 0, 0, radius * 0.58, 0.55, 250);
  roughCircle(ctx, 0, 0, radius * 0.24, 0.42, 270);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2 + phase * 0.28;
    ctx.save();
    ctx.strokeStyle = i % 3 === 0 ? "rgba(18,22,25,0.4)" : "rgba(18,22,25,0.28)";
    ctx.lineWidth = i % 3 === 0 ? 2.4 : 1.25;
    roughLine(ctx, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * radius * 0.72, Math.sin(angle) * radius * 0.72, 0.42, 4, i * 29 + 70);
    ctx.restore();
  }
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78, 2.4);
  }
  drawRivet(ctx, 0, 0, 8);
}

function drawPulleyWheel(ctx, part, state = {}) {
  setup(ctx, part, part.key === "pulley.wheel.large" ? 1.65 : 1.85, 0.76);
  const phase = state.previewMotion === false ? 0 : (state.time || 0) * Math.max(0.45, Math.abs(state.motionSpeed ?? 0.65));
  if (part.key === "pulley.wheel.large") {
    drawLargeIndustrialPulley(ctx, phase);
  } else {
    drawCompactPulleyWheel(ctx, phase);
  }
}

function drawPulleyRig(ctx, part, state = {}) {
  drawPulleyBeltLoop(ctx, part, state);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  drawMiniPulley(ctx, -70, 24, 27, 5, time * 0.8);
  drawMiniPulley(ctx, 56, -16, 43, 7, -time * 0.54);
}

function drawSprocketRing(ctx, part, state) {
  drawGear(ctx, part, state, 58, 38);
  setup(ctx, part, 1.45, 0.68);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  roughCircle(ctx, 0, 0, 46, 0.75, 170);
  for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * 47, Math.sin(angle) * 47, 2.7);
  }
}

function drawBoltedRing(ctx, part) {
  const style = setup(ctx, part, 1.9, 0.78);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 5, 6, 0.055);
  outer();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.76);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha *= 0.28;
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const angle = i / 10 * Math.PI * 2;
    drawRivet(ctx, Math.cos(angle) * 46, Math.sin(angle) * 46, 4);
  }
}

function drawUClamp(ctx, part) {
  setup(ctx, part, 2, 0.78);
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 19;
  ctx.beginPath();
  ctx.arc(0, -4, 46, Math.PI, Math.PI * 2);
  ctx.moveTo(-46, -4);
  ctx.lineTo(-46, 46);
  ctx.moveTo(46, -4);
  ctx.lineTo(46, 46);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(18,22,25,0.24)";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.arc(0, -4, 46, Math.PI, Math.PI * 2);
  ctx.moveTo(-46, -4);
  ctx.lineTo(-46, 46);
  ctx.moveTo(46, -4);
  ctx.lineTo(46, 46);
  ctx.stroke();
  drawHatching(ctx, { x: -58, y: -56, w: 116, h: 112 }, -0.68, 7, 0.045, 0.55);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roughCircle(ctx, 0, -4, 46, 0.85, 90, 1, Math.PI, Math.PI * 2);
  roughLine(ctx, -46, -4, -46, 46, 0.65, 8, 91);
  roughLine(ctx, 46, -4, 46, 46, 0.65, 8, 92);
  drawPencilRect(ctx, -66, 42, 40, 24, 5, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.04 });
  drawPencilRect(ctx, 26, 42, 40, 24, 5, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.04 });
  drawRivet(ctx, -46, 54, 3.4);
  drawRivet(ctx, 46, 54, 3.4);
}

function drawFootBracket(ctx, part) {
  setup(ctx, part, 1.9, 0.78);
  drawPencilRect(ctx, -62, 14, 124, 36, 5, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6, shadow: 0.045 });
  drawPencilRect(ctx, -48, -58, 34, 92, 5, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6, shadow: 0.045 });
  const gusset = () => {
    ctx.beginPath();
    ctx.moveTo(-14, 14);
    ctx.lineTo(38, 14);
    ctx.lineTo(-14, -38);
    ctx.closePath();
  };
  drawCastShadow(ctx, gusset, 3, 4, 0.045);
  pencilShade(ctx, gusset, { x: -18, y: -42, w: 60, h: 60 }, { wash: 0.1, hatch: 0.055, cross: 0.02, spacing: 6 });
  gusset();
  ctx.stroke();
  for (const point of [[-42, 32], [42, 32], [-31, -38], [-31, -8]]) drawRivet(ctx, point[0], point[1], 3.4);
}

function drawRivetedPlate(ctx, part) {
  setup(ctx, part, 1.7, 0.76);
  drawPencilRect(ctx, -70, -46, 140, 92, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 7, shadow: 0.04 });
  for (const point of [[-52, -28], [0, -28], [52, -28], [-52, 28], [0, 28], [52, 28]]) drawRivet(ctx, point[0], point[1], 3.3);
  ctx.strokeStyle = "rgba(18,22,25,0.2)";
  ctx.lineWidth = 1;
  if (!part.cleanPlate) {
    roughLine(ctx, -48, 0, 48, 0, 0.6, 10, 311);
  }
}

function drawVentGrille(ctx, part) {
  setup(ctx, part, 1.7, 0.76);
  drawPencilRect(ctx, -70, -42, 140, 84, 5, { wash: 0.085, hatch: 0.045, cross: 0.018, spacing: 8, shadow: 0.04 });
  ctx.strokeStyle = "rgba(18,22,25,0.48)";
  ctx.lineWidth = 2.2;
  for (let y = -26; y <= 26; y += 13) roughLine(ctx, -52, y, 52, y, 0.55, 12, y + 220);
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 1;
  for (let y = -20; y <= 32; y += 13) roughLine(ctx, -46, y, 46, y, 0.35, 10, y + 240);
  for (const point of [[-58, -31], [58, -31], [-58, 31], [58, 31]]) drawRivet(ctx, point[0], point[1], 2.9);
}

function drawMeshPanel(ctx, part) {
  setup(ctx, part, 1.45, 0.68);
  drawPencilRect(ctx, -74, -44, 148, 88, 4, { fill: "rgba(255,255,255,0.12)", wash: 0.05, hatch: 0.025, cross: 0.01, spacing: 9, shadow: 0.035 });
  ctx.save();
  roundedRect(ctx, -66, -36, 132, 72, 3);
  ctx.clip();
  ctx.strokeStyle = "rgba(18,22,25,0.32)";
  ctx.lineWidth = 0.9;
  for (let x = -78; x <= 78; x += 9) roughLine(ctx, x, -48, x + 62, 48, 0.35, 8, x + 370);
  for (let x = -78; x <= 78; x += 9) roughLine(ctx, x, 48, x + 62, -48, 0.35, 8, x + 470);
  ctx.restore();
}

function drawPencilChainLink(ctx, x, y, angle, seed, major = 28, minor = 13) {
  const link = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, major, minor, 0, 0, Math.PI * 2);
  };

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawCastShadow(ctx, link, 2.3, 3, 0.045);
  ctx.strokeStyle = "rgba(18,22,25,0.14)";
  ctx.lineWidth = 8;
  link();
  ctx.stroke();
  pencilShade(ctx, link, { x: -major, y: -minor, w: major * 2, h: minor * 2 }, {
    wash: 0.075,
    hatch: 0.035,
    cross: 0.012,
    spacing: 5,
    texture: 0.03
  });
  ctx.strokeStyle = "rgba(18,22,25,0.54)";
  ctx.lineWidth = 2.15;
  link();
  ctx.stroke();
  roughCircle(ctx, 0, 0, major, 0.45, seed, minor / major);
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 1;
  roughLine(ctx, -major * 0.54, -minor * 0.45, major * 0.54, -minor * 0.45, 0.3, 5, seed + 33);
  ctx.restore();
}

function drawChainSegment(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.76);
  const gasLevel = part.liveGasMeter ? gasLevelFor(state) : 0;
  const offset = part.liveGasMeter ? Math.sin((state.time || 0) * (2 + gasLevel * 7)) * (2 + gasLevel * 5) : 0;
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.045)";
  ctx.lineWidth = 5;
  roughLine(ctx, -88, 4, 88, 4, 0.55, 18, 520);
  ctx.restore();

  for (let i = -3; i <= 3; i++) {
    const x = i * 26 + offset;
    drawPencilChainLink(ctx, x, i % 2 ? -1 : 1, i % 2 ? Math.PI / 2 : 0, 610 + i * 21, i % 2 ? 20 : 26, i % 2 ? 10 : 12);
  }

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.34)";
  ctx.lineWidth = 1.15;
  for (let x = -78; x <= 78; x += 26) {
    roughLine(ctx, x - 7, -9, x + 7, 9, 0.32, 3, 700 + x);
    drawRivet(ctx, x, 0, 2.3);
  }
  ctx.restore();
}

function drawAxleRod(ctx, part) {
  setup(ctx, part, 1.7, 0.78);
  const shaft = () => roundedRect(ctx, -88, -11, 176, 22, 11);
  drawCastShadow(ctx, shaft, 3, 4, 0.045);
  shaft();
  ctx.fillStyle = "rgba(251,250,245,0.5)";
  ctx.fill();
  pencilShade(ctx, shaft, { x: -90, y: -14, w: 180, h: 28 }, {
    wash: 0.105,
    hatch: 0.052,
    cross: 0.016,
    spacing: 6,
    texture: 0.04
  });
  ctx.strokeStyle = "rgba(18,22,25,0.5)";
  ctx.lineWidth = 1.7;
  shaft();
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 1.05;
  roughLine(ctx, -76, -5.5, 76, -5.5, 0.35, 16, 560);
  ctx.strokeStyle = "rgba(18,22,25,0.2)";
  ctx.lineWidth = 1.05;
  roughLine(ctx, -76, 6, 76, 6, 0.35, 16, 561);
  ctx.restore();

  for (const x of [-82, 82]) {
    drawPencilRect(ctx, x - 15, -19, 30, 38, 5, {
      fill: "rgba(251,250,245,0.68)",
      wash: 0.12,
      hatch: 0.062,
      cross: 0.018,
      spacing: 5,
      shadow: 0.032,
      lineWidth: 1.55
    });
    drawRivet(ctx, x, 0, 3.1);
  }

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.36)";
  ctx.lineWidth = 1.05;
  for (let x = -58; x <= 58; x += 14) {
    roughLine(ctx, x - 5, 10, x + 5, -10, 0.26, 3, 580 + x);
  }
  for (const x of [-46, 0, 46]) {
    roughLine(ctx, x, -11, x, 11, 0.28, 4, 640 + x);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.48)";
  ctx.lineWidth = 1.35;
  roughLine(ctx, -106, 0, -97, 0, 0.25, 2, 660);
  roughLine(ctx, 97, 0, 106, 0, 0.25, 2, 661);
  drawRivet(ctx, -108, 0, 2.4);
  drawRivet(ctx, 108, 0, 2.4);
  ctx.restore();
}

function drawFaceStroke(ctx, part) {
  const style = setup(ctx, part, 1.45, 0.96);
  const strokeColor = colorAlpha(style.stroke || "#baffdf", 0.96);
  const glowColor = colorAlpha(style.dim || style.stroke || "#76ffc4", 0.5);
  const highlightColor = colorAlpha(style.highlight || "#f5ffee", 0.76);
  const isMouth = part.facePart === "mouth";
  const half = isMouth ? 78 : 70;
  const lift = isMouth ? 2 : -1;
  // Expression curve: arc>0 bows the middle down (smile mouth / droopy eyes), arc<0 bows it up
  // (happy-arched eyes / frown). When unset (0) the stroke renders EXACTLY as before.
  const arc = Number(part.arc || 0);
  const mid = lift + arc * (isMouth ? 22 : 20);

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isMouth ? 7 : 8.5;
  ctx.beginPath();
  if (arc) {
    ctx.moveTo(-half, lift);
    ctx.quadraticCurveTo(0, mid, half, lift);
  } else {
    ctx.moveTo(-half, lift + (isMouth ? 3 : 1));
    ctx.quadraticCurveTo(-half * 0.35, lift - 4, 0, lift - 2);
    ctx.quadraticCurveTo(half * 0.4, lift, half, lift - (isMouth ? 5 : 7));
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = isMouth ? 1.35 : 1.55;
  const hy = arc ? lift + mid * 0.35 : lift - 2;
  roughLine(ctx, -half + 10, hy, half - 12, arc ? hy : lift - (isMouth ? 6 : 8), 0.14, 8, 2230);
  ctx.restore();
}

function drawFacePupil(ctx, part, state = {}) {
  const style = setup(ctx, part, 1.25, 0.96);
  const glowColor = colorAlpha(style.dim || style.stroke || "#76ffc4", 0.58);
  const pupilPath = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 20, 0, 0, Math.PI * 2);
  };

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = colorAlpha(style.fill || "#9bffcd", 0.82);
  pupilPath();
  ctx.fill();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = colorAlpha(style.highlight || "#f5ffee", 0.12);
  ctx.beginPath();
  ctx.ellipse(-2, -2, 13, 12, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colorAlpha(style.stroke || "#baffdf", 0.82);
  ctx.lineWidth = 1;
  pupilPath();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 0.8;
  roughLine(ctx, -7, -6, 7, -7, 0.1, 3, 2248);
  ctx.restore();
}

function drawFastenerKit(ctx, part) {
  setup(ctx, part, 1.45, 0.72);
  const positions = [
    [-50, -22, "rivet"], [-25, -22, "washer"], [0, -22, "slot"], [25, -22, "cross"], [50, -22, "bolt"],
    [-50, 2, "cross"], [-25, 2, "rivet"], [0, 2, "washer"], [25, 2, "bolt"], [50, 2, "slot"],
    [-50, 26, "bolt"], [-25, 26, "slot"], [0, 26, "rivet"], [25, 26, "washer"], [50, 26, "cross"]
  ];
  for (const [x, y, type] of positions) {
    drawFastenerShape(ctx, x, y, type, 1, x + y + 700);
  }
}

function drawFastenerShape(ctx, x, y, type, scale = 1, seed = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (type === "rivet") {
    drawRivet(ctx, 0, 0, 5.8);
    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = 0.8;
    roughLine(ctx, -2.8, -2.8, 2.4, -3.2, 0.18, 2, seed + 1);
  } else if (type === "washer") {
    const outer = () => {
      ctx.beginPath();
      ctx.arc(0, 0, 8.2, 0, Math.PI * 2);
    };
    drawCastShadow(ctx, outer, 1.4, 1.8, 0.04);
    pencilShade(ctx, outer, { x: -9, y: -9, w: 18, h: 18 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    outer();
    ctx.strokeStyle = "rgba(18,22,25,0.58)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = "rgba(251,250,245,0.86)";
    ctx.beginPath();
    ctx.arc(0, 0, 3.3, 0, Math.PI * 2);
    ctx.fill();
    roughCircle(ctx, 0, 0, 3.3, 0.25, seed + 7);
  } else if (type === "slot") {
    drawFastenerShape(ctx, 0, 0, "rivet", 1.02, seed + 9);
    ctx.strokeStyle = "rgba(18,22,25,0.56)";
    ctx.lineWidth = 1.15;
    roughLine(ctx, -5.5, 0, 5.5, 0, 0.22, 3, seed + 12);
  } else if (type === "cross") {
    drawFastenerShape(ctx, 0, 0, "rivet", 1.02, seed + 14);
    ctx.strokeStyle = "rgba(18,22,25,0.56)";
    ctx.lineWidth = 1.05;
    roughLine(ctx, -4.9, 0, 4.9, 0, 0.2, 2, seed + 16);
    roughLine(ctx, 0, -4.9, 0, 4.9, 0.2, 2, seed + 18);
  } else if (type === "nut") {
    const nut = () => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
        const px = Math.cos(angle) * 9.5;
        const py = Math.sin(angle) * 9.5;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
    };
    drawCastShadow(ctx, nut, 1.5, 2, 0.045);
    pencilShade(ctx, nut, { x: -10, y: -10, w: 20, h: 20 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    nut();
    ctx.strokeStyle = "rgba(18,22,25,0.58)";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.fillStyle = "rgba(251,250,245,0.84)";
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    roughCircle(ctx, 0, 0, 3.8, 0.25, seed + 22);
  } else if (type === "pin") {
    drawPencilRect(ctx, -11, -3.5, 22, 7, 3.5, { wash: 0.075, hatch: 0.03, cross: 0.008, spacing: 4, shadow: 0.022, lineWidth: 1.1 });
    drawRivet(ctx, -12.5, 0, 3.1);
    drawRivet(ctx, 12.5, 0, 3.1);
  } else {
    const bolt = () => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i / 6 * Math.PI * 2;
        const px = Math.cos(angle) * 8.2;
        const py = Math.sin(angle) * 8.2;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    drawCastShadow(ctx, bolt, 1.5, 2, 0.045);
    pencilShade(ctx, bolt, { x: -9, y: -9, w: 18, h: 18 }, { wash: 0.1, hatch: 0.045, cross: 0.012, spacing: 4, texture: 0.025 });
    bolt();
    ctx.strokeStyle = "rgba(18,22,25,0.58)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    drawRivet(ctx, 0, 0, 2.6);
  }

  ctx.restore();
}

function drawFastenerPart(ctx, part) {
  setup(ctx, part, 1.45, 0.78);
  const type = {
    "fastener.rivet": "rivet",
    "fastener.washer": "washer",
    "fastener.slotted": "slot",
    "fastener.cross": "cross",
    "fastener.hex": "bolt",
    "fastener.nut": "nut",
    "fastener.pin": "pin"
  }[part.key] || "bolt";
  drawFastenerShape(ctx, 0, 0, type, 1.9, (part.id || 1) * 17);
}

function drawLighteningHole(ctx, x, y, radius, seed) {
  const hole = () => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  };
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  hole();
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,25,0.36)";
  ctx.lineWidth = 1.25;
  hole();
  ctx.stroke();
  roughCircle(ctx, x, y, radius, 0.45, seed);
  ctx.restore();
}

function drawWebGear(ctx, part, state) {
  drawGear(ctx, part, state, 64, 30);
  setup(ctx, part, 1.35, 0.68);
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    drawLighteningHole(ctx, Math.cos(angle) * 39, Math.sin(angle) * 39, 8.5, 810 + i);
  }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2 + Math.PI / 8;
    drawRivet(ctx, Math.cos(angle) * 52, Math.sin(angle) * 52, 2.6);
  }
}

function drawLargeSpokeGear(ctx, part, state) {
  drawGear(ctx, part, state, 84, 36);
  setup(ctx, part, 1.65, 0.72);
  ctx.save();
  ctx.strokeStyle = "rgba(18,22,25,0.48)";
  ctx.lineWidth = 8;
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2 + Math.sin((state?.time || 0) * 0.2) * 0.02;
    roughLine(ctx, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * 70, Math.sin(angle) * 70, 0.6, 8, 840 + i);
    drawRivet(ctx, Math.cos(angle) * 58, Math.sin(angle) * 58, 3.2);
  }
  ctx.restore();
  drawLighteningHole(ctx, 0, 0, 16, 848);
  roughCircle(ctx, 0, 0, 73, 0.7, 849);
  roughCircle(ctx, 0, 0, 31, 0.55, 850);
}

function drawFineSpokeWheel(ctx, part) {
  setup(ctx, part, 1.8, 0.78);
  const outer = () => {
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, outer, 5, 6, 0.055);
  pencilShade(ctx, outer, { x: -66, y: -66, w: 132, h: 132 }, { wash: 0.09, hatch: 0.052, cross: 0.02, spacing: 7 });
  outer();
  ctx.stroke();
  roughCircle(ctx, 0, 0, 48, 0.65, 870);
  roughCircle(ctx, 0, 0, 18, 0.45, 871);
  ctx.strokeStyle = "rgba(18,22,25,0.5)";
  ctx.lineWidth = 1.45;
  for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2;
    roughLine(ctx, Math.cos(angle) * 18, Math.sin(angle) * 18, Math.cos(angle) * 58, Math.sin(angle) * 58, 0.48, 6, 880 + i);
  }
  drawRivet(ctx, 0, 0, 5.2);
}

function drawBevelGearPair(ctx, part, state = {}) {
  setup(ctx, part, 1.8, 0.76);
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const speed = state.previewMotion === false ? 0 : Math.max(0.45, Math.abs(state.motionSpeed ?? 0.82));
  const direction = (state.motionSpeed ?? 1) < 0 ? -1 : 1;
  const drivePhase = time * speed * direction * 1.9;
  const drawConeGear = (x, y, scaleX, scaleY, teeth, tilt, phase, seed) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scaleX, scaleY);
    const body = () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 24, 0, 0, Math.PI * 2);
    };
    drawCastShadow(ctx, body, 4, 5, 0.052);
    pencilShade(ctx, body, { x: -44, y: -26, w: 88, h: 52 }, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 6 });
    body();
    ctx.stroke();

    ctx.save();
    ctx.rotate(phase);
    ctx.strokeStyle = "rgba(18,22,25,0.44)";
    ctx.lineWidth = 1.35;
    for (let i = 0; i < 5; i++) {
      const angle = i / 5 * Math.PI * 2;
      roughLine(ctx, Math.cos(angle) * 8, Math.sin(angle) * 4, Math.cos(angle) * 34, Math.sin(angle) * 19, 0.35, 4, seed + i);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.9;
    roughLine(ctx, Math.cos(phase) * -22, -10, Math.cos(phase) * 18, -12, 0.25, 4, seed + 25);
    ctx.restore();

    for (let i = 0; i < teeth; i++) {
      const angle = i / teeth * Math.PI * 2 + phase;
      const x1 = Math.cos(angle) * 43;
      const y1 = Math.sin(angle) * 24;
      const x2 = Math.cos(angle) * 54;
      const y2 = Math.sin(angle) * 29;
      roughLine(ctx, x1, y1, x2, y2, 0.42, 2, 900 + i);
    }
    roughCircle(ctx, 0, 0, 21, 0.46, 930, 0.58);
    roughLine(ctx, Math.cos(phase) * 7, Math.sin(phase) * 4, Math.cos(phase) * 26, Math.sin(phase) * 15, 0.24, 3, 932);
    drawRivet(ctx, 0, 0, 4);
    ctx.restore();
  };

  drawConeGear(-42, 4, 1, 1, 22, -0.34, drivePhase, 910);
  drawConeGear(42, -6, 0.88, 0.92, 20, 0.48, -drivePhase * 1.16 + Math.PI / 9, 960);
  ctx.strokeStyle = "rgba(18,22,25,0.32)";
  ctx.lineWidth = 1.3;
  roughLine(ctx, -2, -31, 8, 30, 0.55, 8, 940);
  ctx.save();
  ctx.strokeStyle = "rgba(42,137,174,0.38)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 9]);
  ctx.lineDashOffset = -time * speed * 22;
  roughLine(ctx, -13, -20, 22, 20, 0.35, 7, 947);
  ctx.restore();
}

function drawCoupledStraightPipe(ctx, part, state) {
  setup(ctx, part, 2.1, 0.8);
  drawPencilRect(ctx, -104, -16, 208, 32, 12, { wash: 0.09, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.045 });
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 1;
  roughLine(ctx, -84, -7, 84, -7, 0.35, 18, 950);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  roughLine(ctx, -88, 0, 88, 0, 0.45, 18, 951);
  drawFlowLine(ctx, -80, 0, 80, 0, state);
  drawStraightPipeSocket(ctx, -112, -24, 28, 48, "west");
  drawStraightPipeSocket(ctx, 84, -24, 28, 48, "east");
  for (const x of [-52, 0, 52]) {
    drawPencilRect(ctx, x - 14, -22, 28, 44, 4, { wash: 0.12, hatch: 0.07, cross: 0.025, spacing: 5, shadow: 0.032 });
    drawRivet(ctx, x, -16, 2.6);
    drawRivet(ctx, x, 16, 2.6);
  }
  drawConnectorMark(ctx, -112, 0);
  drawConnectorMark(ctx, 112, 0);
}

function drawSegmentElbowPipe(ctx, part, state) {
  drawElbowPipe(ctx, part, state);
  setup(ctx, part, 1.55, 0.7);
  ctx.save();
  ctx.globalAlpha *= 0.72;
  ctx.strokeStyle = "rgba(18,22,25,0.22)";
  ctx.lineWidth = 1.25;
  roughLine(ctx, -56, -52, -24, -52, 0.28, 5, 982);
  roughLine(ctx, -54, -40, -25, -40, 0.28, 5, 983);
  roughLine(ctx, 43, 26, 71, 26, 0.28, 5, 984);
  roughLine(ctx, 43, 54, 71, 54, 0.28, 5, 985);
  ctx.restore();
}

function cubicPoint(points, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * points[0][0] + 3 * mt * mt * t * points[1][0] + 3 * mt * t * t * points[2][0] + t * t * t * points[3][0],
    y: mt * mt * mt * points[0][1] + 3 * mt * mt * t * points[1][1] + 3 * mt * t * t * points[2][1] + t * t * t * points[3][1]
  };
}

function drawBezierFlow(ctx, points, state = {}, width = 5.4) {
  const time = state.previewMotion === false ? 0 : state.time || 0;
  const theme = liquidTheme(state);
  const flowPath = () => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = theme.glow;
  ctx.lineWidth = width;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 33;
  flowPath();
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(theme.base, 0.58);
  ctx.lineWidth = Math.max(1.3, width * 0.28);
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -time * 33;
  flowPath();
  ctx.stroke();
  ctx.setLineDash([]);
  const pulse = (time * 0.72) % 1;
  const p = cubicPoint(points, pulse);
  ctx.fillStyle = theme.glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colorAlpha(theme.accent, 0.88);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoupledArcPipe(ctx, part, state) {
  const points = [[-84, 24], [-42, -48], [42, -48], [84, 24]];
  setup(ctx, part, 2, 0.78);
  ctx.save();
  ctx.translate(5, 7);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 38;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(18,22,25,0.14)";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx.stroke();
  drawHatching(ctx, { x: -94, y: -56, w: 188, h: 104 }, -0.72, 7, 0.05, 0.68);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  roughBezier(ctx, points, 0.65, 990);
  roughBezier(ctx, [[-66, 28], [-32, -20], [32, -20], [66, 28]], 0.5, 991);
  drawBezierFlow(ctx, [[-64, 20], [-30, -24], [30, -24], [64, 20]], state, 5.6);
  drawPencilRect(ctx, -98, 3, 32, 46, 5, { wash: 0.13, hatch: 0.075, cross: 0.025, spacing: 5, shadow: 0.035 });
  drawPencilRect(ctx, 66, 3, 32, 46, 5, { wash: 0.13, hatch: 0.075, cross: 0.025, spacing: 5, shadow: 0.035 });
  drawPencilRect(ctx, -18, -50, 36, 20, 4, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 5, shadow: 0.028 });
  drawConnectorMark(ctx, -98, 24);
  drawConnectorMark(ctx, 98, 24);
}

function drawFlexibleTube(ctx, part, state) {
  const points = [[-86, 28], [-54, -46], [44, -48], [86, 14]];
  setup(ctx, part, 1.9, 0.78);
  ctx.save();
  ctx.translate(5, 7);
  ctx.strokeStyle = "rgba(0,0,0,0.055)";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(18,22,25,0.17)";
  ctx.lineWidth = 31;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.7;
  roughBezier(ctx, points, 0.7, 1010);
  roughBezier(ctx, [[-68, 28], [-40, -18], [34, -20], [68, 14]], 0.52, 1011);
  ctx.strokeStyle = "rgba(18,22,25,0.5)";
  ctx.lineWidth = 2.1;
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
    roughLine(ctx, p.x - nx * 18, p.y - ny * 18, p.x + nx * 18, p.y + ny * 18, 0.38, 3, 1020 + i);
  }
  drawBezierFlow(ctx, [[-66, 22], [-38, -18], [32, -20], [66, 12]], state, 4.8);
  drawStraightPipeSocket(ctx, -102, 6, 28, 44, "west");
  drawStraightPipeSocket(ctx, 74, -8, 28, 44, "east");
  drawConnectorMark(ctx, -102, 28);
  drawConnectorMark(ctx, 102, 14);
}

function drawHingeLeaf(ctx, part) {
  setup(ctx, part, 1.7, 0.76);
  drawPencilRect(ctx, -78, -48, 54, 96, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.04 });
  drawPencilRect(ctx, 24, -48, 54, 96, 5, { wash: 0.095, hatch: 0.055, cross: 0.02, spacing: 6, shadow: 0.04 });
  ctx.strokeStyle = "rgba(18,22,25,0.56)";
  ctx.lineWidth = 2;
  for (const y of [-30, 0, 30]) {
    drawPencilRect(ctx, -16, y - 14, 32, 28, 14, { wash: 0.11, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  }
  roughLine(ctx, 0, -48, 0, 48, 0.45, 12, 1040);
  for (const point of [[-58, -30], [-44, 30], [44, -30], [58, 30]]) drawRivet(ctx, point[0], point[1], 3.6);
}

function drawLinkJoint(ctx, part) {
  setup(ctx, part, 1.8, 0.76);
  drawPencilRect(ctx, -18, -54, 36, 108, 12, { wash: 0.1, hatch: 0.06, cross: 0.02, spacing: 6, shadow: 0.04 });
  for (const y of [-64, 64]) {
    const ring = () => {
      ctx.beginPath();
      ctx.arc(0, y, 25, 0, Math.PI * 2);
    };
    drawCastShadow(ctx, ring, 3, 4, 0.042);
    pencilShade(ctx, ring, { x: -27, y: y - 27, w: 54, h: 54 }, { wash: 0.09, hatch: 0.045, cross: 0.016, spacing: 6 });
    ring();
    ctx.stroke();
    drawLighteningHole(ctx, 0, y, 11, 1050 + y);
  }
  drawRivet(ctx, 0, 0, 4.2);
}

function drawBallJoint(ctx, part) {
  setup(ctx, part, 1.8, 0.76);
  drawPencilRect(ctx, -84, -10, 168, 20, 10, { wash: 0.09, hatch: 0.05, cross: 0.018, spacing: 6, shadow: 0.035 });
  for (const x of [-58, 58]) {
    const cup = () => {
      ctx.beginPath();
      ctx.arc(x, 0, 27, 0, Math.PI * 2);
    };
    drawCastShadow(ctx, cup, 3, 4, 0.045);
    pencilShade(ctx, cup, { x: x - 29, y: -29, w: 58, h: 58 }, { wash: 0.11, hatch: 0.06, cross: 0.02, spacing: 6 });
    cup();
    ctx.stroke();
    drawLighteningHole(ctx, x, 0, 11, 1060 + x);
  }
  drawPencilRect(ctx, -14, -18, 28, 36, 6, { wash: 0.12, hatch: 0.06, cross: 0.018, spacing: 5, shadow: 0.025 });
  drawRivet(ctx, 0, 0, 3.8);
}

export const PARTS = {
  "gear.small": {
    id: 1,
    label: "Small Gear",
    category: "mechanical",
    kind: "gear",
    radius: 36,
    teeth: 18,
    owned: true,
    canDuplicate: true,
    draw: (ctx, p, s) => drawGear(ctx, p, s, 36, 18)
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
    draw: (ctx, p, s) => drawGear(ctx, p, s, 58, 24)
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
    draw: (ctx, p, s) => drawGear(ctx, p, s, 92, 32)
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

export function getPart(key) {
  return PARTS[key];
}

export function listParts() {
  return Object.entries(PARTS)
    .filter(([, value]) => value.showInLibrary !== false)
    .map(([key, value]) => ({ key, ...value }));
}

export function partBounds(part) {
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

export function getPartRadius(part) {
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

export function getConnectors(part) {
  const def = getPart(part.key);
  return (def?.connectors || []).map((connector) => transformConnector(part, connector));
}

export function getVisualConnectors(part) {
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
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function drawPart(ctx, part, state) {
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

  ctx.save();
  ctx.globalAlpha *= part.opacity ?? 1;
  ctx.globalAlpha *= part.locked || part.owned === false ? 0.42 : 1;
  ctx.translate(part.x, part.y);
  ctx.rotate(part.rotation || 0);
  ctx.scale((part.flipX ? -1 : 1) * (part.scaleX || 1), (part.flipY ? -1 : 1) * (part.scaleY || 1));
  if (state?.canvasMode === "tealPfp") {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.filter = "contrast(1.45) saturate(1.2)";
    ctx.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx.shadowBlur = 0;
    const boostedAlpha = ctx.globalAlpha;
    ctx.globalAlpha = boostedAlpha * 0.9;
    ctx.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx.globalAlpha = boostedAlpha * 0.72;
    ctx.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx.globalAlpha = boostedAlpha * 0.54;
    ctx.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
    ctx.filter = "none";
  } else {
    ctx.drawImage(effectCanvas, bounds.x - pad, bounds.y - pad);
  }
  ctx.restore();
}

export function getPartCacheStats() {
  return {
    size: STATIC_PART_CACHE.size,
    hits: staticPartCacheHits,
    misses: staticPartCacheMisses
  };
}

function drawLockedHatch(ctx, part) {
  const bounds = partBounds({ ...part, scaleX: 1, scaleY: 1 });
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.26)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.setLineDash([]);
  for (let x = bounds.x - bounds.h; x < bounds.x + bounds.w; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, bounds.y + bounds.h);
    ctx.lineTo(x + bounds.h, bounds.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPartPreview(ctx, key, owned = true) {
  const def = getPart(key);
  if (!def) return;
  const canvas = ctx.canvas;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  const bounds = partBounds({ key, scaleX: 1, scaleY: 1 });
  const fitScale = Math.min(
    (canvas.width * (def.previewPadX ?? 0.78)) / Math.max(1, bounds.w),
    (canvas.height * (def.previewPadY ?? 0.76)) / Math.max(1, bounds.h)
  );
  const scale = Math.min(def.previewMaxScale ?? 0.78, fitScale);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(bounds.x + bounds.w / 2), -(bounds.y + bounds.h / 2));
  const previewPart = { id: PARTS[key]?.id || 1, key, material: "graphiteInk", shadeStyle: "pencilSketch", opacity: 1 };
  def.draw(ctx, previewPart, {
    time: 0,
    previewMotion: false,
    fillLevel: 70,
    colorIndex: 8,
    liquidColor: LIQUID_PALETTE[8],
    liquidAccent: LIQUID_ACCENTS[8],
    liquidGlow: LIQUID_GLOWS[8],
    texture: "Starfield"
  });
  applyMaterialFinish(ctx, previewPart, {});
  drawOuterPencilEdge(ctx, previewPart);
  applyShadeFinish(ctx, previewPart, "pencilSketch", {});
  ctx.restore();
}
