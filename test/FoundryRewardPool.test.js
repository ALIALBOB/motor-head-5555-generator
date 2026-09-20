const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

const E = (n) => ethers.parseEther(String(n));

describe("FoundryRewardPool (ETH reward pool: fund, round by Merkle root, claim by robot owner, owner withdraw)", () => {
  async function setup() {
    const [owner, alice, bob, carol, stranger] = await ethers.getSigners();
    const robots = await (await ethers.getContractFactory("MockRobots")).deploy();
    const pool = await (await ethers.getContractFactory("FoundryRewardPool")).deploy(await robots.getAddress(), owner.address);
    await robots.setOwner(7, alice.address); await robots.setOwner(8, alice.address); await robots.setOwner(20, bob.address); await robots.setOwner(300, carol.address);
    // round 1: weights 6.66 / 1 / 2.5 over 1.016 ETH -> 0.666 / 0.1 / 0.25
    const rows = [["1", "7", E("0.666").toString()], ["1", "8", E("0.1").toString()], ["1", "20", E("0.25").toString()]];
    const tree = StandardMerkleTree.of(rows, ["uint256", "uint256", "uint256"]);
    const proof = (id) => tree.getProof(rows.find((r) => r[1] === String(id)));
    const amount = (id) => rows.find((r) => r[1] === String(id))[2];
    return { owner, alice, bob, carol, stranger, robots, pool, tree, proof, amount, rows };
  }
  const fund = (pool, from, eth) => from.sendTransaction({ to: pool.getAddress ? undefined : pool, value: E(eth) });

  it("is funded by a plain transfer; a round can only reserve ETH that is really there", async () => {
    const { owner, stranger, pool, tree } = await setup(); const addr = await pool.getAddress();
    await expect(pool.openRound(tree.root, E("1.016"), 1)).to.be.revertedWith("pool not funded");
    await expect(owner.sendTransaction({ to: addr, value: E("1") })).to.emit(pool, "Funded").withArgs(owner.address, E("1"));
    await stranger.sendTransaction({ to: addr, value: E("0.5") });                       // anyone may add to the pool
    expect(await pool.available()).to.equal(E("1.5"));
    await expect(pool.connect(stranger).openRound(tree.root, E("1"), 1)).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    await expect(pool.openRound(ethers.ZeroHash, E("1"), 1)).to.be.revertedWith("root=0");
    await expect(pool.openRound(tree.root, 0, 1)).to.be.revertedWith("bad total");
    await expect(pool.openRound(tree.root, E("1.016"), 2)).to.be.revertedWith("wrong round id");   // a tree built for another round id
    await expect(pool.openRound(tree.root, E("1.016"), 1)).to.emit(pool, "RoundOpened").withArgs(1, tree.root, E("1.016"));
    expect(await pool.reserved()).to.equal(E("1.016")); expect(await pool.available()).to.equal(E("0.484"));
    await expect(pool.openRound(tree.root, E("0.5"), 2)).to.be.revertedWith("pool not funded");      // only 0.484 is free
  });

  it("pays the robot's CURRENT owner the proven amount, once; several robots in one transaction", async () => {
    const { owner, alice, bob, robots, pool, tree, proof, amount } = await setup(); const addr = await pool.getAddress();
    await owner.sendTransaction({ to: addr, value: E("2") }); await pool.openRound(tree.root, E("1.016"), 1);
    // alice claims #7 and #8 together
    await expect(pool.connect(alice).claim(1, [7, 8], [amount(7), amount(8)], [proof(7), proof(8)])).to.changeEtherBalances([alice, pool], [E("0.766"), -E("0.766")]);
    expect(await pool.isClaimed(1, 7)).to.equal(true); expect(await pool.isClaimed(1, 20)).to.equal(false);
    await expect(pool.connect(alice).claim(1, [7], [amount(7)], [proof(7)])).to.be.revertedWith("already claimed");
    // an unclaimed share travels with the NFT: bob sells #20 to alice before claiming
    await robots.setOwner(20, alice.address);
    await expect(pool.connect(bob).claim(1, [20], [amount(20)], [proof(20)])).to.be.revertedWith("not the owner");
    await expect(pool.connect(alice).claim(1, [20], [amount(20)], [proof(20)])).to.changeEtherBalance(alice, E("0.25"));
    const info = await pool.roundInfo(1); expect(info.claimed).to.equal(E("1.016")); expect(await pool.reserved()).to.equal(0n);
  });

  it("refuses every claim that is not exactly a leaf of that round", async () => {
    const { owner, alice, carol, pool, tree, proof, amount } = await setup(); const addr = await pool.getAddress();
    await owner.sendTransaction({ to: addr, value: E("2") }); await pool.openRound(tree.root, E("1.016"), 1);
    await expect(pool.connect(alice).claim(1, [7], [E("0.667")], [proof(7)])).to.be.revertedWith("bad proof");          // a bigger amount
    await expect(pool.connect(alice).claim(1, [8], [amount(7)], [proof(7)])).to.be.revertedWith("bad proof");           // another robot's leaf
    await expect(pool.connect(carol).claim(1, [300], [E("1")], [proof(7)])).to.be.revertedWith("bad proof");            // a robot that is not in the round
    await expect(pool.connect(alice).claim(1, [7, 7], [amount(7), amount(7)], [proof(7), proof(7)])).to.be.revertedWith("already claimed");   // the same robot twice in one call
    await expect(pool.connect(alice).claim(1, [], [], [])).to.be.revertedWith("bad arrays");
    await expect(pool.connect(alice).claim(1, [7], [amount(7), amount(8)], [proof(7)])).to.be.revertedWith("bad arrays");
    await expect(pool.connect(alice).claim(2, [7], [amount(7)], [proof(7)])).to.be.revertedWith("no such round");
    await expect(pool.connect(alice).claim(0, [7], [amount(7)], [proof(7)])).to.be.revertedWith("no such round");
    expect(await pool.reserved()).to.equal(E("1.016"));                                                               // nothing moved
  });

  it("a leaf of round 1 is worthless in round 2 even under the same root", async () => {
    const { owner, alice, pool, tree, proof, amount } = await setup(); const addr = await pool.getAddress();
    await owner.sendTransaction({ to: addr, value: E("3") }); await pool.openRound(tree.root, E("1.016"), 1); await pool.openRound(tree.root, E("1.016"), 2);
    await pool.connect(alice).claim(1, [7], [amount(7)], [proof(7)]);
    await expect(pool.connect(alice).claim(2, [7], [amount(7)], [proof(7)])).to.be.revertedWith("bad proof");          // the leaf carries the round id
  });

  it("a round NEVER pays more than its total, whatever the root says", async () => {
    const { owner, alice, bob, pool } = await setup(); const addr = await pool.getAddress();
    // a (wrong) tree that promises 1 ETH + 1 ETH, opened with only 1.5 ETH
    const rows = [["1", "7", E("1").toString()], ["1", "20", E("1").toString()]], tree = StandardMerkleTree.of(rows, ["uint256", "uint256", "uint256"]);
    await owner.sendTransaction({ to: addr, value: E("5") }); await pool.openRound(tree.root, E("1.5"), 1);
    await pool.connect(alice).claim(1, [7], [E("1")], [tree.getProof(rows[0])]);
    await expect(pool.connect(bob).claim(1, [20], [E("1")], [tree.getProof(rows[1])])).to.be.revertedWith("round exhausted");
    expect(await pool.available()).to.equal(E("3.5"));                                                                // the other 3.5 ETH was never at risk
  });

  it("the owner can always take the money back: withdraw the free part, close a round to free the rest", async () => {
    const { owner, alice, stranger, pool, tree, proof, amount } = await setup(); const addr = await pool.getAddress();
    await owner.sendTransaction({ to: addr, value: E("2") }); await pool.openRound(tree.root, E("1.016"), 1);
    await expect(pool.connect(stranger).withdraw(stranger.address, E("0.1"))).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    await expect(pool.withdraw(owner.address, E("1"))).to.be.revertedWith("exceeds available");                        // 1.016 is promised to the round
    await expect(pool.withdraw(ethers.ZeroAddress, E("0.1"))).to.be.revertedWith("to=0");
    await expect(pool.withdraw(owner.address, E("0.984"))).to.changeEtherBalances([owner, pool], [E("0.984"), -E("0.984")]);
    await pool.connect(alice).claim(1, [7], [amount(7)], [proof(7)]);                                                  // 0.666 claimed, 0.35 left
    await expect(pool.connect(stranger).closeRound(1)).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
    await expect(pool.closeRound(1)).to.emit(pool, "RoundClosed").withArgs(1, E("0.35"));
    await expect(pool.closeRound(1)).to.be.revertedWith("round closed");
    await expect(pool.connect(alice).claim(1, [8], [amount(8)], [proof(8)])).to.be.revertedWith("round closed");
    expect(await pool.reserved()).to.equal(0n);
    await expect(pool.withdraw(owner.address, E("0.35"))).to.changeEtherBalance(owner, E("0.35"));
    expect(await ethers.provider.getBalance(addr)).to.equal(0n);                                                       // every wei accounted for
  });

  it("ownership moves in two steps (a typo cannot lose the pool)", async () => {
    const { owner, alice, pool } = await setup();
    await pool.transferOwnership(alice.address); expect(await pool.owner()).to.equal(owner.address);
    await pool.connect(alice).acceptOwnership(); expect(await pool.owner()).to.equal(alice.address);
    await expect(pool.withdraw(owner.address, 1)).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });

  it("re-entering claim from the ETH transfer is blocked; an owner that cannot take ETH only blocks itself", async () => {
    const { owner, bob, robots, pool } = await setup(); const addr = await pool.getAddress();
    const attacker = await (await ethers.getContractFactory("ReentrantPoolClaimer")).deploy(), noEth = await (await ethers.getContractFactory("NoEthOwner")).deploy();
    await robots.setOwner(7, await attacker.getAddress()); await robots.setOwner(8, await noEth.getAddress());
    const rows = [["1", "7", E("0.5").toString()], ["1", "8", E("0.5").toString()], ["1", "20", E("0.5").toString()]], tree = StandardMerkleTree.of(rows, ["uint256", "uint256", "uint256"]);
    await owner.sendTransaction({ to: addr, value: E("3") }); await pool.openRound(tree.root, E("1.5"), 1);
    await attacker.arm(addr, 1, [7], [E("0.5")], [tree.getProof(rows[0])]); await attacker.go();
    expect(await attacker.tried()).to.equal(true); expect(await attacker.reentered()).to.equal(false);
    expect(await ethers.provider.getBalance(await attacker.getAddress())).to.equal(E("0.5"));                          // paid once, not twice
    await expect(noEth.go(addr, 1, [8], [E("0.5")], [tree.getProof(rows[1])])).to.be.revertedWith("transfer failed");
    expect(await pool.isClaimed(1, 8)).to.equal(false);                                                                // its share is still there
    await expect(pool.connect(bob).claim(1, [20], [E("0.5")], [tree.getProof(rows[2])])).to.changeEtherBalance(bob, E("0.5"));   // nobody else is affected
  });

  it("END TO END with the BACKEND's code: its tree + its openRound / claim calldata are accepted by this contract", async function () {
    let backend; try { backend = await import("file:///D:/MotorHeads-backend/src/foundry/rounds.js"); } catch (e) { console.log("        (backend repo not available here - skipped)", e.message.slice(0, 80)); this.skip(); }
    const { owner, alice, bob, pool } = await setup(); const addr = await pool.getAddress();
    const rows = [[1, 7, 666000000000000000n], [1, 8, 100000000000000000n], [1, 20, 250000000000000000n]], tree = backend.buildTree(rows);
    await owner.sendTransaction({ to: addr, value: E("2") });
    await owner.sendTransaction({ to: addr, data: backend.poolCall("openRound", [tree.root, 1016000000000000000n, 1n]) });            // exactly what /admin sends
    expect((await pool.roundInfo(1)).root).to.equal(tree.root);
    const data = backend.poolCall("claim", [1n, [7n, 8n], [666000000000000000n, 100000000000000000n], [tree.proof(0), tree.proof(1)]]);   // exactly what GET /claimcall returns
    await expect(bob.sendTransaction({ to: addr, data })).to.be.revertedWith("not the owner");                                        // anyone can fetch the calldata; only the owner can use it
    await expect(alice.sendTransaction({ to: addr, data })).to.changeEtherBalance(alice, E("0.766"));
    await expect(bob.sendTransaction({ to: addr, data: backend.poolCall("claim", [1n, [20n], [250000000000000000n], [tree.proof(2)]]) })).to.changeEtherBalance(bob, E("0.25"));
    expect(await pool.reserved()).to.equal(0n);
  });

  it("a whale claims 150 robots in one transaction within the block gas limit", async () => {
    const { owner, alice, robots, pool } = await setup(); const addr = await pool.getAddress(); const rows = [];
    for (let i = 1000; i < 1150; i++) { await robots.setOwner(i, alice.address); rows.push(["1", String(i), E("0.001").toString()]); }
    for (let i = 2000; i < 2400; i++) rows.push(["1", String(i), E("0.001").toString()]);                              // a realistic tree: 550 leaves
    const tree = StandardMerkleTree.of(rows, ["uint256", "uint256", "uint256"]);
    await owner.sendTransaction({ to: addr, value: E("1") }); await pool.openRound(tree.root, E("0.55"), 1);
    const mine = rows.slice(0, 150), tx = await pool.connect(alice).claim(1, mine.map((r) => r[1]), mine.map((r) => r[2]), mine.map((r) => tree.getProof(r)));
    const rc = await tx.wait(); console.log("        gas for 150 robots:", rc.gasUsed.toString()); expect(rc.gasUsed).to.be.lessThan(15000000n);
    expect(await pool.reserved()).to.equal(E("0.4"));
  });
});
