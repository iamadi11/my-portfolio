# Source of truth — Aditya Raj portfolio

**Last reviewed:** 2026-10-19 (owner: the live site is the correct state)  
**Canonical data:** `src/content/site.ts` (`SITE`). The owner confirmed on 2026-10-19 that the site's data is more current than the resume PDF: it already merges the resume, the LinkedIn export (2026-10-17), GitHub and the owner's own word. This file mirrors it.  
**Source PDF:** `Aditya_Raj_SDE.pdf` (June 2026; git-ignored, older than the site).  
**Hierarchy (strict):** `src/content/site.ts` → resume → LinkedIn → GitHub. A new fact enters `site.ts` only from the owner, the resume, LinkedIn or GitHub; never invent one.

---

## Identity

| Field    | Value (resume)                                                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name     | Aditya Raj                                                                                                                                                                                                                           |
| Location | Bengaluru, Karnataka, India                                                                                                                                                                                                          |
| Title    | Senior Software Development Engineer at **Amby Tech** (https://ambytech.com/) since 9 Jul 2026 (owner, 2026-10-17; confirmed as live on the site 2026-10-19). Previous: Frontend Engineer II, Cashfree Payments, Mar 2025 – May 2026 |
| Email    | adityaraj92.20@gmail.com                                                                                                                                                                                                             |
| Phone    | +91 72578 07070 → `tel:+917257807070`                                                                                                                                                                                                |
| LinkedIn | https://www.linkedin.com/in/adityaraj11/                                                                                                                                                                                             |
| GitHub   | https://github.com/iamadi11                                                                                                                                                                                                          |

**Tagline (LinkedIn summary, shortened for UI; owner approved "5+ years" on 2026-10-17, counting o9 Solutions from Jun 2021):** 5+ years building fast, scalable web products for fintech and e-commerce: React, Next.js and Node.js at Tata 1mg and Cashfree, including a self-serve fraud rule engine used by 200+ merchants.

---

## Target audience

1. Recruiters and hiring managers (screen in &lt;10s)
2. Engineering leads (credibility + depth)
3. Freelance / contract clients (proof + contact)

---

## Required sections (this repo)

`/` is one page, a drawing set of six sheets (see `docs/blueprint.md`):

1. Title block: identity, statement, primary CTA to email / GitHub / LinkedIn
2. Measured results: `practice.impact`
3. Assemblies: projects, **only** repos or work with a real GitHub URL (or resume-cited deliverable)
4. Revision history: work history (resume-aligned) and education
5. Variables: skills that are resume-backed and/or GitHub-evidenced
6. Contact: resume email, phone, LinkedIn, GitHub

---

## Tone rules

- No filler adjectives (“passionate”, “rockstar”, “synergy”).
- No unverifiable superlatives.
- Prefer outcomes + scope + stack over buzzwords.
- Every claim traceable to resume, LinkedIn, or GitHub.

---

## Tech stack (validated)

**Resume (explicit, from Aditya_Raj_SDE.pdf):**

- Languages: JavaScript (ES2022+), TypeScript
- Frontend: React, Next.js, Zustand, React Query, Tailwind CSS, Radix UI, PWA, Storybook, Micro-frontends
- Performance: Webpack 5, Code Splitting, Tree Shaking, Core Web Vitals, Lighthouse, Service Workers
- Backend & Infra: Python, Node.js, Express.js, Redis, SSE, WebPush, PostgreSQL, Turborepo, Docker
- Testing & Tooling: Jest, React Testing Library, Playwright, Git, GitHub Actions, Figma, pnpm workspaces

**GitHub (proof of stack / activity):** Public repos include e.g. `my-portfolio` (this site), `mouse-follow`, `Oompa-Loompas`, `spatial`, `AIUI`, profile README `iamadi11/iamadi11`, etc. Use languages/topics from the repo, not invented labels.

---

## Folder structure

```
my-portfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx              # / : the drawing set (see docs/blueprint.md)
│   │   ├── layout.tsx            # Root layout: metadata, JSON-LD, Arimo font, `.js` flag
│   │   ├── manifest.ts           # PWA manifest
│   │   ├── opengraph-image.tsx, robots.ts, sitemap.ts, llms.txt/route.ts
│   │   └── error.tsx, not-found.tsx, globals.css (tokens + drawing classes)
│   ├── content/
│   │   ├── site.ts               # SITE: every fact on the site (canonical)
│   │   └── types.ts              # SiteContent types + SAMPLE
│   ├── components/blueprint/     # pen.tsx, scene.tsx, drive.ts, Driver.tsx, sheets.ts, sections/*
│   └── lib/                      # site origin helpers
├── public/                       # icons, sw.js (offline)
├── docs/blueprint.md             # Spec for /
├── SOURCE_OF_TRUTH.md            # This file
└── CLAUDE.md                     # AI rules
```

## Portfolio project tech stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router)                                         |
| UI library | React 19                                                        |
| Language   | TypeScript 5 (strict)                                           |
| Styling    | Tailwind CSS 3 + one plain CSS file per sheet                   |
| Drawing    | Server-rendered SVG (`blueprint/pen.tsx`)                       |
| Type       | Arimo (caps lettering)                                          |
| Animation  | `blueprint/drive.ts`: scroll → scene time, no animation library |
| PWA        | `manifest.ts` + `public/sw.js`                                  |
| Utility    | clsx                                                            |
| Linting    | ESLint 9 + eslint-config-next + eslint-plugin-prettier          |
| Formatting | Prettier 3 with prettier-plugin-tailwindcss                     |
| Git hooks  | commitlint + commitizen + husky + lint-staged                   |
| Deployment | Vercel                                                          |

---

## Content authority rules

1. **Experience, dates, titles, companies:** as in `site.ts` (owner-confirmed 2026-10-19); new entries from the resume, LinkedIn or the owner.
2. **Contact:** resume email/phone unless user explicitly overrides in repo with a documented reason.
3. **Projects:** GitHub URL must exist under `iamadi11/*` (or fork you own with clear attribution). Descriptions from README or neutral factual one-liners—no fabricated metrics.
4. **Skills on the page:** subset of resume + optional GitHub-verified additions only if the same skill appears in repo activity (not resume-only wish lists).

---

## Cached snapshot (2026-10-17: resume + LinkedIn export)

Role-level bullets now come from the LinkedIn export (`Profile.pdf`, 2026-10-17), which is richer than the cached resume; the resume wins where they conflict (decisions recorded below). The site's copy of all of this is `src/content/site.ts`.

### Current role (owner)

- **Senior Software Development Engineer** — Amby Tech — since 9 Jul 2026. No highlights published until the owner provides them.

### Prior roles

- **Frontend Engineer II** — Cashfree Payments — Mar 2025 – May 2026 — Bengaluru. Risk WebApp for 200+ enterprise merchants (millions of transactions per month); schema-driven micro-frontend fraud rule engine configured at runtime (no redeploys); Video KYC session drop-offs −30% (reconnection state machine, exponential backoff); Cashmere design system (Storybook, Figma, CLI scaffolding).
- **Software Engineer** — Moresand Technologies — Aug 2024 – Mar 2025 — Bengaluru. Backbone.js/.NET → React/TypeScript migration with tests and CI (3× delivery); Next.js SSR features with React Query and Node/Express; PWA offline architecture, page load −50% (resume).
- **Software Development Engineer II** — Tata 1mg — Apr 2023 – Jul 2024 — Gurugram. Turborepo monorepo (CI/CD −30%); Node.js PDF microservice replacing 5+ client-side generators (duplication −60%).
- **Software Development Engineer I** — Tata 1mg — Dec 2021 – Mar 2023 — Gurugram. Delivery-area configurator (20+ cities; 15-minute and 1-hour zones); real-time notifications (SLA breaches 70% → 15%); build 15 → 3 min, bundles −60%, Lighthouse > 90; offline warehouse PWA (manual errors −45%).
- **Technical Consultant** — o9 Solutions — Jun 2021 – Dec 2021 — Bengaluru (LinkedIn only; owner approved including it). Client dashboard; SSIS + MySQL data integration.

### Conflicts resolved (owner, 2026-10-17: resume wins)

| Topic           | Resume                             | LinkedIn                       | Used               |
| --------------- | ---------------------------------- | ------------------------------ | ------------------ |
| Cashfree volume | millions of transactions per month | millions of daily transactions | per month          |
| Tata SDE I end  | Mar 2023                           | Apr 2023                       | Mar 2023           |
| Delivery zones  | 15-minute and 1-hour               | 1-hour express, 20+ cities     | both (no conflict) |

### Top skills (resume + GitHub)

- React, Next.js, TypeScript, Node.js, performance, PWA, React Query, Zustand, Turborepo (resume); LinkedIn top skills also list Vite, npm and WebPush.

### Projects (portfolio-safe; descriptions from each README)

- **Eidos** — https://github.com/sweidos/eidos (moved from `iamadi11/eidos`; owner is the main author) — docs https://sweidos.vercel.app — npm `@sweidos/eidos` — "Never lose a write": durable client-mutation queue (IndexedDB replay, idempotency keys).
- **MCP UI studio** — https://github.com/iamadi11/mcp-ui-poc — https://mcp-ui-poc.vercel.app/ — chat turn → versioned, publishable widget.
- **Spatial** — https://github.com/iamadi11/spatial — https://spatial-zeta.vercel.app — real-time UI performance anti-pattern detector.
- **Sidecar** — https://github.com/iamadi11/progressive-image — progressive image loading (binary sidecar per image, runtime targeting < 1 KB).
- **Video Light Sync** — https://github.com/iamadi11/video-light-sync — screen colours → Yeelight/WLED lights via a local Electron hub.
- Not featured (thin or early): mouse-follow, noesis, interview-lab, gpt-ui (SourceLens), stacks, frontend-master, task-management.

### Education

- IIIT Lucknow — B.Tech Information Technology — Aug 2017 – Jun 2021 — CGPA 8.14/10

### Contact links

- Email: adityaraj92.20@gmail.com
- Phone: +91 7257807070
- LinkedIn: https://www.linkedin.com/in/adityaraj11/
- GitHub: https://github.com/iamadi11

### LinkedIn note

- Automated extraction is unreliable (login wall). The owner exports the profile as PDF instead (last: 2026-10-17); re-sync from a fresh export. Resume still wins on conflicts.

---

## Home (/)

`/` is a drawing set (see `docs/blueprint.md`); `/about`, `/tech-stack`, `/contact` and `/v2` redirect to its sheets. Content rules above apply unchanged: every fact on `/` comes from `src/content/site.ts`, and drawing labels only restate it (each project's layers cite the phrase of its summary they come from).

---

## Build filter (every change)

Ship only if:

**(credibility OR first-impression OR conversion)** AND **verified data** AND **simple implementation**.

Otherwise skip.
