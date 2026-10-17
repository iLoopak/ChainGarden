import { UPGRADE_COPY } from "../experience/copy";
import { useState } from "react";
import {
  availableSpecimens,
  PROTOCOLS,
  RESEARCH,
  STARTER_POOL,
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
}: {
  heat: number;
  run?: GameState;
  reason?: string;
}) {
  return (
    <div className={`reactor tier-${Math.min(3, Math.floor(heat / 25))}`}>
      <div className="reactor-heading">
        <span>{reactorTier(heat)}</span>
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
    </div>
  );
}
export function ExperimentGlyph({ family }: { family: string }) {
  return (
    <svg
      className="experiment-glyph"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {family === "Growth" ? (
        <>
          <path d="M20 34V13M20 23Q6 24 7 12Q20 10 20 23M20 17Q32 20 34 6Q21 4 20 17" />
        </>
      ) : family === "Chain" ? (
        <>
          <circle cx="8" cy="28" r="5" />
          <circle cx="20" cy="10" r="5" />
          <circle cx="33" cy="27" r="5" />
          <path d="M11 24L17 14M23 14L30 23M13 28H28" />
        </>
      ) : family === "Mutation" ? (
        <>
          <path d="M12 5C38 15 2 25 28 35M28 5C2 15 38 25 12 35M13 8H27M14 18H26M14 23H26M13 32H27" />
        </>
      ) : family === "Reactor" ? (
        <>
          <path d="M16 25V9A4 4 0 0124 9V25A8 8 0 1116 25Z" />
          <path d="M20 14V29M29 10H34M29 17H32" />
        </>
      ) : (
        <>
          <path d="M25 7L23 17L33 15A11 11 0 0119 26L9 36L4 31L14 21A11 11 0 0125 7Z" />
        </>
      )}
    </svg>
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
      <p className="modal-intro">Choose one. Keep it for this garden.</p>
      <div className="upgrade-choices">
        {run.pendingUpgrade.map((id) => {
          const u = upgradeDefinition(id);
          return (
            <article
              className={`upgrade-card family-${u.category.toLowerCase()}`}
              key={id}
            >
              <ExperimentGlyph family={u.category} />
              <span className="eyebrow">{u.category}</span>
              <h3>{u.name}</h3>
              <p>{UPGRADE_COPY[id]}</p>
              <details>
                <summary>Rules & synergies</summary>
                <p>{u.effect}</p>
                <p>{u.synergy}</p>
                {u.conflicts && (
                  <p>
                    Incompatible:{" "}
                    {u.conflicts
                      .map((id) => upgradeDefinition(id).name)
                      .join(", ")}
                    .
                  </p>
                )}
                <small>Single copy · no turn spent</small>
              </details>
              <button
                className="primary-button"
                onClick={() => onChoose(id)}
                aria-label={`Install ${u.name}`}
              >
                Install <Icon name="arrow" size={16} />
              </button>
            </article>
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
      <p className="modal-intro">Choose how this garden grows.</p>
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
          Add up to two researched specimens. Every seed in your pool is equally
          likely.
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
const RESEARCH_COPY: Record<ResearchId, string> = {
  mycology: "Mushroom + fungal traits",
  xerophytes: "Cactus + volatile thorns",
  lunar: "Moonflower seeds",
  briar: "Briar seeds",
  engineering: "Trait transfer + tissue mutations",
  roots: "Root Network drafts",
  echo: "Echo Harvest + Neural Mycelium",
  reactor: "Volatile protocol + reactor upgrades",
  symbiosis: "Symbiotic Growth protocol",
  containment: "Containment Trial · bonus +6 Biomass",
};
const RESEARCH_PLANT: Partial<Record<ResearchId, PlantKind>> = {
  mycology: "mushroom",
  xerophytes: "cactus",
  lunar: "moonflower",
  briar: "briar",
};
export function ResearchLab({
  data,
  onPurchase,
}: {
  data: SaveData;
  onPurchase: (id: ResearchId) => void;
}) {
  const owned = ownedResearch(data),
    [category, setCategory] = useState("Specimens");
  return (
    <>
      <div className="lab-balance">
        <Icon name="leaf" size={30} />
        <strong data-testid="biomass">{data.profile.biomass}</strong>
        <span>
          Biomass
          <br />
          <small>{owned.length}/10 researched</small>
        </span>
      </div>
      <nav className="chapter-tabs" aria-label="Research branches">
        {["Specimens", "Genetics", "Reactions", "Protocols"].map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
            <small>
              {
                RESEARCH.filter((n) => n.category === c && owned.includes(n.id))
                  .length
              }
              /{RESEARCH.filter((n) => n.category === c).length}
            </small>
          </button>
        ))}
      </nav>
      <div className="research-branches">
        <section aria-label={category}>
          {RESEARCH.filter((r) => r.category === category).map((r) => {
            const purchased = owned.includes(r.id),
              ready = canPurchase(data, r.id),
              missing = r.requires.filter((id) => !owned.includes(id));
            return (
              <article
                className={`research-node ${purchased ? "owned" : ready ? "available" : "locked"}`}
                key={r.id}
              >
                <div className="research-symbol">
                  {RESEARCH_PLANT[r.id] ? (
                    <PlantArt kind={RESEARCH_PLANT[r.id]!} />
                  ) : (
                    <ExperimentGlyph
                      family={
                        category === "Genetics"
                          ? "Mutation"
                          : category === "Protocols"
                            ? "Utility"
                            : "Chain"
                      }
                    />
                  )}
                </div>
                <div className="research-content">
                  <h3>{r.name}</h3>
                  <p>{RESEARCH_COPY[r.id]}</p>
                  {!!missing.length && (
                    <small>
                      Needs{" "}
                      {missing
                        .map((id) => RESEARCH.find((n) => n.id === id)!.name)
                        .join(" + ")}
                    </small>
                  )}
                  <details>
                    <summary>Details</summary>
                    <p>{r.effect}</p>
                    <small>Applies to your next garden.</small>
                  </details>
                </div>
                <button
                  className="research-purchase"
                  disabled={!ready}
                  onClick={() => onPurchase(r.id)}
                  aria-label={`Research ${r.name} for ${r.cost} Biomass`}
                >
                  {purchased ? (
                    <>
                      <Icon name="check" size={16} />
                      <span>Owned</span>
                    </>
                  ) : (
                    <>
                      <strong>{r.cost}</strong>
                      <span>Research</span>
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </section>
      </div>
      <p className="fine-print">Unlock choices, not permanent score boosts.</p>
    </>
  );
}
