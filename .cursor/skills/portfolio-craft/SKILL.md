---
name: portfolio-craft
description: >-
  Art-directs, implements, and verifies original portfolio experiences.
  Use when the user says portfolio-craft, or asks to redesign, improve, or
  audit a portfolio, hero, project showcase, game-like interface, motion, 3D
  scene, mobile layout, or loading performance. Supports a full build and a
  focused pass. Does not invent employment, metrics, or projects.
---

# portfolio-craft

Build a portfolio as an interactive experience with a point of view. A conventional page with extra motion is a failed pass.

Do not depend on chat history. Read the repo. Do not deploy. Do not run destructive git. Ask before anything that touches secrets.

## Content

Never invent employers, dates, titles, metrics, customers, testimonials, screenshots, or project outcomes.

If [SOURCE_OF_TRUTH.md](../../../SOURCE_OF_TRUTH.md) exists, it wins, then the resume, then LinkedIn, then GitHub. In another repo, use that repo's content-authority file or the copy already on the site. Leave a fact out when it is missing.

## Modes

| Mode | When | What to skip |
| --- | --- | --- |
| Focused | The user names one area: hero, projects, motion, mobile, performance, a route | Three-concept exploration. Still reject a generic patch. |
| Full | Redesign, "make this exceptional", or no named area | Nothing in Stages A–G. |

Routine design and engineering choices do not need approval.

A focused pass still reads the rendered screen, changes one cohesive thing, and checks every route that shares the components. A full pass chooses a concept before writing the page.

## ui-ux-pro-max

Use `/ui-ux-pro-max` for searches: palette, type, UX rules, stack notes, contrast, focus, reduced motion. Do not copy its landing-page outline onto the site.

This skill owns the concept, the interaction model, what earns glass, neumorphism, illustration, or 3D, and whether the result is good enough to ship.

If a search returns a docs page, a centered SaaS hero, a purple futuristic theme, or a badge wall, discard it and search again or design from the content. Record that rejection in the pass notes. Do not persist a rejected system as the project master.

## Workflow

### Focused

1. Read the named area and the routes that share it. Run the app.
2. Name the visual failure in one sentence, from the rendered screen when a browser exists.
3. Change that area only. Match the concept already on the site. A small request stays small even when the rest of the site is generic. Say so in the report if the area cannot improve without a new concept, and stop.
4. Verify with [review.md](review.md). Update [BACKLOG.md](BACKLOG.md) if it exists.

### Full

**A. Discover.** Framework, routes, tokens, motion, 3D, assets, dependencies. Run the site. Note why it feels generic, text-heavy, or unfinished. Record a baseline: build or bundle size, and Lighthouse only if the tool actually runs.

**B. Art direction.** Read [concepts.md](concepts.md). Write three materially different concepts. Score them on originality, coherence, content fit, usability for a recruiter, mobile feasibility, and performance. Pick one. State what was rejected and why.

**C. Experience.** Hierarchy before layout. Short statements, visuals for proof, detail on demand. Navigation that a first-time visitor understands. Mobile and reduced-motion versions designed here, not after desktop is done.

**D. Technical plan.** Smallest renderer that can carry the concept: CSS, SVG, Canvas, or WebGL. A 3D engine is not the default. Reuse libraries already in the repo. Add one only when the concept fails without it. Targets, not claims: Lighthouse performance 95 desktop / 90 mobile, LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, initial route JS ≤ 200KB gzip with heavy 3D excluded from first load. Do not state a number that was not measured.

**E. Implement.** One concept, completely. Tokens for duration and easing. Factual copy. Working links. No placeholder projects.

**F. Look.** Run the app. Inspect the hero, project exploration, navigation, and contact at about 375, 768, and 1440. Fix what the screenshot shows. At most three visual iterations, then write the rest to the backlog.

**G. Prove.** Follow [review.md](review.md).

## Craft rules

- Every major surface belongs to the chosen concept. Glass, soft tactile controls, illustration, and 3D are materials. Using all of them is not a concept.
- A pattern on the avoid list in [concepts.md](concepts.md) may appear only if the chosen concept needs that exact pattern and the notes say why.
- 3D is optional. If a scene is already weak, say whether the failure is concept, assets, lighting, composition, materials, motion, or cost, then replace or remove it. Do not keep a primitive because the dependency is installed.
- Motion has four layers, in order: one signature moment, section changes, control feedback, ambient life. Animate the signature. Leave the rest still unless it helps.
- Essential facts stay available without hover, color, or finishing an animation. A recruiter can find the work and a way to reply without learning a puzzle.
- The first screen names the person and the practice. It does not open with a long biography.
- Mobile is its own composition. Touch targets at least 44px. No hover-only path to contact or projects.
- `prefers-reduced-motion: reduce` gets a designed still, not a broken page.
- Heavy code loads after first paint or on gesture. Pause off-screen and hidden animation. Dispose WebGL on unmount.
- Do not rewrite the stack for taste.

## Stop

Stop when the chosen concept meets the rejection checks in [review.md](review.md), or a real blocker remains. Do not keep editing to look busy. Leave unfinished work in [BACKLOG.md](BACKLOG.md). The backlog is leftover work, not the art direction.

## Report

1. Concept chosen, and the two that were rejected (full mode only).
2. What changed in the experience.
3. What happened to existing 3D or motion, and why.
4. Responsive and performance notes, with the numbers actually measured.
5. Commands, browser checks, and viewports that ran.
6. What is still open.
