import { UPGRADE_COPY } from "../experience/copy";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PLANTS } from "../engine/plants";
import { PLANT_KINDS } from "../engine/types";
import type { PlantKind } from "../engine/types";
import {
  MUTATIONS,
  STARTER_POOL,
  availableSpecimens,
  UPGRADES,
} from "../engine/content";
import { ownedResearch } from "../persistence/storage";
import type { SaveData } from "../persistence/storage";
import { PlantArt } from "./PlantArt";
import { ExperimentGlyph } from "./Progression";
import { Icon } from "./Icons";
export function Modal({
  title,
  children,
  onClose,
  className = "",
  dismissible = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
    >
      {dismissible && (
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      )}
      <h2 id={id}>{title}</h2>
      {children}
    </dialog>
  );
}
const CARRIERS: PlantKind[] = [
  "rose",
  "sunflower",
  "cactus",
  "clover",
  "wildflower",
  "mushroom",
  "moonflower",
  "cactus",
  "briar",
  "moonflower",
];
export function FieldGuide({
  data,
  initialChapter = "Plants",
}: {
  data: SaveData;
  initialChapter?: string;
}) {
  const [tab, setTab] = useState(initialChapter),
    [plant, setPlant] = useState<PlantKind>("sunflower"),
    [mutation, setMutation] = useState(0),
    [power, setPower] = useState(0);
  const owned = ownedResearch(data),
    plants = [...STARTER_POOL, ...availableSpecimens(owned)],
    m = MUTATIONS[mutation],
    known = data.profile.discoveries.includes(m.id);
  return (
    <div className="collection">
      <nav className="chapter-tabs" aria-label="Field guide chapters">
        {[
          "Plants",
          "Mutations",
          "Experiments",
          "Synergies",
          "Reactor",
          "Records",
        ].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      {tab === "Plants" && (
        <>
          <p className="collection-progress">
            {plants.length}/8 specimens available
          </p>
          <div className="specimen-cabinet guide-grid">
            {PLANT_KINDS.map((k) => (
              <button
                key={k}
                aria-label={`Inspect ${PLANTS[k].name}`}
                className={!plants.includes(k) ? "unknown" : ""}
                aria-pressed={plant === k}
                onClick={() => setPlant(k)}
              >
                <PlantArt kind={k} />
                <strong>{PLANTS[k].name}</strong>
                {!plants.includes(k) && <small>Research locked</small>}
              </button>
            ))}
          </div>
          <article className="cabinet-detail">
            <PlantArt kind={plant} />
            <div>
              <span className="eyebrow">
                {PLANTS[plant].subtitle} · base {PLANTS[plant].base}
              </span>
              <h3>{PLANTS[plant].name}</h3>
              <p>{PLANTS[plant].ability}</p>
              {!plants.includes(plant) && (
                <small>Research this specimen in the Lab.</small>
              )}
            </div>
          </article>
        </>
      )}
      {tab === "Mutations" && (
        <>
          <p className="collection-progress">
            {data.profile.discoveries.length}/10 discovered · first discovery +3
            Biomass
          </p>
          <div className="specimen-cabinet mutation-catalogue">
            {MUTATIONS.map((m, i) => {
              const k = data.profile.discoveries.includes(m.id);
              return (
                <button
                  key={m.id}
                  className={k ? "known" : "unknown"}
                  aria-label={
                    k ? `Inspect ${m.name}` : `Unknown tissue ${i + 1}`
                  }
                  aria-pressed={mutation === i}
                  onClick={() => setMutation(i)}
                >
                  {k ? (
                    <PlantArt kind={CARRIERS[i]} />
                  ) : (
                    <svg viewBox="0 0 80 80" aria-hidden="true">
                      <path
                        d="M40 68V34M40 50Q13 47 18 22Q41 21 40 50M40 39Q65 42 62 16Q41 15 40 39"
                        fill="currentColor"
                        opacity=".5"
                      />
                      <text
                        x="40"
                        y="62"
                        textAnchor="middle"
                        fill="#b5c4ac"
                        fontSize="28"
                      >
                        ?
                      </text>
                    </svg>
                  )}
                  <strong>{k ? m.name : "Unknown"}</strong>
                </button>
              );
            })}
          </div>
          <article className={`cabinet-detail ${known ? "" : "unknown"}`}>
            {known && <PlantArt kind={CARRIERS[mutation]} />}
            <div>
              <span className="eyebrow">
                {known ? "Discovered tissue" : "Unidentified tissue"}
              </span>
              <h3>{known ? m.name : "A living mystery"}</h3>
              <p>{known ? m.effect : m.clue}</p>
              {known ? (
                <details>
                  <summary>Discovery conditions</summary>
                  <p>{m.prerequisite}</p>
                </details>
              ) : (
                m.requires &&
                !owned.includes(m.requires) && (
                  <small>Further research required.</small>
                )
              )}
            </div>
          </article>
        </>
      )}
      {tab === "Experiments" && (
        <>
          <div className="powerup-catalogue">
            {UPGRADES.map((u, i) => (
              <button
                key={u.id}
                className={
                  u.research && !owned.includes(u.research) ? "locked" : ""
                }
                aria-pressed={power === i}
                onClick={() => setPower(i)}
              >
                <ExperimentGlyph family={u.category} />
                <span>{u.name}</span>
              </button>
            ))}
          </div>
          <article className="cabinet-detail">
            <ExperimentGlyph family={UPGRADES[power].category} />
            <div>
              <span className="eyebrow">
                {UPGRADES[power].category} ·{" "}
                {UPGRADES[power].research &&
                !owned.includes(UPGRADES[power].research!)
                  ? "Research locked"
                  : "In draft pool"}
              </span>
              <h3>{UPGRADES[power].name}</h3>
              <p>{UPGRADE_COPY[UPGRADES[power].id]}</p>
              <details>
                <summary>Full rules</summary>
                <p>{UPGRADES[power].effect}</p>
              </details>
            </div>
          </article>
        </>
      )}
      {tab === "Synergies" && (
        <div className="discovered-synergies">
          {data.profile.synergies.length ? (
            data.profile.synergies.map((s) => (
              <p key={s}>
                <Icon name="check" size={17} />
                {s === "clover-aura"
                  ? "Ripe Clover boosts neighboring harvests."
                  : s === "catalyst-chain"
                    ? "A ripe neighbor becomes the next harvest."
                    : s === "root-relay"
                      ? "Connected tissue carries directed growth."
                      : s === "reactor-overload"
                        ? "Overload charges your next plantings."
                        : s.startsWith("mushroom-")
                          ? `Mushroom echoes ${PLANTS[s.slice(9) as PlantKind]?.name ?? "a neighbor"}.`
                          : s}
              </p>
            ))
          ) : (
            <p>Keep a Clover beside a harvest. See what it changes.</p>
          )}
        </div>
      )}
      {tab === "Reactor" && (
        <div className="guide-rules">
          <h3>Warm roots. Bigger chains.</h3>
          <p>
            Harvest adds 2 + 3 × depth heat. Clover cools 6; Moonflower cools
            12. Vent: −15 heat for 3 dew and one turn.
          </p>
          <dl className="tier-rules">
            <dt>0–24 · Stable</dt>
            <dd>No heat bonus</dd>
            <dt>25–49 · Reactive</dt>
            <dd>+3 points per depth</dd>
            <dt>50–74 · Volatile</dt>
            <dd>+6 points per depth</dd>
            <dt>75–99 · Critical</dt>
            <dd>+9 points per depth</dd>
          </dl>
          <details>
            <summary>Overload at 100</summary>
            <p>
              After the chain, remove up to three surviving plants at the root,
              then N/E/S/W. No harvest effects. Gain 20 + 5 per plant points, up
              to 3 dew and two ripe plantings; heat resets to 35. Later cooling
              cannot cancel a triggered overload.
            </p>
          </details>
          <details>
            <summary>Scoring & turn rules</summary>
            <p>
              Base × (1 + .5 × growth) × min(3, 1 + .25 × depth) × (1 + .25 ×
              ripe Clovers + .20 × empty Cactus neighbors), rounded down, then
              trait/heat/upgrade bonuses. Each action grows survivors by 1 and
              refreshes all three seeds. The root harvest happens before
              seasonal growth. No final automatic harvest.
            </p>
          </details>
        </div>
      )}
      {tab === "Records" && (
        <div className="result-stats">
          <div>
            <strong>{data.profile.rewardedRuns.length}</strong>
            <span>gardens completed</span>
          </div>
          <div>
            <strong>{data.best}</strong>
            <span>personal best</span>
          </div>
          <div>
            <strong>{data.profile.earned}</strong>
            <span>Biomass earned</span>
          </div>
        </div>
      )}
    </div>
  );
}
