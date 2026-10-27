# References and methods

Why the `system-design-educator` skill works the way it does. Recorded 2026-10-27, when the skill was created. This is
background; the rules themselves live in the skill.

## How the research was done (and its limits)

- **Read in full:** the three reference repositories (cloned read-only and treated as untrusted data; no code run),
  the vendored `dimensional-drawing` skills, and two official skill-authoring pages fetched directly:
  [Claude Code skills](https://code.claude.com/docs/en/skills) (the first ~100k of ~118k characters) and
  [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
- **Search results only (`via: search`):** every learning-science paper below. The authoring container could not
  open most publisher sites. Claims rest on abstracts and summaries in search results, not on the papers' full text.
  Strength ratings in the skill are judgements on that basis.
- Nothing here was evaluated with real learners.

## Reference repositories

| Repo | Licence | Taken (as method, no code or text copied) |
| --- | --- | --- |
| Anatomy (`SKILL.md`, `references/`, `scripts/`, `evals/`) | MIT | Truth-first model module drives every readout and motion; map a concept onto a recognisable object; card frame with title, hint and live readout; a sized workflow ending in critic-style verification (zoomed screenshots, scripted audits); a lean SKILL.md with topic reference files. |
| Breakscale (`src/sim/*`, README "How the simulation works") | MIT | Discrete-event simulation with finite slots and a real FIFO queue; gamma-distributed service times; timed-out work keeps burning capacity; percentiles measured from completed requests; deterministic seeds; invariant tests (conservation, failure breakdown sums, utilisation bounds, no NaN/∞). |
| System Design Primer | CC BY 4.0 | Topic coverage checklist (performance vs scalability, latency vs throughput, CAP, consistency and availability patterns, DNS, CDN, load balancer, reverse proxy, application layer, databases, cache, asynchronism) and case-study list; credit when it informs a chapter; no passages reused. |
| dimensional-drawing (vendored in `.claude/skills/`) | MIT | Monochrome, variables instead of invented numbers, never invent values; motion as a pure function of time, strokes before fills, one thing leads. |

## Skill design

From the official pages:

- Frontmatter has `name` (lowercase, digits, hyphens, ≤ 64 characters) and `description` (≤ 1,024 characters, third
  person, what it does plus when to use it). `argument-hint` is optional.
- SKILL.md is a navigation layer under 500 lines, with references one level deep. Reference files over 100 lines get
  a table of contents.
- Workflows are checklists, there are validation loops, and deterministic checks live in scripts.

Applied here:

- SKILL.md holds the modes and gates.
- Seven reference files are each loaded only by the step that needs them.
- `scripts/course.mjs` validates the graph, picks the next chapter and validates the skill itself.

## Learning science

**Access levels.** *Original inspected* means the paper was read. *Secondary inspected* means a reliable explanation
was read in full. *Snippet only* means only search-result titles, abstracts or summaries were seen.

**Every row below is snippet only.** No original or secondary explanation was inspected. On 2026-10-27 and again on
2026-10-28, direct fetches failed with DNS errors. That covered author PDFs (evullab.org, psychology.ecu.edu,
uky.edu), arXiv, PubMed, Wikipedia and MIT Open Learning.

The "reported strength" column repeats what those snippets claim. It is provisional and is no guarantee for any
given learner or topic. Upgrade a row only after reading the source, and say which level it reached.

| Principle | Sources | Access | Reported strength (provisional) |
| --- | --- | --- | --- |
| Retrieval practice | Roediger & Karpicke 2006, *Psychological Science* 17(3) 249–255. Dunlosky et al. 2013, *PSPI* 14(1) 4–58 | Snippet only | Strong |
| Spacing | Cepeda, Pashler, Vul, Wixted & Rohrer 2006, *Psychological Bulletin* 132(3) 354–380. Dunlosky 2013 | Snippet only | Strong |
| Worked examples and fading | Sweller (cognitive load theory). Renkl and colleagues on fading | Snippet only | Moderate–strong, for novices |
| Expertise reversal | Kalyuga, Ayres, Chandler & Sweller 2003 | Snippet only | Moderate–strong |
| Self-explanation and elaborative interrogation | Dunlosky 2013 | Snippet only | Moderate |
| Interleaving | Rohrer & Taylor 2007, *Instructional Science* 35. A later meta-analysis reports a small, variable effect | Snippet only | Moderate, mixed |
| Multimedia (coherence, signaling, segmenting, pre-training) | Mayer's principles (count varies by edition) | Snippet only | Moderate–strong |
| Feedback | Hattie & Timperley 2007, *RER* 77(1) 81–112. Effects are variable and can be negative | Snippet only | Strong that it matters |
| Engagement with visualizations | Hundhausen, Douglas & Stasko 2002 (JVLC, meta-study of 24 studies). Naps et al. 2002 engagement taxonomy (ITiCSE WG) | Snippet only | Moderate |
| Implicit scaffolding in simulations | PhET: Podolefsky, Perkins, Adams; Moore, Herzog & Perkins 2013 | Snippet only | Moderate (physics and chemistry settings) |
| Desirable difficulties | Bjork 1994 | Snippet only | Moderate (umbrella term) |
| **Rejected:** learning-styles matching | Pashler, McDaniel, Rohrer & Bjork 2008, *PSPI* 9(3) 105–119 | Snippet only | No adequate evidence (as reported) |

## Validation and dry run (2026-10-27)

**Skill self-check.** `course.mjs skill` passes. Planted errors were each caught:

- a bad name
- a missing "Use when"
- a broken link
- an unlinked reference file
- a nested reference link

**Graph checks.** `course.mjs check` and `next` were run on fixture curricula, and each case behaved as specified:

- a fresh graph
- an in-progress chapter
- a missing chapter file
- a cycle
- an unknown prerequisite or status
- a non-kebab id
- a duplicate order
- an orphan chapter file
- resuming from COURSE_STATE
- `Product: none`
- all chapters authored

**Dry run: "What happens when you open a website?"** This was a workflow audit only; the chapter was not authored.

1. **Entry.** A fresh repo has COURSE_STATE "not initialized", so mode A runs first even when the chapter is named.
   This is correct.
2. **Boundary.** The topic spans DNS, TCP, TLS, HTTP, caching, CDN and rendering. That conflicted with "one
   mechanism per chapter". *Fixed:* added "map chapters" (journey as the mechanism, each part deferred with a link).
3. **Research.** The likely sources are RFC 1034/1035, 9293, 8446 and 9110, and the HTML spec and MDN for
   rendering. In this container they are reachable only via search, so they would be recorded `via: search`. That
   left a chapter able to reach `verified` on unread sources. *Fixed:* the rubric forbids claims resting only on
   `via: search`. (Tightened on 2026-10-28: the rule now applies from `implemented`, and `check` enforces it.)
4. **Teaching and visual.** The 14 questions fit: the naive answer "the browser downloads the page" breaks on
   "why is the first visit slow?". The medium is a stepper, not 3D.
5. **Implementation.** No product exists, so the chapter caps at `authored`. That made `next` return the same
   chapter forever. *Fixed:* added the `Product:` line in CURRICULUM.md, where `authored` counts as done while it
   is `none`. Also *fixed:* the independent review still runs as a spec review before product exists.
6. **State.** The spec goes to `chapters/web-request.md`. `check` enforces that the file exists from `researched`
   onwards, and "Current unit" resumes an interrupted session.

## Hardening and independent tests (2026-10-28)

**Adversarial audit.** It found these defects, all fixed:

- An empty or mistyped "Current unit" was silently ignored, and `next` gave the wrong answer on an empty graph.
- No gate's evidence was checked by the script. A chapter could be `tested` with a failed check or `verified` with
  an open finding.
- Search-only sources could support claims shown to learners.
- No mode built the product, and mode A invited architecture before any chapter existed.
- There was no way to check a named chapter id or its prerequisites.
- Malformed rows passed.
- The documented test command (`node --test <dir>/`) failed on Node 22.

**Regression suite.** `scripts/course.test.mjs` (`node:test`, no dependencies, temp fixtures) has 21 cases, and all
pass on Node 22.22. Mutation check: of 8 deliberate breaks to `course.mjs`, 7 were caught. The 8th removed the
prerequisite filter in rule 3 of `next`. That filter is unreachable in a valid graph, because prerequisites have a
lower order and are picked first.

**Fresh agents.** Three general-purpose subagents ran with no authoring history, on copies of the skill in a
disposable worktree and fixture folders. The real `docs/system-design` was checked unchanged afterwards. All three
ran the same model as the author; no other model was tested.

1. **Mode A cold start** on the real app (`next` on an uninitialized course). It correctly ran mode A, created no
   app code, and labelled placement and budgets as proposals. Its findings led to these fixes:
   - `next` now routes an uninitialized course to mode A.
   - Mode A now adopts the host's existing gates as budgets.
   - The COURSE_STATE format gained proposal lines and an exact empty-graph header.
   - The report states the requested mode and the mode actually run.
2. **A malformed, cyclic graph, and an interrupted chapter with search-only sources (no network).**
   - The graph failure was reported, but the agent then repaired the cycle and an id inside mode C. *Fixed:* mode C
     now hands graph errors to mode B and changes nothing.
   - The interrupted chapter resumed. The agent found earlier steps incomplete and honestly lowered the status.
     *Fixed:* "complete" and "blocked" are now defined, along with resuming back to an earlier step and lowering a
     status in mode C. Status was also removed from the spec header (it had two homes).
3. **A failing model test and a missing browser**, plus an audit of a chapter marked `tested` on a "pass — browser
   unavailable" line.
   - The agent ran the real test, saw it fail, fixed the model, and kept the chapter below `tested` because the
     browser checks could not run.
   - The audit lowered the dishonest chapter.
   - *Fixed:* `check` now rejects a "pass" line that admits it was skipped, unavailable or failed.
   - *Fixed:* `check` now requires the content parts each gate owns (Boundary, Explanation, Visual, Practice; no
     placeholders). Run on the agent's final fixture, it flagged the unsupported `verified` prerequisite the agent
     had found by hand.
   - Also fixed: `n/a` vs `not run`, a format for mode D audit findings, scope when another chapter is wrong,
     re-runs while blocked, and derived claims.

**Other checks.**

- `course.mjs skill` passes.
- Prettier passes on the skill and docs.
- ESLint on the two scripts with `--no-ignore` (the project ignores `.claude/`) reports 0 errors and 20 warnings:
  19 `no-console` (expected in a CLI) and 1 `no-use-before-define` (a hoisted function). The project lint scope is
  unchanged.

## Known limitations

- The fresh-agent tests used one model. Haiku- and Sonnet-class runs, which the best-practices page recommends, were
  not done.
- The agents ran the skill as it stood before the fixes their own findings caused. The final skill was checked by
  the regression suite and by re-running `check` on their end states, not by new agent runs.
- The learning-science papers were not read in any form beyond search snippets (see above).
- The chapter-length target (15–30 minutes) is a hypothesis to test with real readers.
- `course.mjs` checks structure: that evidence is written down, consistent and non-placeholder. Whether the content
  is correct and teaches well rests on the rubric and the independent review.
- No real chapter has been authored with the skill, and modes B and D have not run on a real course.
