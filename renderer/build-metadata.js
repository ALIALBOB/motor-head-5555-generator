// Renderer — dynamic metadata assembly for the on-chain-parts MotorHeads.
//
// The renderer worker reads a token's parts from the MotorHeadsParts companion contract
// (partsOf + buildRevision), then calls buildTokenMetadata() to produce the ERC-721 /
// OpenSea metadata JSON served at tokenURI. Kept as pure functions (no chain / no worker
// runtime) so the whole read->metadata pipeline is trivially testable against the real
// contract on a local Hardhat chain.
//
// image + animation_url carry ?rev=<buildRevision> so every on-chain save cache-busts the
// marketplace's copy; OpenSea re-crawls on the MetadataUpdate signal and fetches the new art.

// Normalize the raw struct array returned by partsOf() (ethers/viem give BigInts) into
// plain numbers the renderer + metadata can use.
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

function buildTokenMetadata({ tokenId, parts = [], buildRevision = 0, config = {} }) {
  const id = Number(tokenId);
  const rev = Number(buildRevision);
  const list = Array.isArray(parts) ? parts : [];

  const {
    name = "MotorHead",
    description = "A MotorHead customized on-chain by its holder on the Owner Canvas.",
    imageBaseUrl,
    animationBaseUrl,
    externalUrl,
  } = config;

  const meta = {
    name: `${name} #${id}`,
    description,
    image: `${imageBaseUrl}/${id}.png?rev=${rev}`,
    animation_url: `${animationBaseUrl}/${id}.html?rev=${rev}`,
    attributes: [
      { trait_type: "Parts", value: list.length },
      { trait_type: "Build Revision", value: rev },
      ...list.map((p, i) => ({ trait_type: `Item ${i + 1}`, value: `#${Number(p.itemId)}` })),
    ],
  };
  if (externalUrl) meta.external_url = `${externalUrl}/${id}`;
  return meta;
}

module.exports = { decodeParts, buildTokenMetadata };
