import { PLANT_KINDS } from "../engine/types";
import type { GameState, RunStats } from "../engine/types";
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
}
export interface SaveData {
  schemaVersion: 1;
  current: GameState | null;
  settings: Settings;
  best: number;
  completed: RunSummary[];
}
export const emptySave = (): SaveData => ({
  schemaVersion: 1,
  current: null,
  settings: { sound: false, reducedMotion: false },
  best: 0,
  completed: [],
});
const integer = (
  v: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): v is number => Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
function validStats(v: unknown): v is RunStats {
  return (
    record(v) &&
    integer(v.harvested) &&
    integer(v.bestChain) &&
    integer(v.bestTurn) &&
    integer(v.dewEarned) &&
    record(v.species) &&
    Object.entries(v.species).every(
      ([k, n]) =>
        PLANT_KINDS.includes(k as (typeof PLANT_KINDS)[number]) && integer(n),
    )
  );
}
export function isGameState(v: unknown): v is GameState {
  if (
    !record(v) ||
    v.version !== 1 ||
    typeof v.id !== "string" ||
    !v.id.length ||
    !integer(v.seed, 0, 0xffffffff) ||
    !integer(v.rng, 0, 0xffffffff) ||
    !integer(v.turn, 0, 25) ||
    v.maxTurns !== 25 ||
    !integer(v.score) ||
    !integer(v.dew, 0, 9) ||
    !integer(v.nextId, 1) ||
    !validStats(v.stats)
  )
    return false;
  if (
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
    return true;
  });
}
export function decodeSave(raw: unknown): SaveData {
  if (!record(raw) || raw.schemaVersion !== 1)
    throw new Error("This save version cannot be opened.");
  if (raw.current !== null && !isGameState(raw.current))
    throw new Error("The saved garden is damaged.");
  if (
    !record(raw.settings) ||
    typeof raw.settings.sound !== "boolean" ||
    typeof raw.settings.reducedMotion !== "boolean" ||
    !integer(raw.best) ||
    !Array.isArray(raw.completed)
  )
    throw new Error("The garden journal is damaged.");
  const ids = new Set<string>();
  for (const item of raw.completed) {
    if (
      !record(item) ||
      typeof item.id !== "string" ||
      ids.has(item.id) ||
      !integer(item.seed, 0, 0xffffffff) ||
      !integer(item.score) ||
      !integer(item.turns, 25, 25) ||
      !validStats(item.stats)
    )
      throw new Error("The run history is damaged.");
    ids.add(item.id);
  }
  return structuredClone(raw) as unknown as SaveData;
}
/** One record holds progress and rewards, so a crash cannot separate them. */
export function recordRun(data: SaveData, run: GameState): SaveData {
  const next = structuredClone(data);
  next.current = run;
  if (
    run.status === "finished" &&
    !next.completed.some((s) => s.id === run.id)
  ) {
    next.completed.unshift({
      id: run.id,
      seed: run.seed,
      score: run.score,
      turns: run.turn,
      stats: structuredClone(run.stats),
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
