const hre = require("hardhat");

async function main() {
  const address = process.env.LAM_CONTRACT;
  const phase = process.env.GLOBAL_PHASE;
  if (!address || phase === undefined) throw new Error("Set LAM_CONTRACT and GLOBAL_PHASE.");

  const nft = await hre.ethers.getContractAt("LivingArchiveMachines", address);
  const tx = await nft.setGlobalPhase(Number(phase));
  await tx.wait();
  console.log(`Set global phase to ${phase}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
