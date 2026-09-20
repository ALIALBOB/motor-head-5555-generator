// Prove the full loop on-chain: mint → activate → fund pool → claim.
//   npx hardhat run scripts/mhfoundry/demo.js --network robinhoodTestnet
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const E = (n) => ethers.parseEther(String(n));
const F = (w) => ethers.formatEther(w);

async function main() {
  const [me] = await ethers.getSigners();
  const file = path.join(__dirname, "..", "..", "deployments", `mhfoundry-${network.name}.json`);
  const d = JSON.parse(fs.readFileSync(file));
  const exp = network.name === "robinhoodTestnet" ? "https://explorer.testnet.chain.robinhood.com/tx/" : "";

  const T = await ethers.getContractAt("MHToken", d.MHToken);
  const NFT = await ethers.getContractAt("RobotNFT", d.RobotNFT);
  const REG = await ethers.getContractAt("WeightRegistry", d.WeightRegistry);
  const POT = await ethers.getContractAt("RewardPot", d.RewardPot);
  const UP = await ethers.getContractAt("UpgradeManager", d.UpgradeManager);

  const log = (l, tx) => console.log(l + (exp && tx ? `\n   ${exp}${tx}` : ""));

  // 1) MINT
  let tx = await NFT.publicMint({ value: BigInt(d.params.MINT_PRICE) });
  let rc = await tx.wait();
  const id = await NFT.totalMinted();
  log(`1) Minted robot #${id} to ${me.address}`, rc.hash);

  // 2) ACTIVATE (spend $TOKEN, burns 50%)
  const s0 = await T.totalSupply();
  await (await T.approve(d.UpgradeManager, ethers.MaxUint256)).wait();
  rc = await (await UP.activate(id)).wait();
  log(`2) Activated → tier ${await REG.tierOf(id)}, weight ${await REG.weightOf(id)} | burned ${F(s0 - (await T.totalSupply()))} $TOKEN`, rc.hash);

  // 3) FUND the pool with ETH
  rc = await (await POT.fundETH({ value: E("0.001") })).wait();
  log(`3) Funded pool 0.001 ETH → pendingOf(#${id}) = ${F(await POT.pendingOf(id))} ETH`, rc.hash);

  // 4) CLAIM (ETH out)
  rc = await (await POT.claim(id)).wait();
  log(`4) Claimed → pendingOf now ${F(await POT.pendingOf(id))} ETH | pot balance ${F(await ethers.provider.getBalance(d.RewardPot))} ETH`, rc.hash);

  console.log("\n✅ Full loop ran on-chain: mint → activate(spend+burn) → fund(ETH) → claim(ETH).");
}

main().catch((e) => { console.error(e); process.exit(1); });
