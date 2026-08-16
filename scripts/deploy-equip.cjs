// Deploys MotorHeadsEquip — the on-chain "equip" store for whole-machine effects + backgrounds.
//
//   MAINNET: all addresses default to the live contracts; the equip fee defaults to the live
//            canvas save fee (0.0005 ETH). Admin/CONFIG_ROLE goes to the treasury (the founder's
//            admin wallet), NOT the throwaway deployer — deploy from the throwaway, control from
//            the founder wallet via MetaMask.
//
// Env (all optional; sane mainnet defaults below):
//   ADMIN, COLLECTION_ADDRESS, CRATES_ADDRESS, PARTS_ADDRESS, TREASURY, EQUIP_FEE_WEI
//
// Run (from the throwaway deployer key in .env PRIVATE_KEY):
//   npx hardhat run scripts/deploy-equip.cjs --network mainnet

const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const admin = process.env.ADMIN || "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";        // treasury / founder admin wallet
  const collection = process.env.COLLECTION_ADDRESS || "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1";
  const crates = process.env.CRATES_ADDRESS || "0x50Dc22553988de047a00328963faEe8EC5E19b12";
  const parts = process.env.PARTS_ADDRESS || "0x3f6ADfe2fA714c28B2c6ec4762D089069675f2a2";
  const treasury = process.env.TREASURY || "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";
  const feeWei = process.env.EQUIP_FEE_WEI ? BigInt(process.env.EQUIP_FEE_WEI) : ethers.parseEther("0.0005"); // match the live save fee

  console.log(`network:    ${network.name}`);
  console.log(`deployer:   ${deployer.address}  (should be the throwaway deployer)`);
  console.log(`admin:      ${admin}  (gets DEFAULT_ADMIN_ROLE + CONFIG_ROLE)`);
  console.log(`collection: ${collection}`);
  console.log(`crates:     ${crates}`);
  console.log(`parts:      ${parts}`);
  console.log(`treasury:   ${treasury}`);
  console.log(`equip fee:  ${feeWei} wei (${ethers.formatEther(feeWei)} ETH)`);

  const Equip = await ethers.getContractFactory("MotorHeadsEquip");
  const equip = await Equip.deploy(admin, collection, crates, parts, treasury, feeWei);
  await equip.waitForDeployment();
  const address = await equip.getAddress();

  console.log("\n=== deployed ===");
  console.log(`MotorHeadsEquip: ${address}`);
  console.log("\nnext steps:");
  console.log(`  1. Set the backend Worker secret/var:  EQUIP_CONTRACT=${address}`);
  console.log(`  2. Run the grandfather migration (seed current effect owners) BEFORE flipping the read.`);
  console.log(`  3. Add the address to the site (garage-panel + archive-experience equip UI).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
