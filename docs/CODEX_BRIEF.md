# Codex Brief

Build goal: turn this prototype into a production-ready dynamic NFT project.

## Product idea

A holder owns a mechanical canvas. The starting canvas is already art. The holder can later use a freeform editor to move gears, pipes, bolts, liquid drops, smoke, sparks, and other mechanical pieces into any composition. Some people may make faces, animals, apes, penguins, skulls, machines, logos, or abstract art.

## Main systems

1. ERC721 upgradeable Solidity contract
2. On-chain machine state
3. Part registry and token-specific part inventory
4. Freeform layout JSON
5. Canvas renderer
6. Holder builder/editor
7. IPFS/Arweave publishing flow
8. Marketplace metadata refresh

## Contract must protect

- ownership checks on holder actions
- role checks on admin/config/part actions
- storage layout for upgrades
- max supply
- payment handling
- metadata update events

## Renderer must support

- loading local/sample layout JSON
- loading published layoutURI if present
- chain state changes
- time-based animation
- oil/liquid visuals
- burned-core visuals
- transfer scars
- wind/overclock motion

## Editor must support

- free movement
- rotation
- scale
- layer order
- duplicate/delete
- import/export JSON
- optional snapping
- publishing flow
- many micro-parts

## Good next upgrades

- add exact path-based hit testing
- add undo/redo history
- add layer panel
- add part search/filtering
- add wallet-owned part inventory loading
- add IPFS upload integration
- add preview SVG generation
- add renderer-only mode for `animation_url`
- add multiplayer/gallery sharing
