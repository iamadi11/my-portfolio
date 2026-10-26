import React from 'react';

import { iso, Pen, project } from '@/components/blueprint/pen';
import type { CamKey } from '@/components/blueprint/scene';

import type { Assembly, Box } from './configs';

/**
 * One assembly drawn like the reference film: plan view (draws itself in while the camera pulls back), layers
 * lifting into an exploded axonometric stack, one detail view, section A–A where there is one, then the whole
 * sheet. Scene time T = 10 (12 with a section).
 *
 * Sheet layout (viewBox 880 × 660): notes top-left, plan view left, exploded view top-right, detail bottom-right,
 * title block bottom-left. With a section the sheet grows to 880 × 724: section A–A under the plan view, title
 * block bottom-right.
 */

const VW = 880;
const VH = 660;
const VH_S = 724;

// Section A–A: cutting plane x on the plan; section view under the plan view.
const SX = 100;
const SEC_Y = 548;
const SEC_W = 170;

// Plan view.
const X0 = 70;
const PW = 250;
const X1 = X0 + PW;
const CX = X0 + PW / 2;
const PAD = 16;
const RH = 44;
const GAP = 30;
const BG = 6;
const PLAN_CY = 292;

// Exploded view: plates are PW × PH in plan units, projected at scale S.
const PH = 150;
const S = 0.82;
const ZG = 64;
const TX = 478;
const PLATE_H = 0.17 * S * PW + 0.47 * S * PH;
const LX = 698;

type PBox = Box & { x: number; y: number; w: number };

function layout(a: Assembly): { y0: number; y1: number; rows: { y: number; boxes: PBox[] }[] } {
    const n = a.rows.length;
    const fh = 2 * PAD + n * RH + (n - 1) * GAP;
    const y0 = PLAN_CY - fh / 2;
    const rows = a.rows.map((r, i) => {
        const y = y0 + PAD + i * (RH + GAP);
        const tw = r.boxes.reduce((s, b) => s + (b.w ?? 1), 0);
        const inner = PW - 2 * PAD - BG * (r.boxes.length - 1);
        let x = X0 + PAD;
        const boxes = r.boxes.map((b) => {
            const w = (inner * (b.w ?? 1)) / tw;
            const o = { ...b, x, y, w };
            x += w + BG;
            return o;
        });
        return { y, boxes };
    });
    return { y0, y1: y0 + fh, rows };
}

const mid = { 'text-anchor': 'middle' };

function drawBox(p: Pen, b: PBox): void {
    const k = b.k ?? 'well';
    if (k === 'x') p.xbox(b.x, b.y, b.w, RH);
    else if (k === 'hatch') {
        p.rr(b.x, b.y, b.w, RH, 3, 'thin');
        p.hatchRect(b.x, b.y, b.w, RH, 3, 0.45);
    } else p.rr(b.x, b.y, b.w, RH, k === 'slot' ? 3 : 5, k);
}

function labelBox(p: Pen, b: PBox): void {
    const ko = b.k === 'x' || b.k === 'hatch' ? ' asm-ko' : '';
    const cx = b.x + b.w / 2;
    const cy = b.y + RH / 2;
    if (b.sub) {
        p.tx(cx, cy - 2, b.l, `asm-bl${ko}`, mid);
        p.tx(cx, cy + 10, b.sub, `sl${ko}`, mid);
    } else p.tx(cx, cy + 3.2, b.l, `asm-bl${ko}`, mid);
}

/** Copy of a plan box inside a lifting plate (local coords): strokes now, fills fade in after the lift. */
function plateBox(p: Pen, b: PBox, oy: number, fill: (a: number) => Record<string, string>, a: number): void {
    const x = b.x - X0;
    const k = b.k ?? 'well';
    if (k === 'hug' || k === 'well') p.rr(x, oy, b.w, RH, 5, k === 'hug' ? 'asm-f2' : 'asm-f1', fill(a));
    if (k === 'hatch') p.rr(x, oy, b.w, RH, 3, 'asm-hf', { fill: p.hatch, 'fill-opacity': 0.45, ...fill(a) });
    if (k === 'slot') p.rr(x, oy, b.w, RH, 3, 'slot');
    else p.rr(x, oy, b.w, RH, k === 'x' || k === 'hatch' ? 0 : 5, 'asm-bx');
    if (k === 'x') p.path(`M${x},${oy} l${b.w},${RH} M${x + b.w},${oy} l${-b.w},${RH}`, 'asm-bx');
}

export type Built = { svg: React.ReactNode; cam: CamKey[]; camSm: CamKey[]; T: number; len: number };

/** Cutting plane A–A across the plan, then the section view: layers as cut solids, each with its callout. */
function drawSection(p: Pen, a: Assembly, y0: number, y1: number, hb: string, t: number): number {
    const L = a.section!;
    const top = y0 - 40;
    const bot = y1 + 38;
    // The cutting plane: thick chain line, arrows show the direction of view, letters at both ends.
    p.at(t, 0, 0.5);
    p.line(SX, top, SX, bot, 'cl asm-cut');
    p.at(t + 0.25, 0.1, 0.35);
    p.flow(SX, top, SX + 20, top, 'asm-cuta');
    p.flow(SX, bot, SX + 20, bot, 'asm-cuta');
    p.at(t + 0.45, 0.08, 0.3);
    p.tx(SX - 7, top + 4.5, 'A', 'asm-cutl', mid);
    p.tx(SX - 7, bot + 4.5, 'A', 'asm-cutl', mid);

    // Section view: outline, then each layer's boundary, then its fill (hatch = cut material).
    const x = X0;
    const th = L.reduce((s, l) => s + l.t, 0);
    const s0 = t + 0.6;
    p.at(s0, 0, 0.7);
    p.rr(x, SEC_Y, SEC_W, th, 0, 'asm-frame');
    let y = SEC_Y;
    const ys = L.map((l) => {
        const r = { y, m: y + l.t / 2 };
        y += l.t;
        return r;
    });
    p.at(s0 + 0.3, 0.12, 0.45);
    L.forEach((l, i) => i > 0 && p.line(x, ys[i].y, x + SEC_W, ys[i].y, 'thin'));
    p.at(s0 + 0.55, 0.12, 0.45);
    L.forEach((l, i) => {
        if (l.f === 'cut') p.rr(x, ys[i].y, SEC_W, l.t, 0, 'hs', { fill: p.hatch });
        else if (l.f === 'cut2') p.rr(x, ys[i].y, SEC_W, l.t, 0, 'hs', { fill: hb });
        else if (l.f === 'solid') p.rr(x, ys[i].y, SEC_W, l.t, 0, 'asm-sol');
    });
    // Callouts fan out to the right, one per layer, top to bottom.
    p.at(s0 + 0.9, 0.04, 0.4);
    L.forEach((l, i) => p.callout(x + SEC_W - 14 - i * 10, ys[i].m, x + SEC_W + 22, SEC_Y - 4 + i * 16, l.l));
    p.at(s0 + 1.35, 0.1, 0.4);
    p.title(CX, SEC_Y + Math.max(th, 52) + 30, 'Section A–A', 'Scale · schematic');
    return th;
}

/** Exploded view: copies of each plan row lift into an axonometric stack, bottom layer first, then labels. */
function drawExploded(
    p: Pen,
    a: Assembly,
    rows: { y: number; boxes: PBox[] }[]
): { ty: number; zTop: number; exBottom: number } {
    const n = rows.length;
    const ty = 235 - (PLATE_H - (n - 1) * ZG) / 2;
    const M = iso(S, TX, ty);
    const zTop = (n - 1) * ZG;
    p.at(4.4, 0.15, 0.8);
    for (const [cx, cy] of [
        [0, PH],
        [PW, 0],
    ]) {
        const [xa, ya] = project(M, cx, cy, 0);
        const [, yb] = project(M, cx, cy, zTop);
        p.line(xa, ya, xa, yb, 'ph');
    }
    const oy = (PH - RH) / 2;
    const fw = (s: number, e: number): Record<string, string> => ({ 'data-k': 'f', 'data-w': `${s} ${e}` });
    rows.map((r, i) => ({ r, i }))
        .reverse()
        .forEach(({ r }, j) => {
            const s = 3.5 + j * 0.3;
            p.morph({ flat: [1, 0, 0, 1, X0, r.y - oy], iso: M, z: j * ZG, a: s, b: s + 1.5 }, () => {
                p.rr(0, 0, PW, PH, 10, 'asm-f0', fw(s + 0.55, s + 1.25));
                p.rr(0, 0, PW, PH, 10, 'asm-plate', fw(s + 0.35, s + 1.0));
                r.boxes.forEach((b) => plateBox(p, b, oy, (q) => fw(q + 0.55, q + 1.25), s));
            });
        });
    // Leaders and layer labels, bottom first.
    rows.map((_, i) => i)
        .reverse()
        .forEach((i, j) => {
            const [lx, ly] = project(M, PW, PH / 2, j * ZG);
            p.at(5.2 + j * 0.2, 0.08, 0.4);
            p.circle(lx, ly, 1.8, 'dot');
            p.line(lx, ly, LX - 6, ly, 'lead');
            p.tx(LX, ly + 1, `L${j} · ${a.rows[i].layer}`, 'vt');
            if (a.rows[i].layerSub) p.tx(LX, ly + 15, a.rows[i].layerSub!, 'dts');
        });
    const exBottom = ty + PLATE_H;
    p.at(6.0, 0.1, 0.4);
    p.title(560, exBottom + 46, 'Exploded view', 'Axonometric · Z gaps not to scale');
    return { ty, zTop, exBottom };
}

/** Notes block, top-left: each note restates the summary; boxed numbers match the plan. */
function drawNotes(p: Pen, a: Assembly, t: number): void {
    if (!a.notes.length) return;
    p.at(t, 0.06, 0.4);
    p.tx(40, 34, 'Notes:', 'nth');
    p.tx(96, 34, '(from the project summary)', 'dts');
    a.notes.forEach((nt, i) => {
        const y = 54 + i * 16;
        if (nt.n) p.nb(46, y - 4, nt.n);
        p.tx(60, y, nt.t, 'asm-nt');
    });
}

/** Title block: drawing number, assembly, sheet. */
function titleBlock(
    p: Pen,
    meta: { dwg: string; title: string; sheet: string },
    t: number,
    bx: number,
    tb: number
): void {
    p.at(t, 0.04, 0.35);
    p.rr(bx, tb, 340, 40, 0, 'thin');
    p.line(bx + 100, tb, bx + 100, tb + 40, 'thin');
    p.line(bx + 260, tb, bx + 260, tb + 40, 'thin');
    p.at(t + 0.2, 0.04, 0.3);
    p.tx(bx + 8, tb + 14, 'Dwg no.', 'dts');
    p.tx(bx + 8, tb + 31, meta.dwg, 'th');
    p.tx(bx + 108, tb + 14, 'Assembly', 'dts');
    p.tx(bx + 108, tb + 31, meta.title, 'th');
    p.tx(bx + 268, tb + 14, 'Sheet', 'dts');
    p.tx(bx + 268, tb + 31, meta.sheet, 'th');
}

type CamIn = {
    fy: number;
    exCy: number;
    y0: number;
    y1: number;
    detail: boolean;
    sec: boolean;
    T: number;
    vh: number;
};

/** Camera keys: focus row → plan → exploded → detail → section → whole sheet. Phones end on the left column. */
function cameras(c: CamIn): { cam: CamKey[]; camSm: CamKey[] } {
    const { fy, exCy, y0, y1, T } = c;
    const planCy = (y0 - 30 + y1 + 60) / 2;
    const leftCy = (y0 - 50 + SEC_Y + 125) / 2;
    const det = (k: CamKey[]): CamKey[] => (c.detail ? k : []);
    const sec = (k: CamKey[]): CamKey[] => (c.sec ? k : []);
    const cam: CamKey[] = [
        [0, CX, fy, 3.0],
        [0.9, CX, fy, 2.8],
        [3.0, 210, planCy, 1.55],
        [3.5, 210, planCy, 1.5],
        [4.6, 640, exCy, 1.6],
        [6.3, 640, exCy, 1.52],
        ...det([
            [7.0, 640, 556, 1.95],
            [8.3, 640, 558, 1.85],
        ]),
        ...sec([
            [9.0, 215, (y0 + y1) / 2 + 40, 1.3],
            [9.7, 236, SEC_Y + 36, 1.62],
            [10.6, 236, SEC_Y + 38, 1.56],
        ]),
        [T - 0.7, VW / 2, c.vh / 2, 1],
        [T, VW / 2, c.vh / 2, 0.985],
    ];
    const camSm: CamKey[] = [
        [0, CX, fy, 3.4],
        [0.9, CX, fy, 3.2],
        [3.0, 215, planCy, 2.1],
        [3.5, 215, planCy, 2.05],
        [4.6, 648, exCy, 2.05],
        [6.3, 648, exCy, 2.0],
        ...det([
            [7.0, 642, 556, 2.05],
            [8.3, 642, 558, 2.0],
        ]),
        ...sec([
            [9.0, 200, (y0 + y1) / 2 + 30, 1.7],
            [9.7, 238, SEC_Y + 30, 2.35],
            [10.6, 238, SEC_Y + 32, 2.3],
        ]),
        [T - 0.7, 215, c.sec ? leftCy : planCy, c.sec ? 1.95 : 2.05],
        [T, 215, c.sec ? leftCy : planCy, c.sec ? 1.93 : 2.03],
    ];
    return { cam, camSm };
}

export function drawAssembly(
    id: string,
    a: Assembly,
    meta: { dwg: string; title: string; sheet: string }
): Built {
    const p = new Pen(id);
    const hb = `${id}-hb`;
    const sec = !!a.section?.length;
    // Sheet size, scene length, last-beat start and title-block corner, with and without section A–A.
    const G = sec
        ? { T: 12, vh: VH_S, t4: 10.5, bx: 510, by: 666, len: 2.75 }
        : { T: 10, vh: VH, t4: 8.5, bx: 40, by: 576, len: 2.3 };
    const { T, vh, t4 } = G;
    const { y0, y1, rows } = layout(a);
    const n = rows.length;
    const focus = rows[a.focus];

    // ---------- 1. plan view: the characteristic row first, then outline, structure, slots, dims, labels ----------
    p.at(0.05, 0.12, 0.8);
    focus.boxes.forEach((b) => drawBox(p, b));
    p.at(0.55, 0.06, 0.4);
    focus.boxes.forEach((b) => labelBox(p, b));
    p.at(0.35, 0, 1.3);
    p.rr(X0, y0, PW, y1 - y0, 10, 'asm-frame');
    p.at(0.7, 0, 0.6);
    p.line(CX, y0 - 14, CX, y1 + 14, 'cl');
    p.at(0.9, 0.12, 0.6);
    rows.forEach((r, i) => i !== a.focus && r.boxes.forEach((b) => drawBox(p, b)));
    p.at(1.35, 0.06, 0.4);
    rows.forEach((r, i) => i !== a.focus && r.boxes.forEach((b) => labelBox(p, b)));

    // Flow arrows between rows (straight down at the narrower box's centre), with the summary's verb beside them.
    p.at(1.55, 0.1, 0.45);
    const edges: { i: number; xs: number[] }[] = [];
    for (let i = 0; i < n - 1; i++) {
        const A = rows[i].boxes;
        const B = rows[i + 1].boxes;
        const narrow = A.length >= B.length ? A : B;
        const xs = narrow.map((b) => b.x + b.w / 2);
        xs.forEach((x) => p.flow(x, rows[i].y + RH + 3, x, rows[i + 1].y - 3));
        edges.push({ i, xs });
    }
    p.at(2.0, 0.08, 0.35);
    edges.forEach(({ i, xs }) => {
        const e = a.rows[i + 1].edge;
        if (!e) return;
        const y = rows[i].y + RH + GAP / 2 + 3.5;
        if (xs.length > 1) p.tx(CX, y, e, 'dts', mid);
        else p.tx(xs[0] + 8, y, e, 'dts');
    });

    // Dimensions: codes only (schematic, not to scale).
    p.at(1.9, 0.04, 0.4);
    p.dimH(X0, X1, y0 - 24, y0, y0, 'W');
    rows.forEach((r, i) => p.dimV(r.y, r.y + RH, X0 - 20, X0 + PAD, X0 + PAD, `H${i + 1}`));
    p.at(2.25, 0.03, 0.35);
    const rx = X1 + 20;
    p.dimV(y0, rows[0].y, rx, X1 - 12, X1 - PAD, 'S1', { side: 'r' });
    for (let i = 0; i < n - 1; i++)
        p.dimV(rows[i].y + RH, rows[i + 1].y, rx, X1 - PAD, X1 - PAD, 'S2', { side: 'r' });
    p.dimV(rows[n - 1].y + RH, y1, rx, X1 - PAD, X1 - 12, 'S1', { side: 'r' });
    p.at(2.55, 0.04, 0.35);
    p.dimH(X0 + PAD, X1 - PAD, y1 + 22, rows[n - 1].y + RH, rows[n - 1].y + RH, 'Fill', { below: true });
    p.rad(X0, y1, 10, 'bl', 'R1', 14);

    // Boxed note numbers in the right pad of their row.
    p.at(2.7, 0.1, 0.3);
    a.rows.forEach((r, i) => r.note && p.nb(X1 - 8, rows[i].y + 9, r.note));

    // Detail circle on the row the detail view enlarges.
    if (a.detail) {
        const b = rows[a.detail.row].boxes[0];
        const r0 = rows[a.detail.row];
        const dcx = r0.boxes.length > 1 ? b.x + b.w / 2 : CX + 40;
        const dcy = r0.y + RH / 2;
        p.at(2.85, 0.12, 0.45);
        p.detailRef(dcx, dcy, 32, 'Detail A', X1 + 44, dcy);
    }
    p.at(3.05, 0.1, 0.4);
    p.title(CX, y1 + 54, 'Plan view', 'Schematic · not to scale');

    // ---------- 2. exploded view: copies of each row lift off the plan, bottom layer first ----------
    const { ty, zTop, exBottom } = drawExploded(p, a, rows);

    // ---------- 3. detail ----------
    if (a.detail) {
        a.detail.draw(p, 6.5);
        p.at(8.0, 0.1, 0.4);
        p.title(640, 630, `Detail A · ${a.detail.title}`, 'Enlarged · schematic');
    }

    // ---------- 4. section A–A ----------
    if (sec) drawSection(p, a, y0, y1, `url(#${hb})`, 8.55);

    // ---------- 5. whole sheet: notes and title block draw in on the last pull-back ----------
    drawNotes(p, a, t4);
    titleBlock(p, meta, t4 + 0.3, G.bx, G.by);

    // ---------- camera ----------
    const { cam, camSm } = cameras({
        fy: focus.y + RH / 2,
        exCy: (ty - zTop + exBottom) / 2 + 10,
        y0,
        y1,
        detail: !!a.detail,
        sec,
        T,
        vh,
    });

    const svg = (
        <svg className="bp-svg asm-svg" viewBox={`0 0 ${VW} ${vh}`} aria-hidden="true" focusable="false">
            {sec ? (
                <defs>
                    <pattern
                        id={hb}
                        width={5}
                        height={5}
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(-45)"
                    >
                        <line x1={0} y1={0} x2={0} y2={5} className="hl" />
                    </pattern>
                </defs>
            ) : null}
            {p.render({ cam: true })}
        </svg>
    );
    return { svg, cam, camSm, T, len: G.len };
}
