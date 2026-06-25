# Builder Data Schema

This schema separates creative layout data from compact chain state.

## Layout JSON

Full freeform layout is stored off-chain/IPFS/backend.

```json
{
  "version": 1,
  "tokenId": 1,
  "canvas": {
    "width": 1600,
    "height": 1200,
    "style": "blueprint-ink-white",
    "baseCanvas": "gear-wall"
  },
  "liquid": {
    "type": "Blue Coolant",
    "color": "#4db8ff",
    "fillLevel": 72,
    "texture": "Bubbly"
  },
  "placements": [
    {
      "placementId": "p_001",
      "partId": "gear.medium.001",
      "x": 420,
      "y": 240,
      "rotation": 0.35,
      "scaleX": 1,
      "scaleY": 1,
      "zIndex": 12,
      "material": "ink-steel",
      "opacity": 1,
      "flipX": false,
      "flipY": false,
      "locked": false,
      "owned": true
    }
  ],
  "connections": [
    {
      "fromPlacementId": "p_001",
      "fromConnector": "east",
      "toPlacementId": "p_002",
      "toConnector": "west",
      "type": "gearMesh",
      "active": true
    }
  ]
}
```

## Part catalog item

```json
{
  "partId": "pipe.elbow.001",
  "name": "Pipe Elbow",
  "category": "Pipe",
  "rarity": "Common",
  "unlockType": "starter",
  "premium": false,
  "canDuplicate": true,
  "geometry": {
    "type": "pipeElbow",
    "width": 120,
    "height": 120,
    "connectors": [
      { "id": "north", "x": 0, "y": -60, "kind": "pipe" },
      { "id": "east", "x": 60, "y": 0, "kind": "pipe" }
    ]
  },
  "motion": {
    "kind": "fluidFlow",
    "speed": 1
  }
}
```

## Compact on-chain build reference

```json
{
  "tokenId": 1,
  "layoutUri": "ipfs://.../layouts/0001.json",
  "layoutHash": "0x...",
  "publishedAt": 1760000000,
  "revision": 3
}
```

## Chain state

```json
{
  "seed": "123456789",
  "mintedAt": 1760000000,
  "transferCount": 2,
  "windCount": 9,
  "repairCount": 1,
  "overclockCount": 0,
  "burnedCore": false,
  "liquidType": 2,
  "fillLevel": 88,
  "purity": 93,
  "temperature": 47,
  "lastLiquidChangeAt": 1760000000,
  "activeBuildUri": "ipfs://...",
  "activeBuildHash": "0x..."
}
```

## Validation rules before publish

- Every placement must have a valid `partId`.
- Every premium part must be owned/unlocked by the token holder.
- Coordinates must be inside acceptable bounds.
- Scale must be inside min/max range.
- Part count must be under limit.
- Layout hash must match uploaded layout JSON.
