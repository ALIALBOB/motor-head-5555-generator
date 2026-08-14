/* Render the 4 hero elements with real FX + a 2x2 montage. */
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/lam-render-material.html`;
const TOKEN = Number(process.env.TOKEN || 2500);
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-heroes");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SK = {
  fire:     { id:"fire", label:"FIRE", surface:"molten", background:"#1c0904", primary:"#e0431a", secondary:"#7a1608", accent:"#ffcf6b", edge:"#ff7a1f", glow:"rgba(255,120,30,0.7)" },
  ice:      { id:"ice", label:"ICE", surface:"ice", background:"#061f2b", primary:"#a9e2f5", secondary:"#4f9cc6", accent:"#eafcff", edge:"#d0f1ff", glow:"rgba(180,235,255,0.65)" },
  electric: { id:"electric", label:"ELECTRIC", surface:"electric", background:"#141105", primary:"#f5d63a", secondary:"#7a5f16", accent:"#fffbc0", edge:"#ffe63a", glow:"rgba(255,225,60,0.75)" },
  cosmic:   { id:"cosmic", label:"COSMIC", surface:"cosmic", background:"#0a0818", primary:"#6a44b0", secondary:"#1a1030", accent:"#d0b4ff", edge:"#9e7cff", glow:"rgba(160,120,255,0.65)" },
};
const ORDER = ["fire","ice","electric","cosmic"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKEN}.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9261, prof = path.join(os.tmpdir(), "mh-hero-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }
    for (const name of ORDER) {
      const r = await s("Runtime.evaluate", { expression: `window.renderLamToken(${TOKEN}, {materialSkin:${JSON.stringify(SK[name])}, fx:true})`, awaitPromise: true, returnByValue: true });
      if (r?.result?.value?.ok !== true) { console.log("  !", name, "failed"); continue; }
      await sleep(160);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
      fs.writeFileSync(path.join(OUTDIR, `${TOKEN}_${name}_real.png`), Buffer.from(shot.data, "base64"));
      console.log("  ✓", name);
    }
    if (sharp) {
      const T = 480, L = 30, G = 10, W = 2 * T + 3 * G, H = 2 * (T + L) + 3 * G, comps = [];
      for (let i = 0; i < 4; i++) { const nm = ORDER[i], col = i % 2, row = (i / 2) | 0, x = G + col * (T + G), y = G + row * (T + L + G);
        comps.push({ input: await sharp(path.join(OUTDIR, `${TOKEN}_${nm}_real.png`)).resize(T, T).toBuffer(), left: x, top: y });
        comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="12" y="21" font-family="monospace" font-size="15" fill="#e8993a" font-weight="bold">${SK[nm].label} · real FX</text></svg>`), left: x, top: y + T });
      }
      await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().toFile(path.join(OUTDIR, "heroes.png"));
      console.log("montage:", path.join(OUTDIR, "heroes.png"));
    }
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
