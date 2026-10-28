# Rendering: 2D, 3D and assets

Choose the rendering technique for what it teaches, not for novelty. A carefully animated 2D model usually teaches
more than a 3D scene.

## Contents

- Asset types
- 2D: the default
- 3D: only with a reason
- External assets
- Loading and budgets

## Asset types

| `type:`        | Use when                                                     | Must have                                                                           |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `precision-2d` | Structure and relations, nothing changes with input          | One grammar, legend, labels legible at 375 px, what is omitted stated               |
| `animated-2d`  | Change over time is the concept                              | A clock and events from a model (motion.md), step controls, reduced-motion form     |
| `simulation`   | Insight comes from changing inputs and watching consequences | Executable model with its documentation (scientific-modeling.md), presets, tests    |
| `chart`        | A quantitative relationship matters                          | Axes, units, scale, data class (measured / model / illustrative), table alternative |
| `3d`           | Depth carries meaning 2D cannot show cleanly                 | The "3D justification" below, a 2D/text alternative, lazy loading                   |
| `illustration` | A recognisable anchor before an abstract model               | Says it is a picture of the idea                                                    |
| `experiment`   | The learner can safely try the real thing                    | Expected results as ranges, no special hardware                                     |
| `text`         | A definition a picture would only decorate                   | The reason                                                                          |

## 2D: the default

SVG (or CSS/DOM, or Canvas 2D when an SVG would exceed a few hundred nodes or redraw every frame) for request
lifecycles, protocol sequences, state machines, packet and data flow, topologies, queues and workers,
replication, dependencies, failure propagation, timelines and algorithm runs.

- Precise geometry: arrows end on the element they mean; lines end on something; labels never cross lines.
- Semantics from the visual grammar (visual-design.md): one shape per kind of thing, one line style per meaning.
- Progressive disclosure: start with the few parts the first question needs; reveal the rest as steps.
- An isometric or axonometric drawing gives a depth cue without a 3D engine (the host's drawing set, Anatomy).

## 3D: only with a reason

Before choosing `3d`, write in the asset plan why 2D is insufficient **for this objective**. Candidates:
multi-region infrastructure where distance matters, spatial network topologies, service clusters seen as racks,
layered stacks lifted apart, large maps where overlap in 2D confuses. If the reason is "it looks better", it is 2D.

If 3D is justified:

- An intentional first camera that already shows the point; understandable without moving the camera.
- Motion reveals structure or causality (an exploded view, a request crossing regions), not a fly-through.
- Controlled orbit with limits; keyboard steps and touch; reset view.
- No particles, bloom or post-processing unless the concept is light or flow; no photorealism for abstractions.
- Labels in HTML beside or over the canvas; essential information also in a 2D drawing or text.
- Reduced motion: one still frame per step. Performance: a quality tier for weak GPUs; stop rendering offscreen.
- The 3D library is loaded only by that figure, on demand, never in the route's first load.

## External assets

Prefer original diagrams and procedural geometry: they say exactly what the model says. Use an external asset only
when it clarifies (a recognisable device, a map outline), with a verified licence (CC0 or compatible), the
attribution it requires recorded in the spec's Sources, and optimised files (SVG minified; glTF with
Draco/Meshopt and KTX2 textures). No stock imagery that only decorates.

## Loading and budgets

- Pages are server components; each interactive figure is a client component loaded by the kit's `NearViewport`
  (`React.lazy` inside it) when it nears the viewport, with a server-rendered fallback card of the same figure id
  and height that says what the figure does (the page reads without JavaScript; a figure that needs no script,
  like an explore figure built on `:has()`, is server-rendered whole). Its chunk does not count toward
  first-load JS.
- First-load JS per page stays within the host budget (this repo: ≤ 120 kB, measured by
  `tests/browser/js-budget.cjs`); `/` must not change.
- Add a dependency only for a figure that needs it, with its gzip size, peer ranges and the reason recorded; this
  course has no animation or 3D library today, and the kit's clock covers 2D motion.
