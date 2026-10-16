# Wave 1 verification — 16 October 2026

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
