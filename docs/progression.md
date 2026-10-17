# Wave 2 progression

## Research economy

Completion earns 8 Biomass, plus `min(6, floor(score / 150))`, plus `min(2, floor(bestChain / 4))`. Containment success (900 points and an overload) adds 6. A mutation's first lifetime discovery earns 3 immediately, including in an eventually abandoned garden. There is no reward for merely restarting. Discovery IDs and completed-run IDs have separate lifetime ledgers, so trimming the visible history to 100 entries cannot allow a repeated reward.

Research costs 8–16. Even a score-zero completed first run can buy an entry node. A fixed aggressive simulation campaign purchases all ten nodes by run 7; this is a policy example, not a promised player pace. Once researched, content remains available, but protocols, two optional specimen slots and random three-card drafts still require choices. Purchases do not change an active run's eligibility snapshot.

| Branch    | Research          | Cost | Dependencies                     | Actual unlock                                                      |
| --------- | ----------------- | ---: | -------------------------------- | ------------------------------------------------------------------ |
| Specimens | Mycology          |    8 | —                                | Mushroom; Fungal Rose and Mirror Cap contexts                      |
| Specimens | Xerophytes        |    8 | —                                | Cactus; Volatile Thorns context                                    |
| Specimens | Lunar tissue      |   12 | Mycology                         | Moonflower seed option                                             |
| Specimens | Briar culture     |   12 | Xerophytes                       | Briar seed option                                                  |
| Genetics  | Tissue grafting   |   10 | Mycology                         | Cross-Pollination; Cooling Tissue and Lunar Graft contexts         |
| Reactions | Root mapping      |    8 | —                                | Root Network draft eligibility                                     |
| Reactions | Echo technology   |   12 | Root mapping + Mycology          | Echo Harvest and Neural Mycelium drafts                            |
| Reactions | Reactor tuning    |   12 | Xerophytes                       | Volatile Sap, Critical Bloom, Resonant Petals, Volatile Experiment |
| Protocols | Living lattice    |   12 | Tissue grafting                  | Symbiotic Growth protocol                                          |
| Protocols | Containment trial |   16 | Reactor tuning + Echo technology | Advanced sealed-corner challenge                                   |

## In-run experiments

Three unique eligible choices appear after turns 5/10/15/20. Choose one; all upgrades last until run end and cap at one copy. Already installed or conflicting choices never appear. A separate seeded RNG stream supplies drafts. Even the unresearched pool has seven choices; after three picks at least three eligible choices remain. Adaptive Tissue is incompatible with Cross-Pollination. All other combinations can coexist.

| Experiment              | Family               | Timing and exact effect                                                                                                                                                                                                                               |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accelerated Cultivation | Growth               | Planted Sunflowers/Wildflowers start +1 stage, stacking with automatic dew. Spreading is unaffected.                                                                                                                                                  |
| Spore Replication       | Growth               | First harvested Mushroom/Wildflower per action sows its own kind in first empty N/E/S/W neighbor. One extra spawn, no effect if space is unavailable.                                                                                                 |
| Resonance Bloom         | Chain                | Each third harvest in one action adds 10 points. Counts harvests, not activation messages.                                                                                                                                                            |
| Genetic Scanner         | Utility              | Reveal the first next-hand seed through a pure peek. It cannot predict beyond a future recycler draw, and shows no next hand on the final turn.                                                                                                       |
| Emergency Pruning       | Utility              | Two charges granted at installation. Remove selected plant, no score/ability; cool 8; costs one turn and triggers normal growth/offer refresh.                                                                                                        |
| Seed Recycler           | Utility              | One charge at installation. Pay 1 dew to redraw one offer from the current pool. No turn, growth, mutation phase or full-hand refresh. Same seed is possible.                                                                                         |
| Adaptive Tissue         | Mutation             | Up to two distinct contextual traits per plant; still at most one new trait per plant per action. Conflicts with Cross-Pollination.                                                                                                                   |
| Root Network            | Growth, researched   | Directed growth relays through connected plants, each plant at most once per action. Seasonal growth never relays. Ripe plants can relay without gaining a stage.                                                                                     |
| Echo Harvest            | Chain, researched    | Repeat the first harvested plant's ability once per action. No extra score or trait payload repetition. Target IDs and activation guards still apply.                                                                                                 |
| Neural Mycelium         | Chain, researched    | A Mushroom copying Rose/Briar activation also reaches the first occupied neighbor beyond each direct target. One extra hop, with normal guards.                                                                                                       |
| Cross-Pollination       | Mutation, researched | After contextual mutations, first row-major donor transfers its first trait to the first orthogonal different species with room. One transfer/action, +4 heat. Resonant Petals transfers only to Rose/Briar/Mushroom. Conflicts with Adaptive Tissue. |
| Volatile Sap            | Reactor, researched  | Chain score adds `floor(heat/20) × min(3, depth)`. Every harvest adds 2 extra heat, including roots.                                                                                                                                                  |
| Critical Bloom          | Reactor, researched  | Depth 2+ harvests add 12 points and 4 heat. If any qualify, remove the first surviving N/E/S/W neighbor of the action root once after the queue. No harvest effect from collateral.                                                                   |

Repeated abilities do not recursively schedule repeats. Trait payloads execute once per harvested plant; Mirror Cap and Lunar Graft append finite additional abilities. The root network, activation and harvest guards are scoped to an action.

## Ten mutations

All require ripe tissue. Normal cap one, Adaptive cap two. Resolve after chain/collateral, before any overload. Priority follows the table, then row-major plot order. A new trait cannot add another contextual trait to the same plant in that action. Once acquired, traits are composable independently of carrier species; Cross-Pollination can transfer them. Precise rules are hidden in the in-game catalogue until discovery, while this design document intentionally records them.

| Trait           | Context                                                                       | Mechanical effect                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fungal Rose     | Rose beside Mushroom; Mycology                                                | Its harvest also activates four valid diagonal plots.                                                                                                          |
| Charged Bloom   | Sunflower remains beside Rose/Briar through two end-of-action exposure checks | Harvest +2 dew and +3 heat. Exposure is cumulative and capped at two.                                                                                          |
| Volatile Thorns | Cactus at 50+ heat; Xerophytes                                                | Harvest activates first occupied orthogonal neighbor; +4 heat.                                                                                                 |
| Symbiotic Crown | Clover beside at least three distinct species                                 | While ripe, adjacent harvests add 8 points. Its harvest cools 6 extra heat.                                                                                    |
| Wandering Roots | Wildflower beside at least two empty unsealed plots                           | Harvest sows one extra Wildflower; +4 heat.                                                                                                                    |
| Mirror Cap      | Mushroom beside at least two distinct species; Mycology                       | Repeat its harvest ability once; +5 heat.                                                                                                                      |
| Cooling Tissue  | Any plant beside at least two Clovers/Moonflowers; Tissue grafting            | Harvest cools 12.                                                                                                                                              |
| Deep Roots      | Plant at least five actions old beside two empty plots                        | Harvest adds a growth pulse to its existing neighbors.                                                                                                         |
| Resonant Petals | Rose/Briar beside Clover at 25+ heat; Reactor tuning                          | Outgoing catalyst activation starts two depth steps ahead instead of one, increasing combo/heat. Additional Fungal Rose diagonal pulses remain one depth step. |
| Lunar Graft     | Beside Moonflower and a traited different species; Tissue grafting            | Harvest also copies the first adjacent non-Mushroom ability, sampled before removal.                                                                           |

Each trait has a catalogue clue, discovery name, explicit effect, distinct tissue color and board mark. Names supplement color in accessible plot labels and the forecast. Mutation snapshots drive transformation playback. First reveals can be dismissed immediately; Skip playback is always available during the event sequence.

## Save migration and integrity

Envelope and run schemas are version 2; the IndexedDB database/store remain unchanged. Version-1 saves are explicitly migrated. Preserve board, offers, RNG, score, turns, settings and history. Existing players receive Mycology/Xerophytes as zero-cost legacy grants to retain their original six-species access. Archived completions receive the new normal completion payout once during migration; they are immediately entered in the lifetime ledger. The ordered legacy six-species pool is preserved. Past drafts are skipped; the next future milestone starts upgrades for an interrupted legacy garden. A fresh replay uses all four draft milestones.

A strict decoder validates dimensions, IDs, counters, known content, locked pool membership, compatible upgrades, draft phase, dependencies, unique rewards, legacy grant conditions and the economy equation: earned = completed payouts + 3 × unique discoveries; balance = earned − exact purchase costs. Save writes are atomic and serialized. Invalid/unknown data is left untouched; the UI explains that only in-memory play is available. This prevents accidental corruption, not deliberate browser-local save editing by its owner.
