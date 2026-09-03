// Deploy ForgeBridge to Robinhood mainnet + wire it to the already-deployed economy (from mainnet-test.json).
// Lets a holder BURN a 2D / ATTACH a 333 by redeeming a backend-signed EIP-712 voucher.
//   npx hardhat run scripts/mhfoundry/deploy-forgebridge.js --network robinhoodMainnet
// RESUMABLE: records the address in the same deployments file; re-run to continue if it stops for gas.
const { ethers, network } = require("hardhat");
const fs = require("fs"), path = require("path");

const WEIGHTS = [0, 100, 250, 600, 1200, 2200]; // tier => base weight (mirror UpgradeManager)
const BONUS_PER_ARCHIVE = 25;   // weight per attached 333
const MAX_BONUS = 125;          // cap (5 × 25)
const MAX_ARCHIVES = 5;         // windows
const FILE = path.join(__dirname, "..", "..", "deployments", "mhfoundry-mainnet-test.json");

function load() { return JSON.parse(fs.readFileSync(FILE, "utf8")); }
function save(s) { fs.writeFileSync(FILE, JSON.stringify(s, null, 2)); }

async function main() {
  const [me] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  if (Number(net.chainId) !== 4663) throw new Error(`not Robinhood mainnet (chainId ${net.chainId})`);
  const signer = process.env.FOUNDRY_SIGNER_ADDRESS;
  if (!signer || !ethers.isAddress(signer)) throw new Error("set FOUNDRY_SIGNER_ADDRESS in .env");
  const s = load();
  const NFT = "0xee14596172332c4f3964540904d9676d650d8de3";
  for (const k of ["WeightRegistry", "RewardPot"]) if (!s.addr[k]) throw new Error(`missing ${k} in ${FILE} — run mainnet-test.js first`);
  console.log(`Deployer ${me.address}  bal ${ethers.formatEther(await ethers.provider.getBalance(me.address))} ETH`);
  console.log(`signer(attestor): ${signer}`);

  const tx = async (key, label, fn) => { if (s.step && s.step[key]) { console.log(`  ${label}: cached`); return; } const t = await fn(); const r = await t.wait(); s.step = s.step || {}; s.step[key] = r.hash; save(s); console.log(`  ${label}: ${r.hash}`); };

  let bridge;
  if (s.addr.ForgeBridge) { bridge = await ethers.getContractAt("ForgeBridge", s.addr.ForgeBridge); console.log(`  ForgeBridge: ${s.addr.ForgeBridge} (cached)`); }
  else {
    bridge = await (await ethers.getContractFactory("ForgeBridge")).deploy(
      me.address, signer, s.addr.WeightRegistry, s.addr.RewardPot, NFT, WEIGHTS, BONUS_PER_ARCHIVE, MAX_BONUS, MAX_ARCHIVES);
    await bridge.waitForDeployment(); s.addr.ForgeBridge = await bridge.getAddress(); save(s);
    console.log(`  ForgeBridge: ${s.addr.ForgeBridge}  (tx ${bridge.deploymentTransaction().hash})`);
  }

  const reg = await ethers.getContractAt("WeightRegistry", s.addr.WeightRegistry);
  const pot = await ethers.getContractAt("RewardPot", s.addr.RewardPot);
  console.log("\nWiring roles to ForgeBridge…");
  await tx("fb_upgrade", "reg.UPGRADE_ROLE → ForgeBridge", async () => reg.grantRole(await reg.UPGRADE_ROLE(), s.addr.ForgeBridge));
  await tx("fb_customize", "reg.CUSTOMIZE_ROLE → ForgeBridge", async () => reg.grantRole(await reg.CUSTOMIZE_ROLE(), s.addr.ForgeBridge));
  await tx("fb_settler", "pot.SETTLER_ROLE → ForgeBridge", async () => pot.grantRole(await pot.SETTLER_ROLE(), s.addr.ForgeBridge));

  s.forgeBridge = { address: s.addr.ForgeBridge, signer, domain: { name: "MHForgeBridge", version: "1", chainId: 4663, verifyingContract: s.addr.ForgeBridge } };
  save(s);
  console.log("\n✅ ForgeBridge live + wired.", JSON.stringify(s.forgeBridge, null, 2));
}
main().catch((e) => { console.error("\nSTOPPED:", e.shortMessage || e.message); process.exit(1); });
