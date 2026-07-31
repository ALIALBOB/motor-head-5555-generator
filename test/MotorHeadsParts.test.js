const { expect } = require("chai");
const { ethers } = require("hardhat");

// ~$1 placeholder fee (real value is admin-set from live ETH price).
const FEE = ethers.parseEther("0.0004");

function sampleParts() {
  return [
    { partId: 7, x: 10, y: -20, scale: 1000, rotation: 0, color: 0xff8800ff },
    { partId: 3, x: -5, y: 15, scale: 1200, rotation: 90, color: 0x00ccffff },
  ];
}

async function deployFixture() {
  const [admin, alice, bob, treasury] = await ethers.getSigners();

  // The live MotorHeads collection (the real contract) as the ownership source of truth.
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(
    admin.address,
    "ipfs://metadata/",
    "ipfs://contract/contract.json",
    ethers.parseEther("0.03")
  );
  await nft.waitForDeployment();

  // The companion on-chain parts store.
  const Parts = await ethers.getContractFactory("MotorHeadsParts");
  const parts = await Parts.deploy(admin.address, await nft.getAddress(), treasury.address, FEE);
  await parts.waitForDeployment();

  // token #1 -> alice, token #2 -> bob
  await nft.adminMint(alice.address, 1);
  await nft.adminMint(bob.address, 1);

  return { nft, parts, admin, alice, bob, treasury };
}

describe("MotorHeadsParts", function () {
  it("owner saves parts on-chain, pays the fee, bumps revision, emits events", async function () {
    const { parts, alice } = await deployFixture();
    await expect(parts.connect(alice).applyParts(1, sampleParts(), { value: FEE }))
      .to.emit(parts, "PartsApplied").withArgs(1, alice.address, 1, 2, FEE)
      .and.to.emit(parts, "MetadataUpdate").withArgs(1);

    expect(await parts.buildRevision(1)).to.equal(1n);
    expect(await parts.partCountOf(1)).to.equal(2n);

    const stored = await parts.partsOf(1);
    expect(stored.length).to.equal(2);
    expect(stored[0].partId).to.equal(7n);
    expect(stored[0].x).to.equal(10n);
    expect(stored[0].y).to.equal(-20n);
    expect(stored[1].partId).to.equal(3n);
    expect(stored[1].rotation).to.equal(90n);
  });

  it("rejects a non-owner", async function () {
    const { parts, bob } = await deployFixture();
    // bob owns #2, not #1
    await expect(parts.connect(bob).applyParts(1, sampleParts(), { value: FEE }))
      .to.be.revertedWith("not owner");
  });

  it("rejects an insufficient fee", async function () {
    const { parts, alice } = await deployFixture();
    await expect(parts.connect(alice).applyParts(1, sampleParts(), { value: FEE - 1n }))
      .to.be.revertedWith("fee too low");
  });

  it("keeps only the fee and refunds any overpayment", async function () {
    const { parts, alice } = await deployFixture();
    const over = FEE + ethers.parseEther("0.01");
    await parts.connect(alice).applyParts(1, sampleParts(), { value: over });
    // contract kept exactly the fee; the extra was refunded to alice
    expect(await ethers.provider.getBalance(await parts.getAddress())).to.equal(FEE);
  });

  it("a second save replaces the layout and increments the revision", async function () {
    const { parts, alice } = await deployFixture();
    await parts.connect(alice).applyParts(1, sampleParts(), { value: FEE });
    await parts.connect(alice).applyParts(
      1,
      [{ partId: 9, x: 0, y: 0, scale: 1000, rotation: 0, color: 0 }],
      { value: FEE }
    );
    expect(await parts.buildRevision(1)).to.equal(2n);
    expect(await parts.partCountOf(1)).to.equal(1n);
    expect((await parts.partsOf(1))[0].partId).to.equal(9n);
  });

  it("fees accrue and withdraw sweeps them to the treasury", async function () {
    const { parts, alice, bob, treasury } = await deployFixture();
    await parts.connect(alice).applyParts(1, sampleParts(), { value: FEE });
    await parts.connect(bob).applyParts(2, sampleParts(), { value: FEE });
    expect(await ethers.provider.getBalance(await parts.getAddress())).to.equal(FEE * 2n);

    const before = await ethers.provider.getBalance(treasury.address);
    await parts.connect(alice).withdraw(); // anyone may trigger; funds can only go to treasury
    const after = await ethers.provider.getBalance(treasury.address);
    expect(after - before).to.equal(FEE * 2n);
    expect(await ethers.provider.getBalance(await parts.getAddress())).to.equal(0n);
  });

  it("admin can set the fee; a non-admin cannot", async function () {
    const { parts, admin, alice } = await deployFixture();
    const newFee = ethers.parseEther("0.0005");
    await expect(parts.connect(admin).setEditFee(newFee)).to.emit(parts, "EditFeeSet").withArgs(newFee);
    expect(await parts.editFeeWei()).to.equal(newFee);
    await expect(parts.connect(alice).setEditFee(newFee)).to.be.reverted; // AccessControl custom error
  });

  it("rejects more than MAX_PARTS", async function () {
    const { parts, alice } = await deployFixture();
    const many = Array.from({ length: 65 }, (_, i) => ({ partId: i, x: 0, y: 0, scale: 1000, rotation: 0, color: 0 }));
    await expect(parts.connect(alice).applyParts(1, many, { value: FEE })).to.be.revertedWith("too many parts");
  });

  it("pausing blocks saves; unpausing restores them", async function () {
    const { parts, admin, alice } = await deployFixture();
    await parts.connect(admin).pause();
    await expect(parts.connect(alice).applyParts(1, sampleParts(), { value: FEE })).to.be.reverted; // EnforcedPause
    await parts.connect(admin).unpause();
    await expect(parts.connect(alice).applyParts(1, sampleParts(), { value: FEE })).to.emit(parts, "PartsApplied");
  });
});
