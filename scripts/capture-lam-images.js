const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
let sharp = null;

const root = process.cwd();
const imageDir = path.join(root, "build", "images");
const layoutsDir = path.join(root, "build", "layouts");
const defaultChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fallbackChrome = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const chrome = process.env.CHROME_PATH || (fs.existsSync(defaultChrome) ? defaultChrome : fallbackChrome);
const baseUrl = process.env.LAM_RENDER_BASE_URL || "http://127.0.0.1:5173/lam-render.html?token=";
const batchUrl = process.env.LAM_RENDER_BATCH_URL || "http://127.0.0.1:5173/lam-render-batch.html";
const batchMode = process.env.LAM_CAPTURE_BATCH !== "0";
const captureDelayMs = Number(process.env.LAM_CAPTURE_DELAY_MS || 100);
const captureFormatRaw = String(process.env.LAM_CAPTURE_FORMAT || "png").toLowerCase();
const captureFormat = captureFormatRaw === "jpg" ? "jpeg" : captureFormatRaw;
const captureExtension = captureFormat === "jpeg" ? "jpg" : captureFormat;
const captureQuality = Math.max(1, Math.min(100, Number(process.env.LAM_CAPTURE_QUALITY || 94)));
const captureSize = Math.max(256, Math.min(1024, Number(process.env.LAM_CAPTURE_SIZE || 1024)));
const captureEncoder = String(process.env.LAM_CAPTURE_ENCODER || "sharp").toLowerCase();
const captureExport = String(process.env.LAM_CAPTURE_EXPORT || "blob").toLowerCase();
const captureWorkers = Math.max(1, Math.min(8, Number(process.env.LAM_CAPTURE_WORKERS || 1)));

if (captureEncoder === "sharp") {
  try {
    sharp = require("sharp");
  } catch {
    sharp = null;
  }
}

fs.mkdirSync(imageDir, { recursive: true });

if (!fs.existsSync(chrome)) {
  throw new Error(`Chrome/Edge not found. Set CHROME_PATH. Tried: ${chrome}`);
}

function layoutTokenIds() {
  const ids = fs.readdirSync(layoutsDir)
    .filter((name) => /^\d+\.json$/.test(name))
    .map((name) => Number(path.basename(name, ".json")))
    .filter((id) => Number.isFinite(id))
    .sort((a, b) => a - b);
  const start = Number(process.env.LAM_CAPTURE_START || 0);
  const from = Number.isFinite(start) && start > 0 ? ids.filter((id) => id >= start) : ids;
  const limit = Number(process.env.LAM_CAPTURE_COUNT || 0);
  return Number.isFinite(limit) && limit > 0 ? from.slice(0, limit) : from;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeDirSafe(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Chrome can keep Crashpad files locked for a moment on Windows; they are temp-only.
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForJson(url, attempts = 80) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(125);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function waitForRenderReady(sessionSend, tokenId, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await sessionSend("Runtime.evaluate", {
      expression: `document.body?.dataset?.ready === 'true' && new URLSearchParams(location.search).get('token') === '${tokenId}' && !!document.getElementById('render')`,
      returnByValue: true
    }).catch(() => null);
    if (result?.result?.value === true) return;
    await sleep(100);
  }
  throw new Error("Timed out waiting for LAM render canvas");
}

function renderUrl(tokenId) {
  const url = `${baseUrl}${tokenId}`;
  if (process.env.LAM_CAPTURE_LIVE === "1") return url;
  return `${url}${url.includes("?") ? "&" : "?"}capture=1`;
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  ws.on("message", (buffer) => {
    const message = JSON.parse(buffer.toString("utf8"));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result || {});
      return;
    }
    if (message.method && listeners.has(message.method)) {
      for (const resolve of listeners.get(message.method)) resolve(message.params || {});
      listeners.delete(message.method);
    }
  });

  function send(method, params = {}, sessionId = null) {
    const id = nextId;
    nextId += 1;
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  function once(method, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      let wrapped;
      const timer = setTimeout(() => {
        const list = listeners.get(method) || [];
        listeners.set(method, list.filter((item) => item !== wrapped));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      wrapped = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      const list = listeners.get(method) || [];
      list.push(wrapped);
      listeners.set(method, list);
    });
  }

  return new Promise((resolve, reject) => {
    ws.once("open", () => resolve({ ws, send, once }));
    ws.once("error", reject);
  });
}

async function main() {
  const tokenIds = layoutTokenIds();
  if (tokenIds.length === 0) throw new Error(`No layout JSON files found in ${layoutsDir}`);

  const port = Number(process.env.LAM_CDP_PORT || await freePort());
  const profileDir = path.join(os.tmpdir(), `lam-cdp-profile-${Date.now()}`);
  removeDirSafe(profileDir);

  const browser = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-crash-reporter",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-default-apps",
    "--no-default-browser-check",
    "--no-first-run",
    "--hide-scrollbars",
    "--window-size=1024,1024",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const client = await connect(version.webSocketDebuggerUrl);
    const { send, once, ws } = client;

    await send("Target.setDiscoverTargets", { discover: true });

    async function createCaptureSession() {
      const target = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
      const sessionSend = (method, params = {}) => send(method, params, sessionId);

      await sessionSend("Page.enable");
      await sessionSend("Runtime.enable");
      await sessionSend("Emulation.setDeviceMetricsOverride", {
        width: 1024,
        height: 1024,
        deviceScaleFactor: 1,
        mobile: false
      });

      if (batchMode) {
        await sessionSend("Page.navigate", { url: batchUrl });
        const startedAt = Date.now();
        while (Date.now() - startedAt < 20000) {
          const booted = await sessionSend("Runtime.evaluate", {
            expression: "typeof window.renderLamToken === 'function'",
            returnByValue: true
          }).catch(() => null);
          if (booted?.result?.value === true) break;
          await sleep(100);
        }
        const ready = await sessionSend("Runtime.evaluate", {
          expression: "typeof window.renderLamToken === 'function'",
          returnByValue: true
        });
        if (ready?.result?.value !== true) throw new Error("Batch renderer did not boot");
      }

      return sessionSend;
    }

    async function renderToken(sessionSend, tokenId, workerIndex) {
      if (batchMode) {
        const result = await sessionSend("Runtime.evaluate", {
          expression: `window.renderLamToken(${JSON.stringify(tokenId)})`,
          awaitPromise: true,
          returnByValue: true
        });
        const value = result?.result?.value;
        if (value !== true && value?.ok !== true) throw new Error(`Batch render failed for token ${tokenId}`);
        if (process.env.LAM_CAPTURE_PROFILE === "1") {
          console.log(`profile w${workerIndex} ${tokenId}: load=${value.loadMs}ms draw=${value.drawMs}ms cache=${value.cache?.hits || 0}/${value.cache?.misses || 0} size=${value.cache?.size || 0}`);
        }
        return;
      }
      const url = renderUrl(tokenId);
      await sessionSend("Page.navigate", { url });
      await waitForRenderReady(sessionSend, tokenId);
    }

    async function exportToken(sessionSend, tokenId) {
      const output = path.join(imageDir, `${tokenId}.${captureExtension}`);
      if (batchMode && sharp) {
        const rawShot = await sessionSend("Runtime.evaluate", {
          expression: `(() => {
            const canvas = document.getElementById('render');
            const targetSize = ${captureSize};
            let source = canvas;
            if (targetSize !== canvas.width || targetSize !== canvas.height) {
              source = window.__lamExportCanvas || document.createElement('canvas');
              source.width = targetSize;
              source.height = targetSize;
              window.__lamExportCanvas = source;
              const exportContext = source.getContext('2d');
              exportContext.clearRect(0, 0, targetSize, targetSize);
              exportContext.drawImage(canvas, 0, 0, targetSize, targetSize);
            }
            const context = source.getContext('2d');
            const imageData = context.getImageData(0, 0, source.width, source.height);
            const bytes = imageData.data;
            let binary = '';
            const chunkSize = 0x8000;
            for (let offset = 0; offset < bytes.length; offset += chunkSize) {
              binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
            }
            return { width: source.width, height: source.height, data: btoa(binary) };
          })()`,
          returnByValue: true
        });
        const raw = rawShot?.result?.value;
        if (!raw?.data) throw new Error(`Canvas raw export failed for token ${tokenId}`);
        const image = sharp(Buffer.from(raw.data, "base64"), {
          raw: { width: raw.width, height: raw.height, channels: 4 }
        });
        const encoded = captureFormat === "jpeg"
          ? await image.jpeg({ quality: captureQuality, mozjpeg: true }).toBuffer()
          : await image.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
        fs.writeFileSync(output, encoded);
        console.log(`captured build/images/${tokenId}.${captureExtension} from Mechanical Canvas renderer`);
        return;
      }

      let base64 = "";
      if (batchMode && captureExport === "screenshot") {
        const shot = await sessionSend("Page.captureScreenshot", {
          format: captureFormat,
          quality: captureFormat === "jpeg" ? captureQuality : undefined,
          captureBeyondViewport: false,
          clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 }
        });
        base64 = shot?.data || "";
      } else {
        const shot = await sessionSend("Runtime.evaluate", {
          expression: `(async () => {
            const canvas = document.getElementById('render');
            const targetSize = ${captureSize};
            let source = canvas;
            if (targetSize !== canvas.width || targetSize !== canvas.height) {
              source = window.__lamExportCanvas || document.createElement('canvas');
              source.width = targetSize;
              source.height = targetSize;
              window.__lamExportCanvas = source;
              const exportContext = source.getContext('2d');
              exportContext.clearRect(0, 0, targetSize, targetSize);
              exportContext.drawImage(canvas, 0, 0, targetSize, targetSize);
            }
            const blob = await new Promise((resolve) => source.toBlob(resolve, 'image/${captureFormat}', ${captureQuality / 100}));
            if (!blob) return '';
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
            return String(dataUrl).replace(/^data:image\\/${captureFormat};base64,/, '');
          })()`,
          awaitPromise: true,
          returnByValue: true
        });
        base64 = shot?.result?.value || "";
      }
      if (!base64) throw new Error(`Canvas export failed for token ${tokenId}`);
      fs.writeFileSync(output, Buffer.from(base64, "base64"));
      console.log(`captured build/images/${tokenId}.${captureExtension} from Mechanical Canvas renderer`);
    }

    async function captureToken(sessionSend, tokenId, workerIndex) {
      await renderToken(sessionSend, tokenId, workerIndex);
      await sleep(captureDelayMs);
      await exportToken(sessionSend, tokenId);
    }

    const workerCount = Math.min(captureWorkers, tokenIds.length);
    const sessions = [];
    for (let i = 0; i < workerCount; i += 1) {
      sessions.push(await createCaptureSession());
    }
    let cursor = 0;
    await Promise.all(sessions.map(async (sessionSend, workerOffset) => {
      const workerIndex = workerOffset + 1;
      while (cursor < tokenIds.length) {
        const tokenId = tokenIds[cursor];
        cursor += 1;
        await captureToken(sessionSend, tokenId, workerIndex);
      }
    }));

    ws.close();
  } finally {
    browser.kill();
    await sleep(1000);
    removeDirSafe(profileDir);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
