# Living Archive Machines Collection Engine

This step creates the fixed identity assignments for the 3333-token collection without rendering 3333 images yet.

## Command

```bash
npm run lam:collection
```

The command uses a deterministic seed:

- Preview seed: `living-archive-machines-preview-v1`
- Production seed: set `LAM_PRODUCTION_SEED` before final generation

Do not change the production seed after art approval.

## Outputs

The generator writes:

- `build/collection/trait-assignments.json`
- `build/collection/trait-summary.json`
- `build/collection/review-sample.json`

The first 18 tokens stay locked to the current hand-built prototype demos. Tokens 19-3333 are generated from the fixed trait catalog with rarity weights, compatibility checks, and connection bias.

## Background Direction

Backgrounds are intentionally single-color PFP fields. The first pass uses 18 curated colors so the collection has variety without distracting from the machine head, transparent clothes, fluid systems, and moving parts.

## Current Rules

- Head expressions are selected only from the matching head family.
- Hats are filtered for silhouette compatibility.
- Exact trait duplicates are rejected.
- Head and clothes caps are enforced from `config/lam_rarity_rules.json`.
- Strong connected trait pairings from `config/lam_connection_rules.json` are favored.
- The report separates explicit signature connection rules from broader compatible trait links.
- The generator produces reports only; it does not render heavy images or animations for all 3333 tokens.

## Art Notes

The current fixed catalog is still a prototype production set. It has 18 heads and 20 clothes, but the rarity plan recommends expanding backgrounds, chassis, heads, hats, accessories, cores, and evolution overlays before the final 3333 render.

Next art passes should focus on adding traits that score 3+ in the reaction catalog and especially score-5 traits that connect across head, body, neck, back, and chest systems.
