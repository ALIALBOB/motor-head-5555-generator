const { expect } = require("chai");
const { ethers } = require("hardhat");

// Placeholder economy values (admin-set in prod).
const ACTIVATION_FEE = ethers.parseEther("0.003");
const CRATE_ID = 1n;
const Z32 = ethers.ZeroHash;

// ---- helpers ---------------------------------------------------------------
function eventArgs(receipt, contract, name) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === name) return parsed.args;
    } catch (_) {}
  }
  return null;
}

async function fixture() {
  const [admin, alice, bob, treasury, funder] = await ethers.getSigners();

  // The live MotorHeads collection (ownership source of truth). tokens 1,3 -> alice; 2,4 -> bob
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(admin.address, "ipfs://metadata/", "ipfs://contract/contract.json", ethers.parseEther("0.03"));
  await nft.waitForDeployment();
  await nft.adminMint(alice.address, 1); // #1
  await nft.adminMint(bob.address, 1);   // #2
  await nft.adminMint(alice.address, 1); // #3
  await nft.adminMint(bob.address, 1);   // #4

  const Parts = await ethers.getContractFactory("ScrapParts");
  const parts = await Parts.deploy(admin.address, "ipfs://parts/{id}.json");
  await parts.waitForDeployment();

  const Registry = await ethers.getContractFactory("Mock6551Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  // The randomness signer (the "backend"). Here it's `admin`; tests sign seeds with this account.
  const Crates = await ethers.getContractFactory("ScrapCrates");
  const crates = await Crates.deploy(
    admin.address, "ipfs://crates/{id}.json", await nft.getAddress(), await parts.getAddress(),
    await registry.getAddress(), admin.address /* accountImpl (hashed by mock) */, Z32 /* salt */,
    treasury.address, ACTIVATION_FEE, admin.address /* signer */
  );
  await crates.waitForDeployment();

  await parts.grantRole(await parts.MINTER_ROLE(), await crates.getAddress());
  await crates.grantRole(await crates.MINTER_ROLE(), admin.address);

  // loot table for tier 1: equal-weight parts 10/20/30 -> total 3 (so seed%3 = 0/1/2 -> 10/20/30)
  await crates.setLootTable(CRATE_ID, [10, 20, 30], [1, 1, 1]);

  return { nft, parts, registry, crates, signerAcct: admin, admin, alice, bob, treasury, funder };
}

// commit (burn + record) and return { requestId, receipt }
async function openCrate(crates, signer, machineId, crateId) {
  const rc = await (await crates.connect(signer).commitOpen(machineId, crateId)).wait();
  const args = eventArgs(rc, crates, "CrateOpening");
  return { requestId: args.requestId, receipt: rc };
}

// the backend signs (chainid, contract, requestId, seed); anyone submits resolveOpen with it
async function signSeed(signerAcct, cratesAddr, requestId, seed) {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const hash = ethers.solidityPackedKeccak256(["uint256", "address", "uint256", "uint256"], [chainId, cratesAddr, requestId, seed]);
  return signerAcct.signMessage(ethers.getBytes(hash));
}
async function fulfill(crates, signerAcct, requestId, seed) {
  const sig = await signSeed(signerAcct, await crates.getAddress(), requestId, seed);
  return crates.resolveOpen(requestId, seed, sig);
}

// ===========================================================================
describe("ScrapParts (ERC-1155 parts)", function () {
  it("only MINTER_ROLE can mint; balances update", async function () {
    const { parts, admin, alice } = await fixture();
    await expect(parts.connect(alice).mint(alice.address, 10, 1)).to.be.reverted; // no role
    await parts.connect(admin).grantRole(await parts.MINTER_ROLE(), admin.address);
    await parts.connect(admin).mint(alice.address, 10, 3);
    expect(await parts.balanceOf(alice.address, 10)).to.equal(3n);
  });

  it("owner (or approved) can burn; others cannot", async function () {
    const { parts, admin, alice, bob } = await fixture();
    await parts.connect(admin).grantRole(await parts.MINTER_ROLE(), admin.address);
    await parts.connect(admin).mint(alice.address, 10, 2);
    await expect(parts.connect(bob).burn(alice.address, 10, 1)).to.be.revertedWith("not approved");
    await parts.connect(alice).burn(alice.address, 10, 1);
    expect(await parts.balanceOf(alice.address, 10)).to.equal(1n);
  });

  it("only CONFIG_ROLE can set the URI", async function () {
    const { parts, admin, alice } = await fixture();
    await expect(parts.connect(alice).setURI("ipfs://x/{id}")).to.be.reverted;
    await expect(parts.connect(admin).setURI("ipfs://x/{id}")).to.emit(parts, "URISet");
  });
});

// ===========================================================================
describe("ScrapCrates — activation", function () {
  it("owner activates, pays the fee, flag set, event, fee held", async function () {
    const { crates, alice } = await fixture();
    await expect(crates.connect(alice).activate(1, { value: ACTIVATION_FEE }))
      .to.emit(crates, "Activated").withArgs(1, alice.address, ACTIVATION_FEE);
    expect(await crates.activated(1)).to.equal(true);
    expect(await ethers.provider.getBalance(await crates.getAddress())).to.equal(ACTIVATION_FEE);
  });

  it("rejects non-owner, low fee, and double-activation; refunds overpay", async function () {
    const { crates, alice, bob } = await fixture();
    await expect(crates.connect(bob).activate(1, { value: ACTIVATION_FEE })).to.be.revertedWith("not owner");
    await expect(crates.connect(alice).activate(1, { value: ACTIVATION_FEE - 1n })).to.be.revertedWith("fee too low");
    await crates.connect(alice).activate(1, { value: ACTIVATION_FEE + ethers.parseEther("1") });
    expect(await ethers.provider.getBalance(await crates.getAddress())).to.equal(ACTIVATION_FEE);
    await expect(crates.connect(alice).activate(1, { value: ACTIVATION_FEE })).to.be.revertedWith("already active");
  });

  it("pausing blocks activation; withdraw sweeps fees to treasury", async function () {
    const { crates, admin, alice, bob, treasury } = await fixture();
    await crates.connect(alice).activate(1, { value: ACTIVATION_FEE });
    await crates.connect(bob).activate(2, { value: ACTIVATION_FEE });
    await crates.connect(admin).pause();
    await expect(crates.connect(alice).activate(3, { value: ACTIVATION_FEE })).to.be.reverted;
    await crates.connect(admin).unpause();

    const before = await ethers.provider.getBalance(treasury.address);
    await crates.connect(bob).withdraw();
    const after = await ethers.provider.getBalance(treasury.address);
    expect(after - before).to.equal(ACTIVATION_FEE * 2n);
  });
});

// ===========================================================================
describe("ScrapCrates — opening (commit + signed resolve)", function () {
  it("burns a crate on commit, then resolves the signed seed into the drawn part", async function () {
    const { crates, parts, signerAcct, admin, alice } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    expect(await crates.balanceOf(alice.address, CRATE_ID)).to.equal(1n);

    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    expect(await crates.balanceOf(alice.address, CRATE_ID)).to.equal(0n); // burned on commit

    const garage = await crates.garageOf(1);
    await expect(fulfill(crates, signerAcct, requestId, 1)) // seed%3 == 1 -> partId 20
      .to.emit(crates, "CrateOpened").withArgs(1, CRATE_ID, garage, 20, requestId);
    expect(await parts.balanceOf(garage, 20)).to.equal(1n);
  });

  it("resolveOpen rejects a seed not signed by the trusted signer", async function () {
    const { crates, admin, alice, bob } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    const badSig = await signSeed(bob, await crates.getAddress(), requestId, 1); // bob is not the signer
    await expect(crates.resolveOpen(requestId, 1, badSig)).to.be.revertedWith("bad signature");
  });

  it("a request can't be resolved twice (no double-mint)", async function () {
    const { crates, parts, signerAcct, admin, alice } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    await fulfill(crates, signerAcct, requestId, 0);
    const garage = await crates.garageOf(1);
    expect(await parts.balanceOf(garage, 10)).to.equal(1n);
    await expect(fulfill(crates, signerAcct, requestId, 0)).to.be.revertedWith("unknown request");
  });

  it("the weighted loot table maps the seed to the correct part", async function () {
    const { crates, parts, signerAcct, admin, alice } = await fixture();
    const garage = await crates.garageOf(1);
    for (const [seed, expectedPart] of [[0n, 10n], [1n, 20n], [2n, 30n], [3n, 10n], [5n, 30n]]) {
      await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
      const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
      await fulfill(crates, signerAcct, requestId, seed);
      expect(await parts.balanceOf(garage, expectedPart)).to.be.greaterThan(0n);
    }
  });

  it("rejects committing by non-owner, without a crate, or with no loot table", async function () {
    const { crates, admin, alice, bob } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    await expect(crates.connect(bob).commitOpen(1, CRATE_ID)).to.be.revertedWith("not owner");
    await expect(crates.connect(alice).commitOpen(1, 999)).to.be.revertedWith("no loot table");
    await expect(crates.connect(bob).commitOpen(2, CRATE_ID)).to.be.reverted; // bob owns #2 but holds no crate
  });

  it("garageOf matches the registry derivation and differs per token", async function () {
    const { crates, registry, nft } = await fixture();
    const g1 = await crates.garageOf(1);
    const g2 = await crates.garageOf(2);
    expect(g1).to.not.equal(g2);
    const expected = await registry.account(await crates.accountImplementation(), Z32, (await ethers.provider.getNetwork()).chainId, await nft.getAddress(), 1);
    expect(g1).to.equal(expected);
  });
});

// ===========================================================================
describe("ScrapCrates — admin / loot table / signer", function () {
  it("only CONFIG_ROLE sets the loot table; cumulative weights + total are stored", async function () {
    const { crates, alice, admin } = await fixture();
    await expect(crates.connect(alice).setLootTable(2, [1], [1])).to.be.reverted;
    await crates.connect(admin).setLootTable(2, [7, 8], [3, 2]);
    const [version, ids, cum, total] = await crates.lootTable(2);
    expect(version).to.be.greaterThan(0n);
    expect(ids.map(Number)).to.deep.equal([7, 8]);
    expect(cum.map(Number)).to.deep.equal([3, 5]);
    expect(total).to.equal(5n);
  });

  it("rejects a bad loot table (length mismatch / zero weight)", async function () {
    const { crates, admin } = await fixture();
    await expect(crates.connect(admin).setLootTable(3, [1, 2], [1])).to.be.revertedWith("bad arrays");
    await expect(crates.connect(admin).setLootTable(3, [1], [0])).to.be.revertedWith("weight=0");
  });

  it("only CONFIG_ROLE can set the fee and the signer; zero signer rejected", async function () {
    const { crates, admin, alice, bob } = await fixture();
    await expect(crates.connect(alice).setActivationFee(1)).to.be.reverted;
    await expect(crates.connect(admin).setActivationFee(ethers.parseEther("0.005"))).to.emit(crates, "ActivationFeeSet");
    await expect(crates.connect(alice).setSigner(bob.address)).to.be.reverted;
    await expect(crates.connect(admin).setSigner(ethers.ZeroAddress)).to.be.revertedWith("signer=0");
    await expect(crates.connect(admin).setSigner(bob.address)).to.emit(crates, "SignerSet").withArgs(bob.address);
    expect(await crates.signer()).to.equal(bob.address);
  });

  it("registry / accountImplementation / salt are immutable (no setter)", async function () {
    const { crates } = await fixture();
    expect(crates.setRegistry).to.equal(undefined); // removed to prevent garage-redirect theft
  });
});

// ===========================================================================
describe("Security hardening", function () {
  it("failed mint records a redeemable claim; resolveOpen never loses the crate; claimPart recovers", async function () {
    const { crates, parts, signerAcct, admin, alice, bob } = await fixture();
    await parts.connect(admin).revokeRole(await parts.MINTER_ROLE(), await crates.getAddress());
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    const garage = await crates.garageOf(1);

    await expect(fulfill(crates, signerAcct, requestId, 1)).to.emit(crates, "CratePending").withArgs(1, CRATE_ID, 20, requestId);
    expect(await parts.balanceOf(garage, 20)).to.equal(0n);
    const c = await crates.claimableOf(requestId);
    expect(c.redeemable).to.equal(true);
    expect(c.partId).to.equal(20n);

    await expect(crates.connect(bob).claimPart(requestId)).to.be.revertedWith("not owner");
    await parts.connect(admin).grantRole(await parts.MINTER_ROLE(), await crates.getAddress());
    await expect(crates.connect(alice).claimPart(requestId))
      .to.emit(crates, "CrateOpened").withArgs(1, CRATE_ID, garage, 20, requestId);
    expect(await parts.balanceOf(garage, 20)).to.equal(1n);
    await expect(crates.connect(alice).claimPart(requestId)).to.be.revertedWith("nothing to claim");
  });

  it("loot version is snapshotted at commit: a mid-flight rebalance can't change a committed draw", async function () {
    const { crates, parts, signerAcct, admin, alice } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID); // snapshots v1 = [10,20,30]
    await crates.connect(admin).setLootTable(CRATE_ID, [99], [1]); // v2 changes odds for FUTURE opens only
    const garage = await crates.garageOf(1);
    await fulfill(crates, signerAcct, requestId, 0); // resolves against the snapshotted v1 -> part 10
    expect(await parts.balanceOf(garage, 10)).to.equal(1n);
    expect(await parts.balanceOf(garage, 99)).to.equal(0n);
  });

  it("resolveOpenAdmin is a CONFIG_ROLE backstop that resolves a committed open (never stuck)", async function () {
    const { crates, parts, admin, alice, bob } = await fixture();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    await expect(crates.connect(bob).resolveOpenAdmin(requestId, 2)).to.be.reverted; // not CONFIG
    const garage = await crates.garageOf(1);
    await crates.connect(admin).resolveOpenAdmin(requestId, 2); // seed%3==2 -> part 30
    expect(await parts.balanceOf(garage, 30)).to.equal(1n);
  });

  it("constructor rejects a zero account implementation and a zero signer", async function () {
    const { nft, parts, registry, treasury, admin } = await fixture();
    const Crates = await ethers.getContractFactory("ScrapCrates");
    const good = [admin.address, "uri", await nft.getAddress(), await parts.getAddress(), await registry.getAddress()];
    await expect(Crates.deploy(...good, ethers.ZeroAddress, Z32, treasury.address, ACTIVATION_FEE, admin.address)).to.be.revertedWith("impl=0");
    await expect(Crates.deploy(...good, admin.address, Z32, treasury.address, ACTIVATION_FEE, ethers.ZeroAddress)).to.be.revertedWith("signer=0");
  });

  it("RewardVault constructor rejects a zero account implementation", async function () {
    const { nft, registry, admin } = await fixture();
    const Vault = await ethers.getContractFactory("RewardVault");
    await expect(Vault.deploy(admin.address, await nft.getAddress(), 4, await registry.getAddress(), ethers.ZeroAddress, Z32))
      .to.be.revertedWith("impl=0");
  });
});

// ===========================================================================
describe("RewardVault — ETH split per NFT", function () {
  async function vaultFixture() {
    const base = await fixture();
    const Vault = await ethers.getContractFactory("RewardVault");
    const vault = await Vault.deploy(base.admin.address, await base.nft.getAddress(), 4, await base.registry.getAddress(), base.admin.address, Z32);
    await vault.waitForDeployment();
    return { ...base, vault };
  }

  it("deposits accrue equally; owner claims its share", async function () {
    const { vault, alice, funder } = await vaultFixture();
    await funder.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("4") });
    expect(await vault.claimable(1)).to.equal(ethers.parseEther("1"));

    const before = await ethers.provider.getBalance(alice.address);
    const rc = await (await vault.connect(alice).claim(1, false)).wait();
    const gas = rc.gasUsed * rc.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);
    expect(after - before + gas).to.equal(ethers.parseEther("1"));
    expect(await vault.claimable(1)).to.equal(0n);
  });

  it("rejects non-owner and double-claim; can claim into the garage", async function () {
    const { vault, alice, bob, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    await expect(vault.connect(bob).claim(1, false)).to.be.revertedWith("not owner");
    const garage = await vault.garageOf(1);
    await vault.connect(alice).claim(1, true);
    expect(await ethers.provider.getBalance(garage)).to.equal(ethers.parseEther("1"));
    await expect(vault.connect(alice).claim(1, false)).to.be.revertedWith("nothing to claim");
  });

  it("claimMany pays all owned machines in one call", async function () {
    const { vault, alice, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    const before = await ethers.provider.getBalance(alice.address);
    const rc = await (await vault.connect(alice).claimMany([1, 3], false)).wait();
    const gas = rc.gasUsed * rc.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);
    expect(after - before + gas).to.equal(ethers.parseEther("2"));
  });

  it("rewards follow the token: after transfer, only the new owner can claim", async function () {
    const { vault, nft, alice, bob, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
    await expect(vault.connect(alice).claim(1, false)).to.be.revertedWith("not owner");
    await vault.connect(bob).claim(1, false);
    expect(await vault.claimable(1)).to.equal(0n);
  });

  it("no wei is lost: remainder carries forward across uneven deposits", async function () {
    const { vault, funder } = await vaultFixture();
    await vault.connect(funder).deposit({ value: 10n });
    expect(await vault.claimable(1)).to.equal(2n);
    await vault.connect(funder).deposit({ value: 10n });
    expect(await vault.claimable(1)).to.equal(5n);
  });

  it("rescueSurplus recovers only force-fed ETH; holder-owed balances are untouched; non-admin can't", async function () {
    const { vault, admin, alice, funder, treasury } = await vaultFixture();
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    const vaultAddr = await vault.getAddress();
    await ethers.provider.send("hardhat_setBalance", [vaultAddr, "0x" + ethers.parseEther("5").toString(16)]);
    await expect(vault.connect(alice).rescueSurplus(treasury.address)).to.be.reverted;
    await expect(vault.connect(admin).rescueSurplus(treasury.address))
      .to.emit(vault, "SurplusRescued").withArgs(treasury.address, ethers.parseEther("1"));
    await vault.connect(alice).claim(1, false);
    expect(await vault.claimable(1)).to.equal(0n);
    await expect(vault.connect(admin).rescueSurplus(treasury.address)).to.be.revertedWith("no surplus");
  });
});

// ===========================================================================
describe("End-to-end", function () {
  it("activate -> earn crate -> commit -> signed resolve -> part in garage -> ETH reward claim", async function () {
    const { crates, parts, signerAcct, nft, registry, admin, alice, funder } = await fixture();
    const Vault = await ethers.getContractFactory("RewardVault");
    const vault = await Vault.deploy(admin.address, await nft.getAddress(), 4, await registry.getAddress(), admin.address, Z32);
    await vault.waitForDeployment();

    await crates.connect(alice).activate(1, { value: ACTIVATION_FEE });
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const { requestId } = await openCrate(crates, alice, 1, CRATE_ID);
    await fulfill(crates, signerAcct, requestId, 2); // seed 2 -> part 30
    const garage = await crates.garageOf(1);
    expect(await parts.balanceOf(garage, 30)).to.equal(1n);
    await funder.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("4") });
    await vault.connect(alice).claim(1, true);
    expect(await ethers.provider.getBalance(garage)).to.equal(ethers.parseEther("1"));
  });
});
