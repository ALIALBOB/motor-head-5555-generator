# Codex Task List

Run these as separate Codex tasks or PRs.

## Task 1 — Upgrade the web app to the blueprint builder UI

Use `web/prototypes/blueprint-builder-demo.html` and `assets/concepts/mechanical-nft-builder-ui-blueprint.png` as references.

Deliverables:

- Main `web/` app uses white/black technical blueprint visual style.
- Canvas fills center with side/bottom panels.
- Parts tray shows owned and locked/premium parts.
- Selection handles, rotation handle, and connector points are visible.
- Buttons: Reset Canvas, Preview Motion, Save Build Off-Chain, Save On-Chain / Sign.
- Keep existing freeform movement features working.

Acceptance:

- `npm run dev` opens a professional builder.
- Existing parts can be moved without wallet.
- Locked parts are visibly locked.
- Exported layout JSON includes positions/rotation/scale/z.

## Task 2 — Implement connection engine

Deliverables:

- `web/src/connectionEngine.js` pure utility module.
- Detect gear mesh connections by radius distance.
- Detect pipe connector snapping by connector distance/kind.
- Detect belt links between compatible wheels.
- Return connection graph with active/inactive state.
- Show connection highlights in renderer.

Acceptance:

- Unit tests for gear mesh, pipe snap, belt link, invalid connection.
- Moving a part updates connections live.

## Task 3 — Improve motion renderer

Deliverables:

- Connected gears rotate in correct relation.
- Pipe networks show flow animation.
- Tanks show animated liquid wave.
- Belts show moving belt line.
- Disconnected parts still move lightly but are visually marked inactive if appropriate.

Acceptance:

- Preview Motion toggle starts/stops animation.
- Connected systems visibly move together.

## Task 4 — Part ownership / locked part flow

Deliverables:

- `ownedPartIds` and `unlockedPackIds` loaded from mock state first.
- Locked parts can be previewed but not published.
- Publish validator blocks locked/unowned parts.
- Add placeholder Buy/Unlock flow with clear function boundary for contract call later.

Acceptance:

- User can drag starter parts.
- User can drag/preview a locked part only in preview mode or with watermark.
- Save on-chain refuses locked part with helpful message.

## Task 5 — Off-chain save and publish flow

Deliverables:

- Save draft to localStorage.
- Export/import layout JSON.
- Compute layout hash.
- Prepare `publishBuild(tokenId, layoutUri, layoutHash)` call.
- Mock IPFS upload boundary if real upload is not configured.

Acceptance:

- Off-chain save requires no wallet.
- Publish requires wallet and validates layout.

## Task 6 — Contract review and tests

Deliverables:

- Ensure contract compiles.
- Add tests for mint, wind, repair, overclock, changeOil, unlock/equip parts, publishBuild, burnCore, transferCount increment, metadata update events.
- Review storage layout for upgradeability.

Acceptance:

- `npm run compile` passes.
- `npm test` passes.
- Any risks are documented in `docs/SECURITY_NOTES.md`.

## Task 7 — Metadata and NFT viewer

Deliverables:

- `tokenURI` points to metadata including `image` and `animation_url`.
- Animation viewer can load tokenId, fetch active build layout, read chain state, and render moving art.
- Static preview generator outputs SVG/PNG for marketplace image.

Acceptance:

- Sample metadata renders local animation URL.
- Viewer works without editor UI.
