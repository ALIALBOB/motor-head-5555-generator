// Regenerates the frozen on-chain catalog (the itemId/colorwayId registry) from a catalog
// dump captured off the running site (window.__MH_CATALOG_DUMP__ = { items, colorways }).
//
// APPEND-ONLY: existing ids keep their exact position forever (itemId/colorwayId are
// PERMANENT once a holder saves on-chain). New items are appended; retired items keep their
// slot reserved (never reused). itemId = items.indexOf(key) + 1; colorwayId likewise.
//
// Usage: node renderer/generate-catalog.cjs <catalog-dump.json>
const fs = require("fs");
const path = require("path");

const CATALOG = path.join(__dirname, "catalog.json");
const dumpPath = process.argv[2];
if (!dumpPath) {
  console.error("usage: node renderer/generate-catalog.cjs <catalog-dump.json>");
  process.exit(1);
}

const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
const existing = fs.existsSync(CATALOG) ? JSON.parse(fs.readFileSync(CATALOG, "utf8")) : { items: [], colorways: [] };

function mergeAppendOnly(existingArr, incomingIds, label) {
  const out = [...existingArr];
  const seen = new Set(existingArr);
  let added = 0;
  for (const id of incomingIds) {
    if (!id) continue;
    if (!seen.has(id)) { out.push(id); seen.add(id); added += 1; }
  }
  const incoming = new Set(incomingIds);
  const retired = existingArr.filter((id) => !incoming.has(id));
  console.log(`${label}: ${existingArr.length} existing, +${added} new, ${retired.length} retired (slots reserved)`);
  return out;
}

const items = mergeAppendOnly(existing.items || [], (dump.items || []).map((i) => i.id), "items");
const colorways = mergeAppendOnly(existing.colorways || [], (dump.colorways || []).map((c) => c.id), "colorways");

const catalog = {
  note: "Frozen on-chain catalog. itemId = items.indexOf(key)+1; colorwayId = colorways.indexOf(key)+1. APPEND-ONLY — never reorder or delete (ids are permanent on-chain). Regenerate via generate-catalog.cjs.",
  items,
  colorways,
};
fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
console.log(`wrote ${path.basename(CATALOG)}: ${items.length} items, ${colorways.length} colorways`);
