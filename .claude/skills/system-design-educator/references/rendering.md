# Rendering: Anatomy 3D and assets

Choose the rendering technique for what it teaches. The default is an Anatomy machine: a 3D object whose moving
parts are the model's state. A flat diagram is the exception, written down.

## Contents

- Asset types
- Anatomy first
- Flat diagrams
- External assets
- Loading and budgets

## Asset types

| `type:`        | Use when                                                     | Must have                                                                           |
| -------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `precision-2d` | Structure and relations, nothing changes with input          | One grammar, legend, labels legible at 375 px, what is omitted stated               |
| `animated-2d`  | Change over time is the concept                              | A clock and events from a model (motion.md), step controls, reduced-motion form     |
| `simulation`   | Insight comes from changing inputs and watching consequences | Executable model with its documentation (scientific-modeling.md), presets, tests    |
| `chart`        | A quantitative relationship matters                          | Axes, units, scale, data class (measured / model / illustrative), table alternative |
| `3d`           | An Anatomy machine (isometric or turning)                        | `render:`, `object:`, `fidelity:`, a tested model, lazy chunk                       |
| `illustration` | A recognisable anchor before an abstract model               | Says it is a picture of the idea                                                    |
| `experiment`   | The learner can safely try the real thing                    | Expected results as ranges, no special hardware                                     |
| `text`         | A definition a picture would only decorate                   | The reason                                                                          |

## Anatomy first

The default picture is an Anatomy machine. `render: anatomy-iso` is a 3D object (world x, y, z up) drawn by
isometric projection: solids, painter's order, four tones. `render: anatomy-turn` is Anatomy's true 3D mode, used
when a part must turn, hinge or fall. Both use asset `type: 3d`. The preference order, the fidelity ledger and the
fresher path are in `anatomy-3d.md`. Read the vendored Anatomy skill before geometry, and its 3D reference before
a turning part.

`type: 3d` still needs an executable model. The first camera already shows the point; the learner can understand
the machine without orbiting. Motion is a model event (a carriage arriving, a plug turning), not a fly-through.
Labels live in HTML. Reduced motion is one still per step. The kit loads in that figure's chunk.

## Flat diagrams

`render: flat-2d` is SVG, CSS or Canvas 2D, and only with a `Flat exception:` line: a physical object would teach
the wrong mechanism (a formula plot, a truth table, a lattice). Box-and-arrow architecture diagrams are not the
exception. They are the failure this standard exists to replace.

When a flat figure is allowed: arrows end on the element they mean, one shape per kind of thing, and the learner
meets the few parts the first question needs before the rest appear.

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
- JS stays within the host's budgets, measured by `tests/browser/js-budget.cjs` (this repo, owner 2026-10-28:
  `/learn` routes ≤ 150 kB first-load and ≤ 400 kB more on demand while the page is scrolled; `/` keeps its own
  ≤ 120 kB and must not change). A library a figure needs goes in that figure's lazy chunk, never the page's.
- Add a dependency only for a figure that needs it, with its gzip size, peer ranges and the reason recorded. Do
  not add Three.js, React Three Fiber, Spline, GSAP or Manim. The vendored Anatomy skill
  (`.claude/skills/anatomy`, MIT) is the 3D path: isometric solids, springs, the turn mode and WebGL effects,
  monochrome (its `VENDORED.md` and the host's paper). Its kit is copied or imported into the figure's chunk.
