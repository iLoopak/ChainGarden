import "fake-indexeddb/auto";
import { describe, expect, it, vi, afterEach } from "vitest";
import { createRun, legalActions, resolveAction } from "../engine/game";
import {
  acknowledgeTutorial,
  advanceTutorial,
  beginTutorial,
  newTutorial,
  PROOFS,
  skipTutorial,
  tutorialActionAllowed,
  TUTORIAL_SEED,
  visitTutorialLab,
} from "./tutorial";
import {
  decodeSave,
  emptySave,
  IndexedDBStorage,
  recordRun,
} from "../persistence/storage";
import { GameController } from "../controller";
import type { Action } from "../engine/types";
function firstLesson() {
  let run = createRun(TUTORIAL_SEED, "guided"),
    t = beginTutorial(run.id);
  const action: Action = { type: "plant", index: 8, offer: 0 };
  const first = resolveAction(run, action);
  t = advanceTutorial(t, action, first, false);
  run = first.state;
  return { run, t };
}
describe("real-action tutorial", () => {
  it("starts with reproducible Sunflower then Rose offers and gates only the early lesson", () => {
    const s = createRun(TUTORIAL_SEED);
    expect(s.offers[0]).toBe("sunflower");
    const t = beginTutorial(s.id);
    expect(
      tutorialActionAllowed(t, { type: "plant", index: 8, offer: 0 }),
    ).toBe(true);
    expect(
      tutorialActionAllowed(t, { type: "plant", index: 0, offer: 0 }),
    ).toBe(false);
    expect(tutorialActionAllowed(t, { type: "harvest", index: 20 })).toBe(
      false,
    );
    const { run, t: next } = firstLesson();
    expect(run.offers[0]).toBe("rose");
    expect(next.step).toBe("grow");
    expect(next.proof).toEqual(["planted", "grown"]);
    expect(run.board[14]?.growth).toBe(3);
    expect(tutorialActionAllowed(next, legalActions(run)[0])).toBe(false);
  });
  it("advances by observed actions and events, never by idle time or unrelated actions", () => {
    const run = createRun(TUTORIAL_SEED, "g"),
      t = beginTutorial("g");
    const wrong = resolveAction(run, { type: "plant", index: 0, offer: 0 });
    expect(
      advanceTutorial(t, { type: "plant", index: 0, offer: 0 }, wrong, false),
    ).toEqual(t);
    expect(acknowledgeTutorial(t, run)).toEqual(t);
    const unrelated = resolveAction(createRun(TUTORIAL_SEED, "other"), {
      type: "plant",
      index: 8,
      offer: 0,
    });
    expect(
      advanceTutorial(
        t,
        { type: "plant", index: 8, offer: 0 },
        unrelated,
        false,
      ),
    ).toEqual(t);
  });
  it("teaches neighbors, produces a real three-plant chain and actual heat", () => {
    let { run, t } = firstLesson();
    t = acknowledgeTutorial(t, run);
    expect(t.step).toBe("connect");
    const connect: Action = { type: "plant", index: 15, offer: 0 },
      c = resolveAction(run, connect);
    t = advanceTutorial(t, connect, c, false);
    run = c.state;
    expect(t.step).toBe("harvest");
    expect(run.board[15]?.kind).toBe("rose");
    const action: Action = { type: "harvest", index: 20 },
      r = resolveAction(run, action);
    t = advanceTutorial(t, action, r, false);
    expect(r.chain).toBe(3);
    expect(r.points).toBe(80);
    expect(r.state.instability).toBeGreaterThan(0);
    expect(t.step).toBe("reactor");
    t = acknowledgeTutorial(t, r.state);
    expect(t.step).toBe("explore");
    expect(t.proof).toContain("heat");
    expect(visitTutorialLab(t, [run.id]).status).toBe("active");
  });
  it("finishes only after a real draft, completed reward and research visit", () => {
    let { run, t } = firstLesson();
    t = acknowledgeTutorial(t, run);
    for (const a of [
      { type: "plant", index: 15, offer: 0 },
      { type: "harvest", index: 20 },
    ] as Action[]) {
      const r = resolveAction(run, a);
      t = advanceTutorial(t, a, r, false);
      run = r.state;
    }
    t = acknowledgeTutorial(t, run);
    let data = recordRun(emptySave(), run);
    while (run.status === "playing") {
      const a = legalActions(run)[0],
        r = resolveAction(run, a);
      data = recordRun(data, r.state);
      t = advanceTutorial(
        t,
        a,
        r,
        data.profile.rewardedRuns.some((p) => p.id === run.id),
      );
      run = r.state;
    }
    expect(t.step).toBe("research");
    expect(t.status).toBe("active");
    expect(t.proof).toEqual([...PROOFS]);
    expect(visitTutorialLab(t, [])).toEqual(t);
    expect(visitTutorialLab(t, [run.id]).status).toBe("complete");
    expect(recordRun(data, run).profile.biomass).toBe(data.profile.biomass);
  });
  it("skips immediately without consuming a turn; replay resets proof, not profile rewards", () => {
    const { run, t } = firstLesson(),
      skipped = skipTutorial(t);
    expect(skipped.status).toBe("skipped");
    expect(tutorialActionAllowed(skipped, legalActions(run)[0])).toBe(true);
    expect(beginTutorial("replay")).toEqual({
      ...newTutorial(),
      status: "active",
      runId: "replay",
    });
  });
  it("roundtrips an interrupted growth explanation and restores the next actual action", async () => {
    const { run, t } = firstLesson(),
      data = recordRun(emptySave(), run);
    data.tutorial = t;
    const storage = new IndexedDBStorage(`tutorial-${Math.random()}`);
    await storage.save(data);
    const loaded = await storage.load();
    expect(loaded.tutorial).toEqual(t);
    expect(acknowledgeTutorial(loaded.tutorial, loaded.current).step).toBe(
      "connect",
    );
    expect(loaded.profile.biomass).toBe(data.profile.biomass);
  });
  it("migrates version-2 returning players without forcing onboarding or altering their ledger", () => {
    const old = recordRun(emptySave(), createRun(42));
    const raw = {
      ...old,
      schemaVersion: 2,
      settings: { sound: true, reducedMotion: false },
    };
    const next = decodeSave(raw);
    expect(next.schemaVersion).toBe(3);
    expect(next.tutorial.status).toBe("skipped");
    expect(next.current).toEqual(old.current);
    expect(next.profile).toEqual(old.profile);
    expect(next.settings.guidance).toBe(true);
    expect(next.moss.seen).toEqual([]);
  });
  it("rejects premature completion and malformed pending tips", () => {
    const data = emptySave();
    expect(() =>
      decodeSave({
        ...data,
        tutorial: {
          ...beginTutorial("fake"),
          status: "complete",
          step: "done",
        },
      }),
    ).toThrow("onboarding");
    expect(() =>
      decodeSave({ ...data, moss: { ...data.moss, pending: "overload" } }),
    ).toThrow("onboarding");
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("controller gates, resumes and skips the lesson without duplicate rewards", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  let saved = emptySave();
  const storage = {
    load: async () => structuredClone(saved),
    save: async (d: typeof saved) => {
      saved = structuredClone(d);
    },
  };
  const c = new GameController(storage);
  await c.initialize();
  c.startTutorial();
  c.play({ type: "plant", index: 0, offer: 0 });
  expect(c.run?.turn).toBe(0);
  c.play({ type: "plant", index: 8, offer: 0 });
  c.skipPlayback();
  await vi.runAllTimersAsync();
  expect(saved.tutorial.step).toBe("grow");
  const restored = new GameController(storage);
  await restored.initialize();
  restored.resume();
  expect(restored.getSnapshot().data.tutorial.step).toBe("grow");
  restored.tutorialContinue();
  restored.play({ type: "plant", index: 15, offer: 0 });
  restored.skipPlayback();
  restored.skipTutorial();
  await vi.runAllTimersAsync();
  expect(restored.run?.turn).toBe(2);
  expect(saved.tutorial.status).toBe("skipped");
  const balance = saved.profile.biomass;
  restored.startTutorial();
  expect(restored.run?.turn).toBe(0);
  expect(restored.getSnapshot().data.profile.biomass).toBe(balance);
});

it("validates every tutorial checkpoint through completion and replay without a reward replay", () => {
  let run = createRun(TUTORIAL_SEED, "checkpoints"),
    t = beginTutorial(run.id),
    data = recordRun(emptySave(), run);
  data.tutorial = t;
  data = decodeSave(data);
  for (const action of [
    { type: "plant", index: 8, offer: 0 },
    { type: "plant", index: 15, offer: 0 },
    { type: "harvest", index: 20 },
  ] as Action[]) {
    const r = resolveAction(run, action);
    data = recordRun(data, r.state);
    t = advanceTutorial(t, action, r, false);
    data.tutorial = t;
    data = decodeSave(data);
    run = r.state;
    if (t.step === "grow" || t.step === "reactor") {
      t = acknowledgeTutorial(t, run);
      data.tutorial = t;
      data = decodeSave(data);
    }
  }
  while (run.status === "playing") {
    const action = legalActions(run)[0],
      r = resolveAction(run, action);
    data = recordRun(data, r.state);
    t = advanceTutorial(
      t,
      action,
      r,
      data.profile.rewardedRuns.some((s) => s.id === run.id),
    );
    data.tutorial = t;
    data = decodeSave(data);
    run = r.state;
  }
  const earned = data.profile.earned;
  data.tutorial = visitTutorialLab(t, [run.id]);
  expect(decodeSave(data).tutorial.status).toBe("complete");
  expect(recordRun(data, run).profile.earned).toBe(earned);
});
