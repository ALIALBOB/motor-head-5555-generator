/*
  Deploy script for the UUPS upgradeable MechanicalCanvas contract.

  Local:
    npx hardhat node
    npm run deploy:local

  Sepolia:
    cp .env.example .env
    npm run deploy:sepolia
*/

const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Contract = await ethers.getContractFactory("MechanicalCanvas");

  const args = [
    deployer.address,
    "Mechanical Canvas Machines",
    "MCM",
    3333,
    ethers.parseEther("0.03"),
    "ipfs://PREVIEW_CID/previews/",
    "ipfs://RENDERER_CID/index.html",
    "ipfs://CONTRACT_METADATA_CID/contract.json"
  ];

  const proxy = await upgrades.deployProxy(Contract, args, {
    initializer: "initialize",
    kind: "uups"
  });

  await proxy.waitForDeployment();

  console.log("Proxy address:", await proxy.getAddress());
  console.log("Implementation:", await upgrades.erc1967.getImplementationAddress(await proxy.getAddress()));
  console.log("Admin:", await upgrades.erc1967.getAdminAddress(await proxy.getAddress()).catch(() => "UUPS has no separate proxy admin"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
