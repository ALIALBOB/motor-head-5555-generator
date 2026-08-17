// Configures the "Backgrounds Vol. 2" crate (crateId 4) loot table on ScrapCrates: parts 25-36, equal odds.
// The throwaway deployer is ScrapCrates admin (CONFIG_ROLE), so run this with the deployer key in .env:
//
//   npx hardhat run scripts/set-vol2-loot.cjs --network mainnet
//
// Idempotent-ish: each call writes a NEW immutable loot version and points crateId 4 at it (safe to re-run to
// re-weight). In-flight opens keep the version they committed to.
const { ethers, network } = require("hardhat");

const CRATES = process.env.CRATES_ADDRESS || "0x50Dc22553988de047a00328963faEe8EC5E19b12";
const CRATE_ID = Number(process.env.VOL2_CRATE_ID || 4);
const PART_IDS = Array.from({ length: 12 }, (_, i) => 25 + i); // 25..36 = the 12 Vol.2 backgrounds
const WEIGHTS = PART_IDS.map(() => 1);                          // equal odds

async function main() {
  const [signer] = await ethers.getSigners();
  const crates = await ethers.getContractAt("ScrapCrates", CRATES, signer);
  console.log(`network:  ${network.name}`);
  console.log(`signer:   ${signer.address}  (must be ScrapCrates admin/CONFIG_ROLE — the throwaway deployer)`);
  console.log(`crates:   ${CRATES}`);
  console.log(`crateId:  ${CRATE_ID}  (Backgrounds Vol. 2)`);
  console.log(`partIds:  [${PART_IDS.join(", ")}]`);
  console.log(`weights:  [${WEIGHTS.join(", ")}]  (equal odds)`);

  const before = await crates.crateLootVersion(CRATE_ID);
  const tx = await crates.setLootTable(CRATE_ID, PART_IDS, WEIGHTS);
  console.log(`\nsetLootTable tx: ${tx.hash}`);
  const rc = await tx.wait();
  const after = await crates.crateLootVersion(CRATE_ID);
  if (rc.status !== 1) throw new Error("tx reverted");
  console.log(`✓ loot version for crateId ${CRATE_ID}: ${before} -> ${after}`);
  console.log("\nnext: mint/airdrop crate id 4 to holders (CrateDistributor.setCrateId(4) + new root, or admin mintCrates).");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
