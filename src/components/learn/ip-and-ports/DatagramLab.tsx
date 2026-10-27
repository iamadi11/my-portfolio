'use client';

import React, { useId, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
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
const DX = 18;
const x = (tick: number): number => X0 + tick * DX;
const ROW = { sent: 34, arrived: 92, read: 150 };

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

function Timeline({ r }: { r: Run }): React.JSX.Element {
    const marker = useId().replace(/:/g, '');
    // Reads at the same tick stack downwards, in read order.
    const stack = new Map<number, number>();
    const reads = r.reads.map((x0) => {
        const k = stack.get(x0.at) ?? 0;
        stack.set(x0.at, k + 1);
        return { ...x0, dy: k * 22 };
    });
    const depth = Math.max(...reads.map((q) => q.dy));
    const axisY = ROW.read + depth + 30;
    const isDiscarded = (c: Copy): boolean => r.discarded.includes(c);
    return (
        <svg className="bp-svg ln-svg" viewBox={`0 0 340 ${axisY + 34}`} aria-hidden="true">
            <defs>
                <Arrowhead id={marker} />
            </defs>
            {(['sent', 'arrived', 'read'] as const).map((k) => (
                <g key={k}>
                    <text x={4} y={ROW[k] + 5} className="sl">
                        {k}
                    </text>
                    <line x1={X0 - 8} y1={ROW[k]} x2={x(LAST_TICK)} y2={ROW[k]} className="ph" />
                </g>
            ))}
            {r.copies.map((c) =>
                c.arrived === null ? (
                    <g key={`${c.n}-${c.sent}-lost`}>
                        <line
                            x1={x(c.sent)}
                            y1={ROW.sent + 9}
                            x2={x(c.sent + 1)}
                            y2={ROW.sent + 30}
                            className="thin ln-skip"
                        />
                        <text x={x(c.sent + 1) + 4} y={ROW.sent + 40} className="sl">
                            × lost
                        </text>
                    </g>
                ) : (
                    <line
                        key={`${c.n}-${c.sent}-${c.arrived}`}
                        x1={x(c.sent)}
                        y1={ROW.sent + 9}
                        x2={x(c.arrived)}
                        y2={ROW.arrived - 10}
                        className={c.resend || c.duplicate ? 'thin ln-skip' : 'thin'}
                        markerEnd={`url(#${marker})`}
                    />
                )
            )}
            {r.copies.map((c) => (
                <Tag
                    key={`s-${c.n}-${c.sent}-${c.duplicate}`}
                    n={c.n}
                    cx={x(c.sent)}
                    cy={ROW.sent}
                    dashed={c.resend}
                />
            ))}
            {r.copies
                .filter((c) => c.arrived !== null)
                .map((c) => (
                    <g key={`a-${c.n}-${c.arrived}`}>
                        <Tag n={c.n} cx={x(c.arrived as number)} cy={ROW.arrived} dashed={isDiscarded(c)} />
                        {isDiscarded(c) ? (
                            <text
                                x={x(c.arrived as number)}
                                y={ROW.arrived + 24}
                                textAnchor="middle"
                                className="sl"
                            >
                                ×
                            </text>
                        ) : null}
                    </g>
                ))}
            {reads.map((q) => (
                <g key={`r-${q.n}-${q.at}-${q.dy}`}>
                    {q.held > 0 ? (
                        <line
                            x1={x(q.at - q.held)}
                            y1={ROW.read + q.dy}
                            x2={x(q.at) - 9}
                            y2={ROW.read + q.dy}
                            className="thin ln-skip"
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

/** The run in words, in time order: the text equivalent of the drawing. */
function events(r: Run): string[] {
    const out: { at: number; text: string }[] = [];
    for (const c of r.copies) {
        out.push({ at: c.sent, text: `${c.resend ? 'resent' : 'sent'}: ${c.n}` });
        if (c.arrived === null) out.push({ at: c.sent + 1, text: `${c.n} lost on the way` });
        else
            out.push({
                at: c.arrived,
                text: `arrived: ${c.n}${c.duplicate ? ' (a second copy)' : ''}${r.discarded.includes(c) ? ', thrown away: already received' : ''}`,
            });
    }
    for (const q of r.reads)
        out.push({ at: q.at, text: `application reads ${q.n}${q.held ? ` (waited ${q.held} ticks)` : ''}` });
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
                        onClick={() => setRun({ r: simulate(event, transport), event, transport, guess })}
                    >
                        Run
                    </button>
                </div>
                <div>
                    {run ? (
                        <>
                            <Timeline r={run.r} />
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
                4 more; TCP resends a lost segment after a fixed 6 ticks (real TCP adapts this wait; see the
                TCP chapter). One thing goes wrong per run, and data is never corrupted. Dashed: resent,
                second copy, or waiting in the host; ×: lost or thrown away.
            </figcaption>
        </figure>
    );
}
