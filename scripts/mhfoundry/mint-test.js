// Mint N test robots to the admin/owner wallet via ownerMint (free, bypasses the public sale — no public exposure).
//   MINT_QTY=10 npx hardhat run scripts/mhfoundry/mint-test.js --network robinhoodMainnet
//   (optional) MINT_TO=0x... to send them somewhere other than the owner wallet.
// After this, wait for OpenSea to auto-index the collection (mainnet only), then open the item pages.
const { ethers, network } = require("hardhat");
const fs = require("fs"), path = require("path");

const EXP = {
  robinhoodMainnet: "https://robinhoodchain.blockscout.com",
  robinhoodTestnet: "https://explorer.testnet.chain.robinhood.com",
}[network.name] || "";

async function main() {
  const [me] = await ethers.getSigners();
  const file = path.join(__dirname, "..", "..", "deployments", `mhfoundry-${network.name}.json`);
  const d = JSON.parse(fs.readFileSync(file));
  const NFT = await ethers.getContractAt("RobotNFT", d.RobotNFT);

  const to = ethers.getAddress(process.env.MINT_TO || d.owner || me.address);
  const qty = parseInt(process.env.MINT_QTY || "10", 10);

  const owner = await NFT.owner();
  if (owner.toLowerCase() !== me.address.toLowerCase())
    throw new Error(`Signer ${me.address} is not the NFT owner ${owner}. ownerMint is onlyOwner — run from the owner wallet.`);

  const before = Number(await NFT.totalMinted());
  const max = Number(await NFT.maxSupply());
  if (before + qty > max) throw new Error(`Would exceed maxSupply: ${before} minted + ${qty} > ${max}.`);

  console.log(`Minting ${qty} robots to ${to} on ${network.name} (chainId from deployment ${d.chainId})…`);
  const tx = await NFT.ownerMint(to, qty);
  const rc = await tx.wait();
  const after = Number(await NFT.totalMinted());
  console.log(`✅ Minted ids ${before + 1}..${after} to ${to}`);
  if (EXP) console.log(`   tx: ${EXP}/tx/${rc.hash}`);
  console.log(`   tokenURI(${before + 1}) = ${await NFT.tokenURI(before + 1)}`);
  console.log(`   contract on explorer: ${EXP}/token/${d.RobotNFT}`);
  console.log(`\nOpenSea (mainnet auto-indexes in minutes–hours): https://opensea.io/collections/chain/robinhood`);
  console.log(`Tip: on an item page, use "Refresh metadata" if the 3D/art is slow to appear.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
