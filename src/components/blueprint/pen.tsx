import React from 'react';

/**
 * Drawing kit for the blueprint sheets: a typed port of the helpers in enesozturk/dimensional-drawing (MIT),
 * rendered on the server as plain SVG. Each element gets a time window in scene time ([data-w] = "start end");
 * `drive.ts` turns scroll (or the clock) into scene time and draws, fades or lifts the element inside its window.
 *
 * Usage mirrors the original: set a window with `at(start, stagger, duration)`, then draw; every element drawn
 * after it gets `start + i·stagger … + duration`. Drawn strokes (`d`) trace themselves in; text, dashed and
 * hatched elements (`f`) fade; `morph` groups lift from a flat plan matrix into an axonometric one.
 */

type Attrs = Record<string, string | number | null | undefined>;
type Kind = 'd' | 'f';

/** A 2D affine matrix as SVG's matrix(a b c d e f). */
export type Mat = [number, number, number, number, number, number];

/** Plan → axonometric. `z` is lifted in sheet units; the group lifts across [a, b]. */
export type Morph = { flat: Mat; iso: Mat; z: number; a: number; b: number };

function round(v: number): number {
    return Math.round(v * 1000) / 1000;
}

const FADED = / (slot|ph|cl|env|hs) /;

/** kebab-case SVG attribute → React prop. */
function prop(k: string): string {
    if (k === 'class') return 'className';
    if (k.startsWith('data-') || k.startsWith('aria-')) return k;
    return k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** The projection the original uses for exploded views, scaled by `s`, placed at (tx, ty). */
export function iso(s: number, tx: number, ty: number): Mat {
    return [0.94 * s, 0.17 * s, -0.34 * s, 0.47 * s, tx, ty];
}

/** Map a point through a matrix, lifted by z (screen up). */
export function project(m: Mat, x: number, y: number, z = 0): [number, number] {
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5] - z];
}

export class Pen {
    /** Marker and hatch ids are prefixed so several sheets can share a page. */
    readonly arrow: string;
    readonly hatch: string;
    private kids: React.ReactNode[] = [];
    private cur = { a: 0, s: 0, d: 0.6, i: 0 };
    private still = 0;
    private n = 0;

    constructor(readonly id: string) {
        this.arrow = `url(#${id}-ar)`;
        this.hatch = `url(#${id}-ha)`;
    }

    /** Elements drawn next start at `a`, each `s` later than the previous, and take `d`. */
    at(a: number, s = 0, d = 0.6): this {
        this.cur = { a, s, d, i: 0 };
        return this;
    }

    /** Draw without a window: always visible (frames, things that must never be hidden). */
    fixed(draw: () => void): void {
        this.still++;
        draw();
        this.still--;
    }

    mk(tag: string, attrs: Attrs = {}, text?: string): void {
        const props: Record<string, unknown> = { key: this.n++ };
        for (const k in attrs) if (attrs[k] != null) props[prop(k)] = attrs[k];
        if (!this.still && tag !== 'g') {
            const s = this.cur.a + this.cur.i * this.cur.s;
            this.cur.i++;
            const k: Kind =
                tag === 'text' ||
                FADED.test(` ${attrs.class ?? ''} `) ||
                String(attrs.fill ?? '').startsWith('url')
                    ? 'f'
                    : 'd';
            props['data-k'] = k;
            props['data-w'] = `${round(s)} ${round(s + this.cur.d)}`;
            if (k === 'd') props.pathLength = 1;
        }
        this.kids.push(React.createElement(tag, props, text));
    }

    /** A group that lifts from `flat` to `iso`. Its children are not registered: the group moves as one. */
    morph(m: Morph, draw: () => void): void {
        this.still++;
        this.wrap(
            'g',
            {
                'data-k': 'm',
                'data-m': JSON.stringify(m),
                transform: `matrix(${m.flat.join(' ')})`,
                class: 'bp-morph',
            },
            draw
        );
        this.still--;
    }

    private wrap(tag: string, attrs: Attrs, draw: () => void): void {
        const outer = this.kids;
        this.kids = [];
        draw();
        const inner = this.kids;
        this.kids = outer;
        const props: Record<string, unknown> = { key: this.n++ };
        for (const k in attrs) if (attrs[k] != null) props[prop(k)] = attrs[k];
        this.kids.push(React.createElement(tag, props, ...inner));
    }

    // ---------- primitives ----------

    tx(x: number, y: number, s: string, c = 'dt', a: Attrs = {}): void {
        this.mk('text', { x, y, class: c, ...a }, s);
    }

    line(x1: number, y1: number, x2: number, y2: number, c = 'thin', a: Attrs = {}): void {
        this.mk('line', { x1, y1, x2, y2, class: c, ...a });
    }

    path(d: string, c = 'thin', a: Attrs = {}): void {
        this.mk('path', { d, class: c, ...a });
    }

    rr(x: number, y: number, w: number, h: number, r: number, c: string, a: Attrs = {}): void {
        this.mk('rect', { x, y, width: w, height: h, rx: r, class: c, ...a });
    }

    circle(cx: number, cy: number, r: number, c = 'thin', a: Attrs = {}): void {
        this.mk('circle', { cx, cy, r, class: c, ...a });
    }

    /** A rect filled with the 45° hatch (keep-outs, footprints, cut solids). */
    hatchRect(x: number, y: number, w: number, h: number, r = 0, opacity = 1): void {
        this.rr(x, y, w, h, r, 'hs', { fill: this.hatch, 'fill-opacity': opacity });
    }

    /** Box with an X: the placeholder for a lead element / image. */
    xbox(x: number, y: number, w: number, h: number): void {
        this.mk('rect', { x, y, width: w, height: h, class: 'thin' });
        this.path(`M${x},${y} l${w},${h} M${x + w},${y} l${-w},${h}`);
    }

    /** Arrow along a line (flows, data paths). */
    flow(x1: number, y1: number, x2: number, y2: number, c = 'dl'): void {
        this.line(x1, y1, x2, y2, c, { 'marker-end': this.arrow });
    }

    slotLabel(x: number, y: number, w: number, h: number, l: string, al: 'l' | 'c' = 'c'): void {
        this.tx(al === 'l' ? x + 6 : x + w / 2, y + h / 2 + 3.2, l, 'sl', {
            'text-anchor': al === 'l' ? 'start' : 'middle',
        });
    }

    /** View title, 12 px caps letter-spaced, optional 9.5 px subtitle (`SCALE 1:1 · …`). */
    title(x: number, y: number, t: string, sub?: string): void {
        this.tx(x, y, t, 'vt', { 'text-anchor': 'middle' });
        if (sub) this.tx(x, y + 14, sub, 'dts', { 'text-anchor': 'middle' });
    }

    /** Horizontal dimension. Spans under 28 put the arrows outside. */
    dimH(
        x1: number,
        x2: number,
        y: number,
        e1: number | null,
        e2: number | null,
        l: string,
        o: { below?: boolean; dx?: number; dy?: number; c?: string } = {}
    ): void {
        for (const [x, e] of [
            [x1, e1],
            [x2, e2],
        ] as const) {
            if (e == null) continue;
            const s = Math.sign(y - e) || 1;
            this.line(x, e + s * 3, x, y + s * 5, 'ext');
        }
        if (x2 - x1 >= 28)
            this.line(x1, y, x2, y, 'dl', { 'marker-start': this.arrow, 'marker-end': this.arrow });
        else {
            this.line(x1 - 13, y, x1, y, 'dl', { 'marker-end': this.arrow });
            this.line(x2 + 13, y, x2, y, 'dl', { 'marker-end': this.arrow });
        }
        this.tx((x1 + x2) / 2 + (o.dx ?? 0), (o.below ? y + 13 : y - 4) + (o.dy ?? 0), l, o.c ?? 'dt', {
            'text-anchor': 'middle',
        });
    }

    /** Vertical dimension. No `side` → rotated label. */
    dimV(
        y1: number,
        y2: number,
        x: number,
        e1: number | null,
        e2: number | null,
        l: string,
        o: { side?: 'l' | 'r'; c?: string } = {}
    ): void {
        for (const [y, e] of [
            [y1, e1],
            [y2, e2],
        ] as const) {
            if (e == null) continue;
            const s = Math.sign(x - e) || 1;
            this.line(e + s * 3, y, x + s * 5, y, 'ext');
        }
        if (y2 - y1 >= 28)
            this.line(x, y1, x, y2, 'dl', { 'marker-start': this.arrow, 'marker-end': this.arrow });
        else {
            this.line(x, y1 - 13, x, y1, 'dl', { 'marker-end': this.arrow });
            this.line(x, y2 + 13, x, y2, 'dl', { 'marker-end': this.arrow });
        }
        const c = (y1 + y2) / 2;
        if (o.side) {
            const r = o.side === 'r';
            this.tx(r ? x + 6 : x - 6, c + 4, l, o.c ?? 'dt', { 'text-anchor': r ? 'start' : 'end' });
        } else
            this.tx(x - 5, c, l, o.c ?? 'dt', {
                'text-anchor': 'middle',
                transform: `rotate(-90 ${x - 5} ${c})`,
            });
    }

    /** Dot + leader + shoulder + label. */
    callout(px: number, py: number, ex: number, ey: number, l: string, dir?: 1 | -1, c = 'dt'): void {
        const s = dir ?? (ex >= px ? 1 : -1);
        this.circle(px, py, 1.8, 'dot');
        this.mk('polyline', { points: `${px},${py} ${ex},${ey} ${ex + s * 10},${ey}`, class: 'lead' });
        this.tx(ex + s * 14, ey + 4, l, c, { 'text-anchor': s > 0 ? 'start' : 'end' });
    }

    /** Radius callout on a corner ('tl' | 'tr' | 'bl' | 'br'). */
    rad(cx: number, cy: number, r: number, corner: string, l: string, len: number): void {
        const sx = corner.includes('l') ? -1 : 1;
        const sy = corner.includes('t') ? -1 : 1;
        const ox = cx - sx * r;
        const oy = cy - sy * r;
        const px = ox + sx * r * Math.SQRT1_2;
        const py = oy + sy * r * Math.SQRT1_2;
        this.callout(px, py, px + sx * len, py + sy * len, l, sx as 1 | -1);
    }

    /** Boxed note number. */
    nb(x: number, y: number, n: number | string): void {
        this.mk('rect', { x: x - 6, y: y - 6, width: 12, height: 12, class: 'nb' });
        this.tx(x, y + 3.5, String(n), 'nbt', { 'text-anchor': 'middle' });
    }

    /** Dashed detail circle with a leader to its label. */
    detailRef(cx: number, cy: number, r: number, lbl: string, lx: number, ly: number): void {
        this.circle(cx, cy, r, 'ph');
        const a = Math.atan2(ly - cy, lx - cx);
        this.line(cx + r * Math.cos(a), cy + r * Math.sin(a), lx, ly, 'lead');
        this.tx(lx + (lx < cx ? -4 : 4), ly + 4, lbl, 'dts', { 'text-anchor': lx < cx ? 'end' : 'start' });
    }

    /** Arrow marker and 45° hatch for this sheet. Not timed. */
    private defs(): React.ReactNode {
        const id = this.id;
        return (
            <defs key="defs">
                <marker
                    id={`${id}-ar`}
                    viewBox="0 0 10 10"
                    refX={10}
                    refY={5}
                    markerWidth={7}
                    markerHeight={7}
                    orient="auto-start-reverse"
                    markerUnits="userSpaceOnUse"
                >
                    <path d="M0,1.7 L10,5 L0,8.3 z" className="arrow" />
                </marker>
                <pattern
                    id={`${id}-ha`}
                    width={5}
                    height={5}
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <line x1={0} y1={0} x2={0} y2={5} className="hl" />
                </pattern>
            </defs>
        );
    }

    /**
     * The finished drawing. With `cam`, everything sits in a camera group that `drive.ts` moves
     * (keys on the enclosing `<Scene cam>`).
     */
    render(o: { cam?: boolean } = {}): React.ReactNode {
        const body = o.cam ? (
            <g key="cam" className="bp-cam">
                {this.kids}
            </g>
        ) : (
            this.kids
        );
        return [this.defs(), body];
    }
}
