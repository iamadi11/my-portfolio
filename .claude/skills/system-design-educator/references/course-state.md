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

| Status        | Evidence required (✓ = enforced by `course.mjs check`)                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned`     | Row in `CURRICULUM.md` with id, title, prerequisites, paths ✓                                                                                        |
| `researched`  | `chapters/<id>.md` exists ✓ with source records ✓; every claim in the boundary has a record or is listed under open questions                        |
| `authored`    | Full teaching design (14 questions, worked example, retrieval items, exercise) and the visual decision/spec                                          |
| `implemented` | Content and any visualization/simulation exist in the host app at the paths the spec names; no source with `via: search` supports a claim ✓          |
| `tested`      | Evidence lists every required check and each one passed ✓ (model tests, typecheck, lint, browser checks at the required sizes and in reduced motion) |
| `reviewed`    | An independent review (fresh agent, verification.md) ran on the implementation and its evidence: `Reviewer:` line ✓, findings listed                 |
| `verified`    | No blocking or should-fix finding left open ✓; state updated                                                                                         |

Never skip a gate. Never mark `tested` because tests "should" pass. `check` sees only structure: a ✓ means the
evidence is written down, not that it is good; the rest is the author's and reviewer's job.

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
