import type { GameEvent } from "../engine/types";
export type MossExpression =
  | "neutral"
  | "curious"
  | "happy"
  | "warning"
  | "surprised";
export const MOSS_TRIGGERS = [
  "chain",
  "mutation",
  "overload",
  "critical",
  "upgrade",
] as const;
export type MossTrigger = (typeof MOSS_TRIGGERS)[number];
export interface MossMemory {
  seen: MossTrigger[];
  pending: MossTrigger | null;
  lastRun: string | null;
  lastTurn: number;
}
export const newMossMemory = (): MossMemory => ({
  seen: [],
  pending: null,
  lastRun: null,
  lastTurn: 0,
});
export const MOSS_LINES: Record<
  MossTrigger,
  { text: string; expression: MossExpression }
> = {
  chain: {
    text: "You built that chain. Imagine a bigger one.",
    expression: "happy",
  },
  mutation: {
    text: "New tissue! I should probably label that.",
    expression: "curious",
  },
  overload: {
    text: "A little pruning. Two very charged seeds.",
    expression: "surprised",
  },
  critical: {
    text: "That reactor is humming. Keep a cooling plant nearby.",
    expression: "warning",
  },
  upgrade: {
    text: "A new experiment. Let’s see what it can do.",
    expression: "happy",
  },
};
/** Only actual resolved events can trigger a tip; once per subject, normally four actions apart; first overload has priority. */
export function observeMoss(
  memory: MossMemory,
  events: GameEvent[],
  runId: string,
  turn: number,
  guided = false,
): MossMemory {
  const next = structuredClone(memory);
  if (next.lastRun !== runId || turn > next.lastTurn) next.pending = null;
  const chain = events.filter((e) => e.type === "harvested").length;
  const triggers: MossTrigger[] = [];
  if (events.some((e) => e.type === "overload")) triggers.push("overload");
  if (events.some((e) => e.type === "mutation" && e.first))
    triggers.push("mutation");
  if (chain >= 3) triggers.push("chain");
  if (events.some((e) => e.type === "heat" && (e.heat ?? 0) >= 75))
    triggers.push("critical");
  if (events.some((e) => e.type === "upgrade")) triggers.push("upgrade");
  if (guided) {
    for (const id of triggers) if (!next.seen.includes(id)) next.seen.push(id);
    return next;
  }
  const urgent =
    triggers.includes("overload") && !next.seen.includes("overload");
  if (
    !urgent &&
    (next.pending || (next.lastRun === runId && turn - next.lastTurn < 4))
  )
    return next;
  const id = triggers.find((id) => !next.seen.includes(id));
  if (id) {
    next.seen.push(id);
    next.pending = id;
    next.lastRun = runId;
    next.lastTurn = turn;
  }
  return next;
}
export function eventExpression(events: GameEvent[]): MossExpression {
  if (events.some((e) => e.type === "overload")) return "surprised";
  if (events.some((e) => e.type === "mutation" || e.type === "copied"))
    return "curious";
  if (events.some((e) => e.type === "harvested")) return "happy";
  if (events.some((e) => e.type === "heat" && (e.heat ?? 0) >= 75))
    return "warning";
  return "neutral";
}
