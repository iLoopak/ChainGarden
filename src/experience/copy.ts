import type { UpgradeId } from "../engine/types";
export const UPGRADE_COPY: Record<UpgradeId, string> = {
  accelerated: "Sunflowers & Wildflowers start +1 growth.",
  replication: "First Mushroom or Wildflower harvest sows another.",
  resonance: "Every third harvest in a chain: +10 points.",
  scanner: "See the first seed of the next hand.",
  pruning: "2 removals: −8 heat, no score. 1 turn each.",
  recycler: "Reroll one seed: 1 dew, no turn. Once per run.",
  adaptive: "Up to 2 traits per plant. No Cross-Pollination.",
  network:
    "Connected tissue shares directed growth, once per plant per action.",
  echo: "First harvest repeats its ability once; no extra score.",
  neural: "Copied activation reaches one hop further.",
  pollination: "Share 1 trait each turn. +4 heat. No Adaptive Tissue.",
  volatile: "Chains: +floor(heat/20) × depth (max 3). +2 heat per harvest.",
  critical: "+12 points, +4 heat at depth 2+. One nearby loss per chain.",
};
