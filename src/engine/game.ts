import { PLANTS } from "./plants";
import { randomNext } from "./random";
import { BALANCE } from "./balance";
import {
  availableSpecimens,
  eligibleUpgrades,
  PROTOCOLS,
  STARTER_POOL,
} from "./content";
import { diagonals, neighbors } from "./grid";
import { hasTrait, resolveMutations } from "./mutations";
import type {
  Action,
  GameEvent,
  GameState,
  Plant,
  PlantKind,
  Resolution,
  ReactionPreview,
  RunOptions,
} from "./types";
export { neighbors, SIZE } from "./grid";
export const MAX_EVENTS = BALANCE.maxEvents;
export const MAX_DEW = BALANCE.maxDew;
export const RIPE = 3;
function draw(state: GameState): PlantKind {
  const [rng, value] = randomNext(state.rng);
  state.rng = rng;
  return state.config.pool[Math.floor(value * state.config.pool.length)];
}
function refill(state: GameState) {
  state.offers = Array.from({ length: 3 }, () => draw(state));
}
export function nextSeed(state: GameState): PlantKind | null {
  if (!state.upgrades.includes("scanner") || state.turn >= 25) return null;
  return state.config.pool[
    Math.floor(randomNext(state.rng)[1] * state.config.pool.length)
  ];
}
export function createRun(
  seed: number,
  id = `garden-${seed >>> 0}`,
  options: RunOptions = {},
): GameState {
  const research = [...new Set(options.research ?? [])],
    specimens = [...new Set(options.specimens ?? [])];
  const protocol = options.protocol ?? "standard",
    definition = PROTOCOLS.find((p) => p.id === protocol);
  if (
    !definition ||
    (definition.research && !research.includes(definition.research))
  )
    throw new Error("Research this protocol first.");
  if (
    specimens.length > 2 ||
    specimens.some((k) => !availableSpecimens(research).includes(k))
  )
    throw new Error("Select up to two researched specimens.");
  if (options.challenge && !research.includes("containment"))
    throw new Error("Research the Containment Trial first.");
  const pool = [...STARTER_POOL, ...specimens];
  if (
    options.poolOrder &&
    (options.poolOrder.length !== pool.length ||
      new Set(options.poolOrder).size !== pool.length ||
      options.poolOrder.some((k) => !pool.includes(k)))
  )
    throw new Error("Invalid replay seed pool.");
  const state: GameState = {
    version: 2,
    id,
    seed: seed >>> 0,
    rng: seed >>> 0,
    upgradeRng: (seed ^ 0xa5f031c7) >>> 0,
    turn: 0,
    maxTurns: BALANCE.turns,
    board: Array(36).fill(null),
    blocked: options.challenge ? [0, 5, 30, 35] : [],
    offers: [],
    score: 0,
    dew: 0,
    nextId: 1,
    status: "playing",
    stats: {
      harvested: 0,
      bestChain: 0,
      bestTurn: 0,
      dewEarned: 0,
      species: {},
      overloads: 0,
      peakHeat: options.challenge ? 45 : protocol === "volatile" ? 30 : 0,
      mutations: 0,
    },
    config: {
      draftAfterTurn: 0,
      research,
      pool: options.poolOrder ? [...options.poolOrder] : pool,
      protocol,
      challenge: !!options.challenge,
      knownMutations: [...(options.knownMutations ?? [])],
    },
    upgrades: [],
    pendingUpgrade: [],
    instability: options.challenge ? 45 : protocol === "volatile" ? 30 : 0,
    chargedSeeds: 0,
    pruningLeft: 0,
    recyclerLeft: 0,
    discoveries: [],
    synergies: [],
  };
  function place(index: number, kind: PlantKind, growth: number) {
    state.board[index] = { id: state.nextId++, kind, growth, bornTurn: -1 };
  }
  place(14, "sunflower", 2);
  place(20, "rose", 1);
  place(21, "clover", 2);
  if (protocol === "volatile") place(15, "rose", 2);
  if (protocol === "symbiotic") {
    place(13, "clover", 2);
    place(8, "clover", 1);
  }
  refill(state);
  return state;
}
export function comboMultiplier(depth: number): number {
  return Math.min(3, 1 + depth * 0.25);
}
function copyTarget(state: GameState, index: number) {
  return neighbors(index).find(
    (i) => state.board[i] && state.board[i]!.kind !== "mushroom",
  );
}
export function harvestValue(
  state: GameState,
  index: number,
  depth = 0,
  override?: PlantKind,
): number {
  const plant = state.board[index];
  if (!plant) return 0;
  const target = copyTarget(state, index),
    kind =
      override ??
      (plant.kind === "mushroom" && target !== undefined
        ? state.board[target]!.kind
        : plant.kind);
  const adjacent = neighbors(index),
    clovers = adjacent.filter(
      (i) => state.board[i]?.kind === "clover" && state.board[i]!.growth === 3,
    ).length;
  const empties =
    kind === "cactus"
      ? adjacent.filter((i) => !state.board[i] && !state.blocked.includes(i))
          .length
      : 0;
  const crowns = adjacent.filter(
    (i) =>
      state.board[i]?.growth === 3 && hasTrait(state.board[i], "symbiotic"),
  ).length;
  const tier = Math.min(3, Math.floor(state.instability / 25));
  return (
    Math.floor(
      PLANTS[plant.kind].base *
        (1 + plant.growth * 0.5) *
        comboMultiplier(depth) *
        (1 + clovers * 0.25 + empties * 0.2),
    ) +
    crowns * 8 +
    tier * BALANCE.tierDepthPoints * depth +
    (state.upgrades.includes("volatile")
      ? Math.floor(state.instability / BALANCE.volatileDivisor) *
        Math.min(BALANCE.volatileDepthCap, depth)
      : 0) +
    (state.upgrades.includes("critical") && depth >= 2 ? 12 : 0)
  );
}
export function isLegalAction(state: GameState, action: Action): boolean {
  if (state.status !== "playing" || state.turn >= state.maxTurns) return false;
  if (state.pendingUpgrade.length)
    return (
      action.type === "upgrade" && state.pendingUpgrade.includes(action.upgrade)
    );
  if (action.type === "upgrade") return false;
  if (action.type === "stabilize")
    return state.dew >= BALANCE.stabilizeCost && state.instability > 0;
  if (action.type === "recycle")
    return (
      state.recyclerLeft > 0 &&
      state.dew >= 1 &&
      Number.isInteger(action.offer) &&
      action.offer >= 0 &&
      action.offer < 3
    );
  if (
    !Number.isInteger(action.index) ||
    action.index < 0 ||
    action.index >= 36 ||
    state.blocked.includes(action.index)
  )
    return false;
  if (action.type === "harvest") return !!state.board[action.index];
  if (action.type === "prune")
    return !!state.board[action.index] && state.pruningLeft > 0;
  return (
    !state.board[action.index] &&
    Number.isInteger(action.offer) &&
    action.offer >= 0 &&
    action.offer < 3
  );
}
export function legalActions(state: GameState): Action[] {
  if (state.status !== "playing" || state.turn >= state.maxTurns) return [];
  if (state.pendingUpgrade.length)
    return state.pendingUpgrade.map((upgrade) => ({
      type: "upgrade",
      upgrade,
    }));
  const actions = state.board.flatMap((plant, index): Action[] =>
    state.blocked.includes(index)
      ? []
      : plant
        ? [
            { type: "harvest", index },
            ...(state.pruningLeft ? [{ type: "prune" as const, index }] : []),
          ]
        : state.offers.map((_, offer) => ({ type: "plant", index, offer })),
  );
  if (isLegalAction(state, { type: "stabilize" }))
    actions.push({ type: "stabilize" });
  if (state.recyclerLeft && state.dew)
    for (let offer = 0; offer < 3; offer++)
      actions.push({ type: "recycle", offer });
  return actions;
}
type Pending =
  | {
      type: "harvest" | "activate" | "grow";
      index: number;
      depth: number;
      source?: number;
      id?: number;
    }
  | {
      type: "ability";
      index: number;
      depth: number;
      kind: PlantKind;
      plant: Plant;
      primary: boolean;
      neural: boolean;
    }
  | {
      type: "season" | "plant" | "utility";
      index: number;
      depth: number;
      kind?: PlantKind;
    };
/** Pure FIFO transition. Visual playback never drives rules or rewards. */
export function resolveAction(input: GameState, action: Action): Resolution {
  if (!isLegalAction(input, action))
    throw new Error("That action is not available.");
  const state = structuredClone(input),
    events: GameEvent[] = [];
  const log = (event: GameEvent) => events.push(event);
  if (action.type === "upgrade") {
    state.upgrades.push(action.upgrade);
    state.pendingUpgrade = [];
    if (action.upgrade === "pruning") state.pruningLeft = 2;
    if (action.upgrade === "recycler") state.recyclerLeft = 1;
    log({
      type: "upgrade",
      index: -1,
      depth: 0,
      text: `Upgrade acquired: ${action.upgrade}`,
    });
    return { state, events, chain: 0, points: 0 };
  }
  if (action.type === "recycle") {
    state.dew--;
    state.recyclerLeft--;
    state.offers[action.offer] = draw(state);
    log({
      type: "utility",
      index: -1,
      depth: 0,
      text: `Seed ${action.offer + 1} recycled · 1 dew · no turn spent`,
    });
    return { state, events, chain: 0, points: 0 };
  }
  state.turn++;
  const rootIndex = "index" in action ? action.index : 14;
  const queue: Pending[] = [
    action.type === "plant"
      ? {
          type: "plant",
          index: action.index,
          depth: 0,
          kind: state.offers[action.offer],
        }
      : action.type === "harvest"
        ? {
            type: "harvest",
            index: action.index,
            depth: 0,
            id: state.board[action.index]!.id,
          }
        : { type: "utility", index: rootIndex, depth: 0 },
    { type: "season", index: -1, depth: 0 },
  ];
  const activated = new Set<number>(),
    harvested = new Set<number>(),
    networked = new Set<number>();
  let head = 0,
    echoed = false,
    replicated = false,
    critical = false,
    overload = state.instability >= 100;
  const learn = (id: string) => {
    if (!state.synergies.includes(id)) state.synergies.push(id);
  };
  function heat(amount: number, index: number, depth: number, reason: string) {
    const old = state.instability;
    state.instability = Math.max(0, Math.min(100, old + amount));
    if (state.instability >= 100) overload = true;
    state.stats.peakHeat = Math.max(state.stats.peakHeat, state.instability);
    if (old !== state.instability)
      log({
        type: "heat",
        index,
        depth,
        heat: state.instability,
        text: `${reason} · ${state.instability - old > 0 ? "+" : ""}${state.instability - old} heat`,
      });
  }
  function dew(amount: number, index: number, depth: number) {
    const earned = Math.min(MAX_DEW - state.dew, amount);
    state.dew += earned;
    state.stats.dewEarned += earned;
    if (earned) log({ type: "dew", index, depth, text: `+${earned} dew` });
  }
  function directed(
    index: number,
    depth: number,
    source: number,
    type: "grow" | "activate" = "grow",
  ) {
    const p = state.board[index];
    if (p) queue.push({ type, index, depth, source, id: p.id });
  }
  function grow(index: number, depth: number, source?: number) {
    const p = state.board[index];
    if (!p) return;
    if (p.growth < 3) {
      p.growth++;
      log({
        type: "growth",
        index,
        depth,
        source,
        kind: p.kind,
        plant: structuredClone(p),
        text: `${PLANTS[p.kind].name} grows`,
      });
    }
    if (
      source !== undefined &&
      !networked.has(p.id) &&
      (state.upgrades.includes("network") ||
        (state.config.protocol === "symbiotic" && p.kind === "clover"))
    ) {
      networked.add(p.id);
      learn("root-relay");
      neighbors(index).forEach((i) => directed(i, depth + 1, index));
    }
  }
  function sow(index: number, kind: PlantKind, depth: number) {
    const target = neighbors(index).find(
      (i) => !state.board[i] && !state.blocked.includes(i),
    );
    if (target === undefined) return;
    state.board[target] = {
      id: state.nextId++,
      kind,
      growth: 0,
      bornTurn: state.turn,
    };
    log({
      type: "spread",
      index: target,
      source: index,
      depth: depth + 1,
      kind,
      plant: structuredClone(state.board[target]!),
      text: `${PLANTS[kind].name} takes root`,
    });
  }
  while (head < queue.length && head < MAX_EVENTS) {
    const event = queue[head++],
      { index, depth } = event;
    if (event.type === "plant") {
      const boosted = state.dew > 0,
        charged = state.chargedSeeds > 0,
        kind = event.kind!;
      if (boosted) state.dew--;
      if (charged) state.chargedSeeds--;
      const accelerated =
        state.upgrades.includes("accelerated") &&
        ["sunflower", "wildflower"].includes(kind);
      state.board[index] = {
        id: state.nextId++,
        kind,
        growth: charged ? 3 : Number(boosted) + Number(accelerated),
        bornTurn: state.turn,
      };
      log({
        type: "planted",
        index,
        depth,
        kind,
        plant: structuredClone(state.board[index]!),
        text: `${PLANTS[kind].name} planted${boosted ? " · 1 dew used" : ""}${charged ? " · charged seed" : ""}`,
      });
    } else if (event.type === "utility") {
      if (action.type === "stabilize") {
        state.dew -= BALANCE.stabilizeCost;
        heat(-BALANCE.stabilizeCooling, index, 0, "Reactor vent · 3 dew");
      }
      if (action.type === "prune") {
        const p = state.board[index]!;
        state.board[index] = null;
        state.pruningLeft--;
        log({
          type: "destroyed",
          index,
          depth,
          kind: p.kind,
          plant: structuredClone(p),
          text: "Emergency pruning · no harvest effect",
        });
        heat(-BALANCE.pruneCooling, index, 0, "Pruning");
      }
    } else if (event.type === "season") {
      state.board.forEach((_, i) => grow(i, 0));
      state.board.forEach((p, i) => {
        if (p?.kind === "sunflower" && p.growth === 3) dew(1, i, 0);
      });
    } else if (event.type === "grow") {
      if (
        state.board[index]?.id === event.id &&
        !(state.upgrades.includes("network") && networked.has(event.id!))
      )
        grow(index, depth, event.source);
    } else if (event.type === "activate") {
      const p = state.board[index];
      if (!p || p.id !== event.id || activated.has(p.id) || harvested.has(p.id))
        continue;
      activated.add(p.id);
      log({
        type: "activated",
        index,
        depth,
        source: event.source,
        kind: p.kind,
        text: `${PLANTS[p.kind].name} activated`,
      });
      grow(index, depth, event.source);
      if (p.growth === 3 && p.bornTurn !== state.turn)
        queue.push({
          type: "harvest",
          index,
          depth,
          source: event.source,
          id: p.id,
        });
    } else if (event.type === "harvest") {
      const p = state.board[index];
      if (!p || p.id !== event.id || harvested.has(p.id)) continue;
      harvested.add(p.id);
      const target = copyTarget(state, index);
      let ability = p.kind;
      if (p.kind === "mushroom" && target !== undefined) {
        ability = state.board[target]!.kind;
        learn(`mushroom-${ability}`);
        log({
          type: "copied",
          index,
          depth,
          kind: ability,
          source: target,
          text: `Mushroom echoes ${PLANTS[ability].name}`,
        });
      }
      if (
        neighbors(index).some(
          (i) =>
            state.board[i]?.kind === "clover" && state.board[i]!.growth === 3,
        )
      )
        learn("clover-aura");
      if (depth) learn("catalyst-chain");
      let points = harvestValue(state, index, depth, ability);
      if (state.upgrades.includes("resonance") && harvested.size % 3 === 0)
        points += 10;
      state.score += points;
      state.stats.harvested++;
      state.stats.species[p.kind] = (state.stats.species[p.kind] ?? 0) + 1;
      log({
        type: "harvested",
        index,
        depth,
        source: event.source,
        kind: p.kind,
        points,
        plant: structuredClone(p),
        text: `${PLANTS[p.kind].name} +${points}${depth ? ` · ×${comboMultiplier(depth).toFixed(2)}` : ""}`,
      });
      const graft =
        hasTrait(p, "grafted") && target !== undefined
          ? state.board[target]!.kind
          : undefined;
      state.board[index] = null;
      heat(
        BALANCE.heatBase +
          depth * BALANCE.heatDepth +
          (state.config.protocol === "volatile" ? BALANCE.volatileHeat : 0) +
          (state.upgrades.includes("volatile") ? 2 : 0),
        index,
        depth,
        "Harvest resonance",
      );
      if (state.upgrades.includes("critical") && depth >= 2) {
        critical = true;
        heat(4, index, depth, "Critical Bloom");
      }
      const abilityEvent: Pending = {
        type: "ability",
        index,
        depth,
        kind: ability,
        plant: p,
        primary: true,
        neural: p.kind === "mushroom" && state.upgrades.includes("neural"),
      };
      queue.push(abilityEvent);
      if (state.upgrades.includes("echo") && !echoed) {
        echoed = true;
        queue.push({ ...abilityEvent, primary: false });
      }
      if (hasTrait(p, "mirror")) {
        heat(5, index, depth, "Mirror Cap");
        queue.push({ ...abilityEvent, primary: false });
      }
      if (graft) {
        log({
          type: "copied",
          index,
          depth,
          source: target,
          kind: graft,
          text: `Lunar Graft echoes ${PLANTS[graft].name}`,
        });
        queue.push({ ...abilityEvent, kind: graft, primary: false });
      }
    } else if (event.type === "ability") {
      const { kind, plant, primary } = event,
        adjacent = neighbors(index),
        activation = kind === "rose" || kind === "briar";
      if (kind === "sunflower") dew(2, index, depth);
      if (kind === "clover") heat(-6, index, depth, "Clover stabilization");
      if (kind === "moonflower") heat(-12, index, depth, "Moonflower cooling");
      if (kind === "briar") heat(6, index, depth, "Briar catalyst");
      if (
        [
          "sunflower",
          "clover",
          "wildflower",
          "moonflower",
          "rose",
          "briar",
        ].includes(kind)
      ) {
        const targets = adjacent;
        const nextDepth =
          depth + (activation && hasTrait(plant, "resonant") ? 2 : 1);
        targets.forEach((i) => {
          directed(i, nextDepth, index, activation ? "activate" : "grow");
          if (activation && event.neural) {
            const beyond = neighbors(i).find(
              (j) => j !== index && state.board[j],
            );
            if (beyond !== undefined)
              directed(beyond, nextDepth + 1, i, "activate");
          }
        });
      }
      if (kind === "wildflower") sow(index, "wildflower", depth);
      if (primary) {
        if (hasTrait(plant, "fungal"))
          diagonals(index).forEach((i) =>
            directed(i, depth + 1, index, "activate"),
          );
        if (hasTrait(plant, "charged")) {
          dew(2, index, depth);
          heat(3, index, depth, "Charged Bloom");
        }
        if (hasTrait(plant, "cooling"))
          heat(-12, index, depth, "Cooling Tissue");
        if (hasTrait(plant, "symbiotic"))
          heat(-6, index, depth, "Symbiotic Crown");
        if (hasTrait(plant, "deep"))
          adjacent.forEach((i) => directed(i, depth + 1, index));
        if (hasTrait(plant, "thorns")) {
          const target = adjacent.find((i) => state.board[i]);
          if (target !== undefined)
            directed(target, depth + 1, index, "activate");
          heat(4, index, depth, "Volatile Thorns");
        }
        if (hasTrait(plant, "wandering")) {
          sow(index, "wildflower", depth);
          heat(4, index, depth, "Wandering Roots");
        }
        if (
          state.upgrades.includes("replication") &&
          !replicated &&
          ["mushroom", "wildflower"].includes(plant.kind)
        ) {
          replicated = true;
          sow(index, plant.kind, depth);
        }
      }
    }
  }
  if (head < queue.length)
    log({
      type: "safety",
      index: -1,
      depth: 0,
      text: "Chain settled at the safety limit.",
    });
  function destroy(index: number, reason: string) {
    const p = state.board[index];
    if (!p) return;
    state.board[index] = null;
    log({
      type: "destroyed",
      index,
      depth: 0,
      kind: p.kind,
      plant: structuredClone(p),
      text: reason,
    });
  }
  if (critical) {
    const target = neighbors(rootIndex).find((i) => state.board[i]);
    if (target !== undefined)
      destroy(target, "Critical Bloom collateral · no harvest");
  }
  const mutations = resolveMutations(state);
  events.push(...mutations);
  if (mutations.some((e) => e.type === "mutation" && e.source !== undefined))
    heat(4, rootIndex, 0, "Cross-Pollination");
  if (overload) {
    const area = [rootIndex, ...neighbors(rootIndex)]
      .filter((i) => state.board[i])
      .slice(0, BALANCE.overloadDamage);
    area.forEach((i) => destroy(i, "Reactor overload · no harvest"));
    const points =
      BALANCE.overloadScore + area.length * BALANCE.overloadPerPlant;
    state.score += points;
    state.stats.overloads++;
    state.chargedSeeds = Math.min(
      4,
      state.chargedSeeds + BALANCE.overloadSeeds,
    );
    dew(BALANCE.overloadDew, rootIndex, 0);
    state.instability = BALANCE.overloadReset;
    log({
      type: "overload",
      index: rootIndex,
      depth: 0,
      heat: state.instability,
      points,
      text: `Overload · ${area.length} specimens lost · +${points} pts · +2 charged plantings · heat reset to 35`,
    });
    learn("reactor-overload");
  }
  const chain = harvested.size,
    points = state.score - input.score;
  state.stats.bestChain = Math.max(state.stats.bestChain, chain);
  state.stats.bestTurn = Math.max(state.stats.bestTurn, points);
  if (state.turn >= state.maxTurns) state.status = "finished";
  else {
    refill(state);
    if ((BALANCE.milestones as readonly number[]).includes(state.turn)) {
      const candidates = eligibleUpgrades(
        state.config.research,
        state.upgrades,
      ).map((u) => u.id);
      for (let i = 0; i < 3 && candidates.length; i++) {
        const [rng, value] = randomNext(state.upgradeRng);
        state.upgradeRng = rng;
        const j = Math.floor(value * candidates.length);
        state.pendingUpgrade.push(candidates.splice(j, 1)[0]);
      }
    }
  }
  return { state, events, chain, points };
}
export function previewHarvest(
  state: GameState,
  index: number,
): ReactionPreview | null {
  const action: Action = { type: "harvest", index };
  if (!isLegalAction(state, action)) return null;
  const result = resolveAction(state, action);
  return {
    points: result.points,
    chain: result.chain,
    maxDepth: Math.max(
      0,
      ...result.events
        .filter((e) => e.type === "harvested")
        .map((e) => e.depth),
    ),
    harvested: result.events
      .filter((e) => e.type === "harvested")
      .map((e) => e.index),
    events: result.events,
    dewAfter: result.state.dew,
    heatAfter: result.state.instability,
    destroyed: result.events
      .filter((e) => e.type === "destroyed")
      .map((e) => e.index),
  };
}
