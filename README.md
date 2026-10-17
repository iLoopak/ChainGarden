# Chain Garden

[Canonical repository](https://github.com/iLoopak/ChainGarden). A playable, turn-based botanical strategy roguelite inside a biopunk greenhouse. Grow a production engine, choose four in-run experiments, then decide when to take the garden apart. M.O.S.S., a moss-grown maintenance drone, teaches the first cultivation through real moves. React + TypeScript + Vite; local SVG/CSS, IndexedDB, no account, backend or external asset services.

## Play locally

Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

Open Vite's URL. Production: `npm run build`, then `npm run preview`. When filesystem notifications are unavailable, use `CHAIN_GARDEN_POLLING=1 npm run dev`.

## First garden

Choose **Grow with M.O.S.S.** for a short guided planting → growth → adjacency → chain lesson inside the real 25-turn game. Its deterministic scenario uses ordinary rules. Guidance resumes after reload, can be skipped, and can be replayed from settings. Returning saves retain their gardens and skip forced onboarding. Mute nonessential M.O.S.S. tips independently of essential tutorial steps.

## Play

The garden has **36 plots and 25 turns**. Choose one of three seeds and tap an empty plot, or select an existing plant, inspect the exact chain forecast and confirm its harvest. Survivors grow one stage afterward, then queued effects resolve. Every turn replaces all three seed choices. There is no automatic final harvest.

Ripe Sunflowers make dew for faster planting. Roses activate neighboring tissue. Clovers improve neighboring harvests and can cool the reactor. Wildflowers sow a new engine. Research Mushroom, Cactus, Moonflower and Briar, then add up to two to your starting pool. Optional specimens, three distinct protocols and a sealed-corner challenge change the decisions available.

After turns **5 / 10 / 15 / 20**, choose one of three temporary upgrades. There are 13 experiments, including growth relays, repeated abilities, trait transfer, seed scanning/recycling and volatile chain bonuses. Every upgrade caps at one copy; incompatible choices never share a build.

Chains generate persistent reactor heat. Higher tiers strengthen deep harvests and enable mutations. At 100, one deterministic overload removes up to three nearby plants, then gives points, dew and two ripe-start plantings. Cooling can protect a valuable region; intentional overload can help rebuild it. Forecasts include exact outcome and risk.

Ten contextual mutations create persistent traits on individual plants. First discoveries earn **3 Biomass** once. Completed gardens earn at least 8 Biomass; spend it across ten research nodes in the Lab. Research adds choices instead of permanent global score boosts. The specimen cabinet records plants, secret traits, learned synergies, experiments, reactor rules and lifetime records. Select an illustration to inspect it; exact rules stay available through Details.

- **Touch/mouse:** choose seed → empty plot; select plant → forecast → Release reaction. Selection/cancellation is free. Utility buttons show costs. Pruning asks you to select and confirm a plant.
- **Keyboard:** 1–3 choose seeds, H inspect a Rose, P pause; Escape cancels a forecast or opens pause. Arrow keys move between enabled plots; Tab / Shift+Tab / Enter navigate.
- **Pause:** optional sound, reduced motion, M.O.S.S. tips, replay tutorial, restart or save/home. **Skip playback** settles visual effects immediately without changing the outcome.
- **Results:** score and personal best comparison, best chain, Biomass, discoveries and one-click Play again. Optional Run details reveal minor statistics and exact seed replay. Change protocol or seeds opens the next garden’s configuration.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run simulate
```

The simulation command regenerates `docs/simulation-results.json` from fixed seeds. It reports policy outcomes and potential imbalances, not whether humans find the game fun. GitHub Actions runs all checks with desktop/portrait Chromium. See [verification](docs/verification.md) for executed results and local environment limits.

## Source map

- `src/engine/` — pure deterministic rules, two RNG streams, registries, balance constants and tests.
- `src/controller.ts` — external store, authoritative transitions, serialized saves and skippable playback.
- `src/presentation/` — capped event playback and exact board reconstruction.
- `src/experience/` — event-driven onboarding, companion memory and concise presentation copy.
- `src/persistence/` — schema-3 migration, validated research/reward ledgers, atomic IndexedDB.
- `src/components/` — SVG plants, matrix, decisions, research/protocol/draft/collection views.
- `scripts/` — deterministic survey and upgrade ablations; `tests/e2e/` — real UI flows.

Read [UX guidelines](docs/ux-guidelines.md), [game rules](docs/game-design.md), [progression](docs/progression.md), [balance](docs/balance.md), [architecture](docs/architecture.md), [art direction](docs/art-direction.md) and [roadmap](docs/roadmap.md).

## Saves and scope

Progress belongs to the browser origin. Schema-1/2 gardens and histories migrate automatically to schema 3, including tutorial checkpoints and one-time guidance memory; existing six-species access is preserved and historical completions receive a one-time Biomass credit. A full resolved snapshot and reward IDs are saved together before animations. Unknown/damaged saves are preserved and a visible notice explains in-memory fallback. The visible journal keeps 100 summaries; lifetime reward IDs prevent duplicate awards beyond that limit.

One active writing tab is supported. No cloud sync, export/import, offline service worker, localization or native wrapper is shipped yet. Clearing browser storage removes local progress. Capacitor/Tauri remain future adapters around the independent engine/storage boundary. There is no login reward, energy system, waiting timer or paid boost.
