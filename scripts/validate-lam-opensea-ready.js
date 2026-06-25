const fs = require("fs");
const path = require("path");

const root = process.cwd();
require("dotenv").config({ path: path.join(root, ".env") });
const supply = Number(process.env.LAM_SUPPLY || "5555");
const strict = process.env.LAM_OPENSEA_STRICT !== "0";
const requireAllMedia = process.env.LAM_REQUIRE_ALL_MEDIA === "1";
const mintedLimit = Number(process.env.LAM_TEST_MINT_COUNT || "0");
const mediaLimit = requireAllMedia ? supply : mintedLimit || Math.min(100, supply);
const imageExtension = process.env.IMAGE_EXTENSION || "jpg";
const requireExtensionlessMetadata = process.env.LAM_METADATA_EXTENSIONLESS !== "0";

const dirs = {
  metadata: path.join(root, "build", "metadata"),
  images: path.join(root, "build", "images"),
  animations: path.join(root, "build", "animations"),
  contract: path.join(root, "build", "contract")
};

const errors = [];
const warnings = [];
const placeholderTokenIds = [];

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function countJsonFiles(dir) {
  if (!exists(dir)) return 0;
  return fs.readdirSync(dir).filter((name) => /^\d+\.json$/.test(name)).length;
}

if (!exists(dirs.metadata)) fail("Missing build/metadata. Run npm run lam:metadata.");
if (!exists(path.join(dirs.contract, "contract.json"))) {
  fail("Missing build/contract/contract.json. Run npm run lam:contract-metadata.");
}

const metadataCount = countJsonFiles(dirs.metadata);
if (metadataCount !== supply) fail(`Expected ${supply} metadata json files, found ${metadataCount}.`);

for (let tokenId = 1; tokenId <= Math.min(supply, metadataCount || supply); tokenId++) {
  const filePath = path.join(dirs.metadata, `${tokenId}.json`);
  if (!exists(filePath)) {
    fail(`Missing metadata ${tokenId}.json`);
    continue;
  }

  const metadata = readJson(filePath);
  if (metadata.name !== `Motorhead #${tokenId}`) fail(`Bad name in ${tokenId}.json`);
  if (!metadata.image) fail(`Missing image in ${tokenId}.json`);
  if (!metadata.animation_url) warn(`Missing animation_url in ${tokenId}.json`);
  if (!Array.isArray(metadata.attributes) || metadata.attributes.length < 10) {
    fail(`Too few attributes in ${tokenId}.json`);
  }

  const text = JSON.stringify(metadata);
  if (strict && /IMAGE_CID|ANIMATION_CID|PART_MANIFEST_CID|PALETTE_MANIFEST_CID|example\.com|TBD_AFTER_DEPLOY/.test(text)) {
    placeholderTokenIds.push(tokenId);
  }
}

if (placeholderTokenIds.length) {
  const sample = placeholderTokenIds.slice(0, 10).join(", ");
  fail(`Placeholder URI/value remains in ${placeholderTokenIds.length} metadata file(s). First token IDs: ${sample}`);
}

for (let tokenId = 1; tokenId <= mediaLimit; tokenId++) {
  if (!exists(path.join(dirs.images, `${tokenId}.${imageExtension}`))) fail(`Missing image ${tokenId}.${imageExtension}`);
  if (!exists(path.join(dirs.animations, `${tokenId}.html`))) warn(`Missing animation ${tokenId}.html`);
  if (requireExtensionlessMetadata && !exists(path.join(dirs.metadata, String(tokenId)))) {
    fail(`Missing extensionless metadata ${tokenId} for OpenSea setBaseURI tokenURI lookup`);
  }
}

if (exists(path.join(dirs.contract, "contract.json"))) {
  const contractMetadata = readJson(path.join(dirs.contract, "contract.json"));
  for (const field of ["name", "description", "image", "external_link"]) {
    if (!contractMetadata[field]) fail(`contract.json missing ${field}`);
  }
  const text = JSON.stringify(contractMetadata);
  if (strict && /COLLECTION_IMAGE_CID|example\.com|0000000000000000000000000000000000000000/.test(text)) {
    fail("Placeholder URI/value remains in contract.json");
  }
}

for (const message of warnings) console.warn(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

if (errors.length) {
  console.error(`OpenSea readiness failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exitCode = 1;
} else {
  console.log(`OpenSea readiness passed with ${warnings.length} warning(s). Checked ${metadataCount} metadata files and ${mediaLimit} media slots.`);
}
