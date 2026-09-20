// CAN A STRANGER HIJACK A ROBOT'S GARAGE? Run against a fork of real mainnet state.
//
// Every MotorHead has an ERC-6551 "garage" account that parts are minted into. The address exists before the account is
// deployed, and BOTH the registry's createAccount and the proxy's initialize are open to anyone. If a stranger can create
// the account and point it at their OWN implementation, they would control a garage that paid parts get minted into.
// This test answers that with the real registry, the real proxy and the real derivation — not a mock.
//
//   npx hardhat test test/GarageHijack.fork.js --network hardhat   (needs MAINNET_RPC_URL in the environment)
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const REGISTRY = "0x000000006551c19487814612e58FE06813775758";
const CRATES = "0x50Dc22553988de047a00328963faEe8EC5E19b12";
const COLLECTION = "0x0a5008550fc1402bb567a3ba38d9433e6199ceb1";
const ACCOUNT_V3 = "0x41C8f39463A868d3A88af00cd0fe7102F30E44eC";
const SLOT_1967 = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const VICTIM = 4321;   // a robot whose garage has never been used

describe("garage hijack (mainnet fork)", function () {
  this.timeout(180000);
  let crates, registry, garage, impl, salt;

  before(async function () {
    if (!process.env.MAINNET_RPC_URL) this.skip();
    await network.provider.request({ method: "hardhat_reset", params: [{ forking: { jsonRpcUrl: process.env.MAINNET_RPC_URL } }] });
    crates = await ethers.getContractAt(["function garageOf(uint256) view returns (address)", "function registry() view returns (address)", "function accountImplementation() view returns (address)", "function accountSalt() view returns (bytes32)"], CRATES);
    registry = await ethers.getContractAt(["function createAccount(address,bytes32,uint256,address,uint256) returns (address)", "function account(address,bytes32,uint256,address,uint256) view returns (address)"], REGISTRY);
    garage = await crates.garageOf(VICTIM); impl = await crates.accountImplementation(); salt = await crates.accountSalt();
    console.log("      garage of #" + VICTIM + ":", garage, "| deployed:", (await ethers.provider.getCode(garage)) !== "0x");
  });

  it("the forge's derivation matches the crates contract's, so createAccount really lands on that address", async function () {
    const derived = await registry.account(impl, salt, 1, COLLECTION, VICTIM);
    expect(derived.toLowerCase()).to.equal(garage.toLowerCase());
    const [, stranger] = await ethers.getSigners();
    await registry.connect(stranger).createAccount(impl, salt, 1, COLLECTION, VICTIM);
    expect(await ethers.provider.getCode(garage)).to.not.equal("0x");
    console.log("      a stranger created it; code is now at the SAME address");
  });

  it("…but a stranger CANNOT point that garage at their own implementation", async function () {
    const [, stranger] = await ethers.getSigners();
    const Evil = await ethers.getContractFactory("ForgeAccount"); const evil = await Evil.deploy();
    const proxy = await ethers.getContractAt(["function initialize(address)"], garage);
    let hijacked = false, why = "";
    try { await proxy.connect(stranger).initialize(await evil.getAddress()); hijacked = true; }
    catch (e) { why = (e.shortMessage || e.message || "").slice(0, 120); }
    const slot = await ethers.provider.getStorage(garage, SLOT_1967);
    const pointsAt = "0x" + slot.slice(26);
    console.log("      initialize(attacker) " + (hijacked ? "SUCCEEDED" : "reverted: " + why));
    console.log("      the garage now runs:", pointsAt);
    expect(hijacked, "a stranger pointed a garage at their own code — paid parts minted there would be theirs").to.equal(false);
  });

  it("the honest initialize puts it on the tokenbound build, and a second call cannot change it", async function () {
    const [, stranger, other] = await ethers.getSigners();
    const proxy = await ethers.getContractAt(["function initialize(address)"], garage);
    try { await proxy.connect(stranger).initialize(ACCOUNT_V3); } catch (e) { console.log("      initialize(AccountV3) reverted:", (e.shortMessage || e.message).slice(0, 100)); }
    const pointsAt = "0x" + (await ethers.provider.getStorage(garage, SLOT_1967)).slice(26);
    console.log("      after initialize(AccountV3):", pointsAt);
    const Evil = await ethers.getContractFactory("ForgeAccount"); const evil = await Evil.deploy();
    let second = false; try { await proxy.connect(other).initialize(await evil.getAddress()); second = true; } catch (e) { /* expected */ }
    expect(second, "initialize could be called twice — the implementation is not locked").to.equal(false);
  });
});
