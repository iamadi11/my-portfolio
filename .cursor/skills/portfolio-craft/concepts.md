# Concepts

The Director reads this during a full pass. Write three concepts and build one.

## Concept format

Each concept is a short paragraph plus these lines:

- **World:** the place the visitor is inside, its scale, and its light.
- **Character:** who the owner's mascot is in this world (role, costume, prop) and what it does in the first frame.
- **Signature transformation:** the one moment people retell.
- **Camera path:** one shot per section (focal length, framing, move).
- **Play:** what the visitor grabs, flicks, throws, or steers, and the physics behind it.
- **Projects:** one set piece per project, tied to what the project does.
- **Reply:** how contact is reached, as HTML and as its in-world equivalent.
- **Sound:** the palette, and what triggers what.
- **Phone:** the composition at 375, and what is cut.
- **Cost:** expectations for tiers A and B, and the heaviest asset.
- **First-screen words:** counted, and under 15.

Reject a concept that is only "dark, minimal, animated", a normal page with a 3D hero, or one that loses no meaning when the canvas is hidden.

Score each concept from 1 to 5 on:

- wow in the first 5 s
- content fit
- recruiter clarity
- how well the character is integrated
- mobile feasibility
- cost

Pick the one with the most wow that passes every Non-negotiable in [SKILL.md](SKILL.md).

## Wow

All five ingredients are required. Name each one in the plan and in the report.

1. **Signature transformation.** It starts within 5 s, or on the first gesture if something is already alive before then. It plays once, can be skipped, and becomes its final frame under reduced motion. Examples: the owner's photo print inflates into the bobblehead; the resume folds itself into the world; the character bursts out of a shipping capsule.
2. **Camera choreography.** Every section has a planned shot: focal length (35, 50, or 85 mm), framing, and a dolly, crane, arc, or push-in. The moves are continuous with scroll and damped, with no roll and no scroll hijack. The character leads the camera or holds eye contact with it.
3. **Play.** Physics the visitor can touch. Flick the bobblehead and it springs back. Knock over the stack of skills. Toss something the character catches. Mouse, touch, and a keyboard key all trigger the same impulse. Play is optional and never needed to read anything.
4. **One set piece per project.** Each project is a small machine or diorama that shows what it does, with its own light. Derive it from the project's function:
   - networking, caching, offline → a router
   - generators, builders → an assembler
   - performance, testing → a scope or inspector
   - input, UI components → a tracker

   Two projects never share a set piece without a material change. Clicking one opens the HTML sheet with the real summary and links.
5. **Sound design.** Off until a gesture, with one visible toggle. Interface ticks; foley tied to physics contacts, with gain set by impulse; the character's voice with captions; an ambient bed for the world. Follow the repo's sound rule (for example, nothing before Start).

## The character must react

| Trigger | Response |
| --- | --- |
| Idle | Breathing, a blink every 2–6 s at random, weight shifts. Never a T-pose or a frozen frame. |
| Pointer (fine pointers only) | The head and eyes track it, with lag and a clamp. |
| Scroll / section change | Looks toward, hops to, or gestures at the next set piece. |
| Click, tap, or flick on it | A bobble impulse, plus an expression or a short captioned line. |
| Speaking | Visemes follow the audio clock. The mouth never stays still while audio plays. |
| Hidden tab, reduced motion | A designed rest pose. |

## Cheap tells (reject on sight)

- Primitive geometry as the identity: default spheres, boxes, and tori; unbevelled boxes; phone-shaped extrusions; fences of identical boxes.
- Default materials: `MeshNormalMaterial` or `MeshBasicMaterial` on solids, flat grey, uniform roughness, metalness between 0 and 1, everything reading as plastic.
- Purple or cyan glow on black, over-bloom, holographic HUD panels, neon grids.
- Floating blobs, orbs, or particle fields as the identity. Objects with no contact shadow.
- Spinning or bobbing for no reason, everything on the same sine wave, linear easing.
- Tells of a generated mesh: melted details, highlights and shadows baked into the albedo, texture seams, a T-pose, a stiff idle, an uncanny near-real face.
- An unrelated HDRI showing as the background. A stock marketplace model as the hero.
- Paragraphs on the canvas, or text over busy 3D with no solid backing.
- The same set piece reused for unrelated projects.
- A logo wall, a centred gradient hero, a card grid, a long intro.

## What makes it read as expensive

These apply to stylised work too: stylised is not cheap.

- Bevels on hard edges (`RoundedBoxGeometry`, or `ExtrudeGeometry` with `bevelEnabled`).
- Physically based materials with imperfection: metalness 0 or 1, varied roughness maps. `MeshPhysicalMaterial` only where clearcoat, sheen, or transmission earns it.
- Image-based light: drei `Environment` with `Lightformer`s that match the scene's actual lights.
- A few motivated lights that fall off into dark, plus contact shadows or AO wherever things meet the floor.
- `AgXToneMapping` or `NeutralToneMapping`, sRGB for colour maps only, and linear normal and roughness maps.
- Real focal lengths, and composition by lens shift (`setViewOffset`) rather than by rotating the camera. Slow moves read as expensive.
- Subtle grain and vignette. Bloom only above an HDR threshold.
- Scale in metres, imperfect placement, sagging cables, small random rotations.
- Springs and overshoot on mechanisms, and sound on contact.

For toon or clay shading, keep one consistent light direction, a rim light, and AO.

## Motion tokens

Define these once and reuse them:

- a feedback duration of about 120 ms
- a camera/section duration, or a damping λ
- one ease
- one stagger
- one named spring pair (stiffness, damping) for the bobble

Motion layers: signature, camera, character, play/physics, control feedback, ambient. Each one has a cause.

**Reduced motion:**

- the signature shows as its final frame
- the camera cuts instead of moving
- the character holds one designed pose and one expression
- physics is off
- sound stays opt-in

## If an existing scene looks cheap

Name the cause before touching it:

- **Concept:** the object has no role.
- **Assets:** a primitive or a stock shape.
- **Light and materials:** it reads as plastic or as a default demo.
- **Composition:** it collides with the HTML layer, or floats in empty space.
- **Motion:** it moves without a cause.
- **Cost:** it loads with the first byte, never pauses, or hitches on first interaction.

When the cause is the concept or the assets, replace or delete the scene. Tune light and motion only when the object itself is worth keeping.
