const fs = require("fs");
const path = require("path");

const root = process.cwd();
require("dotenv").config({ path: path.join(root, ".env") });
const metadataDir = path.join(root, "build", "metadata");
const traitsDir = path.join(root, "build", "traits");
const layoutsDir = path.join(root, "build", "layouts");

fs.mkdirSync(metadataDir, { recursive: true });

const imageBase = process.env.IMAGE_BASE_URI || "ipfs://IMAGE_CID";
const imageExtension = process.env.IMAGE_EXTENSION || "jpg";
const animationBase = process.env.ANIMATION_BASE_URI || "ipfs://ANIMATION_CID";
const externalBase = process.env.EXTERNAL_BASE_URL || "https://example.com/archive";
const customStateBase = process.env.CUSTOM_STATE_BASE_URI || "https://example.com/lam";
const partManifestUri = process.env.PART_MANIFEST_URI || "ipfs://PART_MANIFEST_CID/part-manifest.json";
const paletteManifestUri = process.env.PALETTE_MANIFEST_URI || "ipfs://PALETTE_MANIFEST_CID/lam_special_backgrounds.json";
const aliveRegistryAddress = process.env.ALIVE_REGISTRY_ADDRESS || "TBD_AFTER_DEPLOY";
const quiet = process.env.LAM_METADATA_QUIET === "1";
const writeExtensionlessTokenUriFiles = process.env.LAM_METADATA_EXTENSIONLESS !== "0";

function hasPlaceholder(value) {
  return typeof value === "string" && /IMAGE_CID|ANIMATION_CID|PART_MANIFEST_CID|PALETTE_MANIFEST_CID|example\.com|TBD_AFTER_DEPLOY/.test(value);
}

function productionValue(candidate, fallback) {
  return candidate && !hasPlaceholder(candidate) ? candidate : fallback;
}

function attribute(trait_type, value) {
  return { trait_type, value };
}

function numericJsonFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /^\d+\.json$/.test(name))
    .sort((a, b) => Number(path.basename(a, ".json")) - Number(path.basename(b, ".json")));
}

function defaultAliveState(tokenId) {
  return {
    schemaVersion: 1,
    protocol: "LAM_ALIVE_V1",
    tokenId,
    awakenable: true,
    awakened: false,
    burnRequired: false,
    baseTraitsMutable: false,
    ownerCanCustomizeVisuals: true,
    registryAddress: aliveRegistryAddress,
    tokenBoundAccountStandard: "ERC-6551-ready",
    tokenBoundAccount: null,
    agentIdentityStandard: "ERC-8004-ready",
    agentId: null,
    aliveStateUri: `${customStateBase}/${tokenId}/alive`,
    agentCardUri: `${customStateBase}/${tokenId}/agent-card`,
    evolutionDrivers: [
      "archiveAge",
      "holderBond",
      "transferScars",
      "verifiedSales",
      "blockHeartbeat",
      "ownerCustomization"
    ]
  };
}

function aliveStateForMetadata(alive, tokenId) {
  const fallback = defaultAliveState(tokenId);
  const next = { ...fallback, ...(alive || {}) };
  next.registryAddress = productionValue(next.registryAddress, aliveRegistryAddress);
  next.aliveStateUri = productionValue(next.aliveStateUri, `${customStateBase}/${tokenId}/alive`);
  next.agentCardUri = productionValue(next.agentCardUri, `${customStateBase}/${tokenId}/agent-card`);
  return next;
}

for (const fileName of numericJsonFiles(layoutsDir)) {
  const tokenId = Number(path.basename(fileName, ".json"));
  const layout = JSON.parse(fs.readFileSync(path.join(layoutsDir, fileName), "utf8"));
  const traitsPath = path.join(traitsDir, `${tokenId}.json`);
  if (!fs.existsSync(traitsPath)) {
    throw new Error(`Missing ${traitsPath}. Run npm run lam:layouts first.`);
  }

  const traits = JSON.parse(fs.readFileSync(traitsPath, "utf8"));
  const customization = layout.customization || {};
  const visualModifiers = layout.visualModifiers || {};
  const baseDna = layout.baseDna || {
    tokenId,
    traitHash: layout.traitHash,
    indexes: {},
    traits: {
      Chassis: traits.chassis,
      Head: traits.head,
      Expression: traits.expression,
      Clothes: traits.clothes,
      Hat: traits.hat,
      "Back Accessory": traits.backAccessory || "None",
      "Neck Trait": traits.neckTrait || "None",
      "Chest Accessory": traits.chestAccessory,
      "Arm Item": traits.armItem,
      Background: traits.background,
      Core: traits.core
    }
  };
  const editableSlots = customization.editableSlots || [];
  const customStateUri = productionValue(customization.customStateUri, `${customStateBase}/${tokenId}/state`);
  const alive = aliveStateForMetadata(customization.alive || customization.defaultState?.alive, tokenId);
  const defaultCustomState = {
    schemaVersion: 1,
    tokenId,
    lockedBaseTraitHash: baseDna.traitHash || layout.traitHash,
    baseTraitsMutable: false,
    overrides: {},
    extraParts: [],
    ...(customization.defaultState || {}),
    alive
  };
  const isGoldenEdition = visualModifiers.edition === "Full Gold Edition";
  const metadata = {
    name: `Motorhead #${tokenId}`,
    description:
      "A living machine-headed Motorhead. Its base identity is fixed, while owner customization, time, holding, transfers, sale history, and the chain write history onto it as overlays.",
    image: `${imageBase}/${tokenId}.${imageExtension}`,
    animation_url: `${animationBase}/${tokenId}.html`,
    external_url: `${externalBase}/${tokenId}`,
    attributes: [
      attribute("Chassis", traits.chassis),
      attribute("Head", traits.head),
      attribute("Expression", traits.expression),
      attribute("Clothes", traits.clothes),
      attribute("Back Accessory", traits.backAccessory || "None"),
      attribute("Neck Trait", traits.neckTrait || "None"),
      attribute("Hat", traits.hat),
      attribute("Chest Accessory", traits.chestAccessory),
      attribute("Arm Item", traits.armItem),
      attribute("Background", traits.background),
      attribute("Core", traits.core),
      attribute("Liquid", traits.liquidType || "Blue Coolant"),
      attribute("Liquid Texture", traits.liquidTexture || "Starfield"),
      attribute("Evolution Type", "Live Chain History"),
      attribute("Assembly Mode", "Browser Local"),
      attribute("Assembly Source", "Mechanical Canvas Builder Parts"),
      attribute("Customization", customization.enabled === false ? "Disabled" : "Enabled"),
      attribute("Awakenable", alive.awakenable === false ? "No" : "Yes"),
      attribute("Awakened", alive.awakened === true ? "Yes" : "Not Yet"),
      attribute("Alive Protocol", alive.protocol || "LAM_ALIVE_V1"),
      attribute("Burn Required", alive.burnRequired === true ? "Yes" : "No"),
      attribute("Base DNA Locked", "Yes"),
      attribute("Renderer Version", customization.rendererVersion || visualModifiers.rendererVersion || "LAM_RENDER_V1"),
      attribute("Visual Edition", visualModifiers.edition || "Base Visual"),
      attribute("Golden Lucky Mint", isGoldenEdition ? "Yes" : "No"),
      attribute("Visual Palette", visualModifiers.palette?.label || "Base Machine"),
      attribute("Palette Surface", visualModifiers.palette?.surface || "base"),
      attribute("Sale Counter Style", visualModifiers.slots?.saleCounterStyle || "pixelPocket"),
      attribute("Block Counter Style", visualModifiers.slots?.blockCounterStyle || "flipBlack")
    ],
    properties: {
      schemaVersion: 1,
      token_id: tokenId,
      renderer_version: customization.rendererVersion || visualModifiers.rendererVersion || "LAM_RENDER_V1",
      customization_enabled: customization.enabled !== false,
      customization_state_version: customization.stateVersion || "LAM_CUSTOM_STATE_V1",
      base_traits_mutable: false,
      locked_base_trait_hash: customization.lockedBaseTraitHash || baseDna.traitHash || layout.traitHash,
      base_dna: baseDna,
      visual_modifiers: visualModifiers,
      alive,
      editable_slots: editableSlots,
      custom_state_uri: customStateUri,
      part_manifest_uri: productionValue(customization.partManifestUri, partManifestUri),
      palette_manifest_uri: productionValue(customization.paletteManifestUri, paletteManifestUri),
      default_custom_state: defaultCustomState
    }
  };

  const metadataText = `${JSON.stringify(metadata, null, 2)}\n`;
  fs.writeFileSync(path.join(metadataDir, `${tokenId}.json`), metadataText);
  if (writeExtensionlessTokenUriFiles) {
    fs.writeFileSync(path.join(metadataDir, String(tokenId)), metadataText);
  }
  if (!quiet) console.log(`metadata Motorhead #${tokenId}`);
}
