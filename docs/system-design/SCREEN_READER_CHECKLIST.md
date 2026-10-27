# Screen-reader checklist for /learn

A manual test for a person with a real screen reader. The automated browser suites (`tests/browser/`) check markup,
focus and live-region text; they are **not** a substitute for this. Record each run in the table at the end.

## Set-up

- **macOS:** Safari + VoiceOver (Cmd+F5). Rotor: Ctrl+Option+U. Read next: Ctrl+Option+→.
- **Windows:** Firefox or Chrome + NVDA (free). Browse mode by default; Tab and the arrow keys move between
  controls; Insert+Space toggles focus mode.
- Use the deployed site, or a local production build (`npm run build && npm run start -- -p 3201`).
- Speech rate: normal. Close other tabs that might speak.
- For each item, write **Pass**, **Fail** (with what was heard) or **Not tested**.

## Every chapter page

1. On load, the page title and the `h1` are read; the "Skip to main content" link is the first Tab stop and moves
   focus into the main content.
2. The headings list (rotor or NVDA+F7) shows the chapter's sections in order, with no empty headings; a repeated
   sub-heading (e.g. "Check yourself") sits under a different section each time.
3. Citation marks are read as "Source n: title, section" rather than as bare numbers.
4. "Show the answer" disclosures announce collapsed/expanded, and the answer is read only after opening.
5. The figure is named by its heading ("Fig. 1 · …"); the drawing itself is skipped (it is decorative and
   `aria-hidden`); nothing is read twice.

## /learn/web-request (Fig. 1, "Where the time goes before the first byte")

1. **Recall prompt:** the legend "Recall first" and each checkbox name are read. Before Check or Skip, nothing read
   aloud gives the travel/work split or a percentage.
2. **Check with wrong ticks:** the status message ("Not quite. …") is announced once, without moving focus, and
   names the wrong ticks. **Check with right ticks:** "Right. …" is announced.
3. **Skip, show the labels:** focus stays on the button; it is then announced as dimmed/unavailable.
4. **Visit radios:** arrow keys change the visit; the summary of the new visit is announced once (not once per
   step).
5. **Sliders:** the value is announced with its unit ("40 milliseconds"); each step changes the announced total;
   announcements are not so frequent that they become unusable while holding an arrow key (note the experience).
6. **Steps:** Next/Previous announce "Step n. title. text"; at the last step, Next stays focused and is announced as
   unavailable.
7. **Predict, then run** (sliders untouched, so the server time is the default 50 ms): the prompt (80 ms round
   trip) is read; an empty or negative guess is refused with a message; a guess then Run announces "You guessed …
   the model gives 130 ms …". Before Run, 130 ms is never heard.

## /learn/client-server (Fig. 1, "One exchange, and what each side knows")

1. **Predict first:** the three questions are read as group labels with their choices. The answer options
   themselves (0 / 1 / 2, 201 Created / 409 Conflict / No response) are read as choices; before Check, Skip or Run,
   nothing heard tells you which option is right.
2. **Check with questions open:** "Answer … first" is announced and no answers are read.
3. **Check with all answered, one wrong:** each line is read: "right" with the reason, or "not quite, it is …" with a
   reason for the option picked. **Skip:** focus stays; answers are read.
4. **Controls:** Request and "What goes wrong" are announced as radio groups with their legends; the retry
   checkbox announces its state; Run is a button.
5. **Run:** the summary ("… Client saw …; Reached the server n times; new orders n …") is announced once; focus does
   not jump.
6. **Steps:** each step announces "Step n of m. …". For "POST with an idempotency key", "Response late", retry on:
   the steps are heard in time order (starts → client gives up → retry refused with 409 Conflict → first finishes,
   late) and are understandable without seeing the drawing.
7. **Changing a choice after a run:** the old result disappears and nothing stale is announced.
8. **Run case A / B / C** (after reveal): each runs the case and announces its summary.

## Repetition and timing

- Note any announcement that is read twice, read late (after the next action), or cut off by another.
- Note whether the step announcer and the summary ever speak at the same time in a confusing way.

## Record

| Date | Tester | Screen reader + browser + OS | Page | Result (Pass / Fail / Not tested per item) | Notes |
| ---- | ------ | ---------------------------- | ---- | ------------------------------------------ | ----- |
|      |        |                              |      |                                            |       |
