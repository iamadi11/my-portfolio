# Learning and motion

## Authoring record

Each chapter owns: a concrete question, one outcome, a misconception, the source-supported rule, a worked example, a counterexample, terms needed now, a prediction experiment and a transfer question. Link prerequisites and briefly recall their needed idea. Make distinctions visible before introducing names.

## Animation has to earn its place

Name the state that changes and the component that owns it. Model events generate message endpoints, counts, failure marks and captions. A frozen intermediate frame must be legal. Show an alternative run with one changed input; the picture and verdict must change together. A queue fills and drains, a cache holds an old version, a replica lags, a quorum may fail to form, and a transaction commits or rolls back. A packet circling renamed boxes does not explain these mechanisms.

Use one shared rendering vocabulary, with chapter-specific traces and topology. Visible quantities must be counted or clearly labelled as an abbreviated display. Do not silently cap the diagram at eight objects while claiming it shows fifty. Keep time-to-display scaling explicit. Use close-ups or highlights only to signal the next causal event; avoid idle orbiting and motion that conceals readable labels.

## Teach, then fade the help

Learn: question → worked mechanism → failure/limit → takeaway. Lab: choose an input → commit a prediction → run → compare and explain. Quiz: a new scenario or a changed assumption; require commitment before feedback. Mix correct-answer positions. A final case asks for a defended design, not a memorized architecture.

On later chapters, recall a prerequisite rather than reprinting its whole explanation. Offer a short “explain this without the diagram” prompt. Spaced review should cross earlier mechanisms; progress is “viewed / practiced / recall checked”, never inferred mastery or intelligence. Store only optional device-local learning state.

## Player and accessibility

Respect reduced motion on mount and when it changes. Provide explicit step mode, not a mandatory animation. Pause when hidden, offscreen or inactive. Avoid React reconstruction of static geometry on every frame. A seek is deterministic; hidden time cannot advance outcomes. Every scene has a textual state summary and transcript, and counters use units.

## Release proof

Run model invariants, per-chapter coverage/source checks, falsifiable prediction cases, keyboard/seek/reset tests, mobile/dark/step mode, and independent teaching review of each mechanism family. Cases require a reviewer to challenge a requirement or failure assumption. Report coverage separately from correctness confidence. Treat build success and animation polish as insufficient proof of learning.

## Evidence boundary

These are engineering and instructional design criteria. They do not establish that this course improves learning outcomes; that needs learner testing. Existing learning-science.md records which research was actually inspected. Do not convert snippet-only citations into empirical promises.

## Regression lessons from the full-course review

- Review question → rule → state-machine correspondence. Foreign keys need referenced-row validation; inverted indexes need postings; object publication needs incomplete-upload behavior; canaries need traffic cohorts. A related-sounding model is insufficient.
- Fan-out delivers to independent destinations; coalescing shares identical reusable work. Never collapse those contracts.
- Every frozen frame must respect transaction boundaries. Stage first, commit grouped state together; avoid a visible committed-row/missing-outbox intermediate.
- A refusal, application failure or delayed replica is not packet loss. Only a genuinely lost message receives a loss marker.
- Manual stepping changes the actual clock to a settled event frame. Resuming Play must continue from that frame without rewinding committed state.
- A case walkthrough must show real request/data paths and concrete component fault states. Do not send “failure scenario” or “tradeoff” packets as if narration were a protocol.
- Distinguish users, requests, event time, processing time and watermark progress in controls and quantity labels.

- A mode is not an outcome. Derive the outcome from state (valid reference + either constraint policy → accepted). Test agreement between verdict, counts and narration at input boundaries.
- Map broad objectives to separate visible mechanisms: relational joins/set operations, B-tree/LSM layout, HTTP conditional validation, prepared-transaction uncertainty and UUID version bits each need their own events. Reuse an enclosure, never substitute its drawing for these mechanisms.
- Static Play holds each event for the same declared reading duration divided by speed. An accessibility mode must not flash long captions at a fixed 900 ms interval.
