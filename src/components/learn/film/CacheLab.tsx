'use client';

import React, { useId, useMemo, useState } from 'react';

import {
    cacheDefaults,
    assumedCacheMean,
    EVICTION_PREDICTIONS,
    firstEvictionPrediction,
    CACHE_PATTERNS,
    CACHE_PREDICTIONS,
    cacheContents,
    makeCacheFilm,
    simulateCache,
    type CacheInput,
} from '@/lib/learn/cache-lab';

import LessonFilm from './LessonFilm';
import './cache-lab.css';

export function CacheLearn({ chapterId = 'caching-basics' }: { chapterId?: string }): React.JSX.Element {
    const [invalidation, setInvalidation] = useState<CacheInput['invalidation']>('drop');
    const [policy, setPolicy] = useState<CacheInput['eviction']>('lru');
    const eviction = chapterId === 'eviction';
    const input = useMemo(
        () => ({ ...cacheDefaults(chapterId), invalidation, eviction: policy }),
        [chapterId, invalidation, policy]
    );
    const film = useMemo(
        () => ({ ...makeCacheFilm(input, 'learn', chapterId), id: chapterId }),
        [input, chapterId]
    );
    return (
        <section
            className="cache-worked"
            aria-label={eviction ? 'Compare replacement policies' : 'Compare cache invalidation'}
        >
            <p>
                {eviction
                    ? 'A is used twice, then B is read more recently. C needs a slot. Keep the workload fixed and compare recency, frequency and insertion order.'
                    : 'A copy saves work until the original changes. The writer updates A at tick 4. Watch the same ten reads with one changed condition: whether its invalidation arrives.'}
            </p>
            <div className="lf-main-controls" role="group" aria-label="Worked example comparison">
                {eviction
                    ? (['lru', 'lfu', 'fifo'] as const).map((value) => (
                          <button
                              key={value}
                              type="button"
                              className="al-run"
                              aria-pressed={policy === value}
                              onClick={() => setPolicy(value)}
                          >
                              {value.toUpperCase()}
                          </button>
                      ))
                    : (['drop', 'deliver'] as const).map((value) => (
                          <button
                              key={value}
                              type="button"
                              className="al-run"
                              aria-pressed={invalidation === value}
                              onClick={() => setInvalidation(value)}
                          >
                              {value === 'drop' ? 'Invalidation lost' : 'Invalidation delivered'}
                          </button>
                      ))}
            </div>
            <LessonFilm key={eviction ? policy : invalidation} film={film} />
            <p className="al-hint">
                TTL is the lifetime from insertion. An unexpired entry can still be older than the origin.
                This serial logical cache uses exact policies; playback seconds are not request latency.
            </p>
        </section>
    );
}

export default function CacheLab({
    chapterId = 'caching-basics',
}: {
    chapterId?: string;
}): React.JSX.Element {
    const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const titleId = `cache-lab-${instance}`;
    const [input, setInput] = useState<CacheInput>(() => cacheDefaults(chapterId));
    const [guess, setGuess] = useState('');
    const [number, setNumber] = useState(0);
    const [run, setRun] = useState<{ input: CacheInput; guess: string; number: number } | null>(null);
    const result = useMemo(() => (run ? simulateCache(run.input) : null), [run]);
    const film = useMemo(
        () => (run ? makeCacheFilm(run.input, `lab-${instance}-${run.number}`, chapterId) : null),
        [run, instance, chapterId]
    );
    const update = <K extends keyof CacheInput>(key: K, value: CacheInput[K]): void => {
        setInput((current) => ({ ...current, [key]: value }));
        setGuess('');
        setRun(null);
    };
    const reset = (): void => {
        setInput(cacheDefaults(chapterId));
        setGuess('');
        setRun(null);
    };
    const pattern = CACHE_PATTERNS[input.pattern];
    const eviction = chapterId === 'eviction';
    const predictions = eviction ? EVICTION_PREDICTIONS : CACHE_PREDICTIONS;
    const outcome = result ? (eviction ? firstEvictionPrediction(result.reads) : result.outcome) : '';
    return (
        <section className="al-lab cache-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Reuse → change → inspect</p>
            <h2 id={titleId}>
                {eviction
                    ? 'Choose which copy gives up its slot'
                    : 'Keep copies useful without hiding old data'}
            </h2>
            <p>
                Ten reads start with an empty cache. Change its size, lifetime or replacement policy, then see
                which reads reach the origin and which return older data.
            </p>
            <div className="al-inputs">
                <label htmlFor={`${titleId}-capacity`}>
                    Capacity (equal-size entry slots)
                    <input
                        id={`${titleId}-capacity`}
                        type="range"
                        min={1}
                        max={4}
                        value={input.capacity}
                        onChange={(event) => update('capacity', Number(event.target.value))}
                    />
                    <output htmlFor={`${titleId}-capacity`}>{input.capacity} slots</output>
                </label>
                <label htmlFor={`${titleId}-ttl`}>
                    Time to live (ticks; 0 bypasses storage)
                    <input
                        id={`${titleId}-ttl`}
                        type="range"
                        min={0}
                        max={8}
                        value={input.ttl}
                        onChange={(event) => update('ttl', Number(event.target.value))}
                    />
                    <output htmlFor={`${titleId}-ttl`}>{input.ttl} ticks</output>
                </label>
                <label>
                    Eviction policy when all slots are full
                    <select
                        value={input.eviction}
                        onChange={(event) => update('eviction', event.target.value as CacheInput['eviction'])}
                    >
                        <option value="lru">LRU · remove least recently read</option>
                        <option value="fifo">FIFO · remove earliest inserted</option>
                        <option value="lfu">LFU · remove least read; oldest read breaks ties</option>
                    </select>
                </label>
                <label>
                    Request pattern
                    <select
                        value={input.pattern}
                        onChange={(event) => update('pattern', event.target.value as CacheInput['pattern'])}
                    >
                        {Object.entries(CACHE_PATTERNS).map(([value, item]) => (
                            <option key={value} value={value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="cache-write-control">
                    <input
                        type="checkbox"
                        checked={input.originWrite}
                        onChange={(event) => update('originWrite', event.target.checked)}
                    />
                    Writer changes A from v1 to v2 at tick 4
                </label>
                <label>
                    Invalidation after that write
                    <select
                        disabled={!input.originWrite}
                        value={input.invalidation}
                        onChange={(event) =>
                            update('invalidation', event.target.value as CacheInput['invalidation'])
                        }
                    >
                        <option value="drop">Message lost · cache keeps its entry</option>
                        <option value="deliver">Message delivered · remove A if present</option>
                    </select>
                </label>
            </div>
            <details className="ln-watch-depth">
                <summary>Inspect the fixed workload and assumptions</summary>
                <p className="cache-workload">
                    Each key is followed by its request tick:{' '}
                    {pattern.keys.map((key, i) => `${key}@${pattern.ticks[i]}`).join(' → ')}. Requests sharing
                    a tick still complete in the displayed order.
                </p>
                <p>
                    All origin values begin at v1. Expiration and the optional write happen before reads at
                    that tick. Hits never extend TTL. LRU and LFU are exact here; Redis uses sampled,
                    approximate policies. LFU counts reads since insertion, without frequency decay. A write
                    and its delivered invalidation finish before the next read in this serial model.
                </p>
                <p>
                    “Older” compares the returned version with the origin, separately from TTL expiration.
                    There are no concurrent fills, stampedes, validators, background refresh, distributed
                    coherence or real latency. TTL 0 is this model’s bypass control, not Redis EX 0 syntax.
                    Expiration bounds reuse of each previous fill here; a real concurrent stale fill can race
                    with invalidation and is not simulated.
                </p>
            </details>
            <fieldset>
                <legend>
                    {eviction
                        ? 'Predict the first capacity eviction before revealing the trace'
                        : 'Predict the versions before revealing the trace'}
                </legend>
                {predictions.map((prediction) => (
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
                            localStorage.setItem(`learn-practiced:${chapterId}`, '1');
                            window.dispatchEvent(new Event('learn-progress'));
                        } catch {
                            /* Optional device-local activity. */
                        }
                    }}
                >
                    Run cache experiment
                </button>
                <button type="button" className="al-run" onClick={reset}>
                    Reset experiment
                </button>
            </div>
            {run && result && film ? (
                <>
                    <div className="al-feedback" role="status">
                        <strong>
                            {run.guess === outcome ? 'Prediction matched.' : 'Compare your prediction.'}{' '}
                            {outcome}.
                        </strong>
                        <p>
                            {result.metrics.hits} of {result.reads.length} reads reused a copy;{' '}
                            {result.metrics.originLoads} reached the origin. {result.metrics.staleReads}{' '}
                            returned an older version. Hit rate is an outcome of the workload and policy, not
                            proof of current data.
                        </p>
                        <p>{result.explanation}</p>
                        <p>
                            Assume a hit costs 5 ms total and a miss costs 100 ms total. Mean = (
                            {result.metrics.hits} × 5 + {result.metrics.misses} × 100) ÷ {result.reads.length}{' '}
                            = {assumedCacheMean(result.metrics)} ms. Change the request pattern to change
                            locality. These invented costs do not estimate p99 or production latency.
                        </p>
                    </div>
                    <dl className="ac-metrics">
                        {(
                            [
                                ['Cache hits', result.metrics.hits],
                                ['Cache misses', result.metrics.misses],
                                ['Older-version reads', result.metrics.staleReads],
                                ['Origin loads', result.metrics.originLoads],
                                ['Capacity evictions', result.metrics.evictions],
                                ['TTL expirations', result.metrics.expirations],
                            ] as const
                        ).map(([label, value]) => (
                            <div key={label}>
                                <dt>{label}</dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <LessonFilm key={run.number} film={film} autoPlay trackProgress={false} />
                    <details className="ln-watch-depth">
                        <summary>Inspect every lookup, expiration and write without animation</summary>
                        <div
                            className="cache-ledger"
                            role="region"
                            aria-label="Cache event trace"
                            tabIndex={0}
                        >
                            <table>
                                <caption>
                                    Cache order lists the next eviction candidate first. “exp” is the
                                    expiration tick.
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Tick</th>
                                        <th scope="col">Operation</th>
                                        <th scope="col">Returned / origin</th>
                                        <th scope="col">Cache after</th>
                                        <th scope="col">Origin loads so far</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.events.map((event) => (
                                        <tr
                                            key={
                                                event.kind === 'read'
                                                    ? `read-${event.request}`
                                                    : `${event.kind}-${event.tick}`
                                            }
                                        >
                                            <td>{event.tick}</td>
                                            <th scope="row">
                                                {event.kind === 'read'
                                                    ? `Read ${event.request}: ${event.key} · ${event.status}${event.evicted ? ` · evict ${event.evicted}` : ''}`
                                                    : event.kind === 'expire'
                                                      ? `Expire ${event.keys.join(', ')}`
                                                      : `Write A v2 · invalidation ${event.invalidation === 'deliver' ? 'delivered' : 'lost'}`}
                                            </th>
                                            <td>
                                                {event.kind === 'read'
                                                    ? `v${event.version} / v${event.originVersion}${event.stale ? ' · older' : ''}`
                                                    : '—'}
                                            </td>
                                            <td>
                                                {cacheContents(event.after)}
                                                <br />
                                                {event.after.length > 0 &&
                                                    `Reads since fill: ${event.after.map((entry) => `${entry.key}=${entry.uses}`).join(', ')}`}
                                            </td>
                                            <td>{event.kind === 'read' ? event.totals.originLoads : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                    <p className="ac-reflect">
                        Keep the workload fixed and compare LRU, FIFO and LFU. Which reuse changed an
                        eviction? Then shorten TTL: do older reads disappear, and how does origin work change?
                    </p>
                </>
            ) : (
                <p className="al-hint">
                    The result and trace appear after you commit to a prediction and run.
                </p>
            )}
        </section>
    );
}
