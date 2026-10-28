'use client';

import React, { useId, useMemo, useState } from 'react';

import {
    DEFAULTS,
    formatShare,
    predictAt,
    PREDICT_RTT_MS,
    RANGES,
    summarize,
    type Inputs,
    type Step,
    type StepId,
    type VisitType,
} from '@/lib/learn/web-request-model';

import TimeRail from './TimeRail';

/**
 * Fig. 1 of the web-request chapter. The rail's segment widths and the marker's position are the
 * teaching model's milliseconds (`summarize`). Every number shown comes from that model.
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
    { key: 'rt', label: 'Request round trip', travel: true },
    { key: 'srv', label: 'Server processing', travel: false },
];

function stepFor(steps: Step[], id: Frame['id']): Step | undefined {
    return steps.find((s) => s.id === id);
}

function stepMs(s: Step | undefined): string {
    if (!s) return '—';
    return `${s.networkMs + s.serverMs} ms`;
}

/** "a", "a and b", "a, b and c"; labels after the first read mid-sentence (lower-cased unless an acronym: TLS, TCP). */
function listOf(labels: string[]): string {
    const xs = labels.map((x, i) =>
        i === 0 || /^[A-Z]{2}/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1)
    );
    return xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : (xs[0] ?? '');
}

/** "Not quite" feedback that names exactly which ticks were wrong. */
function predictFeedback(picked: Record<string, boolean>): string {
    const missed = PREDICT.filter((p) => p.travel && !picked[p.key]).map((p) => p.label);
    const extra = PREDICT.filter((p) => !p.travel && picked[p.key]).map((p) => p.label.toLowerCase());
    if (missed.length === 0 && extra.length === 0)
        return 'Right. DNS, TCP, TLS and the request’s round trip are all travel time; only the server processing is work. None of these bars contains bytes ÷ bandwidth time: the model leaves transmission out (taught in “Latency and throughput”).';
    const parts = [
        missed.length
            ? `${listOf(missed)} ${missed.length > 1 ? 'are' : 'is'} travel too, so tick ${missed.length > 1 ? 'them' : 'it'}`
            : '',
        extra.length ? `${extra.join(', ')} is the server working, not travel, so leave it unticked` : '',
    ].filter(Boolean);
    return `Not quite. ${parts.join('; ')}. None of these is bytes ÷ bandwidth time; the model leaves transmission out.`;
}

/** A snapshot, so the result keeps naming the values it was computed from even if the sliders move later. */
type Run = { guess: number; totalMs: number; rttMs: number; serverMs: number };

/** Predict, then run: the learner commits to a number for the repeat visit before the model shows its own. */
function PredictRun({
    inputs,
    revealed,
    onRun,
}: {
    inputs: Inputs;
    revealed: boolean;
    onRun: (patch: Partial<Inputs>) => void;
}): React.JSX.Element {
    const id = useId();
    const [guess, setGuess] = useState('');
    const [run, setRun] = useState<Run | null>(null);
    const [msg, setMsg] = useState('');
    const go = (): void => {
        // Checked before rounding (so -0.4 is refused), then whole milliseconds like every other number in the figure.
        const n = Number(guess);
        if (guess.trim() === '' || !Number.isFinite(n) || n < 0) {
            setRun(null);
            setMsg('Type your guess in milliseconds first.');
            return;
        }
        const g = Math.round(n);
        const r = predictAt(inputs);
        setRun({ guess: g, totalMs: r.totalMs, rttMs: PREDICT_RTT_MS, serverMs: r.serverMs });
        setMsg('');
        onRun({ visit: 'warm', rttMs: PREDICT_RTT_MS });
    };
    let result = msg;
    if (run) {
        const off = Math.abs(run.guess - run.totalMs);
        result =
            `You guessed ${run.guess} ms. With a round trip of ${run.rttMs} ms and ${run.serverMs} ms server time, the model gives ${run.totalMs} ms` +
            (revealed ? `: one round trip plus the server's work` : '') +
            `; DNS, TCP and TLS are skipped. ${off === 0 ? 'Exactly right.' : `Off by ${off} ms.`}`;
    }
    return (
        <fieldset className="ln-predict">
            <legend>Predict, then run</legend>
            <p className="m-0 mb-2">
                Suppose the round trip were {PREDICT_RTT_MS} ms, with the server time set above. How long
                would a repeat visit on a still-open connection take to its first byte? Commit to a number,
                then run it: the figure switches to that visit and round trip.
            </p>
            <form
                className="ln-guess"
                // The guess is checked and rounded in go(); native validation would block 94.6 against step 1.
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    go();
                }}
            >
                <label htmlFor={id}>Your guess (ms)</label>
                <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={guess}
                    onChange={(e) => {
                        setGuess(e.target.value);
                        setRun(null);
                        setMsg('');
                    }}
                />
                <button type="submit" className="ln-btn">
                    Run the repeat visit
                </button>
            </form>
            <p role="status" className="mt-2">
                {result}
            </p>
        </fieldset>
    );
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

export default function JourneyStepper({
    pane = 'lab',
}: {
    /** Learn steps the rail. Lab changes the inputs and asks for a prediction. */
    pane?: 'learn' | 'lab';
}): React.JSX.Element {
    const visitName = useId();
    const figId = `fig-journey-${pane}`;
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
    const max = Math.max(1, s.totalMs);
    const set = (patch: Partial<Inputs>): void => {
        setInputs((p) => ({ ...p, ...patch }));
        // The step announcer only ever holds the text of a step the learner just moved to; after an input change
        // it is emptied so it can never contradict the visible step text.
        setAnnounce('');
    };
    // Revealing changes the current step's text (step 5 gains its split), so the step announcer is emptied too.
    const reveal = (): void => {
        setRevealed(true);
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
        <figure className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>Fig. 1 · Where the time goes before the first byte</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <TimeRail steps={s.steps} frameId={frame.id} revealed={revealed} />
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div>
                        <fieldset className="ln-predict">
                            <legend>Recall first</legend>
                            <p className="m-0 mb-2">
                                You have not used the sliders yet. Tick every part that is a message
                                travelling there and back, and leave unticked anything that is not. (This
                                model has no bandwidth control.)
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
                                        reveal();
                                    }}
                                >
                                    Check
                                </button>
                                {/* Stays in place once used (aria-disabled), so keyboard focus is never dropped. */}
                                <button
                                    type="button"
                                    className="ln-btn"
                                    aria-disabled={revealed}
                                    onClick={reveal}
                                >
                                    Skip, show the labels
                                </button>
                            </div>
                            <p role="status" className="mt-2">
                                {checked ? predictFeedback(picked) : null}
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
                                                name={visitName}
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
                        <PredictRun inputs={inputs} revealed={revealed} onRun={set} />
                    </div>
                ) : null}

                <div>
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
