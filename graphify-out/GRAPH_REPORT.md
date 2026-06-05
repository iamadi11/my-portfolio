# Graph Report - /Users/adityaraj/Desktop/My Projects/my-portfolio (2026-06-05)

## Corpus Check

- 80 files · ~75,423 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 186 nodes · 185 edges · 34 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.81)
- Token cost: 4,000 input · 3,450 output

## God Nodes (most connected - your core abstractions)

1. `Aditya Raj — Source of Truth` - 11 edges
2. `Portfolio Tech Stack (Next.js 15, React 19, TS5, Tailwind)` - 8 edges
3. `atmosphere()` - 6 edges
4. `clamp()` - 5 edges
5. `render()` - 5 edges
6. `Aditya_Raj_SDE.pdf — Resume` - 5 edges
7. `Brand Logo (logo.png)` - 5 edges
8. `lerp()` - 4 edges
9. `Next.js 15 (App Router)` - 4 edges
10. `Apple Touch Icon (180x180)` - 4 edges

## Surprising Connections (you probably didn't know these)

- `CLAUDE.md — Authority Hierarchy` --references--> `Aditya_Raj_SDE.pdf — Resume` [EXTRACTED]
  CLAUDE.md → Aditya_Raj_SDE.pdf
- `Cursor Rule — Atomic Changes` --semantically_similar_to--> `Mandatory Workflow (Research→Plan→Implement→Validate→Commit)` [INFERRED] [semantically similar]
  CURSOR_RULES.md → CLAUDE.md
- `Cursor Rule — Pre-Commit Checklist` --semantically_similar_to--> `Release Gates — TypeCheck, Lint, Browser, Lighthouse` [INFERRED] [semantically similar]
  CURSOR_RULES.md → CLAUDE.md
- `Cursor Anti-Patterns` --semantically_similar_to--> `Anti-Patterns — Forbidden Actions` [INFERRED] [semantically similar]
  CURSOR_RULES.md → CLAUDE.md
- `Commit Format Convention` --semantically_similar_to--> `Cursor Rule — Pre-Commit Checklist` [INFERRED] [semantically similar]
  CLAUDE.md → CURSOR_RULES.md

## Hyperedges (group relationships)

- **Portfolio Governance System** — claude_md_authority, source_of_truth_adityaraj, pdf_resume, claude_md_workflow, claude_md_build_filter, claude_md_release_gates, claude_md_anti_patterns [INFERRED 0.90]
- **Content Authority Hierarchy (PDF > LinkedIn > GitHub)** — pdf_resume, source_of_truth_adityaraj, claude_md_authority, cursor_rules_content, rationale_source_authority [EXTRACTED 1.00]
- **Portfolio Tech Stack Set** — concept_nextjs, concept_react, concept_typescript, concept_tailwind, concept_motion, concept_vercel, concept_eslint, concept_husky [EXTRACTED 1.00]
- **Quality Gates (Lighthouse, WCAG, TypeCheck, Lint)** — concept_lighthouse, concept_wcag, concept_eslint, claude_md_release_gates, cursor_rules_performance [EXTRACTED 1.00]
- **Aditya Raj Work History** — source_of_truth_cashfree, source_of_truth_moresand, source_of_truth_tata1mg_sde2, source_of_truth_tata1mg_sde1 [EXTRACTED 1.00]
- **Portfolio Safe Projects** — source_of_truth_mouse_follow, source_of_truth_mcp_ui_poc, source_of_truth_spatial [EXTRACTED 1.00]
- **Favicon & App Icon Set** — [INFERRED 0.90]
- **Framework & Platform Brand Logos** — [INFERRED 0.90]
- **Generic UI Icons** — [INFERRED 0.85]

## Communities

### Community 0 - "V2 Cinematic Components"

Cohesion: 0.1
Nodes (0):

### Community 1 - "App Router Layouts"

Cohesion: 0.11
Nodes (0):

### Community 2 - "V1 Component Library"

Cohesion: 0.12
Nodes (3): buildGeometry(), buildPrimeScene(), hslToRgb()

### Community 3 - "AI Governance Rules"

Cohesion: 0.12
Nodes (18): CLAUDE.md — Authority Hierarchy, Build Filter — Credibility, Grounded, Simplest, AI Skills — /ship and /sync-resume, Mandatory Workflow (Research→Plan→Implement→Validate→Commit), Cursor Rule — Atomic Changes, Cursor Rule — Content Authority, Aditya_Raj_SDE.pdf — Resume, Rationale: Build filter ensures only high-value changes ship (+10 more)

### Community 4 - "Particle Canvas Engine"

Cohesion: 0.31
Nodes (9): atmosphere(), blob(), clamp(), lerp(), lerpRgb(), onScroll(), render(), smooth() (+1 more)

### Community 5 - "V2 SPA Pages"

Cohesion: 0.17
Nodes (0):

### Community 6 - "Portfolio Tech Stack"

Cohesion: 0.21
Nodes (12): Git Hooks — Husky + Commitlint, Motion (motion.dev / motion/react), Next.js 15 (App Router), React 19, Tailwind CSS 3, TypeScript 5 (strict), Vercel Deployment, Cursor Rule — Animation (motion.dev) (+4 more)

### Community 7 - "V2 Navigation & Chrome"

Cohesion: 0.2
Nodes (0):

### Community 8 - "Quality Gates & Tooling"

Cohesion: 0.22
Nodes (9): Commit Format Convention, Release Gates — TypeCheck, Lint, Browser, Lighthouse, UX Rules — Mobile-first, WCAG 2.2, Lighthouse ≥90, ESLint 9 + Prettier 3, Lighthouse ≥90 Score Target, Static Site Generation (SSG), WCAG 2.2 Level AA Accessibility, Cursor Rule — Pre-Commit Checklist (+1 more)

### Community 9 - "PWA Icon Set"

Cohesion: 0.67
Nodes (6): Apple Touch Icon (180x180), Favicon 16x16, Favicon 32x32, PWA Icon 192x192, PWA Icon 512x512, Brand Logo (logo.png)

### Community 10 - "OSS Projects"

Cohesion: 0.5
Nodes (4): Project: mcp-ui-poc, Project: mouse-follow, Portfolio-Safe Projects, Project: spatial

### Community 11 - "Project Visual Assets"

Cohesion: 0.67
Nodes (4): Portfolio Projects Section, Abstract Colorful Bokeh Lighting, Project Bokeh Background Image, Portfolio Project Card Visual Asset

### Community 12 - "Anti-Pattern Guards"

Cohesion: 0.67
Nodes (3): Anti-Patterns — Forbidden Actions, Cursor Anti-Patterns, Rationale: No invented content prevents credential misrepresentation

### Community 13 - "Profile Photography"

Cohesion: 1.0
Nodes (3): Aditya Raj Profile Photo, Restaurant Setting (Bagdadi Lunch & Dinner), Young South Asian Man with Glasses

### Community 14 - "UI Icon SVGs"

Cohesion: 0.67
Nodes (3): File/Document SVG Icon, Globe/Web SVG Icon, Window/Browser SVG Icon

### Community 15 - "Error Boundary"

Cohesion: 1.0
Nodes (0):

### Community 16 - "Web App Manifest"

Cohesion: 1.0
Nodes (0):

### Community 17 - "Not Found Page"

Cohesion: 1.0
Nodes (0):

### Community 18 - "V2 Side Navigation"

Cohesion: 1.0
Nodes (0):

### Community 19 - "Legacy Hero Canvas"

Cohesion: 1.0
Nodes (0):

### Community 20 - "V2 Loader"

Cohesion: 1.0
Nodes (0):

### Community 21 - "V2 Top Bar"

Cohesion: 1.0
Nodes (0):

### Community 22 - "R3F Particle Network"

Cohesion: 1.0
Nodes (0):

### Community 23 - "Framework Brand Logos"

Cohesion: 1.0
Nodes (2): Next.js Logo SVG, Vercel Logo SVG

### Community 24 - "Commitlint Config"

Cohesion: 1.0
Nodes (0):

### Community 25 - "Next.js Type Defs"

Cohesion: 1.0
Nodes (0):

### Community 26 - "Tailwind Config"

Cohesion: 1.0
Nodes (0):

### Community 27 - "Next.js Config"

Cohesion: 1.0
Nodes (0):

### Community 28 - "JSX Type Declarations"

Cohesion: 1.0
Nodes (0):

### Community 29 - "Content Authority Rules"

Cohesion: 1.0
Nodes (1): Content Authority Rules

### Community 30 - "Build Filter Rule"

Cohesion: 1.0
Nodes (1): Build Filter Decision Rule

### Community 31 - "Tone Rules"

Cohesion: 1.0
Nodes (1): Tone Rules — No Filler Copy

### Community 32 - "Priority Order"

Cohesion: 1.0
Nodes (1): Priority Order — Accuracy > Speed > A11y > Polish

### Community 33 - "Cursor UX Rule"

Cohesion: 1.0
Nodes (1): Cursor Rule — UX Mobile-first

## Knowledge Gaps

- **35 isolated node(s):** `Identity: Aditya Raj`, `Frontend Engineer II — Cashfree Payments`, `Software Engineer — Moresand Technologies`, `Software Development Engineer II — Tata 1mg`, `Software Development Engineer I — Tata 1mg` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Error Boundary`** (2 nodes): `error.tsx`, `Error()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Web App Manifest`** (2 nodes): `manifest.ts`, `manifest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Not Found Page`** (2 nodes): `not-found.tsx`, `NotFound()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `V2 Side Navigation`** (2 nodes): `SideNav.tsx`, `SideNav()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Legacy Hero Canvas`** (2 nodes): `HeroCanvas.tsx`, `HeroCanvas()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `V2 Loader`** (2 nodes): `Loader.tsx`, `Loader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `V2 Top Bar`** (2 nodes): `TopBar.tsx`, `TopBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `R3F Particle Network`** (2 nodes): `HeroR3F.tsx`, `NetworkScene()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Framework Brand Logos`** (2 nodes): `Next.js Logo SVG`, `Vercel Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Commitlint Config`** (1 nodes): `commitlint.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Type Defs`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config`** (1 nodes): `tailwind.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JSX Type Declarations`** (1 nodes): `jsx.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Content Authority Rules`** (1 nodes): `Content Authority Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Filter Rule`** (1 nodes): `Build Filter Decision Rule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tone Rules`** (1 nodes): `Tone Rules — No Filler Copy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Priority Order`** (1 nodes): `Priority Order — Accuracy > Speed > A11y > Polish`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cursor UX Rule`** (1 nodes): `Cursor Rule — UX Mobile-first`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `Portfolio Tech Stack (Next.js 15, React 19, TS5, Tailwind)` connect `Portfolio Tech Stack` to `Quality Gates & Tooling`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Aditya Raj — Source of Truth` (e.g. with `CLAUDE.md — Authority Hierarchy` and `AI Skills — /ship and /sync-resume`) actually correct?**
  _`Aditya Raj — Source of Truth` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Identity: Aditya Raj`, `Frontend Engineer II — Cashfree Payments`, `Software Engineer — Moresand Technologies` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `V2 Cinematic Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `App Router Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `V1 Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `AI Governance Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
