/*
  Open machine #1's crate on Sepolia and watch Chainlink VRF fulfill the draw into its garage.
  Requires the VRF subscription funded with test LINK. Run: npm run gacha:open:sepolia
*/
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const c = dep.contracts;
  const [signer] = await ethers.getSigners();
  const me = signer.address;
  const TOKEN_ID = 1n, CRATE_ID = 1n;

  const crates = await ethers.getContractAt("ScrapCrates", c.ScrapCrates);
  const parts = await ethers.getContractAt("ScrapParts", c.ScrapParts);
  const garage = await crates.garageOf(TOKEN_ID);
  console.log("machine:", TOKEN_ID.toString(), "| garage:", garage);

  // LINK check
  const coord = await ethers.getContractAt(
    ["function getSubscription(uint256) view returns (uint96,uint96,uint64,address,address[])"],
    dep.params.vrfCoordinator
  );
  const sub = await coord.getSubscription(dep.params.subscriptionId);
  console.log("VRF sub LINK balance:", ethers.formatEther(sub[0]), "| consumers:", sub[4].length);
  if (sub[0] === 0n) {
    console.log("\n-> Subscription has 0 LINK. Fund it with test LINK at vrf.chain.link, then re-run.");
    return;
  }
  if (!sub[4].map((a) => a.toLowerCase()).includes(c.ScrapCrates.toLowerCase())) {
    console.log("\n-> ScrapCrates is not a consumer on the sub. Add it at vrf.chain.link, then re-run.");
    return;
  }

  // ensure a crate is on hand
  let bal = await crates.balanceOf(me, CRATE_ID);
  if (bal === 0n) {
    console.log("no crate on hand — minting one...");
    await (await crates.mintCrates(me, CRATE_ID, 1)).wait();
    bal = await crates.balanceOf(me, CRATE_ID);
  }
  console.log("crate balance:", bal.toString());

  // snapshot garage part balances before
  const partIds = dep.params.lootTable.partIds;
  const before = {};
  for (const pid of partIds) before[pid] = await parts.balanceOf(garage, pid);

  console.log(`\nopenCrate(machine=${TOKEN_ID}, crate=${CRATE_ID})...`);
  const rc = await (await crates.openCrate(TOKEN_ID, CRATE_ID)).wait();
  console.log("tx:", rc.hash, "\nVRF request sent — waiting for fulfillment (~1-3 min on Sepolia)...");

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    for (const pid of partIds) {
      const now = await parts.balanceOf(garage, pid);
      if (now > before[pid]) {
        console.log(`\n✅ VRF FULFILLED — drew part ${pid} (x${now - before[pid]}) into garage ${garage}`);
        console.log("Full on-chain loop proven on Sepolia: activate -> open -> provably-fair VRF draw -> part in garage.");
        return;
      }
    }
    console.log(`...waiting (${(i + 1) * 15}s)`);
  }
  console.log("\nNo part after 10 min. Check the request status on vrf.chain.link (needs LINK + consumer added).");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
