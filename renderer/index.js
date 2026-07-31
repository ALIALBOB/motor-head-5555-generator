// MotorHeads renderer worker (standalone — NOT the prod backend).
//
//   GET  /health            -> ok
//   GET  /meta/:id.json     -> dynamic ERC-721 metadata (reads the companion's on-chain parts)
//   GET  /img/:id.png       -> the customized image snapshot (from R2)
//   PUT  /img/:id.png        -> store a snapshot (client capture at save; dev-open, gated in prod)
//   GET  /anim/:id          -> animation page (reuses the site's render; stub for now)
//
// Chain reads use viem against RENDER_RPC_URL + PARTS_CONTRACT. A failed/empty read still yields
// clean base metadata, so an unedited token never breaks.

import { createPublicClient, http } from "viem";
import metadataMod from "./build-metadata.js";

const { buildTokenMetadata, decodeParts } = metadataMod;

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

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", ...extra } });

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
    return { parts: [], revision: 0 }; // never break metadata on a read failure
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
      const { parts, revision } = await readLayout(env, id);
      return json(buildTokenMetadata({
        tokenId: id, parts, buildRevision: revision,
        config: { name: env.COLLECTION_NAME || "MotorHead", imageBaseUrl: `${base}/img`, animationBaseUrl: `${base}/anim` },
      }), 200, { "cache-control": "public, max-age=30" });
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
      // Stub: reuses the site render in the real build; for now confirm the pipeline.
      return new Response(
        `<!doctype html><meta charset=utf-8><title>MotorHead #${id}</title><body style="margin:0;background:#0b0f0e;color:#eafffb;font-family:system-ui;display:grid;place-items:center;height:100vh"><div>MotorHead #${id} — animation renders here (site drawPart)</div></body>`,
        { headers: { "content-type": "text/html; charset=utf-8", "access-control-allow-origin": "*" } }
      );
    }

    return json({ ok: false, error: "no route" }, 404);
  },
};
