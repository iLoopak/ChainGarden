import type { GameState } from "./types";
/** Balance knobs are shared by the resolver, economy and simulation harness. */
export const BALANCE = {
  turns: 25,
  maxEvents: 1024,
  maxDew: 9,
  milestones: [5, 10, 15, 20],
  heatBase: 2,
  heatDepth: 3,
  tierDepthPoints: 3,
  volatileDivisor: 20,
  volatileDepthCap: 3,
  volatileHeat: 2,
  overloadReset: 35,
  overloadDamage: 3,
  overloadScore: 20,
  overloadPerPlant: 5,
  overloadDew: 3,
  overloadSeeds: 2,
  stabilizeCost: 3,
  stabilizeCooling: 15,
  pruneCooling: 8,
  discoveryBiomass: 3,
  completionBiomass: 8,
  scoreStep: 150,
  scoreBiomassCap: 6,
  challengeBiomass: 6,
  challengeTarget: 900,
} as const;
export const reactorTier = (heat: number) =>
  ["Stable", "Reactive", "Volatile", "Critical", "Overload"][
    Math.min(4, Math.floor(heat / 25))
  ];

export const challengeComplete = (
  run: Pick<GameState, "config" | "score" | "stats">,
): boolean =>
  run.config.challenge &&
  run.score >= BALANCE.challengeTarget &&
  run.stats.overloads > 0;
