# Journey — Round trip `/` (Agent C)

Scene-by-scene user journey for the award-calibre pass. Beliefs and on-screen strings only from `SITE` in `src/content/site.ts` (mirrored in `SOURCE_OF_TRUTH.md`). Places and craft lock from `docs/pass-lapaz/award-blueprint.md` and `docs/round-trip.md`.

**Audience:** recruiters and leads who decide in under five seconds, then scroll if the ride earns it.  
**HTML owns who / why / contact.** The canvas is atmosphere; it never gates the facts.

---

## Scroll map (from `heights` / `trip.ts`)

| Sec | Zone id | HUD hop | Scroll height | World place |
| --- | --- | --- | --- | --- |
| 0 | `rt-hero` | Intro | 130 svh | Orbit over night Earth (CSS poster until Start / first scroll) |
| 1 | `rt-wire` | Impact | 330 svh | Close-in + dive toward Earth |
| 2 | `rt-edge` | Stack | 290 svh | La Paz night city |
| 3 | `rt-work` | Projects | 100 + 180×N svh | One landscape + portal per project (N = `SITE.projects.length`) |
| 4 | `rt-career` | Experience | 100 + 100×R svh | Sea (roles) → pack ice (education) |
| 5 | `rt-contact` | Contact | 340 svh | Sunrise orbit → ship leaves |

Triggers that wake the world (idle-fetched chunk → build): first scroll, wheel, swipe, scroll key, **Start the trip**, or any `[data-start]` hop. Sound loads and plays only after the Sound control is switched on. Tilt-to-scroll appears on coarse pointers and starts only from the Tilt button (iOS permission on that gesture).

---

## 0 — First paint / orbit (Intro)

| | |
| --- | --- |
| **Belief** (`SITE.profile`) | Aditya Raj · Senior Software Development Engineer · 5+ years on fintech and e-commerce (React, Next.js, Node.js at Tata 1mg and Cashfree; self-serve fraud rule engine used by 200+ merchants) · Now at Amby Tech · Bengaluru, India. |
| **Sees** | Name (h1), role, full statement (`lede` + `rest` from the statement), status · location. CSS poster (stars over night limb + twin beacon). CTA: **Start the trip**, **Email me**, “or scroll”. HUD: brand name, route, Sound (off), J/K keys where hover exists. |
| **Feels** | Cool authority before city glow. Who / why care readable in HTML in under five seconds — no wait for 3D, loader, or click. |
| **Scroll / UI** | Idle: world chunk fetch. Start → smooth scroll to Impact (`#rt-wire`) and build. Email → `mailto:` from `profile.email`. |
| **Mobile** | Bottom route replaces top nav; panel sits in the lower band; upper frame stays the poster/world. |
| **Reduced motion** | No poster drift / beacon pulse / Start pulse; panels still; no blur thrash on reveals. |

---

## 1 — Wire / dive (Impact)

| | |
| --- | --- |
| **Belief** (`practice.impact`) | Shipped outcomes: 200+ merchants · Cashfree; 70%→15% SLA · Tata 1mg; 15→3 min builds · Tata 1mg; −30% Video KYC drop-offs · Cashfree. |
| **Sees** | Label Impact; kinetic h2 “What changed when I shipped”; four cards with counting values (endpoints from the strings themselves). World: ship closes on night Earth, then dives. |
| **Feels** | Proof before place — numbers earn the dive. |
| **Scroll** | Section `in` arms counters (skipped when reduced motion). Route hop fills toward Stack. |
| **Mobile / RM** | Two-column impact grid tightens; counters are instant under reduced motion. |

---

## 2 — Edge / La Paz (Stack)

| | |
| --- | --- |
| **Belief** (`practice.skills`) | Languages → Testing & Tooling groups and item strings exactly as in `SITE`. |
| **Sees** | “The stack”; skill rows; mirror box of the active group’s items. World: cloud-break into La Paz bowl, Illimani right, Osaka scan left, LED boards with skill strings. |
| **Feels** | Skills live in a real night city, not a generic grid. |
| **Scroll** | Active skill follows scroll through the section (`pick` on q(2)). Quiet dip (not a portal) into the first landscape protects portal meaning. |
| **Mobile / RM** | Skills stack; items under the list. Straight cut into places when reduced motion. |

---

## 3 — Portals / landscapes (Projects)

One stretch per project; colour from `hue` → `RING` in `trip.ts`.

| # | Place (craft) | Project · hue | Belief (`SITE.projects[].summary`) |
| --- | --- | --- | --- |
| 1 | Chocolate Hills | Eidos · green | Durable client-mutation queue — never lose a write (IndexedDB replay, idempotency; npm). |
| 2 | Lençóis Maranhenses | MCP UI studio · red | Chat (+ optional API URL) → versioned, publishable UI widget. |
| 3 | Zhangye Danxia | Spatial · blue | Detects UI performance anti-patterns from render counts, layout shifts, FPS, memory. |
| 4 | Mount Roraima | Sidecar · ink | Progressive image loading — tiny binary sidecar; runtime targeting under 1 KB. |
| 5 | Erta Ale | Video Light Sync · amber | Syncs on-screen light to Yeelight / WLED via a local Electron hub. |

| | |
| --- | --- |
| **Sees** | One project panel at a time (title, summary, year · stack, real GitHub/docs/npm links). Progress dots fill as the ship closes on that portal. On approach: panel softens with `--rush`. On the cut: HUD flash backing; panel `rt-cut`; project title flashes large in ring colour and flies into the panel h3 (`rt-handoff`). |
| **Feels** | Portal jump is the **only** loud cut. Anticipation (dots + rush soften) → title flash → settle. |
| **Scroll** | Panel index follows world place at the flash (`shownProject`), not scroll alone. Tabbing into a project forces it on screen. Hold / J boosts. |
| **Mobile / RM** | Panel bottom-band; no handoff / rush / panel blur under reduced motion — straight cut, title already in the h3. |

---

## 4 — Sea → pole (Experience)

| | |
| --- | --- |
| **Belief** (`practice.experience` + `education`) | Roles newest first: Amby Tech → Cashfree → Moresand → Tata 1mg II/I → o9; then IIIT Lucknow, B.Tech IT, Aug 2017 – Jun 2021, CGPA 8.14/10. Highlights and stacks only where `SITE` has them. |
| **Sees** | “Career”; chips; one record panel (org, role · period · location, first highlight, details for the rest). World: moonlit sea with one light pillar per role, then pack ice / aurora for education. Floating tags when clear of the panel. |
| **Feels** | Résumé as weather — quiet proof after craft. |
| **Scroll** | Record follows q(4); open `<details>` holds that record. |
| **Mobile / RM** | Tags avoid the panel band; no motion thrash. |

---

## 5 — `200 OK` / sunrise (Contact)

| | |
| --- | --- |
| **Belief** (`profile` contact + measured vitals) | Closure: trip clock in the HUD; browser-measured vitals only (first byte, LCP, JS transferred — omit what cannot be measured); email, phone, GitHub, LinkedIn from `SITE`; credits in step with assets; **Send again** once the ship has left. |
| **Sees** | Kinetic “200 OK”; “Round trip complete · {status · location}”; vitals line when measurable; **email as primary**; **Copy email** as filled primary action; phone + profile links quieter; Credits disclosure; Send again after `rt-left`. |
| **Feels** | Measured visit + clear next step — email first, copy second, profiles third, replay last. |
| **Scroll** | Most of the section is climb + air cut + orbit; ship leave reveals Send again. Send again: brief veil (skipped when RM) → scroll top → focus Start. |
| **Mobile / RM** | Same CTA hierarchy; no veil animation under reduced motion. |

---

## Controls (friction checklist)

| Control | Behaviour | Journey note |
| --- | --- | --- |
| Start the trip | Wakes world; scrolls to Impact | Primary hero CTA (`rt-go`); pulse until scrolled / live |
| Email me | `mailto:` | Secondary hero path to contact without the ride |
| Sound | Opt-in; loads synth on first on | Label “Sound on” when pressed; never autoplay |
| Tilt to scroll | Coarse pointer only; permission on gesture | Off until tapped; bar shows tilt magnitude |
| J/K keys | Next / previous stop; off by default without hover | Disabled while a control has focus; persisted in `localStorage` |
| Route | Six hops; `aria-current="step"` on active | Top on wide; bottom equal targets on phones |
| Send again | Restart after ship left | Focus returns to Start |

---

## Above-the-fold gate (&lt;5 s)

Must pass without Start, Sound, or WebGL:

1. **Who:** `Aditya Raj` (h1) + brand in HUD.
2. **Why care:** Senior Software Development Engineer + statement (fintech / e-commerce, Tata 1mg, Cashfree, 200+ merchants).
3. **Now:** Now at Amby Tech · Bengaluru, India.
4. **Path:** Start the trip · Email me.

Contrast: panel text-shadow + left scrim (desktop) / bottom scrim (mobile). Hero name/role carry extra plate shadow so they hold over the poster limb.

---

## HTML / drive levers (this agent)

Prefer `RoundTrip.tsx`, `drive.ts`, `round-trip.css`, `trip.ts`. Do not fight `world/*` (Agent B).

| Lever | Intent |
| --- | --- |
| `--rush` on services panel | Soften copy as the ship rushes a portal (anticipation before the cut) |
| `rt-cut` + handoff timing | Longer panel settle synced with title flash → h3 |
| Dot `--p` fill (+ glow) | Progress toward the portal reads in the HUD strip |
| Finale `.rt-close` / primary Copy | Email + Copy lead; links demoted |
| Sound / Tilt pressed labels | Opt-in state obvious at a glance |
| Hero name/role shadow + Start pulse | Who/why hold AA; Start is the invitation |

---

## Acceptance (journey)

- [x] Who / why / now / path readable in HTML within five seconds at 375 and 1280
- [x] Portal approach: dots fill + panel softens before cut; title flash lands in panel h3
- [x] `200 OK`: email hierarchy clear; no invented copy
- [x] Sound silent until opt-in; Tilt only after button; reduced motion = stills + straight cuts
- [x] Every belief above traces to a `SITE` field

## Implemented (HTML / drive)

| Change | Where |
| --- | --- |
| `--rush` softens projects panel on approach; cut blur 360 ms; fill keyed by prop | `drive.ts` |
| Title handoff hold (~880 ms) already from motion pass; cut syncs to it | `drive.ts` |
| Dot fill glow rises with `--p` | `round-trip.css` |
| Hero name/role extra plate shadow | `round-trip.css` |
| Finale: `.rt-close`, `.rt-cta-primary` (Copy email), `.rt-cta-secondary` | `RoundTrip.tsx`, CSS |
| Sound label “Sound on” + pressed chrome; Start `rt-go` pulse (motion pass) | `RoundTrip.tsx`, CSS |
| Reduced motion: no rush / cut blur | `round-trip.css`, `drive.ts` (`rush` forced 0) |
