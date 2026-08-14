/* Headless smoke-test of material-viewer.html: load, click FIRE, screenshot the UI. */
const os = require("os"), path = require("path"), fs = require("fs"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://127.0.0.1:5199/material-viewer.html";
const OUT = process.env.OUT || path.join(os.tmpdir(), "viewer_ui.png");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(125); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  const port = 9241, prof = path.join(os.tmpdir(), "mh-view-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--window-size=760,1040", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 760, height: 1040, deviceScaleFactor: 1, mobile: false });
    const errors = [];
    await s("Runtime.evaluate", { expression: "window.__err=[];window.addEventListener('error',e=>window.__err.push(String(e.message)));window.addEventListener('unhandledrejection',e=>window.__err.push('promise:'+e.reason));" });
    await s("Page.navigate", { url: URL }); await sleep(3500);
    await s("Runtime.evaluate", { expression: "document.getElementById('hat').click()" }); await sleep(900); // toggle the 👑 Hat item
    const tagTxt = await s("Runtime.evaluate", { expression: "document.getElementById('tag').textContent", returnByValue: true });
    const errList = await s("Runtime.evaluate", { expression: "JSON.stringify(window.__err)", returnByValue: true });
    const shot = await s("Page.captureScreenshot", { format: "png" });
    let buf = Buffer.from(shot.data, "base64"); if (sharp) buf = await sharp(buf).resize(600).png().toBuffer();
    fs.writeFileSync(OUT, buf);
    console.log("tag after FIRE click:", tagTxt?.result?.value);
    console.log("page errors:", errList?.result?.value);
    console.log("screenshot:", OUT);
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
