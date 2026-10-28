# Learning science

What the skill uses, why, and how far to trust it. These techniques raise the odds that a chapter teaches well;
none is guaranteed to work for every learner, topic or setting.

**Access levels** (how the evidence was seen, for each source below):

- **Original inspected:** the paper itself was read.
- **Secondary inspected:** a reliable explanation of it was read in full.
- **Snippet only:** only search-result titles, abstracts or summaries were seen.

As of the skill's creation, **every source here is "snippet only"**: the authoring environment could not open
publishers, arXiv, PubMed, Wikipedia or university pages. The "reported strength" column repeats what those
snippets say about each body of research; it is provisional until someone reads the sources. Upgrade a row's
access level only after reading, and record it in `docs/system-design/REFERENCES_AND_METHODS.md`.

## Contents

- Techniques used (table)
- Visual learning: findings, judgement, workflow changes
- How they show up in a chapter
- Myths and weak techniques to avoid
- Limits

## Techniques used

| Technique                      | What it is                                                      | Sources (all snippet only)                                                                                                                                            | Reported strength (provisional)                | How the skill uses it                                                                     |
| ------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Retrieval practice             | Recalling information strengthens memory more than re-reading   | Roediger & Karpicke 2006, _Psych. Science_ 17(3): testing beat restudy on delayed tests; restudy won at 5 minutes. Dunlosky et al. 2013, _PSPI_ 14(1): "high utility" | Strong                                         | Retrieval questions after sections; predict-before-run                                    |
| Spacing                        | Spreading practice over time                                    | Cepeda et al. 2006, _Psych. Bulletin_ 132(3): review of 317 experiments; best gap grows with retention interval. Dunlosky 2013: "high utility"                        | Strong                                         | Spaced-review questions re-asked in later chapters                                        |
| Worked examples, then fading   | Study a solved problem; later steps left to the learner         | Sweller (cognitive load theory); Renkl and colleagues on fading                                                                                                       | Moderate–strong, for novices                   | Worked example per chapter; exercise fades its last steps                                 |
| Expertise reversal             | Full guidance can hinder learners who already know the material | Kalyuga, Ayres, Chandler & Sweller 2003                                                                                                                               | Moderate–strong                                | Skippable recaps and "Go deeper"; less guidance later in the graph                        |
| Self-explanation               | Explaining why a step is right                                  | Dunlosky 2013: "moderate utility"                                                                                                                                     | Moderate                                       | Question 13 of the pattern; "why" prompts                                                 |
| Interleaving                   | Mixing problem types in practice                                | Dunlosky 2013: moderate; Rohrer & Taylor 2007 (maths); a later meta-analysis: small, variable effect                                                                  | Moderate, mixed                                | Mixed practice only in review and capstone units                                          |
| Multimedia principles          | Coherence, signaling, segmenting, pre-training                  | Mayer's research programme (principle count varies by edition)                                                                                                        | Moderate–strong                                | No decorative visuals; highlight the step in focus; stepper controls; "parts you'll meet" |
| Feedback                       | Information about performance relative to a goal                | Hattie & Timperley 2007, _RER_ 77(1): large but variable effects, can be negative                                                                                     | Strong that it matters; form varies            | Every answer explains why and points back to the section                                  |
| Engagement with visualizations | Predicting, changing or constructing beats watching             | Hundhausen, Douglas & Stasko 2002 (meta-study, 24 studies); Naps et al. 2002 engagement taxonomy                                                                      | Moderate; viewing alone often showed no effect | Visuals ask for a prediction or a change                                                  |
| Implicit scaffolding           | Controls, constraints and feedback steer exploration            | PhET: Podolefsky, Perkins, Adams; Moore, Herzog & Perkins 2013                                                                                                        | Moderate (physics/chemistry classrooms)        | Few meaningful controls, sensible ranges, visible effect                                  |
| Desirable difficulties         | Some effort during practice aids long-term retention            | Bjork 1994 framing                                                                                                                                                    | Moderate (umbrella term)                       | Don't remove all effort; fluency while reading ≠ learning                                 |

## Visual learning: findings, judgement, workflow changes

Added for the visual-first standard (2026-10-27). All **snippet only** (search abstracts and summaries; publishers
unreachable), except the WCAG and MDN rows, which were read in full from their source repositories.

| Finding (as reported; access)                                                                                                                                                                                                                                   | Workflow change it drives                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tversky, Morrison & Bétrancourt 2002, _IJHCS_ 57: when animated and static graphics carry the same information, animation was rarely better; animations should match the concept's change (congruence) and be easy to perceive (apprehension). Snippet only     | Animate only when change over time is the concept; step controls instead of continuous motion (visual-design.md Motion) |
| Höffler & Leutner 2007, _Learning and Instruction_ 17(6), meta-analysis: overall advantage of animation over static pictures d ≈ 0.37; larger when the animation is representational (shows the change itself) and for procedural-motor knowledge. Snippet only | `animated-2d` only for representational change; asset plan says what changes                                            |
| Berney & Bétrancourt 2016, _Computers & Education_, meta-analysis: small overall advantage for animation (g ≈ 0.23), moderated by design. Snippet only                                                                                                          | Animation is not assumed better; the asset plan justifies the type                                                      |
| Ainsworth 2006 (DeFT), _Learning and Instruction_ 16(3): multiple representations help when each complements, constrains or deepens the others, and learners must be helped to relate them. Snippet only                                                        | Each asset has one stated objective; text names what the visual shows; one grammar across assets                        |
| Mayer's multimedia principles (spatial/temporal contiguity, segmenting, signaling). Secondary summaries, snippet only                                                                                                                                           | Short text beside its visual (stage D); stepper segments; one focus highlighted                                         |
| Wieman, Perkins & Adams 2008, _Am. J. Phys._ 76; PhET implicit scaffolding (arXiv 1306.6544): interactive simulations with constrained, meaningful controls supported exploration. Snippet only                                                                 | Few meaningful controls with ranges; every control changes the model; predict → run → explain                           |
| Munzner (visualization analysis and design): avoid unjustified 3D for abstract charts (occlusion, perspective distortion, tilted text); 3D suits truly spatial data. Snippet only (lecture slides)                                                          | Charts stay flat. A mechanism is not a chart: it is an Anatomy machine (anatomy-3d.md). Judgement, not a finding in Munzner |
| WCAG 2.2: 1.4.1, 1.4.11, 2.1.1, 2.2.2, 2.5.7, 2.5.8, 4.1.3, 1.4.10 (AA or A); 2.3.3 is AAA. Read in w3c/wcag @ 457cece                                                                                                                                          | Accessibility list in visual-design.md                                                                                  |
| MDN: `prefers-reduced-motion` (vestibular triggers include scaling and panning); transform and opacity are composited. Read in mdn/content                                                                                                                      | Reduced-motion forms; animate transform/opacity only                                                                    |

**Judgement, not finding:** that system design learners in particular benefit from interactive visuals is an
extrapolation from science and maths education; that chapters "came out prose-heavy" is this course's own
observation. Treat the visual-first standard as a design hypothesis, and drop a visual when a learner test or
review shows text works better for that objective.

## How they show up in a chapter

Parts you'll meet (pre-training) → concrete problem → naive design and its failure → mechanism with a signaled
visual → predict-then-run interaction → worked example → retrieval questions with feedback → faded exercise →
self-explanation and transfer prompts → spaced-review items for later chapters.

## Myths and weak techniques to avoid

- **Learning styles** (matching teaching to "visual/auditory/kinesthetic learners"): per search summaries of
  Pashler, McDaniel, Rohrer & Bjork 2008 (_PSPI_ 9(3)), no adequate evidence supports the matching hypothesis. Use
  words and pictures together because the content benefits, not to suit a style.
- **Re-reading, highlighting, summarising** as the main activity: low utility per Dunlosky 2013 (snippet only).
- **Animation as explanation by itself**: watching is the weakest engagement level and can add extraneous load.
- **Decorative realism and 3D for its own sake**: extraneous material (coherence). A turning camera, a particle
  cloud or a city of boxes is this. An Anatomy machine whose moving part is the model's state is not.

## Limits

- Most of this research uses school and university learners and memory of facts or procedures. Whether it holds
  for adults self-studying system design is plausible, not shown.
- Effects vary with learners, materials and timing. Treat each technique as a hypothesis the course can check
  against its own learners (e.g. which questions are missed), not a promise.
- Never tell a learner they have "mastered" something the course can't measure.
