# On-chain save — local test (no deploy, no cost)

Everything runs on your machine. You'll deploy to a local Hardhat chain, connect MetaMask to it,
and click "Save On-Chain" for real.

## 1. Local chain + contracts (contract repo)
```
cd D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft
npx hardhat node                 # terminal 1 — leave running (RPC on 127.0.0.1:8545)
```
In a second terminal:
```
cd D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft
npx hardhat run scripts/deploy-motorheads-parts.js --network localhost
```
Note the printed **MotorHeadsParts** address (a fresh run gives `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`).
It mints tokens **#1 and #2 to Hardhat account #0**.

## 2. MetaMask
- Add network: **RPC http://127.0.0.1:8545, Chain ID 31337, symbol ETH**.
- Import Hardhat account #0 (owns token #1) — well-known TEST key, never use with real funds:
  `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## 3. Website
```
cd D:/MotorHeads-5555
npm run dev                      # http://localhost:5173
```
Open the site, then in the browser console:
```js
window.__PARTS_CONTRACT__ = "<MotorHeadsParts address from step 1>";
window.__PARTS_CHAIN_ID__ = 31337;
window.__SAVE_TOKEN_ID__  = 1;                 // the token you own locally
const a = window.__MOTORHEADS_ARCHIVE__;        // bypass the (mainnet) holder gate locally
a.holderAdmitted = true; a.ownedTokenIds = [1]; a.goTo(4);
```
Add a few items to the MotorHead, then click **Save On-Chain** → MetaMask pops → confirm
(pays the ~$1 fee + gas in test ETH) → the notice shows "Saved on-chain!".

## 4. See it (the renderer)
```
cd D:/MotorHeads-mechanical-canvas/mechanical-canvas-nft/renderer
printf 'PARTS_CONTRACT=<address>\nRENDER_RPC_URL=http://127.0.0.1:8545\n' > .dev.vars
npx wrangler dev --port 8789
curl http://127.0.0.1:8789/meta/1.json          # shows your saved parts + build revision
```

Notes: locally the holder gate reads mainnet, so we bypass it in the console (step 3). On
Sepolia/mainnet the gate + owned-picker drive it normally.
