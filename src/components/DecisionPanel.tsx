import type { CSSProperties } from "react";
import type { ViewState } from "../controller";
import { comboMultiplier, isLegalAction, nextSeed } from "../engine/game";
import { mutationDefinition, upgradeDefinition } from "../engine/content";
import { PLANTS } from "../engine/plants";
import type { Action, GameState, ReactionPreview } from "../engine/types";
import { coordinate } from "../presentation/playback";
import { Icon } from "./Icons";
import { PlantArt } from "./PlantArt";
interface Props {
  run: GameState;
  view: ViewState;
  offer: number;
  mode: "plant" | "harvest" | "prune";
  inspected: number | null;
  preview: ReactionPreview | null;
  onMode: (mode: "plant" | "harvest" | "prune") => void;
  onOffer: (offer: number) => void;
  onCancel: () => void;
  onHarvest: () => void;
  onUtility: (action: Action) => void;
  onSkip: () => void;
}
export function DecisionPanel({
  run,
  view,
  offer,
  mode,
  inspected,
  preview,
  onMode,
  onOffer,
  onCancel,
  onHarvest,
  onUtility,
  onSkip,
}: Props) {
  const selected = inspected === null ? null : run.board[inspected];
  const kind = selected?.kind ?? run.offers[offer];
  return (
    <aside
      className={`decision-panel ${preview ? "has-preview" : ""}`}
      aria-label="Turn decisions"
    >
      <div className="panel-heading">
        <span className="eyebrow">YOUR NEXT MOVE</span>
        <span className={`decision-status ${view.busy ? "is-resolving" : ""}`}>
          <i />
          {view.busy ? "Resolving" : "Your turn"}
        </span>
      </div>
      <div className="mode-switch" aria-label="Action mode">
        <button
          aria-label="Plant"
          aria-pressed={mode === "plant"}
          disabled={view.busy}
          onClick={() => onMode("plant")}
        >
          <Icon name="leaf" size={17} />
          Plant<span>01</span>
        </button>
        <button
          aria-label="Harvest"
          aria-pressed={mode === "harvest"}
          disabled={view.busy}
          onClick={() => onMode("harvest")}
        >
          <Icon name="scissors" size={17} />
          Harvest<span>02</span>
        </button>
      </div>
      {view.busy ? (
        <div className="resolution-card" role="status">
          <span className="eyebrow">REACTION LIVE</span>
          <div className="live-chain">
            <strong>{String(view.chainCount).padStart(2, "0")}</strong>
            <span>
              specimens
              <br />
              released
            </span>
            <b>×{comboMultiplier(view.comboDepth).toFixed(2)}</b>
          </div>
          <button className="text-button" onClick={onSkip}>
            Skip playback
          </button>
          <p>{view.active?.text ?? "Settling the growth matrix…"}</p>
          <small>
            {view.active?.source !== undefined
              ? `${coordinate(view.active.source)} → ${coordinate(view.active.index)} · depth ${view.active.depth}`
              : "Growth and effects resolve before your next action."}
          </small>
        </div>
      ) : (
        <>
          <div className="seed-intro">
            <h2>
              {mode === "plant" ? "Choose a specimen." : "Plan the release."}
            </h2>
            <p>
              {mode === "plant"
                ? "Pick a seed. Tap an empty slot."
                : "Select a plant. Inspect the chain. Confirm."}
            </p>
          </div>
          {mode === "plant" && !preview && (
            <div
              className="seed-choices"
              role="group"
              aria-label="Choose a seed"
            >
              {run.offers.map((seed, i) => (
                <button
                  className={`seed-card ${offer === i ? "selected" : ""}`}
                  key={`${i}-${seed}`}
                  aria-label={`Seed ${i + 1}: ${PLANTS[seed].name}`}
                  aria-pressed={offer === i}
                  onClick={() => onOffer(i)}
                  style={{ "--specimen": PLANTS[seed].color } as CSSProperties}
                >
                  <span className="seed-number">{i + 1}</span>
                  <PlantArt kind={seed} />
                  <span className="seed-name">
                    <strong>{PLANTS[seed].name}</strong>
                    <small>{PLANTS[seed].subtitle}</small>
                  </span>
                  <span className="seed-check">
                    {offer === i && <Icon name="check" size={13} />}
                  </span>
                </button>
              ))}
            </div>
          )}
          {mode === "prune" && (
            <div className="prune-prompt">
              <h3>Emergency pruning</h3>
              <p>
                {run.pruningLeft} uses left. Remove a plant without score or
                effects. Cool 8 heat. Costs one turn; survivors still grow.
              </p>
              {selected ? (
                <button
                  className="harvest-confirm"
                  onClick={() =>
                    onUtility({ type: "prune", index: inspected! })
                  }
                >
                  Prune {PLANTS[selected.kind].name}
                </button>
              ) : (
                <small>Select a plant to remove.</small>
              )}
            </div>
          )}
          {preview && selected ? (
            <div className="harvest-preview" data-testid="harvest-preview">
              <div className="preview-heading">
                <span className="eyebrow">
                  REACTION FORECAST · {coordinate(inspected!)} ·{" "}
                  {PLANTS[selected.kind].name}
                </span>
                <button
                  className="preview-close"
                  onClick={onCancel}
                  aria-label="Cancel harvest preview"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <div className="preview-title">
                <PlantArt kind={selected.kind} growth={selected.growth} />
                <div>
                  <h3>{PLANTS[selected.kind].name}</h3>
                  <span>
                    {selected.growth === 3
                      ? "Ripe / charged"
                      : `Growth ${selected.growth} of 3`}
                  </span>
                </div>
              </div>
              <div className="forecast-stats">
                <div>
                  <strong>{preview.points}</strong>
                  <span>total points</span>
                </div>
                <div>
                  <strong>{preview.chain}</strong>
                  <span>released</span>
                </div>
                <div>
                  <strong>
                    ×{comboMultiplier(preview.maxDepth).toFixed(2)}
                  </strong>
                  <span>peak combo</span>
                </div>
              </div>
              {!!selected.traits?.length && (
                <p className="trait-description">
                  {selected.traits
                    .map((t) => mutationDefinition(t).name)
                    .join(" + ")}
                </p>
              )}
              <ol className="forecast-sequence">
                {preview.events
                  .filter((e) => e.type === "harvested")
                  .slice(0, 4)
                  .map((e, i) => (
                    <li key={e.index}>
                      <b>{i + 1}</b>
                      <span>
                        {coordinate(e.index)} · {PLANTS[e.kind!].name}
                      </span>
                      <strong>+{e.points}</strong>
                    </li>
                  ))}
              </ol>
              {preview.chain > 4 && (
                <small className="more-links">
                  +{preview.chain - 4} further releases
                </small>
              )}
              {(preview.events.some((e) => e.type === "overload") ||
                preview.destroyed.length > 0) && (
                <p className="forecast-risk">
                  {preview.events.some((e) => e.type === "overload")
                    ? "Overload · +2 charged plantings"
                    : "Collateral reaction"}
                  {preview.destroyed.length > 0
                    ? ` · ${preview.destroyed.length} specimens lost`
                    : ""}
                </p>
              )}
              <button
                className="harvest-confirm"
                aria-label={`Harvest · ${preview.points} pts`}
                onClick={onHarvest}
              >
                <Icon name="scissors" size={18} />
                <span>Release reaction</span>
                <strong>+{preview.points}</strong>
              </button>
              <p className="preview-cost">
                1 turn · dew after: {preview.dewAfter} · heat after:{" "}
                {preview.heatAfter}
              </p>
            </div>
          ) : mode === "harvest" ? (
            <div className="harvest-prompt">
              <span className="organism-ring">
                <Icon name="scissors" size={28} />
              </span>
              <h3>Build. Then break the chain.</h3>
              <p>
                Roses activate neighboring plants. A ripe organism can become
                the next link.
              </p>
              <span>Nothing is harvested until you confirm.</span>
            </div>
          ) : null}
          {!preview && mode === "plant" && (
            <div className="plant-detail">
              <span className="eyebrow">{PLANTS[kind].subtitle}</span>
              <h3>{PLANTS[kind].name}</h3>
              <p>{PLANTS[kind].ability}</p>
              <div className="dew-cost">
                <Icon name="dew" size={13} />
                {run.dew
                  ? "1 dew → +1 starting growth"
                  : "Free planting · no dew required"}
              </div>
            </div>
          )}
          <div className="run-tools">
            <button
              disabled={!isLegalAction(run, { type: "stabilize" })}
              onClick={() => onUtility({ type: "stabilize" })}
            >
              Vent reactor <small>3 dew · 1 turn · −15 heat</small>
            </button>
            {run.pruningLeft > 0 && (
              <button
                aria-pressed={mode === "prune"}
                onClick={() => onMode("prune")}
              >
                Prune tissue{" "}
                <small>{run.pruningLeft} uses · 1 turn · −8 heat</small>
              </button>
            )}
            {run.recyclerLeft > 0 && (
              <div className="recycle-tools">
                <small>Recycle one seed · 1 dew · no turn</small>
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
          {nextSeed(run) && (
            <p className="scanner-readout">
              Scanner · next hand starts with{" "}
              <strong>{PLANTS[nextSeed(run)!].name}</strong>
            </p>
          )}
          {!!run.upgrades.length && (
            <details className="active-build">
              <summary>Active experiments · {run.upgrades.length} / 4</summary>
              {run.upgrades.map((id) => (
                <p key={id}>
                  <strong>{upgradeDefinition(id).name}</strong>
                  {upgradeDefinition(id).effect}
                </p>
              ))}
            </details>
          )}
          <p className="pool-readout" data-testid="seed-pool">
            Pool · {run.config.pool.map((k) => PLANTS[k].name).join(" / ")}
          </p>
          <div className="draft-cadence">
            {run.turn < 20
              ? `Next experiment after turn ${[5, 10, 15, 20].find((t) => t > run.turn)}`
              : "Build complete · plan your final harvests"}
          </div>
          <div className="action-cost">
            <Icon name="check" size={13} />
            <span>1 action = 1 turn. All three seeds refresh.</span>
          </div>
        </>
      )}
    </aside>
  );
}
