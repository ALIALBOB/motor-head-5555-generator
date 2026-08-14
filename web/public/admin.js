// MotorHeads — Gacha Admin console. Manages loot / crate distribution / rewards / fees / controls / roles.
// Dependency-free: window.ethereum + hand-encoded calldata (incl. a tiny ABI encoder for dynamic args), CSP-safe.

const NETWORKS = {
  sepolia: { chainIdHex: "0xaa36a7", chainId: 11155111, chainName: "Sepolia", isTestnet: true, explorer: "https://sepolia.etherscan.io",
    addr: { collection: "0xB44c7350775c10159fCb90120ec5305daC17F693", crates: "0x6cb19001A4C577Ceee7244A9441aA32D9fFA703E", parts: "0x7A8885EcB480063fdDBa6799C8d42179930B68aE", vault: "0xA87f2CDf7183668D3262948C2B5c19880dd6Fcd5" } },
  mainnet: { chainIdHex: "0x1", chainId: 1, chainName: "Ethereum", isTestnet: false, explorer: "https://etherscan.io",
    addr: { collection: "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1", crates: "0x50Dc22553988de047a00328963faEe8EC5E19b12", parts: "0x3f6ADfe2fA714c28B2c6ec4762D089069675f2a2", vault: "0x6AA0c00Ce528A4A15c0c98EcB574df8CF34BF822" } },
};
const NETWORK = "mainnet";           // flip after mainnet deploy
const CFG = NETWORKS[NETWORK];
// ERC-6551 (canonical on both networks) — for computing each NFT's garage wallet
const REGISTRY = "0x000000006551c19487814612e58FE06813775758";
const IMPL = "0x55266d75D1a14E4572138116aF39863Ed6596E7F";
const SALT = "0x" + "0".repeat(64);
const SEL = {
  treasury: "0x61d027b3", paused: "0x5c975abb", lootTable: "0xfdf3c1b9", hasRole: "0x91d14854", activationFeeWei: "0x0ad6c12a",
  setLootTable: "0x3740a503", setActivationFee: "0xc3548647", setTreasury: "0xf0f44260", pause: "0x8456cb59", unpause: "0x3f4ba83a",
  withdraw: "0x3ccfd60b", grantRole: "0x2f2ff15d", revokeRole: "0xd547741f", deposit: "0xd0e30db0", mintCrates: "0xd3461b56", totalMinted: "0xa2309ff8",
  account: "0x246a0021", safeTransferFrom721: "0x42842e0e", setSigner: "0x6c19e783", signerRead: "0x238ac933", setMerkleRoot: "0x7cb64759", setURI: "0x02fe5305",
};
const ROLE = { DEFAULT_ADMIN: "0x" + "0".repeat(64), MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", CONFIG: "0x82db594318110a04b6349ce48645aa69f0892751bc893d15e61d9e2b9c4630f5" };

let account = null, provider = null;
const $ = (id) => document.getElementById(id);
const short = (a) => a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
const uint = (n) => BigInt(n).toString(16).padStart(64, "0");
const addrw = (a) => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const bytes32 = (h) => h.replace(/^0x/, "").padStart(64, "0");
const encStr = (s) => { const b = new TextEncoder().encode(s); let hex = ""; for (const x of b) hex += x.toString(16).padStart(2, "0"); hex += "0".repeat((64 - (hex.length % 64)) % 64); return uint(32) + uint(b.length) + hex; }; // ABI-encode a single string arg
const word = (ret, i) => (ret || "0x").slice(2 + i * 64, 2 + (i + 1) * 64);
const dUint = (w) => BigInt("0x" + (w || "0").padStart(64, "0"));
const dAddr = (w) => "0x" + (w || "").slice(24);
const fmtEth = (wei) => { const v = Number(wei) / 1e18; return (v === 0 ? "0" : v < 0.0001 ? v.toExponential(2) : v.toFixed(5)) + " ETH"; };
const ethToWei = (s) => { const [i, f = ""] = String(s).trim().split("."); return BigInt(i || "0") * 10n ** 18n + BigInt(((f + "0".repeat(18)).slice(0, 18)) || "0"); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isAddr = (a) => /^0x[0-9a-fA-F]{40}$/.test(a || "");
const req = (method, params) => provider.request({ method, params });

// tiny ABI encoder — args: [{t:'uint'|'address'|'bool'|'bytes32'|'uint[]', v}]
function abiEncode(args) {
  const head = [], tail = []; let off = args.length * 32;
  for (const a of args) {
    if (a.t === "uint") head.push(uint(a.v));
    else if (a.t === "address") head.push(addrw(a.v));
    else if (a.t === "bool") head.push(uint(a.v ? 1 : 0));
    else if (a.t === "bytes32") head.push(bytes32(a.v));
    else if (a.t === "uint[]") { head.push(uint(off)); const t = uint(a.v.length) + a.v.map((x) => uint(x)).join(""); tail.push(t); off += t.length / 2; }
  }
  return head.join("") + tail.join("");
}
const callData = (sel, args) => sel + abiEncode(args);

function log(msg, cls = "") { const el = $("log"); const t = new Date().toLocaleTimeString(); el.innerHTML = `<div class="logline ${cls}">[${t}] ${msg}</div>` + el.innerHTML; }
function showNotice(msg, cls) { const el = $("notice"); el.className = "notice " + (cls || ""); el.innerHTML = msg; }
function getProvider() { if (window.ethereum) return Promise.resolve(window.ethereum); return new Promise((res) => { let d = false; const f = () => { if (!d) { d = true; res(window.ethereum || null); } }; window.addEventListener("ethereum#initialized", f, { once: true }); setTimeout(f, 2500); }); }

async function call(to, data) { return req("eth_call", [{ to, data }, "latest"]); }
async function getBal(addr) { return dUint((await req("eth_getBalance", [addr, "latest"])).replace(/^0x/, "")); }
async function send(to, data, valueWei) { const tx = { from: account, to, data }; if (valueWei) tx.value = "0x" + BigInt(valueWei).toString(16); return req("eth_sendTransaction", [tx]); }
async function waitReceipt(h, tries = 90) { for (let i = 0; i < tries; i++) { const r = await req("eth_getTransactionReceipt", [h]).catch(() => null); if (r) return r; await sleep(2000); } return null; }
async function tx(to, data, valueWei) {
  const h = await send(to, data, valueWei);
  log(`tx <a href="${CFG.explorer}/tx/${h}" target="_blank">${short(h)}</a> — waiting…`);
  const rc = await waitReceipt(h);
  if (rc && rc.status === "0x0") throw new Error("transaction reverted on-chain");
  await sleep(1500);
  return rc;
}

function decodeLoot(ret) {
  const hex = (ret || "0x").slice(2); const w = (i) => hex.slice(i * 64, (i + 1) * 64);
  const version = dUint(w(0)), total = dUint(w(3));
  const o1 = Number(dUint(w(1))) / 32, o2 = Number(dUint(w(2))) / 32;
  const readArr = (o) => { const len = Number(dUint(w(o))); const a = []; for (let i = 0; i < len; i++) a.push(dUint(w(o + 1 + i))); return a; };
  const partIds = readArr(o1), cum = readArr(o2);
  const weights = cum.map((c, i) => c - (i ? cum[i - 1] : 0n));
  return { version, partIds, weights, total };
}

async function loadStats() {
  try {
    $("ov-pool").textContent = fmtEth(await getBal(CFG.addr.vault));
    $("ov-fees").textContent = fmtEth(await getBal(CFG.addr.crates));
    $("ov-fee").textContent = fmtEth(dUint(word(await call(CFG.addr.crates, SEL.activationFeeWei), 0)));
    $("ov-minted").textContent = Number(dUint(word(await call(CFG.addr.collection, SEL.totalMinted), 0))).toString();
    const paused = dUint(word(await call(CFG.addr.crates, SEL.paused), 0)) !== 0n;
    $("ov-paused").textContent = paused ? "YES" : "no";
    $("ctl-pause").textContent = paused ? "Unpause" : "Pause";
    $("ctl-pause").className = paused ? "warn" : "danger";
    const tre = dAddr(word(await call(CFG.addr.crates, SEL.treasury), 0));
    $("ov-treasury").innerHTML = `<a href="${CFG.explorer}/address/${tre}" target="_blank">${short(tre)}</a>`;
    try { const sgn = dAddr(word(await call(CFG.addr.crates, SEL.signerRead), 0)); const el = $("signer-current"); if (el) el.innerHTML = `current on-chain signer: <a href="${CFG.explorer}/address/${sgn}" target="_blank">${short(sgn)}</a>`; } catch {}
    const loot = decodeLoot(await call(CFG.addr.crates, SEL.lootTable + uint(1)));
    $("loot-current").innerHTML = loot.version === 0n ? "Current: <b>no loot table set</b>" :
      `Current (crate 1, v${loot.version}): ` + loot.partIds.map((p, i) => `Part #${p}×w${loot.weights[i]}`).join(", ") + ` — total weight ${loot.total}`;
  } catch (e) { log("stats read error: " + (e.message || e), "err"); }
}

// ---- actions
const parseList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean).map((x) => BigInt(x));
async function setLoot() {
  const crate = BigInt($("loot-crate").value || "1"); const parts = parseList($("loot-parts").value); const weights = parseList($("loot-weights").value);
  if (!parts.length || parts.length !== weights.length) throw new Error("part IDs and weights must be non-empty and equal length");
  if (weights.some((w) => w <= 0n)) throw new Error("every weight must be > 0");
  log(`Setting loot table (crate ${crate}): ${parts.length} parts…`);
  await tx(CFG.addr.crates, callData(SEL.setLootTable, [{ t: "uint", v: crate }, { t: "uint[]", v: parts }, { t: "uint[]", v: weights }]));
  log("✓ Loot table set", "ok"); await loadStats();
}
async function mintCrates(to, amt) {
  if (!isAddr(to)) throw new Error("bad recipient address");
  const crate = BigInt($("crate-id").value || "1");
  log(`Minting ${amt} crate(s) [id ${crate}] to ${short(to)}…`);
  await tx(CFG.addr.crates, callData(SEL.mintCrates, [{ t: "address", v: to }, { t: "uint", v: crate }, { t: "uint", v: BigInt(amt) }]));
  log("✓ Crates minted", "ok");
}
async function depositReward() { const wei = ethToWei($("rw-amt").value || "0"); if (wei <= 0n) throw new Error("enter an ETH amount"); log(`Depositing ${fmtEth(wei)} to the reward pool…`); await tx(CFG.addr.vault, SEL.deposit, wei); log("✓ Deposited", "ok"); await loadStats(); }
async function withdrawFees() { log("Sweeping fees → treasury…"); await tx(CFG.addr.crates, SEL.withdraw); log("✓ Fees swept to treasury", "ok"); await loadStats(); }
async function setFee() { const wei = ethToWei($("fee-newfee").value || "0"); log(`Setting activation fee to ${fmtEth(wei)}…`); await tx(CFG.addr.crates, callData(SEL.setActivationFee, [{ t: "uint", v: wei }])); log("✓ Fee set", "ok"); await loadStats(); }
async function setTreasury() { const a = $("fee-treasury").value.trim(); if (!isAddr(a)) throw new Error("bad address"); log(`Setting treasury to ${short(a)}…`); await tx(CFG.addr.crates, callData(SEL.setTreasury, [{ t: "address", v: a }])); log("✓ Treasury set", "ok"); await loadStats(); }
async function setSignerAddr() { const a = $("signer-addr").value.trim(); if (!isAddr(a)) throw new Error("bad address"); log(`Setting crate signer to ${short(a)}…`); await tx(CFG.addr.crates, callData(SEL.setSigner, [{ t: "address", v: a }])); log("✓ Signer set — the backend can now sign holder crate-opens", "ok"); await loadStats(); }
async function grantDistMinter() { const a = $("dist-addr").value.trim(); if (!isAddr(a)) throw new Error("bad distributor address"); log(`Granting MINTER to distributor ${short(a)}…`); await tx(CFG.addr.crates, callData(SEL.grantRole, [{ t: "bytes32", v: ROLE.MINTER }, { t: "address", v: a }])); log("✓ MINTER granted — the distributor can mint claimed crates", "ok"); }
async function setDistRoot() { const a = $("dist-addr").value.trim(); const root = $("dist-root").value.trim(); if (!isAddr(a)) throw new Error("bad distributor address"); if (!/^0x[0-9a-fA-F]{64}$/.test(root)) throw new Error("root must be 0x + 64 hex"); log(`Setting airdrop root ${root.slice(0, 10)}… on ${short(a)}…`); await tx(a, callData(SEL.setMerkleRoot, [{ t: "bytes32", v: root }])); log("✓ Root set — holders can now claim their crates", "ok"); }
async function setPartsUri() { const uri = $("parts-uri").value.trim(); if (!/\{id\}/.test(uri)) throw new Error("URI must contain {id}"); log(`Setting ScrapParts base URI → ${uri}…`); await tx(CFG.addr.parts, SEL.setURI + encStr(uri)); log("✓ Parts metadata URI set — effects now show name + art", "ok"); }
async function togglePause() { const paused = $("ctl-pause").textContent === "Unpause"; log(paused ? "Unpausing…" : "Pausing…"); await tx(CFG.addr.crates, paused ? SEL.unpause : SEL.pause); log(paused ? "✓ Unpaused" : "✓ Paused", "ok"); await loadStats(); }
async function roleChange(grant) { const a = $("role-addr").value.trim(); if (!isAddr(a)) throw new Error("bad address"); log(`${grant ? "Granting" : "Revoking"} MINTER for ${short(a)}…`); await tx(CFG.addr.crates, callData(grant ? SEL.grantRole : SEL.revokeRole, [{ t: "bytes32", v: ROLE.MINTER }, { t: "address", v: a }])); log(`✓ MINTER ${grant ? "granted" : "revoked"}`, "ok"); }

// ---- airdrop to garages (per-NFT rewards, ERC-6551)
async function garageAddr(tokenId) {
  const data = SEL.account + addrw(IMPL) + bytes32(SALT) + uint(CFG.chainId) + addrw(CFG.addr.collection) + uint(tokenId);
  return dAddr(word(await call(REGISTRY, data), 0));
}
async function parseTokenIds(str) {
  str = (str || "").trim();
  if (str.toLowerCase() === "all") { const n = Number(dUint(word(await call(CFG.addr.collection, SEL.totalMinted), 0))); return Array.from({ length: n }, (_, i) => i + 1); }
  const ids = [];
  for (const part of str.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part.includes("-")) { const [a, b] = part.split("-").map((x) => parseInt(x, 10)); for (let i = a; i <= b; i++) ids.push(i); }
    else ids.push(parseInt(part, 10));
  }
  return [...new Set(ids.filter((n) => n > 0))];
}
async function airdropEth() {
  const ids = await parseTokenIds($("ad-ids").value);
  const each = ethToWei($("ad-eth").value || "0");
  if (!ids.length) throw new Error("enter token IDs (e.g. 1,2,3 or 1-50 or all)");
  if (each <= 0n) throw new Error("enter an ETH amount per garage");
  if (ids.length > 25 && !confirm(`This sends ${ids.length} separate transactions (one MetaMask confirm each). For a big airdrop, use the CSV + a disperse tool instead. Continue?`)) return;
  log(`Airdropping ${fmtEth(each)} ETH to ${ids.length} garage(s)…`, "warn");
  let done = 0;
  for (const id of ids) {
    const g = await garageAddr(id);
    await tx(g, "0x", each); // plain ETH transfer to the garage
    done++; log(`  ✓ #${id} garage ${short(g)} funded (${done}/${ids.length})`, "ok");
  }
  log(`✓ Airdrop complete: ${done} garage(s) funded`, "ok");
}
async function airdropNft() {
  const nft = $("adn-contract").value.trim(); const nftId = $("adn-token").value.trim(); const mh = parseInt($("adn-target").value, 10);
  if (!isAddr(nft)) throw new Error("bad NFT contract address");
  if (!(nftId !== "" && Number(nftId) >= 0)) throw new Error("bad NFT token id");
  if (!(mh > 0)) throw new Error("bad target MotorHead #");
  const g = await garageAddr(mh);
  log(`Sending NFT ${short(nft)} #${nftId} → MotorHead #${mh} garage ${short(g)}…`, "warn");
  await tx(nft, callData(SEL.safeTransferFrom721, [{ t: "address", v: account }, { t: "address", v: g }, { t: "uint", v: BigInt(nftId) }]));
  log(`✓ NFT delivered to #${mh}'s garage`, "ok");
}

function guard(fn) { return async (...a) => { try { await fn(...a); } catch (e) { log("✗ " + (e?.data?.message || e?.message || String(e)), "err"); } }; }
function wireButton(id, fn) { const b = $(id); if (b) b.onclick = guard(async () => { b.disabled = true; try { await fn(); } finally { b.disabled = false; } }); }

// silent=true restores an already-authorized wallet via eth_accounts (no popup) so switching
// Admin⇄Garage tabs doesn't re-prompt; silent=false is the explicit Connect click.
async function connect(silent = false) {
  provider = await getProvider();
  if (!provider) { if (!silent) showNotice("⚠️ No wallet detected in this browser. Open in the browser with MetaMask, then reload.", "err"); return; }
  const btn = $("connect");
  if (!silent) { btn.disabled = true; btn.textContent = "Connecting…"; }
  try {
    const accs = silent ? await req("eth_accounts", []) : await req("eth_requestAccounts", []);
    account = accs && accs[0];
    if (!account) return; // silent: not authorized yet
    const cid = await req("eth_chainId", []);
    if (cid !== CFG.chainIdHex) {
      if (silent) { showNotice(`Switch your wallet to ${CFG.chainName} and reload.`, "warn"); return; }
      try { await req("wallet_switchEthereumChain", [{ chainId: CFG.chainIdHex }]); } catch { showNotice(`Switch your wallet to ${CFG.chainName} and reload.`, "err"); return; }
    }
    const isAdmin = dUint(word(await call(CFG.addr.crates, SEL.hasRole + bytes32(ROLE.DEFAULT_ADMIN) + addrw(account)), 0)) !== 0n
      || dUint(word(await call(CFG.addr.crates, SEL.hasRole + bytes32(ROLE.CONFIG) + addrw(account)), 0)) !== 0n;
    $("addr").textContent = short(account); $("who").classList.remove("hidden"); $("connect").classList.add("hidden");
    provider.on?.("accountsChanged", () => location.reload());
    provider.on?.("chainChanged", () => location.reload());
    if (!isAdmin) { showNotice(`🔒 <b>${short(account)}</b> is not an admin of the gacha contracts. Connect the admin wallet.`, "err"); return; }
    $("notice").className = "notice hidden"; $("gate").classList.add("hidden"); $("panel").classList.remove("hidden");
    log("Admin connected " + short(account), silent ? "" : "ok");
    await loadStats();
  } finally { if (!silent) { btn.disabled = false; btn.textContent = "Connect Wallet"; } }
}

function init() {
  $("netbadge").textContent = CFG.isTestnet ? `${CFG.chainName} · testnet` : CFG.chainName;
  $("netbadge").classList.toggle("live", !CFG.isTestnet);
  $("connect").onclick = guard(() => connect(false));
  wireButton("loot-set", setLoot);
  wireButton("crate-mint", () => mintCrates($("crate-to").value.trim(), $("crate-amt").value || "1"));
  wireButton("crate-self", () => mintCrates(account, 1));
  wireButton("ad-eth-btn", airdropEth);
  wireButton("adn-nft-btn", airdropNft);
  wireButton("rw-deposit", depositReward);
  wireButton("fee-withdraw", withdrawFees);
  wireButton("fee-set", setFee);
  wireButton("fee-settreasury", setTreasury);
  wireButton("signer-set", setSignerAddr);
  wireButton("dist-grant", grantDistMinter);
  wireButton("dist-setroot", setDistRoot);
  wireButton("parts-uri-set", setPartsUri);
  wireButton("ctl-pause", togglePause);
  wireButton("role-grant", () => roleChange(true));
  wireButton("role-revoke", () => roleChange(false));
  getProvider().then((p) => { if (!p) { showNotice("⚠️ No wallet detected in this browser. Open in the browser with MetaMask, then reload.", "warn"); return; } connect(true); /* auto-restore if already authorized */ });
}
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", init);
else init();
