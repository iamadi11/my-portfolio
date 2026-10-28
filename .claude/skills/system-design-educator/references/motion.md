# Motion

Animation explains causality or it is cut. It shows what changes, what causes the change, the order of events,
which components are involved, what state each holds, what happens when an assumption changes, and where a
failure starts and how it spreads. Floating particles, pulses, spins, camera drifts and animated gradients that
stand for nothing are rejected in review.

## Animation sense

Fill `## Animation sense` in the chapter spec **before any geometry or motion code**. One subsection per
animated asset. Research the mechanism from a primary source first (`via: read` in Sources). A figure drawn
first and justified afterwards fails review.

Each subsection answers, in this order:

1. **Mechanism:** one sentence naming the real process (a name becomes an address, a request arrives or is lost). Not a tour, a factory, or a bench.
2. **Moving quantity:** the one mark that moves.
3. **Model field:** the state it equals, with units. Position, width, count, or presence must be that field. A step index is not a field unless the model stores the index as the state.
4. **Learner predicts:** what they commit before the move, checkable against the model afterwards.
5. **If the moving part is deleted:** must say the lesson is gone. If the labels would still teach it, delete the motion or change the object.
6. **Research (before drawing):** source id, `via: read`, date. No geometry until this line exists.

Sense test, run with the paragraphs hidden. Any no fails the figure:

1. You can point at what changed and say what it was before and after.
2. A frame frozen halfway is a legal state of the mechanism.
3. Changing one input changes the picture in a way you could have predicted.
4. The obvious wrong input breaks the picture in a way you could have predicted.
5. After one pass you can say the next event before it is drawn.

Reject on sight: a metaphor machine (drawers, a post office, or a bench standing in for protocols); a carriage whose only degree of freedom is which caption it sits on; a CSS bar or a circle on a line standing in for a position the model already has (elapsed time, an event, a check); isometric parts that encode no model variable; motion the learner could have narrated from the labels; prose that repeats the figure. A ruled rail with a carriage is allowed when the carriage's position is elapsed time and each block's length is that step's milliseconds. A body on a wire is allowed when its position is the event.

A still chart is enough when a still already shows the quantities. Add motion only for order, duration, or a cause a still hides. Sources for this gate, inspected 2026-10-28: Victor, Explorable Explanations and Ladder of Abstraction; Nicky Case on one mechanic at a time; Distill, Communicating with Interactive Articles; Van Cutsem, RaftViz; Red Blob Games on deleting marks that do not serve the diagram. Do not copy their pictures.

## Contents

- Animation sense
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
- `useClock` (kit) owns `t`, play/pause, seek and step-to-next-event, clamps `dt` to 1/30 s, plays at the
  figure's `rate` (model units per second), holds while its `target` (the figure) is offscreen
  (IntersectionObserver) and resumes when it returns, and stops when the run ends. A learner speed control
  (below) is the figure's, passed in as `rate`.

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
