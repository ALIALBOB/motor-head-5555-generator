import { drawMachine } from "./renderer.js";
import {
  PARTS,
  drawPartPreview,
  getConnectors,
  getPart,
  getPartRadius,
  getVisualConnectors,
  listParts,
  partBounds
} from "./parts.js";
import { CANVAS_MODES, MATERIAL_OPTIONS, MATERIALS, SHADE_STYLES } from "./schema.js";

const RETIRED_CANVAS_PARTS = new Set([
  "tank.core",
  "drive.chain",
  "valve.steam",
  "pipe.ghost",
  "pipe.elbow.segment",
  "rig.pulley"
]);

const LAM_PLACEMENT_FIELDS = [
  "assembly",
  "blink",
  "cleanPlate",
  "counterLabel",
  "counterStyle",
  "expression",
  "facePart",
  "lifeRotation",
  "liveGasMeter",
  "motion",
  "packIcon",
  "packShape",
  "peek",
  "peekClipBottom",
  "role",
  "start",
  "static",
  "target",
  "traitLayer"
];

/*
  MechanicalEditor stores the full freeform layout off-chain as JSON.
  Starter and owned placements can move without wallet interaction. Locked
  placements are allowed as local previews and blocked at publish time.
*/

export class MechanicalEditor {
  constructor(canvas, layout, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    const defaultOwnedPartIds = options.unlockAllParts === false
      ? listParts().filter((part) => part.owned).map((part) => part.key)
      : Object.keys(PARTS);
    this.ownedPartIds = new Set(options.ownedPartIds || defaultOwnedPartIds);
    this.layout = this.hydrateLayout(layout);
    this.chainState = {};
    this.connections = [];
    this.selectedId = null;
    this.drag = null;
    this.spaceDown = false;
    this.viewport = {
      zoom: 1,
      panX: 0,
      panY: 0,
      minZoom: 0.08,
      maxZoom: 12
    };
    this.snap = false;
    this.previewMotion = true;
    this.nftPreview = false;
    this.mouseLook = { active: false, x: this.canvas.width / 2, y: this.canvas.height / 2 };
    this.dirty = true;
    this.lastFrameAt = 0;
    this.liveFrameMs = 1000 / 30;
    this.dragFrameMs = 1000 / 45;
    this.stillFrameMs = 1000 / 12;
    this.onSelectionChange = () => {};
    this.onLayoutChange = () => {};
    this.onViewportChange = () => {};
    this.onStatus = () => {};

    this.resizeObserver = new ResizeObserver(() => {
      this.applyViewport();
      this.requestRender();
    });
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.applyViewport();
    this.bindEvents();
    this.computeConnections();
    this.loop();
  }

  hydrateLayout(layout) {
    const clone = structuredClone(layout || {});
    clone.schema = clone.schema || "mechanical-canvas-layout/v1";
    clone.version = clone.version || 1;
    clone.tokenId = clone.tokenId || 1;
    clone.canvas = {
      width: clone.canvas?.width || 1600,
      height: clone.canvas?.height || 1100,
      style: clone.canvas?.style || "blueprint-ink-white",
      baseCanvas: clone.canvas?.baseCanvas || clone.canvas?.type || "kinetic-frame",
      mode: normalizeCanvasMode(clone.canvas?.mode || clone.canvas?.canvasMode || clone.canvas?.style),
      shadeStyle: normalizeShadeStyle(clone.canvas?.shadeStyle || clone.shadeStyle || "pencilSketch")
    };
    clone.defaults = {
      material: normalizeMaterial(clone.defaults?.material || clone.defaultMaterial || "graphiteInk"),
      shadeStyle: normalizeShadeStyle(clone.defaults?.shadeStyle || clone.canvas?.shadeStyle || "pencilSketch")
    };
    clone.liquid = {
      type: clone.liquid?.type || "Blue Coolant",
      texture: clone.liquid?.texture || "Bubbly",
      colorIndex: clone.liquid?.colorIndex ?? 1,
      fillLevel: clone.liquid?.fillLevel ?? 72
    };
    clone.placements = (clone.placements || [])
      .filter((placement) => !RETIRED_CANVAS_PARTS.has(placement.key || placement.partKey))
      .map((placement, index) => this.hydratePlacement(placement, index, clone.defaults));
    clone.connections = [];
    return clone;
  }

  hydratePlacement(placement, index = 0, defaults = {}) {
    const key = placement.key || placement.partKey || "gear.small";
    const def = getPart(key) || PARTS["gear.small"];
    const owned = this.ownedPartIds.has(key) || Boolean(placement.owned) || Boolean(def.owned);
    const scale = this.normalizePlacementScale(
      key,
      Number(placement.scaleX ?? placement.scale ?? 1),
      Number(placement.scaleY ?? placement.scale ?? 1)
    );

    const hydrated = {
      id: placement.id ?? placement.placementId ?? index + 1,
      placementId: placement.placementId ?? placement.id ?? index + 1,
      partId: placement.partId ?? def.id,
      key,
      x: Number(placement.x ?? 800),
      y: Number(placement.y ?? 550),
      rotation: Number(placement.rotation || 0),
      scaleX: scale.x,
      scaleY: scale.y,
      z: Number(placement.z ?? placement.zIndex ?? index + 1),
      zIndex: Number(placement.zIndex ?? placement.z ?? index + 1),
      material: normalizeMaterial(placement.material || defaults.material || "graphiteInk"),
      shadeStyle: normalizeShadeStyle(placement.shadeStyle || placement.shade || defaults.shadeStyle || "pencilSketch"),
      colorVariant: placement.colorVariant ?? this.layout?.liquid?.colorIndex ?? 1,
      opacity: placement.opacity ?? 1,
      flipX: Boolean(placement.flipX),
      flipY: Boolean(placement.flipY),
      motion: placement.motion,
      static: placement.static,
      lifeRotation: placement.lifeRotation,
      owned,
      locked: owned ? false : Boolean(placement.locked ?? true)
    };

    for (const field of LAM_PLACEMENT_FIELDS) {
      if (placement[field] !== undefined) hydrated[field] = structuredClone(placement[field]);
    }

    return hydrated;
  }

  normalizePlacementScale(key, scaleX, scaleY) {
    const def = getPart(key);
    if (def?.kind !== "pipe") return { x: scaleX, y: scaleY };
    const max = key === "pipe.elbow" ? 1.12 : 1.25;
    return {
      x: clamp(scaleX, 0.15, max),
      y: clamp(scaleY, 0.15, max)
    };
  }

  setLayout(layout) {
    this.layout = this.hydrateLayout(layout);
    this.selectedId = null;
    this.dirty = true;
    this.resetViewport();
    this.computeConnections();
    this.onSelectionChange(null);
    this.onLayoutChange(this.layout);
    this.requestRender();
  }

  setChainState(state) {
    this.chainState = { ...this.chainState, ...state };
  }

  setSnap(enabled) {
    this.snap = enabled;
  }

  applyViewport() {
    const { zoom, panX, panY } = this.viewport;
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    this.canvas.dataset.zoom = String(Math.round(zoom * 100));
    this.onViewportChange({ ...this.viewport });
  }

  setZoom(nextZoom, anchorClientX, anchorClientY) {
    const stageRect = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
    const anchorX = anchorClientX ?? stageRect.left + stageRect.width / 2;
    const anchorY = anchorClientY ?? stageRect.top + stageRect.height / 2;
    const before = this.clientToCanvas(anchorX, anchorY);
    const zoom = clamp(nextZoom, this.viewport.minZoom, this.viewport.maxZoom);
    const baseX = before.x / Math.max(1, this.canvas.width) * Math.max(1, this.canvas.clientWidth);
    const baseY = before.y / Math.max(1, this.canvas.height) * Math.max(1, this.canvas.clientHeight);
    this.viewport.zoom = zoom;
    this.viewport.panX = anchorX - stageRect.left - baseX * zoom;
    this.viewport.panY = anchorY - stageRect.top - baseY * zoom;
    this.applyViewport();
  }

  zoomBy(factor, anchorClientX, anchorClientY) {
    this.setZoom(this.viewport.zoom * factor, anchorClientX, anchorClientY);
  }

  resetViewport() {
    this.viewport.zoom = 1;
    this.viewport.panX = 0;
    this.viewport.panY = 0;
    this.applyViewport();
  }

  panViewport(deltaX, deltaY) {
    this.viewport.panX += deltaX;
    this.viewport.panY += deltaY;
    this.applyViewport();
  }

  get selected() {
    return this.layout.placements.find((p) => p.id === this.selectedId) || null;
  }

  addPart(key) {
    const def = getPart(key);
    if (!def) return null;
    const nextId = Math.max(0, ...this.layout.placements.map((p) => p.id || 0)) + 1;
    const stageRect = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
    const center = this.clientToCanvas(stageRect.left + stageRect.width / 2, stageRect.top + stageRect.height / 2);
    const owned = this.ownedPartIds.has(key) || Boolean(def.owned);
    const part = {
      id: nextId,
      placementId: nextId,
      partId: def.id,
      key,
      x: center.x,
      y: center.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      z: Math.max(0, ...this.layout.placements.map((p) => p.z || 0)) + 1,
      zIndex: Math.max(0, ...this.layout.placements.map((p) => p.zIndex || p.z || 0)) + 1,
      material: normalizeMaterial(this.layout.defaults?.material || "graphiteInk"),
      shadeStyle: normalizeShadeStyle(this.layout.defaults?.shadeStyle || this.layout.canvas?.shadeStyle || "pencilSketch"),
      colorVariant: this.layout.liquid?.colorIndex || 1,
      opacity: 1,
      flipX: false,
      flipY: false,
      owned,
      locked: !owned
    };
    this.layout.placements.push(part);
    this.select(part.id);
    this.changed();
    return part;
  }

  duplicateSelected() {
    if (!this.selected) return;
    const def = getPart(this.selected.key);
    if (def && def.canDuplicate === false) {
      this.onStatus("This starter rule does not duplicate that part.");
      return;
    }
    const nextId = Math.max(0, ...this.layout.placements.map((p) => p.id || 0)) + 1;
    const copy = {
      ...structuredClone(this.selected),
      id: nextId,
      placementId: nextId,
      x: this.selected.x + 28,
      y: this.selected.y + 28,
      z: Math.max(0, ...this.layout.placements.map((p) => p.z || 0)) + 1
    };
    copy.zIndex = copy.z;
    this.layout.placements.push(copy);
    this.select(copy.id);
    this.changed();
  }

  deleteSelected() {
    if (!this.selected) return;
    this.layout.placements = this.layout.placements.filter((p) => p.id !== this.selectedId);
    this.selectedId = null;
    this.onSelectionChange(null);
    this.changed();
  }

  adjustSelectedZ(delta) {
    if (!this.selected) return;
    const next = Math.max(0, (this.selected.z ?? this.selected.zIndex ?? 0) + delta);
    this.updateSelected({ z: next, zIndex: next });
  }

  updateSelected(patch) {
    const selected = this.selected;
    if (!selected) return;
    Object.assign(selected, patch);
    if (patch.z !== undefined && patch.zIndex === undefined) selected.zIndex = patch.z;
    if (patch.zIndex !== undefined && patch.z === undefined) selected.z = patch.zIndex;
    this.onSelectionChange(selected);
    this.changed();
  }

  select(id) {
    this.selectedId = id;
    this.onSelectionChange(this.selected);
    this.requestRender();
  }

  changed() {
    this.dirty = true;
    this.computeConnections();
    this.onLayoutChange(this.layout);
    this.requestRender();
  }

  togglePreviewMotion() {
    this.previewMotion = !this.previewMotion;
    this.requestRender();
    return this.previewMotion;
  }

  setNftPreview(enabled) {
    this.nftPreview = Boolean(enabled);
    if (this.nftPreview) {
      this.drag = null;
      this.canvas.classList.remove("dragging");
    }
    this.requestRender();
    return this.nftPreview;
  }

  setCanvasMode(mode) {
    this.layout.canvas.mode = normalizeCanvasMode(mode);
    this.layout.canvas.style = this.layout.canvas.mode;
    this.changed();
  }

  setDefaultMaterial(material) {
    this.layout.defaults = this.layout.defaults || {};
    this.layout.defaults.material = normalizeMaterial(material);
    this.changed();
  }

  setDefaultShadeStyle(shadeStyle) {
    this.layout.defaults = this.layout.defaults || {};
    this.layout.defaults.shadeStyle = normalizeShadeStyle(shadeStyle);
    this.layout.canvas.shadeStyle = this.layout.defaults.shadeStyle;
    this.changed();
  }

  computeConnections() {
    const placements = this.layout.placements || [];
    const conns = [];
    const isGearLike = (kind) => kind === "gear" || kind === "bevel";
    const rotary = placements.filter((p) => {
      const kind = getPart(p.key)?.kind;
      return isGearLike(kind) || kind === "wheel";
    });

    for (let i = 0; i < rotary.length; i++) {
      for (let j = i + 1; j < rotary.length; j++) {
        const a = rotary[i];
        const b = rotary[j];
        const defA = getPart(a.key);
        const defB = getPart(b.key);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const target = getPartRadius(a) + getPartRadius(b);
        const active = !a.locked && !b.locked;

        if (isGearLike(defA?.kind) && isGearLike(defB?.kind) && Math.abs(d - target) < 28) {
          conns.push({ id: `gear-${a.id}-${b.id}`, type: "gearMesh", from: a.id, to: b.id, active });
        } else if (d > target + 32 && d < target + 260) {
          conns.push({ id: `belt-${a.id}-${b.id}`, type: "belt", from: a.id, to: b.id, active });
        }
      }
    }

    const pipeConnectors = placements.flatMap((part) => getConnectors(part));
    for (let i = 0; i < pipeConnectors.length; i++) {
      for (let j = i + 1; j < pipeConnectors.length; j++) {
        const a = pipeConnectors[i];
        const b = pipeConnectors[j];
        if (a.placementId === b.placementId || a.kind !== b.kind) continue;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 34) {
          const from = placements.find((p) => p.id === a.placementId);
          const to = placements.find((p) => p.id === b.placementId);
          conns.push({
            id: `pipe-${a.placementId}-${a.id}-${b.placementId}-${b.id}`,
            type: "pipe",
            from: a.placementId,
            fromConnector: a.id,
            to: b.placementId,
            toConnector: b.id,
            a,
            b,
            active: Boolean(from && to && !from.locked && !to.locked)
          });
        }
      }
    }

    this.connections = conns;
    this.layout.connections = conns.map((conn) => ({
      fromPlacementId: conn.from,
      fromConnector: conn.fromConnector,
      toPlacementId: conn.to,
      toConnector: conn.toConnector,
      type: conn.type,
      active: conn.active
    }));
    return conns;
  }

  validateForPublish() {
    const layout = this.exportLayoutObject();
    const locked = layout.placements.filter((p) => p.locked || !p.owned);
    return { ok: locked.length === 0, locked, layout };
  }

  exportLayoutObject() {
    this.computeConnections();
    return {
      schema: "mechanical-canvas-layout/v1",
      version: 1,
      tokenId: this.layout.tokenId || 1,
      name: this.layout.name || `Mechanical Canvas #${String(this.layout.tokenId || 1).padStart(4, "0")}`,
      canvas: {
        width: this.layout.canvas?.width || 1600,
        height: this.layout.canvas?.height || 1100,
        style: this.layout.canvas?.mode || this.layout.canvas?.style || "whiteBlueprint",
        baseCanvas: this.layout.canvas?.baseCanvas || "kinetic-frame",
        mode: normalizeCanvasMode(this.layout.canvas?.mode),
        shadeStyle: normalizeShadeStyle(this.layout.canvas?.shadeStyle || this.layout.defaults?.shadeStyle || "pencilSketch")
      },
      defaults: {
        material: normalizeMaterial(this.layout.defaults?.material || "graphiteInk"),
        shadeStyle: normalizeShadeStyle(this.layout.defaults?.shadeStyle || this.layout.canvas?.shadeStyle || "pencilSketch")
      },
      liquid: { ...(this.layout.liquid || {}) },
      placements: this.layout.placements.map((placement) => ({
        ...placement,
        material: normalizeMaterial(placement.material || "graphiteInk"),
        shadeStyle: normalizeShadeStyle(placement.shadeStyle || this.layout.defaults?.shadeStyle || "pencilSketch"),
        placementId: placement.placementId ?? placement.id,
        zIndex: placement.zIndex ?? placement.z ?? 0,
        z: placement.z ?? placement.zIndex ?? 0,
        owned: Boolean(placement.owned),
        locked: Boolean(placement.locked)
      })),
      connections: this.layout.connections || [],
      updatedAt: new Date().toISOString()
    };
  }

  exportJSON() {
    return JSON.stringify(this.exportLayoutObject(), null, 2);
  }

  bindEvents() {
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    this.canvas.addEventListener("pointerdown", (event) => {
      this.mouseLook = { active: true, ...this.eventToCanvas(event) };
      const panIntent = event.button === 1 || event.button === 2 || event.altKey || this.spaceDown;
      if (panIntent) {
        event.preventDefault();
        this.drag = {
          mode: "pan",
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          panX: this.viewport.panX,
          panY: this.viewport.panY
        };
        this.canvas.classList.add("panning");
        this.canvas.setPointerCapture(event.pointerId);
        return;
      }

      if (this.nftPreview) return;
      const pos = this.eventToCanvas(event);
      const hit = this.hitTest(pos.x, pos.y);
      this.select(hit?.id || null);
      if (hit) {
        this.drag = {
          mode: event.shiftKey ? "rotate" : "move",
          startX: pos.x,
          startY: pos.y,
          partX: hit.x,
          partY: hit.y,
          partRotation: hit.rotation || 0
        };
        this.canvas.classList.add("dragging");
        this.canvas.setPointerCapture(event.pointerId);
      }
    });

    this.canvas.addEventListener("pointermove", (event) => {
      this.mouseLook = { active: true, ...this.eventToCanvas(event) };
      if (this.previewMotion || this.nftPreview) this.requestRender();
      if (!this.drag) return;
      if (this.drag.mode === "pan") {
        this.viewport.panX = this.drag.panX + event.clientX - this.drag.startClientX;
        this.viewport.panY = this.drag.panY + event.clientY - this.drag.startClientY;
        this.applyViewport();
        this.requestRender();
        return;
      }
      if (this.nftPreview || !this.selected) return;
      const pos = this.eventToCanvas(event);
      const selected = this.selected;

      if (this.drag.mode === "move") {
        let x = this.drag.partX + (pos.x - this.drag.startX);
        let y = this.drag.partY + (pos.y - this.drag.startY);
        if (this.snap) {
          x = Math.round(x / 16) * 16;
          y = Math.round(y / 16) * 16;
        }
        selected.x = x;
        selected.y = y;
      } else {
        selected.rotation = this.drag.partRotation + Math.atan2(pos.y - selected.y, pos.x - selected.x);
      }

      this.onSelectionChange(selected);
      this.changed();
    });

    this.canvas.addEventListener("pointerleave", () => {
      this.mouseLook = { ...this.mouseLook, active: false };
    });

    this.canvas.addEventListener("pointerup", (event) => {
      this.canvas.classList.remove("dragging");
      this.canvas.classList.remove("panning");
      this.drag = null;
      try { this.canvas.releasePointerCapture(event.pointerId); } catch {}
    });

    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey || !this.selected || this.nftPreview) {
        this.zoomBy(event.deltaY < 0 ? 1.12 : 0.88, event.clientX, event.clientY);
        return;
      }
      const factor = event.deltaY < 0 ? 1.06 : 0.94;
      this.selected.scaleX = clamp(this.selected.scaleX * factor, 0.15, 4);
      this.selected.scaleY = clamp(this.selected.scaleY * factor, 0.15, 4);
      this.onSelectionChange(this.selected);
      this.changed();
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        this.spaceDown = true;
        this.canvas.classList.add("pan-ready");
        return;
      }
      if (this.nftPreview) return;
      const key = event.key.toLowerCase();
      if (key === "delete" || key === "backspace") this.deleteSelected();
      if (key === "r" && this.selected) this.updateSelected({ rotation: (this.selected.rotation || 0) + Math.PI / 18 });
      if ((event.ctrlKey || event.metaKey) && key === "d") {
        event.preventDefault();
        this.duplicateSelected();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.code !== "Space") return;
      this.spaceDown = false;
      this.canvas.classList.remove("pan-ready");
    });
  }

  eventToCanvas(event) {
    return this.clientToCanvas(event.clientX, event.clientY);
  }

  clientToCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * this.canvas.width,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * this.canvas.height
    };
  }

  hitTest(x, y) {
    const sorted = [...this.layout.placements].sort((a, b) => (b.z ?? b.zIndex ?? 0) - (a.z ?? a.zIndex ?? 0));
    for (const part of sorted) {
      const bounds = partBounds(part);
      const sizeX = bounds.w * Math.abs(part.scaleX || 1) / 2;
      const sizeY = bounds.h * Math.abs(part.scaleY || 1) / 2;
      if (Math.abs(x - part.x) <= sizeX && Math.abs(y - part.y) <= sizeY) return part;
    }
    return null;
  }

  render() {
    drawMachine(this.ctx, this.layout, this.chainState, {
      selected: this.selected,
      connections: this.connections,
      previewMotion: this.previewMotion,
      editMode: !this.nftPreview,
      mouseLook: this.mouseLook,
      mouseLeanInEdit: this.nftPreview,
      shadeStyle: this.layout.canvas?.shadeStyle || this.layout.defaults?.shadeStyle || "pencilSketch",
      visualConnectors: this.selected ? getVisualConnectors(this.selected) : []
    });
    this.dirty = false;
  }

  loop() {
    const now = performance.now();
    const liveMotion = this.previewMotion && !document.hidden;
    const dragging = Boolean(this.drag);
    const targetFrameMs = dragging ? this.dragFrameMs : liveMotion ? this.liveFrameMs : this.stillFrameMs;
    if ((this.dirty || liveMotion || dragging) && now - this.lastFrameAt >= targetFrameMs) {
      this.lastFrameAt = now;
      this.render();
    }
    requestAnimationFrame(() => this.loop());
  }

  requestRender() {
    this.dirty = true;
  }
}

export function renderPartsLibrary(container, onPick, ownedPartIds = new Set()) {
  container.innerHTML = "";
  for (const part of listParts()) {
    const owned = ownedPartIds.has(part.key) || Boolean(part.owned);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `part-card ${owned ? "owned" : "locked"}`;
    button.innerHTML = `
      <span class="state-mark">${owned ? "OK" : "LOCK"}</span>
      <canvas width="176" height="104"></canvas>
      <b title="${part.label}">${part.label}</b>
      <small>${owned ? "OWNED" : "PREMIUM"}</small>
    `;
    button.addEventListener("click", () => onPick(part.key));
    container.appendChild(button);
    drawPartPreview(button.querySelector("canvas").getContext("2d"), part.key, owned);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMaterial(material) {
  const aliases = {
    ink: "graphiteInk",
    iron: "rustedIron",
    black: "blackChrome",
    blueSteel: "blueprintSteel",
    bone: "boneWhite",
    gold: "goldRelic"
  };
  const id = aliases[material] || material || "graphiteInk";
  return MATERIAL_OPTIONS.some((option) => option.id === id) || MATERIALS[id] ? id : "graphiteInk";
}

function normalizeShadeStyle(shadeStyle) {
  const id = shadeStyle || "pencilSketch";
  return SHADE_STYLES.some((option) => option.id === id) ? id : "pencilSketch";
}

function normalizeCanvasMode(mode) {
  const aliases = {
    "blueprint-ink-white": "whiteBlueprint",
    blueprint: "whiteBlueprint",
    white: "whiteBlueprint",
    terminal: "darkTerminal",
    rust: "rustArchive",
    glass: "labGlass"
  };
  const id = aliases[mode] || mode || "whiteBlueprint";
  return CANVAS_MODES.some((option) => option.id === id) ? id : "whiteBlueprint";
}
