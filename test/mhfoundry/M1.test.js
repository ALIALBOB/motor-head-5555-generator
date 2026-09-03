// Milestone 1 — MotorHeads Foundry (Robinhood 3D): MHToken + WeightRegistry + RobotNFT
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const E = (n) => ethers.parseEther(String(n));

describe("MHFoundry · Milestone 1", () => {
  let owner, treasury, alice, bob, carol;

  beforeEach(async () => {
    [owner, treasury, alice, bob, carol] = await ethers.getSigners();
  });

  // ─────────────────────────────────────────────── MHToken
  describe("MHToken ($TOKEN)", () => {
    let tok;
    beforeEach(async () => {
      const T = await ethers.getContractFactory("MHToken");
      tok = await T.deploy("MotorHeads","MHDS",treasury.address, owner.address);
      await tok.waitForDeployment();
    });

    it("mints the full 1B fixed supply to treasury", async () => {
      const supply = E(1_000_000_000);
      expect(await tok.totalSupply()).to.equal(supply);
      expect(await tok.balanceOf(treasury.address)).to.equal(supply);
      expect(await tok.name()).to.equal("MotorHeads");
      expect(await tok.symbol()).to.equal("MHDS");
    });

    it("is burnable (deflation), reducing total supply", async () => {
      await tok.connect(treasury).transfer(alice.address, E(100));
      await tok.connect(alice).burn(E(40));
      expect(await tok.balanceOf(alice.address)).to.equal(E(60));
      expect(await tok.totalSupply()).to.equal(E(1_000_000_000) - E(40));
    });

    it("has no post-deploy mint function (supply is fixed)", async () => {
      expect(tok.mint).to.be.undefined;
      expect(tok.interface.fragments.some((f) => f.type === "function" && f.name === "mint")).to.equal(false);
    });
  });

  // ─────────────────────────────────────────────── WeightRegistry
  describe("WeightRegistry", () => {
    let reg;
    beforeEach(async () => {
      const R = await ethers.getContractFactory("WeightRegistry");
      reg = await R.deploy(owner.address);
      await reg.waitForDeployment();
      await reg.grantRole(await reg.UPGRADE_ROLE(), owner.address);
      await reg.grantRole(await reg.BURN_ROLE(), owner.address);
    });

    it("activates a robot: sets tier/weight/activated + totalWeight", async () => {
      await reg.setTier(1, 1, 100);
      const r = await reg.robots(1);
      expect(r.tier).to.equal(1);
      expect(r.baseWeight).to.equal(100);
      expect(r.activated).to.equal(true);
      expect(await reg.totalWeight()).to.equal(100);
      expect(await reg.isActivated(1)).to.equal(true);
      expect(await reg.weightOf(1)).to.equal(100);
    });

    it("upgrade replaces weight and keeps totalWeight correct", async () => {
      await reg.setTier(1, 1, 100);
      await reg.setTier(2, 1, 100);
      expect(await reg.totalWeight()).to.equal(200);
      await reg.setTier(1, 3, 600); // upgrade token 1
      expect(await reg.totalWeight()).to.equal(700); // 600 + 100
      expect((await reg.robots(1)).tier).to.equal(3);
    });

    it("sets burn milestone + skin", async () => {
      await reg.setBurn(1, 100, 4); // Gold
      const r = await reg.robots(1);
      expect(r.burnCount).to.equal(100);
      expect(r.skin).to.equal(4);
    });

    it("gates setters by role", async () => {
      await expect(reg.connect(alice).setTier(1, 1, 100)).to.be.reverted;
      await expect(reg.connect(alice).setBurn(1, 10, 1)).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────────── RobotNFT
  describe("RobotNFT (MH3D)", () => {
    let nft;
    const PRICE = E("0.01");
    const MAX = 5;

    beforeEach(async () => {
      const N = await ethers.getContractFactory("RobotNFT");
      nft = await N.deploy(MAX, PRICE, treasury.address, 1000n, owner.address); // 10% royalty
      await nft.waitForDeployment();
    });

    it("public mint: gated until open, charges fee, 1-indexed, emits", async () => {
      await expect(nft.connect(alice).publicMint({ value: PRICE })).to.be.revertedWith("public closed");
      await nft.setPublicOpen(true);
      await expect(nft.connect(alice).publicMint({ value: PRICE }))
        .to.emit(nft, "Minted").withArgs(alice.address, 1);
      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.totalMinted()).to.equal(1);
    });

    it("public mint reverts on insufficient fee", async () => {
      await nft.setPublicOpen(true);
      await expect(nft.connect(alice).publicMint({ value: E("0.005") })).to.be.revertedWith("insufficient fee");
    });

    it("allowlist mint: proof works, non-allowlisted + double-claim revert", async () => {
      const tree = StandardMerkleTree.of([[alice.address], [bob.address]], ["address"]);
      await nft.setAllowlistRoot(tree.root);
      const proofA = tree.getProof([alice.address]);

      await expect(nft.connect(alice).allowlistMint(proofA, { value: PRICE }))
        .to.emit(nft, "Minted").withArgs(alice.address, 1);
      // double claim
      await expect(nft.connect(alice).allowlistMint(proofA, { value: PRICE })).to.be.revertedWith("already claimed");
      // carol not in tree, using alice's proof
      await expect(nft.connect(carol).allowlistMint(proofA, { value: PRICE })).to.be.revertedWith("not allowlisted");
    });

    it("enforces max supply (sold out)", async () => {
      await nft.setPublicOpen(true);
      for (let i = 0; i < MAX; i++) await nft.connect(alice).publicMint({ value: PRICE });
      expect(await nft.totalMinted()).to.equal(MAX);
      await expect(nft.connect(alice).publicMint({ value: PRICE })).to.be.revertedWith("sold out");
    });

    it("ownerMint: owner batch-mints to any address, bypassing publicOpen + price, respecting supply + owner-gate", async () => {
      // public sale still CLOSED, no fee paid — non-owner blocked
      await expect(nft.connect(alice).ownerMint(alice.address, 2)).to.be.reverted;
      await expect(nft.ownerMint(ethers.ZeroAddress, 1)).to.be.revertedWith("to=0");
      await expect(nft.ownerMint(treasury.address, 0)).to.be.revertedWith("qty=0");
      await nft.ownerMint(treasury.address, 3); // no value sent, publicOpen=false
      expect(await nft.totalMinted()).to.equal(3);
      expect(await nft.ownerOf(1)).to.equal(treasury.address);
      expect(await nft.ownerOf(3)).to.equal(treasury.address);
      // respects immutable maxSupply (MAX=5): 3 minted, +3 more (total 6) reverts, +2 fills exactly
      await expect(nft.ownerMint(treasury.address, 3)).to.be.revertedWith("sold out");
      await nft.ownerMint(treasury.address, 2);
      expect(await nft.totalMinted()).to.equal(5);
    });

    it("ownerMint respects the pause switch", async () => {
      await nft.pause();
      await expect(nft.ownerMint(treasury.address, 1)).to.be.reverted; // whenNotPaused
      await nft.unpause();
      await nft.ownerMint(treasury.address, 1);
      expect(await nft.totalMinted()).to.equal(1);
    });

    it("reports ERC2981 royalty (10%)", async () => {
      const [recv, amt] = await nft.royaltyInfo(1, E(1));
      expect(recv).to.equal(treasury.address);
      expect(amt).to.equal(E("0.1"));
    });

    it("dynamic tokenURI = baseURI + id", async () => {
      await nft.setPublicOpen(true);
      await nft.connect(alice).publicMint({ value: PRICE });
      expect(await nft.tokenURI(1)).to.equal("");
      await nft.setBaseURI("https://mh3d.worker/meta/");
      expect(await nft.tokenURI(1)).to.equal("https://mh3d.worker/meta/1");
      await expect(nft.tokenURI(999)).to.be.revertedWith("nonexistent");
    });

    it("pause blocks minting", async () => {
      await nft.setPublicOpen(true);
      await nft.pause();
      await expect(nft.connect(alice).publicMint({ value: PRICE })).to.be.reverted;
      await nft.unpause();
      await nft.connect(alice).publicMint({ value: PRICE });
      expect(await nft.totalMinted()).to.equal(1);
    });

    it("owner withdraws collected mint ETH", async () => {
      await nft.setPublicOpen(true);
      await nft.connect(alice).publicMint({ value: PRICE });
      await nft.connect(bob).publicMint({ value: PRICE });
      const bal0 = await ethers.provider.getBalance(carol.address);
      await nft.withdraw(carol.address);
      expect(await ethers.provider.getBalance(carol.address)).to.equal(bal0 + PRICE * 2n);
      expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0n);
    });

    it("supportsInterface: ERC721 + ERC2981", async () => {
      expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
      expect(await nft.supportsInterface("0x2a55205a")).to.equal(true); // ERC2981
    });
  });
});
