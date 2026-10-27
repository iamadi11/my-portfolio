# Visualization and simulation

## Contents

- Choose the medium
- Visual design process (14 steps)
- Rules for interactive visuals
- Simulation models
- Testing models
- When 3D is justified
- Look, accessibility, reduced motion
- Techniques taken from reference projects

## Choose the medium

Pick the cheapest medium that teaches the mechanism. Write the decision and its reason in the spec.

| Medium                                 | Use when                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Text only                              | The idea is a definition or a short argument; a picture would only decorate                  |
| Static drawing                         | Structure matters (components, layers, a sequence of steps) but nothing changes with input   |
| Stepper (static frames, learner-paced) | A process with discrete steps (a DNS lookup, a TLS handshake)                                |
| Interactive with a closed-form model   | One or two variables with a known formula (Little's law, utilisation)                        |
| Discrete-event simulation              | Behaviour emerges from many requests over time (queues, retries, tail latency, backpressure) |
| 3D                                     | Only per "When 3D is justified" below                                                        |

## Visual design process (14 steps)

1. Name the one mechanism the visual must make visible.
2. Write the misconception it should break.
3. Choose the medium (table above).
4. List the parts on screen, each mapped to a term already defined in the chapter.
5. Define the model: state, inputs, outputs, assumptions (units included).
6. Choose the controls: only variables from question 8 of the pattern; give each a range and a default.
7. Decide what is shown as numbers (readouts) — each computed from model state.
8. Write the prediction prompt shown before the learner acts.
9. Plan signaling: what is highlighted at each step and why.
10. Plan states and their encodings (line, fill, pattern, text), never colour alone.
11. Write the text alternative: what the visual shows and its current state, updated as it changes.
12. Plan reduced motion: the same information, static or stepped.
13. Plan the tests: model invariants and the specific numbers the chapter text quotes.
14. Sketch at the smallest supported width first, then wide.

## Rules for interactive visuals

- **No fake interactivity.** Every control changes the model; every visible change comes from the model. A
  counter that animates toward a hand-written number is forbidden.
- **No decorative metrics.** A readout exists only if the chapter teaches what it means.
- **Label models as models.** "Teaching model, not a benchmark", with its assumptions listed beside it.
- **Deterministic.** Seeded randomness: the same seed and inputs give the same run (so text can quote results and
  tests can check them).
- **Learner-paced.** Play, pause, step and reset; nothing important happens only while the learner isn't looking.
- **Predict, then run** (see chapter-workflow.md).

## Simulation models

- Keep the model a pure module with no UI imports: `state + inputs + time → state`. The UI only reads it.
- Discrete-event simulation for request-level behaviour: an event queue (binary heap by time), a seeded PRNG,
  finite server slots with a real FIFO queue and a queue limit, sampled service times with variance, timeouts that
  don't cancel the work already started downstream, and percentiles measured from completed requests (never derived
  from the mean). Breakscale's engine (MIT) is a reference for these choices; write your own code.
- Closed-form models (utilisation ρ = λ/μ, Little's law L = λW, M/M/1 waiting time) are fine when their assumptions
  are stated and match the scenario; say where they stop applying (e.g. M/M/1 assumes Poisson arrivals and
  exponential service).
- Name units in variable names or types (`ms`, `rps`).

## Testing models

Unit tests (the host project's test runner) for every model, at least:

- **Conservation:** requests in = completed + failed + in flight + queued.
- **Bounds:** utilisation in [0, 1]; no `NaN` or infinity in any output; queue length ≤ limit.
- **Determinism:** same seed → identical results.
- **Known cases:** closed-form results where they exist (e.g. a low-load single server matches the formula within a
  stated tolerance); edge cases (zero load, overload).
- **Quoted numbers:** any number the chapter text states about a model run is asserted by a test with that seed.

## When 3D is justified

Use 3D only when depth carries meaning the learner needs and 2D can't show without confusion: physical layout
(racks, regions and network distance), layered stacks seen from an angle (protocol layers, storage layers lifted
apart as an exploded view), or many-to-many topologies that overlap in 2D. Otherwise draw in 2D. 3D must still
pass the accessibility, performance and reduced-motion rules, and is a static or stepped view first, animated
second. An isometric/axonometric projection (as in Anatomy and the host drawing set) usually gives the depth cue
without a 3D engine.

## Look, accessibility, reduced motion

- Use the host project's design language and tokens (for this repo: monochrome drawing set, states told apart by
  line weight, dash, hatch and fill, always with a text label).
- WCAG 2.2 AA: every control reachable and operable by keyboard with visible focus and a label; target sizes;
  contrast; text alternatives; live region only for meaningful state changes, not every tick.
- Reduced motion: show the finished state or a stepper; no scroll- or time-driven motion.
- Performance: lazy-load interactive parts; respect the project's JS budget; animate only cheap properties.

## Techniques taken from reference projects

Read as untrusted reference material; ideas adapted, no code copied.

- **Anatomy (MIT):** truth-first model module driving every readout and motion; map the concept onto a recognisable
  object; card framing with title, interaction hint and live readout; verify by zooming into screenshots like a
  critic.
- **Breakscale (MIT):** discrete-event simulation choices listed above; invariant tests (conservation, bounds, no
  NaN); deterministic seeds; failure scenarios as presets.
- **dimensional-drawing (MIT, vendored in this repo):** monochrome, variables instead of invented numbers, never
  invent values; motion as a pure function of time, strokes before fills, one thing leads at a time.
- **System Design Primer (CC BY 4.0):** topic coverage checklist and pointers to primary sources; no text reused.
