import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { GameController } from "./controller";
import { comboMultiplier, createRun, previewHarvest } from "./engine/game";
import { BALANCE, challengeComplete } from "./engine/balance";
import { mutationDefinition, PROTOCOLS } from "./engine/content";
import { PLANTS } from "./engine/plants";
import type { Action, RunOptions } from "./engine/types";
import { TUTORIAL_COPY, tutorialTarget } from "./experience/tutorial";
import { eventExpression, MOSS_LINES } from "./experience/moss";
import { GardenBoard } from "./components/GardenBoard";
import { DecisionPanel } from "./components/DecisionPanel";
import { Modal, FieldGuide } from "./components/GameDialogs";
import { MossArt, MossCompanion } from "./components/Moss";
import { Icon } from "./components/Icons";
import { PlantArt } from "./components/PlantArt";
import {
  ResearchLab,
  RunSetup,
  UpgradeChoices,
  Reactor,
} from "./components/Progression";
import { IndexedDBStorage } from "./persistence/storage";
import { coordinate } from "./presentation/playback";
const controller = new GameController(new IndexedDBStorage());
void controller.initialize();
type ModalKind =
  | "setup"
  | "lab"
  | "guide"
  | "settings"
  | "restart"
  | "tutorial-replay"
  | "journal"
  | "specimen"
  | "reactor"
  | null;
const number = (n: number) => n.toLocaleString("en-US");
export default function App() {
  const view = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [modal, setModal] = useState<ModalKind>(null),
    [offer, setOffer] = useState(0),
    [mode, setMode] = useState<"plant" | "harvest" | "prune">("plant"),
    [inspected, setInspected] = useState<number | null>(null),
    [guideChapter, setGuideChapter] = useState("Plants"),
    [labCelebration, setLabCelebration] = useState(false);
  const opening = useMemo(() => createRun(16), []),
    run = view.data.current,
    playing = view.screen === "garden" && !!run;
  const finished = playing && run.status === "finished" && !view.busy;
  const chamber = playing ? run : run?.status === "playing" ? run : opening;
  const t = view.data.tutorial,
    guided = playing && t.status === "active";
  const target = guided ? tutorialTarget(t) : null;
  const allowed = useMemo(
    () =>
      guided && ["plant", "connect", "harvest"].includes(t.step)
        ? [target!]
        : guided && ["grow", "reactor", "research"].includes(t.step)
          ? []
          : null,
    [guided, t.step, target],
  );
  const preview = useMemo(
    () =>
      run && inspected !== null && !view.busy && mode !== "prune"
        ? previewHarvest(run, inspected)
        : null,
    [run, inspected, view.busy, mode],
  );
  const draft = playing && run.pendingUpgrade.length > 0 && !view.busy;
  const tutorialCopy =
    guided && !draft && !finished ? TUTORIAL_COPY[t.step] : undefined;
  const notice =
    view.data.settings.guidance && view.data.moss.pending
      ? MOSS_LINES[view.data.moss.pending]
      : null;
  const discoveries = view.events.filter(
    (e) => e.type === "mutation" && e.first,
  );
  const selectedKind =
    run?.board[inspected ?? -1]?.kind ?? chamber.offers[offer];
  function start(options: RunOptions = {}, guide = false) {
    if (guide) controller.startTutorial();
    else controller.start(undefined, options);
    setModal(null);
    setInspected(null);
    setMode("plant");
    setOffer(0);
  }
  function guide(chapter = "Plants") {
    setGuideChapter(chapter);
    setModal("guide");
  }
  function again() {
    if (run) {
      controller.again();
      setOffer(0);
      setInspected(null);
      setMode("plant");
      setModal(null);
    }
  }
  function lab() {
    setLabCelebration(t.status === "active" && t.step === "research");
    controller.openLab();
    setModal("lab");
  }
  function play(action: Action) {
    controller.play(action);
    setInspected(null);
    setMode("plant");
    setOffer(0);
  }
  function tile(index: number) {
    if (
      !run ||
      view.busy ||
      run.pendingUpgrade.length ||
      (allowed && !allowed.includes(index))
    )
      return;
    if (run.board[index]) setInspected(inspected === index ? null : index);
    else if (mode === "plant") play({ type: "plant", index, offer });
  }
  function newGarden() {
    setModal(run?.status === "playing" ? "restart" : "setup");
  }
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view.screen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        modal ||
        !playing ||
        finished ||
        view.busy ||
        draft ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      if (e.key === "Escape" && inspected !== null) {
        e.preventDefault();
        setInspected(null);
        setMode("plant");
        return;
      }
      if (e.key === "Escape" || e.key.toLowerCase() === "p") {
        e.preventDefault();
        setModal("settings");
      }
      if (
        ["1", "2", "3"].includes(e.key) &&
        (!guided || ["plant", "connect", "explore", "finish"].includes(t.step))
      ) {
        const i = Number(e.key) - 1;
        if (guided && ["plant", "connect"].includes(t.step) && i !== 0) return;
        setOffer(i);
        setMode("plant");
        setInspected(null);
      }
      if (e.key.toLowerCase() === "h") {
        const index =
          guided && t.step === "harvest"
            ? 20
            : run!.board.findIndex(
                (p) => p?.kind === "rose" || p?.kind === "briar",
              );
        if (index >= 0 && (!allowed || allowed.includes(index))) {
          setInspected(index);
          document
            .querySelector<HTMLButtonElement>(`[data-testid="tile-${index}"]`)
            ?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    modal,
    playing,
    finished,
    view.busy,
    draft,
    inspected,
    guided,
    t.step,
    run,
    allowed,
  ]);
  if (!view.ready)
    return (
      <main className="loading">
        <MossArt expression="curious" />
        <p>Waking the greenhouse…</p>
      </main>
    );
  const earned = view.data.completed.find((s) => s.id === run?.id);
  return (
    <div
      className={`app ${playing ? "in-run" : "at-title"} ${view.data.settings.reducedMotion ? "reduce-motion" : ""} ${preview ? "has-forecast" : ""} ${guided ? "guided-run" : ""} ${view.busy && view.chainCount >= 5 ? "chain-crescendo" : ""}`}
    >
      <header className="site-header">
        <button
          className="brand-button"
          aria-label="Chain Garden home"
          onClick={() => (playing ? setModal("settings") : controller.home())}
        >
          <Icon name="leaf" size={24} />
          <span>
            Chain <em>Garden</em>
          </span>
        </button>
        <nav className="game-nav" aria-label="Main destinations">
          <button
            className={!modal ? "current" : ""}
            onClick={() =>
              run?.status === "playing"
                ? controller.resume()
                : controller.home()
            }
            aria-label="Play"
          >
            <Icon name="leaf" size={17} />
            <span>Play</span>
          </button>
          <button
            className={modal === "lab" ? "current" : ""}
            onClick={lab}
            aria-label="Research lab"
          >
            <Icon name="dew" size={17} />
            <span>Lab</span>
            <b>{view.data.profile.biomass}</b>
          </button>
          <button
            className={modal === "guide" ? "current" : ""}
            onClick={() => guide()}
            aria-label="Field guide"
          >
            <Icon name="book" size={17} />
            <span>Guide</span>
          </button>
        </nav>
        <button
          className="icon-button settings-button"
          onClick={() => setModal("settings")}
          aria-label={playing ? "Pause game" : "Settings"}
        >
          <Icon name="pause" size={18} />
        </button>
      </header>
      {view.error && (
        <div className="storage-notice" role="status">
          {view.error}
        </div>
      )}
      <main className="game-shell">
        <div className="chamber-workspace">
          <section className="garden-section" aria-label="Your garden">
            <div className="game-hud">
              <div className="score-stat">
                <span>Score</span>
                <strong data-testid="score">
                  {number(playing ? view.displayScore : chamber.score)}
                  <small> pts</small>
                </strong>
              </div>
              <div className="turn-stat">
                <span>Turns left</span>
                <strong>
                  {25 - chamber.turn}
                  <small data-testid="turn">{chamber.turn} / 25</small>
                </strong>
              </div>
              <button
                className={`reactor-instrument ${guided && t.step === "reactor" ? "tutorial-instrument" : ""}`}
                aria-label="Reactor details"
                onClick={() => setModal("reactor")}
              >
                <Reactor
                  heat={playing ? view.displayHeat : chamber.instability}
                  run={chamber}
                />
              </button>
            </div>
            <div className="chamber-tray">
              <GardenBoard
                board={playing ? view.board : chamber.board}
                blocked={chamber.blocked}
                mode={mode}
                busy={view.busy}
                inactive={!playing || !!finished || draft}
                inspected={inspected}
                preview={preview}
                events={view.events}
                pulses={view.pulses}
                onTile={tile}
                target={target}
                allowed={allowed}
              />
              {!playing && (
                <div className="title-card">
                  <MossArt expression="curious" />
                  <span className="eyebrow">Tactical botany</span>
                  <h1>
                    Chain
                    <br />
                    <em>Garden</em>
                  </h1>
                  <p>Grow something worth taking apart.</p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      run?.status === "playing"
                        ? controller.resume()
                        : t.status === "available"
                          ? start({}, true)
                          : setModal("setup")
                    }
                  >
                    {run?.status === "playing"
                      ? "Continue your garden"
                      : t.status === "available"
                        ? "Grow with M.O.S.S."
                        : "Enter the garden"}
                    <Icon name="arrow" size={18} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      run?.status === "playing"
                        ? setModal("restart")
                        : setModal("setup")
                    }
                  >
                    {run?.status === "playing"
                      ? "New garden"
                      : t.status === "available"
                        ? "I know my way around"
                        : "Choose your experiment"}
                  </button>
                  <small>25 turns · no clock</small>
                </div>
              )}
            </div>
            {playing && (
              <div className="garden-caption">
                <span>
                  {PROTOCOLS.find((p) => p.id === run.config.protocol)?.name}
                  {run.config.challenge ? " · Containment" : ""}
                </span>
                <span>
                  <Icon name="dew" size={12} />
                  {run.dew} / 9
                </span>
              </div>
            )}
          </section>
          {playing ? (
            <div className="garden-bench">
              <div className="companion-slot">
                <MossCompanion
                  expression={
                    view.busy
                      ? eventExpression(view.pulses)
                      : tutorialCopy
                        ? t.step === "reactor"
                          ? "surprised"
                          : t.step === "grow"
                            ? "happy"
                            : "curious"
                        : (notice?.expression ?? "neutral")
                  }
                  text={
                    tutorialCopy?.text ??
                    (!view.busy ? notice?.text : undefined)
                  }
                  hint={tutorialCopy?.hint}
                  onDismiss={
                    !tutorialCopy && notice
                      ? () => controller.dismissMoss()
                      : undefined
                  }
                  quiet={!tutorialCopy && !notice}
                >
                  {guided && ["grow", "reactor"].includes(t.step) && (
                    <button
                      className="text-button tutorial-next"
                      disabled={view.busy}
                      onClick={() => {
                        controller.tutorialContinue();
                        setOffer(0);
                      }}
                    >
                      Continue <Icon name="arrow" size={14} />
                    </button>
                  )}
                </MossCompanion>
                {guided && (
                  <button
                    className="skip-guide text-button"
                    onClick={() => controller.skipTutorial()}
                  >
                    Skip guide
                  </button>
                )}
              </div>
              <DecisionPanel
                run={run}
                view={view}
                offer={offer}
                mode={mode}
                inspected={inspected}
                preview={preview}
                tutorial={t}
                onOffer={(i) => {
                  setOffer(i);
                  setInspected(null);
                  setMode("plant");
                }}
                onCancel={() => {
                  setInspected(null);
                  setMode("plant");
                }}
                onHarvest={() =>
                  inspected !== null &&
                  play({ type: "harvest", index: inspected })
                }
                onUtility={play}
                onSkip={() => controller.skipPlayback()}
                onPrune={() => {
                  setMode("prune");
                  setInspected(null);
                }}
                onDetails={() => setModal("specimen")}
              />
              {!view.busy && view.lastPoints > 0 && (
                <div
                  className={`chain-feedback ${view.lastChain >= 3 ? "has-combo" : ""}`}
                  role="status"
                >
                  <strong>
                    {view.lastChain > 1
                      ? `${view.lastChain}-plant chain`
                      : "Harvest"}
                    <b>+{view.lastPoints}</b>
                  </strong>
                  {view.lastChain >= 3 && (
                    <span>
                      ×{comboMultiplier(view.comboDepth).toFixed(2)} peak combo
                    </span>
                  )}
                </div>
              )}
              {!!discoveries.length && (
                <button
                  className="discovery-strip"
                  onClick={() => guide("Mutations")}
                >
                  {discoveries.length === 1
                    ? mutationDefinition(discoveries[0].mutation!).name
                    : `${discoveries.length} new mutations`}
                  <span>
                    +{new Set(discoveries.map((e) => e.mutation)).size * 3}{" "}
                    Biomass <Icon name="arrow" size={13} />
                  </span>
                </button>
              )}
            </div>
          ) : (
            <aside className="opening-notes">
              <span className="eyebrow">The greenhouse is yours</span>
              <h2>
                Keep the engine.
                <br />
                <em>Or take the points.</em>
              </h2>
              <p>
                Plants grow together. Roses set off chains. Every harvest
                changes what comes next.
              </p>
              <div className="opening-specimens">
                {(["sunflower", "rose", "mushroom", "clover"] as const).map(
                  (k) => (
                    <PlantArt key={k} kind={k} />
                  ),
                )}
              </div>
              <button
                className="record-button"
                onClick={() => setModal("journal")}
              >
                <span>Personal best</span>
                <strong>{number(view.data.best)}</strong>
                <Icon name="arrow" size={16} />
              </button>
            </aside>
          )}
        </div>
        {playing && (
          <details className="event-journal" aria-label="Last turn event log">
            <summary>
              Reaction log <span>{view.events.length} events</span>
            </summary>
            <ol>
              {view.events
                .filter((e) => e.type !== "growth" || e.source !== undefined)
                .map((e, i) => (
                  <li className={`log-${e.type}`} key={i}>
                    <span>
                      {e.index < 0
                        ? "Lab"
                        : `${e.source !== undefined ? `${coordinate(e.source)} → ` : ""}${coordinate(e.index)}`}
                    </span>
                    {e.text}
                  </li>
                ))}
            </ol>
          </details>
        )}
      </main>
      {modal === "setup" && (
        <Modal
          title="Prepare the chamber"
          className="setup-modal"
          onClose={() => setModal(null)}
        >
          <RunSetup data={view.data} onStart={(options) => start(options)} />
        </Modal>
      )}
      {modal === "lab" && (
        <Modal
          title="Research lab"
          className="lab-modal"
          onClose={() => setModal(null)}
        >
          {labCelebration && (
            <div className="lab-welcome">
              <MossArt expression="happy" />
              <p>New tools. New possibilities.</p>
            </div>
          )}
          <ResearchLab
            data={view.data}
            onPurchase={(id) => controller.purchase(id)}
          />
        </Modal>
      )}
      {modal === "guide" && (
        <Modal
          title="Field guide"
          className="guide-modal"
          onClose={() => setModal(null)}
        >
          <FieldGuide data={view.data} initialChapter={guideChapter} />
        </Modal>
      )}
      {modal === "specimen" && (
        <Modal
          title={PLANTS[selectedKind].name}
          className="specimen-modal"
          onClose={() => setModal(null)}
        >
          <div className="specimen-portrait">
            <PlantArt kind={selectedKind} />
            <span>{PLANTS[selectedKind].subtitle}</span>
          </div>
          <p className="specimen-rule">{PLANTS[selectedKind].ability}</p>
          <p className="fine-print">{PLANTS[selectedKind].strategy}</p>
          {run?.board[inspected ?? -1]?.traits?.map((id) => (
            <div className="trait-detail" key={id}>
              <h3>{mutationDefinition(id).name}</h3>
              <p>{mutationDefinition(id).effect}</p>
            </div>
          ))}
        </Modal>
      )}
      {modal === "reactor" && (
        <Modal title="The living reactor" onClose={() => setModal(null)}>
          <MossCompanion
            expression="warning"
            text="Heat is useful. Until it isn’t."
          />
          <div className="guide-rules">
            <p>
              Harvests add 2 + 3 × depth heat. Higher tiers add 3 / 6 / 9 points
              per chain depth.
            </p>
            <p>
              At 100, one overload removes up to three survivors around the
              root, then resets heat to 35. Gain 20 + 5 per lost plant points,
              up to 3 dew and two ripe plantings.
            </p>
            <p>
              Clovers cool 6; Moonflowers cool 12. Vent for 3 dew and one turn
              to cool 15. Once triggered, later cooling cannot cancel an
              overload.
            </p>
            {view.events.filter((e) => e.heat !== undefined).length > 0 && (
              <details>
                <summary>Last reaction</summary>
                {view.events
                  .filter((e) => e.heat !== undefined)
                  .map((e, i) => (
                    <p key={i}>{e.text}</p>
                  ))}
              </details>
            )}
          </div>
        </Modal>
      )}
      {modal === "journal" && (
        <Modal title="Garden journal" onClose={() => setModal(null)}>
          <div className="history-list">
            {view.data.completed.length ? (
              view.data.completed.map((s) => (
                <article key={s.id}>
                  <span>
                    {PROTOCOLS.find((p) => p.id === s.protocol)?.name}
                    <small>Seed {s.seed}</small>
                  </span>
                  <strong>{number(s.score)} pts</strong>
                  <small>
                    Chain {s.stats.bestChain} · +{s.biomass} Biomass
                  </small>
                </article>
              ))
            ) : (
              <p>Your first garden is waiting.</p>
            )}
          </div>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          title={playing ? "Take your time." : "Greenhouse settings"}
          onClose={() => setModal(null)}
        >
          <div className="pause-settings">
            {(
              [
                { key: "sound", label: "Garden sounds" },
                { key: "reducedMotion", label: "Gentle motion only" },
                { key: "guidance", label: "M.O.S.S. tips" },
              ] as const
            ).map(({ key, label }) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={view.data.settings[key]}
                  onChange={(e) =>
                    controller.settings({ [key]: e.target.checked })
                  }
                />
              </label>
            ))}
          </div>
          {playing && (
            <button
              className="primary-button full"
              onClick={() => setModal(null)}
            >
              Back to the garden <Icon name="arrow" />
            </button>
          )}
          <div className="settings-links">
            <button onClick={() => setModal("journal")}>
              Statistics & journal
            </button>
            <button
              disabled={view.busy}
              onClick={() => setModal("tutorial-replay")}
            >
              Replay tutorial
            </button>
            {guided && (
              <button
                onClick={() => {
                  controller.skipTutorial();
                  setModal(null);
                }}
              >
                Skip tutorial
              </button>
            )}
            <button disabled={view.busy} onClick={newGarden}>
              Start a new garden
            </button>
            {playing && (
              <button
                disabled={view.busy}
                onClick={() => {
                  controller.home();
                  setModal(null);
                }}
              >
                Save & return home
              </button>
            )}
          </div>
          <p className="fine-print">
            1–3 seeds · H inspect a Rose · P pause · Arrow keys move between
            plots.
          </p>
        </Modal>
      )}
      {(modal === "restart" || modal === "tutorial-replay") && (
        <Modal
          title={
            modal === "tutorial-replay"
              ? "Grow with M.O.S.S.?"
              : "A fresh garden?"
          }
          onClose={() => setModal(null)}
        >
          <p className="modal-intro">
            {run?.status === "playing"
              ? "This replaces the current garden. Your research, discoveries and completed runs stay."
              : "Your research and discoveries stay with you."}
          </p>
          <button
            className="primary-button full"
            onClick={() =>
              modal === "tutorial-replay" ? start({}, true) : setModal("setup")
            }
          >
            {modal === "tutorial-replay"
              ? "Begin guided garden"
              : "Configure a new beginning"}
            <Icon name="arrow" />
          </button>
          <button className="text-button full" onClick={() => setModal(null)}>
            Keep this garden
          </button>
        </Modal>
      )}
      {!modal && draft && (
        <Modal
          title="Evolve your experiment."
          className="upgrade-modal"
          dismissible={false}
          onClose={() => {}}
        >
          {guided && t.step === "upgrade" && (
            <MossCompanion
              expression="curious"
              text="Choose a new way to grow."
            />
          )}
          <UpgradeChoices
            run={run!}
            onChoose={(upgrade) => play({ type: "upgrade", upgrade })}
          />
        </Modal>
      )}
      {!modal && finished && (
        <Modal
          title="Cultivation complete."
          className="results-modal"
          onClose={() => controller.home()}
        >
          <MossArt
            expression={challengeComplete(run!) ? "surprised" : "happy"}
          />
          <span className="eyebrow">
            {run!.score >= view.data.best ? "Personal best" : "Garden archived"}
          </span>
          <div className="final-score" data-testid="final-score">
            {number(run!.score)}
            <small>points</small>
          </div>
          {run!.score < view.data.best && (
            <p className="result-record">
              Personal best {number(view.data.best)} ·{" "}
              {number(view.data.best - run!.score)} to match
            </p>
          )}
          <div className="result-highlights">
            <span>
              <b>{run!.stats.bestChain}</b> best chain
            </span>
            <strong data-testid="biomass-earned">
              +{earned?.biomass ?? 0} Biomass
            </strong>
          </div>
          <p className="result-moss">
            {t.status === "active" && t.step === "research"
              ? "Your garden just funded the next experiment."
              : run!.stats.bestChain >= 5
                ? "That chain had roots."
                : "A good beginning. Let’s grow another."}
          </p>
          {!!earned?.discoveries.length && (
            <div className="result-discoveries">
              {earned.discoveries.map((id) => (
                <span key={id}>{mutationDefinition(id).name}</span>
              ))}
            </div>
          )}
          <button className="primary-button full" onClick={again}>
            Play again <Icon name="arrow" />
          </button>
          <button className="secondary-button full" onClick={lab}>
            Research your next experiment · {view.data.profile.biomass} Biomass
          </button>
          <button
            className="text-button full"
            onClick={() => setModal("setup")}
          >
            Change protocol or seeds
          </button>
          <details className="expanded-statistics">
            <summary>Run details</summary>
            <p>
              {run!.stats.harvested} harvests · {run!.stats.bestTurn} best turn
              · {run!.stats.overloads} overloads
            </p>
            <p>
              Seed {run!.seed} ·{" "}
              {PROTOCOLS.find((p) => p.id === run!.config.protocol)?.name}
            </p>
            {run!.config.challenge && (
              <p>
                {challengeComplete(run!)
                  ? "Containment complete · +6 Biomass included"
                  : `Containment target: ${BALANCE.challengeTarget} + one overload`}
              </p>
            )}
            <button
              className="text-button"
              onClick={() => {
                controller.replay();
                setOffer(0);
                setMode("plant");
                setInspected(null);
              }}
            >
              Replay this seed
            </button>
          </details>
        </Modal>
      )}
    </div>
  );
}
