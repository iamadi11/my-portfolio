import React from 'react';

import { iso, Pen, project } from '@/components/blueprint/pen';
import type { CamKey } from '@/components/blueprint/scene';

import type { Assembly, Box } from './configs';

/**
 * One assembly drawn like the reference film: plan view (draws itself in while the camera pulls back), layers
 * lifting into an exploded axonometric stack, one detail view, then the whole sheet. Scene time T = 10.
 *
 * Sheet layout (viewBox 880 × 660): notes top-left, plan view left, exploded view top-right, detail bottom-right,
 * title block bottom-left.
 */

export const T = 10;
const VW = 880;
const VH = 660;

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

export type Built = { svg: React.ReactNode; cam: CamKey[]; camSm: CamKey[] };

export function drawAssembly(
    id: string,
    a: Assembly,
    meta: { dwg: string; title: string; sheet: string }
): Built {
    const p = new Pen(id);
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

    // ---------- 3. detail ----------
    if (a.detail) {
        a.detail.draw(p, 6.5);
        p.at(8.0, 0.1, 0.4);
        p.title(640, 630, `Detail A · ${a.detail.title}`, 'Enlarged · schematic');
    }

    // ---------- 4. whole sheet: notes and title block draw in on the last pull-back ----------
    if (a.notes.length) {
        p.at(8.5, 0.06, 0.4);
        p.tx(40, 34, 'Notes:', 'nth');
        p.tx(96, 34, '(from the project summary)', 'dts');
        a.notes.forEach((nt, i) => {
            const y = 54 + i * 16;
            if (nt.n) p.nb(46, y - 4, nt.n);
            p.tx(60, y, nt.t, 'asm-nt');
        });
    }
    p.at(8.8, 0.04, 0.35);
    const tb = 576;
    p.rr(40, tb, 340, 40, 0, 'thin');
    p.line(140, tb, 140, tb + 40, 'thin');
    p.line(300, tb, 300, tb + 40, 'thin');
    p.at(9.0, 0.04, 0.3);
    p.tx(48, tb + 14, 'Dwg no.', 'dts');
    p.tx(48, tb + 31, meta.dwg, 'th');
    p.tx(148, tb + 14, 'Assembly', 'dts');
    p.tx(148, tb + 31, meta.title, 'th');
    p.tx(308, tb + 14, 'Sheet', 'dts');
    p.tx(308, tb + 31, meta.sheet, 'th');

    // ---------- camera ----------
    const fy = focus.y + RH / 2;
    const exCy = (ty - zTop + exBottom) / 2 + 10;
    const planCy = (y0 - 30 + y1 + 60) / 2;
    const hasD = !!a.detail;
    const cam: CamKey[] = [
        [0, CX, fy, 3.0],
        [0.9, CX, fy, 2.8],
        [3.0, 210, planCy, 1.55],
        [3.5, 210, planCy, 1.5],
        [4.6, 640, exCy, 1.6],
        [6.3, 640, exCy, 1.52],
        ...(hasD
            ? ([
                  [7.0, 640, 556, 1.95],
                  [8.3, 640, 558, 1.85],
              ] as CamKey[])
            : []),
        [9.3, VW / 2, VH / 2, 1],
        [10, VW / 2, VH / 2, 0.985],
    ];
    const camSm: CamKey[] = [
        [0, CX, fy, 3.4],
        [0.9, CX, fy, 3.2],
        [3.0, 215, planCy, 2.1],
        [3.5, 215, planCy, 2.05],
        [4.6, 648, exCy, 2.05],
        [6.3, 648, exCy, 2.0],
        ...(hasD
            ? ([
                  [7.0, 642, 556, 2.05],
                  [8.3, 642, 558, 2.0],
              ] as CamKey[])
            : []),
        [9.3, 215, planCy, 2.05],
        [10, 215, planCy, 2.03],
    ];

    const svg = (
        <svg className="bp-svg asm-svg" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" focusable="false">
            {p.render({ cam: true })}
        </svg>
    );
    return { svg, cam, camSm };
}
