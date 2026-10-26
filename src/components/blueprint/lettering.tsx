import React from 'react';

import { GLYPHS } from './lettering-data';

/**
 * Pen-drawn lettering: text set in single-stroke Hershey Simplex caps, every stroke a `pathLength=1` path with
 * its own window, so the driver draws the word the way a plotter pen letters a drawing: stroke by stroke inside
 * a letter, letter by letter left to right (each letter starts a little after the previous one, in proportion
 * to how much ink came before it). It runs in its own `clock` scene, so it plays once when it comes into view;
 * without JS or with reduced motion it shows finished.
 *
 * The real text is in the element (visually hidden) for assistive tech, search and copy; the SVG is decoration.
 * The SVG is sized in `em`, so it takes exactly the box the text would and scales with the element's font-size.
 */

/** Hershey cap height in glyph units (caps run from y = 1 to the baseline at y = 22). */
const CAP = 21;
const TOP = 1;
const BASE = 22;
/** Word space, in em: Arimo's (Hershey's own 16 units reads too wide beside letter-spaced caps). */
const SPACE = 0.28;

type Stroke = { d: string; len: number; a: number; b: number };
type Glyph = { strokes: Stroke[]; ink: number };
type Box = { x0: number; x1: number; y0: number; y1: number };

function r2(v: number): number {
    return Math.round(v * 100) / 100;
}

/** One glyph's strokes, moved right by `x`; grows `box` to the ink. */
function strokes(path: string, x: number, box: Box): Glyph {
    const out: Stroke[] = [];
    let ink = 0;
    for (const sub of path.split(/(?=M)/)) {
        const n = sub.slice(1).replace('L', ' ').trim().split(/\s+/).map(Number);
        const pts: string[] = [];
        let len = 0;
        for (let i = 0; i < n.length; i += 2) {
            const px = n[i] + x;
            const py = n[i + 1];
            if (i) len += Math.hypot(n[i] - n[i - 2], py - n[i - 1]);
            box.x0 = Math.min(box.x0, px);
            box.x1 = Math.max(box.x1, px);
            box.y0 = Math.min(box.y0, py);
            box.y1 = Math.max(box.y1, py);
            pts.push(`${r2(px)} ${py}`);
        }
        out.push({ d: `M${pts[0]}L${pts.slice(1).join(' ')}`, len, a: 0, b: 0 });
        ink += len;
    }
    return { strokes: out, ink };
}

/** Lays the text out in glyph units (`em` units per em, `track` after each letter). */
function layout(text: string, em: number, track: number): { glyphs: Glyph[]; box: Box } {
    const box: Box = { x0: Infinity, x1: -Infinity, y0: TOP, y1: BASE };
    const glyphs: Glyph[] = [];
    let x = 0;
    for (const ch of text.toUpperCase()) {
        const g = GLYPHS[ch];
        if (!g) {
            x += SPACE * em + track;
            continue;
        }
        glyphs.push(strokes(g[1], x, box));
        x += g[0] + track;
    }
    if (!glyphs.length) box.x0 = box.x1 = 0;
    return { glyphs, box };
}

/** Letter i starts after the share of all ink drawn before it; its strokes split `letter` seconds by length. */
function time(glyphs: Glyph[], T: number, letter: number): void {
    const total = glyphs.reduce((s, g) => s + g.ink, 0) || 1;
    const span = Math.max(0, T - letter);
    let before = 0;
    for (const g of glyphs) {
        const start = (before / total) * span;
        let done = 0;
        for (const s of g.strokes) {
            s.a = r2(start + (done / (g.ink || 1)) * letter);
            done += s.len;
            s.b = r2(start + (done / (g.ink || 1)) * letter);
        }
        before += g.ink;
    }
}

type LetteringProps = {
    text: string;
    /** Cap height, in em of the element's font-size (Arimo's is 0.716). */
    size?: number;
    /** Extra space after each letter, in em (like CSS letter-spacing). */
    tracking?: number;
    /** Stroke weight in px at a 16.8 px font-size (scales with it). */
    weight?: number;
    /** Scene length in seconds. */
    T?: number;
    /** Seconds one letter takes to draw. */
    letter?: number;
    as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
    id?: string;
    className?: string;
};

export function Lettering({
    text,
    size = 0.72,
    tracking = 0.16,
    weight = 1.3,
    T = 1.2,
    letter = 0.3,
    as: Tag = 'span',
    id,
    className,
}: LetteringProps): React.JSX.Element {
    const em = CAP / size; // glyph units per em
    const { glyphs, box } = layout(text, em, tracking * em);
    time(glyphs, T, letter);

    const sw = r2(weight / ((16.8 * size) / CAP));
    const pad = sw / 2 + 0.5;
    const vx = r2(box.x0 - pad);
    const vy = r2(box.y0 - pad);
    const w = r2(box.x1 - box.x0 + 2 * pad);
    const h = r2(box.y1 - box.y0 + 2 * pad);
    const toEm = (v: number): string => `${Math.round((v / em) * 1e5) / 1e5}em`;

    // Its own `clock` scene (the attributes `Scene` renders; importing it here would make an import cycle with
    // `SheetFrame`): the driver plays it once it is well inside the viewport.
    return (
        <div data-sheet="" data-mode="clock" data-t={T} className="bp-let-scene">
            <Tag id={id} className={className}>
                <span className="sr-only">{text}</span>
                <svg
                    className="bp-let"
                    viewBox={`${vx} ${vy} ${w} ${h}`}
                    aria-hidden="true"
                    focusable="false"
                    style={{ width: toEm(w), aspectRatio: `${w} / ${h}`, verticalAlign: toEm(BASE - vy - h) }}
                >
                    <g
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={sw}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {glyphs.flatMap((g) =>
                            g.strokes.map((s) => (
                                <path key={s.d} d={s.d} pathLength={1} data-k="d" data-w={`${s.a} ${s.b}`} />
                            ))
                        )}
                    </g>
                </svg>
            </Tag>
        </div>
    );
}
