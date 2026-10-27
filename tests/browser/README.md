# Browser tests for /learn

Plain Node scripts that drive Chromium with the [Playwright](https://playwright.dev) library and scan pages with
[axe-core](https://github.com/dequelabs/axe-core). Both are exact-pinned devDependencies (`playwright` 1.63.0,
`axe-core` 4.10.3). Unit and model tests stay in Vitest (`npm test`); these suites cover what only a browser can.

## Prerequisites

- Dependencies installed: `npm ci`.
- A Chromium build that Playwright 1.63.0 can launch. Locally: `npx playwright install chromium`. In an environment
  with browsers pre-installed, point `PLAYWRIGHT_BROWSERS_PATH` at them (e.g. `/opt/pw-browsers`).
- A **production build running**. The suites do not start a server, and a dev server is not a valid target (its
  scripts, timing and bundle sizes differ).

## Run

```sh
npm run build
npm run start -- -p 3201        # leave running, then in a second terminal:
npm run test:browser            # all suites; exit 1 if any check fails, 2 if no server answers
```

To test another server: `LEARN_BASE_URL=https://example.test npm run test:browser`. A single suite:
`node tests/browser/client-server.cjs`. Screenshots go to `test-results/browser/` (git-ignored).

## Suites

| File                | Covers                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web-request.cjs`   | Chapter 1: six viewports (no horizontal scroll, no console errors), axe WCAG 2.0/2.1/2.2 A and AA at 375 and 1280 px with answers open, keyboard-only use of every control, focus kept on controls that become `aria-disabled`, recall gating and predict-then-run (answer absent before Run), live-region and step announcements, reduced motion, citation links, `/` renders |
| `client-server.cjs` | Chapter 2: six viewports before and after a run, axe on load and after a run, answer-leak checks before Check/Skip/Run, incomplete/right/wrong feedback, keyboard-only use, announcements and stale-result clearing, cases A–C, late-case event order and drawing, label geometry, citation numbering, reduced motion, `/learn` and chapter 1 links, sitemap, `/` renders      |
| `js-budget.cjs`     | First-load JS ≤ 120 kB per route (CLAUDE.md §10.4), measured as compressed script bodies before the load event                                                                                                                                                                                                                                                                 |

Each check prints `PASS` or `FAIL` with its evidence; each suite ends with `n/m passed`.

## Not covered

These suites inspect markup, focus and live-region text. They are **not** a screen-reader test: a person still has
to listen with VoiceOver or NVDA (checklist: `docs/system-design/SCREEN_READER_CHECKLIST.md`).
