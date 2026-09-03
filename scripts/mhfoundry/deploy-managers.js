// HYBRID path: mint on OpenSea's drop contract, attach the Foundry loop on top.
// Deploys ONLY the game contracts (MHToken + WeightRegistry + RewardPot + UpgradeManager + CustomizeManager)
// and wires them to an EXISTING external ERC-721 (the OpenSea-deployed "MH" collection). No RobotNFT.
//   FOUNDRY_NFT=0xOpenSeaCollection npx hardhat run scripts/mhfoundry/deploy-managers.js --network robinhoodMainnet
// The managers only need the NFT's ownerOf(tokenId), so any standard ERC-721 works.
// Saves deployments/mhfoundry-managers-<network>.json
const { ethers, network } = require("hardhat");
const fs = require("fs"), path = require("path");
const E = (n) => ethers.parseEther(String(n));

// ── CONFIG — edit, then set reviewed:true ──
const CONFIG = {
  reviewed: false,
  // NEUTRAL token name for the throwaway mainnet test — deliberately NOT brand-linked. Real launch sets the real name.
  tokenName: "Credits",
  tokenSymbol: "CRDT",
  nft: process.env.FOUNDRY_NFT || "0xee14596172332c4f3964540904d9676d650d8de3", // OpenSea "MH" SeaDrop collection (owner 0xe662)
  treasury: "0xe6624e3557870D39691927af1a202FFD282a4dcA",
  owner: "0xe6624e3557870D39691927af1a202FFD282a4dcA",
  burnBps: 5000,
  // RewardPot rescue-hatch timelock (seconds). 0 = instant admin recovery — use for the THROWAWAY/test pool so you
  // keep full control. For the REAL launch set a long telegraphed delay, e.g. 7*24*3600 (7 days), then call
  // lockRescueForever() once you're confident to make the pool fully trustless.
  rescueDelay: 0,
  costs: [0, 15, 75, 300, 900, 2500],
  weights: [0, 100, 250, 600, 1200, 2200],
  tokenPerUsd: E(1),
  catalog: [
    [1, 500, 0, true], [2, 1500, 100, true], [3, 4000, 200, true], [4, 8000, 300, true], [5, 6000, 200, true],
  ],
  recolorPriceUsdCents: 500,
};

const ROBINHOOD_MAINNET = 4663;

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No signer — set PRIVATE_KEY in .env");
  const me = deployer.address;
  const net = await ethers.provider.getNetwork();
  const bal = await ethers.provider.getBalance(me);
  console.log(`Network:  ${network.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${me}`);
  console.log(`Balance:  ${ethers.formatEther(bal)} ETH`);

  if (Number(net.chainId) !== ROBINHOOD_MAINNET)
    throw new Error(`Refusing: chainId ${net.chainId} is not Robinhood mainnet ${ROBINHOOD_MAINNET}.`);
  if (!CONFIG.reviewed) throw new Error("Refusing: set the CONFIG values (esp. nft) then reviewed:true.");
  if (!ethers.isAddress(CONFIG.nft) || CONFIG.nft.startsWith("0xREPLACE"))
    throw new Error("Refusing: CONFIG.nft must be the deployed OpenSea collection address (or set FOUNDRY_NFT env).");
  if (!ethers.isAddress(CONFIG.treasury) || !ethers.isAddress(CONFIG.owner))
    throw new Error("Refusing: treasury/owner must be real addresses.");
  if (bal === 0n) throw new Error("Deployer has 0 ETH on Robinhood mainnet — bridge ETH first.");

  const NFT = ethers.getAddress(CONFIG.nft);
  const TREASURY = ethers.getAddress(CONFIG.treasury);
  const OWNER = ethers.getAddress(CONFIG.owner);

  // sanity: confirm the target really is an ERC-721 (supportsInterface 0x80ac58cd) before wiring to it
  try {
    const erc721 = new ethers.Contract(NFT, ["function supportsInterface(bytes4) view returns (bool)"], deployer);
    const ok = await erc721.supportsInterface("0x80ac58cd");
    console.log(`Target ${NFT} is ERC-721: ${ok}`);
    if (!ok) throw new Error("Target does not report ERC-721 (0x80ac58cd). Double-check the collection address.");
  } catch (e) { throw new Error(`Could not verify target is ERC-721: ${e.message}`); }

  const COSTS = CONFIG.costs.map(E);
  const dep = async (name, ...args) => {
    const c = await (await ethers.getContractFactory(name)).deploy(...args);
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log(`  ${name}: ${a}`);
    return c;
  };

  console.log("\nDeploying managers (attaching to OpenSea collection " + NFT + ")…");
  const T = await dep("MHToken", CONFIG.tokenName, CONFIG.tokenSymbol, TREASURY, OWNER);
  const REG = await dep("WeightRegistry", OWNER);
  const POT = await dep("RewardPot", OWNER, await REG.getAddress(), NFT, CONFIG.rescueDelay);
  const UP = await dep("UpgradeManager", await T.getAddress(), NFT,
    await REG.getAddress(), await POT.getAddress(), TREASURY, CONFIG.burnBps, COSTS, CONFIG.weights, OWNER);
  const CM = await dep("CustomizeManager", await T.getAddress(), NFT,
    await REG.getAddress(), await POT.getAddress(), TREASURY, CONFIG.burnBps, CONFIG.tokenPerUsd, OWNER);

  const ownerIsDeployer = OWNER.toLowerCase() === me.toLowerCase();
  const out = {
    network: network.name, chainId: Number(net.chainId), deployer: me, treasury: TREASURY, owner: OWNER,
    externalNFT: NFT, MHToken: await T.getAddress(), WeightRegistry: await REG.getAddress(),
    RewardPot: await POT.getAddress(), UpgradeManager: await UP.getAddress(), CustomizeManager: await CM.getAddress(),
    params: { BURN_BPS: CONFIG.burnBps, tokenPerUsd: CONFIG.tokenPerUsd.toString() },
    wired: ownerIsDeployer, ts: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `mhfoundry-managers-${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\nSaved", file);

  if (!ownerIsDeployer) {
    console.log("\n⚠️  OWNER != deployer — run the role grants + catalog seeding from the owner wallet (see below).");
    return;
  }

  console.log("\nWiring roles…");
  await (await REG.grantRole(await REG.UPGRADE_ROLE(), await UP.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await UP.getAddress())).wait();
  await (await REG.grantRole(await REG.CUSTOMIZE_ROLE(), await CM.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await CM.getAddress())).wait();
  console.log("Seeding catalog…");
  for (const [id, cents, wbps, active] of CONFIG.catalog) await (await CM.setItem(id, cents, wbps, active)).wait();
  await (await CM.setRecolorPrice(CONFIG.recolorPriceUsdCents)).wait();

  console.log("\n✅ Managers deployed + wired to the OpenSea collection. Foundry loop is live on those tokens.");
  console.log("   Next: point the collection's metadata at our renderer (setBaseURI → https://motorheadsonline.com/foundry/meta/ )");
  console.log("   Then fill these addresses into src/forge.js + src/foundry.js (NETS.mainnet) and set the NFT to", NFT);
}

main().catch((e) => { console.error(e); process.exit(1); });
