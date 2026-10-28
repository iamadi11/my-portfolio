# Chapter workflow

## Contents

- Six stages, experience first
- The 14-question explanation pattern
- Writing rules (teach from zero)
- Chapter spec template (`docs/system-design/chapters/<id>.md`)
- Assessment design
- Independent review hand-off

## Six stages, experience first

A chapter is conceived as an experience before it is written as text. Each stage has an output in the spec; mode C
steps in SKILL.md map onto them. Details: interaction-patterns.md, motion.md, rendering.md, scientific-modeling.md,
visual-design.md, visual-review.md.

| Stage                               | Mode C step          | Output in the spec                                                                                                                                                                                                            |
| ----------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Concept decomposition             | 2                    | `## Concept decomposition`: mental models, mechanisms, misconceptions, temporal behaviour, quantitative relations, failure scenarios, trade-offs, what needs space or experiment; the 2–3 hardest concepts (`Hardest:` lines) |
| 2 Interaction and visual storyboard | 4                    | `## Storyboard` (the learner's path through the figures) and `## Asset plan` (one entry per figure, all fields)                                                                                                               |
| 3 Build the explanatory experience  | 6                    | Models and their tests first, then the figures and their interactions, then the page; `built:` paths                                                                                                                          |
| 4 Add the scientific explanation    | 5 (draft), 6 (final) | `## Explanation`: rules, equations, assumptions and limits, placed beside the figure they qualify; drafted against the storyboard, rewritten against the rendered figures, cutting what they already show                     |
| 5 Test the model and interaction    | 7                    | `## Evidence`: normal, boundary, invalid input, transitions, reset/replay, alternative scenarios, wrong predictions, leaks, accessibility, reduced motion, mobile, correctness                                                |
| 6 Independent review                | 8                    | `## Review findings` with the `Visual review:`, `Visual rubric:` and `Rejects:` lines (visual-review.md)                                                                                                                      |

For every hard concept, design around six questions before any prose: what should the learner understand; what
can they see that makes it easier; what can they manipulate to discover the rule; what can they predict before
observing; what feedback connects the outcome to the mechanism; what should they be able to explain or transfer.

The spec carries `Standard: anatomy-3d` under its title; `course.mjs check` enforces the structure, including
`object:`, `render:` and `fidelity:` on every asset. `visual-first` is the previous standard: `check` still
enforces its fields and warns until a mode D pass. Specs written before either say `Standard: legacy — <why>`.

## The 14-question explanation pattern

Every chapter's core explanation answers these, in this order. Not every answer needs a paragraph; every answer
must exist in the spec, and many are best answered by an asset ("see A2: the learner runs it") with one or two
sentences of text. Questions 3–4 and 5–6 are what make it teach rather than tell: the learner meets the naive
design, sees it work, then sees it break.

1. **What is the problem?** A concrete situation, in the learner's terms.
2. **Why does it matter?** What goes wrong for users or operators if it's ignored.
3. **What would a beginner try first?** The obvious design, stated fairly.
4. **Why does that work at first?** The conditions under which it's fine (it usually is, at small scale).
5. **When does it fail?** The specific condition (load, failure, distance, concurrency) and the symptom.
6. **What do we observe more carefully?** The measurement or observation that reveals the real cause.
7. **What is the real mechanism?** The model that explains the observation. Define every term and variable.
8. **What can the learner change and watch?** The variables of the visualization or exercise, and what each does.
9. **What alternatives exist?** Two to four real designs.
10. **What are the trade-offs?** Per alternative: what it costs (latency, consistency, complexity, money, ops).
11. **When should you choose it?** The conditions, stated as observable facts.
12. **When should you not?** Including "you don't need this yet".
13. **Explain it in your own words.** A self-explanation prompt for the learner.
14. **Where else does this apply?** A transfer prompt: the same mechanism in a different system.

## Writing rules

- Define jargon at first use in plain words; keep one term per concept for the whole course (a glossary in the spec).
- Every equation: state what it computes, then each variable with its unit, then a worked number labelled
  "assumed values".
- Analogies: say what maps to what, and where the analogy breaks ("unlike a real queue at a shop, a server can
  drop you silently").
- Progressive disclosure: the main path stays simple; depth goes in clearly marked "Go deeper" parts the learner
  can skip without losing the thread.
- Name the parts before the process (pre-training): a short "parts you'll meet" list before the mechanism.
- Short sentences, active voice, ~70ch measure. No filler, no hype, no "simply"/"just" for hard things.
- Mechanism prose beside the figures stays under about 900 words. The machine carries the sequence. Citations
  and the fidelity sentence stay. This cap is a hypothesis, not a measured optimum.
- Flag every simplification you make and point to where it's corrected (see the oversimplification list in
  research-and-sources.md).

## Chapter spec template

```markdown
# <title>

Id: <id> · Stage: <n> · Paths: <...> (status lives only in CURRICULUM.md)
Prerequisites: <ids> · Related: <ids>
Standard: anatomy-3d

## Boundary

Objectives (observable, numbered): ...

1. <the learner can predict / explain / calculate ...>

In scope: ...
Deferred: <topic> → <chapter id>
Misconceptions targeted: ...

## Concept decomposition

Mental models: ...
Mechanisms: ...
Temporal behaviour: ...
Quantitative relations: ...
Failure scenarios: ...
Trade-offs: ...
Needs space or experiment: ...
Hardest: <concept> — <why it is hard, and which figure teaches it>
Hardest: <concept> — ...

## Parts you'll meet

<term>: <plain definition>

## Storyboard

1. <the learner's first view and the question it raises>
2. <what they do, what moves, what they should notice>
   ...

## Asset plan

Objective coverage: 1 → A1 · 2 → A2

### A1. <name>

- objective: 1
- type: precision-2d | animated-2d | simulation | chart | 3d | illustration | experiment | text
- object: <the physical machine, one sentence, or "none — flat exception">
- render: anatomy-turn | anatomy-iso | flat-2d
- fidelity: <computed / scaled / assumed / faked, each quantity named>
- pattern: manipulate | predict | step | explore | break | compare | construct | quantitative | debug | read
- learner sees: <initial view>
- animated: <what moves and what the motion means, or "none — <reason>">
- learner does: <what can be manipulated>
- notice: <what the learner is expected to notice>
- model: <state, inputs with units and ranges, rules; what the model does when inputs change>
- feedback: <what is shown after an action, and how it ties the outcome to the rule>
- assumptions: <simplifications, limits, misconceptions guarded>
- outcome: <what the learner can predict, explain or calculate afterwards>
- accessibility: <text alternative, keyboard, reduced-motion form, mobile layout>
- tests: <model, interaction and leak tests>
- evidence: <source ids with sections, and the evidence class of each claim>
- built: <file paths, from Implemented>

## Animation sense

Fill this before geometry (motion.md). One subsection per animated asset.

### A1. Animation sense

- Mechanism: <the real process, one sentence>
- Moving quantity: <the mark that moves>
- Model field: <the state it equals, with units>
- Learner predicts: <what they commit before the move>
- If the moving part is deleted: the lesson is gone
- Research (before drawing): <source id, via: read, date>

## Explanation (14 questions)

1. Problem: ...
   ... 14. Transfer: ...

## Worked example

<steps, with fading plan>

## Visual

Decision: <which machines carry the chapter, and the render of each (anatomy-turn, anatomy-iso, flat-2d)>

## Practice

Retrieval questions (with answer and why each wrong option is wrong): ...
Exercise (apply/transfer): ...
Spaced review: <which later chapters re-ask which question>

## Tabs

- Learn: <the figure and the one rule it shows; what this tab does not repeat>
- Lab: <the inputs, the prediction, and the fault the learner can cause>
- Quiz: <what is asked; the answer stays hidden until opened>

## Sources

- id: <source id> (full record: research-and-sources.md; `via` and `supports` are checked)

The spec keeps this list. The built chapter does not render it. Inline marks link to `/learn/sources#src-<chapter>-<id>`.

## Open questions / unverified

...

## Evidence

- <check>: pass | fail | not run | n/a — <command or reason> (<date>)

## Review findings

Reviewer: <fresh subagent>, <date>
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes
Visual rubric: education=pass · clarity=pass · interaction=pass · correctness=pass · animation=pass · hierarchy=pass · accessibility=pass · mobile=pass · performance=pass · consistency=pass
Rejects: none

- [blocking | should-fix | note] <finding> → fixed (<where>) | accepted: <reason> | open
```

## Assessment design

Assessment is for learning (retrieval and feedback), not grading.

- **Retrieval questions** after each section: ask for recall or a prediction before revealing, not recognition of
  a sentence just read. Prefer "what happens to p99 when…" over "which of these is a load balancer".
- **Predict, then run.** Before a learner changes a simulation variable, ask what they expect; show the model's
  result next to their prediction.
- **Feedback** says what is right or wrong and why, and points to the part of the chapter to revisit
  (task- and process-level feedback; see learning-science.md).
- **Distractors** are real misconceptions, each with its explanation.
- **Exercise**: one apply-or-transfer task per chapter, with a worked answer revealed after an attempt.
- **Spaced review**: each chapter lists two or three questions to be re-asked by a later chapter or review unit.

## Independent review hand-off

Give the reviewer (a fresh subagent with no authoring context) only: the spec path, the implementation paths, the
URL of the running page, and `references/verification.md`, `references/visual-review.md`,
`references/scientific-modeling.md`, `references/interaction-patterns.md` and `references/motion.md`. Ask it to use the rendered page (screenshots at the required sizes, operating every
control), not only the source, and for findings by severity with file and line. Don't tell it what you think is fine.
