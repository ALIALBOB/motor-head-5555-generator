/* Capture the WebGL FX lab on a real MotorHead: a mode-menu montage + a motion filmstrip of Living Chrome. */
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process"), WebSocket = require("ws");
let sharp = null; try { sharp = require("sharp"); } catch {}
const PORT = 5199, URL = `http://127.0.0.1:${PORT}/fx-lab.html?capture`;
const TOKENS = (process.env.TOKENS || "1,2500,4823").split(",").map((x) => Number(x.trim())).filter(Boolean);
const OUTDIR = process.env.OUTDIR || path.join(os.homedir(), "Downloads", "motorheads-fx-lab");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MENU = [["living", "LIVING CHROME"], ["gold", "LIQUID GOLD"], ["molten", "MOLTEN"], ["plasma", "PLASMA"], ["crystal", "CRYSTAL"], ["aurora", "AURORA"], ["mercury", "MERCURY"], ["toxic", "TOXIC"], ["holo", "HOLOGRAM"]];
const MOTION = [0.0, 0.9, 1.8];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wj(u, n = 120) { let e; for (let i = 0; i < n; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch (x) { e = x; } await sleep(150); } throw e; }
function conn(w) { const ws = new WebSocket(w); let id = 1; const p = new Map(); ws.on("message", (b) => { const m = JSON.parse(b.toString()); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result || {}); } }); const send = (me, pa = {}, s = null) => { const i = id++; ws.send(JSON.stringify(s ? { id: i, method: me, params: pa, sessionId: s } : { id: i, method: me, params: pa })); return new Promise((res, rej) => p.set(i, { resolve: res, reject: rej })); }; return new Promise((res, rej) => { ws.once("open", () => res({ send })); ws.once("error", rej); }); }
(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });
  await wj(`http://127.0.0.1:${PORT}/living-archive/layouts/${TOKENS[0]}.json`).catch(() => { throw new Error("vite not on :" + PORT); });
  const port = 9273, prof = path.join(os.tmpdir(), "mh-fxlab-" + Date.now());
  const br = spawn(chrome, ["--headless=new", "--hide-scrollbars", "--window-size=800,860", "--force-device-scale-factor=1",
    "--ignore-gpu-blocklist", "--enable-gpu",
    `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  try {
    const v = await wj(`http://127.0.0.1:${port}/json/version`); const { send } = await conn(v.webSocketDebuggerUrl);
    const t = await send("Target.createTarget", { url: "about:blank" }); const { sessionId } = await send("Target.attachToTarget", { targetId: t.targetId, flatten: true });
    const s = (m, p = {}) => send(m, p, sessionId);
    await s("Page.enable"); await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", { width: 800, height: 860, deviceScaleFactor: 1, mobile: false });
    await s("Page.navigate", { url: URL });
    for (let i = 0; i < 200; i++) { const b = await s("Runtime.evaluate", { expression: "window.__fxReady===true", returnByValue: true }).catch(() => null); if (b?.result?.value === true) break; await sleep(120); }
    await s("Runtime.evaluate", { expression: "document.querySelector('.bar').style.display='none';" }); // hide UI for clean shots
    const rect = (await s("Runtime.evaluate", { expression: "(r=>({x:r.x|0,y:r.y|0,w:r.width|0,h:r.height|0}))(document.getElementById('gl').getBoundingClientRect())", returnByValue: true })).result.value;
    async function shot(file) { await sleep(120); const png = await s("Page.captureScreenshot", { format: "png", clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 1 } }); fs.writeFileSync(path.join(OUTDIR, file), Buffer.from(png.data, "base64")); }
    async function render(tk, fx, tm) { const r = await s("Runtime.evaluate", { expression: `window.renderFxFrame(${tk}, ${JSON.stringify(fx)}, ${tm})`, awaitPromise: true, returnByValue: true }); if (r?.result?.value?.ok !== true) console.log("  ! render failed", tk, fx, JSON.stringify(r?.result?.value)); }
    for (const tk of TOKENS) { for (const [fx] of MENU) { await render(tk, fx, 1.0); await shot(`m-${tk}-${fx}.png`); } console.log("  \u2713 token", tk); }
    if (sharp) {
      const strip = async (items, file, cols) => {
        const T = 300, L = 26, G = 10, rows = Math.ceil(items.length / cols), W = cols * T + (cols + 1) * G, H = rows * (T + L) + (rows + 1) * G, comps = [];
        for (let i = 0; i < items.length; i++) { const [f, lb] = items[i], c = i % cols, r = (i / cols) | 0, x = G + c * (T + G), y = G + r * (T + L + G);
          if (!fs.existsSync(path.join(OUTDIR, f))) continue;
          comps.push({ input: await sharp(path.join(OUTDIR, f)).resize(T, T).toBuffer(), left: x, top: y });
          if (lb) comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}"><rect width="100%" height="100%" fill="#0b0e14"/><text x="10" y="18" font-family="monospace" font-size="14" fill="#7af5dc" font-weight="bold">${lb}</text></svg>`), left: x, top: y + T }); }
        await sharp({ create: { width: W, height: H, channels: 3, background: "#05070c" } }).composite(comps).png().toFile(path.join(OUTDIR, file));
        console.log("montage:", path.join(OUTDIR, file));
      };
      for (const tk of TOKENS) await strip(MENU.map(([f, lb]) => [`m-${tk}-${f}.png`, `${lb} #${tk}`]), `_menu-${tk}.png`, 3);
      await strip(MOTION.map((_, i) => [`motion-${i}.png`, i === 0 ? "LIVING CHROME · t\u2192" : ""]), "_unused.png", 3); // motion strip disabled for multi-machine test
    }
    console.log("OUTDIR:", OUTDIR);
  } finally { br.kill(); }
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
