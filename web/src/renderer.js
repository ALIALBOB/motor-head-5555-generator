import { drawPart, getPart, getPartRadius, getVisualConnectors, partBounds } from "./parts.js";
import { LIQUID_ACCENTS, LIQUID_GLOWS, LIQUID_PALETTE } from "./schema.js";

const BASE_BLUEPRINT_URL = "/concepts/base-mechanical-canvas-blueprint.png";
let baseBlueprintImage;

const CANVAS_LOOKS = {
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

function buildMouseLook(width, height, chainState = {}, options = {}) {
  const source = options.mouseLook || chainState.mouseLook || {};
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

function applyMouseLean(ctx, width, height, mouseLook, look) {
  if (!mouseLook?.active || !mouseLook.strength) return;
  const x = mouseLook.leanX || 0;
  const y = mouseLook.leanY || 0;
  const pivotX = width * 0.5;
  const pivotY = height * (look?.pfp ? 0.78 : 0.72);
  ctx.translate(pivotX + x * 7.5, pivotY + y * 4.2);
  ctx.rotate(x * 0.018);
  ctx.transform(1, -y * 0.006, -x * 0.005, 1, 0, 0);
  ctx.translate(-pivotX, -pivotY);
}

let marketplaceBaseCache = null;
let dragFrameCache = null;

function createLayerCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function isMarketplaceDynamicPart(part, def) {
  const key = String(part?.key || "");
  if (key.startsWith("counter.") || key === "pack.gas.reader") return true;
  if (part?.liveGasMeter || part?.role === "chain" || part?.traitLayer === "chain") return true;
  if (part?.expression || key.startsWith("face.") || String(part?.facePart || "")) return true;
  return part?.motion !== false
    && part?.static !== true
    && !def?.noExternalRotate
    && (def?.kind === "gear" || def?.kind === "wheel");
}

function marketplaceBaseCacheKey(layout, chainState, width, height) {
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
    pressureLevel(chainState),
    Math.round(Number(chainState?.gasPressure ?? chainState?.baseFeeGwei ?? 0) || 0),
    Number(chainState?.saleCount || 0),
    Number(chainState?.transferCount || 0)
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

  const canvas = createLayerCanvas(box.w, box.h);
  const layerCtx = canvas.getContext("2d");
  layerCtx.clearRect(0, 0, box.w, box.h);
  layerCtx.save();
  layerCtx.translate(-box.x, -box.y);
  for (const part of parts) {
    drawPart(layerCtx, { ...part }, staticState);
  }
  layerCtx.restore();
  return { canvas, x: box.x, y: box.y };
}

function pushMarketplaceStaticStep(steps, parts, width, height, staticState) {
  const layer = createStaticSegmentLayer(width, height, parts, staticState);
  if (layer) steps.push({ type: "static", layer });
}

function getMarketplaceRenderCache(width, height, layout, chainState, look, placements, liquidState, specialMaterialSkin) {
  const key = marketplaceBaseCacheKey(layout, chainState, width, height);
  if (marketplaceBaseCache?.key === key && marketplaceBaseCache.background && marketplaceBaseCache.steps) return marketplaceBaseCache;

  const background = createLayerCanvas(width, height);
  const backgroundCtx = background.getContext("2d");
  backgroundCtx.clearRect(0, 0, width, height);
  drawBackground(backgroundCtx, width, height, layout, chainState, 0, look);

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

function dragFrameCacheKey(layout, chainState, width, height, placements, selectedId) {
  const skin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || {};
  const staticSignature = placements
    .filter((part) => part.id !== selectedId)
    .map((part) => [
      part.id,
      Math.round(Number(part.x || 0) * 10),
      Math.round(Number(part.y || 0) * 10),
      Math.round(Number(part.rotation || 0) * 1000),
      Math.round(Number(part.scaleX || 1) * 100),
      Math.round(Number(part.scaleY || part.scaleX || 1) * 100)
    ].join(","))
    .join(";");
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
    pressureLevel(chainState),
    Math.round(Number(chainState?.gasPressure ?? chainState?.baseFeeGwei ?? 0) || 0),
    Number(chainState?.saleCount || 0),
    Number(chainState?.transferCount || 0),
    staticSignature
  ].join("|");
}

function getDragFrameLayer(width, height, layout, chainState, look, placements, liquidState, specialMaterialSkin, selectedId) {
  const key = dragFrameCacheKey(layout, chainState, width, height, placements, selectedId);
  if (dragFrameCache?.key === key && dragFrameCache.canvas) return dragFrameCache.canvas;

  const canvas = createLayerCanvas(width, height);
  const layerCtx = canvas.getContext("2d");
  layerCtx.clearRect(0, 0, width, height);
  drawBackground(layerCtx, width, height, layout, chainState, 0, look);

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

  dragFrameCache = { key, canvas };
  return canvas;
}

function applyMarketplaceBodyBounce(ctx, width, height, time, chainState, look) {
  const pressure = pressureLevel(chainState);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState.heartbeatPulse || 0)));
  const pressureBoost = pressure === "extreme" ? 1.24 : pressure === "high" ? 1.12 : pressure === "medium" ? 1.04 : 0.96;
  const bondSeconds = holderBondSeconds(chainState);
  const bondStability = bondSeconds >= 365 * 86400 ? 0.58 : bondSeconds >= 90 * 86400 ? 0.72 : bondSeconds >= 7 * 86400 ? 0.86 : 1;
  const amp = pressureBoost * bondStability * (look?.pfp ? 1.18 : 1.06);
  const x = Math.sin(time * 0.74) * 0.78 * amp;
  const y = Math.sin(time * 1.54) * 2.65 * amp - heartbeat * 1.05;
  const rotation = Math.sin(time * 0.86) * 0.0032 * amp + heartbeat * 0.0018;
  const pivotX = width * 0.5;
  const pivotY = height * (look?.pfp ? 0.74 : 0.7);
  ctx.translate(pivotX + x, pivotY + y);
  ctx.rotate(rotation);
  ctx.translate(-pivotX, -pivotY);
}

export function drawMachine(ctx, layout, chainState = {}, options = {}) {
  const width = layout?.canvas?.width || 1600;
  const height = layout?.canvas?.height || 1100;
  const suppliedMotionTime = Number(options.motionTime);
  const time = options.previewMotion === false
    ? 0
    : Number.isFinite(suppliedMotionTime)
      ? suppliedMotionTime
      : performance.now() / 1000;
  const performanceMode = options.performanceMode || "normal";
  const dragFastPath = performanceMode === "drag";
  const marketplaceFastPath = performanceMode === "marketplace";
  blinkPhaseOffset = (Math.abs(Number(layout?.tokenId) || 1) * 1.371) % 3.25; // desync blink per token

  if (ctx.canvas.width !== width) ctx.canvas.width = width;
  if (ctx.canvas.height !== height) ctx.canvas.height = height;

  const look = canvasLook(layout);
  const mouseLook = buildMouseLook(width, height, chainState, options);
  const specialMaterialSkin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || null;
  const liquidState = buildLiquidState(layout, chainState, time, options.previewMotion !== false);
  const liveMotion = buildLiveMotionState(chainState);
  const placements = [...(layout?.placements || [])].sort((a, b) => (a.z ?? a.zIndex ?? 0) - (b.z ?? b.zIndex ?? 0));
  const connections = options.connections || layout?.connections || [];
  const editMode = options.editMode !== false;
  const useMarketplaceStaticCache = marketplaceFastPath && options.previewMotion !== false && editMode === false && !options.selected;
  const useDragStaticCache = dragFastPath && editMode === false && Boolean(options.selected);
  const selectedId = options.selected?.id;
  let marketplaceRenderCache = null;

  ctx.clearRect(0, 0, width, height);
  if (useMarketplaceStaticCache) {
    marketplaceRenderCache = getMarketplaceRenderCache(width, height, layout, chainState, look, placements, liquidState, specialMaterialSkin);
    ctx.drawImage(marketplaceRenderCache.background, 0, 0);
  } else if (useDragStaticCache) {
    const dragLayer = getDragFrameLayer(width, height, layout, chainState, look, placements, liquidState, specialMaterialSkin, selectedId);
    ctx.drawImage(dragLayer, 0, 0);
  } else {
    drawBackground(ctx, width, height, layout, chainState, time, look);
  }

  const machineLean = mouseLook.active
    && !useDragStaticCache
    && options.previewMotion !== false
    && options.mouseLean !== false
    && (!editMode || options.mouseLeanInEdit === true);
  const marketplaceBodyBounce = useMarketplaceStaticCache && options.marketplaceBounce !== false;
  const lifeMotion = buildLifeMotion(layout, chainState, time, {
    enabled: options.previewMotion !== false && !marketplaceFastPath && options.lifeMotion !== false && (!editMode || options.lifeMotionInEdit === true),
    pfp: Boolean(look.pfp)
  });

  if (machineLean || marketplaceBodyBounce) {
    ctx.save();
    if (machineLean) applyMouseLean(ctx, width, height, mouseLook, look);
    if (marketplaceBodyBounce) applyMarketplaceBodyBounce(ctx, width, height, time, chainState, look);
  }

  if (editMode) {
    drawConnectionGuides(ctx, placements, connections, time, options.previewMotion !== false, liquidState, look);
  }

  const rotationMap = buildRotationMap(placements, connections);
  const drawAnimatedPart = (original) => {
    const part = { ...original };
    const def = getPart(part.key);
    const partCanMove = original.motion !== false && original.static !== true;
    const isExpressionLayer = part.role === "expression"
      || part.expression === true
      || part.material === "pfpFace"
      || def?.kind === "face"
      || String(part.key || "").startsWith("face.");
    applyLifeMotion(part, lifeMotion, def);
    if (marketplaceFastPath && options.previewMotion !== false && isExpressionLayer) {
      applyBlinkMotion(part, { blink: blinkAmount(time) });
    }
    if (mouseLook.active && part.facePart && String(part.facePart).includes("EyePupil")) {
      part.x += mouseLook.eyeX * 0.82;
      part.y += mouseLook.eyeY * 0.68;
    }
    if (options.previewMotion !== false && partCanMove && !def?.noExternalRotate && (def?.kind === "gear" || def?.kind === "wheel")) {
      const defaultSpeed = def.kind === "wheel" ? 0.42 : 0.3;
      const speed = part.spinSpeed != null ? part.spinSpeed : (rotationMap.get(part.id) || defaultSpeed);
      part.rotation = (part.rotation || 0) + time * speed * liveMotion.speedMultiplier;
    }
    drawPart(ctx, part, {
      ...liquidState,
      mouseLook,
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
        ctx.drawImage(step.layer.canvas, step.layer.x, step.layer.y);
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
    drawSpecialMaterialAtmosphere(ctx, width, height, layout, chainState, time, look, specialMaterialSkin);
  }
  if (!dragFastPath && !marketplaceFastPath) {
    drawLiveChainEffects(ctx, width, height, layout, placements, chainState, time, look);
  }
  if (!dragFastPath && !marketplaceFastPath) {
    drawHistoryEvolution(ctx, width, height, layout, placements, chainState, time, look);
  }

  if (machineLean || marketplaceBodyBounce) ctx.restore();

  if (editMode && options.selected) {
    const selected = { ...options.selected };
    applyLifeMotion(selected, lifeMotion, getPart(selected.key));
    drawSelection(ctx, selected, look);
  }

}

function pressureLevel(chainState = {}) {
  const raw = Number(chainState.gasPressure ?? chainState.baseFeeGwei ?? chainState.baseFee ?? 0);
  if (!Number.isFinite(raw)) return "low";
  if (raw >= 140) return "extreme";
  if (raw >= 60) return "high";
  if (raw >= 20) return "medium";
  return "low";
}

function secondsFromState(chainState = {}, secondsKey, daysKey) {
  const seconds = Number(chainState[secondsKey]);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;
  const days = Number(chainState[daysKey]);
  if (Number.isFinite(days) && days > 0) return days * 86400;
  return 0;
}

function archiveAgeSeconds(chainState = {}) {
  return secondsFromState(chainState, "archiveAgeSeconds", "ageDays")
    || secondsFromState(chainState, "ageSeconds", "age");
}

function holderBondSeconds(chainState = {}) {
  return secondsFromState(chainState, "holderBondSeconds", "holderBondDays")
    || secondsFromState(chainState, "bondSeconds", "bondDays");
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
    try { return BigInt(text); } catch (_) { return 0n; }
  }
  if (/^\d+$/.test(text) && text.length > 15) return BigInt(text);
  if (!/^\d+(\.\d+)?(eth)?$/.test(text)) return 0n;
  const [whole, fraction = ""] = text.replace(/eth$/, "").split(".");
  return BigInt(whole || "0") * 1000000000000000000n + BigInt(fraction.padEnd(18, "0").slice(0, 18) || "0");
}

function saleTierRank(chainState = {}) {
  const label = String(chainState.saleTier || chainState.sale || "").toLowerCase();
  if (label.includes("mythic") || label === "10" || label === "10eth") return 5;
  if (label.includes("legendary") || label === "7" || label === "7eth") return 4;
  if (label.includes("royal") || label === "5" || label === "5eth") return 3;
  if (label.includes("gold") || label === "2" || label === "2eth") return 2;
  if (label.includes("silver") || label === "1" || label === "1eth") return 1;
  const wei = parseSaleWei(chainState.highestVerifiedSaleWei ?? chainState.highestSaleWei ?? chainState.saleWei);
  if (wei >= 10000000000000000000n) return 5;
  if (wei >= 7000000000000000000n) return 4;
  if (wei >= 5000000000000000000n) return 3;
  if (wei >= 2000000000000000000n) return 2;
  if (wei >= 1000000000000000000n) return 1;
  return 0;
}

function buildLiveMotionState(chainState = {}) {
  const pressure = pressureLevel(chainState);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState.heartbeatPulse || 0)));
  const pressureBoost = pressure === "extreme" ? 2.05 : pressure === "high" ? 1.55 : pressure === "medium" ? 1.22 : 1;
  return {
    pressure,
    heartbeat,
    speedMultiplier: pressureBoost + heartbeat * 0.12
  };
}

function buildLifeMotion(layout, chainState, time, options = {}) {
  if (!options.enabled) return { enabled: false };

  const pressure = pressureLevel(chainState);
  const pressureBoost = pressure === "extreme" ? 2.15 : pressure === "high" ? 1.55 : pressure === "medium" ? 1.12 : 0.92;
  const heartbeat = Math.max(0, Math.min(1, Number(chainState.heartbeatPulse || 0)));
  const bondSeconds = holderBondSeconds(chainState);
  const bondStability = bondSeconds >= 365 * 86400 ? 0.5 : bondSeconds >= 90 * 86400 ? 0.68 : bondSeconds >= 7 * 86400 ? 0.84 : 1;
  const transferShake = Math.min(0.55, Number(chainState.transferCount || 0) * 0.035);
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
    faceRotation: Math.sin((time - 0.62) * 1.28) * 0.006 * pressureBoost * bondStability + heartbeat * 0.004,
    faceScale: 1 + Math.sin((time - 0.34) * 2.1) * 0.007 * pressureBoost * bondStability + heartbeat * 0.01,
    facePulse: 0.5 + Math.sin((time - 0.26) * 2.8) * 0.5,
    blink: blinkAmount(time),
    jitter: (0.18 + transferShake + heartbeat * 0.18) * pressureBoost * bondStability,
    rotation: 0.0025 * pressureBoost * bondStability,
    corePulse: Math.min(1, 0.5 + Math.sin(time * 2.2) * 0.5 + heartbeat * 0.42)
  };
}

// Per-token blink phase offset (set by drawMachine each render) so the whole collection doesn't blink
// in unison — each MotorHead blinks on its own clock.
let blinkPhaseOffset = 0;
function blinkAmount(time) {
  const cycle = 3.25;
  const phase = (time + 0.42 + blinkPhaseOffset) % cycle;
  if (phase > 0.42) return 0;
  if (phase < 0.1) return phase / 0.1;
  if (phase < 0.24) return 1;
  return 1 - (phase - 0.24) / 0.18;
}

function partNoise(id, time, salt) {
  return Math.sin((Number(id || 1) * 12.9898 + salt) + time * (1.7 + (Number(id || 1) % 5) * 0.11));
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
  const isExpressionLayer = part.role === "expression"
    || part.expression === true
    || part.material === "pfpFace"
    || (def?.kind === "face" && z >= 55);
  const isBackLayer = part.role === "backAccessory"
    || part.traitLayer === "backAccessory"
    || def?.kind === "pack";
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

function drawBackground(ctx, width, height, layout, chainState, time, look) {
  ctx.save();
  ctx.fillStyle = look.paper;
  ctx.fillRect(0, 0, width, height);

  if (look.pfp) {
    ctx.fillStyle = layout?.canvas?.backgroundColor || look.paper;
    ctx.fillRect(0, 0, width, height);
    drawPfpSpecialBackdrop(ctx, width, height, layout, time);
    ctx.restore();
    return;
  }

  if (look.glow !== "rgba(255,255,255,0)") {
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.25, 0, width * 0.5, height * 0.25, width * 0.82);
    glow.addColorStop(0, look.glow);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  const image = getBaseBlueprintImage();
  if (image) {
    ctx.globalAlpha = look.imageAlpha;
    ctx.drawImage(image, 0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = look.grid;
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 60; y < height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = look.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = look.borderSoft;
  ctx.strokeRect(54, 54, width - 108, height - 108);
  ctx.setLineDash([]);

  drawBlueprintCross(ctx, width / 2, height / 2, 74, look);
  drawBlueprintCross(ctx, width * 0.62, height * 0.36, 42, look);
  drawBlueprintCross(ctx, width * 0.36, height * 0.58, 38, look);

  ctx.font = "18px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = look.text;
  ctx.fillText(`MECHANICAL CANVAS // TOKEN ${String(layout?.tokenId || 1).padStart(4, "0")}`, 48, 62);
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = look.textSoft;
  ctx.fillText(`parts:${layout?.placements?.length || 0}  transfers:${chainState.transferCount || 0}  wind:${chainState.windCount || 0}`, 48, height - 42);

  ctx.restore();
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

function drawPfpSpecialBackdrop(ctx, width, height, layout, time) {
  const backdrop = layout?.canvas?.specialBackdrop || defaultPfpBackdrop(layout);
  const skin = layout?.special?.materialSkin || layout?.canvas?.materialSkin || null;

  const seed = hashSeed(`${layout?.special?.id || layout?.name || "special"}:${backdrop.mode || "aura"}`);
  const accent = backdrop.accent || skin?.accent || "#6fffe2";
  const secondary = backdrop.secondary || skin?.secondary || "#d7a13a";
  const intensity = Math.max(0.25, Math.min(1.4, Number(backdrop.intensity || 0.8)));
  const pulse = 0.5 + Math.sin(time * (backdrop.pulseSpeed || 1.2)) * 0.5;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  const aura = ctx.createRadialGradient(width * 0.54, height * 0.43, 0, width * 0.54, height * 0.43, width * 0.72);
  aura.addColorStop(0, colorAlpha(accent, 0.16 * intensity + pulse * 0.03));
  aura.addColorStop(0.46, colorAlpha(secondary, 0.08 * intensity));
  aura.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = colorAlpha("#ffffff", 0.08 * intensity);
  for (let i = 0; i < 46; i += 1) {
    const x = seededUnit(seed, i + 120) * width;
    const y = seededUnit(seed, i + 220) * height;
    const r = 0.8 + seededUnit(seed, i + 320) * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMaterialSkinBackdropMotifs(ctx, width, height, seed, skin, intensity, pulse);
  ctx.restore();
}

function drawMaterialSkinBackdropMotifs(ctx, width, height, seed, skin, intensity, pulse) {
  if (!skin) return;
  const surface = String(skin.surface || "").toLowerCase();
  const accent = skin.accent || "#6fffe2";
  const edge = skin.edge || accent;
  const primary = skin.primary || "#111111";

  if (["void", "cosmic"].includes(surface)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorAlpha("#ffffff", 0.22 * intensity);
    for (let i = 0; i < 70; i += 1) {
      const x = seededUnit(seed, i + 500) * width;
      const y = seededUnit(seed, i + 600) * height;
      const r = 0.6 + seededUnit(seed, i + 700) * (surface === "cosmic" ? 2.1 : 1.4);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (["steam", "fog"].includes(surface)) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 12; i += 1) {
      const x = seededUnit(seed, i + 710) * width;
      const y = seededUnit(seed, i + 810) * height;
      const r = 46 + seededUnit(seed, i + 910) * 94;
      const fog = ctx.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, colorAlpha(edge, 0.08 + pulse * 0.03));
      fog.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  } else if (surface === "royalgold") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(edge, 0.055 + pulse * 0.025);
    ctx.lineWidth = 0.85;
    for (let i = 0; i < 8; i += 1) {
      const x = seededUnit(seed, i + 840) * width;
      const y = seededUnit(seed, i + 940) * height;
      const len = 10 + seededUnit(seed, i + 1040) * 22;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y - len * (0.12 + seededUnit(seed, i + 1140) * 0.16));
      ctx.stroke();
    }
    ctx.fillStyle = colorAlpha("#fff2a6", 0.14 * intensity);
    for (let i = 0; i < 54; i += 1) {
      const x = seededUnit(seed, i + 1240) * width;
      const y = seededUnit(seed, i + 1340) * height;
      const r = 0.8 + seededUnit(seed, i + 1440) * 2.6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (["molten", "volcanic", "electric", "sludge"].includes(surface)) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = colorAlpha(accent, 0.12 + pulse * 0.08);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 16; i += 1) {
      const x = seededUnit(seed, i + 930) * width;
      const y = seededUnit(seed, i + 1030) * height;
      const len = 22 + seededUnit(seed, i + 1130) * 68;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (seededUnit(seed, i + 1230) - 0.5) * len, y + (seededUnit(seed, i + 1330) - 0.5) * len);
      ctx.stroke();
    }
    ctx.restore();
  } else if (["paper", "blueprint"].includes(surface)) {
    ctx.save();
    ctx.strokeStyle = colorAlpha(surface === "blueprint" ? accent : primary, 0.06);
    ctx.lineWidth = 1;
    for (let y = 80; y < height; y += 42) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(width - 40, y + Math.sin(y * 0.1) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSpecialMaterialAtmosphere(ctx, width, height, layout, chainState, time, look, skin) {
  if (!skin || !look.pfp) return;
  const placements = layout?.placements || [];
  const body = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 8 && z <= 84 && part.assembly !== false;
  }) || { cx: width * 0.5, cy: height * 0.68, w: width * 0.52, h: height * 0.48 };
  const surface = String(skin.surface || "").toLowerCase();
  const seed = hashSeed(`${layout?.special?.id || layout?.name || "skin"}:${skin.id || skin.label}`);
  const pulse = 0.5 + Math.sin(time * 1.6 + seed * 0.001) * 0.5;
  const accent = skin.accent || "#6fffe2";
  const edge = skin.edge || accent;
  const glow = skin.glow || colorAlpha(edge, 0.42);

  ctx.save();
  if (["void", "cosmic", "electric", "sludge", "molten", "volcanic", "royalgold"].includes(surface)) {
    const aura = ctx.createRadialGradient(body.cx, body.cy, 0, body.cx, body.cy, Math.max(body.w, body.h) * 0.72);
    aura.addColorStop(0, colorAlpha(edge, surface === "royalgold" ? 0.09 + pulse * 0.04 : 0.05 + pulse * 0.03));
    aura.addColorStop(0.52, colorAlpha(accent, surface === "royalgold" ? 0.07 : 0.045));
    aura.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = aura;
    ctx.fillRect(body.cx - body.w, body.cy - body.h, body.w * 2, body.h * 2);
  }

  if (surface === "royalgold") {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorAlpha("#fff2a6", 0.16 + pulse * 0.05);
    for (let i = 0; i < 28; i += 1) {
      const x = body.cx - body.w * 0.55 + seededUnit(seed, i + 730) * body.w * 1.1;
      const y = body.cy - body.h * 0.62 + seededUnit(seed, i + 830) * body.h * 1.12;
      const r = 1.2 + seededUnit(seed, i + 930) * 3.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (["liquid", "chrome", "resin", "organic", "sludge", "molten", "blackMatter"].includes(surface) || ["blackMatter", "mercuryChrome", "moltenGold"].includes(skin.id)) {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = colorAlpha(edge, 0.12 + pulse * 0.08);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    for (let i = 0; i < 12; i += 1) {
      const x = body.cx - body.w * 0.48 + seededUnit(seed, i + 5) * body.w * 0.96;
      const y = body.cy - body.h * 0.42 + seededUnit(seed, i + 15) * body.h * 0.88;
      const r = 2 + seededUnit(seed, i + 25) * 6;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (1.1 + seededUnit(seed, i + 35) * 0.9), seededUnit(seed, i + 45) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (["steam", "fog", "void"].includes(surface)) {
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 7; i += 1) {
      const x = body.cx - body.w * 0.55 + seededUnit(seed, i + 105) * body.w * 1.1;
      const y = body.cy - body.h * 0.6 + seededUnit(seed, i + 205) * body.h * 1.12;
      const r = 38 + seededUnit(seed, i + 305) * 72;
      const fog = ctx.createRadialGradient(x, y, 0, x, y, r);
      fog.addColorStop(0, colorAlpha(surface === "void" ? edge : "#ffffff", surface === "void" ? 0.06 : 0.08));
      fog.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  ctx.restore();
}

function defaultPfpBackdrop(layout) {
  const seed = hashSeed(`${layout?.tokenId || 1}:${layout?.traits?.head || ""}:${layout?.traits?.clothes || ""}`);
  const modes = ["signal", "liquid", "time", "relic", "radio", "vault"];
  const mode = modes[seed % modes.length];
  const base = layout?.canvas?.backgroundColor || "#12d8ba";
  const accents = ["#73ffe1", "#d7a13a", "#aefcff", "#b78cff", "#fff0a4", "#ffb27a"];
  return {
    mode,
    accent: accents[(seed >>> 3) % accents.length],
    secondary: base,
    intensity: 0.34,
    pulseSpeed: 0.72 + (seed % 5) * 0.06
  };
}

function drawBlueprintCross(ctx, x, y, size, look) {
  ctx.save();
  ctx.strokeStyle = look.borderSoft;
  ctx.lineWidth = 1;
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function buildLiquidState(layout, chainState, time, previewMotion) {
  const colorIndex = Number(chainState.liquidColor ?? layout?.liquid?.colorIndex ?? 1);
  const baseFill = Number(chainState.fillLevel ?? layout?.liquid?.fillLevel ?? 72);
  const lastChanged = Number(chainState.liquidLastChangedAt || Date.now() / 1000);
  const days = Math.max(0, (Date.now() / 1000 - lastChanged) / 86400);
  const leakPenalty = chainState.leaking ? days * 2.2 : days * 0.25;

  return {
    colorIndex,
    fillLevel: Math.max(0, Math.min(100, baseFill - leakPenalty)),
    liquidColor: LIQUID_PALETTE[colorIndex % LIQUID_PALETTE.length],
    liquidAccent: LIQUID_ACCENTS[colorIndex % LIQUID_ACCENTS.length],
    liquidGlow: LIQUID_GLOWS[colorIndex % LIQUID_GLOWS.length],
    texture: chainState.liquidTexture ?? layout?.liquid?.texture ?? "Bubbly",
    tokenId: layout?.tokenId,
    canvasMode: layout?.canvas?.mode || "whiteBlueprint",
    shadeStyle: layout?.canvas?.shadeStyle || layout?.defaults?.shadeStyle || "pencilSketch",
    time,
    previewMotion,
    gasPressure: chainState.gasPressure ?? chainState.baseFeeGwei ?? chainState.baseFee ?? 0,
    baseFeeGwei: chainState.baseFeeGwei,
    blockNumber: chainState.blockNumber,
    heartbeatPulse: chainState.heartbeatPulse,
    pressureLevel: pressureLevel(chainState),
    archiveAgeSeconds: archiveAgeSeconds(chainState),
    holderBondSeconds: holderBondSeconds(chainState),
    transferCount: Number(chainState.transferCount ?? chainState.transfers ?? 0),
    transfers: Number(chainState.transferCount ?? chainState.transfers ?? 0),
    saleCount: Number(chainState.saleCount ?? chainState.sellCount ?? chainState.sales ?? chainState.saleTransfers ?? chainState.soldTransfers ?? 0),
    saleTier: chainState.saleTier,
    highestVerifiedSaleWei: chainState.highestVerifiedSaleWei ?? chainState.highestSaleWei ?? chainState.saleWei,
    scarScreenColor: chainState.scarScreenColor ?? chainState.scarColor,
    unlockFlags: chainState.unlockFlags,
    globalPhase: chainState.globalPhase,
    mood: chainState.mood
  };
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

function buildRotationMap(placements, connections) {
  const map = new Map();
  for (const part of placements) {
    const def = getPart(part.key);
    if (def?.kind === "gear" || def?.kind === "wheel" || def?.kind === "bevel") {
      map.set(part.id, def.kind === "wheel" ? 0.36 : (part.id % 2 ? 0.42 : -0.42));
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

function drawConnectionGuides(ctx, placements, connections, time, previewMotion, liquidState, look) {
  ctx.save();
  ctx.lineCap = "round";
  for (const conn of connections) {
    const a = placements.find((p) => p.id === conn.from);
    const b = placements.find((p) => p.id === conn.to);
    if (!a || !b) continue;

    if (conn.type === "belt") {
      drawBelt(ctx, a, b, time, previewMotion, conn.active, look);
    } else if (conn.type === "gearMesh") {
      drawGearMesh(ctx, a, b, conn.active, look);
    } else if (conn.type === "pipe") {
      drawPipeLink(ctx, conn.a, conn.b, time, previewMotion, conn.active, liquidState, look);
    }
  }
  ctx.restore();
}

function drawGearMesh(ctx, a, b, active, look) {
  ctx.save();
  ctx.strokeStyle = active ? look.guide : look.guideWeak;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  drawNode(ctx, a.x, a.y, active, look);
  drawNode(ctx, b.x, b.y, active, look);
  ctx.restore();
}

function drawBelt(ctx, a, b, time, previewMotion, active, look) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const offsetX = Math.sin(angle) * 10;
  const offsetY = -Math.cos(angle) * 10;

  ctx.save();
  ctx.strokeStyle = active ? look.textSoft : look.guideWeak;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = previewMotion ? -time * 58 : 0;
  ctx.beginPath();
  ctx.moveTo(a.x + offsetX, a.y + offsetY);
  ctx.lineTo(b.x + offsetX, b.y + offsetY);
  ctx.moveTo(a.x - offsetX, a.y - offsetY);
  ctx.lineTo(b.x - offsetX, b.y - offsetY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  drawFlowDot(ctx, a.x, a.y, b.x, b.y, time, active ? look.text : look.guideWeak);
  ctx.restore();
}

function drawPipeLink(ctx, a, b, time, previewMotion, active, liquidState = {}, look = CANVAS_LOOKS.whiteBlueprint) {
  if (!a || !b) return;
  const theme = liquidTheme(liquidState);
  ctx.save();
  ctx.strokeStyle = active ? theme.glow : look.guideWeak;
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 9]);
  ctx.lineDashOffset = previewMotion ? -time * 42 : 0;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.strokeStyle = active ? colorAlpha(theme.base, 0.56) : look.guideWeak;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 9]);
  ctx.lineDashOffset = previewMotion ? -time * 42 : 0;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  drawFlowDot(ctx, a.x, a.y, b.x, b.y, time, active ? colorAlpha(theme.accent, 0.84) : look.guideWeak);
  ctx.restore();
}

function drawFlowDot(ctx, x1, y1, x2, y2, time, color) {
  const phase = (time * 0.65) % 1;
  const x = x1 + (x2 - x1) * phase;
  const y = y1 + (y2 - y1) * phase;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawNode(ctx, x, y, active, look) {
  ctx.fillStyle = look.nodeFill;
  ctx.strokeStyle = active ? look.text : look.guideWeak;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
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
  const index = tiers.findIndex((tier) => days >= tier.days);
  if (index < 0) return null;
  const tier = tiers[index];
  return { ...tier, level: (tiers.length - index) / tiers.length };
}

function drawHistoryLine(ctx, x1, y1, x2, y2, seed, amount = 2.2) {
  ctx.beginPath();
  for (let i = 0; i <= 5; i += 1) {
    const t = i / 5;
    const wobble = Math.sin(seed * 12.9898 + i * 5.31) * amount * Math.sin(t * Math.PI);
    const x = x1 + (x2 - x1) * t + wobble;
    const y = y1 + (y2 - y1) * t - wobble * 0.45;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawAgePatina(ctx, width, height, layout, seconds, time, look) {
  const level = historyLevelFromAge(seconds);
  if (!level) return;

  const seed = hashSeed(`${layout?.tokenId || 1}:age:${layout?.traits?.head || ""}`);
  ctx.save();
  ctx.globalCompositeOperation = look.pfp ? "multiply" : "source-over";

  const dustCount = Math.floor(18 + level * 90);
  ctx.fillStyle = colorAlpha(level > 0.6 ? "#8a642d" : "#5a4d35", look.pfp ? 0.025 + level * 0.035 : 0.035 + level * 0.05);
  for (let i = 0; i < dustCount; i += 1) {
    const x = seededUnit(seed, i + 10) * width;
    const y = seededUnit(seed, i + 80) * height;
    const r = 0.7 + seededUnit(seed, i + 160) * (1.2 + level * 2.4);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (seconds >= 30 * 86400) {
    ctx.globalCompositeOperation = "source-over";
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.82, 0, width * 0.5, height * 0.82, width * 0.58);
    glow.addColorStop(0, colorAlpha("#d7a13a", 0.025 + level * 0.055));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function drawHolderBondAura(ctx, width, height, placements, seconds, time) {
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

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const bounds of [core, head]) {
    const radius = Math.max(bounds.w, bounds.h) * (0.22 + strength * 0.08);
    const glow = ctx.createRadialGradient(bounds.cx, bounds.cy, 0, bounds.cx, bounds.cy, radius);
    glow.addColorStop(0, colorAlpha("#73ffe1", 0.04 + strength * 0.09 + pulse * 0.018));
    glow.addColorStop(0.48, colorAlpha("#d7a13a", strength * 0.055));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(bounds.cx - radius, bounds.cy - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

function drawHolderBondGearMilestones(ctx, width, height, placements, seconds, time, look) {
  const milestone = holderBondMilestone(seconds);
  if (!milestone) return;

  const gears = placements
    .filter((part) => {
      const key = String(part.key || "");
      const z = part.z ?? part.zIndex ?? 0;
      const x = Number(part.x || 0);
      const y = Number(part.y || 0);
      return z >= 8
        && y > height * 0.34
        && x > width * 0.12
        && x < width * 0.88
        && (key.includes("gear") || key.includes("wheel") || key.includes("ring.sprocket") || key.includes("ring.bolted"));
    })
    .sort((a, b) => {
      const az = a.z ?? a.zIndex ?? 0;
      const bz = b.z ?? b.zIndex ?? 0;
      return bz - az;
    })
    .slice(0, 14);

  if (!gears.length) return;

  const pulse = 0.5 + Math.sin(time * (0.55 + milestone.level * 0.22)) * 0.5;
  const color = milestone.color;
  const glowAlpha = look.pfp ? 0.09 + milestone.level * 0.18 : 0.1 + milestone.level * 0.19;
  const ringAlpha = 0.18 + milestone.gold * 0.34 + pulse * 0.04;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < gears.length; i += 1) {
    const part = gears[i];
    const local = partBounds(part);
    const sx = Math.abs(Number(part.scaleX || 1));
    const sy = Math.abs(Number(part.scaleY ?? part.scaleX ?? 1));
    const radius = Math.max(local.w * sx, local.h * sy) * (0.34 + milestone.level * 0.025);
    const x = Number(part.x || 0);
    const y = Number(part.y || 0);
    const offset = i * 0.37;

    const glow = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius * (1.35 + milestone.level * 0.25));
    glow.addColorStop(0, colorAlpha(color, glowAlpha + pulse * 0.012));
    glow.addColorStop(0.45, colorAlpha("#d7a13a", milestone.gold * 0.038));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * (1.35 + milestone.level * 0.25), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colorAlpha(color, ringAlpha);
    ctx.lineWidth = 1.4 + milestone.level * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.64 + pulse * 0.025), -0.75 + offset, 1.15 + offset);
    ctx.stroke();

    if (milestone.rust > 0.12) {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = colorAlpha("#8b5a24", look.pfp ? 0.045 + milestone.rust * 0.08 : 0.12 + milestone.rust * 0.18);
      ctx.lineWidth = look.pfp ? 0.8 + milestone.rust * 0.35 : 1.1 + milestone.rust * 0.7;
      const rustCuts = look.pfp ? 2 + Math.floor(milestone.rust * 3) : 4 + Math.floor(milestone.rust * 5);
      for (let j = 0; j < rustCuts; j += 1) {
        const angle = seededUnit((part.id || i) * 43.7, j + 20) * Math.PI * 2;
        const inner = radius * (look.pfp ? 0.72 + seededUnit((part.id || i) * 19.3, j + 1) * 0.1 : 0.62 + seededUnit((part.id || i) * 19.3, j + 1) * 0.18);
        const outer = look.pfp
          ? Math.min(radius * 0.9, inner + Math.min(18, radius * 0.16))
          : radius * (0.86 + seededUnit((part.id || i) * 23.9, j + 3) * 0.12);
        drawHistoryLine(ctx, x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, x + Math.cos(angle) * outer, y + Math.sin(angle) * outer, 8100 + i * 17 + j, 0.7);
      }
      ctx.globalCompositeOperation = "lighter";
    }
  }

  ctx.restore();
}

function drawSaleProvenanceSeal(ctx, width, height, placements, rank, time) {
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

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = colorAlpha(highSale ? "#ffef7a" : colors[rank], 0.075 + rank * 0.025 + pulse * 0.018);
  ctx.beginPath();
  ctx.arc(cx, cy, r * (highSale ? 2.15 : 1.65), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  if (highSale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.08 + Math.sin(time * 0.7) * 0.025);
    ctx.shadowColor = colorAlpha("#ffef7a", 0.5 + pulse * 0.2);
    ctx.shadowBlur = 10 + rank * 1.5;
    const diamond = () => {
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.26);
      ctx.lineTo(r * 1.03, -r * 0.16);
      ctx.lineTo(0, r * 1.3);
      ctx.lineTo(-r * 1.03, -r * 0.16);
      ctx.closePath();
    };
    ctx.fillStyle = "rgba(7,8,9,0.9)";
    ctx.strokeStyle = colorAlpha("#ffef7a", 0.94);
    ctx.lineWidth = 2.4;
    diamond();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.clip();
    const facet = ctx.createLinearGradient(-r, -r, r, r);
    facet.addColorStop(0, "rgba(255,255,255,0.18)");
    facet.addColorStop(0.35, "rgba(255,239,122,0.13)");
    facet.addColorStop(0.66, "rgba(14,19,20,0.72)");
    facet.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = facet;
    ctx.fillRect(-r * 1.15, -r * 1.3, r * 2.3, r * 2.6);
    ctx.strokeStyle = "rgba(255,239,122,0.42)";
    ctx.lineWidth = 1.1;
    for (const line of [
      [0, -r * 1.24, 0, r * 1.26],
      [-r * 0.92, -r * 0.16, r * 0.92, -r * 0.16],
      [-r * 0.55, -r * 0.78, r * 0.55, -r * 0.78],
      [-r * 0.82, -r * 0.12, 0, r * 1.18],
      [r * 0.82, -r * 0.12, 0, r * 1.18]
    ]) {
      drawHistoryLine(ctx, line[0], line[1], line[2], line[3], 6200 + rank, 0.9);
    }
    ctx.restore();

    ctx.strokeStyle = colorAlpha("#d7a13a", 0.7 + pulse * 0.18);
    ctx.lineWidth = 1.25;
    for (let i = 0; i < 12; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 6;
      const inner = r * 1.34;
      const outer = r * (1.5 + (i % 2) * 0.14);
      drawHistoryLine(ctx, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer, 6300 + i, 0.7);
    }

    ctx.fillStyle = colorAlpha("#fff8d7", 0.96);
    ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[rank], 0, 0.5);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.07 + Math.sin(time * 0.9) * 0.02);
    const gear = () => {
      ctx.beginPath();
      const teeth = 18;
      for (let i = 0; i < teeth * 2; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / teeth;
        const pr = i % 2 ? r * 0.96 : r * 1.18;
        const x = Math.cos(angle) * pr;
        const y = Math.sin(angle) * pr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    };
    ctx.shadowColor = colorAlpha("#d7a13a", 0.5 + pulse * 0.2);
    ctx.shadowBlur = 9;
    gear();
    const gearFill = ctx.createRadialGradient(-r * 0.18, -r * 0.24, r * 0.12, 0, 0, r * 1.18);
    gearFill.addColorStop(0, "rgba(255,237,141,0.96)");
    gearFill.addColorStop(0.48, colorAlpha(colors[rank], 0.92));
    gearFill.addColorStop(1, "rgba(151,86,17,0.92)");
    ctx.fillStyle = gearFill;
    ctx.fill();
    ctx.strokeStyle = "rgba(77,47,12,0.88)";
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,215,92,0.74)";
    ctx.fill();
    ctx.strokeStyle = "rgba(104,67,16,0.68)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,240,170,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(111,71,18,0.58)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 4;
      const inner = r * 0.58;
      const outer = r * 0.92;
      drawHistoryLine(ctx, Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer, 6400 + i, 0.55);
    }
    ctx.fillStyle = "rgba(17,13,8,0.82)";
    ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labels[rank], 0, 0.5);
    ctx.restore();
  }
  ctx.restore();
}

function scarScreenPalette(chainState = {}) {
  const raw = String(chainState.scarScreenColor || chainState.scarColor || "").trim().toLowerCase();
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

function saleEventCount(chainState = {}) {
  const explicit = Number(
    chainState.saleCount
      ?? chainState.sellCount
      ?? chainState.sales
      ?? chainState.saleTransfers
      ?? chainState.soldTransfers
      ?? chainState.verifiedSaleCount
      ?? 0
  );
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  return saleTierRank(chainState) ? 1 : 0;
}

function transferEventCount(chainState = {}) {
  const raw = Number(chainState.transferCount ?? chainState.transfers ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

function drawPixelGlyph(ctx, pattern, x, y, pixel, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== "1") continue;
      ctx.fillRect(x + col * pixel, y + row * pixel, pixel * 0.78, pixel * 0.78);
    }
  }
  ctx.restore();
}

function drawPixelSaleCount(ctx, count, x, y, pixel, color) {
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
    drawPixelGlyph(ctx, digits[char] || digits["0"], cx, y, pixel, color);
    cx += glyphW + gap;
  }
}

function drawBodyPlateSaleScarScreen(ctx, width, height, placements, chainState, look = CANVAS_LOOKS.whiteBlueprint) {
  const sales = saleEventCount(chainState);
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
  const palette = scarScreenPalette(chainState);
  const plateW = 58;
  const plateH = 46;
  const x = -plateW / 2;
  const y = -plateH / 2;

  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.rotate(-0.12);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";

  const plate = () => {
    ctx.beginPath();
    ctx.roundRect(x, y, plateW, plateH, 10);
  };

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.24)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  plate();
  ctx.fillStyle = "rgba(226,216,190,0.76)";
  ctx.fill();
  ctx.restore();

  const screen = () => {
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 6, plateW - 14, 28, 7);
  };
  screen();
  const glass = ctx.createRadialGradient(0, y + 20, 0, 0, y + 20, 32);
  glass.addColorStop(0, colorAlpha(palette.glass, 0.98));
  glass.addColorStop(0.5, "rgba(6,12,11,0.92)");
  glass.addColorStop(1, "rgba(3,5,5,0.98)");
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = "rgba(18,22,21,0.72)";
  ctx.lineWidth = 1.8;
  plate();
  ctx.stroke();
  ctx.strokeStyle = colorAlpha(palette.frame, 0.82);
  ctx.lineWidth = 1.35;
  screen();
  ctx.stroke();

  ctx.save();
  screen();
  ctx.clip();
  ctx.fillStyle = colorAlpha(palette.accent, 0.04 + heat * 0.02);
  for (let col = x + 10; col < x + plateW - 10; col += 5) ctx.fillRect(col, y + 10, 1, 22);
  for (let row = y + 11; row < y + 33; row += 5) ctx.fillRect(x + 9, row, plateW - 18, 1);
  ctx.shadowColor = colorAlpha(palette.accent, 0.7);
  ctx.shadowBlur = 4;
  drawPixelSaleCount(ctx, sales, 0, y + 12, 3.05, colorAlpha(palette.accent, 0.95));
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  ctx.fillStyle = colorAlpha(palette.accent, 0.84);
  ctx.font = "bold 4.8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SALE", -8, y + 38);
  ctx.fillStyle = sales > 9 ? colorAlpha(palette.frame, 0.86) : "rgba(176,42,37,0.82)";
  ctx.beginPath();
  ctx.arc(x + plateW - 11, y + 38, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const [rx, ry] of [[x + 6, y + 8], [x + plateW - 6, y + 8], [x + 7, y + plateH - 7], [x + plateW - 7, y + plateH - 7]]) {
    ctx.fillStyle = colorAlpha(palette.frame, 0.88);
    ctx.beginPath();
    ctx.arc(rx, ry, 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(8,10,10,0.46)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  ctx.restore();
}

function drawTransferCut(ctx, x1, y1, x2, y2, seed, color, width = 2.1, glow = 0) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(5,8,8,0.52)";
  ctx.lineWidth = width + 2.5;
  drawHistoryLine(ctx, x1 + 1.4, y1 + 1.8, x2 + 1.4, y2 + 1.8, seed + 30, 0.85);
  if (glow) {
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = color;
    ctx.shadowBlur = 7 + glow * 7;
    ctx.strokeStyle = colorAlpha(color, 0.18 + glow * 0.22);
    ctx.lineWidth = width + 4;
    drawHistoryLine(ctx, x1, y1, x2, y2, seed + 60, 0.55);
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = colorAlpha(color, 0.92);
  ctx.lineWidth = width;
  drawHistoryLine(ctx, x1, y1, x2, y2, seed, 0.72);
  ctx.strokeStyle = "rgba(255,245,190,0.32)";
  ctx.lineWidth = Math.max(0.7, width * 0.38);
  drawHistoryLine(ctx, x1 + 1, y1 - 1.2, x2 + 1, y2 - 1.2, seed + 90, 0.35);
  ctx.restore();
}

function drawTransferTallyBundle(ctx, x, y, scale, seed, options = {}) {
  const color = options.color || "#24221b";
  const glow = options.glow || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  for (let i = 0; i < 4; i += 1) {
    const ox = (i - 1.5) * 8.6 * scale;
    drawTransferCut(ctx, ox - 4 * scale, 15 * scale, ox + 4.5 * scale, -17 * scale, seed + i * 19, color, 2.1 * scale, glow);
  }
  drawTransferCut(ctx, -22 * scale, 10 * scale, 23 * scale, -12 * scale, seed + 101, options.slashColor || "#a46624", 2.45 * scale, glow);
  ctx.restore();
}

function drawTransferSingleCuts(ctx, x, y, count, scale, seed, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  for (let i = 0; i < count; i += 1) {
    const ox = (i - (count - 1) / 2) * 9.5 * scale;
    drawTransferCut(ctx, ox - 2.8 * scale, 13 * scale, ox + 5.5 * scale, -14 * scale, seed + i * 23, options.color || "#24221b", 2 * scale, options.glow || 0);
  }
  ctx.restore();
}

function drawTransferBurnBundle(ctx, x, y, scale, seed, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  const heat = options.heat || 0;
  ctx.fillStyle = heat > 0.58 ? "rgba(111,28,20,0.24)" : "rgba(70,42,24,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 1, 30 * scale, 17 * scale, -0.1, 0, Math.PI * 2);
  ctx.fill();
  drawTransferTallyBundle(ctx, 0, 0, scale * 0.82, seed, {
    color: heat > 0.58 ? "#80231d" : "#25221a",
    slashColor: "#d7a13a",
    glow: options.glow || 0
  });
  ctx.restore();
}

function drawTransferSeal(ctx, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  const glow = options.glow || 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  ctx.fillStyle = "rgba(14,17,16,0.64)";
  ctx.strokeStyle = "rgba(215,161,58,0.84)";
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, 12 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = glow ? colorAlpha("#66f5dd", 0.18 + glow * 0.24) : "rgba(215,161,58,0.5)";
  ctx.lineWidth = 1.1 * scale;
  drawHistoryLine(ctx, -6 * scale, -5 * scale, 6 * scale, 5 * scale, seed, 0.24 * scale);
  drawHistoryLine(ctx, -6 * scale, 5 * scale, 6 * scale, -5 * scale, seed + 1, 0.24 * scale);
  ctx.fillStyle = "rgba(245,236,206,0.82)";
  ctx.font = `bold ${Math.max(5, 6.6 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0.5);
  ctx.restore();
}

function drawTransferArchiveStamp(ctx, x, y, label, seed, options = {}) {
  const scale = options.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(options.rotation || 0);
  const w = 58 * scale;
  const h = 23 * scale;
  ctx.fillStyle = "rgba(8,10,10,0.78)";
  ctx.strokeStyle = "rgba(215,161,58,0.72)";
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 5 * scale);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,236,151,0.16)";
  ctx.lineWidth = 0.8 * scale;
  drawHistoryLine(ctx, -w * 0.34, -h * 0.18, w * 0.36, -h * 0.26, seed, 0.38);
  ctx.fillStyle = "rgba(245,236,206,0.84)";
  ctx.font = `bold ${Math.max(7, 10 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0.7);
  ctx.restore();
}

function compactTransferLabel(value) {
  if (value >= 1000000) return `${Math.floor(value / 1000000)}M`;
  if (value >= 1000) return `${Math.floor(value / 1000)}K`;
  return String(value);
}

function drawBodyPlateTransferTallyScars(ctx, width, height, placements, chainState = {}, time = 0, look = CANVAS_LOOKS.whiteBlueprint) {
  const transfers = transferEventCount(chainState);
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

  if (thousands) {
    drawTransferArchiveStamp(ctx, anchors[3].x, anchors[3].y + 10, compactTransferLabel(transfers), seed + 4, {
      scale: 0.78,
      rotation: anchors[3].r
    });
  }

  const visibleHundreds = Math.min(5, hundreds);
  for (let i = 0; i < visibleHundreds; i += 1) {
    const a = anchors[i % 2];
    drawTransferSeal(ctx, a.x + (i - (visibleHundreds - 1) / 2) * 28, a.y - 10 + (i % 2) * 11, "100", seed + 100 + i, {
      scale: 0.78,
      rotation: a.r,
      glow
    });
  }

  const visibleTwentyFives = Math.min(4, twentyFives);
  for (let i = 0; i < visibleTwentyFives; i += 1) {
    const a = anchors[(i + 1) % anchors.length];
    drawTransferBurnBundle(ctx, a.x + (i - (visibleTwentyFives - 1) / 2) * 34, a.y + 18 + (i % 2) * 7, a.scale, seed + 220 + i, {
      rotation: a.r,
      heat,
      glow
    });
  }

  const visibleFives = Math.min(4, fives);
  for (let i = 0; i < visibleFives; i += 1) {
    const a = anchors[i % anchors.length];
    drawTransferTallyBundle(ctx, a.x + (i - (visibleFives - 1) / 2) * 40, a.y + 2 + (i % 2) * 16, a.scale * 0.92, seed + 360 + i, {
      rotation: a.r,
      color: cutColor,
      slashColor,
      glow
    });
  }

  if (ones) {
    const a = anchors[2];
    drawTransferSingleCuts(ctx, a.x + 48, a.y + 25, ones, a.scale, seed + 520, {
      rotation: a.r,
      color: cutColor,
      glow
    });
  }

  if (transfers >= 500 && !thousands) {
    drawTransferArchiveStamp(ctx, anchors[3].x, anchors[3].y + 12, compactTransferLabel(transfers), seed + 700, {
      scale: 0.68,
      rotation: anchors[3].r
    });
  }

  ctx.restore();
}

function drawHistoryEvolution(ctx, width, height, layout, placements, chainState = {}, time, look) {
  const ageSeconds = archiveAgeSeconds(chainState);
  const bondSeconds = holderBondSeconds(chainState);
  const sales = saleEventCount(chainState);
  const transfers = transferEventCount(chainState);
  const saleRank = saleTierRank(chainState);

  if (!ageSeconds && !bondSeconds && !sales && !transfers && !saleRank) return;
  drawAgePatina(ctx, width, height, layout, ageSeconds, time, look);
  if (bondSeconds) {
    drawHolderBondAura(ctx, width, height, placements, bondSeconds, time);
    drawHolderBondGearMilestones(ctx, width, height, placements, bondSeconds, time, look);
  }
  const hasTransferTallyPart = placements.some((part) => part.key === "counter.transferTally");
  const hasSaleScreenPart = placements.some((part) => part.key === "counter.saleScreen");
  if (transfers && !hasTransferTallyPart) drawBodyPlateTransferTallyScars(ctx, width, height, placements, { ...chainState, transferCount: transfers }, time, look);
  if (sales && !hasSaleScreenPart) drawBodyPlateSaleScarScreen(ctx, width, height, placements, { ...chainState, saleCount: sales }, look);
  drawSaleProvenanceSeal(ctx, width, height, placements, saleRank, time);
}

function drawLiveChainEffects(ctx, width, height, layout, placements, chainState = {}, time, look) {
  const pressure = pressureLevel(chainState);
  const heartbeat = Math.max(0, Math.min(1, Number(chainState.heartbeatPulse || 0)));
  const live = Boolean(chainState.liveMode || chainState.showLiveEffects || heartbeat || pressure === "high" || pressure === "extreme");
  if (!live) return;

  const headBounds = combinedBounds(placements, (part) => {
    const z = part.z ?? part.zIndex ?? 0;
    return z >= 40 && z < 73;
  }) || { x: width * 0.36, y: height * 0.18, w: width * 0.28, h: height * 0.28, cx: width * 0.5, cy: height * 0.32 };

  const family = headReactionFamily(layout?.traits?.head);
  const pressureColor = pressure === "extreme" ? "#ff3b2f" : pressure === "high" ? "#ff9c2f" : "#6fffe2";
  const accent = family === "fluid" ? (LIQUID_GLOWS[Number(chainState.liquidColor ?? layout?.liquid?.colorIndex ?? 1) % LIQUID_GLOWS.length] || "#6fffe2") : pressureColor;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  if (family === "signal" || family === "screen") drawScreenPulse(ctx, headBounds, heartbeat, pressure, time, accent);
  if (family === "fluid") drawFluidReaction(ctx, headBounds, heartbeat, pressure, time, accent);
  if (family === "electric") drawElectricReaction(ctx, headBounds, heartbeat, pressure, time, pressureColor);
  if (family === "archive") drawArchiveReaction(ctx, headBounds, heartbeat, pressure, time, accent);
  if (family === "vault") drawVaultReaction(ctx, headBounds, heartbeat, pressure, time, accent);
  ctx.restore();
}

function drawCoreHeartbeat(ctx, bounds, heartbeat, time, color) {
  const pulse = Math.max(heartbeat, 0.18 + Math.sin(time * 2.1) * 0.08);
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.18 + pulse * 0.22);
  ctx.lineWidth = 2 + pulse * 4;
  ctx.beginPath();
  ctx.arc(bounds.cx, bounds.cy, Math.max(bounds.w, bounds.h) * (0.32 + pulse * 0.11), 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = colorAlpha("#ffffff", 0.12 + heartbeat * 0.24);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(bounds.cx, bounds.cy, Math.max(bounds.w, bounds.h) * 0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScreenPulse(ctx, bounds, heartbeat, pressure, time, color) {
  const pressureBoost = pressure === "extreme" ? 1 : pressure === "high" ? 0.72 : pressure === "medium" ? 0.36 : 0.16;
  ctx.save();
  const alpha = 0.015 + heartbeat * 0.035 + pressureBoost * 0.018;
  ctx.strokeStyle = colorAlpha(color, alpha);
  ctx.lineWidth = 0.55 + pressureBoost * 0.35;
  const lineCount = pressure === "extreme" ? 9 : pressure === "high" ? 7 : 5;
  for (let i = 0; i < lineCount; i += 1) {
    const y = bounds.y + bounds.h * (0.28 + i * 0.065) + Math.sin(time * 4 + i) * (1 + pressureBoost * 2.5);
    const jitter = Math.sin(time * 9 + i * 2.7) * pressureBoost * 4;
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.w * 0.2 + jitter, y);
    ctx.lineTo(bounds.x + bounds.w * 0.82 + jitter * 0.4, y + Math.sin(i + time) * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSignalWaves(ctx, bounds, heartbeat, pressure, time, color) {
  const rings = pressure === "extreme" ? 5 : pressure === "high" ? 4 : 3;
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.12 + heartbeat * 0.15);
  ctx.lineWidth = pressure === "extreme" ? 2.2 : 1.4;
  for (let i = 0; i < rings; i += 1) {
    const phase = (time * 0.9 + i * 0.18) % 1;
    const rx = bounds.w * (0.32 + phase * 0.36);
    const ry = bounds.h * (0.12 + phase * 0.16);
    ctx.beginPath();
    ctx.ellipse(bounds.cx, bounds.y + bounds.h * 0.12, rx, ry, 0, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFluidReaction(ctx, bounds, heartbeat, pressure, time, color) {
  const boil = pressure === "extreme" ? 1 : pressure === "high" ? 0.72 : pressure === "medium" ? 0.38 : 0.18;
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.2 + heartbeat * 0.18);
  ctx.fillStyle = colorAlpha(color, 0.08 + boil * 0.05);
  for (let i = 0; i < 12; i += 1) {
    const phase = (time * (0.35 + boil * 0.52) + i * 0.131) % 1;
    const x = bounds.x + bounds.w * (0.24 + ((i * 37) % 48) / 100);
    const y = bounds.y + bounds.h * (0.78 - phase * 0.54);
    const r = 2.4 + (i % 4) + heartbeat * 2;
    ctx.beginPath();
    ctx.arc(x + Math.sin(time + i) * 4, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawElectricReaction(ctx, bounds, heartbeat, pressure, time, color) {
  const active = pressure === "extreme" || pressure === "high" || heartbeat > 0.1;
  if (!active) return;
  ctx.save();
  ctx.strokeStyle = colorAlpha(pressure === "extreme" ? "#ffef7a" : color, 0.18 + heartbeat * 0.3);
  ctx.lineWidth = pressure === "extreme" ? 2.4 : 1.5;
  for (let i = 0; i < 4; i += 1) {
    const startX = bounds.cx + Math.sin(time * 2 + i) * bounds.w * 0.18;
    const startY = bounds.y + bounds.h * (0.16 + i * 0.08);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let j = 1; j <= 4; j += 1) {
      ctx.lineTo(startX + (j % 2 ? 18 : -12) + i * 5, startY - j * (12 + i));
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawArchiveReaction(ctx, bounds, heartbeat, pressure, time, color) {
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.16 + heartbeat * 0.22);
  ctx.fillStyle = colorAlpha("#fff4c8", 0.05 + heartbeat * 0.05);
  for (let i = 0; i < 5; i += 1) {
    const x = bounds.x + bounds.w * (0.2 + i * 0.13);
    const y = bounds.y + bounds.h * (0.64 + Math.sin(time * 2.4 + i) * 0.018);
    ctx.strokeRect(x, y, bounds.w * 0.08, bounds.h * 0.045);
    ctx.fillRect(x, y, bounds.w * 0.08, bounds.h * 0.045);
  }
  if (pressure === "high" || pressure === "extreme") {
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.w * 0.18, bounds.y + bounds.h * 0.72);
    ctx.lineTo(bounds.x + bounds.w * 0.82, bounds.y + bounds.h * 0.72 + Math.sin(time * 16) * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVaultReaction(ctx, bounds, heartbeat, pressure, time, color) {
  ctx.save();
  ctx.strokeStyle = colorAlpha(color, 0.16 + heartbeat * 0.25);
  ctx.lineWidth = 2;
  const radius = Math.min(bounds.w, bounds.h) * (0.22 + heartbeat * 0.05);
  ctx.beginPath();
  ctx.arc(bounds.cx, bounds.cy, radius, time * 0.7, time * 0.7 + Math.PI * 1.4);
  ctx.stroke();
  if (pressure === "high" || pressure === "extreme") {
    ctx.strokeStyle = colorAlpha("#ffb347", 0.16);
    ctx.strokeRect(bounds.cx - radius, bounds.cy - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

function drawPressureLeak(ctx, headBounds, coreBounds, pressure, time) {
  const hot = pressure === "extreme";
  ctx.save();
  ctx.strokeStyle = hot ? "rgba(255,73,50,0.25)" : "rgba(255,166,58,0.18)";
  ctx.lineWidth = hot ? 9 : 6;
  ctx.lineCap = "round";
  for (let i = 0; i < (hot ? 7 : 4); i += 1) {
    const baseX = i % 2 ? headBounds.x + headBounds.w * 0.84 : coreBounds.x + coreBounds.w * 0.2;
    const baseY = i % 2 ? headBounds.y + headBounds.h * 0.7 : coreBounds.y + coreBounds.h * 0.25;
    const sway = Math.sin(time * 1.8 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.bezierCurveTo(baseX + sway, baseY - 26, baseX - sway * 0.6, baseY - 62, baseX + sway * 0.4, baseY - 92);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSelection(ctx, part, look = CANVAS_LOOKS.whiteBlueprint) {
  const bounds = partBounds(part);
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.rotate(part.rotation || 0);
  ctx.scale(part.scaleX || 1, part.scaleY || 1);
  ctx.strokeStyle = look.text;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([8, 7]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.setLineDash([]);

  for (const [x, y] of [
    [bounds.x, bounds.y],
    [bounds.x + bounds.w, bounds.y],
    [bounds.x, bounds.y + bounds.h],
    [bounds.x + bounds.w, bounds.y + bounds.h]
  ]) {
    ctx.fillStyle = look.nodeFill;
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const handleY = bounds.y - 42;
  ctx.beginPath();
  ctx.moveTo(0, bounds.y - 8);
  ctx.lineTo(0, handleY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, handleY, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "15px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = look.text;
  ctx.fillText("R", -5, handleY + 5);
  ctx.restore();

  ctx.save();
  for (const connector of getVisualConnectors(part)) {
    ctx.strokeStyle = connector.kind === "pipe" ? "rgba(28, 118, 154, 0.82)" : look.text;
    ctx.fillStyle = look.nodeFill;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(connector.x, connector.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawTransactionScars(ctx, width, height, chainState, look = CANVAS_LOOKS.whiteBlueprint) {
  const count = Math.min(60, Number(chainState.transferCount || 0) * 3);
  if (!count) return;

  ctx.save();
  ctx.strokeStyle = look.borderSoft;
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const x = 80 + ((i * 137) % (width - 160));
    const y = 100 + ((i * 211) % (height - 200));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12 + (i % 18), y + 8 - (i % 16));
    ctx.stroke();
  }
  ctx.restore();
}
