'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { ticks, verdict as judge } from '@/components/learn/kit/verdict';
import {
    CATEGORIES,
    EVENTS,
    FAIL_AT,
    positionAt,
    routeAt,
    RTO,
    SEND_GAP,
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

import {
    block,
    corners,
    cylinder,
    fit,
    iso,
    Metal,
    place,
    type Plan,
    type Point3,
    type Projection,
} from '../anatomy/metal';

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

/** Where each machine sits. A packet's place is this point, plus a queue or a drop offset. */
const SEAT: Record<Node, Point3> = {
    S: [0, 0, 18],
    R1: [48, 0, 18],
    R2: [96, -42, 18],
    R3: [96, 42, 18],
    R4: [144, 0, 18],
    H: [192, 0, 18],
};
const BOX: Record<Node, Plan> = {
    S: { x: -16, y: -14, w: 32, d: 28, r: 3 },
    R1: { x: 34, y: -12, w: 28, d: 24, r: 2 },
    R2: { x: 82, y: -54, w: 28, d: 24, r: 2 },
    R3: { x: 82, y: 30, w: 28, d: 24, r: 2 },
    R4: { x: 130, y: -12, w: 28, d: 24, r: 2 },
    H: { x: 176, y: -14, w: 32, d: 28, r: 3 },
};
const EDGES: [Node, Node][] = [
    ['S', 'R1'],
    ['R1', 'R2'],
    ['R2', 'R4'],
    ['R1', 'R3'],
    ['R3', 'R4'],
    ['R4', 'H'],
];
const BODY: Plan = { x: -7, y: -5, w: 14, d: 10, r: 1.5 };

const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
/** Ease-in-out for travel (references/motion.md): smooth start and stop, constant overall timing. */
const eio = (p: number): number => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

function tagAt(
    c: Copy,
    t: number,
    queueIndex: number,
    lostIndex: number
): { at: Point3; lost: boolean } | null {
    const pos = positionAt(c, t);
    if (!pos) return null;
    if ('at' in pos) {
        const [x, y, z] = SEAT[pos.at];
        // Waiting copies line up beside R2, nearest first. A dropped copy stays off the wire.
        return pos.waiting
            ? { at: [x - 16 - 14 * queueIndex, y, z], lost: false }
            : { at: [x + (c.lost ? 18 + 16 * lostIndex : 0), y, c.lost ? 2 : z], lost: !!c.lost };
    }
    const [x1, y1, z1] = SEAT[pos.from];
    const [x2, y2, z2] = SEAT[pos.to];
    const p = eio(pos.p);
    return {
        at: [lerp(x1, x2, p), lerp(y1, y2, p), lerp(z1, z2, p) + 6],
        lost: false,
    };
}

const NODES: Node[] = ['S', 'R1', 'R2', 'R3', 'R4', 'H'];

type Part = { key: string; paths: ReturnType<typeof block>; lit?: boolean };

/** Bench, a computer that sends, four short racks, and a tall rack that receives. */
function buildScene(): {
    projection: Projection;
    feet: { key: string; paths: ReturnType<typeof block> }[];
    screws: { key: string; paths: ReturnType<typeof cylinder> }[];
    base: ReturnType<typeof block>;
    machines: Record<Node, Part[]>;
    body: ReturnType<typeof block>;
    mark: [number, number];
} {
    const base: Plan = { x: -32, y: -68, w: 256, d: 140, r: 6 };
    const foot = (x: number, y: number) => ({ plan: { x, y, w: 12, d: 12, r: 1 }, z: -6, h: 6 });
    const feet = [
        foot(base.x + 14, base.y + 12),
        foot(base.x + base.w - 26, base.y + 12),
        foot(base.x + 14, base.y + base.d - 24),
        foot(base.x + base.w - 26, base.y + base.d - 24),
    ];
    const send = BOX.S;
    const host = BOX.H;
    const screen = { x: send.x + 5, y: send.y + 3, w: 18, d: 5, r: 1 };
    const keys = { x: send.x + 4, y: send.y + send.d - 9, w: 22, d: 7, r: 1 };
    const hostScreen = { x: host.x + 6, y: host.y + 4, w: 16, d: 5, r: 1 };
    const projection = fit(
        corners([
            { plan: base, z: -6, h: 8 },
            ...feet,
            { plan: send, z: 0, h: 28 },
            { plan: host, z: 0, h: 32 },
            ...NODES.filter((n) => n !== 'S' && n !== 'H').map((n) => ({ plan: BOX[n], z: 0, h: 22 })),
            { plan: BODY, z: 0, h: 10 },
        ]),
        720,
        360
    );
    const rack = (n: Node, h: number): Part[] => {
        const plan = BOX[n];
        const cx = plan.x + plan.w / 2;
        const cy = plan.y + plan.d / 2;
        return [
            { key: `${n}-case`, paths: block(plan, 0, h, projection) },
            { key: `${n}-vent`, paths: cylinder(cx, cy, 2.8, h, 5, projection, 12, 0.3) },
        ];
    };
    const machines: Record<Node, Part[]> = {
        S: [
            { key: 'send-case', paths: block(send, 0, 10, projection) },
            { key: 'send-screen', paths: block(screen, 10, 14, projection), lit: true },
            { key: 'send-keys', paths: block(keys, 0, 3, projection) },
        ],
        R1: rack('R1', 20),
        R2: rack('R2', 20),
        R3: rack('R3', 20),
        R4: rack('R4', 20),
        H: [
            { key: 'host-case', paths: block(host, 0, 32, projection) },
            {
                key: 'host-vent-a',
                paths: cylinder(host.x + 10, host.y + 16, 2.6, 32, 5, projection, 12, 0.3),
            },
            {
                key: 'host-vent-b',
                paths: cylinder(host.x + 22, host.y + 16, 2.6, 32, 5, projection, 12, 0.3),
            },
            { key: 'host-screen', paths: block(hostScreen, 32, 8, projection) },
        ],
    };
    return {
        projection,
        feet: feet.map((f) => ({
            key: `foot-${f.plan.x}-${f.plan.y}`,
            paths: block(f.plan, f.z, f.h, projection),
        })),
        screws: feet.map((f) => ({
            key: `screw-${f.plan.x}-${f.plan.y}`,
            paths: cylinder(f.plan.x + 6, f.plan.y + 6, 1.5, 0, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 4, projection),
        machines,
        body: block(BODY, 0, 8, projection),
        mark: iso([BODY.x + BODY.w / 2, BODY.y + BODY.d / 2, 6], projection),
    };
}

function Network({ inputs, run, t }: { inputs: Inputs; run: Run | null; t: number }): React.JSX.Element {
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
    const lostOnes = copies.filter((c) => c.lost && c.lost.at <= t).sort((a, b) => a.lost!.at - b.lost!.at);
    const hostLit = copies.some((c) => {
        const p = positionAt(c, t);
        return p !== null && 'at' in p && p.at === 'H' && !c.lost;
    });
    const scene = useMemo(() => buildScene(), []);
    const rest: Point3 = [BODY.x, BODY.y, 0];
    const order = [...NODES].sort(
        (a, b) => iso(SEAT[a], scene.projection)[1] - iso(SEAT[b], scene.projection)[1]
    );
    return (
        <div className="iso" data-theme="light">
            <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 720 360" aria-hidden="true">
                {scene.feet.map((f) => (
                    <Metal key={f.key} paths={f.paths} />
                ))}
                {scene.screws.map((screw) => (
                    <Metal key={screw.key} paths={screw.paths} />
                ))}
                <Metal paths={scene.base} />
                {EDGES.map(([a, b]) => {
                    const [x1, y1] = iso([SEAT[a][0], SEAT[a][1], 8], scene.projection);
                    const [x2, y2] = iso([SEAT[b][0], SEAT[b][1], 8], scene.projection);
                    const isFailed = failed && a === 'R2' && b === 'R4';
                    return (
                        <g key={`${a}-${b}`}>
                            <line
                                x1={x1}
                                y1={y1}
                                x2={isFailed ? x1 + (x2 - x1) * 0.35 : x2}
                                y2={isFailed ? y1 + (y2 - y1) * 0.35 : y2}
                                className={['thin', onRoute(a, b) && !isFailed && 'ln-active']
                                    .filter(Boolean)
                                    .join(' ')}
                            />
                            {isFailed ? (
                                <>
                                    <line
                                        x1={x1 + (x2 - x1) * 0.65}
                                        y1={y1 + (y2 - y1) * 0.65}
                                        x2={x2}
                                        y2={y2}
                                        className="thin"
                                    />
                                    <text
                                        x={x1}
                                        y={y1 - 52}
                                        className="iso-label"
                                        textAnchor="middle"
                                    >
                                        × failed
                                    </text>
                                </>
                            ) : null}
                        </g>
                    );
                })}
                {order.map((n) => (
                    <g key={n}>
                        {scene.machines[n].map((part) => (
                            <Metal
                                key={part.key}
                                paths={part.paths}
                                lit={part.key === 'host-screen' ? hostLit : part.lit}
                            />
                        ))}
                    </g>
                ))}
                {copies.map((c) => {
                    const pos = tagAt(
                        c,
                        t,
                        Math.max(0, waiting.indexOf(c)),
                        Math.max(0, lostOnes.indexOf(c))
                    );
                    if (!pos) return null;
                    return (
                        <g
                            key={`${c.n}-${c.resend ? 'r' : 'o'}`}
                            transform={place(rest, pos.at, scene.projection)}
                        >
                            <Metal paths={scene.body} lit={!pos.lost} />
                            <text
                                x={scene.mark[0]}
                                y={scene.mark[1]}
                                textAnchor="middle"
                                className="iso-label"
                            >
                                {pos.lost ? `×${c.n}` : c.n}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
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

/** "2", "2 and 3", "2, 3 and 4". */
const and = (ns: number[]): string =>
    ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns.at(-1)}`;
const arrival = (c: Copy): number => c.hops.at(-1)!.at;
const pathOf = (c: Copy): string =>
    c.hops.some((h) => h.node === 'R3') ? 'lower path (7 ticks)' : 'upper path (4 ticks)';

/** What happened on the network, from the run: the first packet that overtook another, drops, the queue. */
function networkRule({ inputs, r }: { inputs: Inputs; r: Run }): string[] {
    const firsts = r.copies.filter((c) => !c.resend);
    const arrived = firsts.filter((c) => !c.lost);
    const late = arrived.find((a) => arrived.some((b) => b.n > a.n && arrival(b) < arrival(a)));
    const out: string[] = [];
    if (late) {
        const early = arrived.find((b) => b.n > late.n && arrival(b) < arrival(late))!;
        out.push(
            `${early.n} arrived before ${late.n}: ${late.n} took the ${pathOf(late)}, ${early.n} the ${pathOf(early)}.`
        );
    }
    const dropped = firsts.filter((c) => c.lost).map((c) => c.n);
    if (dropped.length) out.push(`R2 dropped ${and(dropped)} while R2–R4 was down.`);
    if (inputs.event === 'congestion')
        out.push(
            r.maxQueue > 0
                ? `R2–R4 needs ${ticks(inputs.service)} per packet and they arrive every ${SEND_GAP}, so the queue grew to ${r.maxQueue} and each waited longer than the last.`
                : `R2–R4 needs ${ticks(inputs.service)} per packet and they arrive every ${SEND_GAP}, so no queue built.`
        );
    return out;
}

/** What the transport did with what arrived. */
function transportRule({ inputs, r }: { inputs: Inputs; r: Run }): string {
    if (inputs.transport === 'UDP') {
        if (r.category === 'some missing') return 'UDP handed over what arrived, gaps included.';
        return r.category === 'all, out of order'
            ? 'UDP handed them over in arrival order.'
            : 'UDP handed each over as it arrived.';
    }
    const resent = r.copies.filter((c) => c.resend).map((c) => c.n);
    const held = r.reads.filter((x) => x.held > 0).map((x) => x.n);
    const parts = [
        resent.length ? `TCP resent ${and(resent)} when its ${RTO}-tick timer ran out` : '',
        held.length
            ? `${and(held)} waited in the host until the gap before ${held.length > 1 ? 'them' : 'it'} filled`
            : '',
    ].filter(Boolean);
    return parts.length ? `${parts.join('; ')}.` : 'TCP read each in order as it arrived.';
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
            <p className="m-0 mt-2" data-rule>
                Why: {[...networkRule(run), transportRule(run)].join(' ')}
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
                <dt>Arrived at the host, in arrival order</dt>
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

/** Learn shows the drop: the link fails, UDP does not send the lost datagrams again. */
const LEARN_UDP: Inputs = { event: 'linkFail', transport: 'UDP', service: 3 };
/** Same failure. TCP sends the dropped datagrams again after its timer. */
const LEARN_TCP: Inputs = { event: 'linkFail', transport: 'TCP', service: 3 };

export default function NetworkLab({
    pane = 'lab',
    watch = 'udp',
}: {
    pane?: 'learn' | 'lab';
    watch?: 'udp' | 'tcp';
}): React.JSX.Element {
    const learnRun = watch === 'tcp' ? LEARN_TCP : LEARN_UDP;
    const figId = pane === 'lab' ? 'fig3-h' : watch === 'tcp' ? 'fig-net-learn-tcp' : 'fig-net-learn';
    const [inputs, setInputs] = useState<Inputs>(pane === 'learn' ? learnRun : DEFAULT);
    const [guess, setGuess] = useState<Category | null>(null);
    const [run, setRun] = useState<{ inputs: Inputs; r: Run; guess: Category | null } | null>(() =>
        pane === 'learn' ? { inputs: learnRun, r: simulate(learnRun), guess: null } : null
    );
    const result = useRef<HTMLDivElement>(null);
    const end = run?.r.end ?? 1;
    const marks = useMemo(() => Array.from({ length: Math.ceil(end) + 1 }, (_, i) => i), [end]);
    const figure = useRef<HTMLElement>(null);
    const clock = useClock({ marks, end, rate: 2.2, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
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
        // The whole tick the move lands on (from mid-tick, Previous goes to the start of the current tick).
        const to = dir > 0 ? Math.floor(clock.t + 1e-6) + 1 : Math.ceil(clock.t - 1e-6) - 1;
        const k = Math.min(marks.length - 1, Math.max(0, to));
        clock.seek(k);
        setAnnounce(`Tick ${k}: ${(words.get(k) ?? ['nothing new']).join('; ')}.`);
    };
    const verdict = run ? judge(run.guess, run.r.category, CATEGORY_LABEL) : '';
    // The outcome is shown once the run has played (or been stepped) to its end: the animation leads.
    const finished = run !== null && clock.t >= end - 1e-6;
    const said = now.join('; ');
    const nowText = said
        ? `${said[0].toUpperCase()}${said.slice(1)}.`
        : finished
          ? 'The run is over.'
          : 'Packets in flight.';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn'
                        ? watch === 'tcp'
                            ? 'TCP sends them again'
                            : 'A link fails'
                        : 'Fig. 3 · Five datagrams through a network'}
                </span>
                <span>Teaching model in ticks, not a benchmark</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
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
                ) : null}
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
                {pane === 'learn'
                    ? watch === 'tcp'
                        ? 'Same link, TCP. The two datagrams that stopped are sent again after 12 ticks, and they take the path that still works. The application then reads 1 through 5. Ticks are the model’s clock, not milliseconds. The line under the drawing names the tick.'
                        : 'UDP, and the link fails. A datagram that cannot be forwarded stays where it stopped. This run does not send it again. Ticks are the model’s clock, not milliseconds. The line under the drawing names the tick.'
                    : 'Each body is one datagram. Its place is the model’s place at this tick. The sender sends every 2 ticks. Routing reconverges in 3 ticks after the failure; TCP resends after a fixed 12 ticks (real TCP adapts its timer). No other traffic; links never corrupt data.'}
            </figcaption>
        </figure>
    );
}
