// READ-ONLY. Builds the grandfather migration list for the Equip v1 -> v2 swap so nothing already equipped
// disappears when the backend flips to v2 (which starts empty). Scans v1's Equipped events for touched tokens,
// reads each token's CURRENT equippedOf() on v1, and emits { tokenIds, effectIds, backgroundIds } + the ready
// grandfather() calldata to send to v2 from the FOUNDER wallet (CONFIG_ROLE = treasury).
//
//   npx hardhat run scripts/equip-migration-list.cjs --network mainnet
//
// Needs only an RPC (no private key). Set FROM_BLOCK to the v1 deploy block to speed the scan.
const fs = require("fs"), path = require("path");
const { ethers } = require("hardhat");

const V1 = process.env.V1_EQUIP || "0xF16E4CD4a69763106D01AbFF2234e65235681A8A";
const FROM_BLOCK = process.env.FROM_BLOCK ? Number(process.env.FROM_BLOCK) : 0;
const OUT = process.env.OUT || path.join(__dirname, "..", "reports", "equip-migration.json");

// event Equipped(uint256 indexed tokenId, address indexed editor, uint256 effectId, uint256 backgroundId, uint32 revision, uint256 feeWei)
const EQUIPPED_TOPIC = ethers.id("Equipped(uint256,address,uint256,uint256,uint32,uint256)");
const abi = [
  "function equippedOf(uint256) view returns (uint256 effectId, uint256 backgroundId)",
  "function grandfather(uint256[] tokenIds, uint256[] effectIds, uint256[] backgroundIds)",
];

async function main() {
  const provider = ethers.provider;
  const latest = await provider.getBlockNumber();
  console.log(`v1 equip:  ${V1}`);
  console.log(`scanning Equipped logs blocks ${FROM_BLOCK}..${latest} …`);

  // scan in windows so big ranges don't trip provider limits
  const STEP = 40000;
  const touched = new Set();
  for (let from = FROM_BLOCK; from <= latest; from += STEP + 1) {
    const to = Math.min(from + STEP, latest);
    let logs = [];
    try {
      logs = await provider.getLogs({ address: V1, topics: [EQUIPPED_TOPIC], fromBlock: from, toBlock: to });
    } catch (e) {
      console.warn(`  window ${from}-${to} failed (${e.shortMessage || e.message}); narrow FROM_BLOCK to the deploy block`);
      continue;
    }
    for (const l of logs) touched.add(BigInt(l.topics[1]).toString()); // topic1 = indexed tokenId
  }
  console.log(`tokens ever touched: ${touched.size}`);

  const equip = new ethers.Contract(V1, abi, provider);
  const tokenIds = [], effectIds = [], backgroundIds = [];
  for (const idStr of [...touched].map(Number).sort((a, b) => a - b)) {
    const [eff, bg] = await equip.equippedOf(idStr);
    if (eff === 0n && bg === 0n) continue; // currently unequipped — nothing to carry over
    tokenIds.push(idStr); effectIds.push(Number(eff)); backgroundIds.push(Number(bg));
    console.log(`  #${idStr}: effect=${eff} background=${bg}`);
  }

  const result = { v1: V1, scannedTo: latest, count: tokenIds.length, tokenIds, effectIds, backgroundIds };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`\n✓ ${tokenIds.length} tokens to grandfather → ${OUT}`);

  if (tokenIds.length) {
    const iface = new ethers.Interface(abi);
    // batch at 150 like the admin tool (gas limit safety)
    for (let i = 0; i < tokenIds.length; i += 150) {
      const t = tokenIds.slice(i, i + 150), e = effectIds.slice(i, i + 150), b = backgroundIds.slice(i, i + 150);
      const data = iface.encodeFunctionData("grandfather", [t, e, b]);
      console.log(`\n--- grandfather() calldata batch ${i / 150 + 1} (send to the NEW v2 equip from the founder wallet) ---\n${data}`);
    }
  } else {
    console.log("\nNothing equipped on v1 — no grandfather needed.");
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
