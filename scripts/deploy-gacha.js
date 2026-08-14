/*
  Deploy + wire the MotorHeads on-chain garage/gacha system:

    ScrapParts   (ERC-1155 parts)                       -> no deps
    ScrapCrates  (ERC-6551 activation + VRF v2.5 opener) -> needs ScrapParts
    RewardVault  (per-NFT ETH split)                     -> independent

  Deploy order: ScrapParts -> ScrapCrates -> RewardVault.
  The EOA that sends the tx MUST be the `admin` (ScrapCrates constructor requires
  deployer == admin, because VRFConsumerBaseV2Plus pins the Chainlink ConfirmedOwner
  to msg.sender). This script always uses the Hardhat signer as both. It NEVER
  hardcodes a private key.

  Usage:
    # local (against `npx hardhat node` or the in-process net)
    npx hardhat run scripts/deploy-gacha.js          # or: npm run gacha:deploy:local

    # Sepolia (fill .env first — see secretsChecklist / networkConfig)
    npx hardhat run scripts/deploy-gacha.js --network sepolia   # or: npm run gacha:deploy:sepolia

  The core logic is exported as `deployGachaSystem(hre, overrides)` so tests can
  drive the exact same deploy + wiring + assertions end-to-end (see
  test/Deploy.dryrun.test.js).
*/

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Network constants. Only HIGH/MEDIUM-confidence facts are hardcoded here.
// Anything per-deployment or low-confidence is read from env (see resolveParams
// + secretsChecklist) and is NEVER guessed.
// ---------------------------------------------------------------------------
const CHAIN = {
  // Ethereum mainnet
  1: {
    name: "mainnet",
    // HIGH — task spec: the live MotorHeads ERC-721, fixed supply 5555
    collection: "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1",
    // HIGH — https://eips.ethereum.org/EIPS/eip-6551 (canonical, same on all chains)
    erc6551Registry: "0x000000006551c19487814612e58FE06813775758",
    // HIGH — docs.chain.link VRF v2.5 supported-networks
    vrfCoordinator: "0xD7f86b4b8Cae7D942340FF628F82735b7a20893a",
    // HIGH — default to the 500 gwei lane (override with VRF_KEY_HASH; other lanes below)
    vrfKeyHash: "0x3fd2fec10d06ee8f65e7f2e95f5c56511359ece3f33960ad8a866ae24a8ff10b",
    // extra mainnet lanes if you want to override VRF_KEY_HASH:
    //   200 gwei  0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9
    //   1000 gwei 0xc6bf2e7b88e5cfbb4946ff23af846494ae1f3c65270b79ee7876c9aa99d3d45f
    linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    rewardTotalTokens: 5555n, // HIGH — collection's final fixed supply
  },
  // Sepolia testnet
  11155111: {
    name: "sepolia",
    // No live collection on Sepolia — supply SEPOLIA_COLLECTION_ADDRESS, or the
    // script deploys a stand-in test ERC-721 (LivingArchiveMachines).
    collection: null,
    erc6551Registry: "0x000000006551c19487814612e58FE06813775758", // HIGH
    vrfCoordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",   // HIGH
    vrfKeyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // HIGH — the only Sepolia lane (500 gwei)
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // HIGH
    rewardTotalTokens: 5555n, // stand-in mirrors the mainnet fixed supply
  },
};

// Placeholder loot table used at deploy so the tier is openable immediately.
// The real part ids + weights come from the off-chain art/metadata catalog and
// are rewritten later via ScrapCrates.setLootTable (each call = a new immutable
// version; in-flight opens keep the version they snapshotted).
const PLACEHOLDER_CRATE_ID = 1;
const PLACEHOLDER_PART_IDS = [1, 2, 3]; // PLACEHOLDER — replace once the parts catalog is minted/finalized
const PLACEHOLDER_WEIGHTS = [1, 1, 1]; //  PLACEHOLDER — equal odds for now

const MINTER_ROLE = require("ethers").id("MINTER_ROLE"); // keccak256("MINTER_ROLE")

// ---------------------------------------------------------------------------
// Resolve all constructor params from (overrides ?? env ?? network default),
// throwing a clear message for anything required-but-missing on a real network.
// ---------------------------------------------------------------------------
function resolveParams(hre, chainId, deployer, overrides) {
  const ethers = hre.ethers;
  const net = CHAIN[chainId];
  const isLocal = !net; // hardhat/localhost/anvil etc.
  const env = process.env;

  const pick = (o, e, d) => (o !== undefined ? o : e !== undefined ? e : d);
  const requireVal = (v, label, envName) => {
    if (v === undefined || v === null || v === "") {
      throw new Error(
        `[deploy] Missing required value: ${label}. ` +
          `Set the ${envName} env var (see secretsChecklist) or pass it as an override.`
      );
    }
    return v;
  };

  // --- addresses / salt ---------------------------------------------------
  const registry = pick(
    overrides.registry,
    env.ERC6551_REGISTRY,
    net && net.erc6551Registry
  );
  // accountImplementation is NOT canonical/known — LOW confidence. Never guessed.
  const accountImplementation = pick(
    overrides.accountImplementation,
    env.ERC6551_ACCOUNT_IMPL,
    undefined
  );
  const accountSalt = pick(overrides.accountSalt, env.ACCOUNT_SALT, ethers.ZeroHash); // canonical default salt = bytes32(0)

  // --- randomness signer (backend) ---------------------------------------
  // Off-chain signed randomness (no Chainlink VRF). This is the trusted backend key whose signature
  // authorizes each draw's seed. Defaults to the deployer for local/test; set SIGNER_ADDRESS for prod.
  const randomnessSigner = pick(overrides.signer, env.SIGNER_ADDRESS, deployer);

  // --- economy ------------------------------------------------------------
  const treasury = pick(overrides.treasury, env.TREASURY_ADDRESS, isLocal ? deployer : undefined);
  const activationFeeWei =
    overrides.activationFeeWei !== undefined
      ? BigInt(overrides.activationFeeWei)
      : ethers.parseEther(env.ACTIVATION_FEE_ETH || "0.003"); // DECIDE this before mainnet

  // --- collection + reward supply ----------------------------------------
  const collection = pick(overrides.collection, env.SEPOLIA_COLLECTION_ADDRESS || env.COLLECTION_ADDRESS, net && net.collection);
  const rewardTotalTokens =
    overrides.rewardTotalTokens !== undefined
      ? BigInt(overrides.rewardTotalTokens)
      : env.REWARD_TOTAL_TOKENS
      ? BigInt(env.REWARD_TOTAL_TOKENS)
      : net
      ? net.rewardTotalTokens
      : 5555n; // INVARIANT: must equal the collection's FINAL fixed supply (immutable)

  // --- metadata URIs ------------------------------------------------------
  const partsBaseURI = pick(overrides.partsBaseURI, env.PARTS_BASE_URI, "ipfs://REPLACE_ME/parts/{id}.json");
  const cratesURI = pick(overrides.cratesURI, env.CRATES_URI, "ipfs://REPLACE_ME/crates/{id}.json");

  // --- loot table (placeholder unless overridden) -------------------------
  const lootCrateId = pick(overrides.lootCrateId, undefined, PLACEHOLDER_CRATE_ID);
  const lootPartIds = pick(overrides.lootPartIds, undefined, PLACEHOLDER_PART_IDS);
  const lootWeights = pick(overrides.lootWeights, undefined, PLACEHOLDER_WEIGHTS);

  // --- optional extra wiring ---------------------------------------------
  const backendMinter = pick(overrides.backendMinter, env.BACKEND_MINTER_ADDRESS, undefined);
  const addVrfConsumer = pick(overrides.addVrfConsumer, env.AUTO_ADD_CONSUMER === "true" ? true : undefined, false);

  // --- validate the ones that have no safe default on a real network ------
  requireVal(registry, "ERC-6551 registry", "ERC6551_REGISTRY");
  requireVal(accountImplementation, "ERC-6551 account implementation", "ERC6551_ACCOUNT_IMPL");
  requireVal(randomnessSigner, "randomness signer", "SIGNER_ADDRESS");
  requireVal(treasury, "treasury address", "TREASURY_ADDRESS");
  // Require a REAL collection only on mainnet (never stand-in on mainnet). On Sepolia/other test
  // nets, a null collection is allowed -> deployGachaSystem auto-deploys a LivingArchiveMachines stand-in.
  if (chainId === 1) requireVal(collection, "collection address", "COLLECTION_ADDRESS");

  return {
    isLocal,
    networkName: net ? net.name : hre.network.name,
    admin: deployer,
    registry,
    accountImplementation,
    accountSalt,
    randomnessSigner,
    treasury,
    activationFeeWei,
    collection, // may be null on local/sepolia -> a stand-in is deployed
    rewardTotalTokens,
    partsBaseURI,
    cratesURI,
    lootCrateId,
    lootPartIds,
    lootWeights,
    backendMinter,
    addVrfConsumer,
    linkToken: net && net.linkToken,
  };
}

// ---------------------------------------------------------------------------
// The reusable core: deploy the 3 contracts, do ALL post-deploy wiring, assert
// every post-condition. Returns the deployed contracts + a summary object.
// `overrides` lets tests inject mocks + known loot values.
// ---------------------------------------------------------------------------
async function deployGachaSystem(hre, overrides = {}) {
  const ethers = hre.ethers;
  const log = overrides.silent ? () => {} : (...a) => console.log(...a);

  const [deployer] = await ethers.getSigners();
  const netInfo = await ethers.provider.getNetwork();
  const chainId = Number(netInfo.chainId);

  const p = resolveParams(hre, chainId, deployer.address, overrides);

  log("============================================================");
  log(`MotorHeads gacha deploy — network=${p.networkName} chainId=${chainId}`);
  log(`Deployer / admin: ${deployer.address}`);
  log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  log("============================================================");

  // --- 0. collection: use the live/real address, or deploy a Sepolia/local stand-in
  let collectionAddress = p.collection;
  let standInCollection = null;
  if (!collectionAddress) {
    log("No collection address supplied -> deploying a stand-in test ERC-721 (LivingArchiveMachines)...");
    const StandIn = await ethers.getContractFactory("LivingArchiveMachines");
    standInCollection = await StandIn.deploy(
      deployer.address,
      "ipfs://stand-in/metadata/",
      "ipfs://stand-in/contract.json",
      ethers.parseEther("0.03")
    );
    await standInCollection.waitForDeployment();
    collectionAddress = await standInCollection.getAddress();
    log(`  stand-in collection: ${collectionAddress}`);
  }

  // --- 1. ScrapParts (admin, baseURI) -------------------------------------
  log("\n[1/3] Deploying ScrapParts...");
  const Parts = await ethers.getContractFactory("ScrapParts");
  const parts = await Parts.deploy(deployer.address, p.partsBaseURI);
  await parts.waitForDeployment();
  const partsAddr = await parts.getAddress();
  log(`  ScrapParts: ${partsAddr}`);

  // --- 2. ScrapCrates (10 params, EXACT order) ----------------------------
  //  1 admin, 2 uri_, 3 collection_, 4 parts_, 5 registry_, 6 accountImplementation_,
  //  7 accountSalt_, 8 treasury_, 9 activationFeeWei_, 10 signer_ (backend randomness signer)
  log("[2/3] Deploying ScrapCrates...");
  const Crates = await ethers.getContractFactory("ScrapCrates");
  const crates = await Crates.deploy(
    deployer.address, //     1 admin
    p.cratesURI, //          2 uri_
    collectionAddress, //    3 collection_
    partsAddr, //            4 parts_
    p.registry, //           5 registry_
    p.accountImplementation, // 6 accountImplementation_
    p.accountSalt, //        7 accountSalt_
    p.treasury, //           8 treasury_
    p.activationFeeWei, //   9 activationFeeWei_
    p.randomnessSigner //   10 signer_
  );
  await crates.waitForDeployment();
  const cratesAddr = await crates.getAddress();
  log(`  ScrapCrates: ${cratesAddr}`);

  // --- 3. RewardVault (6 params, EXACT order) -----------------------------
  //  1 admin, 2 collection_, 3 totalTokens_, 4 registry_, 5 accountImplementation_, 6 accountSalt_
  log("[3/3] Deploying RewardVault...");
  const Vault = await ethers.getContractFactory("RewardVault");
  const vault = await Vault.deploy(
    deployer.address, //     1 admin
    collectionAddress, //    2 collection_
    p.rewardTotalTokens, //  3 totalTokens_ (== final fixed supply, immutable)
    p.registry, //           4 registry_
    p.accountImplementation, // 5 accountImplementation_
    p.accountSalt //         6 accountSalt_
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  log(`  RewardVault: ${vaultAddr}`);

  // ======================= POST-DEPLOY WIRING ============================
  log("\n--- Post-deploy wiring ---");

  // (a) MANDATORY: ScrapCrates needs MINTER_ROLE on ScrapParts, or every open
  //     silently degrades to a redeemable-but-unminted claim.
  log("  granting ScrapParts.MINTER_ROLE -> ScrapCrates");
  await (await parts.grantRole(MINTER_ROLE, cratesAddr)).wait();

  // (b) MANDATORY per tier: a loot table must exist before any openCrate, or it
  //     reverts "no loot table". Placeholder ids/weights unless overridden.
  log(
    `  setLootTable(crateId=${p.lootCrateId}, partIds=[${p.lootPartIds}], weights=[${p.lootWeights}])` +
      (overrides.lootPartIds ? "" : "  <-- PLACEHOLDER: rewrite via setLootTable once the parts catalog is final")
  );
  await (await crates.setLootTable(p.lootCrateId, p.lootPartIds, p.lootWeights)).wait();

  // (c) OPTIONAL: grant the backend MINTER_ROLE on ScrapCrates so crates can be
  //     minted/earned. Without it, no crate ever exists to open. Do it now if a
  //     backend address was supplied; otherwise print the exact reminder.
  if (p.backendMinter) {
    log(`  granting ScrapCrates.MINTER_ROLE -> backend ${p.backendMinter}`);
    await (await crates.grantRole(MINTER_ROLE, p.backendMinter)).wait();
  } else {
    log(
      "  [REMINDER] backend needs MINTER_ROLE on ScrapCrates before any crate can be minted:\n" +
        `             await scrapCrates.grantRole(await scrapCrates.MINTER_ROLE(), <backendAddress>)`
    );
  }

  // (d) Randomness signer: draws are resolved with a seed signed by `signer` (the backend). No LINK / VRF.
  log(`  randomness signer set to ${p.randomnessSigner}` + (overrides.signer || process.env.SIGNER_ADDRESS ? "" : "  <-- defaulted to deployer; set SIGNER_ADDRESS to your backend signer for prod"));

  // ======================= POST-CONDITION ASSERTIONS =====================
  log("\n--- Asserting post-conditions ---");
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const assert = (cond, msg) => {
    if (!cond) throw new Error(`[deploy] POST-CONDITION FAILED: ${msg}`);
  };

  // admin / ownership
  assert(await parts.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), "ScrapParts DEFAULT_ADMIN_ROLE != admin");
  assert(await crates.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), "ScrapCrates DEFAULT_ADMIN_ROLE != admin");
  assert(await vault.hasRole(DEFAULT_ADMIN_ROLE, deployer.address), "RewardVault DEFAULT_ADMIN_ROLE != admin");
  assert((await crates.signer()) === ethers.getAddress(p.randomnessSigner), "ScrapCrates.signer mismatch");

  // the mandatory minter grant
  assert(await parts.hasRole(MINTER_ROLE, cratesAddr), "ScrapCrates lacks MINTER_ROLE on ScrapParts");

  // immutables match what we passed
  assert((await crates.registry()) === ethers.getAddress(p.registry), "ScrapCrates.registry mismatch");
  assert(
    (await crates.accountImplementation()) === ethers.getAddress(p.accountImplementation),
    "ScrapCrates.accountImplementation mismatch"
  );
  assert((await crates.collection()) === ethers.getAddress(collectionAddress), "ScrapCrates.collection mismatch");
  assert((await crates.parts()) === ethers.getAddress(partsAddr), "ScrapCrates.parts mismatch");
  assert((await vault.registry()) === ethers.getAddress(p.registry), "RewardVault.registry mismatch");
  assert(
    (await vault.accountImplementation()) === ethers.getAddress(p.accountImplementation),
    "RewardVault.accountImplementation mismatch"
  );
  assert((await vault.totalTokens()) === p.rewardTotalTokens, "RewardVault.totalTokens mismatch");
  assert((await vault.collection()) === ethers.getAddress(collectionAddress), "RewardVault.collection mismatch");

  // economy / loot
  assert((await crates.activationFeeWei()) === p.activationFeeWei, "ScrapCrates.activationFeeWei mismatch");
  assert((await crates.treasury()) === ethers.getAddress(p.treasury), "ScrapCrates.treasury mismatch");
  assert((await crates.crateLootVersion(p.lootCrateId)) > 0n, "loot table version not set for crateId");
  log("  all post-conditions OK");

  // ======================= SUMMARY ======================================
  const summary = {
    network: p.networkName,
    chainId,
    deployedAt: new Date().toISOString(),
    admin: deployer.address,
    contracts: {
      ScrapParts: partsAddr,
      ScrapCrates: cratesAddr,
      RewardVault: vaultAddr,
      collection: collectionAddress,
      collectionIsStandIn: !!standInCollection,
    },
    params: {
      registry: p.registry,
      accountImplementation: p.accountImplementation,
      accountSalt: p.accountSalt,
      signer: p.randomnessSigner,
      treasury: p.treasury,
      activationFeeWei: p.activationFeeWei.toString(),
      rewardTotalTokens: p.rewardTotalTokens.toString(),
      partsBaseURI: p.partsBaseURI,
      cratesURI: p.cratesURI,
      lootTable: { crateId: p.lootCrateId, partIds: p.lootPartIds, weights: p.lootWeights, placeholder: !overrides.lootPartIds },
    },
    followUps: [
      p.backendMinter ? null : "Grant ScrapCrates.MINTER_ROLE to the backend minter address.",
      "Point ScrapCrates.signer at your backend randomness signer (setSigner) if it isn't already.",
      "Rewrite the loot table with the real parts catalog via setLootTable once metadata is final.",
    ].filter(Boolean),
  };

  log("\n=================== DEPLOYMENT SUMMARY ===================");
  log(JSON.stringify(summary, null, 2));
  log("=========================================================");

  // write deployments/<network>.json (skip on the ephemeral in-process net / tests)
  if (overrides.writeFile !== false && p.networkName !== "hardhat") {
    const dir = path.join(__dirname, "..", "deployments");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${p.networkName}.json`);
    fs.writeFileSync(file, JSON.stringify(summary, null, 2) + "\n");
    log(`\nWrote ${file}`);
  }

  return { parts, crates, vault, collectionAddress, standInCollection, summary, params: p };
}

async function main() {
  const hre = require("hardhat");
  await deployGachaSystem(hre);
}

// run only when invoked directly (not when required by a test)
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { deployGachaSystem, resolveParams, CHAIN, MINTER_ROLE, PLACEHOLDER_CRATE_ID };
