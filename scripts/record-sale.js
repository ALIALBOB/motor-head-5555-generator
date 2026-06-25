const hre = require("hardhat");

async function main() {
  const address = process.env.LAM_CONTRACT;
  const tokenId = process.env.TOKEN_ID;
  const saleEth = process.env.SALE_ETH;
  if (!address || !tokenId || !saleEth) {
    throw new Error("Set LAM_CONTRACT, TOKEN_ID, and SALE_ETH.");
  }

  const nft = await hre.ethers.getContractAt("LivingArchiveMachines", address);
  const tx = await nft.recordVerifiedSale(tokenId, hre.ethers.parseEther(saleEth));
  await tx.wait();
  console.log(`Recorded verified sale for token ${tokenId}: ${saleEth} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
