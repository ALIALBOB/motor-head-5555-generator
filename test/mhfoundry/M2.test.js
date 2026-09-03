// Milestone 2 — RewardPot (MasterChef accumulator) + FeeRouter
const { expect } = require("chai");
const { ethers } = require("hardhat");

const E = (n) => ethers.parseEther(String(n));

describe("MHFoundry · Milestone 2 — RewardPot + FeeRouter", () => {
  let owner, treasury, sink, holders;
  let nft, reg, pot, up;

  // deploy fresh system; mint `n` robots (1-indexed) to round-robin holders
  async function setup(n = 6) {
    const signers = await ethers.getSigners();
    owner = signers[0];
    treasury = signers[1];
    sink = signers[2];
    holders = signers.slice(3, 3 + 6);

    nft = await (await ethers.getContractFactory("RobotNFT")).deploy(1000, 0, treasury.address, 1000n, owner.address);
    await nft.setPublicOpen(true);
    reg = await (await ethers.getContractFactory("WeightRegistry")).deploy(owner.address);
    pot = await (await ethers.getContractFactory("RewardPot")).deploy(owner.address, await reg.getAddress(), await nft.getAddress(), 0);
    up = await (await ethers.getContractFactory("MockUpgrader")).deploy(await reg.getAddress(), await pot.getAddress());
    await reg.grantRole(await reg.UPGRADE_ROLE(), await up.getAddress());
    await pot.grantRole(await pot.SETTLER_ROLE(), await up.getAddress());

    const ownerOf = {};
    for (let i = 0; i < n; i++) {
      const h = holders[i % holders.length];
      await nft.connect(h).publicMint();
      ownerOf[i + 1] = h; // tokenId = i+1
    }
    return ownerOf;
  }
  const fund = (n) => pot.fundETH({ value: E(n) });
  const potBal = async () => ethers.provider.getBalance(await pot.getAddress());

  it("parks ETH funded while totalWeight==0, then distributes on the next fund", async () => {
    await setup();
    await fund(1);
    expect(await pot.undistributed()).to.equal(E(1));
    expect(await pot.accRewardPerWeight()).to.equal(0);
    await up.setWeight(1, 1, 100); // activate token 1
    await fund(1); // now 1 + parked 1 = 2 distributed to weight 100
    expect(await pot.undistributed()).to.equal(0);
    expect(await pot.pendingOf(1)).to.equal(E(2));
  });

  it("single robot: earns 100% then claims, pot empties", async () => {
    const own = await setup();
    await up.setWeight(1, 1, 100);
    await fund(1);
    expect(await pot.pendingOf(1)).to.equal(E(1));
    await expect(pot.connect(own[1]).claim(1)).to.emit(pot, "Claimed").withArgs(1, own[1].address, E(1));
    expect(await pot.pendingOf(1)).to.equal(0);
    expect(await potBal()).to.equal(0);
  });

  it("splits by weight (100 : 300 => 1 : 3 of 4 ETH)", async () => {
    await setup();
    await up.setWeight(1, 1, 100);
    await up.setWeight(2, 2, 300);
    await fund(4);
    expect(await pot.pendingOf(1)).to.equal(E(1));
    expect(await pot.pendingOf(2)).to.equal(E(3));
  });

  it("ANTI-SNIPE: a robot activated after a payout gets zero of it", async () => {
    await setup();
    await up.setWeight(1, 1, 100);
    await fund(5); // token 1 earns all 5
    await up.setWeight(2, 1, 100); // token 2 activates AFTER the payout
    expect(await pot.pendingOf(2)).to.equal(0);
    expect(await pot.pendingOf(1)).to.equal(E(5));
    await fund(2); // now split 100:100 => 1 each
    expect(await pot.pendingOf(1)).to.equal(E(6));
    expect(await pot.pendingOf(2)).to.equal(E(1));
  });

  it("upgrade settles the pending, then earns at the new weight", async () => {
    await setup();
    await up.setWeight(1, 1, 100);
    await fund(1); // pending 1 @ w100
    await up.setWeight(1, 3, 600); // upgrade -> settle 1, weight now 600
    await fund(6); // @ w600 (sole) => +6
    expect(await pot.pendingOf(1)).to.equal(E(7));
  });

  it("only the current owner can claim; second claim reverts", async () => {
    const own = await setup();
    await up.setWeight(1, 1, 100);
    await fund(1);
    await expect(pot.connect(treasury).claim(1)).to.be.revertedWith("not owner");
    await pot.connect(own[1]).claim(1);
    await expect(pot.connect(own[1]).claim(1)).to.be.revertedWith("nothing to claim");
  });

  // ── RESCUE HATCH: telegraphed recovery (signalRescue → wait rescueDelay → pause → emergencyWithdraw) ──
  const bump = async (secs) => { await ethers.provider.send("evm_increaseTime", [secs]); await ethers.provider.send("evm_mine", []); };
  const potWithDelay = async (delay) =>
    (await ethers.getContractFactory("RewardPot")).deploy(owner.address, await reg.getAddress(), await nft.getAddress(), delay);

  it("rescue: only admin can pause / signal / withdraw / lock", async () => {
    await setup();
    const s = holders[0];
    await expect(pot.connect(s).pause()).to.be.reverted;
    await expect(pot.connect(s).signalRescue()).to.be.reverted;
    await expect(pot.connect(s).emergencyWithdraw(s.address)).to.be.reverted;
    await expect(pot.connect(s).lockRescueForever()).to.be.reverted;
  });

  it("rescue: needs BOTH pause and a signal; then drains the full balance (delay-0 pot)", async () => {
    await setup(); // pot rescueDelay = 0
    await up.setWeight(1, 1, 100);
    await fund(3);
    await expect(pot.emergencyWithdraw(treasury.address)).to.be.reverted;            // not paused
    await pot.pause();
    await expect(pot.emergencyWithdraw(treasury.address)).to.be.revertedWith("not ready"); // no signal
    await pot.signalRescue();
    const t0 = await ethers.provider.getBalance(treasury.address);
    await expect(pot.emergencyWithdraw(treasury.address)).to.emit(pot, "EmergencyWithdraw").withArgs(treasury.address, E(3));
    expect(await potBal()).to.equal(0);
    expect((await ethers.provider.getBalance(treasury.address)) - t0).to.equal(E(3)); // even parked/undistributed ETH is recovered
  });

  it("rescue: a real-launch pot honours the timelock (can't drain early)", async () => {
    await setup();
    const DELAY = 7 * 24 * 3600;
    const p = await potWithDelay(DELAY);
    await p.fundETH({ value: E(2) });
    await p.pause();
    await p.signalRescue();
    await expect(p.emergencyWithdraw(treasury.address)).to.be.revertedWith("not ready"); // before delay
    await bump(DELAY + 1);
    await expect(p.emergencyWithdraw(treasury.address)).to.emit(p, "EmergencyWithdraw");
    expect(await ethers.provider.getBalance(await p.getAddress())).to.equal(0);
  });

  it("rescue: cancelRescue resets the timelock", async () => {
    await setup();
    await pot.pause();
    await pot.signalRescue();
    await pot.cancelRescue();
    await expect(pot.emergencyWithdraw(treasury.address)).to.be.revertedWith("not ready");
  });

  it("rescue: lockRescueForever RENOUNCES admin → truly autonomous, no drain path; claims still work", async () => {
    const own = await setup();
    await up.setWeight(1, 1, 100);
    await fund(1);
    await pot.lockRescueForever();
    // admin fully renounced: no privileged action works — crucially the SETTLER-self-grant drain path is now closed
    await expect(pot.signalRescue()).to.be.reverted;
    await expect(pot.pause()).to.be.reverted;
    await expect(pot.grantRole(await pot.SETTLER_ROLE(), owner.address)).to.be.reverted;
    await expect(pot.connect(own[1]).claim(1)).to.emit(pot, "Claimed"); // autonomous payout unaffected
  });

  it("rescue: a rescued pot is TERMINAL (drained) — no re-fund, no claim, no reuse double-pay", async () => {
    const own = await setup(); // delay-0 pot
    await up.setWeight(1, 1, 100);
    await fund(2);
    await pot.pause();
    await pot.signalRescue();
    await pot.emergencyWithdraw(treasury.address);
    expect(await pot.drained()).to.equal(true);
    await expect(pot.fundETH({ value: E(1) })).to.be.revertedWith("retired");                 // can't re-fund
    await expect(owner.sendTransaction({ to: await pot.getAddress(), value: E(1) })).to.be.reverted; // receive() too
    await pot.unpause();
    await expect(pot.connect(own[1]).claim(1)).to.be.revertedWith("retired");                 // can't claim stale entitlements
  });

  it("pause freezes claims, unpause restores them", async () => {
    const own = await setup();
    await up.setWeight(1, 1, 100);
    await fund(1);
    await pot.pause();
    await expect(pot.connect(own[1]).claim(1)).to.be.reverted; // whenNotPaused
    await pot.unpause();
    await expect(pot.connect(own[1]).claim(1)).to.emit(pot, "Claimed");
  });

  it("receive() funds the pot the same as fundETH()", async () => {
    await setup();
    await up.setWeight(1, 1, 100);
    await owner.sendTransaction({ to: await pot.getAddress(), value: E(2) });
    expect(await pot.pendingOf(1)).to.equal(E(2));
  });

  it("FeeRouter splits total -> buy-burn / pool / treasury", async () => {
    await setup();
    await up.setWeight(1, 1, 100); // one active robot so the pool slice distributes
    const router = await (await ethers.getContractFactory("FeeRouter")).deploy(
      await pot.getAddress(), treasury.address, sink.address, 500, 7000, owner.address // 5% buyburn, 70% pool
    );
    const t0 = await ethers.provider.getBalance(treasury.address);
    const s0 = await ethers.provider.getBalance(sink.address);
    await router.connect(holders[0]).route({ value: E(1) });
    // bb = 0.05 ; rem = 0.95 ; pool = 0.665 ; treasury = 0.285
    expect((await ethers.provider.getBalance(sink.address)) - s0).to.equal(E("0.05"));
    expect((await ethers.provider.getBalance(treasury.address)) - t0).to.equal(E("0.285"));
    expect(await pot.pendingOf(1)).to.equal(E("0.665"));
  });

  // ───────────────────────── FUZZ / INVARIANT ─────────────────────────
  it("INVARIANT (seeded, multi-run): funds+activations+upgrades conserve ETH; claims leave only dust", async () => {
    // deterministic PRNG so any failure is reproducible (a flaky money test is worse than none)
    function mulberry32(a) {
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    for (const seed of [1, 1337, 42424242, 7, 999999]) {
      const own = await setup(6);
      const rng = mulberry32(seed);
      const rnd = (a, b) => a + Math.floor(rng() * (b - a + 1));

      await up.setWeight(1, 1, 20); // keep >=1 active the whole run so nothing is parked
      const active = new Set([1]);
      let totalFunded = 0n;

      for (let round = 0; round < 50; round++) {
        const milli = BigInt(rnd(1, 3000)); // 0.001 .. 3 ETH
        const amt = (E(1) * milli) / 1000n;
        await pot.fundETH({ value: amt });
        totalFunded += amt;
        if (rng() < 0.4) {
          const id = rnd(1, 6), w = rnd(5, 50);
          await up.setWeight(id, 1, w); // atomic settle + reweight (weight never hits 0)
          active.add(id);
        }
      }
      for (const id of active) {
        if ((await pot.pendingOf(id)) > 0n) await pot.connect(own[id]).claim(id);
      }

      const claimed = await pot.totalClaimed(); // actual ETH sent (dust-capped)
      const leftover = await potBal();
      expect(claimed + leftover).to.equal(totalFunded);          // conservation: no wei created/lost
      expect(await pot.undistributed()).to.equal(0);             // nothing parked
      expect(leftover < 100_000n).to.equal(true);                // only rounding dust remains
      expect(claimed > (totalFunded * 9999n) / 10000n).to.equal(true); // ~everything was distributable
    }
  });
});
