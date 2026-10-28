# Visual review

The release rubric for the visual and interactive layer, used by the independent reviewer (mode C step 8) and by
mode D audits. It judges the rendered page, not the source: a chapter is not visually complete because it contains
SVG, CSS animation, a canvas or a 3D model.

## Contents

- How the review runs
- Five questions
- Ten dimensions
- Reject on sight
- Acceptance criteria
- What to record

## How the review runs

- A fresh reviewer (subagent with no authoring context) gets the spec path, implementation paths, the running
  page's URL, and this file, scientific-modeling.md, interaction-patterns.md, motion.md and verification.md.
- It works from the rendered page first: viewport screenshots at 375, 402, 768, 1280, 1440 and 1920 px, read
  zoomed in; every control operated by pointer and keyboard; every run played, paused, stepped, reset and replayed;
  reduced motion emulated; then the source and the model tests.
- It checks claims against the sources it can reach and lists what it could not check.
- Findings by severity: **blocking** (wrong, inaccessible, broken, a reject below), **should-fix**, **note**.
  Blocking and should-fix findings are fixed, or accepted with a recorded reason, before `verified`.

## Five questions

Each yes or no with a reason and file/line or screenshot evidence:

1. **text-heavy:** is the mechanism carried by paragraphs, with visuals illustrating them? Pass = no.
2. **mechanism-via-visual:** could a learner understand the core mechanism mainly by interacting with the figures
   and their short captions? Pass = yes.
3. **every-visual-teaches:** does every figure teach something specific named in the asset plan? Pass = yes.
4. **claims-defensible:** are labels, units, causal order, evidence classes and stated limits correct? Pass = yes.
5. **interaction-helps:** does each interaction improve understanding rather than distract? Pass = yes.

## Ten dimensions

Each pass or fail, with evidence for every fail:

| Dimension       | Passes when                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `education`     | The hardest concepts named in the concept decomposition are each taught by an interaction the learner acts on |
| `clarity`       | Each figure reads at a glance at 375 px and 1280 px: one focus, legible labels, a key for line styles         |
| `interaction`   | Every control changes the model visibly; patterns go beyond quizzes; predictions don't leak                   |
| `correctness`   | Model, readouts and text agree with sources and tests; illustrations are labelled as such                     |
| `animation`     | Every motion shows a real process or state change; pausable; stepped under reduced motion                     |
| `hierarchy`     | The page leads with the problem and the first figure; text sits beside what it explains                       |
| `accessibility` | Keyboard, focus, labels, live regions, contrast, no colour-only state, text alternatives                      |
| `mobile`        | No horizontal scroll at 375 px; 44 px targets; the result of a run is in view after Run                       |
| `performance`   | First-load JS within budget; figures lazy-loaded; no jank while playing (Lighthouse ≥ 90)                     |
| `consistency`   | The course's grammar, card and type; no one-off styles                                                        |

## Reject on sight

Each is a blocking finding:

- A text-heavy layout where a figure could teach the mechanism better.
- A generic diagram with no explanatory purpose.
- An animation that does not represent a real process or state transition.
- A decorative 3D scene unrelated to the objective, or 3D without a written reason.
- A fake scientific graph or an unsupported number.
- A control with no meaningful effect.
- Repeated quiz cards presented as the interactivity.
- A scene so complex that a beginner cannot find the point.
- Prose that repeats what the figure already shows.

## Acceptance criteria

A chapter is visually complete only when each holds (or has a documented exception):

1. Every objective maps to a figure or a stated text-only reason; the hardest concepts each have an interaction.
2. The core mechanism can be understood from the figures plus their short captions.
3. Every figure states its purpose; none is decorative.
4. Labels, units, state transitions and relations are correct; the event list matches the model.
5. Every control changes the model as documented.
6. Predictions and outcomes agree with the model's rules; no answer leaks before the reveal.
7. Assumptions and limits are beside each figure.
8. No critical information only by colour or only by motion.
9. Keyboard and screen-reader support suit each interaction.
10. Reduced motion keeps every state reachable.
11. Works at 375, 402, 768, 1280, 1440 and 1920 px, no horizontal scroll.
12. First-load JS within budget; `/` unchanged.
13. Tests cover transitions, boundaries, invalid inputs, reset/replay, misconception guards and leaks.
14. An independent reviewer examined the rendered experience.
15. Usable without a powerful GPU, special hardware or a large download.

## What to record

Under the spec's `## Review findings`, after the `Reviewer:` line, three lines that `course.mjs check` reads (the
latest block counts):

```
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes
Visual rubric: education=pass · clarity=pass · interaction=pass · correctness=pass · animation=pass · hierarchy=pass · accessibility=pass · mobile=pass · performance=pass · consistency=pass
Rejects: none
```

`reviewed` needs all three lines; `verified` needs the five answers passing, every dimension `pass`, and
`Rejects: none`. A failing answer or dimension is at least a should-fix finding with its fix.
