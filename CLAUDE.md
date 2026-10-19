# CLAUDE.md — Portfolio AI Rules

## 0. AUTHORITY

`SOURCE_OF_TRUTH.md` is the decision authority for all content and architecture decisions.
`src/content/site.ts` holds the canonical data (owner-confirmed 2026-10-19: the live site is more current than the resume PDF); `SOURCE_OF_TRUTH.md` mirrors it. New facts come only from the owner, the resume (`Aditya_Raj_SDE.pdf`), LinkedIn or GitHub. **Never invent** experience, skills, or achievements.

---

## 1. MANDATORY WORKFLOW

Every change must follow:

1. **RESEARCH** → read `SOURCE_OF_TRUTH.md`; use `src/content/site.ts` and the cached snapshot — do NOT re-parse the resume PDF unless explicitly outdated; verify any new claim exists in `site.ts`, resume, LinkedIn or GitHub
2. **PLAN** → scope, approach, acceptance criteria (write these out before touching code)
3. **IMPLEMENT** → small atomic changes only; one section/component at a time
4. **VALIDATE** → real browser check; Lighthouse if performance-relevant
5. **COMMIT** → message must reference what resume/LinkedIn data it reflects

---

## 2. BUILD FILTER (all must be true)

1. Improves **credibility** OR **impression speed** OR **contact conversion**
2. **Grounded** in `src/content/site.ts` (or resume/LinkedIn/GitHub for new facts) — traceable to a specific fact
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
4. All copy traceable to `src/content/site.ts` (resume/LinkedIn/GitHub/owner)
5. Lighthouse ≥90 on performance + accessibility (or deviation recorded with justification)

---

## 5. ANTI-PATTERNS (FORBIDDEN)

- Inventing experience, skills, or achievements not in resume/LinkedIn
- Adding sections not grounded in actual data
- Generic buzzword copy ("passionate developer", "team player", etc.) without specifics
- Large untested changes — keep changes small and atomic
- Re-reading the resume PDF on every task — use `src/content/site.ts` and `SOURCE_OF_TRUTH.md`
- Breaking mobile layout
- Committing without a real browser check
- Placeholder projects — every project card must have a real GitHub URL under `iamadi11/*`

---

## 6. AUTONOMY

Proceed without asking. Only escalate when:

1. Content cannot be found in `site.ts`, resume, LinkedIn or GitHub
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
- `/portfolio-craft` — heavily animated 3D portfolio pass (multi-agent full pass or focused pass); canonical files in `.cursor/skills/portfolio-craft/`, linked from `.claude/skills/portfolio-craft`

---

## 10. HOME (/) RULES

`/` is **Round trip**: scrolling flies an alien ship (three.js) from orbit down to Earth at night: a city, then one endless landscape per project (each ending in a portal in the project's colour), the sea and the pole (one light pillar per record: roles, then education), with a film-style jump between places, ending back in orbit at sunrise for `200 OK`. Spec, assets and licences: `docs/round-trip.md`. `/v2` redirects to `/`.

1. **Content:** all copy for `/` lives in `src/content/site.ts` (`SITE`; types and `SAMPLE` in `src/content/types.ts`). Same truth rules as §0. Optional fields are dropped from the page when empty; never fill them to fill a layout.
2. **Layout:** `src/components/round-trip/*`: `trip.ts` reshapes `SITE`, `drive.ts` runs the page (scroll, panels, HUD, tilt), `world/*` is the three.js scene. Models and textures in `public/models` and `public/env` are rebuilt by `scripts/assets.sh` from git-ignored `assets-src/`; keep the credits line on the `200 OK` panel in step with them.
3. **Performance gates:** three.js and the world are fetched on idle but built only on Start or scroll (a CSS poster stands in before); first-load JS for `/` stays ≤ 120 kB; no layout shift (panels stack items in one grid cell; the world is a fixed canvas).
4. **Sound:** nothing plays before Sound is switched on. Tilt on iOS starts only from the Tilt button.
