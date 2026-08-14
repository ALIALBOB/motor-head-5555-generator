/* Diagnose why the openCrate VRF request hasn't landed a part. */
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const OPEN_TX = "0x3c8f3610e4afae1277e460be7f280bdaa126909123d6d02ee5135133d1744148";

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployments", "sepolia.json")));
  const c = dep.contracts;
  const crates = await ethers.getContractAt("ScrapCrates", c.ScrapCrates);
  const parts = await ethers.getContractAt("ScrapParts", c.ScrapParts);
  const provider = ethers.provider;

  // 1. requestId from our CrateOpening event
  const rc = await provider.getTransactionReceipt(OPEN_TX);
  console.log("openCrate tx status:", rc.status, "| block:", rc.blockNumber);
  const openingTopic = ethers.id("CrateOpening(uint256,uint256,uint256,uint256,address)");
  let requestId;
  for (const l of rc.logs) {
    if (l.address.toLowerCase() === c.ScrapCrates.toLowerCase() && l.topics[0] === openingTopic) {
      const parsed = crates.interface.parseLog(l);
      requestId = parsed.args.requestId;
      console.log("CrateOpening -> requestId:", requestId.toString(), "| lootVersion:", parsed.args.lootVersion.toString());
    }
  }
  // also show every event the tx emitted (addr:topic0)
  console.log("tx emitted logs from:", [...new Set(rc.logs.map(l => l.address))].join(", "));

  if (requestId === undefined) { console.log("!! no CrateOpening event — openCrate did not request VRF"); return; }

  // 2. contract state for this requestId
  const p = await crates.pending(requestId);
  const cl = await crates.claimableOf(requestId);
  console.log("\npending[reqId]  :", { machineTokenId: p.machineTokenId?.toString?.() ?? p[0]?.toString?.(), raw: p.toString() });
  console.log("claimableOf[reqId]:", cl.toString());

  // 3. garage balances
  const garage = await crates.garageOf(1n);
  for (const pid of dep.params.lootTable.partIds) {
    console.log(`garage part ${pid}:`, (await parts.balanceOf(garage, pid)).toString());
  }

  // 4. did the coordinator fulfill? scan its logs for our requestId since the open block
  const coordAddr = dep.params.vrfCoordinator;
  const fulfilledTopic = ethers.id("RandomWordsFulfilled(uint256,uint256,uint256,uint96,bool,bool,bool)");
  const reqIdTopic = ethers.zeroPadValue(ethers.toBeHex(requestId), 32);
  const logs = await provider.getLogs({
    address: coordAddr,
    topics: [fulfilledTopic, reqIdTopic],
    fromBlock: rc.blockNumber,
    toBlock: "latest",
  }).catch((e) => { console.log("getLogs(fulfilled) err:", e.shortMessage || e.message); return []; });
  console.log("\nRandomWordsFulfilled logs for our requestId:", logs.length);
  const coordIface = new ethers.Interface([
    "event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint256 indexed subId, uint96 payment, bool nativePayment, bool success, bool onlyPremium)"
  ]);
  for (const l of logs) {
    try { const d = coordIface.parseLog(l); console.log("  fulfilled: success =", d.args.success, "| payment =", ethers.formatEther(d.args.payment), "LINK | block", l.blockNumber); }
    catch (e) { console.log("  (decode failed, raw)", l.data); }
  }
  if (logs.length === 0) console.log("  => STILL PENDING at the DON (not fulfilled yet). Not a contract problem.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
