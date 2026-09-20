// Redeploy ONLY the CustomizeManager (M3.6 catalog) against the existing contracts; seed a sample catalog.
const { ethers, network } = require("hardhat");
const fs=require("fs"), path=require("path");
const E=n=>ethers.parseEther(String(n));
async function main(){
  const [me]=await ethers.getSigners();
  const f=path.join(__dirname,"..","..","deployments",`mhfoundry-${network.name}.json`);
  const d=JSON.parse(fs.readFileSync(f));
  const oldCM=d.CustomizeManager;
  const CM=await (await ethers.getContractFactory("CustomizeManager")).deploy(
    d.MHToken, d.RobotNFT, d.WeightRegistry, d.RewardPot, d.treasury, 5000, E(1), me.address // tokenPerUsd=1e18 ($1=1 $TOKEN)
  );
  await CM.waitForDeployment();
  const cm=await CM.getAddress();
  console.log("new CustomizeManager:", cm);
  const REG=await ethers.getContractAt("WeightRegistry", d.WeightRegistry);
  const POT=await ethers.getContractAt("RewardPot", d.RewardPot);
  await (await REG.grantRole(await REG.CUSTOMIZE_ROLE(), cm)).wait();
  await (await POT.grantRole(await POT.SETTLER_ROLE(), cm)).wait();
  if (oldCM) { try { await (await REG.revokeRole(await REG.CUSTOMIZE_ROLE(), oldCM)).wait(); console.log("revoked old CM role"); } catch(e){} }
  // sample catalog (id, priceUsdCents, weightBps, active)
  await (await CM.setItem(1, 500, 0, true)).wait();    // Sticker $5, cosmetic
  await (await CM.setItem(2, 1500, 100, true)).wait(); // Brass part $15, +1%
  await (await CM.setItem(3, 4000, 200, true)).wait(); // Dope part $40, +2%
  await (await CM.setItem(4, 8000, 300, true)).wait(); // Gold trim $80, +3%
  await (await CM.setItem(5, 6000, 200, true)).wait(); // Animated BG $60, +2%
  await (await CM.setRecolorPrice(500)).wait();        // recolor $5
  d.CustomizeManager=cm; d.CustomizeManager_old=oldCM; d.ts=new Date().toISOString();
  fs.writeFileSync(f, JSON.stringify(d,null,2));
  console.log("catalog seeded + deployments updated");
}
main().catch(e=>{console.error(e);process.exit(1);});
