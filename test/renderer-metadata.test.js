const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { decodeParts, overlayMetadata } = require("../renderer/build-metadata");

const ORIGINAL = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "token1-original.json"), "utf8"));
const FEE = ethers.parseEther("0.0004");
const SCHEMA = 1;
const CONFIG = { imageBaseUrl: "https://render.example/img", animationBaseUrl: "https://render.example/anim" };

describe("renderer/overlayMetadata", function () {
  it("returns the ORIGINAL metadata UNCHANGED for an unedited token (this is what makes the flip safe)", function () {
    const meta = overlayMetadata(ORIGINAL, { tokenId: 1, parts: [], buildRevision: 0, config: CONFIG });
    expect(meta).to.deep.equal(ORIGINAL);
    expect(meta).to.equal(ORIGINAL); // literally the same object — no re-serialization risk
  });

  it("overlays image/animation + parts attributes for an edited token, preserving everything else", function () {
    const parts = [{ itemId: 54, x: 0, y: 0, scale: 1000, rotation: 0, colorwayId: 3, transparency: 0 }];
    const meta = overlayMetadata(ORIGINAL, { tokenId: 1, parts, buildRevision: 4, config: CONFIG });

    expect(meta.image).to.equal("https://render.example/img/1.png?rev=4");
    expect(meta.animation_url).to.equal("https://render.example/anim/1.html?rev=4");
    // everything else preserved from the original
    expect(meta.name).to.equal(ORIGINAL.name);
    expect(meta.description).to.equal(ORIGINAL.description);
    expect(meta.external_url).to.equal(ORIGINAL.external_url);
    expect(meta.properties).to.deep.equal(ORIGINAL.properties);
    // original attributes kept, parts appended
    expect(meta.attributes.slice(0, ORIGINAL.attributes.length)).to.deep.equal(ORIGINAL.attributes);
    expect(meta.attributes.find((a) => a.trait_type === "Custom Parts").value).to.equal(1);
    expect(meta.attributes.find((a) => a.trait_type === "Build Revision").value).to.equal(4);
    // the original object was not mutated
    expect(ORIGINAL.image).to.equal("ipfs://bafybeihodojvhdsjn6d2romph3jo2u5yexzqidiitnlwshej3u4oaqklxq/1.jpg");
    expect(ORIGINAL.attributes.some((a) => a.trait_type === "Custom Parts")).to.equal(false);
  });

  it("decodes real on-chain parts and overlays them (integration vs the contract)", async function () {
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
    const meta = overlayMetadata(ORIGINAL, { tokenId: 1, parts: decoded, buildRevision: rev, config: CONFIG });
    expect(meta.attributes.find((a) => a.trait_type === "Custom Parts").value).to.equal(1);
    expect(meta.image).to.equal(`https://render.example/img/1.png?rev=${rev}`);
    expect(meta.name).to.equal(ORIGINAL.name); // base identity untouched
  });
});
