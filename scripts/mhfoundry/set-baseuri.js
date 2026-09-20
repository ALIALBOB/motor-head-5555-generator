const { ethers, network } = require("hardhat");
const fs=require("fs"), path=require("path");
async function main(){
  const d=JSON.parse(fs.readFileSync(path.join(__dirname,"..","..","deployments",`mhfoundry-${network.name}.json`)));
  const NFT=await ethers.getContractAt("RobotNFT", d.RobotNFT);
  const base="https://motorheadsonline.com/foundry/meta/";
  const tx=await NFT.setBaseURI(base); await tx.wait();
  console.log("setBaseURI ->", base, "| tx", tx.hash);
  console.log("tokenURI(1) =", await NFT.tokenURI(1));
}
main().catch(e=>{console.error(e);process.exit(1);});
