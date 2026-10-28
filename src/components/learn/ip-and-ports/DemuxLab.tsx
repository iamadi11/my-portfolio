'use client';

import React, { useId, useRef, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
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
 * about the outcome is on the page until Run, and any change clears it, so the prediction is a real one. Nothing
 * animates; the element the current stage reads is drawn heavy, and the current step sits right under the drawing.
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

function Drawing({
    p,
    d,
    stage,
}: {
    p: Packet;
    d: Delivery | null;
    stage: Stage | undefined;
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
                    <text x={164} y={110} textAnchor="middle" className="dts">
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
            <text x={101} y={312} textAnchor="middle" className="dts">
                8125, 9000: nobody
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
            <text x={253} y={300} textAnchor="middle" className="dts">
                443, 9000
            </text>
            <text x={253} y={316} textAnchor="middle" className="sl">
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
        </svg>
    );
}

export default function DemuxLab(): React.JSX.Element {
    const [p, setP] = useState<Packet>(DEFAULT);
    const [guess, setGuess] = useState<Outcome | null>(null);
    /** The last run, or null until the learner runs. Cleared when the packet or the prediction changes. */
    const [run, setRun] = useState<{ p: Packet; d: Delivery; guess: Outcome | null } | null>(null);
    const [at, setAt] = useState(0);
    const [announce, setAnnounce] = useState('');
    const stage = useRef<HTMLDivElement>(null);
    const clear = (): void => {
        setRun(null);
        setAnnounce('');
    };
    const set = (patch: Partial<Packet>): void => {
        setP((x) => ({ ...x, ...patch }));
        clear();
    };
    const go = (): void => {
        setRun({ p, d: demux(p), guess });
        setAt(0);
        setAnnounce('');
        revealAfterRender(() => stage.current);
    };
    const steps = run?.d.steps ?? [];
    const goTo = (i: number): void => {
        const n = Math.min(steps.length - 1, Math.max(0, i));
        setAt(n);
        setAnnounce(`Step ${n + 1} of ${steps.length}, ${STAGE_LABEL[steps[n].stage]}. ${steps[n].text}`);
    };
    const verdict = run
        ? run.guess === null
            ? 'You ran it without a prediction.'
            : run.guess === run.d.outcome
              ? `You predicted “${OUTCOME_LABEL[run.guess]}”: right.`
              : `You predicted “${OUTCOME_LABEL[run.guess]}”: not quite.`
        : '';
    const current = steps[at];
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
                        <Drawing p={p} d={run?.d ?? null} stage={current?.stage} />
                        {run && current ? (
                            <>
                                <p className="m-0 mt-2" data-current-step>
                                    <strong>
                                        Step {at + 1} of {steps.length}, {STAGE_LABEL[current.stage]}.
                                    </strong>{' '}
                                    {current.text} <span className="ln-step-why">({current.source})</span>
                                </p>
                                <div className="ln-nav">
                                    <button
                                        type="button"
                                        className="ln-btn"
                                        aria-disabled={at === 0}
                                        onClick={() => goTo(at - 1)}
                                    >
                                        Previous step
                                    </button>
                                    <button
                                        type="button"
                                        className="ln-btn"
                                        aria-disabled={at === steps.length - 1}
                                        onClick={() => goTo(at + 1)}
                                    >
                                        Next step
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="ln-frame">Build a packet, predict, then press Run.</p>
                        )}
                    </div>
                    {run ? (
                        <>
                            <p className="m-0 mt-2" data-result>
                                <strong>{OUTCOME_LABEL[run.d.outcome]}.</strong> {verdict} Sender gets back:{' '}
                                {run.d.reply}.
                            </p>
                            <ol className="ln-steps" aria-label="All the host's stages for this packet">
                                {steps.map((s, i) => (
                                    <li key={s.stage}>
                                        <button
                                            type="button"
                                            className="ln-step"
                                            aria-current={i === at ? 'step' : undefined}
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
                        </>
                    ) : null}
                    <p className="sr-only" aria-live="polite">
                        {run
                            ? `${label(run.p)}: ${OUTCOME_LABEL[run.d.outcome]}. ${verdict} Sender gets back: ${run.d.reply}.`
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
