# MotorHeads Foundry — Robinhood 3D contracts

The **new** on-chain system for the 3D MotorHeads on **Robinhood Chain** (Arbitrum Orbit L2).
Lives in this subfolder to **reuse this repo's Hardhat toolchain, OZ v5, and test rig** — the live
Ethereum garage contracts in `contracts/*.sol` are **untouched**. Spec: `../../FOUNDRY_CONTRACTS_SPEC.md`,
economics: `../../FOUNDRY_MASTERPLAN.md` (both in the MotorHeads-5555 repo root).

**Reward model:** spend `$TOKEN` (burned) → earn **ETH** (from royalties/fees) → claim as ETH / $TOKEN / curated token. No stocks.

## Status
- **✅ Milestone 1** — foundations (`test/mhfoundry/M1.test.js`, 16 passing):
  - `MHToken.sol` — $TOKEN, ERC20 + burnable, fixed 1B supply, no tax, no post-deploy mint.
  - `WeightRegistry.sol` — tokenId → tier/weight/activated/burnCount/skin + `totalWeight`; role-gated (UPGRADE_ROLE / BURN_ROLE).
  - `RobotNFT.sol` — ERC721 + ERC2981 (10%) + Merkle allowlist (StandardMerkleTree `["address"]`, GTD snapshot) + public mint + pause + dynamic `baseURI` metadata.
- **✅ Milestone 2** — reward engine (`test/mhfoundry/M2.test.js`, 10 passing incl. a 5-seed fuzz/invariant):
  - `RewardPot.sol` — MasterChef accumulator (fund ETH → accrue by weight → claim). Anti-snipe (settle-on-activate, earns only from activation forward). **No owner, no withdraw** (trust anchor). Dust-cap on claim (rounding can't revert/drain). `receive()` + `fundETH()`.
  - `FeeRouter.sol` — splits incoming ETH: buy-burn slice → sink, remainder 70/30 pool/treasury (editable bps).
  - `test/MockUpgrader.sol` — test stand-in for the M3 UpgradeManager (atomic settle + reweight).
  - Fuzz verified: random funds+activations+upgrades conserve ETH exactly; only rounding dust remains; anti-snipe holds.
- **✅ M3** — the fee engine (`test/mhfoundry/M3.test.js`, 10 passing incl. the full loop):
  - `UpgradeManager.sol` — activate/upgrade: pull $TOKEN, burn ~50%, rest→treasury, atomic settle(pot)+setTier(reg). Editable tier tables (defaults T1..T5 cost 15/75/300/900/2500, weight 100/250/600/1200/2200). Pausable.
  - `CustomizeManager.sol` — applyItem/recolor: flat $TOKEN fee, burn ~50%, rest→treasury, emits `Customized`. No weight change (bought parts stay out of reward weight).
  - Verified: **THE LOOP** (two holders spend $TOKEN → earn ETH by weight), tier-diff pricing, deflation, owner gates, pause, approval reverts.
  - **Core economic engine complete: mint → activate/upgrade/customize (spend $TOKEN, burn) → fund pool (ETH) → claim by weight. 36 tests total.**
- **🔜 M4** — payout choices (swap ETH→$TOKEN / curated token via Uniswap v4 router).
- **🔜 M5** — `BurnAttestor` (worker-signed L1 2D-burn vouchers) + 6551 accounts + skins.
- **🔜 M6** — timelock/multisig, pause wiring, full invariant suite → audit.

## Run
```
npx hardhat test test/mhfoundry/M1.test.js
```

## Deploy targets (see FOUNDRY_CONTRACTS_SPEC §13)
- **Local:** hardhat network (default). **Testnet:** Robinhood **46630** (`rpc.testnet.chain.robinhood.com/rpc`, faucet available).
- **Mainnet:** Robinhood **4663**. Add both to `hardhat.config.js` networks before deploying (not done yet — keeps the shared config clean until we're ready).
