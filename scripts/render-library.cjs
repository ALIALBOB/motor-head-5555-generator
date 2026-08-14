/* Render the whole materials.json library on a token (gloss + solid) into a grid montage. */
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/lam-render-material.html`;
const TOKEN = Number(process.env.TOKEN || 2500);
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-library");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const COLS = Number(process.env.COLS || 5);
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const LIB0 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "web", "public", "materials.json"), "utf8"));
const LIB = ONLY.length ? LIB0.filter((m) => ONLY.includes(m.id)) : LIB0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKEN}.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9281, prof = path.join(os.tmpdir(), "mh-lib-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }
    for (const mat of LIB) {
      const r = await s("Runtime.evaluate", { expression: `window.renderLamToken(${TOKEN}, {materialSkin:${JSON.stringify(mat)}, fx:true, solid:true})`, awaitPromise: true, returnByValue: true });
      if (r?.result?.value?.ok !== true) { console.log("  !", mat.id, "failed"); continue; }
      await sleep(120);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
      fs.writeFileSync(path.join(OUTDIR, `${mat.id}.png`), Buffer.from(shot.data, "base64"));
      console.log("  ✓", mat.label);
    }
    if (sharp) {
      const T = 300, L = 24, G = 8, rows = Math.ceil(LIB.length / COLS);
      const W = COLS * T + (COLS + 1) * G, H = rows * (T + L) + (rows + 1) * G, comps = [];
      for (let i = 0; i < LIB.length; i++) { const mat = LIB[i], col = i % COLS, row = (i / COLS) | 0, x = G + col * (T + G), y = G + row * (T + L + G);
        comps.push({ input: await sharp(path.join(OUTDIR, `${mat.id}.png`)).resize(T, T).toBuffer(), left: x, top: y });
        comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="9" y="17" font-family="monospace" font-size="13" fill="${mat.btn}" font-weight="bold">${mat.label}</text></svg>`), left: x, top: y + T });
      }
      await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().resize(1200).png().toFile(path.join(OUTDIR, "library.png"));
      console.log("montage:", path.join(OUTDIR, "library.png"), `${LIB.length} materials`);
    }
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
