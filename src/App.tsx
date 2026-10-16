import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GameController } from "./controller";
import { comboMultiplier, createRun, previewHarvest } from "./engine/game";
import { PLANT_KINDS } from "./engine/types";
import { PlantArt } from "./components/PlantArt";
import { Icon } from "./components/Icons";
import { Modal, FieldGuide } from "./components/GameDialogs";
import { GardenBoard } from "./components/GardenBoard";
import { DecisionPanel } from "./components/DecisionPanel";
import { IndexedDBStorage } from "./persistence/storage";
import { coordinate } from "./presentation/playback";
const controller = new GameController(new IndexedDBStorage());
void controller.initialize();
const number = (n: number) => n.toLocaleString("en-US");
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
  const opening = useMemo(() => createRun(314159), []);
  const run = view.data.current;
  const playing = view.screen === "garden";
  const finished = playing && run?.status === "finished" && !view.busy;
  const chamber =
    playing && run ? run : run?.status === "playing" ? run : opening;
  const preview = useMemo(
    () =>
      run && inspected !== null && !view.busy
        ? previewHarvest(run, inspected)
        : null,
    [run, inspected, view.busy],
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view.screen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || !playing || finished || !view.ready || view.busy) return;
      if (e.key === "Escape" && inspected !== null) {
        e.preventDefault();
        setInspected(null);
        return;
      }
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
  }, [modal, playing, finished, view.ready, view.busy, inspected]);
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
    if (run.board[index]) setInspected(inspected === index ? null : index);
    else if (mode === "plant") {
      controller.play({ type: "plant", index, offer });
      setInspected(null);
    }
  }
  function harvest() {
    if (inspected === null || view.busy) return;
    controller.play({ type: "harvest", index: inspected });
    setInspected(null);
  }
  const phase = !view.busy
    ? "ready"
    : view.active?.type === "planted"
      ? "plant"
      : view.active?.type === "growth" && view.active.source === undefined
        ? "grow"
        : "react";
  const logs = view.events.filter(
    (e) => e.type !== "growth" || e.source !== undefined,
  );
  if (!view.ready)
    return (
      <main className="loading">
        <Icon name="leaf" size={38} />
        <p>Waking the greenhouse…</p>
      </main>
    );
  return (
    <div
      className={`app ${view.data.settings.reducedMotion ? "reduce-motion" : ""} ${!playing ? "at-title" : "in-run"} ${preview ? "has-forecast" : ""}`}
    >
      <header className="site-header">
        <button
          className="brand-button"
          aria-label="Chain Garden home"
          onClick={() => (playing ? setModal("pause") : controller.home())}
        >
          <span className="brand-mark">
            <Icon name="leaf" size={23} />
          </span>
          <span className="brand">
            CHAIN GARDEN<small>EXPERIMENTAL BOTANY</small>
          </span>
        </button>
        <div className="header-right">
          <span className="greenhouse-id">
            <i />
            GREENHOUSE 01
          </span>
          <button
            className="text-button guide-button"
            aria-label="Field guide"
            onClick={() => setModal("guide")}
          >
            <Icon name="book" size={17} />
            <span>Field guide</span>
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("journal")}
            aria-label="Open garden journal"
          >
            <Icon name="leaf" size={18} />
          </button>
          {playing && (
            <button
              className="icon-button"
              onClick={() => setModal("pause")}
              aria-label="Pause game"
            >
              <Icon name="pause" size={18} />
            </button>
          )}
        </div>
      </header>
      {view.error && (
        <div className="storage-notice" role="status">
          {view.error}
        </div>
      )}
      <main className="game-shell">
        <div className="chamber-heading">
          <div>
            <span className="eyebrow">
              {playing ? "LIVE CULTIVATION" : "THE CONSERVATORY"}
            </span>
            <h1>
              {playing ? "Cultivation chamber" : "A living chain reaction."}
            </h1>
          </div>
          <span className="run-seed">
            {playing ? `SEED ${chamber.seed}` : "TURN-BASED STRATEGY / VOL. 01"}
          </span>
        </div>
        <div className="chamber-workspace">
          <section className="garden-section" aria-label="Your garden">
            <div className="game-hud">
              <div className="score-stat">
                <span className="eyebrow">GARDEN SCORE</span>
                <strong data-testid="score">
                  {number(playing ? view.displayScore : chamber.score)}
                  <small> pts</small>
                </strong>
              </div>
              <div
                className={`turn-stat ${chamber.maxTurns - chamber.turn <= 5 ? "final-turns" : ""}`}
              >
                <span className="eyebrow">TURNS LEFT</span>
                <strong>
                  {chamber.maxTurns - chamber.turn}
                  <small data-testid="turn">{chamber.turn} / 25</small>
                </strong>
              </div>
              <div className="dew-stat">
                <span className="eyebrow">
                  <Icon name="dew" size={12} />
                  DEW
                </span>
                <strong>
                  {chamber.dew}
                  <small>/ 9</small>
                </strong>
              </div>
            </div>
            <div
              className="turn-track"
              aria-label={`${chamber.maxTurns - chamber.turn} turns remaining`}
            >
              {Array.from({ length: 25 }, (_, i) => (
                <i key={i} className={i < chamber.turn ? "spent" : ""} />
              ))}
            </div>
            <div className="chamber-tray">
              <GardenBoard
                board={
                  playing
                    ? view.board.length
                      ? view.board
                      : chamber.board
                    : chamber.board
                }
                mode={mode}
                busy={view.busy}
                inactive={!playing || !!finished}
                inspected={inspected}
                preview={preview}
                events={view.events}
                pulses={view.pulses}
                onTile={tile}
              />
              {!playing && (
                <div className="title-card">
                  <span className="title-insignia">
                    <Icon name="leaf" size={35} />
                  </span>
                  <span className="eyebrow">
                    A TACTICAL BOTANICAL EXPERIMENT
                  </span>
                  <h2>
                    Chain
                    <br />
                    <em>Garden</em>
                  </h2>
                  <p>
                    Cultivate a living system.
                    <br />
                    Choose the moment to release it.
                  </p>
                  <div className="run-facts">
                    <span>25 turns</span>
                    <i />
                    <span>3–5 minutes</span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() =>
                      run?.status === "playing" ? controller.resume() : start()
                    }
                  >
                    {run?.status === "playing"
                      ? "Continue your garden"
                      : "Enter the garden"}
                    <Icon name="arrow" size={18} />
                  </button>
                  {run?.status === "playing" && (
                    <button
                      className="text-button"
                      onClick={() => setModal("restart")}
                    >
                      Start a new experiment
                    </button>
                  )}
                  <span className="title-footnote">
                    NO CLOCK. EVERY MOVE MATTERS.
                  </span>
                </div>
              )}
            </div>
            <div className="phase-strip" aria-label="Turn sequence">
              {[
                ["plant", "01", "Act"],
                ["grow", "02", "Grow"],
                ["react", "03", "React"],
                ["ready", "04", "Your turn"],
              ].map(([id, n, label]) => (
                <span key={id} className={phase === id ? "current" : ""}>
                  <b>{n}</b>
                  {label}
                </span>
              ))}
            </div>
            {playing && (
              <div
                className={`chain-feedback ${view.lastChain > 1 || view.chainCount > 1 ? "has-combo" : ""}`}
                role="status"
                aria-live="polite"
              >
                <span className="chain-symbol">
                  <Icon name={view.chainCount > 1 ? "sun" : "leaf"} size={22} />
                </span>
                <div>
                  <strong>
                    {view.busy
                      ? view.chainCount > 1
                        ? `${view.chainCount}-plant chain · ×${comboMultiplier(view.comboDepth).toFixed(2)}`
                        : "Growth is propagating…"
                      : view.lastChain > 1
                        ? `${view.lastChain}-plant chain · +${view.lastPoints} points`
                        : view.lastPoints
                          ? `Harvest complete · +${view.lastPoints} points`
                          : "Build your next reaction."}
                  </strong>
                  <span>
                    {view.busy
                      ? view.active?.text
                      : preview
                        ? "Forecast ready. Confirm the release when you choose."
                        : "The garden waits for your decision."}
                  </span>
                </div>
                {view.busy && <i className="busy-dot" />}
              </div>
            )}
          </section>
          {playing && run ? (
            <DecisionPanel
              run={run}
              view={view}
              offer={offer}
              mode={mode}
              inspected={inspected}
              preview={preview}
              onMode={(next) => {
                setMode(next);
                setInspected(null);
              }}
              onOffer={(next) => {
                setOffer(next);
                setInspected(null);
              }}
              onCancel={() => setInspected(null)}
              onHarvest={harvest}
            />
          ) : (
            <aside className="opening-notes">
              <span className="eyebrow">THE EXPERIMENT</span>
              <h3>
                Grow an engine.
                <br />
                <em>Harvest a reaction.</em>
              </h3>
              <p>
                Keep productive organisms alive. Connect their abilities.
                Collect the chain before your 25 turns run out.
              </p>
              <ol>
                <li>
                  <b>01</b>
                  <span>
                    <strong>Cultivate</strong>Plant one of three seeds. Every
                    survivor grows.
                  </span>
                </li>
                <li>
                  <b>02</b>
                  <span>
                    <strong>Connect</strong>Only edge-sharing neighbors
                    interact.
                  </span>
                </li>
                <li>
                  <b>03</b>
                  <span>
                    <strong>Release</strong>Harvest a rose to activate the
                    chain.
                  </span>
                </li>
              </ol>
              <div className="specimen-roster">
                {PLANT_KINDS.map((kind) => (
                  <PlantArt key={kind} kind={kind} />
                ))}
              </div>
              <button
                className="record-button"
                onClick={() => setModal("journal")}
              >
                <span className="eyebrow">PERSONAL BEST</span>
                <strong>
                  {number(view.data.best)}
                  <small> pts</small>
                </strong>
                <Icon name="arrow" size={16} />
              </button>
            </aside>
          )}
        </div>
        {playing && (
          <details className="event-journal" aria-label="Last turn event log">
            <summary>
              <span className="eyebrow">REACTION LOG</span>
              <span>
                {logs.length
                  ? `${logs.length} recorded events`
                  : "No reaction yet"}
                <Icon name="arrow" size={13} />
              </span>
            </summary>
            <ol>
              {logs.length ? (
                logs.map((event, i) => (
                  <li key={i} className={`log-${event.type}`}>
                    <span className="log-step">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <b className="log-coordinate">
                      {event.source !== undefined
                        ? `${coordinate(event.source)} → `
                        : ""}
                      {coordinate(event.index)}
                    </b>
                    <span>{event.text}</span>
                  </li>
                ))
              ) : (
                <li>
                  Plant beside the established sunflower, rose and clover. Or
                  inspect their harvest forecasts.
                </li>
              )}
            </ol>
          </details>
        )}
      </main>
      <footer className="game-footer">
        <span>
          <i />
          Turn-based. The greenhouse grows only when you act.
        </span>
        <span>PROGRESS SAVES AFTER EVERY TURN</span>
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
          <p className="modal-intro">
            Completed experiments. Preserved locally.
          </p>
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
        <Modal title="Experiment paused." onClose={() => setModal(null)}>
          <p className="modal-intro">
            Nothing grows while you decide. Your progress is saved.
          </p>
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
          title="Cultivation complete."
          className="results-modal"
          onClose={() => controller.home()}
        >
          <div className="result-bouquet">
            <PlantArt kind="wildflower" />
            <PlantArt kind="sunflower" />
            <PlantArt kind="rose" />
          </div>
          <span className="eyebrow">25 TURNS · REACTION ARCHIVED</span>
          <div className="final-score" data-testid="final-score">
            {number(run!.score)}
            <small> points</small>
          </div>
          <p className="result-rank">
            {run!.score >= view.data.best && run!.score > 0
              ? "Personal best recorded."
              : "A new experiment. A different chain."}
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
            Begin next run
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
