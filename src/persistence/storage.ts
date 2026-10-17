import { PLANT_KINDS } from "../engine/types";
import type {
  GameState,
  MutationId,
  ProtocolId,
  ResearchId,
  RunStats,
} from "../engine/types";
import {
  availableSpecimens,
  eligibleUpgrades,
  MUTATIONS,
  PROTOCOLS,
  RESEARCH,
  STARTER_POOL,
  UPGRADES,
} from "../engine/content";
import { BALANCE, challengeComplete } from "../engine/balance";
export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
}
export interface RunSummary {
  id: string;
  seed: number;
  score: number;
  turns: number;
  stats: RunStats;
  biomass: number;
  discoveries: MutationId[];
  protocol: ProtocolId;
  challenge: boolean;
}
export interface Profile {
  biomass: number;
  earned: number;
  purchases: { id: ResearchId; cost: number; legacy?: boolean }[];
  discoveries: MutationId[];
  synergies: string[];
  rewardedRuns: { id: string; biomass: number }[];
}
export interface SaveData {
  schemaVersion: 2;
  current: GameState | null;
  settings: Settings;
  best: number;
  completed: RunSummary[];
  profile: Profile;
}
export const emptySave = (): SaveData => ({
  schemaVersion: 2,
  current: null,
  settings: { sound: false, reducedMotion: false },
  best: 0,
  completed: [],
  profile: {
    biomass: 0,
    earned: 0,
    purchases: [],
    discoveries: [],
    synergies: [],
    rewardedRuns: [],
  },
});
export const ownedResearch = (data: SaveData) =>
  data.profile.purchases.map((p) => p.id);
export function completionBiomass(
  run: Pick<GameState, "score" | "stats" | "config">,
) {
  return (
    BALANCE.completionBiomass +
    Math.min(
      BALANCE.scoreBiomassCap,
      Math.floor(run.score / BALANCE.scoreStep),
    ) +
    Math.min(2, Math.floor(run.stats.bestChain / 4)) +
    (challengeComplete(run)
      ? BALANCE.challengeBiomass
      : 0)
  );
}
export function canPurchase(data: SaveData, id: ResearchId): boolean {
  const node = RESEARCH.find((n) => n.id === id);
  return (
    !!node &&
    !ownedResearch(data).includes(id) &&
    data.profile.biomass >= node.cost &&
    node.requires.every((r) => ownedResearch(data).includes(r))
  );
}
export function purchaseResearch(data: SaveData, id: ResearchId): SaveData {
  if (!canPurchase(data, id))
    throw new Error(
      "Research is locked, already owned, or needs more Biomass.",
    );
  const next = structuredClone(data),
    node = RESEARCH.find((n) => n.id === id)!;
  next.profile.biomass -= node.cost;
  next.profile.purchases.push({ id, cost: node.cost });
  return next;
}
const integer = (
  v: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): v is number =>
  Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const uniqueList = (v: unknown, allowed: readonly string[]): v is string[] =>
  Array.isArray(v) &&
  new Set(v).size === v.length &&
  v.every((x) => typeof x === "string" && allowed.includes(x));
const mutationIds = MUTATIONS.map((m) => m.id),
  researchIds = RESEARCH.map((r) => r.id),
  upgradeIds = UPGRADES.map((u) => u.id);
function validStats(v: unknown, legacy = false): v is RunStats {
  return (
    record(v) &&
    integer(v.harvested) &&
    integer(v.bestChain, 0, 36) &&
    integer(v.bestTurn) &&
    integer(v.dewEarned) &&
    record(v.species) &&
    Object.entries(v.species).every(
      ([k, n]) =>
        PLANT_KINDS.includes(k as (typeof PLANT_KINDS)[number]) && integer(n),
    ) &&
    (legacy ||
      (integer(v.overloads, 0, 25) &&
        integer(v.peakHeat, 0, 100) &&
        integer(v.mutations)))
  );
}
function validBase(v: unknown, version: number): v is Record<string, unknown> {
  if (
    !record(v) ||
    v.version !== version ||
    typeof v.id !== "string" ||
    !v.id.length ||
    !integer(v.seed, 0, 0xffffffff) ||
    !integer(v.rng, 0, 0xffffffff) ||
    !integer(v.turn, 0, 25) ||
    v.maxTurns !== 25 ||
    !integer(v.score) ||
    !integer(v.dew, 0, 9) ||
    !integer(v.nextId, 1) ||
    !validStats(v.stats, version === 1) ||
    v.status !== (v.turn === 25 ? "finished" : "playing") ||
    !Array.isArray(v.board) ||
    v.board.length !== 36 ||
    !Array.isArray(v.offers) ||
    v.offers.length !== 3 ||
    !v.offers.every((k) => PLANT_KINDS.includes(k))
  )
    return false;
  const ids = new Set<number>();
  return v.board.every((p) => {
    if (p === null) return true;
    if (
      !record(p) ||
      !integer(p.id, 1, Number(v.nextId) - 1) ||
      ids.has(p.id) ||
      !PLANT_KINDS.includes(p.kind as (typeof PLANT_KINDS)[number]) ||
      !integer(p.growth, 0, 3) ||
      !integer(p.bornTurn, -1, Number(v.turn))
    )
      return false;
    ids.add(p.id);
    return (
      version === 1 ||
      ((p.traits === undefined ||
        (uniqueList(p.traits, mutationIds) && p.traits.length <= 2)) &&
        (p.exposure === undefined || integer(p.exposure, 0, 2)))
    );
  });
}
export function isGameState(v: unknown): v is GameState {
  if (
    !validBase(v, 2) ||
    !record(v.config) ||
    !integer(v.config.draftAfterTurn, 0, 25) ||
    !integer(v.upgradeRng, 0, 0xffffffff) ||
    !integer(v.instability, 0, 99) ||
    !integer(v.chargedSeeds, 0, 4) ||
    !integer(v.pruningLeft, 0, 2) ||
    !integer(v.recyclerLeft, 0, 1) ||
    !uniqueList(v.upgrades, upgradeIds) ||
    !uniqueList(v.pendingUpgrade, upgradeIds) ||
    v.pendingUpgrade.length > 3 ||
    !uniqueList(v.discoveries, mutationIds) ||
    !uniqueList(v.config.research, researchIds) ||
    !uniqueList(v.config.knownMutations, mutationIds) ||
    !uniqueList(v.config.pool, PLANT_KINDS) ||
    typeof v.config.challenge !== "boolean" ||
    !Array.isArray(v.blocked) ||
    !v.blocked.every((i) => integer(i, 0, 35)) ||
    new Set(v.blocked).size !== v.blocked.length ||
    !Array.isArray(v.synergies) ||
    !v.synergies.every((s) => typeof s === "string")
  )
    return false;
  const run = v as unknown as GameState;
  const protocol = PROTOCOLS.find((p) => p.id === run.config.protocol);
  if (
    !protocol ||
    (protocol.research && !run.config.research.includes(protocol.research)) ||
    (run.config.challenge && !run.config.research.includes("containment"))
  )
    return false;
  if (
    !STARTER_POOL.every((k) => run.config.pool.includes(k)) ||
    run.config.pool.some(
      (k) =>
        !STARTER_POOL.includes(k) &&
        !availableSpecimens(run.config.research).includes(k),
    ) ||
    run.config.pool.length > 6
  )
    return false;
  const expectedBlocked = run.config.challenge ? [0, 5, 30, 35] : [];
  if (
    JSON.stringify(run.blocked) !== JSON.stringify(expectedBlocked) ||
    run.blocked.some((i) => run.board[i]) ||
    !run.offers.every((k) => run.config.pool.includes(k)) ||
    run.board.some(
      (p) =>
        p &&
        (!run.config.pool.includes(p.kind) ||
          (p.traits?.length ?? 0) >
            (run.upgrades.includes("adaptive") ? 2 : 1) ||
          p.traits?.some((t) => !run.discoveries.includes(t))),
    )
  )
    return false;
  if (
    run.config.draftAfterTurn > run.turn ||
    run.upgrades.length >
      BALANCE.milestones.filter(
        (t) => t > run.config.draftAfterTurn && t <= run.turn,
      ).length ||
    run.upgrades.some(
      (u, i) =>
        !eligibleUpgrades(run.config.research, run.upgrades.slice(0, i)).some(
          (d) => d.id === u,
        ),
    )
  )
    return false;
  const eligible = eligibleUpgrades(run.config.research, run.upgrades).map(
    (u) => u.id,
  );
  if (
    run.pendingUpgrade.some((u) => !eligible.includes(u)) ||
    (run.pendingUpgrade.length &&
      (!(BALANCE.milestones as readonly number[]).includes(run.turn) ||
        run.upgrades.length !==
          BALANCE.milestones.filter(
            (t) => t > run.config.draftAfterTurn && t <= run.turn,
          ).length -
            1))
  )
    return false;
  if (
    (run.pruningLeft && !run.upgrades.includes("pruning")) ||
    (run.recyclerLeft && !run.upgrades.includes("recycler"))
  )
    return false;
  return true;
}
function migrateV1(raw: Record<string, unknown>): SaveData {
  if (raw.current !== null && !validBase(raw.current, 1))
    throw new Error("The saved garden is damaged.");
  if (
    !Array.isArray(raw.completed) ||
    !raw.completed.every(
      (s) =>
        record(s) &&
        typeof s.id === "string" &&
        integer(s.seed, 0, 0xffffffff) &&
        integer(s.score) &&
        s.turns === 25 &&
        validStats(s.stats, true),
    )
  )
    throw new Error("The run history is damaged.");
  const next = emptySave();
  next.settings = raw.settings as Settings;
  next.best = raw.best as number;
  next.profile.purchases = [
    { id: "mycology", cost: 0, legacy: true },
    { id: "xerophytes", cost: 0, legacy: true },
  ];
  const stats = (s: RunStats): RunStats => ({
    ...s,
    overloads: 0,
    peakHeat: 0,
    mutations: 0,
  });
  if (raw.current) {
    const old = raw.current as unknown as GameState;
    const defaults = {
      upgradeRng: (old.seed ^ 0xa5f031c7) >>> 0,
      blocked: [],
      config: {
        draftAfterTurn: old.turn,
        research: ["mycology", "xerophytes"] as ResearchId[],
        pool: [
          "sunflower",
          "rose",
          "mushroom",
          "cactus",
          "clover",
          "wildflower",
        ] as GameState["offers"],
        protocol: "standard" as const,
        challenge: false,
        knownMutations: [],
      },
      upgrades: [],
      pendingUpgrade: [],
      instability: 0,
      chargedSeeds: 0,
      pruningLeft: 0,
      recyclerLeft: 0,
      discoveries: [],
      synergies: [],
    };
    next.current = {
      ...structuredClone(old),
      ...defaults,
      version: 2,
      stats: stats(old.stats),
    };
  }
  for (const item of raw.completed as unknown as RunSummary[]) {
    const runStats = stats(item.stats),
      biomass = completionBiomass({
        score: item.score,
        stats: runStats,
        config: { challenge: false } as GameState["config"],
      });
    next.completed.push({
      ...structuredClone(item),
      stats: runStats,
      biomass,
      discoveries: [],
      protocol: "standard",
      challenge: false,
    });
    next.profile.rewardedRuns.push({ id: item.id, biomass });
    next.profile.earned += biomass;
    next.profile.biomass += biomass;
  }
  return next;
}
export function decodeSave(value: unknown): SaveData {
  if (
    !record(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2)
  )
    throw new Error("This save version cannot be opened.");
  const raw =
    value.schemaVersion === 1 ? migrateV1(value) : structuredClone(value);
  if (raw.current !== null && !isGameState(raw.current))
    throw new Error("The saved garden is damaged.");
  if (
    !record(raw.settings) ||
    typeof raw.settings.sound !== "boolean" ||
    typeof raw.settings.reducedMotion !== "boolean" ||
    !integer(raw.best) ||
    !Array.isArray(raw.completed) ||
    raw.completed.length > 100 ||
    !record(raw.profile)
  )
    throw new Error("The garden journal is damaged.");
  const p = raw.profile;
  if (
    !integer(p.biomass) ||
    !integer(p.earned) ||
    !Array.isArray(p.purchases) ||
    !uniqueList(p.discoveries, mutationIds) ||
    !Array.isArray(p.synergies) ||
    !p.synergies.every((s) => typeof s === "string") ||
    !Array.isArray(p.rewardedRuns)
  )
    throw new Error("The research ledger is damaged.");
  const purchases = new Set<string>();
  let spent = 0;
  for (const entry of p.purchases) {
    if (!record(entry) || typeof entry.id !== "string")
      throw new Error("The research ledger is damaged.");
    const node = RESEARCH.find((n) => n.id === entry.id);
    if (
      !node ||
      purchases.has(entry.id) ||
      !node.requires.every((r) => purchases.has(r)) ||
      !(
        (entry.cost === node.cost && entry.legacy === undefined) ||
        (entry.cost === 0 &&
          entry.legacy === true &&
          ["mycology", "xerophytes"].includes(entry.id))
      )
    )
      throw new Error("The research ledger is damaged.");
    purchases.add(entry.id);
    spent += Number(entry.cost);
  }
  const rewards = new Set<string>();
  let earned = p.discoveries.length * BALANCE.discoveryBiomass;
  for (const item of p.rewardedRuns) {
    if (
      !record(item) ||
      typeof item.id !== "string" ||
      !item.id.length ||
      rewards.has(item.id) ||
      !integer(item.biomass, 8, 22)
    )
      throw new Error("The reward ledger is damaged.");
    rewards.add(item.id);
    earned += Number(item.biomass);
  }
  if (earned !== p.earned || earned - spent !== p.biomass)
    throw new Error("The Biomass balance is damaged.");
  const ids = new Set<string>();
  for (const item of raw.completed) {
    if (
      !record(item) ||
      typeof item.id !== "string" ||
      ids.has(item.id) ||
      !integer(item.seed, 0, 0xffffffff) ||
      !integer(item.score) ||
      item.turns !== 25 ||
      !validStats(item.stats) ||
      !integer(item.biomass) ||
      !uniqueList(item.discoveries, mutationIds) ||
      !PROTOCOLS.some((p) => p.id === item.protocol) ||
      typeof item.challenge !== "boolean" ||
      !rewards.has(item.id)
    )
      throw new Error("The run history is damaged.");
    ids.add(item.id);
  }
  if (
    raw.current &&
    (!(raw.current as GameState).config.research.every((r) =>
      purchases.has(r),
    ) ||
      !(raw.current as GameState).config.knownMutations.every((m) =>
        (p.discoveries as string[]).includes(m),
      ))
  )
    throw new Error("The garden contains locked research.");
  return raw as unknown as SaveData;
}
/** Snapshot, discovery ledger, completed-run ledger and balance share one atomic IDB value. */
export function recordRun(data: SaveData, run: GameState): SaveData {
  const next = structuredClone(data);
  next.current = structuredClone(run);
  for (const id of run.discoveries)
    if (!next.profile.discoveries.includes(id)) {
      next.profile.discoveries.push(id);
      next.profile.earned += BALANCE.discoveryBiomass;
      next.profile.biomass += BALANCE.discoveryBiomass;
    }
  for (const id of run.synergies)
    if (!next.profile.synergies.includes(id)) next.profile.synergies.push(id);
  if (
    run.status === "finished" &&
    !next.profile.rewardedRuns.some((s) => s.id === run.id)
  ) {
    const biomass = completionBiomass(run),
      first = run.discoveries.filter(
        (id) => !run.config.knownMutations.includes(id),
      );
    next.profile.rewardedRuns.push({ id: run.id, biomass });
    next.profile.biomass += biomass;
    next.profile.earned += biomass;
    next.completed.unshift({
      id: run.id,
      seed: run.seed,
      score: run.score,
      turns: run.turn,
      stats: structuredClone(run.stats),
      biomass: biomass + first.length * BALANCE.discoveryBiomass,
      discoveries: first,
      protocol: run.config.protocol,
      challenge: run.config.challenge,
    });
    next.completed = next.completed.slice(0, 100);
    next.best = Math.max(next.best, run.score);
  }
  return next;
}
export interface Persistence {
  load(): Promise<SaveData>;
  save(data: SaveData): Promise<void>;
}
export class IndexedDBStorage implements Persistence {
  private database?: Promise<IDBDatabase>;
  constructor(private readonly name = "chain-garden") {}
  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("garden");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(
          new Error("Close other Chain Garden tabs to update your journal."),
        );
    });
    return this.database;
  }
  async load(): Promise<SaveData> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("garden", "readonly"),
        request = transaction.objectStore("garden").get("save");
      request.onsuccess = () => {
        try {
          resolve(
            request.result === undefined
              ? emptySave()
              : decodeSave(request.result),
          );
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  async save(data: SaveData): Promise<void> {
    decodeSave(data);
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("garden", "readwrite");
      transaction.objectStore("garden").put(data, "save");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Saving was interrupted."));
    });
  }
}
