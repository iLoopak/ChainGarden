# Wave 2 balance report

Generated from `npm run simulate`; full measurements are in [simulation-results.json](simulation-results.json). Fixed seed set, deterministic policy RNG, no live telemetry.

## Method

1,304 complete games: 600 survey games (60 seeds × five strategies × starter/fully researched profiles), 60 Containment Trials, 624 matched single-upgrade ablation games (13 × 24 seeds × two arms), and a 20-run persistent research campaign. All survey/trial games completed; no safety truncation occurred.

Random selects a legal action. Conservative grows before harvesting, avoids collateral and vents at 65 heat. Aggressive favors compact catalyst groups and large chains. Mutation favors varied neighbors and longer maturation. Instability values hot outcomes/overloads and selects Volatile Experiment when available. Researched policies choose different optional specimen pairs; mutation uses Symbiotic Growth. These are distinct heuristic policies, not optimal solvers. Profile/protocol/pool differences confound direct comparisons of research cohorts.

## Score and reaction survey

| Cohort / policy | Mean | P10 | Median | P90 | Max | Trait types/run | Overloads/run | First-profile Biomass |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| starter-random | 136.8 | 40 | 130 | 246 | 339 | 3.43 | 0 | 19.03 |
| starter-conservative | 660.57 | 587 | 650 | 791 | 815 | 3.15 | 0.02 | 22.42 |
| starter-aggressive | 765.55 | 636 | 761 | 924 | 1053 | 3.17 | 0.68 | 23.12 |
| starter-mutation | 742.17 | 566 | 735 | 960 | 1027 | 3.43 | 0.77 | 23.8 |
| starter-instability | 780.6 | 645 | 776 | 954 | 1053 | 3.17 | 0.78 | 23.18 |
| researched-random | 186.65 | 77 | 157 | 388 | 568 | 5 | 0.02 | 24.02 |
| researched-conservative | 705.27 | 591 | 696 | 836 | 988 | 4.78 | 0.1 | 27.6 |
| researched-aggressive | 812.65 | 663 | 812 | 976 | 1100 | 4.65 | 0.98 | 27.87 |
| researched-mutation | 773.35 | 603 | 768 | 946 | 1095 | 6.3 | 0.35 | 32.75 |
| researched-instability | 1061.33 | 913 | 1074 | 1216 | 1332 | 4.42 | 2.12 | 28.17 |
| researched-containment-aggressive | 926.08 | 787 | 912 | 1098 | 1295 | 5.12 | 1.7 | 32.9 |

The Biomass column treats each survey sample as a fresh collection, so it includes first discoveries. It is not a recurring per-run income claim. Ordinary completion is 8–16; successful challenge completion is 14–22, before new discovery rewards. Mutation events can exceed distinct trait types because many plants can acquire the same known trait.

## Instability progression

Mean end-of-action heat, with draft decisions excluded from the action count:

| Cohort / policy | Turn 5 | Turn 10 | Turn 15 | Turn 20 | Turn 25 |
| --- | ---: | ---: | ---: | ---: | ---: |
| starter-random | 0.72 | 2.63 | 5.52 | 8.22 | 12.43 |
| starter-conservative | 3.83 | 23.3 | 37.33 | 56.55 | 55.87 |
| starter-aggressive | 11.87 | 34.15 | 55.85 | 65.3 | 65.4 |
| starter-mutation | 1.27 | 12.32 | 36.7 | 64.43 | 63.63 |
| starter-instability | 11.87 | 34.35 | 56.4 | 63.38 | 62.38 |
| researched-random | 0.87 | 4.4 | 9.4 | 14.92 | 26.67 |
| researched-conservative | 3.03 | 21.3 | 32.05 | 38.87 | 34.77 |
| researched-aggressive | 13.03 | 40.28 | 59.42 | 59.6 | 60.52 |
| researched-mutation | 3.03 | 11.32 | 27.28 | 41.07 | 40.78 |
| researched-instability | 63.75 | 53.58 | 57.4 | 54.3 | 68.65 |
| researched-containment-aggressive | 61.97 | 56.77 | 53.08 | 57.1 | 58.9 |

Lower final heat can mean an overload reset rather than safer play. The JSON also records peak heat and overload count.

## Upgrade sensitivity

Each pair uses the same 24 seeds and aggressive policy with one upgrade granted at turn zero versus no upgrade. Both arms disable milestone drafts. This isolates a policy/upgrade interaction across full runs, not the value of receiving it at turn 5/10/15/20. Normal survey draft selection frequencies and associated mean scores are also in the JSON; those observations are confounded by build/seed choice.

| Upgrade | With | Without | Mean delta |
| --- | ---: | ---: | ---: |
| accelerated | 814.63 | 799.96 | 14.67 |
| replication | 836.96 | 799.96 | 37 |
| resonance | 843.29 | 799.96 | 43.33 |
| scanner | 799.96 | 799.96 | 0 |
| pruning | 799.96 | 799.96 | 0 |
| recycler | 799.96 | 799.96 | 0 |
| adaptive | 799.38 | 799.96 | -0.58 |
| network | 795.33 | 799.96 | -4.63 |
| echo | 816.75 | 799.96 | 16.79 |
| neural | 806.25 | 799.96 | 6.29 |
| pollination | 806 | 799.96 | 6.04 |
| volatile | 859.75 | 799.96 | 59.79 |
| critical | 842.96 | 799.96 | 43 |

Scanner, pruning and recycler show zero here because this aggressive policy does not use their information or charges. That identifies a harness limitation; it does not show those upgrades are worthless. Root Network and Adaptive Tissue are sensitive to placement/timing and can change later choices rather than universally raising score. Targeted engine tests verify each ability independently.

## Tuning decisions

- Volatile Sap originally produced roughly +222 mean points in the initial matched survey. It now uses `floor(heat / 20) × min(3, depth)`, with no root bonus, while every harvest still adds 2 heat. Final matched delta is about +60. This keeps an aggressive payoff without making it a blanket root-harvest multiplier.
- The initial 600-point Containment target was achieved in all 60 aggressive trials. Raised to 900 plus one overload; 31/60 fixed-policy trials now achieve it. Failure still gives normal completion rewards. An instrumented UI run scored 2,197 with a 19-plant chain and remains successful under the final target.
- Overload destruction is capped at three local survivors. No collateral chain effects. Its 20 + 5/lost-plant score, 3 dew and two charged plantings reward planning the footprint rather than avoiding all heat.
- Completion guarantees 8 Biomass. Entry research costs 8, ensuring a finished first experiment can always unlock a new decision. Discovery rewards are small and lifetime-unique. No currency is paid for restarting.
- Four starter species and at most two optional specimens preserve recognisable early hands. Optional unlocks are chosen instead of permanently diluting every future seed draw.

## Research pacing

A deterministic aggressive campaign buys available nodes in registry order; another purchasing policy will differ.

| Run | Score | Lifetime earned | Unlocked nodes | Balance after purchases |
| --- | ---: | ---: | ---: | ---: |
| 1 | 588 | 21 | 2 | 5 |
| 2 | 815 | 35 | 3 | 7 |
| 3 | 700 | 51 | 5 | 1 |
| 4 | 642 | 64 | 6 | 6 |
| 5 | 868 | 78 | 7 | 8 |
| 6 | 881 | 95 | 9 | 1 |
| 7 | 793 | 112 | 10 | 2 |
| 8 | 764 | 126 | 10 | 16 |
| 9 | 678 | 139 | 10 | 29 |
| 10 | 719 | 152 | 10 | 42 |

The first campaign run unlocks two entry nodes with discovery income; all ten are owned by run 7. The economy intentionally permits early experimentation. Biomass accumulates after the finite research tree is complete.

## Remaining uncertainties

Volatile Experiment still has the highest raw scores in this survey; protocol-specific personal records or tighter risk tuning deserve playtests. Utility information needs a policy that plans with the scanner and uses pruning/recycling. Rare trait combinations, actual mobile session length, first-run comprehension and long-term build variety need human observation. Sixty seeds per cohort cannot establish optimality or eliminate outliers. Automated simulations do not establish that the game is fun.

Tune shared constants in `src/engine/balance.ts`, registry effects/costs in `src/engine/content.ts`, or explicit specimen rules in `game.ts`, then rerun this harness and relevant tests.
