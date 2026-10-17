import type {
  MutationId,
  PlantKind,
  ProtocolId,
  ResearchId,
  UpgradeId,
} from "./types";
export const STARTER_POOL: PlantKind[] = [
  "sunflower",
  "rose",
  "clover",
  "wildflower",
];
export interface ResearchDefinition {
  id: ResearchId;
  name: string;
  category: string;
  cost: number;
  requires: ResearchId[];
  effect: string;
}
export const RESEARCH: ResearchDefinition[] = [
  {
    id: "mycology",
    name: "Mycology",
    category: "Specimens",
    cost: 8,
    requires: [],
    effect: "Choose Mushroom seeds. Discover fungal roses and mirror caps.",
  },
  {
    id: "xerophytes",
    name: "Xerophytes",
    category: "Specimens",
    cost: 8,
    requires: [],
    effect: "Choose Cactus seeds. Discover volatile thorns.",
  },
  {
    id: "lunar",
    name: "Lunar tissue",
    category: "Specimens",
    cost: 12,
    requires: ["mycology"],
    effect: "Choose Moonflower: harvest cools 12 heat and grows neighbors.",
  },
  {
    id: "briar",
    name: "Briar culture",
    category: "Specimens",
    cost: 12,
    requires: ["xerophytes"],
    effect: "Choose Briar: a stronger catalyst that adds 6 heat on harvest.",
  },
  {
    id: "engineering",
    name: "Tissue grafting",
    category: "Genetics",
    cost: 10,
    requires: ["mycology"],
    effect:
      "Unlock Cross-Pollination drafts, cooling tissue and grafted mutations.",
  },
  {
    id: "roots",
    name: "Root mapping",
    category: "Reactions",
    cost: 8,
    requires: [],
    effect:
      "Unlock Root Network: directed growth travels through connected plants.",
  },
  {
    id: "echo",
    name: "Echo technology",
    category: "Reactions",
    cost: 12,
    requires: ["roots", "mycology"],
    effect: "Unlock Echo Harvest and Neural Mycelium drafts.",
  },
  {
    id: "reactor",
    name: "Reactor tuning",
    category: "Reactions",
    cost: 12,
    requires: ["xerophytes"],
    effect:
      "Unlock Volatile Sap, Critical Bloom, resonant petals and Volatile Experiment.",
  },
  {
    id: "symbiosis",
    name: "Living lattice",
    category: "Protocols",
    cost: 12,
    requires: ["engineering"],
    effect:
      "Unlock Symbiotic Growth: a clover-rich layout; clovers relay directed growth.",
  },
  {
    id: "containment",
    name: "Containment trial",
    category: "Protocols",
    cost: 16,
    requires: ["reactor", "echo"],
    effect:
      "Unlock the 32-plot challenge. Score 900 and cause an overload for +6 Biomass.",
  },
];
export const SPECIMEN_RESEARCH: Partial<Record<PlantKind, ResearchId>> = {
  mushroom: "mycology",
  cactus: "xerophytes",
  moonflower: "lunar",
  briar: "briar",
};
export const availableSpecimens = (research: ResearchId[]) =>
  Object.entries(SPECIMEN_RESEARCH)
    .filter(([, id]) => research.includes(id!))
    .map(([kind]) => kind as PlantKind);
export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  category: string;
  effect: string;
  synergy: string;
  research?: ResearchId;
  conflicts?: UpgradeId[];
  cap: 1;
}
export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "accelerated",
    name: "Accelerated Cultivation",
    category: "Growth",
    effect:
      "Planted Sunflowers and Wildflowers start one stage ahead. Dew stacks with this boost.",
    synergy: "Grow a dew engine or rebuild after a chain.",
    cap: 1,
  },
  {
    id: "replication",
    name: "Spore Replication",
    category: "Growth",
    effect:
      "The first Mushroom or Wildflower harvested each turn sows its own species in the first empty neighbor.",
    synergy: "Wildflower can sow twice. Newborns cannot chain-harvest.",
    cap: 1,
  },
  {
    id: "resonance",
    name: "Resonance Bloom",
    category: "Chain",
    effect: "Every third harvest in the same action scores 10 extra points.",
    synergy: "Reward long chains, even at shallow depth.",
    cap: 1,
  },
  {
    id: "scanner",
    name: "Genetic Scanner",
    category: "Utility",
    effect:
      "See the first seed of the next hand. Reading it never changes the seed stream.",
    synergy: "Reserve a plot for a future catalyst.",
    cap: 1,
  },
  {
    id: "pruning",
    name: "Emergency Pruning",
    category: "Utility",
    effect:
      "Two uses. Remove a plant without scoring or abilities, cool 8 heat. Costs one turn.",
    synergy: "Remove a blocked catalyst while protecting the rest.",
    cap: 1,
  },
  {
    id: "recycler",
    name: "Seed Recycler",
    category: "Utility",
    effect:
      "Once per run: exchange one offered seed for 1 dew. No turn or growth. The new seed may match.",
    synergy: "Rescue a hand when planting time is short.",
    cap: 1,
  },
  {
    id: "adaptive",
    name: "Adaptive Tissue",
    category: "Mutation",
    effect:
      "Each plant can acquire two different contextual traits instead of one.",
    synergy: "Layer known traits on a valuable organism.",
    conflicts: ["pollination"],
    cap: 1,
  },
  {
    id: "network",
    name: "Root Network",
    category: "Growth",
    effect:
      "Directed growth propagates through occupied orthogonal neighbors, once per plant per action. Seasonal growth never propagates.",
    synergy: "Connect a growth donor to distant young catalysts.",
    research: "roots",
    cap: 1,
  },
  {
    id: "echo",
    name: "Echo Harvest",
    category: "Chain",
    effect:
      "The first harvested plant repeats its harvest ability once each turn. Score is not repeated.",
    synergy: "Repeat a resource effect or sow another flower.",
    research: "echo",
    cap: 1,
  },
  {
    id: "neural",
    name: "Neural Mycelium",
    category: "Chain",
    effect:
      "A Mushroom copying an activation effect reaches the first occupied neighbor one step beyond each target.",
    synergy: "Bridge a gap between catalyst clusters.",
    research: "echo",
    cap: 1,
  },
  {
    id: "pollination",
    name: "Cross-Pollination",
    category: "Mutation",
    effect:
      "After each action, the first traited donor shares its first trait with one adjacent different species. One transfer per turn; adds 4 heat.",
    synergy: "Move a useful trait onto another kind of plant.",
    research: "engineering",
    conflicts: ["adaptive"],
    cap: 1,
  },
  {
    id: "volatile",
    name: "Volatile Sap",
    category: "Reactor",
    effect:
      "Chain harvests score floor(heat / 20) × min(3, depth) extra points. Every harvest adds 2 extra heat.",
    synergy: "Hold heat, then release a deep chain.",
    research: "reactor",
    cap: 1,
  },
  {
    id: "critical",
    name: "Critical Bloom",
    category: "Reactor",
    effect:
      "Harvests at depth 2+ score 12 extra and add 4 heat. After such a chain, destroy the first surviving neighbor of the root.",
    synergy: "Leave an expendable plant beside your catalyst.",
    research: "reactor",
    cap: 1,
  },
];
export const upgradeDefinition = (id: UpgradeId) =>
  UPGRADES.find((u) => u.id === id)!;
export function eligibleUpgrades(research: ResearchId[], owned: UpgradeId[]) {
  return UPGRADES.filter(
    (u) =>
      !owned.includes(u.id) &&
      (!u.research || research.includes(u.research)) &&
      !u.conflicts?.some((id) => owned.includes(id)),
  );
}
export const PROTOCOLS: {
  id: ProtocolId;
  name: string;
  description: string;
  research?: ResearchId;
}[] = [
  {
    id: "standard",
    name: "Standard Cultivation",
    description: "A balanced chamber. Four core species, zero starting heat.",
  },
  {
    id: "volatile",
    name: "Volatile Experiment",
    description:
      "Start at 30 heat with an extra Rose. Every harvest adds 2 more heat.",
    research: "reactor",
  },
  {
    id: "symbiotic",
    name: "Symbiotic Growth",
    description:
      "Two extra Clovers. Directed growth reaching a Clover relays to its neighbors once per action.",
    research: "symbiosis",
  },
];
export interface MutationDefinition {
  id: MutationId;
  name: string;
  clue: string;
  requires?: ResearchId;
  prerequisite: string;
  effect: string;
  color: string;
}
export const MUTATIONS: MutationDefinition[] = [
  {
    id: "fungal",
    name: "Fungal Rose",
    clue: "Petals share a border with spores.",
    requires: "mycology",
    prerequisite: "Ripe Rose beside a Mushroom.",
    effect: "Harvest also activates diagonal neighbors.",
    color: "#b993dd",
  },
  {
    id: "charged",
    name: "Charged Bloom",
    clue: "A sun drinks repeated resonance.",
    prerequisite:
      "Ripe Sunflower beside a Rose or Briar at the end of two actions.",
    effect: "Harvest banks 2 extra dew and adds 3 heat.",
    color: "#f1ce69",
  },
  {
    id: "thorns",
    name: "Volatile Thorns",
    clue: "Desert tissue remembers the heat.",
    requires: "xerophytes",
    prerequisite: "Ripe Cactus at 50+ heat.",
    effect: "Harvest activates the first occupied neighbor and adds 4 heat.",
    color: "#f09471",
  },
  {
    id: "symbiotic",
    name: "Symbiotic Crown",
    clue: "Three different neighbors, one living crown.",
    prerequisite: "Ripe Clover beside at least three different species.",
    effect:
      "While ripe, adjacent harvests score 8 extra points. Its harvest cools 6 extra heat.",
    color: "#d0e891",
  },
  {
    id: "wandering",
    name: "Wandering Roots",
    clue: "A wild seed reaches for open ground.",
    prerequisite: "Ripe Wildflower with at least two empty neighbors.",
    effect: "Harvest sows an extra Wildflower and adds 4 heat.",
    color: "#a8c9e8",
  },
  {
    id: "mirror",
    name: "Mirror Cap",
    clue: "Spores learn from two distinct voices.",
    requires: "mycology",
    prerequisite: "Ripe Mushroom beside at least two different species.",
    effect: "Repeat its harvest ability once and add 5 heat.",
    color: "#dac1ef",
  },
  {
    id: "cooling",
    name: "Cooling Tissue",
    clue: "Two quiet organisms share their shelter.",
    requires: "engineering",
    prerequisite: "Any ripe plant beside two Clovers or Moonflowers.",
    effect: "Harvest cools 12 heat.",
    color: "#9fe1d6",
  },
  {
    id: "deep",
    name: "Deep Roots",
    clue: "Patient roots need room to breathe.",
    prerequisite:
      "Ripe plant at least five actions old, beside two empty plots.",
    effect: "Harvest gives an additional growth pulse to existing neighbors.",
    color: "#c5b090",
  },
  {
    id: "resonant",
    name: "Resonant Petals",
    clue: "A catalyst listens to a clover in a reactive chamber.",
    requires: "reactor",
    prerequisite: "Ripe Rose or Briar beside Clover at 25+ heat.",
    effect:
      "Outgoing activations begin two depth steps ahead, increasing combo and heat.",
    color: "#eea7bc",
  },
  {
    id: "grafted",
    name: "Lunar Graft",
    clue: "Moonlight binds an unfamiliar trait.",
    requires: "engineering",
    prerequisite:
      "Ripe plant beside Moonflower and a traited neighbor of another species.",
    effect: "Harvest also copies the first adjacent non-Mushroom ability.",
    color: "#c6d6f7",
  },
];
export const mutationDefinition = (id: MutationId) =>
  MUTATIONS.find((m) => m.id === id)!;
