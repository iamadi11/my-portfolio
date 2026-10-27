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
   left a chapter able to reach `verified` on unread sources. *Fixed:* the `verified` gate and the rubric now
   forbid claims resting only on `via: search`.
4. **Teaching and visual.** The 14 questions fit: the naive answer "the browser downloads the page" breaks on
   "why is the first visit slow?". The medium is a stepper, not 3D.
5. **Implementation.** No product exists, so the chapter caps at `authored`. That made `next` return the same
   chapter forever. *Fixed:* added the `Product:` line in CURRICULUM.md, where `authored` counts as done while it
   is `none`. Also *fixed:* the independent review still runs as a spec review before product exists.
6. **State.** The spec goes to `chapters/web-request.md`. `check` enforces that the file exists from `researched`
   onwards, and "Current unit" resumes an interrupted session.

## Known limitations

- The skill was not evaluated with fresh agents on multiple models. The best-practices page recommends this.
- The learning-science papers were not read in full (see above).
- The "15–30 minutes per chapter" sizing is an assumption.
- `course.mjs` checks structure, not quality. Quality rests on the rubric and the independent review.
