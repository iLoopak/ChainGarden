import { describe, expect, it } from "vitest";
import { createRun, resolveAction } from "../engine/game";
import { eventExpression, newMossMemory, observeMoss } from "./moss";
describe("M.O.S.S. event reactions", () => {
  it("never speaks because time passed or a young plant simply grew", () => {
    const m = newMossMemory();
    expect(observeMoss(m, [], "r", 25)).toEqual(m);
    const r = resolveAction(createRun(1), {
      type: "plant",
      index: 0,
      offer: 0,
    });
    expect(observeMoss(m, r.events, "r", 1).pending).toBeNull();
  });
  it("reacts to an actual chain only once across reloads", () => {
    const s = resolveAction(createRun(1), {
        type: "plant",
        index: 0,
        offer: 0,
      }).state,
      r = resolveAction(s, { type: "harvest", index: 20 });
    const m = observeMoss(newMossMemory(), r.events, "r", 2);
    expect(m.pending).toBe("chain");
    expect(m.seen).toContain("chain");
    expect(
      observeMoss({ ...structuredClone(m), pending: null }, r.events, "r", 10)
        .pending,
    ).toBeNull();
  });
  it("prioritizes overloads, respects a four-action cooldown, and expires tips on the next action", () => {
    const events = [
      { type: "overload" as const, index: 0, depth: 0, text: "overload" },
      {
        type: "mutation" as const,
        index: 1,
        depth: 0,
        text: "mutation",
        first: true,
      },
    ];
    let m = observeMoss(newMossMemory(), events, "r", 4);
    expect(m.pending).toBe("overload");
    expect(observeMoss(m, [], "r", 5).pending).toBeNull();
    expect(observeMoss(m, events, "r", 4)).toEqual(m);
    m = { ...m, pending: null };
    expect(observeMoss(m, events.slice(1), "r", 6).pending).toBeNull();
    expect(observeMoss(m, events.slice(1), "r", 8).pending).toBe("mutation");
  });
  it("suppresses duplicate tutorial tips while preserving expressive real feedback", () => {
    const e = [
      {
        type: "mutation" as const,
        index: 1,
        depth: 0,
        text: "new",
        first: true,
      },
    ];
    const m = observeMoss(newMossMemory(), e, "r", 2, true);
    expect(m.pending).toBeNull();
    expect(m.seen).toEqual(["mutation"]);
    expect(eventExpression(e)).toBe("curious");
    expect(
      eventExpression([
        { type: "harvested", index: 0, depth: 0, text: "harvest" },
      ]),
    ).toBe("happy");
    expect(
      eventExpression([
        { type: "overload", index: 0, depth: 0, text: "overload" },
      ]),
    ).toBe("surprised");
    expect(
      eventExpression([
        { type: "heat", index: 0, depth: 0, text: "heat", heat: 80 },
      ]),
    ).toBe("warning");
    expect(eventExpression([])).toBe("neutral");
  });
});

it("lets a first overload replace less important advice without repeating it", () => {
  const m = observeMoss(
    newMossMemory(),
    [{ type: "upgrade", index: -1, depth: 0, text: "upgrade" }],
    "r",
    5,
  );
  const urgent = observeMoss(
    m,
    [{ type: "overload", index: 14, depth: 0, text: "overload" }],
    "r",
    6,
  );
  expect(urgent.pending).toBe("overload");
  expect(
    observeMoss(
      urgent,
      [{ type: "overload", index: 14, depth: 0, text: "overload" }],
      "r",
      7,
    ).pending,
  ).toBeNull();
});
