# Dry run

This file checks the skill. It does not authorize a redesign.

## Prompt

"The homepage is a dark page with a heading, a paragraph, four identical project cards, and a row of technology logos. Make it exceptional."

## Expected trace

1. Mode is full. Stages A–G apply.
2. Discover names the failure: identical cards and a logo wall, text before the work.
3. Three concepts are written. A centered gradient hero is not one of them unless the notes explain why that exact pattern is required. It will not be.
4. A `/ui-ux-pro-max` result that returns a documentation landing or a green-on-slate docs theme is discarded, not implemented.
5. One concept is chosen. Glass and tactile controls are assigned to specific surfaces, or refused.
6. 3D is used only if the concept names the object's job. A floating sphere does not qualify.
7. Implementation waits until the concept is chosen.
8. Review rejects the pass if mobile overflows, reply is hover-only, or a Lighthouse score is invented.

## Pass condition

An agent following [SKILL.md](SKILL.md) can complete the trace without opening the application source. If a step conflicts with [concepts.md](concepts.md) or [review.md](review.md), the skill is wrong.
