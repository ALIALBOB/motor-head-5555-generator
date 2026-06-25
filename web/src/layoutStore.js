// Local draft storage. This is not the final NFT state.
// Final/published state should be uploaded to IPFS/Arweave and referenced on-chain.
const KEY = "mechanical-canvas-builder-draft";

export function saveDraft(layout) {
  localStorage.setItem(KEY, JSON.stringify(layout));
}

export function loadDraft() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function sha256Hex(text) {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
