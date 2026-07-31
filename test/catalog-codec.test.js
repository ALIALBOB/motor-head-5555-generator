const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  itemIdOf, keyOfItemId, colorwayIdOf, keyOfColorwayId, encodeLayout, decodeLayout, COUNT,
} = require("../renderer/catalog.js");

const FEE = ethers.parseEther("0.0004");
const SCHEMA = 1;

async function setup() {
  const [admin, alice, treasury] = await ethers.getSigners();
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(admin.address, "ipfs://metadata/", "ipfs://contract/contract.json", ethers.parseEther("0.03"));
  await nft.waitForDeployment();
  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(admin.address, await nft.getAddress(), treasury.address, FEE);
  await parts.waitForDeployment();
  await nft.adminMint(alice.address, 1);
  return { parts, alice };
}

describe("catalog codec", function () {
  it("loaded the frozen registry (167 items / 15 colorways)", function () {
    expect(COUNT.items).to.equal(167);
    expect(COUNT.colorways).to.equal(15);
  });

  it("maps real item/colorway keys to stable ids and back", function () {
    // first-machine is index 0 -> id 1; gold is colorway index 0 -> id 1
    expect(itemIdOf("first-machine")).to.equal(1);
    expect(keyOfItemId(1)).to.equal("first-machine");
    expect(colorwayIdOf("gold")).to.equal(1);
    expect(keyOfColorwayId(1)).to.equal("gold");
    // unknown -> 0 / null
    expect(itemIdOf("does-not-exist")).to.equal(0);
    expect(keyOfItemId(99999)).to.equal(null);
  });

  it("round-trips a canvas layout through the chain (encode -> applyParts -> read -> decode)", async function () {
    const { parts, alice } = await setup();

    // a layout as the Owner Canvas produces it (string keys + transform)
    const layout = [
      { itemId: "gear-top-hat", colorwayId: "rust", transparency: 0, x: 12, y: -30, scale: 1.25, rotation: 350 },
      { itemId: "heart-shades-sticker", colorwayId: "red", transparency: 60, x: -8, y: 20, scale: 1.0, rotation: 15 },
    ];

    // encode -> numeric Part[] and save on-chain
    const encoded = encodeLayout(layout);
    expect(encoded[0].itemId).to.equal(itemIdOf("gear-top-hat"));
    expect(encoded[0].scale).to.equal(1250); // 1.25 * 1000
    expect(encoded[1].colorwayId).to.equal(colorwayIdOf("red"));
    await parts.connect(alice).applyParts(1, SCHEMA, encoded, { value: FEE });

    // read back on-chain and decode -> should match the original layout
    const decoded = decodeLayout(await parts.partsOf(1));
    expect(decoded).to.have.length(2);
    expect(decoded[0]).to.deep.equal({ itemId: "gear-top-hat", x: 12, y: -30, scale: 1.25, rotation: 350, colorwayId: "rust", transparency: 0 });
    expect(decoded[1]).to.deep.equal({ itemId: "heart-shades-sticker", x: -8, y: 20, scale: 1.0, rotation: 15, colorwayId: "red", transparency: 60 });
  });
});
