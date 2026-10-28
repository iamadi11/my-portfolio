# Anatomy 3D: the machine is the lesson

A college fresher has never operated a production system. Interview diagrams (boxes, arrows, a load balancer
appearing on slide two) name parts before the learner has seen one thing break. This course teaches the other way:
a physical machine whose working is the mechanism, motion driven by a tested model, and a short text that names
what the machine just did and where the toy stops being true.

The machine is built with the vendored Anatomy skill (`.claude/skills/anatomy`, MIT). Read its `SKILL.md` before
designing a figure. For a part that turns, hinges or falls, read Anatomy's `references/3d.md` before any geometry.
Do not install another skill or a 3D library to get this. Do not copy Anatomy's example objects; copy its craft.

## Contents

- Who it is for
- Preference order
- What Anatomy 3D means here
- Scientific method on every figure
- Fidelity ledger
- Fresher path through a chapter
- What not to borrow
- Size and honesty

## Who it is for

Write for a smart reader who can use a computer and has never deployed anything. They do not know "round trip",
"replica" or "quorum" until this course defines them, and the definition comes after they have watched the thing
happen. One new mechanism per chapter (map chapters excepted). Jargon is the name of a part they have already seen
move.

Reddit's consistent advice to students (r/cscareerquestions, search snippets 2022–2026) is that system design is
not learned from a memorised diagram: people learn it by building a small system and watching it fail, and that
interview primers are a format, not a textbook. The beginner path of this course is that first machine. Designing
Data-Intensive Applications and the interview cases come later in the graph, after the mechanisms exist as things
the learner has broken.

## Preference order

Choose the first row that is true. Write the choice in the asset's `render:` field.

| `render:`      | Choose it when                                                                                          | Anatomy                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `anatomy-turn` | A rigid body turning, hinging, flexing or breaking off is the idea (a dial, a platter, a lock plug, a cam) | Anatomy 3D mode: `references/3d.md`, one turning subject, static clutter around it, orbit audit |
| `anatomy-iso`  | The default. A wait is a message at the machine that step is (position = elapsed time, a longer wait is a longer stretch). A message is a body on a wire (position = the event). A lookup is that body visiting the other machine. A cutaway's wells are the checks | Isometric solids (world x, y, floor; z up), painter's order, four-tone shading |
| `flat-2d`      | No rigid body can carry the model field without inventing a shape the model does not have | Only with a `Flat exception:` that names the field the solid would fake. "It is only a duration" is not an exception |

`anatomy-iso` is a 3D object drawn by projection. It is the default because most system mechanisms are "something
travels, waits, or fails inside a machine", and a turning camera does not add that. `anatomy-turn` is the
preference when depth motion itself is the explanation. A chapter with no `anatomy-iso` and no `anatomy-turn`
asset needs `Flat exception:`.

"It looks better" is not a reason to leave Anatomy, and it is not a reason to skip it. Spectacle that hides a
wrong mechanism is a reject (visual-review.md).

## What Anatomy 3D means here

Follow Anatomy's craft, with these course constraints:

- **The object maps one-to-one.** A carriage's position is the request's place in the model. A drawer's depth is a
  byte count only if the model says so. If you could delete the moving part and lose no information, it was
  decoration.
- **Monochrome.** The host page is black line on white paper. Use Anatomy's light theme. Tones (`lo`, `mid`, `hi`,
  one `lit` subject) carry state. No gold, no accent colour, no colour-only meaning. Materials in turn mode stay
  steel, rubber or gunmetal, remapped to the same gray ramp.
- **Words stay out of the metal** except one tiny nameplate (a unit, not the essay). The live readout beside the
  drawing names the state. Painting DNS, browser, or 443 across the faces does not make the object explain the
  chapter. The citation and the worked number live in HTML beside the card.
- **Motion is the model's events.** The carriage dwells in proportion to that step's milliseconds. A skipped step
  is a station the carriage does not stop at, with the model's skip reason in the readout. Do not tween between
  invented poses.
- **Reduced motion** jumps to the step. Keyboard steps the same stations the pointer does. The SVG is
  `aria-hidden` when the HTML already says the step; the readout is text.
- **Lazy.** Anatomy's kit ships in that figure's chunk, not the route's first load. No Three.js, Spline, R3F or
  GSAP. WebGL only for what lines cannot draw (Anatomy's rule), and only when the concept is that phenomenon.
- **Size.** Build the parts that machine has: base, feet, fasteners, a scale, the moving subject. A bare slab is
  unfinished. A part that holds the instrument together is not decoration. A part added to hit a count, or that
  tells a second story, is. One moving mark. Do not start an Epic in a chapter unit.

## Scientific method on every figure

Each figure is one experiment, in this order. The learner does steps 3 and 4; the page does not narrate them first.

1. **Question.** One sentence, in the learner's words ("where does the time go?").
2. **Naive machine.** The obvious design, built fairly, and the conditions under which it works.
3. **One change.** A control with a unit and a range. Changing it runs the model again.
4. **Observation.** The readout is a number the model just computed, or a state the model just entered.
5. **Mechanism.** The rule, named, with every variable and its unit. This is the short text.
6. **Limit.** The fidelity ledger: what was computed, scaled, assumed, faked.

Predict before the run when the pattern is `predict`. The answer is not on screen yet. After the run, the feedback
points at the part that moved and the rule that moved it.

A second control that does not change the model is a reject. A number with no unit is a reject.

## Fidelity ledger

Every quantity a learner could take as real is one of these, in the asset's `fidelity:` field and in one sentence
under the figure. Method taken from public explainer practice (Learnscape's ledger, inspected as a README and
skill text on 2026-10-28; not installed, no text copied into chapters):

| Class       | Means                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `computed`  | Arithmetic in the model, running now. Name the function.                                       |
| `scaled`    | The real mechanism at a smaller count. Give both numbers (3 replicas on screen, hundreds in production). |
| `assumed`   | A labelled input nobody measured for this page (the 40 ms round trip).                        |
| `faked`     | Not the real mechanism, and a reader would think it was. Say so, and say where to look instead. |

A faked quantity is allowed only to keep a picture legible, never to make a design look healthier than the model.
If the ledger would have to say "faked" for the thing the chapter teaches, the object is the wrong object. Change
the object.

## Fresher path through a chapter

1. The machine, working, before the glossary.
2. They step it and break it. Breaking is a control (drop a link, fill a queue, reuse a connection), not a paragraph.
3. The name of what they saw, then the rule, then the citation.
4. One worked number, labelled assumed, computed by the same model.
5. A retrieval question whose wrong answers are the misconceptions in the spec.
6. Transfer: the same mechanism in a different machine, one sentence.

Mechanism prose beside the figures stays under about 900 words. That cap is a hypothesis (recorded in
REFERENCES_AND_METHODS.md), not a measured optimum. Citations stay; repetition of what the figure shows does not.
"Go deeper" holds the exceptions (Fast Open, 0-RTT, the second hostname) so the first pass has one story.

## What not to borrow

Inspected 2026-10-28 as search snippets or READMEs, not installed:

| Source | Take | Leave |
| --- | --- | --- |
| Anatomy (`wheresryan22/anatomy`) | The object, the kit, turn-3D, the audit | Example machines, colour, gallery publishing |
| Learnscape isometric explainer | Vehicle carries model state; fidelity ledger; first pass slow enough to read, later passes fast | Its city layouts, its pacing constants, its code |
| RaftViz (Van Cutsem, 2026, blog post) | Every moving mark is one step of the real algorithm; then a sandbox that crashes a part | Any Raft text or pseudocode |
| Ciechanowski, explorable explanations (Victor, Case, Red Blob Games) | Manipulate one mechanism; the picture is the argument | Their visual style, their essays |
| algorithms.live | Watch, then predict, then prove against the model | Their lesson text |
| System Design, Visually (mallikarjunreddy.com) | Push the model until it fails; draw the formula next to the measurement; start before "add a load balancer" | Their essays and numbers |
| System Design Simulator, SystemDesigner, System Design Lab | Confirmation that motion beats a PDF | Three.js box cities, quiz-first lessons, tldraw as the explanation, obfuscated single-file apps |
| Manim | Useful for a video. This course is interactive | Video as the chapter. The learner cannot change a video |
| ByteByteGo, Grokking, Hello Interview | Later, the interview path's outline habit | As the beginner explanation |

## Size and honesty

A chapter is still one unit. Build the figure the storyboard names, not a gallery. If Anatomy's audit or the
course's browser checks cannot be run, record `not run` and do not raise the gate. A beautiful machine with a
wrong dwell time is a failed chapter.
