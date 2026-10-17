import { MUTATIONS } from "./content";
import { neighbors } from "./grid";
import type { GameEvent, GameState, MutationId, Plant } from "./types";
export const hasTrait = (plant: Plant | null | undefined, trait: MutationId) =>
  !!plant?.traits?.includes(trait);
export function mutationEligible(
  state: GameState,
  index: number,
  id: MutationId,
): boolean {
  const p = state.board[index],
    definition = MUTATIONS.find((m) => m.id === id)!;
  if (
    !p ||
    p.growth !== 3 ||
    p.traits?.includes(id) ||
    (definition.requires &&
      !state.config.research.includes(definition.requires))
  )
    return false;
  const adjacent = neighbors(index).map((i) => state.board[i]);
  const kinds = new Set(adjacent.flatMap((p) => (p ? [p.kind] : [])));
  const empty = neighbors(index).filter(
    (i) => !state.board[i] && !state.blocked.includes(i),
  ).length;
  switch (id) {
    case "fungal":
      return p.kind === "rose" && kinds.has("mushroom");
    case "charged":
      return p.kind === "sunflower" && (p.exposure ?? 0) >= 2;
    case "thorns":
      return p.kind === "cactus" && state.instability >= 50;
    case "symbiotic":
      return p.kind === "clover" && kinds.size >= 3;
    case "wandering":
      return p.kind === "wildflower" && empty >= 2;
    case "mirror":
      return p.kind === "mushroom" && kinds.size >= 2;
    case "cooling":
      return (
        adjacent.filter(
          (p) => p && (p.kind === "clover" || p.kind === "moonflower"),
        ).length >= 2
      );
    case "deep":
      return state.turn - p.bornTurn >= 5 && empty >= 2;
    case "resonant":
      return (
        (p.kind === "rose" || p.kind === "briar") &&
        kinds.has("clover") &&
        state.instability >= 25
      );
    case "grafted":
      return (
        kinds.has("moonflower") &&
        adjacent.some((n) => n && n.kind !== p.kind && n.traits?.length)
      );
  }
}
/** One new contextual trait per plant per action, stable registry + row-major priority. */
export function resolveMutations(state: GameState): GameEvent[] {
  const events: GameEvent[] = [],
    cap = state.upgrades.includes("adaptive") ? 2 : 1;
  function attach(index: number, id: MutationId, source?: number) {
    const p = state.board[index]!;
    p.traits = [...(p.traits ?? []), id];
    const first =
      !state.config.knownMutations.includes(id) &&
      !state.discoveries.includes(id);
    if (!state.discoveries.includes(id)) state.discoveries.push(id);
    state.stats.mutations++;
    events.push({
      type: "mutation",
      index,
      depth: 0,
      source,
      kind: p.kind,
      mutation: id,
      first,
      plant: structuredClone(p),
      text: `${MUTATIONS.find((m) => m.id === id)!.name}${first ? " · first discovery" : ""}`,
    });
  }
  // Exposures are saved explicitly; playback gets their snapshots, too.
  state.board.forEach((p, index) => {
    if (!p) return;
    if (
      p.kind === "sunflower" &&
      p.growth === 3 &&
      neighbors(index).some((i) =>
        ["rose", "briar"].includes(state.board[i]?.kind ?? ""),
      )
    ) {
      p.exposure = Math.min(2, (p.exposure ?? 0) + 1);
      events.push({
        type: "growth",
        index,
        depth: 0,
        plant: structuredClone(p),
        kind: p.kind,
        text: "Sunflower absorbs resonance",
      });
    }
    if ((p.traits?.length ?? 0) >= cap) return;
    const mutation = MUTATIONS.find((m) =>
      mutationEligible(state, index, m.id),
    );
    if (mutation) attach(index, mutation.id);
  });
  // Stop after the first transfer, so a new recipient cannot relay it again.
  if (state.upgrades.includes("pollination")) {
    for (let i = 0; i < 36; i++) {
      const donor = state.board[i];
      if (!donor?.traits?.length) continue;
      const trait = donor.traits[0];
      const target = neighbors(i).find((j) => {
        const p = state.board[j];
        return (
          p &&
          p.kind !== donor.kind &&
          (trait !== "resonant" ||
            ["rose", "briar", "mushroom"].includes(p.kind)) &&
          (p.traits?.length ?? 0) < cap &&
          !p.traits?.includes(trait) &&
          !events.some((e) => e.type === "mutation" && e.index === j)
        );
      });
      if (target !== undefined) {
        attach(target, trait, i);
        break;
      }
    }
  }
  return events;
}
