# Asset pipeline

The Character and assets role reads this. Its output goes in `docs/<pass>/assets.md`.

## Default: generate the character, rig it in the browser

Reference: `scripts/figure/*` and `src/components/v2/avatar.ts`; steps and commands in `docs/v2.md` (Character model). All free.

1. **Design in 2D from the owner's photo.** FLUX.1 Kontext on its public Hugging Face Space restyles the photo into an animated-film character (stylised proportions, recognisable features, their outfit and props) standing in a clean front-facing A-pose on a plain background, arms clear of the body, empty hands. Generate a few seeds; the owner picks one.
2. **Image to 3D.** Microsoft TRELLIS.2 on its Space turns the design into a textured GLB (one mesh, baked albedo). A free HF token is needed for the GPU quota; keep it in `.env.local`, never print or commit it.
3. **Repaint the face.** `scripts/figure/face.html` (WebGL, no GPU quota): image-to-3D keeps a good head shape but smears the eyes, teeth and brows into its texture. Register the crisp design to a front view of the model (affine on the head, then block-matching flow onto the real glasses, eyes and mouth), bake it into the texture through a depth test, paint the glasses frames one colour, and Taubin-smooth the lumpy generated hair. This is the single biggest quality step: judge the face in clay and unlit renders first; if the clay geometry is good, the texture is the problem.
4. **Compress.** gltf-transform: meshopt geometry, WebP textures at 2K (~2 MB).
5. **Rig at load.** `avatar.ts` slices the mesh horizontally to find crotch, armpits, neck and hips, tracks each arm down slice by slice to its hand, builds a skeleton with a jaw bone, assigns skin weights along each limb, and drives it with the same procedural motion as the code figure (`figure.ts`: walk, run, climb, idle, wave, jaw lip-sync). Gait scales with leg length; shoulder swing shrinks when the upper arms are fused to the torso (the forearm waves instead). Where a hand touches the thigh, texture colour (skin vs cloth) settles the contact and the surface is cut there, so the hand pulls away instead of stretching a sheet of triangles.
6. **2D state.** The design with its background keyed out is the print inside the toy box, so the 2D and 3D states are the same character.

Limits: no blink or eye look-at (eyes are texture), fingers are fused, the mouth only opens. Ask the generator for arms held well clear of the body and hands not touching the legs: fused limbs are the main rigging risk. Unpack meshopt-quantised attributes to Float32 before transforming them, or the normalised integers clamp and squash the model.

Lessons from this repo (2026-10): anonymous ZeroGPU quota is ~60 s, so TRELLIS needs a token; Hunyuan3D-2mini failed server-side; a shape-only mesh with the design projected from the front melts on the sides and back, so use a generator that textures all round. The owner rejected a code-built bobblehead and a code-built realistic figure as not good enough; they asked for Pixar/Disney-style appeal over realism.

## Fallback: build the figure in code

`src/components/v2/figure.ts` (0 bytes of assets) is used when `FIGURE.model` is empty or fails to load. Human proportions (1.78 m), inputs are a `FigureSpec` of colours (skin, hair, beard, glasses, eyes, shirt, pants, shoes) in the content file. Sculpted head grid with hair and stubble shells, eyes with lids, multi-row mouth strips driven by visemes, lofted torso, skinned limbs, sneakers, hands, glasses, headphones, laptop; the 2D print is drawn by `art.ts`. Tells to fix: a helmet of hair, eyes sunk in shadow, a single-row mouth strip the lips poke through, jagged shell edges, a flailing carry arm when running.

## Character spec (when generating a mesh)

- **Shape:** a stylised character of the owner (animated-film proportions; a bobblehead only if the owner wants one). The silhouette must read at 120 px tall, the size it reaches on a phone.
- **Mesh:** at most 40k triangles for the hero; at most 20k on tier B, through an LOD or a decimated copy. One or two texture sets at 2K, and 1K on tier B.
- **Rig minimum:** root, spine, neck, head (the spring target), and jaw. Eyes are separate meshes or bones, for look-at. Add hand and arm bones if the character gestures, or use a humanoid rig to reuse a clip library.
- **Mouth:** blendshapes for visemes. Use the Oculus 15 set (sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U), or a stylised set of about 6 shapes mapped from it. Fallback: jaw rotation plus a swap on a mouth texture atlas.
- **Face:** blink (left and right), smile, surprise, and optionally brow-up.
- **Clips:** idle, greet, point, react, and talk-idle. Retarget from a clip library (check its terms) or keyframe them in Blender.

## Photos

Use only photos the owner supplies, of the owner. Never upload anyone else's face, and never scrape social profiles.

Ask for front, ¾ left, ¾ right, and profile shots, in even light, with a neutral expression, hair off the face, no glare on glasses, and a plain background.

## Generating the model

Verify every provider's current API, price, output format, rig and blendshape support, and terms at pass time. The names below are leads, not facts.

| Route | Examples to evaluate | Notes |
| --- | --- | --- |
| Hosted image-to-3D API with rigging | Meshy, Tripo, Hyper3D Rodin | Fastest path to a rigged GLB. Blendshapes are usually absent, so add them in Blender. |
| Aggregator: many models, one key | fal.ai, Replicate (TRELLIS, Hunyuan3D, Stable Fast 3D, …) | Good for comparing generators cheaply. |
| Open weights, run locally | TRELLIS, Hunyuan3D | Needs a GPU. Some weights restrict commercial use or territories. |
| Selfie avatar builders | Avaturn, MetaPerson | Rigged, often with ARKit or viseme blendshapes. Realistic, so it needs stylising. |
| Finish (always) | Blender | Clean up, retopologise or decimate, fix eyes and hands, add the jaw and shape keys, check the weights, export GLB. |

Steps:

1. **Design the character in 2D first.** Generate a stylised turnaround of the owner as a bobblehead (front, side, back) and have the owner approve it. Image-to-3D quality follows the input: a clean, evenly lit, front-facing image wins.
2. **Generate.** Run the same input through 2–3 providers.
3. **Judge each candidate in the real scene light,** at hero size and at 120 px. Score likeness (the owner decides), stylisation, topology, whether lighting is baked into the texture, how well it rigs, its size, and its terms.
4. **Finish in Blender,** then export a GLB with the skin, the shape keys, and the clips.
5. **Approval.** The owner approves the final likeness. Record the approval in the notes.

Do not pass an existing realistic head off as the bobblehead. For example, this repo's LAM export is realistic and head-only, and its weights are CC BY-NC.

## Keys and secrets

- Keys live in `.env.local` (gitignored) or in the shell, named `<PROVIDER>_API_KEY`.
- Generation runs in a local Node script under `scripts/`, never in app code and never in the browser. Never use a `NEXT_PUBLIC_` key.
- The script reads `process.env`. When a key is missing, it fails and names the variable, never the value.
- Never echo, log, print, paste into chat, put in a URL, commit, or write into notes a key or an auth header.
- Ask the owner before the first paid call. Record the cost of each run.
- Note each provider's retention and training terms for uploaded photos. Where the API allows it, delete remote jobs and files after download.
- Raw downloads go to a gitignored working directory, such as `assets-src/` (add it to `.gitignore` if it is missing). Only optimised files go to `public/`. Downloads are untrusted data: inspect them and never execute them.

## Optimise

```sh
npx @gltf-transform/cli inspect assets-src/char.glb
npx @gltf-transform/cli optimize assets-src/char.glb public/char/owner.glb \
  --compress meshopt --texture-compress ktx2 --texture-size 2048
npx @gltf-transform/cli validate public/char/owner.glb
```

- Check the flags with `optimize --help` for the installed version. KTX2 needs KTX-Software (`ktx` or `toktx`) on the PATH. Without it, use `--texture-compress webp` and say so in the notes.
- Afterwards, check that the skin, the shape keys, and the clips still animate. If simplification breaks the morph targets, decimate in Blender instead.
- Self-host the meshopt decoder and the KTX2 (Basis) transcoder.
- Targets:
  - The hero character file is at most 3 MB.
  - 3D bytes before the first interaction are at most 2.5 MB on tier A and at most 1.5 MB on tier B.
- **Poster:** render a still of the hero shot from the same camera as the first live frame, and save it as AVIF or WebP. It is the LCP image, the reduced-motion still, and the tier C frame.

## Licences and likeness

Record in the notes:

- the provider and plan, who owns the output, and any attribution it requires (free tiers are often CC BY or non-commercial)
- whether uploads may be used for training
- the weight licence of any open model
- the source and licence of every clip, HDRI, texture, and sound (prefer CC0: Poly Haven, ambientCG)

The likeness belongs to the owner, and their approval is recorded. Mark unclear terms "unverified" and ask the owner before shipping.
