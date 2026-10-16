---
name: portfolio-craft
description: >-
  Art-directs, builds, and verifies a heavily animated, character-led 3D
  portfolio: a stylised 3D character of the owner (generated from their photo
  with free tools, rigged in the browser, walks, lip-synced) guides visitors through a 3D world
  with minimal text. Use when the user says portfolio-craft, or asks to redesign,
  improve, or audit a portfolio, hero, project showcase, 3D scene, avatar or
  bobblehead, motion, sound, mobile layout, or loading performance. Runs a
  multi-agent full pass or a focused pass. Never invents employment, metrics,
  or projects.
---

# portfolio-craft

The default result is a 3D world the visitor moves through, led by a character of the owner who reacts, talks, and plays. Text is a thin HTML layer. A page of headings and paragraphs with some motion is a failed pass, however clean it looks.

Do not depend on chat history: read the repo and the pass notes in `docs/`. Do not deploy. No destructive git. Never print, log, paste, or commit a secret.

## Non-negotiables

When they conflict, this order wins: truth, recruiter path, accessibility, wow, polish.

1. **Truth.** Facts come from [SOURCE_OF_TRUTH.md](../../../SOURCE_OF_TRUTH.md) through `src/content/site.ts`. In another repo, use its content-authority file or the copy already on the site. Never invent employers, dates, titles, metrics, testimonials, screenshots, or project outcomes. Leave a missing fact out; never fill it to suit a layout. The character says only what the content file says.
2. **Recruiter path.** The name, the role, a way into the work, and contact are real HTML. They are visible within 5 s of first paint and never wait for an animation, a loader, a click, or the 3D.
3. **Access.** The HTML layer is the content: landmarks, one h1, a keyboard path to the work and to contact, visible focus, 44px targets, and no hover-only paths. The canvas is `aria-hidden`. Captions are on whenever the character speaks. `prefers-reduced-motion: reduce` gets a designed still of the same world.
4. **Performance.** 3D loads after first paint, in quality tiers, within the budgets in [engineering.md](engineering.md). State a number only if it was measured.
5. **Mobile** is its own composition, with its own shots, framing, and touch play. It is not a scaled-down desktop.

## Defaults

- **A world, not a page.** One continuous 3D space. Sections are places the camera travels to.
- **A character guide.** A stylised, animated-film (Pixar/Disney-style) 3D likeness of the owner, **generated from their photo with free tools and rigged in the browser** ([assets.md](assets.md)): a procedural skeleton that walks, runs and climbs between stations, waves, and moves its jaw with the voice. A figure built in code from a few colours is the fallback (this owner rejected both a code-built bobblehead and a code-built realistic figure as not good enough). It greets, points at the work, reacts to the visitor, and voices lines from the content file, with captions. Stylised beats near-photoreal. Until the owner approves a likeness, the HTML layer shows their photo. Never ship someone else's face, or a generic mascot presented as them.
- **Minimal text.** Under 15 words of visible prose per screen. Count everything readable in the viewport, including captions, but not the persistent nav or dock labels. Details come on demand from an HTML sheet, dialog, or `<details>` that sits in the DOM for search and screen readers.
- **Wow, defined.** All five ingredients in [concepts.md § Wow](concepts.md#wow): a signature transformation, camera choreography, physics the visitor plays with, one distinct set piece per project, and sound after a gesture.
- **Heavy animation, every move with a cause.** Anything may move. Nothing moves without a cause: scroll, pointer, physics, the character's intent, or secondary motion. Nothing spins because it can.
- **Stack.** Plain three.js mounted by one React component is enough for a single full-screen scene (the reference build in this repo uses no other 3D package). Reach for `@react-three/fiber`, drei, postprocessing, a physics engine, or GSAP only when the concept needs them. Add a package when the concept needs it, after a peer-range check ([engineering.md](engineering.md)). Do not rewrite the app framework for taste.

## Modes

| Mode | When | What changes |
| --- | --- | --- |
| Full | Redesign, "wow", "make it 3D", or no named area | Multi-agent research, then Stages A–G. |
| Focused | The user names one area: hero, a project set piece, the character, motion, mobile, performance, a route | Skip concept exploration and work inside the existing concept. Still reject a generic patch. |

Routine design and engineering choices do not need approval. These do: the likeness, the first paid API call, and adding a licence-restricted asset.

## ui-ux-pro-max

Use `/ui-ux-pro-max` to search for contrast, focus, type, palette, and stack notes. Discard results that return a SaaS hero, a docs page, purple or cyan futurism, or a badge wall, and note the rejection. This skill owns the concept, the world, the character, and the decision to ship.

## Full pass: multi-agent

Run four roles in parallel, then synthesise. Each brief is self-contained: the goal, the files to read, the output file, and the Non-negotiables. Research roles do not edit app code.

- **Claude Code:** use the Agent (Task) tool, one call per role, all in one message.
- **Cursor:** use subagents or parallel agents, each in its own worktree or chat.
- **No way to spawn agents:** run the roles one after another in the order below, saving each output before the next starts. Write the Critic's checklist from [review.md](review.md) before you read any concept.

| Role | Reads | Writes to `docs/<pass>/` (e.g. `docs/v2-research/`) |
| --- | --- | --- |
| **Director**: concepts and wow | [concepts.md](concepts.md), `src/content/site.ts`, screenshots of the current site | `concepts.md`: three concepts in the given format, scored. References studied, with URLs, and any unverified claim marked as such. |
| **Character and assets** | [assets.md](assets.md), the owner's photos | `assets.md`: the providers tested and their outputs, the chosen pipeline, the rig and viseme plan, sizes after optimisation, licences |
| **Engineering and perf** | [engineering.md](engineering.md), `package.json`, the current routes | `engineering.md`: architecture, loading order, tiers, budgets, packages with peer checks, the risks of each concept |
| **Critic** | [review.md](review.md) first, then the other three outputs | `critic.md`: for each concept, the rejections it would hit and the cheapest fix. The cheap tells found. A kill list. |

Optional: a **Truth auditor** maps every planned on-screen string and character line to the content file. Otherwise the Critic covers this.

**Synthesis (lead).** Choose one concept, using the Critic's findings. Resolve conflicts by the Non-negotiables order. Write `docs/<pass>/plan.md` with:

- the shot for each section, at 1440 and at 375
- the set piece for each project
- the character's behaviours
- the asset list and the budgets
- milestones with acceptance checks

**Build.** The lead integrates. Parallelise only disjoint work, for example asset generation, scene code, and the HTML layer, each in its own worktree or file set. At every milestone the Critic runs [review.md](review.md) on the rendered build, with screenshots and numbers. A rejection blocks the milestone.

## Stages (full)

**A. Discover.** Find the framework, routes, content file, existing 3D, assets, voice pipeline, and dependencies. Read the repo's 3D rules (for example `CLAUDE.md` §10) and earlier pass notes in `docs/`. Run the site, screenshot it at 375 and 1440, and count the words on each screen. Record the baseline build output.

**B. Research.** Run the four roles above.

**C. Synthesis.** Write `plan.md`. Implementation waits for it.

**D. Character first.** It is the longest pole. Build the code figure, look at it close up (front, ¾, side, back) in the scene light, and iterate on the face until it reads at hero size and at 120 px. The owner approves the likeness before anything depends on it.

**E. Build in milestones.**

1. World, hero, and HTML layer. The poster frame is the LCP, and the character greets within 5 s.
2. Camera choreography across sections.
3. One set piece per project.
4. Voice, visemes, and sound.
5. Mobile, tiers, and reduced motion.
6. Polish.

**F. Look.** Run the app and watch it move: take screenshot sequences during the signature moment and during camera moves. Check 375, 768, and 1440, reduced motion, and `?tier=b|c`. Fix what you see. Allow at most three visual iterations per milestone and move the rest to [BACKLOG.md](BACKLOG.md).

**G. Prove.** Follow [review.md](review.md).

## Focused pass

1. Read the named area and every route that shares its components. Run the app.
2. Name the failure in one sentence, taken from the rendered screen.
3. Change that area inside the existing concept, and keep a small request small. If the area cannot reach the bar without a new concept, say so and stop. If a spawn tool exists, a Critic agent may review the result.
4. Verify with [review.md](review.md). Update [BACKLOG.md](BACKLOG.md).

## Stop

Stop when [review.md](review.md) has no rejection, or when a real blocker remains (the likeness is not approved, a key is missing, the budget is exceeded). Do not keep editing to look busy. Put leftover work in [BACKLOG.md](BACKLOG.md).

## Report

1. The concept chosen and the two rejected (full pass only).
2. The roles that ran, in parallel or in sequence, and where their notes are.
3. A wow inventory: the signature moment, the camera path, the play interaction, the set piece for each project, and the sound.
4. The character: how it was built (code, or the provider), the colours and accessories used, visemes, size, licence, and the owner's approval.
5. Measured numbers (or "not measured"), the commands run, and the viewports opened.
6. What is still open.

## Maintaining this skill

This folder (`.cursor/skills/portfolio-craft/`) is the canonical copy. `.claude/skills/portfolio-craft` is a git symlink to it, the same convention as the other `.claude/skills/*` links, so Cursor and Claude Code read the same bytes. Edit files here only. On a checkout without symlinks (Windows with `core.symlinks=false`), recreate the link, or replace it with a copy: `rm -rf .claude/skills/portfolio-craft && cp -R .cursor/skills/portfolio-craft .claude/skills/`.
