# Game portfolios, reverse-engineered (2026-10-16, round 2)

Brief from the owner: a wow, complex, hard-to-clone, mobile-friendly site that plays like a game (a childhood retro game, or modern GTA V/VI), for a **generic Senior / SDE-2 full-stack engineer** (template content, not the owner's data), built on **free, already-made 3D assets**. No 3D likeness needed.

## Method

Eight live game portfolios (two more were down or redirected: rleonardi.com, simontessier.fr, coastalworld.com). For each:

1. **REA static** (`rea-agents@6.5.0`, dedicated loopback Chrome 155, Metal GPU): `analyze-web-bundle`, `inspect-web-page --include-script-sources`, `export-web-scripts`, then a marker grep of the exported scripts (never executed).
2. **REA scenario** (`capture-browser-scenario`, launch mode): wait for load, click the start control, press `w`, `ArrowUp`, `ArrowRight`, `Space`, screenshot after each step, network + console + page-error events.
3. **Play pass** (own CDP harness): click start, hold W / arrows for 1–2 s, click objects, record frames; read `window.__THREE__`, input listeners via `getEventListeners`; then the same on a 390×844 touch phone.

Library rows are inferences from shipped code. "Mobile" means what our touch-phone pass saw, not the site's own claims.

## Evidence

| Site | REA bundle / page | REA scenario | Steps |
| --- | --- | --- | --- |
| [Henry Heffernan](https://henryheffernan.com/) | `ev_45f5a48b…` / `ev_7be4b467…` | `ev_1fcb89cd…` | 1 done, start locator missed, 3 cancelled (play pass got in) |
| [Messenger (Abeto)](https://messenger.abeto.co/) | `ev_7f7a69b2…` / `ev_93cb447d…` | `ev_f69440c0…` | 12/12 |
| [Igloo Inc](https://www.igloo.inc/) | `ev_4d7025d5…` / `ev_0d9639e4…` | `ev_e8318131…` | 12/12 |
| [Jesse Zhou](https://www.jesse-zhou.com/) | `ev_4201b4d9…` / `ev_b0135d4c…` | `ev_43d6d911…` | 2 done, start missed, 11 cancelled (play pass got in) |
| [Paodao, "Where Worlds Take Shape"](https://paodao.fr/) | `ev_7bd51351…` / `ev_c8c07598…` | `ev_40567e98…` | 12/12 |
| [Simone Andreotti](https://simone-dev.com/) | `ev_8f1b8864…` / `ev_f0355cde…` | `ev_3fdebae3…` | 12/12 |
| [My Room in 3D (Bruno Simon)](https://my-room-in-3d.vercel.app/) | `ev_bf9940b4…` / `ev_20423975…` | `ev_739b80a6…` | 12/12 |
| [Bruno Simon](https://bruno-simon.com/) | round 1 `ev_233d1ecd…` | `ev_a5011101…` | 14/14 |

## What each one actually is

| Site | Play | Stack (runtime + markers) | Assets on the wire (scenario) | Phone (390 px) |
| --- | --- | --- | --- | --- |
| Bruno Simon | drive a car around a toy island; physics props; "server connected" multiplayer presence | three r183 WebGPU/TSL, Rapier WASM, Web Audio | 69 GLB, 108 KTX, **237 MP3** foley | blank canvas in our pass |
| Henry Heffernan | click a 3D desk, camera dives into a CRT whose screen is **a real web desktop OS** (`os.henryheffernan.com`) | three r137, **CSS3DRenderer + iframe**, positional audio | 9 GLB, 33 MP3 | shows "best viewed on a desktop" |
| Messenger | third-person postman on a tiny planet; dialogue boxes, deliveries (missions), gamepad, emoji multiplayer | three r180, AnimationMixer, navmesh, Workers, positional audio | 48 Draco, 30 KTX2, **159 OGG** | touch listeners present |
| Jesse Zhou | a neon ramen stand; signboard menu items (projects, articles, about) fly the camera | three r139, Howler, GSAP | 102 KTX2 + 30 Basis, 36 MP4 video textures | same diorama, portrait-cropped |
| Paodao | walk an explorer through a 3D world; travel points; hidden passages; gamepad | three r173, Rapier marker, navmesh (303), Howler, saves to localStorage | 15 GLB, 30 KTX2 | arrow keys + mouse only; 40 s+ load |
| Simone Andreotti | space hub → fly ship to planets, arcade minigame | three (no global), GSAP | 12 GLB, **81 MP4** | works, portrait layout |
| My Room in 3D | an orbitable baked room, every gadget animated | three r130, baked lightmaps | 24 GLB | orbit only |
| Igloo Inc | scroll-built igloo of glowing blocks, crypto narrative | three r165, GSAP (51), navmesh marker, Workers | 60 Draco, 135 KTX2, EXR env | works, portrait |

## Findings

1. **Three play patterns cover almost everything**: drive (Bruno), walk/explore (Messenger, Paodao, Simone), click a diorama (Henry, Jesse, My Room). None is *about* the person's job; the game is a skin over a menu.
2. **The cleverest trick is Henry's**: the content is a real web app *inside* the 3D world (CSS3D + iframe). Content stays real HTML, searchable and accessible, while living in the game.
3. **Messenger shows what makes a game feel like a game**: missions with a goal, NPC dialogue, a character with real animation clips, presence of other players, and sound on everything (159 audio files).
4. **Mobile is the gap.** Of 8, only Messenger, Simone and Jesse play on a phone; Henry tells you to use a desktop; Paodao needs arrows + mouse; Bruno rendered blank in our phone pass. A portrait-first game is an open niche.
5. **Weight**: 5–15 MB, 40 s on Paodao. They gate on loaders. The fastest still show a click-to-start screen. Assets are KTX2/Basis textures + Draco/Meshopt geometry + OGG/MP3 sprites.
6. **Everyone uses three.js.** Rapier for physics, navmesh for walking, AnimationMixer for characters, Howler/Web Audio for sound.

## What would be new

- The game **is the job**: a full-stack engineer's world modelled as a running system (requests, caches, queues, incidents), not a menu in costume. That is the hard-to-clone part: a simulation, not a scene.
- **Portrait-first mobile** as a designed mode (handheld or phone-in-game UI), not a fallback.
- **Content as real HTML inside the game** (Henry's idea, taken further): the in-game phone or console screen *is* the résumé, so a recruiter can always skip the game.

## Free, already-made assets (all CC0, verified on the source page)

| Use | Pack | Notes |
| --- | --- | --- |
| City, roads, traffic lights | Kenney City Kit Roads (90 files), Commercial, Suburban, Industrial | low-poly, one atlas |
| Vehicles | Kenney Car Kit (45 files, incl. karts, debris) | |
| City alt | KayKit City Builder Bits (32+ free models, glTF, one 1024² gradient atlas) | |
| Arcade cabinets | Kenney Mini Arcade (20 files, animated) | |
| Tower defense | Kenney Tower Defense Kit (160 files, remade v2) | |
| Characters | Quaternius Ultimate Modular Characters (11 characters, 24 animations, glTF); Kenney Mini Characters (animated); RobotExpressive (three.js repo) | generic avatars, not a likeness |
| Animation | Quaternius Universal Animation Library (45 free clips) | retarget onto the characters |
| UI sound | Kenney Interface Sounds (100), Impact Sounds, Digital Audio | |
| Fonts (OFL) | Press Start 2P, VT323, Silkscreen, Anton / Bebas Neue | not Rockstar's Pricedown |
| Code | three.js (MIT), Rapier (Apache-2.0), cannon-es (MIT), nipplejs (MIT) | |

GTA trademarks, fonts, logos and art are not used; "GTA-style" means the camera, HUD grammar (minimap, phone, mission text, wanted stars) and open-world feel only.
