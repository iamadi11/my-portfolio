# Cursor rules — my-portfolio

Rules for AI and humans editing this repo.

## 1. Atomic changes

- One logical fix per commit (e.g. “sync work history”, “add motion to hero”, “fix contact links”).
- No drive-by refactors or unrelated formatting sweeps.

## 2. Content

- **No invented experience, skills, projects, or metrics.**
- Source order: `Aditya_SDE_5_years.pdf` → LinkedIn → GitHub; resume wins on conflict.
- Projects must link to real `github.com/iamadi11/...` repos (or resume-documented work) with accurate descriptions.

## 3. UX

- **Mobile-first:** layout and tap targets work at ~375px width before desktop polish.
- Scannable sections; avoid walls of text.

## 4. Animation (motion.dev)

- Primary library: **motion** (`motion.dev`) for React.
- Durations ~200–400ms; prefer `transform` + `opacity`; avoid animating layout-heavy properties per frame.
- No random or gratuitous motion; must improve clarity or perceived quality.
- Ship animations in small steps; measure Lighthouse after meaningful UI changes.

## 5. Performance

- Target **Lighthouse ≥ 90** (performance) on the main landing flow after changes when possible.
- Lazy-load heavy visuals; keep bundle growth justified.

## 6. Before commit

- `npm run build` succeeds.
- Spot-check mobile (375px) and desktop.
- Confirm copy maps to resume, LinkedIn, or GitHub.
- Commit message format:  
  `feat(portfolio): [what changed] — based on [resume/LinkedIn/GitHub]`

## 7. Anti-patterns (do not ship)

- “Passionate developer”, “team player”, generic soft filler.
- Fake or exaggerated project claims.
- Skills listed with no resume or repo backing.
- Animations that block interaction or tank FPS.
