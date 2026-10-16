import { PLANTS } from "./plants";
import { randomNext } from "./random";
import { PLANT_KINDS } from "./types";
import type {
  Action,
  GameEvent,
  GameState,
  PlantKind,
  Resolution,
} from "./types";
export const SIZE = 6;
export const MAX_EVENTS = 256;
export const MAX_DEW = 9;
export const RIPE = 3;
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
function refill(state: GameState) {
  state.offers = Array.from({ length: 3 }, () => {
    const [rng, value] = randomNext(state.rng);
    state.rng = rng;
    return PLANT_KINDS[Math.floor(value * PLANT_KINDS.length)];
  });
}
export function createRun(
  seed: number,
  id = `garden-${seed >>> 0}`,
): GameState {
  const state: GameState = {
    version: 1,
    id,
    seed: seed >>> 0,
    rng: seed >>> 0,
    turn: 0,
    maxTurns: 25,
    board: Array(36).fill(null),
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
    },
  };
  // A small established garden makes the very first harvest a real decision.
  state.board[14] = {
    id: state.nextId++,
    kind: "sunflower",
    growth: 2,
    bornTurn: -1,
  };
  state.board[20] = {
    id: state.nextId++,
    kind: "rose",
    growth: 1,
    bornTurn: -1,
  };
  state.board[21] = {
    id: state.nextId++,
    kind: "clover",
    growth: 2,
    bornTurn: -1,
  };
  refill(state);
  return state;
}
export function comboMultiplier(depth: number): number {
  return Math.min(3, 1 + depth * 0.25);
}
function mushroomAbility(
  state: GameState,
  index: number,
): PlantKind | undefined {
  return neighbors(index)
    .map((i) => state.board[i])
    .find((p) => p && p.kind !== "mushroom")?.kind;
}
export function harvestValue(
  state: GameState,
  index: number,
  depth = 0,
  override?: PlantKind,
): number {
  const plant = state.board[index];
  if (!plant) return 0;
  const kind =
    override ??
    (plant.kind === "mushroom"
      ? (mushroomAbility(state, index) ?? plant.kind)
      : plant.kind);
  const adjacent = neighbors(index);
  const clovers = adjacent.filter(
    (i) => state.board[i]?.kind === "clover" && state.board[i]!.growth === RIPE,
  ).length;
  const empties =
    kind === "cactus" ? adjacent.filter((i) => !state.board[i]).length : 0;
  return Math.floor(
    PLANTS[plant.kind].base *
      (1 + plant.growth * 0.5) *
      comboMultiplier(depth) *
      (1 + clovers * 0.25 + empties * 0.2),
  );
}
export function isLegalAction(state: GameState, action: Action): boolean {
  return (
    state.status === "playing" &&
    state.turn < state.maxTurns &&
    Number.isInteger(action.index) &&
    action.index >= 0 &&
    action.index < 36 &&
    (action.type === "harvest"
      ? !!state.board[action.index]
      : !state.board[action.index] &&
        Number.isInteger(action.offer) &&
        action.offer >= 0 &&
        action.offer < state.offers.length)
  );
}
export function legalActions(state: GameState): Action[] {
  if (state.status !== "playing" || state.turn >= state.maxTurns) return [];
  return state.board.flatMap((plant, index): Action[] =>
    plant
      ? [{ type: "harvest", index }]
      : state.offers.map((_, offer) => ({ type: "plant", index, offer })),
  );
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
      source?: number;
    }
  | {
      type: "season" | "plant";
      index: number;
      depth: number;
      kind?: PlantKind;
    };
/** Resolves one action in isolation. The input is never mutated; playback has no effect on rules. */
export function resolveAction(input: GameState, action: Action): Resolution {
  if (!isLegalAction(input, action))
    throw new Error("That action is not available.");
  const state = structuredClone(input),
    events: GameEvent[] = [];
  state.turn++;
  const root: Pending =
    action.type === "plant"
      ? {
          type: "plant",
          index: action.index,
          depth: 0,
          kind: state.offers[action.offer],
        }
      : {
          type: "harvest",
          index: action.index,
          depth: 0,
          id: state.board[action.index]!.id,
        };
  const queue: Pending[] = [root, { type: "season", index: -1, depth: 0 }];
  const activated = new Set<number>(),
    harvested = new Set<number>();
  let head = 0;
  const log = (event: GameEvent) => events.push(event);
  function dew(amount: number, index: number, depth: number) {
    const earned = Math.min(MAX_DEW - state.dew, amount);
    state.dew += earned;
    state.stats.dewEarned += earned;
    if (earned)
      log({
        type: "dew",
        index,
        depth,
        text: `+${earned} dew`,
        kind: "sunflower",
      });
  }
  function grow(index: number, depth: number, source?: number) {
    const plant = state.board[index];
    if (plant && plant.growth < RIPE) {
      plant.growth++;
      log({
        type: "growth",
        index,
        depth,
        source,
        kind: plant.kind,
        text: `${PLANTS[plant.kind].name} grows`,
      });
    }
  }
  while (head < queue.length && head < MAX_EVENTS) {
    const event = queue[head++];
    const { index, depth } = event;
    if (event.type === "plant") {
      const boosted = state.dew > 0;
      if (boosted) state.dew--;
      const kind = event.kind!;
      state.board[index] = {
        id: state.nextId++,
        kind,
        growth: boosted ? 1 : 0,
        bornTurn: state.turn,
      };
      log({
        type: "planted",
        index,
        depth,
        kind,
        text: `${PLANTS[kind].name} planted${boosted ? " · 1 dew used" : ""}`,
      });
    } else if (event.type === "season") {
      state.board.forEach((_, i) => grow(i, 0));
      state.board.forEach((plant, i) => {
        if (plant?.kind === "sunflower" && plant.growth === RIPE) dew(1, i, 0);
      });
    } else if (event.type === "grow") {
      if (state.board[index]?.id === event.id) grow(index, depth, event.source);
    } else if (event.type === "activate") {
      const plant = state.board[index];
      if (
        !plant ||
        plant.id !== event.id ||
        activated.has(plant.id) ||
        harvested.has(plant.id)
      )
        continue;
      activated.add(plant.id);
      log({
        type: "activated",
        index,
        depth,
        source: event.source,
        kind: plant.kind,
        text: `${PLANTS[plant.kind].name} activated`,
      });
      grow(index, depth, event.source);
      if (plant.growth === RIPE && plant.bornTurn !== state.turn)
        queue.push({
          type: "harvest",
          index,
          depth,
          source: event.source,
          id: plant.id,
        });
    } else if (event.type === "harvest") {
      const plant = state.board[index];
      if (!plant || plant.id !== event.id || harvested.has(plant.id)) continue;
      harvested.add(plant.id);
      let ability = plant.kind;
      if (plant.kind === "mushroom") {
        const copy = mushroomAbility(state, index);
        if (copy) {
          ability = copy;
          log({
            type: "copied",
            index,
            depth,
            kind: ability,
            text: `Mushroom echoes ${PLANTS[ability].name}`,
          });
        }
      }
      const points = harvestValue(state, index, depth, ability);
      state.score += points;
      state.stats.harvested++;
      state.stats.species[plant.kind] =
        (state.stats.species[plant.kind] ?? 0) + 1;
      log({
        type: "harvested",
        index,
        depth,
        source: event.source,
        kind: plant.kind,
        points,
        text: `${PLANTS[plant.kind].name} +${points}${depth ? ` · ×${comboMultiplier(depth).toFixed(2)}` : ""}`,
      });
      state.board[index] = null;
      queue.push({ type: "ability", index, depth, kind: ability });
    } else if (event.type === "ability") {
      const adjacent = neighbors(index);
      if (event.kind === "sunflower") dew(2, index, depth);
      if (["sunflower", "clover", "wildflower", "rose"].includes(event.kind)) {
        adjacent.forEach((i) => {
          const plant = state.board[i];
          if (plant)
            queue.push({
              type: event.kind === "rose" ? "activate" : "grow",
              index: i,
              depth: depth + 1,
              source: index,
              id: plant.id,
            });
        });
      }
      if (event.kind === "wildflower") {
        const target = adjacent.find((i) => !state.board[i]);
        if (target !== undefined) {
          state.board[target] = {
            id: state.nextId++,
            kind: "wildflower",
            growth: 0,
            bornTurn: state.turn,
          };
          log({
            type: "spread",
            index: target,
            source: index,
            depth: depth + 1,
            kind: "wildflower",
            text: "A wildflower takes root",
          });
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
  const chain = harvested.size,
    points = state.score - input.score;
  state.stats.bestChain = Math.max(state.stats.bestChain, chain);
  state.stats.bestTurn = Math.max(state.stats.bestTurn, points);
  if (state.turn >= state.maxTurns) state.status = "finished";
  else refill(state);
  return { state, events, chain, points };
}
