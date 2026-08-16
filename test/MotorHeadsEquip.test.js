const { expect } = require("chai");
const { ethers } = require("hardhat");

// Same 0.0005 ETH as the live canvas save fee (the equip fee is initialised to match).
const FEE = ethers.parseEther("0.0005");
const EFFECT = 5;      // molten (effects 1..12)
const BACKGROUND = 13; // nebula  (backgrounds 13..24)

async function deployFixture() {
  const [admin, alice, bob, treasury] = await ethers.getSigners();

  // Live collection stand-in (ownership source of truth). token #1 -> alice, #2 -> bob.
  const Collection = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Collection.deploy(admin.address, "ipfs://metadata/", "ipfs://contract/contract.json", ethers.parseEther("0.03"));
  await nft.waitForDeployment();
  await nft.adminMint(alice.address, 1);
  await nft.adminMint(bob.address, 1);

  // Real ERC-1155 parts; admin gets MINTER so the test can seed a garage's inventory.
  const Parts = await ethers.getContractFactory("ScrapParts");
  const parts = await Parts.deploy(admin.address, "https://motorheadsonline.com/parts/{id}.json");
  await parts.waitForDeployment();
  await parts.connect(admin).grantRole(await parts.MINTER_ROLE(), admin.address);

  // Garage registry: token #1's garage is a dedicated address we can mint parts into.
  const Registry = await ethers.getContractFactory("MockGarageRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const garage1 = ethers.Wallet.createRandom().address;
  const garage2 = ethers.Wallet.createRandom().address;
  await registry.setGarage(1, garage1);
  await registry.setGarage(2, garage2);

  // token #1's garage owns molten (5) + nebula (13); token #2's garage owns nothing.
  await parts.connect(admin).mint(garage1, EFFECT, 1);
  await parts.connect(admin).mint(garage1, BACKGROUND, 1);

  const Equip = await ethers.getContractFactory("MotorHeadsEquip");
  const equip = await Equip.deploy(
    admin.address,
    await nft.getAddress(),
    await registry.getAddress(),
    await parts.getAddress(),
    treasury.address,
    FEE
  );
  await equip.waitForDeployment();

  return { nft, parts, registry, equip, admin, alice, bob, treasury, garage1, garage2 };
}

describe("MotorHeadsEquip", function () {
  it("owner equips an owned effect + background, pays the fee, bumps revision, emits events", async function () {
    const { equip, alice } = await deployFixture();
    await expect(equip.connect(alice).equip(1, EFFECT, BACKGROUND, { value: FEE }))
      .to.emit(equip, "Equipped").withArgs(1, alice.address, EFFECT, BACKGROUND, 1, FEE)
      .and.to.emit(equip, "MetadataUpdate").withArgs(1);

    expect(await equip.equippedEffect(1)).to.equal(BigInt(EFFECT));
    expect(await equip.equippedBackground(1)).to.equal(BigInt(BACKGROUND));
    expect(await equip.equipRevision(1)).to.equal(1n);
    const [e, b] = await equip.equippedOf(1);
    expect(e).to.equal(BigInt(EFFECT));
    expect(b).to.equal(BigInt(BACKGROUND));
  });

  it("keeps the part — equipping never burns it, so it can be re-equipped", async function () {
    const { equip, parts, alice, garage1 } = await deployFixture();
    await equip.connect(alice).equip(1, EFFECT, 0, { value: FEE });
    expect(await parts.balanceOf(garage1, EFFECT)).to.equal(1n); // still owned
    await equip.connect(alice).equip(1, 0, 0, { value: FEE });   // unequip
    expect(await equip.equippedEffect(1)).to.equal(0n);
    await equip.connect(alice).equip(1, EFFECT, 0, { value: FEE }); // re-equip works
    expect(await equip.equippedEffect(1)).to.equal(BigInt(EFFECT));
    expect(await equip.equipRevision(1)).to.equal(3n);
  });

  it("clears a slot with id 0 (unequip) and skips the ownership check", async function () {
    const { equip, alice } = await deployFixture();
    await equip.connect(alice).equip(1, EFFECT, BACKGROUND, { value: FEE });
    await expect(equip.connect(alice).equip(1, 0, 0, { value: FEE })).to.emit(equip, "Equipped").withArgs(1, alice.address, 0, 0, 2, FEE);
    expect(await equip.equippedEffect(1)).to.equal(0n);
    expect(await equip.equippedBackground(1)).to.equal(0n);
  });

  it("rejects a non-owner", async function () {
    const { equip, bob } = await deployFixture();
    await expect(equip.connect(bob).equip(1, EFFECT, 0, { value: FEE })).to.be.revertedWith("not owner");
  });

  it("rejects an insufficient fee", async function () {
    const { equip, alice } = await deployFixture();
    await expect(equip.connect(alice).equip(1, EFFECT, 0, { value: FEE - 1n })).to.be.revertedWith("fee too low");
  });

  it("rejects equipping a part the garage does not own", async function () {
    const { equip, bob } = await deployFixture();
    // token #2's garage owns nothing
    await expect(equip.connect(bob).equip(2, EFFECT, 0, { value: FEE })).to.be.revertedWith("effect not owned");
    await expect(equip.connect(bob).equip(2, 0, BACKGROUND, { value: FEE })).to.be.revertedWith("background not owned");
  });

  it("rejects out-of-range ids", async function () {
    const { equip, parts, admin, alice, garage1 } = await deployFixture();
    // give the garage a part at id 13 and 99 so ownership passes and only the RANGE check fires
    await parts.connect(admin).mint(garage1, 99, 1);
    await expect(equip.connect(alice).equip(1, 13, 0, { value: FEE })).to.be.revertedWith("bad effect");        // 13 is a background id, not an effect
    await expect(equip.connect(alice).equip(1, 0, 5, { value: FEE })).to.be.revertedWith("bad background");     // 5 is an effect id, not a background
    await expect(equip.connect(alice).equip(1, 99, 0, { value: FEE })).to.be.revertedWith("bad effect");        // out of both ranges
  });

  it("refunds overpayment and holds exactly the fee", async function () {
    const { equip, alice } = await deployFixture();
    const before = await ethers.provider.getBalance(await equip.getAddress());
    await equip.connect(alice).equip(1, EFFECT, 0, { value: FEE + ethers.parseEther("1") });
    const after = await ethers.provider.getBalance(await equip.getAddress());
    expect(after - before).to.equal(FEE); // only the fee is retained
  });

  it("withdraw sweeps accrued fees to the treasury", async function () {
    const { equip, alice, treasury } = await deployFixture();
    await equip.connect(alice).equip(1, EFFECT, BACKGROUND, { value: FEE });
    const tBefore = await ethers.provider.getBalance(treasury.address);
    await equip.connect(alice).withdraw(); // open to anyone; funds only go to treasury
    const tAfter = await ethers.provider.getBalance(treasury.address);
    expect(tAfter - tBefore).to.equal(FEE);
    expect(await ethers.provider.getBalance(await equip.getAddress())).to.equal(0n);
  });

  it("grandfather (admin) seeds equipped ids with no fee and no ownership check; non-admin blocked", async function () {
    const { equip, admin, bob } = await deployFixture();
    await expect(equip.connect(bob).grandfather([1], [EFFECT], [0])).to.be.reverted; // not CONFIG_ROLE
    await expect(equip.connect(admin).grandfather([1, 2], [2, 0], [0, 20]))
      .to.emit(equip, "Equipped").withArgs(1, admin.address, 2, 0, 1, 0)
      .and.to.emit(equip, "Equipped").withArgs(2, admin.address, 0, 20, 1, 0);
    expect(await equip.equippedEffect(1)).to.equal(2n);
    expect(await equip.equippedBackground(2)).to.equal(20n);
  });

  it("grandfather rejects mismatched array lengths", async function () {
    const { equip, admin } = await deployFixture();
    await expect(equip.connect(admin).grandfather([1, 2], [EFFECT], [0])).to.be.revertedWith("length mismatch");
  });

  it("pause blocks equip; unpause restores it", async function () {
    const { equip, admin, alice } = await deployFixture();
    await equip.connect(admin).pause();
    await expect(equip.connect(alice).equip(1, EFFECT, 0, { value: FEE })).to.be.reverted;
    await equip.connect(admin).unpause();
    await expect(equip.connect(alice).equip(1, EFFECT, 0, { value: FEE })).to.emit(equip, "Equipped");
  });

  it("admin can adjust the fee + treasury", async function () {
    const { equip, admin, alice } = await deployFixture();
    const newFee = ethers.parseEther("0.001");
    await expect(equip.connect(admin).setEquipFee(newFee)).to.emit(equip, "EquipFeeSet").withArgs(newFee);
    expect(await equip.equipFeeWei()).to.equal(newFee);
    await expect(equip.connect(alice).equip(1, EFFECT, 0, { value: FEE })).to.be.revertedWith("fee too low"); // old fee now too low
    await expect(equip.connect(admin).setTreasury(alice.address)).to.emit(equip, "TreasurySet").withArgs(alice.address);
    expect(await equip.treasury()).to.equal(alice.address);
    await expect(equip.connect(alice).setEquipFee(1)).to.be.reverted; // non-admin
  });
});
