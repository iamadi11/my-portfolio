# Visual course production · 2026-10-29

Owner request: optimize the educator skill first, then build beginner-friendly chapters with rich 3D animation, little text, readable typography and dark mode. Work on main. Local implementation; no publication requested.

Acceptance: all 16 existing chapters gain a chapter-specific 3D short film with pause, replay, event steps, seeking, speed and transcript. Preserve labs and quizzes. Add REST, RPC, GraphQL and realtime chapters in curriculum order. Introduce persistent light/dark/system course theme. Arimo retained for readability; no font downloads added. Keep portfolio unaffected. Maintain explicit 20/119 availability; do not imply remaining chapters exist.

Approach: concise skill router + read-only context helper; shared deterministic timeline and reusable isometric geometry; server selects a single film’s data, keeping other chapters out of the client bundle. Static new routes, sourced semantic labs, hidden-answer quizzes. Stylized diagrams and playback durations are teaching aids, never benchmarks.

Verification: skill/graph validators, existing unit tests + model invariants, TypeScript, targeted ESLint/Prettier, production build, browser playback/seek/theme/keyboard/reduced-motion at mobile/desktop, axe and JS budgets. Record any unavailable check. All new/modified chapters remain implemented until complete independent review.
