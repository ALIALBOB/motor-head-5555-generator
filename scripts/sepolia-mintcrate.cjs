/*
  Mint ONE crate to the deployer wallet (== the wallet connected in the dashboard) and leave it UNOPENED,
  so you can click "Open Crate" in the UI and watch the VRF draw. Also reports the VRF sub's LINK balance
  (openCrate needs LINK to fulfill). Run: npx hardhat run scripts/sepolia-mintcrate.cjs --network sepolia
*/
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const c = dep.contracts;
  const [signer] = await ethers.getSigners();
  const me = signer.address;
  const CRATE_ID = 1n;
  console.log("wallet:", me, "| ETH:", ethers.formatEther(await ethers.provider.getBalance(me)));

  const crates = await ethers.getContractAt("ScrapCrates", c.ScrapCrates);
  const before = await crates.balanceOf(me, CRATE_ID);
  console.log("crate balance before:", before.toString());

  const rc = await (await crates.mintCrates(me, CRATE_ID, 1)).wait();
  const after = await crates.balanceOf(me, CRATE_ID);
  console.log("✓ minted 1 crate | balance now:", after.toString(), "| tx:", rc.hash);

  // VRF LINK check — openCrate can't fulfill without LINK on the subscription
  const coord = await ethers.getContractAt(
    ["function getSubscription(uint256) view returns (uint96 balance,uint96 nativeBalance,uint64 reqCount,address owner,address[] consumers)"],
    dep.params.vrfCoordinator
  );
  const sub = await coord.getSubscription(dep.params.subscriptionId);
  console.log("VRF sub LINK balance:", ethers.formatEther(sub.balance), "LINK");
  if (sub.balance === 0n) console.log("⚠️  sub has 0 LINK — Open Crate will sit pending. Fund it: npm run ... (sepolia-fund-link.cjs)");
  else console.log("✓ sub funded — Open Crate should fulfill in ~30-60s");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
