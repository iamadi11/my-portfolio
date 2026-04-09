# CLAUDE.md — Portfolio AI Rules

## 0. AUTHORITY

`SOURCE_OF_TRUTH.md` is the decision authority for all content and architecture decisions.
`Aditya_SDE_5_years.pdf` + LinkedIn profile win for all content. **Never invent** experience, skills, or achievements.

---

## 1. MANDATORY WORKFLOW

Every change must follow:

1. **RESEARCH** → read `SOURCE_OF_TRUTH.md`; use cached snapshot — do NOT re-parse `Aditya_SDE_5_years.pdf` unless snapshot is missing or explicitly outdated; verify claim exists in resume/LinkedIn
2. **PLAN** → scope, approach, acceptance criteria (write these out before touching code)
3. **IMPLEMENT** → small atomic changes only; one section/component at a time
4. **VALIDATE** → real browser check; Lighthouse if performance-relevant
5. **COMMIT** → message must reference what resume/LinkedIn data it reflects

---

## 2. BUILD FILTER (all must be true)

1. Improves **credibility** OR **impression speed** OR **contact conversion**
2. **Grounded** in `Aditya_SDE_5_years.pdf` or LinkedIn data — traceable to a specific fact
3. **Simplest viable implementation** — no speculative abstractions, no future-proofing

→ If any fail: reject or redesign.

---

## 3. UX RULES

- Above the fold must answer "who is this and why should I care" in **<5 seconds**
- **Mobile-first**; test at 375px and 1280px
- **WCAG 2.2 Level AA** on all pages
- Perceived response <100ms — use static/SSG where possible
- Lighthouse scores: **Performance ≥90, Accessibility ≥90, Best Practices ≥90, SEO ≥90**
- **No lorem ipsum, no placeholder copy, no generic filler** — ever

---

## 4. RELEASE GATES (all must pass before commit)

1. TypeScript typecheck passes (`npx tsc --noEmit`)
2. ESLint + Prettier pass (`npm run lint`)
3. Real browser validation done
4. All copy traceable to `Aditya_SDE_5_years.pdf` or LinkedIn
5. Lighthouse ≥90 on performance + accessibility (or deviation recorded with justification)

---

## 5. ANTI-PATTERNS (FORBIDDEN)

- Inventing experience, skills, or achievements not in resume/LinkedIn
- Adding sections not grounded in actual data
- Generic buzzword copy ("passionate developer", "team player", etc.) without specifics
- Large untested changes — keep changes small and atomic
- Re-reading `Aditya_SDE_5_years.pdf` on every task — use cached snapshot in `SOURCE_OF_TRUTH.md`
- Breaking mobile layout
- Committing without a real browser check
- Placeholder projects — every project card must have a real GitHub URL under `iamadi11/*`

---

## 6. AUTONOMY

Proceed without asking. Only escalate when:

1. Content cannot be found in `Aditya_SDE_5_years.pdf` or LinkedIn
2. A design decision has no clear answer from the build filter
3. A breaking change affects core pages

---

## 7. PRIORITY ORDER (when conflicts arise)

1. **Accuracy** (content matches resume/LinkedIn)
2. **Recruiter impression speed**
3. **Accessibility**
4. **Visual polish**
5. **Developer ergonomics**

---

## 8. COMMIT FORMAT

```
feat(portfolio): [what changed] — reflects [resume/LinkedIn source]
```

Examples:

- `feat(portfolio): add resume download CTA to hero — reflects resume header`
- `fix(portfolio): correct Tata 1mg date range — aligns with resume experience`
- `sync: align portfolio with latest resume/LinkedIn data`

---

## 9. SKILLS

- `/ship` — find and implement the single highest-impact portfolio improvement
- `/sync-resume` — diff portfolio against resume + LinkedIn, fix all gaps one by one
