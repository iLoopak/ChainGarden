import { createRun, resolveAction } from "./engine/game";
import type { Action, GameEvent, GameState, Plant } from "./engine/types";
import { emptySave, recordRun } from "./persistence/storage";
import type { Persistence, SaveData, Settings } from "./persistence/storage";
import { freshRunId, freshSeed, playNote } from "./platform/browser";
export interface ViewState {
  ready: boolean;
  data: SaveData;
  screen: "title" | "garden";
  busy: boolean;
  board: (Plant | null)[];
  events: GameEvent[];
  grown: number[];
  active: GameEvent | null;
  lastPoints: number;
  lastChain: number;
  error: string | null;
}
export class GameController {
  private view: ViewState = {
    ready: false,
    data: emptySave(),
    screen: "title",
    busy: false,
    board: [],
    events: [],
    grown: [],
    active: null,
    lastPoints: 0,
    lastChain: 0,
    error: null,
  };
  private listeners = new Set<() => void>();
  private writes: Promise<void> = Promise.resolve();
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private storage: Persistence) {}
  getSnapshot = () => this.view;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private update(patch: Partial<ViewState>) {
    this.view = { ...this.view, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  async initialize() {
    try {
      const data = await this.storage.load();
      this.update({ ready: true, data, board: data.current?.board ?? [] });
    } catch (error) {
      this.update({
        ready: true,
        error: `Local save unavailable: ${error instanceof Error ? error.message : "storage is blocked"}. You can still play this session.`,
      });
    }
  }
  private persist(data: SaveData) {
    this.writes = this.writes
      .then(() => this.storage.save(data))
      .catch(() => {
        this.update({
          error:
            "Your browser could not save this garden. Keep this tab open to finish the run.",
        });
      });
  }
  start(seed = freshSeed()) {
    if (this.timer) clearTimeout(this.timer);
    const run = createRun(seed, freshRunId());
    const data = recordRun(this.view.data, run);
    this.update({
      data,
      screen: "garden",
      board: run.board,
      events: [],
      grown: [],
      active: null,
      busy: false,
      lastPoints: 0,
      lastChain: 0,
    });
    this.persist(data);
  }
  resume() {
    if (this.view.data.current) this.update({ screen: "garden" });
  }
  home() {
    if (!this.view.busy) this.update({ screen: "title" });
  }
  settings(patch: Partial<Settings>) {
    const data = {
      ...this.view.data,
      settings: { ...this.view.data.settings, ...patch },
    };
    this.update({ data });
    this.persist(data);
  }
  play(action: Action) {
    const current = this.view.data.current;
    if (!current || this.view.busy || current.status === "finished") return;
    const result = resolveAction(current, action),
      data = recordRun(this.view.data, result.state);
    // Save the entire resolved turn before animation. Reload never repeats rewards.
    this.persist(data);
    const still =
      this.view.data.settings.reducedMotion ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.update({
      data,
      busy: true,
      events: [],
      grown: [],
      active: null,
      lastPoints: result.points,
      lastChain: result.chain,
    });
    const board = structuredClone(current.board);
    const frames = result.events.filter((e) => e.type !== "growth");
    let step = 0;
    const advance = () => {
      const event = frames[step++];
      if (!event) {
        this.update({
          busy: false,
          grown: [
            ...new Set(
              result.events
                .filter((e) => e.type === "growth")
                .map((e) => e.index),
            ),
          ],
          board: result.state.board,
          active: null,
          events: result.events.filter((e) => e.type !== "growth"),
        });
        return;
      }
      if (event.type === "harvested") board[event.index] = null;
      if (event.type === "planted" || event.type === "spread")
        board[event.index] = result.state.board[event.index];
      this.update({
        board: [...board],
        active: event,
        events: [...this.view.events, event],
      });
      if (event.type === "harvested" && this.view.data.settings.sound)
        playNote(event.depth);
      this.timer = setTimeout(
        advance,
        still ? 0 : event.type === "harvested" ? 260 : 140,
      );
    };
    advance();
  }
  get run(): GameState | null {
    return this.view.data.current;
  }
}
