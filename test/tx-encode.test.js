const { expect } = require("chai");
const { ethers } = require("hardhat");
const { buildApplyPartsTx } = require("../renderer/tx.js");
const { decodeLayout } = require("../renderer/catalog.js");

const FEE = ethers.parseEther("0.0004");

async function setup() {
  const [admin, alice, treasury] = await ethers.getSigners();
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
  await nft.waitForDeployment();
  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(admin.address, await nft.getAddress(), treasury.address, FEE);
  await parts.waitForDeployment();
  await nft.adminMint(alice.address, 1);
  return { parts, alice };
}

describe("applyParts raw tx encoder (what the Save button sends)", function () {
  it("raw calldata built by buildApplyPartsTx saves the layout on-chain", async function () {
    const { parts, alice } = await setup();
    const partsAddr = await parts.getAddress();

    const layout = [
      { itemId: "gear-top-hat", colorwayId: "rust", transparency: 0, x: 12, y: -30, scale: 1.25, rotation: 350 },
      { itemId: "heart-shades-sticker", colorwayId: "red", transparency: 60, x: -8, y: 20, scale: 1.0, rotation: 15 },
    ];

    // build the RAW tx exactly as the website will (viem calldata, hex value) …
    const tx = buildApplyPartsTx({ tokenId: 1, schema: 1, layout, contract: partsAddr, feeWei: FEE });
    expect(tx.to).to.equal(partsAddr);
    expect(tx.data.startsWith("0x")).to.equal(true);
    expect(BigInt(tx.value)).to.equal(FEE);

    // … and send it as a raw transaction (no ethers contract wrapper — mirrors eth_sendTransaction)
    await (await alice.sendTransaction({ to: tx.to, data: tx.data, value: BigInt(tx.value) })).wait();

    // the layout is now saved on-chain and decodes back to the original
    expect(await parts.buildRevision(1)).to.equal(1n);
    const decoded = decodeLayout(await parts.partsOf(1));
    expect(decoded[0]).to.deep.equal({ itemId: "gear-top-hat", x: 12, y: -30, scale: 1.25, rotation: 350, colorwayId: "rust", transparency: 0 });
    expect(decoded[1]).to.deep.equal({ itemId: "heart-shades-sticker", x: -8, y: 20, scale: 1.0, rotation: 15, colorwayId: "red", transparency: 60 });
  });

  it("underpaying the fee in the raw tx reverts", async function () {
    const { parts, alice } = await setup();
    const tx = buildApplyPartsTx({ tokenId: 1, schema: 1, layout: [], contract: await parts.getAddress(), feeWei: FEE });
    await expect(alice.sendTransaction({ to: tx.to, data: tx.data, value: FEE - 1n })).to.be.reverted;
  });
});
