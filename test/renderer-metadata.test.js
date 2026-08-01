const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { decodeParts, curateMetadata, bgFamily } = require("../renderer/build-metadata");

const ORIGINAL = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "token1-original.json"), "utf8"));
const FEE = ethers.parseEther("0.0004");
const SCHEMA = 1;
const CONFIG = { imageBaseUrl: "https://render.example/img", animationBaseUrl: "https://render.example/anim" };
const KEEP_ORDER = ["Head", "Chassis", "Expression", "Hat", "Clothes", "Neck Trait", "Chest Accessory", "Back Accessory", "Arm Item", "Background", "Golden Lucky Mint"];

describe("renderer/curateMetadata", function () {
  it("keeps only the meaningful traits (in order) and drops the clutter", function () {
    const meta = curateMetadata(ORIGINAL, { tokenId: 1, parts: [] });
    const types = meta.attributes.map((a) => a.trait_type);
    for (const bad of ["Alive Protocol", "Assembly Mode", "Assembly Source", "Base DNA Locked", "Renderer Version", "Liquid", "Liquid Texture", "Core", "Visual Palette", "Visual Edition", "Customization", "Burn Required", "Evolution Type", "Palette Surface"]) {
      expect(types, `dropped ${bad}`).to.not.include(bad);
    }
    expect(types).to.deep.equal(KEEP_ORDER);
  });

  it("rewrites Background from the ACTUAL color (fixes the broken filter)", function () {
    expect(bgFamily("#4b2a08")).to.equal("Brown");   // token 1's real bg (scene said 'Teal Archive')
    expect(bgFamily("#b6dce9")).to.equal("Sky Blue"); // token 500 (also 'Teal Archive' scene)
    const meta = curateMetadata(ORIGINAL, { tokenId: 1, parts: [] });
    expect(meta.attributes.find((a) => a.trait_type === "Background").value).to.equal("Brown");
  });

  it("serves Expression as its family — clean 10-value filter", function () {
    // token 1's raw Expression is "Bored Signal" -> family "Sad"
    const meta = curateMetadata(ORIGINAL, { tokenId: 1, parts: [] });
    expect(meta.attributes.find((a) => a.trait_type === "Expression").value).to.equal("Sad");
    expect(ORIGINAL.attributes.find((a) => a.trait_type === "Expression").value).to.equal("Bored Signal"); // original untouched
  });

  it("preserves name/description/image/animation/properties for unedited tokens", function () {
    const meta = curateMetadata(ORIGINAL, { tokenId: 1, parts: [] });
    expect(meta.name).to.equal(ORIGINAL.name);
    expect(meta.description).to.equal(ORIGINAL.description);
    expect(meta.image).to.equal(ORIGINAL.image);
    expect(meta.animation_url).to.equal(ORIGINAL.animation_url);
    expect(meta.external_url).to.equal(ORIGINAL.external_url);
    expect(meta.properties).to.deep.equal(ORIGINAL.properties);
    expect(ORIGINAL.attributes.length).to.be.greaterThan(meta.attributes.length); // original untouched (still full)
  });

  it("overlays image/animation + parts attrs for edited tokens, keeping curated base traits", async function () {
    const [admin, alice, treasury] = await ethers.getSigners();
    const Collection = await ethers.getContractFactory("LivingArchiveMachines");
    const nft = await Collection.deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
    await nft.waitForDeployment();
    const Parts = await ethers.getContractFactory("MotorHeadsParts");
    const parts = await Parts.deploy(admin.address, await nft.getAddress(), treasury.address, FEE);
    await parts.waitForDeployment();
    await nft.adminMint(alice.address, 1);
    await parts.connect(alice).applyParts(1, SCHEMA, [{ itemId: 7, x: 1, y: 2, scale: 1000, rotation: 0, colorwayId: 2, transparency: 0 }], { value: FEE });

    const decoded = decodeParts(await parts.partsOf(1));
    const rev = Number(await parts.buildRevision(1));
    const meta = curateMetadata(ORIGINAL, { tokenId: 1, parts: decoded, buildRevision: rev, config: CONFIG });
    expect(meta.image).to.equal(`https://render.example/img/1.png?rev=${rev}`);
    expect(meta.attributes.find((a) => a.trait_type === "Custom Parts").value).to.equal(1);
    expect(meta.attributes.some((a) => a.trait_type === "Head")).to.equal(true); // curated base traits kept
    expect(meta.name).to.equal(ORIGINAL.name);
  });
});
