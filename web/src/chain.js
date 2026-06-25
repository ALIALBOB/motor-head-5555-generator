import { ethers } from "ethers";
import { sha256Hex } from "./layoutStore.js";

/*
  Minimal chain connector.

  OpenSea animation_url iframes should be treated as read-only viewers.
  Owner actions like publishBuild/changeOil should happen on your own website with wallet connection.
*/

export const ABI = [
  "function machine(uint256 tokenId) view returns (tuple(uint256 seed,uint64 mintedAt,uint64 lastActionAt,uint32 transferCount,uint32 windCount,uint32 repairCount,uint32 overclockCount,uint8 canvasType,bool burnedCore,tuple(uint8 liquidType,uint8 color,uint8 texture,uint8 fillLevel,uint8 purity,uint8 viscosity,uint8 temperature,bool leaking,uint64 lastChangedAt) liquid,string layoutURI,bytes32 layoutHash,uint32 partCount,uint32 buildRevision))",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function publishBuild(uint256 tokenId,string layoutURI,bytes32 layoutHash,uint32 partCount)",
  "function changeOil(uint256 tokenId,uint8 liquidType,uint8 color,uint8 texture,uint8 viscosity)",
  "function wind(uint256 tokenId,uint8 pulses)",
  "event MetadataUpdate(uint256 _tokenId)"
];

export async function connectWallet() {
  if (!window.ethereum) throw new Error("No wallet found. Install MetaMask/Rabby or use a wallet-enabled browser.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export async function readMachineState(contractAddress, tokenId) {
  const { signer } = await connectWallet();
  const contract = new ethers.Contract(contractAddress, ABI, signer);
  const m = await contract.machine(tokenId);

  // Convert BigInt-heavy Solidity return into plain data for renderer.
  return {
    seed: m.seed.toString(),
    mintedAt: Number(m.mintedAt),
    lastActionAt: Number(m.lastActionAt),
    transferCount: Number(m.transferCount),
    windCount: Number(m.windCount),
    repairCount: Number(m.repairCount),
    overclockCount: Number(m.overclockCount),
    canvasType: Number(m.canvasType),
    burnedCore: Boolean(m.burnedCore),
    liquidType: Number(m.liquid.liquidType),
    liquidColor: Number(m.liquid.color),
    liquidTexture: Number(m.liquid.texture),
    fillLevel: Number(m.liquid.fillLevel),
    purity: Number(m.liquid.purity),
    viscosity: Number(m.liquid.viscosity),
    temperature: Number(m.liquid.temperature),
    leaking: Boolean(m.liquid.leaking),
    liquidLastChangedAt: Number(m.liquid.lastChangedAt),
    layoutURI: m.layoutURI,
    layoutHash: m.layoutHash,
    partCount: Number(m.partCount),
    buildRevision: Number(m.buildRevision)
  };
}

export async function publishBuild(contractAddress, tokenId, layoutURI, layoutJson) {
  const { signer } = await connectWallet();
  const contract = new ethers.Contract(contractAddress, ABI, signer);

  // Contract stores bytes32. We use SHA-256 for human/file verification, then convert into 0x bytes32.
  // A production version can choose keccak256 instead, as long as the frontend and contract agree.
  const sha = await sha256Hex(layoutJson);
  const layoutHash = `0x${sha}`;
  const partCount = JSON.parse(layoutJson).placements.length;

  const tx = await contract.publishBuild(tokenId, layoutURI, layoutHash, partCount);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, layoutHash, partCount };
}
