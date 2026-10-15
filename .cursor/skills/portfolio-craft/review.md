# Review

Use this before calling a pass done. These are gates, not a score. A pass fails when any rejection below is true.

## Gates

1. **Originality.** A stranger could tell this from a template. The concept is visible in the first screen.
2. **Art direction.** Type, color, material, and motion are the same idea. Glass and tactile controls appear where the concept asked, and nowhere else.
3. **Hierarchy.** The name and the practice are obvious. The work is the next thing, not a biography.
4. **Interaction.** The signature responds. Controls show hover, press, and focus. Nothing essential depends on hover or on finishing an animation.
5. **Clarity.** Projects have a name, a true sentence, and a real link when one exists. Extra detail is available without being dumped on the first screen.
6. **Responsive.** At a narrow width the composition was designed: no horizontal overflow, type fits, targets are at least 44px, the dock clears the safe area, and it does not cover the focused control.
7. **Performance.** Heavy libraries are off the first load when the concept allows. A loop pauses when hidden. Measured numbers are reported as measured. Missing tools are named.
8. **Access.** Landmarks and one h1. Keyboard can reach the work and the reply links. Contrast holds on the tactile surfaces. Reduced motion shows a still that is still the design.
9. **Engineering.** The page matches the repo's stack. Lint and the production build were run. Shared routes still work.
10. **Truth.** Every employer, date, metric, and project URL traces to the content authority. Nothing was invented to fill a layout.

## Reject the pass

- The desktop frame looks finished and the narrow layout overflows, clips the name, or hides reply.
- The only way to find projects or contact is a puzzle, a hover, or a long intro.
- The signature is a primitive, a stock sphere, or a card grid with blur.
- Motion runs on everything, or a loop stays hot while the tab is hidden.
- A Lighthouse or Core Web Vitals number is stated without a run.
- Copy contains an employer, metric, or link that is not in the source.
- The build or typecheck failed and was left failed.

A handsome screenshot is not a pass.

## What to run

When the tools exist:

- Lint and the production build for the files touched.
- The changed flow in a browser at about 375, 768, and 1440. At 1440 the type and the frame stay in a composed width. Click the primary path: open the work, confirm a real project link is present, reach reply.
- Keyboard: the work and reply controls are focusable and the ring is visible. The sticky dock does not cover the focused control (`scroll-padding` or equivalent).
- `prefers-reduced-motion: reduce`: the signature is visible and still, and navigation does not depend on a transition.
- Bundle or build output for the initial route. Lighthouse only if it is installed and actually executed.

If the browser, WebGL, or Lighthouse is unavailable, use the closest check and say what was not seen.

## Report lines that must be literal

- Viewports actually opened.
- Commands that exited clean, and warnings that were already there.
- Any metric, or the sentence "not measured."
- The concept that shipped, in one sentence.
