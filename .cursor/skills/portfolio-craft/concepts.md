# Concepts

Read this during a full pass, before choosing a direction. Do not implement three concepts. Pick one and build it.

## Three concepts

Each concept is a paragraph a designer could sketch:

- The metaphor (a place, an object, or an interface the visitor is inside).
- The first screen, in one composition.
- How a project is discovered, and why that project does not look like the next one.
- How someone replies.
- What is still, and the single signature motion.
- Which material is allowed: glass, a tactile control, a drawing, a 3D object, or none.
- What it costs on a phone.

Reject a concept that is only "dark, minimal, animated."

Choose by this order: the content can support it, a recruiter understands it in a few seconds, it does not look like the last portfolio the model remembers, it can be built with the current stack, and the phone version is a composition rather than a shrink.

## Materials

Use a material only where the metaphor needs a surface.

- **Tactile control.** One family of pressed keys: enter, dock, send. Soft highlight and inset press. Not on every card.
- **Glass.** One layer that actually sits over something: a HUD chip, a detail sheet. Not a grid of blurred rectangles.
- **Drawing.** SVG or CSS for instruments, diagrams, and project marks. Prefer this when a 3D primitive would be the alternative.
- **3D.** One object with a job in the scene: a thing you approach, open, or steer. Custom or carefully built geometry, coherent light, a camera that frames it. No default spheres, no phone-shaped extrusions, no fences of boxes. Lazy-load it. Pause it when hidden, off-screen, or reduced. If WebGL is missing, the page still reads.
- **Type.** One display face and one text face already available, or one added family with a reason. Type can be the graphic. Do not set a heading so large it breaks at 320px.

## Interaction menu

Pick a model. Do not stack them.

- Title screen, then chapters.
- A dock or HUD with a few destinations.
- A level select where each project has its own frame.
- A single scroll that changes the room.
- A closing console for reply.

Discovery can be playful. The work, the path, and a reply path stay obvious. Do not hide them behind a win state.

## Motion

Define four numbers and reuse them: a fast feedback duration, a section duration, one ease, one stagger. Do not invent a new curve per component.

| Layer | Job | Typical use |
| --- | --- | --- |
| Signature | The thing people remember | The title instrument, once |
| Section | Crossing into work or reply | A short shift of the incoming frame |
| Control | Confirm a press or focus | Key inset, focus ring |
| Ambient | The room is alive | A slow drift that stops for reduced motion |

Pointer reaction is allowed on fine pointers only, and it must not be required. Scroll may drive a scene. Do not hijack the scroll, and do not animate the body text while someone is reading it.

Reduced motion: show the final frame, jump instead of glide, leave the signature visible and still.

If an existing scene feels cheap, name the cause before touching it:

- Concept: the object has no role.
- Assets: it is a primitive or a stock shape.
- Light and materials: it reads as plastic or a default demo.
- Composition: it collides with the type or sits in empty space.
- Motion: it spins because it can.
- Cost: it loads on the first byte or never pauses.

Replace or delete it when the cause is concept or assets. Tune light and motion only when the object itself is worth keeping.

## Patterns that must earn their place

Do not start from these. A concept may use one only with a written reason.

- Centered hero, gradient field, three lines, one button.
- Floating spheres, blobs, or particles as the identity.
- Purple or cyan glow on black as the whole palette.
- Glass cards repeated down the page.
- A stock navbar, then a heading, a paragraph, and a CTA.
- The same project card four times.
- A wall of technology logos.
- A long introduction above the work.
- A 3D model that decorates instead of meaning the work.
- The same layout reused for unrelated projects.

## Performance as a design choice

Decide the cost while choosing the concept, not after the build is slow.

- The first screen paints without the heavy library.
- One signature animation, not a scene graph of always-on loops.
- Images have a reserved box. Fonts are limited to the weights on screen.
- Off-screen work does not keep a render loop.
- A phone gets a simpler frame of the same idea, not a scaled desktop scene.
- If the effect fails, the name, the work, and the reply links remain.
