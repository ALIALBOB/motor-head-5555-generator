// Edge-case suite — the remaining audit-driven coverage: loot cap, deployed-garage receiver paths,
// full access-control matrix, activation refund safety, withdraw failure paths, RewardVault solvency/stranding.
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

async function base(opts = {}) {
  const [admin, alice, bob, treasury, funder, carol] = await ethers.getSigners();
  const nft = await (await ethers.getContractFactory("LivingArchiveMachines")).deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
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
  return { nft, parts, registry, crates, signerAcct: admin, admin, alice, bob, treasury, funder, carol };
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
async function vaultOf(b, totalTokens = 4) {
  return (await ethers.getContractFactory("RewardVault")).deploy(b.admin.address, await b.nft.getAddress(), totalTokens, await b.registry.getAddress(), b.admin.address, Z32);
}

// ===========================================================================
describe("EDGE — loot table bounds", function () {
  it("accepts exactly MAX_LOOT_ENTRIES (256) and rejects 257", async function () {
    const { crates } = await base({ loot: false });
    const ids256 = Array.from({ length: 256 }, (_, i) => i + 1);
    const w256 = Array.from({ length: 256 }, () => 1);
    await expect(crates.setLootTable(CRATE_ID, ids256, w256)).to.emit(crates, "LootTableSet");
    await expect(crates.setLootTable(CRATE_ID, [...ids256, 257], [...w256, 1])).to.be.revertedWith("too many entries");
  });
});

// ===========================================================================
describe("EDGE — deployed garage receiver paths", function () {
  it("mints into a DEPLOYED accepting garage (onERC1155Received path)", async function () {
    const garage = await (await ethers.getContractFactory("MockGarageAccount")).deploy();
    const registry = await (await ethers.getContractFactory("Fixed6551Registry")).deploy(await garage.getAddress());
    const { crates, parts, signerAcct, alice, admin } = await base({ registry });
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);
    await resolve(crates, signerAcct, reqId, 0);
    expect(await parts.balanceOf(await garage.getAddress(), 10)).to.equal(1n);
  });

  it("a deployed garage that can't receive ERC-1155 records a redeemable claim", async function () {
    const reject = await (await ethers.getContractFactory("RejectEthOwner")).deploy(); // no onERC1155Received
    const registry = await (await ethers.getContractFactory("Fixed6551Registry")).deploy(await reject.getAddress());
    const { crates, signerAcct, alice, admin } = await base({ registry });
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);
    const rc = await (await resolve(crates, signerAcct, reqId, 0)).wait();
    expect(eventArgs(rc, crates, "CratePending")).to.not.equal(null);
    expect((await crates.claimableOf(reqId)).redeemable).to.equal(true);
  });
});

// ===========================================================================
describe("EDGE — access-control matrix", function () {
  it("resolveOpen rejects a seed not signed by the trusted signer", async function () {
    const { crates, alice, bob, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 1);
    const reqId = await openReq(crates, alice, 1);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const hash = ethers.solidityPackedKeccak256(["uint256", "address", "uint256", "uint256"], [chainId, await crates.getAddress(), reqId, 0]);
    const badSig = await bob.signMessage(ethers.getBytes(hash)); // bob is not the signer
    await expect(crates.resolveOpen(reqId, 0, badSig)).to.be.revertedWith("bad signature");
  });
  it("CONFIG_ROLE alone cannot reach DEFAULT_ADMIN functions; MINTER_ROLE alone cannot reach CONFIG functions", async function () {
    const { crates, admin, bob, carol } = await base();
    await crates.connect(admin).grantRole(await crates.CONFIG_ROLE(), bob.address);
    await expect(crates.connect(bob).grantRole(await crates.MINTER_ROLE(), bob.address)).to.be.reverted; // role admin = DEFAULT_ADMIN
    await crates.connect(admin).grantRole(await crates.MINTER_ROLE(), carol.address);
    await expect(crates.connect(carol).setLootTable(CRATE_ID, [1], [1])).to.be.reverted; // CONFIG only
    await expect(crates.connect(carol).pause()).to.be.reverted;
  });
  it("ScrapCrates.setURI is CONFIG-gated", async function () {
    const { crates, admin, alice } = await base();
    await expect(crates.connect(alice).setURI("ipfs://x/{id}")).to.be.reverted;
    await expect(crates.connect(admin).setURI("ipfs://x/{id}")).to.emit(crates, "URISet");
  });
});

// ===========================================================================
describe("EDGE — activation refund safety & withdraw failures", function () {
  it("overpay refund cannot be exploited by a re-entering owner (no re-activation)", async function () {
    const { crates, nft, alice } = await base();
    const attacker = await (await ethers.getContractFactory("ReentrantActivator")).deploy();
    await nft.connect(alice).transferFrom(alice.address, await attacker.getAddress(), 1);
    await attacker.doActivate(await crates.getAddress(), 1, { value: ACTIVATION_FEE * 2n });
    expect(await crates.activated(1)).to.equal(true);
    expect(await ethers.provider.getBalance(await attacker.getAddress())).to.equal(ACTIVATION_FEE); // exactly the refund, once
  });
  it("a failing overpay refund rolls back the whole activation; exact fee still works", async function () {
    const { crates, nft, alice } = await base();
    const owner = await (await ethers.getContractFactory("RejectEthOwner")).deploy();
    await nft.connect(alice).transferFrom(alice.address, await owner.getAddress(), 1);
    await expect(owner.doActivate(await crates.getAddress(), 1, { value: ACTIVATION_FEE * 2n })).to.be.reverted;
    expect(await crates.activated(1)).to.equal(false);
    await owner.doActivate(await crates.getAddress(), 1, { value: ACTIVATION_FEE }); // exact -> no refund path
    expect(await crates.activated(1)).to.equal(true);
  });
  it("withdraw reverts on empty balance, on a reverting treasury, then recovers after setTreasury", async function () {
    const { crates, admin, alice, bob } = await base();
    await expect(crates.withdraw()).to.be.revertedWith("nothing to withdraw");
    const badTreasury = await (await ethers.getContractFactory("RejectEthOwner")).deploy();
    await crates.connect(admin).setTreasury(await badTreasury.getAddress());
    await crates.connect(alice).activate(1, { value: ACTIVATION_FEE }); // accrue a fee
    await expect(crates.withdraw()).to.be.revertedWith("sweep failed");
    await crates.connect(admin).setTreasury(bob.address);
    await expect(crates.withdraw()).to.emit(crates, "Swept"); // funds recovered, not stuck
  });
  it("activation is a permanent per-token flag that survives transfer", async function () {
    const { crates, nft, alice, bob } = await base();
    await crates.connect(alice).activate(1, { value: ACTIVATION_FEE });
    await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
    await expect(crates.connect(bob).activate(1, { value: ACTIVATION_FEE })).to.be.revertedWith("already active");
    expect(await crates.activated(1)).to.equal(true);
  });
  it("a zero activation fee lets any owner activate with no payment", async function () {
    const { crates, admin, alice } = await base();
    await crates.connect(admin).setActivationFee(0);
    await expect(crates.connect(alice).activate(1, { value: 0 })).to.emit(crates, "Activated");
  });
});

// ===========================================================================
describe("EDGE — concurrency", function () {
  it("two concurrent in-flight opens resolve independently and out of order", async function () {
    const { crates, parts, signerAcct, alice, admin } = await base();
    await crates.connect(admin).mintCrates(alice.address, CRATE_ID, 2);
    const r1 = await openReq(crates, alice, 1);
    const r2 = await openReq(crates, alice, 1);
    await resolve(crates, signerAcct, r2, 1); // part 20 first
    await resolve(crates, signerAcct, r1, 0); // then part 10
    const garage = await crates.garageOf(1);
    expect(await parts.balanceOf(garage, 10)).to.equal(1n);
    expect(await parts.balanceOf(garage, 20)).to.equal(1n);
  });
});

// ===========================================================================
describe("EDGE — RewardVault solvency, stranding, views", function () {
  it("full-drain solvency: every token claims and the vault empties to (only) dust", async function () {
    const b = await base(); const vault = await vaultOf(b, 4);
    await vault.connect(b.funder).deposit({ value: ethers.parseEther("4") });
    for (const [id, signer] of [[1, b.alice], [2, b.bob], [3, b.alice], [4, b.bob]]) {
      await vault.connect(signer).claim(id, true); // to garage -> no gas confusion
    }
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(0n); // 4/4 exact
    for (const id of [1, 2, 3, 4]) expect(await vault.claimable(id)).to.equal(0n);
  });
  it("totalTokens > minted supply strands the excess and rescueSurplus refuses it ('no surplus')", async function () {
    const b = await base(); const vault = await vaultOf(b, 8); // only 4 minted
    await vault.connect(b.funder).deposit({ value: ethers.parseEther("8") }); // 1 ETH per (of 8)
    for (const [id, signer] of [[1, b.alice], [2, b.bob], [3, b.alice], [4, b.bob]]) await vault.connect(signer).claim(id, true);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("4")); // 4 stranded for unminted ids
    await expect(vault.connect(b.admin).rescueSurplus(b.admin.address)).to.be.revertedWith("no surplus"); // counted as owed
  });
  it("rescueSurplus is CONFIG-gated and rejects the zero address", async function () {
    const b = await base(); const vault = await vaultOf(b, 4);
    await expect(vault.connect(b.alice).rescueSurplus(b.alice.address)).to.be.reverted; // not CONFIG
    await expect(vault.connect(b.admin).rescueSurplus(ethers.ZeroAddress)).to.be.revertedWith("to=0");
  });
  it("a zero-value deposit is a no-op", async function () {
    const b = await base(); const vault = await vaultOf(b, 4);
    await vault.connect(b.funder).deposit({ value: 0 });
    expect(await vault.claimable(1)).to.equal(0n);
  });
  it("claimable(id) exactly equals what claim() pays for an uneven deposit", async function () {
    const b = await base(); const vault = await vaultOf(b, 4);
    await vault.connect(b.funder).deposit({ value: ethers.parseEther("5") }); // 1.25 per token
    const owed = await vault.claimable(1);
    const garage = await vault.garageOf(1);
    await vault.connect(b.alice).claim(1, true);
    expect(await ethers.provider.getBalance(garage)).to.equal(owed);
  });
});
