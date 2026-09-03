// Deploy ArchiveVault to ETHEREUM mainnet — the 333 escrow (lock-while-attached).
//   npx hardhat run scripts/mhfoundry/deploy-vault.js --network mainnet
// Estimates the L1 cost first and refuses unless the deployer has comfortable margin (a failed L1 deploy wastes gas).
const { ethers } = require("hardhat");
const fs = require("fs"), path = require("path");
const ARCHIVE333 = "0x5eb82c9b5ced4c98982633976941d2cc23f4f9b9"; // 333 Archive collection (Ethereum)
const FILE = path.join(__dirname, "..", "..", "deployments", "mhfoundry-mainnet-test.json");

async function main() {
  const [me] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  if (Number(net.chainId) !== 1) throw new Error(`not Ethereum mainnet (chainId ${net.chainId})`);
  const signer = process.env.FOUNDRY_SIGNER_ADDRESS;
  if (!signer || !ethers.isAddress(signer)) throw new Error("set FOUNDRY_SIGNER_ADDRESS in .env");
  const bal = await ethers.provider.getBalance(me.address);
  console.log(`Deployer ${me.address}  bal ${ethers.formatEther(bal)} ETH (Ethereum)`);

  const s = JSON.parse(fs.readFileSync(FILE, "utf8"));
  if (s.addr.ArchiveVault) { console.log("ArchiveVault already deployed:", s.addr.ArchiveVault); return; }

  const f = await ethers.getContractFactory("ArchiveVault");
  const dtx = await f.getDeployTransaction(me.address, signer, ARCHIVE333);
  const gas = await ethers.provider.estimateGas({ ...dtx, from: me.address });
  const gp = (await ethers.provider.getFeeData()).gasPrice;
  const cost = gas * gp;
  console.log(`est gas ${gas} @ ${Number(gp) / 1e9} gwei → ~${ethers.formatEther(cost)} ETH`);
  const need = (cost * 115n) / 100n; // 15% margin
  if (bal < need) throw new Error(`insufficient Ethereum ETH: need ~${ethers.formatEther(need)}, have ${ethers.formatEther(bal)} (short ${ethers.formatEther(need - bal)}). Top up a little.`);

  const c = await f.deploy(me.address, signer, ARCHIVE333);
  await c.waitForDeployment();
  s.addr.ArchiveVault = await c.getAddress();
  s.archiveVault = { address: s.addr.ArchiveVault, chain: "ethereum", signer, archive: ARCHIVE333, domain: { name: "MHArchiveVault", version: "1", chainId: 1, verifyingContract: s.addr.ArchiveVault } };
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2));
  console.log(`✅ ArchiveVault (Ethereum): ${s.addr.ArchiveVault}  (tx ${c.deploymentTransaction().hash})`);
}
main().catch((e) => { console.error("STOPPED:", e.shortMessage || e.message); process.exit(1); });
