# MotorHeads 5555 Generator Handoff

Date: 2026-06-26

This repository is the source generator and local toolchain for MotorHeads 5555. It is not the live website repo and it is not the Cloudflare backend repo.

## Do Not Commit

The following are intentionally excluded from Git because they are generated, very large, or secret-bearing:

- `.env` and any local env files
- `node_modules/`
- `build/`
- `dist-web/`
- `web/public/`
- Hardhat `artifacts/` and `cache/`
- CAR files and local logs

## Keep In Git

- `contracts/` for Solidity source
- `scripts/` for generation/upload/deploy helpers
- `config/` for trait, animation, rarity, and visual rules
- `web/src/` and `web/index.html` for the local builder/animation source
- `docs/`, `marketing/`, `prereveal/`, `assets/`, and small `data/` samples

## Live Collection Safety

The live MotorHeads collection is already configured separately. Do not regenerate or upload new live metadata/animations, and do not update the on-chain base URI from this repo unless explicitly requested.

Mainnet collection contract:

```text
0x0a5008550fc1402bb567a3ba38d9433e6199ceb1
```

Current live base URI remembered from launch work:

```text
ipfs://bafybeieu7bnbl7tiuim6x6gz7pcdfhkq6bh4eas3jteea7sx7kowobe6jy/
```

## Useful Commands

```powershell
npm install
npm run build:web
npm run lam:validate-traits
npm run lam:validate-specials
npm run lam:collection
```

Use generation commands only when intentionally producing a new local build. The output should remain ignored until a release package is deliberately prepared.
