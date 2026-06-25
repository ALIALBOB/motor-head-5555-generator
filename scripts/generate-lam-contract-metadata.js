const fs = require("fs");
const path = require("path");

const root = process.cwd();
require("dotenv").config({ path: path.join(root, ".env") });
const outputDir = path.join(root, "build", "contract");
const outputPath = path.join(outputDir, "contract.json");
const partManifestPath = path.join(outputDir, "part-manifest.json");
const paletteManifestPath = path.join(outputDir, "palette-manifest.json");

fs.mkdirSync(outputDir, { recursive: true });

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

const visualRules = readJson("config/lam_visual_randomizer_rules.json");
const paletteManifest = readJson("config/lam_special_backgrounds.json");

const metadata = {
  name: process.env.LAM_COLLECTION_NAME || "Motorheads",
  description:
    process.env.LAM_COLLECTION_DESCRIPTION ||
    "A 5555-piece living machine-headed NFT collection. Each Motorhead has fixed base DNA, browser-local assembly, live chain-history reactions, owner customization hooks, awaken-ready metadata, transfer scars, holder-bond evolution, and lucky full-gold editions.",
  image: process.env.LAM_COLLECTION_IMAGE || "ipfs://COLLECTION_IMAGE_CID/collection.png",
  banner_image: process.env.LAM_COLLECTION_BANNER || "ipfs://COLLECTION_IMAGE_CID/banner.png",
  external_link: process.env.LAM_COLLECTION_EXTERNAL_LINK || "https://example.com/archive",
  seller_fee_basis_points: Number(process.env.LAM_SELLER_FEE_BASIS_POINTS || "500"),
  fee_recipient:
    process.env.LAM_FEE_RECIPIENT || "0x0000000000000000000000000000000000000000"
};

fs.writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`);
fs.writeFileSync(partManifestPath, `${JSON.stringify({
  schemaVersion: 1,
  collection: metadata.name,
  contractAddress: process.env.LAM_OPENSEA_DROP_CONTRACT_ADDRESS || null,
  rendererVersion: visualRules.rendererVersion || "LAM_RENDER_V1",
  customizationStateVersion: visualRules.customizationStateVersion || "LAM_CUSTOM_STATE_V1",
  policy: visualRules.policy,
  editableSlots: visualRules.editableSlots || [],
  counterStyles: visualRules.counterStyles || {},
  counterDigitColors: visualRules.counterDigitColors || [],
  protectedBaseFields: visualRules.protectedBaseFields || [],
  goldenEdition: visualRules.goldenEdition || {}
}, null, 2)}\n`);
fs.writeFileSync(paletteManifestPath, `${JSON.stringify(paletteManifest, null, 2)}\n`);
console.log(`wrote ${path.relative(root, outputPath)}`);
