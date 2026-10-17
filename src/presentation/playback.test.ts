import { describe, expect, it } from "vitest";
import { createRun, legalActions, resolveAction } from "../engine/game";
import { buildPlaybackFrames, presentEvents } from "./playback";
describe("event-driven presentation", () => {
  it("reconstructs exact growth, harvest and spread states without using the final board", () => {
    for (let seed = 1; seed <= 40; seed++) {
      let state = createRun(seed);
      for (let turn = 0; state.status === "playing"; turn++) {
        const legal = legalActions(state),
          result = resolveAction(
            state,
            legal[(turn * 19 + seed) % legal.length],
          );
        const frames = buildPlaybackFrames(result.events);
        expect(frames.flatMap((f) => f.events)).toEqual(result.events);
        let board = state.board;
        for (const frame of frames) board = presentEvents(board, frame.events);
        expect(board).toEqual(result.state.board);
        state = result.state;
      }
    }
  });
  it("batches seasonal growth but keeps every directed effect sequential", () => {
    const state = createRun(1),
      result = resolveAction(state, { type: "plant", index: 0, offer: 0 });
    const frames = buildPlaybackFrames(result.events);
    expect(frames[1].events).toHaveLength(4);
    expect(
      frames[1].events.every(
        (e) => e.type === "growth" && e.source === undefined,
      ),
    ).toBe(true);
    const next = resolveAction(result.state, { type: "harvest", index: 20 });
    const directed = buildPlaybackFrames(next.events).filter((f) =>
      f.events.some((e) => e.source !== undefined),
    );
    expect(directed.every((f) => f.events.length === 1)).toBe(true);
    expect(
      directed.some(
        (f) => f.events[0].source === 20 && f.events[0].index === 14,
      ),
    ).toBe(true);
  });
  it("never mutates the input display board", () => {
    const state = createRun(7),
      before = structuredClone(state.board),
      result = resolveAction(state, { type: "plant", index: 0, offer: 0 });
    presentEvents(state.board, result.events);
    expect(state.board).toEqual(before);
  });
});

it("caps long visual sequences while preserving exact event order and board state", () => {
  const state = createRun(1);
  state.board = Array.from({ length: 36 }, (_, i) => ({
    id: i + 1,
    kind: "rose" as const,
    growth: 3,
    bornTurn: -1,
  }));
  state.nextId = 37;
  const result = resolveAction(state, { type: "harvest", index: 14 }),
    frames = buildPlaybackFrames(result.events);
  expect(frames.reduce((sum, f) => sum + f.duration, 0)).toBeLessThanOrEqual(
    6600,
  );
  expect(frames.flatMap((f) => f.events)).toEqual(result.events);
  expect(presentEvents(state.board, result.events)).toEqual(result.state.board);
});
