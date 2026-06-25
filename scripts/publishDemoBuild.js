/*
  Demo layout publish script.

  In production:
  1. The web editor exports layout JSON.
  2. You upload layout JSON to IPFS/Arweave.
  3. You compute sha256(layout JSON) or keccak256(bytes).
  4. Holder calls publishBuild(tokenId, layoutURI, layoutHash, partCount).

  This script uses a fake ipfs:// URI and fake hash for testing.
*/

const { ethers } = require("hardhat");

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  const tokenId = Number(process.env.TOKEN_ID || 1);
  if (!address) throw new Error("Set CONTRACT_ADDRESS=0x...");

  const contract = await ethers.getContractAt("MechanicalCanvas", address);
  const layoutURI = `ipfs://LAYOUT_CID/layouts/${String(tokenId).padStart(4, "0")}.json`;
  const fakeLayoutHash = ethers.keccak256(ethers.toUtf8Bytes(layoutURI));
  const partCount = 42;

  const tx = await contract.publishBuild(tokenId, layoutURI, fakeLayoutHash, partCount);
  await tx.wait();

  console.log("Published", { tokenId, layoutURI, fakeLayoutHash, partCount });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
