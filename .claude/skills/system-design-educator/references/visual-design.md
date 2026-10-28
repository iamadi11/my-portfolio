# Visual design

How a chapter looks: the page layout around figures, the figure card, the monochrome visual grammar, typography,
controls and accessibility of the visual layer. Motion has its own reference (motion.md), rendering choices theirs
(rendering.md), and review the rubric in visual-review.md.

## Contents

- Page layout: experience first
- The figure card
- Visual grammar
- Typography and spacing
- Controls
- Accessibility of the visual layer
- Where these rules come from

## Page layout: experience first

- The page leads with the question and the first figure, not a wall of text: title, one-sentence lede, the
  learning goals as a short list, then the first interactive figure within the first screen on desktop and the
  second on a phone.
- Prose sits between figures in short blocks (a few sentences) that do one of: pose the problem, label what the
  figure shows, explain the surprising behaviour, state assumptions, summarise. Text that narrates what a figure
  already shows is cut.
- Precise detail (equations, the full rule, edge cases) goes in a disclosure or a "Go deeper" block next to the
  figure it qualifies, so a learner can explore before reading it.
- One concept per figure; two or three strong figures teach more than many weak ones.

## The figure card

Every figure is a card (`.ln-fig`):

- Header: `Fig. n · <title as a question or a mechanism>` at left; the model label at right ("Teaching model, not a
  benchmark", or "A picture of the idea").
- Controls grouped in one column (or above the drawing on phones), the drawing beside them, and directly under the
  drawing: the current step text, the transport (Play/Pause/Step/Reset), the result line and the readouts.
- Live readout in true units from the model, short (`5 of 5 read · last at tick 6`).
- Caption: the assumptions and limits, one short paragraph; a key for line styles inside the card when a drawing
  uses more than two.
- The drawing fills most of the card's width; at 375 px its smallest text is at least 12 px rendered.

## Visual grammar

Monochrome drawing set (CLAUDE.md §10–11): black line on white paper, grays only; states are told apart by line
weight, dash, hatch, fill and text, never colour. Tokens: `--ink`, `--ink-2`, `--ink-3`, `--line-3` (decoration
only), `--rule`, `--fill-1`, `--fill-2`; SVG classes `bp-svg`, `obj`, `well`, `nb`, `slot`, `thin`, `arrow`, plus
the course's `ln-active` (heavy stroke), `ln-node-on` (fill), `ln-skip` (dashed), `ln-dot` (dotted).

| Thing                   | Drawn as                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Host / machine          | Rounded rectangle; its address as a tab on its top edge                  |
| Process / program       | Inner box with a short lower-case name                                   |
| Transport / lane        | Filled well (`well`) labelled TCP, UDP, …                                |
| Port, socket, endpoint  | Small tab (`nb`) with its number                                         |
| Router / network node   | Circle with a short label                                                |
| Link                    | Thin line; its delay or load written beside it when the model uses it    |
| Message / packet        | A small tag with its number or fields, travelling along the link         |
| Queue                   | A row of slots filling from the model                                    |
| Store / cache / replica | Cylinder or box labelled with its role and lag                           |
| Data vs control flow    | Solid vs dashed, with a key                                              |
| Active / current step   | Heavy stroke (`ln-active`) plus fill (`ln-node-on`) on that element only |
| Failed / lost           | Stroke ending in × plus a text label                                     |
| Degraded / uncertain    | Dotted outline (`slot`) plus a text label                                |
| Resent / copied         | Dashed (resent) and dotted (copied) arrows, named in the key             |

Lines end on the element they connect (Anatomy's line-end rule); labels never cross lines; every drawing has
one focus at a time.

## Typography and spacing

- The host's type: Arimo; drawing labels in caps (`.bp-svg text`), addresses and numbers in mixed case
  (`.dts`). One family, sizes from the host scale.
- Body text at least 16 px on phones, line length 65–75 characters, line height 1.5–1.75 (ui-ux-pro-max
  `typography`).
- Consistent card padding and gaps; content width matches the course shell.

## Controls

- Native controls: radio groups as segmented buttons (`Choice`), buttons for actions, `input type=range` for
  continuous inputs with value and unit beside them.
- Touch targets at least 44 × 44 px with 8 px between them (ui-ux-pro-max; WCAG 2.5.8 is the 24 px floor).
- Visible focus ring on every control; hover feedback by stroke or fill, never by movement that shifts layout.
- Disabled-at-the-end buttons use `aria-disabled` and keep focus.

## Accessibility of the visual layer

From WCAG 2.2 (read in w3c/wcag): colour is never the only means (1.4.1, A); graphical objects that carry meaning
reach 3:1 contrast (1.4.11, AA); everything works from a keyboard (2.1.1, A); dragging has a single-pointer
alternative (2.5.7, AA); target size (2.5.8, AA); status messages reach assistive technology without moving
focus (4.1.3, AA); reflow at 320 CSS px (1.4.10, AA); moving content that starts on its own and lasts over 5 s can
be paused (2.2.2, A).

So every figure has: a text alternative that states the current state and updates on change (step list, event
list, readouts); the drawing `aria-hidden` when that text carries the same information; one polite live region
per kind of change; and a manual screen-reader check recorded as not run until a person runs it.

## Where these rules come from

- **ui-ux-pro-max (vendored skill, run with its search script):** design system for an interactive technical
  course came back as "Immersive/Interactive Experience" with micro-interactions, a monochrome palette, light
  mode, "provide a skip option; mobile fallback essential". Taken: micro-interactions on controls, 150–300 ms
  transitions, animate 1–2 elements per view, 44 px targets with 8 px gaps, ease-out on enter, aria-live and
  keyboard handlers, `next/dynamic` for heavy components, a table alternative for flow charts. Not taken: its blue
  accent and Space Mono (the host's CLAUDE.md requires monochrome and the course uses the site's Arimo).
- **Anatomy (MIT):** the figure card (number, title, hint, live readout); one model drives motion, readouts and
  caption; zoom in on every screenshot like a critic; every line ends on something. Its "the object is the
  explanation" (a physical machine as metaphor) is used only when the mapping is exact and stated; in this course
  the system itself (hosts, links, queues) is drawn directly.
- **Award sites (teardown in `docs/v2-research/`):** typography carries hierarchy, a restrained palette, index
  numbers and metadata rows instead of paragraphs, real HTML first with the visual growing in. Their gates,
  loaders and spectacle are not for a learning page.
