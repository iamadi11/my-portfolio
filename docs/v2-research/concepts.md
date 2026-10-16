# /v2 concepts: a bobblehead of Aditya as the star

Director notes for the `/v2` rebuild, written 2026-10-15. Five concepts, scored, one recommended, with a storyboard, cheap tricks and an asset list.

- **Content authority:** `SOURCE_OF_TRUTH.md` through `src/content/site.ts`. Every label, box print and spoken line below comes from `SITE` or from the existing `buildScript()` lines in `src/components/host/script.ts`. Lines that are new are marked **(new template string, no facts)**.
- **Rules followed:** `.cursor/skills/portfolio-craft/` (SKILL, concepts, assets, engineering, review). The user asked for five concepts, not the skill's three.
- **Supersedes:** the concept in `docs/v2-realistic-3d-brief.md` (Capture Stage, realistic LAM head). Its engineering constraints still apply and are reused below.

---

## 0. Decision on one screen

| | |
| --- | --- |
| **Recommended** | **Collector's Edition.** Aditya is a limited-edition collectible bobblehead. The first screen is his toy box with a flat, printed cut-out of him in the window. **Start** inflates the cut-out into the 3D toy, which hops out and lands with a wobble. Every section after that is another box: it unfolds into a playset that demonstrates one project, then folds itself back onto a collector's shelf. That shelf is the navigation. |
| **Why it wins** | A bobblehead is a real object: a painted resin toy. Rendering it as a real toy under studio light makes it feel real, with no uncanny valley. That was the owner's complaint about the LAM head. The toy-box idea explains the 2D→3D start, the bobble physics, the printed face, the simple animation and the sound. In a toy world, rounded primitives are honest: wooden trains, building bricks, marbles and rubber ducks really are made of them, so code-built props read as real instead of as a tutorial. |
| **3 wow moments** | 1. **Pop-out:** the flat cut-out inflates into the 3D toy, which bursts out of its box (Start). 2. **Unfold:** each box unfolds flat and its playset springs up from the cardboard (4 times, with different machines). 3. **Flick:** grab the bobblehead and it wobbles on a real spring, with a "boing" whose pitch follows the physics. |
| **Character pipeline** | A 2D turnaround from the owner's photos, approved first. Then two generated parts: a rigged body with up to 10 clips (Meshy or Tripo, humanoid auto-rig), and a separate head bust attached to the neck bone on a spring. The face is a printed decal atlas (eyes, brows and 7 mouths) driven by the existing viseme JSON. The glasses, base and spring are built in code. |
| **Not used** | The LAM head and its renderer (−1 WebGL context, −~323 KB gzip chunk per the earlier brief). A physics engine: Rapier's WASM measured at **1.17 MB gzip** (0.85 MB brotli), and the compat build at **1.65 MB gzip**. Springs and simple kinematics cover every interaction here. |

---

## 1. Research

### 1.1 What the "wow" 3D sites of 2025–2026 do

| Site | Recognition (source; status) | What creates the wow | Take for /v2 |
| --- | --- | --- | --- |
| **Lando Norris** (OFF+BRAND), landonorris.com | Site of the Year and Users' Choice on the [Awwwards winners page](https://www.awwwards.com/annual-awards/winners), which prints no year (listing badges say 2025). SOTD 17 Nov 2025, score 8.18; top dev sub-score Animations/Transitions 8.60 ([Awwwards](https://www.awwwards.com/sites/lando-norris)). Tags: WebGL, GSAP, Webflow. **Verified on the pages.** | One person at the centre, a strict two-colour palette (#D2FF00 / #111112), and transitions that carry the experience. | A person can be the subject of an award site. Transitions are the product. Use one accent colour. |
| **Messenger** (abeto), messenger.abeto.co | Developer Site of the Year on the same winners page. Released 25 Sep 2025 ([Wikipedia](https://en.wikipedia.org/wiki/Messenger_(video_game))). **Verified.** | A tiny planet with its own rules. A cel-shaded character whose clothes and hair you can change, live multiplayer, and 3D emoji ([80.lv](https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game)). | **Stylised character done well:** one coherent world, one light logic, and a character you play with. Small scale reads as charming, not cheap. |
| **Bruno Simon folio-2025**, bruno-simon.com | [Awwwards case study](https://www.awwwards.com/brunos-portfolio-case-study.html), dated 11 Mar 2026. No award is named in it. Code is MIT, music CC0 ([repo](https://github.com/brunosimon/folio-2025)). | Same concept as the 2019 car game, much bigger. Three.js running WebGPU when available, with TSL shaders. Wind on everything, weather and day/night, spatialised object sounds, and a vehicle with engine, tyre, boost and horn sounds. 38 achievements, "Whispers" messages, a leaderboard. Mobile drops to a lower preset (no water blur or DOF, smaller shadows). | **Physics and sound you can touch beat scenery.** An avatar the visitor drives is the hook. Have a mobile preset from day one. The engine is **Rapier** per a secondary summary ([GeekNews](https://news.hada.io/topic?id=24963)); **unverified**, since the README does not name it. |
| **Igloo Inc** (abeto × Bureaux) | SOTY 2024 per the earlier brief (not re-checked). [Case study](https://awwwards.com/igloo-inc-case-study.html) read. | Worlds blend through chromatic aberration, displacement and a frost effect. The intro is real-time and in-engine. Sound is timed to particle motion. UI text scrambles by shifting an SDF texture offset. Shaders and textures compile during load and in the background. Only three sections. | **Transitions between worlds** sell the jump. Sync sound to motion. Pre-compile shaders. Keep the section count low. |
| **Cartier Watches & Wonders** | SOTD per [Utsubo](https://www.utsubo.com/blog/best-threejs-websites-2026) (an interested party); [Awwwards case study](https://www.awwwards.com/watches-wonders-immersive-experience-for-cartier.html). The 2025 studio is **unverified**. | Six self-contained 3D alcoves, one per watch, with GLSL, GSAP, Lenis and a Web Audio score. | **One subject per set, with its own light.** This is the model for "one playset per project". |
| **Oryzo** (Lusion) | Reported Awwwards Site of the Month, Apr 2026, by Utsubo. **Unverified.** | One product rendered with inertia and weight, plus Z-axis depth scrolling. | **Realism comes from one object's material and motion.** That is the toy on the turntable. |
| **Lusion Labs** | SOTD 1 Jun 2023 ([Awwwards](https://www.awwwards.com/sites/lusion-labs)). | A playground of real-time R&D toys. | Small interactive toys can be the whole site. |
| **Active Theory** | It runs an in-house WebGL framework ("Hydra"), according to a forum commenter ([DEV](https://dev.to/charithdesign/what-is-the-technology-used-in-this-website-and-what-would-be-the-ideal-solution-to-create-the-same-53d)). **Unverified.** | Studio benchmark for scene transitions and particle work. | Nothing specific; noted for completeness. |
| **Sleep Well Creative / Explore Primland** | Reported SOTD Jan and Feb 2026 by Utsubo. **Unverified.** | A scroll-driven illustrated 3D narrative / a terrain flythrough in fog. | Scroll-driven camera paths are now the baseline, not the wow. |

### 1.2 Sites led by a character or mascot

| Reference | What it does | Status |
| --- | --- | --- |
| **Messenger** (above) | You are a stylised character in a tiny world. Customisation and emoji make it personal. | Verified award. |
| **Oat the Goat** (Assembly × FCB NZ) | An interactive WebGL storybook with fully rigged, animated 3D characters. It used older game-dev tricks to run on 2018 phones ([Awwwards SOTM June 2018](https://awwwards.com/oat-the-goat-by-assembly-wins-site-of-the-month-june.html), [Assembly](https://www.assemblyltd.com/work/oat-the-goat)). | Verified. Old, but still the clearest proof that a character can carry a whole WebGL site. |
| **Toca Boca Days** (Fully Studios) | Awwwards element "Interactive 3D character", tagged three.js ([Awwwards](https://www.awwwards.com/inspiration/interactive-3d-character-toca-boca)). | No award or date shown. |
| **Bike Time footer** (Face44), **Qream** | Small 3D mascots that react to the mouse ([Bike Time](https://www.awwwards.com/inspiration/3d-mascot-and-directions-in-footer-design-bike-time), [Qream](https://www.awwwards.com/inspiration/main-page-mascot-mouse-interaction-qream-design-agency-1)). | Inspiration elements, not awards. These show the cheap end: a mascot as a widget. |
| **Duolingo characters** (Rive) | Mouth states run **in parallel** with body states in one state machine. There are 20+ mouth shapes, with viseme timing derived from TTS audio through speech recognition. Idle blinks and nods run alongside, and a reaction state plays at the end ([Duolingo blog, Nov 2022](https://blog.duolingo.com/world-character-visemes)). | Primary source. **The best-documented production pattern for a stylised talking character.** We already have the viseme timings (`public/voice/*.json`, Oculus ids), so a printed-mouth atlas is the direct equivalent. |
| **"Nano Banana" figurine trend** | In September 2025, Gemini 2.5 Flash Image turned selfies into 1/7-scale collectible figurines, often shown next to their toy box. Reported at hundreds of millions of images, and big in India ([Decrypt](https://decrypt.co/338994/how-use-google-nano-banana-ai-transform-selfies-digital-figurines), [The Week](https://www.theweek.in/news/sci-tech/2025/09/11/after-ghibli-barbie-box-nano-banana-trend-goes-viral-how-you-can-join-in.amp.html)). | Image counts come from secondary reports of Google statements: **unverified**. The useful point is that "me as a collectible toy in its box" is instantly legible to a 2026 audience, especially recruiters in India. |

**Gap found:** no verified award-winning portfolio was found where a *stylised likeness of the owner* guides the visitor (Awwwards inspiration and mascot tags, Codrops, the three.js forum). That is an open lane, but also an unproven one, so the character has to be good, not just present.

### 1.3 Techniques that create wow

1. **One retellable transformation, early.** Examples: Igloo's in-engine intro, Bruno's car dropping onto the island, and the figurine trend's "photo → toy". The visitor should be able to say it in one sentence.
2. **Physics the visitor can touch, answered by sound.** Bruno: everything is knockable and has its own sound. Igloo: sound timed to particle speed. Weight is sold by sound as much as by motion.
3. **Transitions that hide a world swap.** Igloo uses frost, displacement and chromatic aberration; Lando's top-scored dev category is transitions. A good transition is a physical event (a door, a fold, a flurry) that covers the cut.
4. **A coherent stylised world.** In Messenger, one light direction, one shading model and one scale make "cartoon" read as crafted.
5. **A character with layered states.** Duolingo layers idle (blink, breath) + body pose + mouth + reaction, so the character never freezes.
6. **One subject per set, with its own light** (Cartier's alcoves) instead of one big scene that contains everything.
7. **Restraint.** Igloo has three sections and Lando two colours. Fewer, better beats.
8. **Engineering as craft.** Shaders pre-compiled during load (Igloo), quality presets per device (Bruno), real-time instead of video.

### 1.4 What reads as cheap (characters especially)

- An avatar in a void doing Mixamo dances, sliding feet, a T-pose, or a breathing loop as its only life.
- **Generated-mesh tells:** lighting baked into the albedo, melted fingers, warped glasses frames, texture seams, lumpy silhouettes. Meshy now has `remove_lighting` ([changelog](https://docs.meshy.ai/api/changelog), 28 Feb 2026). Glasses should be built in code.
- **An uncanny near-real face:** the LAM lesson. Stylised beats almost-real.
- `MeshToonMaterial` with two bands, no rim and no outline; inconsistent light direction between the character and the set.
- A character floating with no contact shadow, or a mascot used as a widget next to a normal page.
- Everything wobbling on one sine wave; linear easing; scroll-jacked letter-by-letter text.
- Neon on black, over-bloom, particle fields as identity, a planet with orbiting tech logos, an isometric "my room" cube. The last two are the most common tutorial portfolios.
- A box-art or packaging idea done with a plain brown box and no print. Packaging only works when it looks printed.

### 1.5 Making the bobblehead: what the APIs can do (checked 2026-10-15)

| Route | Facts (source) | Fit |
| --- | --- | --- |
| **Meshy API** | Image-to-3D: `meshy-7.1`, `remove_lighting`, `pose_mode` A/T, `texture_resolution` 2k/4k/8k, Smart Topology `meshy-t2` with `target_polycount`, multi-image (1–4 views). **Rigging: "only works well with standard humanoid (bipedal) assets"**, the face must point to +Z, textured meshes only, GLB/FBX out, walk and run clips included ([rigging](https://docs.meshy.ai/en/api/rigging)). Animation: `action_ids` applies up to 10 presets into one GLB at 3 credits each, plus a free library endpoint, categories WalkAndRun / BodyMovements / DailyActions / Fighting / Dancing, and Text to Motion for bipeds ([animation](https://docs.meshy.ai/en/api/animation)). **Licence:** Free plan output is CC BY 4.0 (credit required); paid plans give private ownership ([pricing](https://docs.meshy.ai/en/webapp/pricing), [FAQ](https://intercom.help/meshy/en/articles/16102098-can-i-use-meshy-assets-commercially)). | **Primary.** One key covers model, rig and clips. |
| **Tripo API** | Image → model → rig check → rig → retarget to preset animations, with a `face_limit` (e.g. 5000 for real-time) ([quick start](https://developers.tripo3d.com/zh/docs/quick-start)). Its ComfyUI nodes list stylisation, rigging and retargeting ([nodes](https://developers.tripo3d.com/en/docs/comfyui-nodes)). | **Second candidate** for the A/B comparison. |
| **Hyper3D Rodin** | Not researched this pass. | Third candidate if the first two miss on likeness. |
| **Hunyuan3D 2.x** (open weights) | The Tencent Hunyuan Community licence **excludes the EU, UK and South Korea** ([LICENSE](https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE)). 3.x is API-only (secondary sources). | Avoid for a reusable template. |
| **TRELLIS.2** (Microsoft) | MIT, 4B parameters, PBR-textured meshes; needs Linux and a ≥ 24 GB NVIDIA GPU; meshes may have small holes ([model card](https://huggingface.co/microsoft/TRELLIS.2-4B)). | Free fallback with a rented GPU. |
| **2D stylisation step** | Gemini 2.5 Flash Image ("Nano Banana"), ChatGPT images, or Meshy Image-to-Image (it chains into image-to-3D via `input_task_id`, per the changelog of 21 Apr 2026). | Makes the turnaround the owner approves **before** any 3D spend. |

**Implications for the design:**

- **The bobblehead is built in two parts, like a real one.** Big-head proportions risk failing a humanoid auto-rig ("unclear limb and body structure" is listed as unsuitable). Generate:
  - a **body** at toy proportions with a normal-sized head, A-pose; rig it and give it ≤ 10 clips
  - a separate **head bust** that rides the neck bone on a spring

  Hide the body's own head by scaling its head bone to ~0. **Untested: prove it in the first spike.**
- **The face is a printed decal atlas, not blendshapes.** Real bobbleheads have pad-printed eyes and mouths. Generated meshes ship without visemes, and an atlas swap is always on-model and crisp. It is driven straight from `visemes`/`vtimes` in `public/voice/*.json`.
  - This deliberately departs from the skill's blendshape default (`assets.md` lists the atlas as the fallback).
  - Generate the head from a "blank face" variant of the turnaround: hair, nose, moustache and beard kept; eyes, brows and mouth painted out.
- **Glasses are built in code.** Generators mangle thin translucent frames. A rounded-rect `Shape` extruded with a bevel, in a grey translucent material, matches the photo's frames and stays sharp at every size.
- **Likeness anchors for the 2D prompt** (from `public/profile_pic.png`):
  - short, textured black hair swept up at the front, shorter sides
  - grey translucent rectangular glasses
  - moustache and short beard
  - a broad, toothy smile
  - a black crew-neck tee

  The lower body is not in the photo; the owner approves whatever styling is drawn. Ask the owner for ¾ and profile photos too (the skill's photo list).

### 1.6 Measured locally (2026-10-15)

- `@dimforge/rapier3d@0.21.0` WASM: 3,082,103 B raw, **1,168,722 B gzip, 852,125 B brotli**.
- `@dimforge/rapier3d-compat@0.21.0` `rapier.mjs` (WASM inlined): 4,340,292 B raw, **1,652,936 B gzip**.
- These are why no concept below depends on a physics engine, except Tilt Table, which pays for it.
- `postprocessing@6.39.5`: peer `three >= 0.168 < 0.187`. Its type exports include **`TiltShiftEffect`**, **`ShockWaveEffect`**, `OutlineEffect`, `SMAAEffect` and `ToneMappingEffect` (checked in `build/types/index.d.ts`).
- `@react-three/postprocessing@3.2.0` requires `@react-three/fiber >= 9.7.0`; 9.6.1 is installed. Use vanilla `postprocessing`.
- `three@0.184` ships `RoomEnvironment` (`examples/jsm/environments/`): a zero-byte studio environment for glossy toy reflections.
- Reusable in the repo:
  - `public/voice/*.json` already holds Oculus viseme ids with times and durations, for 64 lines (2.5 MB including MP3s)
  - `host/script.ts` builds the tour and Q&A intents from `SITE`
  - `host/useGuideInput.ts` has push-to-talk (`useListen`)
  - `host/audio.ts` has `Voice`

### 1.7 Claims not verified (do not cite as fact)

- The Awwwards 2025 winners year: the page shows no year; the listing badges do.
- Oryzo SOTM, Sleep Well and Primland SOTD, Cartier's 2025 studio, and Igloo SOTY 2024 (not re-checked this pass).
- Rapier as Bruno Simon's engine (secondary source only).
- Active Theory "Hydra" (forum comment).
- Nano Banana image counts (secondary reports).
- Meshy per-credit prices in money, and the exact animation preset names (wave, point and hop are assumed to exist; check `GET /openapi/v1/animations/library`).
- Whether a big-head body auto-rigs cleanly on Meshy or Tripo. This is **the riskiest unknown**.
- Upload retention and training terms for photos on each provider.

---

## 2. What all five concepts share

- **The HTML layer is the content.** It holds one `h1` (name), the role and location, the availability, and a persistent top nav: **Work · Experience · Skills · Contact**, a "2D site" link to `/`, a sound toggle, and **Ask** (push-to-talk + type, reusing `useListen` and the script intents).
  - Every project has an HTML sheet: summary, stack, Code/Live/npm links.
  - The canvas is `aria-hidden`.
- **Recruiter < 5 s:** the name, role, Work and Contact are real HTML in the first paint, before any 3D or click. Nothing waits on the Start key.
- **Under 15 words of visible prose per screen.** Captions are chunked to ≤ 8 words at a time and timed to the audio. Details live in the sheets.
- **Common character behaviour:**

| Trigger | Response |
| --- | --- |
| Idle | Blink every 2–6 s. Breathing at spine scale 1 ± 0.01. A weight shift every 4–7 s. Low-frequency noise micro-nods. Never a sine-only bob. |
| Pointer (fine) | Head yaws and pitches toward the pointer (lag λ = 8, clamp ±25°). Pupils follow by UV offset. |
| Click, tap, flick, or key **B** | A bobble impulse in the direction of the flick, a surprised eye state, and a short "whoa" **(new template string, no facts)**. |
| Speaking | The mouth atlas follows the audio clock. Each stressed vowel (`aa`, `O`, `E`) adds a 0.04 rad head nod impulse: a bobblehead talks by bobbling. |
| Section change | It turns, points or hops toward the next set piece; the camera follows its gaze. |
| Hidden tab, reduced motion | A designed rest pose with a smile and the head still. |

- **Motion tokens:**
  - feedback 120 ms
  - camera damping λ = 4
  - ease `cubic-bezier(0.2, 0.8, 0.2, 1)`
  - stagger 60 ms
  - bobble spring K = 140, C = 6 (ζ ≈ 0.25, about five visible wobbles; the skill's C = 10 is stiffer than a real bobblehead)
  - pop spring K = 220, C = 14
- **Tiers** follow `engineering.md`: A, B, and C (stills + voice).
- **Template:** another SDE regenerates their own figure through the same pipeline. Everything printed or spoken comes from their `SITE`.

---

## 3. Five concepts

### Concept 1: Collector's Edition (recommended)

Aditya ships as a limited-edition collectible. The site is a toy launch: a box, a toy that pops out, four playsets (one per project), a shelf of earlier editions (experience), a parts sprue (skills), and a "now available" finale (contact). Everything is a real-feeling toy under soft studio light: painted resin, printed card, varnished wood, ABS bricks, glass marbles, rubber ducks.

- **World:** an infinite white-to-warm-grey photo cyclorama, table-top scale (the figure is about 18 cm tall). Light is a large key softbox, a rim strip and fill from `RoomEnvironment`. Contact shadows everywhere. Tilt-shift miniature focus on the playsets. One accent colour for the box print, sticker and active nav: **signal orange `#FF5A1F`**, on bone white `#F4F1EA` and ink `#151515`.
- **Character:** the bobblehead on a round plinth with a nameplate (name + role from `SITE`). The face is a printed atlas; the code-built glasses are grey and translucent. In the first frame he is a **flat printed cut-out** in the box window. He is alive: his eyes follow the cursor, he blinks, and the flat card wobbles on a spring when tapped.
- **First 5 s:**
  - 0 s: an HTML poster of the box front. The name, role and city are HTML laid over the printed face; an "Open to new roles" sticker; the Start key.
  - About 1–3 s: the live canvas swaps in invisibly from the same camera, and the cut-out starts to blink and track.
  - Start: the **Pop-out** (storyboard §5, S2), with sound.
- **Signature transformation:** the flat cut-out inflates into the 3D toy (z-scale 0.02 → 1.12 → 1) as the box tilts open in a dolly zoom. The toy hops out of the window and lands on a turntable, and the landing sets the head wobbling. The box then unfolds flat to become the studio floor.
- **Journey:**
  - **Intro:** the greeting on the turntable.
  - **Work:** four sealed playset boxes in an arc. The figure points to the first one.
  - **Each project:** the camera pushes into its box. The box **unfolds** and the playset pops up from the cardboard; the figure hops in, gestures and voices the project line.
    - **Eidos → Offline Rail Yard** (router). A varnished wooden train loop runs from a PAGE station through a NETWORK tunnel. HTML button "Cut the network" (`aria-pressed`): a felt storm cloud drops onto the tunnel and the signal goes red. The figure throws the points lever, and wagons divert to a CACHE depot and come back loaded. The line never stops.
    - **mcp-ui → UI Brick Kit** (assembler). HTML buttons "Build a form", "Build a card", "Build a list" **(new template strings, no facts)**. Bricks with printed UI glyphs (button, field, toggle, avatar) drop from a hopper, bounce on kinematic arcs and snap into a layout on a baseplate. The snaps play in a rising pitch sequence. A click on the baseplate knocks it apart for a rebuild.
    - **spatial → Jank Detective marble run** (inspector). Each marble is **one real frame of this page** (rAF ring buffer). Marbles pass a 16.7 ms gate; slower frames tip a flap into a red cup. The figure's magnifier tracks the flagged marble. HTML readout: "Your device: p75 N ms", measured live. If no frame is slow, the cup stays empty: an honest result.
    - **Mouse Follow → Duckling Parade** (tracker). Five rubber ducks on a blue felt pond follow the pointer in a spring chain, which is exactly what a mouse-follow component does. The figure's head follows too. Touch: drag. Keyboard: arrows move a target.
    - Leaving a playset, it folds back into its box, and the box slides onto the **collector's shelf** (the nav).
  - **Experience → "Previous Editions":** the camera dollies along a wall shelf of four older boxes, newest first: Cashfree Payments · Frontend Engineer II; Moresand Technologies · Software Engineer; Tata 1mg · SDE II; Tata 1mg · SDE I.
    - Each box holds an instanced LOD copy of the figure. Org names are printed large and years small; no company logos or brand colours.
    - A pencil "prototype sketch" card stands for IIIT Lucknow 2017–21.
  - **Skills → "Parts sprue":** five model-kit sprues, one per `practice.skills` group, each part a labelled chip.
    - The figure snaps off the six skills his line names. Click any part to snap it off with a click; it drops and bounces (simple sphere-plane kinematics).
    - No proficiency bars.
  - **Contact → "Now Available":** the hero box re-forms and the figure climbs on top. An "Open to new roles" sticker slaps on.
    - He holds out a printed card. The HTML keys Email · LinkedIn · GitHub · Phone sit over the card (all real `mailto:`/`tel:`/links).
- **Camera path:** see the storyboard. 85 mm near-orthographic → 35 mm dolly zoom at Start. 50 mm on the turntable, 35 mm crane for the overview, 50 → 40 mm push-in and ¾ top-down per playset, a 50 mm truck along the shelf, an 85 mm macro on the sprues, and a 50 mm pull-back for contact. No roll; composition by lens shift.
- **Play:**
  - flick the head (pointer velocity → angular impulse; key B)
  - cut the network (button)
  - knock the brick UI over
  - snap sprue parts
  - lead the ducks
  - tap the box in the first frame for a 2D wobble

  None of it is needed to read anything.
- **Reply:** the HTML contact keys. In the world, the figure holds out the card and the 3D keys depress in sync.
- **Sound:**
  - tape rip, cardboard flap thumps, and a "pop" on inflate
  - a **spring boing whose pitch follows head angular velocity**
  - wooden rail clacks (gain by speed), a points-lever clunk
  - ABS snaps, marble rolls (low-passed noise by velocity), duck squeaks
  - a sticker "thwack"
  - soft studio room tone
  - the existing voice, with captions

  All SFX are procedural Web Audio; nothing plays before Start.
- **Phone (375):** the figure in the upper 55%, about 220 px tall. The HTML sheet is a bottom sheet; the dock shows five mini boxes (44 px). Playsets are framed higher (40 mm, 45° down).
  - Cut: tilt-shift (replaced by a cheap vignette blur), transmission on glasses and blister plastic (opacity instead), and confetti count halved.
  - Optional tilt-to-bobble via `DeviceMotionEvent` behind an explicit toggle (iOS permission).
- **Cost:**
  - **Tier A:** one skinned figure (≤ 40k tris) and one playset at a time (≤ 40 draws, instanced). One shadow light (1024) plus contact shadows. SMAA, AgX, tilt-shift.
  - **Tier B:** LOD figure (≤ 20k), 512 shadows, no tilt-shift, dpr 1.25.
  - **Heaviest asset:** the body GLB with 10 clips (target ≤ 1.5 MB after meshopt + KTX2, estimate).
  - **No physics engine.**
- **First-screen words:** "Aditya Raj" (2) + "Frontend Engineer II · Bengaluru" (4) + "Open to new roles" (4) + "Start · sound on" (3) = **13**, nav excluded.
- **Assets:** §7.

### Concept 2: Dashboard Co-Pilot

The bobblehead rides on a car dashboard on a night drive. The visitor sits in the passenger seat; the windshield frames a toy-scale city, and the car's motion makes the head bobble, which is the most natural justification for bobble physics.

- **World:** a car cabin at night, lit by the instrument cluster and passing street lights. Outside, a miniature looping road with stylised buildings and fog.
- **Character:** the bobblehead suction-cupped to the dashboard, facing the passenger. In the first frame he is a flat **dashboard sticker** of himself.
- **First 5 s:** the HTML poster shows the dashboard and sticker. Start = ignition: starter crank, the cluster needles sweep, the sticker inflates into the 3D figure, the car pulls away, and the acceleration throws his head back.
- **Signature transformation:** sticker → figure at ignition.
- **Movement and reactions:**
  - acceleration, braking, turns and speed bumps drive the spring (body acceleration input)
  - he watches the pointer and speaks like a satnav: "Next exit: Eidos" **(new template string)**
  - a flick works as in §2
- **Journey:** each project is a roadside attraction seen through the windshield.
  - **Eidos:** a tunnel where the network drops (radio static); the car's map keeps working from cache.
  - **mcp-ui:** a billboard whose panels assemble on request.
  - **spatial:** a speed camera that flashes on real slow frames.
  - **Mouse Follow:** a searchlight that tracks the cursor across the sky.
  - **Experience:** mile markers.
  - **Skills:** the glovebox opens to tagged parts.
  - **Contact:** arrival; the infotainment screen shows the contact keys.
- **3 wow moments:** ignition pop; the tunnel blackout with the map still working; the speed-bump wobble.
- **Recruiter:** HTML nav plus the infotainment screen mirroring it.
- **Phone:** a landscape windshield is cramped in portrait, so the composition becomes a phone-mount view. It is a different, weaker shot.
- **Cost:** high. A moving world with continuous streaming and fog, and a cabin model (generated or code-built). Tier B needs a short draw distance.
- **Assets:** the figure; a car interior (generated, about 1–2 MB, or code-built); a road and city kit (code-built, instanced); street-light glows.
- **First-screen words:** "Aditya Raj" (2) + "Frontend Engineer II · Bengaluru" (4) + "Start the drive · sound on" (5) = **11**.

### Concept 3: Pop-Up Book

A big hardcover pop-up book on a desk under a lamp. Each spread pops up a paper diorama; the bobblehead toy hops across the pages as narrator.

- **World:** a warm desk lamp pool, a cloth-bound book, matte paper with visible fibres and soft AO under the folds.
- **Character:** the vinyl toy. In the first frame he is an illustration printed on the cover.
- **First 5 s:** the HTML poster is the book cover. Start: the cover swings open with a whoosh, the first spread rises on V-folds, and the printed figure **peels off the paper** and inflates into the toy, which lands on the page.
- **Signature transformation:** the peel-off and inflate.
- **Movement and reactions:** he hops from fold to fold, sits on the page edge, and pushes the page corner to turn it. Flick and pointer work as in §2.
- **Journey:** one spread per section; turning the page is the world transition, since the page sweeps across the camera and hides the swap.
  - **Eidos:** a pull-tab cuts a paper bridge (the network) and a paper post office flips up to keep delivering (cache).
  - **mcp-ui:** a tab raises layered paper panels into a UI.
  - **spatial:** a volvelle (a rotating paper wheel) whose needle reads real frame times.
  - **Mouse Follow:** a paper bird on a pivot wire that follows the cursor.
  - **Experience:** tabbed chapter dividers.
  - **Skills:** a sticker sheet.
  - **Contact:** an envelope pocket on the last page with a card.
- **3 wow moments:** the book opening as the first spread rises; peel-off; the page-turn transition.
- **Recruiter:** HTML nav plus a table of contents.
- **Phone:** a single page in portrait; the spread becomes one page and a turn.
- **Cost:** low GPU (paper is planes), high build. Pop-up hinge kinematics are fiddly, and every spread needs consistent illustrated print art. Incoherent AI art would be the cheap tell.
- **Assets:** the figure; page illustrations (many, consistent style); paper textures (generated in code); code-built mechanisms.
- **First-screen words:** "Aditya Raj" (2) + "Frontend Engineer II · Bengaluru" (4) + "Open the book · sound on" (5) = **11**.

### Concept 4: Tilt Table

A portrait pinball table themed on Aditya. The bobblehead is mounted on the playfield like a classic table toy and wobbles with every nudge and bumper hit.

- **World:** a lit playfield under glass, a printed backglass, chrome rails, and an attract-mode light show.
- **Character:** the figure on a spring mount mid-table. In the first frame he is the 2D backglass art.
- **First 5 s:** the HTML poster is the backglass. Start = pull the plunger: the backglass figure drops onto the playfield as the toy and the attract lights chase.
- **Signature transformation:** backglass art → table toy.
- **Movement and reactions:** ball hits and nudges drive the spring; he heckles hits and misses with short lines **(new template strings)**; he watches the ball.
- **Journey:** each target opens its section sheet, but the nav still links everything directly.
  - **Eidos:** a ball lock that holds balls when the "network" gate drops and re-serves them.
  - **mcp-ui:** drop targets that assemble a UI on the backglass.
  - **spatial:** a spinner that reads real frame times.
  - **Mouse Follow:** a magnet that follows the cursor.
  - **Experience:** one ramp per role.
  - **Skills:** rollover lanes.
  - **Contact:** "high score" initials become the contact keys.
- **3 wow moments:** the plunger drop; multiball; a nudge wobble.
- **Recruiter:** the weakest of the five. Many recruiters will not play, and a game invites "gimmick".
- **Phone:** natural, because pinball is portrait. Tap the left or right half for flippers.
- **Cost:** high. It needs a continuous physics engine (Rapier ≈ 1.17 MB gzip WASM, measured) and many lights (fake them with emissive + bloom).
- **Assets:** the figure; a table kit (code-built) and backglass art.
- **First-screen words:** "Aditya Raj" (2) + "Frontend Engineer II" (3) + "Bengaluru" (1) + "Press Start · sound on" (4) = **10**.

### Concept 5: Shake Me (snow globe)

A desk snow globe with the bobblehead inside. Shaking the globe (drag, flick, or device shake) swirls the snow, and the flurry hides each change of diorama: the transition is the play.

- **World:** one glass globe on a wooden base, in a dim room with a window light.
- **Character:** the figure on a tiny base inside the globe. In the first frame he is a flat sticker of a globe.
- **First 5 s:** the HTML poster is the sticker. Start: the glass fills with water (a refraction ramp), the sticker figure inflates, and the snow settles.
- **Signature transformation:** sticker → globe filling with water.
- **Movement and reactions:** a shake gives the biggest bobble; he leans against the glass toward the pointer.
- **Journey:** each section is a diorama swapped inside the globe under a flurry.
  - **Eidos:** a tiny house that stays lit when the power line is cut.
  - **mcp-ui:** snowflakes that settle into UI tiles.
  - **spatial:** a stopwatch whose hand reads real frame times.
  - **Mouse Follow:** the snow follows the cursor.
  - **Experience:** a shelf of four globes.
  - **Skills:** labelled flakes.
  - **Contact:** an engraved plaque on the base.
- **3 wow moments:** the water fill; the shake-swirl transition; the snow following the cursor.
- **Recruiter:** good: one object and a clear nav.
- **Phone:** excellent: one centred object, shake via DeviceMotion.
- **Cost:** transmission glass plus particles; tier B fakes the glass.
- **Risks:**
  - One frame for 10+ sections gets repetitive.
  - The dioramas are tiny, so the set pieces are hard to read.
  - Snow globes read as holiday kitsch.
  - The snow risks being "particles as identity", a cheap tell.
- **Assets:** the figure; globe and base (code-built); four micro-dioramas (code-built).
- **First-screen words:** "Aditya Raj" (2) + "Frontend Engineer II · Bengaluru" (4) + "Shake to start · sound on" (5) = **11**.

---

## 4. Scores and recommendation

Scores are 1–5. For performance and build effort, 5 means cheapest. "Character" is the skill's "how well the character is integrated".

| Concept | Wow / originality | Coherence | Content fit | Recruiter | Mobile | Performance | Build effort | Character | **Total /40** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1 Collector's Edition** | 4 | 5 | 5 | 5 | 5 | 4 | 3 | 5 | **36** |
| 3 Pop-Up Book | 5 | 3 | 4 | 4 | 4 | 4 | 2 | 3 | 29 |
| 5 Shake Me | 3 | 3 | 2 | 4 | 5 | 3 | 3 | 4 | 27 |
| 2 Dashboard Co-Pilot | 4 | 4 | 3 | 3 | 2 | 2 | 2 | 4 | 24 |
| 4 Tilt Table | 4 | 3 | 3 | 2 | 4 | 2 | 2 | 3 | 23 |

**Pick: Collector's Edition.**

1. **It fixes the real complaint.** The LAM head failed because a near-real face is judged as a face. A bobblehead is judged as a toy, and a toy is easy to make look real: painted resin with clearcoat, soft studio light, contact shadows, a printed face.
2. **Every requirement has a reason inside the world.**
   - 2D → 3D is the printed cut-out becoming the toy.
   - The Start button is opening the box.
   - Bobble physics is what the toy does.
   - The printed face matches how real bobbleheads are made.
   - Simple, toy-like animation is in character.
   - Sound is cardboard, wood, plastic and springs: concrete foley, easy to synthesise.
3. **It fits the content exactly.** Four projects become four playsets, each demonstrating its function. Experience becomes "previous editions" (a box per role, newest first, matching the resume order). Skills become a parts sprue (honest: names, no bars). Availability becomes the "Open to new roles" sticker.
4. **Recruiters get it in under a second.** A collectible of a person, with the name on the box, is a format everyone knows, more so after the 2025 figurine trend. The shelf of boxes doubles as the nav.
5. **It is cheap to make look expensive.** One hero object at a time, `RoomEnvironment` for zero-byte reflections, code-built toys whose real-world forms are rounded primitives, and no physics engine.

**Risk, and how it is handled:** "collectible figure" can look like trend-chasing after the 2025 figurine wave. The difference is that this one is live: it unboxes itself, talks, wobbles when flicked, and runs four working machines. That moves it from meme to craft. A second risk is a toy-shop look that is too cute for a senior engineer. Keep the print typography editorial (one grotesk, ink and bone white, one orange accent) and keep the machines functional, not decorative.

**Why the others lose:**

- **Pop-Up Book** has the highest raw wow, but two material stories (vinyl toy vs paper world) compete. It needs a lot of consistent illustration, which is the riskiest place for AI-art tells, and the pop-up mechanisms are the most fiddly build. Books also read as slow storytelling to a recruiter. Steal its **page-turn-as-transition** idea: the box flap swinging past the lens does the same job.
- **Shake Me** is great on a phone but repeats one frame for every section. Its set pieces are too small to read as machines, and snow edges toward "particles as identity". Steal its **cover-the-cut flurry**: cardboard confetti on Pop-out.
- **Dashboard Co-Pilot** has the best physical excuse for bobble, but the car becomes the subject (the Bruno Simon association). Set pieces become backdrops seen through glass, portrait framing is awkward, and a streaming world is the most expensive. Steal **acceleration-driven bobble**: the figure's own hops feed the spring.
- **Tilt Table** gates the experience behind a game, needs ~1.2 MB of physics WASM, and makes the character a table toy rather than a guide. Steal **impulse-scaled foley**.

---

## 5. Storyboard: Collector's Edition

- **Coordinates:** metres, y up. The figure is about 0.18 m tall; the head about 0.08 m. Section ids are the anchors used by the nav.
- **Lines:** quoted lines are today's `buildScript(SITE, HOST)` output unless marked new. Captions show ≤ 8 words at a time.
- **Sound:** "SFX" means procedural Web Audio.

| # | Section / trigger | Camera (lens · framing · move) | Bobblehead does | Says (caption) | Sound | 375 delta |
| --- | --- | --- | --- | --- | --- | --- |
| S0 | `#top`, first paint (0–1 s, no JS) | n/a. HTML poster (AVIF) of the box front from the live camera: box centre-right at 1440, top 60% at 375. | Printed cut-out (the approved 2D front view) in the window. | — | none | Box fills the top 60%; Start sits below the box at 52 px. |
| S1 | Canvas live (after `load` + idle, ≤ 4 s on tier A; `performance.mark('3d-live')`) | 85 mm, about 1.1 m away: near-orthographic, matching the poster exactly. Invisible crossfade after `compileAsync`. | **Alive in 2D.** Pupils track the pointer, blinks, a tiny hop every ~6 s. A tap on the window makes the flat card wobble on its spring. The Start key breathes (2.2 s). | — | none (no gesture yet) | Same; pupils follow the last touch. |
| S2 | **Start** (click, Enter or Space). **Wow 1: Pop-out**, 2.4 s, skippable | t0 → 1.2 s: **dolly zoom**, 85 → 35 mm while moving in to hold the figure's height. The box tilts 12° toward the lens. | 0.0 s: the box shudders. 0.3 s: the flaps spring open (60 ms stagger). 0.4 s: the cut-out **inflates** (z 0.02 → 1.12 → 0.97 → 1, pop spring) behind a 2-frame white pop and a `ShockWaveEffect` ring. 0.8 s: the cardboard backing falls away; the toy hops out of the window in an arc. 1.3 s: it lands on the turntable with squash 0.88, then the bobble runs (≈ 5 wobbles). 1.6 s: the box net unfolds flat into the floor; the studio lights fade up; tilt-shift eases in. | — | tape rip (0.0), flap thumps panned L/R (0.3), rising "pop" (0.4), whoosh (0.8), landing tick + **sonified boing** (1.3), room tone fades in (1.6) | Dolly zoom to 40 mm; confetti 20 instead of 40. |
| S3 | Greeting (auto, 2.4 s) | 50 mm, toy eye level (h 0.09 m), ¾ front, figure at 62% x (lens shift −0.16). 2% push-in. | Waves (clip), eyes to camera, nods on vowels. | "Hi, I'm Aditya, a Frontend Engineer II in Bengaluru." / "Let me show you around." / "Stop me any time, or just ask." | voice (ambience −8 dB) | Figure centred, upper half; captions above the dock. |
| S4 | `#work` (scroll or nav) | Crane up and back to 35 mm, 35° down: four sealed playset boxes in an arc behind the figure. Each box's colour comes from `project.hue`. | Turns and points at box 1. | "Here's my work: 4 projects." / "Let's start with Eidos." | cardboard creak as the boxes settle; tick per marker | 28 mm, boxes in a 2 × 2 grid. |
| S5 | `#eidos`. **Wow 2: Unfold** | Push through the box front (50 mm). The flap wipes past the lens (foreground cover), then 40 mm ¾ top-down 30°, set left (lens shift +0.16), sheet right. | Hops in, presses the points lever. On "Cut the network" he throws the lever (point clip) and watches the trains divert. | "Eidos. A declarative offline-first abstraction layer for Service Workers." / "Built with TypeScript and Service Workers." | flaps unfolding, pop-ups landing (60 ms stagger), rail clacks by speed, felt-cloud "flump", lever clunk, whistle | 40 mm, 45° down, set above the bottom sheet. |
| S6 | `#mcp-ui`. Unfold #2 | Same move, mirrored (set right). | Stands by the hopper. On "Build a form" or "Build a card" he claps (clip); bricks rain and snap. Click the baseplate: the UI collapses, and he shrugs. | "mcp-ui. A dynamic MCP UI generator, built as a full-stack MCP UI demo." / "Built with React, Vite, Node and Express." | ABS clacks (gain by impulse), snap ticks in a rising pitch, hopper rattle | Hopper above, baseplate below. |
| S7 | `#spatial`. Unfold #3 | 50 mm, slight low angle up the marble run; slow crane down following the marbles. | Holds the magnifier; his head tracks the flagged marble (look-at). Shrugs if the cup stays empty. | "spatial. A client-side UI performance optimizer that detects UI performance problems at dev time." / "Built with TypeScript and Vitest." (spoken in chunks) | marble roll (filtered noise by velocity), gate clack, cup clink on a slow frame | Run framed vertically; it suits portrait. |
| S8 | `#mouse-follow`. Unfold #4 | 40 mm top-down 60° over the felt pond. | Head and eyes follow the pointer with the ducks; laughs when a duck is clicked. | "Mouse Follow. A mouse-follow component for React." / "Built with React." | squeaks, water lap (low noise), duck chain "patter" | Ducks follow the touch drag; arrow keys move a target. |
| — | Leaving any playset | Pull back 35 mm. | Waves at the box. | — | the box folds (reverse flaps), then slides onto the shelf with a tock | The dock gains a lit mini box. |
| S9 | `#experience` | 50 mm **lateral truck** along the shelf at box height, newest → oldest, about 2 boxes legible at a time. | Walks along the shelf below (walk clip), points up at each box. | "Most recently I was Frontend Engineer II at Cashfree Payments." / "Before that, Moresand Technologies and Tata 1mg." | footstep ticks on the plinth, shelf creak, a soft "tock" as each box lights | Vertical crane down a shelf stack. |
| S10 | `#skills` | 85 mm **macro**, panning across five sprues (one per group). | Snaps off the six parts his line names, one per beat. | "Day to day I work with JavaScript, TypeScript, React, Next.js, Zustand and React Query." / "The full list is on screen." | crisp plastic snaps, parts bouncing (impulse-scaled) | One sprue per screen; swipe pans. |
| S11 | `#contact`. **Wow 3: Flick** is always live, but prompted here | 50 mm pull-back to the hero box, re-formed. The figure stands on top; symmetric frame. | Climbs onto the box. The "Open to new roles" sticker slaps on. He holds out the card; the 3D keys depress when the HTML keys are focused or pressed. A tooltip on hover/focus: "Flick me" **(new template string)**. | "That's the tour." / "The best way to reach me is email…" / "…or call…" / "Or ask me anything about my work." | sticker thwack, key clicks, final room-tone swell | Keys as a full-width 52 px stack over the card. |
| — | Colophon (footer) | static | — | Honesty note: "Figure generated from my photos; synthetic voice; answers come from this page." **(new template string)** | — | — |

**Interrupts:**

- **Ask (voice or typed):** existing intents match the question. The camera travels to the target section (a cut with the flap wipe if more than 2 sections away). The figure hops in and speaks the intent line.
- **Skill intent:** that sprue part snaps off and glows. "Do you know Redis?" → the Redis part.
- **Pausing the tour:** wheel, touch-move or arrow keys pause it; Esc stops it.

**Reduced motion:** S2 shows its final frame (the figure on the turntable, the box flat). Sections cut. Playsets show a designed steady state: trains parked half in the cache depot, the brick UI complete, the last 240 frames as a static marble tally, ducks lined up toward the sheet. The head holds still with one smile. Sound stays opt-in.

**Tier C:** a still per section (rendered from the live scene), with voice and captions. The S1 poster is the LCP.

---

## 6. "Wow but cheap" tricks for Collector's Edition

| Trick | One-line hint (three r184 / R3F 9) |
| --- | --- |
| **Inflate 2D → 3D** | In `onBeforeCompile`, add `transformed.z *= uDepth;` and drive `uDepth` 0.02 → 1 with the pop spring. Flat-shade during the first frames (`uLit` 0 → 1 mixes unlit base colour with full PBR). |
| **Dolly zoom** | Each frame: `cam.setFocalLength(mm); cam.position.z = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));` keeps the figure's height constant while perspective opens. |
| **Box-net unfold / fold** | Each flap is a `Group` pivoted at its hinge edge. Rotate it on a spring with a 60 ms stagger; run in reverse to fold. Panels are thin `RoundedBoxGeometry` (radius 1 mm). |
| **Pop-up stagger** | Playset children start at `scale 0.001`. Spring them to 1 (K 220, C 14), staggered by distance from the box centre × 0.25 ms/mm. |
| **Foreground flap wipe** | A cardboard plane parented to the camera at 0.05 m swings across the lens for 180 ms. Swap scenes under it; no shader needed. |
| **Bobble spring + flick** | `vel += pointerVelocity * gain` on release of a raycast hit on the head's bounding sphere. Semi-implicit Euler after `mixer.update`, `dt` capped at 1/30. Key **B** applies the same impulse. |
| **Sonified boing** | One triangle `OscillatorNode` whose `frequency.setTargetAtTime(220 + 900 * |ω|, t, 0.01)` and gain follow the head's angular speed: the sound *is* the physics. |
| **Talk = nod** | On each viseme onset in `aa`, `O` or `E`, add a 0.04 rad pitch impulse to the head spring. |
| **Printed face atlas** | One curved face-plate mesh, `alphaTest` 0.5, with a 1024² atlas (4 × 4 cells). `map.offset.set(col / 4, row / 4)` per state. Map 15 Oculus visemes → 7 mouths: rest-grin, PP, FF/TH, small-open (DD/kk/nn/SS), wide (E/I), open (aa), round (O/U/CH/RR). |
| **Pupil look-at** | Pupils are their own small decal. Offset them by the damped pointer direction (λ 8), clamped to ±0.08 UV: life for almost free. |
| **Painted-resin material** | `MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.25 })` + a 512 px code-generated fBm roughness `DataTexture` + `RoomEnvironment` PMREM (`scene.environment`). |
| **Cardboard that reads real** | Corrugated flutes on the panel edges: a tiny `CanvasTexture` of sine stripes on edge faces only, roughness 0.9, print on the faces, slight wear (noise on roughness). |
| **Blister glint** | On Start hover/focus, sweep a bright `Lightformer` strip (or a shader band) across the box window's plastic. It says "packaging" instantly. |
| **Tilt-shift miniature** | `new TiltShiftEffect({ offset, rotation: 0, focusArea: 0.4, feather: 0.3 })` in one `EffectPass` with AgX tone mapping and SMAA (all in `postprocessing` 6.39.5). Tier A only. |
| **Squash and stretch on landing** | `scale.y = 1 - 0.12 * impact; scale.x = scale.z = 1 / Math.sqrt(scale.y);` spring back over 160 ms. |
| **Hit-stop on hard flicks** | Hold `mixer.timeScale = 0` and the spring step for 60 ms, plus a 2 px camera jitter via `setViewOffset` that decays over 200 ms. |
| **Cardboard confetti** | One `InstancedMesh` of 40 small quads with a hand-written ballistic update (gravity, drag, floor bounce), removed after 1.2 s. No physics engine. |
| **Contact shadows** | drei `ContactShadows` with `frames={1}` per playset (re-render on landing), or a pre-blurred radial texture under the figure on tier B. |
| **Procedural foley** | Wood clack: a 6 ms noise burst through bandpass 1.8 kHz (Q 6). ABS snap: a 2 ms click + 3.5 kHz sine ping (30 ms decay). Squeak: a sine sweep 1.2 → 2 kHz → 1.4 kHz over 160 ms. Gain = clamp(impulse), panned by `StereoPannerNode` from the projected x. |
| **Shader pre-warm** | `await gl.compileAsync(scene, camera)` for the hero, and per playset when the previous section passes 50% visibility, so no unfold ever hitches. |

---

## 7. Assets for Collector's Edition

| # | Asset | Source | Target (estimate until measured) | Notes |
| --- | --- | --- | --- | --- |
| 1 | **2D turnaround** of the bobblehead (front, ¾, side, back) + a "blank-face" variant | Image model (Gemini 2.5 Flash Image, ChatGPT images, or Meshy Image-to-Image) from `public/profile_pic.png` + ¾ and profile photos from the owner | — | **Owner approves the likeness before any 3D spend.** Recognition test: show it to 4 people who know him. Head ≈ 45% of height. Lighting even, no baked shadows. |
| 2 | **Box-front cut-out art** (S0/S1) | The approved front view, transparent | ≤ 120 KB AVIF/WebP | Also the poster/LCP, composited onto the box art. |
| 3 | **Head bust GLB** | Image-to-3D (Meshy 7.1 with `remove_lighting`, vs Tripo 3.0), from the blank-face head views | ≤ 15k tris, 2K base colour (1K on B) | No rig; rides the neck bone on a spring pivot. Glasses removed in the prompt. |
| 4 | **Body GLB**, rigged, with ≤ 10 clips | Image-to-3D (A-pose, toy proportions with a normal head) → humanoid auto-rig → `action_ids`: idle, wave, point, hop/jump, clap, shrug, walk, thumbs-up, look-around, celebrate (verify names in the library). Text-to-Motion for anything missing. | ≤ 25k tris, ≤ 1.5 MB after meshopt + KTX2, clips resampled to 24 fps | Hide the generated head by scaling the head bone to ~0. **Spike first:** does the big-head look survive with the separate head? |
| 5 | **Face atlas** | Drawn as vector (Figma or SVG) in the approved style: 7 mouths, 5 eye states (open, half, closed, happy, wide), 3 brow states | 1024² PNG/KTX2, ≤ 120 KB | Rest mouth = his toothy grin from the photo. |
| 6 | Glasses, plinth + nameplate, neck spring | **Code-built** | 0 B | Extruded rounded-rect frames; `CanvasTexture` text from `SITE`; helix `TubeGeometry`. |
| 7 | Boxes, box art, shelf, sprues, business card, turntable, cyclorama | **Code-built** + `CanvasTexture` print from `SITE` strings | 0 B | Org names in plain type; no logos or brand colours. |
| 8 | Playsets: wooden train set, brick kit, marble run, rubber ducks | **Code-built** (rounded primitives, `ExtrudeGeometry` track profile on curves, instancing) | 0 B, ≤ 25 KB gzip of code each | Optional: one generated locomotive (≤ 300 KB) if the code-built one looks weak. |
| 9 | Light and environment | `RoomEnvironment` PMREM (in three) + drei `Lightformer`s | 0 B | No HDRI download. |
| 10 | Sound | Procedural Web Audio | 0 B | Needs the owner's sign-off to amend CLAUDE.md §10 (voice MP3s already exist). |
| 11 | Voice | Existing `npm run voice` (Kokoro `am_michael`), re-run for new template strings | already 2.5 MB, fetched per line | Visemes already in JSON. |
| 12 | Section stills (tier C, reduced motion) | Captured from the live scene | ≤ 120 KB each | — |

**3D bytes before Start, tier A:** about 2.2 MB estimated (body 1.5 + head 0.5 + atlas 0.1 + art 0.1), against a 2.5 MB budget. Tier B uses 1K textures and the LOD body, about 1.3 MB against 1.5 MB.

**Generation cost:** from Meshy docs, a textured image-to-3D is 15–20+ credits depending on model, rigging is 5 credits (example task), and animation is 3 credits per clip. Two parts × 3 attempts + rig + 10 clips is roughly 150–200 credits. Money prices are unverified. **Ask before the first paid call.** Choose a paid plan for private ownership, or the Free plan with CC BY 4.0 credit in the colophon.

---

## 8. Owner decisions needed

1. **Approve the concept** (Collector's Edition). This also means rewriting `CLAUDE.md §10` and `SOURCE_OF_TRUTH.md § V2`, which still describe Loki and say "no external audio files".
2. **Supply ¾ and profile photos** (same light, glasses on), then **approve the 2D turnaround.**
3. **The first paid generation call,** and which plan (private ownership vs CC BY 4.0 with credit).
4. **Accent colour:** signal orange `#FF5A1F` on bone white and ink is the default.

---

## Sources

**Awards and studios**
- Awwwards annual winners: https://www.awwwards.com/annual-awards/winners
- Lando Norris on Awwwards: https://www.awwwards.com/sites/lando-norris
- Igloo Inc case study: https://awwwards.com/igloo-inc-case-study.html
- Bruno Simon portfolio case study: https://www.awwwards.com/brunos-portfolio-case-study.html
- Bruno Simon folio-2025 repo: https://github.com/brunosimon/folio-2025
- GeekNews summary (secondary): https://news.hada.io/topic?id=24963
- Messenger (Wikipedia): https://en.wikipedia.org/wiki/Messenger_(video_game)
- 80.lv on Messenger: https://80.lv/articles/deliver-mail-on-tiny-colorful-planet-in-this-relaxing-web-game
- Cartier case study: https://www.awwwards.com/watches-wonders-immersive-experience-for-cartier.html
- Utsubo, best three.js sites 2026 (interested party): https://www.utsubo.com/blog/best-threejs-websites-2026
- Lusion Labs: https://www.awwwards.com/sites/lusion-labs
- Active Theory stack (forum comment): https://dev.to/charithdesign/what-is-the-technology-used-in-this-website-and-what-would-be-the-ideal-solution-to-create-the-same-53d

**Characters**
- Oat the Goat SOTM: https://awwwards.com/oat-the-goat-by-assembly-wins-site-of-the-month-june.html
- Assembly on Oat the Goat: https://www.assemblyltd.com/work/oat-the-goat
- Toca Boca 3D character: https://www.awwwards.com/inspiration/interactive-3d-character-toca-boca
- Bike Time mascot footer: https://www.awwwards.com/inspiration/3d-mascot-and-directions-in-footer-design-bike-time
- Qream mascot: https://www.awwwards.com/inspiration/main-page-mascot-mouse-interaction-qream-design-agency-1
- Duolingo visemes: https://blog.duolingo.com/world-character-visemes
- Nano Banana trend: https://decrypt.co/338994/how-use-google-nano-banana-ai-transform-selfies-digital-figurines, https://www.theweek.in/news/sci-tech/2025/09/11/after-ghibli-barbie-box-nano-banana-trend-goes-viral-how-you-can-join-in.amp.html

**Generation**
- Meshy rigging: https://docs.meshy.ai/en/api/rigging
- Meshy animation: https://docs.meshy.ai/en/api/animation
- Meshy changelog: https://docs.meshy.ai/api/changelog
- Meshy pricing and licence: https://docs.meshy.ai/en/webapp/pricing, https://intercom.help/meshy/en/articles/16102098-can-i-use-meshy-assets-commercially
- Tripo quick start: https://developers.tripo3d.com/zh/docs/quick-start
- Tripo ComfyUI nodes: https://developers.tripo3d.com/en/docs/comfyui-nodes
- Hunyuan3D-2 licence: https://huggingface.co/tencent/Hunyuan3D-2/blob/main/LICENSE
- TRELLIS.2: https://huggingface.co/microsoft/TRELLIS.2-4B

**Libraries (versions checked with `npm view` / unpkg on 2026-10-15)**
- postprocessing: https://github.com/pmndrs/postprocessing
- Rapier: https://rapier.rs
