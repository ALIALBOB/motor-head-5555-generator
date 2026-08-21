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
// Parts whose draw() genuinely changes per frame under motion/interaction (liquids, spinning gears/pulleys,
// gauges, eyes, the DDG propeller, gas meters …). Auto-detected by pixel-diffing every part across varying
// time/wind/gas/fill/level/mouseLook (scratchpad/anim-detect.mjs). ONLY these bypass the static cache while
// motion is on — every other part is cached even during motion, so stacking many static parts stays smooth.
// Rotation-driven spin (part.rotation) is applied AFTER the cache, so plain gears are NOT in here.
// ⚠️ Re-run anim-detect and update this set if you add a part that animates inside its draw().
const ANIMATED_PART_KEYS = new Set([
  "ddg.propellerCap", "ddg.sprayCap", "pet.eye.lens", "wheel.belt", "pipe.straight", "pipe.elbow", "tank.fluid", "tank.round",
  "tank.core", "tank.vials", "tank.head.square", "tube.vial.ornate", "tube.vial.crystal", "tube.vial.column",
  "tube.loop.ring", "tube.loop.oval", "tube.sealed.u", "tube.sealed.curve", "tube.sealed.straight",
  "tube.cell.mini", "tube.port.bolted", "gauge.pressure", "gear.bevel", "valve.steam", "tank.mercury",
  "pipe.ghost", "rig.pulley", "pulley.wheel", "pulley.wheel.large", "pulley.belt", "chain.segment",
  "gear.spoked.large", "gear.bevel.pair", "pipe.sleeved", "pipe.elbow.segment", "pipe.arc.coupled", "tube.flex",
  "pipe.curve", "wire.arc", "pack.gas.reader", "battery.charge.head", "magnet.u.head", "drop.liquid",
  "pack.shoulder.shell", "counter.block", "pack.icon"
]);
let staticPartCacheHits = 0;
let staticPartCacheMisses = 0;

function staticPartCacheKey(part, state = {}, shadeStyle = "pencilSketch", width = 0, height = 0) {
  // Only truly-animated parts must dodge the cache while motion / mouse-look is live; static parts stay cached.
  const dynamic = ANIMATED_PART_KEYS.has(String(part.key || ""));
  if (dynamic && state.previewMotion !== false) return null;
  if (dynamic && state.mouseLook?.active) return null;
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
  if (part.skipMaterialFinish === true) return;
  if (part.key === "pack.icon" || part.key === "pack.shoulder.shell" || part.key === "pack.shoulder.band") return;
  if (String(part.key || "").startsWith("ddg.")) return; // DDG collab parts are flat cartoon — no glassy finish
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
    ["gear", "wheel", "bevel", "face", "panel", "shell"].includes(def?.kind);
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

function drawGoldenDome(ctx, part) {
  // Smooth solid domed shell (helmet crown / skull cranium / hat crown). Filled so the
  // material + golden skin wash reads as gold, unlike the hollow tooth/tank parts.
  const style = setup(ctx, part, 2.4, 0.82);
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(-80, 48);
    ctx.bezierCurveTo(-94, -30, -48, -70, 0, -70);
    ctx.bezierCurveTo(48, -70, 94, -30, 80, 48);
    ctx.closePath();
  };
  drawCastShadow(ctx, dome, 5, 7, 0.05);
  dome();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.86);
  ctx.fill();
  ctx.stroke();
  // Bold panel seams dividing the dome into plated segments (so it isn't a smooth blob).
  ctx.strokeStyle = "rgba(38,21,3,0.62)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -68); ctx.lineTo(0, 46);
  ctx.moveTo(-44, -54); ctx.bezierCurveTo(-36, -6, -36, 22, -38, 46);
  ctx.moveTo(44, -54); ctx.bezierCurveTo(36, -6, 36, 22, 38, 46);
  ctx.stroke();
  // Riveted band across the lower dome.
  ctx.strokeStyle = "rgba(38,21,3,0.5)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-74, 18); ctx.quadraticCurveTo(0, 28, 74, 18); ctx.stroke();
  for (let i = -3; i <= 3; i += 1) {
    const rx = i * 22;
    const ry = 22 + Math.abs(rx) * 0.05;
    ctx.fillStyle = "rgba(28,16,2,0.74)";
    ctx.beginPath(); ctx.arc(rx, ry, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,244,190,0.5)";
    ctx.beginPath(); ctx.arc(rx - 0.7, ry - 0.7, 1.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(255,246,206,0.5)";
  ctx.beginPath();
  ctx.ellipse(-22, -36, 22, 13, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoldenSpike(ctx, part) {
  // Solid tapered forged spike (helm crest / skull tooth via rotate 180). Tip points up.
  const style = setup(ctx, part, 1.8, 0.82);
  const spike = () => {
    ctx.beginPath();
    ctx.moveTo(-17, 54);
    ctx.quadraticCurveTo(-9, 2, 0, -56);
    ctx.quadraticCurveTo(9, 2, 17, 54);
    ctx.closePath();
  };
  drawCastShadow(ctx, spike, 3, 4, 0.05);
  spike();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.88);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,244,183,0.6)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-3, 46);
  ctx.lineTo(0, -50);
  ctx.stroke();
}

function drawGoldenArmorPlate(ctx, part) {
  // A smooth rounded armour plate with a bright top bevel and a dark bottom shadow lip, so when
  // many are stacked/overlapped they read as layered gold body-armour (see reference), each plate
  // catching light on top and casting a seam-shadow onto the plate below.
  const style = setup(ctx, part, 2.6, 0.82);
  const W = 70, H = 40, R = 15;
  const plate = () => {
    ctx.beginPath();
    ctx.roundRect(-W, -H, W * 2, H * 2, R);
  };
  drawCastShadow(ctx, plate, 3, 6, 0.07);
  // Opaque gold under-fill so stacked plates don't show the darker core/other plates through them.
  plate();
  ctx.fillStyle = "#8a5a12";
  ctx.fill();
  plate();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.94);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,248,206,0.62)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-W + R, -H + 3);
  ctx.lineTo(W - R, -H + 3);
  ctx.stroke();
  ctx.strokeStyle = "rgba(36,20,3,0.66)";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-W + R, H - 3);
  ctx.lineTo(W - R, H - 3);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,240,180,0.24)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-W * 0.66, -4);
  ctx.lineTo(W * 0.66, -4);
  ctx.stroke();
  // Machined panel grooves (matches the Full-Gold plate texture in the dismantled NFT).
  ctx.strokeStyle = "rgba(58,32,4,0.32)";
  ctx.lineWidth = 1.3;
  [-H * 0.42, H * 0.2].forEach((gy) => {
    ctx.beginPath();
    ctx.moveTo(-W + R, gy);
    ctx.lineTo(W - R, gy);
    ctx.stroke();
  });
  // Riveted studs at the corners (dark seat + bright gold head).
  [[-W * 0.76, -H * 0.52], [W * 0.76, -H * 0.52], [-W * 0.76, H * 0.52], [W * 0.76, H * 0.52]].forEach(([x, y]) => {
    ctx.fillStyle = "rgba(30,17,3,0.72)";
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,242,188,0.55)";
    ctx.beginPath();
    ctx.arc(x - 0.7, y - 0.7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGoldenHeart(ctx, part) {
  // Solid heart-head shell, filled for the material/golden wash so the heart balloon reads in
  // the same gold language as the other Golden parts (eyes/valve assembled on top).
  const style = setup(ctx, part, 3, 0.82);
  const heart = () => {
    ctx.beginPath();
    ctx.moveTo(0, -92);
    ctx.bezierCurveTo(-35, -143, -117, -128, -121, -58);
    ctx.bezierCurveTo(-126, 13, -77, 58, -28, 84);
    ctx.quadraticCurveTo(-12, 94, 0, 105);
    ctx.quadraticCurveTo(12, 94, 28, 84);
    ctx.bezierCurveTo(77, 58, 126, 13, 121, -58);
    ctx.bezierCurveTo(117, -128, 35, -143, 0, -92);
    ctx.closePath();
  };
  drawCastShadow(ctx, heart, 5, 7, 0.05);
  heart();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.9);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha *= 0.32;
  ctx.beginPath();
  ctx.moveTo(0, -88);
  ctx.bezierCurveTo(-5, -40, -5, 20, 0, 72);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgba(255,246,206,0.42)";
  ctx.beginPath();
  ctx.ellipse(-54, -72, 26, 16, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoldenBat(ctx, part) {
  // Bat-head balloon shell: rounded body, two pointed ears, two spread scalloped wings.
  const style = setup(ctx, part, 2.6, 0.82);
  const bat = () => {
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(-20, -78);
    ctx.lineTo(-34, -44);
    ctx.quadraticCurveTo(-54, -52, -78, -44);
    ctx.quadraticCurveTo(-120, -40, -148, -6);
    ctx.quadraticCurveTo(-120, -12, -110, -30);
    ctx.quadraticCurveTo(-104, -8, -86, -22);
    ctx.quadraticCurveTo(-80, -2, -62, -14);
    ctx.quadraticCurveTo(-52, 30, 0, 52);
    ctx.quadraticCurveTo(52, 30, 62, -14);
    ctx.quadraticCurveTo(80, -2, 86, -22);
    ctx.quadraticCurveTo(104, -8, 110, -30);
    ctx.quadraticCurveTo(120, -12, 148, -6);
    ctx.quadraticCurveTo(120, -40, 78, -44);
    ctx.quadraticCurveTo(54, -52, 34, -44);
    ctx.lineTo(20, -78);
    ctx.closePath();
  };
  drawCastShadow(ctx, bat, 5, 7, 0.05);
  bat();
  ctx.fillStyle = colorAlpha(style.fill || "#d7a13a", 0.9);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = "rgba(60,34,4,0.5)";
  ctx.lineWidth = 2;
  [-1, 1].forEach((s) => {
    ctx.beginPath(); ctx.moveTo(s * 58, -20); ctx.lineTo(s * 138, -12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 58, -12); ctx.lineTo(s * 104, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 58, -4); ctx.lineTo(s * 84, -16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 22, -70); ctx.lineTo(s * 28, -46); ctx.stroke();
  });
  ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, 46); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgba(255,246,206,0.4)";
  ctx.beginPath();
  ctx.ellipse(-30, -20, 20, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
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

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isMouth ? 7 : 8.5;
  ctx.beginPath();
  ctx.moveTo(-half, lift + (isMouth ? 3 : 1));
  ctx.quadraticCurveTo(-half * 0.35, lift - 4, 0, lift - 2);
  ctx.quadraticCurveTo(half * 0.4, lift, half, lift - (isMouth ? 5 : 7));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = isMouth ? 1.35 : 1.55;
  roughLine(ctx, -half + 10, lift - 2, half - 12, lift - (isMouth ? 6 : 8), 0.14, 8, 2230);
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

function drawPetPencilShape(ctx, drawPath, bounds, style, options = {}) {
  drawCastShadow(ctx, drawPath, options.shadowX ?? 4, options.shadowY ?? 6, options.shadow ?? 0.065);
  drawPath();
  const petFill = style.fill || "rgba(255,255,255,0.22)";
  ctx.fillStyle = typeof petFill === "string" && petFill.startsWith("rgba(")
    ? petFill.replace(/,\s*[\d.]+\s*\)$/, ", 0.96)")
    : petFill;
  ctx.fill();
  pencilShade(ctx, drawPath, bounds, {
    wash: options.wash ?? 0.115,
    hatch: options.hatch ?? 0.065,
    cross: options.cross ?? 0.026,
    spacing: options.spacing ?? 7,
    texture: options.texture ?? 0.065,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.9);
  ctx.lineWidth = options.lineWidth ?? 2.25;
  drawPath();
  ctx.stroke();
  sketchStroke(ctx, drawPath, options.sketch ?? 0.2, 0.8);
}

function drawPetRoundShell(ctx, part) {
  const style = setup(ctx, part, 2.4, 0.94);
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(0, -86);
    ctx.bezierCurveTo(58, -88, 78, -49, 78, 8);
    ctx.bezierCurveTo(78, 68, 48, 91, 0, 91);
    ctx.bezierCurveTo(-48, 91, -78, 68, -78, 8);
    ctx.bezierCurveTo(-78, -49, -58, -88, 0, -86);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, shell, { x: -80, y: -90, w: 160, h: 184 }, style, { wash: 0.13, hatch: 0.075 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.42);
  ctx.lineWidth = 1.25;
  roughLine(ctx, -65, 12, 65, 12, 0.65, 16, 1701);
  roughLine(ctx, 0, -74, 0, 75, 0.5, 18, 1702);
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.5);
  roughLine(ctx, -43, -61, 24, -72, 0.55, 10, 1703);
  for (const point of [[-54,-48],[54,-48],[-62,20],[62,20],[-42,68],[42,68]]) {
    drawRivet(ctx, point[0], point[1], 3.6);
  }
}

function drawPetHeadShell(ctx, part) {
  const style = setup(ctx, part, 2.3, 0.94);
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(-61, -48);
    ctx.quadraticCurveTo(-61, -67, -41, -71);
    ctx.quadraticCurveTo(0, -80, 41, -71);
    ctx.quadraticCurveTo(61, -67, 61, -48);
    ctx.lineTo(64, 27);
    ctx.quadraticCurveTo(62, 57, 34, 65);
    ctx.quadraticCurveTo(0, 75, -34, 65);
    ctx.quadraticCurveTo(-62, 57, -64, 27);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, shell, { x: -66, y: -78, w: 132, h: 148 }, style, { wash: 0.12, hatch: 0.068 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.38);
  ctx.lineWidth = 1.2;
  roughLine(ctx, -52, 28, 52, 28, 0.48, 13, 1711);
  roughLine(ctx, 0, -67, 0, -49, 0.35, 4, 1712);
  for (const point of [[-47,-48],[47,-48],[-50,42],[50,42]]) drawRivet(ctx, point[0], point[1], 3.2);
}

function drawPetCatEar(ctx, part) {
  const style = setup(ctx, part, 2.25, 0.94);
  const ear = () => {
    ctx.beginPath();
    ctx.moveTo(-42, 52);
    ctx.lineTo(-19, -66);
    ctx.quadraticCurveTo(-15, -78, -5, -66);
    ctx.lineTo(46, 48);
    ctx.quadraticCurveTo(4, 64, -42, 52);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, ear, { x: -44, y: -78, w: 92, h: 144 }, style, { wash: 0.12, hatch: 0.072 });
  const inset = () => {
    ctx.beginPath();
    ctx.moveTo(-24, 40);
    ctx.lineTo(-15, -47);
    ctx.lineTo(28, 38);
    ctx.closePath();
  };
  ctx.fillStyle = colorAlpha(style.dim || "#24d7d0", 0.38);
  inset();
  ctx.fill();
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.55);
  ctx.lineWidth = 1.25;
  inset();
  ctx.stroke();
  for (const point of [[-25,40],[-14,-42],[27,38]]) drawRivet(ctx, point[0], point[1], 3);
}

function drawPetDogEar(ctx, part) {
  const style = setup(ctx, part, 2.3, 0.94);
  const ear = () => {
    ctx.beginPath();
    ctx.moveTo(-34, -59);
    ctx.bezierCurveTo(20, -70, 45, -31, 39, 18);
    ctx.bezierCurveTo(35, 57, 12, 78, -17, 60);
    ctx.bezierCurveTo(-42, 44, -47, -28, -34, -59);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, ear, { x: -48, y: -72, w: 96, h: 154 }, style, { wash: 0.14, hatch: 0.078 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34);
  ctx.lineWidth = 1.15;
  roughLine(ctx, -25, -39, 23, 42, 0.7, 12, 1731);
  for (const point of [[-25,-45],[22,45]]) drawRivet(ctx, point[0], point[1], 3.2);
}

function drawPetMuzzlePlate(ctx, part) {
  const style = setup(ctx, part, 2.1, 0.94);
  const muzzle = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 55, 37, 0, 0, Math.PI * 2);
  };
  drawPetPencilShape(ctx, muzzle, { x: -57, y: -39, w: 114, h: 78 }, style, { wash: 0.095, hatch: 0.05, shadow: 0.045 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.3);
  roughLine(ctx, 0, -25, 0, 27, 0.35, 6, 1741);
  drawRivet(ctx, -39, 0, 2.8);
  drawRivet(ctx, 39, 0, 2.8);
}

function drawPetEyeLens(ctx, part, state = {}) {
  const style = setup(ctx, part, 2.1, 0.96);
  const blinkGroup = Number(part.blinkGroup ?? part.id ?? 0);
  const eyePhase = (Math.abs(blinkGroup) % 23) * 0.31;
  const blinkPhase = state.previewMotion ? Math.abs(Math.sin((state.time || 0) * 0.82 + eyePhase)) : 0;
  const open = blinkPhase > 0.965 ? 0.2 : 1;
  const lens = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 36 * open, 0, 0, Math.PI * 2);
  };
  drawPetPencilShape(ctx, lens, { x: -38, y: -38, w: 76, h: 76 }, style, { wash: 0.07, hatch: 0.035, shadow: 0.05 });
  if (open < 0.5) return;
  const glow = ctx.createRadialGradient(-8, -10, 2, 0, 0, 29);
  glow.addColorStop(0, style.highlight || "rgba(230,255,252,0.9)");
  glow.addColorStop(0.34, style.dim || "#24d7d0");
  glow.addColorStop(1, colorAlpha(style.stroke || "#062e31", 0.95));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colorAlpha(style.stroke || "#062e31", 0.86);
  ctx.lineWidth = 2;
  ctx.stroke();
  for (const point of [[0,-31],[31,0],[0,31],[-31,0]]) drawRivet(ctx, point[0], point[1], 2.35);
  const look = state.previewMotion ? Math.sin((state.time || 0) * 1.1 + eyePhase) * 3 : 0;
  const pupilShape = part.pupilShape || "round";
  const pupilWidth = pupilShape === "slit" ? 2.8 : pupilShape === "wide" ? 10 : 7;
  const pupilHeight = pupilShape === "slit" ? 14 : pupilShape === "wide" ? 8 : 12;
  ctx.fillStyle = "rgba(3,12,14,0.88)";
  ctx.beginPath();
  ctx.ellipse(look, 1, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.arc(-7, -9, 4.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPetPaw(ctx, part) {
  const style = setup(ctx, part, 2.15, 0.94);
  const paw = () => {
    ctx.beginPath();
    ctx.moveTo(-48, -15);
    ctx.quadraticCurveTo(-46, -43, -20, -48);
    ctx.lineTo(22, -48);
    ctx.quadraticCurveTo(47, -42, 49, -14);
    ctx.lineTo(46, 20);
    ctx.quadraticCurveTo(22, 38, -22, 38);
    ctx.quadraticCurveTo(-47, 30, -48, -15);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, paw, { x: -51, y: -51, w: 102, h: 92 }, style, { wash: 0.12, hatch: 0.065 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.46);
  ctx.lineWidth = 1.4;
  for (const x of [-20, 0, 20]) roughLine(ctx, x, 13, x, 31, 0.3, 4, 1760 + x);
  drawRivet(ctx, -32, -22, 3);
  drawRivet(ctx, 32, -22, 3);
}

function drawPetWing(ctx, part) {
  const style = setup(ctx, part, 2.3, 0.94);
  const wing = () => {
    ctx.beginPath();
    ctx.moveTo(-32, -68);
    ctx.bezierCurveTo(18, -78, 48, -31, 46, 22);
    ctx.bezierCurveTo(44, 53, 20, 73, -7, 82);
    ctx.bezierCurveTo(-24, 49, -40, 5, -32, -68);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, wing, { x: -43, y: -82, w: 94, h: 168 }, style, { wash: 0.125, hatch: 0.072 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.4);
  ctx.lineWidth = 1.25;
  roughLine(ctx, -18, -45, 25, 48, 0.65, 13, 1771);
  roughLine(ctx, -12, 0, 31, 26, 0.48, 8, 1772);
  for (const point of [[-19,-48],[24,49]]) drawRivet(ctx, point[0], point[1], 3.1);
}

function drawPetTailSegment(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.94);
  const segment = () => roundedRect(ctx, -64, -22, 128, 44, 22);
  drawPetPencilShape(ctx, segment, { x: -67, y: -25, w: 134, h: 50 }, style, { wash: 0.11, hatch: 0.06, shadow: 0.045 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.38);
  ctx.lineWidth = 1.15;
  roughLine(ctx, -35, -17, -35, 17, 0.3, 5, 1781);
  roughLine(ctx, 35, -17, 35, 17, 0.3, 5, 1782);
  drawRivet(ctx, -48, 0, 3);
  drawRivet(ctx, 48, 0, 3);
}

function drawPetFin(ctx, part) {
  const style = setup(ctx, part, 2.25, 0.94);
  const fin = () => {
    ctx.beginPath();
    ctx.moveTo(-58, 48);
    ctx.quadraticCurveTo(-14, -78, 7, -86);
    ctx.quadraticCurveTo(39, -19, 57, 48);
    ctx.quadraticCurveTo(0, 61, -58, 48);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, fin, { x: -61, y: -89, w: 122, h: 153 }, style, { wash: 0.12, hatch: 0.07 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.4);
  ctx.lineWidth = 1.25;
  roughLine(ctx, -39, 39, 8, -63, 0.65, 12, 1791);
  for (const point of [[-39,39],[39,39],[7,-64]]) drawRivet(ctx, point[0], point[1], 3.1);
}

function drawPetJaw(ctx, part) {
  const style = setup(ctx, part, 2.25, 0.94);
  const jaw = () => {
    ctx.beginPath();
    ctx.moveTo(-68, -22);
    ctx.quadraticCurveTo(0, 15, 68, -22);
    ctx.quadraticCurveTo(51, 48, 0, 54);
    ctx.quadraticCurveTo(-51, 48, -68, -22);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, jaw, { x: -71, y: -26, w: 142, h: 84 }, style, { wash: 0.1, hatch: 0.055 });
  ctx.fillStyle = "rgba(5,14,16,0.88)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 52, 19, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "rgba(255,246,218,0.94)";
  for (let x = -42; x <= 42; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x - 5, -2);
    ctx.lineTo(x, 12);
    ctx.lineTo(x + 5, -2);
    ctx.closePath();
    ctx.fill();
  }
  drawRivet(ctx, -53, 28, 3);
  drawRivet(ctx, 53, 28, 3);
}

function drawPetFaceMask(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.94);
  const mask = () => {
    ctx.beginPath();
    ctx.moveTo(0, -67);
    ctx.bezierCurveTo(-13, -80, -49, -70, -55, -38);
    ctx.bezierCurveTo(-64, 8, -42, 55, 0, 72);
    ctx.bezierCurveTo(42, 55, 64, 8, 55, -38);
    ctx.bezierCurveTo(49, -70, 13, -80, 0, -67);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, mask, { x: -61, y: -79, w: 122, h: 155 }, style, {
    wash: 0.085, hatch: 0.045, shadow: 0.04, spacing: 6,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.28);
  ctx.lineWidth = 1.15;
  roughLine(ctx, -41, 28, 0, 55, 0.42, 8, 1811);
  roughLine(ctx, 0, 55, 41, 28, 0.42, 8, 1812);
  for (const point of [[-42,-37],[42,-37],[-35,35],[35,35]]) drawRivet(ctx, point[0], point[1], 2.8);
}

function drawPetTongue(ctx, part) {
  const style = setup(ctx, part, 2.15, 0.96);
  const tongue = () => {
    ctx.beginPath();
    ctx.moveTo(-23, -28);
    ctx.quadraticCurveTo(0, -34, 23, -28);
    ctx.lineTo(20, 23);
    ctx.bezierCurveTo(16, 51, -16, 51, -20, 23);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, tongue, { x: -26, y: -36, w: 52, h: 86 }, style, {
    wash: 0.1, hatch: 0.045, shadow: 0.035, spacing: 5,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.48);
  ctx.lineWidth = 1.2;
  roughLine(ctx, 0, -22, 0, 34, 0.35, 8, 1821);
  drawRivet(ctx, -14, -20, 2.5);
  drawRivet(ctx, 14, -20, 2.5);
}

function drawPetBellyPlate(ctx, part) {
  const style = setup(ctx, part, 2.25, 0.94);
  const belly = () => {
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.bezierCurveTo(-49, -78, -66, -42, -61, 8);
    ctx.bezierCurveTo(-56, 58, -31, 83, 0, 88);
    ctx.bezierCurveTo(31, 83, 56, 58, 61, 8);
    ctx.bezierCurveTo(66, -42, 49, -78, 0, -78);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, belly, { x: -66, y: -82, w: 132, h: 174 }, style, {
    wash: 0.105, hatch: 0.058, shadow: 0.045, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.32);
  ctx.lineWidth = 1.2;
  roughLine(ctx, -48, 18, 0, 42, 0.45, 9, 1831);
  roughLine(ctx, 0, 42, 48, 18, 0.45, 9, 1832);
  roughLine(ctx, 0, -68, 0, 70, 0.35, 14, 1833);
  for (const point of [[-43,-48],[43,-48],[-47,34],[47,34],[0,72]]) drawRivet(ctx, point[0], point[1], 3);
}

function drawPetBeak(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.96);
  const upper = () => {
    ctx.beginPath();
    ctx.moveTo(-47, -10);
    ctx.quadraticCurveTo(0, -42, 47, -10);
    ctx.lineTo(0, 18);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, upper, { x: -50, y: -44, w: 100, h: 65 }, style, {
    wash: 0.085, hatch: 0.04, shadow: 0.04, spacing: 5,
  });
  const lower = () => {
    ctx.beginPath();
    ctx.moveTo(-32, -4);
    ctx.quadraticCurveTo(0, 30, 32, -4);
    ctx.quadraticCurveTo(0, 14, -32, -4);
    ctx.closePath();
  };
  ctx.fillStyle = colorAlpha(style.dim || style.fill || "#d79c36", 0.72);
  lower();
  ctx.fill();
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.78);
  ctx.lineWidth = 1.45;
  lower();
  ctx.stroke();
  roughLine(ctx, -37, -7, 37, -7, 0.3, 8, 1841);
  drawRivet(ctx, -33, -9, 2.7);
  drawRivet(ctx, 33, -9, 2.7);
}

function drawPetNose(ctx, part) {
  const style = setup(ctx, part, 2.15, 0.96);
  const nose = () => {
    ctx.beginPath();
    ctx.moveTo(-35, -15);
    ctx.quadraticCurveTo(0, -35, 35, -15);
    ctx.quadraticCurveTo(29, 23, 0, 32);
    ctx.quadraticCurveTo(-29, 23, -35, -15);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, nose, { x: -39, y: -38, w: 78, h: 74 }, style, {
    wash: 0.075, hatch: 0.035, shadow: 0.035, spacing: 5,
  });
  ctx.fillStyle = colorAlpha(style.highlight || "#ffffff", 0.34);
  ctx.beginPath();
  ctx.ellipse(-10, -12, 8, 4, -0.25, 0, Math.PI * 2);
  ctx.fill();
  drawRivet(ctx, -25, -11, 2.6);
  drawRivet(ctx, 25, -11, 2.6);
}

function drawPetHaunchPlate(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.94);
  const haunch = () => {
    ctx.beginPath();
    ctx.moveTo(-37, -65);
    ctx.bezierCurveTo(12, -82, 50, -45, 53, 8);
    ctx.bezierCurveTo(55, 51, 24, 76, -13, 65);
    ctx.bezierCurveTo(-50, 54, -58, -20, -37, -65);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, haunch, { x: -59, y: -84, w: 116, h: 157 }, style, {
    wash: 0.115, hatch: 0.063, shadow: 0.05, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34);
  ctx.lineWidth = 1.15;
  roughLine(ctx, -31, -48, 32, 43, 0.55, 13, 1851);
  for (const point of [[-31,-48],[33,42],[-36,29]]) drawRivet(ctx, point[0], point[1], 3);
}

function drawPetPenguinHead(ctx, part) {
  const style = setup(ctx, part, 2.35, 0.95);
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.bezierCurveTo(43, -70, 68, -43, 69, -4);
    ctx.bezierCurveTo(70, 37, 45, 67, 0, 70);
    ctx.bezierCurveTo(-45, 67, -70, 37, -69, -4);
    ctx.bezierCurveTo(-68, -43, -43, -70, 0, -70);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, dome, { x: -73, y: -74, w: 146, h: 148 }, style, {
    wash: 0.13, hatch: 0.074, cross: 0.028, shadow: 0.055, spacing: 7,
  });

  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.38);
  ctx.lineWidth = 1.25;
  roughLine(ctx, 0, -62, 0, 57, 0.42, 14, 1861);
  const cheekSeam = () => {
    ctx.beginPath();
    ctx.moveTo(-57, 26);
    ctx.quadraticCurveTo(0, 55, 57, 26);
  };
  sketchStroke(ctx, cheekSeam, 0.22, 0.72);
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.52);
  roughLine(ctx, -38, -51, 25, -60, 0.48, 10, 1862);
  for (const point of [[-45,-39],[45,-39],[-51,30],[51,30],[0,59]]) {
    drawRivet(ctx, point[0], point[1], 3.05);
  }
}

function drawPetPenguinFlipper(ctx, part) {
  const style = setup(ctx, part, 2.35, 0.95);
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(-12, -14);
    ctx.bezierCurveTo(-30, -10, -38, 10, -36, 32);
    ctx.bezierCurveTo(-33, 62, -15, 91, 0, 106);
    ctx.bezierCurveTo(15, 90, 31, 61, 35, 34);
    ctx.bezierCurveTo(39, 11, 27, -9, 11, -14);
    ctx.quadraticCurveTo(0, -18, -12, -14);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, blade, { x: -42, y: -20, w: 84, h: 132 }, style, {
    wash: 0.135, hatch: 0.078, cross: 0.03, shadow: 0.058, spacing: 7,
  });

  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.4);
  ctx.lineWidth = 1.3;
  roughLine(ctx, -26, 24, 21, 43, 0.52, 10, 1871);
  roughLine(ctx, 21, 43, -3, 88, 0.46, 9, 1872);
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.48);
  roughLine(ctx, -23, 3, 15, 0, 0.4, 7, 1873);
  for (const point of [[-22,3],[22,11],[-24,43],[12,57],[-5,88]]) {
    drawRivet(ctx, point[0], point[1], 3);
  }
}

function drawPetPenguinFacePlate(ctx, part) {
  const style = setup(ctx, part, 2.25, 0.95);
  const face = () => {
    ctx.beginPath();
    ctx.moveTo(0, -62);
    ctx.bezierCurveTo(-39, -65, -58, -39, -55, -5);
    ctx.bezierCurveTo(-52, 30, -32, 52, 0, 55);
    ctx.bezierCurveTo(32, 52, 52, 30, 55, -5);
    ctx.bezierCurveTo(58, -39, 39, -65, 0, -62);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, face, { x: -59, y: -68, w: 118, h: 127 }, style, {
    wash: 0.09, hatch: 0.048, cross: 0.018, shadow: 0.04, spacing: 6,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.3);
  ctx.lineWidth = 1.15;
  roughLine(ctx, 0, -53, 0, 43, 0.34, 9, 1881);
  roughLine(ctx, -43, 9, 0, 42, 0.4, 8, 1882);
  roughLine(ctx, 0, 42, 43, 9, 0.4, 8, 1883);
  for (const point of [[-38,-32],[38,-32],[-40,18],[40,18],[0,45]]) {
    drawRivet(ctx, point[0], point[1], 2.75);
  }
}

function drawPetPenguinBib(ctx, part) {
  const style = setup(ctx, part, 2.3, 0.96);
  const bib = () => {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(-10, -55, -32, -83, -49, -69);
    ctx.bezierCurveTo(-64, -55, -59, -20, -50, -4);
    ctx.bezierCurveTo(-44, 8, -45, 16, -42, 25);
    ctx.bezierCurveTo(-38, 42, -39, 76, -24, 101);
    ctx.bezierCurveTo(-10, 109, 10, 109, 24, 101);
    ctx.bezierCurveTo(39, 76, 38, 42, 42, 25);
    ctx.bezierCurveTo(45, 16, 44, 8, 50, -4);
    ctx.bezierCurveTo(59, -20, 64, -55, 49, -69);
    ctx.bezierCurveTo(32, -83, 10, -55, 0, -18);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, bib, { x: -67, y: -87, w: 134, h: 201 }, style, {
    wash: 0.095, hatch: 0.052, cross: 0.02, shadow: 0.045, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.32);
  ctx.lineWidth = 1.2;
  roughLine(ctx, -42, 25, 0, 47, 0.42, 9, 1891);
  roughLine(ctx, 0, 47, 42, 25, 0.42, 9, 1892);
  roughLine(ctx, 0, 47, 0, 96, 0.34, 8, 1893);
  for (const point of [[-42,-48],[42,-48],[-45,-8],[45,-8],[-33,39],[33,39],[-18,92],[18,92]]) {
    drawRivet(ctx, point[0], point[1], 2.8);
  }
}

function drawPetPenguinNose(ctx, part) {
  const style = setup(ctx, part, 2.15, 0.98);
  const nose = () => {
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.quadraticCurveTo(0, -16, 34, 0);
    ctx.quadraticCurveTo(0, 15, -34, 0);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, nose, { x: -38, y: -20, w: 76, h: 39 }, style, {
    wash: 0.075, hatch: 0.032, cross: 0.012, shadow: 0.035, spacing: 5,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.45);
  ctx.lineWidth = 1.1;
  roughLine(ctx, -27, 1, 27, 1, 0.24, 6, 1901);
  drawRivet(ctx, -25, 0, 2.35);
  drawRivet(ctx, 25, 0, 2.35);
}

function drawPetSharkBody(ctx, part) {
  const style = setup(ctx, part, 2.45, 0.96);
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-88, 1);
    ctx.bezierCurveTo(-82, -31, -47, -43, 0, -40);
    ctx.bezierCurveTo(38, -38, 67, -23, 79, -6);
    ctx.quadraticCurveTo(84, 0, 79, 7);
    ctx.bezierCurveTo(65, 25, 37, 38, 0, 40);
    ctx.bezierCurveTo(-47, 43, -82, 32, -88, 1);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, body, { x: -94, y: -47, w: 180, h: 94 }, style, {
    wash: 0.14, hatch: 0.078, cross: 0.03, shadow: 0.06, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.36);
  ctx.lineWidth = 1.25;
  roughLine(ctx, -42, -31, -33, 31, 0.48, 11, 1911);
  roughLine(ctx, 13, -34, 21, 33, 0.46, 11, 1912);
  roughLine(ctx, -70, 18, 57, 20, 0.55, 15, 1913);
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.48);
  roughLine(ctx, -58, -27, 35, -29, 0.52, 13, 1914);
  for (const point of [[-55,-26],[-58,25],[-9,-34],[-7,34],[42,-22],[45,22],[70,0]]) {
    drawRivet(ctx, point[0], point[1], 3);
  }
}

function drawPetSharkDorsal(ctx, part) {
  const style = setup(ctx, part, 2.35, 0.96);
  const fin = () => {
    ctx.beginPath();
    ctx.moveTo(-45, 28);
    ctx.bezierCurveTo(-24, -22, -7, -60, 8, -64);
    ctx.bezierCurveTo(25, -28, 34, 3, 47, 28);
    ctx.quadraticCurveTo(0, 39, -45, 28);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, fin, { x: -50, y: -69, w: 102, h: 104 }, style, {
    wash: 0.13, hatch: 0.074, cross: 0.025, shadow: 0.05, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.38);
  ctx.lineWidth = 1.2;
  roughLine(ctx, -31, 25, 6, -49, 0.56, 11, 1921);
  for (const point of [[-31,24],[7,-49],[35,24]]) drawRivet(ctx, point[0], point[1], 2.8);
}

function drawPetSharkPectoral(ctx, part) {
  const style = setup(ctx, part, 2.3, 0.96);
  const fin = () => {
    ctx.beginPath();
    ctx.moveTo(-34, -12);
    ctx.bezierCurveTo(-2, -8, 31, 9, 49, 31);
    ctx.bezierCurveTo(15, 27, -12, 18, -36, 8);
    ctx.quadraticCurveTo(-42, -2, -34, -12);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, fin, { x: -44, y: -17, w: 98, h: 54 }, style, {
    wash: 0.125, hatch: 0.07, cross: 0.024, shadow: 0.048, spacing: 6,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.36);
  ctx.lineWidth = 1.15;
  roughLine(ctx, -27, -5, 36, 24, 0.48, 10, 1931);
  drawRivet(ctx, -27, -4, 2.8);
  drawRivet(ctx, 33, 23, 2.65);
}

function drawPetSharkTail(ctx, part) {
  const style = setup(ctx, part, 2.4, 0.96);
  const tail = () => {
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.bezierCurveTo(8, -14, 27, -39, 51, -56);
    ctx.bezierCurveTo(50, -27, 42, -9, 30, 0);
    ctx.bezierCurveTo(42, 9, 50, 27, 51, 56);
    ctx.bezierCurveTo(27, 39, 8, 14, -12, 10);
    ctx.quadraticCurveTo(-2, 0, -12, -10);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, tail, { x: -17, y: -61, w: 74, h: 122 }, style, {
    wash: 0.135, hatch: 0.076, cross: 0.028, shadow: 0.055, spacing: 7,
  });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.4);
  ctx.lineWidth = 1.2;
  roughLine(ctx, -5, -8, 37, -43, 0.5, 10, 1941);
  roughLine(ctx, -5, 8, 37, 43, 0.5, 10, 1942);
  roughLine(ctx, 30, 0, 46, 0, 0.34, 5, 1943);
  for (const point of [[-5,-7],[-5,7],[36,-42],[36,42],[33,0]]) {
    drawRivet(ctx, point[0], point[1], 2.75);
  }
}

function goldenReferenceGradient(ctx, x0, y0, x1, y1, dark = "#503000") {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.2, "#a06000");
  gradient.addColorStop(0.42, "#e0a000");
  gradient.addColorStop(0.57, "#f0b020");
  gradient.addColorStop(0.77, "#b07000");
  gradient.addColorStop(1, "#503000");
  return gradient;
}

function goldenReferenceGlass(ctx, x, y, radius) {
  const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.42, 1, x, y, radius);
  gradient.addColorStop(0, "#dffff7");
  gradient.addColorStop(0.2, "#4fe0d0");
  gradient.addColorStop(0.54, "#087f79");
  gradient.addColorStop(1, "#032927");
  return gradient;
}

function drawGoldenReferenceCog(ctx, x, y, radius, teeth = 12, tealCore = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = goldenReferenceGradient(ctx, -radius, -radius, radius, radius);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = Math.max(1.5, radius * 0.1);
  ctx.beginPath();
  for (let index = 0; index < teeth * 2; index += 1) {
    const angle = -Math.PI / 2 + index * Math.PI / teeth;
    const rr = index % 2 ? radius * 0.78 : radius;
    const px = Math.cos(angle) * rr;
    const py = Math.sin(angle) * rr;
    if (!index) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#33200a";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tealCore ? goldenReferenceGlass(ctx, 0, 0, radius * 0.31) : "#d09000";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.29, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGoldenAviatorGoggles(ctx, part) {
  setup(ctx, part, 2.5, 1);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const drawLens = (side) => {
    const x = side * 52;
    ctx.save();
    ctx.translate(x, 3);
    ctx.rotate(side * 0.055);
    const outer = () => {
      ctx.beginPath();
      ctx.moveTo(-44, -27);
      ctx.quadraticCurveTo(-31, -40, 9, -33);
      ctx.quadraticCurveTo(43, -27, 45, -3);
      ctx.quadraticCurveTo(43, 24, 7, 36);
      ctx.quadraticCurveTo(-28, 31, -44, 7);
      ctx.quadraticCurveTo(-50, -12, -44, -27);
      ctx.closePath();
    };
    ctx.fillStyle = goldenReferenceGradient(ctx, -46, -35, 46, 37);
    ctx.strokeStyle = "#2f1c05";
    ctx.lineWidth = 4;
    outer(); ctx.fill(); ctx.stroke();

    const inner = () => {
      ctx.beginPath();
      ctx.moveTo(-35, -20);
      ctx.quadraticCurveTo(-24, -30, 7, -25);
      ctx.quadraticCurveTo(34, -20, 35, -2);
      ctx.quadraticCurveTo(34, 17, 5, 26);
      ctx.quadraticCurveTo(-22, 23, -34, 5);
      ctx.quadraticCurveTo(-39, -8, -35, -20);
      ctx.closePath();
    };
    const glass = ctx.createLinearGradient(-38, -26, 38, 26);
    glass.addColorStop(0, "#53635f");
    glass.addColorStop(0.22, "#151d1b");
    glass.addColorStop(0.58, "#030706");
    glass.addColorStop(0.82, "#6f450a");
    glass.addColorStop(1, "#171108");
    ctx.fillStyle = glass;
    inner(); ctx.fill(); ctx.stroke();
    ctx.save();
    inner(); ctx.clip();
    ctx.fillStyle = "rgba(255,225,126,0.34)";
    ctx.rotate(-0.16);
    ctx.fillRect(-55, -18, 112, 8);
    ctx.fillStyle = "rgba(255,255,235,0.22)";
    ctx.fillRect(-52, -7, 104, 3);
    ctx.restore();

    for (const [rx, ry] of [[-34, -20], [30, -20], [-31, 16], [28, 19]]) drawRivet(ctx, rx, ry, 2.6);
    ctx.restore();
    drawGoldenReferenceCog(ctx, side * 103, 0, 14, 10, side > 0);
    drawRivet(ctx, side * 91, 15, 3.2);
  };

  // Curved temple arms sit behind the lens frames.
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 8;
  roughBezier(ctx, [[-78, -35], [-98, -43], [-112, -25], [-110, 1]], 0.18, 9850);
  roughBezier(ctx, [[78, -35], [98, -43], [112, -25], [110, 1]], 0.18, 9851);
  ctx.strokeStyle = "#d09000";
  ctx.lineWidth = 4.5;
  roughBezier(ctx, [[-78, -35], [-98, -43], [-112, -25], [-110, 1]], 0.16, 9852);
  roughBezier(ctx, [[78, -35], [98, -43], [112, -25], [110, 1]], 0.16, 9853);
  drawLens(-1);
  drawLens(1);

  // Hinged bridge and top stabilizer reproduce the reference hardware.
  ctx.fillStyle = goldenReferenceGradient(ctx, -22, -17, 22, 12);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-21, -14, 42, 21, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-13, -48, 26, 13, 4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#d09000";
  ctx.lineWidth = 4;
  roughBezier(ctx, [[-43, -31], [-30, -43], [-14, -42], [0, -40]], 0.16, 9854);
  roughBezier(ctx, [[43, -31], [30, -43], [14, -42], [0, -40]], 0.16, 9855);
  drawRivet(ctx, -14, -4, 2.4);
  drawRivet(ctx, 14, -4, 2.4);
}

function drawGoldenSunforgeSombrero(ctx, part) {
  setup(ctx, part, 2.6, 1);
  ctx.lineJoin = "round";
  const brim = () => {
    ctx.beginPath();
    ctx.moveTo(-137, 24);
    ctx.quadraticCurveTo(-100, -8, -51, 3);
    ctx.quadraticCurveTo(0, 14, 51, 3);
    ctx.quadraticCurveTo(100, -8, 137, 24);
    ctx.quadraticCurveTo(110, 67, 0, 70);
    ctx.quadraticCurveTo(-110, 67, -137, 24);
    ctx.closePath();
  };
  drawCastShadow(ctx, brim, 6, 8, 0.11);
  ctx.fillStyle = goldenReferenceGradient(ctx, -137, -8, 137, 70);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 4;
  brim(); ctx.fill(); ctx.stroke();

  // Turquoise zigzag inlay follows the entire rolled brim.
  ctx.fillStyle = "#075b55";
  ctx.beginPath();
  ctx.moveTo(-121, 36);
  for (let x = -121; x < 121; x += 30.25) {
    ctx.lineTo(x + 14.5, 46);
    ctx.lineTo(x + 30.25, 36);
  }
  ctx.lineTo(113, 56);
  ctx.quadraticCurveTo(0, 76, -113, 56);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d09000";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  const crown = () => {
    ctx.beginPath();
    ctx.moveTo(-55, 24);
    ctx.quadraticCurveTo(-50, -54, -31, -80);
    ctx.quadraticCurveTo(0, -108, 31, -80);
    ctx.quadraticCurveTo(50, -54, 55, 24);
    ctx.quadraticCurveTo(0, 38, -55, 24);
    ctx.closePath();
  };
  ctx.fillStyle = goldenReferenceGradient(ctx, -55, -105, 55, 36);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 4;
  crown(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(47,28,5,0.72)";
  ctx.lineWidth = 1.7;
  roughLine(ctx, -29, -78, -20, 13, 0.18, 9860);
  roughLine(ctx, 29, -78, 20, 13, 0.18, 9861);
  roughLine(ctx, 0, -96, 0, 16, 0.18, 9862);

  // Wavy crown band, central turquoise core and side clockwork rosettes.
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 11;
  roughBezier(ctx, [[-52, -2], [-35, -17], [-17, 5], [0, -7], [17, -17], [35, 5], [52, -2]], 0.14, 9863);
  ctx.strokeStyle = "#d09000";
  ctx.lineWidth = 7;
  roughBezier(ctx, [[-52, -2], [-35, -17], [-17, 5], [0, -7], [17, -17], [35, 5], [52, -2]], 0.12, 9864);
  drawGoldenReferenceCog(ctx, -53, 18, 14, 10, false);
  drawGoldenReferenceCog(ctx, 53, 18, 14, 10, true);
  ctx.fillStyle = goldenReferenceGradient(ctx, -20, 0, 20, 34);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(-20, -1, 40, 36, 4); ctx.fill(); ctx.stroke();
  drawGoldenReferenceCog(ctx, 0, 17, 13, 11, true);
  for (const [index, x] of [-114, -84, -55, -27, 27, 55, 84, 114].entries()) drawRivet(ctx, x, 37 + Math.abs(x) * 0.12, 2.5 + (index % 2) * 0.25);
}

function drawGoldenPocketWatch(ctx, part) {
  setup(ctx, part, 2.6, 1);
  ctx.lineJoin = "round";
  // Crown loop and winding stem.
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 15;
  ctx.beginPath(); ctx.ellipse(0, -91, 27, 20, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#d09000";
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.fillStyle = goldenReferenceGradient(ctx, -18, -74, 18, -48);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-17, -73, 34, 22, 6); ctx.fill(); ctx.stroke();
  for (let x = -12; x <= 12; x += 6) roughLine(ctx, x, -69, x, -54, 0.1, 2, 9870 + x);

  const casePath = () => {
    ctx.beginPath();
    ctx.arc(0, 24, 77, 0, Math.PI * 2);
  };
  drawCastShadow(ctx, casePath, 7, 9, 0.12);
  ctx.fillStyle = goldenReferenceGradient(ctx, -76, -54, 77, 103);
  casePath(); ctx.fill();
  ctx.strokeStyle = "#2f1c05"; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = "#5d3908";
  ctx.beginPath(); ctx.arc(0, 24, 62, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = goldenReferenceGradient(ctx, -54, -30, 54, 78, "#3f2607");
  ctx.beginPath(); ctx.arc(0, 24, 54, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#d09000"; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = "rgba(4,75,69,0.32)";
  ctx.beginPath(); ctx.arc(0, 24, 48, 0, Math.PI * 2); ctx.fill();

  // Layered visible movement beneath the glass.
  drawGoldenReferenceCog(ctx, -22, 14, 21, 11, false);
  drawGoldenReferenceCog(ctx, 23, 39, 24, 12, false);
  drawGoldenReferenceCog(ctx, 9, -8, 16, 10, true);
  ctx.strokeStyle = "rgba(80,225,211,0.28)";
  ctx.lineWidth = 1;
  for (let y = -24; y <= 73; y += 12) roughLine(ctx, -48, y, 48, y, 0.08, 2, 9880 + y);

  // Compass-style hands and raised center bearing.
  ctx.strokeStyle = "#2f1c05"; ctx.lineWidth = 7;
  roughLine(ctx, 0, 24, -17, 61, 0.1, 3, 9890);
  roughLine(ctx, 0, 24, 35, 3, 0.1, 3, 9891);
  ctx.strokeStyle = "#f0b020"; ctx.lineWidth = 3;
  roughLine(ctx, 0, 24, -17, 61, 0.08, 2, 9892);
  roughLine(ctx, 0, 24, 35, 3, 0.08, 2, 9893);
  drawRivet(ctx, 0, 24, 6);
  for (let index = 0; index < 12; index += 1) {
    const angle = index * Math.PI / 6;
    drawRivet(ctx, Math.cos(angle) * 68, 24 + Math.sin(angle) * 68, 2.7);
  }
  for (const [x, y] of [[0, -28], [52, 24], [0, 76], [-52, 24]]) {
    ctx.fillStyle = goldenReferenceGlass(ctx, x, y, 5);
    ctx.fillRect(x - 5, y - 5, 10, 10);
    ctx.strokeStyle = "#d09000"; ctx.lineWidth = 2; ctx.strokeRect(x - 5, y - 5, 10, 10);
  }
}

function drawGoldenMechanicalSkull(ctx, part) {
  setup(ctx, part, 2.6, 1);
  ctx.lineJoin = "round";
  const cranium = () => {
    ctx.beginPath();
    ctx.moveTo(-77, -31);
    ctx.lineTo(-70, -70);
    ctx.quadraticCurveTo(-55, -103, -25, -113);
    ctx.quadraticCurveTo(0, -120, 27, -108);
    ctx.quadraticCurveTo(57, -101, 71, -69);
    ctx.lineTo(78, -31);
    ctx.lineTo(66, 30);
    ctx.lineTo(47, 58);
    ctx.lineTo(31, 91);
    ctx.lineTo(-31, 91);
    ctx.lineTo(-43, 55);
    ctx.lineTo(-59, 27);
    ctx.closePath();
  };
  drawCastShadow(ctx, cranium, 7, 9, 0.12);
  ctx.fillStyle = goldenReferenceGradient(ctx, -78, -116, 78, 94);
  cranium(); ctx.fill();
  ctx.strokeStyle = "#2f1c05"; ctx.lineWidth = 4; ctx.stroke();

  // Forehead armor plates and central clockwork hub.
  ctx.strokeStyle = "rgba(47,28,5,0.74)"; ctx.lineWidth = 2;
  roughBezier(ctx, [[-63, -37], [-42, -72], [0, -82], [42, -72], [63, -37]], 0.18, 9900);
  roughLine(ctx, 0, -105, 0, -46, 0.16, 4, 9901);
  roughLine(ctx, -53, -32, -31, -18, 0.16, 3, 9902);
  roughLine(ctx, 53, -32, 31, -18, 0.16, 3, 9903);
  drawGoldenReferenceCog(ctx, 0, -57, 18, 12, false);

  // Deep sockets, bolted orbital rings and turquoise optical cores.
  for (const side of [-1, 1]) {
    const x = side * 29;
    ctx.fillStyle = "#17110a";
    ctx.beginPath(); ctx.ellipse(x, -8, 25, 30, side * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#2f1c05"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = goldenReferenceGlass(ctx, x, -8, 7);
    ctx.beginPath(); ctx.arc(x, -8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d09000"; ctx.lineWidth = 4; ctx.stroke();
    drawGoldenReferenceCog(ctx, side * 88, -10, 23, 12, side > 0);
    roughLine(ctx, side * 54, -13, side * 68, -12, 0.12, 2, 9910 + side);
  }

  // Nose aperture, cheek plates and articulated mechanical jaw.
  ctx.fillStyle = "#17110a";
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(-10, 35); ctx.lineTo(0, 40); ctx.lineTo(10, 35); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = goldenReferenceGradient(ctx, -48, 32, 48, 87);
  ctx.beginPath();
  ctx.moveTo(-48, 31); ctx.lineTo(-29, 44); ctx.lineTo(-23, 69); ctx.lineTo(-11, 80);
  ctx.lineTo(0, 72); ctx.lineTo(11, 80); ctx.lineTo(23, 69); ctx.lineTo(29, 44); ctx.lineTo(48, 31);
  ctx.lineTo(39, 78); ctx.lineTo(24, 94); ctx.lineTo(-24, 94); ctx.lineTo(-39, 78); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = "#2f1c05"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#37200a";
  ctx.fillRect(-31, 48, 62, 13);
  ctx.strokeRect(-31, 48, 62, 13);
  for (let x = -27; x <= 27; x += 9) {
    ctx.fillStyle = "#e0a000";
    ctx.fillRect(x - 3, 48, 6, 13);
    ctx.strokeRect(x - 3, 48, 6, 13);
  }
  ctx.fillStyle = "#17110a";
  ctx.fillRect(-25, 65, 50, 8);
  for (let x = -21; x <= 21; x += 8) {
    ctx.fillStyle = "#c08000";
    ctx.fillRect(x - 2.5, 65, 5, 10);
  }
  for (const [x, y] of [[-49, -50], [49, -50], [-54, 22], [54, 22], [-36, 75], [36, 75], [0, -94]]) drawRivet(ctx, x, y, 2.8);
}

function drawGoldenSteamHelmShell(ctx, part) {
  const style = setup(ctx, part, 2.5, 0.94);
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(-126, 48);
    ctx.quadraticCurveTo(-118, -36, -66, -72);
    ctx.quadraticCurveTo(0, -112, 70, -70);
    ctx.quadraticCurveTo(120, -34, 128, 48);
    ctx.quadraticCurveTo(72, 70, 0, 72);
    ctx.quadraticCurveTo(-72, 70, -126, 48);
    ctx.closePath();
  };
  drawCastShadow(ctx, shell, 5, 7, 0.08);
  const fill = ctx.createLinearGradient(-112, -86, 116, 72);
  fill.addColorStop(0, "#d09000");
  fill.addColorStop(0.28, "#e0a000");
  fill.addColorStop(0.7, "#905000");
  fill.addColorStop(1, "#503000");
  ctx.fillStyle = fill;
  shell();
  ctx.fill();
  pencilShade(ctx, shell, { x: -128, y: -106, w: 256, h: 180 }, { wash: 0.06, hatch: 0.03, cross: 0.01, spacing: 10, texture: 0.025 });
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 3;
  shell();
  ctx.stroke();

  ctx.strokeStyle = "rgba(47,28,5,0.72)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[-104, 26], [-54, 8], [54, 8], [106, 26]], 0.34, 9901);
  roughBezier(ctx, [[-92, -26], [-42, -56], [44, -54], [94, -24]], 0.32, 9902);
  ctx.strokeStyle = "rgba(255,240,160,0.72)";
  ctx.lineWidth = 1.4;
  roughBezier(ctx, [[-82, -48], [-34, -82], [28, -80], [72, -51]], 0.28, 9903);
  for (const [x, y] of [[-102, 39], [-54, 55], [0, 59], [54, 55], [102, 39], [-82, -18], [82, -18]]) {
    drawRivet(ctx, x, y, 3.2);
  }
}

function drawGoldenSteamHelmSpike(ctx, part) {
  setup(ctx, part, 2.2, 1);
  const spike = () => {
    ctx.beginPath();
    ctx.moveTo(-22, 28);
    ctx.lineTo(-13, 9);
    ctx.quadraticCurveTo(-8, -41, 0, -96);
    ctx.quadraticCurveTo(9, -38, 14, 9);
    ctx.lineTo(22, 28);
    ctx.closePath();
  };
  drawCastShadow(ctx, spike, 4, 5, 0.1);
  const fill = ctx.createLinearGradient(-18, 20, 14, -90);
  fill.addColorStop(0, "#704000");
  fill.addColorStop(0.2, "#b07000");
  fill.addColorStop(0.46, "#f0b020");
  fill.addColorStop(0.68, "#e0a000");
  fill.addColorStop(1, "#905000");
  ctx.fillStyle = fill;
  spike();
  ctx.fill();
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 3;
  spike();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,239,153,0.74)";
  ctx.lineWidth = 1.5;
  roughBezier(ctx, [[-7, 4], [-5, -31], [-2, -65], [0, -88]], 0.16, 9890);
  ctx.strokeStyle = "rgba(47,28,5,0.72)";
  roughBezier(ctx, [[7, 6], [5, -27], [3, -58], [1, -86]], 0.16, 9894);

  // Three stepped collars make each horn read as a bolted manufactured part.
  const collarFill = ctx.createLinearGradient(-28, 0, 28, 0);
  collarFill.addColorStop(0, "#704000");
  collarFill.addColorStop(0.42, "#e0a000");
  collarFill.addColorStop(0.68, "#f0b020");
  collarFill.addColorStop(1, "#704000");
  ctx.fillStyle = collarFill;
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 2.2;
  for (const [x, y, w, h] of [[-25, 20, 50, 11], [-20, 11, 40, 10], [-15, 3, 30, 9]]) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();
  }
  drawRivet(ctx, -16, 25, 2.2);
  drawRivet(ctx, 16, 25, 2.2);
}

function drawGoldenRiderJacketSide(ctx, part, side) {
  setup(ctx, part, 2.4, 1);
  ctx.save();
  ctx.scale(side, 1);

  // Each half owns only one side of the torso. The inner edge deliberately
  // opens wider toward the waist so the MotorHead core and original plates
  // remain visible through the complete jacket assembly.
  const shell = () => {
    ctx.beginPath();
    ctx.moveTo(48, -105);
    ctx.quadraticCurveTo(101, -116, 154, -83);
    ctx.quadraticCurveTo(202, -58, 214, -10);
    ctx.lineTo(198, 116);
    ctx.quadraticCurveTo(184, 141, 150, 142);
    ctx.quadraticCurveTo(107, 139, 64, 126);
    ctx.lineTo(58, 78);
    ctx.lineTo(62, 24);
    ctx.lineTo(30, -38);
    ctx.lineTo(48, -105);
    ctx.closePath();
  };
  drawCastShadow(ctx, shell, 7, 9, 0.1);
  const fill = ctx.createLinearGradient(32, -108, 202, 128);
  fill.addColorStop(0, "#e0a000");
  fill.addColorStop(0.25, "#d09000");
  fill.addColorStop(0.58, "#a06000");
  fill.addColorStop(0.82, "#704000");
  fill.addColorStop(1, "#503000");
  ctx.fillStyle = fill;
  shell();
  ctx.fill();
  pencilShade(ctx, shell, { x: 24, y: -116, w: 186, h: 252 }, { wash: 0.045, hatch: 0.026, cross: 0.008, spacing: 12, texture: 0.02 });
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 3.2;
  shell();
  ctx.stroke();

  // Raised shoulder cap, shaped as a fitted plate rather than a floating pad.
  const shoulderFill = ctx.createLinearGradient(74, -103, 181, -35);
  shoulderFill.addColorStop(0, "#f0b020");
  shoulderFill.addColorStop(0.46, "#c08000");
  shoulderFill.addColorStop(1, "#704000");
  ctx.fillStyle = shoulderFill;
  ctx.beginPath();
  ctx.moveTo(73, -88);
  ctx.quadraticCurveTo(126, -108, 176, -68);
  ctx.lineTo(164, -31);
  ctx.quadraticCurveTo(121, -58, 80, -48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(47,28,5,0.9)";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  roughBezier(ctx, [[84, -78], [119, -92], [151, -79], [169, -61]], 0.25, 9911 + side);

  // Dark recessed lining gives the open lapel real depth without filling the
  // transparent center channel between the two wearable halves.
  ctx.fillStyle = "#241606";
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(49, -101);
  ctx.lineTo(26, -39);
  ctx.lineTo(66, 31);
  ctx.lineTo(80, 15);
  ctx.lineTo(102, -58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Deep lapel with an exposed inner boundary. Nothing is drawn across x=0.
  const lapelFill = ctx.createLinearGradient(35, -98, 104, 34);
  lapelFill.addColorStop(0, "#f0b020");
  lapelFill.addColorStop(0.48, "#b07000");
  lapelFill.addColorStop(1, "#603800");
  ctx.fillStyle = lapelFill;
  ctx.beginPath();
  ctx.moveTo(49, -101);
  ctx.lineTo(31, -39);
  ctx.lineTo(72, 24);
  ctx.lineTo(108, -62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,231,132,0.68)";
  ctx.lineWidth = 1.35;
  roughBezier(ctx, [[50, -92], [47, -67], [44, -51], [34, -39]], 0.2, 9918 + side);

  // Inner zipper teeth follow the opening without ever joining the two halves.
  ctx.strokeStyle = "rgba(47,28,5,0.94)";
  ctx.lineWidth = 2;
  roughBezier(ctx, [[31, -34], [43, -8], [57, 12], [61, 32], [59, 92]], 0.2, 9924 + side);
  for (let y = -24; y <= 82; y += 12) {
    const zipperX = y < 28 ? 36 + (y + 24) * 0.45 : 59;
    roughLine(ctx, zipperX, y, zipperX + 8, y + 2, 0.12, 2, 9940 + y + side);
  }

  // Sleeve seam, double pocket rail, waist belt and plate break lines.
  ctx.strokeStyle = "rgba(47,28,5,0.82)";
  ctx.lineWidth = 2.15;
  roughBezier(ctx, [[119, -28], [132, 6], [143, 42], [153, 75]], 0.25, 9960 + side);
  roughLine(ctx, 79, 45, 137, 37, 0.22, 5, 9970 + side);
  roughLine(ctx, 82, 55, 140, 47, 0.22, 5, 9974 + side);
  roughLine(ctx, 67, 94, 174, 91, 0.22, 6, 9978 + side);
  roughLine(ctx, 101, -42, 112, 29, 0.2, 5, 9982 + side);
  for (let index = 0; index < 5; index += 1) {
    const y = -7 + index * 17;
    roughBezier(ctx, [[124, y], [140, y + 4], [159, y + 6], [177, y + 2]], 0.18, 9986 + index + side);
  }

  // Compact shoulder service cog: detail belongs to the half, not the chest.
  ctx.fillStyle = "#704000";
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(132, -66, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#d09000";
  ctx.beginPath();
  ctx.arc(132, -66, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawRivet(ctx, 132, -66, 3.1);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    drawRivet(ctx, 132 + Math.cos(angle) * 20, -66 + Math.sin(angle) * 20, 2.25);
  }

  // Large articulated elbow and a real cuff zipper make this read as a jacket sleeve.
  drawGoldenReferenceCog(ctx, 169, 61, 18, 12, false);
  ctx.strokeStyle = "#2f1c05";
  ctx.lineWidth = 4;
  roughLine(ctx, 177, 84, 188, 126, 0.16, 4, 9992 + side);
  ctx.strokeStyle = "#e0a000";
  ctx.lineWidth = 1.7;
  roughLine(ctx, 177, 84, 188, 126, 0.12, 3, 9994 + side);
  for (let y = 88; y <= 120; y += 8) drawRivet(ctx, 180 + (y - 88) * 0.25, y, 1.8);

  for (const [x, y] of [[79, -90], [172, -57], [166, 83], [82, 110], [72, 72], [104, 42], [148, 37]]) {
    drawRivet(ctx, x, y, 2.8);
  }
  ctx.restore();
}

function drawGoldenRiderJacketLeft(ctx, part) {
  drawGoldenRiderJacketSide(ctx, part, -1);
}

function drawGoldenRiderJacketRight(ctx, part) {
  drawGoldenRiderJacketSide(ctx, part, 1);
}

// ── Wing primitives ──────────────────────────────────────────────────────────
// Small reusable parts for building wings (mechanical raven, steam ornithopter,
// demon membrane). Each respects the active material via setup()/applyMaterialFinish.

// A single mechanical feather-blade, tip up / root down. Fan several (rotated) for a wing.
function drawWingFeather(ctx, part) {
  const style = setup(ctx, part, 2.1, 0.9);
  const blade = () => {
    ctx.beginPath();
    ctx.moveTo(0, -96);
    ctx.bezierCurveTo(10, -70, 16, -20, 15, 40);
    ctx.quadraticCurveTo(14, 74, 4, 92);
    ctx.lineTo(-6, 92);
    ctx.quadraticCurveTo(-14, 60, -13, 10);
    ctx.bezierCurveTo(-12, -40, -8, -74, 0, -96);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, blade, { x: -16, y: -98, w: 34, h: 194 }, style, { wash: 0.12, hatch: 0.06 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.5);
  ctx.lineWidth = 1.4;
  roughLine(ctx, 1, -88, 1, 84, 0.4, 16, 4501);
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.3);
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = -70 + i * 32;
    roughLine(ctx, 1, y, 13, y + 14, 0.4, 5, 4510 + i);
    roughLine(ctx, 1, y, -11, y + 14, 0.4, 5, 4520 + i);
  }
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.4);
  roughLine(ctx, -6, -80, -10, 40, 0.4, 12, 4530);
  drawRivet(ctx, 0, 78, 3.2);
}

// An armored wing arm/strut with a shoulder knuckle at the left. The wing spine/limb.
function drawWingSpar(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.92);
  const arm = () => {
    ctx.beginPath();
    ctx.moveTo(-98, -14);
    ctx.quadraticCurveTo(-40, -22, 30, -12);
    ctx.quadraticCurveTo(78, -8, 100, -2);
    ctx.lineTo(100, 6);
    ctx.quadraticCurveTo(78, 12, 30, 16);
    ctx.quadraticCurveTo(-40, 24, -98, 16);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, arm, { x: -101, y: -26, w: 204, h: 52 }, style, { wash: 0.12, hatch: 0.06 });
  const knuckle = () => { ctx.beginPath(); ctx.arc(-86, 0, 20, 0, Math.PI * 2); ctx.closePath(); };
  drawPetPencilShape(ctx, knuckle, { x: -108, y: -22, w: 44, h: 44 }, style, { wash: 0.14 });
  drawRivet(ctx, -86, 0, 5);
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34);
  ctx.lineWidth = 1.1;
  for (const x of [-40, 6, 52]) roughLine(ctx, x, -18, x, 18, 0.4, 6, 4600 + (x + 60));
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.4);
  roughLine(ctx, -70, -12, 92, -2, 0.4, 16, 4650);
}

// A bat/dragon membrane sail with a scalloped trailing edge + radiating ribs. Demon wing.
function drawWingMembrane(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.9);
  const membrane = () => {
    ctx.beginPath();
    ctx.moveTo(-88, 60);
    ctx.quadraticCurveTo(-40, -50, 40, -66);
    ctx.quadraticCurveTo(78, -60, 90, -30);
    ctx.quadraticCurveTo(60, -6, 78, 8);
    ctx.quadraticCurveTo(44, 18, 58, 36);
    ctx.quadraticCurveTo(24, 40, 34, 60);
    ctx.quadraticCurveTo(2, 60, 8, 78);
    ctx.quadraticCurveTo(-40, 74, -88, 60);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, membrane, { x: -91, y: -68, w: 184, h: 150 }, style, { wash: 0.14, hatch: 0.05 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.4);
  ctx.lineWidth = 2;
  const root = [-84, 58];
  for (const tip of [[86, -28], [74, 10], [54, 38], [30, 60], [6, 76]]) roughLine(ctx, root[0], root[1], tip[0], tip[1], 0.5, 12, 4700 + (tip[0] + 90));
  drawRivet(ctx, -84, 56, 4);
}

// A layered shoulder cluster — a fan of small overlapping angular plates (top of a wing).
function drawWingCovert(ctx, part) {
  const style = setup(ctx, part, 2, 0.9);
  const plate = (ang, len, wid, seed) => {
    ctx.save();
    ctx.rotate(ang);
    const p = () => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -wid);
      ctx.lineTo(len + 14, 0);
      ctx.lineTo(len, wid);
      ctx.closePath();
    };
    drawPetPencilShape(ctx, p, { x: 0, y: -wid - 2, w: len + 16, h: wid * 2 + 4 }, style, { wash: 0.12, hatch: 0.05 });
    drawRivet(ctx, 12, 0, 2.6);
    ctx.restore();
  };
  ctx.save();
  ctx.translate(-52, 34);
  plate(-1.15, 96, 15, 4801);
  plate(-0.86, 108, 16, 4802);
  plate(-0.57, 118, 17, 4803);
  plate(-0.30, 122, 17, 4804);
  plate(-0.05, 120, 16, 4805);
  ctx.restore();
}

// A tapered plane wing with a baked red/black checker (steam ornithopter). Draw with
// skipMaterialFinish:true so the checker keeps its own colours; flipX for the other side.
function drawWingSlat(ctx, part) {
  const style = setup(ctx, part, 2, 0.9);
  const wing = () => {
    ctx.beginPath();
    ctx.moveTo(-140, -18);
    ctx.quadraticCurveTo(20, -30, 120, -14);
    ctx.quadraticCurveTo(140, -8, 138, 0);
    ctx.quadraticCurveTo(140, 8, 120, 12);
    ctx.quadraticCurveTo(20, 26, -140, 20);
    ctx.closePath();
  };
  ctx.save();
  wing();
  ctx.clip();
  ctx.fillStyle = "#b0201c";
  ctx.fillRect(-150, -40, 300, 80);
  ctx.fillStyle = "#1b1410";
  const cs = 22;
  for (let gx = -140; gx < 140; gx += cs) {
    for (let gy = -32; gy < 32; gy += cs) {
      if (((Math.round((gx + 140) / cs) + Math.round((gy + 32) / cs)) % 2) === 0) ctx.fillRect(gx, gy, cs, cs);
    }
  }
  // sheen
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(-150, -40, 300, 22);
  ctx.restore();
  ctx.strokeStyle = "#140f0c";
  ctx.lineWidth = 2.4;
  wing();
  ctx.stroke();
  ctx.strokeStyle = "rgba(20,15,12,0.4)";
  ctx.lineWidth = 1.2;
  for (const x of [-90, -40, 10, 60]) roughLine(ctx, x, -22, x, 22, 0.4, 6, 4900 + (x + 100));
  for (const x of [-120, -60, 0, 60, 110]) drawRivet(ctx, x, 0, 2.6);
}

// A swept metal airplane/jet wing panel — tapered leading edge, pointed tip, trailing flap + panel lines.
function drawWingJet(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.92);
  const wing = () => {
    ctx.beginPath();
    ctx.moveTo(-150, -2);
    ctx.quadraticCurveTo(-30, -26, 108, -42);
    ctx.lineTo(150, -38);                 // pointed tip
    ctx.quadraticCurveTo(118, -26, 44, -6);
    ctx.quadraticCurveTo(-30, 12, -104, 28);
    ctx.lineTo(-150, 28);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, wing, { x: -152, y: -44, w: 304, h: 74 }, style, { wash: 0.12, hatch: 0.05 });
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.42); ctx.lineWidth = 1.4;
  roughLine(ctx, -142, 0, 128, -38, 0.4, 18, 5001);                 // leading-edge sheen
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34); ctx.lineWidth = 1;
  roughLine(ctx, -120, 8, 118, -30, 0.4, 16, 5002);                 // main spar
  for (const x of [-92, -34, 34, 92]) roughLine(ctx, x, -22, x, 20, 0.4, 6, 5010 + (x + 100)); // ribs
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.5); ctx.lineWidth = 1.6;
  roughLine(ctx, -104, 20, 40, 0, 0.4, 12, 5030);                   // flap hinge
  for (const x of [-120, -60, 0, 60]) drawRivet(ctx, x, -3, 2.6);
  drawRivet(ctx, 120, -32, 2.2);
}

// A rocket booster — cylindrical body, nose cone, flared nozzle + stabilizer fins.
function drawRocketThruster(ctx, part) {
  const style = setup(ctx, part, 2.2, 0.92);
  const fin = (a, b, c) => () => { ctx.beginPath(); ctx.moveTo(28, a); ctx.lineTo(62, b); ctx.lineTo(44, c); ctx.closePath(); };
  drawPetPencilShape(ctx, fin(-16, -34, -8), { x: 26, y: -36, w: 40, h: 30 }, style, { wash: 0.1 });
  drawPetPencilShape(ctx, fin(16, 34, 8), { x: 26, y: 6, w: 40, h: 30 }, style, { wash: 0.1 });
  const body = () => roundedRect(ctx, -70, -22, 118, 44, 16);
  drawPetPencilShape(ctx, body, { x: -72, y: -24, w: 122, h: 48 }, style, { wash: 0.14, hatch: 0.05 });
  const nose = () => { ctx.beginPath(); ctx.moveTo(-70, -18); ctx.quadraticCurveTo(-104, 0, -70, 18); ctx.closePath(); };
  drawPetPencilShape(ctx, nose, { x: -106, y: -20, w: 40, h: 40 }, style, { wash: 0.14 });
  const nozzle = () => { ctx.beginPath(); ctx.moveTo(44, -14); ctx.lineTo(76, -30); ctx.lineTo(76, 30); ctx.lineTo(44, 14); ctx.closePath(); };
  drawPetPencilShape(ctx, nozzle, { x: 42, y: -32, w: 36, h: 64 }, style, { wash: 0.12 });
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34); ctx.lineWidth = 1;
  for (const x of [-38, -8, 22]) roughLine(ctx, x, -20, x, 20, 0.4, 6, 5100 + (x + 60));
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.42); roughLine(ctx, -58, -12, 40, -12, 0.4, 10, 5150);
  drawRivet(ctx, -56, 0, 3); drawRivet(ctx, 0, -14, 2.4); drawRivet(ctx, 0, 14, 2.4);
}

// A sharp vertical fin / winglet — angular metal blade with a swept back edge.
function drawWingFin(ctx, part) {
  const style = setup(ctx, part, 2.1, 0.9);
  const fin = () => {
    ctx.beginPath();
    ctx.moveTo(-8, 58);
    ctx.lineTo(-2, -48);
    ctx.quadraticCurveTo(2, -60, 14, -58);
    ctx.lineTo(26, -20);
    ctx.quadraticCurveTo(30, 30, 18, 58);
    ctx.closePath();
  };
  drawPetPencilShape(ctx, fin, { x: -10, y: -62, w: 42, h: 122 }, style, { wash: 0.12, hatch: 0.05 });
  ctx.strokeStyle = colorAlpha(style.highlight || "#ffffff", 0.4); ctx.lineWidth = 1.2;
  roughLine(ctx, 0, -46, 6, 52, 0.4, 12, 5201);
  ctx.strokeStyle = colorAlpha(style.stroke || "#171b1d", 0.34); ctx.lineWidth = 1;
  roughLine(ctx, 16, -30, 12, 50, 0.4, 8, 5202);
  drawRivet(ctx, 4, 44, 2.6); drawRivet(ctx, 8, 8, 2.2);
}

// A rocket exhaust plume — baked orange→blue flame. Draw with skipMaterialFinish:true so it keeps its colours.
function drawRocketFlame(ctx, part) {
  setup(ctx, part, 1, 0.9);
  const plume = (col, len, wid) => {
    ctx.beginPath();
    ctx.moveTo(-42, -wid);
    ctx.quadraticCurveTo(len * 0.5, -wid * 0.55, len, 0);
    ctx.quadraticCurveTo(len * 0.5, wid * 0.55, -42, wid);
    ctx.quadraticCurveTo(-30, 0, -42, -wid);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  };
  plume("rgba(255,110,28,0.92)", 122, 30);
  plume("rgba(255,180,60,0.95)", 90, 20);
  plume("rgba(255,240,180,0.96)", 56, 11);
  plume("rgba(150,205,255,0.85)", 26, 6);
}

// ============================================================================
// MECHANICAL PARTS BIN — generic recolourable components to assemble anything.
// Each uses setup() so the chosen material (brass, lead/steel via blackChrome,
// copper, blueprintSteel …) tints it. Registered showInLibrary:true → they show
// up in the builder (:5199) to draw with. Batch 1.
// ============================================================================
const BIN_FILL = "rgba(251,250,245,0.55)";
const BIN_INK = "rgba(18,22,25,0.52)";
function binShade(ctx, pathFn, x, y, w, h) {
  pencilShade(ctx, pathFn, { x, y, w, h }, { wash: 0.1, hatch: 0.05, cross: 0.016, spacing: 6, texture: 0.04 });
}

// ---- Plates & panels ----
function drawPlateHex(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const R = 54;
  const hex = () => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const x = Math.cos(a) * R, y = Math.sin(a) * R; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
  drawCastShadow(ctx, hex, 3, 5, 0.05);
  hex(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, hex, -R, -R, R * 2, R * 2);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; hex(); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; drawRivet(ctx, Math.cos(a) * (R - 13), Math.sin(a) * (R - 13), 2.7); }
}
function drawPlateRound(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const R = 52;
  const disc = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, disc, 3, 5, 0.05);
  disc(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, disc, -R, -R, R * 2, R * 2);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; disc(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; drawRivet(ctx, Math.cos(a) * (R - 11), Math.sin(a) * (R - 11), 2.6); }
}
function drawPlateSlotted(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const rect = () => roundedRect(ctx, -58, -34, 116, 68, 8);
  drawCastShadow(ctx, rect, 3, 5, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, rect, -58, -34, 116, 68);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; rect(); ctx.stroke();
  for (const sx of [-34, 0, 34]) { roundedRect(ctx, sx - 7, -20, 14, 40, 7); ctx.stroke(); }
}
function drawPlateCorrugated(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const rect = () => roundedRect(ctx, -58, -34, 116, 68, 6);
  drawCastShadow(ctx, rect, 3, 5, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.save(); rect(); ctx.clip();
  ctx.strokeStyle = "rgba(18,22,25,0.26)"; ctx.lineWidth = 3;
  for (let x = -50; x <= 50; x += 12) { ctx.beginPath(); ctx.moveTo(x, -34); ctx.lineTo(x, 34); ctx.stroke(); }
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.4;
  for (let x = -44; x <= 56; x += 12) { ctx.beginPath(); ctx.moveTo(x, -34); ctx.lineTo(x, 34); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; rect(); ctx.stroke();
}

// ---- Wheels ----
function drawWheelSpoked(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const R = 52;
  const tire = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, tire, 3, 5, 0.05);
  tire(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; tire(); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 12, 0, 7); ctx.stroke();
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12)); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  drawRivet(ctx, 0, 0, 3.4);
}
function drawWheelSolid(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const R = 50;
  const tire = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, tire, 3, 5, 0.05);
  tire(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, tire, -R, -R, R * 2, R * 2);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 5; tire(); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 12, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  drawRivet(ctx, 0, 0, 3.6);
}
function drawWheelCaster(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const fork = () => roundedRect(ctx, -20, -46, 40, 30, 6);
  fork(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; fork(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, -16); ctx.lineTo(-18, 8); ctx.moveTo(18, -16); ctx.lineTo(18, 8); ctx.stroke();
  const w = () => { ctx.beginPath(); ctx.arc(0, 12, 30, 0, 7); };
  drawCastShadow(ctx, w, 3, 4, 0.05);
  w(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 3; w(); ctx.stroke();
  drawRivet(ctx, 0, 12, 4); drawRivet(ctx, 0, -40, 3);
}

// ---- Fasteners / hardware ----
function drawFastenerNail(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const head = () => { ctx.beginPath(); ctx.ellipse(0, -50, 15, 6, 0, 0, 7); };
  head(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; head(); ctx.stroke();
  const shaft = () => { ctx.beginPath(); ctx.moveTo(-4, -46); ctx.lineTo(4, -46); ctx.lineTo(1.5, 44); ctx.lineTo(0, 54); ctx.lineTo(-1.5, 44); ctx.closePath(); };
  drawCastShadow(ctx, shaft, 2, 3, 0.05);
  shaft(); ctx.fillStyle = BIN_FILL; ctx.fill(); shaft(); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1.5, -44); ctx.lineTo(-0.5, 40); ctx.stroke();
}
function drawFastenerScrew(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const head = () => { ctx.beginPath(); ctx.arc(0, -46, 15, 0, 7); };
  head(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; head(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -46); ctx.lineTo(10, -46); ctx.lineWidth = 3; ctx.stroke();
  const shaft = () => { ctx.beginPath(); ctx.moveTo(-9, -32); ctx.lineTo(9, -32); ctx.lineTo(1, 48); ctx.lineTo(0, 56); ctx.lineTo(-1, 48); ctx.closePath(); };
  drawCastShadow(ctx, shaft, 2, 3, 0.05);
  shaft(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; shaft(); ctx.stroke();
  ctx.lineWidth = 1.6;
  for (let y = -28; y < 44; y += 9) { const t = (y + 32) / 88; const hw = 9 - t * 8.5; ctx.beginPath(); ctx.moveTo(-hw, y); ctx.lineTo(hw, y + 4); ctx.stroke(); }
}
function drawFastenerStaple(ctx, part) {
  setup(ctx, part, 2, 0.82);
  const u = () => { ctx.beginPath(); ctx.moveTo(-30, 40); ctx.lineTo(-30, -30); ctx.quadraticCurveTo(-30, -40, -20, -40); ctx.lineTo(20, -40); ctx.quadraticCurveTo(30, -40, 30, -30); ctx.lineTo(30, 40); };
  u(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 11; ctx.lineCap = "round"; ctx.stroke();
  u(); ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 3; ctx.stroke();
}

// ---- Wires ----
function drawWireCoil(ctx, part) {
  setup(ctx, part, 2, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-46, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(46, 0); ctx.lineTo(60, 0); ctx.stroke();
  for (let i = 0; i < 6; i++) { const x = -40 + i * 15; ctx.beginPath(); ctx.ellipse(x, 0, 8, 20, 0.35, -1.9, 1.9); ctx.stroke(); }
}
function drawWireLoop(ctx, part) {
  setup(ctx, part, 2, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3.5; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-56, 22);
  ctx.bezierCurveTo(-34, 26, -52, -38, -8, -34);
  ctx.bezierCurveTo(38, -30, 20, 30, 44, 22);
  ctx.stroke();
  drawRivet(ctx, -56, 22, 4); drawRivet(ctx, 46, 22, 4);
}

// ---- Electronic (radio / TV / appliance internals) ----
function drawElecResistor(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(-30, 0); ctx.moveTo(30, 0); ctx.lineTo(58, 0); ctx.stroke();
  const body = () => roundedRect(ctx, -30, -15, 60, 30, 14);
  drawCastShadow(ctx, body, 2, 3, 0.05);
  body(); ctx.fillStyle = "rgba(214,190,150,0.72)"; ctx.fill();
  body(); ctx.strokeStyle = BIN_INK; ctx.stroke();
  ["#7a4a1e", "#d23", "#e6b400", "#b8912a"].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-17 + i * 11, -15, 5, 30); });
}
function drawElecCapacitor(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-8, 40); ctx.lineTo(-8, 56); ctx.moveTo(8, 40); ctx.lineTo(8, 56); ctx.stroke();
  const body = () => roundedRect(ctx, -24, -46, 48, 88, 12);
  drawCastShadow(ctx, body, 2, 3, 0.05);
  body(); ctx.fillStyle = "rgba(44,64,120,0.62)"; ctx.fill();
  body(); ctx.strokeStyle = BIN_INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -46, 24, 7, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = "rgba(215,224,238,0.7)"; ctx.fillRect(-24, -18, 12, 58);
  ctx.fillStyle = BIN_INK; ctx.fillRect(-20, -6, 4, 34);
}
function drawElecChip(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) { const y = -21 + i * 14; ctx.beginPath(); ctx.moveTo(-46, y); ctx.lineTo(-30, y); ctx.moveTo(30, y); ctx.lineTo(46, y); ctx.stroke(); }
  const body = () => roundedRect(ctx, -30, -32, 60, 64, 6);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = "rgba(32,34,38,0.82)"; ctx.fill();
  body(); ctx.strokeStyle = BIN_INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -32, 7, 0, Math.PI); ctx.fillStyle = "rgba(66,68,72,0.9)"; ctx.fill();
  ctx.fillStyle = "rgba(205,210,215,0.7)"; ctx.beginPath(); ctx.arc(-20, 22, 3.5, 0, 7); ctx.fill();
}
function drawElecTube(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const glass = () => { ctx.beginPath(); ctx.moveTo(-24, 30); ctx.lineTo(-24, -30); ctx.quadraticCurveTo(-24, -56, 0, -56); ctx.quadraticCurveTo(24, -56, 24, -30); ctx.lineTo(24, 30); ctx.closePath(); };
  drawCastShadow(ctx, glass, 3, 4, 0.05);
  glass(); ctx.fillStyle = "rgba(200,225,240,0.32)"; ctx.fill();
  glass(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = "rgba(255,150,60,0.78)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, 18); ctx.lineTo(-8, -30); ctx.lineTo(8, -30); ctx.lineTo(8, 18); ctx.stroke();
  const base = () => roundedRect(ctx, -22, 30, 44, 26, 5);
  base(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.stroke();
  ctx.lineWidth = 3; ctx.lineCap = "round"; for (const px of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(px, 56); ctx.lineTo(px, 66); ctx.stroke(); }
}

// ============ Parts bin batches 2 & 3 ============
// Square-tooth gear path (reliable, flat-topped teeth): half of each step is tooth, half is gap.
function binGear(ctx, R, teeth, th) {
  const n = teeth * 4;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const phase = (a % (Math.PI * 2 / teeth)) / (Math.PI * 2 / teeth);
    const r = (phase > 0.25 && phase < 0.75) ? R + th : R;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// ---- Plates & brackets ----
function drawPlateTriangle(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const tri = () => { ctx.beginPath(); ctx.moveTo(-54, 46); ctx.lineTo(54, 46); ctx.lineTo(-54, -50); ctx.closePath(); };
  drawCastShadow(ctx, tri, 3, 5, 0.05);
  tri(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, tri, -54, -50, 108, 96);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; tri(); ctx.stroke();
  drawRivet(ctx, -42, 36, 3); drawRivet(ctx, 40, 36, 3); drawRivet(ctx, -42, -34, 3);
}
function drawBracketAngle(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const L = () => { ctx.beginPath(); ctx.moveTo(-46, -46); ctx.lineTo(-16, -46); ctx.lineTo(-16, 16); ctx.lineTo(46, 16); ctx.lineTo(46, 46); ctx.lineTo(-46, 46); ctx.closePath(); };
  drawCastShadow(ctx, L, 3, 5, 0.05);
  L(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, L, -46, -46, 92, 92);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; L(); ctx.stroke();
  drawRivet(ctx, -31, -30, 3); drawRivet(ctx, 30, 31, 3); drawRivet(ctx, -31, 31, 3);
}
function drawPlateDiamond(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const rect = () => roundedRect(ctx, -56, -40, 112, 80, 6);
  drawCastShadow(ctx, rect, 3, 5, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.save(); rect(); ctx.clip();
  ctx.strokeStyle = "rgba(18,22,25,0.22)"; ctx.lineWidth = 2;
  for (let y = -44; y < 44; y += 16) for (let x = -56; x < 56; x += 20) { const ox = (Math.round((y + 48) / 16) % 2) ? 10 : 0; ctx.beginPath(); ctx.moveTo(x + ox, y); ctx.lineTo(x + ox + 8, y + 8); ctx.moveTo(x + ox + 8, y); ctx.lineTo(x + ox, y + 8); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; rect(); ctx.stroke();
}
function drawPlateName(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const rect = () => roundedRect(ctx, -60, -24, 120, 48, 5);
  drawCastShadow(ctx, rect, 3, 5, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, rect, -60, -24, 120, 48);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; rect(); ctx.stroke();
  ctx.lineWidth = 1.4; roundedRect(ctx, -52, -16, 104, 32, 3); ctx.stroke();
  drawRivet(ctx, -46, 0, 2.6); drawRivet(ctx, 46, 0, 2.6);
  ctx.strokeStyle = "rgba(18,22,25,0.3)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.stroke();
}

// ---- Gears & sprockets ----
function drawGearSprocket(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const g = () => binGear(ctx, 44, 12, 9);
  drawCastShadow(ctx, g, 3, 5, 0.05);
  g(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; g(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 30, Math.sin(a) * 30, 4.5, 0, 7); ctx.stroke(); }
  drawRivet(ctx, 0, 0, 3.4);
}
function drawGearRatchet(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const R = 44, teeth = 12;
  const g = () => { ctx.beginPath(); for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2; const a2 = (i + 1) / teeth * Math.PI * 2; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(a) * (R + 11), Math.sin(a) * (R + 11)); ctx.lineTo(Math.cos(a2) * R, Math.sin(a2) * R); } ctx.closePath(); };
  drawCastShadow(ctx, g, 3, 5, 0.05);
  g(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; g(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  drawRivet(ctx, 0, 0, 3.2);
  ctx.beginPath(); ctx.moveTo(38, -52); ctx.lineTo(54, -22); ctx.lineTo(44, -17); ctx.lineTo(28, -44); ctx.closePath(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}
function drawGearPinion(ctx, part) {
  setup(ctx, part, 1.7, 0.8);
  const g = () => binGear(ctx, 30, 9, 8);
  drawCastShadow(ctx, g, 2, 4, 0.05);
  g(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; g(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  ctx.fillStyle = BIN_INK; ctx.fillRect(-2, -9, 4, 5);
}
function drawGearRack(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const rect = () => roundedRect(ctx, -62, 6, 124, 28, 4);
  drawCastShadow(ctx, rect, 3, 4, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; rect(); ctx.stroke();
  for (let x = -56; x <= 52; x += 14) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 4, -12); ctx.lineTo(x + 10, -12); ctx.lineTo(x + 14, 6); ctx.closePath(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke(); }
}

// ---- Springs & dampers ----
function drawSpringCoilTall(ctx, part) {
  setup(ctx, part, 2, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.lineTo(0, -46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(0, 58); ctx.stroke();
  for (let i = 0; i < 6; i++) { const y = -42 + i * 15; ctx.beginPath(); ctx.ellipse(0, y, 22, 9, 0, 0, Math.PI * 2); ctx.stroke(); }
}
function drawSpringLeaf(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineCap = "round"; ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) { const w = 60 - i * 10, y = i * 7; ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + 20 + i * 2, w, y); ctx.stroke(); }
  ctx.fillStyle = BIN_FILL; roundedRect(ctx, -8, 8, 16, 30, 3); ctx.fill(); ctx.lineWidth = 2; roundedRect(ctx, -8, 8, 16, 30, 3); ctx.stroke();
}
function drawSpringTorsion(ctx, part) {
  setup(ctx, part, 2, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 20 - i * 5, 0.3, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(7, -19); ctx.lineTo(50, -36); ctx.moveTo(-7, 19); ctx.lineTo(-50, 36); ctx.stroke();
}
function drawDamperShock(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const cyl = () => roundedRect(ctx, -16, -4, 32, 54, 8);
  drawCastShadow(ctx, cyl, 3, 4, 0.05);
  cyl(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, cyl, -16, -4, 32, 54);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; cyl(); ctx.stroke();
  ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -48); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -52, 8, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 54, 9, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}

// ---- Pipes, valves & fittings ----
function drawPipeTee(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const p = () => roundedRect(ctx, -54, -14, 108, 28, 6);
  const v = () => roundedRect(ctx, -14, -14, 28, 46, 6);
  drawCastShadow(ctx, () => { p(); v(); }, 3, 4, 0.05);
  ctx.fillStyle = BIN_FILL; p(); ctx.fill(); v(); ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; p(); ctx.stroke(); v(); ctx.stroke();
  for (const [x, y, w, h] of [[-60, -18, 8, 36], [52, -18, 8, 36], [-18, 26, 36, 8]]) { ctx.fillStyle = BIN_FILL; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
}
function drawPipeCross(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const h = () => roundedRect(ctx, -52, -14, 104, 28, 6);
  const v = () => roundedRect(ctx, -14, -52, 28, 104, 6);
  drawCastShadow(ctx, () => { h(); v(); }, 3, 4, 0.05);
  ctx.fillStyle = BIN_FILL; h(); ctx.fill(); v(); ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; h(); ctx.stroke(); v(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.stroke();
}
function drawValveGate(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -40, -2, 80, 32, 6);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.fillStyle = BIN_FILL; ctx.fillRect(-46, -6, 8, 40); ctx.strokeRect(-46, -6, 8, 40); ctx.fillRect(38, -6, 8, 40); ctx.strokeRect(38, -6, 8, 40);
  ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -42); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -46, 20, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -46, 7, 0, 7); ctx.stroke();
  ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, -46 + Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 20, -46 + Math.sin(a) * 20); ctx.stroke(); }
}
function drawPipeFlange(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const pipe = () => roundedRect(ctx, -50, -16, 70, 32, 4);
  drawCastShadow(ctx, pipe, 3, 4, 0.05);
  pipe(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; pipe(); ctx.stroke();
  const fl = () => roundedRect(ctx, 16, -30, 20, 60, 4);
  fl(); ctx.fillStyle = BIN_FILL; ctx.fill(); fl(); ctx.stroke();
  for (const y of [-22, -8, 8, 22]) drawRivet(ctx, 26, y, 3);
}
function drawPipeReducer(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const r = () => { ctx.beginPath(); ctx.moveTo(-50, -22); ctx.lineTo(-10, -22); ctx.lineTo(50, -11); ctx.lineTo(50, 11); ctx.lineTo(-10, 22); ctx.lineTo(-50, 22); ctx.closePath(); };
  drawCastShadow(ctx, r, 3, 4, 0.05);
  r(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, r, -50, -22, 100, 44);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; r(); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-38, -22); ctx.lineTo(-38, 22); ctx.stroke();
}
function drawCouplingUnion(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const R = 34;
  const hex = () => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const x = Math.cos(a) * R, y = Math.sin(a) * R * 0.74; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
  drawCastShadow(ctx, hex, 3, 4, 0.05);
  hex(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; hex(); ctx.stroke();
  ctx.fillStyle = BIN_FILL; ctx.fillRect(-52, -12, 20, 24); ctx.strokeRect(-52, -12, 20, 24);
  ctx.fillRect(32, -12, 20, 24); ctx.strokeRect(32, -12, 20, 24);
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.stroke();
}

// ---- Car parts ----
function drawCarPiston(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -26, -50, 52, 54, 6);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -26, -50, 52, 54);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.lineWidth = 2; for (const y of [-40, -32, -24]) { ctx.beginPath(); ctx.moveTo(-26, y); ctx.lineTo(26, y); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, -18, 8, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(-10, 46); ctx.lineTo(10, 46); ctx.lineTo(8, -14); ctx.closePath(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 48, 12, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}
function drawCarSparkPlug(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const cer = () => { ctx.beginPath(); ctx.moveTo(-11, -54); ctx.lineTo(11, -54); ctx.lineTo(13, -20); ctx.quadraticCurveTo(16, -6, 10, 2); ctx.lineTo(-10, 2); ctx.quadraticCurveTo(-16, -6, -13, -20); ctx.closePath(); };
  cer(); ctx.fillStyle = "rgba(238,232,220,0.72)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; cer(); ctx.stroke();
  ctx.lineWidth = 1.4; for (const y of [-44, -36, -28]) { ctx.beginPath(); ctx.moveTo(-12, y); ctx.lineTo(12, y); ctx.stroke(); }
  const hex = () => roundedRect(ctx, -14, 2, 28, 20, 3);
  hex(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; hex(); ctx.stroke();
  const thread = () => roundedRect(ctx, -9, 22, 18, 26, 2);
  thread(); ctx.fillStyle = BIN_FILL; ctx.fill(); thread(); ctx.stroke();
  ctx.lineWidth = 1.2; for (let y = 26; y < 46; y += 4) { ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y + 2); ctx.stroke(); }
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(0, 56); ctx.lineTo(7, 56); ctx.stroke();
}
function drawCarMuffler(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -44, -22, 88, 44, 20);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -44, -22, 88, 44);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.lineWidth = 1.6; for (const x of [-20, 20]) { ctx.beginPath(); ctx.moveTo(x, -22); ctx.lineTo(x, 22); ctx.stroke(); }
  ctx.lineWidth = 2; roundedRect(ctx, -62, -8, 20, 16, 4); ctx.fillStyle = BIN_FILL; ctx.fill(); roundedRect(ctx, -62, -8, 20, 16, 4); ctx.stroke();
  roundedRect(ctx, 42, -8, 22, 16, 4); ctx.fillStyle = BIN_FILL; ctx.fill(); roundedRect(ctx, 42, -8, 22, 16, 4); ctx.stroke();
}
function drawCarHeadlight(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const lens = () => { ctx.beginPath(); ctx.ellipse(0, 0, 40, 46, 0, 0, 7); };
  drawCastShadow(ctx, lens, 3, 4, 0.05);
  lens(); ctx.fillStyle = "rgba(235,240,245,0.5)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; lens(); ctx.stroke();
  ctx.lineWidth = 1.6; for (const r of [30, 20, 10]) { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.86, r, 0, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fillStyle = "rgba(255,240,180,0.9)"; ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.ellipse(-14, -18, 8, 12, -0.5, 0, 7); ctx.fill();
}
function drawCarRim(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const R = 50;
  const tire = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, tire, 3, 5, 0.05);
  tire(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; tire(); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R - 8, 0, 7); ctx.stroke();
  ctx.lineWidth = 8; ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12)); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  drawRivet(ctx, 0, 0, 4);
}
function drawCarGauge(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const R = 44;
  const face = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, face, 3, 4, 0.05);
  face(); ctx.fillStyle = "rgba(245,244,238,0.72)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; face(); ctx.stroke();
  ctx.lineWidth = 2; for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4)); ctx.lineTo(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12)); ctx.stroke(); }
  ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 3; ctx.lineCap = "round"; const na = Math.PI * 0.75 + 0.35 * Math.PI * 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(na) * (R - 12), Math.sin(na) * (R - 12)); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fillStyle = BIN_INK; ctx.fill();
}

// ---- Appliance parts ----
function drawApplianceKnob(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const R = 40;
  const k = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, k, 3, 4, 0.05);
  k(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, k, -R, -R, R * 2, R * 2);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; k(); ctx.stroke();
  ctx.lineWidth = 2; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8)); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke(); }
  ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R + 8); ctx.stroke();
  drawRivet(ctx, 0, 0, 4);
}
function drawApplianceDial(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const R = 46;
  const face = () => { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); };
  drawCastShadow(ctx, face, 3, 4, 0.05);
  face(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; face(); ctx.stroke();
  ctx.lineWidth = 1.6; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3)); ctx.lineTo(Math.cos(a) * (R - 10), Math.sin(a) * (R - 10)); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(21, -21); ctx.stroke();
}
function drawApplianceMotor(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -40, -30, 72, 60, 14);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -40, -30, 72, 60);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.lineWidth = 1.6; for (let x = -32; x < 26; x += 8) { ctx.beginPath(); ctx.moveTo(x, -30); ctx.lineTo(x, 30); ctx.stroke(); }
  ctx.lineWidth = 2; roundedRect(ctx, 32, -8, 26, 16, 3); ctx.fillStyle = BIN_FILL; ctx.fill(); roundedRect(ctx, 32, -8, 26, 16, 3); ctx.stroke();
  ctx.fillStyle = BIN_FILL; ctx.fillRect(-40, 28, 14, 8); ctx.strokeRect(-40, 28, 14, 8);
}
function drawApplianceBelt(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  for (const x of [-34, 34]) { ctx.beginPath(); ctx.arc(x, 0, 20, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(x, 0, 6, 0, 7); ctx.stroke(); }
  ctx.lineWidth = 4; ctx.strokeStyle = "rgba(30,30,34,0.8)";
  ctx.beginPath(); ctx.moveTo(-34, -20); ctx.lineTo(34, -20); ctx.moveTo(-34, 20); ctx.lineTo(34, 20); ctx.stroke();
  ctx.beginPath(); ctx.arc(-34, 0, 20, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(34, 0, 20, -Math.PI / 2, Math.PI / 2); ctx.stroke();
}
function drawApplianceSwitch(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const frame = () => roundedRect(ctx, -30, -40, 60, 80, 8);
  drawCastShadow(ctx, frame, 3, 4, 0.05);
  frame(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; frame(); ctx.stroke();
  const rock = () => roundedRect(ctx, -22, -32, 44, 64, 6);
  rock(); ctx.fillStyle = "rgba(235,232,224,0.8)"; ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(18,22,25,0.12)"; roundedRect(ctx, -22, 0, 44, 32, 6); ctx.fill();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(22, 0); ctx.stroke();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -12); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 18, 6, 0, 7); ctx.stroke();
}

// ---- More electronics ----
function drawElecTransistor(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const body = () => { ctx.beginPath(); ctx.moveTo(-26, 20); ctx.lineTo(-26, -6); ctx.arc(0, -6, 26, Math.PI, 0, true); ctx.lineTo(26, 20); ctx.closePath(); };
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = "rgba(40,42,46,0.82)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-26, -2); ctx.lineTo(26, -2); ctx.stroke();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; ctx.lineCap = "round"; for (const x of [-14, 0, 14]) { ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 54); ctx.stroke(); }
}
function drawElecLed(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const dome = () => { ctx.beginPath(); ctx.moveTo(-20, 22); ctx.lineTo(-20, -6); ctx.arc(0, -6, 20, Math.PI, 0, true); ctx.lineTo(20, 22); ctx.closePath(); };
  drawCastShadow(ctx, dome, 3, 4, 0.05);
  dome(); ctx.fillStyle = "rgba(220,60,70,0.55)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; dome(); ctx.stroke();
  roundedRect(ctx, -24, 16, 48, 10, 2); ctx.fillStyle = BIN_FILL; ctx.fill(); roundedRect(ctx, -24, 16, 48, 10, 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.ellipse(-7, -8, 4, 8, -0.4, 0, 7); ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-8, 26); ctx.lineTo(-8, 50); ctx.moveTo(8, 26); ctx.lineTo(8, 58); ctx.stroke();
}
function drawElecTransformer(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const core = () => roundedRect(ctx, -38, -34, 76, 68, 4);
  drawCastShadow(ctx, core, 3, 4, 0.05);
  core(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; core(); ctx.stroke();
  roundedRect(ctx, -18, -40, 36, 80, 4); ctx.fillStyle = "rgba(180,120,60,0.5)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; roundedRect(ctx, -18, -40, 36, 80, 4); ctx.stroke();
  ctx.strokeStyle = "rgba(120,70,30,0.5)"; ctx.lineWidth = 1.4; for (let y = -34; y < 34; y += 6) { ctx.beginPath(); ctx.moveTo(-18, y); ctx.lineTo(18, y); ctx.stroke(); }
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; ctx.lineCap = "round"; for (const x of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 52); ctx.stroke(); }
}
function drawElecPcb(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  const board = () => roundedRect(ctx, -54, -38, 108, 76, 5);
  drawCastShadow(ctx, board, 3, 4, 0.05);
  board(); ctx.fillStyle = "rgba(30,110,70,0.55)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; board(); ctx.stroke();
  ctx.strokeStyle = "rgba(210,190,90,0.7)"; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-44, -24); ctx.lineTo(-10, -24); ctx.lineTo(-10, 10); ctx.lineTo(30, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-44, 20); ctx.lineTo(20, 20); ctx.lineTo(20, -20); ctx.lineTo(44, -20); ctx.stroke();
  for (const [x, y] of [[-44, -24], [30, 10], [-44, 20], [44, -20], [0, -30]]) { ctx.fillStyle = "rgba(210,190,90,0.85)"; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(40,40,40,0.8)"; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }
}
function drawElecSwitchToggle(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const base = () => roundedRect(ctx, -22, 4, 44, 40, 5);
  drawCastShadow(ctx, base, 3, 4, 0.05);
  base(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; base(); ctx.stroke();
  roundedRect(ctx, -10, -6, 20, 16, 3); ctx.fillStyle = BIN_FILL; ctx.fill(); roundedRect(ctx, -10, -6, 20, 16, 3); ctx.stroke();
  ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-16, -40); ctx.stroke();
  ctx.beginPath(); ctx.arc(-16, -42, 8, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.lineWidth = 2.5; ctx.lineCap = "round"; for (const x of [-10, 10]) { ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 56); ctx.stroke(); }
}
function drawElecDiode(ctx, part) {
  setup(ctx, part, 1.7, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-56, 0); ctx.lineTo(-24, 0); ctx.moveTo(24, 0); ctx.lineTo(56, 0); ctx.stroke();
  const body = () => roundedRect(ctx, -24, -13, 48, 26, 8);
  drawCastShadow(ctx, body, 2, 3, 0.05);
  body(); ctx.fillStyle = "rgba(44,32,32,0.74)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.fillStyle = "rgba(232,227,217,0.88)"; ctx.fillRect(12, -13, 6, 26);
}

// ============ Parts bin batch 4 — tools, containers, lamps, connectors, structural ============
function drawToolWrench(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const bar = () => roundedRect(ctx, -7, -28, 14, 56, 6);
  drawCastShadow(ctx, bar, 3, 4, 0.05);
  bar(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; bar(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 40, 15, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 40, 7, 0, 7); ctx.stroke();
  const head = () => { ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(-18, -54); ctx.lineTo(-6, -54); ctx.lineTo(-6, -40); ctx.lineTo(6, -40); ctx.lineTo(6, -54); ctx.lineTo(18, -54); ctx.lineTo(18, -28); ctx.closePath(); };
  head(); ctx.fillStyle = BIN_FILL; ctx.fill(); head(); ctx.stroke();
}
function drawToolHammer(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const handle = () => roundedRect(ctx, -5, -30, 10, 78, 4);
  drawCastShadow(ctx, handle, 3, 4, 0.05);
  handle(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; handle(); ctx.stroke();
  const head = () => { ctx.beginPath(); ctx.moveTo(-30, -46); ctx.lineTo(20, -46); ctx.quadraticCurveTo(40, -42, 42, -30); ctx.lineTo(30, -22); ctx.lineTo(20, -28); ctx.lineTo(-20, -28); ctx.quadraticCurveTo(-30, -28, -30, -38); ctx.closePath(); };
  head(); ctx.fillStyle = BIN_FILL; ctx.fill(); head(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-28, -28); ctx.quadraticCurveTo(-42, -8, -34, 4); ctx.lineTo(-27, 0); ctx.quadraticCurveTo(-32, -12, -20, -28); ctx.closePath(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}
function drawHookJ(ctx, part) {
  setup(ctx, part, 2, 0.82);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, 12); ctx.arc(-14, 12, 14, 0, Math.PI * 0.92, false); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -50, 8, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}
function drawChainLink(ctx, part) {
  setup(ctx, part, 2, 0.82);
  const ring = () => roundedRect(ctx, -20, -38, 40, 76, 20);
  ring(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 11; ctx.stroke();
  ring(); ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 3.5; ctx.stroke();
}
function drawHingeBarrel(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const left = () => roundedRect(ctx, -48, -34, 46, 68, 4);
  const right = () => roundedRect(ctx, 2, -34, 46, 68, 4);
  drawCastShadow(ctx, () => { left(); right(); }, 3, 4, 0.05);
  left(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; left(); ctx.stroke();
  right(); ctx.fillStyle = BIN_FILL; ctx.fill(); right(); ctx.stroke();
  for (const s of [[-30, -18], [-30, 18], [30, -18], [30, 18]]) drawRivet(ctx, s[0], s[1], 3.4);
  const pin = () => roundedRect(ctx, -8, -40, 16, 80, 8);
  pin(); ctx.fillStyle = BIN_FILL; ctx.fill(); pin(); ctx.stroke();
  ctx.lineWidth = 1.4; for (const y of [-30, -10, 10, 30]) { ctx.beginPath(); ctx.moveTo(-8, y); ctx.lineTo(8, y); ctx.stroke(); }
}
function drawLatchHook(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const base = () => roundedRect(ctx, -52, -16, 40, 32, 4);
  base(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; base(); ctx.stroke();
  drawRivet(ctx, -42, 0, 3); drawRivet(ctx, -20, 0, 3);
  ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-32, -2); ctx.lineTo(28, -2); ctx.arc(28, 6, 8, -Math.PI / 2, Math.PI, false); ctx.stroke();
  const c = () => roundedRect(ctx, 34, -14, 12, 28, 3);
  c(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.lineWidth = 2; c(); ctx.stroke();
}
function drawClampC(ctx, part) {
  setup(ctx, part, 2, 0.82);
  const frame = () => { ctx.beginPath(); ctx.moveTo(24, -44); ctx.lineTo(-14, -44); ctx.quadraticCurveTo(-38, -44, -38, -20); ctx.lineTo(-38, 20); ctx.quadraticCurveTo(-38, 44, -14, 44); ctx.lineTo(24, 44); ctx.lineTo(24, 30); ctx.lineTo(-14, 30); ctx.quadraticCurveTo(-24, 30, -24, 20); ctx.lineTo(-24, -20); ctx.quadraticCurveTo(-24, -30, -14, -30); ctx.lineTo(24, -30); ctx.closePath(); };
  drawCastShadow(ctx, frame, 3, 4, 0.05);
  frame(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; frame(); ctx.stroke();
  ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(20, 38); ctx.lineTo(48, 38); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(44, 26); ctx.lineTo(44, 50); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(20, 38, 5, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.stroke();
}
function drawTankCanister(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -34, -40, 68, 84, 8);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -34, -40, 68, 84);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-26, -30); ctx.lineTo(26, 34); ctx.moveTo(26, -30); ctx.lineTo(-26, 34); ctx.stroke();
  const cap = () => roundedRect(ctx, -10, -50, 20, 12, 3);
  cap(); ctx.fillStyle = BIN_FILL; ctx.fill(); cap(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-28, -40); ctx.lineTo(-28, -48); ctx.lineTo(-14, -48); ctx.stroke();
}
function drawTankDrum(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -34, -46, 68, 92, 8);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -34, -46, 68, 92);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -46, 34, 8, 0, 0, 7); ctx.stroke();
  ctx.lineWidth = 2.4; for (const y of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(-34, y); ctx.lineTo(34, y); ctx.stroke(); }
  drawRivet(ctx, -14, -46, 4); drawRivet(ctx, 14, -46, 4);
}
function drawTankCylinder(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => { ctx.beginPath(); ctx.moveTo(-24, 48); ctx.lineTo(-24, -30); ctx.quadraticCurveTo(-24, -50, 0, -50); ctx.quadraticCurveTo(24, -50, 24, -30); ctx.lineTo(24, 48); ctx.quadraticCurveTo(24, 54, 0, 54); ctx.quadraticCurveTo(-24, 54, -24, 48); ctx.closePath(); };
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, body, -24, -50, 48, 104);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  const valve = () => roundedRect(ctx, -8, -62, 16, 14, 3);
  valve(); ctx.fillStyle = BIN_FILL; ctx.fill(); valve(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -64, 6, 0, 7); ctx.stroke();
}
function drawBulbRound(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const glass = () => { ctx.beginPath(); ctx.arc(0, -18, 34, Math.PI * 0.16, Math.PI * 0.84, false); ctx.lineTo(-14, 30); ctx.lineTo(14, 30); ctx.closePath(); };
  drawCastShadow(ctx, glass, 3, 4, 0.05);
  glass(); ctx.fillStyle = "rgba(255,244,200,0.4)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; glass(); ctx.stroke();
  ctx.strokeStyle = "rgba(255,160,60,0.85)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, 22); ctx.lineTo(-6, -10); ctx.lineTo(0, -18); ctx.lineTo(6, -10); ctx.lineTo(8, 22); ctx.stroke();
  const base = () => roundedRect(ctx, -14, 30, 28, 26, 3);
  base(); ctx.fillStyle = "rgba(200,200,205,0.6)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; base(); ctx.stroke();
  ctx.lineWidth = 1.4; for (let y = 34; y < 52; y += 5) { ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(14, y + 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-6, 56); ctx.lineTo(6, 56); ctx.lineTo(0, 62); ctx.closePath(); ctx.fillStyle = BIN_INK; ctx.fill();
}
function drawBulbNeon(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const bezel = () => { ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); };
  drawCastShadow(ctx, bezel, 3, 4, 0.05);
  bezel(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 3; bezel(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7); ctx.fillStyle = "rgba(255,120,60,0.6)"; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = BIN_INK; ctx.stroke();
  ctx.fillStyle = "rgba(255,220,180,0.85)"; ctx.beginPath(); ctx.arc(-6, -6, 5, 0, 7); ctx.fill();
}
function drawBulbFilament(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const tube = () => roundedRect(ctx, -54, -14, 108, 28, 14);
  drawCastShadow(ctx, tube, 3, 4, 0.05);
  tube(); ctx.fillStyle = "rgba(220,240,255,0.4)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; tube(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,220,0.5)"; roundedRect(ctx, -44, -6, 88, 12, 6); ctx.fill();
  const cap1 = () => roundedRect(ctx, -60, -11, 10, 22, 3);
  const cap2 = () => roundedRect(ctx, 50, -11, 10, 22, 3);
  cap1(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; cap1(); ctx.stroke();
  cap2(); ctx.fillStyle = BIN_FILL; ctx.fill(); cap2(); ctx.stroke();
}
function drawPlugAc(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -30, -6, 60, 50, 12);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  const pr1 = () => roundedRect(ctx, -16, -28, 8, 24, 2);
  const pr2 = () => roundedRect(ctx, 8, -28, 8, 24, 2);
  pr1(); ctx.fillStyle = BIN_FILL; ctx.fill(); pr1(); ctx.stroke();
  pr2(); ctx.fillStyle = BIN_FILL; ctx.fill(); pr2(); ctx.stroke();
  ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(0, 56); ctx.stroke();
}
function drawJackSocket(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -20, -34, 40, 68, 6);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(20, -20); ctx.lineTo(20, -8); ctx.lineTo(-20, -8); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -30, 8, 0, 7); ctx.fillStyle = "rgba(30,30,34,0.7)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-8, 34); ctx.lineTo(-8, 46); ctx.moveTo(8, 34); ctx.lineTo(8, 46); ctx.stroke();
}
function drawTerminalBlock(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const body = () => roundedRect(ctx, -54, -24, 108, 48, 5);
  drawCastShadow(ctx, body, 3, 4, 0.05);
  body(); ctx.fillStyle = "rgba(60,120,90,0.42)"; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; body(); ctx.stroke();
  for (let i = 0; i < 4; i++) { const x = -40 + i * 26; ctx.beginPath(); ctx.arc(x, -6, 8, 0, 7); ctx.fillStyle = BIN_FILL; ctx.fill(); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 1.6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 5, -6); ctx.lineTo(x + 5, -6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, -3); ctx.lineTo(x, 20); ctx.stroke(); }
}
function drawBeamI(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const I = () => { ctx.beginPath(); ctx.moveTo(-40, -44); ctx.lineTo(40, -44); ctx.lineTo(40, -30); ctx.lineTo(10, -30); ctx.lineTo(10, 30); ctx.lineTo(40, 30); ctx.lineTo(40, 44); ctx.lineTo(-40, 44); ctx.lineTo(-40, 30); ctx.lineTo(-10, 30); ctx.lineTo(-10, -30); ctx.lineTo(-40, -30); ctx.closePath(); };
  drawCastShadow(ctx, I, 3, 4, 0.05);
  I(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, I, -40, -44, 80, 88);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; I(); ctx.stroke();
}
function drawChannelU(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const U = () => { ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(-40, 40); ctx.lineTo(40, 40); ctx.lineTo(40, -40); ctx.lineTo(26, -40); ctx.lineTo(26, 26); ctx.lineTo(-26, 26); ctx.lineTo(-26, -40); ctx.closePath(); };
  drawCastShadow(ctx, U, 3, 4, 0.05);
  U(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, U, -40, -40, 80, 80);
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; U(); ctx.stroke();
}
function drawGrateMesh(ctx, part) {
  setup(ctx, part, 1.8, 0.82);
  const rect = () => roundedRect(ctx, -50, -40, 100, 80, 6);
  drawCastShadow(ctx, rect, 3, 4, 0.05);
  rect(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.save(); rect(); ctx.clip();
  ctx.strokeStyle = "rgba(18,22,25,0.4)"; ctx.lineWidth = 3;
  for (let x = -44; x <= 44; x += 14) { ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x, 40); ctx.stroke(); }
  for (let y = -34; y <= 34; y += 14) { ctx.beginPath(); ctx.moveTo(-50, y); ctx.lineTo(50, y); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2.5; rect(); ctx.stroke();
  for (const p of [[-42, -32], [42, -32], [-42, 32], [42, 32]]) drawRivet(ctx, p[0], p[1], 3);
}

// ============ Organic shape primitives — the "glue" for composing shapes no single mechanical part makes.
// Drawn in OUR canvas style (setup() material fill + pencil shade + ink stroke) so they recolour + texture
// exactly like every other canvas part — NOT flat SVG. ============
function drawPrimDisc(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const d = () => { ctx.beginPath(); ctx.arc(0, 0, 48, 0, 7); };
  drawCastShadow(ctx, d, 3, 5, 0.05); d(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, d, -48, -48, 96, 96); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; d(); ctx.stroke();
}
function drawPrimRing(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const ring = () => { ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.arc(0, 0, 26, 0, Math.PI * 2, true); };
  drawCastShadow(ctx, ring, 3, 5, 0.05); ring(); ctx.fillStyle = BIN_FILL; ctx.fill("evenodd");
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 48, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.stroke();
}
function drawPrimDome(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const d = () => { ctx.beginPath(); ctx.moveTo(-50, 40); ctx.bezierCurveTo(-54, -30, -30, -52, 0, -52); ctx.bezierCurveTo(30, -52, 54, -30, 50, 40); ctx.closePath(); };
  drawCastShadow(ctx, d, 3, 5, 0.05); d(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, d, -54, -52, 108, 92); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; d(); ctx.stroke();
}
function drawPrimTeardrop(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const t = () => { ctx.beginPath(); ctx.moveTo(0, -50); ctx.bezierCurveTo(34, -8, 26, 44, 0, 44); ctx.bezierCurveTo(-26, 44, -34, -8, 0, -50); ctx.closePath(); };
  drawCastShadow(ctx, t, 3, 4, 0.05); t(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, t, -34, -50, 68, 94); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; t(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.ellipse(-8, -4, 6, 12, -0.4, 0, 7); ctx.fill();
}
function drawPrimBlob(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const b = () => { ctx.beginPath(); ctx.moveTo(-40, -20); ctx.bezierCurveTo(-52, -44, -8, -54, 18, -44); ctx.bezierCurveTo(50, -34, 52, 6, 38, 28); ctx.bezierCurveTo(24, 50, -18, 52, -36, 34); ctx.bezierCurveTo(-52, 18, -30, 4, -40, -20); ctx.closePath(); };
  drawCastShadow(ctx, b, 3, 4, 0.05); b(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, b, -52, -54, 106, 106); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; b(); ctx.stroke();
}
function drawPrimBlade(ctx, part) {
  setup(ctx, part, 1.9, 0.85);
  const bl = () => { ctx.beginPath(); ctx.moveTo(-52, 0); ctx.bezierCurveTo(-30, -20, 30, -22, 54, -8); ctx.bezierCurveTo(64, -2, 64, 2, 54, 8); ctx.bezierCurveTo(30, 22, -30, 20, -52, 0); ctx.closePath(); };
  drawCastShadow(ctx, bl, 2, 3, 0.05); bl(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, bl, -52, -22, 118, 44); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; bl(); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-40, -2); ctx.quadraticCurveTo(10, -8, 48, -4); ctx.stroke();
}
function drawPrimOval(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const o = () => { ctx.beginPath(); ctx.ellipse(0, 0, 52, 32, 0, 0, 7); };
  drawCastShadow(ctx, o, 3, 4, 0.05); o(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, o, -52, -32, 104, 64); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; o(); ctx.stroke();
}
function drawPrimCone(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const c = () => { ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(42, 44); ctx.lineTo(-42, 44); ctx.closePath(); };
  drawCastShadow(ctx, c, 3, 4, 0.05); c(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, c, -42, -50, 84, 94); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; c(); ctx.stroke();
}
function drawPrimCrescent(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const cr = () => { ctx.beginPath(); ctx.arc(0, 0, 48, Math.PI * 0.34, Math.PI * 1.66, false); ctx.arc(20, 0, 44, Math.PI * 1.5, Math.PI * 0.5, true); ctx.closePath(); };
  drawCastShadow(ctx, cr, 3, 4, 0.05); cr(); ctx.fillStyle = BIN_FILL; ctx.fill();
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; cr(); ctx.stroke();
}
function drawPrimStar(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const st = () => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 20 : 48; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); };
  drawCastShadow(ctx, st, 3, 4, 0.05); st(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, st, -48, -48, 96, 96); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; st(); ctx.stroke();
}
function drawPrimArch(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const a = () => { ctx.beginPath(); ctx.arc(0, 28, 50, Math.PI, 0, false); ctx.arc(0, 28, 30, 0, Math.PI, true); ctx.closePath(); };
  drawCastShadow(ctx, a, 3, 4, 0.05); a(); ctx.fillStyle = BIN_FILL; ctx.fill("evenodd");
  ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; a(); ctx.stroke();
}
function drawPrimPill(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const p = () => roundedRect(ctx, -52, -20, 104, 40, 20);
  drawCastShadow(ctx, p, 3, 4, 0.05); p(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, p, -52, -20, 104, 40); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; p(); ctx.stroke();
}
function drawPrimHeart(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const h = () => { ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(-48, 8, -44, -40, -14, -40); ctx.bezierCurveTo(-2, -40, 0, -26, 0, -20); ctx.bezierCurveTo(0, -26, 2, -40, 14, -40); ctx.bezierCurveTo(44, -40, 48, 8, 0, 44); ctx.closePath(); };
  drawCastShadow(ctx, h, 3, 4, 0.05); h(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, h, -48, -40, 96, 84); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; h(); ctx.stroke();
}
function drawPrimDiamond(ctx, part) {
  setup(ctx, part, 1.9, 0.8);
  const d = () => { ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(34, 0); ctx.lineTo(0, 50); ctx.lineTo(-34, 0); ctx.closePath(); };
  drawCastShadow(ctx, d, 3, 4, 0.05); d(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, d, -34, -50, 68, 100); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; d(); ctx.stroke();
}
function drawPrimPetal(ctx, part) {
  setup(ctx, part, 1.8, 0.8);
  const p = () => { ctx.beginPath(); ctx.moveTo(0, -52); ctx.bezierCurveTo(30, -30, 30, 30, 0, 52); ctx.bezierCurveTo(-30, 30, -30, -30, 0, -52); ctx.closePath(); };
  drawCastShadow(ctx, p, 3, 4, 0.05); p(); ctx.fillStyle = BIN_FILL; ctx.fill();
  binShade(ctx, p, -30, -52, 60, 104); ctx.strokeStyle = BIN_INK; ctx.lineWidth = 2; p(); ctx.stroke();
}

// ---- DDG collab items — hand-drawn to match the DDG collection art (bold flat cartoon: saturated fills +
// heavy black outline). Each visual element is its own DDG component draw-fn and the three items compose
// them. The propeller-cap top SPINS live off state.time (redrawn every frame on the machine; static in the
// preview when previewMotion === false). Fixed DDG brand palette; ddg.* keys skip the glassy finish. ----
const DDGC = {
  red: "#e23742", redDk: "#a81f2a", redHi: "#ff6f77",
  blue: "#3f7fe6", blueDk: "#264fae", blueHi: "#7bacff",
  purple: "#6f42c9", purpleDk: "#3a1e80", purpleMesh: "#5c34a8",
  cream: "#efe7d2", creamDk: "#cdbf99",
  ice: "#5ec2f0",
  skRed: "#ff5566", skYellow: "#ffd447", skGreen: "#5fe39a",
  slPurple: "#8a4fe0", slBlue: "#4aa8ef",
  teal: "#14b7a4", lime: "#8ee63a", pink: "#ff5db0", canPurple: "#6a3fa0",
  silver: "#c8ccd6",
  ink: "#0b0b12"
};
function ddgOutline(ctx, w) {
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.strokeStyle = DDGC.ink; ctx.lineWidth = w; ctx.stroke();
}

// Attach a registered DDG part: place PARTS[key]'s own draw at (x,y), scaled + rotated. This is how the
// three items are assembled — piece by piece from registered parts, not drawn inline.
function ddgPut(ctx, state, key, x, y, scale, rot, material, passes, opts) {
  if (!getPart(key)) return;
  // Route through drawPart so applyMaterialFinish paints the material colour (it only runs there).
  // `passes` re-draws the translucent part N times so composed shells read solid, not washed. Non-animated
  // prims stay cached even during motion, so N passes = N cheap drawImage calls. fastStill suppresses
  // drawPart's outer silhouette/box while keeping colour + pencil texture; external rotation still animates.
  // opts.sx/sy = non-uniform scale (thin letter bars, stretched cans); opts.opacity = fade (bubbles).
  opts = opts || {};
  const sx = opts.sx != null ? opts.sx : (scale || 1);
  const sy = opts.sy != null ? opts.sy : (scale || 1);
  const opacity = opts.opacity != null ? opts.opacity : 1;
  const subState = { ...state, fastStill: true };
  for (let n = 0; n < Math.max(1, passes || 1); n += 1) {
    drawPart(ctx, { key, x, y, scaleX: sx, scaleY: sy, rotation: rot || 0, material, opacity }, subState);
  }
}

// Rainbow split skull from primitives (pink/yellow diagonal cranium + green chin + big black sockets +
// red brow + black nose + teeth), matching the DDG art but textured/material-driven. cx,cy,s place + scale.
function ddgSkullPrim(ctx, state, cx, cy, s) {
  const P = (k, x, y, sc, rot, mat, n) => ddgPut(ctx, state, k, cx + x * s, cy + y * s, sc * s, rot, mat, n);
  P("prim.blob", -14, 66, 1.05, 0.2, "signalGreen", 5);          // green chin (bottom-left)
  P("prim.dome", 0, -6, 1.7, 0, "petCoralEnamel", 6);            // pink/red cranium
  P("prim.dome", 40, 2, 1.45, 0.18, "pfpGold", 6);               // yellow right half (diagonal split)
  P("prim.blob", -2, 48, 1.16, 0, "petCoralEnamel", 5);          // jaw (red, overlaps cranium)
  P("prim.blob", 32, 50, 0.95, 0, "pfpGold", 5);                 // jaw (yellow)
  P("prim.blob", -46, 22, 0.72, 0.5, "petCoralEnamel", 4);       // left cheek bridge
  P("prim.blob", 48, 24, 0.72, -0.5, "pfpGold", 4);              // right cheek bridge
  P("prim.disc", -34, 8, 0.62, 0, "voidGlass", 5);               // eye socket L (round, separated)
  P("prim.disc", 34, 8, 0.62, 0, "voidGlass", 5);                // eye socket R
  P("prim.blade", -16, -14, 0.36, 0.7, "pressureRed", 3);        // brow ridge L
  P("prim.blade", 16, -14, 0.36, Math.PI - 0.7, "pressureRed", 3); // brow ridge R
  P("prim.cone", 0, 42, 0.34, Math.PI, "voidGlass", 4);          // nose
  for (let i = -2; i <= 2; i += 1) P("prim.cone", i * 13, 72, 0.16, Math.PI, "voidGlass", 3); // teeth gaps
}

// Rainbow slime aura from primitives (blue underlayer + purple flames rising, a hole-loop on the left,
// 3 purple drops floating above) — matches the DDG sticker, textured. cx,cy,s place + scale.
function ddgSlimePrim(ctx, state, cx, cy, s) {
  const P = (k, x, y, sc, rot, mat, n) => ddgPut(ctx, state, k, cx + x * s, cy + y * s, sc * s, rot, mat, n);
  // Flame tongues radiating around the skull (teardrops pointing OUTWARD, overlapping into a connected
  // ring). Blue underlayer sits behind + offset; the left-centre is left open for the signature hole.
  const R = 74;
  const angs = [-2.9, -2.4, -1.95, -1.55, -1.15, -0.72, -0.28, 0.45, 2.5]; // radians: top arc + lower sides
  angs.forEach((a) => P("prim.teardrop", Math.cos(a) * R + 8, Math.sin(a) * R + 6, 1.3, a + Math.PI / 2, "reactorGlass", 4));
  angs.forEach((a) => P("prim.teardrop", Math.cos(a) * R, Math.sin(a) * R, 1.08, a + Math.PI / 2, "violetGlass", 5));
  P("prim.ring", -82, -4, 0.56, 0, "violetGlass", 4);            // hole-loop on the left
  P("prim.teardrop", -46, -134, 0.5, 0, "violetGlass", 4);       // 3 floating drops above
  P("prim.teardrop", 8, -158, 0.42, 0, "violetGlass", 4);
  P("prim.teardrop", 52, -132, 0.46, 0, "violetGlass", 4);
}

// A blocky letter (D or G) built from thin pill "plates" (non-uniform-scaled). h = letter height.
function ddgLetter(ctx, state, char, cx, cy, h, mat) {
  const t = h * 0.22, w = h * 0.62, PW = 108, PH = 44;
  const bar = (x, y, L, vert) => ddgPut(ctx, state, "prim.pill", cx + x, cy + y, 1, vert ? Math.PI / 2 : 0, mat, 3, { sx: L / PW, sy: t / PH });
  bar(-w / 2, 0, h, true);                 // left spine
  bar(0, -h / 2 + t / 2, w * 0.78, false); // top
  bar(0, h / 2 - t / 2, w * 0.78, false);  // bottom
  if (char === "D") {
    bar(w / 2 - t / 2, 0, h * 0.7, true);        // right spine
  } else {
    bar(w / 2 - t / 2, h * 0.24, h * 0.5, true); // G right-bottom
    bar(w * 0.12, h * 0.08, w * 0.52, false);    // G inner tongue
  }
}

// A detailed rainbow spray can from pills (body + diagonal stripes + label + silver base + nozzle + tip),
// tilted by `tilt`. cx,cy = can centre; h = height.
function ddgCan(ctx, state, cx, cy, h, tilt, body, stripe) {
  body = body || "mercuryGlass";                 // can body — colorway primary
  stripe = stripe || "signalGreen";              // stripes/nozzle — colorway secondary
  const w = h * 0.44, PW = 108, PH = 44;
  const R = (lx, ly) => [cx + lx * Math.cos(tilt) - ly * Math.sin(tilt), cy + lx * Math.sin(tilt) + ly * Math.cos(tilt)];
  const put = (lx, ly, extraRot, mat, n, opts) => { const p = R(lx, ly); ddgPut(ctx, state, "prim.pill", p[0], p[1], 1, tilt + extraRot, mat, n, opts); };
  put(0, 0, Math.PI / 2, body, 5, { sx: h / PW, sy: w / PH });                                     // body (colorway-driven)
  // diagonal accent stripes — every stripe recolours with the COLOR button (colorway secondary),
  // one thin cream keyline between them so they still read as distinct bands on any body colour
  [stripe, "petCreamEnamel", stripe, "petCreamEnamel", stripe].forEach((m, i) =>
    put(0, -h * 0.3 + i * h * 0.15, 0.5, m, 2, { sx: (w * 1.15) / PW, sy: (w * (i % 2 ? 0.12 : 0.34)) / PH })); // diagonal stripes
  put(0, h * 0.34, Math.PI / 2, "petCreamEnamel", 3, { sx: (w * 0.5) / PW, sy: (w * 0.5) / PH });   // small cream label band
  put(0, h * 0.42, Math.PI / 2, "mercuryGlass", 4, { sx: (w * 0.55) / PW, sy: w / PH });            // silver base
  put(0, -h * 0.56, Math.PI / 2, stripe, 3, { sx: (w * 0.55) / PW, sy: (w * 0.55) / PH });          // nozzle cap (colorway-driven)
  put(0, -h * 0.7, Math.PI / 2, "voidGlass", 2, { sx: (w * 0.2) / PW, sy: (w * 0.34) / PH });       // spray tip
}

// === DDG component parts — each is a first-class registered part (see PARTS: "ddg.*"). ===

// ddg.propBlade — one propeller paddle-blade, root at origin pointing +x; part.material "blue" = blue else red.
function drawDdgBlade(ctx, part) {
  const blue = part && part.material === "blue";
  const col = blue ? DDGC.blue : DDGC.red;
  const hi = blue ? DDGC.blueHi : DDGC.redHi;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.bezierCurveTo(56, -27, 100, -26, 120, -15);
    ctx.bezierCurveTo(134, -7, 134, 9, 120, 15);
    ctx.bezierCurveTo(100, 26, 56, 27, 6, 10);
    ctx.bezierCurveTo(-4, 5, -4, -5, 6, -10);
    ctx.closePath();
  };
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.moveTo(12, -8); ctx.bezierCurveTo(58, -21, 98, -20, 118, -11);
  ctx.bezierCurveTo(94, -15, 58, -14, 16, -3); ctx.closePath(); ctx.fill();
  ctx.restore();
  path(); ddgOutline(ctx, 6.5);
}

// ddg.propMast — dark knobby mast/screw the propeller sits on. Base at origin, rises up.
function drawDdgMast(ctx) {
  const h = 36;
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  ctx.bezierCurveTo(-13, -h * 0.28, -6, -h * 0.42, -9, -h * 0.62);
  ctx.bezierCurveTo(-12, -h * 0.82, -7, -h, 0, -h);
  ctx.bezierCurveTo(7, -h, 12, -h * 0.82, 9, -h * 0.62);
  ctx.bezierCurveTo(6, -h * 0.42, 13, -h * 0.28, 9, 6);
  ctx.closePath();
  ctx.fillStyle = DDGC.purpleDk; ctx.fill(); ddgOutline(ctx, 6);
  ctx.strokeStyle = "rgba(255,255,255,0.26)"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-5, -h * 0.2); ctx.quadraticCurveTo(6, -h * 0.34, -4, -h * 0.5);
  ctx.quadraticCurveTo(6, -h * 0.66, -4, -h * 0.8); ctx.stroke();
}

// ddg.propHub — the dark knob where the blades meet.
function drawDdgHub(ctx) {
  ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fillStyle = DDGC.purpleDk; ctx.fill(); ddgOutline(ctx, 5);
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(-4, -4, 5, 0, 7); ctx.fill();
}

// ddg.bubble — a floating slime bubble (transparent shell + inner slime + highlight), r = 26 (scale to resize).
function drawDdgBubble(ctx) {
  const r = 26;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = "rgba(190,225,255,0.38)"; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip();
  ctx.fillStyle = DDGC.slBlue;
  ctx.beginPath();
  ctx.moveTo(-r * 0.35, r * 0.15); ctx.bezierCurveTo(-r * 0.7, -r * 0.5, r * 0.5, -r * 0.75, r * 0.45, 0);
  ctx.bezierCurveTo(r * 0.25, r * 0.55, -r * 0.35, r * 0.55, -r * 0.35, r * 0.15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = DDGC.slPurple;
  ctx.beginPath(); ctx.arc(r * 0.12, r * 0.24, r * 0.26, 0, 7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = DDGC.ice; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.beginPath(); ctx.arc(-r * 0.34, -r * 0.36, r * 0.16, 0, 7); ctx.fill();
}

// ddg.sprayCan — a single rainbow-striped spray can, origin at centre.
function drawDdgSprayCan(ctx) {
  const body = () => { ctx.beginPath(); ctx.roundRect(-32, -66, 64, 150, 14); };
  body(); ctx.save(); ctx.clip();
  const cols = [DDGC.teal, DDGC.lime, DDGC.pink, DDGC.canPurple, DDGC.teal, DDGC.lime, DDGC.pink, DDGC.canPurple];
  ctx.save(); ctx.translate(-72, 0); ctx.rotate(0.42);
  cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * 26, -150, 26, 320); });
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = "#f3f3f7"; ctx.fillRect(-32, -6, 64, 20);
  ctx.strokeStyle = DDGC.ink; ctx.lineWidth = 4; ctx.strokeRect(-32, -6, 64, 20);
  ctx.beginPath(); ctx.roundRect(-32, 52, 64, 30, 8); ctx.fillStyle = DDGC.silver; ctx.fill(); ddgOutline(ctx, 5);
  body(); ddgOutline(ctx, 6);
  ctx.beginPath(); ctx.roundRect(-19, -92, 38, 30, 7); ctx.fillStyle = DDGC.canPurple; ctx.fill(); ddgOutline(ctx, 6);
  ctx.beginPath(); ctx.roundRect(-7, -102, 14, 14, 3); ctx.fillStyle = DDGC.canPurple; ctx.fill(); ddgOutline(ctx, 4);
}

// ddg.slime — rainbow slime aura flaming up behind the skull + 3 floating drops.
function drawDdgSlime(ctx) {
  const flame = (dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(-120 + dx, 70 + dy);
    ctx.bezierCurveTo(-176 + dx, 10 + dy, -150 + dx, -70 + dy, -128 + dx, -118 + dy);
    ctx.bezierCurveTo(-138 + dx, -60 + dy, -96 + dx, -44 + dy, -74 + dx, -110 + dy);
    ctx.bezierCurveTo(-52 + dx, -168 + dy, -18 + dx, -120 + dy, -4 + dx, -150 + dy);
    ctx.bezierCurveTo(14 + dx, -118 + dy, 48 + dx, -170 + dy, 72 + dx, -112 + dy);
    ctx.bezierCurveTo(96 + dx, -46 + dy, 140 + dx, -66 + dy, 128 + dx, -118 + dy);
    ctx.bezierCurveTo(160 + dx, -66 + dy, 172 + dx, 6 + dy, 120 + dx, 66 + dy);
    ctx.lineTo(-120 + dx, 70 + dy);
    ctx.closePath();
  };
  flame(7, 6); ctx.fillStyle = DDGC.slBlue; ctx.fill();
  flame(0, 0); ctx.fillStyle = DDGC.slPurple; ctx.fill(); ddgOutline(ctx, 7);
  const drop = (x, y, r) => {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.5);
    ctx.bezierCurveTo(x + r, y - r * 0.4, x + r, y + r * 0.7, x, y + r * 0.8);
    ctx.bezierCurveTo(x - r, y + r * 0.7, x - r, y - r * 0.4, x, y - r * 1.5);
    ctx.closePath();
    ctx.fillStyle = DDGC.slPurple; ctx.fill(); ddgOutline(ctx, 6);
  };
  drop(-70, -178, 18); drop(6, -202, 15); drop(74, -176, 16);
}

// ddg.skull — the rainbow split-colour skull (red / yellow face, green jaw, black sockets). Centred.
function drawDdgSkull(ctx) {
  const skull = () => {
    ctx.beginPath();
    ctx.moveTo(-106, -6);
    ctx.bezierCurveTo(-116, -92, -58, -132, 0, -132);
    ctx.bezierCurveTo(58, -132, 116, -92, 106, -6);
    ctx.bezierCurveTo(110, 34, 86, 50, 58, 60);
    ctx.lineTo(58, 92);
    ctx.bezierCurveTo(58, 116, 30, 124, 20, 104);
    ctx.bezierCurveTo(12, 122, -12, 122, -20, 104);
    ctx.bezierCurveTo(-30, 124, -58, 116, -58, 92);
    ctx.lineTo(-58, 60);
    ctx.bezierCurveTo(-86, 50, -110, 34, -106, -6);
    ctx.closePath();
  };
  skull(); ctx.save(); ctx.clip();
  ctx.fillStyle = DDGC.skRed; ctx.fillRect(-140, -150, 280, 300);
  ctx.fillStyle = DDGC.skYellow;
  ctx.beginPath();
  ctx.moveTo(2, -150); ctx.lineTo(150, -150); ctx.lineTo(150, 150); ctx.lineTo(40, 150);
  ctx.bezierCurveTo(-22, 40, 30, -50, 2, -150); ctx.closePath(); ctx.fill();
  ctx.fillStyle = DDGC.skGreen;
  ctx.beginPath();
  ctx.moveTo(-120, 44); ctx.bezierCurveTo(-64, 52, -34, 84, -16, 150); ctx.lineTo(-120, 150); ctx.closePath(); ctx.fill();
  ctx.restore();
  skull(); ddgOutline(ctx, 8);
  ctx.fillStyle = DDGC.ink;
  ctx.beginPath(); ctx.ellipse(-44, 6, 28, 34, -0.05, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(44, 6, 28, 34, 0.05, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 42); ctx.bezierCurveTo(-15, 60, -8, 74, 0, 72); ctx.bezierCurveTo(8, 74, 15, 60, 0, 42); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = DDGC.ink; ctx.lineWidth = 6;
  [-1, 0, 1].forEach((i) => { ctx.beginPath(); ctx.moveTo(i * 24, 80); ctx.lineTo(i * 24, 108); ctx.stroke(); });
}

// ddg.capCrown — the propeller-cap crown: cream front + purple halftone-mesh side + seam.
function drawDdgCapCrown(ctx) {
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(-150, 66);
    ctx.bezierCurveTo(-172, -66, -118, -158, 4, -160);
    ctx.bezierCurveTo(128, -158, 166, -60, 146, 70);
    ctx.bezierCurveTo(110, 96, -116, 96, -150, 66);
    ctx.closePath();
  };
  dome(); ctx.fillStyle = DDGC.cream; ctx.fill();
  ctx.save(); dome(); ctx.clip();
  ctx.fillStyle = DDGC.purpleMesh;
  ctx.beginPath();
  ctx.moveTo(-180, -180); ctx.lineTo(2, -160);
  ctx.bezierCurveTo(-26, -70, -30, 10, -18, 96); ctx.lineTo(-180, 96); ctx.closePath(); ctx.fill();
  ctx.fillStyle = DDGC.purpleDk;
  for (let yy = -150; yy < 92; yy += 15) {
    for (let xx = -162; xx < 2; xx += 15) {
      const off = (Math.round((yy + 150) / 15) % 2) ? 7.5 : 0;
      ctx.beginPath(); ctx.arc(xx + off, yy, 4, 0, 7); ctx.fill();
    }
  }
  ctx.restore();
  ctx.strokeStyle = DDGC.ink; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(2, -160); ctx.bezierCurveTo(-26, -70, -30, 10, -18, 90); ctx.stroke();
  dome(); ddgOutline(ctx, 7);
}

// ddg.capBrim — the red curved brim (shared by both caps).
function drawDdgCapBrim(ctx) {
  const brim = () => {
    ctx.beginPath();
    ctx.moveTo(-46, 70);
    ctx.bezierCurveTo(50, 44, 150, 52, 196, 104);
    ctx.bezierCurveTo(206, 118, 198, 132, 176, 132);
    ctx.bezierCurveTo(90, 132, 10, 120, -40, 104);
    ctx.closePath();
  };
  brim(); ctx.fillStyle = DDGC.red; ctx.fill();
  ctx.save(); brim(); ctx.clip();
  ctx.fillStyle = DDGC.redDk;
  ctx.beginPath(); ctx.moveTo(-40, 108); ctx.bezierCurveTo(60, 130, 150, 140, 206, 116);
  ctx.lineTo(206, 150); ctx.lineTo(-40, 140); ctx.closePath(); ctx.fill();
  ctx.restore();
  brim(); ddgOutline(ctx, 7);
}

// ddg.capPatch — the purple front patch with blue slime-drip "DDG" lettering. Centred at origin.
function drawDdgCapPatch(ctx) {
  ctx.beginPath(); ctx.roundRect(-64, -46, 128, 92, 16);
  ctx.fillStyle = DDGC.purple; ctx.fill(); ddgOutline(ctx, 6);
  ctx.fillStyle = DDGC.ice;
  ctx.font = '900 58px "Arial Black", Impact, system-ui, sans-serif';
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.lineJoin = "round"; ctx.strokeStyle = DDGC.ink; ctx.lineWidth = 7;
  ctx.strokeText("DDG", 0, 0); ctx.fillText("DDG", 0, 0);
  ctx.fillStyle = DDGC.ice;
  [-40, -4, 34].forEach((dx) => { ctx.beginPath(); ctx.moveTo(dx, 22); ctx.lineTo(dx - 5, 40); ctx.quadraticCurveTo(dx, 46, dx + 5, 40); ctx.closePath(); ctx.fill(); });
}

// ddg.capBlue — the spray-cap blue crown dome.
function drawDdgCapBlue(ctx) {
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(-128, 70);
    ctx.bezierCurveTo(-150, -54, -96, -140, 6, -142);
    ctx.bezierCurveTo(110, -140, 150, -52, 128, 72);
    ctx.bezierCurveTo(96, 96, -96, 96, -128, 70);
    ctx.closePath();
  };
  dome(); ctx.fillStyle = DDGC.blue; ctx.fill();
  ctx.save(); dome(); ctx.clip();
  ctx.fillStyle = DDGC.blueHi;
  ctx.beginPath(); ctx.moveTo(-120, -40); ctx.bezierCurveTo(-60, -120, 60, -120, 110, -40);
  ctx.bezierCurveTo(40, -96, -50, -96, -120, -40); ctx.closePath(); ctx.fill();
  ctx.restore();
  dome(); ddgOutline(ctx, 7);
}

// ddg.slimeSkull — assembled: slime aura + skull.
// All three DDG items are now composed from generic organic PRIMITIVES (prim.*) in our canvas style —
// textured, material-driven, opacity-passed so they read solid. No flat/SVG bespoke parts.

// ddg.slimeSkull — rainbow slime aura + the primitive split skull.
function drawDdgSkullItem(ctx, part, state) {
  ddgSlimePrim(ctx, state, 0, 12, 1.16);
  ddgSkullPrim(ctx, state, 0, 26, 1.18);
}

// ddg.propellerCap — brim + purple-mesh side + cream front + DDG-in-plates patch + a 3-fan propeller that
// SPINS live off state.time.
function drawDdgPropellerCapItem(ctx, part, state) {
  const time = state && state.previewMotion === false ? 0 : (state && state.time) || 0;
  const spin = time * 3.0;
  const mir = state && state.mirrored ? -1 : 1; // mirror the cap body but keep the DDG wordmark upright
  const shell = (part && part.material) || "violetGlass"; // mesh colour follows the COLOR-button colorway
  const accent = (part && part.accentMat) || "pressureRed"; // brim = a CONTRASTING second tone (colorway secondary)
  ctx.save();
  ctx.scale(mir, 1);
  ddgPut(ctx, state, "prim.pill", 12, 92, 2.0, 0.06, accent, 4);              // brim (contrast tone, colorway-driven)
  ddgPut(ctx, state, "prim.dome", -44, 4, 2.0, 0, shell, 5);                   // mesh side (colorway-driven)
  ddgPut(ctx, state, "prim.dome", 30, 4, 2.0, 0, "petCreamEnamel", 4);         // cream front
  ddgPut(ctx, state, "prim.pill", 48, -2, 1, 0, shell, 4, { sx: 1.35, sy: 0.9 }); // DDG patch backing (colorway-driven)
  // mast + 3-fan spinning propeller
  const hx = -6, hy = -120;
  ddgPut(ctx, state, "prim.pill", hx, hy + 24, 1, Math.PI / 2, "voidGlass", 3, { sx: 0.14, sy: 0.52 }); // mast
  const fanCols = ["pressureRed", "reactorGlass", "signalGreen"];
  const fanR = 40;
  for (let i = 0; i < 3; i += 1) {
    const a = spin + i * (2 * Math.PI / 3) - Math.PI / 2;
    ddgPut(ctx, state, "prim.blade", hx + Math.cos(a) * fanR, hy + Math.sin(a) * fanR, 0.8, a, fanCols[i], 3);
  }
  ddgPut(ctx, state, "prim.disc", hx, hy, 0.36, 0, "voidGlass", 3);            // hub
  ctx.restore();
  // DDG letters — drawn AFTER the mirror so they always read left-to-right, positioned at the patch centre
  // (which moves to the mirrored side). Small plates, spilling outside the patch on purpose.
  const cxL = 48 * mir;
  ddgLetter(ctx, state, "D", cxL - 42, -2, 46, "amberGlass");
  ddgLetter(ctx, state, "D", cxL, -2, 46, "amberGlass");
  ddgLetter(ctx, state, "G", cxL + 42, -2, 46, "amberGlass");
}

// ddg.sprayCap — twin detailed cans attached to the sides + brim + blue crown + skull logo + bubbles that
// rise and fade (animated off state.time; ddg.sprayCap is in ANIMATED_PART_KEYS).
function drawDdgSprayCapItem(ctx, part, state) {
  const time = state && state.previewMotion === false ? 0 : (state && state.time) || 0;
  const shell = (part && part.material) || "reactorGlass"; // crown colour follows the COLOR-button colorway
  const accent = (part && part.accentMat) || "signalGreen"; // secondary tone — brim + can stripes/nozzle
  ddgCan(ctx, state, -118, -8, 156, -0.34, shell, accent);                     // left can (attached, colorway-driven)
  ddgCan(ctx, state, 118, -8, 156, 0.34, shell, accent);                       // right can (attached, colorway-driven)
  ddgPut(ctx, state, "prim.pill", 8, 84, 1.9, 0.05, accent, 4);                // brim (contrast tone, colorway-driven)
  ddgPut(ctx, state, "prim.dome", 0, 6, 1.95, 0, shell, 5);                    // crown (colorway-driven)
  ddgSkullPrim(ctx, state, 4, 8, 0.4);                                         // skull logo
  // bubbles rising off the cans + fading out
  const bubbles = [[-92, 0.0, 0.5], [-52, 0.4, 0.32], [96, 0.62, 0.46], [128, 0.2, 0.3]];
  for (const [bx, phase, bs] of bubbles) {
    const cyc = (((time * 0.5 + phase) % 1) + 1) % 1;
    const by = -60 - cyc * 96;
    ddgPut(ctx, state, "prim.ring", bx, by, bs * (0.7 + cyc * 0.4), 0, shell, 2, { opacity: Math.sin(cyc * Math.PI) });
  }
}

export const PARTS = {
  "ddg.slimeSkull": { id: 900, label: "DDG Slime Skull", category: "collab", kind: "sticker", owned: true, canDuplicate: true, showInLibrary: false, bounds: { x: -185, y: -215, w: 370, h: 380 }, draw: drawDdgSkullItem },
  "ddg.propellerCap": { id: 901, label: "DDG Propeller Cap", category: "collab", kind: "shell", owned: true, canDuplicate: true, showInLibrary: false, bounds: { x: -156, y: -218, w: 300, h: 370 }, draw: drawDdgPropellerCapItem },
  "ddg.sprayCap": { id: 902, label: "DDG Spray-Can Cap", category: "collab", kind: "shell", owned: true, canDuplicate: true, showInLibrary: false, bounds: { x: -178, y: -174, w: 352, h: 314 }, draw: drawDdgSprayCapItem },
  // DDG component parts — the pieces the three items above are assembled from (each a first-class part).
  "ddg.propBlade": { id: 903, label: "DDG Prop Blade", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -8, y: -30, w: 148, h: 60 }, draw: drawDdgBlade },
  "ddg.propMast": { id: 904, label: "DDG Prop Mast", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -14, y: -40, w: 28, h: 50 }, draw: drawDdgMast },
  "ddg.propHub": { id: 905, label: "DDG Prop Hub", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -18, y: -18, w: 36, h: 36 }, draw: drawDdgHub },
  "ddg.capCrown": { id: 906, label: "DDG Cap Crown", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -154, y: -164, w: 308, h: 266 }, draw: drawDdgCapCrown },
  "ddg.capBrim": { id: 907, label: "DDG Cap Brim", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -48, y: 42, w: 258, h: 94 }, draw: drawDdgCapBrim },
  "ddg.capPatch": { id: 908, label: "DDG Cap Patch", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -68, y: -50, w: 136, h: 100 }, draw: drawDdgCapPatch },
  "ddg.capBlue": { id: 909, label: "DDG Blue Crown", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -132, y: -146, w: 264, h: 248 }, draw: drawDdgCapBlue },
  "ddg.sprayCan": { id: 910, label: "DDG Spray Can", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -36, y: -106, w: 72, h: 194 }, draw: drawDdgSprayCan },
  "ddg.bubble": { id: 911, label: "DDG Bubble", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -30, y: -30, w: 60, h: 60 }, draw: drawDdgBubble },
  "ddg.skull": { id: 912, label: "DDG Skull", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -112, y: -136, w: 224, h: 264 }, draw: drawDdgSkull },
  "ddg.slime": { id: 913, label: "DDG Slime Aura", category: "collab", kind: "ddg", owned: true, showInLibrary: false, bounds: { x: -184, y: -216, w: 368, h: 294 }, draw: drawDdgSlime },
  // ---- Mechanical parts bin (batch 1) — generic recolourable components ----
  "plate.hex": { id: 1000, label: "Hex Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -56, y: -56, w: 112, h: 112 }, draw: drawPlateHex },
  "plate.round": { id: 1001, label: "Round Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -54, y: -54, w: 108, h: 108 }, draw: drawPlateRound },
  "plate.slotted": { id: 1002, label: "Slotted Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -60, y: -38, w: 120, h: 76 }, draw: drawPlateSlotted },
  "plate.corrugated": { id: 1003, label: "Corrugated Panel", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -60, y: -38, w: 120, h: 76 }, draw: drawPlateCorrugated },
  "wheel.spoked": { id: 1004, label: "Spoked Wheel", category: "wheel", kind: "wheel", owned: true, showInLibrary: true, bounds: { x: -54, y: -54, w: 108, h: 108 }, draw: drawWheelSpoked },
  "wheel.solid": { id: 1005, label: "Solid Wheel", category: "wheel", kind: "wheel", owned: true, showInLibrary: true, bounds: { x: -52, y: -52, w: 104, h: 104 }, draw: drawWheelSolid },
  "wheel.caster": { id: 1006, label: "Caster Wheel", category: "wheel", kind: "wheel", owned: true, showInLibrary: true, bounds: { x: -24, y: -48, w: 48, h: 96 }, draw: drawWheelCaster },
  "fastener.nail": { id: 1007, label: "Nail", category: "fastener", kind: "fastener", owned: true, showInLibrary: true, bounds: { x: -16, y: -58, w: 32, h: 118 }, draw: drawFastenerNail },
  "fastener.screw": { id: 1008, label: "Screw", category: "fastener", kind: "fastener", owned: true, showInLibrary: true, bounds: { x: -18, y: -62, w: 36, h: 122 }, draw: drawFastenerScrew },
  "fastener.staple": { id: 1009, label: "Staple", category: "fastener", kind: "fastener", owned: true, showInLibrary: true, bounds: { x: -36, y: -46, w: 72, h: 92 }, draw: drawFastenerStaple },
  "wire.coil": { id: 1010, label: "Coiled Wire", category: "wire", kind: "wire", owned: true, showInLibrary: true, bounds: { x: -62, y: -24, w: 124, h: 48 }, draw: drawWireCoil },
  "wire.loop": { id: 1011, label: "Looped Wire", category: "wire", kind: "wire", owned: true, showInLibrary: true, bounds: { x: -62, y: -40, w: 124, h: 74 }, draw: drawWireLoop },
  "elec.resistor": { id: 1012, label: "Resistor", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -60, y: -18, w: 120, h: 36 }, draw: drawElecResistor },
  "elec.capacitor": { id: 1013, label: "Capacitor", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -26, y: -50, w: 52, h: 112 }, draw: drawElecCapacitor },
  "elec.chip": { id: 1014, label: "IC Chip", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -48, y: -34, w: 96, h: 68 }, draw: drawElecChip },
  "elec.tube": { id: 1015, label: "Vacuum Tube", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -26, y: -58, w: 52, h: 128 }, draw: drawElecTube },
  // ---- Mechanical parts bin (batches 2 & 3) ----
  "plate.triangle": { id: 1016, label: "Gusset Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -56, y: -52, w: 112, h: 100 }, draw: drawPlateTriangle },
  "bracket.angle": { id: 1017, label: "Angle Bracket", category: "bracket", kind: "bracket", owned: true, showInLibrary: true, bounds: { x: -48, y: -48, w: 96, h: 96 }, draw: drawBracketAngle },
  "plate.diamond": { id: 1018, label: "Diamond Tread Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -58, y: -42, w: 116, h: 84 }, draw: drawPlateDiamond },
  "plate.name": { id: 1019, label: "Name Plate", category: "plate", kind: "plate", owned: true, showInLibrary: true, bounds: { x: -62, y: -26, w: 124, h: 52 }, draw: drawPlateName },
  "gear.sprocket": { id: 1020, label: "Chain Sprocket", category: "gear", kind: "gear", owned: true, showInLibrary: true, bounds: { x: -54, y: -54, w: 108, h: 108 }, draw: drawGearSprocket },
  "gear.ratchet": { id: 1021, label: "Ratchet Wheel", category: "gear", kind: "gear", owned: true, showInLibrary: true, bounds: { x: -56, y: -56, w: 112, h: 112 }, draw: drawGearRatchet },
  "gear.pinion": { id: 1022, label: "Pinion Gear", category: "gear", kind: "gear", owned: true, showInLibrary: true, bounds: { x: -40, y: -40, w: 80, h: 80 }, draw: drawGearPinion },
  "gear.rack": { id: 1023, label: "Gear Rack", category: "gear", kind: "gear", owned: true, showInLibrary: true, bounds: { x: -64, y: -14, w: 128, h: 50 }, draw: drawGearRack },
  "spring.coilTall": { id: 1024, label: "Coil Spring", category: "spring", kind: "spring", owned: true, showInLibrary: true, bounds: { x: -24, y: -60, w: 48, h: 120 }, draw: drawSpringCoilTall },
  "spring.leaf": { id: 1025, label: "Leaf Spring", category: "spring", kind: "spring", owned: true, showInLibrary: true, bounds: { x: -62, y: -6, w: 124, h: 52 }, draw: drawSpringLeaf },
  "spring.torsion": { id: 1026, label: "Torsion Spring", category: "spring", kind: "spring", owned: true, showInLibrary: true, bounds: { x: -52, y: -38, w: 104, h: 78 }, draw: drawSpringTorsion },
  "damper.shock": { id: 1027, label: "Shock Absorber", category: "spring", kind: "spring", owned: true, showInLibrary: true, bounds: { x: -18, y: -62, w: 36, h: 128 }, draw: drawDamperShock },
  "pipe.tee": { id: 1028, label: "Tee Joint", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -62, y: -20, w: 124, h: 56 }, draw: drawPipeTee },
  "pipe.cross": { id: 1029, label: "Cross Joint", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -54, y: -54, w: 108, h: 108 }, draw: drawPipeCross },
  "valve.gate": { id: 1030, label: "Gate Valve", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -48, y: -68, w: 96, h: 106 }, draw: drawValveGate },
  "pipe.flange": { id: 1031, label: "Flanged Pipe", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -52, y: -32, w: 92, h: 64 }, draw: drawPipeFlange },
  "pipe.reducer": { id: 1032, label: "Pipe Reducer", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -52, y: -24, w: 104, h: 48 }, draw: drawPipeReducer },
  "coupling.union": { id: 1033, label: "Union Coupling", category: "pipe", kind: "pipe", owned: true, showInLibrary: true, bounds: { x: -54, y: -28, w: 108, h: 56 }, draw: drawCouplingUnion },
  "car.piston": { id: 1034, label: "Piston", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -28, y: -52, w: 56, h: 114 }, draw: drawCarPiston },
  "car.sparkPlug": { id: 1035, label: "Spark Plug", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -18, y: -56, w: 36, h: 116 }, draw: drawCarSparkPlug },
  "car.muffler": { id: 1036, label: "Muffler", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -64, y: -24, w: 130, h: 48 }, draw: drawCarMuffler },
  "car.headlight": { id: 1037, label: "Headlight", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -42, y: -48, w: 84, h: 96 }, draw: drawCarHeadlight },
  "car.rim": { id: 1038, label: "Wheel Rim", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -52, y: -52, w: 104, h: 104 }, draw: drawCarRim },
  "car.gauge": { id: 1039, label: "Dash Gauge", category: "car", kind: "car", owned: true, showInLibrary: true, bounds: { x: -46, y: -46, w: 92, h: 92 }, draw: drawCarGauge },
  "appliance.knob": { id: 1040, label: "Control Knob", category: "appliance", kind: "appliance", owned: true, showInLibrary: true, bounds: { x: -42, y: -42, w: 84, h: 84 }, draw: drawApplianceKnob },
  "appliance.dial": { id: 1041, label: "Dial", category: "appliance", kind: "appliance", owned: true, showInLibrary: true, bounds: { x: -48, y: -48, w: 96, h: 96 }, draw: drawApplianceDial },
  "appliance.motor": { id: 1042, label: "Electric Motor", category: "appliance", kind: "appliance", owned: true, showInLibrary: true, bounds: { x: -42, y: -32, w: 102, h: 72 }, draw: drawApplianceMotor },
  "appliance.belt": { id: 1043, label: "Drive Belt", category: "appliance", kind: "appliance", owned: true, showInLibrary: true, bounds: { x: -58, y: -24, w: 116, h: 48 }, draw: drawApplianceBelt },
  "appliance.switch": { id: 1044, label: "Rocker Switch", category: "appliance", kind: "appliance", owned: true, showInLibrary: true, bounds: { x: -32, y: -42, w: 64, h: 84 }, draw: drawApplianceSwitch },
  "elec.transistor": { id: 1045, label: "Transistor", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -28, y: -34, w: 56, h: 92 }, draw: drawElecTransistor },
  "elec.led": { id: 1046, label: "LED", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -26, y: -28, w: 52, h: 90 }, draw: drawElecLed },
  "elec.transformer": { id: 1047, label: "Transformer", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -40, y: -42, w: 80, h: 98 }, draw: drawElecTransformer },
  "elec.pcb": { id: 1048, label: "Circuit Board", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -56, y: -40, w: 112, h: 80 }, draw: drawElecPcb },
  "elec.switchToggle": { id: 1049, label: "Toggle Switch", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -26, y: -52, w: 52, h: 112 }, draw: drawElecSwitchToggle },
  "elec.diode": { id: 1050, label: "Diode", category: "electronic", kind: "electronic", owned: true, showInLibrary: true, bounds: { x: -58, y: -16, w: 116, h: 32 }, draw: drawElecDiode },
  // ---- Mechanical parts bin (batch 4) — tools, containers, lamps, connectors, structural ----
  "tool.wrench": { id: 1051, label: "Wrench", category: "tool", kind: "tool", owned: true, showInLibrary: true, bounds: { x: -20, y: -58, w: 40, h: 116 }, draw: drawToolWrench },
  "tool.hammer": { id: 1052, label: "Hammer", category: "tool", kind: "tool", owned: true, showInLibrary: true, bounds: { x: -36, y: -50, w: 82, h: 102 }, draw: drawToolHammer },
  "hook.j": { id: 1053, label: "J-Hook", category: "hardware", kind: "hardware", owned: true, showInLibrary: true, bounds: { x: -30, y: -60, w: 60, h: 100 }, draw: drawHookJ },
  "chain.link": { id: 1054, label: "Chain Link", category: "hardware", kind: "hardware", owned: true, showInLibrary: true, bounds: { x: -26, y: -44, w: 52, h: 88 }, draw: drawChainLink },
  "hinge.barrel": { id: 1055, label: "Barrel Hinge", category: "hardware", kind: "hardware", owned: true, showInLibrary: true, bounds: { x: -50, y: -42, w: 100, h: 84 }, draw: drawHingeBarrel },
  "latch.hook": { id: 1056, label: "Hook Latch", category: "hardware", kind: "hardware", owned: true, showInLibrary: true, bounds: { x: -54, y: -20, w: 104, h: 40 }, draw: drawLatchHook },
  "clamp.c": { id: 1057, label: "C-Clamp", category: "hardware", kind: "hardware", owned: true, showInLibrary: true, bounds: { x: -40, y: -48, w: 92, h: 100 }, draw: drawClampC },
  "tank.canister": { id: 1058, label: "Fuel Canister", category: "tank", kind: "tank", owned: true, showInLibrary: true, bounds: { x: -36, y: -52, w: 72, h: 100 }, draw: drawTankCanister },
  "tank.drum": { id: 1059, label: "Oil Drum", category: "tank", kind: "tank", owned: true, showInLibrary: true, bounds: { x: -36, y: -56, w: 72, h: 106 }, draw: drawTankDrum },
  "tank.cylinder": { id: 1060, label: "Gas Cylinder", category: "tank", kind: "tank", owned: true, showInLibrary: true, bounds: { x: -26, y: -70, w: 52, h: 128 }, draw: drawTankCylinder },
  "bulb.round": { id: 1061, label: "Light Bulb", category: "lamp", kind: "lamp", owned: true, showInLibrary: true, bounds: { x: -36, y: -54, w: 72, h: 120 }, draw: drawBulbRound },
  "bulb.neon": { id: 1062, label: "Neon Lamp", category: "lamp", kind: "lamp", owned: true, showInLibrary: true, bounds: { x: -30, y: -30, w: 60, h: 60 }, draw: drawBulbNeon },
  "bulb.filament": { id: 1063, label: "Tube Lamp", category: "lamp", kind: "lamp", owned: true, showInLibrary: true, bounds: { x: -62, y: -16, w: 124, h: 32 }, draw: drawBulbFilament },
  "plug.ac": { id: 1064, label: "AC Plug", category: "connector", kind: "connector", owned: true, showInLibrary: true, bounds: { x: -32, y: -30, w: 64, h: 90 }, draw: drawPlugAc },
  "jack.socket": { id: 1065, label: "Jack Socket", category: "connector", kind: "connector", owned: true, showInLibrary: true, bounds: { x: -22, y: -40, w: 44, h: 90 }, draw: drawJackSocket },
  "terminal.block": { id: 1066, label: "Terminal Block", category: "connector", kind: "connector", owned: true, showInLibrary: true, bounds: { x: -56, y: -26, w: 112, h: 54 }, draw: drawTerminalBlock },
  "beam.i": { id: 1067, label: "I-Beam", category: "structural", kind: "structural", owned: true, showInLibrary: true, bounds: { x: -42, y: -46, w: 84, h: 92 }, draw: drawBeamI },
  "channel.u": { id: 1068, label: "U-Channel", category: "structural", kind: "structural", owned: true, showInLibrary: true, bounds: { x: -42, y: -42, w: 84, h: 84 }, draw: drawChannelU },
  "grate.mesh": { id: 1069, label: "Mesh Grate", category: "structural", kind: "structural", owned: true, showInLibrary: true, bounds: { x: -52, y: -42, w: 104, h: 84 }, draw: drawGrateMesh },
  // ---- Organic shape primitives (our canvas style, recolourable) — glue for composing shapes ----
  "prim.disc": { id: 1070, label: "Disc", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -50, y: -50, w: 100, h: 100 }, draw: drawPrimDisc },
  "prim.ring": { id: 1071, label: "Ring", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -50, y: -50, w: 100, h: 100 }, draw: drawPrimRing },
  "prim.dome": { id: 1072, label: "Dome", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -54, y: -54, w: 108, h: 98 }, draw: drawPrimDome },
  "prim.teardrop": { id: 1073, label: "Teardrop", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -34, y: -52, w: 68, h: 100 }, draw: drawPrimTeardrop },
  "prim.blob": { id: 1074, label: "Blob", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -52, y: -54, w: 106, h: 108 }, draw: drawPrimBlob },
  "prim.blade": { id: 1075, label: "Blade", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -54, y: -24, w: 120, h: 48 }, draw: drawPrimBlade },
  "prim.oval": { id: 1076, label: "Oval", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -54, y: -34, w: 108, h: 68 }, draw: drawPrimOval },
  "prim.cone": { id: 1077, label: "Cone", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -44, y: -52, w: 88, h: 100 }, draw: drawPrimCone },
  "prim.crescent": { id: 1078, label: "Crescent", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -50, y: -50, w: 100, h: 100 }, draw: drawPrimCrescent },
  "prim.star": { id: 1079, label: "Star", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -50, y: -50, w: 100, h: 100 }, draw: drawPrimStar },
  "prim.arch": { id: 1080, label: "Arch", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -52, y: -24, w: 104, h: 56 }, draw: drawPrimArch },
  "prim.pill": { id: 1081, label: "Pill", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -54, y: -22, w: 108, h: 44 }, draw: drawPrimPill },
  "prim.heart": { id: 1082, label: "Heart", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -48, y: -42, w: 96, h: 88 }, draw: drawPrimHeart },
  "prim.diamond": { id: 1083, label: "Diamond", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -34, y: -50, w: 68, h: 100 }, draw: drawPrimDiamond },
  "prim.petal": { id: 1084, label: "Petal", category: "primitive", kind: "primitive", owned: true, showInLibrary: true, bounds: { x: -30, y: -52, w: 60, h: 104 }, draw: drawPrimPetal },
  "wing.slat": {
    id: 465,
    label: "Checkered Wing Slat",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -142, y: -32, w: 284, h: 64 },
    draw: drawWingSlat
  },
  "wing.feather": {
    id: 461,
    label: "Wing Feather Blade",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -16, y: -98, w: 34, h: 194 },
    draw: drawWingFeather
  },
  "wing.spar": {
    id: 462,
    label: "Wing Spar Arm",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -108, y: -26, w: 212, h: 52 },
    draw: drawWingSpar
  },
  "wing.membrane": {
    id: 463,
    label: "Wing Membrane",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -91, y: -68, w: 184, h: 150 },
    draw: drawWingMembrane
  },
  "wing.covert": {
    id: 464,
    label: "Wing Covert Cluster",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -60, y: -50, w: 150, h: 120 },
    draw: drawWingCovert
  },
  "wing.jet": {
    id: 466,
    label: "Jet Wing Panel",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -152, y: -44, w: 304, h: 74 },
    draw: drawWingJet
  },
  "rocket.thruster": {
    id: 467,
    label: "Rocket Thruster",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -106, y: -36, w: 184, h: 72 },
    draw: drawRocketThruster
  },
  "wing.fin": {
    id: 468,
    label: "Wing Fin / Winglet",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -10, y: -62, w: 42, h: 122 },
    draw: drawWingFin
  },
  "rocket.flame": {
    id: 469,
    label: "Rocket Exhaust",
    category: "wing",
    kind: "wing",
    owned: true,
    showInLibrary: true,
    bounds: { x: -42, y: -32, w: 164, h: 64 },
    draw: drawRocketFlame
  },
  "pet.shell.round": {
    id: 260,
    label: "Pet Round Chassis",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -82, y: -92, w: 164, h: 188 },
    draw: drawPetRoundShell
  },
  "pet.head.shell": {
    id: 261,
    label: "Pet Head Shell",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -68, y: -80, w: 136, h: 152 },
    draw: drawPetHeadShell
  },
  "pet.ear.cat": {
    id: 262,
    label: "Cat Ear Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -46, y: -80, w: 96, h: 148 },
    draw: drawPetCatEar
  },
  "pet.ear.dog": {
    id: 263,
    label: "Dog Ear Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -50, y: -74, w: 100, h: 160 },
    draw: drawPetDogEar
  },
  "pet.muzzle": {
    id: 264,
    label: "Pet Muzzle Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -60, y: -42, w: 120, h: 84 },
    draw: drawPetMuzzlePlate
  },
  "pet.eye.lens": {
    id: 265,
    label: "Pet Eye Lens",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -40, y: -40, w: 80, h: 80 },
    draw: drawPetEyeLens
  },
  "pet.paw": {
    id: 266,
    label: "Pet Paw",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -53, y: -53, w: 106, h: 96 },
    draw: drawPetPaw
  },
  "pet.wing": {
    id: 267,
    label: "Pet Wing Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -46, y: -86, w: 100, h: 176 },
    draw: drawPetWing
  },
  "pet.tail.segment": {
    id: 268,
    label: "Pet Tail Segment",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -70, y: -28, w: 140, h: 56 },
    draw: drawPetTailSegment
  },
  "pet.fin": {
    id: 269,
    label: "Pet Fin Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -64, y: -92, w: 128, h: 160 },
    draw: drawPetFin
  },
  "pet.jaw": {
    id: 270,
    label: "Pet Jaw Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -74, y: -29, w: 148, h: 90 },
    draw: drawPetJaw
  },
  "pet.face.mask": {
    id: 271,
    label: "Pet Face Mask",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -64, y: -82, w: 128, h: 162 },
    draw: drawPetFaceMask
  },
  "pet.tongue": {
    id: 272,
    label: "Pet Tongue Plate",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -29, y: -39, w: 58, h: 92 },
    draw: drawPetTongue
  },
  "pet.belly.plate": {
    id: 273,
    label: "Pet Belly Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -69, y: -85, w: 138, h: 180 },
    draw: drawPetBellyPlate
  },
  "pet.beak": {
    id: 274,
    label: "Layered Pet Beak",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -53, y: -47, w: 106, h: 80 },
    draw: drawPetBeak
  },
  "pet.nose": {
    id: 275,
    label: "Pet Nose Plate",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -42, y: -41, w: 84, h: 80 },
    draw: drawPetNose
  },
  "pet.haunch": {
    id: 276,
    label: "Pet Haunch Plate",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -62, y: -87, w: 122, h: 164 },
    draw: drawPetHaunchPlate
  },
  "pet.penguin.head": {
    id: 277,
    label: "Penguin Dome Head",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -74, y: -75, w: 148, h: 150 },
    draw: drawPetPenguinHead
  },
  "pet.penguin.flipper": {
    id: 278,
    label: "Penguin Blade Flipper",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -44, y: -22, w: 88, h: 136 },
    draw: drawPetPenguinFlipper
  },
  "pet.penguin.face": {
    id: 279,
    label: "Penguin Face Bib",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -61, y: -69, w: 122, h: 130 },
    draw: drawPetPenguinFacePlate
  },
  "pet.penguin.bib": {
    id: 280,
    label: "Penguin Continuous Bib",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -68, y: -88, w: 136, h: 203 },
    draw: drawPetPenguinBib
  },
  "pet.penguin.nose": {
    id: 281,
    label: "Penguin Nose Plate",
    category: "pet",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -39, y: -21, w: 78, h: 41 },
    draw: drawPetPenguinNose
  },
  "pet.shark.body": {
    id: 282,
    label: "Shark Tapered Body",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -95, y: -48, w: 182, h: 96 },
    draw: drawPetSharkBody
  },
  "pet.shark.dorsal": {
    id: 283,
    label: "Shark Dorsal Fin",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -52, y: -71, w: 106, h: 108 },
    draw: drawPetSharkDorsal
  },
  "pet.shark.pectoral": {
    id: 284,
    label: "Shark Pectoral Fin",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -46, y: -19, w: 102, h: 58 },
    draw: drawPetSharkPectoral
  },
  "pet.shark.tail": {
    id: 285,
    label: "Shark Crescent Tail",
    category: "pet",
    kind: "pet",
    owned: true,
    showInLibrary: false,
    bounds: { x: -19, y: -63, w: 78, h: 126 },
    draw: drawPetSharkTail
  },
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
  "golden.dome": {
    id: 180,
    label: "Domed Shell",
    category: "premium",
    kind: "shell",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -96, y: -74, w: 192, h: 130 },
    draw: drawGoldenDome
  },
  "golden.spike": {
    id: 181,
    label: "Forged Spike",
    category: "premium",
    kind: "micro",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -22, y: -62, w: 44, h: 122 },
    draw: drawGoldenSpike
  },
  "golden.heart": {
    id: 183,
    label: "Heart Shell",
    category: "premium",
    kind: "shell",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -130, y: -150, w: 260, h: 262 },
    draw: drawGoldenHeart
  },
  "golden.armorPlate": {
    id: 184,
    label: "Armour Plate",
    category: "premium",
    kind: "panel",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -80, y: -50, w: 160, h: 100 },
    draw: drawGoldenArmorPlate
  },
  "golden.bat": {
    id: 185,
    label: "Bat Shell",
    category: "premium",
    kind: "shell",
    premium: true,
    owned: false,
    canDuplicate: true,
    showInLibrary: false,
    bounds: { x: -156, y: -84, w: 312, h: 146 },
    draw: drawGoldenBat
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
  "golden.steam.helm.shell": {
    id: 9201,
    label: "Golden Steam Helm Shell",
    category: "golden",
    kind: "headwear",
    owned: true,
    showInLibrary: false,
    bounds: { x: -138, y: -116, w: 276, h: 202 },
    draw: drawGoldenSteamHelmShell
  },
  "golden.aviator.goggles": {
    id: 9206,
    label: "Golden Aviator Goggles",
    category: "golden",
    kind: "face",
    owned: true,
    showInLibrary: false,
    bounds: { x: -122, y: -56, w: 244, h: 104 },
    draw: drawGoldenAviatorGoggles
  },
  "golden.sunforge.sombrero": {
    id: 9207,
    label: "Golden Sunforge Sombrero",
    category: "golden",
    kind: "headwear",
    owned: true,
    showInLibrary: false,
    bounds: { x: -136, y: -86, w: 272, h: 154 },
    draw: drawGoldenSunforgeSombrero
  },
  "golden.pocket.watch": {
    id: 9208,
    label: "Golden Pocket Watch",
    category: "golden",
    kind: "neck",
    owned: true,
    showInLibrary: false,
    bounds: { x: -84, y: -116, w: 168, h: 224 },
    draw: drawGoldenPocketWatch
  },
  "golden.mechanical.skull": {
    id: 9209,
    label: "Golden Mechanical Skull",
    category: "golden",
    kind: "sticker",
    owned: true,
    showInLibrary: false,
    bounds: { x: -100, y: -122, w: 200, h: 224 },
    draw: drawGoldenMechanicalSkull
  },
  "golden.steam.helm.spike": {
    id: 9205,
    label: "Golden Steam Helm Spike",
    category: "golden",
    kind: "headwear",
    owned: true,
    showInLibrary: false,
    bounds: { x: -30, y: -102, w: 60, h: 136 },
    draw: drawGoldenSteamHelmSpike
  },
  "golden.rider.jacket.left": {
    id: 9202,
    label: "Golden Rider Jacket Left",
    category: "golden",
    kind: "bodyWear",
    owned: true,
    showInLibrary: false,
    bounds: { x: -220, y: -120, w: 196, h: 274 },
    draw: drawGoldenRiderJacketLeft
  },
  "golden.rider.jacket.right": {
    id: 9204,
    label: "Golden Rider Jacket Right",
    category: "golden",
    kind: "bodyWear",
    owned: true,
    showInLibrary: false,
    bounds: { x: 24, y: -120, w: 196, h: 274 },
    draw: drawGoldenRiderJacketRight
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
    // ddg.* keys are composites assembled from other real parts (each sub-part already carries its own
    // finish/edge) — skip the wrapper-level material finish, silhouette edge + shade so no phantom box
    // is stroked around the whole assembly.
    const isComposite = String(localPart.key || "").startsWith("ddg.");
    applyMaterialFinish(effectCtx, localPart, drawState);
    if (!isComposite) {
      if (shadeStyle !== "cleanLine" && drawState.fastStill !== true) drawOuterPencilEdge(effectCtx, localPart);
      applyShadeFinish(effectCtx, localPart, shadeStyle, drawState);
      applySpecialSkinFinish(effectCtx, localPart, drawState);
    }
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
