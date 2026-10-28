# Motion

Animation explains causality or it is cut. It shows what changes, what causes the change, the order of events,
which components are involved, what state each holds, what happens when an assumption changes, and where a
failure starts and how it spreads. Floating particles, pulses, spins, camera drifts and animated gradients that
stand for nothing are rejected in review.

## Contents

- What may move
- The clock: time as model state
- Controls and pacing
- Easing and timing
- Reduced motion and accessibility
- Performance
- Lessons from references

## What may move

Each animated element is listed in the asset plan's `animated:` field with what its motion means:

| Motion                               | Means                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| A tag travelling along a link        | A message or packet in transit; its position is its progress (time in flight) |
| An element drawn heavy, then light   | The component the current step acts on                                        |
| A queue's slots filling and emptying | Arrivals and service, from the model's queue length                           |
| A part fading out with ×             | Loss or failure, at the moment the model says it happens                      |
| A dashed path appearing              | An alternative route or a retry, when the model takes it                      |
| A counter rolling                    | Only when the counted quantity changes over time in the model                 |

Animate one or two key elements per view (ui-ux-pro-max `ux: Excessive Motion`); the rest stays still. Nothing
loops forever except while the learner has pressed Play.

## The clock: time as model state

- The figure has one clock `t` in model units (ticks, ms). Every frame is a pure function of `t` and the inputs:
  `view = render(model(inputs), t)`. Never step state per frame; seeking to any `t` gives the same picture
  (homepage `drive.ts` does the same with scroll).
- Events come from the model with times (`sent at 2`, `arrives at 4`). The drawing interpolates between event
  times; the event list, readouts and step text read the same events.
- Display time is scaled and labelled ("1 tick shown ≈ 0.6 s; not to scale").
- `useClock` (kit) owns `t`, play/pause, speed, seek and step-to-next-event, clamps `dt` to 1/30 s, and stops
  when the figure is offscreen (IntersectionObserver) or the run ends.

## Controls and pacing

- Learner-paced by default: a run starts paused at `t = 0` or plays once to the end and stops; it never
  autoplays in a loop beside text the learner is reading (WCAG 2.2.2 needs pause for anything auto-starting
  over 5 s).
- Controls: Play/Pause, Previous/Next event, Reset, Replay; speed (0.5×, 1×) when events are dense. Previous/Next
  jump between model events, so every state is reachable without watching.
- The current event is named in text beside the drawing, with its rule.
- Optional idle tour (Anatomy): a short scripted run that shows the point of the figure, played once when the
  figure first comes into view, paused on any input, never under reduced motion.

## Easing and timing

- Motion between events: ease-in-out for travel, ease-out for things appearing, ease-in for things leaving
  (ui-ux-pro-max `ux: Easing Functions`); constant speed only where speed means something (a packet on a link
  whose delay is the model's).
- Micro-interactions (a control responding, a highlight) 150–300 ms; travel between events 400–900 ms at 1×.
- One-shot events (a loss, a reset arriving) use an envelope with an attack and a decay, never a one-frame pop.

## Reduced motion and accessibility

- `prefers-reduced-motion: reduce`: no interpolation. Play steps from event to event (a frame per event, held),
  or the learner steps by hand; every state and every readout stays available. The figure still responds to
  input. (WCAG 2.3.3 is AAA; the course requires it.)
- No essential information only in motion: each event has a text line in the step list.
- The live region announces the run's summary once and each step when the learner steps, never per frame.
- Pause stops everything that moves.

## Performance

- Animate SVG/CSS `transform` and `opacity` (and stroke-dashoffset); never layout properties.
- One `requestAnimationFrame` loop per figure, only while playing and visible.
- React may re-render the drawing per frame only for small drawings (under ~150 nodes) and only while playing;
  measure (Lighthouse TBT, a 1 ms script budget per frame). Larger drawings write attributes on refs.

## Lessons from references

- **Anatomy (MIT), `references/motion.md` there:** time-based motion with clamped `dt`; parts follow targets
  with exponential easing or real springs; one loop that stops when settled or offscreen (read the newest
  IntersectionObserver entry); readouts from the model in true units; accessible value text written on change,
  not from the loop; an idle tour that pauses on input.
- **dimensional-drawing-motion (MIT, vendored):** strokes before fills, one camera, log zoom, ease-in-out for
  travel, ease-out for fades, no bounce or colour; one thing leads at a time.
- **Award sites (teardown in `docs/v2-research/`):** motion is tied to one signature idea and to input (scroll
  velocity, pointer); the fastest paint real HTML first and grow the motion in. Their physics toys, particle
  fields and camera flights are identity, not explanation: not for this course.
