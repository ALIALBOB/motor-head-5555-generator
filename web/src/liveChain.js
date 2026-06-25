const PRESSURE_PRESETS = {
  low: 12,
  medium: 38,
  high: 92,
  extreme: 178
};

const PRESSURE_ORDER = ["low", "medium", "high", "extreme"];
const SIMULATED_BLOCK_BASE = 25000000;
const GLOBAL_PHASES = [
  "Mint",
  "Minted Out",
  "Archive Awakening",
  "Machine Storm",
  "Deep Signal",
  "Next Chapter"
];
const LAM_SELECTORS = {
  mintedAt: "0xf1b0aa15",
  ownerSince: "0xecc03e54",
  transferCount: "0xec02ef57",
  highestVerifiedSaleWei: "0xc5ba9b4e",
  unlockFlags: "0xee2d0962",
  globalPhase: "0xea44866b"
};
const SALE_TIERS = [
  { label: "Mythic Provenance", wei: 10000000000000000000n },
  { label: "Legendary Market Echo", wei: 7000000000000000000n },
  { label: "Royal Archive Seal", wei: 5000000000000000000n },
  { label: "Gold Provenance", wei: 2000000000000000000n },
  { label: "Silver Provenance", wei: 1000000000000000000n }
];

function nowSeconds() {
  const perf = globalThis.performance;
  return perf?.now ? perf.now() / 1000 : Date.now() / 1000;
}

function unixSeconds() {
  return Math.floor(Date.now() / 1000);
}

function numericParam(params, key, fallback) {
  const raw = params.get(key);
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function normalizeGasMode(value) {
  const lower = String(value || "").toLowerCase();
  if (PRESSURE_PRESETS[lower] != null) return lower;
  return "medium";
}

function pressureLevel(value) {
  const gas = Number(value || 0);
  if (gas >= 140) return "extreme";
  if (gas >= 60) return "high";
  if (gas >= 20) return "medium";
  return "low";
}

function saleTierLabel(value) {
  const tier = String(value ?? "0").toLowerCase();
  if (tier === "mythic" || tier === "10" || tier === "10eth") return "Mythic Provenance";
  if (tier === "legendary" || tier === "7" || tier === "7eth") return "Legendary Market Echo";
  if (tier === "royal" || tier === "5" || tier === "5eth") return "Royal Archive Seal";
  if (tier === "gold" || tier === "2" || tier === "2eth") return "Gold Provenance";
  if (tier === "silver" || tier === "1" || tier === "1eth") return "Silver Provenance";
  const wei = parseSaleWei(value);
  for (const saleTier of SALE_TIERS) {
    if (wei >= saleTier.wei) return saleTier.label;
  }
  return "No Major Sale";
}

function ageLabel(seconds) {
  const days = seconds / 86400;
  if (days >= 3650) return "10 Years";
  if (days >= 1825) return "5 Years";
  if (days >= 1095) return "3 Years";
  if (days >= 730) return "2 Years";
  if (days >= 365) return "1 Year";
  if (days >= 180) return "6 Months";
  if (days >= 90) return "3 Months";
  if (days >= 30) return "1 Month";
  if (days >= 7) return "1 Week";
  if (days >= 3) return "3 Days";
  if (days >= 1) return "1 Day";
  return "Fresh Mint";
}

function bondLabel(seconds) {
  const days = seconds / 86400;
  if (days >= 365) return "Permanent Keeper";
  if (days >= 180) return "Deep Holder";
  if (days >= 90) return "Guardian";
  if (days >= 30) return "Keeper";
  if (days >= 7) return "Bonded";
  if (days >= 3) return "Warming Bond";
  if (days >= 1) return "First Day";
  return "New Holder";
}

function moodFor(level, ageSeconds, bondSeconds, saleTier) {
  if (saleTier !== "No Major Sale") return "legendary";
  if (level === "extreme") return "overheated";
  if (level === "high") return "stressed";
  if (ageSeconds >= 365 * 86400 || bondSeconds >= 180 * 86400) return "aged";
  return "calm";
}

function hexToInt(hex) {
  if (typeof hex !== "string") return 0;
  return Number.parseInt(hex, 16);
}

function hexToBigInt(hex) {
  if (typeof hex !== "string" || hex === "0x") return 0n;
  try {
    return BigInt(hex);
  } catch (_) {
    return 0n;
  }
}

function normalizeAddress(value) {
  const address = String(value || "").trim();
  return /^0x[a-fA-F0-9]{40}$/.test(address) ? address : "";
}

function encodeTokenCall(selector, tokenId) {
  const id = BigInt(Math.max(0, Math.floor(Number(tokenId) || 0)));
  return selector + id.toString(16).padStart(64, "0");
}

async function rpcCall(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
  });
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error.message || "RPC error");
  return payload?.result;
}

async function ethCallUint(rpcUrl, to, data) {
  const result = await rpcCall(rpcUrl, "eth_call", [{ to, data }, "latest"]);
  return hexToBigInt(result);
}

function decimalEthToWei(value) {
  const text = String(value || "").toLowerCase().replace(/eth$/, "");
  if (!/^\d+(\.\d+)?$/.test(text)) return 0n;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole || "0") * 1000000000000000000n + BigInt(fraction.padEnd(18, "0").slice(0, 18) || "0");
}

function parseSaleWei(value) {
  if (typeof value === "bigint") return value;
  const text = String(value ?? "0").trim().toLowerCase();
  if (!text || text === "none" || text === "0") return 0n;
  if (text === "mythic") return 10000000000000000000n;
  if (text === "legendary") return 7000000000000000000n;
  if (text === "royal") return 5000000000000000000n;
  if (text === "gold") return 2000000000000000000n;
  if (text === "silver") return 1000000000000000000n;
  if (text.startsWith("0x")) return hexToBigInt(text);
  if (/^\d+$/.test(text) && text.length > 15) return BigInt(text);
  return decimalEthToWei(text);
}

function phaseLabel(value, fallback) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && GLOBAL_PHASES[numeric]) return GLOBAL_PHASES[numeric];
  return fallback || "Archive Awakening";
}

export function createLiveChainController(layout, params = new URLSearchParams(globalThis.location?.search || "")) {
  const tokenId = Number(layout?.tokenId || params.get("tokenId") || 1);
  const contractAddress = normalizeAddress(params.get("contract") || params.get("address"));
  const gasParam = params.get("gas");
  const numericGas = gasParam && Number.isFinite(Number(gasParam)) ? Number(gasParam) : null;
  let gasMode = numericGas == null ? normalizeGasMode(gasParam || "medium") : pressureLevel(numericGas);
  let manualGas = numericGas;
  let live = params.has("live") && params.get("live") !== "0";
  let blockNumber = numericParam(params, "block", SIMULATED_BLOCK_BASE + tokenId * 137);
  let lastBlockAt = nowSeconds();
  let heartbeatAt = nowSeconds() - 20;
  let blockTimestamp = unixSeconds();
  let rpcPollAt = 0;
  let rpcBusy = false;
  let contractPollAt = 0;
  let contractBusy = false;
  let chainData = null;
  const rpcUrl = params.get("rpc") || "";
  const blockInterval = Math.max(0.8, numericParam(params, "blockSpeed", 3.2));
  const baseAgeDays = numericParam(params, "ageDays", numericParam(params, "age", 24 + tokenId * 5));
  const baseBondDays = numericParam(params, "bondDays", numericParam(params, "bond", (tokenId % 7) * 9));
  const baseAgeSeconds = numericParam(params, "ageSeconds", baseAgeDays * 86400);
  const baseBondSeconds = numericParam(params, "bondSeconds", baseBondDays * 86400);
  const transfers = Math.max(0, Math.floor(numericParam(params, "transfers", tokenId % 9)));
  const manualSaleValue = params.get("highestSaleWei") || params.get("saleWei") || params.get("saleTier") || params.get("sale") || "0";
  const manualSaleCount = Math.max(0, Math.floor(
    numericParam(params, "saleCount",
      numericParam(params, "sales",
        numericParam(params, "sellCount",
          numericParam(params, "saleTransfers",
            numericParam(params, "soldTransfers", 0)
          )
        )
      )
    )
  ));
  const scarScreenColor = params.get("scarScreenColor") || params.get("scarColor") || "";
  const phase = params.get("phase") || "Archive Awakening";

  async function pollRpc() {
    if (!rpcUrl || rpcBusy || nowSeconds() - rpcPollAt < 5.5) return;
    rpcBusy = true;
    rpcPollAt = nowSeconds();
    try {
      const block = await rpcCall(rpcUrl, "eth_getBlockByNumber", ["latest", false]);
      const nextBlock = hexToInt(block?.number);
      if (nextBlock && nextBlock !== blockNumber) {
        blockNumber = nextBlock;
        heartbeatAt = nowSeconds();
      }
      if (block?.timestamp) blockTimestamp = hexToInt(block.timestamp);
      if (block?.baseFeePerGas) manualGas = Math.max(1, hexToInt(block.baseFeePerGas) / 1e9);
    } catch (_) {
      // Browser/CORS/RPC failures fall back to the deterministic local simulator.
    } finally {
      rpcBusy = false;
    }
  }

  async function pollContractState() {
    if (!rpcUrl || !contractAddress || contractBusy || nowSeconds() - contractPollAt < 8) return;
    contractBusy = true;
    contractPollAt = nowSeconds();
    try {
      const [minted, owner, transferRaw, saleRaw, flagsRaw, phaseRaw] = await Promise.all([
        ethCallUint(rpcUrl, contractAddress, encodeTokenCall(LAM_SELECTORS.mintedAt, tokenId)),
        ethCallUint(rpcUrl, contractAddress, encodeTokenCall(LAM_SELECTORS.ownerSince, tokenId)),
        ethCallUint(rpcUrl, contractAddress, encodeTokenCall(LAM_SELECTORS.transferCount, tokenId)),
        ethCallUint(rpcUrl, contractAddress, encodeTokenCall(LAM_SELECTORS.highestVerifiedSaleWei, tokenId)),
        ethCallUint(rpcUrl, contractAddress, encodeTokenCall(LAM_SELECTORS.unlockFlags, tokenId)),
        ethCallUint(rpcUrl, contractAddress, LAM_SELECTORS.globalPhase)
      ]);
      chainData = {
        mintedAt: Number(minted),
        ownerSince: Number(owner),
        transferCount: Number(transferRaw),
        highestVerifiedSaleWei: saleRaw,
        unlockFlags: flagsRaw.toString(),
        globalPhase: Number(phaseRaw)
      };
    } catch (_) {
      // If a static marketplace iframe cannot reach the RPC, keep the deterministic simulator alive.
    } finally {
      contractBusy = false;
    }
  }

  function update() {
    const now = nowSeconds();
    if (live && !rpcUrl && now - lastBlockAt >= blockInterval) {
      const steps = Math.max(1, Math.floor((now - lastBlockAt) / blockInterval));
      blockNumber += steps;
      blockTimestamp = unixSeconds();
      lastBlockAt = now;
      heartbeatAt = now;
    }
    if (live && rpcUrl) void pollRpc();
    if (live && rpcUrl && contractAddress) void pollContractState();
  }

  function baseFeeGwei() {
    const base = manualGas ?? PRESSURE_PRESETS[gasMode];
    if (!live) return base;
    const wobble = Math.sin(nowSeconds() * 0.66 + tokenId) * (gasMode === "extreme" ? 16 : gasMode === "high" ? 9 : 3);
    return Math.max(1, base + wobble);
  }

  function snapshot() {
    update();
    const now = nowSeconds();
    const gas = baseFeeGwei();
    const level = pressureLevel(gas);
    const heartbeatPulse = live ? Math.max(0, 1 - (now - heartbeatAt) / 0.72) : 0;
    const referenceTime = blockTimestamp || unixSeconds();
    const archiveAgeSeconds = chainData?.mintedAt
      ? Math.max(0, referenceTime - chainData.mintedAt)
      : Math.max(0, Math.floor(baseAgeSeconds + (live ? now : 0)));
    const holderBondSeconds = chainData?.ownerSince
      ? Math.max(0, referenceTime - chainData.ownerSince)
      : Math.max(0, Math.floor(baseBondSeconds + (live ? now / 2 : 0)));
    const transferCount = chainData?.transferCount ?? transfers;
    const saleValue = chainData?.highestVerifiedSaleWei ?? manualSaleValue;
    const saleTier = saleTierLabel(saleValue);
    const saleCount = manualSaleCount || (saleTier !== "No Major Sale" ? 1 : 0);
    const mood = moodFor(level, archiveAgeSeconds, holderBondSeconds, saleTier);

    return {
      liveMode: live,
      contractAddress,
      blockNumber,
      blockTimestamp,
      baseFeeGwei: gas,
      gasPressure: gas,
      pressureLevel: level,
      heartbeatPulse,
      archiveAgeSeconds,
      archiveAgeLabel: ageLabel(archiveAgeSeconds),
      holderBondSeconds,
      holderBondLabel: bondLabel(holderBondSeconds),
      transferCount,
      saleCount,
      sellCount: saleCount,
      saleTier,
      highestVerifiedSaleWei: String(parseSaleWei(saleValue)),
      scarScreenColor,
      unlockFlags: chainData?.unlockFlags || "0",
      globalPhase: phaseLabel(chainData?.globalPhase, phase),
      mood,
      liquidColor: layout?.liquid?.colorIndex,
      liquidTexture: layout?.liquid?.texture,
      fillLevel: layout?.liquid?.fillLevel
    };
  }

  return {
    snapshot,
    setLive(value) {
      live = Boolean(value);
      heartbeatAt = nowSeconds();
      lastBlockAt = nowSeconds();
    },
    toggleLive() {
      live = !live;
      heartbeatAt = nowSeconds();
      lastBlockAt = nowSeconds();
      return live;
    },
    isLive() {
      return live;
    },
    gasMode() {
      return gasMode;
    },
    cycleGasMode() {
      const index = PRESSURE_ORDER.indexOf(gasMode);
      gasMode = PRESSURE_ORDER[(index + 1) % PRESSURE_ORDER.length];
      manualGas = null;
      heartbeatAt = nowSeconds();
      return gasMode;
    },
    setGasMode(mode) {
      gasMode = normalizeGasMode(mode);
      manualGas = null;
      heartbeatAt = nowSeconds();
    }
  };
}
