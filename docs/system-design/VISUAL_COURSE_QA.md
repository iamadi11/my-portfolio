# Visual course batch · 2026-10-29

Scope: educator skill first; 16 existing lessons gain short, chapter-specific isometric 3D films; four new lessons (REST, RPC, GraphQL, realtime) bring availability to 20 of the 119 planned chapters. Existing detailed explanations, labs and quizzes remain. No deployment or commit performed.

## Evidence

| Check | Result |
| --- | --- |
| Skill size | 2,876 → 876 words; 64.6% fewer UTF-8 bytes in SKILL.md. This measures entry-context size, not actual model tokens or total authoring cost. |
| Skill validation | course.mjs skill and skill-creator quick_validate.py pass. context.mjs exercised on existing chapter ids and an unknown id. |
| Helper regression tests | 39/39 pass. |
| Course graph | 119 nodes, prerequisites/path closure pass; 20 routes implemented. Three historical spec-standard warnings retained. |
| Unit tests | 377/377 pass across 21 files. Includes seek determinism, persistent saved state after a lost reply, arrival timing, all 20 film topologies, lost messages never reaching destinations, caption length ≤25 words and API semantic experiments. |
| TypeScript and ESLint | Pass, including production build's type/lint checks. |
| Production build | Pass; 32 static pages generated. New lessons use generateStaticParams; unknown dynamic lesson ids are excluded. |
| First-load JavaScript | Next production route report: /learn 112 kB; new chapter routes 114 kB; all /learn routes 107–120 kB, under the existing 150 kB limit. Portfolio / is 110 kB. No new runtime dependency. This is the build report, not an independent network-transfer audit. |
| Production browser smoke | All 20 chapter routes load; Next scene changes the caption; no horizontal overflow at 1280×800. |
| Responsive layouts | /learn and four new chapters: no overflow at 375×812, 402×874, 768×1024, 1280×800, 1440×900, 1920×1080 (30 route/size checks). |
| New practice flows | Four new labs hide results until prediction + Run; default predictions match. Four quizzes hide explanations until selection and accept the correct scenario answer. REST POST variant also checked on mobile. |
| Keyboard | REST timeline End reaches final scene; tab ArrowRight selects Interactive Lab; scene controls reachable. |
| Appearance | Light and dark inspected, preference persists across reload/navigation. Final mobile and desktop checks confirm exactly one visible responsive scene. Lab material variables resolve in dark mode; portfolio remains white after visiting a dark course route. |
| Recovery state | Final production QUIC frame reads “bytes delivered” after recovery rather than retaining “waiting”. |
| Screenshot | Saved outside the repo in the task visualization directory as course-preview.png. |

## Fixes from browser QA

Lab scenes initially lacked inherited material tokens and rendered black. Shared material ramps now cover player and lab. Desktop initially displayed both responsive SVGs; explicit variant selectors now display one. REST creation results name the notes collection. QUIC recovery clears the waiting readout. The watched-film count updates when the preview finishes on the same page.

## Limits and next review

No independent rendered-page review, real screen-reader session, automated axe run, Lighthouse run, system reduced-motion emulation, or complete legacy browser suite was performed. Existing useClock reduced-motion stepping and offscreen behavior are reused; code inspection and deterministic stepping are not a substitute for those missing checks. Full narrative/animation-sense review remains open. Status stays implemented for every changed chapter.

The remaining 99 curriculum chapters are planned. Do not advertise the course as complete or independently certified. Next authoring topic is idempotency; next release task is the independent teaching/accessibility review. Budget for on-demand assets was not separately network-audited.
