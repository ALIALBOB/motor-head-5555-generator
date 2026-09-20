// Send test $TOKEN (MHDS) from the treasury wallet to one or more test wallets so they can run the
// activate/upgrade/customize loop. The signer MUST hold $TOKEN (i.e. be the treasury, which received the 1B at deploy).
//   SEED_WALLETS=0xaaa...,0xbbb... SEED_AMOUNT=50000 npx hardhat run scripts/mhfoundry/seed-token.js --network robinhoodMainnet
// Each wallet then approves the UpgradeManager + CustomizeManager (the /forge app does this per-action with exact amounts).
const { ethers, network } = require("hardhat");
const fs = require("fs"), path = require("path");
const E = (n) => ethers.parseEther(String(n));

async function main() {
  const [me] = await ethers.getSigners();
  const file = path.join(__dirname, "..", "..", "deployments", `mhfoundry-${network.name}.json`);
  const d = JSON.parse(fs.readFileSync(file));
  const T = await ethers.getContractAt("MHToken", d.MHToken);

  const wallets = (process.env.SEED_WALLETS || "").split(",").map((s) => s.trim()).filter(Boolean).map(ethers.getAddress);
  const amount = E(process.env.SEED_AMOUNT || "50000"); // 50,000 $TOKEN per wallet by default
  if (!wallets.length) throw new Error("Set SEED_WALLETS=0x...,0x... (comma-separated test wallets).");

  const bal = await T.balanceOf(me.address);
  const need = amount * BigInt(wallets.length);
  console.log(`Sender ${me.address} holds ${ethers.formatEther(bal)} $TOKEN; sending ${ethers.formatEther(amount)} to each of ${wallets.length} wallet(s).`);
  if (bal < need) throw new Error(`Insufficient $TOKEN: need ${ethers.formatEther(need)}, have ${ethers.formatEther(bal)}. Run from the treasury wallet.`);

  for (const w of wallets) {
    const tx = await T.transfer(w, amount);
    await tx.wait();
    console.log(`  → ${w}: ${ethers.formatEther(await T.balanceOf(w))} $TOKEN  (tx ${tx.hash})`);
  }
  console.log("✅ Seeded. Testers can now activate/upgrade/customize in /forge (it approves exact amounts per action).");
}

main().catch((e) => { console.error(e); process.exit(1); });
