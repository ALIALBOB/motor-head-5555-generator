// LIVE mainnet dry-run on Robinhood (4663): deploy the minimal economy wired to the throwaway SeaDrop
// collection, then run the full loop on token #1 — burn (activate), burn (upgrade), simulate a 333 attach
// (bonus weight), fund the pool, claim ETH. RESUMABLE: saves every address + step to a JSON, so a run that
// stops short (e.g. gas) can be re-run to continue from where it left off after a tiny top-up.
//   npx hardhat run scripts/mhfoundry/mainnet-test.js --network robinhoodMainnet
const { ethers, network } = require("hardhat");
const fs = require("fs"), path = require("path");
const E = (n) => ethers.parseEther(String(n));

const NFT = "0xee14596172332c4f3964540904d9676d650d8de3"; // throwaway "MH" SeaDrop collection (token #1 owned by 0xe662)
const TOKEN_ID = 1;
const COSTS = [0, 15, 75, 300, 900, 2500];
const WEIGHTS = [0, 100, 250, 600, 1200, 2200];
const FILE = path.join(__dirname, "..", "..", "deployments", "mhfoundry-mainnet-test.json");

function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { addr: {}, step: {} }; } }
function save(s) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(s, null, 2)); }

async function main() {
  const [me] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  if (Number(net.chainId) !== 4663) throw new Error(`not Robinhood mainnet (chainId ${net.chainId})`);
  const bal0 = await ethers.provider.getBalance(me.address);
  console.log(`Deployer ${me.address}  balance ${ethers.formatEther(bal0)} ETH  (chain ${net.chainId})`);
  const s = load();

  // ---- deploy (skip anything already recorded) ----
  const dep = async (key, name, args) => {
    if (s.addr[key]) { console.log(`  ${name}: ${s.addr[key]} (cached)`); return await ethers.getContractAt(name, s.addr[key]); }
    const c = await (await ethers.getContractFactory(name)).deploy(...args);
    await c.waitForDeployment(); const a = await c.getAddress();
    s.addr[key] = a; save(s);
    console.log(`  ${name}: ${a}  (tx ${c.deploymentTransaction().hash})`);
    return c;
  };
  console.log("\nDeploying minimal economy…");
  const token = await dep("MHToken", "MHToken", ["Credits", "CRDT", me.address, me.address]);
  const reg = await dep("WeightRegistry", "WeightRegistry", [me.address]);
  const pot = await dep("RewardPot", "RewardPot", [me.address, s.addr.WeightRegistry, NFT, 0]);
  const up = await dep("UpgradeManager", "UpgradeManager",
    [s.addr.MHToken, NFT, s.addr.WeightRegistry, s.addr.RewardPot, me.address, 5000, COSTS.map(E), WEIGHTS, me.address]);

  // ---- one-shot steps (each guarded so re-runs skip completed work) ----
  const tx = async (key, label, fn) => {
    if (s.step[key]) { console.log(`  ${label}: done (cached)`); return; }
    const t = await fn(); const r = await t.wait();
    s.step[key] = r.hash; save(s);
    console.log(`  ${label}: ${r.hash}`);
  };
  console.log("\nWiring roles…");
  await tx("grantUpgrade", "reg.UPGRADE_ROLE → UpgradeManager", async () => reg.grantRole(await reg.UPGRADE_ROLE(), s.addr.UpgradeManager));
  await tx("grantSettler", "pot.SETTLER_ROLE → UpgradeManager", async () => pot.grantRole(await pot.SETTLER_ROLE(), s.addr.UpgradeManager));
  await tx("grantCustomize", "reg.CUSTOMIZE_ROLE → me (for the 333 sim)", async () => reg.grantRole(await reg.CUSTOMIZE_ROLE(), me.address));

  console.log("\nRunning the loop on token #" + TOKEN_ID + "…");
  await tx("approve", "approve Credits → UpgradeManager", async () => token.approve(s.addr.UpgradeManager, E(1000)));
  await tx("activate", "activate (BURN Credits → tier 1)", async () => up.activate(TOKEN_ID));
  await tx("upgrade", "upgrade to tier 2 (BURN more)", async () => up.upgrade(TOKEN_ID, 2));
  await tx("bonus", "setBonus +25 (SIMULATED 333 attach)", async () => reg.setBonus(TOKEN_ID, 25));
  await tx("fund", "fund the pool with 0.00003 ETH", async () => pot.fundETH({ value: E("0.00003") }));
  await tx("claim", "CLAIM ETH reward", async () => pot.claim(TOKEN_ID));

  // ---- report ----
  console.log("\n── RESULT ──");
  console.log("tier now:", (await reg.tierOf(TOKEN_ID)).toString(), " weight:", (await reg.weightOf(TOKEN_ID)).toString());
  console.log("Credits total supply (burns lower it):", ethers.formatEther(await token.totalSupply()));
  console.log("pot totalClaimed:", ethers.formatEther(await pot.totalClaimed()), "ETH");
  console.log("deployer ETH now:", ethers.formatEther(await ethers.provider.getBalance(me.address)));
  console.log("spent on gas ~", ethers.formatEther(bal0 - (await ethers.provider.getBalance(me.address))), "ETH");
  console.log("\nAddresses:", JSON.stringify(s.addr, null, 2));
}
main().catch((e) => { console.error("\nSTOPPED:", e.shortMessage || e.message); process.exit(1); });
