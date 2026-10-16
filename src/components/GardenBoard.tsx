import type { CSSProperties } from "react";
import type { GameEvent, Plant, ReactionPreview } from "../engine/types";
import { PLANTS } from "../engine/plants";
import { coordinate } from "../presentation/playback";
import { PlantArt } from "./PlantArt";
import { ReactionTrace } from "./ReactionTrace";
interface Props {
  board: (Plant | null)[];
  mode: "plant" | "harvest";
  busy: boolean;
  inactive: boolean;
  inspected: number | null;
  preview: ReactionPreview | null;
  events: GameEvent[];
  pulses: GameEvent[];
  onTile: (index: number) => void;
}
export function GardenBoard({
  board,
  mode,
  busy,
  inactive,
  inspected,
  preview,
  events,
  pulses,
  onTile,
}: Props) {
  return (
    <div
      className={`board-frame ${busy ? "resolving" : ""} ${inactive ? "board-sleeping" : ""}`}
    >
      <div className="tray-rail">
        <span>GROWTH MATRIX</span>
        <span>06 × 06 / ORTHOGONAL</span>
      </div>
      <div className="board-coordinate">
        {"ABCDEF".split("").map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="matrix-stage">
        <div
          className={`garden-board mode-${mode}`}
          role="group"
          aria-label="6 by 6 garden"
        >
          {board.map((plant, index) => {
            const pulse = pulses.find((e) => e.index === index),
              ghost = pulse?.type === "harvested" ? pulse.plant : null;
            const piece = plant ?? ghost;
            const predicted = preview?.harvested.indexOf(index) ?? -1;
            const selected = inspected === index;
            return (
              <button
                key={index}
                data-testid={`tile-${index}`}
                data-plant={plant?.kind ?? ""}
                data-growth={plant?.growth ?? ""}
                className={`garden-tile ${plant ? "has-plant" : "empty-tile"} ${plant?.growth === 3 ? "ripe" : ""} ${selected ? "inspected" : ""} ${predicted >= 0 ? "forecast-harvest" : ""} ${pulse ? `event-${pulse.type}` : ""} ${ghost ? "releasing" : ""}`}
                style={
                  {
                    "--specimen": PLANTS[piece?.kind ?? "clover"].color,
                  } as CSSProperties
                }
                disabled={inactive || busy || (mode === "harvest" && !plant)}
                onClick={() => onTile(index)}
                aria-label={`${coordinate(index)}: ${plant ? `${PLANTS[plant.kind].name}, growth ${plant.growth} of 3${plant.growth === 3 ? ", ripe" : ""}, select for reaction preview` : "empty, plant selected seed"}`}
                aria-pressed={selected}
              >
                <span className="tile-coordinate" aria-hidden="true">
                  {coordinate(index)}
                </span>
                {piece ? (
                  <>
                    <span className="specimen-base" />
                    <PlantArt kind={piece.kind} growth={piece.growth} />
                    {plant && (
                      <span className="growth-dots" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                          <i
                            key={n}
                            className={plant.growth >= n ? "filled" : ""}
                          />
                        ))}
                      </span>
                    )}
                    {plant?.growth === 3 && (
                      <span className="charged-mark" aria-hidden="true" />
                    )}
                  </>
                ) : (
                  <span className="plot-cross" aria-hidden="true">
                    +
                  </span>
                )}
                {predicted >= 0 && (
                  <span className="forecast-order" aria-hidden="true">
                    {predicted + 1}
                  </span>
                )}
                {pulse?.type === "copied" && pulse.kind && (
                  <span className="echo-reveal">
                    <PlantArt kind={pulse.kind} />
                    <span>ECHO</span>
                  </span>
                )}
                {pulse?.points !== undefined && (
                  <span className="tile-points">+{pulse.points}</span>
                )}
                {ghost && (
                  <svg
                    className="release-particles"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <circle
                        key={i}
                        cx={50 + Math.cos((i * Math.PI) / 4) * 33}
                        cy={50 + Math.sin((i * Math.PI) / 4) * 33}
                        r={i % 2 ? 1.5 : 2.5}
                      />
                    ))}
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <ReactionTrace
          events={preview && !busy ? preview.events : events}
          pulses={pulses}
          preview={!!preview && !busy}
        />
      </div>
      <div className="board-footer">
        <span>
          <i className="ripe-dot" />3 nodes = ripe
        </span>
        <span>
          {busy
            ? "REACTION IN PROGRESS"
            : preview
              ? "FORECAST · CONFIRM TO RELEASE"
              : "WAITING FOR YOUR DECISION"}
        </span>
      </div>
    </div>
  );
}
