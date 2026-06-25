# Product Spec — Mechanical Canvas NFT Builder

## One-line concept

A dynamic mechanical NFT art builder where collectors start with a professional gear-and-pipe canvas, then freely rearrange owned mechanical parts to create unique moving artworks.

## Core user experience

1. User mints or owns a Mechanical Canvas NFT.
2. The NFT displays a starter mechanical composition: gears, pipes, belts, tanks, liquid, and a white/black blueprint visual style.
3. The holder opens the builder.
4. They can move starter parts freely without signing.
5. They can preview motion at any time.
6. They can use owned parts from their library.
7. Premium/unowned parts are visible but locked.
8. The holder can buy/unlock parts when they want more pieces.
9. They can save drafts off-chain.
10. They sign only when publishing a build to the NFT.

## Visual direction

- White/off-white canvas.
- Black/gray linework.
- Technical drawing / mechanical blueprint feel.
- Detailed but not cluttered.
- Moving indicators: rotation arrows, flow lines, belt arrows, liquid waves.
- Professional builder UI: side instructions, bottom parts tray, status/footer buttons.

## Starter canvas

Each token begins with a real composition, not an empty board.

Example base canvases:

- Gear Wall
- Pipe Chamber
- Clock Reactor
- Fluid Engine
- Belt Machine
- Archive Mechanism
- Broken Workshop
- Kinetic Frame

## Part categories

### Mechanical
- small gear
- medium gear
- large gear
- ring gear
- bevel gear
- sprocket
- flywheel
- pulley

### Pipe/fluid
- straight pipe
- elbow pipe
- T-joint
- valve
- tank
- gauge
- drip
- bubble
- liquid chamber

### Structure
- plate
- bracket
- frame rail
- screw
- bolt
- rivet
- clamp
- chain

### Drawing micro-parts
- dot
- small line
- curved mark
- tooth
- tiny cog
- spark
- crack
- smoke curl
- washer

### Rare/premium
- tesla coil
- crown gear
- mercury tank
- gold pressure wheel
- ghost pipe
- quantum valve

## Freeform editor requirements

- Drag any owned part anywhere.
- Rotate using handle or keyboard.
- Scale uniformly and possibly non-uniformly.
- Duplicate owned micro-parts if duplication rules allow.
- Change layer/z-index.
- Optional snap-to-grid.
- Optional snap-to-connector.
- Show connector points when selected.
- Show connection lines when parts are close.
- Highlight invalid placements if a locked part is used.

## Connection logic requirements

### Gears
- Gear parts have radius, tooth count, rotation direction, and connector type.
- Gears visually mesh if edge distance is close to radiusA + radiusB.
- Connected gears rotate opposite directions.
- Belt-linked gears can rotate same direction or configured direction.

### Pipes
- Pipe parts have connector points at ends.
- Connectors snap when close and compatible.
- Fluid animation moves through connected pipe networks.
- Tanks can be source/sink nodes.

### Belts
- Belts link two wheels/gears.
- Belt animation moves along line/path.
- If a belt link is broken, show it as inactive/dashed.

## Part economy rules

- Starter parts are included with each minted token.
- A user can move starter parts for free.
- A user can preview locked parts visually.
- A user cannot publish a build using locked parts unless the part is owned/unlocked.
- The contract or backend should be able to verify a token's unlocked part packs.

## Save modes

### Save off-chain

Stores full layout JSON locally, backend, IPFS, or Arweave. No wallet signature required unless using a signed storage service.

### Save on-chain / publish

1. Validate layout.
2. Validate all used parts are owned/unlocked.
3. Upload layout JSON to storage or compute hash/reference.
4. Call contract `publishBuild(tokenId, layoutUri, layoutHash)`.
5. Emit metadata update event.

## NFT rendering

The NFT animation viewer should load:

- tokenId
- contract state
- active build URI/hash
- layout JSON
- part catalog
- time/motion state

Then render deterministic moving art.

## Production cautions

- This MVP is not audited.
- Contract upgrades need careful storage layout management.
- Marketplace refresh behavior can be slow/cached.
- Large layout data should not be stored directly on-chain.
