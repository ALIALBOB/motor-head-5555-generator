// Post-deploy setup for the fresh Sepolia contracts: grant the deployer MINTER_ROLE on ScrapCrates
// (so the dashboard/admin can mint crates) and confirm ScrapCrates is a VRF consumer + the sub's LINK.
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const [signer] = await ethers.getSigners();
  const crates = await ethers.getContractAt("ScrapCrates", dep.contracts.ScrapCrates);
  const MINTER = await crates.MINTER_ROLE();

  if (!(await crates.hasRole(MINTER, signer.address))) {
    console.log("granting ScrapCrates.MINTER_ROLE ->", signer.address);
    await (await crates.grantRole(MINTER, signer.address)).wait();
  }
  console.log("deployer has MINTER_ROLE:", await crates.hasRole(MINTER, signer.address));

  const coord = await ethers.getContractAt(
    ["function getSubscription(uint256) view returns (uint96 balance,uint96 nativeBalance,uint64 reqCount,address owner,address[] consumers)"],
    dep.params.vrfCoordinator
  );
  const sub = await coord.getSubscription(dep.params.subscriptionId);
  const isConsumer = sub.consumers.map((a) => a.toLowerCase()).includes(dep.contracts.ScrapCrates.toLowerCase());
  console.log("ScrapCrates is a VRF consumer:", isConsumer);
  console.log("sub LINK balance:", ethers.formatEther(sub.balance), "LINK | consumers:", sub.consumers.length);
  if (!isConsumer) {
    console.log("adding as consumer...");
    const c2 = await ethers.getContractAt(["function addConsumer(uint256,address) external"], dep.params.vrfCoordinator);
    await (await c2.addConsumer(dep.params.subscriptionId, dep.contracts.ScrapCrates)).wait();
    console.log("added.");
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
