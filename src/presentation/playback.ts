import type { GameEvent, Plant } from "../engine/types";
export interface PlaybackFrame {
  events: GameEvent[];
  duration: number;
}
/** Batch only simultaneous seasonal growth. Causal effects retain their queue order. */
export function buildPlaybackFrames(events: GameEvent[]): PlaybackFrame[] {
  const frames: PlaybackFrame[] = [];
  for (const event of events) {
    const season = event.type === "growth" && event.source === undefined;
    const last = frames.at(-1);
    if (
      season &&
      last?.events.every((e) => e.type === "growth" && e.source === undefined)
    ) {
      last.events.push(event);
    } else {
      frames.push({
        events: [event],
        duration:
          event.type === "harvested"
            ? 320
            : event.type === "copied"
              ? 400
              : event.type === "growth"
                ? 180
                : 220,
      });
    }
  }
  return frames;
}
export function presentEvents(
  board: (Plant | null)[],
  events: GameEvent[],
): (Plant | null)[] {
  const next = [...board];
  for (const event of events) {
    if (event.type === "harvested" || event.type === "destroyed")
      next[event.index] = null;
    else if (event.plant) next[event.index] = { ...event.plant };
  }
  return next;
}
export function coordinate(index: number): string {
  return `${String.fromCharCode(65 + (index % 6))}${Math.floor(index / 6) + 1}`;
}
