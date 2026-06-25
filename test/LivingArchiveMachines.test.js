const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

async function deployFixture() {
  const [admin, alice, bob] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("LivingArchiveMachines");
  const nft = await Factory.deploy(
    admin.address,
    "ipfs://metadata/",
    "ipfs://contract/contract.json",
    ethers.parseEther("0.03")
  );
  await nft.waitForDeployment();
  return { nft, admin, alice, bob };
}

describe("LivingArchiveMachines", function () {
  it("mint sets mintedAt, birthBlock, ownerSince, and fixed traits", async function () {
    const { nft, alice } = await deployFixture();

    await expect(nft.adminMint(alice.address, 1))
      .to.emit(nft, "MachineMinted")
      .withArgs(1, alice.address)
      .and.to.emit(nft, "MetadataUpdate")
      .withArgs(1);

    expect(await nft.ownerOf(1)).to.equal(alice.address);
    expect(await nft.mintedAt(1)).to.be.greaterThan(0n);
    expect(await nft.birthBlock(1)).to.be.greaterThan(0n);
    expect(await nft.ownerSince(1)).to.equal(await nft.mintedAt(1));

    const traits = await nft.fixedTraits(1);
    expect(traits.head).to.equal(1n);
  });

  it("returns OpenSea/IPFS metadata json tokenURI", async function () {
    const { nft, alice } = await deployFixture();
    await nft.adminMint(alice.address, 1);

    expect(await nft.tokenURI(1)).to.equal("ipfs://metadata/1.json");
    expect(await nft.contractURI()).to.equal("ipfs://contract/contract.json");
  });

  it("transfer increments transferCount, resets ownerSince, and never resets mintedAt", async function () {
    const { nft, alice, bob } = await deployFixture();
    await nft.adminMint(alice.address, 1);
    const mintedAt = await nft.mintedAt(1);
    const oldOwnerSince = await nft.ownerSince(1);

    await time.increase(90);
    await expect(nft.connect(alice).transferFrom(alice.address, bob.address, 1))
      .to.emit(nft, "MetadataUpdate")
      .withArgs(1);

    expect(await nft.transferCount(1)).to.equal(1n);
    expect(await nft.ownerSince(1)).to.be.greaterThan(oldOwnerSince);
    expect(await nft.mintedAt(1)).to.equal(mintedAt);
  });

  it("highestVerifiedSaleWei only increases", async function () {
    const { nft, alice } = await deployFixture();
    await nft.adminMint(alice.address, 1);

    await expect(nft.recordVerifiedSale(1, ethers.parseEther("2")))
      .to.emit(nft, "VerifiedSaleRecorded")
      .withArgs(1, ethers.parseEther("2"))
      .and.to.emit(nft, "MetadataUpdate")
      .withArgs(1);

    await nft.recordVerifiedSale(1, ethers.parseEther("1"));
    expect(await nft.highestVerifiedSaleWei(1)).to.equal(ethers.parseEther("2"));
  });

  it("unlock flags can be set and unset", async function () {
    const { nft, alice } = await deployFixture();
    await nft.adminMint(alice.address, 1);

    await expect(nft.setUnlockFlag(1, 3, true))
      .to.emit(nft, "UnlockFlagSet")
      .withArgs(1, 3, true)
      .and.to.emit(nft, "MetadataUpdate")
      .withArgs(1);
    expect(await nft.unlockFlags(1)).to.equal(8n);

    await expect(nft.setUnlockFlag(1, 3, false))
      .to.emit(nft, "UnlockFlagSet")
      .withArgs(1, 3, false)
      .and.to.emit(nft, "MetadataUpdate")
      .withArgs(1);
    expect(await nft.unlockFlags(1)).to.equal(0n);
  });

  it("globalPhase changes and emits batch metadata update", async function () {
    const { nft, alice } = await deployFixture();
    await nft.adminMint(alice.address, 2);

    await expect(nft.setGlobalPhase(2))
      .to.emit(nft, "GlobalPhaseSet")
      .withArgs(2)
      .and.to.emit(nft, "BatchMetadataUpdate")
      .withArgs(1, 2);

    expect(await nft.globalPhase()).to.equal(2n);
  });

  it("fixed traits can be updated before lock and not after", async function () {
    const { nft, alice } = await deployFixture();
    await nft.adminMint(alice.address, 1);
    const traits = {
      chassis: 1,
      head: 2,
      expression: 3,
      clothes: 1,
      hat: 2,
      chestAccessory: 1,
      armItem: 1,
      background: 0,
      core: 2
    };

    await expect(nft.setFixedTraits(1, traits))
      .to.emit(nft, "FixedTraitsSet")
      .withArgs(1, anyValue)
      .and.to.emit(nft, "MetadataUpdate")
      .withArgs(1);
    expect((await nft.fixedTraits(1)).head).to.equal(2n);

    await expect(nft.lockFixedTraits())
      .to.emit(nft, "BatchMetadataUpdate")
      .withArgs(1, 1);
    await expect(nft.setFixedTraits(1, traits)).to.be.revertedWith("traits locked");
  });
});
