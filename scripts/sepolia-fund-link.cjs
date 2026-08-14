/* Fund the VRF subscription with the deployer wallet's test LINK (LINK.transferAndCall -> coordinator). */
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const LINK = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia LINK

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const [signer] = await ethers.getSigners();
  const link = await ethers.getContractAt(
    ["function transferAndCall(address,uint256,bytes) returns (bool)", "function balanceOf(address) view returns (uint256)"],
    LINK
  );
  const coord = await ethers.getContractAt(
    ["function getSubscription(uint256) view returns (uint96,uint96,uint64,address,address[])"],
    dep.params.vrfCoordinator
  );

  const walletBal = await link.balanceOf(signer.address);
  console.log("wallet LINK:", ethers.formatEther(walletBal));
  const before = (await coord.getSubscription(dep.params.subscriptionId))[0];
  console.log("sub LINK before:", ethers.formatEther(before));

  // send all wallet LINK to the subscription (VRF 2.5: data = abi.encode(subId))
  const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [dep.params.subscriptionId]);
  const tx = await link.transferAndCall(dep.params.vrfCoordinator, walletBal, data);
  console.log("funding tx:", tx.hash, "…");
  await tx.wait();

  const after = (await coord.getSubscription(dep.params.subscriptionId))[0];
  console.log("sub LINK after :", ethers.formatEther(after), "✓");
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
