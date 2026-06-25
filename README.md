# Mechanical Canvas NFT

A commented prototype for a **3333-piece dynamic mechanical art NFT collection**.

The concept is:

```txt
1 NFT = 1 mechanical canvas
       + freeform parts library
       + oil/liquid system
       + chain-reactive machine state
       + holder-published layout
```

Each token starts as a full mechanical box/canvas filled with gears, pipes, tanks, liquids, frames, bolts, sparks, and micro-parts. Holders can open a builder, move parts freely, rotate, scale, layer, duplicate small parts, almost draw with the mechanical pieces, and publish the final layout URI on-chain.

---

## What is included

```txt
contracts/MechanicalCanvas.sol     Upgradeable ERC721 dynamic NFT contract
web/                               Vite browser builder + live canvas renderer
scripts/deploy.js                  UUPS proxy deploy script
scripts/registerStarterParts.js    Registers starter parts on-chain
scripts/generateCollection.js      Generates sample layouts + metadata
scripts/publishDemoBuild.js        Demo publishBuild transaction
data/starter-parts.json            Starter part catalog
data/layouts/                      Generated sample layout JSON files
data/metadata/                     Generated sample metadata JSON files
docs/                              Extra architecture notes for Codex/devs
```

---

## Install

```bash
npm install
```

---

## Run the builder locally

```bash
npm run dev
```

Open the local Vite URL. You can:

- click parts from the library
- drag them anywhere
- hold **Shift** while dragging to rotate
- use mouse wheel to scale
- duplicate/delete parts
- export/import layout JSON
- change oil/liquid type and texture
- connect wallet and call `publishBuild()` after deployment

---

## Compile and test contracts

```bash
npm run compile
npm test
```

---

## Generate sample collection data

```bash
BUILD_COUNT=3333 npm run generate
```

This creates:

```txt
data/layouts/0001.json ...
data/metadata/0001.json ...
```

These are starter layouts, not final user builds. Holders can later publish new layouts.

---

## Deploy locally

Terminal 1:

```bash
npx hardhat node
```

Terminal 2:

```bash
npm run deploy:local
```

Copy the proxy address, then register starter parts:

```bash
CONTRACT_ADDRESS=0xYourProxyAddress npm run parts:starter
```

---

## Core architecture

### On-chain Solidity stores

```txt
seed
mintedAt
transferCount
windCount
repairCount
overclockCount
canvasType
burnedCore
liquid/oil state
published layoutURI
published layoutHash
partCount
buildRevision
unlocked part inventory
```

### Off-chain layout JSON stores

```txt
every placed part:
  partId
  key
  x / y
  rotation
  scaleX / scaleY
  z layer
  material
  color variant
  opacity
  flip state
```

This is the practical split. The chain keeps the permanent machine state. The layout JSON keeps the detailed creative composition.

---

## Why layout JSON is off-chain

A freeform build can contain 100+ tiny parts. If every x/y coordinate is saved directly in Solidity, every edit becomes expensive. This project saves the detailed editor layout as JSON on IPFS/Arweave and stores only:

```txt
layoutURI
layoutHash
partCount
buildRevision
```

on-chain.

---

## Holder flow

```txt
Mint NFT
  ↓
Open builder
  ↓
Move gears / pipes / bolts / liquids / micro-parts freely
  ↓
Export layout JSON
  ↓
Upload JSON to IPFS/Arweave
  ↓
Call publishBuild(tokenId, layoutURI, layoutHash, partCount)
  ↓
NFT renderer loads the published layout and draws the live machine
```

---

## Dynamic visual behavior

The renderer can change visuals based on:

```txt
age after mint       → dust/rust/aging
transfer count       → scars/scratches
wind count           → gear speed
repair count         → cleaner liquid, fewer leaks
overclock count      → heat, sparks, faster movement
liquid type/color    → oil/coolant/resin/mercury visual style
burned core          → dead machine overlay
layout placements    → user-created composition
```

---

## Important production notes

This is a prototype, not audited production code.

Before mainnet:

- audit the Solidity contract
- decide final mint rules
- decide whether upgrades are controlled by multisig/timelock
- finalize IPFS/Arweave upload flow
- implement marketplace refresh strategy
- replace placeholder CIDs and URLs
- generate final previews
- test `animation_url` behavior on target marketplaces
- test gas costs for interactions


---

## Codex handoff quick start

This repo now includes a Codex-ready instruction file:

- `AGENTS.md` — persistent repo instructions for Codex.
- `docs/CODEX_MASTER_PROMPT.md` — paste this into Codex for the first implementation task.
- `docs/CODEX_TASKS.md` — staged implementation tasks.
- `docs/PRODUCT_SPEC.md` — product definition.
- `docs/BUILDER_DATA_SCHEMA.md` — layout, part, and chain data schemas.
- `web/prototypes/blueprint-builder-demo.html` — latest standalone visual prototype.
- `assets/concepts/` — concept images for the professional blueprint UI.

Recommended first Codex task:

```text
Read AGENTS.md and docs/CODEX_MASTER_PROMPT.md. Then implement Task 1 from docs/CODEX_TASKS.md: upgrade the main web app to match the blueprint mechanical builder prototype, while keeping freeform editing and export/import working.
```

Open the standalone prototype locally by opening:

```text
web/prototypes/blueprint-builder-demo.html
```

