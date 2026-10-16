import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createRun, legalActions, resolveAction } from "../engine/game";
import {
  decodeSave,
  emptySave,
  IndexedDBStorage,
  isGameState,
  recordRun,
} from "./storage";
describe("versioned journal", () => {
  it("roundtrips a mid-run snapshot through IndexedDB and resumes deterministically", async () => {
    const storage = new IndexedDBStorage(`test-${Math.random()}`);
    let run = createRun(444);
    for (let i = 0; i < 10; i++)
      run = resolveAction(run, legalActions(run)[i]).state;
    const save = recordRun(emptySave(), run);
    save.settings.sound = true;
    await storage.save(save);
    const loaded = await storage.load();
    expect(loaded).toEqual(save);
    const action = legalActions(run)[0];
    expect(resolveAction(loaded.current!, action)).toEqual(
      resolveAction(run, action),
    );
  });
  it("commits completion and rewards atomically, exactly once across reload", async () => {
    let run = createRun(32, "unique");
    for (let i = 0; i < 25; i++)
      run = resolveAction(run, legalActions(run)[0]).state;
    const storage = new IndexedDBStorage(`test-${Math.random()}`);
    await storage.save(recordRun(emptySave(), run));
    const loaded = await storage.load();
    const again = recordRun(loaded, loaded.current!);
    expect(again.completed).toHaveLength(1);
    expect(again.best).toBe(run.score);
    await storage.save(again);
    expect((await storage.load()).completed).toHaveLength(1);
  });
  it("returns defaults for a new browser and rejects unknown schemas or damaged runs", async () => {
    expect(await new IndexedDBStorage(`test-${Math.random()}`).load()).toEqual(
      emptySave(),
    );
    expect(() => decodeSave({ schemaVersion: 2 })).toThrow("version");
    const save = recordRun(emptySave(), createRun(12));
    save.current!.board[0] = { id: 1, kind: "rose", growth: 3, bornTurn: 0 };
    expect(() => decodeSave(save)).toThrow("damaged");
    expect(isGameState({ ...createRun(1), turn: 25, status: "playing" })).toBe(
      false,
    );
    expect(isGameState({ ...createRun(1), rng: -1 })).toBe(false);
  });
  it("retains the personal best when a lower score is recorded", () => {
    const first = createRun(1, "one");
    first.turn = 25;
    first.status = "finished";
    first.score = 500;
    const second = { ...first, id: "two", score: 200 };
    const saved = recordRun(recordRun(emptySave(), first), second);
    expect(saved.best).toBe(500);
    expect(saved.completed).toHaveLength(2);
  });
});
