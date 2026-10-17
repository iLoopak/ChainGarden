import { useId } from "react";
import type { CSSProperties } from "react";
import type { ViewState } from "../controller";
import { comboMultiplier, isLegalAction, nextSeed } from "../engine/game";
import { mutationDefinition, upgradeDefinition } from "../engine/content";
import { PLANTS } from "../engine/plants";
import type { Action, GameState, ReactionPreview } from "../engine/types";
import type { TutorialProgress } from "../experience/tutorial";
import { Icon } from "./Icons";
import { PlantArt } from "./PlantArt";
export function DecisionPanel({
  run,
  view,
  offer,
  mode,
  inspected,
  preview,
  tutorial,
  onOffer,
  onCancel,
  onHarvest,
  onUtility,
  onSkip,
  onPrune,
  onDetails,
}: {
  run: GameState;
  view: ViewState;
  offer: number;
  mode: "plant" | "harvest" | "prune";
  inspected: number | null;
  preview: ReactionPreview | null;
  tutorial: TutorialProgress;
  onOffer: (i: number) => void;
  onCancel: () => void;
  onHarvest: () => void;
  onUtility: (a: Action) => void;
  onSkip: () => void;
  onPrune: () => void;
  onDetails: () => void;
}) {
  const tooltipId = useId();
  const selected = inspected === null ? null : run.board[inspected],
    scanner = nextSeed(run);
  const guided = tutorial.status === "active",
    seedLocked =
      guided &&
      !["plant", "connect", "explore", "finish"].includes(tutorial.step);
  return (
    <aside
      className={`decision-panel ${preview ? "has-preview" : ""}`}
      aria-label="Turn decisions"
    >
      {view.busy ? (
        <div className="resolution-card">
          <span className="eyebrow">Reaction in motion</span>
          <div className="live-chain">
            <strong>{view.chainCount}</strong>
            <span>plants</span>
            <b>×{comboMultiplier(view.comboDepth).toFixed(2)}</b>
          </div>
          <p>{view.active?.text}</p>
          <button className="secondary-button" onClick={onSkip}>
            Skip playback <Icon name="arrow" size={16} />
          </button>
        </div>
      ) : preview && selected ? (
        <div className="harvest-preview" data-testid="harvest-preview">
          <div className="preview-heading">
            <span>
              {PLANTS[selected.kind].name}
              <small>
                {" "}
                · {String.fromCharCode(65 + (inspected! % 6))}
                {Math.floor(inspected! / 6) + 1}
              </small>
            </span>
            <button
              className="icon-button"
              onClick={onCancel}
              aria-label="Cancel harvest preview"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="forecast-stats">
            <div>
              <strong>{preview.points}</strong>
              <span>points</span>
            </div>
            <div>
              <strong>{preview.chain}</strong>
              <span>plants</span>
            </div>
            <div>
              <strong>×{comboMultiplier(preview.maxDepth).toFixed(2)}</strong>
              <span>combo</span>
            </div>
          </div>
          <div className="forecast-resources">
            <span>Heat → {preview.heatAfter}</span>
            <span>Dew → {preview.dewAfter}</span>
          </div>
          {!!selected.traits?.length && (
            <p className="trait-description">
              {selected.traits
                .map((t) => mutationDefinition(t).name)
                .join(" · ")}
            </p>
          )}
          {preview.events.some((e) => e.type === "overload") && (
            <p className="forecast-risk">Overload · +2 ripe plantings</p>
          )}
          {preview.destroyed.length > 0 && (
            <p className="forecast-risk">
              {preview.destroyed.length} nearby plants lost
            </p>
          )}
          <button
            className="harvest-confirm primary-button"
            aria-label={`Harvest · ${preview.points} pts`}
            onClick={onHarvest}
          >
            <Icon name="scissors" size={17} />
            Release reaction <b>+{preview.points}</b>
          </button>
          <small className="preview-cost">1 turn · survivors grow</small>
          <details className="reaction-details">
            <summary>Reaction details</summary>
            <ol>
              {preview.events
                .filter((e) => e.type === "harvested")
                .map((e, i) => (
                  <li key={i}>
                    <span>{PLANTS[e.kind!].name}</span>
                    <b>+{e.points}</b>
                  </li>
                ))}
            </ol>
            <button className="text-button" onClick={onDetails}>
              Specimen details
            </button>
          </details>
        </div>
      ) : mode === "prune" ? (
        <div className="prune-prompt">
          <h3>Prune tissue</h3>
          <p>Remove without harvest effects. −8 heat · 1 turn.</p>
          {selected ? (
            <button
              className="primary-button"
              onClick={() => onUtility({ type: "prune", index: inspected! })}
            >
              Prune {PLANTS[selected.kind].name}
            </button>
          ) : (
            <p>Tap the plant to remove.</p>
          )}
          <button className="text-button" onClick={onCancel}>
            Cancel pruning
          </button>
        </div>
      ) : (
        <>
          <div className="hand-heading">
            <h2>Choose a seed</h2>
            <button
              className="detail-button"
              aria-label="About selected seed"
              onClick={onDetails}
            >
              Details <Icon name="book" size={14} />
            </button>
          </div>
          <div className="seed-choices" role="group" aria-label="Choose a seed">
            {run.offers.map((kind, i) => (
              <button
                key={`${i}-${kind}`}
                className={`seed-card ${i === offer ? "selected" : ""} ${guided && ["plant", "connect"].includes(tutorial.step) && i === 0 ? "tutorial-seed" : ""}`}
                style={{ "--specimen": PLANTS[kind].color } as CSSProperties}
                disabled={
                  seedLocked ||
                  (guided &&
                    ["plant", "connect"].includes(tutorial.step) &&
                    i !== 0)
                }
                aria-label={`Seed ${i + 1}: ${PLANTS[kind].name}`}
                aria-pressed={i === offer}
                onClick={() => onOffer(i)}
                aria-describedby={`${tooltipId}-${i}`}
              >
                <span className="seed-number">{i + 1}</span>
                <PlantArt kind={kind} />
                <span className="seed-name">
                  <strong>{PLANTS[kind].name}</strong>
                  <small>{PLANTS[kind].subtitle}</small>
                </span>
                {offer === i && (
                  <span className="seed-check">
                    <Icon name="check" size={12} />
                  </span>
                )}
                <span
                  className="seed-tooltip"
                  role="tooltip"
                  id={`${tooltipId}-${i}`}
                >
                  {PLANTS[kind].ability}
                </span>
              </button>
            ))}
          </div>
          <div className="planting-note">
            <Icon name="leaf" size={14} />
            {run.chargedSeeds
              ? `${run.chargedSeeds} ripe plantings ready`
              : run.dew
                ? "1 dew → extra starting growth"
                : "Tap an empty plot to plant"}
          </div>
        </>
      )}
      {!view.busy && (
        <details className="bench-tools">
          <summary>
            Garden tools <span>{run.dew} dew</span>
          </summary>
          <div className="run-tools">
            <button
              disabled={
                (guided && !["explore", "finish"].includes(tutorial.step)) ||
                !isLegalAction(run, { type: "stabilize" })
              }
              onClick={() => onUtility({ type: "stabilize" })}
            >
              Vent reactor <small>−15 heat · 3 dew · 1 turn</small>
            </button>
            {run.pruningLeft > 0 && (
              <button onClick={onPrune}>
                Prune <small>{run.pruningLeft} uses · 1 turn</small>
              </button>
            )}
            {run.recyclerLeft > 0 && (
              <div className="recycle-tools">
                <small>Recycle · 1 dew · no turn</small>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    disabled={
                      !isLegalAction(run, { type: "recycle", offer: i })
                    }
                    onClick={() => onUtility({ type: "recycle", offer: i })}
                  >
                    Seed {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
      {scanner && (
        <p className="scanner-readout">
          Next hand · <strong>{PLANTS[scanner].name}</strong>
        </p>
      )}
      {!!run.upgrades.length && (
        <details className="active-build">
          <summary>
            Experiments <span>{run.upgrades.length}/4</span>
          </summary>
          {run.upgrades.map((id) => (
            <div key={id}>
              <strong>{upgradeDefinition(id).name}</strong>
              <p>{upgradeDefinition(id).effect}</p>
            </div>
          ))}
        </details>
      )}
      <details className="seed-library">
        <summary>Seed library</summary>
        <p data-testid="seed-pool">
          {run.config.pool.map((k) => PLANTS[k].name).join(" / ")}
        </p>
      </details>
    </aside>
  );
}
