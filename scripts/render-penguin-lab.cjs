/* Capture the penguin/egg/igloo lab (site dev server :5173) → menu montage. */
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5173, URL = `http://127.0.0.1:${PORT}/penguin-lab.html`;
const OUTDIR = process.env.OUTDIR || path.join(os.homedir(), "Downloads", "motorheads-penguin");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const COMPS = process.env.COMPS ? process.env.COMPS.split(",") : ["egg-bone","egg-cream","egg-teal","egg-cyan","egg-gold","egg-coral","igloo-white","igloo-ice","igloo-teal","penguin"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 120) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json ? (u.endsWith("version") ? r.json() : r) : r; } catch (x) { e = x; } await sleep(150); } throw e; }
async function ok(u, n = 120) { for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return true; } catch {} await sleep(150); } throw new Error("not up: " + u); }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  await ok(URL);
  const port = 9277, prof = path.join(os.tmpdir(), "mh-peng-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--hide-scrollbars", "--window-size=640,700", "--force-device-scale-factor=1", "--ignore-gpu-blocklist", "--enable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    let v; for (let i = 0; i < 80; i++) { try { v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await sleep(250); } }
    if (!v) throw new Error("chrome remote-debug not reachable on " + port);
    const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 640, height: 700, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 250; i++) { const b = await s("Runtime.evaluate", { expression: "window.__ready===true", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(120); }
    const rect = (await s("Runtime.evaluate", { expression: "(r=>({x:r.x|0,y:r.y|0,w:r.width|0,h:r.height|0}))(document.getElementById('c').getBoundingClientRect())", returnByValue: true })).result.value;
    for (const name of COMPS) {
      const r = await s("Runtime.evaluate", { expression: `window.renderComp(${JSON.stringify(name)})`, awaitPromise: true, returnByValue: true });
      if (r?.result?.value?.ok !== true) { console.log("  ! ", name, JSON.stringify(r?.result?.value)); continue; }
      await sleep(150);
      const png = await s("Page.captureScreenshot", { format: "png", clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 } });
      fs.writeFileSync(path.join(OUTDIR, `${name}.png`), Buffer.from(png.data, "base64"));
      console.log("  \u2713", name);
    }
    if (sharp) {
      const cols = 3, T = 300, L = 26, G = 10, items = COMPS.filter((n) => fs.existsSync(path.join(OUTDIR, `${n}.png`))), rows = Math.ceil(items.length / cols), W = cols * T + (cols + 1) * G, H = rows * (T + L) + (rows + 1) * G, comps = [];
      for (let i = 0; i < items.length; i++) { const nm = items[i], cc = i % cols, rr = (i / cols) | 0, x = G + cc * (T + G), y = G + rr * (T + L + G);
        comps.push({ input: await sharp(path.join(OUTDIR, `${nm}.png`)).resize(T, T, { fit: "contain", background: "#0b0e14" }).toBuffer(), left: x, top: y });
        comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#0b0e14"/><text x="10" y="18" font-family="monospace" font-size="14" fill="#7af5dc" font-weight="bold">${nm.toUpperCase()}</text></svg>`), left: x, top: y + T });
      }
      await sharp({ create: { width: W, height: H, channels: 3, background: "#05070c" } }).composite(comps).png().toFile(path.join(OUTDIR, "_penguin.png"));
      console.log("montage:", path.join(OUTDIR, "_penguin.png"));
    }
    console.log("OUTDIR:", OUTDIR);
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
