# Course state

State: not initialized
Updated: 2026-10-27

The system design course is built only through the `system-design-educator` skill
(`.claude/skills/system-design-educator/`). This file and `CURRICULUM.md` are its memory; see the skill's
`references/course-state.md` for their formats.

## Current unit

none

## Next action

Mode A (`/system-design-educator init`): inspect the app, decide where the course lives, create `CURRICULUM.md`
with mode B, run `course.mjs check`.

## Decisions

- 2026-10-27 The course is authored one unit per skill invocation; chapter status lives only in `CURRICULUM.md`
  (or a code manifest that replaces it, recorded here) — avoids two status lists drifting apart.
- 2026-10-27 An earlier `/learn` prototype was removed from the repo before the skill existed; it is not part of
  the course. Mode A starts from the app as it is.

## Open issues

- The authoring container could not open most primary-source sites (DNS blocked for fetch); sources found only via
  search are recorded `via: search` and their claims stay unverified until read (course).

## Session log

- 2026-10-27 setup: skill and state docs created; course not initialized.
