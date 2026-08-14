// Hand off ALL control from the throwaway deployer to the founder's main wallet, then renounce the
// deployer's powers. After this the deployer is powerless; the main wallet is the sole admin.
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const MAIN = "0x95A6fB3087b3469Ed777120052E0ac3f262c81C1"; // founder main wallet (= treasury + signer)

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "mainnet.json")));
  const [deployer] = await ethers.getSigners();
  console.log("deployer:", deployer.address, "\nhanding off to MAIN:", MAIN, "\n");

  const parts = await ethers.getContractAt("ScrapParts", dep.contracts.ScrapParts);
  const crates = await ethers.getContractAt("ScrapCrates", dep.contracts.ScrapCrates);
  const vault = await ethers.getContractAt("RewardVault", dep.contracts.RewardVault);
  const DA = ethers.ZeroHash;
  const CFG = await crates.CONFIG_ROLE();
  const MINT = await crates.MINTER_ROLE();
  const set = [["ScrapParts", parts], ["ScrapCrates", crates], ["RewardVault", vault]];

  // 1) GRANT admin + config to MAIN on all three, + MINTER on crates (so MAIN can mint crates).
  for (const [name, c] of set) {
    if (!(await c.hasRole(DA, MAIN))) { console.log(`grant DEFAULT_ADMIN on ${name}`); await (await c.grantRole(DA, MAIN)).wait(); }
    if (!(await c.hasRole(CFG, MAIN))) { console.log(`grant CONFIG on ${name}`); await (await c.grantRole(CFG, MAIN)).wait(); }
  }
  if (!(await crates.hasRole(MINT, MAIN))) { console.log("grant MINTER on ScrapCrates"); await (await crates.grantRole(MINT, MAIN)).wait(); }

  // 2) Only after MAIN provably holds DEFAULT_ADMIN everywhere, RENOUNCE the deployer's roles.
  for (const [name, c] of set) {
    if (!(await c.hasRole(DA, MAIN))) throw new Error(`ABORT: MAIN lacks DEFAULT_ADMIN on ${name} — not renouncing`);
  }
  for (const [name, c] of set) {
    if (await c.hasRole(CFG, deployer.address)) { console.log(`renounce CONFIG on ${name}`); await (await c.renounceRole(CFG, deployer.address)).wait(); }
    if (await c.hasRole(DA, deployer.address)) { console.log(`renounce DEFAULT_ADMIN on ${name}`); await (await c.renounceRole(DA, deployer.address)).wait(); }
  }

  console.log("\n--- verify ---");
  for (const [name, c] of set) {
    console.log(`${name}: MAIN admin=${await c.hasRole(DA, MAIN)} config=${await c.hasRole(CFG, MAIN)} | deployer admin=${await c.hasRole(DA, deployer.address)} config=${await c.hasRole(CFG, deployer.address)}`);
  }
  console.log("ScrapCrates: MAIN minter =", await crates.hasRole(MINT, MAIN));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
