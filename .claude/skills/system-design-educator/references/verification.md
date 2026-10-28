# Verification

## Contents

- Quality rubric (used by authors and reviewers)
- Visual and educational review (stage 6)
- Independent review procedure
- Checks that must run
- Verify the animation
- Browser checks

## Quality rubric

Each item is pass / fail / not applicable, with a file and line for every fail.

**Accuracy**

- Every claim has a source record; tier 1–2 for anything factual about a system or protocol.
- Simplifications are flagged and point to the fuller treatment.
- Numbers have sources and versions, or are labelled assumed.
- No invented stories, benchmarks or quotes.
- No claim rests only on `via: search` sources (required from `implemented`; allowed but flagged before that).

**Teaching**

- All 14 questions answered; the naive design and its failure are present.
- Every term defined at first use; every equation variable explained with units.
- Analogies state where they break.
- Retrieval questions ask for recall or prediction; feedback explains why; distractors are real misconceptions.
- Worked example present; exercise fades steps or asks for transfer.
- Main path readable without "Go deeper" parts.

**Visuals and models**

- An asset plan exists before the explanation; every objective maps to an asset or a stated text-only reason.
- Each asset's type fits what it teaches (rendering.md) and its pattern what the learner must do
  (interaction-patterns.md); none is decorative; no spatial, temporal or causal mechanism is taught by prose alone.
- Motion explains causality and comes from the model's events (motion.md); pause, step and reduced motion work.
- Every readout computed from model state; every control changes the model as documented.
- Model labelled "teaching model, not a benchmark" (or "picture of the idea") with assumptions beside the visual.
- Each claim carries its evidence class; illustrative numbers are labelled assumed; no fake tool output.
- The adversarial pass is recorded per asset, and the misconception guards are tested.
- Tests cover invariants, boundaries, determinism, known cases, answer leakage and every number quoted in the text.
- The visual grammar is consistent (one shape per kind of thing, one line style per kind of flow, legend).

**Product**

- Keyboard operable, visible focus, labels, text alternatives, contrast (WCAG 2.2 AA).
- Reduced motion shows complete information.
- Works at the project's required viewport sizes with no horizontal scroll.
- Within the project's performance budgets; no regressions elsewhere.
- Design language matches the host project.

**State**

- Status in CURRICULUM matches the evidence; COURSE_STATE updated; open issues recorded.

## Visual and educational review (stage 6)

The reviewer judges the rendered page with the rubric in visual-review.md: five questions, ten dimensions, the
reject list and the acceptance criteria, recorded as the `Visual review:`, `Visual rubric:` and `Rejects:` lines.

## Independent review procedure

1. Spawn a fresh reviewer (subagent) with only: the chapter spec path, implementation paths, the running page's
   URL, this file, visual-review.md, scientific-modeling.md, interaction-patterns.md and motion.md. If no
   subagent can be started, the review didn't happen: say so and stay below `reviewed` (a self-review is recorded as
   a note, never as `Reviewer:`).
2. The reviewer checks sources it can reach itself and marks what it could not check.
3. Findings come back by severity: **blocking** (wrong, inaccessible, broken), **should-fix**, **note**.
4. The author fixes blocking and should-fix findings or records a reason for each one not fixed; notes are optional.
5. Record findings and outcomes in the spec (format in course-state.md). `reviewed` = review ran on the
   implementation and its evidence; `verified` = no open blocking or should-fix.

## Checks that must run

Use the host project's own commands (for this repo see `CLAUDE.md` release gates): typecheck, lint, the test
runner for model tests, and the project's build if routes changed. Record each command and result in the spec's
Evidence section (`pass`, `fail`, `not run`, `n/a` with reason). A failed check is fixed at its cause and re-run;
one that could not run (missing browser, tool or network) stays `not run` and the chapter stays below `tested`.
Never replace a required check with a weaker one and call it a pass.

**Required checks** are the host project's release gates (its CLAUDE.md) plus the chapter's own: model tests for any
model, browser checks (sizes, keyboard, reduced motion) for any chapter with a page. `n/a` is only for a check that
does not apply to this chapter (e.g. no model, so no model tests), with that reason; "couldn't run it" is never
`n/a`. A `pass` line must not also say skipped, unavailable or failed (`check` rejects it).

## Verify the animation

Run this on the rendered page after the model tests pass, and before the chapter is called tested. It is
evidence for step 7. It is not a review. A self-check does not satisfy step 8.

Use Play, Pause, Previous, Next, Reset if the figure has them. Repeat with the keyboard only. Emulate
`prefers-reduced-motion: reduce`. Hide the prose (crop the screenshot, or cover the paragraphs) and look only
at the figure and its readout.

Record one line when every item passes:

`- animation sense: pass — Verify the animation (<date>, URL)`

Any failure:

`- animation sense: fail — <item>: <what you saw>`

A fail or `not run` keeps the chapter below tested.

| Item | Pass when |
| --- | --- |
| Event sync | At each step, the mark's position, width, count, or presence equals the model field named in Animation sense. "Something moved" is a fail. |
| Causal read | With the paragraphs hidden, you can say what changed and why. |
| Reduced motion | The end state and the readout match the full run. Every event is reachable without watching the interpolation. |
| Keyboard | Every event is reachable from the keyboard. Focus is visible. |
| Honest control | A control that should change the model changes the picture. A control that does not change the model does not fake a move. |

## Browser checks

- Load the chapter at each required viewport size; take screenshots and read them (zoom into the visual).
- For each asset, operate the interaction its plan names and confirm the documented outcome appears.
- Before every reveal, confirm the answer is absent from text, accessible names and live regions.
- Operate every control with the keyboard only.
- Play, pause, step, reset and replay every animated run; confirm each event's state matches the event list.
- After Run at 375 px, confirm the result is in view.
- Emulate reduced motion; confirm complete information.
- Check for horizontal scroll and layout shift.
- If the project gates on Lighthouse, run it for the chapter route.
