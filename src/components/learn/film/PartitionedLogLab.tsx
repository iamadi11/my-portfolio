'use client';

import React, { useId, useMemo, useState } from 'react';

import {
    LOG_PREDICTIONS,
    PARTITIONED_LOG_DEFAULT,
    makePartitionedLogFilm,
    simulatePartitionedLog,
    type LogCrash,
    type PartitionedLogInput,
} from '@/lib/learn/partitioned-log';

import LessonFilm from './LessonFilm';
import './partitioned-log.css';

const crashModes: [LogCrash, string][] = [
    ['none', 'No crash'],
    ['before-commit', 'A0 crashes after processing, before offset commit'],
    ['after-commit', 'A0 crashes after processing and offset commit'],
];

function PartitionLedger({
    result,
}: {
    result: ReturnType<typeof simulatePartitionedLog>;
}): React.JSX.Element {
    const final = result.assignments[result.assignments.length - 1];
    return (
        <div className="pl-ledger">
            <p>
                Final positions · committed offsets name the next record to read, not the last processed
                record.
            </p>
            {result.partitions.map((records, partition) => (
                <section key={records[0].key} aria-label={`Partition ${partition} retained records`}>
                    <h3>
                        P{partition} · key account-{partition}
                    </h3>
                    <ol className="pl-records" start={0} aria-label={`Partition ${partition} offsets`}>
                        {records.map((record) => (
                            <li key={record.offset}>
                                <span>Offset {record.offset}</span>
                                <small>
                                    {record.offset < result.committedA[partition]
                                        ? 'A committed past'
                                        : 'A not committed past'}
                                </small>
                                <small>
                                    {record.offset < result.committedB[partition]
                                        ? 'B committed past'
                                        : 'B not committed past'}
                                </small>
                            </li>
                        ))}
                    </ol>
                    <p>
                        Group A next: {result.committedA[partition]} · Group B next:{' '}
                        {result.committedB[partition]}
                        {' · '}A owner:{' '}
                        {final.owners[partition] === null ? 'none' : `A${final.owners[partition]}`}
                    </p>
                </section>
            ))}
            <p>
                A processing sequence:{' '}
                {result.effectsA.map((record) => `P${record.partition}@${record.offset}`).join(' → ') ||
                    'none'}
                . B processing sequence:{' '}
                {result.effectsB.map((record) => `P${record.partition}@${record.offset}`).join(' → ') ||
                    'none'}
                .
            </p>
        </div>
    );
}

export function PartitionedLogLearn(): React.JSX.Element {
    const [crash, setCrash] = useState<LogCrash>('before-commit');
    const input = useMemo(() => ({ ...PARTITIONED_LOG_DEFAULT, crash }), [crash]);
    const film = useMemo(() => ({ ...makePartitionedLogFilm(input), id: 'logs-streams' }), [input]);
    const result = useMemo(() => simulatePartitionedLog(input), [input]);
    return (
        <section aria-label="Partitioned log and consumer group walkthrough">
            <p>
                A topic retains records in ordered partitions. Members of group A divide the partitions; group
                B reads independently. Watch processing and offset commits as separate events.
            </p>
            <div
                className="lf-main-controls pl-policies"
                role="group"
                aria-label="Worked example crash point"
            >
                {crashModes.map(([value, label]) => (
                    <button
                        type="button"
                        className="al-run"
                        key={value}
                        aria-pressed={crash === value}
                        onClick={() => setCrash(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <LessonFilm key={crash} film={film} />
            <details className="ln-watch-depth">
                <summary>Inspect partition ownership and independent offsets</summary>
                <PartitionLedger result={result} />
            </details>
            <p className="al-hint">
                Classic partition-assigned consumer groups; not Kafka share groups. One broker symbol contains
                this topic’s partitions. Replication and broker failures are outside this view.
            </p>
        </section>
    );
}

export default function PartitionedLogLab(): React.JSX.Element {
    const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const titleId = `partitioned-log-${instance}`;
    const [input, setInput] = useState<PartitionedLogInput>({ ...PARTITIONED_LOG_DEFAULT });
    const [guess, setGuess] = useState('');
    const [counter, setCounter] = useState(0);
    const [run, setRun] = useState<{ input: PartitionedLogInput; guess: string; key: number } | null>(null);
    const result = useMemo(() => (run ? simulatePartitionedLog(run.input) : null), [run]);
    const film = useMemo(
        () => (run ? makePartitionedLogFilm(run.input, `${instance}-${run.key}`) : null),
        [run, instance]
    );
    const update = <K extends keyof PartitionedLogInput>(key: K, value: PartitionedLogInput[K]): void => {
        setInput((old) => ({ ...old, [key]: value }));
        setGuess('');
        setRun(null);
    };
    const sliders: {
        key: 'partitions' | 'consumersA' | 'recordsPerPartition' | 'readsB';
        label: string;
        min: number;
        max: number;
    }[] = [
        { key: 'partitions', label: 'Topic partitions in this new run', min: 1, max: 3 },
        { key: 'consumersA', label: 'Consumers in group A', min: 1, max: 4 },
        { key: 'recordsPerPartition', label: 'Produced records per partition', min: 1, max: 4 },
        { key: 'readsB', label: 'Group B read budget per partition', min: 0, max: 4 },
    ];
    return (
        <section className="al-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Assign → process → commit → recover</p>
            <h2 id={titleId}>Own a partition, remember a position</h2>
            <p>
                Every run creates a fresh topic. A record is identified by partition and offset. Group A works
                through its assigned partitions; group B has its own read budget and committed positions.
            </p>
            <div className="al-inputs">
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
                    Failure point for consumer A0
                    <select
                        value={input.crash}
                        onChange={(event) => update('crash', event.target.value as LogCrash)}
                    >
                        {crashModes.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Cross-partition fetch schedule
                    <select
                        value={input.reverseFetch ? 'reverse' : 'forward'}
                        onChange={(event) => update('reverseFetch', event.target.value === 'reverse')}
                    >
                        <option value="forward">Visit P0 first each round</option>
                        <option value="reverse">Visit highest partition first each round</option>
                    </select>
                </label>
            </div>
            <details className="ln-watch-depth">
                <summary>Assumptions and what the drawing represents</summary>
                <p>
                    Each partition has one owner within group A; one consumer may own several partitions.
                    Group B has a single independent consumer. A0 crashes on its first processed record at the
                    selected point. Survivors receive a simple round-robin reassignment. With no survivor, A
                    stops; this model does not silently start a replacement.
                </p>
                <p>
                    Processing creates an unprotected side effect, followed by a separate offset commit. There
                    is no output deduplication or transaction. Broker storage remains available and retained
                    records do not expire during the run. A read budget cannot consume records that were not
                    produced. Counts and playback seconds are illustrative, not a throughput test.
                </p>
            </details>
            <fieldset>
                <legend>Predict whether group A will repeat a side effect</legend>
                {LOG_PREDICTIONS.map((prediction) => (
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
                        setCounter(counter + 1);
                        setRun({ input: { ...input }, guess, key: counter + 1 });
                        try {
                            localStorage.setItem('learn-practiced:logs-streams', '1');
                            window.dispatchEvent(new Event('learn-progress'));
                        } catch {
                            /* Optional device-local activity. */
                        }
                    }}
                >
                    Run partition experiment
                </button>
                <button
                    type="button"
                    className="al-run"
                    onClick={() => {
                        setInput({ ...PARTITIONED_LOG_DEFAULT });
                        setGuess('');
                        setRun(null);
                    }}
                >
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
                            {result.duplicatesA} repeated effect; {result.lagA} records not committed by A;{' '}
                            {result.lagB} unread by B. All {result.retained} records remain in the log.
                        </p>
                    </div>
                    <dl className="ac-metrics">
                        <div>
                            <dt>Initially idle consumers in A</dt>
                            <dd>{result.idleInitially}</dd>
                        </div>
                        <div>
                            <dt>A processing attempts</dt>
                            <dd>{result.effectsA.length}</dd>
                        </div>
                        <div>
                            <dt>B processing attempts</dt>
                            <dd>{result.effectsB.length}</dd>
                        </div>
                    </dl>
                    <LessonFilm key={run.key} film={film} autoPlay trackProgress={false} />
                    <details className="ln-watch-depth">
                        <summary>Inspect retained records, ownership and next offsets</summary>
                        <PartitionLedger result={result} />
                        <ul>
                            {result.assignments.map((assignment) => (
                                <li key={assignment.phase}>
                                    {assignment.phase}:{' '}
                                    {assignment.owners
                                        .map(
                                            (owner, p) =>
                                                `P${p} → ${owner === null ? 'no owner' : `A${owner}`}`
                                        )
                                        .join(' · ')}
                                </li>
                            ))}
                        </ul>
                    </details>
                    <p className="ac-reflect">
                        Keep records fixed and reverse the fetch schedule. Per-partition order remains; the
                        topic-wide sequence can change. Then compare a crash with one consumer and two
                        consumers: what allows replay to proceed?
                    </p>
                </>
            ) : (
                <p className="al-hint">Commit a prediction and run to reveal the result and trace.</p>
            )}
        </section>
    );
}
