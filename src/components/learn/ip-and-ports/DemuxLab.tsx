'use client';

import React, { useId, useMemo, useRef, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    demux,
    DESTS,
    FIREWALLS,
    label,
    OTHER,
    OUTCOMES,
    PORTS,
    PROTOS,
    SERVER,
    SOURCE_PORT,
    SOURCES,
    type Delivery,
    type Step,
    type Dest,
    type Firewall,
    type Outcome,
    type Packet,
    type Source,
    type Stage,
} from '@/lib/learn/demux-model';

/**
 * Fig. 2 of the ip-and-ports chapter (asset A2): build a packet, predict where it goes, run, then step through the
 * host's stages (address, firewall if on, protocol, lookup, result). Every outcome comes from `demux()`. Nothing
 * about the outcome is on the page until Run, and any change clears it, so the prediction is a real one. The packet
 * tag travels from stage to stage and any reply travels back to the sender, on one clock the learner can play, pause
 * and step (reduced motion: no gliding, the tag jumps from stage to stage). The element the current stage reads is
 * drawn heavy, and the current step sits right under the drawing; the outcome appears when the run has finished.
 */

const SOURCE_LABEL: Record<Source, string> = {
    conn1: `${SOURCE_PORT.conn1} (connection 1 open)`,
    conn2: `${SOURCE_PORT.conn2} (connection 2 open)`,
    fresh: `${SOURCE_PORT.fresh} (nothing open)`,
};
const DEST_LABEL: Record<Dest, string> = {
    server: `${SERVER} (this server)`,
    other: `${OTHER} (another machine)`,
};
const FIREWALL_LABEL: Record<Firewall, string> = {
    off: 'Off',
    on: 'On: allow TCP 443 and UDP 8125 only',
};
const OUTCOME_LABEL: Record<Outcome, string> = {
    'connection 1': 'Web server, connection 1',
    'connection 2': 'Web server, connection 2',
    'new connection': 'Web server, as a new connection',
    'metrics collector': 'Metrics collector',
    'tcp reset': 'Nobody: a TCP reset comes back',
    'icmp unreachable': 'Nobody: ICMP Port Unreachable comes back',
    'dropped by firewall': 'Dropped by the firewall: nothing comes back',
    'another machine': 'Never reaches this server',
};
const STAGE_LABEL: Record<Stage, string> = {
    address: 'Address',
    firewall: 'Firewall',
    protocol: 'Protocol',
    lookup: 'Lookup',
    result: 'Result',
};

const DEFAULT: Packet = { proto: 'TCP', source: 'conn1', dest: 'server', port: 443, firewall: 'off' };

/** The drawing element that decides the packet's fate. */
const TARGET: Record<Outcome, string> = {
    'connection 1': 'conn-1',
    'connection 2': 'conn-2',
    'new connection': 'listen-443',
    'metrics collector': 'udp-8125',
    'tcp reset': 'tcp-none',
    'icmp unreachable': 'udp-none',
    'dropped by firewall': 'fw',
    'another machine': 'other',
};

/** The mark under the server when nobody receives the packet. */
const FATE: Partial<Record<Outcome, string>> = {
    'tcp reset': '× nobody: a reset (RST) goes back',
    'icmp unreachable': '× nobody: ICMP Port Unreachable goes back',
    'dropped by firewall': '× dropped at the firewall: nothing goes back',
};

/** What the drawing highlights at a stage: the parts that stage reads. */
function focus(p: Packet, d: Delivery, stage: Stage | undefined): Set<string> {
    const target = TARGET[d.outcome];
    if (stage === 'address') return new Set([p.dest === 'server' ? 'addr' : 'other']);
    if (stage === 'firewall') return new Set(['fw']);
    if (stage === 'protocol') return new Set([`lane-${p.proto}`]);
    if (stage === 'lookup') return new Set(p.proto === 'TCP' ? ['table', target] : [target]);
    if (stage === 'result') return new Set([target]);
    return new Set();
}

/** Where the packet tag sits when a stage has acted on it (drawing coordinates): beside each part's text, never on it. */
const SPOT: Record<string, [number, number]> = {
    origin: [300, 18],
    addr: [246, 74],
    other: [298, 389],
    fw: [294, 105],
    'lane-TCP': [56, 140],
    'lane-UDP': [212, 140],
    'conn-1': [159, 188],
    'conn-2': [159, 216],
    'listen-443': [162, 271],
    'tcp-none': [150, 307],
    'udp-8125': [282, 201],
    'udp-none': [288, 312],
};
/** What travels back to the sender, if anything. */
const REPLY: Partial<Record<Outcome, string>> = {
    'connection 1': 'answer',
    'connection 2': 'answer',
    'new connection': 'set-up',
    'tcp reset': 'RST',
    'icmp unreachable': 'ICMP',
};
/** Share of each stage's time spent travelling to it; the rest the tag rests there. */
const TRAVEL = 0.6;
const eio = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** The spot each stage moves the packet to, in order. */
function route(p: Packet, d: Delivery): [number, number][] {
    return d.steps.map((s) => {
        if (s.stage === 'address') return SPOT[p.dest === 'server' ? 'addr' : 'other'];
        if (s.stage === 'firewall') return SPOT.fw;
        if (s.stage === 'protocol') return SPOT[`lane-${p.proto}`];
        return SPOT[TARGET[d.outcome]];
    });
}

/** The packet tag at time t: it travels to stage k during [k, k + TRAVEL] and rests there until k + 1. */
function packetAt(spots: [number, number][], t: number): [number, number] {
    const k = Math.min(spots.length - 1, Math.floor(t));
    const from = k === 0 ? SPOT.origin : spots[k - 1];
    const f = Math.min(1, Math.max(0, (t - k) / TRAVEL));
    const e = t >= spots.length ? 1 : eio(f);
    return [from[0] + (spots[k][0] - from[0]) * e, from[1] + (spots[k][1] - from[1]) * e];
}

/** The packet's tag moving through the host's stages, and the reply (if any) travelling back to the sender. */
function Moving({ p, d, t }: { p: Packet; d: Delivery; t: number }): React.JSX.Element {
    const spots = route(p, d);
    const [x, y] = packetAt(spots, t);
    const n = spots.length;
    const reply = REPLY[d.outcome];
    const r = Math.min(1, Math.max(0, (t - n) / TRAVEL));
    const [ex, ey] = spots[n - 1];
    const ry = ey + (SPOT.origin[1] - ey) * eio(r);
    const rx = ex + (SPOT.origin[0] - ex) * eio(r);
    return (
        <g>
            <g transform={`translate(${x} ${y})`}>
                <rect x={-13} y={-9} width={26} height={18} rx={3} className="nb ln-active" />
                <text x={0} y={5} textAnchor="middle" className="dts">
                    pkt
                </text>
            </g>
            {reply && t > n ? (
                <g transform={`translate(${rx} ${ry})`}>
                    <rect x={-22} y={-9} width={44} height={18} rx={3} className="slot" />
                    <text x={0} y={5} textAnchor="middle" className="dts">
                        {reply}
                    </text>
                </g>
            ) : null}
        </g>
    );
}

function Drawing({
    p,
    d,
    stage,
    t,
}: {
    p: Packet;
    d: Delivery | null;
    stage: Stage | undefined;
    t: number;
}): React.JSX.Element {
    const marker = useId().replace(/:/g, '');
    const on = d ? focus(p, d, stage) : new Set<string>();
    const box = (key: string, base = 'obj'): string =>
        [base, on.has(key) && 'ln-active', on.has(key) && 'ln-node-on'].filter(Boolean).join(' ');
    const fate = d && stage === 'result' ? FATE[d.outcome] : undefined;
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 412" aria-hidden="true">
            <defs>
                <Arrowhead id={marker} />
            </defs>
            {/* The packet: its five fields, and an arrow to the machine its destination address names. */}
            <rect x={6} y={4} width={328} height={44} rx={4} className="nb" />
            <text x={16} y={22} className="sl">
                packet
            </text>
            <text x={16} y={40} className="dts">
                {label(p)}
            </text>
            {p.dest === 'server' ? (
                <line x1={170} y1={48} x2={170} y2={60} className="thin" markerEnd={`url(#${marker})`} />
            ) : (
                <path d="M 331 48 V 389 H 324" className="thin" fill="none" markerEnd={`url(#${marker})`} />
            )}
            {/* This server, with the firewall at its edge when on. */}
            <rect x={6} y={74} width={316} height={266} rx={6} className="obj" />
            <rect x={110} y={62} width={120} height={24} rx={3} className={box('addr', 'nb')} />
            <text x={170} y={79} textAnchor="middle" className="dts">
                {SERVER}
            </text>
            {p.firewall === 'on' ? (
                <>
                    <rect x={16} y={94} width={296} height={22} rx={3} className={box('fw', 'hug')} />
                    <text x={150} y={110} textAnchor="middle" className="dts">
                        firewall: allow TCP 443, UDP 8125
                    </text>
                </>
            ) : null}
            <rect x={16} y={124} width={170} height={206} rx={4} className={box('lane-TCP', 'well')} />
            <text x={101} y={144} textAnchor="middle" className="vt">
                TCP
            </text>
            <text x={24} y={164} className="sl">
                open connections
            </text>
            <rect x={22} y={170} width={158} height={64} rx={3} className={box('table', 'thin')} />
            <rect x={28} y={176} width={146} height={24} rx={3} className={box('conn-1')} />
            <text x={36} y={193} className="dts">
                1 · from :{SOURCE_PORT.conn1}
            </text>
            <rect x={28} y={204} width={146} height={24} rx={3} className={box('conn-2')} />
            <text x={36} y={221} className="dts">
                2 · from :{SOURCE_PORT.conn2}
            </text>
            <text x={24} y={252} className="sl">
                listening
            </text>
            <rect x={22} y={258} width={158} height={26} rx={3} className={box('listen-443')} />
            <text x={30} y={276} className="dts">
                443 · web server
            </text>
            <rect x={22} y={290} width={158} height={34} rx={3} className={box('tcp-none', 'slot')} />
            <text x={30} y={304} className="dts">
                8125, 9000
            </text>
            <text x={30} y={319} className="sl">
                nobody
            </text>
            <rect x={194} y={124} width={118} height={206} rx={4} className={box('lane-UDP', 'well')} />
            <text x={253} y={144} textAnchor="middle" className="vt">
                UDP
            </text>
            <rect x={200} y={170} width={106} height={62} rx={3} className={box('udp-8125')} />
            <text x={210} y={188} className="dts">
                8125
            </text>
            <text x={210} y={206} className="sl">
                metrics
            </text>
            <text x={210} y={224} className="sl">
                collector
            </text>
            <rect x={200} y={282} width={106} height={42} rx={3} className={box('udp-none', 'slot')} />
            <text x={208} y={300} className="dts">
                443, 9000
            </text>
            <text x={208} y={316} className="sl">
                nobody
            </text>
            {fate ? (
                <text x={164} y={360} textAnchor="middle" className="dts">
                    {fate}
                </text>
            ) : null}
            {/* Another machine. */}
            <rect x={6} y={372} width={316} height={34} rx={4} className={box('other')} />
            <text x={164} y={394} textAnchor="middle" className="dts">
                another machine · {OTHER}
            </text>
            {d ? <Moving p={p} d={d} t={t} /> : null}
        </svg>
    );
}

/** The clock's marks: the moment the tag arrives at each stage, and the reply reaching the sender, if any. */
const marksOf = (n: number, reply: boolean): number[] => [
    ...Array.from({ length: n }, (_, k) => k + TRAVEL),
    ...(reply ? [n + TRAVEL] : []),
];

/** What Previous and Next announce at mark n. */
const stepWords = (steps: Step[], n: number, reply: string): string =>
    n >= steps.length
        ? `The reply reaches the sender: ${reply}.`
        : `Step ${n + 1} of ${steps.length}, ${STAGE_LABEL[steps[n].stage]}. ${steps[n].text}`;

/** The stage the packet is at now, in words, under the drawing; and the reply once it has reached the sender. */
function CurrentStep({
    step,
    n,
    of,
    reply,
}: {
    step: Step | undefined;
    n: number;
    of: number;
    reply: string | null;
}): React.JSX.Element {
    if (!step)
        return (
            <p className="m-0 mt-2" data-current-step>
                The packet is on its way.
            </p>
        );
    return (
        <p className="m-0 mt-2" data-current-step>
            <strong>
                Step {n} of {of}, {STAGE_LABEL[step.stage]}.
            </strong>{' '}
            {step.text} <span className="ln-step-why">({step.source})</span>
            {reply ? ` Then the reply reaches the sender: ${reply}.` : null}
        </p>
    );
}

/** Every stage for this packet, as buttons that jump the run to that stage. */
function StepList({
    steps,
    current,
    goTo,
}: {
    steps: Step[];
    current: number;
    goTo: (i: number) => void;
}): React.JSX.Element {
    return (
        <ol className="ln-steps" aria-label="All the host's stages for this packet">
            {steps.map((s, i) => (
                <li key={s.stage}>
                    <button
                        type="button"
                        className="ln-step"
                        aria-current={i === current ? 'step' : undefined}
                        onClick={() => goTo(i)}
                    >
                        <span className="ln-step-n">{i + 1}</span>
                        <span>
                            <strong>{STAGE_LABEL[s.stage]}.</strong> {s.text}
                        </span>
                    </button>
                </li>
            ))}
        </ol>
    );
}

export default function DemuxLab(): React.JSX.Element {
    const [p, setP] = useState<Packet>(DEFAULT);
    const [guess, setGuess] = useState<Outcome | null>(null);
    /** The last run, or null until the learner runs. Cleared when the packet or the prediction changes. */
    const [run, setRun] = useState<{ p: Packet; d: Delivery; guess: Outcome | null } | null>(null);
    const [announce, setAnnounce] = useState('');
    const stage = useRef<HTMLDivElement>(null);
    const steps = run?.d.steps ?? [];
    // One mark per stage (the moment the tag arrives there), and one for the reply reaching the sender, if any.
    const hasReply = run ? REPLY[run.d.outcome] !== undefined : false;
    const marks = useMemo(() => marksOf(steps.length, hasReply), [steps.length, hasReply]);
    const clock = useClock({ marks, end: marks.at(-1) ?? 1 });
    const at = Math.min(steps.length - 1, Math.max(0, clock.at));
    const clear = (): void => {
        setRun(null);
        setAnnounce('');
        clock.reset();
    };
    const set = (patch: Partial<Packet>): void => {
        setP((x) => ({ ...x, ...patch }));
        clear();
    };
    const go = (): void => {
        setRun({ p, d: demux(p), guess });
        setAnnounce('');
        clock.restart();
        revealAfterRender(() => stage.current);
    };
    const say = (k: number): void => {
        setAnnounce(stepWords(steps, Math.min(marks.length - 1, Math.max(0, k)), run?.d.reply ?? ''));
    };
    const goTo = (i: number): void => {
        clock.seek(marks[Math.min(marks.length - 1, Math.max(0, i))]);
        say(i);
    };
    const currentIndex = clock.at >= 0 ? at : -1;
    const current: Step | undefined = steps[currentIndex];
    // The outcome is shown once the packet (and any reply) has finished: the animation leads.
    const done = clock.at >= marks.length - 1 ? run : null;
    const verdict = done ? judge(done.guess, done.d.outcome, OUTCOME_LABEL) : '';
    const replied = hasReply && clock.at >= steps.length;
    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig2-h">
            <div className="ln-fig-head">
                <span id="fig2-h">Fig. 2 · Which program gets this packet?</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div className="ln-controls">
                    <Choice
                        legend="From client 198.51.100.7, source port"
                        options={SOURCES}
                        label={(s) => SOURCE_LABEL[s]}
                        value={p.source}
                        onChange={(s) => set({ source: s })}
                    />
                    <Choice
                        legend="To address"
                        options={DESTS}
                        label={(x) => DEST_LABEL[x]}
                        value={p.dest}
                        onChange={(x) => set({ dest: x })}
                    />
                    <Choice
                        legend="Protocol"
                        options={PROTOS}
                        label={(x) => x}
                        value={p.proto}
                        onChange={(x) => set({ proto: x })}
                    />
                    <Choice
                        legend="To port"
                        options={PORTS}
                        label={(x) => String(x)}
                        value={p.port}
                        onChange={(x) => set({ port: x })}
                    />
                    <Choice
                        legend="Server firewall"
                        options={FIREWALLS}
                        label={(x) => FIREWALL_LABEL[x]}
                        value={p.firewall}
                        onChange={(x) => set({ firewall: x })}
                    />
                    <div className="ln-predict">
                        <Choice
                            legend="Predict first: where does it go?"
                            options={OUTCOMES}
                            label={(o) => OUTCOME_LABEL[o]}
                            value={guess}
                            onChange={(o) => {
                                setGuess(o);
                                clear();
                            }}
                        />
                    </div>
                    <button type="button" className="ln-btn" onClick={go}>
                        Run
                    </button>
                </div>
                <div>
                    <div ref={stage}>
                        <Drawing p={p} d={run?.d ?? null} stage={current?.stage} t={clock.t} />
                        {done ? (
                            <p className="m-0 mt-2" data-result>
                                <strong>{OUTCOME_LABEL[done.d.outcome]}.</strong> {verdict} Sender gets back:{' '}
                                {done.d.reply}.
                            </p>
                        ) : null}
                        {run ? (
                            <>
                                <CurrentStep
                                    step={current}
                                    n={at + 1}
                                    of={steps.length}
                                    reply={replied ? run.d.reply : null}
                                />
                                <Transport
                                    label="Run controls"
                                    playing={clock.playing}
                                    atStart={clock.t <= 0}
                                    atEnd={clock.at >= marks.length - 1}
                                    onPlay={clock.play}
                                    onPause={clock.pause}
                                    onPrev={() => goTo(clock.at - 1)}
                                    onNext={() => goTo(clock.at + 1)}
                                    onReset={clock.reset}
                                />
                            </>
                        ) : (
                            <p className="ln-frame">Build a packet, predict, then press Run.</p>
                        )}
                    </div>
                    {run ? <StepList steps={steps} current={currentIndex} goTo={goTo} /> : null}
                    <p className="sr-only" aria-live="polite">
                        {done
                            ? `${label(done.p)}: ${OUTCOME_LABEL[done.d.outcome]}. ${verdict} Sender gets back: ${done.d.reply}.`
                            : ''}
                    </p>
                    <p className="sr-only" aria-live="polite">
                        {announce}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Assumes this server runs exactly these programs and has one address, with no NAT, proxy or
                load balancer in between; source ports 50001 and 50002 each already have a TCP connection open
                to port 443. A firewall applies whatever rule it is given, so a reply proves little and
                silence proves nothing.
            </figcaption>
        </figure>
    );
}
