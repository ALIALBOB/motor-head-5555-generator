// Renderer metadata — overlays on-chain edits onto the token's ORIGINAL pinned metadata.
//
//   • UNEDITED token (no on-chain parts) -> the original metadata, UNCHANGED. The worker actually
//     returns the pinned file's raw bytes verbatim, so it is byte-identical to what's live today.
//     This is what makes flipping tokenURI safe: the whole collection looks exactly the same until
//     a holder actually edits.
//   • EDITED token -> the original, but with image + animation_url pointed at the renderer (which
//     composites the parts) and a couple of parts attributes appended. Everything else (name,
//     description, external_url, base traits, properties) is preserved from the original.

function decodeParts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => ({
    itemId: Number(p.itemId ?? p[0]),
    x: Number(p.x ?? p[1]),
    y: Number(p.y ?? p[2]),
    scale: Number(p.scale ?? p[3]),
    rotation: Number(p.rotation ?? p[4]),
    colorwayId: Number(p.colorwayId ?? p[5]),
    transparency: Number(p.transparency ?? p[6]),
  }));
}

function overlayMetadata(original, { tokenId, parts = [], buildRevision = 0, config = {} } = {}) {
  const base = original && typeof original === "object" ? original : {};
  const list = Array.isArray(parts) ? parts : [];
  if (list.length === 0) return base; // unedited — original untouched

  const id = Number(tokenId);
  const rev = Number(buildRevision);
  const attrs = Array.isArray(base.attributes) ? base.attributes.slice() : [];
  return {
    ...base,
    image: `${config.imageBaseUrl}/${id}.png?rev=${rev}`,
    animation_url: `${config.animationBaseUrl}/${id}.html?rev=${rev}`,
    attributes: [
      ...attrs,
      { trait_type: "Custom Parts", value: list.length },
      { trait_type: "Build Revision", value: rev },
    ],
  };
}

module.exports = { decodeParts, overlayMetadata };
