// Focused capture: render only the sample tokens via the single-page lam-render (non-batch),
// wait for body.dataset.ready, export canvas #render -> PNG in scratchpad.
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");

const TOKENS = (process.env.FACES || "2,9,11,14,40,53").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = process.env.OUT_DIR || "C:/Users/bob/AppData/Local/Temp/claude/d--MotorHeads-5555/93258a86-2e79-4171-affa-7df669644640/scratchpad/faces";
const PORT_WEB = process.env.WEB_PORT || "5199";
const SIZE = Number(process.env.SIZE || 1024);
const defaultChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fallbackChrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chrome = process.env.CHROME_PATH || (fs.existsSync(defaultChrome) ? defaultChrome : fallbackChrome);

fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
  });
}
async function waitForJson(url, attempts = 80) {
  let e;
  for (let i = 0; i < attempts; i++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); e = new Error("HTTP " + r.status); }
    catch (err) { e = err; }
    await sleep(125);
  }
  throw e;
}
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1; const pending = new Map();
  ws.on("message", (buf) => {
    const m = JSON.parse(buf.toString("utf8"));
    if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); }
  });
  function send(method, params = {}, sessionId = null) {
    const id = nextId++;
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  return new Promise((resolve, reject) => { ws.once("open", () => resolve({ ws, send })); ws.once("error", reject); });
}

async function main() {
  const port = await freePort();
  const profileDir = path.join(os.tmpdir(), `faces-cdp-${port}`);
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  const browser = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--disable-extensions", "--disable-crash-reporter",
    "--disable-background-networking", "--disable-sync", "--no-first-run", "--hide-scrollbars",
    "--window-size=1024,1024", "--force-device-scale-factor=1",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "about:blank",
  ], { stdio: "ignore" });

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const { send, ws } = await connect(version.webSocketDebuggerUrl);
    const target = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    const S = (method, params = {}) => send(method, params, sessionId);
    await S("Page.enable"); await S("Runtime.enable");
    await S("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });

    for (const id of TOKENS) {
      const url = `http://127.0.0.1:${PORT_WEB}/lam-render.html?token=${id}&capture=1`;
      await S("Page.navigate", { url });
      const startedAt = Date.now(); let ready = false;
      while (Date.now() - startedAt < 25000) {
        const r = await S("Runtime.evaluate", {
          expression: `document.body?.dataset?.ready === 'true' && new URLSearchParams(location.search).get('token') === '${id}' && !!document.getElementById('render')`,
          returnByValue: true,
        }).catch(() => null);
        if (r?.result?.value === true) { ready = true; break; }
        await sleep(120);
      }
      if (!ready) { console.log(`token ${id}: NOT READY (timeout ${((Date.now() - startedAt) / 1000).toFixed(1)}s)`); continue; }
      await sleep(150);
      const shot = await S("Runtime.evaluate", {
        expression: `(async () => {
          const c = document.getElementById('render'); const t = ${SIZE};
          let src = c;
          if (t !== c.width || t !== c.height) { src = document.createElement('canvas'); src.width = t; src.height = t; src.getContext('2d').drawImage(c, 0, 0, t, t); }
          const blob = await new Promise((res) => src.toBlob(res, 'image/png'));
          const dataUrl = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => rej(rd.error); rd.readAsDataURL(blob); });
          return String(dataUrl).replace(/^data:image\\/png;base64,/, '');
        })()`,
        awaitPromise: true, returnByValue: true,
      });
      const b64 = shot?.result?.value || "";
      if (!b64) { console.log(`token ${id}: export FAILED`); continue; }
      fs.writeFileSync(path.join(OUT, `${id}.png`), Buffer.from(b64, "base64"));
      console.log(`token ${id}: saved (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
    }
    ws.close();
  } finally {
    browser.kill();
    await sleep(800);
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  }
}
main().then(() => console.log("DONE")).catch((e) => { console.error("FATAL", e); process.exitCode = 1; });
