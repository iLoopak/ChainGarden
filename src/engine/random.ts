/** A serializable 32-bit generator. Randomness exists only in this module. */
export function randomNext(seed: number): [number, number] {
  const next = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return [next, next / 4294967296];
}
