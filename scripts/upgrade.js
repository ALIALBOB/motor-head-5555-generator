/*
  UUPS upgrade script.

  Usage:
    CONTRACT_ADDRESS=0xProxyAddress npx hardhat run scripts/upgrade.js --network sepolia

  Safety notes:
  - Only UPGRADER_ROLE can authorize upgrades on-chain.
  - Never reorder/delete existing storage variables in MechanicalCanvas.sol.
  - Use OpenZeppelin upgrades validation before mainnet.
*/

const { ethers, upgrades } = require("hardhat");

async function main() {
  const proxyAddress = process.env.CONTRACT_ADDRESS;
  if (!proxyAddress) throw new Error("Set CONTRACT_ADDRESS=0xProxyAddress");

  const NewImplementation = await ethers.getContractFactory("MechanicalCanvas");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, NewImplementation, { kind: "uups" });
  await upgraded.waitForDeployment();

  console.log("Upgraded proxy:", await upgraded.getAddress());
  console.log("New implementation:", await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress()));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
