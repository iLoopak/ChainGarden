import { describe, expect, it } from "vitest";
import {
  comboMultiplier,
  createRun,
  harvestValue,
  isLegalAction,
  legalActions,
  MAX_EVENTS,
  neighbors,
  resolveAction,
} from "./game";
import type { GameState, PlantKind } from "./types";
function garden(plants: [number, PlantKind, number][]): GameState {
  const state = createRun(42);
  state.board.fill(null);
  state.nextId = 1;
  plants.forEach(([index, kind, growth]) => {
    state.board[index] = { id: state.nextId++, kind, growth, bornTurn: -1 };
  });
  return state;
}
const harvest = (s: GameState, index: number) =>
  resolveAction(s, { type: "harvest", index });
describe("plant abilities", () => {
  it("sunflower generates ripe passive dew, harvest dew, and neighboring growth", () => {
    const s = garden([
      [14, "sunflower", 2],
      [15, "rose", 0],
    ]);
    const result = resolveAction(s, { type: "plant", index: 0, offer: 0 });
    expect(result.state.dew).toBe(1);
    const after = harvest(result.state, 14);
    expect(after.state.dew).toBe(3);
    expect(after.state.board[15]?.growth).toBe(3);
    expect(after.state.stats.dewEarned).toBe(3);
  });
  it("spends exactly one dew for a planting head start and caps dew at nine", () => {
    const s = garden([
      [14, "sunflower", 3],
      [20, "sunflower", 3],
    ]);
    s.dew = 9;
    const r = resolveAction(s, { type: "plant", index: 0, offer: 0 });
    expect(r.state.board[0]?.growth).toBe(2);
    expect(r.state.dew).toBe(9);
    expect(r.events.find((e) => e.type === "planted")?.text).toContain(
      "1 dew used",
    );
  });
  it("rose activates only orthogonal neighbors, harvesting those that ripen", () => {
    const r = harvest(
      garden([
        [14, "rose", 3],
        [8, "sunflower", 1],
        [15, "cactus", 3],
        [20, "clover", 0],
        [13, "wildflower", 3],
        [7, "mushroom", 3],
      ]),
      14,
    );
    expect(
      r.events.filter((e) => e.type === "activated").map((e) => e.index),
    ).toEqual([8, 15, 20, 13]);
    expect(r.chain).toBe(4);
    expect(r.state.board[7]?.kind).toBe("mushroom");
    expect(r.state.board[20]?.growth).toBeGreaterThanOrEqual(2);
  });
  it("mushroom copies north before other compatible neighbors", () => {
    const r = harvest(
      garden([
        [14, "mushroom", 3],
        [8, "sunflower", 3],
        [15, "rose", 3],
      ]),
      14,
    );
    expect(r.events.find((e) => e.type === "copied")?.kind).toBe("sunflower");
    expect(r.chain).toBe(1);
    expect(r.state.dew).toBe(3);
  });
  it("mushroom skips mushrooms and can copy cactus space bonuses with its own base", () => {
    const s = garden([
      [14, "mushroom", 3],
      [8, "mushroom", 3],
      [15, "cactus", 3],
    ]);
    expect(harvestValue(s, 14)).toBe(35);
    expect(harvest(s, 14).points).toBe(35); // 10 × 2.5 × (1 + 2 × .2)
    expect(
      harvest(
        garden([
          [14, "mushroom", 3],
          [8, "mushroom", 3],
        ]),
        14,
      ).events.some((e) => e.type === "copied"),
    ).toBe(false);
  });
  it("cactus rewards real empty neighbors and does not count edges", () => {
    expect(harvestValue(garden([[14, "cactus", 3]]), 14)).toBe(63);
    expect(harvestValue(garden([[0, "cactus", 3]]), 0)).toBe(49);
    expect(
      harvestValue(
        garden([
          [14, "cactus", 3],
          [15, "rose", 0],
        ]),
        14,
      ),
    ).toBe(56);
  });
  it("ripe clover adds scoring and harvest grows its neighbors", () => {
    expect(
      harvestValue(
        garden([
          [14, "cactus", 3],
          [15, "clover", 3],
        ]),
        14,
      ),
    ).toBe(64);
    expect(
      harvestValue(
        garden([
          [14, "cactus", 3],
          [15, "clover", 2],
        ]),
        14,
      ),
    ).toBe(56);
    const r = harvest(
      garden([
        [14, "clover", 3],
        [15, "mushroom", 0],
      ]),
      14,
    );
    expect(r.state.board[15]?.growth).toBe(2);
  });
  it("wildflower spreads north first, grows neighbors and cannot repeatedly create chains", () => {
    const r = harvest(
      garden([
        [14, "wildflower", 3],
        [15, "cactus", 0],
      ]),
      14,
    );
    expect(r.state.board[8]).toMatchObject({
      kind: "wildflower",
      growth: 0,
      bornTurn: 1,
    });
    expect(r.state.board[15]?.growth).toBe(2);
    expect(r.chain).toBe(1);
    expect(r.events.filter((e) => e.type === "spread")).toHaveLength(1);
  });
  it("wildflower does not spread when every adjacent tile is occupied", () => {
    const r = harvest(
      garden([
        [14, "wildflower", 3],
        ...neighbors(14).map(
          (i) => [i, "cactus", 3] as [number, PlantKind, number],
        ),
      ]),
      14,
    );
    expect(r.events.some((e) => e.type === "spread")).toBe(false);
  });
});
describe("resolution and scoring", () => {
  it("resolves breadth first in north, east, south, west order after seasonal growth", () => {
    const r = harvest(
      garden([
        [14, "rose", 3],
        [8, "rose", 3],
        [15, "cactus", 2],
        [20, "clover", 2],
        [13, "sunflower", 2],
        [2, "cactus", 3],
      ]),
      14,
    );
    expect(
      r.events
        .filter((e) => e.type === "harvested")
        .map((e) => [e.index, e.depth]),
    ).toEqual([
      [14, 0],
      [8, 1],
      [15, 1],
      [20, 1],
      [13, 1],
      [2, 2],
    ]);
    const grow = r.events.findIndex((e) => e.type === "growth");
    expect(grow).toBeGreaterThan(
      r.events.findIndex((e) => e.type === "harvested"),
    );
    expect(grow).toBeLessThan(
      r.events.findIndex((e) => e.type === "activated"),
    );
  });
  it("calculates combo by depth, rounds once per harvest and caps multiplier", () => {
    const s = garden([
      [14, "rose", 3],
      [15, "rose", 3],
      [16, "rose", 3],
    ]);
    const r = harvest(s, 14);
    expect(
      r.events.filter((e) => e.type === "harvested").map((e) => e.points),
    ).toEqual([30, 37, 45]);
    expect(r.points).toBe(112);
    expect(r.chain).toBe(3);
    expect(r.state.stats.bestTurn).toBe(112);
    expect([0, 1, 2, 8, 12].map(comboMultiplier)).toEqual([1, 1.25, 1.5, 3, 3]);
  });
  it("handles competing repeated triggers once per plant and bounds dense chains", () => {
    const s = garden(Array.from({ length: 36 }, (_, i) => [i, "rose", 3]));
    const r = harvest(s, 14);
    const activations = r.events.filter((e) => e.type === "activated");
    expect(r.chain).toBe(36);
    expect(new Set(activations.map((e) => e.index)).size).toBe(
      activations.length,
    );
    expect(r.events.some((e) => e.type === "safety")).toBe(false);
    expect(r.state.board.every((p) => p === null)).toBe(true);
    expect(MAX_EVENTS).toBe(256);
  });
  it("does not mutate input state", () => {
    const s = createRun(12);
    const before = structuredClone(s);
    harvest(s, 20);
    expect(s).toEqual(before);
  });
  it("replenishes all seed offers on planting and harvesting, consumes one turn", () => {
    const s = createRun(999),
      a = resolveAction(s, { type: "plant", index: 0, offer: 1 }),
      b = harvest(s, 20);
    expect(a.state.offers).toEqual(b.state.offers);
    expect(a.state.rng).not.toBe(s.rng);
    expect(a.state.turn).toBe(1);
    expect(b.state.turn).toBe(1);
    expect(a.state.offers).toHaveLength(3);
  });
  it("rejects illegal actions without spending a turn", () => {
    const s = createRun(3);
    for (const action of [
      { type: "plant", index: 14, offer: 0 },
      { type: "plant", index: 0, offer: 3 },
      { type: "harvest", index: 0 },
      { type: "harvest", index: 36 },
      { type: "harvest", index: NaN },
    ] as const) {
      expect(isLegalAction(s, action)).toBe(false);
      expect(() => resolveAction(s, action)).toThrow();
    }
    expect(s.turn).toBe(0);
  });
  it("always provides a legal action on an empty or full board", () => {
    expect(legalActions(garden([]))).toHaveLength(108);
    expect(
      legalActions(
        garden(Array.from({ length: 36 }, (_, i) => [i, "cactus", 3])),
      ),
    ).toHaveLength(36);
  });
  it("ends exactly on turn 25 without passive final harvest, and rejects further actions", () => {
    let s = createRun(88);
    for (let i = 0; i < 25; i++) s = resolveAction(s, legalActions(s)[0]).state;
    expect(s.turn).toBe(25);
    expect(s.status).toBe("finished");
    expect(legalActions(s)).toEqual([]);
    expect(() => resolveAction(s, { type: "harvest", index: 0 })).toThrow();
    const logScore = s.stats.bestTurn;
    expect(logScore).toBeGreaterThanOrEqual(0);
  });
  it("reproduces entire runs and event streams from seeded RNG", () => {
    const play = (seed: number) => {
      let s = createRun(seed);
      const logs = [];
      for (let i = 0; i < 25; i++) {
        const actions = legalActions(s);
        const r = resolveAction(s, actions[(i * 17) % actions.length]);
        s = r.state;
        logs.push(r.events);
      }
      return { s, logs };
    };
    expect(play(123456)).toEqual(play(123456));
    expect(createRun(1).offers).not.toEqual(createRun(99999).offers);
  });
});
