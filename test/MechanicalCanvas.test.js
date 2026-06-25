const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

async function deployFixture() {
  const [admin, alice, bob] = await ethers.getSigners();
  const Contract = await ethers.getContractFactory("MechanicalCanvas");
  const nft = await upgrades.deployProxy(
    Contract,
    [
      admin.address,
      "Mechanical Canvas Machines",
      "MCM",
      3333,
      ethers.parseEther("0.03"),
      "ipfs://preview/",
      "ipfs://renderer/index.html",
      "ipfs://contract/contract.json"
    ],
    { initializer: "initialize", kind: "uups" }
  );
  await nft.waitForDeployment();
  return { nft, admin, alice, bob };
}

describe("MechanicalCanvas", function () {
  it("mints and stores a machine state", async function () {
    const { nft, alice } = await deployFixture();
    await expect(nft.connect(alice).mint(1, { value: ethers.parseEther("0.03") }))
      .to.emit(nft, "MachineMinted")
      .withArgs(1, alice.address, anyValue, anyValue);

    expect(await nft.ownerOf(1)).to.equal(alice.address);
    const machine = await nft.machine(1);
    expect(machine.seed).to.not.equal(0n);
    expect(machine.liquid.fillLevel).to.be.greaterThan(0n);
  });

  it("updates oil and build state", async function () {
    const { nft, alice } = await deployFixture();
    await nft.connect(alice).mint(1, { value: ethers.parseEther("0.03") });

    await expect(nft.connect(alice).changeOil(1, 2, 5, 3, 80))
      .to.emit(nft, "OilChanged")
      .withArgs(1, 2, 5, 3);

    const layoutURI = "ipfs://layout/0001.json";
    const layoutHash = ethers.keccak256(ethers.toUtf8Bytes("layout"));
    await expect(nft.connect(alice).publishBuild(1, layoutURI, layoutHash, 88))
      .to.emit(nft, "BuildPublished");

    const machine = await nft.machine(1);
    expect(machine.liquid.liquidType).to.equal(2n);
    expect(machine.layoutURI).to.equal(layoutURI);
    expect(machine.partCount).to.equal(88n);
    expect(machine.buildRevision).to.equal(1n);
  });

  it("increments transfer count on normal transfer", async function () {
    const { nft, alice, bob } = await deployFixture();
    await nft.connect(alice).mint(1, { value: ethers.parseEther("0.03") });

    await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
    const machine = await nft.machine(1);
    expect(machine.transferCount).to.equal(1n);
  });
});

