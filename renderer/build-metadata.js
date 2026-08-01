// Renderer metadata — curates the OpenSea traits + overlays on-chain edits, on top of the
// token's ORIGINAL pinned metadata.
//
//   • Traits are CURATED: only the meaningful visual ones are kept (clutter like Alive Protocol,
//     Assembly Mode, Base DNA Locked, Renderer Version, Liquid, Core, Visual Palette, etc. dropped),
//     and "Background" is rewritten from the token's ACTUAL background color (the palette drives the
//     visible color, so the old scene-name "Background" grouped unlike-looking tokens together).
//   • name / description / image / animation_url / external_url / properties are preserved.
//   • EDITED token -> image + animation_url point at the renderer + parts attributes appended.
//
// Reversible: this only shapes what the renderer serves; the pinned originals are untouched, and
// setBaseURI back to the IPFS CID restores the old (cluttered) traits exactly.

// Kept traits, in display order. Everything else is dropped from the OpenSea attributes panel.
const KEEP_TRAITS = [
  "Head", "Chassis", "Expression", "Hat", "Clothes", "Neck Trait",
  "Chest Accessory", "Back Accessory", "Arm Item", "Background", "Golden Lucky Mint",
];
const KEEP_SET = new Set(KEEP_TRAITS);

// Nearest-named-color classifier for the real background color.
const REF = [
  ["Black", "#0d0f12"], ["Charcoal", "#3a3a3a"], ["Grey", "#9aa0a1"], ["Silver", "#c2cacb"], ["White", "#eef4f2"],
  ["Brown", "#4b2a08"], ["Bronze", "#8a5a1a"], ["Gold", "#c8912f"], ["Cream", "#e8e2cf"],
  ["Red", "#a83232"], ["Maroon", "#3e1117"], ["Orange", "#d17a28"], ["Olive", "#6b6a3a"],
  ["Green", "#3f9d4a"], ["Teal", "#2a8f8f"], ["Mint", "#cdeee6"], ["Cyan", "#4fd6de"],
  ["Blue", "#1f3fb0"], ["Sky Blue", "#a9d6ea"], ["Navy", "#141c40"], ["Purple", "#6a3ac0"], ["Violet", "#7d5cff"], ["Pink", "#d98fc6"],
];
const _rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const _REF = REF.map(([n, h]) => [n, _rgb(h)]);
function bgFamily(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const c = _rgb(hex);
  let best = null, bd = Infinity;
  for (const [n, r] of _REF) {
    const d = (c[0] - r[0]) ** 2 + (c[1] - r[1]) ** 2 + (c[2] - r[2]) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

function curateAttributes(meta) {
  const bg = meta?.properties?.visual_modifiers?.slots?.backgroundColor || meta?.properties?.visual_modifiers?.palette?.background;
  const bgName = bgFamily(bg);
  const byType = {};
  for (const a of meta?.attributes || []) if (KEEP_SET.has(a.trait_type)) byType[a.trait_type] = a;
  const out = [];
  for (const t of KEEP_TRAITS) {
    if (t === "Background") { if (bgName) out.push({ trait_type: "Background", value: bgName }); }
    else if (byType[t]) out.push(byType[t]);
  }
  return out;
}

function decodeParts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    itemId: Number(p.itemId ?? p[0]),
    x: Number(p.x ?? p[1]),
    y: Number(p.y ?? p[2]),
    scale: Number(p.scale ?? p[3]),
    rotation: Number(p.rotation ?? p[4]),
    colorwayId: Number(p.colorwayId ?? p[5]),
    transparency: Number(p.transparency ?? p[6]),
  }));
}

function curateMetadata(original, { tokenId, parts = [], buildRevision = 0, config = {} } = {}) {
  const base = original && typeof original === "object" ? { ...original } : {};
  const list = Array.isArray(parts) ? parts : [];
  let attributes = curateAttributes(base);

  if (list.length > 0) {
    const id = Number(tokenId), rev = Number(buildRevision);
    base.image = `${config.imageBaseUrl}/${id}.png?rev=${rev}`;
    base.animation_url = `${config.animationBaseUrl}/${id}.html?rev=${rev}`;
    attributes = [...attributes, { trait_type: "Custom Parts", value: list.length }, { trait_type: "Build Revision", value: rev }];
  }
  base.attributes = attributes;
  return base;
}

module.exports = { decodeParts, curateMetadata, curateAttributes, bgFamily, KEEP_TRAITS };
