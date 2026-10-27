# Course state

## Contents

- Status gates (what each one requires)
- CURRICULUM.md format
- COURSE_STATE.md format
- How "next" is chosen
- Updating state

## Status gates

Statuses are ordered. A chapter holds the highest gate whose evidence exists **and** all lower gates. Gates are
lowered when their evidence stops holding (a source turned out wrong, a test now fails).

| Status        | Evidence required                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned`     | Row in `CURRICULUM.md` with id, title, objective, prerequisites, paths                                                                                      |
| `researched`  | `chapters/<id>.md` has a Sources section: every claim in the boundary has a source record; open questions listed                                            |
| `authored`    | Spec has the full teaching design (14 questions answered, worked example, retrieval items, exercise) and the visual decision/spec                           |
| `implemented` | Content and any visualization/simulation exist in the host app at the paths the spec names                                                                  |
| `tested`      | Model tests pass; typecheck and lint pass; browser checks done at the required sizes and in reduced motion                                                  |
| `reviewed`    | An independent review (fresh agent, verification.md rubric) ran; its findings are listed in the spec                                                        |
| `verified`    | All review findings closed or explicitly accepted with reason; no claim rests only on `via: search` sources (each is read, replaced, or cut); state updated |

Never skip a gate. Never mark `tested` because tests "should" pass: record the command and its result in the spec's
Evidence section.

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
- `paths`: any of `beginner interview production`; every chapter is on at least one.
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

## Open issues

- <issue> (<chapter id or "course">)

## Session log

- <YYYY-MM-DD> <mode> <unit>: <gate before> → <gate after>; <one-line summary>
```

Keep it short: decisions and issues are one line each; detail lives in chapter specs.

## How "next" is chosen

`course.mjs next` applies these rules in order; the first match wins:

1. **Resume.** `COURSE_STATE` "Current unit" names a chapter that isn't done → that chapter (an unfinished unit is
   never abandoned).
2. **Finish what is started.** The lowest-`order` chapter whose status is above `planned` and not done (done =
   `verified`, or `authored` while `Product: none`).
3. **Start the next.** The lowest-`order` `planned` chapter whose prerequisites are all at least `authored`.
4. **Blocked.** Otherwise report the blocking prerequisite chain.

The script implements all four. A named chapter (`chapter <id>`) overrides 1–3 but not prerequisite checks.

## Updating state

At the end of every unit, in this order:

1. Update the chapter row's `status` in `CURRICULUM.md` (only to a gate whose evidence exists).
2. Run `course.mjs check`; fix what it reports.
3. In `COURSE_STATE.md`: set Current unit (or `none`), Next action (`course.mjs next` output), add decisions and
   issues, append the session-log line, bump Updated.
