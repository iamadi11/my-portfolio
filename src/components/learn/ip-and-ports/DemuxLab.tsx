'use client';

import React, { useId, useState } from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import Choice from '@/components/learn/kit/Choice';
import {
    demux,
    DESTS,
    label,
    OTHER,
    OUTCOMES,
    PORTS,
    PROTOS,
    SERVER,
    SOURCE_PORT,
    SOURCES,
    UNUSED,
    type Delivery,
    type Dest,
    type Outcome,
    type Packet,
    type Source,
    type Stage,
    type Unused,
} from '@/lib/learn/demux-model';

/**
 * Fig. 2 of the ip-and-ports chapter (asset A2): build a packet, predict where it goes, run, then step through the
 * host's four stages (address, protocol, lookup, result). Every outcome comes from `demux()`. Nothing about the
 * outcome is on the page until Run, and any change to the packet clears it, so the prediction is a real one.
 * Nothing animates; the element the current stage looks at is drawn heavy.
 */

const SOURCE_LABEL: Record<Source, string> = {
    tab1: `Tab 1 (port ${SOURCE_PORT.tab1})`,
    tab2: `Tab 2 (port ${SOURCE_PORT.tab2})`,
    newTab: `New tab (port ${SOURCE_PORT.newTab})`,
};
const DEST_LABEL: Record<Dest, string> = {
    server: `${SERVER} (this server)`,
    other: `${OTHER} (another machine)`,
};
const UNUSED_LABEL: Record<Unused, string> = {
    rfc: 'Answers as the RFCs ask',
    firewall: 'A firewall drops them',
};
const OUTCOME_LABEL: Record<Outcome, string> = {
    'connection A': 'Web server, connection A',
    'connection B': 'Web server, connection B',
    'new connection': 'Web server, as a new connection',
    'metrics collector': 'Metrics collector',
    'tcp reset': 'Nobody: a TCP reset comes back',
    'icmp unreachable': 'Nobody: ICMP Port Unreachable comes back',
    'dropped silently': 'Nobody, and nothing comes back',
    'another machine': 'Never reaches this server',
};
const STAGE_LABEL: Record<Stage, string> = {
    address: 'Address',
    protocol: 'Protocol',
    lookup: 'Lookup',
    result: 'Result',
};

const DEFAULT: Packet = { proto: 'TCP', source: 'tab1', dest: 'server', port: 443, unused: 'rfc' };

/** The drawing element that decides the packet's fate. */
const TARGET: Record<Outcome, string> = {
    'connection A': 'conn-A',
    'connection B': 'conn-B',
    'new connection': 'listen-443',
    'metrics collector': 'udp-8125',
    'tcp reset': 'tcp-none',
    'icmp unreachable': 'udp-none',
    'dropped silently': '',
    'another machine': 'other',
};

/** The mark under the server when nobody receives the packet. */
const FATE: Partial<Record<Outcome, string>> = {
    'tcp reset': '× nobody: a reset (RST) goes back',
    'icmp unreachable': '× nobody: ICMP Port Unreachable goes back',
    'dropped silently': '× dropped: nothing goes back',
};

/** What the drawing highlights at a stage: the parts that stage reads. */
function focus(p: Packet, d: Delivery, stage: Stage | undefined): Set<string> {
    const target = d.outcome === 'dropped silently' ? `${p.proto.toLowerCase()}-none` : TARGET[d.outcome];
    if (stage === 'address') return new Set([p.dest === 'server' ? 'addr' : 'other']);
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
    const fate = d && stage === 'result' && d.receiver === null && d.outcome !== 'another machine';
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 404" aria-hidden="true">
            <defs>
                <Arrowhead id={marker} />
            </defs>
            {/* The packet: its five fields. */}
            <rect x={6} y={4} width={328} height={44} rx={4} className="nb" />
            <text x={16} y={22} className="sl">
                packet
            </text>
            <text x={16} y={40} className="dts">
                {label(p)}
            </text>
            <line x1={170} y1={48} x2={170} y2={66} className="thin" markerEnd={`url(#${marker})`} />
            {/* This server. */}
            <rect x={6} y={70} width={328} height={262} rx={6} className="obj" />
            <rect x={110} y={58} width={120} height={24} rx={3} className={box('addr', 'nb')} />
            <text x={170} y={75} textAnchor="middle" className="dts">
                {SERVER}
            </text>
            <rect x={16} y={92} width={176} height={230} rx={4} className={box('lane-TCP', 'well')} />
            <text x={104} y={112} textAnchor="middle" className="vt">
                TCP
            </text>
            <text x={26} y={134} className="sl">
                open connections
            </text>
            <rect x={24} y={140} width={160} height={70} rx={3} className={box('table', 'thin')} />
            <rect x={32} y={148} width={144} height={24} rx={3} className={box('conn-A')} />
            <text x={40} y={165} className="dts">
                A · from :{SOURCE_PORT.tab1}
            </text>
            <rect x={32} y={178} width={144} height={24} rx={3} className={box('conn-B')} />
            <text x={40} y={195} className="dts">
                B · from :{SOURCE_PORT.tab2}
            </text>
            <text x={26} y={230} className="sl">
                listening
            </text>
            <rect x={24} y={236} width={160} height={28} rx={3} className={box('listen-443')} />
            <text x={34} y={255} className="dts">
                443 · web server
            </text>
            <rect x={24} y={272} width={160} height={42} rx={3} className={box('tcp-none', 'slot')} />
            <text x={104} y={290} textAnchor="middle" className="dts">
                8125, 9000
            </text>
            <text x={104} y={306} textAnchor="middle" className="sl">
                nobody
            </text>
            <rect x={202} y={92} width={122} height={230} rx={4} className={box('lane-UDP', 'well')} />
            <text x={263} y={112} textAnchor="middle" className="vt">
                UDP
            </text>
            <rect x={210} y={140} width={106} height={62} rx={3} className={box('udp-8125')} />
            <text x={220} y={158} className="dts">
                8125
            </text>
            <text x={220} y={176} className="sl">
                metrics
            </text>
            <text x={220} y={194} className="sl">
                collector
            </text>
            <rect x={210} y={272} width={106} height={42} rx={3} className={box('udp-none', 'slot')} />
            <text x={263} y={290} textAnchor="middle" className="dts">
                443, 9000
            </text>
            <text x={263} y={306} textAnchor="middle" className="sl">
                nobody
            </text>
            {fate ? (
                <text x={170} y={352} textAnchor="middle" className="dts">
                    {FATE[d.outcome]}
                </text>
            ) : null}
            {/* Another machine. */}
            <rect x={6} y={364} width={328} height={34} rx={4} className={box('other')} />
            <text x={170} y={386} textAnchor="middle" className="dts">
                another machine · {OTHER}
            </text>
        </svg>
    );
}

export default function DemuxLab(): React.JSX.Element {
    const [p, setP] = useState<Packet>(DEFAULT);
    const [guess, setGuess] = useState<Outcome | null>(null);
    /** The last run, or null until the learner runs. Cleared when the packet changes. */
    const [run, setRun] = useState<{ p: Packet; d: Delivery; guess: Outcome | null } | null>(null);
    const [at, setAt] = useState(0);
    const [announce, setAnnounce] = useState('');
    const set = (patch: Partial<Packet>): void => {
        setP((x) => ({ ...x, ...patch }));
        setRun(null);
        setAnnounce('');
    };
    const go = (): void => {
        setRun({ p, d: demux(p), guess });
        setAt(0);
        setAnnounce('');
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
    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig2-h">
            <div className="ln-fig-head">
                <span id="fig2-h">Fig. 2 · Which program gets this packet?</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div className="ln-controls">
                    <Choice
                        legend="From (browser on 198.51.100.7)"
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
                        legend="Packets for unused ports"
                        options={UNUSED}
                        label={(x) => UNUSED_LABEL[x]}
                        value={p.unused}
                        onChange={(x) => set({ unused: x })}
                    />
                    <div className="ln-predict">
                        <Choice
                            legend="Predict first: where does it go?"
                            options={OUTCOMES}
                            label={(o) => OUTCOME_LABEL[o]}
                            value={guess}
                            onChange={(o) => {
                                setGuess(o);
                                setRun(null);
                                setAnnounce('');
                            }}
                        />
                    </div>
                    <button type="button" className="ln-btn" onClick={go}>
                        Run
                    </button>
                </div>
                <div>
                    <Drawing p={p} d={run?.d ?? null} stage={steps[at]?.stage} />
                    {run ? (
                        <>
                            <p className="m-0 mt-2">
                                <strong>{OUTCOME_LABEL[run.d.outcome]}.</strong> {verdict} Sender gets back:{' '}
                                {run.d.reply}.
                            </p>
                            <ol className="ln-steps" aria-label="The host's stages for this packet">
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
                                                <strong>{STAGE_LABEL[s.stage]}.</strong> {s.text}{' '}
                                                <span className="ln-step-why">({s.source})</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
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
                Assumes this server runs exactly these programs and has one address; no NAT, proxy or load
                balancer in between; tab 1 and tab 2 already have open connections, a new tab is opening one.
                Whether an unused port answers depends on the host: the RFCs ask for a reply, many firewalls
                drop silently, so silence proves nothing.
            </figcaption>
        </figure>
    );
}
