import React from 'react';

import { type Mat, Pen } from '@/components/blueprint/pen';
import { type CamKey, Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { noteId, resultId, revOf, sourceOf } from '@/components/blueprint/xref';
import { SITE } from '@/content/site';
import type { Impact } from '@/content/types';

import './results.css';

/**
 * Sheet 2 · Measured results. Every entry of SITE.practice.impact becomes a dimension study, chosen by parsing its
 * value string (nothing is written per fact):
 *
 *   "70% → 15%", "15 → 3 min"  before / after: a bar drawn at the BEFORE length shrinks (or grows) to the AFTER
 *                              length, exactly in proportion; a long-dash phantom keeps the BEFORE size.
 *   "200+"                     count: exactly that many boxes drawn one by one, a counter and a dimension chain.
 *   "−30%"                     reduction: a 100-unit length, a cut sweeps in, the removed part is hatched.
 *
 * The pin scene's camera lands on one study at a time and pulls back to the whole sheet at the end. Numbers in the
 * drawing count while the dimension moves; the HTML list always states the values exactly as SITE does.
 */

const CW = 500; // one study cell, sheet units
const CH = 320;
const SEG = 3.2; // scene time per study (camera travel + drawing + hold)
const LEAD = 0.5; // scene time before the first study draws

type Kind = 'delta' | 'count' | 'cut' | 'plain';

type Study = {
    kind: Kind;
    /** The value split around its numbers: even indices are text, odd indices are numbers (as written). */
    parts: string[];
    nums: number[];
    dec: number;
    /** Text after the last number ("%", " min", "+"). */
    tail: string;
    label: string;
    org?: string;
    /** Scene time this study starts drawing. */
    s: number;
};

function parse(it: Impact, i: number): Study {
    const parts = it.value.split(/(\d+(?:\.\d+)?)/);
    const raw = parts.filter((_, j) => j % 2);
    const nums = raw.map(Number);
    const dec = Math.max(0, ...raw.map((r) => (r.split('.')[1] ?? '').length));
    const tail = parts[parts.length - 1];
    const cut = it.label.lastIndexOf(' · ');
    const label = cut > 0 ? it.label.slice(0, cut) : it.label;
    const org = cut > 0 ? it.label.slice(cut + 3) : undefined;
    let kind: Kind = 'plain';
    if (nums.length === 2 && parts[2].includes('→') && nums[0] > 0 && nums[1] > 0) kind = 'delta';
    else if (nums.length === 1 && tail.trim() === '+' && nums[0] >= 2 && nums[0] <= 400 && !dec)
        kind = 'count';
    else if (nums.length === 1 && /^[−-]$/.test(parts[0].trim()) && tail.trim() === '%' && nums[0] < 100)
        kind = 'cut';
    return { kind, parts, nums, dec, tail, label, org, s: LEAD + i * SEG };
}

/** "%" stays tight; words get a space ("3 MIN"). */
function unitOf(tail: string): string {
    const t = tail.trim();
    return !t ? '' : t === '%' ? '%' : ` ${t}`;
}

const STEPS = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
const nice = (v: number): number => STEPS.find((s) => s >= v) ?? v;

/** Arrowhead (7 long, like the marker) with its tip at (x, y), pointing along `dir`. */
const arrow = (x: number, y: number, dir: 1 | -1): string => `M${x},${y} l${-dir * 7},-2.3 l0,4.6 z`;

/** Register an element inside a morph group (whose children are otherwise untimed). */
function reg(
    p: Pen,
    tag: string,
    attrs: Record<string, string | number>,
    k: 'd' | 'f',
    a: number,
    b: number
): void {
    p.mk(tag, { ...attrs, 'data-k': k, 'data-w': `${a} ${b}`, ...(k === 'd' ? { pathLength: 1 } : {}) });
}

/** A number in the drawing that counts inside [a, b] (the driver's `n` kind); the server renders `to`. */
function count(
    p: Pen,
    x: number,
    y: number,
    from: number,
    to: number,
    dec: number,
    a: number,
    b: number
): void {
    p.mk(
        'text',
        {
            x,
            y,
            class: 'dt rs-num',
            'text-anchor': 'end',
            'data-k': 'n',
            'data-w': `${a} ${b}`,
            'data-from': from,
            'data-to': to,
            'data-dec': dec,
        },
        to.toFixed(dec)
    );
}

/** Width of `n` tabular digits in the 14 px drawing numerals. */
const digits = (n: number, dec: number): number => n.toFixed(dec).length * 7.8;

const scaleX = (r: number, x: number): Mat => [r, 0, 0, 1, x * (1 - r), 0];
const shiftX = (dx: number): Mat => [1, 0, 0, 1, dx, 0];
const ID: Mat = [1, 0, 0, 1, 0, 0];

function frame(p: Pen, st: Study, i: number, ox: number, oy: number, kind: string): void {
    p.at(st.s - 0.35, 0, 0.3);
    p.nb(ox + 22, oy + 24, i + 1);
    p.at(st.s + 2.2, 0.08, 0.4);
    p.title(ox + CW / 2, oy + 286, `Detail ${String.fromCharCode(65 + i)} · ${kind}`, st.org);
}

/** Before → after: the bar is measured at BEFORE, then its length settles at AFTER. */
function delta(p: Pen, st: Study, ox: number, oy: number): void {
    const [b, a] = st.nums;
    const s = st.s;
    const u = unitOf(st.tail);
    const pct = st.tail.trim() === '%';
    const max = pct ? 100 : Math.max(a, b);
    const x0 = ox + 92;
    const L = 360;
    const k = L / max;
    const B = b * k;
    const A = a * k;
    const r = a / b;

    // Reference scale: minor ticks ≤ 20, labelled majors ≤ 4 divisions.
    const minor = nice(max / 20);
    const major = nice(max / 4);
    const ay = oy + 70;
    p.at(s - 0.2, 0, 0.5);
    p.line(x0, ay, x0 + L, ay, 'thin');
    const n = Math.floor(max / minor + 1e-6);
    p.at(s - 0.1, 0.5 / n, 0.2);
    for (let j = 0; j <= n; j++) {
        const v = j * minor;
        const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
        p.line(x0 + v * k, ay, x0 + v * k, ay - (isMajor ? 8 : 4), 'thin');
    }
    p.at(s + 0.1, 0.06, 0.3);
    for (let v = 0; v <= max + 1e-6; v += major)
        p.tx(x0 + v * k, ay - 13, `${v}${v + major > max + 1e-6 ? u : ''}`, 'dts', {
            'text-anchor': 'middle',
        });
    p.at(s + 0.3, 0, 0.3);
    p.tx(x0 - 14, ay + 4, '(REF)', 'dts', { 'text-anchor': 'end' });

    // The object: phantom keeps BEFORE, the solid bar draws at BEFORE and then settles at AFTER.
    const by = oy + 124;
    const bh = 34;
    const t0 = s + 1.25;
    const t1 = s + 2.35;
    p.at(s + 0.35, 0, 0.5);
    p.rr(x0, by, B, bh, 0, 'ph');
    // Built from parts so nothing is stretched across its stroke: the fill and the horizontal edges scale along
    // x (their stroke weight is in y), the far edge rides on the end, the near edge stays put.
    const yb = by + bh;
    p.morph({ flat: ID, iso: scaleX(r, x0), z: 0, a: t0, b: t1 }, () => {
        reg(
            p,
            'rect',
            { x: x0, y: by, width: B, height: bh, class: 'rs-bar rs-fill' },
            'f',
            s + 0.75,
            s + 1.05
        );
        reg(p, 'line', { x1: x0, y1: by, x2: x0 + B, y2: by, class: 'rs-edge' }, 'd', s + 0.35, s + 0.7);
        reg(p, 'line', { x1: x0 + B, y1: yb, x2: x0, y2: yb, class: 'rs-edge' }, 'd', s + 0.72, s + 1.0);
    });
    p.morph({ flat: ID, iso: shiftX(A - B), z: 0, a: t0, b: t1 }, () => {
        reg(
            p,
            'line',
            { x1: x0 + B, y1: by, x2: x0 + B, y2: yb, class: 'rs-bar rs-edge' },
            'd',
            s + 0.68,
            s + 0.74
        );
    });
    p.at(s + 0.98, 0, 0.08);
    p.line(x0, yb, x0, by, 'rs-edge');

    // BEFORE dimension (static) above the bar.
    const dy1 = oy + 104;
    p.at(s + 0.85, 0.04, 0.35);
    p.dimH(x0, x0 + B, dy1, by, by, `${st.parts[1]}${unitOf(st.parts[2].split('→')[0]) || u}`);
    p.tx(x0 - 14, dy1 + 4, 'Before', 'dts', { 'text-anchor': 'end' });

    // AFTER dimension below: its free end rides on the bar's end while the number counts.
    const dy2 = oy + 196;
    p.at(t0 - 0.15, 0.04, 0.3);
    p.line(x0, by + bh + 3, x0, dy2 + 5, 'ext');
    p.path(arrow(x0, dy2, -1), 'arrow');
    p.tx(x0 - 14, dy2 + 4, 'After', 'dts', { 'text-anchor': 'end' });
    p.morph({ flat: ID, iso: scaleX(r, x0), z: 0, a: t0, b: t1 }, () => {
        p.line(x0, dy2, x0 + B, dy2, 'dl');
    });
    p.morph({ flat: ID, iso: shiftX(A - B), z: 0, a: t0, b: t1 }, () => {
        const xe = x0 + B;
        p.line(xe, by + bh + 3, xe, dy2 + 5, 'ext');
        p.path(arrow(xe, dy2, 1), 'arrow');
        const xn = xe + 10 + digits(Math.max(a, b), st.dec);
        count(p, xn, dy2 + 5, b, a, st.dec, t0, t1);
        if (u) p.tx(xn + (u.startsWith(' ') ? 5 : 1), dy2 + 5, u.trim(), 'dt', { 'text-anchor': 'start' });
    });

    p.at(t1 - 0.05, 0, 0.35);
    p.tx(x0, oy + 236, `After ÷ before = ${st.parts[3]} ÷ ${st.parts[1]}`, 'dts');
}

/** Count: exactly N boxes, drawn one after another, measured by a dimension chain. */
function countStudy(p: Pen, st: Study, ox: number, oy: number): void {
    const N = st.nums[0];
    const s = st.s;
    const cols = Math.ceil(Math.sqrt(2 * N));
    const rows = Math.ceil(N / cols);
    const pitch = Math.min(340 / (cols + 1), 150 / rows);
    const box = pitch * 0.74;
    const gap = pitch - box;
    const gw = cols * pitch - gap;
    const gh = rows * pitch - gap;
    const gx = ox + CW / 2 - (gw + pitch) / 2 + 6;
    const gy = oy + 84;
    const dur = 1.6;

    p.at(s, dur / N, 0.14);
    for (let j = 0; j < N; j++)
        p.rr(gx + (j % cols) * pitch, gy + Math.floor(j / cols) * pitch, box, box, 0, 'hug rs-box');

    // The "+": a phantom column beyond the last one, more of the same.
    p.at(s + dur, 0, 0.4);
    p.rr(gx + gw + gap * 2, gy, box, gh, 0, 'ph');
    p.tx(gx + gw + gap * 2 + box / 2, gy - 8, '+', 'dt', { 'text-anchor': 'middle' });

    // Dimensions: columns on top, rows on the left, a chain of fives underneath.
    p.at(s + 0.9, 0.05, 0.35);
    p.dimH(gx, gx + gw, gy - 16, gy, gy, `${cols} col`);
    p.dimV(gy, gy + gh, gx - 16, gx, gx, `${rows} row`);
    const chunk = cols % 5 === 0 && cols > 5 ? 5 : cols;
    p.at(s + 1.3, 0.12, 0.35);
    for (let c = 0; c < cols; c += chunk) {
        const xa = gx + c * pitch;
        const xb = gx + Math.min(cols, c + chunk) * pitch - gap;
        p.dimH(xa, xb, gy + gh + 14, gy + gh, gy + gh, String(Math.min(chunk, cols - c)), { below: true });
    }

    // Counter, top left beside the note number.
    p.at(s - 0.1, 0, 0.3);
    p.tx(ox + 38, oy + 29, 'N =', 'dt');
    const xn = ox + 70 + digits(N, 0);
    p.fixed(() => count(p, xn, oy + 29, 0, N, 0, s, s + dur + 0.14));
    p.at(s + dur, 0, 0.4);
    p.tx(xn + 8, oy + 29, `(REF ${st.parts.join('').trim()})`, 'dts');
}

/** Reduction: a length of 100 units; a cut sweeps in and the removed material is hatched. */
function cutStudy(p: Pen, st: Study, ox: number, oy: number): void {
    const c = st.nums[0];
    const s = st.s;
    const x0 = ox + 70;
    const L = 320;
    const xe = x0 + L;
    const xc = x0 + L * (1 - c / 100);
    const by = oy + 110;
    const bh = 34;
    const t0 = s + 1.0;
    const t1 = s + 2.1;

    p.at(s, 0, 0.6);
    p.rr(x0, by, L, bh, 0, 'obj');
    p.at(s + 0.55, 0.04, 0.35);
    p.dimH(x0, xe, oy + 88, by, by, '100 (REF)');

    // The cut: the saw line sweeps from the end; the cut dimension grows behind it while the number counts.
    const dy = oy + 184;
    p.at(t0 - 0.15, 0.04, 0.3);
    p.line(xe, by + bh + 3, xe, dy + 5, 'ext');
    p.path(arrow(xe, dy, 1), 'arrow');
    p.morph({ flat: scaleX(0.001, xe), iso: ID, z: 0, a: t0, b: t1 }, () => {
        p.line(xc, dy, xe, dy, 'dl');
    });
    p.morph({ flat: shiftX(xe - xc), iso: ID, z: 0, a: t0, b: t1 }, () => {
        p.line(xc, by - 12, xc, by + bh + 12, 'thin rs-saw');
        p.line(xc, by + bh + 3, xc, dy + 5, 'ext');
        p.path(arrow(xc, dy, -1), 'arrow');
        // Label inside the cut span, riding on its moving end: sign, counting number, unit.
        p.tx(xc + 8, dy - 5, st.parts[0].trim(), 'dt', { 'text-anchor': 'start' });
        const xn = xc + 16 + digits(c, st.dec);
        count(p, xn, dy - 5, 0, c, st.dec, t0, t1);
        p.tx(xn + 1, dy - 5, '%', 'dt', { 'text-anchor': 'start' });
    });

    // Removed material, then the length that remains (a formula, not a new number).
    p.at(t1 - 0.15, 0, 0.45);
    p.hatchRect(xc, by, xe - xc, bh);
    p.at(t1, 0, 0.3);
    p.line(xc, by, xc, by + bh, 'obj');
    p.at(t1 + 0.1, 0.04, 0.35);
    p.line(x0, by + bh + 3, x0, dy + 5, 'ext');
    p.dimH(x0, xc, dy, null, null, `100 − ${st.parts[1]}`, { below: true });
    p.callout(xc + (xe - xc) / 2 + 8, by + 8, xe + 12, by - 12, 'Removed', 1);
}

/** Anything else: one plain dimension carrying the value. */
function plainStudy(p: Pen, st: Study, ox: number, oy: number): void {
    p.at(st.s, 0, 0.5);
    p.rr(ox + 70, oy + 120, 360, 34, 0, 'obj');
    p.at(st.s + 0.5, 0.05, 0.35);
    p.dimH(ox + 70, ox + 430, oy + 100, oy + 120, oy + 120, st.parts.join('').trim());
}

/** When each kind's measured number counts, relative to the study's start (same windows as the drawing). */
const KINDS: Record<Kind, string> = {
    delta: 'Before / after',
    count: 'Count',
    cut: 'Reduction',
    plain: 'Value',
};

export default function Results(): React.JSX.Element | null {
    const impact = SITE.practice.impact ?? [];
    if (!impact.length) return null;
    const meta = sheet('results');
    const studies = impact.map(parse);
    const src = impact.map(sourceOf);
    const rev = sheet('revisions');
    const cols = studies.length > 1 ? 2 : 1;
    const rows = Math.ceil(studies.length / cols);
    const W = cols * CW;
    const H = rows * CH;
    const at = (i: number): [number, number] => [(i % cols) * CW, Math.floor(i / cols) * CH];

    const p = new Pen('rs');
    studies.forEach((st, i) => {
        const [ox, oy] = at(i);
        frame(p, st, i, ox, oy, KINDS[st.kind]);
        if (st.kind === 'delta') delta(p, st, ox, oy);
        else if (st.kind === 'count') countStudy(p, st, ox, oy);
        else if (st.kind === 'cut') cutStudy(p, st, ox, oy);
        else plainStudy(p, st, ox, oy);
    });
    // A faint centreline grid between the studies once the whole sheet is in view.
    const tEnd = LEAD + studies.length * SEG;
    p.at(tEnd - 0.4, 0.05, 0.6);
    for (let c = 1; c < cols; c++) p.line(c * CW, 16, c * CW, H - 16, 'cl');
    for (let r = 1; r < rows; r++) p.line(16, r * CH, W - 16, r * CH, 'cl');

    // Camera: land on each study while it draws, then pull back to the whole sheet.
    const T = tEnd + 1.6;
    const centre = (i: number): [number, number] => [at(i)[0] + CW / 2, at(i)[1] + CH / 2 - 8];
    const keys = (z: number, end: boolean): CamKey[] => {
        const k: CamKey[] = [];
        studies.forEach((st, i) => {
            const [cx, cy] = centre(i);
            k.push([i ? st.s - 0.15 : 0, cx, cy, z], [st.s + 2.55, cx, cy, z]);
        });
        if (end) k.push([T - 0.4, W / 2, H / 2, 1], [T, W / 2, H / 2, 1]);
        return k;
    };

    return (
        <section id={meta.id} aria-labelledby="results-h" className="rs">
            <Scene
                mode="pin"
                T={T}
                len={3.6}
                lead={0.7}
                cam={keys(1.85, true)}
                camSm={keys(2, false)}
                stageClassName="rs-stage"
            >
                <SheetFrame
                    n={meta.n}
                    of={SHEET_COUNT}
                    title={meta.title}
                    sub={`What changed · ${studies.length} dimension studies`}
                    headingId="results-h"
                    className="rs-sheet"
                >
                    <div className="rs-body">
                        <div className="rs-col">
                            <ol className="rs-list">
                                {studies.map((st, i) => (
                                    <li key={st.label} id={resultId(i)} className="rs-item">
                                        <span className="rs-nb" aria-hidden="true">
                                            {i + 1}
                                        </span>
                                        {/* The value exactly as SITE states it; only the drawing counts. */}
                                        <p className="rs-value">{st.parts.join('')}</p>
                                        <p className="rs-label">{st.label}</p>
                                        {st.org ? (
                                            <p className="rs-org">
                                                {st.org}
                                                {src[i] ? (
                                                    <>
                                                        {' · '}
                                                        <a
                                                            href={`#${noteId(revOf(src[i]!.row), src[i]!.note + 1)}`}
                                                            className="rs-xref"
                                                            aria-label={`See sheet ${rev.n}, revision ${revOf(src[i]!.row)}, note ${src[i]!.note + 1}`}
                                                        >
                                                            See Rev {revOf(src[i]!.row)}/{src[i]!.note + 1}
                                                        </a>
                                                    </>
                                                ) : null}
                                            </p>
                                        ) : null}
                                        <span
                                            className="rs-rule"
                                            aria-hidden="true"
                                            {...win(st.s, st.s + 2.4)}
                                        />
                                    </li>
                                ))}
                            </ol>
                            <p className="rs-cta">
                                <a
                                    href={`mailto:${SITE.profile.email}?subject=${encodeURIComponent('About your measured results')}`}
                                >
                                    Discuss these results <span aria-hidden="true">→</span>
                                </a>
                            </p>
                        </div>
                        <div className="rs-draw" style={{ '--ar': `${W} / ${H}` } as React.CSSProperties}>
                            <svg
                                className="bp-svg rs-svg"
                                viewBox={`0 0 ${W} ${H}`}
                                preserveAspectRatio="xMidYMid meet"
                                aria-hidden="true"
                            >
                                {p.render({ cam: true })}
                            </svg>
                        </div>
                    </div>
                </SheetFrame>
            </Scene>
        </section>
    );
}
