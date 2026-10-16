import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { PLANTS } from "../engine/plants";
import { PLANT_KINDS } from "../engine/types";
import { PlantArt } from "./PlantArt";
import { Icon } from "./Icons";
export function Modal({
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
export function FieldGuide() {
  return (
    <>
      <p className="modal-intro">
        Six living systems. Learn what to preserve, and what to release.
      </p>
      <div className="guide-rules">
        <strong>One action. One turn.</strong>
        <p>
          Choose one of three seeds and tap an empty plot, or switch to Harvest
          select a plant and confirm its reaction preview. All three seed
          choices refresh after either action. Every remaining plant then grows
          by one stage, up to ripe (3).
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
