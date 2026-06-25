const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.LAM_CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Set LAM_CONTRACT_ADDRESS.");

  const [signer] = await hre.ethers.getSigners();
  const recipient = process.env.LAM_MINT_TO || signer.address;
  const quantity = Number(process.env.LAM_MINT_QUANTITY || "1");
  const usePublicMint = process.env.LAM_USE_PUBLIC_MINT === "1";

  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
    throw new Error("LAM_MINT_QUANTITY must be between 1 and 20.");
  }

  const nft = await hre.ethers.getContractAt("LivingArchiveMachines", contractAddress, signer);

  console.log("network:", hre.network.name);
  console.log("contract:", contractAddress);
  console.log("signer:", signer.address);
  console.log("recipient:", recipient);
  console.log("quantity:", quantity);

  if (usePublicMint) {
    if ((await nft.publicMintEnabled()) === false) {
      console.log("enabling public mint for test");
      await (await nft.setPublicMintEnabled(true)).wait();
    }
    const price = await nft.mintPriceWei();
    const value = price * BigInt(quantity);
    const tx = await nft.mint(quantity, { value });
    const receipt = await tx.wait();
    console.log("public mint tx:", receipt.hash);
    return;
  }

  const tx = await nft.adminMint(recipient, quantity);
  const receipt = await tx.wait();
  console.log("admin mint tx:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
