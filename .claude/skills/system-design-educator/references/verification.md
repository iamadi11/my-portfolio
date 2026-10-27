# Verification

## Contents

- Quality rubric (used by authors and reviewers)
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
- No claim rests only on `via: search` sources (required for `verified`; allowed but flagged before that).

**Teaching**

- All 14 questions answered; the naive design and its failure are present.
- Every term defined at first use; every equation variable explained with units.
- Analogies state where they break.
- Retrieval questions ask for recall or prediction; feedback explains why; distractors are real misconceptions.
- Worked example present; exercise fades steps or asks for transfer.
- Main path readable without "Go deeper" parts.

**Visuals and models**

- Medium decision has a reason; no decorative visuals.
- Every readout computed from model state; every control changes the model.
- Model labelled "not a benchmark" with assumptions listed.
- Tests cover conservation, bounds, determinism, known cases and every number quoted in the text.

**Product**

- Keyboard operable, visible focus, labels, text alternatives, contrast (WCAG 2.2 AA).
- Reduced motion shows complete information.
- Works at the project's required viewport sizes with no horizontal scroll.
- Within the project's performance budgets; no regressions elsewhere.
- Design language matches the host project.

**State**

- Status in CURRICULUM matches the evidence; COURSE_STATE updated; open issues recorded.

## Independent review procedure

1. Spawn a fresh reviewer (subagent) with only: the chapter spec path, implementation paths, this file.
2. The reviewer checks sources it can reach itself and marks what it could not check.
3. Findings come back by severity: **blocking** (wrong, inaccessible, broken), **should fix**, **note**.
4. The author fixes blocking and should-fix findings or records a reason for each one not fixed; notes are optional.
5. Record findings and outcomes in the spec. `reviewed` = review ran; `verified` = no open blocking or should-fix.

## Checks that must run

Use the host project's own commands (for this repo see `CLAUDE.md` release gates): typecheck, lint, the test
runner for model tests, and the project's build if routes changed. Record each command and result in the spec's
Evidence section. A check that could not run is listed as not run, with the reason.

## Browser checks

- Load the chapter at each required viewport size; take screenshots and read them (zoom into the visual).
- Operate every control with the keyboard only.
- Emulate reduced motion; confirm complete information.
- Check for horizontal scroll and layout shift.
- If the project gates on Lighthouse, run it for the chapter route.
