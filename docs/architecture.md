# Architecture

## Boundaries

```text
React views / CSS / local SVG specimens
                  ↓ intents
GameController → pure TypeScript engine + content registries
       ↓                   ↓ state + ordered events
IndexedDB adapter      independent visual playback
       ↓
versioned atomic save + progression ledger
```

The engine has no React, DOM, clock, storage or unseeded randomness. `createRun`, `resolveAction`, `previewHarvest`, `harvestValue`, `isLegalAction` and `legalActions` are deterministic functions. Input state is cloned before a transition. UI components select, inspect and render; they do not implement abilities or rewards. The controller exposes an external store through `useSyncExternalStore`.

`src/engine/content.ts` is the shared registry of research, upgrades, protocols and mutation metadata, eligibility and symmetric conflicts. `balance.ts` contains shared tuning constants. `grid.ts` owns ordered adjacency. `mutations.ts` evaluates contextual trait eligibility and returns transformation snapshots. `plants.ts` owns plant metadata. The resolver is the only executor of abilities, heat, collateral, scoring, utility costs, milestone generation and turn completion.

## State and event resolution

A version-2 run contains a 36-slot board with stable increasing plant IDs, growth, birth turn, optional trait IDs and cumulative resonance exposure. It also contains blocked indices, ordered seed pool, protocol/challenge/research snapshot, original seed, seed RNG, independent upgrade RNG, pending draft choices, upgrades, consumable charges, heat, discoveries and stats. Everything needed to resume a draft or reproduce a transition is serializable.

The FIFO queue starts with the root action and seasonal phase. Harvest appends its ability after the season; abilities append ID-targeted growth/activation; activation may append another harvest. Depth is explicit. The activated/harvested sets guard each organism; the network relay set, first-echo/replication flags and one-transfer mutation pass bound repeat effects. Queue processing has a 1,024-event final guard. No recursive rule execution is used. Trait copies append a finite number of abilities and do not copy repeat scheduling.

Root planting/harvesting/pruning/venting spend turns. Upgrade and recycler actions are separate legal transition variants with explicitly zero turn/growth cost. A pending draft blocks other actions. Mutations, optional collateral and latched overload are deterministic post-chain phases. Scores use the board and heat at each harvest, preserving ordering choices. Every board mutation emits a snapshot or removal event so presentation can reconstruct the exact final board.

## Playback and forecasts

The controller resolves immediately, records the full save and queues its write before visual playback. Its displayed board, score, heat, pulses and combo advance through `presentation/playback.ts` frames independently of the authoritative state. Seasonal growth can share one frame; directed effects retain order. Harvest/destruction remove from the display; plant/growth/spread/mutation snapshots replace a specimen. Overload points are included in sequential score playback. Skip cancels the current timer and presents the authoritative final state exactly once. Reduced motion uses zero-delay frames.

`previewHarvest` calls the same resolver without committing its result. It returns exact points, depth, ordered harvests, collateral indices, heat/dew afterward and the full event stream, including overload. Forecasts cannot alter RNG, rewards, seed offers or state. React never maintains an alternative scoring model.

Discovery reveals are presentation state derived from first-discovery events. Rewards have already been recorded. Reload restores collection entries and currency without replaying either the action or an award. Native dialogs trap focus; mandatory draft dialogs cannot be dismissed into a playable board without choosing. Pause, setup, guide and research remain ordinary UI views.

## Persistence and migration

IndexedDB database `chain-garden`, physical version 1, store `garden`, key `save`. The envelope has independent `schemaVersion: 2` and contains:

- `current`: validated version-2 run snapshot, or null.
- `settings`: sound and reduced motion.
- `best` and up to 100 newest completed summaries with score, protocol, discoveries and earned Biomass.
- `profile`: exact purchase ledger, balance/lifetime earned, unique discovery and synergy IDs, lifetime completed-run reward ledger.

`recordRun` atomically combines a snapshot, new discoveries, reward ledgers, currency and completed summary. Separate lifetime IDs survive visible history trimming. `purchaseResearch` verifies funds, dependencies and ownership before an immutable debit. The decoder checks safe integers, known content, IDs, locked pool membership, trait caps, compatible upgrades, milestone phases, exact research prices, dependency order, unique rewards and the accounting equation. Unknown/damaged data remains untouched; a failed initial load disables writes for the in-memory fallback session.

Version-1 migration preserves garden, seed stream, ordered six-species pool, settings and history. Mycology/Xerophytes become explicit free legacy grants; historical completions get their new payout entered once in the ledger. `draftAfterTurn` records the interruption point so past milestones are skipped and future milestones remain valid. Fresh replay returns to the normal four milestones and preserves the original ordered pool. See [progression.md](progression.md) for migration/economy policy.

Controller writes are serialized. Each save is a single IndexedDB readwrite transaction; a crash may lose the latest uncommitted transition, but cannot split a currency award from its reward ID. This is local data integrity, not anti-cheat. Multiple simultaneously writing tabs are unsupported; no cross-tab lock or cloud sync is claimed.

## Portability

`platform/browser.ts` contains cryptographic seeds, unique run IDs and optional synthesized sound. Storage implements a small `Persistence` interface. Native storage, haptics and lifecycle flushing can be supplied by later Capacitor/Tauri adapters without moving rules into React. Assets use relative URLs. No backend, external imagery, fonts or required services. Offline service-worker packaging is not implemented.

## Verification

Vitest covers every plant, upgrade, mutation, queue order, score/heat tier, overload, conflict, seeded transition, safe dense chain, economy, migration and IndexedDB roundtrip. A property-style suite saves/decodes every transition in 60 varied researched runs. Playback tests reconstruct exact boards across 40 complete games. Controller tests cover saving before animation, ordered writes, skip idempotence and unreadable-save protection.

Six Playwright scenarios run on desktop and portrait Chromium, including a full reward/research/unlocked-content loop and interrupted draft recovery. A Linux GitHub Actions workflow installs Chromium and runs lint, types, unit tests, build, E2E and deterministic simulation. Local macOS Chromium launch restrictions and actual in-app browser verification are recorded separately in [verification.md](verification.md).

`npm run simulate` executes an opt-in Vitest harness in `scripts/` using fixed decision-policy RNG, fixed seeds, five strategies, two research profiles and matched single-upgrade ablations. The JSON report is generated separately from normal tests. It can import the same engine without React or a browser.
