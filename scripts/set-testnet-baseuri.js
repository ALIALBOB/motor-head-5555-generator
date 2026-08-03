// TESTNET ONLY — point the Sepolia test collection's baseURI at the testnet renderer worker.
// tokenURI(id) = base + id + ".json"; the worker's /meta route accepts the optional ".json".
// Reversible: re-run with a different TESTNET_BASE_URI (or the original) to flip back.
// Run: npx hardhat run scripts/set-testnet-baseuri.js --network sepolia
const hre = require("hardhat");

async function main() {
  const collection = "0xdAA0976e9027E9CF761A8fE1Bf7c7bB4aaaeFA5B"; // Sepolia test collection (NOT mainnet)
  const base = process.env.TESTNET_BASE_URI ||
    "https://motorheads-renderer-testnet.zacbosugame.workers.dev/meta/";

  const [signer] = await hre.ethers.getSigners();
  console.log("signer:", signer.address);
  const c = await hre.ethers.getContractAt("LivingArchiveMachines", collection);

  const tx = await c.setBaseURI(base);
  console.log("setBaseURI ->", base);
  console.log("tx:", tx.hash, "(waiting for confirmation…)");
  await tx.wait();

  console.log("confirmed. tokenURI(1) =", await c.tokenURI(1));
  console.log("tokenURI(2) =", await c.tokenURI(2));
}

main().catch((e) => { console.error(e); process.exit(1); });
