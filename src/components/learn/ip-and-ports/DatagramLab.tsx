'use client';

import React, { useId, useRef, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import {
    CATEGORIES,
    EVENTS,
    LAST_TICK,
    simulate,
    TRANSPORTS,
    type Category,
    type Copy,
    type Event,
    type Run,
    type Transport,
} from '@/lib/learn/datagram-model';

/**
 * Fig. 3 of the ip-and-ports chapter (asset A3): five datagrams, one thing going wrong on the way, read by an
 * application over UDP or TCP. Every mark comes from `simulate()`. Nothing about the result is on the page until
 * Run, and any change clears it. Static drawing: nothing moves.
 */

const EVENT_LABEL: Record<Event, string> = {
    none: 'Nothing goes wrong',
    lose3: 'Lose 3',
    delay2: 'Delay 2',
    dup4: 'Duplicate 4',
};
const CATEGORY_LABEL: Record<Category, string> = {
    'all in order': 'All five, in order',
    'all, out of order': 'All five, out of order',
    'one missing': 'One is missing',
    'one twice': 'One arrives twice',
};

const X0 = 84;
const DX = 17.5;
const x = (tick: number): number => X0 + tick * DX;
const ROW = { sent: 34, arrived: 92, read: 164 };

function Tag({
    n,
    cx,
    cy,
    dashed,
}: {
    n: number;
    cx: number;
    cy: number;
    dashed?: boolean;
}): React.JSX.Element {
    return (
        <g>
            <rect x={cx - 8} y={cy - 9} width={16} height={18} rx={2} className={dashed ? 'slot' : 'nb'} />
            <text x={cx} y={cy + 5} textAnchor="middle" className="dts">
                {n}
            </text>
        </g>
    );
}

/**
 * Line styles, one meaning each (the legend under the drawing repeats them): solid arrow, sent and arrived; dashed
 * arrow, resent by TCP; dotted arrow, a copy the network made; short stub ending in ×, lost; bracket on the read row,
 * waiting in the host.
 */
function Timeline({ r }: { r: Run }): React.JSX.Element {
    const marker = useId().replace(/:/g, '');
    // Reads at the same tick stack downwards, in read order.
    const stack = new Map<number, number>();
    const reads = r.reads.map((q) => {
        const k = stack.get(q.at) ?? 0;
        stack.set(q.at, k + 1);
        return { ...q, dy: k * 22 };
    });
    // Copies arriving at the same tick stack downwards too, in send order.
    const arrivedAt = new Map<number, number>();
    const arrivedDy = new Map<Copy, number>();
    for (const c of r.copies)
        if (c.arrived !== null) {
            const k = arrivedAt.get(c.arrived) ?? 0;
            arrivedAt.set(c.arrived, k + 1);
            arrivedDy.set(c, k * 22);
        }
    const depth = Math.max(...reads.map((q) => q.dy));
    const axisY = ROW.read + depth + 30;
    const top = ROW.sent + 9;
    const bottom = ROW.arrived - 10;
    return (
        <svg className="bp-svg ln-svg" viewBox={`0 0 340 ${axisY + 30}`} aria-hidden="true">
            <defs>
                <Arrowhead id={marker} />
            </defs>
            {(['sent', 'arrived', 'read'] as const).map((k) => (
                <g key={k}>
                    <text x={4} y={ROW[k] + 5} className="sl">
                        {k}
                    </text>
                    <line x1={X0 - 8} y1={ROW[k]} x2={x(LAST_TICK)} y2={ROW[k]} className="ext" />
                </g>
            ))}
            {r.copies.map((c) => {
                if (c.arrived === null)
                    return (
                        <g key={`${c.n}-${c.sent}-lost`}>
                            <line x1={x(c.sent)} y1={top} x2={x(c.sent) + 6} y2={top + 16} className="thin" />
                            <text x={x(c.sent) + 9} y={top + 26} textAnchor="middle" className="dts">
                                ×
                            </text>
                        </g>
                    );
                if (c.duplicate) {
                    // The network copies the original partway: fork from the middle of the original's arrow.
                    const midX = (x(c.sent) + x(c.arrived - 2)) / 2;
                    return (
                        <line
                            key={`${c.n}-dup`}
                            x1={midX}
                            y1={(top + bottom) / 2}
                            x2={x(c.arrived)}
                            y2={bottom}
                            className="thin ln-dot"
                            markerEnd={`url(#${marker})`}
                        />
                    );
                }
                return (
                    <line
                        key={`${c.n}-${c.sent}-${c.arrived}`}
                        x1={x(c.sent)}
                        y1={top}
                        x2={x(c.arrived)}
                        y2={bottom}
                        className={c.resend ? 'thin ln-skip' : 'thin'}
                        markerEnd={`url(#${marker})`}
                    />
                );
            })}
            {r.copies
                .filter((c) => !c.duplicate)
                .map((c) => (
                    <Tag key={`s-${c.n}-${c.sent}`} n={c.n} cx={x(c.sent)} cy={ROW.sent} dashed={c.resend} />
                ))}
            {r.copies
                .filter((c) => c.arrived !== null)
                .map((c) => (
                    <g key={`a-${c.n}-${c.arrived}`}>
                        <Tag n={c.n} cx={x(c.arrived as number)} cy={ROW.arrived + (arrivedDy.get(c) ?? 0)} />
                        {r.discarded.includes(c) ? (
                            <text
                                x={x(c.arrived as number)}
                                y={ROW.arrived + (arrivedDy.get(c) ?? 0) + 26}
                                textAnchor="middle"
                                className="dts"
                            >
                                ×
                            </text>
                        ) : null}
                    </g>
                ))}
            {reads.map((q) => (
                <g key={`r-${q.n}-${q.at}-${q.dy}`}>
                    {q.held > 0 ? (
                        <path
                            d={`M ${x(q.at - q.held)} ${ROW.read + q.dy - 5} v 10 M ${x(q.at - q.held)} ${ROW.read + q.dy} H ${x(q.at) - 9}`}
                            className="thin"
                        />
                    ) : null}
                    <Tag n={q.n} cx={x(q.at)} cy={ROW.read + q.dy} />
                </g>
            ))}
            <line x1={X0} y1={axisY} x2={x(LAST_TICK)} y2={axisY} className="thin" />
            {Array.from({ length: LAST_TICK / 2 + 1 }, (_, i) => i * 2).map((t) => (
                <g key={t}>
                    <line x1={x(t)} y1={axisY} x2={x(t)} y2={axisY + 5} className="thin" />
                    <text x={x(t)} y={axisY + 18} textAnchor="middle" className="sl">
                        {t}
                    </text>
                </g>
            ))}
            <text x={4} y={axisY + 18} className="sl">
                tick
            </text>
        </svg>
    );
}

type Line = { at: number; text: string };

/** What happened to one copy on the wire, in words. */
function copyLines(c: Copy, discarded: boolean): Line[] {
    const out: Line[] = [];
    if (!c.duplicate) out.push({ at: c.sent, text: `${c.resend ? 'resent' : 'sent'}: ${c.n}` });
    if (c.arrived === null) return [...out, { at: c.sent + 1, text: `${c.n} lost on the way` }];
    const copy = c.duplicate ? ' (a second copy, made by the network)' : '';
    const thrown = discarded ? ', thrown away: already received' : '';
    return [...out, { at: c.arrived, text: `arrived: ${c.n}${copy}${thrown}` }];
}

const waited = (held: number): string => (held ? ` (waited ${held} ${held === 1 ? 'tick' : 'ticks'})` : '');

/** The run in words, in time order: the text equivalent of the drawing. */
function events(r: Run): string[] {
    const out = [
        ...r.copies.flatMap((c) => copyLines(c, r.discarded.includes(c))),
        ...r.reads.map((q) => ({ at: q.at, text: `application reads ${q.n}${waited(q.held)}` })),
    ];
    return out.sort((a, b) => a.at - b.at).map((e) => `tick ${e.at}: ${e.text}`);
}

export default function DatagramLab(): React.JSX.Element {
    const [event, setEvent] = useState<Event>('lose3');
    const [transport, setTransport] = useState<Transport>('UDP');
    const [guess, setGuess] = useState<Category | null>(null);
    const [run, setRun] = useState<{
        r: Run;
        event: Event;
        transport: Transport;
        guess: Category | null;
    } | null>(null);
    const clear = (): void => setRun(null);
    const result = useRef<HTMLDivElement>(null);
    const verdict = run
        ? run.guess === null
            ? 'You ran it without a prediction.'
            : run.guess === run.r.category
              ? `You predicted “${CATEGORY_LABEL[run.guess]}”: right.`
              : `You predicted “${CATEGORY_LABEL[run.guess]}”: not quite.`
        : '';
    const summary = run
        ? `${EVENT_LABEL[run.event]}, ${run.transport}. The application reads ${run.r.reads.map((q) => q.n).join(' ')}: ${CATEGORY_LABEL[run.r.category].toLowerCase()}. Last read at tick ${run.r.lastRead}. ${verdict}`
        : '';
    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig3-h">
            <div className="ln-fig-head">
                <span id="fig3-h">Fig. 3 · Five datagrams on the way</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div className="ln-controls">
                    <Choice
                        legend="On the way"
                        options={EVENTS}
                        label={(e) => EVENT_LABEL[e]}
                        value={event}
                        onChange={(e) => {
                            setEvent(e);
                            clear();
                        }}
                    />
                    <Choice
                        legend="Transport"
                        options={TRANSPORTS}
                        label={(t) => t}
                        value={transport}
                        onChange={(t) => {
                            setTransport(t);
                            clear();
                        }}
                    />
                    <div className="ln-predict">
                        <Choice
                            legend="Predict first: what does the application read?"
                            options={CATEGORIES}
                            label={(c) => CATEGORY_LABEL[c]}
                            value={guess}
                            onChange={(c) => {
                                setGuess(c);
                                clear();
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className="ln-btn"
                        onClick={() => {
                            setRun({ r: simulate(event, transport), event, transport, guess });
                            revealAfterRender(() => result.current);
                        }}
                    >
                        Run
                    </button>
                </div>
                <div ref={result}>
                    {run ? (
                        <>
                            <Timeline r={run.r} />
                            <ul className="ln-legend" aria-label="Key to the drawing">
                                <li>Solid arrow: sent and arrived</li>
                                <li>Dashed arrow: resent by TCP</li>
                                <li>Dotted arrow: a copy the network made</li>
                                <li>×: lost, or thrown away by TCP</li>
                                <li>Bracket on the read row: waiting in the host</li>
                            </ul>
                            <p className="m-0 mt-2">
                                <strong>{CATEGORY_LABEL[run.r.category]}.</strong> {verdict}
                            </p>
                            <dl className="ln-out">
                                <div>
                                    <dt>Application reads, in order</dt>
                                    <dd>{run.r.reads.map((q) => q.n).join(' ')}</dd>
                                </div>
                                <div>
                                    <dt>Reads</dt>
                                    <dd>{run.r.reads.length}</dd>
                                </div>
                                <div>
                                    <dt>Last read at</dt>
                                    <dd>tick {run.r.lastRead}</dd>
                                </div>
                            </dl>
                            <details className="mt-2">
                                <summary>The timeline as a list</summary>
                                <ol className="ln-pfeed">
                                    {events(run.r).map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ol>
                            </details>
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose what happens on the way and the transport, predict, then Run.
                        </p>
                    )}
                    <p className="sr-only" aria-live="polite">
                        {summary}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                A tick is an assumed unit of time, not to scale. Each datagram takes 2 ticks; the delayed one
                2 more. TCP resends a segment it has heard nothing about after a fixed 7 ticks, longer than a
                round trip here, so a late segment is not resent (real TCP adapts this wait and can resend a
                late segment; see the TCP chapter). One thing goes wrong per run, and data is never corrupted.
                The network loses, delays and copies packets under TCP too: TCP recovers in the two end hosts.
            </figcaption>
        </figure>
    );
}
