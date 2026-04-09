---
name: sync-resume
description: Diff portfolio against Aditya_SDE_5_years.pdf and LinkedIn, then fix gaps one by one
---

1. Read `Aditya_SDE_5_years.pdf` using the Read tool (Claude Code supports PDF natively)
2. Fetch `https://www.linkedin.com/in/adityaraj11/` and extract: headline, about, experience, skills, projects, education
3. Compare against cached snapshot in `SOURCE_OF_TRUTH.md`:
    - If resume has changed: update the cached snapshot section before proceeding
    - `Aditya_SDE_5_years.pdf` wins all conflicts with LinkedIn
4. Audit every section of the portfolio against the updated snapshot:
    - **Projects:** all significant projects present? descriptions accurate and sourced from README/repo?
    - **Skills:** all key skills listed? none invented? missing any from resume?
    - **Experience:** all 3 roles represented? dates correct? bullets match resume?
    - **Education:** IIIT Lucknow present, dates correct, CGPA accurate?
    - **Contact:** email, phone, LinkedIn, GitHub — all correct and clickable?
    - **Hero:** title, tagline, and summary match resume?
    - **Resume download link:** present?
5. Output a prioritized gap list (ranked by recruiter impact)
6. Fix gaps **one by one**, validating each in browser before moving to the next
7. Final commit: `sync: align portfolio with latest resume/LinkedIn data`

**Rules:**

- Never invent content — if it's not in resume or LinkedIn, don't add it
- Fix only what is wrong; don't refactor working code
- Keep each fix atomic — one gap = one commit
