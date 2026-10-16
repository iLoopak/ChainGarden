# Architecture

## Layers and boundaries

```text
React views / CSS / reusable local SVGs
                  ↓ user intent
GameController → pure TypeScript engine
       ↓                   ↓ resolved state + ordered event log
IndexedDB adapter     visual playback in controller
       ↓
versioned atomic save envelope
```

`src/engine` has no React, DOM, storage, time or unseeded randomness. `createRun`, `resolveAction`, `previewHarvest`, `harvestValue`, `isLegalAction` and `legalActions` are ordinary deterministic functions. `resolveAction` clones its input and returns `{state, events, points, chain}`. Plant metadata is the shared vocabulary for mechanics and UI descriptions.

React owns selection, inspection, dialogs and rendering only. It never advances turns, computes abilities or mutates the game state. It subscribes to an external controller with `useSyncExternalStore`. The engine remains usable in a worker, CLI, simulation, Capacitor or Tauri host.

## Resolution

A serializable 36-element board contains null or a plant with a unique increasing ID, kind, growth stage and birth turn. Actions validate before mutation. The queue begins with the user's action and a seasonal-growth event. A root harvest appends its ability after the season. Abilities append child growth or activation events; activation may append a harvest, which appends another ability. FIFO ordering gives breadth-first chains with explicit depth.

Targeted events carry both a position and the expected plant ID. An `activated` set and `harvested` set prevent repeated processing. The 256-event limit is a final safety bound, and adds a diagnostic event if hit. No recursion is used. Every score is derived from the board at the time of that harvest.

The RNG is an unsigned 32-bit LCG with explicit next-state returns. The state includes initial seed and current RNG state. Run IDs come from the platform layer, never from game RNG. No timestamps enter rules or scoring.

## Presentation and interruption

`GameController.play` resolves the turn synchronously, creates the full next save and queues its write before starting playback. The authoritative state is final while presentation remains sequential. Engine events carry immutable specimen snapshots: after growth/plant/spread, or just before a harvest removes the plant. These transient fields do not enter the save schema.

`src/presentation/playback.ts` converts events into frames and applies each frame to the display board. Only contiguous seasonal growth is batched; effects with a source keep their exact FIFO sequence. The displayed score and combo progress with harvest frames. Tests reconstruct 1,000 turns from their events and compare every final board with the resolver output. React renders the supplied board, pulse events and source/target links; it never executes abilities.

`previewHarvest` calls that same pure resolver on a clone and returns the full chain forecast. It cannot consume a turn, an offer, RNG state or a reward. Selecting/canceling a forecast is UI state only. Confirming invokes the controller once. This preserves score parity between forecast and execution without a second rules implementation.

Input locks until the current visual sequence finishes. Reduced motion uses zero-delay frames and static source/target relationships. The journal preserves directed effects, resources, copying, activations, harvests and spreading; passive seasonal growth remains visible on the board instead of flooding the log. A page reload restores the fully resolved board without replaying the action or adding points. Plant geometry, the cultivation tray and all environment assets remain local SVG/CSS.

## Persistence

IndexedDB database `chain-garden`, version 1, store `garden`, key `save`. The envelope has its own `schemaVersion: 1`:

- `current`: a full validated run snapshot or null.
- `settings`: optional sound and reduced motion preferences.
- `best`: best completed run score.
- `completed`: newest-first summaries, maximum 100, each keyed by a unique run ID.

The full envelope is one `readwrite` transaction, so the completion entry, best score and final snapshot commit together. Controller writes are serialized, preventing old snapshots from overwriting later actions. `recordRun` is idempotent by run ID; restoring a finished run never records another completion. Replaying a seed gets a new run ID.

The decoder checks schema, dimensions, phases, stage ranges, IDs, offers, RNG, counters and history before accepting data. Unknown versions and invalid data produce a visible notice and a playable in-memory session. No speculative migration changes an unknown format. A future migration should explicitly map envelope versions before decoding. Storage error handling does not claim that unsaved progress is durable.

The first action cannot happen until initial loading finishes. A browser crash during a pending IndexedDB commit may lose the last uncommitted turn; it cannot double an award. Multi-tab ownership/coordination is a documented future limitation.

## Platform adapters

`src/platform/browser.ts` owns cryptographic seeds, unique run IDs and synthesized Web Audio. The IndexedDB implementation conforms to the small `Persistence` interface and can be replaced with native storage. Vite uses relative asset paths. No router, cookies, cloud service, remote images or external fonts are required. A server must initially serve the static files; Wave 1 has no service worker.

## Testing

Vitest uses pure state fixtures for abilities and queue order. A dense rose board covers competing triggers and termination. Scripted 25-turn simulations compare complete final states and event logs for determinism. `fake-indexeddb` runs the actual storage adapter, including a mid-run resume and repeated completion saves.

Playwright tests desktop Chromium and mobile-sized touch Chromium, including a full 25-action game, a reload, one journal award, settings persistence path, guide, cancellation/confirmation of restart, keyboard modes and layout overflow. Browser visuals are reviewed separately at desktop and portrait sizes. Tests do not introduce a gameplay debug API or bypass real UI actions.
