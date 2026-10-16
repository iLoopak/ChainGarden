import { createRun, resolveAction } from "./engine/game";
import type { Action, GameEvent, GameState, Plant } from "./engine/types";
import { emptySave, recordRun } from "./persistence/storage";
import type { Persistence, SaveData, Settings } from "./persistence/storage";
import { buildPlaybackFrames, presentEvents } from "./presentation/playback";
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
  displayScore: number;
  chainCount: number;
  comboDepth: number;
  pulses: GameEvent[];
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
    displayScore: 0,
    chainCount: 0,
    comboDepth: 0,
    pulses: [],
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
      this.update({
        ready: true,
        data,
        board: data.current?.board ?? [],
        displayScore: data.current?.score ?? 0,
      });
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
      displayScore: run.score,
      chainCount: 0,
      comboDepth: 0,
      pulses: [],
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
      pulses: [],
      active: null,
      displayScore: current.score,
      chainCount: 0,
      comboDepth: 0,
      lastPoints: 0,
      lastChain: 0,
    });
    let board = structuredClone(current.board);
    const frames = buildPlaybackFrames(result.events);
    let step = 0,
      displayedScore = current.score,
      chainCount = 0,
      comboDepth = 0;
    const advance = () => {
      const frame = frames[step++];
      if (!frame) {
        this.update({
          busy: false,
          board: result.state.board,
          active: null,
          pulses: [],
          grown: [],
          events: result.events,
          displayScore: result.state.score,
          chainCount: result.chain,
          comboDepth,
          lastPoints: result.points,
          lastChain: result.chain,
        });
        return;
      }
      board = presentEvents(board, frame.events);
      for (const event of frame.events) {
        if (event.type === "harvested") {
          displayedScore += event.points ?? 0;
          chainCount++;
          comboDepth = Math.max(comboDepth, event.depth);
          if (this.view.data.settings.sound) playNote(event.depth);
        }
      }
      this.update({
        board,
        active: frame.events[0],
        pulses: frame.events,
        grown: frame.events
          .filter((e) => e.type === "growth")
          .map((e) => e.index),
        events: [...this.view.events, ...frame.events],
        displayScore: displayedScore,
        chainCount,
        comboDepth,
      });
      this.timer = setTimeout(advance, still ? 0 : frame.duration);
    };
    advance();
  }
  get run(): GameState | null {
    return this.view.data.current;
  }
}
