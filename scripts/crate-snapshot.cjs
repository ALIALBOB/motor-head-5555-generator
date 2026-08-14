/* Snapshot all MotorHeads holders from-chain and build the CrateDistributor Merkle airdrop.
   Policy: 1 crate per NFT owned (override with PER=wallet for 1-per-wallet, or CAP=n to cap).
   Output → reports/crate-airdrop/{root.txt, proofs.json, summary.json}. No API key needed. */
const fs = require("fs"), path = require("path");
const { ethers } = require("ethers");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const COLLECTION = process.env.COLLECTION || "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1";
const RPC = process.env.RPC || "https://ethereum-rpc.publicnode.com";
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const PER = (process.env.PER || "nft").toLowerCase();   // "nft" = 1 per NFT, "wallet" = 1 per wallet
const CAP = process.env.CAP ? BigInt(process.env.CAP) : 0n; // 0 = no cap
const BATCH = Number(process.env.BATCH || 300);
const OUT = path.join(__dirname, "..", "reports", "crate-airdrop");

const erc721 = new ethers.Interface([
  "function totalMinted() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
]);
const mc = new ethers.Interface([
  "function aggregate3((address target,bool allowFailure,bytes callData)[] calls) view returns ((bool success,bytes returnData)[])",
]);

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const col = new ethers.Contract(COLLECTION, erc721, provider);
  let total;
  try { total = Number(await col.totalMinted()); } catch { total = Number(await col.totalSupply()); }
  // find the starting id (0- or 1-based)
  let start = 1;
  try { await col.ownerOf(0); start = 0; } catch { start = 1; }
  const ids = Array.from({ length: total }, (_, i) => start + i);
  console.log(`collection ${COLLECTION} · total ${total} · ids ${ids[0]}..${ids[ids.length - 1]}`);

  const multicall = new ethers.Contract(MULTICALL3, mc, provider);
  const counts = new Map(); // owner(lowercase) => count
  let scanned = 0, misses = 0;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const calls = chunk.map((id) => ({ target: COLLECTION, allowFailure: true, callData: erc721.encodeFunctionData("ownerOf", [id]) }));
    const res = await multicall.aggregate3(calls);
    for (let j = 0; j < res.length; j++) {
      const r = res[j];
      if (!r.success) { misses++; continue; }
      let owner;
      try { owner = erc721.decodeFunctionResult("ownerOf", r.returnData)[0]; } catch { misses++; continue; }
      if (!owner || owner === ethers.ZeroAddress) { misses++; continue; }
      const k = owner.toLowerCase();
      counts.set(k, (counts.get(k) || 0n) + 1n);
    }
    scanned += chunk.length;
    process.stdout.write(`\r  scanned ${scanned}/${ids.length} · holders ${counts.size} · misses ${misses}   `);
  }
  console.log();

  // apply policy → rows of [address, amount]
  const rows = [];
  let totalCrates = 0n;
  for (const [addr, n] of counts) {
    let amt = PER === "wallet" ? 1n : n;
    if (CAP > 0n && amt > CAP) amt = CAP;
    if (amt <= 0n) continue;
    rows.push([ethers.getAddress(addr), amt.toString()]);
    totalCrates += amt;
  }
  rows.sort((a, b) => (BigInt(b[1]) - BigInt(a[1]) > 0n ? 1 : -1)); // biggest first (readability)

  const tree = StandardMerkleTree.of(rows, ["address", "uint256"]);
  const proofs = {};
  for (const [i, [addr, amt]] of tree.entries()) proofs[addr.toLowerCase()] = { amount: amt, proof: tree.getProof(i) };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "root.txt"), tree.root + "\n");
  fs.writeFileSync(path.join(OUT, "proofs.json"), JSON.stringify(proofs));
  fs.writeFileSync(path.join(OUT, "tree.json"), JSON.stringify(tree.dump()));
  const summary = { collection: COLLECTION, tokensScanned: ids.length, misses, holders: rows.length, totalCrates: totalCrates.toString(), policy: PER === "wallet" ? "1 per wallet" : "1 per NFT", cap: CAP.toString(), root: tree.root, generatedAtBlock: await provider.getBlockNumber() };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n=== SNAPSHOT SUMMARY ===");
  console.log(summary);
  console.log("→", OUT);
}
main().catch((e) => { console.error("ERR:", e.message || e); process.exit(1); });
