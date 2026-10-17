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
            ? 170
            : event.type === "copied"
              ? 160
              : event.type === "growth"
                ? 110
                : event.type === "heat" || event.type === "dew"
                  ? 0
                  : event.type === "overload"
                    ? 260
                    : 120,
      });
    }
  }
  const total = frames.reduce((sum, frame) => sum + frame.duration, 0);
  if (total > 6500)
    for (const frame of frames)
      frame.duration = Math.round((frame.duration * 6500) / total);
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
