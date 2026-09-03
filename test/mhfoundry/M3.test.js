// Milestone 3 — UpgradeManager + CustomizeManager (spend $TOKEN → burn → weight → earn ETH)
const { expect } = require("chai");
const { ethers } = require("hardhat");

const E = (n) => ethers.parseEther(String(n));
const COSTS = [0, 15, 75, 300, 900, 2500].map((v) => E(v)); // cumulative $TOKEN
const WEIGHTS = [0, 100, 250, 600, 1200, 2200];
const FEE = E(10);

describe("MHFoundry · Milestone 3 — Upgrade + Customize", () => {
  let owner, treasury, A, B, C;
  let token, nft, reg, pot, up, cm;

  beforeEach(async () => {
    [owner, treasury, A, B, C] = await ethers.getSigners();

    token = await (await ethers.getContractFactory("MHToken")).deploy("Test Token","TT",treasury.address, owner.address);
    nft = await (await ethers.getContractFactory("RobotNFT")).deploy(1000, 0, treasury.address, 1000n, owner.address);
    await nft.setPublicOpen(true);
    reg = await (await ethers.getContractFactory("WeightRegistry")).deploy(owner.address);
    pot = await (await ethers.getContractFactory("RewardPot")).deploy(owner.address, await reg.getAddress(), await nft.getAddress(), 0);
    up = await (await ethers.getContractFactory("UpgradeManager")).deploy(
      await token.getAddress(), await nft.getAddress(), await reg.getAddress(), await pot.getAddress(),
      treasury.address, 5000, COSTS, WEIGHTS, owner.address
    );
    cm = await (await ethers.getContractFactory("CustomizeManager")).deploy(
      await token.getAddress(), await nft.getAddress(), await reg.getAddress(), await pot.getAddress(), treasury.address, 5000, E(1), owner.address // tokenPerUsd = 1e18 ($1 = 1 $TOKEN)
    );

    // wire roles: UpgradeManager + CustomizeManager settle the pot + write the registry
    await reg.grantRole(await reg.UPGRADE_ROLE(), await up.getAddress());
    await pot.grantRole(await pot.SETTLER_ROLE(), await up.getAddress());
    await reg.grantRole(await reg.CUSTOMIZE_ROLE(), await cm.getAddress());
    await pot.grantRole(await pot.SETTLER_ROLE(), await cm.getAddress());
    // catalog
    await cm.setItem(1, 1000, 100, true); // $10 part, +1% weight
    await cm.setItem(2, 5000, 500, true); // $50 item, +5% weight
    await cm.setItem(3, 500, 0, true);    // $5 cosmetic, no weight
    await cm.setRecolorPrice(500);        // $5 recolor

    // mint robots: token 1 -> A, token 2 -> B
    await nft.connect(A).publicMint(); // id 1
    await nft.connect(B).publicMint(); // id 2

    // fund holders with $TOKEN + approvals
    for (const h of [A, B, C]) {
      await token.connect(treasury).transfer(h.address, E(10000));
      await token.connect(h).approve(await up.getAddress(), ethers.MaxUint256);
      await token.connect(h).approve(await cm.getAddress(), ethers.MaxUint256);
    }
  });

  it("activate: charges $TOKEN, burns 50%, treasury gets 50%, sets weight, settles pot", async () => {
    const supply0 = await token.totalSupply();
    const treas0 = await token.balanceOf(treasury.address);
    const aBal0 = await token.balanceOf(A.address);

    await expect(up.connect(A).activate(1)).to.emit(up, "Activated").withArgs(1, 1, 100, E(15));

    expect(await reg.tierOf(1)).to.equal(1);
    expect(await reg.weightOf(1)).to.equal(100);
    expect(await reg.isActivated(1)).to.equal(true);
    expect(await reg.totalWeight()).to.equal(100);
    // token flows: holder -15, burn 7.5 (supply down), treasury +7.5
    expect(aBal0 - (await token.balanceOf(A.address))).to.equal(E(15));
    expect(supply0 - (await token.totalSupply())).to.equal(E("7.5"));
    expect((await token.balanceOf(treasury.address)) - treas0).to.equal(E("7.5"));
  });

  it("activate: gated to owner, once only", async () => {
    await expect(up.connect(B).activate(1)).to.be.revertedWith("not owner");
    await up.connect(A).activate(1);
    await expect(up.connect(A).activate(1)).to.be.revertedWith("already active");
  });

  it("upgrade: charges the tier DIFFERENCE, updates weight, settles", async () => {
    await up.connect(A).activate(1); // T1, paid 15
    await expect(up.connect(A).upgrade(1, 3)).to.emit(up, "Upgraded").withArgs(1, 1, 3, 600, E(285)); // 300-15
    expect(await reg.tierOf(1)).to.equal(3);
    expect(await reg.weightOf(1)).to.equal(600);
    expect(await reg.totalWeight()).to.equal(600);
  });

  it("upgrade: rejects same/lower tier, beyond-max, and pre-activation", async () => {
    await expect(up.connect(A).upgrade(1, 2)).to.be.revertedWith("activate first");
    await up.connect(A).activate(1);
    await expect(up.connect(A).upgrade(1, 1)).to.be.revertedWith("bad tier");
    await expect(up.connect(A).upgrade(1, 6)).to.be.revertedWith("bad tier"); // maxTier = 5
  });

  it("THE LOOP: two holders spend $TOKEN, then earn ETH by weight", async () => {
    await up.connect(A).activate(1); // weight 100
    await up.connect(B).activate(2); // weight 100
    await up.connect(B).upgrade(2, 3); // weight 600
    expect(await reg.totalWeight()).to.equal(700);

    await pot.fundETH({ value: E(7) }); // real ETH into the pool
    expect(await pot.pendingOf(1)).to.equal(E(1)); // 100/700 * 7
    expect(await pot.pendingOf(2)).to.equal(E(6)); // 600/700 * 7

    await expect(pot.connect(A).claim(1)).to.emit(pot, "Claimed").withArgs(1, A.address, E(1));
    await expect(pot.connect(B).claim(2)).to.emit(pot, "Claimed").withArgs(2, B.address, E(6));
    expect(await ethers.provider.getBalance(await pot.getAddress())).to.equal(0);
  });

  it("burns are deflationary across many actions", async () => {
    const s0 = await token.totalSupply();
    await up.connect(A).activate(1); // burn 7.5
    await up.connect(A).upgrade(1, 5); // cost 2500-15=2485, burn 1242.5
    const burned = E("7.5") + E("1242.5");
    expect(s0 - (await token.totalSupply())).to.equal(burned);
  });

  it("catalog: USD pricing → $TOKEN at the live rate; rate editable", async () => {
    expect(await cm.costOf(1)).to.equal(E(10)); // $10 item @ 1 token/$
    await cm.setTokenPerUsd(E(2));              // token now $0.50 → 2 token/$
    expect(await cm.costOf(1)).to.equal(E(20)); // same $10 item now costs 20 $TOKEN
  });

  it("buyItem (weighted): charges $TOKEN, burns 50%, adds capped bonus weight", async () => {
    await up.connect(A).activate(1); // base 100
    const s0 = await token.totalSupply();
    const t0 = await token.balanceOf(treasury.address);
    await expect(cm.connect(A).buyItem(1, 1)) // item1 = $10, +1%
      .to.emit(cm, "Bought").withArgs(1, 1, E(10), 1);
    expect(s0 - (await token.totalSupply())).to.equal(E(5)); // burn 50% of $10
    expect((await token.balanceOf(treasury.address)) - t0).to.equal(E(5));
    expect(await reg.weightOf(1)).to.equal(101); // +1 bonus
  });

  it("cosmetic item + recolor: charge, but no weight", async () => {
    await up.connect(A).activate(1);
    await cm.connect(A).buyItem(1, 3); // $5 cosmetic (0 weight)
    expect(await reg.weightOf(1)).to.equal(100);
    await expect(cm.connect(A).recolor(1, "gunmetal")).to.emit(cm, "Recolored").withArgs(1, "gunmetal", E(5));
    expect(await reg.weightOf(1)).to.equal(100);
  });

  it("bonus is CAPPED at +10% of base across all items", async () => {
    await up.connect(A).activate(1); // base 100, cap = 10
    for (let i = 0; i < 5; i++) await cm.connect(A).buyItem(1, 2); // +5% each
    expect(await reg.bonusWeightOf(1)).to.equal(10); // capped at 10, not 25
    expect(await reg.weightOf(1)).to.equal(110);
  });

  it("grantCustom (onlyOwner): binds ref + capped weight", async () => {
    await up.connect(A).activate(1);
    await expect(cm.connect(A).grantCustom(1, "bespoke-katana", 500)).to.be.reverted; // not the owner
    await expect(cm.grantCustom(1, "bespoke-katana", 500))
      .to.emit(cm, "CustomGranted").withArgs(1, "bespoke-katana", 500, 5);
    expect(await reg.weightOf(1)).to.equal(105);
  });

  it("bonus survives upgrade; buyItem gated + inactive item reverts", async () => {
    await up.connect(A).activate(1);   // base 100
    await cm.connect(A).buyItem(1, 1); // +1 → 101
    await up.connect(A).upgrade(1, 3); // base 600, bonus preserved
    expect(await reg.weightOf(1)).to.equal(601);
    await expect(cm.connect(B).buyItem(1, 1)).to.be.revertedWith("not owner");
    await expect(cm.connect(A).buyItem(1, 99)).to.be.revertedWith("item inactive");
  });

  it("pause blocks activate and customize", async () => {
    await up.pause();
    await expect(up.connect(A).activate(1)).to.be.reverted;
    await up.unpause();
    await up.connect(A).activate(1);
    await cm.pause();
    await expect(cm.connect(A).buyItem(1, 1)).to.be.reverted;
  });

  it("reverts without token approval", async () => {
    await token.connect(C).approve(await up.getAddress(), 0); // revoke
    await nft.connect(C).publicMint(); // id 3
    await expect(up.connect(C).activate(3)).to.be.reverted; // ERC20 insufficient allowance
  });
});
