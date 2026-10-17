# Chain Garden — interaction system

## Attention belongs to the garden

One instrument row: score, turns left and reactor. Dew sits beside the tray caption. No repeated phase strip, turn-tick ribbon, always-visible rule paragraph, pool list or website footer. The matrix and three specimen choices are primary. The narrow desktop bench holds decisions; portrait places guidance and the hand immediately below the tray.

Selecting an empty plot plants the chosen seed. Selecting an occupied plot opens the exact forecast directly; confirming is always required. There is no obligatory Plant/Harvest mode switch. H inspects a Rose/Briar, 1–3 select seeds, P pauses, Escape cancels a forecast before pausing. Arrow keys move between enabled plots without wrapping across rows. Pruning remains an explicit tool + target + confirm operation.

All important interactions have text labels or accessible names. Details are available through an explicit button/disclosure on touch, and a hover/focus tooltip on desktop. Long press is never required. The board suppresses accidental native panning while permitting pinch zoom. Selection never spends a turn. Respect user/system reduced motion and safe-area insets.

## Reusable visual vocabulary

- **Primary action:** warm seed-paper fill, dark botanical ink, asymmetric soft corners. One commit action per context.
- **Secondary action:** opaque moss fill and quiet organic border. Navigation uses a compact rounded three-destination strip.
- **Tray:** opaque stone-green rim, etched coordinates, low-contrast soil pockets. No glowing border around every instrument.
- **Selection:** amber outline for a committed harvest preview; pale mint dashed target for a guided placement. Neighbors brighten locally. Numbers show actual forecast order.
- **Resource instrument:** label + number + shape/track. Heat has tier text and 25/50/75 markings; its exact rules/recent causes are available through the instrument.
- **Experiment:** category glyph and restrained family color, concise effect, explicit Install action. Full numerical rules, conflicts, caps and synergies remain in the attached disclosure. Risk/turn/resource costs appear in the summary as well.
- **Modal:** native dialog, focus trap, explicit close and Escape. Mandatory drafts expose three genuine choices and prevent dismissal into another action.
- **Collection:** specimen cabinet + one selected inspection. Unknown mutation silhouettes reveal a clue, never undiscovered precise prerequisites. Locked plant information remains available for research planning.

System sans-serif supports readable controls and copy. Georgia is reserved for names, scores and botanical headings. Uppercase is limited to small specimen/companion identifiers; game instructions use sentence case. Tiny coordinates are nonessential technical markings, not the only source of a rule.

## M.O.S.S.

Modular Organic Support System: an old ceramic seedpod maintenance drone, copper gimbal, leaf growth and one living eye. `MossArt` is the original canonical SVG component, with neutral, curious, happy, warning and surprised expressions. Silhouette and shell remain consistent across poses. CSS float is ambient art only; messages and expressions derive from actual tutorial/resolution events.

Core lessons use one short sentence plus a terse target hint. Nonessential tips are lifetime-once per subject, normally have a four-action cooldown and expire with the next action (a first overload takes priority) and never require acknowledgment. Players can dismiss a tip or mute M.O.S.S. tips in settings. Muting does not hide essential guided instructions; Skip guide removes those constraints. Core tutorial feedback marks its subjects seen so the next turn does not repeat the same lesson.

The companion occupies a reserved bench row, never the grid, seed hit targets or confirmation button. It reacts during actual harvest/copy/mutation/heat/overload playback. Results include a short response to actual run performance. Research's tutorial welcome appears on the first completed guided Lab visit, not every visit.

## First cultivation

The tutorial is a presentation/controller state machine, not a second rule engine. Seed 16 uses the ordinary starting board and ordinary offers. No growth, point, chain, heat, unlock or currency outcome is fabricated.

1. Plant the actual offered Sunflower at C2. Observe global growth and the established C3 Sunflower becoming ripe.
2. Acknowledge the displayed growth explanation; plant the actual next Rose at D3, beside the existing Clover.
3. Inspect C4 Rose, then confirm the real three-plant chain. It scores 80 points under the normal rules; the forecast and final state must match.
4. Acknowledge the actual reactor instrument. Freely play until the engine produces a draft; choose one real upgrade.
5. Finish the full 25-turn garden. Its ordinary rewards enter the atomic ledger. Opening the Lab with that reward completes onboarding.

The core lesson takes three actual turns and two brief acknowledgments, intended for about 60–90 seconds rather than a timed promise. Upgrade and research guidance arrive only when those features actually become relevant. The tutorial never marks complete simply because turns elapsed or the user opened the Lab early.

Persist status, current step, linked run ID and evidence flags in save schema 3. Every transition checks actual action/events and that run ID. Each checkpoint can resume after reload. Skip preserves the current garden and enables ordinary play; replay from settings starts a new deterministic garden after an explicit replacement confirmation. Replays never grant a tutorial bonus: only normal completed-run and first-discovery rules apply, with existing idempotent ledgers.

Schema-1/2 players retain their current gardens/research and receive no forced tutorial midway through a run. Fresh profiles see Grow with M.O.S.S. and a clear bypass. Replay is available to all profiles.

## Feedback and pacing

The engine still resolves fully before visual playback. Each visible change uses an actual event snapshot; heat, combo, scoring, directed routes and transformations stay causal. Resource-only frames have no artificial delay; a long sequence is scaled to about 6.5 seconds. Skip playback presents the authoritative outcome once. Harvest bursts are limited to eight local particles for the active specimen; no ambient particle cloud competes with decisions.

First discoveries use a nonblocking collection strip and contextual companion reaction. Results prioritize score, personal record comparison, best chain, Biomass, new discoveries and Play again. Minor statistics, seed replay and protocol/seed changes are secondary. Play again starts a fresh seed using the previous selected configuration with one click.

## Scope

English remains the game's existing language; localization infrastructure, first-run accessibility studies, real native wrappers and physical-device testing are future work. This pass changes presentation/onboarding, not the Wave 2 plant/economy/reactor rules. [UX audit](ux-audit.md) records the observed starting problems.
