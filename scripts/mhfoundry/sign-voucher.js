// Operator-side voucher signer for ForgeBridge. Verifies on ETHEREUM that the 2Ds are burned / the 333 is owned,
// then signs the EIP-712 voucher the holder redeems on Robinhood. (In production this logic lives in the backend.)
//   MODE=burn   OWNER=0x.. ROBOT_ID=1 TO_TIER=3 BURN_IDS=101,102,103,104,105  node scripts/mhfoundry/sign-voucher.js
//   MODE=attach OWNER=0x.. ROBOT_ID=1 ARCHIVE_ID=42                            node scripts/mhfoundry/sign-voucher.js
const { ethers } = require("ethers");
const fs = require("fs"), path = require("path");

const TWOD = "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1";           // 2D MotorHeads (Ethereum)
const ARCHIVE333 = "0x5eb82c9b5ced4c98982633976941d2cc23f4f9b9";      // 333 Archive (Ethereum)
const DEAD = "0x000000000000000000000000000000000000dEaD";           // burn sink
const ABI = ["function ownerOf(uint256) view returns (address)"];

function fromEnvFile(k) { try { const m = fs.readFileSync(path.join(__dirname, "..", "..", ".env"), "utf8").match(new RegExp("^" + k + "=(.+)$", "m")); return m && m[1].trim(); } catch { return null; } }

async function main() {
  const key = process.env.FOUNDRY_SIGNER_KEY || fromEnvFile("FOUNDRY_SIGNER_KEY");
  if (!key) throw new Error("FOUNDRY_SIGNER_KEY missing (env or .env)");
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "deployments", "mhfoundry-mainnet-test.json"), "utf8"));
  if (!dep.forgeBridge || !dep.forgeBridge.domain) throw new Error("ForgeBridge not deployed yet — run deploy-forgebridge.js first");
  const domain = dep.forgeBridge.domain;
  const signer = new ethers.Wallet(key);
  if (signer.address.toLowerCase() !== String(dep.forgeBridge.signer).toLowerCase())
    console.warn(`⚠️ signer key ${signer.address} != contract signer ${dep.forgeBridge.signer}`);
  const prov = new ethers.JsonRpcProvider(process.env.ETH_MAINNET_RPC || "https://ethereum-rpc.publicnode.com");

  const mode = process.env.MODE;
  const owner = ethers.getAddress(process.env.OWNER);
  const robotId = BigInt(process.env.ROBOT_ID);
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  if (mode === "burn") {
    const toTier = Number(process.env.TO_TIER);
    const burnIds = process.env.BURN_IDS.split(",").map((x) => BigInt(x.trim()));
    const c = new ethers.Contract(TWOD, ABI, prov);
    for (const id of burnIds) {
      const o = await c.ownerOf(id).catch(() => null);
      if (!o || o.toLowerCase() !== DEAD.toLowerCase()) throw new Error(`2D #${id} is NOT burned (owner=${o || "nonexistent"}). Send it to ${DEAD} first.`);
    }
    console.log(`✓ verified ${burnIds.length} burned 2D on Ethereum`);
    const types = { Burn: [{ name: "owner", type: "address" }, { name: "robotId", type: "uint256" }, { name: "toTier", type: "uint8" }, { name: "burnIds", type: "uint256[]" }, { name: "nonce", type: "bytes32" }, { name: "deadline", type: "uint256" }] };
    const sig = await signer.signTypedData(domain, types, { owner, robotId, toTier, burnIds, nonce, deadline });
    console.log("\nVOUCHER (redeem with activateWithBurn):");
    console.log(JSON.stringify({ fn: "activateWithBurn", args: { owner, robotId: robotId.toString(), toTier, burnIds: burnIds.map(String), nonce, deadline, sig } }, null, 2));
  } else if (mode === "attach") {
    const archiveId = BigInt(process.env.ARCHIVE_ID);
    const c = new ethers.Contract(ARCHIVE333, ABI, prov);
    const o = await c.ownerOf(archiveId);
    if (o.toLowerCase() !== owner.toLowerCase()) throw new Error(`333 #${archiveId} is owned by ${o}, not ${owner}`);
    console.log(`✓ verified ${owner} owns 333 #${archiveId} on Ethereum`);
    const types = { Attach: [{ name: "owner", type: "address" }, { name: "robotId", type: "uint256" }, { name: "archiveId", type: "uint256" }, { name: "nonce", type: "bytes32" }, { name: "deadline", type: "uint256" }] };
    const sig = await signer.signTypedData(domain, types, { owner, robotId, archiveId, nonce, deadline });
    console.log("\nVOUCHER (redeem with attachArchive):");
    console.log(JSON.stringify({ fn: "attachArchive", args: { owner, robotId: robotId.toString(), archiveId: archiveId.toString(), nonce, deadline, sig } }, null, 2));
  } else throw new Error("MODE must be 'burn' or 'attach'");
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
