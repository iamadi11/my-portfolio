'use client';

import React, { useId, useMemo, useRef, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { ticks, verdict as judge } from '@/components/learn/kit/verdict';
import {
    CATEGORIES,
    EVENTS,
    FAIL_AT,
    LINKS,
    positionAt,
    routeAt,
    SERVICES,
    simulate,
    TRANSPORTS,
    type Category,
    type Copy,
    type Inputs,
    type NetEvent,
    type Node,
    type Run,
} from '@/lib/learn/network-model';

/**
 * Fig. 3 of the ip-and-ports chapter (asset A3): five datagrams cross a network with two paths; the learner picks
 * what happens (nothing, a route change, a link failure, congestion), the transport, and predicts what the
 * application reads. Every position, highlight and readout comes from `simulate()` and `positionAt()` at the clock's
 * time: the animation is the model's events, drawn. Nothing about the outcome is shown before Run.
 */

const EVENT_LABEL: Record<NetEvent, string> = {
    none: 'Nothing goes wrong',
    reroute: 'Route changes',
    linkFail: 'Link R2–R4 fails',
    congestion: 'R2–R4 congested',
};
const CATEGORY_LABEL: Record<Category, string> = {
    'all in order': 'All five, in order',
    'all, out of order': 'All five, out of order',
    'some missing': 'Some missing',
};

/** Node positions in the drawing (viewBox 340 × 196). */
const AT: Record<Node, [number, number]> = {
    S: [26, 96],
    R1: [98, 96],
    R2: [170, 40],
    R3: [170, 156],
    R4: [242, 96],
    H: [314, 96],
};
const EDGES: [Node, Node][] = [
    ['S', 'R1'],
    ['R1', 'R2'],
    ['R2', 'R4'],
    ['R1', 'R3'],
    ['R3', 'R4'],
    ['R4', 'H'],
];

const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
/** Ease-in-out for travel (references/motion.md): smooth start and stop, constant overall timing. */
const eio = (p: number): number => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

function tagAt(c: Copy, t: number, queueIndex: number): { x: number; y: number; lost: boolean } | null {
    const pos = positionAt(c, t);
    if (!pos) return null;
    if ('at' in pos) {
        const [x, y] = AT[pos.at];
        // Waiting packets line up to the upper left of R2 as its queue (first in line nearest R2), clear of the
        // links and inside the drawing; a dropped one sits beside the router.
        return pos.waiting
            ? { x: x - 20 - 18 * queueIndex, y: y - 26, lost: false }
            : { x: x + (pos.at === 'H' ? 0 : 18), y: y - 24, lost: !!c.lost };
    }
    const [x1, y1] = AT[pos.from];
    const [x2, y2] = AT[pos.to];
    const p = eio(pos.p);
    // Tags ride just above the link, so they never cover a router's name.
    return { x: lerp(x1, x2, p), y: lerp(y1, y2, p) - 16, lost: false };
}

function Network({ inputs, run, t }: { inputs: Inputs; run: Run | null; t: number }): React.JSX.Element {
    const marker = useId().replace(/:/g, '');
    const route = run ? routeAt(inputs.event, t) : routeAt(inputs.event, 0);
    const onRoute = (a: Node, b: Node): boolean => {
        if (!run) return false;
        const i = route.indexOf(a);
        return i >= 0 && route[i + 1] === b;
    };
    const failed = run && inputs.event === 'linkFail' && t >= FAIL_AT;
    const copies = run?.copies ?? [];
    // Queue order at R2: those waiting there now, by arrival.
    const waiting = copies
        .filter((c) => {
            const p = positionAt(c, t);
            return p && 'at' in p && p.waiting && p.at === 'R2';
        })
        .sort((a, b) => a.sent - b.sent);
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 196" aria-hidden="true">
            <defs>
                <Arrowhead id={marker} />
            </defs>
            {EDGES.map(([a, b]) => {
                const [x1, y1] = AT[a];
                const [x2, y2] = AT[b];
                const isFailed = failed && a === 'R2' && b === 'R4';
                const d = LINKS[`${a}-${b}`];
                return (
                    <g key={`${a}-${b}`}>
                        <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            className={[
                                'thin',
                                onRoute(a, b) && !isFailed && 'ln-active',
                                isFailed && 'ln-skip',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        />
                        {/* The delay sits on the side of the link away from the tags, which ride above it. */}
                        <text
                            x={(x1 + x2) / 2 + (y1 === y2 ? 0 : y2 > y1 ? -10 : 10)}
                            y={(y1 + y2) / 2 + (y1 === y2 ? 14 : y2 > y1 ? 14 : 4)}
                            className="dts"
                            textAnchor="middle"
                        >
                            {isFailed ? '×' : d}
                        </text>
                    </g>
                );
            })}
            {(['R1', 'R2', 'R3', 'R4'] as Node[]).map((n) => (
                <g key={n}>
                    <circle cx={AT[n][0]} cy={AT[n][1]} r={13} className="obj" />
                    <text x={AT[n][0]} y={AT[n][1] + 5} textAnchor="middle" className="dts">
                        {n}
                    </text>
                </g>
            ))}
            {(['S', 'H'] as Node[]).map((n) => (
                <g key={n}>
                    <rect x={AT[n][0] - 18} y={AT[n][1] - 16} width={36} height={32} rx={4} className="obj" />
                    <text x={AT[n][0]} y={AT[n][1] + 5} textAnchor="middle" className="dts">
                        {n === 'S' ? 'send' : 'host'}
                    </text>
                </g>
            ))}
            {copies.map((c) => {
                const pos = tagAt(c, t, Math.max(0, waiting.indexOf(c)));
                if (!pos) return null;
                return (
                    <g key={`${c.n}-${c.resend ? 'r' : 'o'}`} transform={`translate(${pos.x} ${pos.y})`}>
                        <rect
                            x={-8}
                            y={-9}
                            width={16}
                            height={18}
                            rx={2}
                            className={c.resend ? 'slot' : 'nb'}
                        />
                        <text x={0} y={5} textAnchor="middle" className="dts">
                            {pos.lost ? '×' : c.n}
                        </text>
                    </g>
                );
            })}
            {waiting.length ? (
                <text x={AT.R2[0] + 18} y={AT.R2[1] - 21} className="dts">
                    queue {waiting.length}
                </text>
            ) : null}
        </svg>
    );
}

/** One copy's events: sent, each hop, any wait in R2's queue, any drop. */
function copyEvents(c: Copy, add: (t: number, s: string) => void): void {
    const name = `${c.resend ? 'resent ' : ''}${c.n}`;
    add(c.sent, `${c.resend ? 'the sender resends' : 'the sender sends'} ${c.n}`);
    for (const h of c.hops.slice(1))
        add(h.at, h.node === 'H' ? `${name} arrives at the host` : `${name} reaches ${h.node}`);
    if (c.waited > 0)
        add(c.hops.find((h) => h.node === 'R2')!.at, `${name} waits ${ticks(c.waited)} in R2's queue`);
    if (c.lost) add(c.lost.at, `R2 cannot forward ${name}: it is dropped`);
}

/** What happens at each whole tick, in words: the step text and the text alternative of the drawing. */
function eventsAt(run: Run): Map<number, string[]> {
    const m = new Map<number, string[]>();
    const add = (t: number, s: string): void => {
        const k = Math.ceil(t - 1e-9);
        m.set(k, [...(m.get(k) ?? []), s]);
    };
    for (const c of run.copies) copyEvents(c, add);
    for (const r of run.reads)
        add(r.at, `the application reads ${r.n}${r.held ? ` (it waited ${ticks(r.held)})` : ''}`);
    return m;
}

/** The outcome after a run ends: the category and verdict, both transports side by side, and the run as a list. */
function Outcome({
    run,
    verdict,
    words,
}: {
    run: { inputs: Inputs; r: Run };
    verdict: string;
    words: Map<number, string[]>;
}): React.JSX.Element {
    const flip = run.inputs.transport === 'UDP' ? 'TCP' : 'UDP';
    const byT: Record<string, Run> = {
        [run.inputs.transport]: run.r,
        [flip]: simulate({ ...run.inputs, transport: flip }),
    };
    return (
        <>
            <p className="m-0 mt-2" data-result>
                <strong>{CATEGORY_LABEL[run.r.category]}.</strong> {verdict}
            </p>
            <table className="ln-compare">
                <caption>Same network, both transports</caption>
                <thead>
                    <tr>
                        <th scope="col">Transport</th>
                        <th scope="col">Reads</th>
                        <th scope="col">Last read</th>
                        <th scope="col">Resent</th>
                    </tr>
                </thead>
                <tbody>
                    {(['UDP', 'TCP'] as const).map((tr) => (
                        <tr key={tr}>
                            <th scope="row">{tr}</th>
                            <td>{byT[tr].reads.map((x) => x.n).join(' ')}</td>
                            <td>tick {byT[tr].lastRead}</td>
                            <td>{byT[tr].copies.filter((c) => c.resend).length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <details className="mt-2">
                <summary>The run as a list</summary>
                <ol className="ln-pfeed">
                    {[...words.entries()]
                        .sort((a, b) => a[0] - b[0])
                        .map(([k, list]) => (
                            <li key={k}>
                                tick {k}: {list.join('; ')}
                            </li>
                        ))}
                </ol>
            </details>
        </>
    );
}

/** What has reached the host and what the application has read by time t. */
function Readout({ r, t }: { r: Run; t: number }): React.JSX.Element {
    const arrived = r.copies
        .filter((c) => !c.lost && c.hops.at(-1)!.at <= t + 1e-6)
        .sort((a, b) => a.hops.at(-1)!.at - b.hops.at(-1)!.at);
    const read = r.reads.filter((x) => x.at <= t + 1e-6);
    return (
        <dl className="ln-out">
            <div>
                <dt>Arrived at the host, in order</dt>
                <dd>{arrived.map((c) => c.n).join(' ') || '—'}</dd>
            </div>
            <div>
                <dt>The application has read</dt>
                <dd>{read.map((x) => x.n).join(' ') || '—'}</dd>
            </div>
        </dl>
    );
}

const DEFAULT: Inputs = { event: 'reroute', transport: 'UDP', service: 3 };

export default function NetworkLab(): React.JSX.Element {
    const [inputs, setInputs] = useState<Inputs>(DEFAULT);
    const [guess, setGuess] = useState<Category | null>(null);
    const [run, setRun] = useState<{ inputs: Inputs; r: Run; guess: Category | null } | null>(null);
    const result = useRef<HTMLDivElement>(null);
    const end = run?.r.end ?? 1;
    const marks = useMemo(() => Array.from({ length: Math.ceil(end) + 1 }, (_, i) => i), [end]);
    const clock = useClock({ marks, end, rate: 2.2 });
    const [announce, setAnnounce] = useState('');
    const words = useMemo(() => (run ? eventsAt(run.r) : new Map<number, string[]>()), [run]);
    const tick = Math.max(0, clock.at);
    const now = words.get(tick) ?? [];
    const set = (patch: Partial<Inputs>): void => {
        setInputs((x) => ({ ...x, ...patch }));
        setRun(null);
        setAnnounce('');
        clock.reset();
    };
    const go = (): void => {
        setRun({ inputs, r: simulate(inputs), guess });
        setAnnounce('');
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const step = (dir: 1 | -1): void => {
        if (dir > 0) clock.next();
        else clock.prev();
        const k = Math.min(marks.length - 1, Math.max(0, tick + dir));
        setAnnounce(`Tick ${k}: ${(words.get(k) ?? ['nothing new']).join('; ')}.`);
    };
    const verdict = run ? judge(run.guess, run.r.category, CATEGORY_LABEL) : '';
    // The outcome is shown once the run has played (or been stepped) to its end: the animation leads.
    const finished = run !== null && clock.t >= end - 1e-6;
    const nowText = now.length ? `${now.join('; ')}.` : finished ? 'The run is over.' : 'Packets in flight.';
    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig3-h">
            <div className="ln-fig-head">
                <span id="fig3-h">Fig. 3 · Five datagrams through a network</span>
                <span>Teaching model in ticks, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div className="ln-controls">
                    <Choice
                        legend="On the way"
                        options={EVENTS}
                        label={(e) => EVENT_LABEL[e]}
                        value={inputs.event}
                        onChange={(e) => set({ event: e })}
                    />
                    {inputs.event === 'congestion' ? (
                        <Choice
                            legend="R2–R4 needs, per packet (packets arrive every 2 ticks)"
                            options={SERVICES}
                            label={(s) => `${s} ${s === 1 ? 'tick' : 'ticks'}`}
                            value={inputs.service}
                            onChange={(s) => set({ service: s })}
                        />
                    ) : null}
                    <Choice
                        legend="Transport"
                        options={TRANSPORTS}
                        label={(x) => x}
                        value={inputs.transport}
                        onChange={(x) => set({ transport: x })}
                    />
                    <div className="ln-predict">
                        <Choice
                            legend="Predict first: what does the application read?"
                            options={CATEGORIES}
                            label={(c) => CATEGORY_LABEL[c]}
                            value={guess}
                            onChange={(c) => {
                                setGuess(c);
                                setRun(null);
                                setAnnounce('');
                                clock.reset();
                            }}
                        />
                    </div>
                    <button type="button" className="ln-btn" onClick={go}>
                        Run
                    </button>
                </div>
                <div ref={result}>
                    <Network inputs={inputs} run={run?.r ?? null} t={clock.t} />
                    {run ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>Tick {tick}.</strong> {nowText}
                            </p>
                            <Transport
                                label="Run controls"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={() => step(-1)}
                                onNext={() => step(1)}
                                onReset={clock.reset}
                            />
                            <Readout r={run.r} t={clock.t} />
                            {finished ? <Outcome run={run} verdict={verdict} words={words} /> : null}
                        </>
                    ) : (
                        <p className="ln-frame">Choose what happens on the way, predict, then press Run.</p>
                    )}
                    <p className="sr-only" aria-live="polite">
                        {run && finished
                            ? `${EVENT_LABEL[run.inputs.event]}, ${run.inputs.transport}. The application reads ${run.r.reads.map((x) => x.n).join(' ')}: ${CATEGORY_LABEL[run.r.category].toLowerCase()}, last at tick ${run.r.lastRead}. ${verdict}`
                            : ''}
                    </p>
                    <p className="sr-only" aria-live="polite">
                        {announce}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Numbers on links are delays in ticks (an assumed unit, not to scale); the heavy line is
                R1&rsquo;s route right now; a dashed tag is a resend. The sender sends every 2 ticks. Routing
                reconverges in 3 ticks after the failure; TCP resends after a fixed 12 ticks (real TCP adapts
                its timer). No other traffic; links never corrupt data.
            </figcaption>
        </figure>
    );
}
