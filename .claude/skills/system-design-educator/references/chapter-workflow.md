# Chapter workflow

## Contents

- The 14-question explanation pattern
- Writing rules (teach from zero)
- Chapter spec template (`docs/system-design/chapters/<id>.md`)
- Assessment design
- Independent review hand-off

## The 14-question explanation pattern

Every chapter's core explanation answers these, in this order. Not every answer needs a paragraph; every answer
must exist in the spec. Questions 3–4 and 5–6 are what make it teach rather than tell: the learner meets the naive
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

Id: <id> · Stage: <n> · Paths: <...> · Status: <gate>
Prerequisites: <ids> · Related: <ids>

## Boundary

Objectives (observable): ...
In scope: ...
Deferred: <topic> → <chapter id>
Misconceptions targeted: ...

## Parts you'll meet

<term>: <plain definition>

## Explanation (14 questions)

1. Problem: ...
   ... 14. Transfer: ...

## Worked example

<steps, with fading plan: which steps the learner completes in the exercise>

## Visual

Decision: <static drawing | interactive | simulation | text only> because ...
<visual spec: see visualization-and-simulation.md>

## Practice

Retrieval questions (with answer and why each wrong option is wrong): ...
Exercise (apply/transfer): ...
Spaced review: <which later chapters re-ask which question>

## Sources

<source records: research-and-sources.md>

## Open questions / unverified

...

## Evidence

<gate: command or check → result, date>

## Review findings

<finding → fix or accepted reason>
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

Give the reviewer (a fresh subagent with no authoring context) only: the spec path, the implementation paths, and
`references/verification.md`. Ask for findings by severity with file and line. Don't tell it what you think is fine.
