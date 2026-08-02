// Headless-capture the LIVE /anim/:id.html pages (worker-served) to verify they render the machine.
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const R = "https://motorheads-renderer.zacbosugame.workers.dev";
const TOKENS = (process.env.ANIM || "1,16,40,5500").split(",").map((s) => s.trim());
const OUT = "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/anim";
const defaultChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fallbackChrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chrome = fs.existsSync(defaultChrome) ? defaultChrome : fallbackChrome;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function freePort() { return new Promise((res, rej) => { const s = net.createServer(); s.on("error", rej); s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => res(port)); }); }); }
async function waitJson(url, n = 80) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(url); if (r.ok) return r.json(); } catch (err) { e = err; } await sleep(125); } throw e; }
function connect(wsUrl) { const ws = new WebSocket(wsUrl); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); function send(method, params = {}, sid = null) { const i = id++; ws.send(JSON.stringify(sid ? { id: i, method, params, sessionId: sid } : { id: i, method, params })); return new Promise((resolve, reject) => p.set(i, { resolve, reject })); } return new Promise((res, rej) => { ws.once("open", () => res({ send, ws })); ws.once("error", rej); }); }

(async () => {
  const port = await freePort();
  const profile = path.join(os.tmpdir(), `anim-cdp-${port}`);
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--disable-extensions", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await waitJson(`http://127.0.0.1:${port}/json/version`);
    const { send } = await connect(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const S = (m, p = {}) => send(m, p, sessionId);
    await S("Page.enable"); await S("Runtime.enable");
    await S("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    for (const id of TOKENS) {
      await S("Page.navigate", { url: `${R}/anim/${id}.html` });
      await sleep(5500); // module load (390KB runtime) + several render frames
      const shot = await S("Runtime.evaluate", {
        expression: `(async()=>{const c=document.getElementById('c');if(!c)return '';const b=await new Promise(r=>c.toBlob(r,'image/png'));const u=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});return String(u).replace(/^data:image\\/png;base64,/,'');})()`,
        awaitPromise: true, returnByValue: true,
      });
      const b64 = shot?.result?.value || "";
      if (b64) { fs.writeFileSync(path.join(OUT, `${id}.png`), Buffer.from(b64, "base64")); console.log(`anim ${id}: saved`); }
      else console.log(`anim ${id}: BLANK/failed`);
    }
    br.kill();
  } catch (e) { console.log("FATAL", e.message); br.kill(); }
})();
