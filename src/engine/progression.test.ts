import { describe, expect, it } from "vitest";
import {
  createRun,
  isLegalAction,
  legalActions,
  nextSeed,
  previewHarvest,
  resolveAction,
} from "./game";
import {
  eligibleUpgrades,
  MUTATIONS,
  RESEARCH,
  STARTER_POOL,
  UPGRADES,
} from "./content";
import { reactorTier } from "./balance";
import { mutationEligible, resolveMutations } from "./mutations";
import type { GameState, MutationId, PlantKind, UpgradeId } from "./types";
import { presentEvents } from "../presentation/playback";
const research = RESEARCH.map((r) => r.id);
function garden(
  plants: [number, PlantKind, number, MutationId?][],
  upgrades: UpgradeId[] = [],
): GameState {
  const s = createRun(123, "fixture", {
    research,
    specimens: ["mushroom", "cactus"],
  });
  s.board.fill(null);
  s.nextId = 1;
  s.upgrades = upgrades;
  for (const [i, kind, growth, trait] of plants)
    s.board[i] = {
      id: s.nextId++,
      kind,
      growth,
      bornTurn: 0,
      traits: trait ? [trait] : [],
    };
  return s;
}
const harvest = (s: GameState, index = 14) =>
  resolveAction(s, { type: "harvest", index });
describe("upgrade registry and milestones", () => {
  it("offers three distinct eligible choices at all four exact milestones and waits for a saved decision", () => {
    let s = createRun(88);
    let picks = 0;
    while (s.status === "playing") {
      const r = resolveAction(s, legalActions(s)[0]);
      s = r.state;
      if (s.pendingUpgrade.length) {
        expect([5, 10, 15, 20]).toContain(s.turn);
        expect(s.pendingUpgrade).toHaveLength(3);
        expect(new Set(s.pendingUpgrade).size).toBe(3);
        expect(legalActions(s).every((a) => a.type === "upgrade")).toBe(true);
        expect(isLegalAction(s, { type: "plant", index: 0, offer: 0 })).toBe(
          false,
        );
        const before = structuredClone(s);
        s = resolveAction(s, legalActions(s)[0]).state;
        expect(s.turn).toBe(before.turn);
        expect(s.rng).toBe(before.rng);
        expect(s.board).toEqual(before.board);
        picks++;
      }
    }
    expect(picks).toBe(4);
    expect(s.upgrades).toHaveLength(4);
    expect(new Set(s.upgrades).size).toBe(4);
  });
  it("gates six research upgrades, forbids duplicates and symmetric conflicts", () => {
    expect(UPGRADES.filter((u) => u.research)).toHaveLength(6);
    expect(eligibleUpgrades([], []).every((u) => !u.research)).toBe(true);
    expect(
      eligibleUpgrades(research, ["adaptive"]).some(
        (u) => u.id === "pollination" || u.id === "adaptive",
      ),
    ).toBe(false);
    expect(
      eligibleUpgrades(research, ["pollination"]).some(
        (u) => u.id === "adaptive",
      ),
    ).toBe(false);
  });
  it("accelerates exactly the two defined species and stacks with dew", () => {
    const s = garden([], ["accelerated"]);
    s.offers = ["sunflower", "rose", "wildflower"];
    s.dew = 1;
    expect(
      resolveAction(s, { type: "plant", index: 0, offer: 0 }).state.board[0]
        ?.growth,
    ).toBe(3);
    expect(
      resolveAction({ ...s, dew: 0 }, { type: "plant", index: 0, offer: 2 })
        .state.board[0]?.growth,
    ).toBe(2);
    expect(
      resolveAction({ ...s, dew: 0 }, { type: "plant", index: 0, offer: 1 })
        .state.board[0]?.growth,
    ).toBe(1);
  });
  it("replicates only the first compatible harvest; newborn IDs do not harvest", () => {
    const r = harvest(
      garden(
        [
          [14, "rose", 3],
          [8, "wildflower", 3],
          [15, "wildflower", 3],
        ],
        ["replication"],
      ),
    );
    expect(r.events.filter((e) => e.type === "spread")).toHaveLength(3);
    expect(r.chain).toBe(3);
    expect(r.state.board.filter((p) => p?.bornTurn === 1)).toHaveLength(3);
  });
  it("adds resonance only on the third harvest and echoes an ability without scoring twice", () => {
    const s = garden([
        [14, "rose", 3],
        [15, "rose", 3],
        [16, "cactus", 3],
      ]),
      base = harvest(s);
    expect(
      harvest({ ...s, upgrades: ["resonance"] }).points - base.points,
    ).toBe(10);
    const echo = harvest(garden([[14, "sunflower", 3]], ["echo"]));
    expect(echo.chain).toBe(1);
    expect(echo.state.dew).toBe(4);
  });
  it("relays directed growth across connected plants once, never relays the seasonal phase", () => {
    const s = garden(
      [
        [14, "sunflower", 3],
        [15, "cactus", 0],
        [16, "cactus", 0],
      ],
      ["network"],
    );
    const r = harvest(s);
    expect(r.state.board[16]?.growth).toBe(2);
    expect(
      r.events.filter((e) => e.source !== undefined && e.type === "growth")
        .length,
    ).toBeLessThanOrEqual(2);
    const season = resolveAction(s, { type: "plant", index: 0, offer: 0 });
    expect(season.state.board[16]?.growth).toBe(1);
  });
  it("neural mycelium reaches one step beyond copied rose activation", () => {
    const s = garden([
      [14, "mushroom", 3],
      [8, "rose", 3],
      [15, "cactus", 3],
      [16, "cactus", 3],
    ]);
    expect(harvest(s).state.board[16]).not.toBeNull();
    expect(harvest({ ...s, upgrades: ["neural"] }).state.board[16]).toBeNull();
  });
  it("scanner peeks without advancing RNG; recycler spends one dew without growth or a turn", () => {
    const s = garden([], ["scanner", "recycler"]);
    s.recyclerLeft = 1;
    s.dew = 2;
    const before = structuredClone(s),
      next = nextSeed(s);
    expect(nextSeed(s)).toBe(next);
    expect(s).toEqual(before);
    const r = resolveAction(s, { type: "recycle", offer: 2 });
    expect(r.state.turn).toBe(0);
    expect(r.state.board).toEqual(s.board);
    expect(r.state.dew).toBe(1);
    expect(r.state.offers[2]).toBe(next);
    expect(isLegalAction(r.state, { type: "recycle", offer: 0 })).toBe(false);
  });
  it("prunes without harvest effects, consumes a turn and two-use cap", () => {
    const s = garden(
      [
        [14, "rose", 3],
        [15, "cactus", 3],
      ],
      ["pruning"],
    );
    s.pruningLeft = 2;
    s.instability = 30;
    const r = resolveAction(s, { type: "prune", index: 14 });
    expect(r.chain).toBe(0);
    expect(r.points).toBe(0);
    expect(r.state.board[15]).not.toBeNull();
    expect(r.state.instability).toBe(22);
    expect(r.state.pruningLeft).toBe(1);
    expect(r.state.turn).toBe(1);
  });
  it("volatile sap ties score to actual heat; critical bloom has one bounded collateral loss", () => {
    const s = garden([
      [14, "rose", 3],
      [15, "rose", 3],
      [16, "rose", 3],
      [20, "cactus", 0],
    ]);
    s.instability = 30;
    const base = harvest(s),
      volatile = harvest({ ...s, upgrades: ["volatile"] });
    expect(volatile.points).toBeGreaterThan(base.points);
    expect(volatile.state.instability).toBeGreaterThan(base.state.instability);
    const critical = harvest({ ...s, upgrades: ["critical"] });
    expect(critical.events.filter((e) => e.type === "destroyed")).toHaveLength(
      1,
    );
    expect(critical.state.board[20]).toBeNull();
    expect(critical.points).toBeGreaterThan(base.points);
  });
  it("adaptive allows a second trait; cross-pollination transfers only once and adds heat", () => {
    const s = garden(
      [
        [14, "sunflower", 3, "cooling"],
        [8, "rose", 3],
        [15, "cactus", 3],
      ],
      ["pollination"],
    );
    s.instability = 10;
    const r = resolveAction(s, { type: "plant", index: 0, offer: 0 });
    expect(
      r.events.filter((e) => e.type === "mutation" && e.source !== undefined),
    ).toHaveLength(1);
    expect(r.state.board[8]?.traits).toContain("cooling");
    expect(r.state.instability).toBe(14);
    const a = garden([[14, "wildflower", 3, "charged"]], ["adaptive"]);
    resolveMutations(a);
    expect(a.board[14]?.traits).toEqual(["charged", "wandering"]);
    const b = garden([[14, "wildflower", 3, "charged"]]);
    resolveMutations(b);
    expect(b.board[14]?.traits).toEqual(["charged"]);
  });
});
describe("reactor and protocols", () => {
  it("defines every tier boundary", () => {
    expect([0, 24, 25, 49, 50, 74, 75, 99, 100].map(reactorTier)).toEqual([
      "Stable",
      "Stable",
      "Reactive",
      "Reactive",
      "Volatile",
      "Volatile",
      "Critical",
      "Critical",
      "Overload",
    ]);
  });
  it("vents for exactly 3 dew and one seasonal action; cooling never goes negative", () => {
    const s = garden([[14, "cactus", 0]]);
    s.dew = 3;
    s.instability = 9;
    const r = resolveAction(s, { type: "stabilize" });
    expect(r.state.instability).toBe(0);
    expect(r.state.dew).toBe(0);
    expect(r.state.board[14]?.growth).toBe(1);
    expect(r.state.turn).toBe(1);
    expect(isLegalAction(r.state, { type: "stabilize" })).toBe(false);
    expect(harvest(garden([[14, "moonflower", 3]])).state.instability).toBe(0);
  });
  it("latches one deterministic overload, destroys at most three in root/N/E/S/W order, compensates and remains playable", () => {
    const s = garden([
      [14, "cactus", 3],
      [8, "cactus", 3],
      [15, "cactus", 3],
      [20, "cactus", 3],
      [13, "cactus", 3],
    ]);
    s.instability = 99;
    const r = harvest(s);
    expect(
      r.events.filter((e) => e.type === "destroyed").map((e) => e.index),
    ).toEqual([8, 15, 20]);
    expect(r.state.board[13]).not.toBeNull();
    expect(r.state.instability).toBe(35);
    expect(r.state.stats.overloads).toBe(1);
    expect(r.state.chargedSeeds).toBe(2);
    expect(r.state.dew).toBe(3);
    expect(r.events.filter((e) => e.type === "overload")).toHaveLength(1);
    expect(r.chain).toBe(1);
    expect(legalActions(r.state).length).toBeGreaterThan(0);
    const planted = resolveAction(r.state, {
      type: "plant",
      index: 0,
      offer: 0,
    });
    expect(planted.state.board[0]?.growth).toBe(3);
    expect(planted.state.chargedSeeds).toBe(1);
    expect(presentEvents(s.board, r.events)).toEqual(r.state.board);
  });
  it("cannot avert a latched overload with late cooling", () => {
    const s = garden([[14, "moonflower", 3]]);
    s.instability = 99;
    const r = harvest(s);
    expect(r.events.some((e) => e.type === "heat" && e.heat === 88)).toBe(true);
    expect(r.state.stats.overloads).toBe(1);
    expect(r.state.instability).toBe(35);
  });
  it("gates protocols, specimens and challenge; researched protocols change actual rules and layout", () => {
    expect(() => createRun(1, "x", { protocol: "volatile" })).toThrow();
    expect(() => createRun(1, "x", { specimens: ["cactus"] })).toThrow();
    expect(() => createRun(1, "x", { challenge: true })).toThrow();
    const v = createRun(1, "x", { research, protocol: "volatile" });
    expect(v.instability).toBe(30);
    expect(v.board[15]?.kind).toBe("rose");
    const s = garden([
      [14, "sunflower", 3],
      [15, "clover", 0],
      [16, "cactus", 0],
    ]);
    s.config.protocol = "symbiotic";
    expect(harvest(s).state.board[16]?.growth).toBe(2);
    const c = createRun(1, "c", { research, challenge: true });
    expect(c.blocked).toEqual([0, 5, 30, 35]);
    expect(c.instability).toBe(45);
    expect(isLegalAction(c, { type: "plant", index: 0, offer: 0 })).toBe(false);
    expect(createRun(1).config.pool).toEqual(STARTER_POOL);
  });
});
describe("ten contextual mutations and composable effects", () => {
  const examples: Record<
    MutationId,
    [number, PlantKind, number, MutationId?][]
  > = {
    fungal: [
      [14, "rose", 3],
      [8, "mushroom", 0],
    ],
    charged: [
      [14, "sunflower", 3],
      [8, "rose", 0],
    ],
    thorns: [[14, "cactus", 3]],
    symbiotic: [
      [14, "clover", 3],
      [8, "rose", 0],
      [15, "sunflower", 0],
      [20, "cactus", 0],
    ],
    wandering: [[14, "wildflower", 3]],
    mirror: [
      [14, "mushroom", 3],
      [8, "rose", 0],
      [15, "sunflower", 0],
    ],
    cooling: [
      [14, "cactus", 3],
      [8, "clover", 0],
      [15, "moonflower", 0],
    ],
    deep: [[14, "cactus", 3]],
    resonant: [
      [14, "rose", 3],
      [8, "clover", 0],
    ],
    grafted: [
      [14, "cactus", 3],
      [8, "moonflower", 0],
      [15, "rose", 0, "charged"],
    ],
  };
  for (const m of MUTATIONS)
    it(`requires real context for ${m.name} and transforms deterministically`, () => {
      const s = garden(examples[m.id]);
      s.turn = m.id === "deep" ? 6 : 2;
      s.instability = m.id === "thorns" ? 50 : m.id === "resonant" ? 25 : 0;
      if (m.id === "charged") s.board[14]!.exposure = 2;
      expect(mutationEligible(s, 14, m.id)).toBe(true);
      const a = structuredClone(s),
        b = structuredClone(s);
      const transformed = resolveMutations(a);
      expect(transformed).toEqual(resolveMutations(b));
      expect(
        transformed.some((e) => e.index === 14 && e.mutation === m.id),
      ).toBe(true);
      // Some earlier eligible traits have registry priority; test the queried trait in isolation.
      s.board[14]!.growth = 2;
      expect(mutationEligible(s, 14, m.id)).toBe(false);
      if (m.requires) {
        s.board[14]!.growth = 3;
        s.config.research = [];
        expect(mutationEligible(s, 14, m.id)).toBe(false);
      }
    });
  it("requires two distinct saved resonance exposures and reports first discovery once", () => {
    let s = garden([
      [14, "sunflower", 3],
      [8, "rose", 0],
    ]);
    s = resolveAction(s, { type: "plant", index: 0, offer: 0 }).state;
    expect(s.board[14]?.traits ?? []).not.toContain("charged");
    const r = resolveAction(s, { type: "plant", index: 1, offer: 0 });
    expect(r.state.board[14]?.traits).toContain("charged");
    expect(r.events.find((e) => e.mutation === "charged")?.first).toBe(true);
    const known = garden([[14, "wildflower", 3]]);
    known.config.knownMutations = ["wandering"];
    expect(
      resolveMutations(known).find((e) => e.mutation === "wandering")?.first,
    ).toBe(false);
  });
  it("fungal diagonals, charged dew, thorns activation, symbiotic aura and wandering spread all act", () => {
    expect(
      harvest(
        garden([
          [14, "rose", 3, "fungal"],
          [7, "cactus", 3],
        ]),
      ).chain,
    ).toBe(2);
    expect(harvest(garden([[14, "sunflower", 3, "charged"]])).state.dew).toBe(
      4,
    );
    expect(
      harvest(
        garden([
          [14, "cactus", 3, "thorns"],
          [8, "cactus", 3],
        ]),
      ).chain,
    ).toBe(2);
    const a = garden([
        [14, "cactus", 3],
        [15, "clover", 3, "symbiotic"],
      ]),
      b = structuredClone(a);
    b.board[15]!.traits = [];
    expect(harvest(a).points - harvest(b).points).toBe(8);
    expect(
      harvest(garden([[14, "wildflower", 3, "wandering"]])).events.filter(
        (e) => e.type === "spread",
      ),
    ).toHaveLength(2);
  });
  it("mirror repeats ability, cooling cools, deep adds growth, resonant raises depth, lunar graft copies", () => {
    expect(
      harvest(
        garden([
          [14, "mushroom", 3, "mirror"],
          [8, "sunflower", 3],
        ]),
      ).state.dew,
    ).toBe(5);
    const s = garden([[14, "cactus", 3, "cooling"]]);
    s.instability = 30;
    expect(harvest(s).state.instability).toBe(20);
    expect(
      harvest(
        garden([
          [14, "cactus", 3, "deep"],
          [8, "rose", 0],
        ]),
      ).state.board[8]?.growth,
    ).toBe(2);
    expect(
      harvest(
        garden([
          [14, "rose", 3, "resonant"],
          [8, "cactus", 3],
        ]),
      ).events.find((e) => e.type === "harvested" && e.index === 8)?.depth,
    ).toBe(2);
    expect(
      harvest(
        garden([
          [14, "cactus", 3, "grafted"],
          [8, "sunflower", 3],
        ]),
      ).state.dew,
    ).toBe(3);
  });
  it("bounds the densest traited echo/network chains with unique harvest IDs and exact forecasts", () => {
    const s = garden(
      Array.from({ length: 36 }, (_, i) => [
        i,
        i % 3 ? "rose" : "mushroom",
        3,
        "fungal",
      ]),
      ["echo", "network", "neural", "critical"],
    );
    s.board.forEach((p) => {
      p!.traits = ["fungal", "resonant"];
    });
    const before = structuredClone(s),
      r = harvest(s);
    expect(r.chain).toBe(36);
    expect(r.events.filter((e) => e.type === "harvested")).toHaveLength(36);
    expect(r.events.some((e) => e.type === "safety")).toBe(false);
    expect(r.events.length).toBeLessThan(1024);
    expect(s).toEqual(before);
    expect(previewHarvest(s, 14)?.points).toBe(r.points);
    expect(presentEvents(s.board, r.events)).toEqual(r.state.board);
  });
});

describe("run identity", () => {
  it("preserves explicit pool ordering for legacy seed replays and rejects locked pool injection", () => {
    const pool: PlantKind[] = [
      "sunflower",
      "rose",
      "mushroom",
      "cactus",
      "clover",
      "wildflower",
    ];
    const options = {
      research,
      specimens: ["mushroom", "cactus"] as PlantKind[],
      poolOrder: pool,
    };
    const a = createRun(89, "a", options),
      b = createRun(89, "b", options);
    expect(a.offers).toEqual(b.offers);
    expect(a.rng).toBe(b.rng);
    expect(a.config.pool).toEqual(pool);
    expect(() => createRun(89, "x", { poolOrder: pool })).toThrow("pool");
  });
  it("Briar trades extra heat for a stronger catalyst; Moonflower cools and grows", () => {
    const briar = harvest(
      garden([
        [14, "briar", 3],
        [8, "cactus", 3],
      ]),
    );
    const rose = harvest(
      garden([
        [14, "rose", 3],
        [8, "cactus", 3],
      ]),
    );
    expect(briar.chain).toBe(rose.chain);
    expect(briar.points).toBeGreaterThan(rose.points);
    expect(briar.state.instability - rose.state.instability).toBe(6);
    const moon = garden([
      [14, "moonflower", 3],
      [8, "cactus", 0],
    ]);
    moon.instability = 30;
    const result = harvest(moon);
    expect(result.state.instability).toBe(20);
    expect(result.state.board[8]?.growth).toBe(2);
  });
});
