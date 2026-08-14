// Render every distinct part isolated → a labeled "parts library" sheet (key + token usage). 0 Runway credits.
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/lam-render-part.html`;
const LAYOUTS = "D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft/web/public/living-archive/layouts";
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-parts");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// distinct keys + token usage across the whole collection
function scanKeys() {
  const files = fs.readdirSync(LAYOUTS).filter((f) => /^\d+\.json$/.test(f));
  const tokens = {};
  for (const f of files) { let l; try { l = JSON.parse(fs.readFileSync(path.join(LAYOUTS, f), "utf8")); } catch { continue; } const seen = new Set(); for (const p of (l.placements || [])) seen.add(p.key || "(none)"); for (const k of seen) tokens[k] = (tokens[k] || 0) + 1; }
  return Object.keys(tokens).sort((a, b) => tokens[b] - tokens[a]).map((k) => ({ key: k, tokens: tokens[k] }));
}
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const parts = scanKeys();
  console.log("distinct parts:", parts.length);
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/1.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9301, prof = path.join(os.tmpdir(), "mh-parts-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=400,400", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 400, height: 400, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderPart==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }
    const ok = [];
    for (const { key, tokens } of parts) {
      const r = await s("Runtime.evaluate", { expression: `window.renderPart(${JSON.stringify(key)})`, awaitPromise: true, returnByValue: true });
      if (r?.result?.value?.ok !== true) { console.log("  ! ", key, r?.result?.value?.err || "fail"); continue; }
      await sleep(60);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 400, height: 400, scale: 1 } });
      const file = path.join(OUTDIR, `${key.replace(/[^a-z0-9._-]/gi, "_")}.png`);
      fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
      ok.push({ key, tokens, file });
    }
    console.log("rendered:", ok.length, "/", parts.length);
    if (sharp) {
      const COLS = 8, T = 172, L = 30, G = 6, rows = Math.ceil(ok.length / COLS);
      const W = COLS * T + (COLS + 1) * G, H = rows * (T + L) + (rows + 1) * G, comps = [];
      for (let i = 0; i < ok.length; i++) { const { key, tokens, file } = ok[i], col = i % COLS, row = (i / COLS) | 0, x = G + col * (T + G), y = G + row * (T + L + G);
        comps.push({ input: await sharp(file).resize(T, T).toBuffer(), left: x, top: y });
        const tk = tokens >= 5555 ? "ALL" : tokens.toLocaleString();
        comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="6" y="13" font-family="monospace" font-size="10" fill="#e8ebf0" font-weight="bold">${key}</text><text x="6" y="25" font-family="monospace" font-size="9" fill="#7ea2d6">${tk} tokens</text></svg>`), left: x, top: y + T });
      }
      await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().toFile(path.join(OUTDIR, "parts-library.png"));
      console.log("montage:", path.join(OUTDIR, "parts-library.png"), `${W}x${H}`);
    }
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
