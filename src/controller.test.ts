import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameController } from "./controller";
import { emptySave } from "./persistence/storage";
import type { Persistence, SaveData } from "./persistence/storage";
class MemoryStorage implements Persistence {
  data = emptySave();
  writes: SaveData[] = [];
  async load() {
    return structuredClone(this.data);
  }
  async save(data: SaveData) {
    this.data = structuredClone(data);
    this.writes.push(structuredClone(data));
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("controller orchestration", () => {
  it("locks input during visual playback and persists the resolved turn without replay", async () => {
    const storage = new MemoryStorage(),
      controller = new GameController(storage);
    await controller.initialize();
    controller.start(12);
    controller.play({ type: "plant", index: 0, offer: 0 });
    expect(controller.getSnapshot().busy).toBe(true);
    controller.play({ type: "harvest", index: 20 });
    expect(controller.run?.turn).toBe(1);
    await vi.runAllTimersAsync();
    expect(controller.getSnapshot().busy).toBe(false);
    expect(controller.getSnapshot().board).toEqual(controller.run!.board);
    expect(controller.getSnapshot().grown).toContain(14);
    expect(storage.data.current?.turn).toBe(1);
    const restored = new GameController(storage);
    await restored.initialize();
    restored.resume();
    expect(restored.run).toEqual(controller.run);
    expect(restored.getSnapshot().events).toEqual([]);
  });
  it("serializes save writes, including settings after an action", async () => {
    const storage = new MemoryStorage(),
      controller = new GameController(storage);
    await controller.initialize();
    controller.start(11);
    controller.play({ type: "plant", index: 0, offer: 1 });
    controller.settings({ sound: true });
    controller.settings({ reducedMotion: true });
    await vi.runAllTimersAsync();
    expect(storage.writes.map((s) => s.current?.turn)).toEqual([0, 1, 1, 1]);
    expect(storage.data.current?.turn).toBe(1);
    expect(storage.data.settings).toEqual({ sound: true, reducedMotion: true });
  });
  it("finishes playback from the authoritative state with reduced motion", async () => {
    const storage = new MemoryStorage();
    storage.data.settings.reducedMotion = true;
    const controller = new GameController(storage);
    await controller.initialize();
    controller.start(1);
    controller.play({ type: "harvest", index: 20 });
    await vi.runAllTimersAsync();
    expect(controller.getSnapshot().busy).toBe(false);
    expect(
      controller.getSnapshot().events.some((e) => e.type === "harvested"),
    ).toBe(true);
  });
  it("reports unavailable storage and continues to allow a playable in-memory run", async () => {
    const storage: Persistence = {
      load: async () => {
        throw new Error("blocked");
      },
      save: async () => {
        throw new Error("blocked");
      },
    };
    const controller = new GameController(storage);
    await controller.initialize();
    expect(controller.getSnapshot().ready).toBe(true);
    expect(controller.getSnapshot().error).toContain("Local save unavailable");
    controller.start(17);
    controller.play({ type: "plant", index: 0, offer: 0 });
    await vi.runAllTimersAsync();
    expect(controller.run?.turn).toBe(1);
    expect(controller.getSnapshot().error).toContain("could not save");
  });
});
