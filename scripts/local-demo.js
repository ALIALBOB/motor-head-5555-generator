// Local end-to-end setup: deploy the collection + companion on the running Hardhat node,
// mint token #1, and save a sample layout on-chain (encoded via the real catalog codec).
// Writes the addresses to OUT so the renderer can be pointed at them.
//
// Run against a persistent node:  npx hardhat run scripts/local-demo.js --network localhost

const { ethers } = require("hardhat");
const fs = require("fs");
const { encodeLayout } = require("../renderer/catalog.js");

async function main() {
  const [deployer] = await ethers.getSigners();
  const FEE = ethers.parseEther("0.0004");
  const TREASURY = "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";

  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(deployer.address, "ipfs://test/", "ipfs://test/contract.json", ethers.parseEther("0.03"));
  await nft.waitForDeployment();
  await (await nft.adminMint(deployer.address, 1)).wait(); // token #1

  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(deployer.address, await nft.getAddress(), TREASURY, FEE);
  await parts.waitForDeployment();

  // A real Owner-Canvas layout, saved on-chain by the owner.
  const layout = [
    { itemId: "gear-top-hat", colorwayId: "rust", transparency: 0, x: 12, y: -30, scale: 1.25, rotation: 350 },
    { itemId: "heart-shades-sticker", colorwayId: "red", transparency: 60, x: -8, y: 20, scale: 1.0, rotation: 15 },
  ];
  await (await parts.applyParts(1, 1, encodeLayout(layout), { value: FEE })).wait();

  const info = {
    rpc: "http://127.0.0.1:8545",
    partsContract: await parts.getAddress(),
    collection: await nft.getAddress(),
    token: 1,
    savedLayout: layout,
    buildRevision: Number(await parts.buildRevision(1)),
  };
  const out = process.env.OUT || "local-demo.json";
  fs.writeFileSync(out, JSON.stringify(info, null, 2));
  console.log("READY:", JSON.stringify(info));
}

main().catch((e) => { console.error(e); process.exit(1); });
