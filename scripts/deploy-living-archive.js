const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const baseURI = process.env.LAM_BASE_URI || "ipfs://METADATA_CID/";
  const contractURI = process.env.LAM_CONTRACT_URI || "ipfs://CONTRACT_CID/contract.json";
  const mintPrice = hre.ethers.parseEther(process.env.LAM_MINT_PRICE_ETH || "0.03");

  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    assertReadyUri("LAM_BASE_URI", baseURI);
    assertReadyUri("LAM_CONTRACT_URI", contractURI);
  }

  const Factory = await hre.ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Factory.deploy(deployer.address, baseURI, contractURI, mintPrice);
  await nft.waitForDeployment();
  const address = await nft.getAddress();

  const deploymentDir = path.join(process.cwd(), "build", "deployments");
  fs.mkdirSync(deploymentDir, { recursive: true });
  const deploymentPath = path.join(deploymentDir, `living-archive-${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, `${JSON.stringify({
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    contract: "LivingArchiveMachines",
    address,
    admin: deployer.address,
    baseURI,
    contractURI,
    mintPriceWei: mintPrice.toString(),
    deployedAt: new Date().toISOString()
  }, null, 2)}\n`);

  console.log("LivingArchiveMachines deployed");
  console.log("address:", address);
  console.log("admin:", deployer.address);
  console.log("baseURI:", baseURI);
  console.log("contractURI:", contractURI);
  console.log("mintPriceWei:", mintPrice.toString());
  console.log("deploymentFile:", path.relative(process.cwd(), deploymentPath));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function assertReadyUri(name, uri) {
  if (/CID|example\.com|TBD|YOUR_|0xYour/i.test(uri)) {
    throw new Error(`${name} still contains a placeholder: ${uri}`);
  }
}
