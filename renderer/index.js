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

import { createPublicClient, http, recoverMessageAddress } from "viem";
import metadataMod from "./build-metadata.js";

// Minimal ownerOf read on the live collection — the /save-image gate proves the caller owns the token.
const COLLECTION_ABI = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
];

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
const COLLECTION_SIZE = 5555; // token ids are 1..5555; out-of-range -> 404, not a source 502

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

// The pinned metadata CID (also the setBaseURI revert target) — an automatic fallback so a Pages
// outage/bad-deploy can't 502 the whole collection's traits. Files exist at both /<id> and /<id>.json.
const SOURCE_META_CID = "bafybeieu7bnbl7tiuim6x6gz7pcdfhkq6bh4eas3jteea7sx7kowobe6jy";
const IPFS_META_GATEWAYS = ["https://ipfs.io/ipfs", `https://${SOURCE_META_CID}.ipfs.dweb.link`];

// One fetch that only accepts a real JSON body — guards against a Pages SPA/catch-all serving 200 HTML.
async function fetchMetaText(url) {
  try {
    const res = await fetch(url, { headers: { accept: "application/json" }, cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!res.ok) return null;
    const text = await res.text();
    return text.trimStart().startsWith("{") ? text : null;
  } catch {
    return null;
  }
}

// Raw pinned metadata text. Primary = the Pages source; fallback = the immutable IPFS CID so a Pages
// outage self-heals. Null only if BOTH the source and every gateway fail (a genuine source outage).
async function originalMetaText(env, tokenId) {
  const base = String(env.SOURCE_META_BASE || "").replace(/\/$/, "");
  if (base) {
    const primary = await fetchMetaText(`${base}/${tokenId}.json`);
    if (primary != null) return primary;
  }
  for (const gw of IPFS_META_GATEWAYS) {
    const url = gw.includes(".ipfs.") ? `${gw}/${tokenId}.json` : `${gw}/${SOURCE_META_CID}/${tokenId}.json`;
    const alt = await fetchMetaText(url);
    if (alt != null) return alt;
  }
  return null;
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

// The live animation page: the ORIGINAL interactive animation (D/A/S buttons + drag/dismantle/reassemble
// + chain-reactive telemetry), reused verbatim. Inlines the token layout (new faces) as a global; one
// bundled app (/anim/runtime.js = drawMachine + the animation logic) runs it. Same engine as the image.
function animPage(id, base, layout, partsUrl, bgUrl, behindUrl, bgScene) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const name = esc((layout && layout.name) || ("MotorHead #" + id)); // used in <title> text AND aria-label attr
  const W = Math.max(1, Math.min(4096, Math.round(Number(layout && layout.canvas && layout.canvas.width) || 1024)));
  const H = Math.max(1, Math.min(4096, Math.round(Number(layout && layout.canvas && layout.canvas.height) || 1024)));
  const layoutLiteral = JSON.stringify(layout).replace(/</g, "\\u003c"); // JSON is valid JS; escape </script
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #fbfaf5; }
  body { display: grid; place-items: center; }
  .stage { position: relative; width: min(100vw, 100vh); aspect-ratio: 1; overflow: hidden; background: #fbfaf5; }
  canvas { width: 100%; height: 100%; display: block; cursor: default; touch-action: manipulation; }
  .stage.is-over-part canvas { cursor: grab; touch-action: none; }
  .stage.is-dragging canvas { cursor: grabbing; }
  .controls { position: absolute; top: 13px; right: 13px; display: grid; grid-auto-flow: column; gap: 4px; z-index: 5; }
  .controls button { width: 20px; height: 20px; padding: 0; border: 1px solid rgba(235,211,121,.48); background: linear-gradient(135deg, rgba(255,242,160,.96), rgba(49,89,82,.78) 58%, rgba(8,20,20,.86)); color: rgba(5,13,13,.96); font: 900 9px/1 ui-monospace, Menlo, Consolas, monospace; cursor: pointer; text-shadow: 0 1px 0 rgba(255,255,255,.28); box-shadow: 1px 1px 0 rgba(16,38,37,.36), 0 0 10px rgba(236,178,53,.18), inset 0 1px 0 rgba(255,255,255,.35); }
  .controls button:hover, .controls button.is-active { border-color: rgba(122,245,220,.82); background: linear-gradient(135deg, rgba(127,255,229,.98), rgba(18,128,117,.9) 62%, rgba(5,18,20,.92)); color: rgba(3,16,16,.98); box-shadow: 1px 1px 0 rgba(16,38,37,.28), 0 0 14px rgba(122,245,220,.28), inset 0 1px 0 rgba(255,255,255,.4); }
</style>
</head>
<body>
<main class="stage" aria-label="${name} assembly viewer">
  <canvas id="render" width="${W}" height="${H}"></canvas>
  <div class="controls" aria-label="Machine controls">
    <button id="dismantle" type="button" title="Dismantle">D</button>
    <button id="assemble" type="button" title="Assemble">A</button>
    <button id="stopMotion" type="button" title="Stop animation">S</button>
  </div>
</main>
<script>window.__LAM_BASE_LAYOUT__ = ${layoutLiteral};${partsUrl ? `window.__LAM_PARTS_URL__ = ${JSON.stringify(partsUrl)};` : ""}${bgUrl ? `window.__LAM_BG_URL__ = ${JSON.stringify(bgUrl)};` : ""}${behindUrl ? `window.__LAM_BEHIND_URL__ = ${JSON.stringify(behindUrl)};` : ""}${bgScene ? `window.__LAM_BG_SCENE__ = ${JSON.stringify(bgScene)};` : ""}</script>
<script type="module" src="${base}/anim/app.js?v=11"></script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const base = String(env.RENDER_BASE_URL || url.origin).replace(/\/$/, "");

    if (url.pathname === "/health") return json({ ok: true });

    let m;
    if ((m = url.pathname.match(/^\/meta\/(\d+)(?:\.json)?$/))) { // deployed contract tokenURI = base+id (no .json)
      const id = Number(m[1]);
      if (!Number.isInteger(id) || id < 1 || id > COLLECTION_SIZE) return json({ ok: false, error: "token does not exist" }, 404);
      const [{ parts, revision }, originalText] = await Promise.all([readLayout(env, id), originalMetaText(env, id)]);
      if (originalText == null) return json({ ok: false, error: "metadata source unavailable" }, 502);
      let original;
      try { original = JSON.parse(originalText); } catch { return json({ ok: false, error: "bad source metadata" }, 502); }
      const meta = curateMetadata(original, { tokenId: id, parts, buildRevision: revision, config: { imageBaseUrl: `${base}/img`, animationBaseUrl: `${base}/anim` } });
      // Bust OpenSea's cached thumbnail on a FREE republish: buildRevision (the ?rev key) doesn't change
      // when a holder just re-renders, so OpenSea keeps serving the stale image. Key the image URL to the
      // R2 snapshot's upload time — a changed URL forces OpenSea to re-pull the (already-updated) render.
      if (parts.length && meta && typeof meta.image === "string" && meta.image.includes("/img/")) {
        try {
          const imgHead = await env.RENDERS.head(`${id}.png`);
          if (imgHead?.uploaded) meta.image += `${meta.image.includes("?") ? "&" : "?"}t=${imgHead.uploaded.getTime()}`;
        } catch (_) { /* no snapshot yet */ }
      }
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

    // The flattened parts-layer PNG (transparent; the added on-chain parts at rest). Written by the
    // ownership-gated /save-image with x-kind:parts; consumed by the animation as a drawOverlay image.
    if ((m = url.pathname.match(/^\/parts\/(\d+)\.png$/))) {
      const obj = await env.RENDERS.get(`${m[1]}.parts.png`);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "image/png", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    // The full-frame scene-background layer (opaque). Written by /save-image with x-kind:background; the
    // animation paints it BEHIND the machine via drawMachine's drawUnderlay hook.
    if ((m = url.pathname.match(/^\/bg\/(\d+)\.png$/))) {
      const obj = await env.RENDERS.get(`${m[1]}.bg.png`);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "image/png", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    // The behind-body items layer (transparent). Written by /save-image with x-kind:behind; the animation
    // paints it BEHIND the machine but fades it WITH assembly (unlike the constant bg), so dismantle animates
    // these items like the front parts.
    if ((m = url.pathname.match(/^\/behind\/(\d+)\.png$/))) {
      const obj = await env.RENDERS.get(`${m[1]}.behind.png`);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "image/png", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    // Ownership-gated render upload (holders, NO shared secret in the browser): the holder signs ONE
    // message; we recover the signer and require it OWNS the token AND the on-chain revision matches,
    // then store the PNG. x-kind selects which artifact: "image" -> the flattened card /img/:id.png;
    // "parts" -> the transparent parts-layer /parts/:id.png the animation composites over the machine.
    // One signature authorizes both (image + parts) uploads for the same token+revision.
    if ((m = url.pathname.match(/^\/save-image\/(\d+)$/))) {
      const id = Number(m[1]);
      if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type, x-signature, x-revision, x-kind" } });
      if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
      if (!Number.isInteger(id) || id < 1 || id > COLLECTION_SIZE) return json({ ok: false, error: "token does not exist" }, 404);
      const c = client(env);
      const collection = env.COLLECTION_ADDRESS;
      if (!c || !collection || !env.PARTS_CONTRACT) return json({ ok: false, error: "chain not configured" }, 503);
      const signature = request.headers.get("x-signature");
      const revHeader = request.headers.get("x-revision");
      if (!signature || revHeader == null) return json({ ok: false, error: "missing x-signature / x-revision" }, 400);
      // The render must reflect the CURRENT saved parts — on-chain revision has to match.
      let onchainRev;
      try { onchainRev = Number(await c.readContract({ address: env.PARTS_CONTRACT, abi: PARTS_ABI, functionName: "buildRevision", args: [BigInt(id)] })); }
      catch { return json({ ok: false, error: "revision read failed" }, 502); }
      if (String(onchainRev) !== String(revHeader)) return json({ ok: false, error: "stale revision", onchainRev }, 409);
      // Recover the signer and require it to own the token.
      const message = `MotorHeads render save\ntoken:${id}\nrevision:${onchainRev}`;
      let signer;
      try { signer = await recoverMessageAddress({ message, signature }); }
      catch { return json({ ok: false, error: "bad signature" }, 400); }
      let owner;
      try { owner = await c.readContract({ address: collection, abi: COLLECTION_ABI, functionName: "ownerOf", args: [BigInt(id)] }); }
      catch { return json({ ok: false, error: "ownerOf read failed" }, 502); }
      if (String(signer).toLowerCase() !== String(owner).toLowerCase()) return json({ ok: false, error: "not token owner" }, 403);
      const kindHeader = request.headers.get("x-kind");
      const kind = kindHeader === "parts" ? "parts" : kindHeader === "background" ? "background" : kindHeader === "behind" ? "behind" : "image";
      const key = kind === "parts" ? `${id}.parts.png` : kind === "background" ? `${id}.bg.png` : kind === "behind" ? `${id}.behind.png` : `${id}.png`;
      const putOpts = { httpMetadata: { contentType: "image/png" } };
      // Stamp the background, parts AND behind overlays with the revision they were rendered for, so the
      // animation can tell a CURRENT layer from a stale one left behind after a later save changed the layout
      // but didn't re-upload that layer. Without this, a stale overlay kept getting composited.
      if (kind === "background" || kind === "parts" || kind === "behind") putOpts.customMetadata = { revision: String(onchainRev) };
      // A client-side-only animated scene (Normies boat) has no on-chain bg part — the site tags its bg upload
      // with the scene key so the animation can draw it LIVE (drifting) instead of pasting the static snapshot.
      if (kind === "background") { const scene = request.headers.get("x-bg-scene"); if (scene) putOpts.customMetadata.scene = String(scene).slice(0, 24); }
      await env.RENDERS.put(key, request.body, putOpts);
      return json({ ok: true, id, revision: onchainRev, kind }, 200, { "access-control-allow-origin": "*" });
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

    // The full interactive animation app (engine + D/A/S + drag + chain poll). New URL so it never
    // collides with the OLD immutable /anim/runtime.js still cached in clients from before this deploy.
    if (url.pathname === "/anim/app.js") {
      if (request.method === "PUT") {
        if (!authorized(request, env)) return json({ ok: false, error: "unauthorized" }, 401);
        await env.RENDERS.put("anim/app.js", request.body, { httpMetadata: { contentType: "text/javascript" } });
        return json({ ok: true, key: "anim/app.js" });
      }
      const obj = await env.RENDERS.get("anim/app.js");
      if (!obj) return json({ ok: false, error: "app not uploaded" }, 404);
      return new Response(obj.body, { headers: { "content-type": "text/javascript; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=31536000, immutable" } });
    }

    if ((m = url.pathname.match(/^\/anim\/(\d+)(?:\.html)?$/))) {
      const id = Number(m[1]);
      const obj = await env.RENDERS.get(`layouts/${id}.json`);
      if (!obj) return new Response(`<!doctype html><meta charset=utf-8><body style="margin:0;background:#0b0f0e;color:#eafffb;font-family:system-ui;display:grid;place-items:center;height:100vh"><div>MotorHead #${id} — layout not uploaded yet</div>`, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } });
      let layout;
      try { layout = JSON.parse(await obj.text()); } catch { return json({ ok: false, error: "bad layout" }, 502); }
      const { parts, revision } = await readLayout(env, id);
      layout = mergeParts(layout, parts);
      // Serve the parts overlay ONLY when it matches the token's current build — the same staleness guard the
      // bg layer uses (above). A newer save that changed the layout but didn't re-upload a matching parts.png
      // must NOT have its OLD overlay composited over the new machine. Forward rule: the stored parts.png must
      // be stamped with the current revision. Legacy fallback (tokens saved before parts got stamped): trust an
      // UNSTAMPED overlay only when every on-chain part is a real catalog item (itemId>0); a phantom itemId-0
      // part (an uncatalogued item that never rendered) is the tell-tale of a stale overlay, so drop it. New
      // saves are always stamped, so this legacy branch only ever applies to the few pre-stamp tokens.
      let partsUrl = "";
      if (parts && parts.length) {
        try {
          const ph = await env.RENDERS.head(`${id}.parts.png`);
          const stamp = ph && ph.customMetadata ? ph.customMetadata.revision : undefined;
          const stampedMatch = stamp != null && String(stamp) === String(revision);
          const legacyTrust = stamp == null && parts.every((p) => Number(p.itemId) > 0);
          if (ph && (stampedMatch || legacyTrust)) partsUrl = `${base}/parts/${id}.png?rev=${revision}`;
        } catch (_) { /* no overlay object -> no parts layer */ }
      }
      // Serve the custom background layer ONLY if it was rendered for the current revision — a stale bg
      // (holder removed their background on a later save) is ignored so the default scene returns.
      let bgUrl = "", bgScene = "";
      try {
        const bgHead = await env.RENDERS.head(`${id}.bg.png`);
        if (bgHead && String(bgHead.customMetadata?.revision) === String(revision)) {
          bgUrl = `${base}/bg/${id}.png?rev=${revision}`;
          bgScene = bgHead.customMetadata?.scene || ""; // Normies boat scene key → animation draws it live
        }
      } catch (_) { /* no bg layer */ }
      // Serve the behind-items layer ONLY if rendered for the current revision (same staleness guard). Faded
      // with assembly by the animation, so dismantle animates these items like the front parts.
      let behindUrl = "";
      try {
        const behindHead = await env.RENDERS.head(`${id}.behind.png`);
        if (behindHead && String(behindHead.customMetadata?.revision) === String(revision)) behindUrl = `${base}/behind/${id}.png?rev=${revision}`;
      } catch (_) { /* no behind layer */ }
      return new Response(animPage(id, base, layout, partsUrl, bgUrl, behindUrl, bgScene), { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    return json({ ok: false, error: "no route" }, 404);
  },
};
