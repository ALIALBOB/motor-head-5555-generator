# Chain Schema

## Machine

```solidity
struct Machine {
    uint256 seed;
    uint64 mintedAt;
    uint64 lastActionAt;
    uint32 transferCount;
    uint32 windCount;
    uint32 repairCount;
    uint32 overclockCount;
    uint8 canvasType;
    bool burnedCore;
    LiquidState liquid;
    string layoutURI;
    bytes32 layoutHash;
    uint32 partCount;
    uint32 buildRevision;
}
```

## LiquidState

```solidity
struct LiquidState {
    uint8 liquidType;
    uint8 color;
    uint8 texture;
    uint8 fillLevel;
    uint8 purity;
    uint8 viscosity;
    uint8 temperature;
    bool leaking;
    uint64 lastChangedAt;
}
```

## Part

```solidity
struct Part {
    string key;
    string name;
    uint8 category;
    uint8 rarity;
    string assetURI;
    bool active;
    bool duplicable;
}
```

## Holder actions

- `wind(tokenId, pulses)`
- `repair(tokenId)`
- `overclock(tokenId)`
- `changeOil(tokenId, liquidType, color, texture, viscosity)`
- `setLeakState(tokenId, leaking)`
- `burnCore(tokenId)`
- `publishBuild(tokenId, layoutURI, layoutHash, partCount)`

## Admin/artist actions

- `upsertPart(...)`
- `setStarterPack(...)`
- `grantPartToToken(...)`
- `setRendererURL(...)`
- `setPreviewBaseURI(...)`
- `setContractURI(...)`
- `upgradeToAndCall(...)` through UUPS
