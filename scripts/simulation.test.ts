import { writeFileSync } from "node:fs";
import { expect, test } from "vitest";
import { BALANCE } from "../src/engine/balance";
import { RESEARCH, UPGRADES } from "../src/engine/content";
import {
  createRun,
  legalActions,
  neighbors,
  previewHarvest,
  resolveAction,
} from "../src/engine/game";
import { randomNext } from "../src/engine/random";
import type { Action, GameState, UpgradeId } from "../src/engine/types";
import {
  canPurchase,
  completionBiomass,
  emptySave,
  ownedResearch,
  purchaseResearch,
  recordRun,
} from "../src/persistence/storage";
const STRATEGIES = [
  "random",
  "conservative",
  "aggressive",
  "mutation",
  "instability",
] as const;
type Strategy = (typeof STRATEGIES)[number];
const research = RESEARCH.map((r) => r.id);
const priorities: Record<Strategy, UpgradeId[]> = {
  random: [],
  conservative: ["scanner", "recycler", "accelerated", "pruning", "network"],
  aggressive: ["echo", "neural", "resonance", "critical", "network"],
  mutation: [
    "adaptive",
    "pollination",
    "replication",
    "accelerated",
    "network",
  ],
  instability: ["volatile", "critical", "echo", "resonance", "replication"],
};
function decision(s: GameState, strategy: Strategy, roll: number): Action {
  const legal = legalActions(s);
  if (s.pendingUpgrade.length) {
    const order = priorities[strategy];
    return strategy === "random"
      ? legal[Math.floor(roll * legal.length)]
      : {
          type: "upgrade",
          upgrade: [...s.pendingUpgrade].sort(
            (a, b) =>
              (order.includes(a) ? order.indexOf(a) : 99) -
              (order.includes(b) ? order.indexOf(b) : 99),
          )[0],
        };
  }
  if (strategy === "random") return legal[Math.floor(roll * legal.length)];
  if (strategy === "conservative" && s.instability >= 65 && s.dew >= 3)
    return { type: "stabilize" };
  const harvests = legal
    .filter((a) => a.type === "harvest")
    .map((a) => {
      const p = previewHarvest(s, (a as { index: number }).index)!;
      return { a, p };
    });
  const best = harvests.sort((a, b) => {
    const value = (h: typeof a) =>
      h.p.points +
      (strategy === "aggressive" ? h.p.chain * 12 : 0) +
      (strategy === "instability"
        ? (h.p.events.some((e) => e.type === "overload") ? 80 : 0) +
          h.p.heatAfter
        : 0) -
      (strategy === "conservative" && h.p.destroyed.length ? 150 : 0);
    return value(b) - value(a);
  })[0];
  const count = s.board.filter(Boolean).length;
  if (
    best &&
    (s.turn >= 18 ||
      count >= 15 ||
      best.p.chain >=
        (strategy === "conservative" ? 5 : strategy === "mutation" ? 6 : 4) ||
      !legal.some((a) => a.type === "plant"))
  )
    return best.a;
  const plants = legal.filter((a) => a.type === "plant");
  if (!plants.length) return best?.a ?? legal[0];
  const value = (a: Action) => {
    if (a.type !== "plant") return -999;
    const kind = s.offers[a.offer],
      adj = neighbors(a.index).flatMap((i) =>
        s.board[i] ? [s.board[i]!] : [],
      ),
      center =
        5 -
        Math.abs(2.5 - (a.index % 6)) -
        Math.abs(2.5 - Math.floor(a.index / 6));
    return (
      center +
      adj.length * 2 +
      (kind === "rose" ? adj.length * 3 : 0) +
      (kind === "sunflower" && s.turn < 10 ? 4 : 0) +
      (strategy === "mutation"
        ? new Set(adj.map((p) => p.kind)).size * 3 +
          (adj.some((p) => p.kind === "rose") && kind === "sunflower" ? 5 : 0) +
          (adj.some((p) => p.kind === "mushroom") && kind === "rose" ? 6 : 0)
        : 0) +
      (kind === "clover" && strategy === "conservative" ? 3 : 0)
    );
  };
  return [...plants].sort((a, b) => value(b) - value(a))[
    Math.floor(roll * Math.min(3, plants.length))
  ];
}
function play(
  seed: number,
  strategy: Strategy,
  full: boolean,
  forced?: UpgradeId,
  without = false,
  profile = emptySave(),
  challenge = false,
) {
  const owned = full ? research : ownedResearch(profile),
    protocol =
      strategy === "instability" && owned.includes("reactor")
        ? "volatile"
        : strategy === "mutation" && owned.includes("symbiosis")
          ? "symbiotic"
          : "standard";
  const preference: Record<
    Strategy,
    import("../src/engine/types").PlantKind[]
  > = {
    random: ["mushroom", "cactus"],
    conservative: ["moonflower", "cactus", "mushroom"],
    aggressive: ["briar", "mushroom", "cactus"],
    mutation: ["moonflower", "mushroom", "briar"],
    instability: ["briar", "cactus", "mushroom"],
  };
  const access = {
    mushroom: "mycology",
    cactus: "xerophytes",
    moonflower: "lunar",
    briar: "briar",
  } as const;
  const specimens = preference[strategy]
    .filter((k) => owned.includes(access[k as keyof typeof access]))
    .slice(0, 2);
  let s = createRun(seed, `sim-${seed}-${strategy}-${full}`, {
    research: owned,
    specimens,
    protocol,
    knownMutations: profile.profile.discoveries,
    challenge,
  });
  if (forced && !without) {
    s.upgrades = [forced];
    if (forced === "pruning") s.pruningLeft = 2;
    if (forced === "recycler") s.recyclerLeft = 1;
  }
  let agentRng = (seed ^ 0x731b) >>> 0,
    safety = 0,
    steps = 0;
  const heat: number[] = [];
  while (s.status === "playing" && steps++ < 60) {
    const [rng, roll] = randomNext(agentRng);
    agentRng = rng;
    // Ablations grant a single upgrade from turn zero and disable drafts in BOTH arms.
    if (forced) s.pendingUpgrade = [];
    const result = resolveAction(s, decision(s, strategy, roll));
    s = result.state;
    safety += result.events.filter((e) => e.type === "safety").length;
    if (!s.pendingUpgrade.length || forced) heat[s.turn - 1] = s.instability;
  }
  const earned =
    completionBiomass(s) +
    s.discoveries.filter((m) => !profile.profile.discoveries.includes(m))
      .length *
      BALANCE.discoveryBiomass;
  return {
    s,
    score: s.score,
    completed: s.status === "finished",
    mutations: s.stats.mutations,
    discoveries: s.discoveries.length,
    overloads: s.stats.overloads,
    peak: s.stats.peakHeat,
    biomass: earned,
    heat,
    safety,
  };
}
const round = (n: number) => Math.round(n * 100) / 100;
const mean = (a: number[]) => round(a.reduce((s, n) => s + n, 0) / a.length);
function summarize(runs: ReturnType<typeof play>[]) {
  const scores = runs.map((r) => r.score).sort((a, b) => a - b);
  return {
    runs: runs.length,
    challengeSuccesses: runs[0]?.s.config.challenge
      ? runs.filter(
          (r) => r.score >= BALANCE.challengeTarget && r.overloads > 0,
        ).length
      : null,
    completion: runs.filter((r) => r.completed).length,
    score: {
      min: scores[0],
      p10: scores[Math.floor(scores.length * 0.1)],
      median: scores[Math.floor(scores.length * 0.5)],
      p90: scores[Math.floor(scores.length * 0.9)],
      max: scores.at(-1),
      mean: mean(scores),
    },
    mutationEvents: mean(runs.map((r) => r.mutations)),
    mutationTypes: mean(runs.map((r) => r.discoveries)),
    overloads: mean(runs.map((r) => r.overloads)),
    peakHeat: mean(runs.map((r) => r.peak)),
    biomassFreshProfile: mean(runs.map((r) => r.biomass)),
    heatByTurn: Array.from({ length: 25 }, (_, i) =>
      mean(runs.map((r) => r.heat[i] ?? 0)),
    ),
    safetyTruncations: runs.reduce((n, r) => n + r.safety, 0),
  };
}
test("deterministic strategy survey, matched upgrade ablations and research pacing", () => {
  const survey: Record<string, ReturnType<typeof summarize>> = {},
    selection: Record<string, { picked: number; scores: number[] }> = {};
  const runs = [];
  for (const full of [false, true])
    for (const strategy of STRATEGIES) {
      const samples = [];
      for (let n = 1; n <= 60; n++) {
        const r = play(n * 7919, strategy, full);
        samples.push(r);
        runs.push(r);
        for (const u of r.s.upgrades) {
          selection[u] ??= { picked: 0, scores: [] };
          selection[u].picked++;
          selection[u].scores.push(r.score);
        }
      }
      survey[`${full ? "researched" : "starter"}-${strategy}`] =
        summarize(samples);
    }
  const trials = Array.from({ length: 60 }, (_, i) =>
    play(
      (i + 1) * 7919,
      "aggressive",
      true,
      undefined,
      false,
      emptySave(),
      true,
    ),
  );
  survey["researched-containment-aggressive"] = summarize(trials);
  runs.push(...trials);
  const ablations: Record<
    string,
    { with: number; without: number; delta: number }
  > = {};
  for (const u of UPGRADES) {
    const a = [],
      b = [];
    for (let n = 1; n <= 24; n++) {
      a.push(play(n * 3571, "aggressive", true, u.id).score);
      b.push(play(n * 3571, "aggressive", true, u.id, true).score);
    }
    ablations[u.id] = {
      with: mean(a),
      without: mean(b),
      delta: round(mean(a) - mean(b)),
    };
  }
  let profile = emptySave();
  const campaign = [];
  for (let n = 1; n <= 20; n++) {
    const r = play(n * 1277, "aggressive", false, undefined, false, profile);
    profile = recordRun(profile, r.s);
    const bought = [];
    for (const node of RESEARCH)
      if (canPurchase(profile, node.id)) {
        profile = purchaseResearch(profile, node.id);
        bought.push(node.id);
      }
    campaign.push({
      run: n,
      score: r.score,
      balance: profile.profile.biomass,
      earned: profile.profile.earned,
      unlocks: ownedResearch(profile).length,
      bought,
    });
  }
  const report = {
    method:
      "60 seeds × five strategies × two research profiles plus 60 Containment Trials; 24 matched seeds per single-upgrade ablation. Fixed policy heuristics, no lookahead search. Ablations grant the chosen upgrade at turn 0 and disable drafts in both arms; they measure policy interaction, not causal player value. Survey choices are observational.",
    constants: BALANCE,
    survey,
    upgradeSelections: Object.fromEntries(
      Object.entries(selection).map(([id, r]) => [
        id,
        { picked: r.picked, meanScore: mean(r.scores) },
      ]),
    ),
    ablations,
    campaign,
    totalRuns: runs.length + 24 * 2 * UPGRADES.length + campaign.length,
  };
  writeFileSync(
    "docs/simulation-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify(
      { totalRuns: report.totalRuns, survey, ablations, campaign },
      null,
      2,
    ),
  );
  expect(runs.every((r) => r.completed && r.safety === 0)).toBe(true);
  expect(play(7919, "aggressive", true)).toEqual(
    play(7919, "aggressive", true),
  );
}, 120_000);
