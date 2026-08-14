const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("CrateDistributor (Merkle crate airdrop)", () => {
  async function setup() {
    const [admin, a, b, c] = await ethers.getSigners();
    const mock = await (await ethers.getContractFactory("MockCrates")).deploy();
    const dist = await (await ethers.getContractFactory("CrateDistributor")).deploy(await mock.getAddress(), 1, admin.address);
    // Snapshot: a gets 3 crates, b gets 1 (mirrors "1 crate per NFT owned").
    const rows = [[a.address, "3"], [b.address, "1"]];
    const tree = StandardMerkleTree.of(rows, ["address", "uint256"]);
    return { admin, a, b, c, mock, dist, tree };
  }

  it("claims mint exactly the proven amount, only once", async () => {
    const { a, b, c, mock, dist, tree } = await setup();
    await dist.setMerkleRoot(tree.root);
    const proofA = tree.getProof([a.address, "3"]);
    const proofB = tree.getProof([b.address, "1"]);

    await dist.connect(a).claim(3, proofA);
    expect(await mock.balanceOf(a.address, 1)).to.equal(3);

    // double-claim blocked
    await expect(dist.connect(a).claim(3, proofA)).to.be.revertedWith("already claimed");
    // wrong amount → proof fails
    await expect(dist.connect(b).claim(2, proofB)).to.be.revertedWith("bad proof");
    // not in the tree → proof fails
    await expect(dist.connect(c).claim(1, proofB)).to.be.revertedWith("bad proof");

    await dist.connect(b).claim(1, proofB);
    expect(await mock.balanceOf(b.address, 1)).to.equal(1);
  });

  it("canClaim reflects eligibility + claimed state", async () => {
    const { a, mock, dist, tree } = await setup();
    await dist.setMerkleRoot(tree.root);
    const proofA = tree.getProof([a.address, "3"]);
    expect(await dist.canClaim(a.address, 3, proofA)).to.equal(true);
    await dist.connect(a).claim(3, proofA);
    expect(await dist.canClaim(a.address, 3, proofA)).to.equal(false);
  });

  it("startNewRound resets claim eligibility", async () => {
    const { a, mock, dist, tree } = await setup();
    await dist.setMerkleRoot(tree.root);
    const proofA = tree.getProof([a.address, "3"]);
    await dist.connect(a).claim(3, proofA);

    // new round, same tree → a can claim again
    await dist.startNewRound(tree.root);
    expect(await dist.round()).to.equal(1n);
    await dist.connect(a).claim(3, proofA);
    expect(await mock.balanceOf(a.address, 1)).to.equal(6);
  });

  it("pause blocks claims; unpause restores", async () => {
    const { a, dist, tree } = await setup();
    await dist.setMerkleRoot(tree.root);
    const proofA = tree.getProof([a.address, "3"]);
    await dist.pause();
    await expect(dist.connect(a).claim(3, proofA)).to.be.revertedWithCustomError(dist, "EnforcedPause");
    await dist.unpause();
    await dist.connect(a).claim(3, proofA);
  });

  it("only CONFIG_ROLE can set root / crateId / pause", async () => {
    const { a, dist, tree } = await setup();
    await expect(dist.connect(a).setMerkleRoot(tree.root)).to.be.revertedWithCustomError(dist, "AccessControlUnauthorizedAccount");
    await expect(dist.connect(a).setCrateId(2)).to.be.revertedWithCustomError(dist, "AccessControlUnauthorizedAccount");
    await expect(dist.connect(a).pause()).to.be.revertedWithCustomError(dist, "AccessControlUnauthorizedAccount");
  });

  it("rejects claim before any root is set", async () => {
    const { a, dist, tree } = await setup();
    const proofA = tree.getProof([a.address, "3"]);
    await expect(dist.connect(a).claim(3, proofA)).to.be.revertedWith("no root");
  });
});
