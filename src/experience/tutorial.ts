import type { Action, GameState, Resolution } from "../engine/types";
export const TUTORIAL_SEED = 16;
export const TUTORIAL_STEPS = [
  "plant",
  "grow",
  "connect",
  "harvest",
  "reactor",
  "explore",
  "upgrade",
  "finish",
  "research",
  "done",
] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];
export const PROOFS = [
  "planted",
  "grown",
  "connected",
  "chain",
  "heat",
  "upgrade",
  "reward",
] as const;
export type Proof = (typeof PROOFS)[number];
export interface TutorialProgress {
  status: "available" | "active" | "skipped" | "complete";
  step: TutorialStep;
  runId: string | null;
  proof: Proof[];
}
export const newTutorial = (): TutorialProgress => ({
  status: "available",
  step: "plant",
  runId: null,
  proof: [],
});
export const beginTutorial = (runId: string): TutorialProgress => ({
  status: "active",
  step: "plant",
  runId,
  proof: [],
});
export const skipTutorial = (p: TutorialProgress): TutorialProgress => ({
  ...p,
  status: "skipped",
  step: "done",
});
export function tutorialActionAllowed(
  t: TutorialProgress,
  action: Action,
): boolean {
  if (t.status !== "active") return true;
  switch (t.step) {
    case "plant":
      return (
        action.type === "plant" && action.index === 8 && action.offer === 0
      );
    case "connect":
      return (
        action.type === "plant" && action.index === 15 && action.offer === 0
      );
    case "harvest":
      return action.type === "harvest" && action.index === 20;
    case "grow":
    case "reactor":
    case "research":
      return false;
    default:
      return true;
  }
}
export function advanceTutorial(
  t: TutorialProgress,
  action: Action,
  result: Resolution,
  rewarded: boolean,
): TutorialProgress {
  if (t.status !== "active" || t.runId !== result.state.id) return t;
  const next = structuredClone(t),
    events = result.events;
  const proof = (id: Proof) => {
    if (!next.proof.includes(id)) next.proof.push(id);
  };
  if (
    t.step === "plant" &&
    action.type === "plant" &&
    action.index === 8 &&
    events.some(
      (e) => e.type === "planted" && e.index === 8 && e.kind === "sunflower",
    ) &&
    events.some((e) => e.type === "growth")
  ) {
    proof("planted");
    proof("grown");
    next.step = "grow";
  } else if (
    t.step === "connect" &&
    action.type === "plant" &&
    action.index === 15 &&
    events.some(
      (e) => e.type === "planted" && e.index === 15 && e.kind === "rose",
    )
  ) {
    proof("connected");
    next.step = "harvest";
  } else if (
    t.step === "harvest" &&
    action.type === "harvest" &&
    action.index === 20 &&
    result.chain >= 3 &&
    events.some((e) => e.type === "heat" && (e.heat ?? 0) > 0)
  ) {
    proof("chain");
    next.step = "reactor";
  } else if (t.step === "explore" && result.state.pendingUpgrade.length === 3)
    next.step = "upgrade";
  else if (
    t.step === "upgrade" &&
    action.type === "upgrade" &&
    events.some((e) => e.type === "upgrade")
  ) {
    proof("upgrade");
    next.step = "finish";
  }
  if (
    next.step === "finish" &&
    result.state.status === "finished" &&
    rewarded
  ) {
    proof("reward");
    next.step = "research";
  }
  return next;
}
export function acknowledgeTutorial(
  t: TutorialProgress,
  run: GameState | null,
): TutorialProgress {
  if (t.status !== "active" || !run || run.id !== t.runId) return t;
  if (t.step === "grow" && t.proof.includes("grown"))
    return { ...t, step: "connect" };
  if (t.step === "reactor" && t.proof.includes("chain") && run.instability > 0)
    return { ...t, step: "explore", proof: [...t.proof, "heat"] };
  return t;
}
export function visitTutorialLab(
  t: TutorialProgress,
  rewardIds: string[],
): TutorialProgress {
  return t.status === "active" &&
    t.step === "research" &&
    t.runId &&
    rewardIds.includes(t.runId) &&
    PROOFS.every((p) => t.proof.includes(p))
    ? { ...t, status: "complete", step: "done" }
    : t;
}
export function tutorialTarget(t: TutorialProgress): number | null {
  if (t.status !== "active") return null;
  return t.step === "plant"
    ? 8
    : t.step === "grow"
      ? 14
      : t.step === "connect"
        ? 15
        : t.step === "harvest"
          ? 20
          : null;
}
export const TUTORIAL_COPY: Partial<
  Record<TutorialStep, { text: string; hint: string }>
> = {
  plant: {
    text: "Every experiment starts with a seed.",
    hint: "Sunflower → C2",
  },
  grow: {
    text: "Each turn, your garden evolves.",
    hint: "Sunflower: 3 nodes = ripe",
  },
  connect: {
    text: "Neighbors can change everything.",
    hint: "Rose → D3 · beside the ripe Clover",
  },
  harvest: {
    text: "Now watch what happens.",
    hint: "Rose at C4 → Release reaction",
  },
  reactor: {
    text: "Big reactions wake the reactor.",
    hint: "Lasting heat · Clovers cool it",
  },
  upgrade: {
    text: "Choose a new way to grow.",
    hint: "One experiment, yours for this run.",
  },
  research: {
    text: "Your garden just funded the next experiment.",
    hint: "Biomass → Research Lab",
  },
};
