---
name: ship
description: Autonomously find and implement the highest-impact portfolio improvement
---

Full lifecycle for one portfolio improvement:

1. Read `SOURCE_OF_TRUTH.md` (cached snapshot — do NOT re-parse `Aditya_SDE_5_years.pdf` unless snapshot is missing)
2. Audit current portfolio vs. snapshot — find all gaps and weaknesses:
    - Missing projects or experiences
    - Outdated or inaccurate copy
    - Sections present in resume but absent from portfolio
    - Lighthouse scores below 90
    - Mobile layout issues at 375px
    - Missing or broken links
    - No resume download link
    - Thin About copy vs. resume summary
3. Rank gaps by impact: **credibility > impression speed > contact conversion**
4. Pick the **single highest-impact gap**
5. Research: is this technically feasible? What is the simplest implementation?
6. Plan: write out scope, approach, and acceptance criteria **before touching code**
7. Implement: one atomic change only — one component or section at a time
8. Validate: open in browser, check mobile at 375px, run Lighthouse if relevant
9. Commit: `feat(portfolio): [what changed] — reflects [resume/LinkedIn source]`
10. Report:
    - What was changed
    - What source (resume bullet / LinkedIn item) it reflects
    - What the next highest-impact gap is

**Build filter (all must pass before shipping):**

1. Improves credibility OR impression speed OR contact conversion
2. Grounded in `Aditya_SDE_5_years.pdf` or LinkedIn
3. Simplest viable implementation
