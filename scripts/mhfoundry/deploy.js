// Deploy the MotorHeads Foundry core (M1–M3) and wire roles.
//   npx hardhat run scripts/mhfoundry/deploy.js --network robinhoodTestnet
// Saves addresses to deployments/mhfoundry-<network>.json
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const E = (n) => ethers.parseEther(String(n));
const COSTS = [0, 15, 75, 300, 900, 2500].map(E); // cumulative $TOKEN
const WEIGHTS = [0, 100, 250, 600, 1200, 2200];

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No signer — set PRIVATE_KEY in .env");
  const me = deployer.address;
  const net = await ethers.provider.getNetwork();
  const bal = await ethers.provider.getBalance(me);
  console.log(`Network: ${network.name} (chainId ${net.chainId})`);
  console.log(`Deployer: ${me}`);
  console.log(`Balance:  ${ethers.formatEther(bal)} ETH`);
  if (bal === 0n) throw new Error("Deployer has 0 ETH — fund it from the faucet first");

  // testnet-friendly params
  const TREASURY = me;            // deployer doubles as treasury on testnet
  const MINT_PRICE = E("0.0001");
  const MAX_SUPPLY = 100;
  const ROYALTY_BPS = 1000;       // 10%
  const BURN_BPS = 5000;          // 50%
  const CUSTOMIZE_FEE = E(10);

  const dep = async (name, ...args) => {
    const c = await (await ethers.getContractFactory(name)).deploy(...args);
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log(`  ${name}: ${a}`);
    return c;
  };

  console.log("Deploying…");
  const T = await dep("MHToken", "Credits", "CRDT", TREASURY, me);
  const NFT = await dep("RobotNFT", MAX_SUPPLY, MINT_PRICE, TREASURY, ROYALTY_BPS, me);
  const REG = await dep("WeightRegistry", me);
  const POT = await dep("RewardPot", me, await REG.getAddress(), await NFT.getAddress(), 0);
  const UP = await dep("UpgradeManager", await T.getAddress(), await NFT.getAddress(),
    await REG.getAddress(), await POT.getAddress(), TREASURY, BURN_BPS, COSTS, WEIGHTS, me);
  const CM = await dep("CustomizeManager", await T.getAddress(), await NFT.getAddress(),
    await REG.getAddress(), await POT.getAddress(), TREASURY, BURN_BPS, CUSTOMIZE_FEE, me);

  console.log("Wiring roles…");
  await (await REG.grantRole(await REG.UPGRADE_ROLE(), await UP.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await UP.getAddress())).wait();
  await (await REG.grantRole(await REG.CUSTOMIZE_ROLE(), await CM.getAddress())).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), await CM.getAddress())).wait();
  await (await NFT.setPublicOpen(true)).wait(); // open public mint for testing
  await (await NFT.setBaseURI("https://motorheadsonline.com/foundry/meta/")).wait(); // point at the renderer

  const out = {
    network: network.name,
    chainId: Number(net.chainId),
    deployer: me,
    treasury: TREASURY,
    MHToken: await T.getAddress(),
    RobotNFT: await NFT.getAddress(),
    WeightRegistry: await REG.getAddress(),
    RewardPot: await POT.getAddress(),
    UpgradeManager: await UP.getAddress(),
    CustomizeManager: await CM.getAddress(),
    params: {
      MINT_PRICE: MINT_PRICE.toString(),
      MAX_SUPPLY, ROYALTY_BPS, BURN_BPS,
      CUSTOMIZE_FEE: CUSTOMIZE_FEE.toString(),
    },
    ts: new Date().toISOString(),
  };
  const dir = path.join(__dirname, "..", "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `mhfoundry-${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("\nSaved", file);
  console.log("Done. Next: npx hardhat run scripts/mhfoundry/demo.js --network", network.name);
}

main().catch((e) => { console.error(e); process.exit(1); });
