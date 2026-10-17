# Wave 3 verification — 17 October 2026

- Local lint, TypeScript, all 95 Vitest tests (8 files) and production build pass against the redesigned UI and schema-3 experience layer. Final build: 52 modules, 43.16 kB CSS / 10.32 kB gzip and 319.39 kB JavaScript / 100.06 kB gzip.
- Re-ran all 1,304 deterministic simulations: the JSON is byte-identical to the Wave 2 reference. No gameplay/balance rules changed.
- Local standalone Chromium still fails at macOS `MachPortRendezvousServer` launch before page load; Linux CI runs the actual desktop/portrait test suite.
- Rendered baseline audit: 1440×1000 desktop, 390×844 portrait garden, Lab and Guide. Rendered redesign: original M.O.S.S., title, guided targets, actual growth/reload, direct three-plant forecast 80 → actual 80 with heat 9, compact upgrades, populated desktop matrix and 10-plant forecast 459 → actual +459.
- Generated screenshots live under ignored `output/playwright/wave3-*.jpg`.

Actual in-app Chromium verification used ordinary rendered controls, without injecting engine state or save data:

- Replayed the deterministic guide, reloaded at growth, and confirmed the actual three-plant forecast 80 → 80 points / 9 heat.
- Installed actual upgrades at all four drafts; the ten-plant forecast 459 matched the resulting +459. A later forecast +156 matched execution and caused an actual overload: heat 87 → 35, two ripe plantings, contextual surprised M.O.S.S. response.
- Completed all 25 turns at 717 points, best chain 10 and +14 Biomass. Opening Lab completed the guide. Reload preserved balance 38; the tutorial welcome did not repeat.
- Inspected original M.O.S.S., title, guided placement/growth/reactor, upgrades, results, Lab and mutation cabinet. Final board layouts inspected at 1366×900 desktop and 390×844 portrait.
- No horizontal overflow at 320×740, 390×664, 390×844, 768×1024 or 1280×720. All three seed choices are initially reachable in those sizes. The short portrait layout uses a smaller tray; the 320px header keeps pause reachable. No captured browser runtime errors/warnings.
- The first Linux CI run passed 10/12 E2E cases and exposed two regressions: a desktop research tab's accessible name included its counter, and seed choices fell below the short iPhone viewport. Both were fixed. Responsive assertions now cover the short phone, 320px, tablet and low desktop as well as the two project defaults.

Remaining verification boundaries: Safari/WebKit, Firefox, physical-device performance and screen-reader playtesting. Small screens may need scrolling for expanded details and guided explanations. No changes to the engine/economy/balance are claimed by this presentation pass.

[Corrected Linux CI passed all verification steps](https://github.com/iLoopak/ChainGarden/actions/runs/39003215380): lint, types, 95 unit tests, production build, all 12 desktop/mobile E2E scenarios and 1,304 deterministic simulations. The E2E scenarios include real first-run completion, returning-player completion, single-payment reload, tutorial skip/replay, keyboard, touch and responsive boundaries.

---

# Wave 2 verification — 17 October 2026

- Lint, TypeScript, 79 Vitest tests and production build pass locally.
- Deterministic simulation: 1,304 complete games; 660 survey/challenge games complete without truncation, 624 matched upgrade ablations and a 20-run persistent research campaign. [Report](balance.md).
- Standalone Playwright: all 12 desktop/portrait cases attempted; Chromium fails before page load under the local macOS sandbox (`MachPortRendezvousServer: Permission denied`). These are environment launch failures, not passed browser tests.
- [Linux CI passed](https://github.com/iLoopak/ChainGarden/actions/runs/38999384431): lint, types, 79 unit tests, build, all 12 desktop/portrait E2E scenarios (20.3 seconds) and the 1,304-game simulation.

Actual in-app Chromium UI verification (ordinary rendered controls, no injected gameplay/save API):

- Migrated a real schema-1 garden at turn 10; kept board/RNG/settings/history. Legacy research/currency credited once. Five first mutations earned 15 Biomass.
- Exact mutated-chain forecast 207 matched the resulting score. Reload at the turn-15 draft restored identical three choices; installation left the turn at 15. Completed the interrupted garden at 426 points.
- Bought six research nodes for exactly 66 Biomass; balance 71 → 5. Reload preserved eight owned nodes and that balance.
- Started Volatile Experiment with Moonflower/Briar: heat 30, extra Rose, selected pool. Portrait 390×844 matrix and three seed choices fit together. Eight-plant reaction forecast 622 matched execution; overload reset to 35 and granted two charged plantings. Completed at 1,309 points with two overloads, 22 Biomass including discoveries.
- Bought Containment Trial; observed four sealed plots and starting heat 45. Completed at 2,197 points, chain 19, one overload and challenge bonus +6 included in 22 Biomass. The final 900-point target is satisfied.
- Purchased the tenth node and started Symbiotic Growth. A Sunflower harvest relayed growth from C2 to D2 through Clover; the distant Wildflower reached stage 3. Cooling Tissue and Wandering Roots effects/reveals were recorded.
- Screenshot evidence is local under `output/playwright/wave2-*.jpg`; these generated images are ignored by Git.

Responsive checks passed at widths 320, 390, 768 and 1,280 with no horizontal overflow; no captured browser runtime errors. Remaining validation: real Safari/WebKit/Firefox and physical low-end devices; no multi-tab guarantee.

---

# Verification — 16 October 2026

## Direction lock and biopunk pass

- ESLint, TypeScript, 33 Vitest tests and the production build passed.
- Seven added tests cover exact forecasts, zero-cost inspection, no clock-driven progression, sequential score/combo playback and reconstruction of 1,000 turns from their actual event streams.
- The committed Playwright suite now has five scenarios on each of two viewport projects. Its standalone run was attempted again; all ten cases were blocked at Chromium launch by the same macOS Mach-port sandbox restriction, before reaching the app. It is not reported as passed.
- Real UI checks were automated through the available in-app Chromium browser using Playwright locators: a desktop 25-turn run finished at **496 points**, and a portrait run at **437 points**. Per-action turn accounting and repeated reloads preserved exactly one new summary per run.
- Both layouts forecast a three-plant chain at **73 points** and resolved it to **73 points**. Inspection and cancellation consumed no turns; controls locked during normal-motion playback; the active SVG route reported source 20 and target 14 (C4 → C3).
- The 390×844 flow also verified interrupted-run restoration, all six guide entries, keyboard seed selection, Escape cancellation, restart cancellation and reduced-motion settings. No horizontal overflow was observed. In the portrait forecast, the board ended at y=562.5 and the confirmation dock began at y=643, leaving the matrix unobscured.
- Responsive opening checks also passed at 320×740, 768×1024 and 1280×720: no horizontal overflow and the start button remained inside the viewport. The final browser console reported no application errors.
- Screenshots and structured browser-check evidence are saved in `output/playwright/biopunk-*` (ignored). These are Chromium viewport checks, not physical iPhone/Safari validation.

## Original Wave 1 record

## Automated checks

- ESLint: passed, no warnings.
- TypeScript project checks: passed.
- Vitest: 26 tests passed across engine, IndexedDB and controller suites.
- Vite production build: passed; all game assets are bundled locally.
- npm dependency audit: no reported vulnerabilities after updating Vitest.

## Browser verification

The standalone `npm run test:e2e` command was attempted. The macOS execution sandbox prevented Chromium from launching (`MachPortRendezvousServer: Permission denied`) before any test could reach the app. This is an environment limitation; the standalone Playwright runner is not reported as passed. The committed suite contains four scenarios across desktop and mobile Chromium projects, including a complete run.

To verify the actual game despite that launch restriction, the same critical flows were automated through Playwright locators in Codex's already-running in-app Chromium browser. All eight flow checks passed:

| Viewport | Flow                                                             | Observed result                                                                                      |
| -------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 390×844  | Interrupted run, guide, settings, canceled and confirmed restart | Plant and turn restored; six species visible; cancel preserved turn 1; confirmation reset to turn 0. |
| 390×844  | Keyboard modes, inspection, pause, overflow                      | Seed and harvest selection worked; scored inspection button; pause opened; no horizontal overflow.   |
| 390×844  | Complete 25-action run and repeated reload                       | 434 points, best chain 5; one completed entry after both reloads.                                    |
| 390×844  | Normal motion chain, input locking, exact score                  | Three-plant chain scored 73; plots locked during playback; causal activation log visible.            |
| 1280×900 | Interrupted run, guide, canceled and confirmed restart           | Saved plant and turn restored; guide and both restart branches worked.                               |
| 1280×900 | Keyboard modes, inspection, pause, overflow                      | Seed 2, harvest shortcut, inspection, keyboard pause and width check passed.                         |
| 1280×900 | Complete 25-action run and repeated reload                       | 419 points; exactly one additional completion, preserved across repeated reloads.                    |
| 1280×900 | Normal motion chain, input locking, exact score                  | Three-plant chain scored 73; actions locked; log identified Sunflower activation.                    |

Screenshots of title, gameplay, chains and results were captured locally under the ignored `output/playwright/` directory. These checks do not imply real iPhone/Safari validation; portrait testing used a resized Chromium viewport. Test-generated journal records are disposable development data in the port-5173 origin. The browser console reported no application errors.

## Remaining verification boundaries

Safari/WebKit, Firefox, native wrappers, real device performance and multi-tab coordination remain unverified. An additional browser smoke test of the production preview at port 4173 was denied by the browser origin access gate; it was not retried or bypassed. The production bundle is confirmed by the successful build, while UI flows were verified on the Vite development origin. IndexedDB atomicity is tested using fake-indexeddb and actual browser reload flows; operating-system power failure during a write is not simulated. Gameplay balance has initial rules and real completed sessions, not extensive player playtesting.

The workspace begins without a Git repository or remote. This sandbox protects the workspace `.git` path against creation. The source commit is delivered in the ignored `delivery/chain-garden-wave1.bundle` file for later repository setup without modifying that protected path. The user subsequently identified `https://github.com/iLoopak/ChainGarden` as the canonical repository. Read access was verified and no remote refs existed at that check. Its URL is recorded in `AGENTS.md` and as `origin` in the prepared delivery checkout.
