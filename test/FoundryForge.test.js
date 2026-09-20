const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// FoundryForge: tiers and bought parts, on chain. Every payment must reach the treasury in the same transaction, every
// part must land in the ROBOT'S garage, and nothing may be sold to a robot that is not the caller's or not activated.
describe("FoundryForge", function () {
  const P2 = ethers.parseEther("0.0134"), P3 = ethers.parseEther("0.0268"), PART = ethers.parseEther("0.002");

  async function deploy() {
    const [owner, holder, stranger, treasury] = await ethers.getSigners();
    const Robots = await ethers.getContractFactory("MockRobots"); const robots = await Robots.deploy();
    const Parts = await ethers.getContractFactory("ForgeParts"); const parts = await Parts.deploy();
    const Crates = await ethers.getContractFactory("ForgeCrates"); const crates = await Crates.deploy();
    const Feed = await ethers.getContractFactory("ForgeFeed"); const feed = await Feed.deploy();
    const Forge = await ethers.getContractFactory("FoundryForge");
    const forge = await Forge.deploy(await robots.getAddress(), await parts.getAddress(), await crates.getAddress(), treasury.address, owner.address);
    await robots.setOwner(7, holder.address); await robots.setOwner(8, holder.address);
    await crates.setActivated(7, true);
    await forge.setTierPrice(2, P2); await forge.setTierPrice(3, P3);
    await forge.setPartPrice(101, PART);
    return { forge, robots, parts, crates, feed, owner, holder, stranger, treasury };
  }

  it("a robot starts at the tier the chain already says: 0 until activated, then 1", async function () {
    const { forge, crates } = await loadFixture(deploy);
    expect(await forge.tierOf(8)).to.equal(0);          // not activated
    expect(await forge.tierOf(7)).to.equal(1);          // activated, never upgraded
    await crates.setActivated(8, true);
    expect(await forge.tierOf(8)).to.equal(1);
  });

  it("an upgrade pays the treasury in the same transaction and moves the tier exactly one step", async function () {
    const { forge, holder, treasury } = await loadFixture(deploy);
    await expect(forge.connect(holder).upgrade(7, { value: P2 })).to.changeEtherBalances([treasury, holder], [P2, -P2]);
    expect(await forge.tierOf(7)).to.equal(2);
    await expect(forge.connect(holder).upgrade(7, { value: P3 })).to.emit(forge, "Upgraded").withArgs(7, 3, P3, 0);
    expect(await forge.tierOf(7)).to.equal(3);
  });

  it("refuses an upgrade that is not yours, not activated, underpaid, or past the top tier", async function () {
    const { forge, holder, stranger, crates } = await loadFixture(deploy);
    await expect(forge.connect(stranger).upgrade(7, { value: P2 })).to.be.revertedWithCustomError(forge, "NotOwner");
    await expect(forge.connect(holder).upgrade(8, { value: P2 })).to.be.revertedWithCustomError(forge, "NotActivated");
    await expect(forge.connect(holder).upgrade(7, { value: P2 - 1n })).to.be.revertedWithCustomError(forge, "Underpaid");
    await crates.setActivated(8, true);
    await expect(forge.connect(holder).upgrade(8, { value: P2 })).to.not.be.reverted;   // 8 is the holder's too
    await forge.setTierPrice(4, P3); await forge.setTierPrice(5, P3);
    for (const v of [P3, P3, P3, P3]) await forge.connect(holder).upgrade(7, { value: v });   // 1 -> 5 is four paid steps
    expect(await forge.tierOf(7)).to.equal(5);
    await expect(forge.connect(holder).upgrade(7, { value: P3 })).to.be.revertedWithCustomError(forge, "TierTooHigh");
  });

  it("a bought part is minted into the ROBOT'S garage, never the buyer's wallet, and only once", async function () {
    const { forge, parts, crates, holder, treasury } = await loadFixture(deploy);
    const garage = await crates.garageOf(7);
    await expect(forge.connect(holder).buyPart(7, 101, { value: PART })).to.changeEtherBalances([treasury, holder], [PART, -PART]);
    expect(await parts.balanceOf(garage, 101)).to.equal(1);
    expect(await parts.balanceOf(holder.address, 101)).to.equal(0);   // it belongs to the robot, not the person
    await expect(forge.connect(holder).buyPart(7, 101, { value: PART })).to.be.revertedWithCustomError(forge, "AlreadyHeld");
  });

  it("a part with no price is crate-only and cannot be bought", async function () {
    const { forge, holder } = await loadFixture(deploy);
    await expect(forge.connect(holder).buyPart(7, 999, { value: PART })).to.be.revertedWithCustomError(forge, "NotForSale");
    await expect(forge.connect(holder).buyPart(7, 101, { value: PART - 1n })).to.be.revertedWithCustomError(forge, "Underpaid");
  });

  it("the site fee rides on the payment, follows the ETH price, and falls back when the feed cannot be trusted", async function () {
    const { forge, feed, holder, treasury } = await loadFixture(deploy);
    expect(await forge.siteFeeWei()).to.equal(0);                                  // off until it is set
    await forge.setFee(await feed.getAddress(), 100, ethers.parseEther("0.0003")); // $1
    expect(await forge.siteFeeWei()).to.equal(ethers.parseEther("0.0004"));        // at $2,500/ETH
    await feed.set(5000n * 10n ** 8n, await time());
    expect(await forge.siteFeeWei()).to.equal(ethers.parseEther("0.0002"));        // at $5,000/ETH
    const [next, total] = await forge.upgradeQuote(7);
    expect(next).to.equal(2); expect(total).to.equal(P2 + ethers.parseEther("0.0002"));
    await expect(forge.connect(holder).upgrade(7, { value: total })).to.changeEtherBalances([treasury, holder], [total, -total]);
    // a broken or stale feed uses the fallback rather than a wild number
    await feed.setReverts(true); expect(await forge.siteFeeWei()).to.equal(ethers.parseEther("0.0003"));
    await feed.setReverts(false); await feed.set(2500n * 10n ** 8n, 1);            // answered long ago
    expect(await forge.siteFeeWei()).to.equal(ethers.parseEther("0.0003"));
    await feed.set(1n * 10n ** 8n, await time());                                   // $1/ETH is not a real price
    expect(await forge.siteFeeWei()).to.equal(ethers.parseEther("0.0003"));
  });

  it("the fee can never run away: it is capped however mad the feed goes", async function () {
    const { forge, feed } = await loadFixture(deploy);
    await forge.setFee(await feed.getAddress(), 5000, ethers.parseEther("0.0003"));   // $50
    await feed.set(101n * 10n ** 8n, await time());                                    // ETH at $101
    expect(await forge.siteFeeWei()).to.equal(await forge.FEE_MAX_WEI());
    await expect(forge.setFee(await feed.getAddress(), 100, ethers.parseEther("1"))).to.be.revertedWithCustomError(forge, "Underpaid");
  });

  it("overpaying is given back, so a price that moved mid-transaction never costs extra", async function () {
    const { forge, holder, treasury } = await loadFixture(deploy);
    const over = P2 + ethers.parseEther("0.5");
    await expect(forge.connect(holder).upgrade(7, { value: over })).to.changeEtherBalances([treasury, holder], [P2, -P2]);
    expect(await ethers.provider.getBalance(await forge.getAddress())).to.equal(0);   // nothing rests in the contract
  });

  it("if the treasury will not take the money, nothing happens at all", async function () {
    const [owner, holder, , ] = await ethers.getSigners();
    const Robots = await ethers.getContractFactory("MockRobots"); const robots = await Robots.deploy();
    const Parts = await ethers.getContractFactory("ForgeParts"); const parts = await Parts.deploy();
    const Crates = await ethers.getContractFactory("ForgeCrates"); const crates = await Crates.deploy();
    const Bad = await ethers.getContractFactory("RejectingTreasury"); const bad = await Bad.deploy();
    const Forge = await ethers.getContractFactory("FoundryForge");
    const forge = await Forge.deploy(await robots.getAddress(), await parts.getAddress(), await crates.getAddress(), await bad.getAddress(), owner.address);
    await robots.setOwner(7, holder.address); await crates.setActivated(7, true); await forge.setTierPrice(2, P2);
    await expect(forge.connect(holder).upgrade(7, { value: P2 })).to.be.revertedWithCustomError(forge, "TransferFailed");
    expect(await forge.tierOf(7)).to.equal(1);
  });

  it("a buyer that re-enters during its refund cannot get a second tier for one payment", async function () {
    const { forge, robots, crates } = await loadFixture(deploy);
    const R = await ethers.getContractFactory("ReentrantForgeBuyer"); const r = await R.deploy();
    await robots.setOwner(9, await r.getAddress()); await crates.setActivated(9, true);
    const [signer] = await ethers.getSigners();
    await signer.sendTransaction({ to: await r.getAddress(), value: ethers.parseEther("1") });   // fund it FIRST: this hits receive() too
    await r.arm(await forge.getAddress(), 9);
    await r.go(P2 + ethers.parseEther("0.1"));   // overpays, so the refund calls back into the forge
    expect(await r.reentered()).to.equal(false);
    expect(await forge.tierOf(9)).to.equal(2);
  });

  it("a part moves between two of your robots, for the fee, and only with the garage's blessing", async function () {
    const { forge, parts, crates, holder, treasury } = await loadFixture(deploy);
    await crates.setActivated(8, true);
    const A = await ethers.getContractFactory("ForgeAccount");
    const a7 = await A.deploy(), a8 = await A.deploy();
    await crates.setGarage(7, await a7.getAddress()); await crates.setGarage(8, await a8.getAddress());
    await forge.connect(holder).buyPart(7, 101, { value: PART });
    const g7 = await crates.garageOf(7), g8 = await crates.garageOf(8);
    // the garage has to let the forge hand its parts out; the forge can never grant itself that
    expect(await forge.canMoveFrom(7)).to.equal(false);
    await expect(forge.connect(holder).movePart(7, 8, 101, { value: 0 })).to.be.revertedWithCustomError(forge, "NotApproved");
    await parts.connect(holder).setApprovalForAllFrom(g7, await forge.getAddress(), true);   // stands in for the garage's own call
    expect(await forge.canMoveFrom(7)).to.equal(true);
    await forge.setFee(ethers.ZeroAddress, 100, ethers.parseEther("0.0003"));
    const fee = await forge.siteFeeWei();
    await expect(forge.connect(holder).movePart(7, 8, 101, { value: fee })).to.changeEtherBalance(treasury, fee);
    expect(await parts.balanceOf(g7, 101)).to.equal(0);
    expect(await parts.balanceOf(g8, 101)).to.equal(1);   // it really moved, it was not copied
  });

  it("refuses a move that is not yours, to the same robot, of a part you do not have, or onto one that has it", async function () {
    const { forge, parts, crates, holder, stranger } = await loadFixture(deploy);
    await crates.setActivated(8, true);
    const A = await ethers.getContractFactory("ForgeAccount");
    await crates.setGarage(7, await (await A.deploy()).getAddress()); await crates.setGarage(8, await (await A.deploy()).getAddress());
    await forge.connect(holder).buyPart(7, 101, { value: PART });
    await parts.connect(holder).setApprovalForAllFrom(await crates.garageOf(7), await forge.getAddress(), true);
    await expect(forge.connect(stranger).movePart(7, 8, 101, { value: 0 })).to.be.revertedWithCustomError(forge, "NotOwner");
    await expect(forge.connect(holder).movePart(7, 7, 101, { value: 0 })).to.be.revertedWithCustomError(forge, "SameRobot");
    await expect(forge.connect(holder).movePart(7, 8, 999, { value: 0 })).to.be.revertedWithCustomError(forge, "NotHeld");
    await crates.setActivated(8, false);
    await expect(forge.connect(holder).movePart(7, 8, 101, { value: 0 })).to.be.revertedWithCustomError(forge, "NotActivated");
    await crates.setActivated(8, true);
    await forge.connect(holder).movePart(7, 8, 101, { value: 0 });
    await parts.connect(holder).setApprovalForAllFrom(await crates.garageOf(8), await forge.getAddress(), true);
    await forge.connect(holder).buyPart(7, 101, { value: PART });                 // #7 buys another one
    await expect(forge.connect(holder).movePart(7, 8, 101, { value: 0 })).to.be.revertedWithCustomError(forge, "AlreadyHeld");
  });

  it("a garage that was never used is brought to life, and that needs the account build to be set", async function () {
    const { forge, crates, holder, owner } = await loadFixture(deploy);
    expect(await forge.garageReady(7)).to.equal(false);                       // nothing but an address on paper
    await expect(forge.prepareGarage(7)).to.be.revertedWithCustomError(forge, "NoAccountImpl");
    await expect(forge.connect(holder).setAccountImpl(owner.address)).to.be.revertedWithCustomError(forge, "OwnableUnauthorizedAccount");
    // once it IS alive, preparing it again is a no-op that just hands the address back
    const A = await ethers.getContractFactory("ForgeAccount"); const a = await A.deploy();
    await crates.setGarage(7, await a.getAddress());
    expect(await forge.garageReady(7)).to.equal(true);
    await expect(forge.prepareGarage(7)).to.not.be.reverted;
    expect(await forge.prepareGarage.staticCall(7)).to.equal(await a.getAddress());
  });

  it("seeding carries the tiers already paid for, and can only ever raise one", async function () {
    const { forge, holder, crates } = await loadFixture(deploy);
    await crates.setActivated(8, true);
    await forge.seedTiers([7, 8], [3, 2]);
    expect(await forge.tierOf(7)).to.equal(3); expect(await forge.tierOf(8)).to.equal(2);
    await forge.seedTiers([7], [1]);                       // a lower seed must not demote
    expect(await forge.tierOf(7)).to.equal(3);
    await expect(forge.seedTiers([7], [9])).to.be.revertedWithCustomError(forge, "TierTooHigh");
    await expect(forge.seedTiers([7, 8], [1])).to.be.revertedWithCustomError(forge, "LengthMismatch");
    await expect(forge.connect(holder).seedTiers([7], [5])).to.be.revertedWithCustomError(forge, "OwnableUnauthorizedAccount");
  });

  it("only the owner sets prices, the treasury and the fee, and pausing stops every sale", async function () {
    const { forge, holder, treasury, stranger } = await loadFixture(deploy);
    await expect(forge.connect(holder).setTierPrice(2, 1)).to.be.revertedWithCustomError(forge, "OwnableUnauthorizedAccount");
    await expect(forge.connect(holder).setPartPrice(101, 1)).to.be.revertedWithCustomError(forge, "OwnableUnauthorizedAccount");
    await expect(forge.connect(holder).pause()).to.be.revertedWithCustomError(forge, "OwnableUnauthorizedAccount");
    await expect(forge.setTierPrice(1, 1)).to.be.revertedWithCustomError(forge, "TierTooHigh");
    await forge.pause();
    await expect(forge.connect(holder).upgrade(7, { value: P2 })).to.be.revertedWithCustomError(forge, "EnforcedPause");
    await expect(forge.connect(holder).buyPart(7, 101, { value: PART })).to.be.revertedWithCustomError(forge, "EnforcedPause");
    await forge.unpause();
    await forge.setTreasury(stranger.address);
    await expect(forge.connect(holder).upgrade(7, { value: P2 })).to.changeEtherBalance(stranger, P2);
    await expect(forge.setTreasury(ethers.ZeroAddress)).to.be.revertedWithCustomError(forge, "BadAddress");
    expect(treasury.address).to.be.a("string");
  });

  it("the quotes tell the site exactly what to ask for", async function () {
    const { forge, holder, crates } = await loadFixture(deploy);
    let q = await forge.partQuote(7, 101); expect(q[0]).to.equal(true); expect(q[1]).to.equal(PART);
    await forge.connect(holder).buyPart(7, 101, { value: PART });
    q = await forge.partQuote(7, 101); expect(q[0]).to.equal(false);          // already on the robot
    q = await forge.partQuote(7, 999); expect(q[0]).to.equal(false);          // crate-only
    await crates.setActivated(8, true); await forge.seedTiers([8], [5]);
    const u = await forge.upgradeQuote(8); expect(u[0]).to.equal(0);          // nothing left to buy
  });

  it("ETH sent here by accident can only ever go to the treasury", async function () {
    const { forge, treasury, holder } = await loadFixture(deploy);
    const [signer] = await ethers.getSigners();
    await signer.sendTransaction({ to: await forge.getAddress(), value: ethers.parseEther("0.2") }).catch(() => {});
    const bal = await ethers.provider.getBalance(await forge.getAddress());
    if (bal > 0n) await expect(forge.connect(holder).sweep()).to.changeEtherBalance(treasury, bal);
  });
});

async function time() { return (await ethers.provider.getBlock("latest")).timestamp; }
