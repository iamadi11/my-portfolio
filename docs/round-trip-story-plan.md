# Round trip 2: a story told by objects (plan; nothing built yet)

Written 2026-10-17 from your LinkedIn export (`Profile.pdf`), your message (Amby Tech, SSDE since 9 July 2026), your GitHub (`iamadi11/*`, `sweidos/eidos`), the rea discoveries in `docs/v2-research/` plus three new ones, and the earlier research in `docs/round-trip-next.md`.

## What you asked for

1. **Real data.** Update the site with your real data: LinkedIn, plus Amby Tech. → §1
2. **Projects.** Go through your projects in detail and use them. → §1.3, §3
3. **Quality.** Better assets and refinements instead of everything drawn in code. → §4, §6
4. **Tilt to scroll.** Tilt forward scrolls down; tilt back scrolls up. → §5
5. **Less text.** Assets and animation that tell a story. → §3, §7
6. **Discovery first.** Research with rea and free open-source 3D models, and plan before coding. → §2, §4, §9

---

## 1. Your data: what changes

### 1.1 Profile

| Field | On the site now | Change to | Source |
| --- | --- | --- | --- |
| Current role | none (last role was Cashfree, ended May 2026) | **Senior Software Development Engineer, Amby Tech, Jul 2026 – now** | your message |
| Availability | "Open to new roles" | Removed; the hero says "Now at Amby Tech". | your message |
| Statement | "~4.5+ years building scalable web apps…" | A short version of your LinkedIn summary: fintech and e-commerce, React/Next.js/Node, Tata 1mg and Cashfree, 200+ merchants on a self-serve fraud rule engine. | LinkedIn summary |
| Years | "~4.5+ years" | **Needs your call (decision 2).** LinkedIn says 4.5+. With o9 Solutions it is 5 years 4 months (Jun 2021 →); without it, 4 years 10 months (Dec 2021 →). | LinkedIn |

### 1.2 Experience (newest first)

| Role | What changes | Source |
| --- | --- | --- |
| **Amby Tech** · SSDE · Jul 2026 – now | New. No highlights until you give some; Amby's own marketing lines won't be used as your achievements. | your message |
| **Cashfree Payments** · Frontend Engineer II · Mar 2025 – May 2026 · Bengaluru | Bullets from LinkedIn: Risk WebApp for **200+ enterprise merchants**; schema-driven micro-frontend **fraud rule engine** that merchants configure at runtime (no redeploys); **Video KYC drop-offs −30%** with a reconnection state machine and exponential backoff; **Cashmere** design system (Storybook, Figma, CLI scaffolding). | LinkedIn |
| **Moresand Technologies** · Software Engineer · Aug 2024 – Mar 2025 · Bengaluru | LinkedIn bullets: Backbone.js/.NET → React/TS migration with tests and CI (**3× delivery**); Next.js SSR features with React Query and Node/Express for field operations; mobile-first Tailwind layout. The resume's "PWA, page load −50%" stays (resume-backed). | LinkedIn + resume |
| **Tata 1mg** · SDE II · Apr 2023 – Jul 2024 · Gurugram | Split back into its own record with its own bullets: **Turborepo monorepo (CI/CD −30%)**; **Node.js PDF microservice** replacing 5+ client-side generators (duplication −60%). | LinkedIn |
| **Tata 1mg** · SDE I · Dec 2021 – Mar 2023 · Gurugram | Delivery-zone configurator (**20+ cities**, 1-hour express); offline-first warehouse PWA (**manual errors −45%**); real-time notifications (**SLA breaches 70% → 15%**); build **15 → 3 min**, bundles −60%, Lighthouse > 90. | LinkedIn + resume |
| **o9 Solutions** · Technical Consultant · Jun – Dec 2021 · Bengaluru | New, if you want it (decision 1): client dashboard, SSIS + MySQL data integration. | LinkedIn only |
| **IIIT Lucknow** · B.Tech IT · 2017 – 2021 | No change (CGPA 8.14 from the resume). | resume |

**Conflicts between LinkedIn and the cached resume (decision 3).** CLAUDE.md says the resume wins; my defaults follow that.

| # | Resume says | LinkedIn says | Default |
| --- | --- | --- | --- |
| a | Cashfree: "millions of transactions **per month**" | "millions of **daily** transactions" | per month |
| b | Tata SDE I ends **Mar 2023** | ends **Apr 2023** | Mar 2023 |
| c | Delivery zones: "15-minute and 1-hour" | "1-hour express, 20+ cities" | Use both: 20+ cities, 15-min and 1-hour zones. |

### 1.3 Projects

Feature five; every one is a real repo:

| Project | Why it earns a slot | Links |
| --- | --- | --- |
| **Eidos**: "Never lose a write." | Published npm library, MIT; you made 276 of its commits. A durable mutation queue (IndexedDB + Web Locks, idempotency keys, ~6.8 kB core). It's also your LinkedIn headline. | `github.com/sweidos/eidos` (moved from `iamadi11/eidos`) · `sweidos.vercel.app` · npm `@sweidos/eidos` |
| **MCP UI studio** | Your most-starred repo (8). A chat turn becomes a versioned, publishable widget; full-stack (Redis, Mongo, GitHub OAuth). | `iamadi11/mcp-ui-poc` · `mcp-ui-poc.vercel.app` |
| **Spatial** | Detects performance anti-patterns in a running app (render counts, layout shifts, FPS, memory). Framework-agnostic core with a React adapter. | `iamadi11/spatial` · `spatial-zeta.vercel.app` |
| **Sidecar** | Progressive image loading: a ≤ 12 KB binary sidecar per image, runtime target under 1 KB. | `iamadi11/progressive-image` |
| **Video Light Sync** | Screen colours → Yeelight/WLED smart bulbs over a local Electron hub; a pnpm monorepo. Physical and very visual. | `iamadi11/video-light-sync` |

- **Drop:** Mouse Follow (thin).
- **Hold back:** Noesis, Interview Lab, SourceLens, stacks and frontend-master. They're good but early or local-only; we can add a short list.
- **Rule:** descriptions come from each README, with no invented metrics.

---

## 2. What the discovery found

**rea runs:**
- **Round 1:** 12 award sites (`references.md`, `teardown.md`).
- **Round 2:** 8 game and diorama portfolios (`game-teardown.md`).
- **Round 3 (today):**

  | Site | rea evidence | Runtime pass |
  | --- | --- | --- |
  | Oryzo by Lusion | `ev_b0303300c1f…` | yes |
  | Lando Norris | `ev_481848c395d…` | yes |
  | Coastal World | `ev_aee3ecc31bd…` | now a bank site, discarded |

| Site | How the story is carried | What's on the wire |
| --- | --- | --- |
| Oryzo (Lusion, three r178) | One hero object; each scroll beat is a physical "demo" of one claim, with dry captions. | Custom compressed geometry (25 `.buf`), 80 WebP + 8 AVIF textures, baked light maps (31 refs), transmission, Rive micro-animations, heavy SplitText, sound. 15 MB. |
| Lando Norris (three r174) | One model (the helmet), lit by an HDR, with Lenis scroll. | 3 GLB, 2 HDR, 8 Rive files. |
| Messenger (Abeto) | A courier character delivers messages on a tiny planet, in missions. | 48 Draco, 30 KTX2, 159 OGG. |
| Jesse Zhou / Henry Heffernan | A diorama you click into; the content is real UI inside the scene. | KTX2 + video textures / CSS3D iframe. |
| Igloo Inc | A narrative built block by block on scroll. | 60 Draco, 135 KTX2, EXR environment. |

**Takeaways for us:**
1. **A protagonist carries the story** (a courier, a helmet, a coaster). The current site has a glowing dot; it needs a character.
2. **Each beat proves one claim with an object you can watch.** The words become a caption, not a paragraph.
3. **The look comes from lighting, not polygons:** baked or HDR light, a few emissives, fog and post. Low-poly CC0 kits can look bespoke if they're re-lit and re-coloured as one palette.
4. **Assets are compressed and streamed** (Draco/Meshopt geometry, KTX2/WebP/AVIF textures), loaded per chapter.
5. **Mobile is the open niche.** Only 3 of 8 game sites even play on a phone. Tilt-to-scroll plus portrait framing is our edge.

---

## 3. The story: "Never lose a write"

Your real work has one thread: **you build software that doesn't drop things**.
- an offline-first warehouse app that keeps entries when the network dies;
- real-time notifications so orders don't miss their SLA;
- a Video KYC call that reconnects instead of dropping;
- a fraud rule engine that changes without a redeploy;
- Eidos, which never loses a write.

**The premise:**
- The visitor's click becomes a **courier robot carrying a parcel**: their request.
- In each chapter something tries to drop it, and the thing you built saves it.
- At the end it is delivered: **200 OK**.
- The current fibre tunnel becomes the ride *between* chapters, so today's site isn't thrown away.

| # | Chapter (real facts) | What you watch | Interaction | Words on screen |
| --- | --- | --- | --- | --- |
| 0 | **Hero.** Name, SSDE at Amby Tech | A desk at night, laptop glowing. The robot climbs out of the screen holding the parcel and waves. | **Send** (or scroll / tilt) | Name · role · one line |
| 1 | **o9 Solutions** 2021 *(if kept)*: dashboards, SSIS + MySQL | Data crates ride conveyors into a dashboard screen. | – | company · role · year |
| 2 | **Tata 1mg** SDE I, Dec 2021 – Mar 2023 | **a.** Glowing polygons are drawn over a city map and scooters light up inside them (**20+ cities**). **b.** Warehouse lights die; the handheld keeps logging, then syncs (**errors −45%**). **c.** Red order tickets meet notification pulses; the red share falls **70% → 15%**. **d.** The build conveyor speeds up (**15 → 3 min**). | Tap a zone; "cut the power" | One big number per beat + ≤ 12 words |
| 3 | **Tata 1mg** SDE II, Apr 2023 – Jul 2024 | Five small repo houses merge into one tower (**Turborepo, CI/CD −30%**). A printer service replaces 5 desk printers (**duplication −60%**). | – | same |
| 4 | **Moresand** Aug 2024 – Mar 2025 | An old building (Backbone/.NET) in scaffolding is rebuilt as a modern one; cranes speed up (**3×** delivery). | – | same |
| 5 | **Cashfree** Mar 2025 – May 2026 | **a.** Payment cards stream through a gate; merchants turn rule dials and flagged cards are pulled aside with no rebuild (**200+ merchants**). **b.** A phone on a video call loses signal; reconnect pulses back off (1 s, 2 s, 4 s…) and the call holds (**drop-offs −30%**). **c.** Component bricks (Cashmere) snap into screens for several teams. | Turn a rule dial; drop the signal | same |
| 6 | **Amby Tech** Jul 2026 – now | A machine hall at night with machines running. **Role and dates only, no claims.** | – | company · role · since |
| 7 | **Workshop: projects** | Five toys on a workbench. **Eidos:** the parcel survives a network cut in a locker and is replayed. **MCP UI:** a chat bubble unfolds into a widget. **Spatial:** a lens over a busy UI flags red hot-spots. **Sidecar:** a photo sharpens in steps. **Video Light Sync:** a screen's colours flow into bulbs around the bench. | Tap a toy → its links | name · one line · links |
| 8 | **200 OK** | The robot drops the parcel back into the laptop. The camera climbs out to show the whole career as one lit route (today's map shot). | Email, copy, links | contact |

**Navigation:**
- **Résumé rail.** The HUD lists the chapters (company names) so recruiters can jump.
- **Details.** Each chapter has a "Details" button that opens the full bullets as real HTML.
- **Text view.** A "Read as text" link goes to `/about`, which will read from `site.ts` too, so there's one source of truth.

---

## 4. Assets: free and open source, verified

| Use | Asset | License (checked on its page) |
| --- | --- | --- |
| The courier | **RobotExpressive** (Tomás Laulhé / Quaternius; three.js repo): glTF with walk, run, jump, wave, thumbs-up, yes/no clips and face morphs | CC0 1.0 |
| Courier alternatives | Quaternius **LowPoly Robot** (14 animations); **Sci-Fi Essentials Kit** (animated robots, screens; glTF) | CC0 |
| City, pharmacy, roads | Kenney **City Kit Commercial** (50) + **Roads** + **Industrial** | CC0 |
| Scooters, vans | Kenney **Car Kit** | CC0 |
| Warehouse, build line, machines | Kenney **Factory Kit** (140 files, animated conveyors); Quaternius **Ultimate Modular Sci-Fi** (46 props) | CC0 |
| Desk and room | Kenney **Furniture Kit**; Kenney laptop (via Poly Pizza) | CC0 (each Poly Pizza model checked one by one) |
| Night lighting | Poly Haven night **HDRI** | CC0, no credit needed |
| Sound | Kenney Interface / Impact / Sci-fi sounds | CC0 |
| Code-built, where no model fits | Payment cards, rule dials, light bulbs, chat bubble, the parcel | ours |
| Animation library | **GSAP** with ScrollTrigger and SplitText | now free for commercial use |

**Pipeline:**
1. **Download:** fetch only the packs we use into git-ignored `assets-src/`.
2. **Unify the look:** recolour every kit to **one palette** through a shared gradient atlas; add emissive accents, rim light and fog. The kits then read as one bespoke world rather than "Kenney".
3. **Compress:** `gltf-transform` (MIT) with Meshopt geometry and KTX2/WebP textures.
4. **Ship small:** one GLB per chapter, about 0.5–1.2 MB each, 6 MB total. Each chapter streams when the one before it is on screen.
5. **Bake light later:** baked light maps in Blender are a phase 2 option. We start with HDR + ambient occlusion in real time.

---

## 5. Tilt to scroll (phones)

- **Turn on:** a **Tilt to scroll** toggle. It's off until tapped; on iOS the tap also asks for motion permission.
- **Calibrate:** when it's turned on, however you're holding the phone becomes "level". It re-levels each time you lift your finger.
- **Direction:** tilt the top edge **away** from you (forward) to scroll **down**; tilt it **toward** you (back) to scroll **up**. One constant flips it if it feels inverted on a real device.
- **Feel:**
  - a **6° dead zone**;
  - speed eases in, up to about 1,600 px/s at 24° or more;
  - smoothed, stopping at the page ends;
  - **paused while a finger is on the screen**, so it never fights a swipe.
- **Feedback:** a small tilt meter in the HUD, and a haptic tick at each chapter boundary.
- **Look-around stays:** left/right tilt still turns the camera slightly; only forward/back drives the scroll.
- **Reduced motion:** never auto-enables, and the toggle is always visible.

---

## 6. Quality upgrades that serve this story

Picked from `round-trip-next.md`:

1. **Adaptive quality:** GPU tier detection at start, then a frame-time governor that steps the pixel ratio and switches AO and depth of field.
2. **Post-processing:** pmndrs `postprocessing` with N8AO (half resolution), SMAA, AgX tone mapping, mip-chain bloom, and **depth of field that racks focus to the object proving each claim**.
3. **Lighting:** HDRI environment plus one key light per diorama, and emissive windows/screens. **Wet-street reflections** in the Tata city.
4. **Directed camera:** GSAP timelines scrubbed by scroll (establish → close-up → number → transition) instead of today's constant glide.
5. **Character animation:** AnimationMixer clips (walk, run, jump, wave, thumbs-up) blended by speed, so the robot reacts to scroll speed and to each rescue.
6. **Sound:** CC0 foley per chapter, placed in space; still off until switched on.

---

## 7. Text diet (rules)

- **On screen:** company · role · dates (small), **one big number**, and **one caption of 12 words or fewer** per beat.
- **Elsewhere:** full bullets live behind **Details** (real HTML, accessible, indexed) and on `/about`.
- **Animation does the explaining:** if a beat needs a paragraph, the beat is wrong.

---

## 8. Budgets and gates (unchanged where they exist)

- **JavaScript:** first-load JS ≤ 120 kB. The 3D chunk (three + GSAP + world) is ≤ 320 kB gzipped and fetched on idle.
- **Models and textures:** ≤ 1.2 MB per chapter, streamed; about 6 MB total.
- **Frame rate:** 60 fps on desktop and ≥ 45 fps on mid-range phones (the governor enforces it).
- **Page metrics:** LCP stays the HTML poster; CLS stays ~0.
- **Lighthouse:** ≥ 90 on all four categories for `/`.
- **Accessibility:** WCAG 2.2 AA. All facts in HTML, keyboard chapter rail, reduced-motion path, captions.

---

## 9. Build order (each step ships)

| Milestone | Scope | Done when |
| --- | --- | --- |
| **M0 · Data** (short) | `site.ts` + `SOURCE_OF_TRUTH.md` with the table above; `/about` reads from `site.ts`; projects swapped; deploy. | Every fact traces to LinkedIn, the resume or your message. |
| **M1 · Vertical slice** | Asset pipeline + the **Cashfree chapter** end to end: robot, rule gate, KYC reconnect, lighting, directed camera, captions, Details, and **tilt-to-scroll**. | Screenshots at 375 and 1280 px, judged by you. **Checkpoint: you approve the look before the rest.** |
| **M2 · Chapters** | Hero desk, Tata 1mg (two chapters), Moresand, Amby, o9 if kept. | All facts covered; ≤ 12 words per beat. |
| **M3 · Workshop + 200 OK** | Five project toys and the delivery finale. | Every project links to its repo. |
| **M4 · Polish** | Foley, transitions, governor tuning, Lighthouse/a11y, deploy. | All gates in §8. |

## 10. Risks

- **CC0 kits can look generic.** Mitigation: one palette, our lighting and post, and code-built hero objects (cards, dials, bulbs) as the stars.
- **Scope.** Ten-plus vignettes is a lot. Mitigation: build the M1 slice first and stop if the look isn't right.
- **Tilt feel** varies by device. Mitigation: dead zone, smoothing, a flip constant, test on a real iPhone and Android.
- **Weight on phones.** Mitigation: per-chapter streaming, KTX2, LOD and the governor.

## Decisions I need from you

1. **Include o9 Solutions** (Jun – Dec 2021, LinkedIn only)? Default: yes.
2. **Years of experience** on the site: "4.5+" (LinkedIn) or "5+"? Default: "5+" if o9 is in.
3. **Conflicts in §1.2:** keep my defaults (resume wins)?
4. **Amby Tech:** location (Bengaluru?) and any highlights you want shown? Default: role and dates only.
5. **Projects:** Eidos, MCP UI studio, Spatial, Sidecar, Video Light Sync (drop Mouse Follow)?
6. **OK to download the CC0 packs above and add GSAP?** About 20–30 MB of source packs, ≤ 6 MB shipped.

## Sources

- **rea evidence:** `docs/v2-research/references.md`, `teardown.md`, `game-teardown.md`; today `ev_b0303300c1f…` (Oryzo), `ev_481848c395d…` (Lando Norris), `ev_aee3ecc31bd…` (Coastal World).
- **Assets and licences:**
  - [Kenney Factory Kit](https://kenney.nl/assets/factory-kit) and [City Kit Commercial](https://kenney.nl/assets/city-kit-commercial) (CC0)
  - [Kenney 3D assets](https://kenney.nl/assets/category:3D)
  - [RobotExpressive README](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive) (CC0)
  - [Quaternius LowPoly Robot](https://quaternius.itch.io/lowpoly-robot), [Sci-Fi Essentials Kit](https://quaternius.com/packs/scifiessentialskit.html) and [Ultimate Modular Sci-Fi](https://quaternius.com/packs/ultimatemodularscifi.html) (CC0)
  - [Poly Haven license](https://polyhaven.com/license) (CC0)
  - [Poly Pizza](https://poly.pizza/search/laptop)
  - [Kenney Furniture Kit on OpenGameArt](https://opengameart.org/node/80260)
- **Libraries:**
  - [GSAP README (plugins now free)](https://cdn.jsdelivr.net/npm/gsap@3.15.0/README.md)
  - [pmndrs postprocessing](https://cdn.jsdelivr.net/npm/postprocessing@6.39.4/README.md)
  - [N8AO](https://github.com/N8python/n8ao)
- **Tilt permission:** [Chromium: DeviceOrientation permission API](https://groups.google.com/a/chromium.org/g/blink-dev/c/ckd2rFmT3PA/m/YNiz6AREAQAJ)
- **Amby Tech:** [ambytech.com](https://ambytech.com/) (read only for context; nothing from it is presented as your work).
