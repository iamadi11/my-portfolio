# Round trip: the improvement brief (2026-10-17)

Three reviewers (direction, realism, UX) read the code; this is the prompt their findings became.
Each item names the tell, the change, and where. Work in batches; verify every batch in rendered
frames at 1280 and 375 before it goes to main.

## Batch 1 — direction and cheap realism

1. Sunrise is a light switch. Drive `uDay`, `uRise`, the sun sprites and `sunlight.intensity` from `rise`; start the sun below the rim and lift it.
2. The ship leaves down the route, not towards the sun. Lerp the departure vector and heading towards the sun by `leave`.
3. Five portals, one cut. Tint each jump with its project colour; barrel-roll on the run-up (rush crosses 0.5), not under the cut.
4. Two cuts have no cause (city→landscape, sea→ice). Give both a run-up (boost, FOV, shake, roar).
5. One camera setup everywhere. Add `lead`: the ship runs ahead on the dive, the skim, the pole and the run-up.
6. Nothing to aim at: a beacon sprite on each exit portal, visible from far; `near` widens to 400 m.
7. The title card lands under the blur peak: delay it ~500 ms.
8. Scrolling back replays every jump: backward changes are straight cuts.
9. Bloom pops and stretches: soft threshold (`smoothWidth` 0.6, threshold 1.0, radius 0.2), aspect-correct resolution.
10. Video noise, not grain; elliptical vignette: luminance-weighted grain in screen space, aspect-corrected radius.
11. Rain is snow: stretched streak points.
12. Stacked additive sun sprites read as 2005: drop the lens streak and the wide orange glow.

## Batch 2 — UX and text

13. Route hops become links (`#rt-…`, `aria-current`), 24 px targets on phones.
14. Hero lede: first clause only, in ink; hide "or scroll" on phones.
15. Keyboard: tabbing into a career record brings it forward (mirror the project rule).
16. Title card: hop and place only; the panel already carries the title.
17. Text over bright places: bottom HUD gradient, scrim stop to 44 %, copy ≤ 46ch.
18. Impact labels: what / org split, org in small mono.
19. Reduced motion: stack item fade-in and count dots off.
20. Silent build after first scroll: pulse the ms readout while building.

## Batch 3 — realism (shader)

21. Flat fog: view-direction inscatter (brighter toward the horizon and the moon) and a height term.
22. Unshadowed terrain: three horizon samples toward the moon in the vertex shader.
23. Glass towers reflect a gradient: sample the night HDRI equirect by reflection, Schlick Fresnel.
24. Moon path is a rubber-sheet highlight: per-cell jittered normals, exponent falls with distance.
25. Puddles double-vision: one mip-biased tap, water Fresnel.

Out of scope until the owner downloads them: Snowy Mountain (alpine), Death Valley (desert),
Osaka downtown (a scanned block beside the city path).
