import React from 'react';

import { Pen } from '@/components/blueprint/pen';
import { Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';

import './variables.css';

/**
 * Sheet 5: SITE.practice.skills as the variable tables of a drawing sheet. One real table per group, codes
 * made from the group's initial plus the item's position (L1, F1 …). Codes are labels, never ratings.
 */

/** One code prefix per group: its initial, else the initials of its words, else its first two letters. */
function prefixes(groups: string[]): string[] {
    const used = new Set<string>();
    return groups.map((g) => {
        const words = g.split(/[^A-Za-z0-9]+/).filter(Boolean);
        const tries = [words[0][0], words.map((w) => w[0]).join(''), g.replace(/[^A-Za-z]/g, '').slice(0, 2)];
        let p = tries.map((t) => t.toUpperCase()).find((t) => !used.has(t));
        for (let n = 2; !p; n++)
            if (!used.has(`${tries[0].toUpperCase()}${n}`)) p = `${tries[0].toUpperCase()}${n}`;
        used.add(p);
        return p;
    });
}

/** Small key drawing: how a code is made. Labels only restate the HTML notes. */
function codeKey(): React.ReactNode {
    const p = new Pen('var-key');
    p.at(0, 0.03, 0.08);
    p.rr(120, 26, 80, 40, 0, 'obj');
    p.line(160, 26, 160, 66, 'thin');
    p.at(0.06, 0.02, 0.06);
    p.tx(140, 52, 'L', 'var-kc', { 'text-anchor': 'middle' });
    p.tx(180, 52, '1', 'var-kc', { 'text-anchor': 'middle' });
    p.at(0.09, 0.01, 0.06);
    p.callout(140, 60, 100, 96, 'GROUP INITIAL', -1);
    p.callout(180, 60, 220, 96, 'INDEX', 1);
    p.at(0.12, 0.01, 0.05);
    p.dimH(120, 200, 12, 26, 26, 'CODE');
    return (
        <svg className="bp-svg var-key" viewBox="0 0 320 112" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

export default function Variables(): React.JSX.Element {
    const s = sheet('variables');
    const groups = (SITE.practice.skills ?? []).map((g) => ({
        name: g.group,
        items: g.items
            .split(', ')
            .map((i) => i.trim())
            .filter(Boolean),
    }));
    if (!groups.length) return <></>;
    const pre = prefixes(groups.map((g) => g.name));
    const total = groups.reduce((n, g) => n + g.items.length, 0);

    // One table leads at a time: each takes a slice of the scene in proportion to its rows (that is also roughly
    // where it sits when the tables stack in one column).
    const rows = groups.map((g) => g.items.length + 2);
    const all = rows.reduce((a, b) => a + b, 0);
    const S0 = 0.14;
    const SPAN = 0.8;
    let cum = 0;

    return (
        <section id={s.id} aria-labelledby={`${s.id}-h`} className="var">
            <SheetFrame
                n={s.n}
                of={SHEET_COUNT}
                title={s.title}
                sub={`With what · ${total} skills as variables in ${groups.length} tables`}
                headingId={`${s.id}-h`}
                className="var-sheet"
            >
                <Scene mode="flow" T={1} className="var-grid">
                    <div className="var-notes">
                        <p className="var-notes-h var-in" {...win(0, 0.06)}>
                            <span className="var-b">Notes:</span> (unless otherwise specified)
                        </p>
                        <ol>
                            <li className="var-in" {...win(0.02, 0.08)}>
                                <span className="var-nb" aria-hidden="true">
                                    1
                                </span>
                                <span>Codes are labels, not ratings.</span>
                            </li>
                            <li className="var-in" {...win(0.04, 0.1)}>
                                <span className="var-nb" aria-hidden="true">
                                    2
                                </span>
                                <span>Code = group initial + position in the group.</span>
                            </li>
                        </ol>
                        {codeKey()}
                    </div>
                    {groups.map((g, gi) => {
                        const a = S0 + (SPAN * cum) / all;
                        const d = (SPAN * rows[gi]) / all;
                        cum += rows[gi];
                        const step = d / (g.items.length + 1);
                        const r = (j: number): number => Math.round((a + step * j) * 1000) / 1000;
                        return (
                            <div key={g.name} className="var-t" {...win(a, a + Math.max(0.06, d * 0.5))}>
                                <table>
                                    <caption className="var-in" {...win(a, a + 0.05)}>
                                        {g.name}
                                    </caption>
                                    <thead>
                                        <tr {...win(r(0), r(0) + 0.06)}>
                                            <th scope="col">
                                                <span className="var-in">Code</span>
                                            </th>
                                            <th scope="col">
                                                <span className="var-in">Variable</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {g.items.map((it, j) => (
                                            <tr key={it} {...win(r(j + 0.6), r(j + 0.6) + 0.06)}>
                                                <th scope="row">
                                                    <span
                                                        className="var-in"
                                                        {...win(r(j + 1), r(j + 1) + 0.05)}
                                                    >
                                                        {pre[gi]}
                                                        {j + 1}
                                                    </span>
                                                </th>
                                                <td>
                                                    <span
                                                        className="var-in"
                                                        {...win(r(j + 1.1), r(j + 1.1) + 0.06)}
                                                    >
                                                        {it}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </Scene>
            </SheetFrame>
        </section>
    );
}
