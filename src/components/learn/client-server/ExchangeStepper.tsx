'use client';

import React, { useId, useState } from 'react';

import {
    exchange,
    FAULTS,
    METHODS,
    NO_RESPONSE,
    predictions,
    REQUEST_LINE,
    type Event,
    type Fault,
    type Inputs,
    type Method,
    type Result,
} from '@/lib/learn/client-server-model';

/**
 * Fig. 1 of the client-server chapter: one request-response exchange, a choice of what goes wrong, and an optional
 * retry, stepped through on a two-lane drawing. Every outcome comes from `exchange()`. Nothing about an outcome is on
 * the page until the learner presses Run or checks the predictions, so the prediction is a real one. Nothing
 * animates; the current step is drawn heavy.
 */

const METHOD_LABEL: Record<Method, string> = {
    GET: 'GET (read order 42)',
    PUT: 'PUT (set quantity 2)',
    POST: 'POST (place an order)',
    POST_KEY: 'POST with an idempotency key',
};

const FAULT_LABEL: Record<Fault, string> = {
    none: 'Nothing goes wrong',
    requestLost: 'Request lost',
    responseLost: 'Response lost',
    responseLate: 'Response late',
};

const PREDICTIONS = predictions();

/** Why each answer is right, shown only after Check or Skip. */
const WHY: Record<string, string> = {
    A: 'The server placed the order the first time; only its response was lost. A plain POST carries nothing that marks the copy as a repeat, so the server places a second order.',
    B: 'The server has already finished a request with this key, so it answers consistently with the original (in this model it resends the stored result) and creates nothing.',
    C: 'A server that honours keys refuses a copy while the original with the same key is still being processed, with 409 Conflict. The client waits and asks again.',
};

/** Why a particular wrong choice is wrong, so feedback answers the learner's own reasoning. */
const WRONG: Record<string, Record<string, string>> = {
    A: {
        '0': 'Zero would mean the first request never took effect, but only its response was lost: the order was placed.',
        '1': 'One would need the server to recognise the copy, and a plain POST carries nothing that marks it as a repeat.',
    },
    B: {
        '0': 'The first request did reach the server and placed an order; the key only stops the copy.',
        '2': 'Two is what happens without a key; the key is what lets the server recognise the copy.',
    },
    C: {
        '201 Created':
            'A replay of the original result comes only once the original has finished; here it is still being processed.',
        'No response':
            'In this model the retry arrives and its answer comes back in time; the question is what that answer is.',
    },
};

const DEFAULT_INPUTS: Inputs = { method: 'GET', fault: 'none', retry: false };

function Prediction({ onRunCase }: { onRunCase: (c: Inputs) => void }): React.JSX.Element {
    const [picked, setPicked] = useState<Record<string, string>>({});
    const [checked, setChecked] = useState(false);
    const [revealed, setRevealed] = useState(false);
    /** Shown when Check is pressed with questions still open: names them and reveals nothing. */
    const [missing, setMissing] = useState('');
    const name = useId();
    const feedback = (id: string, answer: string): string =>
        picked[id] === answer
            ? `${id}: right. ${WHY[id]}`
            : `${id}: not quite, it is ${answer}. ${WRONG[id]?.[picked[id]] ?? ''} ${WHY[id]}`;
    const check = (): void => {
        const open = PREDICTIONS.filter((q) => !picked[q.id]).map((q) => q.id);
        if (open.length) {
            setMissing(
                `Answer ${open.join(' and ')} first, or choose Skip to see the answers without predicting.`
            );
            return;
        }
        setMissing('');
        setChecked(true);
        setRevealed(true);
    };
    return (
        <fieldset className="ln-predict">
            <legend>Predict first</legend>
            <p className="m-0 mb-2">
                Answer before you run anything. A asks you to recall the chapter; B and C ask you to predict.
            </p>
            {PREDICTIONS.map((q) => (
                <fieldset key={q.id} className="ln-pq">
                    <legend>
                        {q.id}. {q.ask}
                    </legend>
                    <div className="ln-seg">
                        {q.choices.map((c) => (
                            <label key={c}>
                                <input
                                    type="radio"
                                    name={`${name}-${q.id}`}
                                    value={c}
                                    checked={picked[q.id] === c}
                                    onChange={() => {
                                        setPicked((x) => ({ ...x, [q.id]: c }));
                                        setChecked(false);
                                        setMissing('');
                                    }}
                                />
                                {c}
                            </label>
                        ))}
                    </div>
                </fieldset>
            ))}
            <div className="ln-nav">
                <button type="button" className="ln-btn" onClick={check}>
                    Check
                </button>
                {/* Stays in place once used (aria-disabled), so keyboard focus is never dropped. */}
                <button
                    type="button"
                    className="ln-btn"
                    aria-disabled={revealed}
                    onClick={() => {
                        setMissing('');
                        setRevealed(true);
                    }}
                >
                    Skip, show the answers
                </button>
            </div>
            <div role="status" className="mt-2">
                {missing && !revealed ? <p className="m-0">{missing}</p> : null}
                {revealed ? (
                    <ul className="ln-pfeed">
                        {PREDICTIONS.map((q) => (
                            <li key={q.id}>
                                {checked ? feedback(q.id, q.answer) : `${q.id}: ${q.answer}. ${WHY[q.id]}`}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
            {revealed ? (
                <div className="ln-nav">
                    {PREDICTIONS.map((q) => (
                        <button key={q.id} type="button" className="ln-btn" onClick={() => onRunCase(q.case)}>
                            Run case {q.id}
                        </button>
                    ))}
                </div>
            ) : null}
        </fieldset>
    );
}

function Choice<T extends string>({
    legend,
    options,
    labels,
    value,
    onChange,
}: {
    legend: string;
    options: T[];
    labels: Record<T, string>;
    value: T;
    onChange: (v: T) => void;
}): React.JSX.Element {
    const name = useId();
    return (
        <fieldset>
            <legend>{legend}</legend>
            <div className="ln-seg">
                {options.map((o) => (
                    <label key={o}>
                        <input
                            type="radio"
                            name={name}
                            value={o}
                            checked={value === o}
                            onChange={() => onChange(o)}
                        />
                        {labels[o]}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/** One attempt's drawing: request, the server's work, and the response (or its loss), top to bottom. */
function AttemptBlock({
    y,
    label,
    ev,
    reached,
    on,
    marker,
}: {
    y: number;
    label: string;
    ev: Event[];
    reached: boolean;
    /** Is the current event of this kind (in this attempt)? */
    on: (kind: Event['kind']) => boolean;
    marker: string;
}): React.JSX.Element {
    const has = (k: Event['kind']): boolean => ev.some((e) => e.kind === k);
    const line = (k: Event['kind'], extra = ''): string =>
        ['thin', on(k) && 'ln-active', extra].filter(Boolean).join(' ');
    const late = has('response-late');
    return (
        <g>
            <text x={160} y={y} textAnchor="middle" className="sl">
                {label}
            </text>
            {has('request-lost') ? (
                <>
                    <line
                        x1={52}
                        y1={y + 14}
                        x2={160}
                        y2={y + 32}
                        className={line('request-lost', 'ln-skip')}
                    />
                    <text x={166} y={y + 36} className="sl">
                        × lost
                    </text>
                </>
            ) : (
                <line
                    x1={52}
                    y1={y + 14}
                    x2={266}
                    y2={y + 38}
                    className={line('request')}
                    markerEnd={`url(#${marker})`}
                />
            )}
            {reached ? (
                <rect
                    x={258}
                    y={y + 44}
                    width={24}
                    height={20}
                    rx={3}
                    className={['obj', on('server') ? 'ln-node-on' : ''].join(' ')}
                />
            ) : null}
            {has('response') ? (
                <line
                    x1={266}
                    y1={y + 70}
                    x2={54}
                    y2={y + 96}
                    className={line('response')}
                    markerEnd={`url(#${marker})`}
                />
            ) : null}
            {has('response-lost') ? (
                <>
                    <line
                        x1={266}
                        y1={y + 70}
                        x2={160}
                        y2={y + 84}
                        className={line('response-lost', 'ln-skip')}
                    />
                    <text x={154} y={y + 98} textAnchor="end" className="sl">
                        lost ×
                    </text>
                </>
            ) : null}
            {late ? (
                <>
                    <line x1={30} y1={y + 100} x2={70} y2={y + 100} className="thin ln-skip" />
                    <text x={80} y={y + 104} className="sl">
                        gives up
                    </text>
                </>
            ) : null}
            <rect
                x={38}
                y={late ? y + 93 : y + 100}
                width={24}
                height={14}
                rx={3}
                className={['obj', on('client') ? 'ln-node-on' : ''].join(' ')}
            />
        </g>
    );
}

/**
 * Two lanes, one block per attempt, in time order. In the late case the first request's response is drawn last,
 * after the client gave up and after any retry. The arrow or mark of the current event is drawn heavy.
 */
function Diagram({ result, current }: { result: Result; current: Event | undefined }): React.JSX.Element {
    const marker = useId().replace(/:/g, '');
    const BLOCK = 128;
    const late = result.events.some((e) => e.kind === 'response-late');
    const tailY = 44 + result.attempts.length * BLOCK;
    const H = tailY + (late ? 76 : 0);
    const lateOn = current?.attempt === 1 && current.kind === 'response-late';
    const busyOn = current?.attempt === 1 && current.kind === 'server';
    return (
        <svg className="bp-svg ln-svg ln-seq" viewBox={`0 0 320 ${H}`} aria-hidden="true">
            <defs>
                <marker
                    id={marker}
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
            <text x={50} y={18} textAnchor="middle" className="vt">
                Client
            </text>
            <text x={270} y={18} textAnchor="middle" className="vt">
                Server
            </text>
            <line x1={50} y1={28} x2={50} y2={H - 4} className="thin" />
            <line x1={270} y1={28} x2={270} y2={H - 4} className="thin" />
            {result.attempts.map((a, i) => (
                <AttemptBlock
                    key={a.n}
                    y={44 + i * BLOCK}
                    label={a.n === 1 ? 'first attempt' : late ? 'retry, first still busy' : 'retry'}
                    ev={result.events.filter((e) => e.attempt === a.n)}
                    reached={a.reached}
                    on={(k) => current?.attempt === a.n && current.kind === k}
                    marker={marker}
                />
            ))}
            {late ? (
                <>
                    {/* The first request is still being processed from its start until its late reply, across any retry. */}
                    <line
                        x1={276}
                        y1={108}
                        x2={276}
                        y2={tailY + 14}
                        className={['thin', 'ln-skip', busyOn && 'ln-active'].filter(Boolean).join(' ')}
                    />
                    <text x={160} y={tailY} textAnchor="middle" className="sl">
                        first finishes, late
                    </text>
                    <line
                        x1={266}
                        y1={tailY + 14}
                        x2={54}
                        y2={tailY + 44}
                        className={['thin', lateOn && 'ln-active'].filter(Boolean).join(' ')}
                        markerEnd={`url(#${marker})`}
                    />
                    <text x={160} y={tailY + 66} textAnchor="middle" className="sl">
                        nobody is waiting for it
                    </text>
                </>
            ) : null}
        </svg>
    );
}

function summarize(c: Inputs, r: Result): string {
    const saw = r.attempts
        .map((a) => (a.n === 1 ? `first attempt: ${a.clientSaw}` : `retry: ${a.clientSaw}`))
        .join('; ');
    return (
        `${METHOD_LABEL[c.method]}, ${FAULT_LABEL[c.fault].toLowerCase()}, ${c.retry ? 'retry on' : 'no retry'}. ` +
        `Client saw ${saw}. Reached the server ${r.reached} ${r.reached === 1 ? 'time' : 'times'}; ` +
        `new orders ${r.newOrders}; total orders ${r.totalOrders}; order 42 quantity ${r.quantity}.`
    );
}

export default function ExchangeStepper(): React.JSX.Element {
    const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
    /** The last run: its inputs and result, or null until the learner runs a case. Cleared when a choice changes. */
    const [run, setRun] = useState<{ c: Inputs; r: Result } | null>(null);
    const [at, setAt] = useState(0);
    const [announce, setAnnounce] = useState('');
    const set = (patch: Partial<Inputs>): void => {
        setInputs((p) => ({ ...p, ...patch }));
        setRun(null);
        setAnnounce('');
    };
    const go = (c: Inputs): void => {
        setInputs(c);
        setRun({ c, r: exchange(c) });
        setAt(0);
        setAnnounce('');
    };
    const events = run?.r.events ?? [];
    const goTo = (i: number): void => {
        const n = Math.min(events.length - 1, Math.max(0, i));
        setAt(n);
        setAnnounce(`Step ${n + 1} of ${events.length}. ${events[n].text}`);
    };
    return (
        <figure className="bp-sheet ln-fig" aria-labelledby="fig1-h">
            <div className="ln-fig-head">
                <span id="fig1-h">Fig. 1 · One exchange, and what each side knows</span>
                <span>Teaching model, not a benchmark</span>
            </div>
            <div className="ln-fig-grid">
                <div>
                    <Prediction onRunCase={go} />
                    <div className="ln-controls">
                        <Choice
                            legend="Request"
                            options={METHODS}
                            labels={METHOD_LABEL}
                            value={inputs.method}
                            onChange={(m) => set({ method: m })}
                        />
                        <Choice
                            legend="What goes wrong"
                            options={FAULTS}
                            labels={FAULT_LABEL}
                            value={inputs.fault}
                            onChange={(f) => set({ fault: f })}
                        />
                        <fieldset>
                            <legend>If no response comes</legend>
                            <label className="ln-check">
                                <input
                                    type="checkbox"
                                    checked={inputs.retry}
                                    onChange={(e) => set({ retry: e.target.checked })}
                                />
                                Send the same request again, once
                            </label>
                        </fieldset>
                        <button type="button" className="ln-btn" onClick={() => go(inputs)}>
                            Run
                        </button>
                    </div>
                </div>
                <div>
                    <p className="ln-label m-0 mb-2">
                        Before: order 42 exists, quantity 1 (1 order in total). Request sent:{' '}
                        {REQUEST_LINE[inputs.method]}.
                    </p>
                    {run ? (
                        <>
                            <Diagram result={run.r} current={events[at]} />
                            <ol className="ln-steps" aria-label="Events of this run">
                                {events.map((e, i) => (
                                    <li key={`${e.attempt}-${e.kind}`}>
                                        <button
                                            type="button"
                                            className="ln-step"
                                            aria-current={i === at ? 'step' : undefined}
                                            onClick={() => goTo(i)}
                                        >
                                            <span className="ln-step-n">{i + 1}</span>
                                            <span>{e.text}</span>
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
                                    aria-disabled={at === events.length - 1}
                                    onClick={() => goTo(at + 1)}
                                >
                                    Next step
                                </button>
                            </div>
                            <dl className="ln-out">
                                {run.r.attempts.map((a) => (
                                    <div key={a.n}>
                                        <dt>
                                            {a.n === 1 ? 'Client saw (first attempt)' : 'Client saw (retry)'}
                                        </dt>
                                        <dd>
                                            {a.clientSaw === NO_RESPONSE
                                                ? 'No response before its timeout'
                                                : a.clientSaw}
                                        </dd>
                                    </div>
                                ))}
                                <div>
                                    <dt>Reached the server</dt>
                                    <dd>
                                        {run.r.reached} {run.r.reached === 1 ? 'time' : 'times'}
                                    </dd>
                                </div>
                                <div>
                                    <dt>New orders</dt>
                                    <dd>{run.r.newOrders}</dd>
                                </div>
                                <div>
                                    <dt>After: total orders, order 42 quantity</dt>
                                    <dd>
                                        {run.r.totalOrders}, {run.r.quantity}
                                    </dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        <p className="ln-frame">Choose a case and press Run to see what each side sees.</p>
                    )}
                    <p className="sr-only" aria-live="polite">
                        {run ? summarize(run.c, run.r) : ''}
                    </p>
                    {/* Announces step changes only; emptied whenever a new case runs or a choice changes. */}
                    <p className="sr-only" aria-live="polite">
                        {announce}
                    </p>
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                Assumes at most one retry, which always arrives and gets its response in time; the server
                carries out a request completely or not at all; nobody else changes order 42 meanwhile; the
                keyed server records each key with its result; no proxies.
            </figcaption>
        </figure>
    );
}
