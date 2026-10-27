# Learning science

What the skill uses, why, and how much to trust it. Evidence strength is a judgement from the sources named, as read
through search results (see `docs/system-design/REFERENCES_AND_METHODS.md` for what was and wasn't read in full).

## Contents

- Techniques used (table)
- How they show up in a chapter
- Myths and weak techniques to avoid
- Limits

## Techniques used

| Technique                                    | What it is                                                                                                                            | Evidence (strength)                                                                                                                                                                    | How the skill uses it                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Retrieval practice (testing effect)          | Recalling information strengthens memory more than re-reading                                                                         | Roediger & Karpicke 2006 (Psych. Science 17(3)): testing beat restudy on delayed tests, restudy won at 5 minutes. Dunlosky et al. 2013 rate practice testing **high utility** (strong) | Retrieval questions after each section; predict-before-run in sims                                        |
| Spacing (distributed practice)               | Spreading practice over time                                                                                                          | Cepeda et al. 2006 (Psych. Bulletin 132(3)): 839 assessments, 317 experiments; best gap grows with retention interval. Dunlosky: **high utility** (strong)                             | Spaced-review questions re-asked in later chapters and review units                                       |
| Worked examples, then fading                 | Study a solved problem; later steps are left for the learner                                                                          | Worked-example effect (Sweller, cognitive load theory); Renkl and colleagues on fading (moderate–strong for novices)                                                                   | Each chapter has a worked example; the exercise fades its last steps                                      |
| Expertise reversal                           | What helps novices (full guidance) can hinder experts                                                                                 | Kalyuga, Ayres, Chandler & Sweller 2003 (moderate–strong)                                                                                                                              | "Go deeper" sections and skippable recaps; less guidance later in the graph                               |
| Self-explanation / elaborative interrogation | Explaining why a step is right                                                                                                        | Dunlosky: **moderate utility** (moderate)                                                                                                                                              | Question 13 of the pattern; "why" prompts in exercises                                                    |
| Interleaving                                 | Mixing problem types in practice                                                                                                      | Dunlosky: moderate; Rohrer & Taylor 2007 positive in maths; a later meta-analysis finds a small, variable effect (moderate, mixed)                                                     | Mixed practice only in review and capstone units, after topics are learned                                |
| Multimedia principles                        | Coherence (cut extraneous material), signaling (cue the structure), segmenting (learner-paced parts), pre-training (name parts first) | Mayer's research programme (moderate–strong for these; principle count varies by edition)                                                                                              | No decorative visuals; labels and highlights for the step in focus; stepper controls; "parts you'll meet" |
| Feedback                                     | Information about performance relative to a goal                                                                                      | Hattie & Timperley 2007 (RER 77(1)): effects large but variable, can be negative; task/process feedback beats praise (strong that it matters, moderate on form)                        | Every answer explains why; points back to the section                                                     |
| Engagement with visualizations               | Learners who predict, change or construct learn more than those who only watch                                                        | Hundhausen, Douglas & Stasko 2002 meta-study of 24 studies; Naps et al. 2002 engagement taxonomy (moderate; many studies found no effect for viewing alone)                            | Visuals ask for a prediction or a change; no passive animation as the main teaching act                   |
| Implicit scaffolding in simulations          | Controls, constraints and feedback steer exploration without explicit instructions                                                    | PhET (Podolefsky, Perkins, Adams; Moore, Herzog & Perkins 2013) (moderate, mostly physics/chemistry classrooms)                                                                        | Few, meaningful controls; sensible ranges; immediate visible effect of each control                       |
| Desirable difficulties                       | Some difficulty during practice (spacing, retrieval, interleaving) improves long-term retention                                       | Bjork 1994 framing (moderate; the umbrella for the above)                                                                                                                              | Don't remove all effort; don't confuse fluency during reading with learning                               |

## How they show up in a chapter

Parts you'll meet (pre-training) → concrete problem → naive design and its failure → mechanism with a signaled
visual → predict-then-run interaction → worked example → retrieval questions with feedback → faded exercise →
self-explanation and transfer prompts → spaced-review items for later chapters.

## Myths and weak techniques to avoid

- **Learning styles** (matching teaching to "visual/auditory/kinesthetic learners"): Pashler, McDaniel, Rohrer &
  Bjork 2008 (PSPI 9(3)) found no adequate evidence for the matching hypothesis. Use words and pictures together
  because the content benefits, not to suit a style.
- **Re-reading, highlighting, summarising** as the learner's main activity: Dunlosky rates them low utility.
- **Animation as explanation by itself**: watching is the weakest engagement level; animations can also add
  extraneous load.
- **Decorative realism and 3D for its own sake**: extraneous material (coherence principle).

## Limits

- Most of this evidence comes from school and university settings and from memory of facts or procedures; transfer
  to adult self-study of system design is plausible, not proven.
- Effect sizes vary with learners, materials and timing; the course should observe its own learners when it can
  (e.g. which questions are missed) rather than assume.
- No technique here is used to make claims about the learner ("you've mastered X") that the course can't support.
