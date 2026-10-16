# Review

The Critic runs this at every milestone, and the lead runs it before calling a pass done. These are gates, not a score. A pass fails if any rejection below is true.

## Gates

1. **Wow.** Something memorable happens in the first 5 s. All five ingredients from [concepts.md § Wow](concepts.md#wow) exist, and each one can be named.
2. **Character.** It reacts to the pointer, to clicks and taps, and to section changes. It has idle life and lip-syncs while speaking. The owner has approved the likeness.
3. **Art direction.** One world: geometry, materials, light, type, motion, and sound are one idea. None of the cheap tells in [concepts.md](concepts.md) appears.
4. **Text economy.** Under 15 words of visible prose per screen. Details open on demand.
5. **Recruiter path.** The name, role, work, and contact are HTML and visible within 5 s, without waiting for any animation.
6. **Interaction.** Controls show hover, press, and focus. Play works with a mouse, with touch, and with a key. Nothing essential sits behind play.
7. **Truth.** Each project has a name, a true sentence, and a real link when one exists. Every on-screen string and every spoken line traces to the content authority.
8. **Responsive.** At 375 the composition was designed: no horizontal overflow, type fits, targets are at least 44px, and the dock clears the safe area and the focused control.
9. **Performance.** 3D is off the first load, and loops pause when the page is hidden. Numbers are reported as measured, and missing tools are named.
10. **Access.** Landmarks and one h1. The keyboard reaches the work and contact. Captions are on. Contrast holds on the HTML layer. Reduced motion shows a designed still.
11. **Engineering.** It matches the repo's stack. Lint, typecheck, and the production build were run. Shared routes still work.

## Reject the pass

- **Text-heavy:** any screen has 15 or more words of visible prose outside the on-demand layer, or paragraphs sit on the canvas.
- **3D only decorates:** hiding the canvas loses no meaning, or the 3D is a hero widget above an otherwise normal page.
- **No wow moment** in the first 5 s on tier A.
- **The character doesn't react:** a static model, a T-pose, no response to pointer, click, or scroll, or a still mouth while audio plays.
- **Stutter:** desktop tier A drops below 50 fps sustained (p75 frame time above 20 ms) during a camera move or the signature, as measured, or shader compilation hitches the first interaction.
- **Cheap identity:** a cheap tell from [concepts.md](concepts.md) is the identity, for example primitives, default materials, purple or cyan glow, or floating blobs.
- **Repeated set piece:** one set piece is reused for unrelated projects.
- **Narrow layout breaks:** the desktop frame looks finished, but at 375 it overflows, clips the name, or hides contact.
- **Gated path:** the only way to reach the work or contact is a puzzle, a hover, play, or a long intro.
- **Hot loop:** a loop keeps running while the tab is hidden.
- **Sound:** it plays before a gesture, or speech has no captions.
- **Broken reduced motion:** the page is broken or blank.
- **Unmeasured number:** a Lighthouse, Core Web Vitals, or fps figure is stated without a run.
- **Invented content:** copy or a character line contains an employer, metric, or link that is not in the source.
- **Secret exposed:** a secret appears in code, logs, notes, or chat.
- **Failed build:** the build or typecheck failed and was left failed.

A handsome screenshot is not a pass. Neither is a calm, tidy page.

## What to run

Run these when the tools exist:

- Lint, `npx tsc --noEmit`, and the production build. Record the route table.
- Open the flow in a real browser at about 375, 768, and 1440, with reduced motion emulated and with `?tier=b` and `?tier=c`. Click the main path: the signature, a project set piece, its HTML sheet with a real link, then contact.
- Watch it move. Take a screenshot sequence during the signature and during one camera move. Flick the character.
- Use only the keyboard: the work and contact controls take focus with a visible ring, and the camera follows.
- Check the bundle for the initial route. Run Lighthouse only if it is installed and actually runs.

Count the words on a screen in the browser console (run it on each screen):

```js
(() => { let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode()); ) {
    const el = t.parentElement;
    if (!el || el.closest('nav,[aria-hidden="true"],[hidden],script,style,noscript')) continue;
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    if (r.width <= 1 || r.bottom < 0 || r.top > innerHeight || s.visibility === 'hidden' || +s.opacity === 0) continue;
    n += t.textContent.trim().split(/\s+/).filter(Boolean).length;
  }
  return n; })()
```

Measure frame time during a move (start the scroll or the signature, then run this):

```js
await new Promise((res) => { const d = []; let last = performance.now();
  const f = (now) => { d.push(now - last); last = now; d.length < 300 ? requestAnimationFrame(f) : res(d); };
  requestAnimationFrame(f); }).then((d) => { d.sort((a, b) => a - b);
  return { p75ms: +d[Math.floor(d.length * 0.75)].toFixed(1), medianFps: Math.round(1000 / d[d.length >> 1]) }; })
```

Headless or software GL does not represent a real GPU. Name the browser, the GPU (or "software"), and the tier with every number. If the browser, WebGL, or Lighthouse is unavailable, use the closest check and say what was not seen.

## Report lines that must be literal

- The viewports actually opened.
- Commands that exited clean, and any warnings that were already there.
- Every metric with its environment, or the sentence "not measured."
- The concept that shipped, in one sentence, and its five wow ingredients.
