import { useState } from "react";
import type { CSSProperties } from "react";
import {
  availableSpecimens,
  MUTATIONS,
  PROTOCOLS,
  RESEARCH,
  STARTER_POOL,
  UPGRADES,
  upgradeDefinition,
} from "../engine/content";
import { reactorTier } from "../engine/balance";
import { PLANTS } from "../engine/plants";
import type {
  GameState,
  PlantKind,
  ProtocolId,
  ResearchId,
  RunOptions,
  UpgradeId,
} from "../engine/types";
import { canPurchase, ownedResearch } from "../persistence/storage";
import type { SaveData } from "../persistence/storage";
import { PlantArt } from "./PlantArt";
import { Icon } from "./Icons";
export function Reactor({
  heat,
  run,
  reason,
}: {
  heat: number;
  run: GameState;
  reason?: string;
}) {
  const next =
    heat < 25
      ? "At 25: +3 points per chain depth."
      : heat < 50
        ? "At 50: +6 points per depth; heat mutations awaken."
        : heat < 75
          ? "At 75: +9 points per depth."
          : "At 100: lose up to 3 nearby plants; gain points, dew and 2 charged plantings.";
  return (
    <div className={`reactor tier-${Math.min(3, Math.floor(heat / 25))}`}>
      <div className="reactor-heading">
        <span>
          <i /> BIOREACTOR <b>{reactorTier(heat)}</b>
        </span>
        <strong data-testid="heat">
          {heat}
          <small> / 100</small>
        </strong>
      </div>
      <div
        className="reactor-track"
        role="progressbar"
        aria-label="Reactor instability"
        aria-valuenow={heat}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${heat}%` }} />
        {[25, 50, 75].map((n) => (
          <b key={n} style={{ left: `${n}%` }} />
        ))}
      </div>
      <p>{next}</p>
      {reason && (
        <p className="reactor-reason" aria-live="polite">
          {reason}
        </p>
      )}
      {run.chargedSeeds > 0 && (
        <span className="charged-seeds">
          {run.chargedSeeds} charged plantings · next seeds start ripe
        </span>
      )}
    </div>
  );
}
export function UpgradeChoices({
  run,
  onChoose,
}: {
  run: GameState;
  onChoose: (id: UpgradeId) => void;
}) {
  return (
    <>
      <p className="modal-intro">
        Turn {run.turn} complete. Choose one experiment for this run. No turn is
        spent. Upgrades never stack with themselves.
      </p>
      <div className="upgrade-choices">
        {run.pendingUpgrade.map((id) => {
          const u = upgradeDefinition(id);
          return (
            <button
              key={id}
              className={`upgrade-card family-${u.category.toLowerCase()}`}
              onClick={() => onChoose(id)}
              aria-label={`Install ${u.name}`}
            >
              <span className="upgrade-glyph">
                <Icon
                  name={
                    u.category === "Chain"
                      ? "sun"
                      : u.category === "Utility"
                        ? "dew"
                        : "leaf"
                  }
                  size={25}
                />
              </span>
              <span className="eyebrow">{u.category} · single copy</span>
              <h3>{u.name}</h3>
              <p>{u.effect}</p>
              <small>{u.synergy}</small>
              {u.conflicts && (
                <em>
                  Incompatible with{" "}
                  {u.conflicts.map((i) => upgradeDefinition(i).name).join(", ")}
                </em>
              )}
              <b>
                Install experiment <Icon name="arrow" size={15} />
              </b>
            </button>
          );
        })}
      </div>
    </>
  );
}
export function RunSetup({
  data,
  onStart,
}: {
  data: SaveData;
  onStart: (options: RunOptions) => void;
}) {
  const research = ownedResearch(data),
    available = availableSpecimens(research);
  const [protocol, setProtocol] = useState<ProtocolId>("standard"),
    [specimens, setSpecimens] = useState<PlantKind[]>([]),
    [challenge, setChallenge] = useState(false);
  return (
    <div className="run-setup">
      <p className="modal-intro">
        Choose the conditions. The chamber waits for your first action.
      </p>
      <div className="protocol-choices">
        {PROTOCOLS.map((p) => {
          const locked = !!p.research && !research.includes(p.research);
          return (
            <button
              key={p.id}
              disabled={locked}
              aria-pressed={protocol === p.id}
              onClick={() => setProtocol(p.id)}
            >
              <span className="eyebrow">
                {locked ? "RESEARCH REQUIRED" : "CULTIVATION PROTOCOL"}
              </span>
              <strong>{p.name}</strong>
              <small>{p.description}</small>
            </button>
          );
        })}
      </div>
      <div className="setup-specimens">
        <h3>
          Seed library <small>{specimens.length} / 2 optional</small>
        </h3>
        <p>
          Four core species are always included. Add up to two researched
          specimens; each draw is uniform across your chosen pool.
        </p>
        <div className="specimen-options">
          {STARTER_POOL.map((k) => (
            <span key={k}>
              <PlantArt kind={k} />
              <small>{PLANTS[k].name}</small>
            </span>
          ))}
          {available.map((k) => (
            <button
              key={k}
              aria-label={`Include ${PLANTS[k].name}`}
              aria-pressed={specimens.includes(k)}
              disabled={!specimens.includes(k) && specimens.length === 2}
              onClick={() =>
                setSpecimens(
                  specimens.includes(k)
                    ? specimens.filter((s) => s !== k)
                    : [...specimens, k],
                )
              }
            >
              <PlantArt kind={k} />
              <small>{PLANTS[k].name}</small>
              {specimens.includes(k) && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
        {!available.length && (
          <small className="fine-print">
            Research Mycology or Xerophytes to expand this library.
          </small>
        )}
      </div>
      {research.includes("containment") && (
        <label className="challenge-choice">
          <input
            type="checkbox"
            checked={challenge}
            onChange={(e) => setChallenge(e.target.checked)}
          />
          <span>
            <strong>Containment Trial</strong>
            <small>
              Four sealed corners, 45 starting heat. Reach 900 points and cause
              an overload for +6 Biomass.
            </small>
          </span>
        </label>
      )}
      <button
        className="primary-button full"
        onClick={() => onStart({ protocol, specimens, challenge })}
      >
        Begin cultivation <Icon name="arrow" />
      </button>
    </div>
  );
}
export function ResearchLab({
  data,
  onPurchase,
}: {
  data: SaveData;
  onPurchase: (id: ResearchId) => void;
}) {
  const owned = ownedResearch(data);
  return (
    <>
      <div className="lab-balance">
        <Icon name="leaf" size={32} />
        <div>
          <strong data-testid="biomass">{data.profile.biomass}</strong>
          <span>BIOMASS AVAILABLE</span>
        </div>
        <small>
          {owned.length} / {RESEARCH.length} experiments researched
        </small>
      </div>
      <p className="modal-intro">
        Unlock different tools, then choose them for your next cultivation.
        Research does not alter a run already in progress.
      </p>
      <div className="research-branches">
        {["Specimens", "Genetics", "Reactions", "Protocols"].map((category) => (
          <section key={category}>
            <h3>
              <span /> {category}
            </h3>
            {RESEARCH.filter((r) => r.category === category).map((r) => {
              const purchased = owned.includes(r.id),
                ready = canPurchase(data, r.id);
              return (
                <article
                  className={`research-node ${purchased ? "owned" : ready ? "available" : "locked"}`}
                  key={r.id}
                >
                  <span className="eyebrow">
                    {purchased
                      ? "CULTURE SECURED"
                      : r.requires.length
                        ? `Requires ${r.requires.map((id) => RESEARCH.find((n) => n.id === id)!.name).join(" + ")}`
                        : "OPEN RESEARCH"}
                  </span>
                  <h4>{r.name}</h4>
                  <p>{r.effect}</p>
                  <button
                    className="research-purchase"
                    disabled={!ready}
                    onClick={() => onPurchase(r.id)}
                    aria-label={`Research ${r.name} for ${r.cost} Biomass`}
                  >
                    {purchased ? (
                      <>
                        <Icon name="check" size={14} /> Researched
                      </>
                    ) : (
                      <>
                        Research <strong>{r.cost} Biomass</strong>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    </>
  );
}
export function Collection({ data }: { data: SaveData }) {
  const [tab, setTab] = useState<
    "mutations" | "synergies" | "powerups" | "reactor" | "records"
  >("mutations");
  const research = ownedResearch(data);
  return (
    <section className="collection">
      <nav aria-label="Field guide chapters">
        {(
          ["mutations", "synergies", "powerups", "reactor", "records"] as const
        ).map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {tab === "mutations" && (
        <>
          <p className="collection-progress">
            {data.profile.discoveries.length} / {MUTATIONS.length} mutations
            discovered · +3 Biomass on each first discovery
          </p>
          <div className="mutation-catalogue">
            {MUTATIONS.map((m) => {
              const known = data.profile.discoveries.includes(m.id);
              return (
                <article
                  key={m.id}
                  className={known ? "known" : "unknown"}
                  style={{ "--trait": m.color } as CSSProperties}
                >
                  <span className="trait-sigil">
                    {known ? <Icon name="leaf" /> : "?"}
                  </span>
                  <div>
                    <h3>{known ? m.name : "Unidentified tissue"}</h3>
                    <p>{known ? m.effect : m.clue}</p>
                    {known && <small>{m.prerequisite}</small>}
                    {!known && m.requires && !research.includes(m.requires) && (
                      <small>Further research required</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "synergies" && (
        <>
          <p className="modal-intro">
            Interactions recorded in your experiments.
          </p>
          {data.profile.synergies.length ? (
            <ul className="discovered-synergies">
              {data.profile.synergies.map((s) => (
                <li key={s}>
                  <Icon name="check" size={16} />
                  {s === "clover-aura"
                    ? "Living clover amplifies a neighboring harvest."
                    : s === "catalyst-chain"
                      ? "A catalyst activates a ripe plant into another harvest."
                      : s === "root-relay"
                        ? "Connected tissue relays directed growth."
                        : s === "reactor-overload"
                          ? "An overload clears a footprint and charges your next seeds."
                          : s.startsWith("mushroom-")
                            ? `Mushroom can echo ${PLANTS[s.slice(9) as PlantKind]?.name ?? "a neighbor"}.`
                            : s}
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No synergies recorded yet. Harvest beside a ripe Clover or build a
              Rose chain.
            </p>
          )}
        </>
      )}
      {tab === "powerups" && (
        <div className="powerup-catalogue">
          {UPGRADES.map((u) => {
            const unlocked = !u.research || research.includes(u.research);
            return (
              <article key={u.id} className={unlocked ? "" : "locked"}>
                <span className="eyebrow">
                  {u.category} ·{" "}
                  {unlocked ? "IN DRAFT POOL" : "RESEARCH LOCKED"}
                </span>
                <h3>{u.name}</h3>
                <p>{u.effect}</p>
                {u.conflicts && (
                  <small>
                    Conflicts:{" "}
                    {u.conflicts
                      .map((id) => upgradeDefinition(id).name)
                      .join(", ")}
                  </small>
                )}
              </article>
            );
          })}
        </div>
      )}
      {tab === "reactor" && (
        <div className="guide-rules">
          <h3>Heat is an opportunity.</h3>
          <p>
            Harvest adds 2 + 3 × depth heat. Clover harvest cools 6; Moonflower
            cools 12. Venting costs 3 dew and one turn to cool 15.
          </p>
          <p>
            Stable 0–24: no bonus. Reactive 25–49: +3 points per depth. Volatile
            50–74: +6 per depth. Critical 75–99: +9 per depth. Each harvest uses
            the heat before its own heat increase.
          </p>
          <p>
            Reaching 100 latches one overload at the end of this action, even if
            later effects cool the reactor. It removes up to three surviving
            plants in the root plot, then N/E/S/W. No harvest effects. Gain 20 +
            5 per lost plant points, up to 3 dew and two charged plantings. Heat
            resets to 35. A charged planting starts ripe; it still uses one dew
            if available.
          </p>
          <p>
            Upgrade drafts follow turns 5, 10, 15 and 20. Choose one before
            acting again. Every upgrade has a single-copy cap. Adaptive Tissue
            and Cross-Pollination conflict.
          </p>
        </div>
      )}
      {tab === "records" && (
        <div className="result-stats">
          <div>
            <strong>{data.profile.rewardedRuns.length}</strong>
            <span>completed runs</span>
          </div>
          <div>
            <strong>{data.best}</strong>
            <span>personal best</span>
          </div>
          <div>
            <strong>{data.profile.earned}</strong>
            <span>lifetime Biomass</span>
          </div>
        </div>
      )}
    </section>
  );
}
