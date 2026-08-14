// Show exactly which library parts a specific token uses: machine on the left, its distinct parts on the right.
const fs = require("fs"), path = require("path");
const sharp = require("D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft/node_modules/sharp");
const TOKEN = Number(process.env.TOKEN || 2500);
const LAYOUTS = "D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft/web/public/living-archive/layouts";
const PARTS = "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/parts"; // isolated part PNGs
const MACHINE = "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/proof/local.png";
const OUT = "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/proof/breakdown-" + TOKEN + ".png";

(async () => {
  const l = JSON.parse(fs.readFileSync(path.join(LAYOUTS, TOKEN + ".json"), "utf8"));
  const counts = {};
  for (const p of (l.placements || [])) counts[p.key] = (counts[p.key] || 0) + 1;
  const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  console.log(`#${TOKEN}: ${l.placements.length} parts placed, ${keys.length} distinct types`);
  keys.forEach((k) => console.log(`  ${k}  x${counts[k]}`));

  // layout: machine (left, big) + parts grid (right)
  const M = 620, COLS = 5, T = 150, L = 26, G = 8, HEADER = 40;
  const gridW = COLS * T + (COLS + 1) * G, rows = Math.ceil(keys.length / COLS);
  const gridH = rows * (T + L) + (rows + 1) * G;
  const W = M + G + gridW + G, H = Math.max(M, gridH) + HEADER + G * 2;
  const comps = [];
  comps.push({ input: Buffer.from(`<svg width="${W}" height="${HEADER}"><rect width="100%" height="100%" fill="#0d0f13"/><text x="14" y="26" font-family="monospace" font-size="18" fill="#48b98a" font-weight="bold">#${TOKEN} — ${keys.length} distinct parts (of the 60) build this exact machine</text></svg>`), left: 0, top: 0 });
  comps.push({ input: await sharp(MACHINE).resize(M, M).toBuffer(), left: G, top: HEADER });
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i], col = i % COLS, row = (i / COLS) | 0;
    const x = M + G + G + col * (T + G), y = HEADER + G + row * (T + L + G);
    const f = path.join(PARTS, `${k.replace(/[^a-z0-9._-]/gi, "_")}.png`);
    if (fs.existsSync(f)) comps.push({ input: await sharp(f).resize(T, T).toBuffer(), left: x, top: y });
    comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="6" y="12" font-family="monospace" font-size="10" fill="#e8ebf0" font-weight="bold">${k}</text><text x="6" y="23" font-family="monospace" font-size="9" fill="#7ea2d6">x${counts[k]}</text></svg>`), left: x, top: y + T });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().toFile(OUT);
  console.log("montage:", OUT, `${W}x${H}`);
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
