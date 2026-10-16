import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { GameController } from "./controller";
import { harvestValue, neighbors } from "./engine/game";
import { PLANTS } from "./engine/plants";
import { PLANT_KINDS } from "./engine/types";
import type { Plant, PlantKind } from "./engine/types";
import { PlantArt } from "./components/PlantArt";
import { Icon } from "./components/Icons";
import { IndexedDBStorage } from "./persistence/storage";
const controller = new GameController(new IndexedDBStorage());
void controller.initialize();
const number = (n: number) => n.toLocaleString("en-US");
function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <button
        className="icon-button modal-close"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <Icon name="close" />
      </button>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Icon name="leaf" size={24} />
      </span>
      chain garden<span className="brand-dot">®</span>
    </span>
  );
}
function HeroGarden() {
  const arrangement: (PlantKind | null)[] = [
    null,
    "wildflower",
    null,
    null,
    "sunflower",
    null,
    "clover",
    null,
    "sunflower",
    "rose",
    null,
    null,
    null,
    "mushroom",
    "rose",
    "clover",
    "wildflower",
    null,
    "cactus",
    null,
    "clover",
    null,
    "mushroom",
    "wildflower",
    null,
    "rose",
    null,
    "sunflower",
    null,
    null,
    null,
    null,
    "wildflower",
    null,
    "cactus",
    null,
  ];
  return (
    <div className="hero-garden-wrap" aria-hidden="true">
      <div className="hero-note">
        <span className="note-line" />a little room to grow
      </div>
      <div className="hero-garden">
        {arrangement.map((kind, i) => (
          <div className={`hero-tile ${kind ? "occupied" : ""}`} key={i}>
            {kind && <PlantArt kind={kind} />}
          </div>
        ))}
      </div>
      <div className="botanical-stamp">
        <Icon name="sun" size={24} />
        <span>
          GROWN WITH
          <br />A LITTLE WONDER
        </span>
      </div>
      <span className="garden-coordinate">THE CONSERVATORY · 06 × 06</span>
    </div>
  );
}
function FieldGuide() {
  return (
    <>
      <p className="modal-intro">
        Six little personalities. Endless possibilities.
      </p>
      <div className="guide-rules">
        <strong>One action. One turn.</strong>
        <p>
          Choose one of three seeds and tap an empty plot, or switch to Harvest
          and tap a plant. All three seed choices refresh after either action.
          Every remaining plant then grows by one stage, up to ripe (3).
        </p>
        <p>
          Planting is free. If you have dew, 1 is automatically used for an
          extra starting growth stage. Dew caps at 9. Only orthogonal neighbors
          count.
        </p>
        <p>
          Harvests score at every stage: base × (1 + 0.5 × growth). Chain depth
          adds ×0.25 per step, up to ×3. Ripe clovers add 25% each; cacti add
          20% per empty neighbor. Bonuses add together before the chain
          multiplier. Each harvest rounds down.
        </p>
      </div>
      <div className="guide-grid">
        {PLANT_KINDS.map((kind) => (
          <article key={kind}>
            <PlantArt kind={kind} />
            <div>
              <span className="eyebrow">
                {PLANTS[kind].subtitle} · {PLANTS[kind].base} base
              </span>
              <h3>{PLANTS[kind].name}</h3>
              <p>{PLANTS[kind].ability}</p>
              <small>{PLANTS[kind].strategy}</small>
            </div>
          </article>
        ))}
      </div>
      <p className="fine-print">
        The selected plant harvests before seasonal growth. Then its effects
        resolve in a queue: north, east, south, west. A plant activates at most
        once per action. Newly spread flowers cannot chain-harvest that turn.
        After turn 25, the garden rests; standing plants score nothing.
      </p>
    </>
  );
}
export default function App() {
  const view = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [modal, setModal] = useState<
    "guide" | "pause" | "restart" | "journal" | null
  >(null);
  const [offer, setOffer] = useState(0);
  const [mode, setMode] = useState<"plant" | "harvest">("plant");
  const [inspected, setInspected] = useState<number | null>(null);
  const run = view.data.current;
  const finished =
    view.screen === "garden" && run?.status === "finished" && !view.busy;
  const selectedKind = run?.offers[offer] ?? "sunflower";
  const selectedPlant = inspected === null ? null : run?.board[inspected];
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view.screen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || view.screen !== "garden" || finished || !view.ready) return;
      if (e.key === "Escape" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        setModal("pause");
      }
      if (["1", "2", "3"].includes(e.key)) {
        setOffer(Number(e.key) - 1);
        setMode("plant");
        setInspected(null);
      }
      if (e.key.toLowerCase() === "h") {
        setMode("harvest");
        setInspected(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, view.screen, view.ready, finished]);
  function start(seed?: number) {
    controller.start(seed);
    setOffer(0);
    setMode("plant");
    setInspected(null);
    setModal(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function tile(index: number) {
    if (!run || view.busy) return;
    if (run.board[index]) {
      if (mode === "harvest") {
        controller.play({ type: "harvest", index });
        setInspected(null);
      } else setInspected(inspected === index ? null : index);
    } else if (mode === "plant") {
      controller.play({ type: "plant", index, offer });
      setInspected(null);
    }
  }
  const rootClass = `app ${view.data.settings.reducedMotion ? "reduce-motion" : ""}`;
  if (!view.ready)
    return (
      <main className="loading">
        <Icon name="leaf" size={40} />
        <p>Opening the conservatory…</p>
      </main>
    );
  return (
    <div className={rootClass}>
      <header className="site-header">
        <button
          className="brand-button"
          onClick={() =>
            view.screen === "garden" ? setModal("pause") : controller.home()
          }
          aria-label="Chain Garden home"
        >
          <Brand />
        </button>
        <div className="header-right">
          <span className="edition">A BOTANICAL CHAIN REACTION</span>
          <button
            className="text-button guide-button"
            onClick={() => setModal("guide")}
          >
            <Icon name="book" size={18} />
            <span>Field guide</span>
          </button>
          {view.screen === "title" && (
            <button
              className="icon-button journal-button"
              onClick={() => setModal("journal")}
              aria-label="Open garden journal"
            >
              <Icon name="book" size={18} />
            </button>
          )}
          {view.screen === "garden" && (
            <button
              className="icon-button"
              onClick={() => setModal("pause")}
              aria-label="Pause game"
            >
              <Icon name="pause" />
            </button>
          )}
        </div>
      </header>
      {view.error && (
        <div className="storage-notice" role="status">
          {view.error}
        </div>
      )}
      {view.screen === "title" ? (
        <main className="title-screen">
          <section className="hero-copy">
            <span className="eyebrow">
              <span className="tiny-star">✳</span> A SMALL GARDEN. A GRAND
              POSSIBILITY.
            </span>
            <h1>
              Good things
              <br />
              grow <em>together.</em>
            </h1>
            <p className="hero-description">
              Plant a little possibility. Nurture unexpected friendships. Find
              the perfect moment to let it all bloom.
            </p>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  run?.status === "playing" ? controller.resume() : start()
                }
              >
                {run?.status === "playing"
                  ? "Continue your garden"
                  : "Enter the garden"}
                <Icon name="arrow" />
              </button>
              {run?.status === "playing" && (
                <button
                  className="text-button"
                  onClick={() => setModal("restart")}
                >
                  Start fresh
                </button>
              )}
            </div>
            <div className="session-note">
              <span className="small-line" />
              25 turns<span>·</span>3–5 minutes<span>·</span>Yours to discover
            </div>
            <div className="title-record">
              <button
                onClick={() => setModal("journal")}
                className="record-button"
              >
                <span className="eyebrow">PERSONAL BEST</span>
                <strong>
                  {view.data.completed.length ? number(view.data.best) : "—"}
                  <small> pts</small>
                </strong>
              </button>
              <div>
                <span className="eyebrow">THE EXPERIMENT</span>
                <p>A little strategy. A little serendipity.</p>
              </div>
            </div>
          </section>
          <HeroGarden />
          <section className="title-bottom">
            <span>01 / PLANT WITH INTENTION</span>
            <span>02 / LET CONNECTIONS GROW</span>
            <span>03 / MAKE A LITTLE MAGIC</span>
          </section>
        </main>
      ) : (
        run && (
          <main className="play-screen">
            <div className="game-heading">
              <div>
                <span className="eyebrow">THE CONSERVATORY</span>
                <h1>
                  A little room to grow<span>.</span>
                </h1>
              </div>
              <div className="compact-resources">
                <span>
                  <strong>{run.maxTurns - run.turn}</strong> turns left
                </span>
                <span>
                  <Icon name="dew" size={13} />
                  <strong>{run.dew}</strong> dew
                </span>
              </div>
              <div className="run-seed">
                SPECIMEN NO.
                <br />
                <strong>{String(run.seed).padStart(10, "0")}</strong>
              </div>
            </div>
            <div className="game-layout">
              <aside className="garden-notes">
                <div className="notes-top">
                  <span className="eyebrow">A GARDENER’S NOTE</span>
                  <span className="notes-dash" />
                </div>
                <h2>
                  Timing is
                  <br />
                  <em>everything.</em>
                </h2>
                <p>
                  Every plant you harvest makes space. And takes a little
                  possibility with it.
                </p>
                <div className="turn-wheel">
                  <span>{run.maxTurns - run.turn}</span>
                  <small>TURNS TO BLOOM</small>
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="54" />
                    <circle
                      className="wheel-progress"
                      cx="60"
                      cy="60"
                      r="54"
                      strokeDasharray={`${((run.maxTurns - run.turn) / run.maxTurns) * 339.3} 339.3`}
                    />
                  </svg>
                </div>
                <div className="dew-note">
                  <Icon name="dew" />
                  <strong>
                    {run.dew}
                    <small> / 9 dew</small>
                  </strong>
                </div>
                <p className="small-copy">
                  {run.dew
                    ? "Your next seed gets +1 growth. Uses 1 dew automatically."
                    : "Ripe sunflowers make dew. Dew gives new seeds a head start."}
                </p>
                <button
                  className="text-button"
                  onClick={() => setModal("guide")}
                >
                  Meet your plants
                  <Icon name="arrow" size={16} />
                </button>
              </aside>
              <section className="garden-section" aria-label="Your garden">
                <div className="garden-scorebar">
                  <div>
                    <span className="eyebrow">GARDEN SCORE</span>
                    <strong data-testid="score">
                      {number(run.score)}
                      <small> pts</small>
                    </strong>
                  </div>
                  <div className="best-score">
                    <span className="eyebrow">PERSONAL BEST</span>
                    <strong>{number(view.data.best)}</strong>
                  </div>
                </div>
                <div className={`board-frame ${view.busy ? "resolving" : ""}`}>
                  <div className="board-coordinate">
                    A<span>B</span>
                    <span>C</span>
                    <span>D</span>
                    <span>E</span>
                    <span>F</span>
                  </div>
                  <div
                    className={`garden-board mode-${mode}`}
                    role="group"
                    aria-label="6 by 6 garden"
                  >
                    {(view.board.length ? view.board : run.board).map(
                      (plant: Plant | null, index: number) => {
                        const active = view.active?.index === index;
                        const linked =
                          inspected !== null &&
                          neighbors(inspected).includes(index);
                        const valid = mode === "plant" ? !plant : !!plant;
                        return (
                          <button
                            key={index}
                            className={`garden-tile ${view.grown.includes(index) ? "just-grew" : ""} ${plant ? "has-plant" : "empty-tile"} ${plant?.growth === 3 ? "ripe" : ""} ${active ? `event-${view.active?.type}` : ""} ${inspected === index ? "inspected" : ""} ${linked ? "linked" : ""} ${valid ? "available" : ""}`}
                            data-testid={`tile-${index}`}
                            data-plant={plant?.kind ?? ""}
                            data-growth={plant?.growth ?? ""}
                            disabled={
                              view.busy ||
                              !!finished ||
                              (mode === "harvest" && !plant)
                            }
                            onClick={() => tile(index)}
                            aria-label={`${String.fromCharCode(65 + (index % 6))}${Math.floor(index / 6) + 1}: ${plant ? `${PLANTS[plant.kind].name}, growth ${plant.growth} of 3${plant.growth === 3 ? ", ripe" : ""}${mode === "harvest" ? `, harvest for ${harvestValue(run, index)} points` : ", inspect"}` : "empty, plant selected seed"}`}
                          >
                            {plant ? (
                              <>
                                <PlantArt
                                  kind={plant.kind}
                                  growth={plant.growth}
                                />
                                <span
                                  className="growth-dots"
                                  aria-hidden="true"
                                >
                                  {[1, 2, 3].map((n) => (
                                    <i
                                      key={n}
                                      className={
                                        plant.growth >= n ? "filled" : ""
                                      }
                                    />
                                  ))}
                                </span>
                                {plant.growth === 3 && (
                                  <span
                                    className="ripe-spark"
                                    aria-hidden="true"
                                  >
                                    ✧
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="plot-cross" aria-hidden="true">
                                +
                              </span>
                            )}
                            {active && view.active?.points && (
                              <span className="tile-points">
                                +{view.active.points}
                              </span>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <div className="board-footer">
                    <span>
                      <i className="ripe-dot" />3 dots = ripe
                    </span>
                    <span>NEIGHBORS SHARE AN EDGE</span>
                  </div>
                </div>
                <div
                  className={`chain-feedback ${view.lastChain > 1 ? "has-combo" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="chain-symbol">
                    <Icon
                      name={view.lastChain > 1 ? "sun" : "leaf"}
                      size={21}
                    />
                  </span>
                  <div>
                    <strong>
                      {view.busy
                        ? "A little magic is unfolding…"
                        : view.lastChain > 1
                          ? `${view.lastChain}-plant chain · +${view.lastPoints} points`
                          : view.lastPoints
                            ? `A thoughtful harvest · +${view.lastPoints} points`
                            : run.turn
                              ? "A little more possibility."
                              : "Your garden is ready for its first new seed."}
                    </strong>
                    <span>
                      {view.busy
                        ? view.active?.text
                        : "Grow your garden. Choose your moment."}
                    </span>
                  </div>
                  {view.busy && <span className="busy-dot" />}
                </div>
              </section>
              <aside className="seed-panel">
                <div className="seed-panel-heading">
                  <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
                  <span className="turn-chip" data-testid="turn">
                    {run.turn} / 25
                  </span>
                </div>
                <div className="mode-switch" aria-label="Action mode">
                  <button
                    aria-pressed={mode === "plant"}
                    onClick={() => {
                      setMode("plant");
                      setInspected(null);
                    }}
                    disabled={view.busy}
                  >
                    <Icon name="leaf" size={17} />
                    Plant
                  </button>
                  <button
                    aria-pressed={mode === "harvest"}
                    onClick={() => {
                      setMode("harvest");
                      setInspected(null);
                    }}
                    disabled={view.busy}
                  >
                    <Icon name="scissors" size={17} />
                    Harvest
                  </button>
                </div>
                <div className="seed-intro">
                  <h2>
                    {mode === "plant"
                      ? "Pick a little potential."
                      : "Choose your moment."}
                  </h2>
                  <p>
                    {mode === "plant"
                      ? "Choose a seed, then an empty plot."
                      : "Tap any plant to harvest it. Ripe plants give more."}
                    {mode === "plant" && (
                      <span className="dew-cost">
                        {run.dew
                          ? "Uses 1 dew for +1 starting growth."
                          : "Free to plant · no dew available."}
                      </span>
                    )}
                  </p>
                </div>
                {mode === "plant" ? (
                  <div
                    className="seed-choices"
                    role="group"
                    aria-label="Choose a seed"
                  >
                    {run.offers.map((kind, i) => (
                      <button
                        key={`${i}-${kind}`}
                        className={`seed-card ${offer === i ? "selected" : ""}`}
                        aria-pressed={offer === i}
                        aria-label={`Seed ${i + 1}: ${PLANTS[kind].name}`}
                        disabled={view.busy || !!finished}
                        onClick={() => {
                          setOffer(i);
                          setInspected(null);
                        }}
                      >
                        <span className="seed-number">0{i + 1}</span>
                        <PlantArt kind={kind} />
                        <span className="seed-name">
                          <strong>{PLANTS[kind].name}</strong>
                          <small>{PLANTS[kind].subtitle}</small>
                        </span>
                        <span className="seed-check">
                          {offer === i && <Icon name="check" size={14} />}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="harvest-note">
                    <Icon name="scissors" size={34} />
                    <p>A harvest is a beginning, too.</p>
                    <span>
                      Roses activate their neighbors. Each step deeper in a
                      chain raises the score multiplier.
                    </span>
                  </div>
                )}
                <div className="plant-detail">
                  <span className="eyebrow">
                    {selectedPlant
                      ? "IN YOUR GARDEN"
                      : mode === "plant"
                        ? "SEED NOTES"
                        : "HARVEST NOTES"}
                  </span>
                  <h3>
                    {selectedPlant
                      ? PLANTS[selectedPlant.kind].name
                      : mode === "plant"
                        ? PLANTS[selectedKind].name
                        : "Let it bloom, then let it go."}
                  </h3>
                  <p>
                    {selectedPlant
                      ? PLANTS[selectedPlant.kind].ability
                      : mode === "plant"
                        ? PLANTS[selectedKind].ability
                        : "Any growth stage can be harvested. Your chosen plant scores before the rest of the garden grows."}
                  </p>
                  {selectedPlant && inspected !== null && (
                    <button
                      className="small-harvest"
                      disabled={view.busy}
                      onClick={() => {
                        controller.play({ type: "harvest", index: inspected });
                        setInspected(null);
                      }}
                    >
                      Harvest · {harvestValue(run, inspected)} pts
                      <Icon name="scissors" size={16} />
                    </button>
                  )}
                </div>
                <div className="action-cost">
                  <span className="cost-dot" />
                  <span>1 action = 1 turn. All seeds refresh.</span>
                </div>
              </aside>
            </div>
            <section className="event-journal" aria-label="Last turn event log">
              <span className="eyebrow">GARDEN JOURNAL</span>
              <div>
                {view.events.length ? (
                  view.events.map((event, i) => (
                    <span
                      key={i}
                      className={
                        event.type === "harvested" ? "harvest-log" : ""
                      }
                    >
                      {event.depth > 0 && "↳ "}
                      {event.index >= 0 && (
                        <b className="log-coordinate">
                          {String.fromCharCode(65 + (event.index % 6))}
                          {Math.floor(event.index / 6) + 1}{" "}
                        </b>
                      )}
                      {event.text}
                    </span>
                  ))
                ) : (
                  <span>
                    Three old friends are already growing. What will you plant
                    beside them?
                  </span>
                )}
              </div>
            </section>
          </main>
        )
      )}
      <footer className="site-footer">
        <span>A LITTLE STRATEGY. A LITTLE SERENDIPITY.</span>
        <span>
          CHAIN GARDEN <span className="footer-star">✳</span> VOL. 01
        </span>
      </footer>
      {modal === "guide" && (
        <Modal
          title="The field guide"
          className="guide-modal"
          onClose={() => setModal(null)}
        >
          <FieldGuide />
        </Modal>
      )}
      {modal === "journal" && (
        <Modal title="Your garden journal" onClose={() => setModal(null)}>
          <p className="modal-intro">Little experiments, remembered.</p>
          {view.data.completed.length ? (
            <div className="history-list">
              {view.data.completed.map((s, i) => (
                <div key={s.id}>
                  <span>
                    {String(i + 1).padStart(2, "0")}
                    <small> SEED {s.seed}</small>
                  </span>
                  <strong>{number(s.score)} pts</strong>
                  <small>{s.stats.bestChain} plant best chain</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-journal">
              Your first story is waiting to grow. Finish a garden to add it
              here.
            </p>
          )}
        </Modal>
      )}
      {modal === "pause" && (
        <Modal title="Take a little breather." onClose={() => setModal(null)}>
          <p className="modal-intro">Your garden will be right here.</p>
          <div className="pause-settings">
            <label>
              <span>
                <Icon name="sound" />
                Garden sounds
              </span>
              <input
                type="checkbox"
                checked={view.data.settings.sound}
                onChange={(e) =>
                  controller.settings({ sound: e.target.checked })
                }
              />
            </label>
            <label>
              <span>
                <Icon name="leaf" />
                Gentle motion only
              </span>
              <input
                type="checkbox"
                checked={view.data.settings.reducedMotion}
                onChange={(e) =>
                  controller.settings({ reducedMotion: e.target.checked })
                }
              />
            </label>
          </div>
          <button
            className="primary-button full"
            onClick={() => setModal(null)}
          >
            Back to the garden
            <Icon name="arrow" />
          </button>
          <div className="pause-actions">
            <button
              className="text-button"
              disabled={view.busy}
              onClick={() => setModal("restart")}
            >
              Start a new garden
            </button>
            <button
              className="text-button"
              disabled={view.busy}
              onClick={() => {
                controller.home();
                setModal(null);
              }}
            >
              Save & return home
            </button>
          </div>
          <p className="fine-print">
            Progress saves after every turn. Keyboard: 1–3 select seeds, H
            harvest, P / Esc pause. Tab and Enter navigate plots.
          </p>
        </Modal>
      )}
      {modal === "restart" && (
        <Modal title="Make a fresh start?" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Your current garden will be replaced. Your personal best and
            completed gardens stay in your journal.
          </p>
          <button className="primary-button full" onClick={() => start()}>
            Plant a new beginning
            <Icon name="arrow" />
          </button>
          <button className="text-button full" onClick={() => setModal(null)}>
            Keep this garden
          </button>
        </Modal>
      )}
      {finished && !modal && (
        <Modal
          title="A garden well grown."
          className="results-modal"
          onClose={() => controller.home()}
        >
          <div className="result-bouquet">
            <PlantArt kind="wildflower" />
            <PlantArt kind="sunflower" />
            <PlantArt kind="rose" />
          </div>
          <span className="eyebrow">25 TURNS. YOUR OWN LITTLE WONDER.</span>
          <div className="final-score" data-testid="final-score">
            {number(run!.score)}
            <small> points</small>
          </div>
          <p className="result-rank">
            {run!.score >= view.data.best && run!.score > 0
              ? "A new personal best. Beautifully done."
              : "Every garden teaches you something."}
          </p>
          <div className="result-stats">
            <div>
              <strong>{run!.stats.harvested}</strong>
              <span>plants harvested</span>
            </div>
            <div>
              <strong>{run!.stats.bestChain}</strong>
              <span>longest chain</span>
            </div>
            <div>
              <strong>{run!.stats.bestTurn}</strong>
              <span>best turn</span>
            </div>
          </div>
          <p className="result-tip">
            {run!.stats.bestChain < 3
              ? "Next time: gather ripe plants around a rose, then harvest the rose to set your chain in motion."
              : "A well-placed clover makes every link in your next chain a little more rewarding."}
          </p>
          <button className="primary-button full" onClick={() => start()}>
            Grow something new
            <Icon name="arrow" />
          </button>
          <div className="pause-actions">
            <button className="text-button" onClick={() => start(run!.seed)}>
              Replay this seed
            </button>
            <button className="text-button" onClick={() => controller.home()}>
              Return home
            </button>
          </div>
          <p className="fine-print">
            Seed {run!.seed} · Saved to your garden journal
          </p>
        </Modal>
      )}
    </div>
  );
}
