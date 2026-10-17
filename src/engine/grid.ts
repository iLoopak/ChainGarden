export const SIZE = 6;
export function neighbors(index: number): number[] {
  const row = Math.floor(index / SIZE),
    col = index % SIZE;
  return [
    row > 0 ? index - SIZE : -1,
    col < SIZE - 1 ? index + 1 : -1,
    row < SIZE - 1 ? index + SIZE : -1,
    col > 0 ? index - 1 : -1,
  ].filter((i) => i >= 0);
}
export function diagonals(index: number): number[] {
  const row = Math.floor(index / SIZE),
    col = index % SIZE;
  return [
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1],
  ]
    .filter(
      ([y, x]) =>
        row + y >= 0 && row + y < SIZE && col + x >= 0 && col + x < SIZE,
    )
    .map(([y, x]) => (row + y) * SIZE + col + x);
}
