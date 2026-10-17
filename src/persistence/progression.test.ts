import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createRun, legalActions, resolveAction } from "../engine/game";
import { RESEARCH } from "../engine/content";
import {
  canPurchase,
  completionBiomass,
  decodeSave,
  emptySave,
  IndexedDBStorage,
  ownedResearch,
  purchaseResearch,
  recordRun,
} from "./storage";
import type { GameState } from "../engine/types";
function completed(seed = 1, score = 600) {
  const s = createRun(seed, `run-${seed}`);
  s.turn = 25;
  s.status = "finished";
  s.score = score;
  return s;
}
function funded() {
  let data = emptySave();
  for (let i = 0; i < 12; i++) data = recordRun(data, completed(i, 1500));
  return data;
}
describe("progression ledger and atomic restoration", () => {
  it("awards completion, bounded score milestones, chains and challenge separately", () => {
    const s = completed();
    expect(completionBiomass(s)).toBe(12);
    s.score = 100000;
    s.stats.bestChain = 36;
    expect(completionBiomass(s)).toBe(16);
    s.config.challenge = true;
    s.stats.overloads = 1;
    expect(completionBiomass(s)).toBe(22);
    s.score = 599;
    expect(completionBiomass(s)).toBe(13);
  });
  it("pays each discovery immediately once, including after repeated reload and a different run", async () => {
    const run = createRun(1);
    run.discoveries = ["wandering"];
    run.stats.mutations = 1;
    const storage = new IndexedDBStorage(`discovery-${Math.random()}`);
    let data = recordRun(emptySave(), run);
    expect(data.profile.biomass).toBe(3);
    await storage.save(data);
    data = recordRun(await storage.load(), run);
    expect(data.profile.biomass).toBe(3);
    const other = createRun(2);
    other.discoveries = ["wandering", "deep"];
    data = recordRun(data, other);
    expect(data.profile.biomass).toBe(6);
    expect(data.profile.discoveries).toEqual(["wandering", "deep"]);
    expect(decodeSave(data)).toEqual(data);
  });
  it("retains reward IDs beyond the last 100 summaries", () => {
    let data = emptySave();
    for (let i = 0; i < 110; i++) data = recordRun(data, completed(i));
    expect(data.completed).toHaveLength(100);
    const biomass = data.profile.biomass;
    data = recordRun(decodeSave(data), completed(0));
    expect(data.profile.biomass).toBe(biomass);
    expect(data.profile.rewardedRuns).toHaveLength(110);
  });
  it("requires actual funds and dependencies; each of ten nodes purchases once at its exact price", () => {
    expect(canPurchase(emptySave(), "mycology")).toBe(false);
    expect(() => purchaseResearch(emptySave(), "mycology")).toThrow();
    let data = funded();
    expect(canPurchase(data, "lunar")).toBe(false);
    expect(() => purchaseResearch(data, "containment")).toThrow();
    for (const r of RESEARCH) {
      const before = data.profile.biomass;
      expect(canPurchase(data, r.id)).toBe(true);
      data = purchaseResearch(data, r.id);
      expect(data.profile.biomass).toBe(before - r.cost);
      expect(() => purchaseResearch(data, r.id)).toThrow();
    }
    expect(ownedResearch(data)).toHaveLength(10);
    expect(decodeSave(data)).toEqual(data);
  });
  it("rejects accidental currency, ownership, duplicate ledger and dependency corruption", () => {
    const data = funded();
    const bad = [
      { ...data.profile, biomass: -1 },
      { ...data.profile, biomass: data.profile.biomass + 1 },
      { ...data.profile, earned: NaN },
      {
        ...data.profile,
        rewardedRuns: [
          ...data.profile.rewardedRuns,
          data.profile.rewardedRuns[0],
        ],
      },
      { ...data.profile, purchases: [{ id: "lunar", cost: 12 }] },
      { ...data.profile, purchases: [{ id: "mycology", cost: 0 }] },
    ];
    for (const profile of bad)
      expect(() => decodeSave({ ...data, profile })).toThrow();
    const locked = createRun(1, "x", {
      research: ["mycology"],
      specimens: ["mushroom"],
    });
    expect(() => decodeSave({ ...emptySave(), current: locked })).toThrow(
      "locked",
    );
  });
  it("roundtrips an interrupted draft, preserves choices and cannot plant through it", async () => {
    let run = createRun(51);
    while (run.turn < 5) run = resolveAction(run, legalActions(run)[0]).state;
    expect(run.pendingUpgrade).toHaveLength(3);
    const storage = new IndexedDBStorage(`draft-${Math.random()}`);
    await storage.save(recordRun(emptySave(), run));
    const loaded = await storage.load();
    expect(loaded.current).toEqual(run);
    expect(() =>
      resolveAction(loaded.current!, { type: "plant", index: 5, offer: 0 }),
    ).toThrow();
    const a = resolveAction(run, legalActions(run)[0]),
      b = resolveAction(loaded.current!, legalActions(run)[0]);
    expect(a).toEqual(b);
    expect(b.state.turn).toBe(5);
  });
  it("preserves discoveries and completion in the same atomic save and never repays either", async () => {
    const run = completed();
    run.discoveries = ["deep", "wandering"];
    const storage = new IndexedDBStorage(`reward-${Math.random()}`);
    await storage.save(recordRun(emptySave(), run));
    const data = await storage.load();
    expect(data.profile.biomass).toBe(18);
    expect(data.completed[0].biomass).toBe(18);
    expect(recordRun(data, run)).toEqual(data);
  });
});
describe("version 1 migration", () => {
  function legacy() {
    const s = createRun(777, "legacy");
    return {
      schemaVersion: 1,
      settings: { sound: true, reducedMotion: true },
      best: 500,
      completed: [
        { id: "archived", seed: 32, score: 500, turns: 25, stats: s.stats },
      ],
      current: {
        version: 1,
        id: s.id,
        seed: s.seed,
        rng: s.rng,
        turn: 7,
        maxTurns: 25,
        board: s.board,
        offers: ["mushroom", "cactus", "rose"],
        score: 48,
        dew: 2,
        nextId: s.nextId,
        status: "playing",
        stats: s.stats,
      },
    };
  }
  it("preserves the garden, seed stream, settings and old species while explicitly crediting past completions once", async () => {
    const old = legacy(),
      data = decodeSave(old);
    expect(data.schemaVersion).toBe(3);
    expect(data.current?.rng).toBe(old.current.rng);
    expect(data.current?.board).toEqual(old.current.board);
    expect(data.current?.turn).toBe(7);
    expect(data.settings).toEqual({ ...old.settings, guidance: true });
    expect(ownedResearch(data)).toEqual(["mycology", "xerophytes"]);
    expect(data.profile.biomass).toBe(11);
    expect(data.profile.purchases.every((p) => p.legacy && p.cost === 0)).toBe(
      true,
    );
    const storage = new IndexedDBStorage(`legacy-${Math.random()}`);
    await storage.save(data);
    const restored = await storage.load();
    expect(restored).toEqual(data);
    expect(decodeSave(restored).profile.biomass).toBe(11);
    const next = resolveAction(
      restored.current!,
      legalActions(restored.current!)[0],
    );
    expect(next.state.turn).toBe(8);
  });
  it("rejects malformed legacy history and unknown future schemas without replacing them", () => {
    const old = legacy();
    old.current.rng = -1;
    expect(() => decodeSave(old)).toThrow("damaged");
    expect(() => decodeSave({ schemaVersion: 99 })).toThrow("version");
  });
  it("migrates a finished legacy run whose reward was already in history without duplication", () => {
    const old = legacy();
    old.current = {
      ...old.current,
      id: "archived",
      turn: 25,
      status: "finished",
    };
    const data = decodeSave(old);
    expect(recordRun(data, data.current as GameState).profile.biomass).toBe(
      data.profile.biomass,
    );
  });
});

describe("transition invariants across researched builds", () => {
  it("validates every saved transition across all protocols, variants, drafts and challenges", () => {
    let data = funded();
    for (const node of RESEARCH) data = purchaseResearch(data, node.id);
    for (let seed = 1; seed <= 60; seed++) {
      let run = createRun(seed * 733, `invariant-${seed}`, {
        research: ownedResearch(data),
        specimens: seed % 2 ? ["moonflower", "briar"] : ["mushroom", "cactus"],
        protocol:
          seed % 3 === 0
            ? "volatile"
            : seed % 3 === 1
              ? "symbiotic"
              : "standard",
        challenge: seed % 4 === 0,
        knownMutations: data.profile.discoveries,
      });
      data = recordRun(data, run);
      let step = 0;
      while (run.status === "playing") {
        const legal = legalActions(run);
        expect(legal.length).toBeGreaterThan(0);
        run = resolveAction(
          run,
          legal[(seed * 13 + step++ * 47) % legal.length],
        ).state;
        data = recordRun(data, run);
        expect(decodeSave(JSON.parse(JSON.stringify(data)))).toEqual(data);
        expect(step).toBeLessThan(32);
      }
      expect(run.turn).toBe(25);
    }
  });
  it("continues migrated games through every remaining milestone and completion", () => {
    const state = createRun(177);
    const raw = {
      schemaVersion: 1,
      current: { ...state, version: 1, turn: 7 },
      settings: { sound: false, reducedMotion: true },
      best: 0,
      completed: [],
    };
    let data = decodeSave(raw),
      run = data.current!;
    while (run.status === "playing") {
      run = resolveAction(run, legalActions(run)[0]).state;
      data = decodeSave(recordRun(data, run));
    }
    expect(run.upgrades).toHaveLength(3);
    expect(data.completed).toHaveLength(1);
  });
});
