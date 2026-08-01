// MotorHeads renderer worker (standalone — NOT the prod backend).
//
//   GET  /health            -> ok
//   GET  /meta/:id.json     -> metadata. UNEDITED = the pinned original, byte-identical. EDITED =
//                              original + image/animation pointed here + parts attributes.
//   GET  /img/:id.png       -> the customized image snapshot (from R2)
//   PUT  /img/:id.png        -> store a snapshot (client capture at save; dev-open, gated in prod)
//   GET  /anim/:id          -> animation page (reuses the site's render; stub for now)
//
// SAFETY: when a token has no on-chain parts, we fetch the pinned metadata and return its RAW
// bytes unchanged, so pointing tokenURI here changes nothing for the collection until someone edits.

import { createPublicClient, http } from "viem";
import metadataMod from "./build-metadata.js";

const { overlayMetadata, decodeParts } = metadataMod;

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

const jsonHeaders = (extra = {}) => ({ "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", ...extra });
const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), { status, headers: jsonHeaders(extra) });

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
    const res = await fetch(`${base}/${tokenId}.json`, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const base = String(env.RENDER_BASE_URL || url.origin).replace(/\/$/, "");

    if (url.pathname === "/health") return json({ ok: true });

    let m;
    if ((m = url.pathname.match(/^\/meta\/(\d+)\.json$/))) {
      const id = Number(m[1]);
      const [{ parts, revision }, originalText] = await Promise.all([readLayout(env, id), originalMetaText(env, id)]);

      if (parts.length === 0) {
        // UNEDITED -> return the pinned metadata's raw bytes, unchanged (byte-identical to live).
        if (originalText != null) return new Response(originalText, { status: 200, headers: jsonHeaders({ "cache-control": "public, max-age=60" }) });
        return json({ ok: false, error: "metadata source unavailable" }, 502);
      }
      // EDITED -> overlay onto the original.
      let original = {};
      try { original = originalText ? JSON.parse(originalText) : {}; } catch { original = {}; }
      const meta = overlayMetadata(original, { tokenId: id, parts, buildRevision: revision, config: { imageBaseUrl: `${base}/img`, animationBaseUrl: `${base}/anim` } });
      return json(meta, 200, { "cache-control": "public, max-age=30" });
    }

    if ((m = url.pathname.match(/^\/img\/(\d+)\.png$/))) {
      const key = `${m[1]}.png`;
      if (request.method === "PUT") {
        await env.RENDERS.put(key, request.body, { httpMetadata: { contentType: "image/png" } });
        return json({ ok: true, key });
      }
      const obj = await env.RENDERS.get(key);
      if (!obj) return json({ ok: false, error: "not found" }, 404);
      return new Response(obj.body, { headers: { "content-type": "image/png", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" } });
    }

    if ((m = url.pathname.match(/^\/anim\/(\d+)/))) {
      const id = Number(m[1]);
      return new Response(
        `<!doctype html><meta charset=utf-8><title>MotorHead #${id}</title><body style="margin:0;background:#0b0f0e;color:#eafffb;font-family:system-ui;display:grid;place-items:center;height:100vh"><div>MotorHead #${id} — animation renders here (site drawPart)</div></body>`,
        { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } }
      );
    }

    return json({ ok: false, error: "no route" }, 404);
  },
};
