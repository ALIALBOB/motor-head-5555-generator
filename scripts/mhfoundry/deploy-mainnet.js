// Deploy the MotorHeads Foundry core to ROBINHOOD CHAIN MAINNET (chainId 4663) — money-real, hardened.
//   npx hardhat run scripts/mhfoundry/deploy-mainnet.js --network robinhoodMainnet
// Differences vs the testnet deploy.js:
//   • treasury/owner are EXPLICIT config (not "= deployer") so the 1B $TOKEN + fees + royalties land where you choose
//   • public mint is LEFT CLOSED (you open it deliberately at launch) — no auto setPublicOpen(true)
//   • MAX_SUPPLY is your REAL, IMMUTABLE collection size (cannot be changed after deploy — get it right)
//   • refuses to run unless CONFIG.reviewed === true AND the network is actually chainId 4663
//   • seeds the CustomizeManager catalog + recolor price so the customize half of the loop works immediately
// Saves addresses to deployments/mhfoundry-robinhoodMainnet.json
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const E = (n) => ethers.parseEther(String(n));

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG — EDIT THESE, then set reviewed:true. This is a MAINNET, real-money deploy.
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // ── STAGING DRY-RUN (disposable): supply 100, throwaway EOA = treasury = owner, on mainnet 4663 so OpenSea indexes it.
  //    Mint 10 via ownerMint, view on OpenSea, iterate. Redeploy fresh (5555 + multisig) for the real launch. ──
  reviewed: false, // ← set true only after you've checked EVERY value below

  // Deployer EOA doubles as treasury + owner for the disposable staging run (confirmed 0xe662…4dcA).
  treasury: "0xe6624e3557870D39691927af1a202FFD282a4dcA",
  owner: "0xe6624e3557870D39691927af1a202FFD282a4dcA",

  // NEUTRAL token name for the disposable staging run — deliberately NOT brand-linked. Real launch sets the real name.
  tokenName: "Credits",
  tokenSymbol: "CRDT",

  // IMMUTABLE collection size. Staging = 100 (disposable). Real launch will be a FRESH deploy at 5555.
  maxSupply: 100,

  // Public mint price in ETH. Public sale stays CLOSED for staging (you mint the 10 via free ownerMint). Mutable later.
  mintPriceEth: "0",

  royaltyBps: 750, // 7.5% total (ERC-2981). Real launch: point the receiver at a splitter → 5% RewardPot + 2.5% treasury.
  burnBps: 5000,    // 50% of every $TOKEN spend is burned (deflation); the rest goes to treasury

  // RewardPot rescue-hatch timelock (seconds). 0 = instant admin recovery — right for this DISPOSABLE staging pool
  // so you keep full control. Real launch: set a long telegraphed delay (e.g. 7*24*3600) and lockRescueForever() later.
  rescueDelay: 0,

  // Tier economics: cumulative $TOKEN cost to reach each tier, and the reward weight at each tier.
  // Index 0 = un-activated. activate() charges COSTS[1]; upgrade(toTier) charges the cumulative delta.
  costs: [0, 15, 75, 300, 900, 2500],
  weights: [0, 100, 250, 600, 1200, 2200],

  // CustomizeManager: $TOKEN per USD (1e18 = $1 costs 1 $TOKEN). Catalog is USD-priced, converted at this rate.
  tokenPerUsd: E(1),

  // Catalog seeded on deploy: [itemId, priceUsdCents, weightBps, active]
  catalog: [
    [1, 500, 0, true],    // Sticker $5 — cosmetic
    [2, 1500, 100, true], // Brass part $15 — +1%
    [3, 4000, 200, true], // Dope part $40 — +2%
    [4, 8000, 300, true], // Gold trim $80 — +3%
    [5, 6000, 200, true], // Animated BG $60 — +2%
  ],
  recolorPriceUsdCents: 500, // recolor $5

  baseURI: "https://motorheadsonline.com/foundry/meta/", // renderer: tokenURI = baseURI + tokenId
};
// ─────────────────────────────────────────────────────────────────────────────

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

  // ---- hard safety gates ----
  if (Number(net.chainId) !== ROBINHOOD_MAINNET)
    throw new Error(`Refusing: connected chainId ${net.chainId} is not Robinhood mainnet ${ROBINHOOD_MAINNET}. Use --network robinhoodMainnet.`);
  if (!CONFIG.reviewed)
    throw new Error("Refusing: open scripts/mhfoundry/deploy-mainnet.js, set the real CONFIG values, then set reviewed:true.");
  if (!ethers.isAddress(CONFIG.treasury) || CONFIG.treasury.startsWith("0xREPLACE"))
    throw new Error("Refusing: CONFIG.treasury is not set to a real address.");
  if (!ethers.isAddress(CONFIG.owner) || CONFIG.owner.startsWith("0xREPLACE"))
    throw new Error("Refusing: CONFIG.owner is not set to a real address.");
  if (bal === 0n)
    throw new Error("Deployer has 0 ETH on Robinhood mainnet — bridge ETH to it first (canonical Arbitrum bridge).");
  if (!Number.isInteger(CONFIG.maxSupply) || CONFIG.maxSupply < 1)
    throw new Error("Refusing: CONFIG.maxSupply must be a positive integer (IMMUTABLE).");

  const TREASURY = ethers.getAddress(CONFIG.treasury);
  const OWNER = ethers.getAddress(CONFIG.owner);
  const MINT_PRICE = E(CONFIG.mintPriceEth);
  const COSTS = CONFIG.costs.map(E);
  const WEIGHTS = CONFIG.weights;

  console.log(`\nTreasury: ${TREASURY}${TREASURY === me ? "  ⚠️ = deployer EOA (migrate to a multisig before launch)" : ""}`);
  console.log(`Owner:    ${OWNER}${OWNER === me ? "  ⚠️ = deployer EOA (migrate to a multisig before launch)" : ""}`);
  console.log(`MaxSupply (IMMUTABLE): ${CONFIG.maxSupply}   MintPrice: ${CONFIG.mintPriceEth} ETH   Public mint: CLOSED`);

  const dep = async (name, ...args) => {
    const c = await (await ethers.getContractFactory(name)).deploy(...args);
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log(`  ${name}: ${a}`);
    return c;
  };

  console.log("\nDeploying…");
  const T = await dep("MHToken", CONFIG.tokenName, CONFIG.tokenSymbol, TREASURY, OWNER);
  const NFT = await dep("RobotNFT", CONFIG.maxSupply, MINT_PRICE, TREASURY, CONFIG.royaltyBps, OWNER);
  const REG = await dep("WeightRegistry", OWNER);
  const POT = await dep("RewardPot", OWNER, await REG.getAddress(), await NFT.getAddress(), CONFIG.rescueDelay);
  const UP = await dep("UpgradeManager", await T.getAddress(), await NFT.getAddress(),
    await REG.getAddress(), await POT.getAddress(), TREASURY, CONFIG.burnBps, COSTS, WEIGHTS, OWNER);
  const CM = await dep("CustomizeManager", await T.getAddress(), await NFT.getAddress(),
    await REG.getAddress(), await POT.getAddress(), TREASURY, CONFIG.burnBps, CONFIG.tokenPerUsd, OWNER);

  // Wiring MUST be done by the current owner. If OWNER is a multisig, these role grants + config calls
  // will each need to be executed from that multisig instead of failing here. For an EOA owner == deployer,
  // they run inline. We detect the mismatch and stop with instructions rather than reverting cryptically.
  const ownerIsDeployer = OWNER.toLowerCase() === me.toLowerCase();
  const out = {
    network: network.name, chainId: Number(net.chainId), deployer: me, treasury: TREASURY, owner: OWNER,
    MHToken: await T.getAddress(), RobotNFT: await NFT.getAddress(), WeightRegistry: await REG.getAddress(),
    RewardPot: await POT.getAddress(), UpgradeManager: await UP.getAddress(), CustomizeManager: await CM.getAddress(),
    params: {
      MINT_PRICE: MINT_PRICE.toString(), MAX_SUPPLY: CONFIG.maxSupply, ROYALTY_BPS: CONFIG.royaltyBps,
      BURN_BPS: CONFIG.burnBps, tokenPerUsd: CONFIG.tokenPerUsd.toString(),
    },
    publicOpen: false, wired: ownerIsDeployer, ts: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `mhfoundry-${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\nSaved", file);

  if (!ownerIsDeployer) {
    console.log("\n⚠️  OWNER is not the deployer — role wiring + catalog seeding must be run FROM THE OWNER wallet.");
    console.log("    Contracts are deployed. Execute these from the owner (e.g. multisig):");
    console.log("      REG.grantRole(UPGRADE_ROLE, UpgradeManager); POT.grantRole(SETTLER_ROLE, UpgradeManager);");
    console.log("      REG.grantRole(CUSTOMIZE_ROLE, CustomizeManager); POT.grantRole(SETTLER_ROLE, CustomizeManager);");
    console.log("      NFT.setBaseURI(baseURI); CM.setItem(...) x5; CM.setRecolorPrice(...)");
    console.log("    (Then re-run with owner == deployer, or wire via your multisig UI.)");
    return;
  }

  console.log("\nWiring roles…");
  await (await REG.grantRole(await REG.UPGRADE_ROLE(), await UP.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await UP.getAddress())).wait();
  await (await REG.grantRole(await REG.CUSTOMIZE_ROLE(), await CM.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await CM.getAddress())).wait();
  await (await NFT.setBaseURI(CONFIG.baseURI)).wait();
  console.log("  roles granted + baseURI set →", CONFIG.baseURI);

  console.log("Seeding catalog…");
  for (const [id, cents, wbps, active] of CONFIG.catalog) await (await CM.setItem(id, cents, wbps, active)).wait();
  await (await CM.setRecolorPrice(CONFIG.recolorPriceUsdCents)).wait();
  console.log("  catalog + recolor price seeded");

  console.log("\n✅ Deployed + wired on Robinhood MAINNET. Public mint is CLOSED.");
  console.log("   tokenURI(1) preview:", CONFIG.baseURI + "1");
  console.log("\nNext:");
  console.log("   1) Verify contracts:  npx hardhat verify --network robinhoodMainnet <address> <constructor-args>");
  console.log("   2) Mint 10 test:      npx hardhat run scripts/mhfoundry/mint-test.js --network robinhoodMainnet");
  console.log("   3) Seed test $TOKEN:  npx hardhat run scripts/mhfoundry/seed-token.js --network robinhoodMainnet");
  console.log("   4) Fill mainnet addresses into src/foundry.js, src/forge.js, src/_worker.js (USE_MAINNET=true) + deploy the site.");
}

main().catch((e) => { console.error(e); process.exit(1); });
