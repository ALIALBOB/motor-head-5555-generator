/* Deploy FoundryForge — tiers and bought parts, on chain (founder 2026-09-19).
   The OWNER is the founder's main wallet, so every price, the treasury and the fee stay under his MetaMask; the
   deploying key gets nothing. The contract never holds ETH: every payment is forwarded to the treasury in the same
   transaction. Pre-flight estimates the cost and aborts if the balance will not cover it.

   AFTER this deploy, three transactions from the FOUNDER'S wallet finish the job (printed again at the end):
     1) ScrapParts.grantRole(MINTER_ROLE, <forge>)   so it can mint a bought part into the robot's garage
     2) forge.setTierPrice / setPartPrices           the prices the site already shows
     3) forge.seedTiers(...)                          carry over the tiers robots have already paid for
   Nothing is live for holders until the site is pointed at it, so the order is safe.

   Run:  npx hardhat run scripts/deploy-forge.cjs --network mainnet
*/
const { ethers } = require("hardhat");
const fs = require("fs"), path = require("path");

const COLLECTION = "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1";  // MotorHeads 5555
const PARTS      = "0x3f6ADfe2fA714c28B2c6ec4762D089069675f2a2";  // ScrapParts (ERC-1155)
const CRATES     = "0x50Dc22553988de047a00328963faEe8EC5E19b12";  // ScrapCrates: garageOf() + activated()
const TREASURY   = "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";  // every payment lands here
const OWNER      = "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1";  // the founder keeps the controls

async function main() {
  const [d] = await ethers.getSigners();
  const bal = await ethers.provider.getBalance(d.address);
  console.log("deployer:", d.address, "| balance:", ethers.formatEther(bal), "ETH");

  const F = await ethers.getContractFactory("FoundryForge");
  const deployTx = await F.getDeployTransaction(COLLECTION, PARTS, CRATES, TREASURY, OWNER);
  const gas = await ethers.provider.estimateGas({ ...deployTx, from: d.address });
  const fee = await ethers.provider.getFeeData();
  const gasPrice = fee.maxFeePerGas ?? fee.gasPrice;
  const cost = gas * gasPrice;
  console.log("gas:", gas.toString(), "| price:", ethers.formatUnits(gasPrice, "gwei"), "gwei | cost ~", ethers.formatEther(cost), "ETH");
  if (bal < cost) throw new Error("balance will not cover the deploy");

  const forge = await F.deploy(COLLECTION, PARTS, CRATES, TREASURY, OWNER);
  await forge.waitForDeployment();
  const address = await forge.getAddress();
  console.log("\nFoundryForge deployed at", address);

  // read it back, so what is on chain is what we meant
  console.log("  collection:", await forge.collection());
  console.log("  parts     :", await forge.parts());
  console.log("  crates    :", await forge.crates());
  console.log("  treasury  :", await forge.treasury());
  console.log("  owner     :", await forge.owner());

  const out = path.join(__dirname, "..", "deployments", "foundry-forge.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ address, collection: COLLECTION, parts: PARTS, crates: CRATES, treasury: TREASURY, owner: OWNER, deployedBy: d.address, at: new Date().toISOString() }, null, 2));
  console.log("written:", out);

  const MINTER = ethers.id("MINTER_ROLE");
  console.log("\nNOW, FROM THE FOUNDER'S WALLET:");
  console.log("  1) ScrapParts " + PARTS + "  grantRole(" + MINTER + ", " + address + ")");
  console.log("  2) setTierPrice(2..5) and setPartPrices([...]) on " + address);
  console.log("  3) seedTiers([...],[...]) to carry over tiers already paid for");
  console.log("  4) setFee(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419, 100, 300000000000000)  <- Chainlink ETH/USD, $1, 0.0003 ETH fallback");
}

main().catch((e) => { console.error(e); process.exit(1); });
