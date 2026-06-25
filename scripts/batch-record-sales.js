const fs = require("fs");
const hre = require("hardhat");

async function main() {
  const address = process.env.LAM_CONTRACT;
  const file = process.env.SALES_FILE;
  if (!address || !file) throw new Error("Set LAM_CONTRACT and SALES_FILE.");

  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  const tokenIds = rows.map((row) => row.tokenId);
  const saleWeiValues = rows.map((row) => row.saleWei || hre.ethers.parseEther(String(row.saleEth || "0")));

  const nft = await hre.ethers.getContractAt("LivingArchiveMachines", address);
  const tx = await nft.batchRecordVerifiedSales(tokenIds, saleWeiValues);
  await tx.wait();
  console.log(`Recorded ${rows.length} verified sale milestones from ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
