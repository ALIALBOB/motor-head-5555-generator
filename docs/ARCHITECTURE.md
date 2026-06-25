# Architecture

## High-level flow

```txt
Contract owns permanent state
        ↓
Metadata points to preview image + animation_url
        ↓
Renderer reads tokenId/contract query params
        ↓
Renderer reads chain state + layoutURI
        ↓
Renderer fetches layout JSON
        ↓
Canvas draws live mechanical artwork
```

## Builder flow

```txt
User opens site
  ↓
Editor loads current layout
  ↓
User freely moves parts
  ↓
User exports layout JSON
  ↓
JSON uploaded to IPFS/Arweave
  ↓
User calls publishBuild()
  ↓
Contract emits MetadataUpdate(tokenId)
```

## Data split

### On-chain

Permanent state and provenance:

- seed
- timestamp
- counters
- liquid state
- burned state
- part inventory
- layout URI/hash

### Off-chain content-addressed

Large creative data:

- all part placements
- exact x/y coordinates
- rotations
- scales
- z layer order
- materials
- opacity

## Why this works

The artwork can be deeply creative and detailed without forcing collectors to pay gas for every micro-coordinate.
