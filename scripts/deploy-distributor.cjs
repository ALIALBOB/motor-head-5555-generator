/* Deploy CrateDistributor to mainnet from the throwaway. admin = MAIN wallet (founder controls via MetaMask;
   the throwaway gets NO role). Pre-flight estimates cost and aborts if the balance won't cover it. */
const { ethers } = require("hardhat");
const fs = require("fs"), path = require("path");

const SCRAPCRATES = "0x50Dc22553988de047a00328963faEe8EC5E19b12"; // mainnet ScrapCrates
const CRATE_ID = 1;
const ADMIN = "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";       // founder MAIN wallet → CONFIG_ROLE (set root, pause)
const ROOT = "0x62aced1b22765f65f4e0a4d64eb62f0c5006f987888c88097c3b0b73f877ebb4"; // 1-per-wallet snapshot (for the record)

async function main() {
  const [d] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(d.address);
  console.log("deployer:", d.address, "| balance:", ethers.formatEther(bal), "ETH");

  const F = await ethers.getContractFactory("CrateDistributor");
  const deployTx = await F.getDeployTransaction(SCRAPCRATES, CRATE_ID, ADMIN);
  const gas = await ethers.provider.estimateGas({ ...deployTx, from: d.address });
  const fee = await ethers.provider.getFeeData();
  const gasPrice = fee.gasPrice ?? fee.maxFeePerGas;
  const cost = gas * gasPrice;
  console.log(`est gas ${gas} @ ${ethers.formatUnits(gasPrice, "gwei")} gwei → ~${ethers.formatEther(cost)} ETH`);
  if (bal < (cost * 12n) / 10n) throw new Error(`insufficient balance: need ~${ethers.formatEther((cost * 12n) / 10n)} ETH (cost +20% margin), have ${ethers.formatEther(bal)}`);

  const c = await F.deploy(SCRAPCRATES, CRATE_ID, ADMIN);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log("\n✅ CrateDistributor:", addr);

  // verify wiring
  console.log("  crates():", await c.crates());
  console.log("  crateId():", (await c.crateId()).toString());
  console.log("  ADMIN has DEFAULT_ADMIN:", await c.hasRole(await c.DEFAULT_ADMIN_ROLE(), ADMIN));
  console.log("  ADMIN has CONFIG_ROLE :", await c.hasRole(await c.CONFIG_ROLE(), ADMIN));
  console.log("  deployer has DEFAULT_ADMIN (should be false):", await c.hasRole(await c.DEFAULT_ADMIN_ROLE(), d.address));

  const out = { network: "mainnet", CrateDistributor: addr, crates: SCRAPCRATES, crateId: CRATE_ID, admin: ADMIN, root: ROOT, deployedBy: d.address };
  fs.mkdirSync(path.join(__dirname, "..", "deployments"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "deployments", "mainnet-distributor.json"), JSON.stringify(out, null, 2));
  console.log("\nwrote deployments/mainnet-distributor.json");
}
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
