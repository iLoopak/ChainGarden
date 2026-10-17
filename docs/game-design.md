# Chain Garden — rules through Wave 3

## Direction

A tactical, turn-based biopunk garden. The matrix is the main play surface. Nothing advances while the player considers a move. The core remains plant → grow → combine → harvest → chain → adapt. A run has 25 actions; four intervening upgrade decisions spend no turns. Keeping productive tissue alive competes with collecting points and controlling heat.

## Starting a cultivation

Choose Standard Cultivation, or a researched protocol. The seed pool always contains Sunflower, Rose, Clover and Wildflower. Add zero, one or two researched specimens: Mushroom, Cactus, Moonflower or Briar. Every offer is uniform with replacement across this selected pool. Duplicates are intentional. Optional species increase tactical variety while reducing the frequency of each existing species.

Standard starts with C3 Sunflower stage 2, C4 Rose stage 1, D4 Clover stage 2, zero dew and zero heat. Volatile Experiment adds D3 Rose stage 2, starts at 30 heat and adds 2 heat to every harvest. Symbiotic Growth adds B3 Clover stage 2 and C2 Clover stage 1; directed growth reaching a Clover relays to its neighbors once per plant per action. Containment Trial seals A1/F1/A6/F6 and starts at 45 heat, overriding the protocol's starting heat. Its optional objective is 900 points and at least one overload; success adds 6 Biomass. Failure still completes and earns normal rewards.

The seed, ordered pool, research snapshot, protocol, challenge, two RNG states and chosen actions determine the run. Seeds use a 32-bit LCG; a separate stream supplies upgrade drafts. Looking at a forecast or scanner never consumes randomness. Replays preserve the original research eligibility, protocol and ordered seed pool, even after further research. First-discovery presentation/rewards reflect the player's current collection.

## Exact action order

1. If a draft is pending, choose one of its three upgrades before another action. Installation costs no turn and does not grow plants, refresh seeds or advance the seed RNG.
2. Otherwise plant an offered seed in an empty, unsealed plot; harvest any existing plant; use a researched-in-run pruning charge; or vent for 3 dew when heat is above zero. These consume one turn. An installed Seed Recycler can instead exchange one offer for 1 dew once per run, spending no turn and causing no growth; the replacement can match the original.
3. A planted seed starts at stage 0. Automatically spend 1 dew if available for +1 stage. Accelerated Cultivation adds another stage for Sunflower/Wildflower. A charged planting starts ripe instead; it still spends one dew if available. The selected harvest scores and removes its plant before seasonal growth. Pruning removes without score or harvest effects and cools 8. Venting cools 15.
4. Every surviving plant, including a newly planted seed, grows by 1 up to ripe stage 3. Each now-ripe Sunflower banks 1 dew, capped at 9.
5. Resolve queued abilities in FIFO order, visiting north/east/south/west. Each event stores the expected plant ID. Activations grow a young plant by 1 and harvest it if now ripe. A plant can activate and harvest at most once per action. Newborns cannot chain-harvest in their birth action. Ordinary directed growth does not harvest.
6. Critical Bloom may remove one surviving neighbor of the action's root. Resolve contextual mutations in row-major and registry order, at most one new contextual trait per plant. Cross-Pollination then transfers at most one trait and adds 4 heat. Traits persist until their plant is removed. Normal capacity is one; Adaptive Tissue raises it to two.
7. If heat reached 100 at any point, resolve one latched overload after the chain and mutations. Later cooling does not cancel it. Complete all effects of action 25 before finishing; there is no automatic final harvest.
8. After a non-final turn, replace all three seed offers. After turns 5, 10, 15 and 20, generate three eligible, unique upgrade choices and save them. The garden waits for the choice. Offers and drafts are independent RNG streams.

One-shot rewards and the full resolved state are committed together before visual playback. Skipping visuals changes no rules. Reload restores the resolved garden and a pending draft without replaying rewards.

## Specimens

All normal adjacency is orthogonal; board edges and sealed plots never count as empty soil. Plant artwork is local SVG, with distinct silhouettes, growth nodes and trait-colored tissue marks.

| Specimen   | Base | Ability and decision                                                                                                                                                                                    |
| ---------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sunflower  |    8 | While ripe, +1 dew each seasonal phase. Harvest: +2 dew and grow neighbors. Keep it for production or consume it to accelerate nearby tissue.                                                           |
| Rose       |   12 | Harvest activates all existing neighbors. Position a catalyst at the intersection of future chains.                                                                                                     |
| Clover     |    6 | While ripe, adjacent harvests gain +25%. Harvest cools 6 heat and grows neighbors. Cooling sacrifices its aura.                                                                                         |
| Wildflower |    9 | Harvest grows current neighbors, then sows a stage-0 Wildflower in the first empty neighbor. Queued growth cannot target the newborn's new ID.                                                          |
| Mushroom   |   10 | Harvest copies the first adjacent non-Mushroom ability N/E/S/W. Its own base/stage score is retained; copying Cactus also applies the space bonus. It never copies passive production or passive auras. |
| Cactus     |   14 | +20% harvest score per actual adjacent empty plot. Clear neighbors first, or preserve connections.                                                                                                      |
| Moonflower |    8 | Harvest cools 12 heat and grows neighbors. A cooling reserve consumes a seed-pool slot.                                                                                                                 |
| Briar      |   15 | Activates like Rose and adds 6 heat through its ability. A stronger catalyst increases overload exposure.                                                                                               |

## Scoring and reactor

At each individual harvest:

```text
base harvest = floor(specimen base × (1 + .5 × growth)
                   × min(3, 1 + .25 × depth)
                   × (1 + .25 × ripe Clover neighbors + .20 × empty Cactus neighbors))
add 8 per ripe neighboring Symbiotic Crown
add floor(heat / 25), capped at tier 3, × 3 × depth
add installed upgrade bonuses
```

Root depth is zero. Every third harvest with Resonance Bloom adds 10. Critical Bloom adds 12 at depth 2+. Volatile Sap adds `floor(heat / 20) × min(3, depth)` on chain harvests. Heat is sampled before that harvest's heat increase. Clover auras and empty-space counts use the actual board at that event, so harvest order matters. An unmodified line of three ripe Roses still scores 30 + 37 + 45 = 112 at low heat.

Each harvest adds `2 + 3 × depth` heat; Volatile protocol and Volatile Sap each add 2 more. Briar, traits and Critical Bloom add the explicitly described extra heat. Heat clamps to 0–100. Stable is 0–24, Reactive 25–49, Volatile 50–74, Critical 75–99; higher tiers increase chain scoring and unlock contextual mutations. Cooling never falls below zero.

An overload removes at most three surviving plants from `[root, north, east, south, west]`, skipping empty plots. No harvest effects or chains arise from destruction. Gain 20 + 5 points per destroyed plant, up to 3 dew and two charged plantings (bank capped at four). Heat resets to 35. It can clear an inconvenient footprint or spare a region already emptied by a successful chain. The forecast includes exact heat, collateral cells and overload compensation; the log records causes.

## Progression and discoveries

See [progression.md](progression.md) for all 13 upgrades, ten research nodes, ten trait contexts and the economy. Upgrades have a single-copy cap. Adaptive Tissue and Cross-Pollination conflict in both directions. All other combinations are allowed and bounded. Research is horizontal: no permanent global score increases.

A first trait discovery immediately adds its catalogue entry and 3 Biomass, once for the profile. Unknown entries expose a clue and silhouette, with their precise prerequisite/effect hidden. The first reveal shows the actual plant, trait, effect and reward. Ordinary traits do not mutate merely from elapsed wall-clock time.

## Termination, controls and accessibility

The resolver uses a FIFO queue, unique plant IDs, per-action activation/harvest/relay guards, single-use repeat effects and a final 1,024 pending-event bound. A diagnostic event reports truncation. Dense traited-chain tests and the simulation survey verify ordinary content stays below it. Empty gardens can plant; full gardens can harvest; drafts have legal choices; turn 25 has a clear completed state.

Touch/mouse: select a seed then an empty plot. Select any plant, inspect its full reaction forecast, then confirm. H selects harvesting; 1–3 select seeds; P pauses; Escape cancels a forecast before pausing. Utility buttons explain their turn/dew costs. Pruning requires a second explicit removal confirmation. The guide, lab, setup and drafts use keyboard-accessible dialogs. Reduced motion removes idle and transformation animation; Skip playback immediately presents the authoritative outcome. Sound is optional and off by default.

Portrait layouts keep the matrix and three seed choices together at common phone heights; long explanations, utilities, collection and research scroll below. There is no timer, energy system, daily requirement, account or remote dependency.

## Wave 3 experience layer

The plant, progression, scoring, heat and turn rules above remain unchanged. M.O.S.S. and the first-cultivation state machine live outside the engine. A new player's seed-16 guided garden uses the ordinary initial board, real offers and normal transitions. It teaches through two plantings and a confirmed three-plant chain, then introduces the real draft and earned research later. Completion requires the full run reward and Lab visit, not elapsed turns. Skip/replay/save-resume and schema-1/2 migration preserve the progression ledger.

The UI now uses one compact HUD, direct tap-to-inspect harvesting, a three-specimen hand and details on demand. The Field Guide is a cabinet, research a compact branch inspector, and results separate primary rewards from optional statistics. M.O.S.S. reacts to actual events without random messages or covering the grid. Long visual playback scales to about 6.5 seconds and remains skippable. See [UX guidelines](ux-guidelines.md) and [art direction](art-direction.md).
