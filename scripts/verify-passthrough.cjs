// PRE-FLIP CHECK: verify the renderer reproduces the pinned metadata BYTE-IDENTICALLY for
// unedited tokens. Run this (renderer pointed at prod SOURCE_META_BASE, no edits) BEFORE flipping
// the contract's baseURI to the renderer. Any DIFFER => DO NOT FLIP.
//
// Usage: node scripts/verify-passthrough.cjs [rendererBase] [pinnedBase] [id ...]
const RENDERER = (process.argv[2] || "http://127.0.0.1:8789").replace(/\/$/, "");
const PINNED = (process.argv[3] || "https://ipfs.io/ipfs/bafybeieu7bnbl7tiuim6x6gz7pcdfhkq6bh4eas3jteea7sx7kowobe6jy").replace(/\/$/, "");
const argIds = process.argv.slice(4).map(Number).filter(Boolean);
const SAMPLE = argIds.length ? argIds : [1, 42, 100, 500, 777, 1234, 3000, 4321, 5555];

async function fetchText(url, tries = 4) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) { const t = await r.text(); if (t) return t; }
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 900));
  }
  return null;
}

(async () => {
  let ok = 0, bad = 0;
  for (const id of SAMPLE) {
    const [r, p] = await Promise.all([fetchText(`${RENDERER}/meta/${id}.json`), fetchText(`${PINNED}/${id}.json`)]);
    if (r != null && p != null && r === p) { ok += 1; console.log(`token ${id}: IDENTICAL (${r.length} bytes)`); }
    else { bad += 1; console.log(`token ${id}: DIFFER (renderer=${r == null ? "null" : r.length}, pinned=${p == null ? "null" : p.length})`); }
  }
  console.log(`\n${ok}/${SAMPLE.length} identical, ${bad} differ.`);
  console.log(bad === 0 ? "SAFE TO FLIP ✅" : "DO NOT FLIP ❌ — investigate the diffs first.");
  process.exit(bad === 0 ? 0 : 1);
})();
