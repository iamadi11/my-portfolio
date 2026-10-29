---
name: system-design-educator
description: Build, improve or audit this repo’s beginner-to-advanced system design course using source-backed, video-like 3D lessons, interactive experiments and retrieval practice. Use when authoring course chapters, improving their explanations or animations, planning curriculum, or optimizing course production.
---

# System design educator

Outcome: a college fresher can predict a system’s next event, explain why it happened, and make a design choice. Rich 3D supports that outcome; decorative motion does not. A film is an introduction, not a completed lesson. Follow the user’s requested scope, including several chapters in one session.

## Cheap context, persistent work

1. Start with `node .claude/skills/system-design-educator/scripts/context.mjs [chapter-id ...]`. It prints the compact course contract and relevant files, not entire chapters. Read only the current state’s first sections and requested curriculum rows. Run `course.mjs check` once before and once after a batch.
2. Read [production.md](references/production.md) when building. Reuse the film renderer, event model, controls and theme; author topic-specific scene data. Never clone a renderer per chapter. Read one representative implementation, then only changed files.
3. Select references below by the unresolved decision. Do not load the reference library or prerequisite essays. Reuse recorded primary sources when the same claim is already supported; browse authoritative sources for new claims and inspect relevant sections, not full manuals.
4. Plan a batch as chapter ids + objective + mechanism + misconception + evidence needed. Finish each chapter’s source/storyboard/model before its UI. Batch independent checks; fix causes before repeating. Log paths, checks and unfinished work once in COURSE_STATE, with chapter status only in CURRICULUM.
5. Keep progress and handoff concise. Do not print checklists, giant diffs, source dumps or repeated plans. Token saving comes from reusable code and selective context, never missing explanations or fabricated verification.

## Anatomy and GSAP

For this owner-requested refinement use [anatomy-gsap.md](references/anatomy-gsap.md) before changes: detailed shared anatomy geometry, explicit ports/depth, GSAP-owned disposable timing, readable beat lengths and meaningful before/after comparisons. Audit all 119 ids compactly; report representative review as representative. Owner authorizes portfolio dark mode, GSAP and documented budget increases.

## Objective coverage before polish

Split a broad chapter objective into observable claims. Map each claim to a model event, comparison, exercise or explicitly justified static explanation. A foreign-key check does not cover joins; WAL does not cover LSM layout; replica lag does not prove a consistency history. If one model cannot teach the objective, add a small companion model through `COMPANION_MODELS` and reuse the same renderer and lab. Never fill the gap by renaming a device.

Compare minimum, boundary and maximum inputs under both policies. Derive the verdict from the resulting state, not the selected mode: a valid foreign key must be accepted under either policy. Declare bundled changes (capacity plus idempotency, for example) and attribute their effects separately. Preserve counterexamples in invariant tests. Run the compact `anatomy-refinement.test.ts` and finite model suites; inspect only failures, then review representative rendered states.

## Learning and animation gates

Before authoring, use [learning-and-motion.md](references/learning-and-motion.md): record the beginner’s question, misconception, observable state, counterexample and transfer task. One model must generate the visible messages, quantities and experiment verdict. Generic packet movement cannot stand in for quorum, cache freshness, transaction atomicity or query planning. Reuse geometry; vary the actual mechanism.

Treat three outcomes separately: viewed, experimented, recalled. Seeking to the final frame does not demonstrate learning. Include a worked example with assumptions, a changed-input prediction, explanatory feedback and a later prerequisite recap. Cases/capstone need requirements, estimates, read/write paths, failure and a defended tradeoff.

Check all curriculum ids, not just built pages: routes, prerequisites, sources, meaningful experiment variation and navigation to the final chapter. Keep implementation coverage separate from review quality. Review representative mechanisms independently and carry unreviewed chapters honestly.

## Lesson contract

- **Beginner first:** one everyday question, why this matters, prerequisites as links. Define jargon on first use. Reveal complexity progressively. A name like “server” labels a real component; avoid metaphor machinery that needs its own explanation.
- **Watch:** a video-like, model-driven 3D sequence. One causal idea per beat; short caption and visible component names. Show before → event → after, then failure/tradeoff. Motion conveys message progress, ordering, quantity, loss or state. Distinct concepts need distinct topologies/events; renaming an identical animation is insufficient.
- **Experiment:** change an input or fault, predict, run, compare. Reuse the same deterministic model; results and geometry must agree. No random per-frame state, hidden answer before prediction, or fake benchmark.
- **Recall:** scenario + answer hidden until commitment + explanation of the misconception. Include a transfer question, not just term recall.
- Keep Learn / Interactive Lab / Quiz; put technical depth in a disclosure and bibliography on `/learn/sources`.

## Visual/runtime contract

Use the host’s monochrome precision with depth, recognizable devices, cables, data stores and packets. Isometric SVG or CSS 3D are valid: name the projection and fidelity. Use perspective only when it helps read topology. Avoid literal screws/part quotas that spend tokens without teaching. Reuse the rendering kit; add geometry only for a real missing concept.

Player: play/pause, replay, previous/next beat, scrub, speed, short captions, optional transcript. Start paused; stop at the end, offscreen and in a hidden tab. Reduced motion offers static event steps. Keyboard reaches all controls; touch targets ≥44px. Labels must remain readable on phones. A frame is a pure function of time and inputs; seeking cannot change the outcome.

Typography: readable sentence-case Arimo/system sans, body ≥16px, line height 1.5–1.75, comfortable measure. Monospace for code only. Support persistent light/dark/system choice within the course, independently of the portfolio preference. Theme every surface, diagram and focus state; never invert the whole page as a theme shortcut.

## Evidence and scope

Source every new technical claim to a primary document actually read; record URL, section, date and access mode. Mark illustrative timing, geometry, counts and simplified behavior. No invented company stories, publication metadata, performance claims or review results.

Run deterministic model/invariant tests for behavior, typecheck, relevant browser checks (playback, scrubbing, keyboard, reduced motion, mobile, both themes), and existing budget checks. Record unrun checks honestly. Keep existing chapter ids, routes and useful labs. Status `implemented` means built; `tested` needs all required evidence; `verified` additionally needs independent review. Do not claim world-class quality from a passing build.

A request for the whole course authorizes batch implementation. Choose coherent dependency order; stop only for a real external blocker or completed scope. Existing unrelated evidence gaps do not prohibit useful work; retain them in state. Do not auto-commit or publish unless requested.

## Modes and tools

`init`: audit actual files and establish state. `curriculum`: update the learning graph. `next`: resume incomplete work or take the next ready chapter. `chapter <id>`: develop that chapter. `batch <ids>`: repeat the chapter contract for the requested set. `audit <id>`: repair the observed failure and rerun affected checks.

Commands from repo root: `node .claude/skills/system-design-educator/scripts/course.mjs next|check|show <id>|skill`; skill tests: `node --test .claude/skills/system-design-educator/scripts/*.test.mjs`. Context helper accepts only existing chapter ids; no mutations.

## On-demand reference map

These retain detailed historical examples; this entrypoint and production.md govern current batch scope, themes, renderer reuse and concise reporting.

- Production architecture / compact chapter recipe: [production.md](references/production.md).
- Graph/status formats: [course-state.md](references/course-state.md), [curriculum.md](references/curriculum.md).
- New chapter planning: [chapter-workflow.md](references/chapter-workflow.md).
- New claims: [research-and-sources.md](references/research-and-sources.md).
- Teaching uncertainty: [learning-science.md](references/learning-science.md).
- Lab design: [interaction-patterns.md](references/interaction-patterns.md), [three-tabs.md](references/three-tabs.md).
- Motion/model problems: [motion.md](references/motion.md), [scientific-modeling.md](references/scientific-modeling.md).
- Geometry problems: [rendering.md](references/rendering.md), [anatomy-3d.md](references/anatomy-3d.md), [craft-bar.md](references/craft-bar.md).
- Layout/review: [visual-design.md](references/visual-design.md), [visual-review.md](references/visual-review.md), [verification.md](references/verification.md).
