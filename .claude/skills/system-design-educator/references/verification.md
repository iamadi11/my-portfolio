# Verification

## Contents

- Quality rubric (used by authors and reviewers)
- Visual and educational review (stage F)
- Independent review procedure
- Checks that must run
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
- Each asset's type fits what it teaches (visual-design.md); none is decorative; no spatial, temporal or causal
  mechanism is taught by prose alone.
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

## Visual and educational review (stage F)

The reviewer works from the **rendered page** (screenshots at every required size, read zoomed in; every control
operated by keyboard and pointer; reduced motion emulated), then the source. It answers five questions, each yes
or no with a reason and file/line evidence:

1. **text-heavy:** is this still a text-heavy chapter (the mechanism carried by paragraphs, visuals as
   illustrations of them)? Pass = no.
2. **mechanism-via-visual:** could a learner understand the core mechanism primarily by interacting with the
   visuals and their short captions? Pass = yes.
3. **every-visual-teaches:** does every major visual teach something specific, named in the asset plan? Pass = yes.
4. **claims-defensible:** are the visual claims scientifically and technically defensible (labels, units, causal
   order, evidence classes, stated limits)? Pass = yes.
5. **interaction-helps:** does each interaction improve understanding rather than distract (no decorative
   controls, no answer leaks, no motion without meaning)? Pass = yes.

It also checks the 15 visual acceptance criteria (visual-design.md) and records any it could not check.
Record the answers in the spec under Review findings, on one line:

`Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes`

A failing answer is at least a should-fix finding with its fix; `verified` needs all five passing.

## Independent review procedure

1. Spawn a fresh reviewer (subagent) with only: the chapter spec path, implementation paths, the running page's
   URL, this file, visual-design.md and visual-science.md. If no
   subagent can be started, the review didn't happen: say so and stay below `reviewed` (a self-review is recorded as
   a note, never as `Reviewer:`).
2. The reviewer checks sources it can reach itself and marks what it could not check.
3. Findings come back by severity: **blocking** (wrong, inaccessible, broken), **should fix**, **note**.
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

## Browser checks

- Load the chapter at each required viewport size; take screenshots and read them (zoom into the visual).
- For each asset, operate the interaction its plan names and confirm the documented outcome appears.
- Before every reveal, confirm the answer is absent from text, accessible names and live regions.
- Operate every control with the keyboard only.
- Emulate reduced motion; confirm complete information.
- Check for horizontal scroll and layout shift.
- If the project gates on Lighthouse, run it for the chapter route.
