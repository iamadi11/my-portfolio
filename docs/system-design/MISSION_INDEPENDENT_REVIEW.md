# Independent mission review · 30 October 2026

Read-only forward review after `37293fa`, against the revised educator `SKILL.md`, `references/acceptance.md`, the shared tab contract and the current working implementation. Scope: committed assessments/open responses, URL-selected tabs, API result films, worked comparisons and the load-balancing pilot. This is source/model review, not all-chapter rendered acceptance or a learner study.

## Findings sent to the implementing agent

1. **P2 · Repeated API runs do not restart playback.** Trigger: run an API experiment, let its film finish, then press Run again without changing inputs. `ApiLab` gives the existing `LessonFilm` a new film object but no run key. `useClock` retains its completed time; the `autoPlay` effect depends on `restart`, whose dependencies remain unchanged for the same story. The model result is recomputed but its explanatory animation does not replay. Use an explicit run-instance key, as the Academy/pilot lab does. Needs rendered confirmation after repair.

2. **P2 · Open-question commit/reset loses keyboard focus.** Trigger: type reasoning in a foundation question, activate Commit and compare using the keyboard, then reset the response. `Question.tsx` removes the focused button on either transition without transferring focus to the new explanation/reasoning field. A keyboard or screen-reader learner can lose their place, and the newly revealed feedback has no dedicated live/focus announcement. Focus the explanation on commitment and the reasoning input on reset. Needs rendered keyboard confirmation after repair.

3. **P2 · Realtime Explore does not visualize both directions.** Trigger: select the bidirectional requirement in `/learn/realtime`, predict WebSocket and run. The generic API result film generates only a `c → s` beat, despite its value saying `client ↔ server`; the reverse message never occurs. Add a separate server-to-client event from the same stated scenario. The SSE condition should remain server-to-client, with transport/protocol limitations kept explicit. This finding concerns the result film; the authored Learn film is a separate experience.

4. **P2 · Tab history changes bypass Next's URL observer.** Trigger: open a query-selected chapter and change tabs. `ChapterTabs.change` passes `window.history.state` into `replaceState`. Installed Next 15.5.27's `dist/client/components/app-router.js` returns early when supplied state contains its `__NA` marker, skipping `applyUrlFromHistoryPushReplace`; the current location changes but router `useSearchParams` remains stale. The component's own `setTab` hides that discrepancy until a router state change. Passing `null` lets Next preserve its own state while synchronizing the canonical URL and hooks. Verify direct links, changing tabs and subsequent navigation after repair.

These are findings against the reviewed working tree, not a final unresolved-defect count. The parent implementation owns fixes and final disposition; do not treat this document as final acceptance without that disposition.

## Confirmed improvements and executed checks

- Revised skill distinguishes structural, executable, technical and rendered evidence. It requires a demanding pilot and honest remaining per-chapter status. This is materially better than treating route success as educational verification.
- `gradeAssessment` rejects incomplete/out-of-range/noninteger attempts and invalid correct-answer indices; scores a committed snapshot; groups revisits only from missed scenarios; and links to the actual chapter's Explore tab. `Assessment` hides feedback until submission, exposes a scoped score, supports a fresh attempt and labels open reflection self-assessed. No unsupported AI-personalization claim was found in this path.
- RPC deadline film now distinguishes caller observation from remote completion: no lost packet, no remote failed state and no invented zero-effect count in the expired result. Its test samples the actual final model state.
- `MechanismCompare` remounts a chosen A/B film and labels architecture's coupled worker/provider-key changes as a bundle. Companion models have separate film ids. Storage engines now pairs layout with a WAL recovery companion rather than claiming a layout example alone proves crash durability.
- Load-balancing pilot routes replica requests rather than storage shards. It exposes spacing, service time, admission capacity, routing and detected/undetected failure assumptions. Source inspection and the executed bounded tests found no conservation, occupancy, target-selection or finish-time discrepancy. The trace table makes per-request decisions inspectable without motion. Health detection and missing recovery/retry are declared simplifications.

Command executed:

```sh
npm test -- --reporter=dot src/lib/learn/assessment.test.ts src/lib/learn/api-experiment-film.test.ts src/lib/learn/load-balancing.test.ts src/lib/learn/anatomy-refinement.test.ts
```

Result: **20 tests passed in 4 files**. The load-balancing invariant test checks 9,216 finite combinations of request count, spacing, service time, capacity, policy and health condition. Passing those tests does not demonstrate UX, timing readability, rendering performance or the correctness of every other mechanism. This subtask did not drive a browser, inspect every chapter, perform full accessibility testing or verify new learning effectiveness with students.

Related portfolio subtask: [portfolio-mission-review.md](../portfolio-mission-review.md).
