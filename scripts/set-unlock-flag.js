const hre = require("hardhat");

async function main() {
  const address = process.env.LAM_CONTRACT;
  const tokenId = process.env.TOKEN_ID;
  const flagIndex = process.env.FLAG_INDEX;
  const enabled = process.env.ENABLED;
  if (!address || !tokenId || flagIndex === undefined || enabled === undefined) {
    throw new Error("Set LAM_CONTRACT, TOKEN_ID, FLAG_INDEX, and ENABLED=true|false.");
  }

  const nft = await hre.ethers.getContractAt("LivingArchiveMachines", address);
  const tx = await nft.setUnlockFlag(tokenId, Number(flagIndex), enabled === "true" || enabled === "1");
  await tx.wait();
  console.log(`Set token ${tokenId} unlock flag ${flagIndex} to ${enabled}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
