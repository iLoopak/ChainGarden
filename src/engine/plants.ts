import type { PlantKind } from "./types";
export interface PlantDefinition {
  name: string;
  subtitle: string;
  base: number;
  color: string;
  ability: string;
  strategy: string;
}
export const PLANTS: Record<PlantKind, PlantDefinition> = {
  sunflower: {
    name: "Sunflower",
    subtitle: "Dew producer",
    base: 8,
    color: "#e8bd60",
    ability:
      "Ripe: +1 dew each turn. Harvest: +2 dew and grow every neighbor by 1.",
    strategy: "Keep one growing to fuel your next planting.",
  },
  rose: {
    name: "Rose",
    subtitle: "Chain catalyst",
    base: 12,
    color: "#e6999c",
    ability:
      "Harvest: activate every neighbor. Ripe plants harvest; younger plants grow by 1 and harvest if they ripen.",
    strategy: "Plant at the heart of a future chain.",
  },
  mushroom: {
    name: "Mushroom",
    subtitle: "Ability echo",
    base: 10,
    color: "#c2a3e4",
    ability:
      "Harvest: copy the first adjacent non-mushroom ability, looking north, east, south, west.",
    strategy: "A rose beside a mushroom makes an excellent pair.",
  },
  cactus: {
    name: "Cactus",
    subtitle: "Space multiplier",
    base: 14,
    color: "#a6dcc1",
    ability:
      "Harvest: +20% score for each adjacent empty tile. Board edges do not count.",
    strategy: "Give it room, or clear its neighbors first.",
  },
  clover: {
    name: "Clover",
    subtitle: "Score amplifier",
    base: 6,
    color: "#b6ce7c",
    ability:
      "Ripe: each neighboring harvest scores +25%. Harvest: cool 6 heat and grow every neighbor by 1.",
    strategy: "Keep it ripe beside your most valuable plants.",
  },
  wildflower: {
    name: "Wildflower",
    subtitle: "Growth & spread",
    base: 9,
    color: "#9faee9",
    ability:
      "Harvest: grow every neighbor by 1, then sow a new wildflower in the first empty adjacent tile.",
    strategy: "Turn a harvest into the beginning of another garden.",
  },
  moonflower: {
    name: "Moonflower",
    subtitle: "Reactor stabilizer",
    base: 8,
    color: "#b4d9e3",
    ability: "Harvest: cool 12 heat and grow every neighbor by 1.",
    strategy: "Hold cooling tissue beside a hot catalyst.",
  },
  briar: {
    name: "Briar",
    subtitle: "Volatile catalyst",
    base: 15,
    color: "#de9879",
    ability: "Harvest: activate all neighbors like a Rose, but add 6 heat.",
    strategy: "Build a powerful chain and plan the overload footprint.",
  },
};
