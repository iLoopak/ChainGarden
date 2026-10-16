# Chain Garden — Wave 1 design

## Intent

Variant A is locked: a tactical turn-based garden inside a living, experimental biopunk greenhouse. The game waits for the player; no clock, idle production or background automation advances the simulation. A run takes 25 deliberate actions, ideally 3–5 minutes. The tension is between keeping productive plants and collecting their value. A sunflower or clover can be worth more alive; a rose turns that investment into a cascade.

The board is the centerpiece. A compact cultivation tray uses forest charcoal, moss, warm stone and high-contrast botanical light. Amber pollen, lime scoring nodes, coral rose tissue and orchid spores identify roles; light is strongest when an actual event triggers. The start menu sits inside the matrix rather than beside a decorative marketing board. Every species has an original local SVG silhouette. Growth dots, explicit labels and descriptions supplement color. No emoji plant art or remotely loaded visual assets.

## Board and initial state

A 6×6 orthogonal grid. Coordinates are A–F, 1–6. New runs begin with a stage-2 sunflower at C3, a stage-1 rose at C4 and a stage-2 clover at D4. Everything else is empty. Initial score and dew are zero. The opening makes preserving or harvesting an engine meaningful immediately without awarding free points.

A seeded 32-bit linear congruential generator supplies three independent plant offers, drawn uniformly with replacement. Duplicate choices are intentional variance. The RNG state is saved and advanced only when drawing offers. A replay seed reproduces the initial board and offers; the same actions reproduce every subsequent state and event. Run IDs are independent of seeds so replaying is a new journal entry.

## An action costs exactly one turn

1. Choose one offered seed and an empty plot, or select a plant to harvest at any growth stage, inspect the exact reaction forecast, then confirm **Release reaction**. Selection and cancellation do not spend a turn. Seeds cost no currency. An occupied plot in Plant mode opens inspection; it never silently harvests.
2. Planting creates stage 0. If any dew is banked, automatically spend exactly 1 to start at stage 1. A root harvest removes and scores the chosen plant at its current stage, then queues its ability.
3. All plants still on the board grow by 1, capped at stage 3. A new planted seed participates; a harvested root does not.
4. Every now-ripe sunflower banks 1 dew, capped at 9 total. No dew over the cap is earned. Neighbors grown to ripe later by abilities begin producing on the next action.
5. Resolve queued abilities and their child events breadth first. Each ability visits neighbors north, east, south, west.
6. Record the score, stats and turn. If fewer than 25 turns have been used, replace **all three** offers, regardless of which action was chosen. Unused seeds are discarded for free.
7. After action 25 the run finishes. Resolve that entire action and chain first. There is no bonus harvest of plants left standing. The last visible seed offers are inactive.

The current stage and seed cost are always predictable. A root harvest preview includes current clover and cactus bonuses; chain harvests reflect the actual board when their event resolves. Future adjacent harvests can remove scoring auras or create empty cactus neighbors.

## Plants

All adjacency is orthogonal. Board edges are not empty tiles.

| Plant      | Base score | Exact ability                                                                                                                                                                                                                                                                                    | Strategic role                                                                                                                                           |
| ---------- | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sunflower  |          8 | Ripe: bank 1 dew each seasonal growth phase. Harvest: bank 2 dew, then grow all existing neighbors by 1.                                                                                                                                                                                         | Persistent growth economy; harvesting sacrifices future production.                                                                                      |
| Rose       |         12 | Harvest: enqueue activation for every current neighbor. Activation grows it by 1 if young; if ripe afterward, enqueue its harvest.                                                                                                                                                               | Chain catalyst. A stage-1 neighbor reaches stage 2 seasonally, then ripens from activation.                                                              |
| Mushroom   |         10 | Harvest: inspect neighbors N/E/S/W before removal; copy the first non-mushroom's harvest ability. With no compatible neighbor, only score. Cactus copy applies its empty-space scoring bonus to the mushroom's own base and stage. Passive sunflower production and clover auras are not copied. | Position-sensitive echo; a copied rose can extend a chain.                                                                                               |
| Cactus     |         14 | Its harvest scores an additional 20% per currently empty adjacent tile. No outgoing growth event.                                                                                                                                                                                                | Spacing and harvest-order puzzle.                                                                                                                        |
| Clover     |          6 | Ripe: each adjacent harvest gets +25%. Harvest: grow all current neighbors by 1.                                                                                                                                                                                                                 | Scoring engine with an opportunity cost when removed.                                                                                                    |
| Wildflower |          9 | Harvest: enqueue +1 growth for existing neighbors, then sow one stage-0 wildflower at the first empty N/E/S/W neighbor, if any.                                                                                                                                                                  | Rebuilds production after collection. Newly sown flowers do not receive that harvest's queued growth and cannot chain-harvest during their birth action. |

Growth abilities alone never harvest a ripe plant. Rose activation is the only automatic harvest trigger. Effects captured by the queue carry target plant IDs, so removing/replacing a plant cannot redirect an old event to a new occupant.

## Scoring

For each individual harvest:

```text
stage factor = 1 + 0.5 × stage                 // 1, 1.5, 2, 2.5
chain multiplier = min(3, 1 + 0.25 × depth)   // root depth = 0
synergy factor = 1 + 0.25 × ripe clover neighbors
                  + 0.20 × empty neighbors   // cactus or mushroom copying cactus only
points = floor(base × stage factor × chain multiplier × synergy factor)
```

Clover and space bonuses add within the synergy factor. Round down once per harvested plant. Chain depth counts ability propagation, not total plants collected. A line of three ripe roses harvested from one end yields 30 + 37 + 45 = 112. Chain size counts all harvested plants including the root; the summary records best chain size, best turn score, harvested species and dew actually banked.

There is no monetary reward, unlock or external economy. Personal best updates only after a completed run. The score bar shows the stored best completed run independently from the current score.

## Chain termination and fairness

The explicit queue is FIFO. Each plant ID may activate and harvest at most once per action. Harvest always removes its plant. Mushrooms never copy mushrooms. New wildflowers cannot be chain-harvested in the action where they were born. At most 256 pending events execute; a visible safety event reports truncation if ever reached. A fully ripe 36-rose board resolves completely below the limit. Repeated triggers skip already processed targets.

An empty board has 108 legal plant actions. A full board has 36 legal harvest actions. There is always an action before turn 25. No automatic loss condition or hidden deadlock exists.

## Feedback and accessibility

Logic resolves immediately, then presentation replays the actual event queue: planting, seasonal growth, resources, copying, directed growth, activations, harvests and spreading. Each event carries its specimen snapshot so stages and replacements appear exactly when they happen. Seasonal growth shares one visual frame; directed growth remains sequential. Score and combo counters rise with individual harvests rather than jumping to the final total before the chain begins. Controls lock during playback to prevent duplicate actions. The journal preserves the turn's causal sequence. Directed SVG energy links show the actual event source and target. Numbered forecast targets, harvest release ghosts, point bursts, a temporary mushroom echo reveal, charged growth nodes and selected seed checks explain state without relying solely on color. No visual mutation changes a plant’s rules: the echo reveal means Mushroom is copying an ability for this harvest only.

Reduced motion removes idle movement and transition timing; event details remain available. Native modal dialogs trap focus and support Escape. Board and seed buttons have descriptive accessible labels. Sound is optional and off by default. No timers pressure the player.

## Deliberate Wave 1 boundaries

One mode, one board size, six species, no consumable purchases, no undo, no backend. Balance is initial design rather than statistically tuned. Random offers are not guaranteed unique or equally valuable. Progression, challenges and broader device testing belong in Wave 2.

## Board-first decisions

The HUD shows score, remaining turns, spent turns and dew next to the matrix. Three specimen cards expose roles and abilities. Selecting a plant in either mode invokes the same pure resolver as committing it, without advancing state: the forecast lists the full score, harvest count, peak scoring depth and ordered targets. Forecast routes omit passive global growth so they show causal relationships rather than connecting every plot. On portrait screens a compact confirmation tray keeps the commit button accessible without covering the main board at standard phone heights.

The turn phase strip is presentation only. Act → Grow → React → Your turn never runs until a legal action is committed. Screen space previously spent on editorial headings and an advice column is assigned to the matrix. The journal is collapsible and secondary to direct board feedback.
