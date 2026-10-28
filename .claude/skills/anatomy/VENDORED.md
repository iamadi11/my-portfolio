# Vendored copy

Source: `wheresryan22/anatomy` at 1482e84 (MIT, `LICENSE`), shared by the owner; vendored 2026-10-28.

Omitted: the examples' built pages (`examples/*/*.html`), PDFs and PNGs (about 25 MB). Rebuild the pages with
`node build.mjs` and `node build.mjs --light` in each example folder (turning-dial also `--verify --light` and
`node stress.mjs --light`); they are git-ignored. Everything else is unchanged.

Requirements here: Node 20.10+ (the repo uses 22), `esbuild` and `typescript` (devDependencies), React for
`kit/react` (a dependency), Chromium at `/opt/pw-browsers/chromium` for the checks. Run the tests from this folder
with `NODE_PATH=../../../node_modules CHROME_PATH=/opt/pw-browsers/chromium node --test scripts/*.test.mjs tests/`
(290/290 on 2026-10-28; the React tests compile into a temp folder and need `NODE_PATH` to find React).

In this repo:

- The course (`/learn`) may use the kit for figures where an object's mechanism is the explanation
  (system-design-educator, `references/rendering.md`). Its figures stay monochrome (CLAUDE.md §11.4): the
  four-tone shading in grays, no lit accent colour; states by line, fill and text.
- A figure that uses the kit loads in its own chunk near the viewport (`NearViewport`); the course budget is in
  `docs/system-design/COURSE_STATE.md`. `/` does not use it (CLAUDE.md §10.4).
- `scripts/publish.mjs` pushes to the public Anatomy gallery: run it only when the owner asks.
