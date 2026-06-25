# AGENTS.md — Mechanical Canvas NFT Builder

This repository is for a dynamic mechanical NFT art builder. The project is not a normal PFP generator. Treat it as an interactive art engine where each token starts as a professional mechanical canvas and the holder can freely rearrange gears, pipes, tanks, liquids, and small drawing pieces.

## Product goal

Build a working MVP for a 3333-piece NFT collection where each token has:

- A starter mechanical canvas: white/black blueprint art with gears, pipes, tanks, belts, bolts, and a clean central workspace.
- Moving mechanisms: gears rotate, belts move, fluid flows through pipes, tanks have liquid waves, smoke/drips can animate.
- Freeform editor: holders can drag, rotate, scale, layer, duplicate, and delete owned parts anywhere on the canvas.
- Connection logic: parts have connector points; gears can mesh or belt-link; pipes snap/connect; fluid can flow through connected pipe networks.
- Part economy: starter parts are included; premium/unowned parts appear locked. A holder must own/buy/unlock a part before adding it to a published build.
- Two save modes:
  - Save Build Off-Chain: save draft JSON locally/IPFS/backend without chain transaction.
  - Save On-Chain / Sign: publish active build reference/hash to the NFT contract after wallet signature.
- Dynamic NFT state: contract stores seed, mint time, transfer count, liquid state, unlocks, active build URI/hash, and interaction counters.

## Visual style

Primary visual target: monochrome technical blueprint / black ink on white canvas.

Use `assets/concepts/mechanical-nft-builder-ui-blueprint.png` and `assets/concepts/base-mechanical-canvas-blueprint.png` as concept references. Keep the product professional, precise, and artistic.

Avoid turning the app into a generic colorful game UI. It should feel like a mechanical drawing board, engineering archive, or kinetic wall-art builder.

## Current repo layout

- `contracts/MechanicalCanvas.sol` — upgradeable ERC721 prototype with machine state, parts, liquid, published build references, and dynamic metadata events.
- `web/` — browser editor prototype.
- `web/prototypes/blueprint-builder-demo.html` — standalone visual prototype for the latest black-on-white concept.
- `data/starter-parts.json` — starter part catalog.
- `docs/` — architecture, Codex tasks, schemas, and implementation plan.
- `scripts/` — deploy, upgrade, part registration, sample generation.

## Development commands

Run these after installing dependencies:

```bash
npm install
npm run compile
npm test
npm run dev
```

If a command fails because a dependency is missing, update `package.json` or document the missing dependency clearly. Do not silently skip tests.

## Implementation priorities

1. Make the web editor professional and usable.
2. Implement accurate part placement, selection handles, rotation, scale, z-order, snapping, and export/import.
3. Add connector math and visual connection feedback.
4. Add owned/locked/premium part UX.
5. Connect wallet and contract publishing only after the local editor works.
6. Keep the contract simple and auditable; avoid storing huge layouts directly on-chain.

## Chain design rules

- Full layout JSON should usually live off-chain/IPFS/Arweave/backend.
- The contract should store only compact state: seed, mintedAt, counters, liquid state, unlocks, active build URI/hash.
- Publishing a build should emit metadata update events so marketplaces can refresh.
- Do not promise mainnet readiness. Keep comments clear that security review/audit is needed before production.

## Code style

- Write clear comments explaining why each system exists.
- Keep renderer logic separate from editor UI logic.
- Keep contract state schema separate from frontend layout schema.
- Prefer deterministic art from seed + layout + chain state.
- Add tests for contract behavior and pure frontend utilities where practical.

## Non-negotiables

- Users can move existing starter parts freely before signing anything.
- Users sign/pay only when buying/unlocking parts or publishing an on-chain build update.
- Locked parts can be previewed but not included in a published build unless owned.
- The visual system should show connection: gears mesh, belts link, pipes connect, liquid flows.
- The product must remain art-first, not just a marketplace asset manager.
