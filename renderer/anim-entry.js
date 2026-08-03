// Full MotorHeads animation app (D/A/S buttons + drag/dismantle/reassemble + chain-reactive),
// reused VERBATIM from the original per-token animation logic (generate-animations.js scriptFor output).
// The token layout comes from a global the worker's /anim/:id.html sets, so ONE bundle serves every token.
import { drawMachine } from "../web/src/renderer.js";
import { getPartRadius, partBounds } from "../web/src/parts.js";
const BASE_LAYOUT = window.__LAM_BASE_LAYOUT__;
const canvas = document.getElementById("render");
const stage = document.querySelector(".stage");
const ctx = canvas.getContext("2d");
const params = new URLSearchParams(location.search);
const storageKey = ["lamOpenSeaAssembly", "v3-cache-fix", params.get("contract") || "collection", BASE_LAYOUT.tokenId, params.get("owner") || "viewer"].join(":");
const assemblyParts = () => (renderLayout.placements || []).filter((part) => part.assembly !== false);
const renderLayout = JSON.parse(JSON.stringify(BASE_LAYOUT));
const captureMode = params.has("capture");
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const ease = (value) => 1 - Math.pow(1 - clamp01(value), 3);
const lerp = (a, b, t) => a + (b - a) * t;

let mode = "dismantled";
let previewMotion = false;
let transition = null;
let selected = null;
let dragOffset = { x: 0, y: 0 };
let dragTarget = null;
let mouseLook = { active: false, x: canvas.width / 2, y: canvas.height / 2 };
let cursorRings = [];
let lastRingAt = 0;
let lastRenderAt = 0;
let motionClock = 0;
let lastMotionClockAt = 0;
let lastBackendPollAt = -Infinity;
let backendBusy = false;
let backendOnline = false;
let livePulseStartedAt = 0;
let renderRevision = 0;

// Holder on-chain parts, pre-flattened by the site into a transparent parts-layer PNG (parts at their
// resting placement, no machine). Drawn at (0,0,W,H) INSIDE drawMachine's body transform (drawOverlay
// hook) — identical to compositing each part inside that transform, so the add-ons ride the machine's
// bounce + lean. overlayAlpha follows assembly so dismantled/dragged states don't show floating add-ons.
const partsUrl = window.__LAM_PARTS_URL__ || "";
let partsImg = null;
if (partsUrl) { partsImg = new Image(); partsImg.crossOrigin = "anonymous"; partsImg.decoding = "async"; partsImg.src = partsUrl; }
let overlayAlpha = 0;
function drawPartsOverlay(c, info) {
  if (!partsImg || !partsImg.complete || !partsImg.naturalWidth || overlayAlpha < 0.01) return;
  c.save();
  c.globalAlpha = Math.min(1, overlayAlpha);
  c.drawImage(partsImg, 0, 0, info.width, info.height);
  c.restore();
}

const BACKEND_BASE_URL = String(params.get("backend") || "https://motorheads-backend.zacbosugame.workers.dev").replace(/\/+$/, "");
const backendEnabled = params.get("backend") !== "0" && params.get("liveBackend") !== "0" && !captureMode;
const backendPollMs = Math.max(15000, Number(params.get("pollMs") || 45000));
const backendFetchTimeoutMs = Math.max(900, Math.min(5000, Number(params.get("fetchTimeoutMs") || params.get("fetchTimeout") || 2200)));
const motionMode = String(params.get("motion") || "marketplace").toLowerCase();
const fullMotion = motionMode === "full" || motionMode === "studio";
const ecoMotion = motionMode === "eco" || params.get("eco") === "1";

const controls = {
  dismantle: document.getElementById("dismantle"),
  assemble: document.getElementById("assemble"),
  stop: document.getElementById("stopMotion")
};

const gasMode = String(params.get("gas") || "").toLowerCase();
const gasPressure =
  gasMode === "extreme" ? 160 :
  gasMode === "high" ? 90 :
  gasMode === "medium" ? 42 :
  gasMode === "low" ? 9 :
  Number(params.get("gasPressure") || params.get("baseFee") || 0);
const secondsFromParams = (secondsKey, daysKey) => {
  if (params.has(secondsKey)) return Math.max(0, Number(params.get(secondsKey) || 0));
  if (params.has(daysKey)) return Math.max(0, Number(params.get(daysKey) || 0) * 86400);
  return 0;
};
const chainState = {
  liveMode: true,
  showLiveEffects: true,
  gasPressure,
  baseFeeGwei: gasPressure,
  blockNumber: Number(params.get("block") || params.get("blockNumber") || (25000000 + ((Math.abs(BASE_LAYOUT.tokenId) * 137) % 900000))),
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
  const age = (now - livePulseStartedAt) / 1000;
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
  chainState.saleTier = saleCount > 0 ? (chain.lastSalePriceWei || "verified") : "";
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
  } catch (_) {}
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
  const from = new Map();
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
  const count = fullMotion ? (burst ? 9 : 3) : (burst ? 5 : 1);
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (burst ? 16 : 8);
    cursorRings.push({
      x: point.x + Math.cos(angle) * distance,
      y: point.y + Math.sin(angle) * distance,
      createdAt: now,
      life: fullMotion ? (burst ? 640 + Math.random() * 160 : 430 + Math.random() * 110) : (burst ? 520 + Math.random() * 120 : 320 + Math.random() * 90),
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
  const close = clamp01(1 - distance / 180);
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
    const t = clamp01((now - ring.createdAt) / ring.life);
    const alpha = (1 - t) * (1 - t) * (fullMotion ? 0.34 : 0.24);
    const radius = ring.radius + ring.grow * ease(t);
    ctx.strokeStyle = "rgba(" + ring.color + "," + alpha + ")";
    ctx.lineWidth = ring.lineWidth * (1 - t * 0.45);
    ctx.shadowColor = "rgba(212,161,49," + (alpha * 0.52) + ")";
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
  const frameMs = selected
    ? 1000 / (fullMotion ? 42 : ecoMotion ? 26 : 32)
    : transition
      ? 1000 / (fullMotion ? 36 : ecoMotion ? 18 : 24)
      : previewMotion
        ? 1000 / (fullMotion ? 36 : ecoMotion ? 12 : 24)
        : activeMotion
          ? 1000 / (fullMotion ? 28 : ecoMotion ? 12 : 18)
          : 1000 / (fullMotion ? 12 : ecoMotion ? 5 : 8);
  if (!captureMode && lastRenderAt && now - lastRenderAt < frameMs) {
    requestAnimationFrame(render);
    return;
  }
  lastRenderAt = now;
  if (previewMotion || transition) {
    motionClock = now / 1000;
  }
  lastMotionClockAt = now;
  updateTransition();
  updateDragMotion();
  const performanceMode = selected ? "drag" : (!fullMotion && previewMotion ? "marketplace" : "normal");
  const overlayTarget = (partsImg && mode === "assembled" && !selected && !transition) ? 1 : 0;
  overlayAlpha += (overlayTarget - overlayAlpha) * 0.14;
  drawMachine(ctx, renderLayout, chainState, { previewMotion, editMode: false, selected, mouseLook, performanceMode, motionTime: motionClock, drawOverlay: partsImg ? drawPartsOverlay : undefined });
  drawCursorRings();
  drawSnapHints();
  document.body.dataset.ready = "true";
  document.body.dataset.chainSource = chainState.source || "";
  document.body.dataset.chainBlock = String(chainState.blockNumber || "");
  document.body.dataset.backendOnline = backendOnline ? "true" : "false";
  document.body.dataset.backendError = chainState.backendError || "";
  document.body.dataset.motionMode = motionMode;
  document.body.dataset.motionFps = String(Math.round(1000 / frameMs));
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

const forcedStart = String(params.get("start") || (params.get("assembled") === "1" ? "assembled" : "")).toLowerCase();
if (params.get("resetAssembly") === "1") {
  try { localStorage.removeItem(storageKey); } catch (_) {}
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

overlayAlpha = mode === "assembled" ? 1 : 0; // instant on first paint; D/A toggles ease it after
setActiveButton();
void pollBackendChainState(true);
render();