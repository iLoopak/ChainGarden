import type { GameEvent } from "../engine/types";
const center = (index: number) => ({
  x: ((index % 6) + 0.5) * 100,
  y: (Math.floor(index / 6) + 0.5) * 100,
});
export function ReactionTrace({
  events,
  pulses,
  preview = false,
}: {
  events: GameEvent[];
  pulses: GameEvent[];
  preview?: boolean;
}) {
  const links = events.filter(
    (e) =>
      e.source !== undefined &&
      ["activated", "growth", "spread", "copied"].includes(e.type),
  );
  return (
    <svg
      className={`reaction-trace ${preview ? "is-forecast" : ""}`}
      viewBox="0 0 600 600"
      aria-hidden="true"
      data-testid="reaction-trace"
    >
      {links.map((event, i) => {
        const from = center(event.source!),
          to = center(event.index);
        const active = pulses.includes(event);
        return (
          <g
            key={`${event.source}-${event.index}-${event.type}-${i}`}
            className={`trace-link ${active ? "trace-active" : ""} trace-${event.type}`}
            data-source={event.source}
            data-target={event.index}
          >
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} pathLength="1" />
            {active && (
              <circle className="trace-arrival" cx={to.x} cy={to.y} r="28" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
