# Chapter workflow

## Contents

- Stages A–F (visual first)
- The 14-question explanation pattern
- Writing rules (teach from zero)
- Chapter spec template (`docs/system-design/chapters/<id>.md`)
- Assessment design
- Independent review hand-off

## Stages A–F (visual first)

A chapter is built in this order. The visual model comes before the prose; the prose names and qualifies what the
learner has already seen. Detail for each stage is in visual-design.md (look, interaction, asset plan format,
acceptance criteria) and visual-science.md (models, evidence classes, the adversarial pass).

| Stage | Mode C step  | Output in the spec                                                                        |
| ----- | ------------ | ----------------------------------------------------------------------------------------- |
| A     | 2 Boundary   | `## Boundary`: numbered objectives, misconceptions, what prose handles badly here         |
| B     | 4 Storyboard | `## Storyboard` (the sequence of visual states) and `## Asset plan` (one entry per asset) |
| C     | 6 Implement  | models + tests, then the visuals, then the page; `built:` paths in the asset plan         |
| D     | 5 / 6 Text   | `## Explanation` written against the storyboard: short text beside each visual            |
| E     | 7 Test       | model, interaction and answer-leak tests; adversarial pass recorded per asset             |
| F     | 8 Review     | a fresh reviewer examines the rendered page; `Visual review:` line (verification.md)      |

The spec carries `Standard: visual-first` under its title; `course.mjs check` then requires the asset plan, its
fields, objective coverage and, from `reviewed`, the visual review line. Chapters written before this standard lack
the marker; `check` warns about them and they get a mode D pass to bring them up to it.

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
- Flag every simplification you make and point to where it's corrected (see the oversimplification list in
  research-and-sources.md).

## Chapter spec template

```markdown
# <title>

Id: <id> · Stage: <n> · Paths: <...> (status lives only in CURRICULUM.md)
Prerequisites: <ids> · Related: <ids>
Standard: visual-first

## Boundary

Objectives (observable, numbered): ...

1. <the learner can predict / explain / calculate ...>
2. ...

In scope: ...
Deferred: <topic> → <chapter id>
Misconceptions targeted: ...
Hard to say in prose: <change over time, spatial or many-to-many relations, cause under a variable ...>

## Parts you'll meet

<term>: <plain definition>

## Storyboard

1. <first visual state the learner sees, and the question it raises>
2. <what they do, what changes, what they should notice>
   ...

## Asset plan

Objective coverage: 1 → A1 · 2 → A2

### A1. <name>

- objective: 1
- type: precision-2d | animated-2d | simulation | chart | 3d | illustration | experiment | text
- learner sees: ...
- learner does: ...
- model: ...
- assumptions: ...
- outcome: ...
- accessibility: ...
- tests: ...
- evidence: ...
- built: <paths, from Implemented>

## Explanation (14 questions)

1. Problem: ...
   ... 14. Transfer: ...

## Worked example

<steps, with fading plan: which steps the learner completes in the exercise>

## Visual

Decision: <one line: which assets carry the chapter and why this medium>

## Practice

Retrieval questions (with answer and why each wrong option is wrong): ...
Exercise (apply/transfer): ...
Spaced review: <which later chapters re-ask which question>

## Sources

- id: <source id> (full record: research-and-sources.md; `via` and `supports` are checked)

## Open questions / unverified

...

## Evidence

- <check>: pass | fail | not run | n/a — <command or reason> (<date>)

## Review findings

Reviewer: <fresh subagent>, <date>
Visual review: text-heavy=no · mechanism-via-visual=yes · every-visual-teaches=yes · claims-defensible=yes · interaction-helps=yes

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
URL of the running page, and `references/verification.md`, `references/visual-design.md` and
`references/visual-science.md`. Ask it to use the rendered page (screenshots at the required sizes, operating every
control), not only the source, and for findings by severity with file and line. Don't tell it what you think is fine.
