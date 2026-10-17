import {
  acknowledgeTutorial,
  advanceTutorial,
  beginTutorial,
  skipTutorial,
  tutorialActionAllowed,
  TUTORIAL_SEED,
  visitTutorialLab,
} from "./experience/tutorial";
import { observeMoss } from "./experience/moss";
import { createRun, isLegalAction, resolveAction } from "./engine/game";
import type {
  Action,
  GameEvent,
  GameState,
  Plant,
  ResearchId,
  RunOptions,
} from "./engine/types";
import {
  emptySave,
  ownedResearch,
  purchaseResearch,
  recordRun,
} from "./persistence/storage";
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
  displayHeat: number;
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
    displayHeat: 0,
    chainCount: 0,
    comboDepth: 0,
    pulses: [],
    lastPoints: 0,
    lastChain: 0,
    error: null,
  };
  private savingDisabled = false;
  private listeners = new Set<() => void>();
  private writes: Promise<void> = Promise.resolve();
  private finishPlayback?: () => void;
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
        displayHeat: data.current?.instability ?? 0,
      });
    } catch (error) {
      this.savingDisabled = true;
      this.update({
        ready: true,
        error: `Local save unavailable: ${error instanceof Error ? error.message : "storage is blocked"}. Existing data is kept untouched; this session can still be played in memory.`,
      });
    }
  }
  private persist(data: SaveData) {
    if (this.savingDisabled) return;
    this.writes = this.writes
      .then(() => this.storage.save(data))
      .catch(() => {
        this.update({
          error:
            "Your browser could not save this garden. Keep this tab open to finish the run.",
        });
      });
  }
  start(seed = freshSeed(), options: RunOptions = {}, guided = false) {
    if (this.timer) clearTimeout(this.timer);
    this.finishPlayback = undefined;
    const owned = ownedResearch(this.view.data);
    const research = guided ? [] : (options.research ?? owned);
    if (research.some((id) => !owned.includes(id)))
      throw new Error("Research is locked.");
    const run = createRun(seed, freshRunId(), {
      ...options,
      research,
      knownMutations: this.view.data.profile.discoveries,
    });
    const data = recordRun(this.view.data, run);
    data.tutorial = guided
      ? beginTutorial(run.id)
      : ["available", "active"].includes(data.tutorial.status)
        ? skipTutorial(data.tutorial)
        : data.tutorial;
    data.moss.pending = null;
    this.update({
      data,
      screen: "garden",
      board: run.board,
      events: [],
      grown: [],
      active: null,
      busy: false,
      displayScore: run.score,
      displayHeat: run.instability,
      chainCount: 0,
      comboDepth: 0,
      pulses: [],
      lastPoints: 0,
      lastChain: 0,
    });
    this.persist(data);
  }
  startTutorial() {
    this.start(TUTORIAL_SEED, {}, true);
  }
  tutorialContinue() {
    const data = {
      ...this.view.data,
      tutorial: acknowledgeTutorial(this.view.data.tutorial, this.run),
    };
    this.update({ data });
    this.persist(data);
  }
  skipTutorial() {
    const data = {
      ...this.view.data,
      tutorial: skipTutorial(this.view.data.tutorial),
    };
    this.update({ data });
    this.persist(data);
  }
  openLab() {
    const data = {
      ...this.view.data,
      tutorial: visitTutorialLab(
        this.view.data.tutorial,
        this.view.data.profile.rewardedRuns.map((r) => r.id),
      ),
    };
    this.update({ data });
    this.persist(data);
  }
  dismissMoss() {
    const data = {
      ...this.view.data,
      moss: { ...this.view.data.moss, pending: null },
    };
    this.update({ data });
    this.persist(data);
  }
  again() {
    const run = this.run;
    if (run)
      this.start(undefined, {
        protocol: run.config.protocol,
        challenge: run.config.challenge,
        specimens: run.config.pool.filter(
          (k) => !["sunflower", "rose", "clover", "wildflower"].includes(k),
        ),
      });
  }
  replay() {
    const run = this.run;
    if (run)
      this.start(run.seed, {
        research: run.config.research,
        poolOrder: run.config.pool,
        specimens: run.config.pool.filter(
          (k) => !["sunflower", "rose", "clover", "wildflower"].includes(k),
        ),
        protocol: run.config.protocol,
        challenge: run.config.challenge,
      });
  }
  purchase(id: ResearchId) {
    const data = purchaseResearch(this.view.data, id);
    this.update({ data });
    this.persist(data);
  }
  skipPlayback() {
    this.finishPlayback?.();
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
    if (patch.guidance === false) data.moss = { ...data.moss, pending: null };
    this.update({ data });
    this.persist(data);
  }
  play(action: Action) {
    const current = this.view.data.current;
    if (
      !current ||
      this.view.busy ||
      !isLegalAction(current, action) ||
      !tutorialActionAllowed(this.view.data.tutorial, action)
    )
      return;
    const result = resolveAction(current, action),
      data = recordRun(this.view.data, result.state);
    data.tutorial = advanceTutorial(
      data.tutorial,
      action,
      result,
      data.profile.rewardedRuns.some((r) => r.id === result.state.id),
    );
    const core =
      data.tutorial.status === "active" &&
      ["plant", "grow", "connect", "harvest", "reactor", "upgrade"].includes(
        data.tutorial.step,
      );
    data.moss = observeMoss(
      data.moss,
      result.events,
      current.id,
      result.state.turn,
      core,
    );
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
      displayHeat: current.instability,
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
    const finish = () => {
      if (this.timer) clearTimeout(this.timer);
      this.finishPlayback = undefined;
      this.update({
        busy: false,
        board: result.state.board,
        active: null,
        pulses: [],
        grown: [],
        events: result.events,
        displayScore: result.state.score,
        displayHeat: result.state.instability,
        chainCount: result.chain,
        comboDepth,
        lastPoints: result.points,
        lastChain: result.chain,
      });
    };
    this.finishPlayback = finish;
    const advance = () => {
      const frame = frames[step++];
      if (!frame) {
        finish();
        return;
      }
      board = presentEvents(board, frame.events);
      for (const event of frame.events) {
        displayedScore += event.points ?? 0;
        if (event.heat !== undefined)
          this.view = { ...this.view, displayHeat: event.heat };
        if (event.type === "harvested") {
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
