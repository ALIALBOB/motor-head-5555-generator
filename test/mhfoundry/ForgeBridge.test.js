// ForgeBridge — cross-chain "burn a 2D / attach a 333" via a backend-signed EIP-712 voucher.
const { expect } = require("chai");
const { ethers } = require("hardhat");
const E = (n) => ethers.parseEther(String(n));
const WEIGHTS = [0, 100, 250, 600, 1200, 2200];

describe("MHFoundry · ForgeBridge (cross-chain burn/attach vouchers)", () => {
  let owner, holder, signer, other;
  let nft, reg, pot, bridge, chainId, domain;

  const TYPES_BURN = { Burn: [
    { name: "owner", type: "address" }, { name: "robotId", type: "uint256" }, { name: "toTier", type: "uint8" },
    { name: "burnIds", type: "uint256[]" }, { name: "nonce", type: "bytes32" }, { name: "deadline", type: "uint256" } ] };
  const TYPES_ATTACH = { Attach: [
    { name: "owner", type: "address" }, { name: "robotId", type: "uint256" }, { name: "archiveId", type: "uint256" },
    { name: "nonce", type: "bytes32" }, { name: "deadline", type: "uint256" } ] };

  const rnd = () => ethers.hexlify(ethers.randomBytes(32));
  const soon = async () => (await ethers.provider.getBlock("latest")).timestamp + 3600;
  const burnVoucher = (v) => signer.signTypedData(domain, TYPES_BURN, v);
  const attachVoucher = (v) => signer.signTypedData(domain, TYPES_ATTACH, v);

  async function setup() {
    [owner, holder, signer, other] = await ethers.getSigners();
    nft = await (await ethers.getContractFactory("RobotNFT")).deploy(1000, 0, owner.address, 1000n, owner.address);
    await nft.setPublicOpen(true);
    reg = await (await ethers.getContractFactory("WeightRegistry")).deploy(owner.address);
    pot = await (await ethers.getContractFactory("RewardPot")).deploy(owner.address, await reg.getAddress(), await nft.getAddress(), 0);
    bridge = await (await ethers.getContractFactory("ForgeBridge")).deploy(
      owner.address, signer.address, await reg.getAddress(), await pot.getAddress(), await nft.getAddress(),
      WEIGHTS, 25, 125, 5); // bonusPerArchive 25, maxBonus 125, maxArchives 5
    // the bridge needs to move tier + bonus + settle the pot
    await reg.grantRole(await reg.UPGRADE_ROLE(), await bridge.getAddress());
    await reg.grantRole(await reg.CUSTOMIZE_ROLE(), await bridge.getAddress());
    await pot.grantRole(await pot.SETTLER_ROLE(), await bridge.getAddress());
    chainId = (await ethers.provider.getNetwork()).chainId;
    domain = { name: "MHForgeBridge", version: "1", chainId, verifyingContract: await bridge.getAddress() };
    await nft.connect(holder).publicMint(); // robot #1 -> holder
  }

  it("burn→tier: valid voucher activates the robot (no $TOKEN), consumes the 2D ids", async () => {
    await setup();
    const v = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [11, 22, 33, 44, 55], nonce: rnd(), deadline: await soon() };
    const sig = await burnVoucher(v);
    await expect(bridge.connect(holder).activateWithBurn(v.owner, v.robotId, v.toTier, v.burnIds, v.nonce, v.deadline, sig))
      .to.emit(bridge, "ActivatedWithBurn");
    expect(await reg.tierOf(1)).to.equal(1);
    expect(await reg.weightOf(1)).to.equal(100);
    expect(await bridge.burnConsumed(22)).to.equal(true);
  });

  it("burn→tier then upgrade with a second burn voucher", async () => {
    await setup();
    let v = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [1, 2, 3, 4, 5], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(v.owner, v.robotId, v.toTier, v.burnIds, v.nonce, v.deadline, await burnVoucher(v));
    v = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(v.owner, v.robotId, v.toTier, v.burnIds, v.nonce, v.deadline, await burnVoucher(v));
    expect(await reg.tierOf(1)).to.equal(2);
    expect(await reg.weightOf(1)).to.equal(250);
  });

  it("the burn-activated robot actually earns from the pool", async () => {
    await setup();
    const v = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [1, 2, 3], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(v.owner, v.robotId, v.toTier, v.burnIds, v.nonce, v.deadline, await burnVoucher(v));
    await pot.fundETH({ value: E(1) });
    expect(await pot.pendingOf(1)).to.equal(E(1));
    await expect(pot.connect(holder).claim(1)).to.emit(pot, "Claimed");
  });

  it("SECURITY: replayed nonce, reused 2D id, bad signer, expiry, and non-owner all revert", async () => {
    await setup();
    const base = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [100, 101], deadline: await soon() };
    const v1 = { ...base, nonce: rnd() };
    await bridge.connect(holder).activateWithBurn(v1.owner, v1.robotId, v1.toTier, v1.burnIds, v1.nonce, v1.deadline, await burnVoucher(v1));
    // replay same nonce
    await expect(bridge.connect(holder).activateWithBurn(v1.owner, v1.robotId, 2, v1.burnIds, v1.nonce, v1.deadline, await burnVoucher({ ...v1, toTier: 2 })))
      .to.be.revertedWith("nonce used");
    // reuse a consumed 2D id (fresh nonce, upgrade path)
    const v2 = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [100, 200], nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(holder).activateWithBurn(v2.owner, v2.robotId, v2.toTier, v2.burnIds, v2.nonce, v2.deadline, await burnVoucher(v2)))
      .to.be.revertedWith("burn reused");
    // forged signature (signed by a non-signer)
    const v3 = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [300], nonce: rnd(), deadline: await soon() };
    const badSig = await other.signTypedData(domain, TYPES_BURN, v3);
    await expect(bridge.connect(holder).activateWithBurn(v3.owner, v3.robotId, v3.toTier, v3.burnIds, v3.nonce, v3.deadline, badSig))
      .to.be.revertedWith("bad sig");
    // expired
    const past = (await ethers.provider.getBlock("latest")).timestamp - 1;
    const v4 = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [400], nonce: rnd(), deadline: past };
    await expect(bridge.connect(holder).activateWithBurn(v4.owner, v4.robotId, v4.toTier, v4.burnIds, v4.nonce, v4.deadline, await burnVoucher(v4)))
      .to.be.revertedWith("expired");
    // someone who isn't the robot owner can't redeem an owner's voucher
    const v5 = { owner: holder.address, robotId: 1, toTier: 2, burnIds: [500], nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(other).activateWithBurn(v5.owner, v5.robotId, v5.toTier, v5.burnIds, v5.nonce, v5.deadline, await burnVoucher(v5)))
      .to.be.revertedWith("not robot owner");
  });

  it("attach 333: adds bonus weight, binds one-333-to-one-robot, and detach reverses it", async () => {
    await setup();
    // must be activated first
    const bv = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [1], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(bv.owner, bv.robotId, bv.toTier, bv.burnIds, bv.nonce, bv.deadline, await burnVoucher(bv));
    // attach 333 #777
    const av = { owner: holder.address, robotId: 1, archiveId: 777, nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(holder).attachArchive(av.owner, av.robotId, av.archiveId, av.nonce, av.deadline, await attachVoucher(av)))
      .to.emit(bridge, "ArchiveAttached");
    expect(await reg.weightOf(1)).to.equal(125); // 100 base + 25 bonus
    expect(await bridge.archiveBoundTo(777)).to.equal(1n);
    // the SAME 333 can't be attached again (to any robot)
    const av2 = { owner: holder.address, robotId: 1, archiveId: 777, nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(holder).attachArchive(av2.owner, av2.robotId, av2.archiveId, av2.nonce, av2.deadline, await attachVoucher(av2)))
      .to.be.revertedWith("333 already attached");
    // detach reverses the bonus + frees the 333
    await expect(bridge.connect(holder).detachArchive(1, 777)).to.emit(bridge, "ArchiveDetached");
    expect(await reg.weightOf(1)).to.equal(100);
    expect(await bridge.archiveBoundTo(777)).to.equal(0n);
  });

  it("attach caps bonus + windows, and only on an activated robot", async () => {
    await setup();
    // can't attach before activation
    const pre = { owner: holder.address, robotId: 1, archiveId: 1, nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(holder).attachArchive(pre.owner, pre.robotId, pre.archiveId, pre.nonce, pre.deadline, await attachVoucher(pre)))
      .to.be.revertedWith("activate first");
    const bv = { owner: holder.address, robotId: 1, toTier: 3, burnIds: [1], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(bv.owner, bv.robotId, bv.toTier, bv.burnIds, bv.nonce, bv.deadline, await burnVoucher(bv));
    // attach 5 (the window cap), each +25, capped at maxBonus 125
    for (let a = 1; a <= 5; a++) {
      const v = { owner: holder.address, robotId: 1, archiveId: a, nonce: rnd(), deadline: await soon() };
      await bridge.connect(holder).attachArchive(v.owner, v.robotId, v.archiveId, v.nonce, v.deadline, await attachVoucher(v));
    }
    expect(await reg.bonusWeightOf(1)).to.equal(125); // 5 * 25, at the cap
    // a 6th exceeds maxArchives
    const v6 = { owner: holder.address, robotId: 1, archiveId: 6, nonce: rnd(), deadline: await soon() };
    await expect(bridge.connect(holder).attachArchive(v6.owner, v6.robotId, v6.archiveId, v6.nonce, v6.deadline, await attachVoucher(v6)))
      .to.be.revertedWith("max archives");
  });

  it("forceDetach: admin frees a SOLD/stale 333 so the new owner can re-attach it", async () => {
    await setup();
    const bv = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [1], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(bv.owner, bv.robotId, bv.toTier, bv.burnIds, bv.nonce, bv.deadline, await burnVoucher(bv));
    const av = { owner: holder.address, robotId: 1, archiveId: 900, nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).attachArchive(av.owner, av.robotId, av.archiveId, av.nonce, av.deadline, await attachVoucher(av));
    expect(await bridge.archiveBoundTo(900)).to.equal(1n);
    await expect(bridge.connect(other).forceDetach(1, 900)).to.be.reverted;     // only admin
    await bridge.connect(owner).forceDetach(1, 900);
    expect(await bridge.archiveBoundTo(900)).to.equal(0n);
    expect(await reg.weightOf(1)).to.equal(100);                                 // bonus cleanly removed
    const av2 = { owner: holder.address, robotId: 1, archiveId: 900, nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).attachArchive(av2.owner, av2.robotId, av2.archiveId, av2.nonce, av2.deadline, await attachVoucher(av2));
    expect(await bridge.archiveBoundTo(900)).to.equal(1n);                        // re-attachable
  });

  it("bonus is conservation-safe: recomputed from count, so retuning bonusPerArchive mid-flight can't strand weight", async () => {
    await setup();
    const bv = { owner: holder.address, robotId: 1, toTier: 1, burnIds: [1], nonce: rnd(), deadline: await soon() };
    await bridge.connect(holder).activateWithBurn(bv.owner, bv.robotId, bv.toTier, bv.burnIds, bv.nonce, bv.deadline, await burnVoucher(bv));
    for (const id of [1, 2]) { const v = { owner: holder.address, robotId: 1, archiveId: id, nonce: rnd(), deadline: await soon() }; await bridge.connect(holder).attachArchive(v.owner, v.robotId, v.archiveId, v.nonce, v.deadline, await attachVoucher(v)); }
    expect(await reg.bonusWeightOf(1)).to.equal(50);          // 2 × 25
    await bridge.connect(owner).setArchiveParams(10, 125, 5); // retune per-archive 25 → 10
    await bridge.connect(holder).detachArchive(1, 1);         // count 2 → 1
    expect(await bridge.archiveCount(1)).to.equal(1n);
    expect(await reg.bonusWeightOf(1)).to.equal(10);          // recomputed 1×10, NOT 50-25=25
    expect(await reg.weightOf(1)).to.equal(110);
  });
});
