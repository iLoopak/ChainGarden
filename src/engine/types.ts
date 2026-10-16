export const PLANT_KINDS = [
  "sunflower",
  "rose",
  "mushroom",
  "cactus",
  "clover",
  "wildflower",
] as const;
export type PlantKind = (typeof PLANT_KINDS)[number];
export interface Plant {
  id: number;
  kind: PlantKind;
  growth: number;
  bornTurn: number;
}
export interface RunStats {
  harvested: number;
  bestChain: number;
  bestTurn: number;
  dewEarned: number;
  species: Partial<Record<PlantKind, number>>;
}
export interface GameState {
  version: 1;
  id: string;
  seed: number;
  rng: number;
  turn: number;
  maxTurns: number;
  board: (Plant | null)[];
  offers: PlantKind[];
  score: number;
  dew: number;
  nextId: number;
  status: "playing" | "finished";
  stats: RunStats;
}
export type Action =
  | { type: "plant"; index: number; offer: number }
  | { type: "harvest"; index: number };
export interface GameEvent {
  type:
    | "planted"
    | "growth"
    | "harvested"
    | "activated"
    | "copied"
    | "dew"
    | "spread"
    | "safety";
  index: number;
  depth: number;
  text: string;
  points?: number;
  kind?: PlantKind;
  source?: number;
  /** Post-event specimen (pre-removal for a harvest), for exact visual playback. */
  plant?: Plant;
}
export interface Resolution {
  state: GameState;
  events: GameEvent[];
  chain: number;
  points: number;
}

export interface ReactionPreview {
  points: number;
  chain: number;
  maxDepth: number;
  harvested: number[];
  events: GameEvent[];
  dewAfter: number;
}
