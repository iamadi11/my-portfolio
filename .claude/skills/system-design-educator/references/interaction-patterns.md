# Interaction patterns

A library of learning interactions. Pick by what the objective needs; never force every pattern into a chapter.
Every interaction must change the model and show a visible consequence: a control that changes a number the
model ignores, or a button that plays a decorative animation, is not interaction. Quizzes are one pattern of
nine, not the default.

## Contents

- Choosing a pattern
- The nine patterns
- Rules every pattern follows
- Kit components

## Choosing a pattern

| The learner must…                                   | Pattern (asset plan `pattern:`) |
| --------------------------------------------------- | ------------------------------- |
| feel how an output depends on an input              | `manipulate`                    |
| commit to an expectation before seeing it           | `predict`                       |
| follow a mechanism in order                         | `step`                          |
| find out what a part is and how it connects         | `explore`                       |
| see where a failure starts and how it spreads       | `break`                         |
| isolate which variable causes a difference          | `compare`                       |
| learn which configurations work and why others fail | `construct`                     |
| read a quantitative relationship                    | `quantitative`                  |
| reason from symptoms to a cause                     | `debug`                         |

A chapter's assets together must use at least one pattern other than `predict` (`course.mjs check` enforces it).
Most strong figures combine two or three: predict → manipulate → step is the common spine.

## The nine patterns

**A. Manipulate and observe (`manipulate`).** One meaningful input (slider, segmented choice, toggle) with a
stated unit and range; the drawing and readout change at once, from the model. Show the before value beside the
after value when the change is small. Examples: cache hit rate → backend requests per second; capacity →
queue growth; replication delay → how long replicas disagree; timeout → which requests are retried.

**B. Predict and experiment (`predict`).** One short question with real-misconception choices, asked before the
run. Nothing that reveals the answer is in the page before the reveal: not the drawing, labels, accessible names,
live regions or hidden-but-rendered text. After the run, show the prediction next to the outcome and the rule
that produced it. Changing any input clears the outcome. Test the leak (browser suite).

**C. Step through a mechanism (`step`).** Previous / Next / Play / Pause / Reset / Replay, and a list of the
steps the learner can jump to. Each step names what changed and why, with its rule or source, and highlights the
element it changes. The current step's text sits next to the drawing, not a screen away. Every state is
reachable without waiting for an animation.

**D. Explore a system (`explore`).** Selectable components (buttons, not bare SVG shapes) that reveal a part's
role, state, inputs, outputs and failure behaviour, and highlight its connections. Tracing a request through the
architecture is a sequence of selections. Keyboard: Tab to a part, Enter to inspect, Escape to close.

**E. Break the system (`break`).** Inject one controlled failure (a timeout, stale cache, unavailable replica,
saturated queue, failed dependency, cut link) and watch where it starts and how it spreads. The figure shows
the origin, the propagation in order, and what each component can observe of it (often less than the learner
sees). Always offer the healthy run for contrast.

**F. Compare scenarios (`compare`).** Two runs side by side (or overlaid) that differ in exactly one variable
(cache vs no cache, one vs three replicas, retry vs no retry, low vs overloaded), driven by the same clock so
differences line up in time. Name the variable that differs above both.

**G. Construct or configure (`construct`).** The learner assembles a small architecture, picks a routing rule,
or configures a retry policy from a short palette; invalid combinations are allowed but flagged immediately with
their consequence ("two writers, no ordering: this write can be lost"). Never drag-only: every placement has a
button or menu alternative (WCAG 2.5.7).

**H. Inspect quantitative behaviour (`quantitative`).** An interactive chart whose axes, units and scale are
stated, whose data comes from the model (labelled measured, model, or illustrative), and whose cursor or
annotation is tied to the run on screen. The chart explains a relationship (where the queue starts growing),
not just a number. A table alternative holds the same values.

**I. Debug and diagnose (`debug`).** A failing system with symptoms the learner can inspect (logs, counters,
states) and hypotheses to test by changing one thing; feedback says what each test rules in or out. End with the
cause and the evidence that pointed to it.

## Rules every pattern follows

- **Model-driven.** Every visible change and every readout comes from the chapter's pure model; the component
  only renders model state. Same inputs, same result (seeded randomness if any).
- **Visible consequence.** Each control's effect is visible in the drawing within one frame and named in text.
- **Reversible.** Reset returns to the initial state; nothing is lost by exploring.
- **Accessible.** Native controls (radio groups, buttons, `input type=range`) with labels; keyboard for
  everything; touch targets at least 44 × 44 px with 8 px gaps (ui-ux-pro-max; WCAG 2.5.8's 24 px is the floor);
  one polite live region per kind of change, announced on change, never per frame; state never by colour alone.
- **Calm.** One or two animated elements at a time; the rest still.
- **Honest.** Interactions show model behaviour; where real systems vary (configuration, implementation), say so
  next to the control.

## Kit components

In `src/components/learn/kit/` (reuse before writing new ones; add to the kit when a pattern needs a part it
lacks):

- `Choice`: labelled radio group drawn as segmented buttons (manipulate, predict, compare).
- `Transport`: Play/Pause, Previous/Next step, Reset, Replay, with the current step announced (step, break).
- `useClock`: the figure's time, play/pause/seek/step, stops offscreen, reduced motion → stepped (motion.md).
- `Question`: a recall question with its answer behind a disclosure.
- `NearViewport`: renders a server-rendered fallback card (same figure id and height), loads the interactive
  figure with `React.lazy` when it nears the viewport (rendering.md).
- `reveal`: after Run, bring the whole result into view.
- `verdict`: the line that judges a prediction (none made, right, not quite).
