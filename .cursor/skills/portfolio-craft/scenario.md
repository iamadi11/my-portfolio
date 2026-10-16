# Dry run

This file checks the skill. It does not authorise a redesign.

## Prompt A (full)

"The homepage is a text-heavy page: a heading, a paragraph, four project cards, a skills list, and a little motion. No wow factor. Make it a heavily animated 3D site with a bobblehead of me."

## Expected trace

1. **Mode.** The mode is full. The agent starts four roles in parallel: Director, Character and assets, Engineering and perf, and Critic. If it cannot spawn agents, it runs them in sequence, saves each output to `docs/<pass>/`, and writes the Critic's checklist before reading any concept.
2. **Discover.** It counts words per screen (well over 15), names the failure (a page, not a world; 3D absent or decorative), and reads the repo's 3D rules and earlier notes in `docs/`.
3. **Director.** It delivers three concepts in the format from [concepts.md](concepts.md). Each one has all five wow ingredients and fewer than 15 words on its first screen. "Normal page with a 3D hero" is not one of them.
4. **Character and assets.**
   - Gets a 2D bobblehead turnaround approved first.
   - Tests at least two image-to-3D routes and asks before the first paid call.
   - Reads keys from `.env.local` and never prints them.
   - Plans the rig, spring bobble, and visemes, and records licences.
   - Does not pass the realistic LAM head off as the bobblehead.
5. **Engineering.** It plans:
   - a poster as the LCP, then lazy 3D, `compileAsync` before the crossfade, and `3d-live` at 4 s or less on tier A
   - tiers A, B, and C, and the budgets
   - a peer check before adding drei, postprocessing, rapier, or gsap
6. **Critic.** It flags at least the cheap tells that apply, for example floating orbs, purple glow, primitive machines, or one set piece reused.
7. **Synthesis.** One `plan.md`. It has one set piece per project in `src/content/site.ts`, derived from what each project does:
   - Eidos, offline-first service workers → a router that keeps answering when the network is cut
   - mcp-ui, a dynamic UI generator → an assembler that builds panels on request
   - spatial, dev-time UI performance detection → a scope or inspector that finds the janky element
   - Mouse Follow → a tracker that follows the cursor

   Every label comes from `SITE`. No metric appears that is missing from `SOURCE_OF_TRUTH.md`.
8. **Build.** By milestone 1, the h1, the role, a way into the work, and contact are HTML on first paint, and the character greets within 5 s on tier A. Sound waits for a gesture, and captions are on.
9. **Review rejects the pass** if a screen has 15 or more words, the character ignores the pointer or a click, desktop drops below 50 fps (measured), any metric is unmeasured or invented, mobile overflows, or reduced motion is blank.

## Prompt B (focused)

"The projects section is boring."

Expected: the mode is focused. The agent stays inside the shipped concept. It names the failure from the rendered screen (for example, set pieces that are static or identical), upgrades one set piece per project, and re-runs [review.md](review.md). It does not write a new concept or redesign the hero.

## Pass condition

An agent following [SKILL.md](SKILL.md) can complete both traces without opening the application source. If a step conflicts with [concepts.md](concepts.md), [assets.md](assets.md), [engineering.md](engineering.md), or [review.md](review.md), the skill is wrong.
