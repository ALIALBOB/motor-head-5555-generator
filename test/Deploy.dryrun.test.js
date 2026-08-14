/*
  Deploy dry-run — exercises scripts/deploy.js `deployGachaSystem()` end-to-end
  against the local Hardhat network, then runs the full user journey on the
  ACTUAL deployed + wired contracts:

     deploy (+ all post-deploy wiring + post-condition asserts)
       -> activate a machine (pay fee)
       -> backend mints a crate
       -> open the crate (burn + VRF request)
       -> fulfill VRF via the coordinator mock
       -> assert the drawn part landed in the machine's ERC-6551 garage
       -> deposit ETH to the RewardVault + claim the per-NFT share

  It injects the repo test mocks (MockVRFCoordinator, Mock6551Registry) and a real
  LivingArchiveMachines collection via the deploy script's `overrides`, so the same
  wiring/assertion code the real deploy runs is what's under test here.
*/

const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
const { deployGachaSystem, MINTER_ROLE } = require("../scripts/deploy-gacha.js");

const ACTIVATION_FEE = ethers.parseEther("0.003");
const CRATE_ID = 1n;
const Z32 = ethers.ZeroHash;

// pull an event's args from a receipt by name
function eventArgs(receipt, contract, name) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === name) return parsed.args;
    } catch (_) {}
  }
  return null;
}

async function deployFixture() {
  const [admin, alice, bob, treasury, funder] = await ethers.getSigners();

  // Real collection (ownership source of truth) — tokens 1,3 -> alice; 2,4 -> bob
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(
    admin.address,
    "ipfs://metadata/",
    "ipfs://contract/contract.json",
    ethers.parseEther("0.03")
  );
  await nft.waitForDeployment();
  await nft.adminMint(alice.address, 1); // #1
  await nft.adminMint(bob.address, 1); //   #2
  await nft.adminMint(alice.address, 1); // #3
  await nft.adminMint(bob.address, 1); //   #4

  // Repo mocks that the deploy will wire in place of the real registry/coordinator.
  const Registry = await ethers.getContractFactory("Mock6551Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  // Drive the REAL deploy script logic (deploy + all wiring + all asserts).
  const out = await deployGachaSystem(hre, {
    silent: true,
    writeFile: false,
    collection: await nft.getAddress(),
    registry: await registry.getAddress(),
    accountImplementation: admin.address, // mock registry just hashes this in
    accountSalt: Z32,
    signer: admin.address, // the backend randomness signer (admin signs seeds in tests)
    treasury: treasury.address,
    activationFeeWei: ACTIVATION_FEE,
    rewardTotalTokens: 4, // clean per-token math (4 minted test machines)
    // known loot so the signed seed maps to a deterministic part: seed % 3 -> 0/1/2 -> partId 10/20/30
    lootCrateId: Number(CRATE_ID),
    lootPartIds: [10, 20, 30],
    lootWeights: [1, 1, 1],
    backendMinter: admin.address, // grant the "backend" minter role during deploy
  });

  return { ...out, nft, registry, admin, alice, bob, treasury, funder };
}

describe("Deploy dry-run — deployGachaSystem() wiring", function () {
  it("deploys all three contracts and returns their addresses", async function () {
    const { parts, crates, vault } = await deployFixture();
    for (const c of [parts, crates, vault]) {
      expect(await c.getAddress()).to.properAddress;
    }
  });

  it("wires ScrapCrates.MINTER_ROLE on ScrapParts (mandatory grant)", async function () {
    const { parts, crates } = await deployFixture();
    expect(await parts.hasRole(MINTER_ROLE, await crates.getAddress())).to.equal(true);
  });

  it("wires the backend MINTER_ROLE on ScrapCrates when supplied", async function () {
    const { crates, admin } = await deployFixture();
    expect(await crates.hasRole(MINTER_ROLE, admin.address)).to.equal(true);
  });

  it("sets the loot table so the tier is immediately openable", async function () {
    const { crates } = await deployFixture();
    expect(await crates.crateLootVersion(CRATE_ID)).to.be.greaterThan(0n);
    const [version, ids, cum, total] = await crates.lootTable(CRATE_ID);
    expect(version).to.be.greaterThan(0n);
    expect(ids.map(Number)).to.deep.equal([10, 20, 30]);
    expect(cum.map(Number)).to.deep.equal([1, 2, 3]);
    expect(total).to.equal(3n);
  });

  it("post-conditions hold: admin roles, signer, immutables, fee", async function () {
    const { parts, crates, vault, registry, nft, admin, treasury } = await deployFixture();
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    expect(await parts.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
    expect(await crates.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
    expect(await vault.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
    expect(await crates.signer()).to.equal(admin.address);
    // immutables reflect exactly what was passed
    expect(await crates.registry()).to.equal(await registry.getAddress());
    expect(await crates.accountImplementation()).to.equal(admin.address);
    expect(await crates.collection()).to.equal(await nft.getAddress());
    expect(await vault.totalTokens()).to.equal(4n);
    expect(await crates.activationFeeWei()).to.equal(ACTIVATION_FEE);
    expect(await crates.treasury()).to.equal(treasury.address);
  });

  it("full journey: activate -> mint crate -> commit -> signed resolve -> part in garage -> reward claim", async function () {
    const { crates, parts, vault, admin, alice, funder } = await deployFixture();

    // 1. holder activates machine #1 (pays the fee, held by the contract)
    await expect(crates.connect(alice).activate(1, { value: ACTIVATION_FEE }))
      .to.emit(crates, "Activated")
      .withArgs(1, alice.address, ACTIVATION_FEE);
    expect(await crates.activated(1)).to.equal(true);

    // 2. backend (granted MINTER_ROLE during deploy) mints the weekly crate
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    expect(await crates.balanceOf(alice.address, CRATE_ID)).to.equal(1n);

    // 3. commit the open — burns the crate + records the request
    const rc = await (await crates.connect(alice).commitOpen(1, CRATE_ID)).wait();
    const { requestId } = eventArgs(rc, crates, "CrateOpening");
    expect(await crates.balanceOf(alice.address, CRATE_ID)).to.equal(0n); // burned

    // 4. resolve with a seed signed by the backend signer (admin). seed 2 % 3 -> partId 30
    const garage = await crates.garageOf(1);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const hash = ethers.solidityPackedKeccak256(["uint256", "address", "uint256", "uint256"], [chainId, await crates.getAddress(), requestId, 2]);
    const sig = await admin.signMessage(ethers.getBytes(hash));
    await expect(crates.resolveOpen(requestId, 2, sig))
      .to.emit(crates, "CrateOpened")
      .withArgs(1, CRATE_ID, garage, 30, requestId);

    // 5. the drawn part landed in the machine's ERC-6551 garage
    expect(await parts.balanceOf(garage, 30)).to.equal(1n);

    // 6. RewardVault: deposit ETH and claim the per-NFT share into the garage
    await funder.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("4") });
    expect(await vault.claimable(1)).to.equal(ethers.parseEther("1")); // 4 ETH / 4 machines
    const before = await ethers.provider.getBalance(garage);
    await vault.connect(alice).claim(1, true); // into the garage
    const after = await ethers.provider.getBalance(garage);
    expect(after - before).to.equal(ethers.parseEther("1"));
    expect(await vault.claimable(1)).to.equal(0n);
  });

  it("deploys a stand-in ERC-721 when no collection address is supplied", async function () {
    const [, , , treasury] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("Mock6551Registry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const out = await deployGachaSystem(hre, {
      silent: true,
      writeFile: false,
      // collection omitted on purpose -> script deploys a stand-in
      registry: await registry.getAddress(),
      accountImplementation: (await ethers.getSigners())[0].address,
      accountSalt: Z32,
      signer: (await ethers.getSigners())[0].address,
      treasury: treasury.address,
      activationFeeWei: ACTIVATION_FEE,
      rewardTotalTokens: 5555,
      lootPartIds: [1],
      lootWeights: [1],
    });
    expect(out.standInCollection).to.not.equal(null);
    expect(out.summary.contracts.collectionIsStandIn).to.equal(true);
    expect(await out.crates.collection()).to.equal(out.collectionAddress);
  });
});
