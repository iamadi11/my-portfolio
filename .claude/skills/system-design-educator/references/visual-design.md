# Visual design

How a chapter's visuals are chosen, drawn, made interactive, made accessible and kept fast. Model and evidence
rules are in visual-science.md; research behind the choices is in learning-science.md.

## Contents

- The visual-first sequence (stages A–F)
- Asset types and when to use them
- The course's visual grammar
- Interaction patterns
- Motion
- Accessibility for animated and interactive content
- Performance
- Asset plan format
- Visual acceptance criteria

## The visual-first sequence (stages A–F)

A. **Learning problem.** The misconception to correct; what the learner can predict, explain or calculate
afterwards; the minimum mental model; which ideas prose handles badly (change over time, spatial relations,
many-to-many relations, cause and effect under a variable); what observable behaviour would show understanding;
the assumptions that must be visible.

B. **Storyboard and asset plan** (before the explanation is drafted). For each objective, choose the teaching
method from the asset types below, or "text is enough" with a reason. Sketch the sequence of visual states the
learner will move through. Write the asset plan entry (format below). Reject a plan that teaches a spatial,
temporal or causal mechanism with prose alone; do not add a visual where text is genuinely clearer.

C. **Build the visual model first.** The pure model and its tests, then the visual and its interaction, then the
page around it. The visual establishes the mental model; the prose then names and qualifies what it shows. While
`Product: none`, stage D's text is only a draft against the storyboard (mode C step 5); it is rewritten against the
rendered visuals when they are built (step 6), and prose that only repeats a visual is cut.

D. **Concise supporting text.** Beside or right after each visual: what the learner sees, why it happens, what is
assumed, where the model breaks. Prefer two sentences next to a figure over two paragraphs describing what a figure
could have shown.

E. **Test learning and correctness.** Model tests (invariants, boundaries, every quoted number), interaction tests
(every control changes the model; prediction answers hidden until reveal), and the adversarial misconception pass.

F. **Independent visual and educational review** of the rendered page (verification.md).

## Asset types and when to use them

| Type (asset plan `type:`) | Use when                                                                                                          | Must have                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `precision-2d`            | Structure and relations: topology, layering, request lifecycle, data flow, sequence                               | One visual grammar; unambiguous arrows; labels legible at 375 px; legend; what is omitted is stated                       |
| `animated-2d`             | Change over time is the concept: a packet's hops, queue growth, a write reaching replicas                         | Causal order; step / pause / replay; every state reachable without timing; reduced-motion form                            |
| `simulation`              | Insight comes from changing a variable and watching consequences                                                  | Inputs with ranges, rules, assumptions, outputs, what it supports and does not (visual-science.md); deterministic presets |
| `chart`                   | A quantitative relationship matters: percentiles, throughput vs load, lag over time                               | Axes, units, scales; data labelled measured / model / illustrative; no fake measurements                                  |
| `3d`                      | Depth carries meaning 2D cannot show without confusion: physical/regional layout, layered stacks seen at an angle | Readable from the first camera angle; keyboard and touch; labels and legend; 2D or static fallback; lazy-loaded           |
| `illustration`            | A concrete anchor (an object, a scene) the learner recognises, before an abstract model                           | Annotated; says it is a picture of the idea, not a capture                                                                |
| `experiment`              | The learner can try the real thing safely (e.g. read their own browser timing entry)                              | Expected results stated as ranges, not promises; works without special hardware                                           |
| `text`                    | A definition or short argument a picture would only decorate                                                      | The reason text is enough                                                                                                 |

Choose the minimum effective set: a chapter with three strong interactive diagrams is better than one with ten
decorative ones. 3D is the exception: prefer an isometric SVG drawing for depth cues; use a 3D engine only when the
asset plan states what depth teaches that 2D cannot, its cost in KB, and its fallback.

## The course's visual grammar

Monochrome drawing set (CLAUDE.md §10–11): black line on white paper, grays only; states are told apart by line
weight, dash, hatch, fill and text, never by colour. Use the host's tokens (`--ink`, `--ink-2`, `--ink-3`,
`--line-3` (decoration only), `--rule`, `--fill-1`, `--fill-2`) and SVG classes (`bp-svg`, `obj`, `thin`, `arrow`)
and the shared course kit in `src/components/learn/kit/` once it exists; add to the kit rather than redrawing.

| Thing                             | Drawn as                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Machine / host / process          | Rounded rectangle; host = outer box, process = inner box; label inside, role below in small caps |
| Interface / endpoint (IP, port)   | Small square tab on a host's edge, labelled with its address or number                           |
| Network / router                  | Circle (router) or cloud-free rounded band (network); never a stock cloud icon                   |
| Store (queue, cache, DB, replica) | Queue = row of slots; cache/DB = cylinder; replica = same shape, labelled with its lag           |
| Request / response / message      | Arrow with a head; request and response are separate arrows; a packet is a small labelled tag    |
| Control flow vs data flow         | Data: solid line; control/signalling: dashed line; the legend says so                            |
| Active / idle                     | Active: 2.4 px stroke and `--fill-2`; idle: thin stroke, no fill                                 |
| Failed / lost                     | Dashed stroke ending in a cross "×" with text ("lost")                                           |
| Degraded / uncertain              | Hatched fill or dotted outline with text ("degraded", "unknown to the client")                   |
| Recovering                        | Dash-dot outline with text                                                                       |
| Emphasis on the current step      | Heavier stroke and fill on that element only; one focus at a time                                |

Labels: horizontal, at least 12 px rendered at 375 px, inside or beside their element (never crossing a line).
Every drawing has a legend when it uses more than two line styles. Annotate units on quantities.

## Interaction patterns

Use the pattern the objective needs; a control that changes nothing is forbidden.

- **Predict → run → explain:** ask before revealing; show the model's result next to the prediction; then the
  rule that explains it. Hide every answer (text, accessible name, live region) until the reveal; test it.
- **Change one variable:** one meaningful parameter at a time, with a visible, explained effect.
- **Step through:** previous / next / reset (and play / pause if it animates); every state is a step.
- **Inspect:** select a component to see its role, state, inputs, outputs and failure behaviour.
- **Inject a failure:** trigger one relevant failure and trace its consequence.
- **Compare:** two scenarios side by side differing in one assumption.
- **Explain the result:** after every run, say which rule produced the outcome; never leave the learner to infer
  a mechanism from motion alone.

## Motion

- Animate only when change over time is the point; motion must show causal order or a state change.
- One thing moves at a time; the moving thing is the one the text is about.
- Learner-paced by default (step controls); autoplay only for short loops, with pause (WCAG 2.2.2 for anything
  that starts automatically, lasts over 5 s and runs beside other content).
- Animate only `transform`, `opacity` and stroke-dashoffset; nothing that triggers layout.
- `prefers-reduced-motion: reduce`: the same states as a numbered sequence, no movement (CLAUDE.md §10.7;
  WCAG 2.3.3 is AAA, but the course requires it).
- Never put essential information only in a transition; the end state of each step is complete on its own.

## Accessibility for animated and interactive content

From WCAG 2.2 (read in w3c/wcag): color is never the only means of conveying information (1.4.1, A); graphical
objects needed to understand content and UI states reach 3:1 contrast (1.4.11, AA); all functionality works from
a keyboard (2.1.1, A); dragging always has a single-pointer alternative (2.5.7, AA); targets are at least 24 × 24
CSS px or spaced (2.5.8, AA); status messages reach assistive technology without moving focus (4.1.3, AA); content
reflows at 320 CSS px without two-dimensional scrolling, except parts that need 2D layout (1.4.10, AA); moving
content that starts automatically for over 5 s can be paused (2.2.2, A).

So every interactive figure has: a text alternative that states the current state and updates with it (polite live
region, one per kind of change, never per frame); controls that keep focus when they become unavailable
(`aria-disabled`); decorative SVG marked `aria-hidden` with the same information in text; a reduced-motion form; and
a manual screen-reader check recorded as not run until a person runs it.

## Performance

- First-load JS per page ≤ 120 kB (CLAUDE.md §10.4); interactive figures are client components, the page is server-rendered.
- SVG + CSS for diagrams with up to a few hundred elements; Canvas 2D when the element count or per-frame redraw
  makes the SVG DOM the bottleneck (measure first); WebGL/3D only per the 3D row above, loaded on demand
  (`next/dynamic` after interaction or when scrolled into view) so it never counts toward first-load JS.
- One `requestAnimationFrame` loop per figure at most, paused when off-screen or when nothing changes.
- Must run on a mid-range phone without a GPU-heavy effect (no bloom, particles or blur filters for meaning).

## Asset plan format

In the chapter spec, under `## Asset plan`, after the boundary and before the explanation. `course.mjs check`
reads it for specs that declare `Standard: visual-first`.

```markdown
## Asset plan

Objective coverage: 1 → A1 · 2 → A2, A3 · 3 → A3

### A1. <name>

- objective: 1
- type: precision-2d
- learner sees: <what is on screen>
- learner does: <the interaction, or "reads">
- model: <state, inputs with units and ranges, rules; or "conceptual illustration: <what it shows>">
- assumptions: <what is simplified or left out, and the misconceptions guarded against>
- outcome: <what the learner can predict, explain or calculate afterwards>
- accessibility: <text alternative, keyboard, reduced motion, fallback>
- tests: <model tests, interaction tests, leak tests>
- evidence: <source ids with sections, and the evidence class of each claim>
- built: <file paths once implemented>
```

An objective may be taught by text only: list it as `- text-only: <n> — <reason>` under `## Asset plan`.
A chapter whose assets are all `text` or `illustration` needs a line `Visual exception: <reason>`.

## Visual acceptance criteria

A chapter is visually complete only when each holds (or has a documented fix, exception or limitation):

1. Every main objective maps to an explicit visual teaching moment (or a stated text-only reason).
2. The core mechanism can be understood from the visuals plus their short explanations.
3. Every visual has a stated purpose; none is decorative.
4. Labels, units, state transitions and relations are correct.
5. Every control changes the model as documented.
6. Predictions and results agree with the model's rules.
7. Assumptions and simplifications are discoverable beside the visual.
8. No critical information only by colour or only by animation.
9. Keyboard and screen-reader support suit each interaction.
10. Reduced motion keeps every state.
11. Works at 375, 402, 768, 1280, 1440 and 1920 px, no horizontal scroll.
12. First-load JS ≤ 120 kB per page.
13. Tests cover critical transitions, boundaries and answer leakage.
14. An independent reviewer examined the rendered experience (verification.md).
15. Usable without a powerful GPU, special hardware or a large download.
