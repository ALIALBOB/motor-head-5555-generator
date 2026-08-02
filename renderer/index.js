// MotorHeads renderer worker (standalone — NOT the prod backend).
//
//   GET  /health              -> ok
//   GET  /meta/:id.json       -> metadata. Traits curated always; image -> /img, animation -> /anim.
//   GET  /img/:id.png         -> the rendered image snapshot (from R2)
//   PUT  /img/:id.png         -> store a snapshot. GATED: requires x-edit-secret == env.UPLOAD_SECRET.
//   GET  /layout/:id.json     -> the token's build layout (from R2; the SAME layout the image uses)
//   PUT  /layout/:id.json     -> store a layout. GATED (same secret).
//   GET  /anim/runtime.js     -> the shared render engine bundle (drawMachine), immutable-cached.
//   GET  /anim/:id.html       -> the LIVE animation: inlines the token layout (new faces) + on-chain
//                                parts overlay, renders via the shared drawMachine (marketplace mode).
//
// SAFETY: nothing changes for the collection until the owner flips setBaseURI to this worker's /meta.
// One render engine (web/src drawMachine) feeds BOTH the image and the animation — no second impl.

import { createPublicClient, http } from "viem";
import metadataMod from "./build-metadata.js";

const { curateMetadata, decodeParts } = metadataMod;

const PARTS_ABI = [
  {
    type: "function", name: "partsOf", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{
      type: "tuple[]", components: [
        { name: "itemId", type: "uint16" }, { name: "x", type: "int32" }, { name: "y", type: "int32" },
        { name: "scale", type: "uint16" }, { name: "rotation", type: "uint16" },
        { name: "colorwayId", type: "uint16" }, { name: "transparency", type: "uint8" },
      ],
    }],
  },
  { type: "function", name: "buildRevision", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "uint32" }] },
];

const BACKEND = "https://motorheads-backend.zacbosugame.workers.dev";

const jsonHeaders = (extra = {}) => ({ "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", ...extra });
const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), { status, headers: jsonHeaders(extra) });

// A write is allowed only with the shared edit secret. If UPLOAD_SECRET is unset, all writes are denied.
const authorized = (request, env) => Boolean(env.UPLOAD_SECRET) && request.headers.get("x-edit-secret") === env.UPLOAD_SECRET;

function client(env) {
  const url = String(env.RENDER_RPC_URL || "").trim();
  if (!url || !env.PARTS_CONTRACT) return null;
  return createPublicClient({ transport: http(url) });
}

async function readLayout(env, tokenId) {
  const c = client(env);
  if (!c) return { parts: [], revision: 0 };
  try {
    const [raw, rev] = await Promise.all([
      c.readContract({ address: env.PARTS_CONTRACT, abi: PARTS_ABI, functionName: "partsOf", args: [BigInt(tokenId)] }),
      c.readContract({ address: env.PARTS_CONTRACT, abi: PARTS_ABI, functionName: "buildRevision", args: [BigInt(tokenId)] }),
    ]);
    return { parts: decodeParts(raw), revision: Number(rev) };
  } catch {
    return { parts: [], revision: 0 }; // read failure -> treat as unedited (safe: shows the original)
  }
}

// Fetch the raw text of the token's pinned metadata (immutable -> long cache). Null on failure.
async function originalMetaText(env, tokenId) {
  const base = String(env.SOURCE_META_BASE || "").replace(/\/$/, "");
  if (!base) return null;
  try {
    const res = await fetch(`${base}/${tokenId}.json`, { headers: { accept: "application/json" }, cf: { cacheTtl: 86400, cacheEverything: true } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// Merge holder on-chain parts into the base layout's placements. Empty today (PARTS_CONTRACT unset).
// When on-chain save deploys, the SHARED decode module (mirror of src/lib/onchain-save.js encodeLayout)
// turns each Part into a drawMachine placement here — one impl, reused by image + animation + canvas.
function mergeParts(layout, parts) {
  if (!parts || !parts.length) return layout;
  // TODO(onchain-save): decode Part{itemId,x,y,scale,rotation,colorwayId,transparency} -> placement
  // via the shared catalog/decoder and append to layout.placements. No-op until the contract is live.
  return layout;
}

// The live animation page: inlines the token layout (with the new faces) + renders via the shared engine,
// and polls the backend for live chain telemetry (gas/sales/holder-age) mapped the SAME way the old
// pinned animation did (applyBackendChainState), so the machine stays chain-reactive.
function animPage(id, base, layout) {
  const W = (layout && layout.canvas && layout.canvas.width) || 1024;
  const H = (layout && layout.canvas && layout.canvas.height) || 1024;
  const layoutLiteral = JSON.stringify(layout).replace(/</g, "\\u003c"); // JSON is valid JS; escape </script
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MotorHead #${id}</title>
<style>html,body{margin:0;height:100%;background:#0b0f0e;overflow:hidden}#c{display:block;width:100vmin;height:100vmin;margin:auto}</style>
</head><body><canvas id="c" width="${W}" height="${H}"></canvas>
<script type="module">
import { drawMachine } from "${base}/anim/runtime.js";
const LAYOUT = ${layoutLiteral};
const TOKEN = ${id};
const chainState = {
  liveMode: true, showLiveEffects: true, gasPressure: 0, baseFeeGwei: 0,
  blockNumber: 25000000 + ((Math.abs(TOKEN) * 137) % 900000),
  heartbeatPulse: 0.18, archiveAgeSeconds: 0, holderBondSeconds: 0,
  transferCount: 0, saleCount: 0, saleTier: "", globalPhase: "Archive Awakening", source: "fallback",
};
function numOr(v, f){ const n = Number(v); return Number.isFinite(n) ? n : f; }
function gasFromLevel(lv, f){ const v = String(lv||"").toLowerCase(); return v==="extreme"?160:v==="high"?90:v==="medium"?42:v==="low"?9:f; }
function applyChain(payload){
  const c = payload && payload.chainState; if (!c) return;
  const g = numOr(c.gasGwei, null); const ng = g == null ? gasFromLevel(c.gasLevel, chainState.gasPressure) : Math.max(0, g);
  const sales = Math.max(0, Math.floor(numOr(c.saleCount, chainState.saleCount)));
  chainState.backendOnline = true; chainState.source = c.source || "indexer";
  chainState.gasPressure = ng; chainState.baseFeeGwei = ng; chainState.gasLevel = c.gasLevel || "";
  chainState.blockNumber = Math.floor(numOr(c.latestBlock, chainState.blockNumber));
  chainState.transferCount = Math.max(0, Math.floor(numOr(c.transferCount, chainState.transferCount)));
  chainState.saleCount = sales; chainState.sellCount = sales;
  chainState.highestVerifiedSaleWei = c.lastSalePriceWei || chainState.highestVerifiedSaleWei || "";
  chainState.saleTier = sales > 0 ? (c.lastSalePriceWei || "verified") : "";
  chainState.evolutionTier = c.evolutionTier || "";
  const age = numOr(c.holderAgeDays, null);
  if (age != null){ const s = Math.max(0, Math.floor(age * 86400)); chainState.archiveAgeSeconds = s; chainState.holderBondSeconds = s; }
}
const ctx = document.getElementById("c").getContext("2d");
function frame(){ drawMachine(ctx, LAYOUT, chainState, { performanceMode: "marketplace", editMode: false, previewMotion: true }); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
async function poll(){
  try { const r = await fetch("${BACKEND}/v1/tokens/" + TOKEN + "/chain-state", { cache: "no-store", headers: { accept: "application/json" } }); if (r.ok) applyChain(await r.json()); }
  catch (e){ chainState.backendOnline = false; chainState.source = "fallback"; }
}
poll(); setInterval(poll, 60000);
</script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const base = String(env.RENDER_BASE_URL || url.origin).replace(/\/$/, "");

    if (url.pathname === "/health") return json({ ok: true });

    let m;
    if ((m = url.pathname.match(/^\/meta\/(\d+)(?:\.json)?$/))) { // deployed contract tokenURI = base+id (no .json)
      const id = Number(m[1]);
      const [{ parts, revision }, originalText] = await Promise.all([readLayout(env, id), originalMetaText(env, id)]);
      if (originalText == null) return json({ ok: false, error: "metadata source unavailable" }, 502);
      let original;
      try { original = JSON.parse(originalText); } catch { return json({ ok: false, error: "bad source metadata" }, 502); }
      const meta = curateMetadata(original, { tokenId: id, parts, buildRevision: revision, config: { imageBaseUrl: `${base}/img`, animationBaseUrl: `${base}/anim` } });
      return json(meta, 200, { "cache-control": parts.length ? "public, max-age=30" : "public, max-age=300" });
    }

    if ((m = url.pathname.match(/^\/img\/(\d+)\.png$/))) {
      const key = `${m[1]}.png`;
      if (request.method === "PUT") {
        if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
        await env.RENDERS.put(key, request.body, { httpMetadata: { contentType: "image/png" } });
        return json({ ok: true, key });
      }
      const obj = await env.RENDERS.get(key);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "image/png", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    if ((m = url.pathname.match(/^\/layout\/(\d+)\.json$/))) {
      const key = `layouts/${m[1]}.json`;
      if (request.method === "PUT") {
        if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
        await env.RENDERS.put(key, request.body, { httpMetadata: { contentType: "application/json" } });
        return json({ ok: true, key });
      }
      const obj = await env.RENDERS.get(key);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" } });
    }

    if (url.pathname === "/anim/runtime.js") {
      if (request.method === "PUT") {
        if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
        await env.RENDERS.put("anim/runtime.js", request.body, { httpMetadata: { contentType: "text/javascript" } });
        return json({ ok: true, key: "anim/runtime.js" });
      }
      const obj = await env.RENDERS.get("anim/runtime.js");
      if (!obj) return json({ ok: false, error: "runtime not uploaded" }, 404);
      return new Response(obj.body, { headers: { "content-type": "text/javascript; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=31536000, immutable" } });
    }

    if ((m = url.pathname.match(/^\/anim\/(\d+)(?:\.html)?$/))) {
      const id = Number(m[1]);
      const obj = await env.RENDERS.get(`layouts/${id}.json`);
      if (!obj) return new Response(`<!doctype html><meta charset=utf-8><body style="margin:0;background:#0b0f0e;color:#eafffb;font-family:system-ui;display:grid;place-items:center;height:100vh"><div>MotorHead #${id} — layout not uploaded yet</div>`, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } });
      let layout;
      try { layout = JSON.parse(await obj.text()); } catch { return json({ ok: false, error: "bad layout" }, 502); }
      const { parts } = await readLayout(env, id);
      layout = mergeParts(layout, parts);
      return new Response(animPage(id, base, layout), { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    return json({ ok: false, error: "no route" }, 404);
  },
};
