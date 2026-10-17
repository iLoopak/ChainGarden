export const PLANT_KINDS = [
  "sunflower",
  "rose",
  "mushroom",
  "cactus",
  "clover",
  "wildflower",
  "moonflower",
  "briar",
] as const;
export type PlantKind = (typeof PLANT_KINDS)[number];
export type ResearchId =
  | "mycology"
  | "xerophytes"
  | "lunar"
  | "briar"
  | "engineering"
  | "roots"
  | "echo"
  | "reactor"
  | "symbiosis"
  | "containment";
export type UpgradeId =
  | "accelerated"
  | "replication"
  | "resonance"
  | "scanner"
  | "pruning"
  | "recycler"
  | "adaptive"
  | "network"
  | "echo"
  | "neural"
  | "pollination"
  | "volatile"
  | "critical";
export type MutationId =
  | "fungal"
  | "charged"
  | "thorns"
  | "symbiotic"
  | "wandering"
  | "mirror"
  | "cooling"
  | "deep"
  | "resonant"
  | "grafted";
export type ProtocolId = "standard" | "volatile" | "symbiotic";
export interface Plant {
  id: number;
  kind: PlantKind;
  growth: number;
  bornTurn: number;
  traits?: MutationId[];
  exposure?: number;
}
export interface RunStats {
  harvested: number;
  bestChain: number;
  bestTurn: number;
  dewEarned: number;
  species: Partial<Record<PlantKind, number>>;
  overloads: number;
  peakHeat: number;
  mutations: number;
}
export interface RunOptions {
  /** Only replay uses an explicit order; membership is still validated. */
  poolOrder?: PlantKind[];
  research?: ResearchId[];
  specimens?: PlantKind[];
  protocol?: ProtocolId;
  challenge?: boolean;
  knownMutations?: MutationId[];
}
export interface RunConfig {
  draftAfterTurn: number;
  research: ResearchId[];
  pool: PlantKind[];
  protocol: ProtocolId;
  challenge: boolean;
  knownMutations: MutationId[];
}
export interface GameState {
  version: 2;
  id: string;
  seed: number;
  rng: number;
  upgradeRng: number;
  turn: number;
  maxTurns: number;
  board: (Plant | null)[];
  blocked: number[];
  offers: PlantKind[];
  score: number;
  dew: number;
  nextId: number;
  status: "playing" | "finished";
  stats: RunStats;
  config: RunConfig;
  upgrades: UpgradeId[];
  pendingUpgrade: UpgradeId[];
  instability: number;
  chargedSeeds: number;
  pruningLeft: number;
  recyclerLeft: number;
  discoveries: MutationId[];
  synergies: string[];
}
export type Action =
  | { type: "plant"; index: number; offer: number }
  | { type: "harvest"; index: number }
  | { type: "prune"; index: number }
  | { type: "stabilize" }
  | { type: "recycle"; offer: number }
  | { type: "upgrade"; upgrade: UpgradeId };
export interface GameEvent {
  type:
    | "planted"
    | "growth"
    | "harvested"
    | "activated"
    | "copied"
    | "dew"
    | "spread"
    | "safety"
    | "heat"
    | "overload"
    | "destroyed"
    | "mutation"
    | "upgrade"
    | "utility";
  index: number;
  depth: number;
  text: string;
  points?: number;
  kind?: PlantKind;
  source?: number;
  plant?: Plant;
  heat?: number;
  mutation?: MutationId;
  first?: boolean;
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
  heatAfter: number;
  destroyed: number[];
}
