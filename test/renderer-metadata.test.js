const { expect } = require("chai");
const { ethers } = require("hardhat");
const { decodeParts, buildTokenMetadata } = require("../renderer/build-metadata");

const FEE = ethers.parseEther("0.0004");
const SCHEMA = 1;
const CONFIG = {
  name: "MotorHead",
  imageBaseUrl: "https://render.example/img",
  animationBaseUrl: "https://render.example/anim",
  externalUrl: "https://motorheadsonline.com/token",
};

async function setup() {
  const [admin, alice, treasury] = await ethers.getSigners();
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(
    admin.address,
    "ipfs://metadata/",
    "ipfs://contract/contract.json",
    ethers.parseEther("0.03")
  );
  await nft.waitForDeployment();
  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(admin.address, await nft.getAddress(), treasury.address, FEE);
  await parts.waitForDeployment();
  await nft.adminMint(alice.address, 1);
  return { nft, parts, alice };
}

describe("renderer/build-metadata (integration vs the real contract)", function () {
  it("produces metadata that reflects the on-chain layout", async function () {
    const { parts, alice } = await setup();
    const layout = [
      { itemId: 7, x: 10, y: -20, scale: 1000, rotation: 0, colorwayId: 2, transparency: 0 },
      { itemId: 3, x: -5, y: 15, scale: 1200, rotation: 90, colorwayId: 5, transparency: 40 },
    ];
    await parts.connect(alice).applyParts(1, SCHEMA, layout, { value: FEE });

    // ---- the renderer's read path (as the worker will do it) ----
    const decoded = decodeParts(await parts.partsOf(1));
    const rev = await parts.buildRevision(1);
    const meta = buildTokenMetadata({ tokenId: 1, parts: decoded, buildRevision: rev, config: CONFIG });

    expect(meta.name).to.equal("MotorHead #1");
    expect(meta.image).to.equal("https://render.example/img/1.png?rev=1");
    expect(meta.animation_url).to.equal("https://render.example/anim/1.html?rev=1");
    expect(meta.external_url).to.equal("https://motorheadsonline.com/token/1");

    expect(decoded[0]).to.deep.equal({ itemId: 7, x: 10, y: -20, scale: 1000, rotation: 0, colorwayId: 2, transparency: 0 });
    expect(decoded[1].colorwayId).to.equal(5);
    expect(decoded[1].transparency).to.equal(40);
    expect(meta.attributes.find((a) => a.trait_type === "Parts").value).to.equal(2);
    expect(meta.attributes.find((a) => a.trait_type === "Build Revision").value).to.equal(1);
    expect(meta.attributes.filter((a) => a.trait_type.startsWith("Item ")).length).to.equal(2);
  });

  it("bumps image/animation ?rev on every save so the marketplace refreshes", async function () {
    const { parts, alice } = await setup();
    await parts.connect(alice).applyParts(1, SCHEMA, [{ itemId: 1, x: 0, y: 0, scale: 1000, rotation: 0, colorwayId: 0, transparency: 0 }], { value: FEE });
    await parts.connect(alice).applyParts(1, SCHEMA, [{ itemId: 2, x: 0, y: 0, scale: 1000, rotation: 0, colorwayId: 0, transparency: 0 }], { value: FEE });

    const rev = await parts.buildRevision(1);
    const meta = buildTokenMetadata({ tokenId: 1, parts: decodeParts(await parts.partsOf(1)), buildRevision: rev, config: CONFIG });
    expect(rev).to.equal(2n);
    expect(meta.image).to.equal("https://render.example/img/1.png?rev=2");
    expect(meta.animation_url).to.equal("https://render.example/anim/1.html?rev=2");
  });

  it("an unedited token renders clean base metadata (no parts)", async function () {
    const { parts } = await setup();
    const meta = buildTokenMetadata({ tokenId: 1, parts: decodeParts(await parts.partsOf(1)), buildRevision: await parts.buildRevision(1), config: CONFIG });
    expect(meta.image).to.equal("https://render.example/img/1.png?rev=0");
    expect(meta.attributes.find((a) => a.trait_type === "Parts").value).to.equal(0);
  });
});
