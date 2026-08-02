// Verify the RESTORED interactive animation: renders + D/A/S buttons drive dismantle/assemble.
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const R = "https://motorheads-renderer.zacbosugame.workers.dev";
const TOKEN = process.env.ANIM || "1";
const OUT = "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/anim2";
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
  const profile = path.join(os.tmpdir(), `anim2-cdp-${port}`);
  const br = spawn(chrome, ["--headless=new", "--disable-gpu", "--disable-extensions", "--no-first-run", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  const shoot = async (S, label) => {
    const r = await S("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
    fs.writeFileSync(path.join(OUT, `${TOKEN}-${label}.png`), Buffer.from(r.data, "base64"));
    console.log("shot:", label);
  };
  const clickBtn = (S, id) => S("Runtime.evaluate", { expression: `(()=>{const b=document.getElementById(${JSON.stringify(id)});if(!b)return 'no-btn';b.click();return 'clicked '+${JSON.stringify(id)};})()`, returnByValue: true });
  try {
    const v = await waitJson(`http://127.0.0.1:${port}/json/version`);
    const { send } = await connect(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const S = (m, p = {}) => send(m, p, sessionId);
    await S("Page.enable"); await S("Runtime.enable");
    await S("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await S("Page.navigate", { url: `${R}/anim/${TOKEN}.html` });
    await sleep(6000); // 417KB app + engine load + several render frames
    // Diagnostics: did the app boot? are the controls wired?
    const diag = await S("Runtime.evaluate", { expression: `(()=>{const c=document.getElementById('render');const ctx=c&&c.getContext('2d');let nonBlank=false;try{const d=ctx.getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4000){if(d[i]!==251||d[i+1]!==250||d[i+2]!==245){nonBlank=true;break;}}}catch(e){}return JSON.stringify({hasCanvas:!!c,hasGlobal:!!window.__LAM_BASE_LAYOUT__,dBtn:!!document.getElementById('dismantle'),drewSomething:nonBlank});})()`, returnByValue: true });
    console.log("diag:", diag?.result?.value);
    await shoot(S, "1-initial");
    console.log(await clickBtn(S, "assemble").then((r) => r?.result?.value));
    await sleep(2600); await shoot(S, "2-after-assemble");
    console.log(await clickBtn(S, "dismantle").then((r) => r?.result?.value));
    await sleep(2600); await shoot(S, "3-after-dismantle");
    console.log(await clickBtn(S, "assemble").then((r) => r?.result?.value));
    await sleep(2600); await shoot(S, "4-reassembled");
    br.kill();
  } catch (e) { console.log("FATAL", e.message); br.kill(); }
})();
