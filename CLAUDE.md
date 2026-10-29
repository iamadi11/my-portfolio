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
- Placeholder projects — every project card must have a real GitHub URL under `iamadi11/*` (one documented exception: Eidos lives at `sweidos/eidos`, an org repo the owner authored — see `SOURCE_OF_TRUTH.md`)

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

`/` is a **drawing set**: six sheets (title block, measured results, assemblies, revision history, variables, contact) drawn the way Apple's accessory dimensional drawings are, following the house rules of `enesozturk/dimensional-drawing` (MIT, vendored as the `dimensional-drawing` and `dimensional-drawing-motion` skills in `.claude/skills/`). Scrolling moves a pen: lines draw themselves, dimensions follow the geometry they measure, project layers lift into exploded views, a camera pulls back. Spec: `docs/blueprint.md`. `/about`, `/tech-stack`, `/contact` and `/v2` redirect to `/` (anchors).

1. **Content:** all copy for `/` lives in `src/content/site.ts` (`SITE`; types and `SAMPLE` in `src/content/types.ts`). Same truth rules as §0. Drawing labels only restate SITE (each project layer cites the summary phrase it comes from). Optional fields are dropped from the page when empty; never fill them to fill a layout.
2. **Look:** monochrome only: black line on white paper, grays only, no accent colour. Things are told apart by line weight, dash, hatch and gray fill. Arimo caps lettering; sheet titles are drawn by the pen in the single-stroke Hershey Simplex font (`lettering.tsx`). Real content is HTML; SVG drawings are `aria-hidden` decoration.
3. **Layout:** `src/components/blueprint/`: `pen.tsx` (drawing kit, server-rendered SVG with time windows), `scene.tsx` (`Scene`, `SheetFrame`, `win`), `lettering.tsx`, `xref.ts`, `drive.ts` (the only runtime JS: scroll → scene time, pure function of time), `sheets.ts`, `sections/*` (one file + CSS per sheet).
4. **Performance gates:** sections are server components; no animation library; first-load JS for `/` stays ≤ 120 kB; animate only opacity, transform and stroke-dashoffset; no layout shift (pinned stages are fixed-height sticky boxes).
5. **Devices:** must work at iPhone mini (375×812), iPhone 16 Pro (402×874), tablet (768×1024), 1280×800, 1440×900 and 1920×1080, with no horizontal scroll. Respect safe areas (`viewport-fit=cover`).
6. **PWA:** installable (`src/app/manifest.ts`, icons in `public/`) and offline-capable (`public/sw.js`: network-first page, cache-first build files). Bump `VERSION` in `sw.js` when its caching rules change.
7. **Motion:** reduced motion shows every sheet finished, with no scroll-linked animation.
8. **Backend:** Redis-backed features (Eidos contact form, live readers) render only when Redis env vars exist (`src/lib/redis.ts`); see `docs/blueprint.md` → Backend. Never store raw IPs or personal data beyond the message a visitor chooses to send.

---

## 11. SYSTEM DESIGN COURSE

A system design course (zero → advanced) lives at `/learn`. It teaches general engineering, so §0's "facts about the owner come from `site.ts`" does not apply to its content.

1. **Only through the skill:** all course work (initialize, curriculum, next chapter, chapter audit) goes through `.claude/skills/system-design-educator` (`/system-design-educator [init | curriculum | next | chapter <id> | audit <id>]`), coherent batches when requested; follow the skill’s compact production workflow.
2. **State:** `docs/system-design/COURSE_STATE.md` (where it is, what's next) and `docs/system-design/CURRICULUM.md` (learning graph; the only place chapter status lives). Read them first, update them last.
3. **Truth:** every technical claim traces to a recorded source (primary first) with honest `via: read | search`; example numbers are labelled assumptions; simulations are labelled teaching models and every number they show comes from tested model state.
4. **Look and performance:** the drawing-set language of `/` (monochrome; states by line/fill + text, never colour), course-only light/dark/system themes and readable sentence-case type, WCAG 2.2 AA, reduced motion, and `/` must stay unaffected; budgets are set in mode A and recorded in `COURSE_STATE.md`.
