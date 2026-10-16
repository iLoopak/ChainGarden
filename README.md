# Chain Garden

Repository: [iLoopak/ChainGarden](https://github.com/iLoopak/ChainGarden).

A small botanical strategy game about growing an engine, then choosing when to take it apart. A complete, browser-local Wave 1 built with React, TypeScript and Vite. No account, backend, external imagery, fonts or API keys.

## Play locally

Requires Node.js 22.12+ and npm. This delivery was verified with Node.js 26.3.0.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. For a production preview:

```sh
npm run build
npm run preview
```

## How to play

Each garden has **36 plots and 25 turns**. Three established plants give you a starting engine. Choose one of three seeds and tap an empty plot, or choose **Harvest** and tap an existing plant. Either action consumes one turn and replaces all three offers. There is no wait action or seed inventory.

All surviving plants grow one stage after the action. Three stages means ripe. Harvesting early is legal, but ripe plants score more. Ripe sunflowers make dew; the next planting automatically spends one dew for a growth boost. A harvested rose activates its orthogonal neighbors, potentially starting a chain. Keep clovers for their scoring aura, use mushrooms to echo abilities, leave cacti breathing room, and let wildflowers replant the future.

The garden does **not** auto-harvest after turn 25. Plan your last few turns.

- **Touch/mouse:** select seed, then empty plot; switch to Harvest, then plant. Tapping an occupied plot in Plant mode inspects it and offers a scored harvest button.
- **Keyboard:** 1–3 select seeds; H selects harvest; P or Escape pauses. Tab / Shift+Tab move between controls, Enter / Space activate them.
- **Field guide:** all exact abilities and scoring rules, available from the header.
- **Pause:** sound, reduced motion, restart confirmation, or save and return home.
- **Results:** score, harvest count, best chain, best turn, personal best, new seed or replay the same seed.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Vitest exercises all six abilities, scoring, breadth-first chain ordering, repeated triggers, dense chains, seeded determinism, legality, the 25-turn boundary, IndexedDB roundtrips and idempotent completion. Playwright runs complete games, reload recovery, guide, settings, restart, keyboard controls and overflow checks on desktop Chromium and a touch-enabled iPhone-sized Chromium viewport. Browser tests launch their own Vite server when needed. Safari/WebKit and native wrappers are not part of Wave 1 validation.

See [the verification record](docs/verification.md) for executed checks, browser evidence and environment limits.

## Project map

- `src/engine/` — pure deterministic rules, seeded RNG, plant definitions and tests.
- `src/controller.ts` — action orchestration, save ordering and visual event playback.
- `src/components/` — local vector art and UI primitives.
- `src/App.tsx`, `src/styles.css` — responsive views, accessible dialogs and CSS motion.
- `src/persistence/` — versioned, validated IndexedDB save envelope and tests.
- `src/platform/` — browser entropy, run identifiers and optional synthesized sound.
- `tests/e2e/` — critical browser flows.

Read [the game design](docs/game-design.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Local data and platform scope

Progress, settings, the personal best and up to 100 completed run summaries live in IndexedDB for the current browser origin. Each resolved turn is persisted as one atomic record before visual playback; restoring a garden cannot repeat its rewards. Private browsing, browser cleanup or changing the origin can remove or isolate saves. Storage failures display an in-app notice and allow in-memory play. Wave 1 supports one active tab per local profile; simultaneous tabs are not synchronized.

All visuals and sound are generated locally. The app respects system reduced motion as well as its own setting. It has relative build asset URLs for future Capacitor/Tauri adapters. It currently requires serving the static build over HTTP; installable/offline PWA support and native packaging are future work.
