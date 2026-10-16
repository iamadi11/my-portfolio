# /v2 revamp: three concepts (2026-10-16)

Inputs: [references.md](references.md) (what the award sites actually ship), the content in `src/content/site.ts`, the generated, rigged character, and the rules in `CLAUDE.md` §10 and the portfolio-craft skill. Every concept keeps the recruiter path in real HTML at first paint (no loader gate, unlike every reference) and turns that HTML into the world.

## 1. Pop-up: the portfolio is a paper pop-up book

The page you land on is a printed sheet: name, role, city, Start, in real HTML styled as paper. Start: the sheet lifts off the screen, the camera finds it lying in an open book on the desk, and the spread **folds up into paper sculpture**, a v-fold box from which the character steps out. Scroll turns the pages; every spread pops up a different paper mechanism, and the character walks across the folds as they rise.

- **World:** an open hardback on the desk (the desk, lamp and window light already built), toy scale, warm lamp light, paper fibre and crease shading.
- **Character:** the guide, stepping out of a pop-up box on page one, then walking across each spread as it opens; waves from the elbow, talks with captions.
- **Signature transformation:** the HTML page you just read peels off (page-curl shader) and pops up into a 3D paper world, folds creasing in real time.
- **Camera path:** a 50 mm overhead three-quarter on the book; each page turn is a crane over the spine; push-ins on the mechanisms.
- **Play:** pull tabs, rotate wheels, lift flaps, flick a page corner to turn it (mouse, touch, and arrow keys all turn pages and pull the active tab).
- **Projects** (one mechanism each, from what the project does):
  - Eidos (offline-first service-worker layer): a paper cloud on a v-fold; pull the tab and the cloud collapses while a cache drawer keeps sliding out cards.
  - MCP-UI (generator): a pull-tab slat mechanism; UI blocks re-slide into a new layout.
  - Spatial (UI performance at dev time): a volvelle, a paper wheel chart that dials frame times past a flagged slow frame.
  - Mouse Follow (React component): a paper cursor on a pivot that follows the pointer, with followers on threads.
- **Career:** a staircase of paper platforms that rises as the page opens, one per role, oldest first.
- **Skills:** an index of tabbed cards along the fore-edge.
- **Reply:** the last spread unfolds an envelope; the letter inside is the HTML contact block (email, phone, GitHub, LinkedIn).
- **Sound:** paper rustle on turns, creases, tab clicks, the voice with captions.
- **Phone:** the book becomes a single-page flip book in portrait, one mechanism per page.
- **Cost:** procedural paper geometry (no new model files), canvas-printed textures, one vertex-shader page curl. Heaviest asset stays the character (2 MB, after Start).
- **First-screen words:** 11 (name, role, city, availability).

## 2. Bytes to pixels: the page builds itself

The browser's rendering pipeline as a toy factory. The HTML of this page streams in as glyphs that tumble onto a conveyor; the character runs the line: parse (a DOM tree that literally grows), style (paint dispensers), layout (boxes snapping to a grid), paint, composite (layers sliding together). The final frame is the portfolio.

- **Signature:** the text you read falls apart into 3D letters that rebuild the page as a machine.
- **Projects:** machines on the line (cache silo, block stamper, frame-time scope, cursor arm).
- **Strength:** deeply on-brand for a frontend engineer. **Risk:** abstract and technical; text-as-geometry needs MSDF/instanced glyph rendering (heavier, and it reads cold next to a Pixar character).

## 3. Request: a marble run of your click

Your click becomes a glowing marble, a network request, that rolls through a chain-reaction machine built from the work: the Eidos cache catches it offline, MCP-UI stamps blocks, Spatial clocks it, Mouse Follow chases it, and it ends by ringing the "Say hello" bell.

- **Signature:** a full physics chain reaction triggered by the visitor.
- **Risk:** needs a physics engine (Rapier WASM, about 2 MB) and a long hand-tuned track; physics play sits close to the Bruno Simon reference; costly on phones.

## Scores (1–5)

| | Wow in 5 s | Content fit | Recruiter clarity | Character | Mobile | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Pop-up | 5 | 4 | 5 | 5 | 5 | 4 |
| 2. Bytes to pixels | 4 | 5 | 3 | 3 | 3 | 2 |
| 3. Request | 5 | 4 | 3 | 3 | 2 | 2 |

**Recommendation: 1, Pop-up.** None of the references touch paper; real-time folding with crease light and a Pixar character walking across rising folds is the "how is that made?" moment; it reuses the desk, lamp and character; and it degrades to a flip book on phones and a printed page without WebGL.
