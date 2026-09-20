// Point the OpenSea "MH" SeaDrop collection's metadata at our renderer (dynamic 3D metadata).
//   BASE_URI=https://.../foundry/meta/ npx hardhat run scripts/mhfoundry/set-baseuri-seadrop.js --network robinhoodMainnet
// SeaDrop tokenURI = baseURI + tokenId, so baseURI must end with a slash and our worker serves /foundry/meta/<id>.
const { ethers, network } = require("hardhat");

const NFT = "0xee14596172332c4f3964540904d9676d650d8de3";
// Staging: point at the preview deployment (has animation_url; keeps production untouched).
// Real launch: switch to https://motorheadsonline.com/foundry/meta/
const DEFAULT_BASE = "https://feature-foundry-forge.motorheads-5555.pages.dev/foundry/meta/";

async function main() {
  const base = process.env.BASE_URI || DEFAULT_BASE;
  const [me] = await ethers.getSigners();
  const netInfo = await ethers.provider.getNetwork();
  if (Number(netInfo.chainId) !== 4663) throw new Error(`Wrong chain ${netInfo.chainId}; expected Robinhood mainnet 4663.`);

  const abi = [
    "function setBaseURI(string) external",
    "function owner() view returns (address)",
    "function tokenURI(uint256) view returns (string)",
    "function baseURI() view returns (string)",
    "function totalSupply() view returns (uint256)",
  ];
  const c = new ethers.Contract(NFT, abi, me);
  const owner = await c.owner();
  console.log(`network ${network.name} | signer ${me.address} | owner ${owner}`);
  if (owner.toLowerCase() !== me.address.toLowerCase()) throw new Error("Signer is not the collection owner.");

  console.log("setBaseURI ->", base);
  const tx = await c.setBaseURI(base);
  console.log("tx:", tx.hash);
  await tx.wait();
  console.log("baseURI now:", await c.baseURI());
  const n = await c.totalSupply();
  if (n > 0n) console.log("tokenURI(1):", await c.tokenURI(1));
  console.log("\n✅ Metadata pointed at our renderer. On OpenSea, open the item and 'Refresh metadata' to pull the 3D.");
}

main().catch((e) => { console.error(e); process.exit(1); });
