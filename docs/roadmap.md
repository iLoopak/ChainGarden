# Roadmap

## Wave 1 — playable core

Implemented: 6×6 gardens, 25-action runs, six species, dew production, growth, spatial scoring, ordered harvest chains, seed replay, full game loop, local vector artwork, touch/mouse/keyboard controls, pause/restart, settings, field guide, results, personal best, run history, versioned interrupted-run saves and automated engine/storage/browser coverage.

## Wave 2 — deepen the garden

1. **Balance through simulation and playtesting.** Measure score distributions, chain frequency and sunflower/clover opportunity costs across many seeds. Adjust base scores and dew yield using real play data. Keep all telemetry opt-in and local by default.
2. **Teach through play.** Add a short, skippable first garden with a guided rose–mushroom chain. Improve depth arrows and show a reversible, clearly labeled chain preview before committing.
3. **More reasons to return.** Seeded daily experiments, local objectives and distinct starting arrangements. Keep ordinary runs short and every challenge reproducible.
4. **Accessibility and feedback.** Screen-reader playtesting, contrast review, alternate plant labels, haptics through platform adapters, richer audio and causality overlays. Validate Safari/WebKit, Firefox and real low-end touch devices.
5. **Resilience.** Multi-tab run ownership, explicit save migrations, export/import with validation, crash-recovery testing and IndexedDB quota handling. Add offline service worker installation with a controlled update flow.
6. **Distribution.** Capacitor and Tauri wrappers using the existing platform boundary; native safe-area testing, lifecycle save flushing and packaged offline assets.

## Later experiments

Optional run modifiers, more plants with distinct spatial jobs, constrained soil layouts and a sandbox for learning interactions. Prototype one mechanic at a time and preserve the central tradeoff: harvesting scores points but takes apart the garden's productive engine.

No backend, monetization, asynchronous multiplayer or account system is required for these next steps.
