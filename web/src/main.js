import "./styles.css";
import { MechanicalEditor, renderPartsLibrary } from "./editor.js";
import { CANVAS_MODES, LIQUID_TYPES, LIQUID_TEXTURES, MATERIAL_OPTIONS, SHADE_STYLES } from "./schema.js";
import { saveDraft, loadDraft, sha256Hex } from "./layoutStore.js";
import { connectWallet, readMachineState, publishBuild } from "./chain.js";

let editor;
let toastTimer;

const LAM_TOKEN_COUNT = 37;
const GAS_PRESETS = {
  low: 12,
  medium: 38,
  high: 92,
  extreme: 178
};
const SALE_TIER_WEI = {
  silver: "1000000000000000000",
  gold: "2000000000000000000",
  royal: "5000000000000000000",
  legendary: "7000000000000000000",
  mythic: "10000000000000000000"
};
const SALE_TIER_LABELS = {
  silver: "1 ETH",
  gold: "2 ETH",
  royal: "5 ETH",
  legendary: "7 ETH",
  mythic: "10 ETH"
};
const REVIEW_SCAR_COLORS = new Set(["teal", "gold", "amber", "black", "diamond", "red"]);
const REVIEW_GAS_MODES = new Set(Object.keys(GAS_PRESETS));
const urlParams = new URLSearchParams(window.location.search);
const liveReview = {
  tokenId: clampLamToken(urlParams.get("token") || urlParams.get("tokenId") || 1),
  gasMode: normalizeGasMode(urlParams.get("gas") || "medium"),
  bondDays: clampNumber(urlParams.get("bondDays") || urlParams.get("bond") || 0, 0, 3650),
  saleCount: clampNumber(urlParams.get("saleCount") || urlParams.get("sales") || 0, 0, 99),
  saleTier: normalizeSaleTier(urlParams.get("saleTier") || urlParams.get("sale") || ""),
  transfers: clampNumber(urlParams.get("transfers") || 0, 0, 99),
  scarScreenColor: normalizeScarColor(urlParams.get("scarScreenColor") || urlParams.get("scarColor") || "teal")
};

const el = (id) => document.getElementById(id);
const canvas = el("machineCanvas");
const app = el("app");

async function loadSampleLayout() {
  const res = await fetch("/sample-layout.json");
  return res.json();
}

async function loadBirdLayout() {
  const res = await fetch("/bird-example-layout.json");
  return res.json();
}

async function loadSwanLayout() {
  const res = await fetch("/swan-example-layout.json");
  return res.json();
}

async function loadButterflyLayout() {
  const res = await fetch("/butterfly-example-layout.json");
  return res.json();
}

async function loadPortraitLayout() {
  const res = await fetch("/portrait-example-layout.json");
  return res.json();
}

async function loadDragonLayout() {
  const res = await fetch("/dragon-example-layout.json");
  return res.json();
}

async function loadDiamondLayout() {
  const res = await fetch("/diamond-example-layout.json");
  return res.json();
}

async function loadLamPfpLayout(tokenId = liveReview.tokenId) {
  const id = clampLamToken(tokenId);
  const res = await fetch(`/living-archive/layouts/${id}.json`);
  if (!res.ok) throw new Error(`Could not load Living Archive Machine #${id}.`);
  return res.json();
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value, index) => `<option value="${index}">${value}</option>`).join("");
}

function fillOptionSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${value.id}">${value.label}</option>`).join("");
}

function clampNumber(value, min, max) {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function clampLamToken(value) {
  return clampNumber(value, 1, LAM_TOKEN_COUNT);
}

function normalizeGasMode(value) {
  const raw = String(value || "").toLowerCase();
  if (REVIEW_GAS_MODES.has(raw)) return raw;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (numeric >= 140) return "extreme";
    if (numeric >= 60) return "high";
    if (numeric >= 20) return "medium";
    return "low";
  }
  return "medium";
}

function normalizeSaleTier(value) {
  const raw = String(value || "").toLowerCase().replace(/eth$/, "");
  const aliases = {
    "1": "silver",
    silver: "silver",
    "2": "gold",
    gold: "gold",
    "5": "royal",
    royal: "royal",
    "7": "legendary",
    legendary: "legendary",
    "10": "mythic",
    mythic: "mythic"
  };
  return aliases[raw] || "";
}

function normalizeScarColor(value) {
  const raw = String(value || "").toLowerCase();
  return REVIEW_SCAR_COLORS.has(raw) ? raw : "teal";
}

function holderBondLabel(days) {
  if (days >= 3650) return "10 Years";
  if (days >= 1825) return "5 Years";
  if (days >= 730) return "2 Years";
  if (days >= 365) return "1 Year";
  if (days >= 300) return "10 Months";
  if (days >= 150) return "5 Months";
  if (days >= 60) return "2 Months";
  if (days >= 30) return "1 Month";
  if (days >= 14) return "2 Weeks";
  if (days >= 7) return "1 Week";
  if (days >= 3) return "3 Days";
  if (days >= 1) return "1 Day";
  return "Fresh";
}

function pressureMood(mode, saleTier, bondDays) {
  if (saleTier) return "legendary";
  if (mode === "extreme") return "overheated";
  if (mode === "high") return "stressed";
  if (bondDays >= 365) return "aged";
  return "calm";
}

function toast(message) {
  const node = el("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2800);
}

function setStatus(text, detail) {
  el("chainOutput").textContent = detail || el("chainOutput").textContent;
  toast(text);
  syncStatus();
}

function syncStatus() {
  if (!editor) return;
  el("buildStatus").textContent = editor.dirty ? "UNSAVED" : "SAVED";
  el("partsCount").textContent = editor.layout.placements.length;
  el("connectionsCount").textContent = editor.connections.length;
}

function syncViewport(viewport) {
  const button = el("zoomReset");
  if (button) button.textContent = `${Math.round((viewport?.zoom || 1) * 100)}%`;
}

function readLiveReviewControls() {
  if (!el("lamTokenInput")) return;
  liveReview.tokenId = clampLamToken(el("lamTokenInput").value);
  liveReview.gasMode = normalizeGasMode(el("testGasMode").value);
  liveReview.bondDays = clampNumber(el("testBondDays").value, 0, 3650);
  liveReview.saleCount = clampNumber(el("testSaleCount").value, 0, 99);
  liveReview.saleTier = normalizeSaleTier(el("testSaleTier").value);
  liveReview.transfers = clampNumber(el("testTransfers").value, 0, 99);
  liveReview.scarScreenColor = normalizeScarColor(el("testScarColor").value);
}

function syncLiveReviewControls() {
  if (!el("lamTokenInput")) return;
  el("lamTokenInput").value = liveReview.tokenId;
  el("testGasMode").value = liveReview.gasMode;
  el("testBondDays").value = String(liveReview.bondDays);
  el("testSaleCount").value = liveReview.saleCount;
  el("testSaleTier").value = liveReview.saleTier;
  el("testTransfers").value = liveReview.transfers;
  el("testScarColor").value = liveReview.scarScreenColor;
}

function liveReviewState() {
  const gasPressure = GAS_PRESETS[liveReview.gasMode] ?? GAS_PRESETS.medium;
  const holderBondSeconds = liveReview.bondDays * 86400;
  const saleTier = liveReview.saleTier;
  const saleWei = saleTier ? SALE_TIER_WEI[saleTier] : "0";
  return {
    liveMode: true,
    showLiveEffects: true,
    blockNumber: 25000000 + liveReview.tokenId * 137,
    blockTimestamp: Math.floor(Date.now() / 1000),
    gasPressure,
    baseFeeGwei: gasPressure,
    pressureLevel: liveReview.gasMode,
    heartbeatPulse: liveReview.gasMode === "extreme" ? 0.82 : liveReview.gasMode === "high" ? 0.56 : 0.22,
    archiveAgeSeconds: holderBondSeconds,
    archiveAgeLabel: holderBondLabel(liveReview.bondDays),
    holderBondSeconds,
    holderBondDays: liveReview.bondDays,
    holderBondLabel: holderBondLabel(liveReview.bondDays),
    transferCount: liveReview.transfers,
    transfers: liveReview.transfers,
    saleCount: liveReview.saleCount,
    sellCount: liveReview.saleCount,
    saleTier,
    highestVerifiedSaleWei: saleWei,
    scarScreenColor: liveReview.scarScreenColor,
    globalPhase: "Archive Awakening",
    mood: pressureMood(liveReview.gasMode, saleTier, liveReview.bondDays),
    liquidColor: editor?.layout?.liquid?.colorIndex,
    liquidTexture: editor?.layout?.liquid?.texture,
    fillLevel: editor?.layout?.liquid?.fillLevel
  };
}

function updateLiveReviewReadout(state) {
  const tokenName = editor?.layout?.traits?.head || editor?.layout?.name || "Living Archive Machine";
  const saleText = liveReview.saleTier ? SALE_TIER_LABELS[liveReview.saleTier] : `${liveReview.saleCount} sales`;
  el("reviewTokenName").textContent = `#${String(liveReview.tokenId).padStart(2, "0")} ${tokenName}`;
  el("reviewStateLabel").textContent = `${liveReview.gasMode.toUpperCase()} / ${state.holderBondLabel} / ${saleText}`;
}

function applyLiveReviewState() {
  if (!editor) return;
  const state = liveReviewState();
  editor.setChainState(state);
  editor.render();
  updateLiveReviewReadout(state);
  const output = el("chainOutput");
  if (output) {
    output.textContent = JSON.stringify({
      tokenId: liveReview.tokenId,
      gas: `${liveReview.gasMode} ${state.baseFeeGwei} gwei`,
      holderBond: state.holderBondLabel,
      saleCount: state.saleCount,
      saleBadge: liveReview.saleTier ? SALE_TIER_LABELS[liveReview.saleTier] : "none",
      transfers: state.transferCount,
      scarScreenColor: state.scarScreenColor
    }, null, 2);
  }
}

function renderPreviewUrl() {
  readLiveReviewControls();
  const params = new URLSearchParams({
    token: String(liveReview.tokenId),
    live: "1",
    gas: liveReview.gasMode,
    bondDays: String(liveReview.bondDays),
    saleCount: String(liveReview.saleCount),
    transfers: String(liveReview.transfers),
    scarScreenColor: liveReview.scarScreenColor
  });
  if (liveReview.saleTier) {
    params.set("saleTier", liveReview.saleTier);
    params.set("highestSaleWei", SALE_TIER_WEI[liveReview.saleTier]);
  }
  return `/lam-render.html?${params.toString()}`;
}

function syncInspector(part) {
  const inspector = el("inspector");
  const empty = el("emptyInspector");
  if (!part) {
    inspector.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  inspector.classList.remove("hidden");
  el("selectedKey").value = part.key;
  el("selectedX").value = Math.round(part.x);
  el("selectedY").value = Math.round(part.y);
  el("selectedRotation").value = Math.round((part.rotation || 0) * 180 / Math.PI);
  el("selectedScaleX").value = Number(part.scaleX || 1).toFixed(2);
  el("selectedScaleY").value = Number(part.scaleY || 1).toFixed(2);
  el("selectedZ").value = Math.round(part.z ?? part.zIndex ?? 0);
  el("selectedOpacity").value = Number(part.opacity ?? 1).toFixed(2);
  el("selectedMaterial").value = part.material || "graphiteInk";
  el("selectedShade").value = part.shadeStyle || editor.layout.defaults?.shadeStyle || "pencilSketch";
}

function bindInspector() {
  const numberBindings = [
    ["selectedX", "x", Number],
    ["selectedY", "y", Number],
    ["selectedRotation", "rotation", (v) => Number(v) * Math.PI / 180],
    ["selectedScaleX", "scaleX", Number],
    ["selectedScaleY", "scaleY", Number],
    ["selectedZ", "z", Number],
    ["selectedOpacity", "opacity", Number]
  ];

  for (const [id, key, parse] of numberBindings) {
    el(id).addEventListener("input", (event) => {
      if (!editor.selected) return;
      editor.updateSelected({ [key]: parse(event.target.value) });
    });
  }

  el("selectedMaterial").addEventListener("change", (event) => {
    if (!editor.selected) return;
    editor.updateSelected({ material: event.target.value });
  });

  el("selectedShade").addEventListener("change", (event) => {
    if (!editor.selected) return;
    editor.updateSelected({ shadeStyle: event.target.value });
  });

  el("duplicatePart").addEventListener("click", () => editor.duplicateSelected());
  el("deletePart").addEventListener("click", () => editor.deleteSelected());
  el("layerUp").addEventListener("click", () => editor.adjustSelectedZ(1));
  el("layerDown").addEventListener("click", () => editor.adjustSelectedZ(-1));
}

function bindAppearanceControls() {
  fillOptionSelect(el("canvasMode"), CANVAS_MODES);
  fillOptionSelect(el("defaultMaterial"), MATERIAL_OPTIONS);
  fillOptionSelect(el("defaultShade"), SHADE_STYLES);
  fillOptionSelect(el("selectedMaterial"), MATERIAL_OPTIONS);
  fillOptionSelect(el("selectedShade"), SHADE_STYLES);

  el("canvasMode").addEventListener("change", (event) => {
    editor.setCanvasMode(event.target.value);
    setStatus(`Canvas mode: ${CANVAS_MODES.find((mode) => mode.id === event.target.value)?.label || event.target.value}.`);
  });

  el("defaultMaterial").addEventListener("change", (event) => {
    editor.setDefaultMaterial(event.target.value);
    setStatus(`New parts will use ${MATERIAL_OPTIONS.find((material) => material.id === event.target.value)?.label || event.target.value}.`);
  });

  el("defaultShade").addEventListener("change", (event) => {
    editor.setDefaultShadeStyle(event.target.value);
    setStatus(`Default shade: ${SHADE_STYLES.find((shade) => shade.id === event.target.value)?.label || event.target.value}.`);
  });
}

function syncAppearanceControls(layout) {
  const canvas = layout.canvas || {};
  const defaults = layout.defaults || {};
  el("canvasMode").value = canvas.mode || "whiteBlueprint";
  el("defaultMaterial").value = defaults.material || "graphiteInk";
  el("defaultShade").value = defaults.shadeStyle || canvas.shadeStyle || "pencilSketch";
  delete app.dataset.canvasMode;
}

function bindLiquidControls() {
  const type = el("liquidType");
  const texture = el("liquidTexture");
  const fill = el("liquidFill");
  fillSelect(type, LIQUID_TYPES);
  fillSelect(texture, LIQUID_TEXTURES);

  function updateLiquid() {
    editor.layout.liquid = {
      ...(editor.layout.liquid || {}),
      type: LIQUID_TYPES[Number(type.value)],
      texture: LIQUID_TEXTURES[Number(texture.value)],
      colorIndex: Number(type.value),
      fillLevel: Number(fill.value)
    };
    editor.changed();
  }

  type.addEventListener("change", updateLiquid);
  texture.addEventListener("change", updateLiquid);
  fill.addEventListener("input", updateLiquid);
}

function syncLiquidControls(layout) {
  const liquid = layout.liquid || {};
  el("liquidType").value = Math.max(0, LIQUID_TYPES.indexOf(liquid.type || "Blue Coolant"));
  el("liquidTexture").value = Math.max(0, LIQUID_TEXTURES.indexOf(liquid.texture || "Bubbly"));
  el("liquidFill").value = liquid.fillLevel ?? 72;
}

function makeBlankLayout(sample) {
  return {
    ...structuredClone(sample),
    tokenId: 1,
    name: "Mechanical Canvas Draft",
    placements: [],
    connections: []
  };
}

function setNftPreviewState(enabled, message) {
  const actual = editor.setNftPreview(enabled);
  app.classList.toggle("nft-preview-mode", actual);
  el("nftPreview").classList.toggle("active", actual);
  el("nftPreview").textContent = actual ? "Back To Edit" : "NFT Preview";
  if (message) setStatus(message);
  return actual;
}

function forceEditMode() {
  setNftPreviewState(false);
}

function loadLayoutIntoEditor(layout, message) {
  editor.setLayout(layout);
  forceEditMode();
  syncLiquidControls(editor.layout);
  syncAppearanceControls(editor.layout);
  setStatus(message);
}

async function loadLamReviewToken(tokenId = liveReview.tokenId) {
  liveReview.tokenId = clampLamToken(tokenId);
  syncLiveReviewControls();
  const layout = await loadLamPfpLayout(liveReview.tokenId);
  el("tokenId").value = liveReview.tokenId;
  loadLayoutIntoEditor(layout, `Loaded Living Archive Machine #${liveReview.tokenId}.`);
  applyLiveReviewState();
}

async function saveOffChain() {
  const layout = editor.exportLayoutObject();
  const json = JSON.stringify(layout, null, 2);
  const hash = await sha256Hex(json);
  saveDraft(layout);
  editor.dirty = false;
  el("layoutURI").value = el("layoutURI").value || `local://layout-${hash.slice(0, 16)}`;
  setStatus(
    "Saved full layout JSON off-chain/local.",
    JSON.stringify({ storage: "localStorage", layoutHash: `0x${hash}`, placements: layout.placements.length }, null, 2)
  );
}

async function prepareOrPublish() {
  const validation = editor.validateForPublish();
  if (!validation.ok) {
    const names = validation.locked.map((p) => `${p.key}#${p.id}`).join(", ");
    setStatus(
      `Cannot publish: ${validation.locked.length} locked part(s) need ownership.`,
      `Locked preview placements blocked from on-chain publish:\n${names}`
    );
    return;
  }

  const layoutJson = editor.exportJSON();
  const hash = await sha256Hex(layoutJson);
  const layoutHash = `0x${hash}`;
  const contractAddress = el("contractAddress").value.trim();
  const tokenId = Number(el("tokenId").value || editor.layout.tokenId || 1);
  const layoutURI = el("layoutURI").value.trim();

  if (!contractAddress) {
    setStatus(
      "Validated build; ready to upload JSON and sign a compact reference.",
      JSON.stringify({
        tokenId,
        layoutUri: layoutURI || `pending-upload://sha256-${hash.slice(0, 16)}`,
        layoutHash,
        partCount: validation.layout.placements.length,
        onChainStores: ["layoutURI", "layoutHash", "partCount"]
      }, null, 2)
    );
    return;
  }

  if (!layoutURI) {
    setStatus("Paste an uploaded layout URI before signing.");
    return;
  }

  try {
    const result = await publishBuild(contractAddress, tokenId, layoutURI, layoutJson);
    editor.dirty = false;
    setStatus("Published build reference on-chain.", JSON.stringify(result, null, 2));
  } catch (error) {
    setStatus(error.message);
  }
}

function bindLiveReviewControls() {
  syncLiveReviewControls();

  el("prevLamToken").addEventListener("click", () => {
    void loadLamReviewToken(liveReview.tokenId - 1);
  });

  el("nextLamToken").addEventListener("click", () => {
    void loadLamReviewToken(liveReview.tokenId + 1);
  });

  el("lamTokenInput").addEventListener("change", () => {
    void loadLamReviewToken(el("lamTokenInput").value);
  });

  for (const id of ["testGasMode", "testBondDays", "testSaleCount", "testSaleTier", "testTransfers", "testScarColor"]) {
    const control = el(id);
    control.addEventListener("input", () => {
      readLiveReviewControls();
      applyLiveReviewState();
    });
    control.addEventListener("change", () => {
      readLiveReviewControls();
      syncLiveReviewControls();
      applyLiveReviewState();
    });
  }

  el("loadLamLive").addEventListener("click", () => {
    void loadLamReviewToken(el("lamTokenInput").value);
  });

  el("openRenderPreview").addEventListener("click", () => {
    window.open(renderPreviewUrl(), "_blank", "noopener,noreferrer");
    setStatus("Opened render view with current live-test settings.");
  });

  window.addEventListener("keydown", (event) => {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    void loadLamReviewToken(liveReview.tokenId + delta);
  });
}

function bindButtons() {
  el("loadSample").addEventListener("click", async () => {
    const sample = await loadSampleLayout();
    loadLayoutIntoEditor(sample, "Loaded normal editable starter canvas.");
  });

  el("blankCanvas").addEventListener("click", async () => {
    const sample = await loadSampleLayout();
    loadLayoutIntoEditor(makeBlankLayout(sample), "Loaded blank editable canvas.");
  });

  el("loadBird").addEventListener("click", async () => {
    const bird = await loadBirdLayout();
    loadLayoutIntoEditor(bird, "Loaded mechanical bird example with all parts unlocked.");
  });

  el("loadSwan").addEventListener("click", async () => {
    const swan = await loadSwanLayout();
    loadLayoutIntoEditor(swan, "Loaded mechanical swan example with all parts unlocked.");
  });

  el("loadButterfly").addEventListener("click", async () => {
    const butterfly = await loadButterflyLayout();
    loadLayoutIntoEditor(butterfly, "Loaded mechanical butterfly example with all parts unlocked.");
  });

  el("loadPortrait").addEventListener("click", async () => {
    const portrait = await loadPortraitLayout();
    loadLayoutIntoEditor(portrait, "Loaded mechanical portrait example with all parts unlocked.");
  });

  el("loadDragon").addEventListener("click", async () => {
    const dragon = await loadDragonLayout();
    loadLayoutIntoEditor(dragon, "Loaded mechanical dragon head example with all parts unlocked.");
  });

  el("loadDiamond").addEventListener("click", async () => {
    const diamond = await loadDiamondLayout();
    loadLayoutIntoEditor(diamond, "Loaded mechanical diamond example with all parts unlocked.");
  });

  el("loadLamPfp").addEventListener("click", async () => {
    await loadLamReviewToken(liveReview.tokenId);
  });

  el("resetCanvas").addEventListener("click", async () => {
    const sample = await loadSampleLayout();
    loadLayoutIntoEditor(sample, "Canvas reset to starter machine.");
  });

  el("loadLocal").addEventListener("click", () => {
    const draft = loadDraft();
    if (!draft) return setStatus("No local draft found.");
    editor.setLayout(draft);
    forceEditMode();
    syncLiquidControls(editor.layout);
    syncAppearanceControls(editor.layout);
    editor.dirty = false;
    setStatus("Loaded local off-chain draft.");
  });

  el("saveOffChain").addEventListener("click", saveOffChain);
  el("publishBuild").addEventListener("click", prepareOrPublish);
  el("snapToggle").addEventListener("change", (event) => editor.setSnap(event.target.checked));
  el("zoomOut").addEventListener("click", () => editor.zoomBy(0.8));
  el("zoomIn").addEventListener("click", () => editor.zoomBy(1.25));
  el("zoomReset").addEventListener("click", () => editor.resetViewport());

  el("previewMotion").addEventListener("click", () => {
    const enabled = editor.togglePreviewMotion();
    el("previewMotion").classList.toggle("active", enabled);
    el("previewMotion").textContent = enabled ? "Preview Motion" : "Motion Paused";
    setStatus(enabled ? "Motion preview active." : "Motion preview paused.");
  });

  el("nftPreview").addEventListener("click", () => {
    const enabled = setNftPreviewState(!editor.nftPreview);
    setStatus(enabled ? "NFT preview: editor helper lines hidden." : "Edit mode: selection and connection helpers visible.");
  });

  el("exportLayout").addEventListener("click", () => {
    download(`mechanical-canvas-${editor.layout.tokenId || "draft"}.json`, editor.exportJSON());
    setStatus("Exported full layout JSON.");
  });

  el("importLayout").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imported = JSON.parse(await file.text());
    editor.setLayout(imported);
    forceEditMode();
    syncLiquidControls(editor.layout);
    syncAppearanceControls(editor.layout);
    setStatus(`Imported ${file.name}.`);
    event.target.value = "";
  });

  el("connectWallet").addEventListener("click", async () => {
    try {
      const { address } = await connectWallet();
      setStatus(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}.`);
    } catch (error) {
      setStatus(error.message);
    }
  });

  el("readChainState").addEventListener("click", async () => {
    try {
      const state = await readMachineState(el("contractAddress").value, Number(el("tokenId").value));
      editor.setChainState(state);
      el("chainOutput").textContent = JSON.stringify(state, null, 2);
      setStatus("Read on-chain machine state.");
    } catch (error) {
      setStatus(error.message);
    }
  });
}

function bindPartsTrayScroll() {
  const tray = el("partsLibrary");
  const left = el("partsScrollLeft");
  const right = el("partsScrollRight");
  let drag = null;

  const scrollAmount = () => Math.max(360, Math.floor(tray.clientWidth * 0.72));
  const updateButtons = () => {
    left.disabled = tray.scrollLeft <= 1;
    right.disabled = tray.scrollLeft + tray.clientWidth >= tray.scrollWidth - 1;
  };

  left.addEventListener("click", () => tray.scrollBy({ left: -scrollAmount(), behavior: "smooth" }));
  right.addEventListener("click", () => tray.scrollBy({ left: scrollAmount(), behavior: "smooth" }));
  tray.addEventListener("scroll", updateButtons, { passive: true });

  tray.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    tray.scrollLeft += event.deltaY;
  }, { passive: false });

  tray.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".part-card")) return;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: tray.scrollLeft,
      moved: false
    };
    tray.classList.add("dragging");
    tray.setPointerCapture(event.pointerId);
  });

  tray.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    tray.scrollLeft = drag.startScroll - dx;
  });

  const endDrag = (event) => {
    if (!drag) return;
    if (drag.moved) {
      tray.classList.add("suppress-card-click");
      setTimeout(() => tray.classList.remove("suppress-card-click"), 0);
    }
    tray.classList.remove("dragging");
    try { tray.releasePointerCapture(event.pointerId); } catch {}
    drag = null;
  };

  tray.addEventListener("pointerup", endDrag);
  tray.addEventListener("pointercancel", endDrag);
  tray.addEventListener("click", (event) => {
    if (tray.classList.contains("suppress-card-click")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  requestAnimationFrame(updateButtons);
  window.addEventListener("resize", updateButtons);
}

async function boot() {
  const sample = await loadSampleLayout();
  const shouldAutoLoadLam = urlParams.has("lam") || urlParams.has("token") || urlParams.has("tokenId");
  const initialLayout = shouldAutoLoadLam ? await loadLamPfpLayout(liveReview.tokenId) : sample;
  fillSelect(el("liquidType"), LIQUID_TYPES);
  fillSelect(el("liquidTexture"), LIQUID_TEXTURES);

  editor = new MechanicalEditor(canvas, initialLayout);
  window.editor = editor;

  editor.onSelectionChange = syncInspector;
  editor.onLayoutChange = (layout) => {
    syncLiquidControls(layout);
    syncAppearanceControls(layout);
    syncStatus();
  };
  editor.onViewportChange = syncViewport;
  editor.onStatus = setStatus;

  renderPartsLibrary(el("partsLibrary"), (key) => {
    const added = editor.addPart(key);
    if (added?.locked) {
      setStatus(`${added.key} added as a locked preview. It will not publish until owned.`);
    }
  }, editor.ownedPartIds);

  bindInspector();
  bindAppearanceControls();
  bindLiquidControls();
  bindLiveReviewControls();
  bindButtons();
  bindPartsTrayScroll();
  syncLiquidControls(editor.layout);
  syncAppearanceControls(editor.layout);
  syncViewport(editor.viewport);
  syncStatus();
  applyLiveReviewState();
  if (shouldAutoLoadLam) {
    el("tokenId").value = liveReview.tokenId;
    setStatus(`Loaded Living Archive Machine #${liveReview.tokenId}.`);
    applyLiveReviewState();
  }
}

boot().catch((error) => {
  document.body.innerHTML = `<pre style="color:#8b2e2e">${error.stack || error.message}</pre>`;
});
