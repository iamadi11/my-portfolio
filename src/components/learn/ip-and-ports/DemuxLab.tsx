'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

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

import { block, corners, cylinder, fit, iso, Metal, place, type Plan, type Point3 } from '../anatomy/metal';

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

/** A well in the cutaway. The packet rests on the well the current stage reads. */
type Well = { key: string; plan: Plan; z: number; h: number; label: string };

const CHASSIS: Well = {
    key: 'chassis',
    plan: { x: 0, y: -40, w: 168, d: 78, r: 4 },
    z: 0,
    h: 10,
    label: '',
};
const WELLS: Well[] = [
    { key: 'addr', plan: { x: 8, y: -34, w: 72, d: 12, r: 2 }, z: 10, h: 4, label: 'address' },
    { key: 'fw', plan: { x: 8, y: -18, w: 152, d: 8, r: 1 }, z: 10, h: 3, label: 'firewall' },
    { key: 'lane-TCP', plan: { x: 8, y: -6, w: 74, d: 40, r: 2 }, z: 10, h: 6, label: 'TCP' },
    { key: 'table', plan: { x: 14, y: -2, w: 62, d: 14, r: 1 }, z: 16, h: 3, label: 'sockets' },
    { key: 'conn-1', plan: { x: 16, y: -1, w: 58, d: 5, r: 1 }, z: 19, h: 3, label: '50001' },
    { key: 'conn-2', plan: { x: 16, y: 5, w: 58, d: 5, r: 1 }, z: 19, h: 3, label: '50002' },
    { key: 'listen-443', plan: { x: 14, y: 16, w: 62, d: 6, r: 1 }, z: 16, h: 4, label: '443' },
    { key: 'tcp-none', plan: { x: 14, y: 26, w: 62, d: 6, r: 1 }, z: 16, h: 2, label: 'none' },
    { key: 'lane-UDP', plan: { x: 90, y: -6, w: 70, d: 40, r: 2 }, z: 10, h: 6, label: 'UDP' },
    { key: 'udp-8125', plan: { x: 96, y: -2, w: 58, d: 12, r: 1 }, z: 16, h: 5, label: '8125' },
    { key: 'udp-none', plan: { x: 96, y: 18, w: 58, d: 10, r: 1 }, z: 16, h: 2, label: 'none' },
    { key: 'other', plan: { x: 188, y: -28, w: 36, d: 44, r: 3 }, z: 0, h: 18, label: '' },
];

/** A pin stands in a socket a program already owns. An empty socket stays flat. */
const PINS = ['conn-1', 'conn-2', 'listen-443', 'udp-8125'];
const PACKET: Plan = { x: -7, y: -5, w: 14, d: 10, r: 1.5 };

/** The packet's corner on that well. Lookup stops on the socket table; the result stops on the matching pin. */
function seat(key: string): Point3 {
    if (key === 'origin') return [-36, 0, 20];
    const well = WELLS.find((w) => w.key === key);
    if (!well) return [-36, 0, 20];
    const pin = PINS.includes(key) ? 6 : 0;
    return [well.plan.x + well.plan.w / 2 - 7, well.plan.y + well.plan.d / 2 - 5, well.z + well.h + pin];
}
/** What travels back to the sender, if anything. */
const REPLY: Partial<Record<Outcome, string>> = {
    'connection 1': 'answer',
    'connection 2': 'answer',
    'new connection': 'set-up',
    'tcp reset': 'RST',
    'icmp unreachable': 'ICMP',
};
/**
 * Share of each stage spent moving to the next mark. Pacing only: `demux()` has no milliseconds,
 * so this is not a round trip. Lookup stops on the socket table; the result stops on the matching pin.
 */
const TRAVEL = 0.6;
const eio = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** The well each stage moves the packet to, in order. */
function route(p: Packet, d: Delivery): Point3[] {
    return d.steps.map((s) => {
        if (s.stage === 'address') return seat(p.dest === 'server' ? 'addr' : 'other');
        if (s.stage === 'firewall') return seat('fw');
        if (s.stage === 'protocol') return seat(`lane-${p.proto}`);
        if (s.stage === 'lookup') return seat('table');
        return seat(TARGET[d.outcome]);
    });
}

const mix = (a: number, b: number, e: number): number => a + (b - a) * e;

/** The packet at time t: it travels to stage k during [k, k + TRAVEL] and rests there until k + 1. */
function packetAt(spots: Point3[], t: number): Point3 {
    const k = Math.min(spots.length - 1, Math.floor(t));
    const from = k === 0 ? seat('origin') : spots[k - 1];
    const f = Math.min(1, Math.max(0, (t - k) / TRAVEL));
    const e = t >= spots.length ? 1 : eio(f);
    const to = spots[k];
    return [mix(from[0], to[0], e), mix(from[1], to[1], e), mix(from[2], to[2], e)];
}

/** The packet body on the well the current stage reads, and the reply travelling back to the sender. */
function Moving({
    p,
    d,
    t,
    projection,
    body,
}: {
    p: Packet;
    d: Delivery;
    t: number;
    projection: ReturnType<typeof fit>;
    body: ReturnType<typeof block>;
}): React.JSX.Element {
    const spots = route(p, d);
    const at = packetAt(spots, t);
    const n = spots.length;
    const reply = REPLY[d.outcome];
    const r = Math.min(1, Math.max(0, (t - n) / TRAVEL));
    const last = spots[n - 1];
    const home = seat('origin');
    const e = eio(r);
    const back: Point3 = [mix(last[0], home[0], e), mix(last[1], home[1], e), mix(last[2], home[2], e)];
    const rest: Point3 = [PACKET.x, PACKET.y, 0];
    const mark = iso([PACKET.x + PACKET.w / 2, PACKET.y + PACKET.d / 2, 6], projection);
    return (
        <g>
            <g transform={place(rest, at, projection)}>
                <Metal paths={body} lit />
            </g>
            {reply && t > n ? (
                <g transform={place(rest, back, projection)}>
                    <Metal paths={body} lit />
                    <text x={mark[0]} y={mark[1]} textAnchor="middle" className="iso-label">
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
    const on = d ? focus(p, d, stage) : new Set<string>();
    const fate = d && stage === 'result' ? FATE[d.outcome] : undefined;
    const wells = useMemo(
        () => [CHASSIS, ...WELLS.filter((w) => w.key !== 'fw' || p.firewall === 'on')],
        [p.firewall]
    );
    const scene = useMemo(() => {
        const feet = [
            { x: 2, y: -38 },
            { x: 150, y: -38 },
            { x: 2, y: 24 },
            { x: 150, y: 24 },
        ].map((at) => ({ plan: { x: at.x, y: at.y, w: 10, d: 10, r: 1 }, z: -5, h: 5 }));
        const pinBoxes = PINS.flatMap((key) => {
            const well = WELLS.find((item) => item.key === key);
            if (!well) return [];
            return [
                {
                    plan: {
                        x: well.plan.x + well.plan.w / 2 - 3,
                        y: well.plan.y + well.plan.d / 2 - 3,
                        w: 6,
                        d: 6,
                        r: 0,
                    },
                    z: well.z + well.h,
                    h: 6,
                },
            ];
        });
        const projection = fit(
            corners([
                ...feet,
                ...wells.map((w) => ({ plan: w.plan, z: w.z, h: w.h })),
                ...pinBoxes,
                { plan: { x: -40, y: -8, w: 12, d: 12, r: 1 }, z: 18, h: 6 },
            ]),
            720,
            460
        );
        const pins = PINS.flatMap((key) => {
            const well = WELLS.find((item) => item.key === key);
            if (!well) return [];
            return [
                {
                    key,
                    paths: cylinder(
                        well.plan.x + well.plan.w / 2,
                        well.plan.y + well.plan.d / 2,
                        2.4,
                        well.z + well.h,
                        6,
                        projection,
                        12,
                        0.3
                    ),
                },
            ];
        });
        return {
            projection,
            feet,
            screws: feet.map((foot) =>
                cylinder(foot.plan.x + 5, foot.plan.y + 5, 1.4, 6, 2.2, projection, 10, 0.3)
            ),
            parts: wells.map((w) => ({
                key: w.key,
                paths: block(w.plan, w.z, w.h, projection),
            })),
            pins,
            body: block(PACKET, 0, 8, projection),
        };
    }, [wells]);
    return (
        <div className="iso" data-theme="light">
            <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 720 460" aria-hidden="true">
                {scene.feet.map((foot) => (
                    <Metal
                        key={`${foot.plan.x}-${foot.plan.y}`}
                        paths={block(foot.plan, foot.z, foot.h, scene.projection)}
                    />
                ))}
                {scene.screws.map((paths, i) => (
                    <Metal key={`screw-${scene.feet[i].plan.x}`} paths={paths} />
                ))}
                {scene.parts.map((part) => (
                    <g key={part.key}>
                        <Metal paths={part.paths} part={part.key} lit={on.has(part.key)} />
                    </g>
                ))}
                {scene.pins.map((pin) => (
                    <Metal key={pin.key} paths={pin.paths} lit={on.has(pin.key)} />
                ))}
                <text x={24} y={28} className="iso-label">
                    {label(p)}
                </text>
                {fate ? (
                    <text x={360} y={444} textAnchor="middle" className="iso-label">
                        {fate}
                    </text>
                ) : null}
                {d ? <Moving p={p} d={d} t={t} projection={scene.projection} body={scene.body} /> : null}
            </svg>
        </div>
    );
}

/** "The web server's answer" → "the web server's answer"; acronyms ("ICMP …") stay as they are. */
const lowerFirst = (s: string): string => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

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
    replied,
}: {
    step: Step | undefined;
    n: number;
    of: number;
    replied: boolean;
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
            {replied ? ' Then the reply reaches the sender.' : null}
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

export default function DemuxLab({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig2-h' : 'fig-demux-learn';
    const [p, setP] = useState<Packet>(DEFAULT);
    const [guess, setGuess] = useState<Outcome | null>(null);
    /** The last run, or null until the learner runs. Cleared when the packet or the prediction changes. */
    const [run, setRun] = useState<{ p: Packet; d: Delivery; guess: Outcome | null } | null>(() =>
        pane === 'learn' ? { p: DEFAULT, d: demux(DEFAULT), guess: null } : null
    );
    const [announce, setAnnounce] = useState('');
    const stage = useRef<HTMLDivElement>(null);
    const steps = run?.d.steps ?? [];
    // One mark per stage (the moment the tag arrives there), and one for the reply reaching the sender, if any.
    const hasReply = run ? REPLY[run.d.outcome] !== undefined : false;
    const marks = useMemo(() => marksOf(steps.length, hasReply), [steps.length, hasReply]);
    const figure = useRef<HTMLElement>(null);
    const clock = useClock({ marks, end: marks.at(-1) ?? 1, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
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
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'Where one packet lands' : 'Fig. 2 · Which program gets this packet?'}
                </span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
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
                ) : null}
                <div>
                    <div ref={stage}>
                        <Drawing p={p} d={run?.d ?? null} stage={current?.stage} t={clock.t} />
                        {done ? (
                            <p className="m-0 mt-2" data-result>
                                <strong>{OUTCOME_LABEL[done.d.outcome]}.</strong> {verdict} Sender gets back:{' '}
                                {lowerFirst(done.d.reply)}.
                            </p>
                        ) : null}
                        {run ? (
                            <>
                                <CurrentStep step={current} n={at + 1} of={steps.length} replied={replied} />
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
                    {done ? <StepList steps={steps} current={currentIndex} goTo={goTo} /> : null}
                    <p className="sr-only" aria-live="polite">
                        {done
                            ? `${label(done.p)}: ${OUTCOME_LABEL[done.d.outcome]}. ${verdict} Sender gets back: ${lowerFirst(done.d.reply)}.`
                            : ''}
                    </p>
                    <p className="sr-only" aria-live="polite">
                        {announce}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                The body is the packet. It rests in the well the current stage reads, and that well is drawn
                heavy. The line under the drawing names the stage. A second body travelling back is the reply.
                Assumes this server runs exactly these programs and has one address, with no NAT, proxy or
                load balancer in between; source ports 50001 and 50002 each already have a TCP connection open
                to port 443. A firewall applies whatever rule it is given, so a reply proves little and
                silence proves nothing. The glide between stages is pacing, not a round trip: this model has
                no milliseconds. Lookup stops on the socket table; the result stops on the pin that matched.
            </figcaption>
        </figure>
    );
}
