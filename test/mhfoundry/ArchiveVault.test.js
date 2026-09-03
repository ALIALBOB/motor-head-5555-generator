// ArchiveVault — Ethereum escrow that LOCKS a 333 while attached (can't sell until withdrawn).
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MHFoundry · ArchiveVault (lock-a-333-while-attached escrow)", () => {
  let owner, holder, buyer, signer, other;
  let archive, vault, domain;
  const TYPES = { Withdraw: [
    { name: "depositor", type: "address" }, { name: "archiveId", type: "uint256" },
    { name: "nonce", type: "bytes32" }, { name: "deadline", type: "uint256" }] };
  const rnd = () => ethers.hexlify(ethers.randomBytes(32));
  const soon = async () => (await ethers.provider.getBlock("latest")).timestamp + 3600;
  const withdrawVoucher = (v) => signer.signTypedData(domain, TYPES, v);

  async function setup() {
    [owner, holder, buyer, signer, other] = await ethers.getSigners();
    // stand-in ERC-721 for the 333 (RobotNFT has public mint)
    archive = await (await ethers.getContractFactory("RobotNFT")).deploy(1000, 0, owner.address, 1000n, owner.address);
    await archive.setPublicOpen(true);
    await archive.connect(holder).publicMint(); // 333 #1 -> holder
    vault = await (await ethers.getContractFactory("ArchiveVault")).deploy(owner.address, signer.address, await archive.getAddress());
    domain = { name: "MHArchiveVault", version: "1", chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: await vault.getAddress() };
  }

  it("deposit locks the 333: the vault owns it and the holder CANNOT sell it", async () => {
    await setup();
    await archive.connect(holder).approve(await vault.getAddress(), 1);
    await expect(vault.connect(holder).deposit(1)).to.emit(vault, "Deposited").withArgs(holder.address, 1);
    expect(await archive.ownerOf(1)).to.equal(await vault.getAddress());
    expect(await vault.depositorOf(1)).to.equal(holder.address);
    // the holder can no longer transfer/sell it — they don't own it anymore
    await expect(archive.connect(holder).transferFrom(holder.address, buyer.address, 1)).to.be.reverted;
  });

  it("withdraw returns it ONLY with a valid backend voucher (issued after Robinhood detach)", async () => {
    await setup();
    await archive.connect(holder).approve(await vault.getAddress(), 1);
    await vault.connect(holder).deposit(1);
    // no voucher / forged voucher / expired / wrong depositor all revert
    const good = { depositor: holder.address, archiveId: 1, nonce: rnd(), deadline: await soon() };
    await expect(vault.connect(holder).withdraw(1, good.nonce, good.deadline, await other.signTypedData(domain, TYPES, good))).to.be.revertedWith("bad sig");
    const past = (await ethers.provider.getBlock("latest")).timestamp - 1;
    await expect(vault.connect(holder).withdraw(1, rnd(), past, await withdrawVoucher({ ...good, deadline: past }))).to.be.revertedWith("expired");
    await expect(vault.connect(buyer).withdraw(1, rnd(), await soon(), await withdrawVoucher({ ...good, depositor: buyer.address }))).to.be.revertedWith("not your deposit");
    // valid voucher → 333 returned, then re-usable
    const sig = await withdrawVoucher(good);
    await expect(vault.connect(holder).withdraw(1, good.nonce, good.deadline, sig)).to.emit(vault, "Withdrawn").withArgs(holder.address, 1);
    expect(await archive.ownerOf(1)).to.equal(holder.address);
    expect(await vault.depositorOf(1)).to.equal(ethers.ZeroAddress);
    // replay of the same voucher fails (nonce burned) — deposit again first
    await archive.connect(holder).approve(await vault.getAddress(), 1);
    await vault.connect(holder).deposit(1);
    await expect(vault.connect(holder).withdraw(1, good.nonce, good.deadline, sig)).to.be.revertedWith("nonce used");
  });

  it("can't double-deposit; adminReturn is the last-resort escape", async () => {
    await setup();
    await archive.connect(holder).setApprovalForAll(await vault.getAddress(), true);
    await vault.connect(holder).deposit(1);
    await expect(vault.connect(holder).deposit(1)).to.be.reverted; // vault already holds it
    // admin can return a stuck deposit to its depositor (no arbitrary destination)
    await expect(vault.connect(other).adminReturn(1)).to.be.reverted; // not admin
    await vault.connect(owner).adminReturn(1);
    expect(await archive.ownerOf(1)).to.equal(holder.address);
  });
});
