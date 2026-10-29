import type { Pen } from '@/components/blueprint/pen';
import type { Project } from '@/content/types';

/**
 * Per-project architecture drawings for sheet 3. Every label restates a phrase of the project's `summary` or an
 * item of its `stack` in `SITE` (the phrase is quoted in the comment next to it). Nothing here adds components,
 * numbers or behaviour the summary does not state. A project without an entry falls back to `generic()`.
 *
 * Detail views draw in the sheet's detail region: x 430–850, y 478–605 (sheet units, viewBox 880 × 660).
 * Section A–A (only where the summary describes something with an inside): a vertical cutting plane through the
 * plan's left column; the section view shows what it cuts, top to bottom in plan order, as layers.
 */

export type Kind = 'hug' | 'well' | 'slot' | 'x' | 'hatch';

/** One slot of the plan view. `w` is a flex weight inside its row. */
export type Box = { l: string; sub?: string; k?: Kind; w?: number };

/** One row of the plan view = one layer of the exploded view. Rows flow top → bottom. */
export type Row = {
    boxes: Box[];
    /** Exploded-view label (`Ln · layer`) and its second line. */
    layer: string;
    layerSub?: string;
    /** Label on the flow arrows into this row. */
    edge?: string;
    /** Boxed note number shown beside this row (index into `notes`, 1-based). */
    note?: number;
};

/** One layer of section A–A, top to bottom. `t` = drawn thickness (schematic). `f`: cut material is hatched
 * (`cut` 45°, `cut2` 135° so neighbours read apart), a thin part is drawn solid, `seen` = not cut, outline only. */
export type Layer = { l: string; t: number; f: 'cut' | 'cut2' | 'solid' | 'seen' };

export type Assembly = {
    rows: Row[];
    /** Row the camera opens on: the most characteristic part. */
    focus: number;
    /** Notes block; `n` = boxed number on the drawing, omitted for general notes. */
    notes: { n?: number; t: string }[];
    detail?: { row: number; title: string; draw: (p: Pen, t: number) => void };
    section?: Layer[];
};

// ---------------------------------------------------------------------------------------------------------------
// Eidos: 'Never lose a write: a durable client-mutation queue for unreliable networks (IndexedDB replay,
// idempotency keys), published on npm.'
// ---------------------------------------------------------------------------------------------------------------
const eidos: Assembly = {
    rows: [
        {
            // 'client-mutation' · 'Never lose a write'
            boxes: [{ l: 'Client mutation', sub: 'Write', k: 'well' }],
            layer: 'Client',
            layerSub: 'Mutations · writes', // 'client-mutation' · 'write'
            note: 1,
        },
        {
            // 'a durable client-mutation queue'
            boxes: [{ l: 'Mutation queue', sub: 'Durable', k: 'hug' }],
            layer: 'Queue',
            layerSub: 'Durable · idempotency keys', // 'durable … queue' · 'idempotency keys'
            note: 2,
        },
        {
            boxes: [
                { l: 'IndexedDB', sub: 'Replay', k: 'well' }, // 'IndexedDB replay'
                { l: 'Network', sub: 'Unreliable', k: 'hatch' }, // 'for unreliable networks'
            ],
            layer: 'IndexedDB',
            layerSub: 'Replay · unreliable network', // 'IndexedDB replay' · 'unreliable networks'
            note: 3,
        },
    ],
    focus: 1,
    notes: [
        { n: 1, t: 'Never lose a write' }, // 'Never lose a write'
        { n: 2, t: 'Idempotency keys · IndexedDB replay' }, // '(IndexedDB replay, idempotency keys)'
        { n: 3, t: 'For unreliable networks' }, // 'for unreliable networks'
        { t: 'Published on npm' }, // 'published on npm'
    ],
    detail: {
        row: 1,
        title: 'Queue', // 'client-mutation queue'
        draw(p, t) {
            // Queue body with writes in it; each write carries a key ('idempotency keys').
            p.at(t, 0, 0.7);
            p.rr(440, 500, 280, 50, 8, 'obj');
            p.at(t + 0.35, 0.1, 0.45);
            [452, 520, 588, 656].forEach((x) => p.rr(x, 510, 58, 30, 3, 'hug'));
            p.at(t + 0.7, 0.06, 0.3);
            [452, 520, 588, 656].forEach((x) => p.rr(x + 42, 519, 10, 12, 1, 'thin'));
            p.at(t + 0.9, 0.04, 0.35);
            [452, 520, 588, 656].forEach((x) =>
                p.tx(x + 21, 528, 'Write', 'sl', { 'text-anchor': 'middle' })
            );
            // Out to the network ('unreliable networks').
            p.at(t + 0.6, 0.1, 0.5);
            p.flow(724, 525, 772, 525);
            p.rr(778, 505, 68, 40, 2, 'thin');
            p.hatchRect(778, 505, 68, 40, 2, 0.6);
            p.at(t + 1.0, 0.06, 0.35);
            p.tx(812, 562, 'Network', 'dts', { 'text-anchor': 'middle' });
            p.tx(812, 574, 'Unreliable', 'dts', { 'text-anchor': 'middle' });
            // Stored in IndexedDB and replayed ('IndexedDB replay').
            p.at(t + 0.8, 0.1, 0.45);
            p.rr(500, 574, 160, 26, 4, 'well');
            p.flow(552, 553, 552, 571);
            p.flow(612, 571, 612, 553);
            p.at(t + 1.2, 0.06, 0.35);
            p.slotLabel(500, 574, 160, 26, 'IndexedDB');
            p.tx(620, 566, 'Replay', 'dts');
            p.callout(699, 519, 730, 488, 'Idempotency key');
        },
    },
    // Cut through the left column: the write, the key it carries, the durable queue, IndexedDB under it.
    section: [
        { l: 'Write', t: 14, f: 'cut' }, // 'Never lose a write'
        { l: 'Idempotency key', t: 5, f: 'solid' }, // 'idempotency keys'
        { l: 'Durable queue', t: 20, f: 'cut2' }, // 'a durable client-mutation queue'
        { l: 'IndexedDB', t: 16, f: 'cut' }, // 'IndexedDB replay'
    ],
};

// ---------------------------------------------------------------------------------------------------------------
// MCP UI studio: 'A chat-first studio where a message (and an optional API URL) becomes a versioned,
// publishable UI widget.'
// ---------------------------------------------------------------------------------------------------------------
const mcpUi: Assembly = {
    rows: [
        {
            boxes: [
                { l: 'Message', sub: 'Chat', k: 'hug' }, // 'a message' · 'chat-first'
                { l: 'API URL', sub: 'Optional', k: 'slot' }, // '(and an optional API URL)'
            ],
            layer: 'Input',
            layerSub: 'Message · API URL', // 'a message (and an optional API URL)'
            note: 2,
        },
        {
            // 'A chat-first studio'
            boxes: [{ l: 'Studio', sub: 'Chat-first', k: 'well' }],
            layer: 'Studio',
            layerSub: 'Chat-first', // 'chat-first studio'
            note: 1,
        },
        {
            // 'becomes a versioned … UI widget'
            boxes: [{ l: 'UI widget', sub: 'Versioned', k: 'hug' }],
            edge: 'Becomes', // 'becomes'
            layer: 'Widget',
            layerSub: 'UI · versioned', // 'versioned … UI widget'
            note: 3,
        },
        {
            // 'publishable'
            boxes: [{ l: 'Publishable', k: 'slot' }],
            layer: 'Publish',
            layerSub: 'Publishable', // 'publishable'
        },
    ],
    focus: 0,
    notes: [
        { n: 1, t: 'Chat-first studio' }, // 'A chat-first studio'
        { n: 2, t: 'API URL is optional' }, // 'an optional API URL'
        { n: 3, t: 'Versioned, publishable UI widget' }, // 'a versioned, publishable UI widget'
    ],
    detail: {
        row: 2,
        title: 'Versions', // 'versioned'
        draw(p, t) {
            // A message (and the optional API URL) on the left.
            p.at(t, 0.15, 0.5);
            p.rr(440, 505, 120, 34, 10, 'hug');
            p.rr(440, 550, 120, 26, 4, 'slot');
            p.at(t + 0.5, 0.06, 0.35);
            p.slotLabel(440, 505, 120, 34, 'Message');
            p.slotLabel(440, 550, 120, 26, 'API URL · optional');
            // 'becomes'
            p.at(t + 0.5, 0.12, 0.45);
            p.flow(566, 522, 652, 540);
            p.flow(566, 563, 652, 552);
            p.at(t + 0.9, 0, 0.35);
            p.tx(606, 518, 'Becomes', 'dts', { 'text-anchor': 'middle' });
            // The widget with its versions stacked behind it ('versioned').
            p.at(t + 0.7, 0.15, 0.5);
            p.rr(684, 488, 140, 90, 8, 'ph');
            p.rr(672, 498, 140, 90, 8, 'ph');
            p.rr(660, 508, 140, 90, 8, 'obj');
            p.at(t + 1.1, 0.06, 0.4);
            p.xbox(672, 520, 40, 30);
            p.rr(720, 520, 68, 12, 2, 'slot');
            p.rr(720, 538, 50, 12, 2, 'slot');
            p.slotLabel(660, 560, 140, 30, 'UI widget');
            p.at(t + 1.4, 0.1, 0.4);
            p.callout(740, 488, 724, 474, 'Versioned', -1);
            p.callout(796, 580, 780, 612, 'Publishable', -1);
        },
    },
};

// ---------------------------------------------------------------------------------------------------------------
// Spatial: development-time render counts, layout shifts, frame drops and available browser memory.
// ---------------------------------------------------------------------------------------------------------------
const spatial: Assembly = {
    rows: [
        {
            // 'in a running app'
            boxes: [{ l: 'Running app', k: 'x' }],
            layer: 'App',
            layerSub: 'Running', // 'a running app'
            note: 1,
        },
        {
            boxes: [
                { l: 'Render', sub: 'Counts' }, // 'render counts'
                { l: 'Layout', sub: 'Shifts' }, // 'layout shifts'
                { l: 'Frame drops' }, // 'Frame drops'
                { l: 'Memory', sub: 'If available' }, // optional browser memory instrumentation
            ],
            layer: 'Signals',
            layerSub: 'Renders · shifts · drops · memory', // 'render counts, layout shifts, Frame drops and memory'
            note: 2,
        },
        {
            // 'Detects'
            boxes: [{ l: 'Detection', k: 'hug' }],
            edge: 'From', // 'from render counts, …'
            layer: 'Detection',
            layerSub: 'Detects', // 'Detects'
        },
        {
            // 'UI performance anti-patterns'
            boxes: [{ l: 'Anti-patterns', sub: 'UI performance', k: 'hatch' }],
            layer: 'Anti-patterns',
            layerSub: 'UI performance', // 'UI performance anti-patterns'
            note: 3,
        },
    ],
    focus: 1,
    notes: [
        { n: 1, t: 'In a running app' }, // 'in a running app'
        { n: 2, t: 'Render counts, layout shifts, Frame drops, memory' }, // 'render counts, layout shifts, Frame drops and memory'
        { n: 3, t: 'Detects UI performance anti-patterns' }, // 'Detects UI performance anti-patterns'
    ],
    detail: {
        row: 1,
        title: 'Signals', // the four things it reads: 'render counts, layout shifts, Frame drops and memory'
        draw(p, t) {
            const sig = ['Render counts', 'Layout shifts', 'Frame drops', 'Memory'];
            // The running app.
            p.at(t, 0.1, 0.6);
            p.xbox(440, 500, 110, 80);
            p.at(t + 0.4, 0, 0.35);
            p.tx(495, 596, 'Running app', 'dts', { 'text-anchor': 'middle' });
            // One probe per signal.
            p.at(t + 0.4, 0.1, 0.4);
            sig.forEach((_, i) => p.flow(554, 510 + i * 20, 596, 508 + i * 26));
            p.at(t + 0.6, 0.1, 0.45);
            sig.forEach((_, i) => p.rr(600, 498 + i * 26, 116, 20, 3, 'well'));
            p.at(t + 0.9, 0.08, 0.35);
            sig.forEach((s, i) => p.slotLabel(600, 498 + i * 26, 116, 20, s, 'l'));
            // 'Detects … anti-patterns'
            p.at(t + 1.1, 0.06, 0.4);
            sig.forEach((_, i) => p.line(720, 508 + i * 26, 744, 547, 'dl'));
            p.flow(744, 547, 772, 547);
            p.rr(778, 527, 68, 40, 2, 'thin');
            p.hatchRect(778, 527, 68, 40, 2, 0.6);
            p.at(t + 1.5, 0.06, 0.35);
            p.tx(812, 582, 'Anti-patterns', 'dts', { 'text-anchor': 'middle' });
            p.tx(812, 519, 'Detects', 'dts', { 'text-anchor': 'middle' });
        },
    },
};

// ---------------------------------------------------------------------------------------------------------------
// Sidecar: public runtime prototype; the generator package is absent from the inspected public tree.
// Show supported loading boundaries, not an achieved size or guaranteed sequential load phases.
// ---------------------------------------------------------------------------------------------------------------
const sidecar: Assembly = {
    rows: [
        {
            // 'per image'
            boxes: [{ l: 'Image', k: 'x' }],
            layer: 'Image',
            layerSub: 'Progressive loading', // 'Progressive image loading'
        },
        {
            // Runtime input already exists as a binary sidecar.
            boxes: [{ l: 'Binary input', k: 'well' }],
            layer: 'Binary input',
            layerSub: 'Prototype format', // public runtime input
        },
        {
            // 'a tiny binary sidecar per image'
            boxes: [{ l: 'Sidecar', sub: 'Tiny · binary', k: 'hug' }],
            edge: 'Parses', // parser input
            layer: 'Sidecar',
            layerSub: 'Tiny · binary', // 'tiny binary sidecar'
            note: 1,
        },
        {
            // Browser runtime supports intermediate previews and a full-image fallback.
            boxes: [{ l: 'Runtime', sub: 'Prototype', k: 'well' }],
            edge: 'Preview / full', // fallback capability
            layer: 'Runtime',
            layerSub: 'Preview / full fallback', // supported fallback behavior
            note: 2,
        },
    ],
    focus: 2,
    notes: [
        { n: 1, t: 'Tiny binary sidecar per image' }, // 'a tiny binary sidecar per image'
        { n: 2, t: 'Browser runtime · prototype' }, // Browser runtime supports intermediate previews and a full-image fallback.
        { t: 'Preview or full-image fallback' }, // fallback capability
    ],
    detail: {
        row: 2,
        title: 'Sidecar', // 'tiny binary sidecar per image'
        draw(p, t) {
            // The image and its tiny sidecar.
            p.at(t, 0.15, 0.6);
            p.xbox(440, 492, 120, 90);
            p.rr(566, 562, 16, 20, 1, 'hug');
            p.at(t + 0.6, 0.06, 0.35);
            p.tx(500, 598, 'Image', 'dts', { 'text-anchor': 'middle' });
            p.callout(574, 562, 604, 506, 'Sidecar · tiny · binary');
            // Runtime capability; no measured distribution-size claim.
            p.at(t + 0.6, 0.12, 0.5);
            p.flow(586, 572, 696, 568);
            p.rr(700, 552, 110, 34, 4, 'well');
            p.at(t + 1.0, 0.05, 0.4);
            p.slotLabel(700, 552, 110, 34, 'Runtime');
            p.dimH(700, 810, 538, 552, 552, 'Prototype');
            p.tx(755, 600, 'Preview / full fallback', 'dts', { 'text-anchor': 'middle' });
        },
    },
    // Schematic section through runtime inputs and browser loading. Only the sidecar's thinness is a claim ('tiny'); thicknesses are schematic.
    section: [
        { l: 'Image', t: 24, f: 'cut' }, // 'per image'
        { l: 'Binary input', t: 12, f: 'seen' }, // Runtime input already exists as a binary sidecar.
        { l: 'Sidecar · tiny · binary', t: 4, f: 'solid' }, // 'a tiny binary sidecar'
        { l: 'Browser runtime · prototype', t: 8, f: 'cut2' }, // Browser runtime supports intermediate previews and a full-image fallback.
    ],
};

// ---------------------------------------------------------------------------------------------------------------
// Video Light Sync: 'Syncs what is on screen to Yeelight and WLED smart lights in real time, through a local
// Electron hub.'
// ---------------------------------------------------------------------------------------------------------------
const videoLightSync: Assembly = {
    rows: [
        {
            // 'what is on screen'
            boxes: [{ l: 'On screen', k: 'x' }],
            layer: 'Screen',
            layerSub: 'What is on screen', // 'what is on screen'
        },
        {
            // 'through a local Electron hub'
            boxes: [{ l: 'Local hub', sub: 'Electron', k: 'hug' }],
            edge: 'Syncs', // 'Syncs'
            layer: 'Hub',
            layerSub: 'Local · Electron', // 'a local Electron hub'
            note: 1,
        },
        {
            boxes: [
                { l: 'Yeelight', sub: 'Smart light', k: 'well' }, // 'Yeelight … smart lights'
                { l: 'WLED', sub: 'Smart light', k: 'well' }, // 'WLED smart lights'
            ],
            edge: 'Real time', // 'in real time'
            layer: 'Lights',
            layerSub: 'Yeelight · WLED', // 'Yeelight and WLED smart lights'
            note: 2,
        },
    ],
    focus: 1,
    notes: [
        { n: 1, t: 'Through a local Electron hub' }, // 'through a local Electron hub'
        { n: 2, t: 'Smart lights, in real time' }, // 'smart lights in real time'
    ],
    detail: {
        row: 1,
        title: 'Signal path', // screen → local hub → lights, as the summary reads
        draw(p, t) {
            // The screen.
            p.at(t, 0.1, 0.6);
            p.rr(440, 498, 120, 72, 4, 'obj');
            p.line(500, 570, 500, 582, 'thin');
            p.line(478, 582, 522, 582, 'thin');
            p.at(t + 0.5, 0, 0.35);
            p.tx(500, 598, 'On screen', 'dts', { 'text-anchor': 'middle' });
            // 'through a local Electron hub', 'in real time'
            p.at(t + 0.4, 0.12, 0.45);
            p.flow(564, 534, 616, 534);
            p.rr(620, 517, 100, 34, 4, 'hug');
            p.at(t + 0.8, 0.06, 0.35);
            p.tx(590, 526, 'Syncs', 'dts', { 'text-anchor': 'middle' });
            p.tx(670, 532, 'Local hub', 'sl', { 'text-anchor': 'middle' });
            p.tx(670, 544, 'Electron', 'sl', { 'text-anchor': 'middle' });
            // The two kinds of smart light ('Yeelight and WLED').
            p.at(t + 0.8, 0.1, 0.45);
            p.flow(724, 528, 760, 512);
            p.flow(724, 540, 760, 562);
            p.circle(774, 508, 13, 'obj');
            p.circle(774, 566, 13, 'obj');
            p.at(t + 1.2, 0.05, 0.35);
            p.circle(774, 508, 5, 'thin');
            p.circle(774, 566, 5, 'thin');
            p.tx(794, 512, 'Yeelight', 'sl');
            p.tx(794, 570, 'WLED', 'sl');
            p.tx(742, 600, 'Real time', 'dts', { 'text-anchor': 'middle' });
        },
    },
};

export const ASSEMBLIES: Record<string, Assembly> = {
    eidos,
    'mcp-ui': mcpUi,
    spatial,
    sidecar,
    'video-light-sync': videoLightSync,
};

/** Fallback for a project without an entry: its stack, two items per row, top to bottom. No detail view. */
export function generic(project: Project): Assembly {
    const rows: Row[] = [];
    for (let i = 0; i < project.stack.length && rows.length < 4; i += 2) {
        const items = project.stack.slice(i, i + 2);
        rows.push({ boxes: items.map((l) => ({ l, k: 'well' as const })), layer: items.join(' · ') });
    }
    return { rows, focus: 0, notes: [] };
}
