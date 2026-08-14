/*
  Render ONE token across a set of material skins (Fire/Ice/Rock/...) to a scratch dir.
  Proves the material-skin loot idea on the real art. Never touches build/images.
  Needs `npx vite web --port 5199` running.  Usage: TOKEN=2500 node scripts/render-materials.cjs
*/
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}

const PORT = Number(process.env.PORT || 5199);
const URL = `http://127.0.0.1:${PORT}/lam-render-material.html`;
const TOKEN = Number(process.env.TOKEN || 2500);
const OUTDIR = process.env.OUTDIR || path.join(os.tmpdir(), "mh-materials");
const OUTSIZE = Number(process.env.OUTSIZE || 620);
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// Elemental skins — gold-edition format ({id,label,surface,background,primary,secondary,accent,edge,glow}).
// surfaces below are ALL already implemented in parts.js drawSkinSpecialMarks.
const SKINS = {
  base:     null,
  // dark themed backgrounds (the biggest lever) + stronger palettes so translucent surfaces read
  fire:     { id: "fire", label: "FIRE", surface: "molten", background: "#1c0904", primary: "#e0431a", secondary: "#7a1608", accent: "#ffcf6b", edge: "#ff7a1f", glow: "rgba(255,120,30,0.7)", liquidType: "Lava", liquidTexture: "Molten" },
  ice:      { id: "ice", label: "ICE", surface: "ice", background: "#061f2b", primary: "#a9e2f5", secondary: "#4f9cc6", accent: "#eafcff", edge: "#d0f1ff", glow: "rgba(180,235,255,0.65)", liquidType: "Meltwater", liquidTexture: "Frost" },
  rock:     { id: "rock", label: "ROCK", surface: "stone", background: "#211d17", primary: "#9a8f7f", secondary: "#565049", accent: "#c7b9a0", edge: "#7a7062", glow: "rgba(150,138,120,0.25)" },
  cloud:    { id: "cloud", label: "CLOUD", surface: "soft", background: "#2c3547", primary: "#eef3f9", secondary: "#c2ccd8", accent: "#ffffff", edge: "#dbe4ee", glow: "rgba(255,255,255,0.55)" },
  crystal:  { id: "crystal", label: "CRYSTAL", surface: "crystal", background: "#0e1626", primary: "#a9dcea", secondary: "#7f8fe0", accent: "#eaf9ff", edge: "#cbe8f6", glow: "rgba(170,200,255,0.6)" },
  electric: { id: "electric", label: "ELECTRIC", surface: "electric", background: "#141105", primary: "#f5d63a", secondary: "#7a5f16", accent: "#fffbc0", edge: "#ffe63a", glow: "rgba(255,225,60,0.75)" },
  cosmic:   { id: "cosmic", label: "COSMIC", surface: "cosmic", background: "#0a0818", primary: "#6a44b0", secondary: "#1a1030", accent: "#d0b4ff", edge: "#9e7cff", glow: "rgba(160,120,255,0.65)" },
  toxic:    { id: "toxic", label: "TOXIC", surface: "sludge", background: "#0c1606", primary: "#6aa028", secondary: "#2a3f10", accent: "#cbf56a", edge: "#93e83a", glow: "rgba(160,235,70,0.55)" },
};
const ORDER = (process.env.SKINS || "base,fire,ice,rock,cloud,crystal,electric,cosmic,toxic").split(",").map((s) => s.trim());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUTDIR, { recursive: true });
async function waitForJson(url, n = 80) { let last; for (let i = 0; i < n; i++) { try { const r = await fetch(url); if (r.ok) return r.json(); last = new Error("HTTP " + r.status); } catch (e) { last = e; } await sleep(125); } throw last; }
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl); let id = 1; const pend = new Map();
  ws.on("message", (b) => { const m = JSON.parse(b.toString("utf8")); if (m.id && pend.has(m.id)) { const { resolve, reject } = pend.get(m.id); pend.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } });
  const send = (method, params = {}, sessionId = null) => { const i = id++; ws.send(JSON.stringify(sessionId ? { id: i, method, params, sessionId } : { id: i, method, params })); return new Promise((res, rej) => pend.set(i, { resolve: res, reject: rej })); };
  return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); });
}

async function main() {
  await waitForJson(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKEN}.json`).catch(() => { throw new Error(`vite not serving on :${PORT}`); });
  const port = 9231;
  const profileDir = path.join(os.tmpdir(), `mh-cdp-mat-${Date.now()}`);
  const browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--window-size=1024,1024", "--force-device-scale-factor=1", `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore" });
  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const { send } = await connect(version.webSocketDebuggerUrl);
    const target = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "typeof window.renderLamToken==='function'", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(100); }

    for (const name of ORDER) {
      const skin = SKINS[name];
      const arg = skin === null ? "{materialSkin:null}" : `{materialSkin:${JSON.stringify(skin)}}`;
      const res = await s("Runtime.evaluate", { expression: `window.renderLamToken(${TOKEN}, ${arg})`, awaitPromise: true, returnByValue: true });
      if (res?.result?.value?.ok !== true) { console.log(`  ! ${name} failed`); continue; }
      await sleep(140);
      const shot = await s("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
      const buf = Buffer.from(shot.data, "base64");
      const out = path.join(OUTDIR, `${TOKEN}_${name}.png`);
      if (sharp && OUTSIZE !== 1024) await sharp(buf).resize(OUTSIZE, OUTSIZE).png().toFile(out); else fs.writeFileSync(out, buf);
      console.log(`  ✓ ${name} -> ${out}`);
    }
  } finally { browser.kill(); }
  console.log(`done: token ${TOKEN} across ${ORDER.length} materials in ${OUTDIR}`);
}
main().catch((e) => { console.error("ERR:", e.message); process.exitCode = 1; });
