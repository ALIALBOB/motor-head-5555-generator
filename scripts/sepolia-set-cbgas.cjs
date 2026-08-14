/* Lower ScrapCrates' VRF callbackGasLimit to shrink the DON's max-cost reservation. */
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const NEW_CB_GAS = 200000; // our callback uses ~60k; 200k is safe headroom, far below the old 500k

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const crates = await ethers.getContractAt("ScrapCrates", dep.contracts.ScrapCrates);
  const keyHash = await crates.keyHash();
  const subId = await crates.subscriptionId();
  const confs = await crates.requestConfirmations();
  console.log("before: callbackGasLimit =", (await crates.callbackGasLimit()).toString());
  const tx = await crates.setVRFConfig(keyHash, subId, NEW_CB_GAS, confs);
  await tx.wait();
  console.log("after : callbackGasLimit =", (await crates.callbackGasLimit()).toString(), "| tx:", tx.hash);
  // reflect in the deployment record
  dep.params.callbackGasLimit = NEW_CB_GAS;
  fs.writeFileSync(path.join(__dirname, "..", "deployments", "sepolia.json"), JSON.stringify(dep, null, 2) + "\n");
  console.log("updated deployments/sepolia.json");
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
