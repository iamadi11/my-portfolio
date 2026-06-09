# Source of truth — Aditya Raj portfolio

**Last reviewed:** 2026-06-09  
**Source PDF:** `Aditya_Raj_SDE.pdf` (updated June 2026)  
**Hierarchy (strict):** `Aditya_Raj_SDE.pdf` → LinkedIn → GitHub. On conflict, **resume wins**.

---

## Identity

| Field    | Value (resume)                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Name     | Aditya Raj                                                                                                      |
| Location | Bengaluru, Karnataka, India                                                                                     |
| Title    | Frontend Engineer II (most recent role; Cashfree Payments Mar 2025 – May 2026; currently open to opportunities) |
| Email    | adityaraj92.20@gmail.com                                                                                        |
| Phone    | +91 72578 07070 → `tel:+917257807070`                                                                           |
| LinkedIn | https://www.linkedin.com/in/adityaraj11/                                                                        |
| GitHub   | https://github.com/iamadi11                                                                                     |

**Tagline (resume summary, shortened for UI):** Frontend engineer with ~4.5+ years building scalable web apps in fintech, e-commerce, and enterprise; strong React / Next.js / TypeScript; performance and production systems focus.

---

## Target audience

1. Recruiters and hiring managers (screen in &lt;10s)
2. Engineering leads (credibility + depth)
3. Freelance / contract clients (proof + contact)

---

## Required sections (this repo)

- Home: identity, primary CTA to contact / GitHub
- About: summary aligned to resume, work history, education
- Tech: skills that are resume-backed and/or GitHub-evidenced
- Projects: **only** repos or work with a real GitHub URL (or resume-cited deliverable)
- Contact: resume email, phone, LinkedIn, GitHub

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
│   │   ├── page.tsx              # Home: DetailsCard + ProjectsCard + TechStackCard
│   │   ├── about/page.tsx        # About: Description + WorkExperience + Education
│   │   ├── tech-stack/page.tsx   # Tech: TechStackCard (standalone h1)
│   │   ├── contact/page.tsx      # Contact: email, phone, LinkedIn, GitHub
│   │   ├── layout.tsx            # Root layout: metadata, JSON-LD, fonts
│   │   ├── globals.css
│   │   ├── manifest.ts
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   └── llms.txt/route.ts
│   ├── components/
│   │   ├── Card/                 # Base card primitive
│   │   ├── DetailsCard/          # Hero section (name, title, tagline, CTAs)
│   │   ├── Description/          # About intro paragraph
│   │   ├── Education/            # Education card
│   │   ├── Header/               # Top nav (data-driven tree renderer)
│   │   ├── Layout/               # Page layout wrapper
│   │   ├── ProjectsCard/         # GitHub projects grid
│   │   ├── SocialLinks/          # Social icon links
│   │   ├── TechStackCard/        # Skills/tech icon grid
│   │   └── WorkExperience/       # Work history timeline
│   └── lib/
│       ├── site.ts               # getSiteOrigin() helper
│       └── site-request-origin.ts
├── public/                       # Static assets (logo, favicons, profile pic)
├── SOURCE_OF_TRUTH.md            # This file
├── CLAUDE.md                     # AI rules
└── Aditya_SDE_5_years.pdf        # Resume (gitignored — contains private contact info)
```

## Portfolio project tech stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js 15 (App Router)                                |
| UI library | React 19                                               |
| Language   | TypeScript 5 (strict)                                  |
| Styling    | Tailwind CSS 3                                         |
| Animation  | Motion (motion/react)                                  |
| Icons      | react-icons 5                                          |
| Utility    | clsx                                                   |
| Linting    | ESLint 9 + eslint-config-next + eslint-plugin-prettier |
| Formatting | Prettier 3 with prettier-plugin-tailwindcss            |
| Git hooks  | commitlint + commitizen + husky + lint-staged          |
| Deployment | Vercel                                                 |

---

## Content authority rules

1. **Experience, dates, titles, companies:** resume only.
2. **Contact:** resume email/phone unless user explicitly overrides in repo with a documented reason.
3. **Projects:** GitHub URL must exist under `iamadi11/*` (or fork you own with clear attribution). Descriptions from README or neutral factual one-liners—no fabricated metrics.
4. **Skills on the page:** subset of resume + optional GitHub-verified additions only if the same skill appears in repo activity (not resume-only wish lists).

---

## Cached snapshot (2026-04-09)

### Most recent role (resume)

- **Frontend Engineer II** — Cashfree Payments — Mar 2025 – May 2026 — Bengaluru _(ended; currently open to new roles)_

### Prior roles (resume)

- **Software Engineer** — Moresand Technologies — Aug 2024 – Mar 2025 — Bengaluru
- **Software Development Engineer II** — Tata 1mg — Apr 2023 – Jul 2024 — Gurugram
- **Software Development Engineer I** — Tata 1mg — Dec 2021 – Mar 2023 — Gurugram

### Top skills (resume + GitHub)

- React, Next.js, TypeScript, Node.js, performance, PWA, React Query, Zustand, Turborepo (resume); repo mix includes TS/JS projects on GitHub.

### Projects (portfolio-safe)

- **mouse-follow** — https://github.com/iamadi11/mouse-follow — demo: https://mouse-follow-demo.vercel.app/ (GitHub description: “Mouse Follow Component”)
- **mcp-ui-poc** — https://github.com/iamadi11/mcp-ui-poc — demo: https://mcp-ui-poc.vercel.app/ — “Dynamic MCP UI Generator”; copy on site from repo README (full-stack MCP UI demo, React + Vite + Node/Express).
- **spatial** — https://github.com/iamadi11/spatial — demo: https://spatial-zeta.vercel.app/ — “Client-Side UI Performance Optimizer”; copy on site from repo README (TypeScript strict, Vitest, dev-time UI performance detection).
- Additional public repos (AIUI, Oompa-Loompas, my-portfolio, …) — add only with short, honest descriptions from repo/README.

### Experience narrative

- Use resume bullets; do not add employers or roles not on the resume (e.g. omit portfolio-only entries that contradict the resume).

### Education (resume)

- IIIT Lucknow — B.Tech Information Technology — Aug 2017 – Jun 2021 — CGPA 8.14/10

### Contact links

- Email: adityaraj92.20@gmail.com
- Phone: +91 7257807070
- LinkedIn: https://www.linkedin.com/in/adityaraj11/
- GitHub: https://github.com/iamadi11

### LinkedIn note

- Automated extraction of full profile text is unreliable (login wall / rate limits). Re-sync headline and featured items manually against https://www.linkedin.com/in/adityaraj11/ when updating; resume still wins on conflicts.

---

## V2 — Loki Cinematic Experience

**Route:** `/v2`  
**Architecture:** Fixed R3F canvas + 500vh GSAP ScrollTrigger scroll driver. Progress ref (0→1) drives camera + overlays.

### Narrative mapping (Loki series → career)

| Scroll % | Loki event                         | Career node              |
| -------- | ---------------------------------- | ------------------------ |
| 0–22%    | Tesseract acquired (Avengers 2012) | Identity / hero          |
| 22–50%   | Captured by TVA                    | TVA portals → navigation |
| 50–78%   | Sacred timeline / nexus events     | Career timeline tree     |
| 78–100%  | End of time / The Void             | Contact / void scene     |

### Loki node ↔ career mapping (in `CinematicHome.tsx` `LOKI_NODES`)

1. `TESSERACT ACQUIRED` → IIIT Lucknow 2017–21
2. `CAPTURED BY THE TVA` → Tata 1mg SDE I 2021
3. `NEXUS EVENT DETECTED` → Tata 1mg SDE II 2023
4. `TIMELINE BRANCHING` → Moresand Technologies 2024
5. `GOD OF THE TIMELINE` → Cashfree Payments 2025 (current)

### V2 component map

```
src/components/v2/
  CinematicHome.tsx   — root: canvas + overlays + scroll driver
  SoundEngine.tsx     — Web Audio API procedural ambient (CC0, no copyright)
  data.ts             — IDENTITY, PROJECTS, EXPERIENCE, SKILLS, EDUCATION
  Chrome.tsx          — navigate() helper
  Pages.tsx           — assembles scenes
```

### Scene 3D components

- `CrystalTesseract` — MeshPhysicalMaterial iridescence (iridescenceIOR 2.2), point light inside
- `TVAPortal` — 4 concentric torus rings + inner disc + swirl particles
- `SacredTimeline` — 7 branches (main trunk + 6), EnergyFlow particles, 11 nodes
- `EnergyFlow` — pre-sampled CatmullRom curves, 28 particles/branch, single BufferGeometry
- `VoidDebris` — 6 wireframe octahedrons drifting in void scene
- `VoidDust` — 2800 ambient gold particles

### Sound system (SoundEngine.tsx)

Procedurally generated via Web Audio API — zero copyright:

- Pink noise (Paul Kellet algorithm) filtered at 160 Hz
- 3 sine drones: 40 Hz + 80 Hz + 160 Hz
- Crystal shimmer oscillator (880 Hz), active only in tesseract scene (p < 0.28)
- Master gain 0.16 when unmuted, fades to 0 when muted

### Performance decisions

- `dpr={[1, 1.5]}` — caps pixel ratio
- Bloom: `intensity=2.8, luminanceThreshold=0.08` — reduced from default
- Single RAF loop for all 4 HTML overlays (`useOverlayAnimator`)
- `EnergyFlow` uses one shared `BufferGeometry` per color group
- `VoidDebris` visible only when `progress > 0.82`

### Rules for v2 content

- All text in overlays must match `data.ts` and resume — never invent metrics
- Loki event labels are narrative framing only — career data is ground truth
- Adding new timeline nodes: update `LOKI_NODES` array + `SacredTimeline` branch curves + `data.ts` `EXPERIENCE`

---

## Build filter (every change)

Ship only if:

**(credibility OR first-impression OR conversion)** AND **verified data** AND **simple implementation**.

Otherwise skip.
