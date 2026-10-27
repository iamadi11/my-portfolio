'use client';

import React, { useId, useMemo, useState } from 'react';

import {
    DEFAULTS,
    formatShare,
    RANGES,
    summarize,
    type Inputs,
    type Step,
    type StepId,
    type VisitType,
} from '@/lib/learn/web-request-model';

/**
 * Fig. 1 of the web-request chapter: the page load as six frames, with the time to the HTML's first byte computed by
 * the teaching model (`@/lib/learn/web-request-model`). Every number shown comes from `summarize()`. All six steps
 * are always listed (the reduced-motion form is the same list); nothing animates except, when motion is allowed, the
 * bar widths.
 */

type Frame = { id: 'url' | StepId | 'render'; title: string; who: 'none' | 'dns' | 'server'; text: string };

const FRAMES: Frame[] = [
    {
        id: 'url',
        title: 'Read the URL',
        who: 'none',
        text: 'The browser splits https://example.com/ into the scheme (use HTTPS), the hostname and the path. No network yet.',
    },
    {
        id: 'dns',
        title: 'Look up the hostname',
        who: 'dns',
        text: 'The browser asks a DNS name server for the IP address of example.com and waits for the answer.',
    },
    {
        id: 'tcp',
        title: 'Open a connection (TCP)',
        who: 'server',
        text: 'SYN goes out, SYN-ACK comes back, then ACK: one round trip before the request can be sent.',
    },
    {
        id: 'tls',
        title: 'Secure it (TLS 1.3)',
        who: 'server',
        text: 'ClientHello goes out; the server answers with its key-exchange parameters, certificate and Finished; one round trip. Each side works out the same keys from the exchanged parameters.',
    },
    {
        id: 'request',
        title: 'Request and first byte',
        who: 'server',
        text: 'GET / goes out; the server works out its answer, then the first byte of the HTML comes back.',
    },
    {
        id: 'render',
        title: 'Parse and render',
        who: 'none',
        text: 'The browser parses the HTML, asks for the files it names, lays out and paints. Not timed here: it starts after the first byte.',
    },
];

const VISITS: { v: VisitType; label: string }[] = [
    { v: 'first', label: 'First visit' },
    { v: 'warm', label: 'Repeat visit, connection still open' },
    { v: 'cached', label: 'Fresh cached copy' },
];

const STEP_NAME: Record<StepId, string> = { dns: 'DNS', tcp: 'TCP', tls: 'TLS', request: 'Request' };

/** The prediction: which parts are a message travelling, and which is the server working (from the model's split). */
const PREDICT: { key: string; label: string; travel: boolean }[] = [
    { key: 'dns', label: 'DNS lookup', travel: true },
    { key: 'tcp', label: 'TCP handshake', travel: true },
    { key: 'tls', label: 'TLS handshake', travel: true },
    { key: 'rt', label: "The request's round trip", travel: true },
    { key: 'srv', label: 'Server processing', travel: false },
];

function stepFor(steps: Step[], id: Frame['id']): Step | undefined {
    return steps.find((s) => s.id === id);
}

function stepMs(s: Step | undefined): string {
    if (!s) return '—';
    return `${s.networkMs + s.serverMs} ms`;
}

function Range({
    label,
    name,
    value,
    onChange,
}: {
    label: string;
    name: keyof typeof RANGES;
    value: number;
    onChange: (v: number) => void;
}): React.JSX.Element {
    const id = useId();
    const r = RANGES[name];
    return (
        <div className="ln-range">
            <label htmlFor={id}>{label}</label>
            {/* Shown, not announced: the slider itself says the value with its unit (aria-valuetext). */}
            <span className="ln-range-v" aria-hidden="true">
                {value} ms
            </span>
            <input
                id={id}
                type="range"
                min={r.min}
                max={r.max}
                step={r.step}
                value={value}
                aria-valuetext={`${value} milliseconds`}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
}

/** The drawing: browser, DNS name server and web server; the active frame's exchange is drawn heavy. */
function Drawing({ frame, step }: { frame: Frame; step: Step | undefined }): React.JSX.Element {
    const mid = useId().replace(/:/g, '');
    const skipped = Boolean(step?.skipped);
    const line = (on: boolean): string =>
        ['thin', on && 'ln-active', on && skipped && 'ln-skip'].filter(Boolean).join(' ');
    const dnsOn = frame.who === 'dns';
    const srvOn = frame.who === 'server';
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 420 236" aria-hidden="true">
            <defs>
                <marker
                    id={mid}
                    viewBox="0 0 10 10"
                    refX={10}
                    refY={5}
                    markerWidth={7}
                    markerHeight={7}
                    orient="auto"
                >
                    <path d="M0,1.7 L10,5 L0,8.3 z" className="arrow" />
                </marker>
            </defs>
            <rect
                x={4}
                y={82}
                width={128}
                height={70}
                rx={8}
                className={['obj', frame.who === 'none' ? 'ln-node-on' : ''].join(' ')}
            />
            <text x={68} y={114} textAnchor="middle" className="vt">
                Browser
            </text>
            <text x={68} y={134} textAnchor="middle" className="sl">
                you
            </text>
            <rect
                x={276}
                y={4}
                width={140}
                height={62}
                rx={8}
                className={['obj', dnsOn ? 'ln-node-on' : ''].join(' ')}
            />
            <text x={346} y={32} textAnchor="middle" className="vt">
                DNS
            </text>
            <text x={346} y={52} textAnchor="middle" className="sl">
                name server
            </text>
            <rect
                x={276}
                y={164}
                width={140}
                height={62}
                rx={8}
                className={['obj', srvOn ? 'ln-node-on' : ''].join(' ')}
            />
            <text x={346} y={192} textAnchor="middle" className="vt">
                Web server
            </text>
            <text x={346} y={212} textAnchor="middle" className="sl">
                example.com
            </text>
            {/* Browser ↔ DNS: there and back. */}
            <line x1={134} y1={98} x2={272} y2={28} className={line(dnsOn)} markerEnd={`url(#${mid})`} />
            <line x1={272} y1={48} x2={136} y2={114} className={line(dnsOn)} markerEnd={`url(#${mid})`} />
            {/* Browser ↔ web server: the connection. */}
            <line x1={134} y1={124} x2={272} y2={186} className={line(srvOn)} markerEnd={`url(#${mid})`} />
            <line x1={272} y1={206} x2={136} y2={140} className={line(srvOn)} markerEnd={`url(#${mid})`} />
            {step?.skipped ? (
                <text x={4} y={232} className="dts">
                    skipped: {step.skipped}
                </text>
            ) : null}
        </svg>
    );
}

export default function JourneyStepper(): React.JSX.Element {
    const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
    const [at, setAt] = useState(0);
    /** What the step announcer says; set only when the learner moves between steps, never on input changes. */
    const [announce, setAnnounce] = useState('');
    const [picked, setPicked] = useState<Record<string, boolean>>({});
    const [checked, setChecked] = useState(false);
    /** Travel/work labels and the network/server split appear once the learner has committed (or skipped). */
    const [revealed, setRevealed] = useState(false);
    const s = useMemo(() => summarize(inputs), [inputs]);
    const frame = FRAMES[at];
    const step = stepFor(s.steps, frame.id);
    const max = Math.max(1, s.totalMs);
    const set = (patch: Partial<Inputs>): void => {
        setInputs((p) => ({ ...p, ...patch }));
        // The step announcer only ever holds the text of a step the learner just moved to; after an input change
        // it is emptied so it can never contradict the visible step text.
        setAnnounce('');
    };

    const frameText = (i: number): string => {
        const f = FRAMES[i];
        const st = stepFor(s.steps, f.id);
        if (st?.skipped)
            return `Skipped on this visit (${st.skipped}). On a first visit, this step goes: ${f.text}`;
        if (revealed && f.id === 'request' && st)
            return `${f.text} Here: ${st.networkMs} ms travelling plus ${st.serverMs} ms of server work.`;
        return f.text;
    };
    const goTo = (i: number): void => {
        const n = Math.min(FRAMES.length - 1, Math.max(0, i));
        setAt(n);
        setAnnounce(`Step ${n + 1}. ${FRAMES[n].title}. ${frameText(n)}`);
    };

    // Same names and numbers as the visible ladder: one "Request" row until the split is revealed.
    const summaryText =
        `${VISITS.find((x) => x.v === inputs.visit)?.label}: ` +
        s.steps
            .map((x) =>
                x.id === 'request' && revealed
                    ? `Request (travel) ${x.networkMs} ms, Server (work) ${x.serverMs} ms`
                    : `${STEP_NAME[x.id]} ${x.networkMs + x.serverMs} ms`
            )
            .join(', ') +
        (inputs.visit === 'cached' ? '; no request is sent' : `; time to first byte ${s.totalMs} ms`) +
        (revealed ? `, ${formatShare(s.networkShare)}${s.networkShare === null ? '' : ' network'}.` : '.');

    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig1-h">
            <div className="ln-fig-head">
                <span id="fig1-h">Fig. 1 · Where the time goes before the first byte</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div>
                    <fieldset className="ln-predict">
                        <legend>Recall first</legend>
                        <p className="m-0 mb-2">
                            You have just read how a first visit adds up. Before using the controls, recall
                            it: tick every part that is a message travelling there and back, and leave
                            unticked anything that is not. (This model has no bandwidth control.)
                        </p>
                        {PREDICT.map((p) => (
                            <label key={p.key} className="ln-check">
                                <input
                                    type="checkbox"
                                    checked={Boolean(picked[p.key])}
                                    onChange={(e) => {
                                        setPicked((x) => ({ ...x, [p.key]: e.target.checked }));
                                        setChecked(false);
                                    }}
                                />
                                {p.label}
                            </label>
                        ))}
                        <div className="ln-nav">
                            <button
                                type="button"
                                className="ln-btn"
                                onClick={() => {
                                    setChecked(true);
                                    setRevealed(true);
                                }}
                            >
                                Check
                            </button>
                            {/* Stays in place once used (aria-disabled), so keyboard focus is never dropped. */}
                            <button
                                type="button"
                                className="ln-btn"
                                aria-disabled={revealed}
                                onClick={() => setRevealed(true)}
                            >
                                Skip, show the labels
                            </button>
                        </div>
                        <p role="status" className="mt-2">
                            {checked
                                ? PREDICT.every((p) => Boolean(picked[p.key]) === p.travel)
                                    ? 'Right. DNS, TCP, TLS and the request’s round trip are all travel time; only the server processing is work. None of these bars contains bytes ÷ bandwidth time: the model leaves transmission out (taught in “Latency and throughput”).'
                                    : `Not quite. Travel: ${PREDICT.filter((p) => p.travel)
                                          .map((p) => p.label)
                                          .join(
                                              ', '
                                          )}. Work: server processing. None of these is bytes ÷ bandwidth time; the model leaves transmission out.`
                                : null}
                        </p>
                    </fieldset>

                    <div className="ln-controls">
                        <fieldset>
                            <legend>Visit</legend>
                            <div className="ln-seg">
                                {VISITS.map((x) => (
                                    <label key={x.v}>
                                        <input
                                            type="radio"
                                            name="visit"
                                            value={x.v}
                                            checked={inputs.visit === x.v}
                                            onChange={() => set({ visit: x.v })}
                                        />
                                        {x.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Assumed values</legend>
                            <Range
                                label="Round-trip time"
                                name="rttMs"
                                value={inputs.rttMs}
                                onChange={(v) => set({ rttMs: v })}
                            />
                            <Range
                                label="DNS lookup time"
                                name="dnsMs"
                                value={inputs.dnsMs}
                                onChange={(v) => set({ dnsMs: v })}
                            />
                            <Range
                                label="Server processing time"
                                name="serverMs"
                                value={inputs.serverMs}
                                onChange={(v) => set({ serverMs: v })}
                            />
                        </fieldset>
                    </div>
                </div>

                <div>
                    <Drawing frame={frame} step={step} />
                    <ol className="ln-steps" aria-label="Steps of the page load">
                        {FRAMES.map((f, i) => {
                            const st = stepFor(s.steps, f.id);
                            return (
                                <li key={f.id}>
                                    <button
                                        type="button"
                                        className="ln-step"
                                        aria-current={i === at ? 'step' : undefined}
                                        data-skipped={st?.skipped ? '' : undefined}
                                        onClick={() => goTo(i)}
                                    >
                                        <span className="ln-step-n">{i + 1}</span>
                                        <span>{f.title}</span>
                                        <span className="ln-step-ms">{st ? stepMs(st) : 'not timed'}</span>
                                        {st?.skipped ? (
                                            <span className="ln-step-why">Skipped: {st.skipped}</span>
                                        ) : null}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="ln-frame">
                        <strong>
                            Step {at + 1}. {frame.title}.
                        </strong>{' '}
                        {frameText(at)}
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
                            aria-disabled={at === FRAMES.length - 1}
                            onClick={() => goTo(at + 1)}
                        >
                            Next step
                        </button>
                    </div>

                    <ul className="ln-ladder" aria-label="Time to first byte, step by step">
                        {s.steps.flatMap((x) => {
                            const bar = (ms: number, kind?: 'server'): React.JSX.Element => (
                                <span className="ln-bar-track" aria-hidden="true">
                                    <span
                                        className="ln-bar-fill"
                                        data-kind={kind}
                                        style={{ transform: `scaleX(${ms / max})` }}
                                    />
                                </span>
                            );
                            if (x.id !== 'request' || !revealed)
                                return [
                                    <li key={x.id}>
                                        <span>{STEP_NAME[x.id]}</span>
                                        {bar(x.networkMs + x.serverMs)}
                                        <span className="ln-num">{x.networkMs + x.serverMs} ms</span>
                                    </li>,
                                ];
                            return [
                                <li key="req">
                                    <span>Request (travel)</span>
                                    {bar(x.networkMs)}
                                    <span className="ln-num">{x.networkMs} ms</span>
                                </li>,
                                <li key="srv">
                                    <span>Server (work)</span>
                                    {bar(x.serverMs, 'server')}
                                    <span className="ln-num">{x.serverMs} ms</span>
                                </li>,
                            ];
                        })}
                    </ul>
                    <p className="ln-readout">
                        {inputs.visit === 'cached' ? (
                            <>Time to first byte: no request is sent (fresh cached copy).</>
                        ) : (
                            <>
                                Time to first byte: <strong>{s.totalMs} ms</strong>.
                            </>
                        )}
                        {revealed ? (
                            <>
                                {' '}
                                Network waiting: <strong>{s.networkMs} ms</strong> (
                                {formatShare(s.networkShare)}). Server work: <strong>{s.serverMs} ms</strong>.
                            </>
                        ) : null}
                    </p>
                    <p className="sr-only" aria-live="polite">
                        {summaryText}
                    </p>
                    {/* Announces step changes only; input changes are announced by the summary above. */}
                    <p className="sr-only" aria-live="polite">
                        {announce}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Assumes TLS 1.3 over TCP (not HTTP/3), no TCP Fast Open, no TLS 0-RTT, no redirects, no packet
                loss, the first byte one round trip after the request, and no transmission time.
                {revealed ? ' Black bars: travel. Hatched bar: server work.' : null}
            </figcaption>
        </figure>
    );
}
