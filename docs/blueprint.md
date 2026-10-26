# / (home): the drawing set

`/` is one page: six sheets drawn the way Apple's accessory dimensional drawings are, following the house rules of [enesozturk/dimensional-drawing](https://github.com/enesozturk/dimensional-drawing) (MIT; vendored as the `dimensional-drawing` and `dimensional-drawing-motion` skills in `.claude/skills/`). Scrolling moves a pen across the sheets: lines draw themselves, dimensions follow the geometry they measure, project layers lift into exploded axonometric views, and a camera pulls back. Every fact comes from `SITE` in `src/content/site.ts`.

## House rules

- **Monochrome.** Black line on white paper, grays only, no accent colour. Things are told apart by line weight, dash pattern, hatch and light gray fill. Single light theme by design.
- **Lettering.** Arimo caps, letter-spaced (`font-sans`). Text tokens: `--ink` (body), `--ink-2` (7:1), `--ink-3` (4.6:1, smallest allowed text gray). `--line-3` is for phantom lines and centerlines only, never text.
- **Truth.** Drawing labels only restate SITE. Each project's layers and detail labels live in `sections/assemblies/configs.ts` with a comment quoting the summary phrase they come from. Values are counted only inside drawings; HTML always states them exactly as SITE does.
- **Content is HTML.** Headings, lists, tables and links are real HTML; SVG drawings are `aria-hidden` decoration.
- **One thing leads at a time.** Dimensions after their geometry, labels after their leaders, ease-in-out, no bounce.

## The sheets (`src/components/blueprint/sections/`)

| #   | Sheet                                         | Source                             | Scene                                                                                                                                          |
| --- | --------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Title block (`Title.tsx`)                     | `profile`                          | `clock`: the frame, cell rules, dimensions and notes draw on load; name, role and statement are visible at first paint                         |
| 2   | Measured results (`Results.tsx`)              | `practice.impact`                  | `pin`: one dimension study per result, derived from the value string (before/after, count, reduction); the camera visits each, then pulls back |
| 3   | Assemblies (`Assemblies.tsx`, `assemblies/*`) | `projects`                         | one `pin` per project: plan view draws, layers lift into an exploded view, a detail view, then the whole sheet                                 |
| 4   | Revision history (`Revisions.tsx`)            | `practice.experience`, `education` | `flow`: a to-scale career dimension chain (REV A = first role), then the revision table with numbered notes                                    |
| 5   | Variables (`Variables.tsx`)                   | `practice.skills`                  | `flow`: one variable table per group, codes = group initial + index                                                                            |
| 6   | Contact (`Contact.tsx`)                       | `profile`                          | `flow`: the email as the call to action with a dimension under it, ruled contact cells, credits                                                |

`Nav.tsx` is the fixed drawing-set index (boxed sheet numbers, CSS scroll-driven pen line).

### Story

- Each sheet's subtitle answers one question, in order: who (title block) → **What changed** → **How it is built** → **Where** → **With what** → **What next**.
- **Cross-references** (`xref.ts`), the way a drawing set links its sheets: each result on sheet 2 links to the role note that states the same numbers for the same organisation (`See Rev E/1`), and that note links back (`Measured · Sheet 2, Detail A`). Matching is derived from SITE, never hand-linked; a result with no matching note gets no link.
- **Chapter-end calls to action** (desktop): "Discuss these results" after sheet 2, "Discuss this assembly" under each project. The contact sheet ends on the title block's **Approved by** cell: "Sign this drawing" opens an email.
- Hovering a role highlights its segment of the career chain and the other way round (pointer devices, CSS `:has()`).
- The hero's overall `W` / `H` dimensions show the title block's live size (`W = 1180 PX`), updated on resize.
- The hero opens close on the name (scale ≈ 1.3, text visible throughout) and pulls back to the whole title block, as the motion skill's films do.
- **Revision = deploy:** the title block's REV cell is the commit the page was built from, linked to GitHub, with its build date (`next.config.ts` stamps `BUILD_SHA`, `BUILD_REPO`, `BUILD_DATE` from Vercel's git variables or git; no commit → the cell falls back to SCALE 1:1).
- **Live numbers:** each project shows a ruled REF line with its GitHub stars and last push and its npm downloads per week (`src/lib/live.ts`), only for what the APIs return. `/` is rebuilt daily (`revalidate = 86400`), which also keeps the career chain's "now" current. Set `GITHUB_TOKEN` in Vercel to lift GitHub's unauthenticated rate limit.
- **Section cuts:** Eidos and Sidecar carry a cutting line A–A on the plan and a `SECTION A–A` view of the layers it passes through (45° hatch = cut material); labels cite their summary phrases in `configs.ts`.
- **Lettering:** sheet titles are single-stroke Hershey Simplex capitals (`lettering-data.ts`, public domain via the MIT `hersheytext` package), drawn letter by letter by the pen when they come into view; the h2 keeps the real text for assistive tech.

## Kit (`src/components/blueprint/`)

| File         | Job                                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pen.tsx`    | `Pen`: typed port of the original drawing helpers (`dimH`, `dimV`, `callout`, `rad`, `nb`, `detailRef`, `table`, `morph` …). Server-rendered SVG; every element gets a time window (`data-w`) from `at(start, stagger, duration)`.                                                                              |
| `scene.tsx`  | `Scene` (`pin` / `flow` / `clock`, camera keys, `lead`), `SheetFrame`, `win()` for HTML (`--e`).                                                                                                                                                                                                                |
| `drive.ts`   | The only runtime JS: maps scroll (or the clock) to scene time and sets each element from time alone: dash offset for strokes, opacity for fades, `--e` for HTML, matrix for morphs, camera transform. IntersectionObserver keeps idle scenes asleep. Reduced motion: everything at its end state, no listeners. |
| `Driver.tsx` | Mounts `drive()` once; registers `public/sw.js` in production.                                                                                                                                                                                                                                                  |
| `sheets.ts`  | Sheet ids, numbers and titles.                                                                                                                                                                                                                                                                                  |

`globals.css` holds the tokens and the drawing classes (`obj`, `well`, `hug`, `slot`, `thin`, `ph`, `cl`, `dl`, `ext`, `hs`, `env`, `nb`, lettering `dt`, `dts`, `sl`, `vt` …). A `js` class set in `<head>` hides what will be drawn before the driver runs; without JS everything shows finished.

### Timing

- `pin`: progress = scroll through the section (`len` viewport heights), starting `lead` viewport heights early so the stage never arrives blank.
- `flow`: progress = how far the section's top has passed 90 % of the viewport, in section heights, so an element at fraction f of the section draws around f·T. At the page bottom, flow scenes finish.
- `clock`: T seconds from when its top is inside 95 % of the viewport (the hero, lettered titles).
- Scenes may nest (a lettered title inside a pinned sheet): each element belongs to its nearest scene.
- Parallel dev servers: `NEXT_DIST_DIR=.next-a npx next dev -p 3101` keeps a separate build folder.

## Budgets and gates

- First-load JS for `/` ≤ 120 kB (105 kB at launch; the page itself is ~2 kB). No animation library.
- Only opacity, transform and stroke-dashoffset animate; pinned stages are fixed-height sticky boxes (no layout shift).
- Off-screen sheets skip rendering work (`content-visibility: auto` on pinned stages, revisions and variables): mobile total blocking time went from ~150–230 ms to ~60–95 ms.
- Devices: iPhone mini 375×812, iPhone 16 Pro 402×874, 768×1024, 1280×800, 1440×900, 1920×1080; no horizontal scroll; safe areas respected (`viewport-fit=cover`).
- WCAG 2.2 AA; Lighthouse ≥ 90 in all four categories.

## PWA

`src/app/manifest.ts` (standalone, maskable icon) and `public/sw.js`: navigations network-first with the last good `/` as the offline fallback, `/_next/static` cache-first, everything else stale-while-revalidate. Bump `VERSION` in `sw.js` when its rules change. Icons (`public/icon*.png`, `icon.svg`, favicons) are the monochrome title-block mark.
