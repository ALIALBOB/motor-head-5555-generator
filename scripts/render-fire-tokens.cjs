/* Render the REFINED per-part fire effect across several tokens (head-type coverage) + a montage. */
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/lam-render-material.html`;
const TOKENS = (process.env.TOKENS || "777,2500,100,4000").split(",").map((s) => Number(s.trim()));
const OPT = { partFire: true, fireScale: 0.7, fireMinW: 88, fireDark: true };
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-firetok");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKENS[0]}.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9293, prof = path.join(os.tmpdir(), "mh-ft-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }
    for (const id of TOKENS) {
      const r = await s("Runtime.evaluate", { expression: `window.renderLamToken(${id}, ${JSON.stringify(OPT)})`, awaitPromise: true, returnByValue: true });
      if (r?.result?.value?.ok !== true) { console.log("  !", id, "failed"); continue; }
      await sleep(150);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
      fs.writeFileSync(path.join(OUTDIR, `${id}.png`), Buffer.from(shot.data, "base64"));
      console.log("  ✓", id);
    }
    if (sharp) {
      const COLS = 2, T = 440, L = 24, G = 9, rows = Math.ceil(TOKENS.length / COLS);
      const W = COLS * T + (COLS + 1) * G, H = rows * (T + L) + (rows + 1) * G, comps = [];
      for (let i = 0; i < TOKENS.length; i++) { const id = TOKENS[i], col = i % COLS, row = (i / COLS) | 0, x = G + col * (T + G), y = G + row * (T + L + G);
        comps.push({ input: await sharp(path.join(OUTDIR, `${id}.png`)).resize(T, T).toBuffer(), left: x, top: y });
        comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="12" y="18" font-family="monospace" font-size="13" fill="#ff8a3a" font-weight="bold">#${id} · fire</text></svg>`), left: x, top: y + T });
      }
      await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().toFile(path.join(OUTDIR, "fire-tokens.png"));
      console.log("montage:", path.join(OUTDIR, "fire-tokens.png"));
    }
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
