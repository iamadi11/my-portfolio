'use client';

import React, { useId, useMemo, useState } from 'react';

import {
    LOAD_BALANCING_DEFAULT,
    ROUTING_PREDICTIONS,
    makeLoadBalancingFilm,
    simulateLoadBalancer,
    type LoadBalancingInput,
    type RoutingPolicy,
} from '@/lib/learn/load-balancing';

import LessonFilm from './LessonFilm';
import './load-balancing.css';

const policies: [RoutingPolicy, string][] = [
    ['round-robin', 'Round robin'],
    ['least-connections', 'Least active connections'],
];

export function LoadBalancingLearn(): React.JSX.Element {
    const [policy, setPolicy] = useState<RoutingPolicy>('round-robin');
    const film = useMemo(
        () => ({ ...makeLoadBalancingFilm({ ...LOAD_BALANCING_DEFAULT, policy }), id: 'load-balancing' }),
        [policy]
    );
    return (
        <section className="lb-worked" aria-label="Compare routing policies">
            <p>
                Three replicas run the same application. A is slower; B and C finish sooner. Compare the same
                nine requests under two routing policies.
            </p>
            <div className="lf-main-controls" role="group" aria-label="Worked example routing policy">
                {policies.map(([value, label]) => (
                    <button
                        type="button"
                        className="al-run"
                        key={value}
                        aria-pressed={policy === value}
                        onClick={() => setPolicy(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <LessonFilm key={policy} film={film} />
            <p className="al-hint">
                Round robin takes turns. Least-connections selects the fewest active connections, with a
                rotating tie break here. Connection count is a load signal, not a guarantee of faster work.
            </p>
        </section>
    );
}

export default function LoadBalancingLab(): React.JSX.Element {
    const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const titleId = `lb-lab-${instance}`;
    const [input, setInput] = useState<LoadBalancingInput>({ ...LOAD_BALANCING_DEFAULT });
    const [guess, setGuess] = useState('');
    const [run, setRun] = useState<{ input: LoadBalancingInput; guess: string; number: number } | null>(null);
    const [number, setNumber] = useState(0);
    const result = useMemo(() => (run ? simulateLoadBalancer(run.input) : null), [run]);
    const film = useMemo(
        () => (run ? makeLoadBalancingFilm(run.input, `lab-${instance}-${run.number}`) : null),
        [run, instance]
    );
    const update = <K extends keyof LoadBalancingInput>(key: K, value: LoadBalancingInput[K]): void => {
        setInput((current) => ({ ...current, [key]: value }));
        setGuess('');
        setRun(null);
    };
    const reset = (): void => {
        setInput({ ...LOAD_BALANCING_DEFAULT });
        setGuess('');
        setRun(null);
    };
    const sliders: {
        key: 'requests' | 'spacing' | 'serviceA' | 'capacity';
        label: string;
        min: number;
        max: number;
    }[] = [
        { key: 'requests', label: 'Requests arriving', min: 1, max: 12 },
        { key: 'spacing', label: 'Ticks between arrivals (0 = simultaneous burst)', min: 0, max: 3 },
        { key: 'serviceA', label: 'Server A service time (ticks)', min: 1, max: 8 },
        { key: 'capacity', label: 'Active connection limit per replica', min: 1, max: 4 },
    ];
    return (
        <section className="al-lab lb-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Route → observe → explain</p>
            <h2 id={titleId}>Keep the replicas busy without overloading them</h2>
            <p>
                B and C take one tick per request. Each admitted request holds one connection until it
                finishes. Change one assumption, predict the outcome, then inspect every routing decision.
            </p>
            <div className="al-inputs">
                <label>
                    Routing policy
                    <select
                        value={input.policy}
                        onChange={(event) => update('policy', event.target.value as RoutingPolicy)}
                    >
                        {policies.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                {sliders.map(({ key, label, min, max }) => (
                    <label key={key} htmlFor={`${titleId}-${key}`}>
                        {label}
                        <input
                            id={`${titleId}-${key}`}
                            type="range"
                            min={min}
                            max={max}
                            value={input[key]}
                            onChange={(event) => update(key, Number(event.target.value))}
                        />
                        <output htmlFor={`${titleId}-${key}`}>{input[key]}</output>
                    </label>
                ))}
                <label>
                    Server A health
                    <select
                        value={input.condition}
                        onChange={(event) =>
                            update('condition', event.target.value as LoadBalancingInput['condition'])
                        }
                    >
                        <option value="healthy">Healthy</option>
                        <option value="undetected-failure">Failed; balancer has not detected it</option>
                        <option value="excluded">Failed; already excluded by health policy</option>
                    </select>
                </label>
            </div>
            <details className="ln-watch-depth">
                <summary>Know the model’s assumptions</summary>
                <p>
                    Arrivals at the same tick are routed in order; completions happen first. A replica at its
                    admission limit rejects the request. There is no queue or retry. A first failed connection
                    excludes A for the remaining run. Real health checks have thresholds, timeouts and later
                    probes. This run has no recovery.
                </p>
                <p>
                    One tick is an invented teaching unit. One request uses one connection; keepalive,
                    multiplexing, weighted routing, sticky sessions and real network delays are omitted. These
                    counts are model results, not a benchmark.
                </p>
            </details>
            <fieldset>
                <legend>Predict this run before revealing its trace</legend>
                {ROUTING_PREDICTIONS.map((prediction) => (
                    <label key={prediction}>
                        <input
                            type="radio"
                            name={`${titleId}-prediction`}
                            checked={guess === prediction}
                            onChange={() => {
                                setGuess(prediction);
                                setRun(null);
                            }}
                        />
                        {prediction}
                    </label>
                ))}
            </fieldset>
            <div className="lf-main-controls">
                <button
                    type="button"
                    className="al-run"
                    disabled={!guess}
                    onClick={() => {
                        setNumber(number + 1);
                        setRun({ input: { ...input }, guess, number: number + 1 });
                        try {
                            localStorage.setItem('learn-practiced:load-balancing', '1');
                            window.dispatchEvent(new Event('learn-progress'));
                        } catch {
                            /* Optional local activity record. */
                        }
                    }}
                >
                    Run routing experiment
                </button>
                <button type="button" className="al-run" onClick={reset}>
                    Reset experiment
                </button>
            </div>
            {run && result && film ? (
                <>
                    <div className="al-feedback" role="status">
                        <strong>
                            {run.guess === result.outcome
                                ? 'Prediction matched.'
                                : 'Compare your prediction.'}{' '}
                            {result.outcome}.
                        </strong>
                        <p>
                            {result.accepted} accepted and completed after draining; {result.rejected}{' '}
                            capacity rejections; {result.failed} connection failures. Exclusion prevents later
                            attempts to the failed replica; it cannot undo an earlier failure.
                        </p>
                    </div>
                    <dl className="ac-metrics">
                        {result.assigned.map((count, i) => (
                            <div key={String.fromCharCode(65 + i)}>
                                <dt>Attempts sent to {String.fromCharCode(65 + i)}</dt>
                                <dd>{count}</dd>
                            </div>
                        ))}
                    </dl>
                    <LessonFilm key={run.number} film={film} autoPlay trackProgress={false} />
                    <details className="ln-watch-depth">
                        <summary>Inspect every routing decision without animation</summary>
                        <div className="lb-ledger" role="region" aria-label="Routing decisions" tabIndex={0}>
                            <table>
                                <caption>
                                    Active connections are counted immediately before each arrival.
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Request</th>
                                        <th scope="col">Tick</th>
                                        <th scope="col">Active A/B/C</th>
                                        <th scope="col">Target</th>
                                        <th scope="col">Result</th>
                                        <th scope="col">Finish tick</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.events.map((event) => (
                                        <tr key={event.request}>
                                            <th scope="row">{event.request}</th>
                                            <td>{event.tick}</td>
                                            <td>{event.activeBefore.join(' / ')}</td>
                                            <td>{String.fromCharCode(65 + event.target)}</td>
                                            <td>{event.outcome.replace(/-/g, ' ')}</td>
                                            <td>{event.finish ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                    <p className="ac-reflect">
                        Keep the workload fixed and switch policy. Which active connection made a routing
                        decision change? Then set arrival spacing to zero: can either policy create capacity?
                    </p>
                </>
            ) : (
                <p className="al-hint">
                    The outcome and trace appear after you commit to a prediction and run.
                </p>
            )}
        </section>
    );
}
