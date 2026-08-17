# Deploy — Backgrounds Vol. 2 (+ Equip v2)

Ships 12 new animated backgrounds (part-ids **25–36**) as a new **"Backgrounds Vol. 2"** crate (crateId **4**),
and swaps `MotorHeadsEquip` to **v2** (part ranges are now admin-settable; defaults to bg 13–36 so the new ids
equip out of the box). Cosmetic only — no funds at risk (RewardVault stays empty).

All local code is committed. Steps below are the **on-chain / prod** actions, in order. Two signers:
- **Throwaway deployer** `0xe662…4dcA` (key in `.env` `PRIVATE_KEY`) — deploys + owns ScrapCrates admin.
- **Founder wallet** `0x95A6…81C1` (MetaMask) — CONFIG_ROLE on the Equip contract.

---

### 1. Deploy Equip v2  — *throwaway deployer*
```
npx hardhat run scripts/deploy-equip.cjs --network mainnet
```
Note the printed address → call it `EQUIP_V2`.

### 2. Build the grandfather list from v1  — *read-only (any RPC, no key)*
```
FROM_BLOCK=<v1 deploy block> npx hardhat run scripts/equip-migration-list.cjs --network mainnet
```
Writes `reports/equip-migration.json` and prints ready **`grandfather()` calldata**. (Handful of tokens today.)

### 3. Grandfather those tokens into v2  — *founder wallet*
Send the printed `grandfather(...)` calldata to `EQUIP_V2` from the founder wallet (Etherscan “Write as Proxy”
is not needed — plain Write Contract, or the admin tool). This carries over everything currently equipped so
nothing disappears when the read flips.

### 4. Configure the Vol. 2 crate loot  — *throwaway deployer*
```
npx hardhat run scripts/set-vol2-loot.cjs --network mainnet    # setLootTable(4, [25..36], equal odds)
```
No redeploy — pure config on the live ScrapCrates.

### 5. Flip the backend to v2  — *Cloudflare*
In `d:/MotorHeads-backend`: set `EQUIP_ADDR`/`EQUIP_CONTRACT` = `EQUIP_V2` (the const in `src/chainState.js`,
line ~636), keep `EQUIP_READS="true"`, then `wrangler deploy`. (Backend already maps bg ids 25–36.)

### 6. Deploy the site  — *Cloudflare Pages*
In `d:/MotorHeads-5555`: set the site's `EQUIP_CONTRACT` const = `EQUIP_V2` (in `src/archive-experience.js`),
then `npm run build && wrangler pages deploy dist`. This also ships `/parts/25–36.json` + card art and the new
Backgrounds tab entries.

### 7. Rebuild + upload the renderer bundle  — *renderer R2*
The OpenSea animation shaders live in `web/src/webgl-bg.js` (source) → bundled into `/anim/app.js`. Rebuild the
bundle from `renderer/anim-entry.js` and PUT it to R2, bumping the cache-buster:
```
# (confirm your existing bundle command) e.g. esbuild renderer/anim-entry.js --bundle --format=esm --minify > app.js
curl -X PUT --data-binary @app.js -H "authorization: <RENDER_TOKEN>" https://motorheads-renderer.<...>.workers.dev/anim/app.js
```
Then bump `?v=9` → `?v=10` in `renderer/index.js` (the `<script src=".../anim/app.js?v=…">`) and redeploy the
renderer worker. (`renderer/anim-runtime-new.js` already has the 12 new shader branches if you upload it directly.)

### 8. Airdrop the Vol. 2 crate  — *throwaway deployer*
Point the existing Merkle distributor at the new crate and publish a fresh root, **or** admin-mint directly:
```
# CrateDistributor: setCrateId(4) + setMerkleRoot(<new root>)  → holders one-tap claim in the Garage
# or: grant MINTER to the deployer and mintCrates(holder, 4, 1) for a targeted drop
```
Regenerate `public/crate-proofs.json` for crate 4 the same way the Vol. 1 wave was built.

---

**Safe-launch guardrails (unchanged):** RewardVault stays empty; `pause()` kill-switch on crates + distributor;
revoke the distributor MINTER after the claim wave. Self-test on token #1 first (claim → open a Vol. 2 crate →
equip a new background → confirm it renders in the site, the OpenSea animation, and the baked still).
