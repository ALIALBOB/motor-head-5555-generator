/*
  Render a handful of tokens to PNGs in a SCRATCH dir (never touches build/images).
  Needs `npx vite web --port 5199` already running.
  Usage: IDS=1,42,777 LABEL=baseline OUTDIR=/path node scripts/render-samples.cjs
*/
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}

const PORT = Number(process.env.PORT || 5199);
const BATCH_URL = `http://127.0.0.1:${PORT}/lam-render-batch.html`;
const IDS = (process.env.IDS || "1,42,777,2500,4000,5200").split(",").map((s) => s.trim()).filter(Boolean);
const LABEL = process.env.LABEL || "sample";
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-samples");
const OUTSIZE = Number(process.env.OUTSIZE || 640); // downscale for quick viewing
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUTDIR, { recursive: true });

async function waitForJson(url, attempts = 80) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); last = new Error("HTTP " + r.status); }
    catch (e) { last = e; }
    await sleep(125);
  }
  throw last;
}
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl); let nextId = 1; const pending = new Map();
  ws.on("message", (buf) => {
    const m = JSON.parse(buf.toString("utf8"));
    if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); }
  });
  function send(method, params = {}, sessionId = null) {
    const id = nextId++; ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  return new Promise((resolve, reject) => { ws.once("open", () => resolve({ send })); ws.once("error", reject); });
}

async function main() {
  // confirm vite is serving
  await waitForJson(`http://127.0.0.1:${PORT}/living-archive/layouts/1.json`).catch(() => { throw new Error(`vite not serving on :${PORT} — start it first`); });

  const port = 9223 + Math.floor(Number(process.env.CDP_OFFSET || 0));
  const profileDir = path.join(os.tmpdir(), `mh-cdp-${Date.now()}`);
  const browser = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--disable-extensions", "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "about:blank",
  ], { stdio: "ignore" });

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const { send } = await connect(version.webSocketDebuggerUrl);
    const target = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    const s = (method, params = {}) => send(method, params, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: BATCH_URL });
    for (let i = 0; i < 200; i++) {
      const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken === 'function'", returnByValue: true }).catch(() => null);
      if (b?.result?.value === true) break; await sleep(100);
    }

    for (const id of IDS) {
      const res = await s("Runtime.evaluate", { expression: `window.renderLamToken(${JSON.stringify(id)})`, awaitPromise: true, returnByValue: true });
      const v = res?.result?.value;
      if (v !== true && v?.ok !== true) { console.log(`  ! token ${id} render failed`); continue; }
      await sleep(120);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
      const buf = Buffer.from(shot.data, "base64");
      const out = path.join(OUTDIR, `${id}_${LABEL}.png`);
      if (sharp && OUTSIZE !== 1024) await sharp(buf).resize(OUTSIZE, OUTSIZE).png().toFile(out);
      else fs.writeFileSync(out, buf);
      console.log(`  ✓ ${id} -> ${out}`);
    }
  } finally {
    browser.kill();
  }
  console.log(`done: ${IDS.length} tokens (${LABEL}) in ${OUTDIR}`);
}
main().catch((e) => { console.error("ERR:", e.message); process.exitCode = 1; });
