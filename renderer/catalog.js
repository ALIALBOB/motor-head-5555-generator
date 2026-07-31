// The on-chain catalog codec — the single source of truth both sides share:
//   • the SAVE UI uses encodeLayout() to turn a canvas layout into contract Part[] (numeric)
//   • the RENDERER uses decodeLayout() to turn on-chain Part[] back into drawable item keys
//
// itemId / colorwayId map to the frozen, append-only registry in catalog.json (id = index+1;
// 0 means "unknown/none"). Because ids are permanent on-chain, catalog.json is never reordered.

const catalog = require("./catalog.json");

const itemKeyToId = new Map(catalog.items.map((key, i) => [key, i + 1]));
const itemIdToKey = new Map(catalog.items.map((key, i) => [i + 1, key]));
const colorwayKeyToId = new Map(catalog.colorways.map((key, i) => [key, i + 1]));
const colorwayIdToKey = new Map(catalog.colorways.map((key, i) => [i + 1, key]));

const itemIdOf = (key) => itemKeyToId.get(key) ?? 0;
const keyOfItemId = (id) => itemIdToKey.get(Number(id)) ?? null;
const colorwayIdOf = (key) => colorwayKeyToId.get(key) ?? 0;
const keyOfColorwayId = (id) => colorwayIdToKey.get(Number(id)) ?? null;

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));

// canvas layout item { itemId, colorwayId, transparency, x, y, scale, rotation } -> contract Part
function encodeLayout(items) {
  return (Array.isArray(items) ? items : []).map((it) => ({
    itemId: itemIdOf(it.itemId),
    x: clampInt(it.x, -2147483648, 2147483647),
    y: clampInt(it.y, -2147483648, 2147483647),
    scale: clampInt((Number(it.scale) || 1) * 1000, 0, 65535), // fixed-point, 1000 = 1.0x
    rotation: ((clampInt(it.rotation, -1e9, 1e9) % 360) + 360) % 360,
    colorwayId: colorwayIdOf(it.colorwayId),
    transparency: clampInt(it.transparency, 0, 100),
  }));
}

// contract Part -> canvas layout item (string keys the renderer/drawPart use)
function decodeLayout(parts) {
  return (Array.isArray(parts) ? parts : []).map((p) => ({
    itemId: keyOfItemId(p.itemId ?? p[0]),
    x: Number(p.x ?? p[1]),
    y: Number(p.y ?? p[2]),
    scale: Number(p.scale ?? p[3]) / 1000,
    rotation: Number(p.rotation ?? p[4]),
    colorwayId: keyOfColorwayId(p.colorwayId ?? p[5]),
    transparency: Number(p.transparency ?? p[6]),
  }));
}

module.exports = {
  itemIdOf, keyOfItemId, colorwayIdOf, keyOfColorwayId,
  encodeLayout, decodeLayout,
  COUNT: { items: catalog.items.length, colorways: catalog.colorways.length },
};
