/*
  Drive the deployed Sepolia gacha system through a real end-to-end run:
    mint a machine -> activate -> mint a crate -> (open if LINK funded) -> reward deposit + claim.
  Reads addresses from deployments/sepolia.json. Run: npx hardhat run scripts/sepolia-drive.cjs --network sepolia
*/
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const TRANSFER = ethers.id("Transfer(address,address,uint256)");

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const c = dep.contracts;
  const [signer] = await ethers.getSigners();
  const me = signer.address;
  console.log("driver:", me);
  console.log("balance:", ethers.formatEther(await ethers.provider.getBalance(me)), "ETH\n");

  const col = await ethers.getContractAt("LivingArchiveMachines", c.collection);
  const crates = await ethers.getContractAt("ScrapCrates", c.ScrapCrates);
  const parts = await ethers.getContractAt("ScrapParts", c.ScrapParts);
  const vault = await ethers.getContractAt("RewardVault", c.RewardVault);

  // --- 1. mint a machine (read the tokenId from the Transfer event) ---------
  console.log("[1] adminMint a machine to the deployer...");
  let rc = await (await col.adminMint(me, 1)).wait();
  const tlog = rc.logs.find((l) => l.address.toLowerCase() === c.collection.toLowerCase() && l.topics[0] === TRANSFER);
  const tokenId = BigInt(tlog.topics[3]);
  console.log("    machine tokenId:", tokenId.toString(), "| owner:", await col.ownerOf(tokenId));
  const garage = await crates.garageOf(tokenId);
  console.log("    garage (ERC-6551):", garage);

  // --- 2. activate (pay the fee) -------------------------------------------
  const fee = await crates.activationFeeWei();
  console.log(`\n[2] activate(tokenId=${tokenId}) paying ${ethers.formatEther(fee)} ETH...`);
  rc = await (await crates.activate(tokenId, { value: fee })).wait();
  console.log("    activated:", await crates.activated(tokenId), "| tx:", rc.hash);
  console.log("    ScrapCrates fee balance:", ethers.formatEther(await ethers.provider.getBalance(c.ScrapCrates)), "ETH");

  // --- 3. mint a crate ------------------------------------------------------
  const CRATE_ID = 1n;
  console.log(`\n[3] mintCrates(me, crateId=${CRATE_ID}, amount=1)...`);
  rc = await (await crates.mintCrates(me, CRATE_ID, 1)).wait();
  console.log("    crate balance (ERC-1155):", (await crates.balanceOf(me, CRATE_ID)).toString(), "| tx:", rc.hash);

  // --- 4. reward vault: deposit + claim (no LINK needed) --------------------
  console.log("\n[4] RewardVault: deposit 0.004 ETH, then claim this machine's share...");
  rc = await (await vault.deposit({ value: ethers.parseEther("0.004") })).wait();
  const claimable = await vault.claimable(tokenId);
  console.log("    claimable for tokenId:", ethers.formatEther(claimable), "ETH");
  if (claimable > 0n) {
    const before = await ethers.provider.getBalance(me);
    rc = await (await vault.claim(tokenId, false)).wait();
    console.log("    claimed to wallet | tx:", rc.hash);
  } else {
    console.log("    (claimable rounded to 0 — deposit more to see a non-zero claim)");
  }

  // --- 5. open the crate (needs the VRF sub funded with LINK) ---------------
  const coord = await ethers.getContractAt(
    ["function getSubscription(uint256) view returns (uint96,uint96,uint64,address,address[])"],
    dep.params.vrfCoordinator
  );
  const sub = await coord.getSubscription(dep.params.subscriptionId);
  const linkBal = sub[0];
  console.log("\n[5] VRF subscription LINK balance:", ethers.formatEther(linkBal), "LINK");
  if (linkBal === 0n) {
    console.log("    -> NOT funded yet. Fund the sub with test LINK, then run: npm run gacha:open:sepolia");
    console.log("    (skipping openCrate for now; everything above is confirmed on-chain.)");
  } else {
    console.log(`    opening crate ${CRATE_ID} for machine ${tokenId}...`);
    rc = await (await crates.openCrate(tokenId, CRATE_ID)).wait();
    console.log("    openCrate tx:", rc.hash, "| VRF request sent. Waiting for fulfillment...");
    // poll the garage for a minted part (VRF fulfil on Sepolia ~1-3 min)
    const partIds = dep.params.lootTable.partIds;
    let got = false;
    for (let i = 0; i < 40 && !got; i++) {
      await new Promise((r) => setTimeout(r, 15000));
      for (const pid of partIds) {
        const b = await parts.balanceOf(garage, pid);
        if (b > 0n) { console.log(`    ✓ VRF fulfilled — part ${pid} x${b} minted into the garage ${garage}`); got = true; break; }
      }
      if (!got) console.log(`    ...waiting (${(i + 1) * 15}s)`);
    }
    if (!got) console.log("    (no part yet after 10 min — check the VRF sub has LINK + the request on vrf.chain.link)");
  }

  console.log("\nDONE. Machine tokenId:", tokenId.toString(), "| garage:", garage);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
