// Coverage-gap fillers — exercise the last untested functions/branches the coverage report flagged:
// ScrapParts mintBatch/burnBatch/supportsInterface, ScrapCrates lootTableAt/unpause/supportsInterface,
// and RewardVault's claim send-failure branch.
const { expect } = require("chai");
const { ethers } = require("hardhat");

const CRATE_ID = 1n;
const Z32 = ethers.ZeroHash;
const ERC1155_ID = "0xd9b67a26";
const ACCESSCONTROL_ID = "0x7965db0b";

describe("COVERAGE — ScrapParts batch + interface", function () {
  async function parts() {
    const [admin, alice, bob] = await ethers.getSigners();
    const p = await (await ethers.getContractFactory("ScrapParts")).deploy(admin.address, "ipfs://p/{id}.json");
    await p.grantRole(await p.MINTER_ROLE(), admin.address);
    return { p, admin, alice, bob };
  }
  it("mintBatch: MINTER mints many ids at once; non-MINTER reverts", async function () {
    const { p, admin, alice } = await parts();
    await expect(p.connect(alice).mintBatch(alice.address, [1, 2], [3, 4])).to.be.reverted;
    await p.connect(admin).mintBatch(alice.address, [1, 2], [3, 4]);
    expect(await p.balanceOf(alice.address, 1)).to.equal(3n);
    expect(await p.balanceOf(alice.address, 2)).to.equal(4n);
  });
  it("burnBatch: owner burns; a non-approved third party cannot", async function () {
    const { p, admin, alice, bob } = await parts();
    await p.connect(admin).mintBatch(alice.address, [1, 2], [3, 4]);
    await expect(p.connect(bob).burnBatch(alice.address, [1], [1])).to.be.revertedWith("not approved");
    await p.connect(alice).burnBatch(alice.address, [1, 2], [1, 2]);
    expect(await p.balanceOf(alice.address, 1)).to.equal(2n);
    expect(await p.balanceOf(alice.address, 2)).to.equal(2n);
  });
  it("supportsInterface answers for ERC-1155 and AccessControl", async function () {
    const { p } = await parts();
    expect(await p.supportsInterface(ERC1155_ID)).to.equal(true);
    expect(await p.supportsInterface(ACCESSCONTROL_ID)).to.equal(true);
    expect(await p.supportsInterface("0xffffffff")).to.equal(false);
  });
});

describe("COVERAGE — ScrapCrates lootTableAt / unpause / interface", function () {
  async function sys() {
    const [admin, alice, , treasury] = await ethers.getSigners();
    const nft = await (await ethers.getContractFactory("LivingArchiveMachines")).deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
    await nft.adminMint(alice.address, 1);
    const parts = await (await ethers.getContractFactory("ScrapParts")).deploy(admin.address, "ipfs://p/{id}.json");
    const registry = await (await ethers.getContractFactory("Mock6551Registry")).deploy();
    const crates = await (await ethers.getContractFactory("ScrapCrates")).deploy(
      admin.address, "ipfs://cr/{id}.json", await nft.getAddress(), await parts.getAddress(),
      await registry.getAddress(), admin.address, Z32, treasury.address, ethers.parseEther("0.003"),
      admin.address /* signer */
    );
    await parts.grantRole(await parts.MINTER_ROLE(), await crates.getAddress());
    await crates.setLootTable(CRATE_ID, [10, 20, 30], [1, 1, 1]); // version 1
    return { crates, admin, alice };
  }
  it("lootTableAt returns a specific immutable version's table", async function () {
    const { crates } = await sys();
    const [partIds, cumWeights, total] = await crates.lootTableAt(1);
    expect(partIds.map(Number)).to.deep.equal([10, 20, 30]);
    expect(cumWeights.map(Number)).to.deep.equal([1, 2, 3]);
    expect(total).to.equal(3n);
  });
  it("unpause re-enables activation after a pause", async function () {
    const { crates, admin, alice } = await sys();
    await crates.connect(admin).pause();
    await expect(crates.connect(alice).activate(1, { value: ethers.parseEther("0.003") })).to.be.reverted;
    await crates.connect(admin).unpause();
    await expect(crates.connect(alice).activate(1, { value: ethers.parseEther("0.003") })).to.emit(crates, "Activated");
  });
  it("supportsInterface answers for ERC-1155 and AccessControl", async function () {
    const { crates } = await sys();
    expect(await crates.supportsInterface(ERC1155_ID)).to.equal(true);
    expect(await crates.supportsInterface(ACCESSCONTROL_ID)).to.equal(true);
  });
});

describe("COVERAGE — RewardVault claim send-failure branch", function () {
  it("claim reverts 'send failed' when the destination rejects ETH (funds not lost)", async function () {
    const [admin, alice, , , funder] = await ethers.getSigners();
    const nft = await (await ethers.getContractFactory("LivingArchiveMachines")).deploy(admin.address, "ipfs://m/", "ipfs://c/c.json", ethers.parseEther("0.03"));
    await nft.adminMint(alice.address, 1); await nft.adminMint(alice.address, 1);
    await nft.adminMint(alice.address, 1); await nft.adminMint(alice.address, 1);
    const reject = await (await ethers.getContractFactory("RejectEthOwner")).deploy(); // no receive()
    const registry = await (await ethers.getContractFactory("Fixed6551Registry")).deploy(await reject.getAddress());
    const vault = await (await ethers.getContractFactory("RewardVault")).deploy(admin.address, await nft.getAddress(), 4, await registry.getAddress(), admin.address, Z32);
    await vault.connect(funder).deposit({ value: ethers.parseEther("4") });
    await expect(vault.connect(alice).claim(1, true)).to.be.revertedWith("send failed"); // to the reverting garage
    expect(await vault.claimable(1)).to.equal(ethers.parseEther("1")); // still owed, not lost
  });
});
