// Prove the parts are real: render #TOKEN locally via drawMachine, next to the LIVE on-chain /img (OpenSea's image).
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/lam-render-material.html`;
const TOKEN = Number(process.env.TOKEN || 2500);
const LIVE = `https://motorheads-renderer.zacbosugame.workers.dev/img/${TOKEN}.png`;
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-proof");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  // 1) LIVE image from the chain-pointed renderer (what OpenSea shows)
  fs.writeFileSync(path.join(OUTDIR, "live.png"), Buffer.from(await (await fetch(LIVE)).arrayBuffer()));
  console.log("fetched LIVE /img");
  // 2) LOCAL render via drawMachine (same code the renderer runs)
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKEN}.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9311, prof = path.join(os.tmpdir(), "mh-proof-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }
    await s("Runtime.evaluate", { expression: `window.renderLamToken(${TOKEN}, {})`, awaitPromise: true, returnByValue: true });
    await sleep(150);
    const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
    fs.writeFileSync(path.join(OUTDIR, "local.png"), Buffer.from(shot.data, "base64"));
    console.log("rendered LOCAL drawMachine");
  } finally { br.kill(); }
  if (sharp) {
    const T = 560, L = 28, G = 10, W = 2 * T + 3 * G, H = T + L + 2 * G, comps = [];
    const items = [["live", "LIVE — on-chain /img (OpenSea)"], ["local", "LOCAL — drawMachine + parts.js"]];
    for (let i = 0; i < 2; i++) { const [nm, lb] = items[i], x = G + i * (T + G), y = G;
      comps.push({ input: await sharp(path.join(OUTDIR, `${nm}.png`)).resize(T, T).toBuffer(), left: x, top: y });
      comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#14171c"/><text x="12" y="20" font-family="monospace" font-size="14" fill="#48b98a" font-weight="bold">${lb}</text></svg>`), left: x, top: y + T });
    }
    await sharp({ create: { width: W, height: H, channels: 3, background: "#0d0f13" } }).composite(comps).png().toFile(path.join(OUTDIR, `proof-${TOKEN}.png`));
    console.log("montage:", path.join(OUTDIR, `proof-${TOKEN}.png`));
  }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
