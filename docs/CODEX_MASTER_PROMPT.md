# Master Prompt for Codex

Paste this into Codex after uploading/pushing this repository.

```text
You are working on the Mechanical Canvas NFT Builder repository.

Goal: turn this prototype into a polished MVP for an interactive mechanical NFT art builder.

The latest product direction:
- White canvas / black technical ink / blueprint aesthetic.
- Each NFT starts as a full mechanical canvas filled with gears, pipes, belts, tanks, bolts, and liquid systems.
- Holders can freely move, rotate, scale, layer, duplicate, and remove owned parts. They can build abstract machines, faces, animals, symbols, or any composition from mechanical parts.
- Existing starter parts can be moved and previewed for free. No wallet signature is required for local editing.
- Premium/unowned parts appear in the parts library but are locked. Users can preview them, but must buy/unlock them before publishing a build that uses them.
- Save Build Off-Chain should store/export the complete layout JSON without a blockchain transaction.
- Save On-Chain / Sign should validate ownership/unlocks, upload or reference the layout URI/hash, then call the contract to publish the active build.
- The machine should visibly move: gears rotate, belts move, pipe flow animates, liquid waves inside tanks, connected systems show motion direction.

Start by reading:
1. AGENTS.md
2. docs/PRODUCT_SPEC.md
3. docs/CODEX_TASKS.md
4. docs/BUILDER_DATA_SCHEMA.md
5. docs/CHAIN_SCHEMA.md
6. web/prototypes/blueprint-builder-demo.html
7. assets/concepts/mechanical-nft-builder-ui-blueprint.png

Then implement TASK 1 from docs/CODEX_TASKS.md:
- make the main `web/` app match the professional blueprint builder prototype.
- keep the existing contract and scripts intact unless a change is necessary.
- run `npm install`, `npm run compile`, and `npm test` if possible.
- summarize changed files, test results, and any assumptions.

Important: do not store full freeform layouts directly in Solidity. Keep complete placement JSON off-chain/IPFS/backend and publish only a URI/hash/reference on-chain.
```
