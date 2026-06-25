/*
  Registers starter parts in the on-chain part catalog.

  Usage after local deploy:
    CONTRACT_ADDRESS=0x... npm run parts:starter

  Codex/dev notes:
  - The renderer can draw many parts directly by part.key.
  - assetURI is optional; keep it empty for procedural canvas parts.
  - A production collection can call upsertPart many times as new parts are released.
*/

const { ethers } = require("hardhat");
const parts = require("../data/starter-parts.json");

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  if (!address) throw new Error("Set CONTRACT_ADDRESS=0x...");

  const contract = await ethers.getContractAt("MechanicalCanvas", address);

  const ids = [];
  for (const p of parts) {
    console.log("Registering part", p.id, p.key);
    const tx = await contract.upsertPart(
      p.id,
      p.key,
      p.name,
      p.category,
      p.rarity,
      p.assetURI || "",
      p.active ?? true,
      p.duplicable ?? true
    );
    await tx.wait();
    ids.push(p.id);
  }

  console.log("Setting starter pack:", ids.join(", "));
  await (await contract.setStarterPack(ids)).wait();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
