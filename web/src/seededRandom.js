// Tiny deterministic RNG for art generation.
// Use this in renderer/generator when you need repeatable pseudo-randomness from a seed.
export function createRng(seed) {
  let s = seed >>> 0;
  return function random() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
