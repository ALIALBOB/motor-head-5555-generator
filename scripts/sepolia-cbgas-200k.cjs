// Lower the new ScrapCrates callbackGasLimit to 200000 (the MIN floor) — enough for the fixed callback
// and the smallest possible LINK reservation on the shared VRF sub.
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");
async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const crates = await ethers.getContractAt("ScrapCrates", dep.contracts.ScrapCrates);
  const keyHash = await crates.keyHash();
  const subId = await crates.subscriptionId();
  const confs = await crates.requestConfirmations();
  console.log("current callbackGasLimit:", (await crates.callbackGasLimit()).toString());
  await (await crates.setVRFConfig(keyHash, subId, 200000, confs)).wait();
  console.log("new callbackGasLimit:", (await crates.callbackGasLimit()).toString());
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
