import React from 'react';

import { Pen } from '@/components/blueprint/pen';
import { Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';
import type { Row } from '@/content/types';

import './revisions.css';

/**
 * Sheet 4: experience drawn as a drawing's revision block. On top, a career dimension chain: one chained
 * dimension per role (SITE.practice.experience), each segment as long as the time in that role, parsed from
 * `period`; "now" is the date the page was rendered. Below, the revision table (newest first) and the
 * education rows as reference documents. Revision letters are presentational: the oldest role is REV A.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Months since year 0 for "Mon YYYY"; "now" → today, with the day as a fraction of the month. */
function month(s: string, now: Date): number {
    const t = s.trim().toLowerCase();
    if (t === 'now' || t === 'present') {
        const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return now.getFullYear() * 12 + now.getMonth() + (now.getDate() - 1) / days;
    }
    const [m, y] = t.split(/\s+/);
    return Number(y) * 12 + MONTHS.indexOf(m.slice(0, 3));
}

type Span = { row: Row; rev: string; a: number; b: number; current: boolean };

function spans(rows: Row[], now: Date): Span[] {
    // Oldest first; a role runs from the start of its first month to the start of its last month.
    return [...rows].reverse().map((row, i) => {
        const [from, to] = row.period.split(/\s*[–-]\s*/);
        return {
            row,
            rev: String.fromCharCode(65 + i),
            a: month(from, now),
            b: Math.max(month(from, now) + 0.5, month(to ?? from, now)),
            current: /now|present/i.test(to ?? ''),
        };
    });
}

/** Horizontal chain for wide screens. */
function chainWide(s: Span[], t0: number, t1: number): React.ReactNode {
    const p = new Pen('rev-cw');
    const X0 = 40;
    const X1 = 1160;
    const x = (m: number): number => X0 + ((m - t0) / (t1 - t0)) * (X1 - X0);
    const BY = 108;
    const BH = 26;
    const yrs = ((t1 - t0) / 12).toFixed(1);

    p.at(0, 0, 0.2);
    p.line(X0 - 24, BY + BH / 2, X1 + 24, BY + BH / 2, 'cl');
    // Year ticks follow the pen left to right.
    for (let y = Math.ceil(t0 / 12); y * 12 <= t1; y++) {
        const f = (y * 12 - t0) / (t1 - t0);
        p.at(0.04 + f * 0.5, 0.02, 0.14);
        p.line(x(y * 12), BY + BH + 12, x(y * 12), BY + BH + 22, 'thin');
        p.tx(x(y * 12), BY + BH + 38, String(y), 'dts', { 'text-anchor': 'middle' });
    }
    s.forEach((r, i) => {
        p.at(0.04 + i * 0.09, 0, 0.18);
        p.rr(x(r.a), BY, x(r.b) - x(r.a), BH, 0, r.current ? 'hug' : 'obj');
        p.at(0.12 + i * 0.09, 0.015, 0.14);
        p.dimH(x(r.a), x(r.b), 74, BY, BY, `REV ${r.rev}`);
    });
    const now = x(t1);
    p.at(0.66, 0.03, 0.14);
    p.line(now, BY - 6, now, BY + BH + 40, 'cl');
    p.tx(now, BY + BH + 56, 'NOW', 'dts', { 'text-anchor': 'middle' });
    p.at(0.74, 0.02, 0.2);
    p.dimH(X0, X1, 32, BY, BY, `(REF ${yrs} YRS)`);
    return (
        <svg className="bp-svg rev-chain rev-chain-wide" viewBox="0 0 1200 200" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** Vertical chain for phones and tablets: time runs down the page. */
function chainTall(s: Span[], t0: number, t1: number): React.ReactNode {
    const p = new Pen('rev-ct');
    const Y0 = 34;
    const Y1 = 404;
    const y = (m: number): number => Y0 + ((m - t0) / (t1 - t0)) * (Y1 - Y0);
    const BX = 122;
    const BW = 22;
    const yrs = ((t1 - t0) / 12).toFixed(1);

    p.at(0, 0, 0.2);
    p.line(BX + BW / 2, Y0 - 20, BX + BW / 2, Y1 + 20, 'cl');
    for (let yr = Math.ceil(t0 / 12); yr * 12 <= t1; yr++) {
        const f = (yr * 12 - t0) / (t1 - t0);
        p.at(0.04 + f * 0.5, 0.02, 0.14);
        p.line(BX + BW + 8, y(yr * 12), BX + BW + 16, y(yr * 12), 'thin');
        p.tx(BX + BW + 22, y(yr * 12) + 4, String(yr), 'dts');
    }
    s.forEach((r, i) => {
        p.at(0.04 + i * 0.09, 0, 0.18);
        p.rr(BX, y(r.a), BW, y(r.b) - y(r.a), 0, r.current ? 'hug' : 'obj');
        p.at(0.12 + i * 0.09, 0.015, 0.14);
        p.dimV(y(r.a), y(r.b), 92, BX, BX, `REV ${r.rev}`, { side: 'l' });
    });
    const now = y(t1);
    p.at(0.66, 0.03, 0.14);
    p.line(BX - 6, now, BX + BW + 60, now, 'cl');
    p.tx(BX + BW + 66, now + 4, 'NOW', 'dts');
    p.at(0.74, 0.02, 0.2);
    p.dimV(Y0, Y1, 30, BX, BX, `(REF ${yrs} YRS)`);
    return (
        <svg className="bp-svg rev-chain rev-chain-tall" viewBox="0 0 240 440" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** One revision (or reference document): REV | PERIOD | DESCRIPTION | STACK, drawn as it scrolls in. */
function Revision({
    code,
    codeLabel,
    row,
    current,
    level,
}: {
    code: string;
    codeLabel: string;
    row: Row;
    current?: boolean;
    level: 'h3' | 'h4';
}): React.JSX.Element {
    const H = level;
    const notes = row.highlights ?? [];
    const stack = row.stack ? row.stack.split(', ') : [];
    return (
        <Scene mode="flow" T={1} className="rev-row">
            <span className="rev-rule" aria-hidden="true" {...win(0, 0.25)} />
            <span className="rev-div rev-div-1" aria-hidden="true" {...win(0.03, 0.3)} />
            <span className="rev-div rev-div-2" aria-hidden="true" {...win(0.05, 0.32)} />
            <span className="rev-div rev-div-3" aria-hidden="true" {...win(0.07, 0.34)} />
            <p className="rev-code rev-in" {...win(0.06, 0.3)}>
                <span className="rev-k">{codeLabel} </span>
                <span className="rev-box">{code}</span>
                {current ? <span className="rev-current">Current</span> : null}
            </p>
            <p className="rev-period rev-in" {...win(0.1, 0.34)}>
                {row.period}
            </p>
            <div className="rev-desc">
                <H className="rev-role rev-in" {...win(0.12, 0.38)}>
                    {row.role}
                </H>
                <p className="rev-org rev-in" {...win(0.16, 0.42)}>
                    {row.org}
                    {row.location ? <span> · {row.location}</span> : null}
                </p>
                {notes.length ? (
                    <ol className="rev-notes">
                        {notes.map((n, i) => {
                            const a = 0.22 + (0.5 * i) / notes.length;
                            return (
                                <li key={n} className="rev-note rev-in" {...win(a, a + 0.24)}>
                                    <span className="rev-nb" aria-hidden="true">
                                        {i + 1}
                                    </span>
                                    <span>{n}</span>
                                </li>
                            );
                        })}
                    </ol>
                ) : null}
            </div>
            {stack.length ? (
                <div className="rev-stack">
                    <p className="rev-k rev-stack-k rev-in" {...win(0.4, 0.6)}>
                        Stack
                    </p>
                    <ul>
                        {stack.map((s, i) => (
                            <li key={s} className="rev-in" {...win(0.4 + i * 0.04, 0.64 + i * 0.04)}>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </Scene>
    );
}

export default function Revisions(): React.JSX.Element {
    const s = sheet('revisions');
    const now = new Date();
    const exp = SITE.practice.experience;
    const edu = SITE.practice.education ?? [];
    const chain = spans(exp, now);
    const t0 = Math.min(...chain.map((c) => c.a));
    const t1 = Math.max(...chain.map((c) => c.b));
    const yrs = ((t1 - t0) / 12).toFixed(1);
    const first = chain[0].row.period.split(/\s*[–-]\s*/)[0];
    const newestFirst = [...chain].reverse();

    return (
        <section id={s.id} aria-labelledby={`${s.id}-h`} className="rev">
            <SheetFrame
                n={s.n}
                of={SHEET_COUNT}
                title={s.title}
                sub={`Experience, newest first · REV A = first role`}
                headingId={`${s.id}-h`}
                className="rev-sheet"
            >
                <Scene mode="flow" T={1} className="rev-top">
                    <div className="rev-chainbox">
                        {chainWide(chain, t0, t1)}
                        {chainTall(chain, t0, t1)}
                        <p className="rev-chainnote rev-in" {...win(0.7, 0.95)}>
                            <span className="rev-nb" aria-hidden="true">
                                1
                            </span>
                            <span>
                                Career chain drawn to scale: each segment is the time spent in one role, from{' '}
                                {first} to today ({yrs} years).
                            </span>
                        </p>
                    </div>
                    <div className="rev-head" aria-hidden="true">
                        <span className="rev-rule" {...win(0.78, 0.98)} />
                        <span className="rev-in" {...win(0.8, 1)}>
                            Rev
                        </span>
                        <span className="rev-in" {...win(0.82, 1)}>
                            Period
                        </span>
                        <span className="rev-in" {...win(0.84, 1)}>
                            Description
                        </span>
                        <span className="rev-in" {...win(0.86, 1)}>
                            Stack
                        </span>
                    </div>
                </Scene>
                <ol className="rev-list">
                    {newestFirst.map((c) => (
                        <li key={c.row.org + c.row.period}>
                            <Revision
                                code={c.rev}
                                codeLabel="Rev"
                                row={c.row}
                                current={c.current}
                                level="h3"
                            />
                        </li>
                    ))}
                </ol>
                {edu.length ? (
                    <div className="rev-refs">
                        <h3 className="rev-refs-h">Reference documents</h3>
                        <ol className="rev-list">
                            {edu.map((r, i) => (
                                <li key={r.org + r.period}>
                                    <Revision code={String(i + 1)} codeLabel="Ref" row={r} level="h4" />
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : null}
            </SheetFrame>
        </section>
    );
}
