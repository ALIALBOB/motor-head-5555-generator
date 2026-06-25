/*
  Generates sample layout JSON + metadata JSON for many tokens.

  This is not the blockchain mint. It is an art/data generator that Codex can extend.

  Usage:
    BUILD_COUNT=3333 node scripts/generateCollection.js

  Outputs:
    data/layouts/0001.json
    data/metadata/0001.json

  Important:
  - The generated layout is a starting composition.
  - Holders can later open the editor, move every part freely, export a new layout,
    upload it to IPFS/Arweave, and publish it through publishBuild().
*/

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const parts = require("../data/starter-parts.json");

const BUILD_COUNT = Number(process.env.BUILD_COUNT || 24);
const OUT_LAYOUTS = path.join(__dirname, "../data/layouts");
const OUT_METADATA = path.join(__dirname, "../data/metadata");

fs.mkdirSync(OUT_LAYOUTS, { recursive: true });
fs.mkdirSync(OUT_METADATA, { recursive: true });

function pad(n) {
  return String(n).padStart(4, "0");
}

// Small deterministic RNG so the same token number always gets the same generated start layout.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

const partByKey = Object.fromEntries(parts.map((p) => [p.key, p]));

function placement(id, key, x, y, overrides = {}) {
  const part = partByKey[key];
  if (!part) throw new Error(`Unknown part key ${key}`);
  return {
    id,
    partId: part.id,
    key,
    x,
    y,
    rotation: overrides.rotation || 0,
    scaleX: overrides.scaleX || overrides.scale || 1,
    scaleY: overrides.scaleY || overrides.scale || 1,
    z: overrides.z || id,
    material: overrides.material || "brass",
    colorVariant: overrides.colorVariant || 0,
    opacity: overrides.opacity ?? 1,
    flipX: overrides.flipX || false,
    flipY: overrides.flipY || false,
    locked: false
  };
}

function generateLayout(tokenId) {
  const random = rng(0xdecafbad ^ tokenId * 2654435761);
  const canvasTypes = [
    "Gear Swarm",
    "Pipe Chamber",
    "Clock Reactor",
    "Liquid Engine",
    "Broken Mechanism",
    "Creature Workshop"
  ];
  const liquidTypes = ["Deep Teal Oil", "Blue Coolant", "Red Pressure", "Green Biofluid", "Gold Resin", "Mercury", "Purple Ether", "Rust Sludge"];
  const textures = ["Smooth", "Bubbly", "Molten", "Metallic", "Slimy", "Electric", "Smoky", "Crystal"];

  const layout = {
    schema: "mechanical-canvas-layout/v1",
    tokenId,
    name: `Mechanical Canvas #${pad(tokenId)}`,
    canvas: {
      width: 1024,
      height: 1024,
      type: pick(random, canvasTypes),
      background: pick(random, ["charcoal", "deep-black", "rust-grid", "archive-blue"])
    },
    liquid: {
      type: pick(random, liquidTypes),
      texture: pick(random, textures),
      colorIndex: Math.floor(random() * 12),
      fillLevel: 60 + Math.floor(random() * 41)
    },
    placements: []
  };

  let id = 1;

  // Base frame.
  layout.placements.push(placement(id++, "frame.box", 512, 512, { scaleX: 7.8, scaleY: 7.8, z: 1 }));

  // Gear field. These can later be moved by the holder into eyes, faces, symbols, etc.
  const gearCount = 8 + Math.floor(random() * 12);
  for (let i = 0; i < gearCount; i++) {
    const key = random() > 0.45 ? "gear.large" : "gear.small";
    layout.placements.push(placement(id++, key, 160 + random() * 720, 170 + random() * 620, {
      scale: key === "gear.large" ? 0.7 + random() * 1.5 : 0.5 + random() * 1.2,
      rotation: random() * Math.PI * 2,
      material: pick(random, ["brass", "iron", "black", "blueSteel", "gold"]),
      z: 10 + i
    }));
  }

  // Pipes.
  const pipeCount = 8 + Math.floor(random() * 10);
  for (let i = 0; i < pipeCount; i++) {
    const key = pick(random, ["pipe.straight", "pipe.elbow", "pipe.curve", "wire.arc"]);
    layout.placements.push(placement(id++, key, 120 + random() * 780, 130 + random() * 760, {
      scaleX: 0.8 + random() * 1.8,
      scaleY: 0.8 + random() * 1.4,
      rotation: random() * Math.PI * 2,
      material: pick(random, ["brass", "iron", "black", "blueSteel"]),
      z: 30 + i
    }));
  }

  // Liquid tanks and drops.
  layout.placements.push(placement(id++, "tank.round", 512, 512, { scale: 1.6, z: 60, material: "glass", colorVariant: layout.liquid.colorIndex }));
  for (let i = 0; i < 12; i++) {
    layout.placements.push(placement(id++, "drop.liquid", 150 + random() * 720, 150 + random() * 720, {
      scale: 0.4 + random() * 0.9,
      rotation: random() * Math.PI * 2,
      z: 70 + i,
      colorVariant: layout.liquid.colorIndex,
      opacity: 0.45 + random() * 0.55
    }));
  }

  // Micro detail field. These let holders almost draw with parts.
  const microCount = 28 + Math.floor(random() * 36);
  for (let i = 0; i < microCount; i++) {
    const key = pick(random, ["bolt.micro", "screw.micro", "spark.star", "smoke.curl"]);
    layout.placements.push(placement(id++, key, 80 + random() * 860, 80 + random() * 860, {
      scale: 0.25 + random() * 0.85,
      rotation: random() * Math.PI * 2,
      z: 100 + i,
      material: pick(random, ["brass", "iron", "gold", "bone"]),
      opacity: 0.55 + random() * 0.45
    }));
  }

  return layout;
}

for (let tokenId = 1; tokenId <= BUILD_COUNT; tokenId++) {
  const layout = generateLayout(tokenId);
  const json = JSON.stringify(layout, null, 2);
  const hash = crypto.createHash("sha256").update(json).digest("hex");

  fs.writeFileSync(path.join(OUT_LAYOUTS, `${pad(tokenId)}.json`), json);

  const metadata = {
    name: `Mechanical Canvas #${pad(tokenId)}`,
    description: "A freeform mechanical canvas NFT. The holder can move gears, pipes, oil, and micro-parts to build any mechanical drawing or face.",
    image: `ipfs://PREVIEW_CID/previews/${pad(tokenId)}.svg`,
    animation_url: `ipfs://RENDERER_CID/index.html?tokenId=${tokenId}`,
    attributes: [
      { trait_type: "Canvas", value: layout.canvas.type },
      { trait_type: "Liquid", value: layout.liquid.type },
      { trait_type: "Texture", value: layout.liquid.texture },
      { trait_type: "Placed Parts", value: layout.placements.length },
      { trait_type: "Layout Hash", value: hash.slice(0, 16) }
    ]
  };

  fs.writeFileSync(path.join(OUT_METADATA, `${pad(tokenId)}.json`), JSON.stringify(metadata, null, 2));
}

console.log(`Generated ${BUILD_COUNT} layouts and metadata files.`);
