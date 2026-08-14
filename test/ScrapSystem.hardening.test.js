// Hardening suite — the audit-driven tests: the crate-loss fix under gas pressure, _pick boundaries,
// access-control negatives, pause safety, VRF-failure crate safety, and RewardVault edge cases.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ACTIVATION_FEE = ethers.parseEther("0.003");
const CRATE_ID = 1n;
const Z32 = ethers.ZeroHash;

function eventArgs(receipt, contract, name) {
  for (const log of receipt.logs) {
    try { const p = contract.interface.parseLog(log); if (p && p.name === name) return p.args; } catch (_) {}
  }
  return null;
}

// Base system: tokens 1,3 -> alice; 2,4 -> bob. Codeless garages. Loot tier 1 = [10,20,30] equal weights.
async function base(opts = {}) {
  const [admin, alice, bob, treasury, funder] = await ethers.getSigners();
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
  await nft.adminMint(alice.address, 1); await nft.adminMint(bob.address, 1);
  await nft.adminMint(alice.address, 1); await nft.adminMint(bob.address, 1);
  const parts = await (await ethers.getContractFactory("ScrapParts")).deploy(admin.address, "ipfs://p/{id}.json");
  const registry = opts.registry || await (await ethers.getContractFactory("Mock6551Registry")).deploy();
  const crates = await (await ethers.getContractFactory("ScrapCrates")).deploy(
    admin.address, "ipfs://cr/{id}.json", await nft.getAddress(), await parts.getAddress(),
    await registry.getAddress(), admin.address, Z32, treasury.address, ACTIVATION_FEE,
    admin.address /* signer */
  );
  await parts.grantRole(await parts.MINTER_ROLE(), await crates.getAddress());
  await crates.grantRole(await crates.MINTER_ROLE(), admin.address);
  if (opts.loot !== false) await crates.setLootTable(CRATE_ID, [10, 20, 30], [1, 1, 1]);
  return { nft, parts, registry, crates, signerAcct: admin, admin, alice, bob, treasury, funder };
}

async function openReq(crates, signer, machineId) {
  const rc = await (await crates.connect(signer).commitOpen(machineId, CRATE_ID)).wait();
  return eventArgs(rc, crates, "CrateOpening").requestId;
}
async function resolve(crates, signerAcct, requestId, seed) {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const hash = ethers.solidityPackedKeccak256(["uint256", "address", "uint256", "uint256"], [chainId, await crates.getAddress(), requestId, seed]);
  const sig = await signerAcct.signMessage(ethers.getBytes(hash));
  return crates.resolveOpen(requestId, seed, sig);
}

// ===========================================================================
describe("HARDENING — resolve failure-safety & the crate-loss fix", function () {
  it("a resolve into a gas-heavy garage records a redeemable claim (crate is NEVER lost)", async function () {
    const heavy = await (await ethers.getContractFactory("GasHeavyRejectGarage")).deploy();
    const registry = await (await ethers.getContractFactory("Fixed6551Registry")).deploy(await heavy.getAddress());
    const { crates, parts, signerAcct, alice, admin } = await base({ registry });

    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);

    // The bounded mint (MINT_GAS=100k) OOGs on the heavy garage's receiver -> failure-safe claim, no revert.
    const rc = await (await resolve(crates, signerAcct, reqId, 1)).wait();
    expect(eventArgs(rc, crates, "CratePending"), "resolve must not revert; must record a claim").to.not.equal(null);
    const claim = await crates.claimableOf(reqId);
    expect(claim.redeemable).to.equal(true);
    expect(claim.partId).to.equal(20n); // seed 1 % 3 -> index 1 -> part 20

    // Recovery: claimPart forwards full gas, so the heavy garage now accepts the mint.
    await crates.connect(alice).claimPart(reqId);
    expect(await parts.balanceOf(await heavy.getAddress(), 20)).to.equal(1n);
    expect((await crates.claimableOf(reqId)).redeemable).to.equal(false);
  });

  it("a resolved request cannot be resolved again (no double-mint)", async function () {
    const { crates, parts, signerAcct, alice, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);
    await resolve(crates, signerAcct, reqId, 0); // -> part 10 minted
    const garage = await crates.garageOf(1);
    expect(await parts.balanceOf(garage, 10)).to.equal(1n);
    await expect(resolve(crates, signerAcct, reqId, 0)).to.be.revertedWith("unknown request");
    expect(await parts.balanceOf(garage, 20)).to.equal(0n);
  });

  it("claimPart on a successfully-minted open reverts 'nothing to claim'", async function () {
    const { crates, signerAcct, alice, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);
    await resolve(crates, signerAcct, reqId, 0); // success -> no claimable recorded
    await expect(crates.connect(alice).claimPart(reqId)).to.be.revertedWith("nothing to claim");
  });

  it("a claimable follows the machine: after transfer only the new owner can claimPart", async function () {
    const { crates, parts, signerAcct, nft, alice, bob, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    await parts.revokeRole(await parts.MINTER_ROLE(), await crates.getAddress()); // force the mint to fail -> claimable
    const reqId = await openReq(crates, alice, 1);
    await resolve(crates, signerAcct, reqId, 0);
    expect((await crates.claimableOf(reqId)).redeemable).to.equal(true);

    await nft.connect(alice).transferFrom(alice.address, bob.address, 1); // sell the machine
    await parts.grantRole(await parts.MINTER_ROLE(), await crates.getAddress()); // fix the role
    await expect(crates.connect(alice).claimPart(reqId)).to.be.revertedWith("not owner");
    await expect(crates.connect(bob).claimPart(reqId)).to.emit(crates, "CrateOpened"); // new owner recovers it
  });
});

// ===========================================================================
describe("HARDENING — loot / _pick boundaries", function () {
  it("_pick maps UNEQUAL weights to the correct part at every boundary", async function () {
    const { crates, signerAcct, alice, admin } = await base({ loot: false });
    await crates.setLootTable(CRATE_ID, [10, 20, 30], [5, 3, 2]); // cumWeights [5,8,10], total 10
    const cases = [[0, 10], [4, 10], [5, 20], [7, 20], [8, 30], [9, 30]];
    for (const [roll, expected] of cases) {
      await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
      const reqId = await openReq(crates, alice, 1);
      const rc = await (await resolve(crates, signerAcct, reqId, BigInt(roll))).wait();
      expect(eventArgs(rc, crates, "CrateOpened").partId, `roll ${roll}`).to.equal(BigInt(expected));
    }
  });

  it("a single-entry loot table always draws that part", async function () {
    const { crates, signerAcct, alice, admin } = await base({ loot: false });
    await crates.setLootTable(CRATE_ID, [77], [5]); // total 5, one bucket
    for (const seed of [0n, 4n, 123456789n]) {
      await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
      const reqId = await openReq(crates, alice, 1);
      const rc = await (await resolve(crates, signerAcct, reqId, seed)).wait();
      expect(eventArgs(rc, crates, "CrateOpened").partId).to.equal(77n);
    }
  });

  it("FAIRNESS: over many opens the distribution tracks the weights (not uniform, not stuck)", async function () {
    const { crates, parts, signerAcct, alice, admin } = await base({ loot: false });
    await crates.setLootTable(CRATE_ID, [10, 20, 30], [60, 25, 15]); // total 100 -> ~60/25/15
    const garage = await crates.garageOf(1);
    const N = 200;
    for (let i = 0; i < N; i++) {
      await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
      const reqId = await openReq(crates, alice, 1);
      const seed = BigInt(ethers.keccak256(ethers.toUtf8Bytes("seed-" + i))); // fresh per open (prod: crypto RNG)
      await resolve(crates, signerAcct, reqId, seed);
    }
    const b10 = Number(await parts.balanceOf(garage, 10));
    const b20 = Number(await parts.balanceOf(garage, 20));
    const b30 = Number(await parts.balanceOf(garage, 30));
    expect(b10 + b20 + b30).to.equal(N); // every open produced exactly one part
    // each part lands within a band around its weight — uniform(33/33/33) or stuck(100/0/0) would fail these
    expect(b10 / N).to.be.within(0.45, 0.75); // ~60%
    expect(b20 / N).to.be.within(0.12, 0.38); // ~25%
    expect(b30 / N).to.be.within(0.05, 0.28); // ~15%
  });
});

// ===========================================================================
describe("HARDENING — access control negatives", function () {
  it("mintCrates needs MINTER_ROLE; CONFIG_ROLE alone cannot mint crates", async function () {
    const { crates, alice, bob, admin } = await base();
    await expect(crates.connect(alice).mintCrates(alice.address, CRATE_ID, 1)).to.be.reverted;
    await crates.connect(admin).grantRole(await crates.CONFIG_ROLE(), bob.address);
    await expect(crates.connect(bob).mintCrates(bob.address, CRATE_ID, 1)).to.be.reverted; // CONFIG != MINTER
  });

  it("setTreasury / pause reject non-CONFIG; setTreasury(0) reverts; valid call emits", async function () {
    const { crates, alice, bob, admin } = await base();
    await expect(crates.connect(alice).setTreasury(bob.address)).to.be.reverted;
    await expect(crates.connect(alice).pause()).to.be.reverted;
    await expect(crates.connect(admin).setTreasury(ethers.ZeroAddress)).to.be.revertedWith("treasury=0");
    await expect(crates.connect(admin).setTreasury(bob.address)).to.emit(crates, "TreasurySet").withArgs(bob.address);
  });

  it("setSigner rotates the randomness signer for CONFIG_ROLE only", async function () {
    const { crates, alice, bob, admin } = await base();
    await expect(crates.connect(alice).setSigner(bob.address)).to.be.reverted; // not CONFIG
    await crates.connect(admin).setSigner(bob.address);
    expect(await crates.signer()).to.equal(bob.address);
  });
});

// ===========================================================================
describe("HARDENING — pause cannot strand a burned crate", function () {
  it("paused blocks commitOpen, but resolveOpen still resolves a crate committed before the pause", async function () {
    const { crates, parts, signerAcct, alice, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 2);
    const reqId = await openReq(crates, alice, 1); // committed while live
    await crates.connect(admin).pause();
    await expect(crates.connect(alice).commitOpen(1, CRATE_ID)).to.be.reverted; // paused
    await resolve(crates, signerAcct, reqId, 0); // resolveOpen has no whenNotPaused -> still mints
    const garage = await crates.garageOf(1);
    expect(await parts.balanceOf(garage, 10)).to.equal(1n);
  });
});

// ===========================================================================
describe("HARDENING — RewardVault edge cases", function () {
  async function vaultFixture() {
    const b = await base();
    const vault = await (await ethers.getContractFactory("RewardVault")).deploy(
      b.admin.address, await b.nft.getAddress(), 4, await b.registry.getAddress(), b.admin.address, Z32
    );
    return { ...b, vault };
  }

  it("claimMany with duplicate tokenIds pays each machine only once", async function () {
    const { vault, alice, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") }); // 1 ETH / token
    const before = await ethers.provider.getBalance(await vault.getAddress());
    await vault.connect(alice).claimMany([1, 1, 3, 1], false); // alice owns 1 & 3
    const after = await ethers.provider.getBalance(await vault.getAddress());
    expect(before - after).to.equal(ethers.parseEther("2")); // exactly 2 tokens' worth, not 4
    expect(await vault.claimable(1)).to.equal(0n);
    expect(await vault.claimable(3)).to.equal(0n);
  });

  it("a malicious owner cannot re-enter claim (nonReentrant holds, no double-pay)", async function () {
    const { vault, nft, alice, funder } = await vaultFixture();
    const attacker = await (await ethers.getContractFactory("ReentrantClaimer")).deploy(await vault.getAddress());
    await nft.connect(alice).transferFrom(alice.address, await attacker.getAddress(), 1);
    await attacker.setToken(1);
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    await attacker.claim();
    expect(await attacker.reenteredOk()).to.equal(false); // re-entry was blocked
    expect(await ethers.provider.getBalance(await attacker.getAddress())).to.equal(ethers.parseEther("1")); // paid once
    expect(await vault.claimable(1)).to.equal(0n);
  });

  it("rewardDebt persists across a post-claim transfer (buyer only gets post-transfer accrual)", async function () {
    const { vault, nft, alice, bob, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    await vault.connect(alice).claim(1, false); // alice takes token-1's first 1 ETH
    await nft.connect(alice).transferFrom(alice.address, bob.address, 1); // sell #1 to bob
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") }); // new accrual
    expect(await vault.claimable(1)).to.equal(ethers.parseEther("1")); // only the new round
    const bBefore = await ethers.provider.getBalance(bob.address);
    await vault.connect(bob).claim(1, false);
    expect(await ethers.provider.getBalance(bob.address)).to.be.greaterThan(bBefore);
    expect(await vault.claimable(1)).to.equal(0n);
  });
});
