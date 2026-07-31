// Deploys the MotorHeadsParts companion (the on-chain save store).
//
//   LOCAL / TESTNET:  no COLLECTION_ADDRESS -> also deploys a fresh test MotorHeads collection
//                     and mints a couple tokens to the deployer, so you can save immediately.
//   MAINNET:          pass COLLECTION_ADDRESS=0x0a50...ceb1 to point at the real collection.
//
// Env: COLLECTION_ADDRESS, TREASURY, EDIT_FEE_WEI  (all optional; sane defaults below)
// Run: npx hardhat run scripts/deploy-motorheads-parts.js [--network localhost|sepolia]

const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = process.env.TREASURY || "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";
  const feeWei = process.env.EDIT_FEE_WEI ? BigInt(process.env.EDIT_FEE_WEI) : ethers.parseEther("0.0004");

  console.log(`network: ${network.name}`);
  console.log(`deployer: ${deployer.address}`);
  console.log(`treasury: ${treasury}`);
  console.log(`edit fee: ${feeWei} wei (~$1 placeholder)`);

  let collectionAddress = process.env.COLLECTION_ADDRESS;
  if (!collectionAddress) {
    console.log("\nNo COLLECTION_ADDRESS -> deploying a fresh TEST collection (local/testnet only)…");
    const Collection = await ethers.getContractFactory("LivingArchiveMachines");
    const nft = await Collection.deploy(
      deployer.address,
      "ipfs://test-metadata/",
      "ipfs://test-contract/contract.json",
      ethers.parseEther("0.03")
    );
    await nft.waitForDeployment();
    collectionAddress = await nft.getAddress();
    await (await nft.adminMint(deployer.address, 2)).wait();
    console.log(`test collection: ${collectionAddress}  (minted tokens #1, #2 to deployer)`);
  } else {
    console.log(`\nusing existing collection: ${collectionAddress}`);
  }

  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(deployer.address, collectionAddress, treasury, feeWei);
  await parts.waitForDeployment();
  const partsAddress = await parts.getAddress();

  console.log("\n=== deployed ===");
  console.log(`MotorHeadsParts: ${partsAddress}`);
  console.log(`collection:      ${collectionAddress}`);
  console.log("\nrenderer env to use:");
  console.log(`  PARTS_CONTRACT=${partsAddress}`);
  console.log(`  COLLECTION_ADDRESS=${collectionAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
