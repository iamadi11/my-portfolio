# Source of truth — Aditya Raj portfolio

**Last reviewed:** 2026-04-09  
**Hierarchy (strict):** `Aditya_SDE_5_years.pdf` → LinkedIn → GitHub. On conflict, **resume wins**.

---

## Identity

| Field    | Value (resume)                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------- |
| Name     | Aditya Raj                                                                                          |
| Location | Bengaluru, Karnataka, India                                                                         |
| Title    | Frontend Engineer II (resume current role, Cashfree Payments; hero + site metadata + JSON-LD match) |
| Email    | adityaraj92.20@gmail.com                                                                            |
| Phone    | +91 72578 07070 → `tel:+917257807070`                                                               |
| LinkedIn | https://www.linkedin.com/in/adityaraj11/                                                            |
| GitHub   | https://github.com/iamadi11                                                                         |

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

**Resume (explicit):** React, Next.js, JavaScript, TypeScript, HTML5, CSS3, Tailwind CSS, Redux, React Query, Zustand, Node.js, Express.js, REST, microservices, Webpack, PWA, Turborepo, code splitting, caching, performance work, Google Maps API, Jest, React Testing Library, Git, CI/CD, AWS, MySQL, MongoDB, Redis, SSIS; **Cashfree:** Semantic UI.

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

### Current role (resume)

- **Frontend Engineer II** — Cashfree Payments — Mar 2025 – Present — Bengaluru

### Prior roles (resume)

- **Software Engineer III** — Moresand Technologies — Aug 2024 – Mar 2025 — Bengaluru
- **Software Development Engineer I–II** — Tata 1mg — Dec 2021 – Jul 2024 — Gurugram

### Top skills (resume + GitHub)

- React, Next.js, TypeScript, Node.js, performance, PWA, React Query, Zustand, Turborepo (resume); repo mix includes TS/JS projects on GitHub.

### Projects (portfolio-safe)

- **mouse-follow** — https://github.com/iamadi11/mouse-follow — demo: https://mouse-follow-demo.vercel.app/ (GitHub description: “Mouse Follow Component”)
- **mcp-ui-poc** — https://github.com/iamadi11/mcp-ui-poc — demo: https://mcp-ui-poc.vercel.app/ — “Dynamic MCP UI Generator”; copy on site from repo README (full-stack MCP UI demo, React + Vite + Node/Express).
- **spatial** — https://github.com/iamadi11/spatial — “Client-Side UI Performance Optimizer”; copy on site from repo README (TypeScript strict, Vitest, dev-time UI performance detection).
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

## Build filter (every change)

Ship only if:

**(credibility OR first-impression OR conversion)** AND **verified data** AND **simple implementation**.

Otherwise skip.
