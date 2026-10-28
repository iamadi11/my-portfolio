# Course state

## Contents

- Status gates (what each one requires)
- Evidence formats `check` reads
- CURRICULUM.md format
- COURSE_STATE.md format
- How "next" is chosen
- Updating state

## Status gates

Statuses are ordered. A chapter holds the highest gate whose evidence exists **and** all lower gates. Gates are
lowered when their evidence stops holding (a source turned out wrong, a test now fails).

| Status        | Evidence required (✓ = enforced by `course.mjs check`)                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned`     | Row in `CURRICULUM.md` with id, title, prerequisites, paths ✓                                                                                                                           |
| `researched`  | `chapters/<id>.md` exists ✓ with source records ✓; every claim in the boundary has a record or is listed under open questions                                                           |
| `authored`    | Full teaching design (14 questions, worked example, retrieval items, exercise) and the visual decision/spec                                                                             |
| `implemented` | Content and any visualization/simulation exist in the host app at the paths the spec names; no source with `via: search` supports a claim ✓                                             |
| `tested`      | Evidence has its own line for each of typecheck, lint, model tests, browser (suite or sizes), keyboard and reduced motion ✓, each `pass` or `n/a — reason` ✓                            |
| `reviewed`    | An independent review (fresh agent, verification.md) ran on the implementation and its evidence: a `Reviewer:` line naming a fresh/independent reviewer or subagent ✓, findings listed  |
| `verified`    | No blocking or should-fix finding left open ✓: an arrow (`→`) leads to `fixed` or `accepted: <reason>`, none leads to `open`; every `## Review findings` section is read; state updated |

From `authored` on, every spec has a `Standard:` line under its title ✓: `visual-first`, or `legacy — <why>` for a spec
written before the standard. **Visual-first specs** also need, checked by `check` (✓):

| From          | Also required                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authored`    | `## Concept decomposition` filled with 2–3 `Hardest:` lines ✓; `## Storyboard` filled; `## Asset plan` with `### A<n>` assets, each with all fourteen fields ✓ (objective, type, pattern, learner sees, animated, learner does, notice, model, feedback, assumptions, outcome, accessibility, tests, evidence); every numbered objective covered by an asset or a `text-only:` line ✓; known `type:` and `pattern:` values ✓; `simulation`, `animated-2d`, `chart` and `3d` have a real `model:` and `assumptions:` ✓; at least one pattern beyond `predict`/`read` ✓; at least one asset that animates something, or a `Motion exception:` line ✓; at least one non-`text`, non-`illustration` asset or a `Visual exception:` line ✓ |
| `implemented` | Every non-`text` asset has `built:` paths that are existing files under `src/` or the `Product:` path ✓; `simulation`, `animated-2d`, `chart` and `3d` list their model's test file ✓                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `reviewed`    | `Visual review:` (five keys), `Visual rubric:` (ten dimensions) and `Rejects:` lines ✓; the latest of each counts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `verified`    | All five answers passing (`text-heavy=no`, the other four `yes`), every rubric dimension `pass`, `Rejects: none` ✓                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

A `legacy` spec gets a `check` warning, not an error; bring it up to the standard with a mode D pass, recorded as an
open issue. A spec with no `Standard:` line fails from `authored` on.

Never skip a gate. Never mark `tested` because tests "should" pass. `check` sees only structure: a ✓ means the
evidence is written down, not that it is good; the rest is the author's and reviewer's job. It catches honest
slips (a missing line, an open finding, a stale review), not a deliberately misleading spec: wording can always be
bent past a pattern, which is why every gate past `tested` needs an independent reviewer.

## Evidence formats `check` reads

In `docs/system-design/chapters/<id>.md`:

```markdown
## Sources

- id: rfc9110
  via: read
  supports: [c1, c2]

## Evidence

- typecheck: pass — npx tsc --noEmit (2026-11-02)
- model tests: fail — npm test: queue conserves requests (2026-11-02)
- browser 375×812: not run — no browser in this environment
- lighthouse: n/a — the project doesn't gate this route

## Review findings

Reviewer: fresh subagent, 2026-11-03, rubric verification.md

- [blocking] p99 readout uses mean × 3 → fixed (model.ts percentile)
- [should-fix] analogy has no stated limit → accepted: covered in "Go deeper"
- [note] long sentence in step 4 → open
```

- Evidence result is one of `pass`, `fail`, `not run`, `n/a` (with a reason). Any `fail` or `not run` means the
  chapter is not `tested`. Re-run after a fix and replace the line; don't keep both.
- A finding ends with `→ fixed (…)`, `→ accepted: <reason>` or `→ open`. `verified` needs no open blocking or
  should-fix finding.
- A source with `via: search` may support claims while the chapter is `researched` or `authored` (flagged as
  unverified in the spec); from `implemented` on it must be read, replaced, or kept with `supports: none`.

## CURRICULUM.md format

Free prose (stages, paths, rationale), one `Product:` line, and exactly one table between the markers below;
`course.mjs` reads only those.

```markdown
Product: none # or the route/manifest path once the course exists in the app, e.g. src/app/learn

<!-- graph:start -->

| id          | order | stage | title                                | prereqs     | paths                         | status  |
| ----------- | ----- | ----- | ------------------------------------ | ----------- | ----------------------------- | ------- |
| web-request | 1     | 1     | What happens when you open a website |             | beginner interview            | planned |
| dns         | 2     | 1     | DNS: names to addresses              | web-request | beginner interview production | planned |

<!-- graph:end -->
```

- `id`: kebab-case, stable forever (it becomes a URL and a file name). Renames are recorded in COURSE_STATE.
- `order`: the default reading order (integers, unique). Prerequisites must have a smaller order.
- `prereqs`: space-separated ids, hard prerequisites only (what the chapter's explanation relies on).
- `paths`: any of `beginner interview production`, each once; every chapter is on at least one, and on no path
  that lacks one of its prerequisites (`check` enforces this: paths are closed).
- `status`: one gate name from the table above.
- `Product: none` means the course has no app yet: chapters can reach `authored` at most, and `authored` counts as
  done when choosing the next chapter. Mode A sets it to the real path once the product exists; from then on
  `authored` chapters are in progress again until `verified`.

## COURSE_STATE.md format

```markdown
# Course state

State: <not initialized | initialized>
Updated: <YYYY-MM-DD>

## Current unit

<chapter id and step number, or "none">

## Next action

<one line: mode and target>

## Decisions

- <YYYY-MM-DD> <decision> — <why>
- <YYYY-MM-DD> Proposal (not built): <what> — <why> (mode A placement and budgets; becomes a decision when built)

## Open issues

- <issue> (<chapter id or "course">)

## Session log

- <YYYY-MM-DD> <A|B|C|D> <chapter id or "course">: <gate before> → <gate after>; <one-line summary>
```

Keep it short: decisions and issues are one line each; detail lives in chapter specs.

## How "next" is chosen

`course.mjs next` applies these rules in order; the first match wins:

1. **Resume.** `COURSE_STATE` "Current unit" names a chapter that isn't done → that chapter (an unfinished unit is
   never abandoned). An unknown id there is a `check` error, not silently skipped.
2. **Finish what is started.** The lowest-`order` chapter whose status is above `planned` and not done (done =
   `verified`, or `authored` while `Product: none`).
3. **Start the next.** The lowest-`order` `planned` chapter whose prerequisites are all at least `authored`.
4. **Blocked or empty.** Otherwise report the blocking prerequisite, or that the graph is empty (mode B) or finished.

The script implements all four, and refuses (exit 1) while `check` fails. A named chapter (`chapter <id>`) overrides
1–3 but not prerequisite checks: use `course.mjs show <id>`.

## Updating state

At the end of every unit, in this order:

1. Update the chapter row's `status` in `CURRICULUM.md` (only to a gate whose evidence exists; lower it if evidence
   no longer holds).
2. Run `course.mjs check`; fix what it reports.
3. In `COURSE_STATE.md`: set Current unit (the step in progress, or `none` when done or blocked), Next action
   (`course.mjs next` output), add decisions and issues, append the session-log line, bump Updated.

If a run is interrupted between steps 1 and 3, the next run sees a status ahead of COURSE_STATE: `check` warns that
the current unit is already done; finish step 3, don't redo the chapter.
