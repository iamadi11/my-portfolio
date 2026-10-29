# Anatomy + GSAP production

Use the repo’s anatomy skill for geometry and GSAP skills for lifecycle/timing. Read only the matching kit API/example. Shared course hardware is Figure-sized; the owner explicitly requests reuse across the whole course, not 119 independently invented rendering engines.

## Before geometry

For each chapter identify the learner’s purpose, misconception, actual state owner, unit, event, observable result and changed assumption. A physical server/store/router represents that component; a software layer diagram must say conceptual, not measured hardware. Geometry cannot repair an unrelated model.

Give each reused device a purposeful parts list: chassis, feet, bezel, access panel, supported rack shelves, drives, ports, mounted connectors, vents and status indicators. Use anatomy solids and facing tones, fit the camera, sort by world depth and land message paths on explicit ports outside solids. Reuse static paths. Detail supports recognition; bolts never stand for votes or messages. Numeric labels stay exact when mark counts are abbreviated. Keep semantic labels beside the picture for beginners even where anatomy’s standalone gallery convention uses less text.

## Teaching motion

GSAP owns a disposable clock/timeline, not system truth. The same pure model supplies narration, values, counts and verdicts. Beat lengths allow the caption to be read; display playback duration separately from simulated quantities. Before/after comparisons change one declared input or policy, preserve the baseline and identify why the outcome changes. Do not mix two simultaneous explanations on a small screen.

Highlight the sending component, then move the message from its port to the receiving port, then commit arrival state. A refusal or delay is not transport loss. Never show impossible intermediate commits. A static step seeks the real settled timeline position; resuming cannot rewind state. Never reconstruct static geometry on every tick.

## GSAP lifecycle

Scope DOM targets; use useGSAP or an effect-owned gsap.context with cleanup. Create one timeline per live instance. Kill/revert it on dependency change and unmount; do not kill unrelated global timelines. Keep reduced-motion as complete static event steps. Stop hidden/offscreen loops. Reconcile seek, rate, replay and end from one time source. Print finished, composed paper views; return to the correct current pose afterwards.

## Review without context inflation

Run a compact all-chapter audit: ids/routes/prerequisites/sources, model correspondence, baseline/alternative outcomes, exact quantities, actual geometry endpoints and reading pace. Emit failures and summary counts rather than every storyboard. Review one representative per distinct mechanism and shared rendering path; do not call that all-chapter acceptance. Store the report once. Source rechecks use pinned public revisions and preserve owner-confirmed private career facts.

Budget increases are owner-authorized tradeoffs. Measure first-load and on-demand separately, keep the benchmark script and documented ceilings consistent, and report actual results. A passing size gate is not an FPS or accessibility score.

## Reusable implementation map

- Static solids/part mounts: `src/components/anatomy/hardware.ts`; scoped four-tone theme: `hardware.css`.
- Explicit ports, silhouette-aware routes and wide/narrow placement: `src/lib/learn/scene-layout.ts`.
- Readable durations/settled seeks: `film-model.ts`; GSAP clock/static event holds: `kit/useClock.ts`. Static Play must honor caption duration **and** speed, not a fixed rapid interval.
- Worked A/B examples: `MechanismCompare.tsx`; extra mechanisms for broad chapters: `COMPANION_MODELS` in `academy.ts`. A/B is one declared policy unless the UI explicitly labels a design bundle.
- Portfolio tours: server-selected `src/content/project-films.ts` → lazy dialog/player. Pinned public sources establish behavior, not measured hardware or production guarantees. Exploded software layers say conceptual.
- Geometry tests verify connected axis-aligned part mounts, endpoint correspondence, conservative silhouette routing and viewport bounds. They do not prove bevel clearance, exact painter order, visual readability or frame rate; keep those checks distinct.

## Static depth gate

When device parts change, run `node scripts/audit-anatomy.mjs --write`, then rerun without `--write`. The anatomy kit samples overlaps between rounded-slab proxies at the assembled pose, solves drawing order and rejects a stale `src/components/anatomy/order.json`. Render with that artifact; a centroid sort alone hid monitor detail and interlocked queue bearings. The test suite separately checks that every part belongs to a connected mounted assembly. This is not the kit’s full moving-geometry/clearance audit: bevels, connectors, emitted packet glyphs and conceptual portfolio layers have separate scope.

For clock-only JS objects, use a context-ignored timeline with explicit kill cleanup (`animated-playback.ts`). Context-reverting a React state clock can rewind time on pause. The actual-GSAP lifecycle regression test must preserve time across context cleanup and speed changes.
