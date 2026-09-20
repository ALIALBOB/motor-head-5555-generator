const { ethers, network } = require("hardhat");
async function main(){
  const s = await ethers.getSigners();
  if(!s.length){ console.log("NO_SIGNER — PRIVATE_KEY missing in .env"); return; }
  const me = s[0].address;
  try { const bal = await ethers.provider.getBalance(me);
    console.log("ADDRESS", me); console.log("BALANCE", ethers.formatEther(bal), "ETH on", network.name);
  } catch(e){ console.log("ADDRESS", me); console.log("RPC_ERR", e.message.slice(0,140)); }
}
main().catch(e=>console.log("ERR", e.message.slice(0,160)));
