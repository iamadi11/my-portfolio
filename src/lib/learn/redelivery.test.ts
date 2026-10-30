import { describe, expect, it } from 'vitest';

import { makeExperimentFilm, simulateMechanism } from './experiment-model';
import { beatDuration, filmStarts, sampleFilm, settledSceneTime } from './film-model';

const metric = (amount: number, alternative: boolean, label: string): string =>
    simulateMechanism('redelivery', { amount, alternative }).metrics.find((item) => item.label === label)!
        .value;

describe('redelivery after a receiver crash', () => {
    it('requeues the same obligation but delivers only after a live replacement starts', () => {
        for (let amount = 1; amount <= 4; amount++) {
            const trace = simulateMechanism('redelivery', { amount, alternative: true });
            expect(trace.beats.filter((beat) => beat.title.startsWith('Start replacement'))).toHaveLength(
                amount
            );
            expect(metric(amount, true, 'Actual job deliveries')).toBe(String(amount + 1));
            expect(metric(amount, true, 'Replacement work requests')).toBe(String(amount));
            expect(metric(amount, true, 'Saved durable effects')).toBe('0');
            expect(metric(amount, true, 'Retained work obligations')).toBe('1');
            const arrivals = trace.beats.filter((beat) => beat.from === 'a' && beat.to === 'b');
            expect(arrivals).toHaveLength(amount + 1);
            expect(arrivals.every((beat) => beat.states?.b === 'active')).toBe(true);
            expect(trace.beats.at(-1)?.states?.b).toBe('failed');
        }
    });

    it('does not invent replacement job deliveries after an early acknowledgment', () => {
        for (let amount = 1; amount <= 4; amount++) {
            const trace = simulateMechanism('redelivery', { amount, alternative: false });
            expect(trace.beats.filter((beat) => beat.title.startsWith('Empty result'))).toHaveLength(amount);
            expect(trace.beats.filter((beat) => beat.title.startsWith('Redeliver'))).toEqual([]);
            expect(metric(amount, false, 'Actual job deliveries')).toBe('1');
            expect(metric(amount, false, 'Replacement work requests')).toBe(String(amount));
            expect(metric(amount, false, 'Retained work obligations')).toBe('0');
            expect(metric(amount, false, 'Saved durable effects')).toBe('0');
            expect(trace.beats.at(-1)?.states?.b).toBe('done');
        }
    });

    it('keeps every message receiver legal before, during and after travel, then applies an explicit crash', () => {
        for (let amount = 1; amount <= 4; amount++)
            for (const alternative of [false, true]) {
                const film = makeExperimentFilm(
                    'message-queues-regression',
                    'question',
                    'rule',
                    'redelivery',
                    { amount, alternative }
                );
                const starts = filmStarts(film);
                film.beats.forEach((beat, index) => {
                    expect(beat.lost).not.toBe(true);
                    if (beat.to === 'b') {
                        const previous = sampleFilm(film, Math.max(0, starts[index] - 0.001));
                        expect(previous.states.b).not.toBe('failed');
                        for (const phase of [0.12, 0.3, 0.6])
                            expect(
                                sampleFilm(film, starts[index] + beatDuration(beat) * phase).states.b
                            ).not.toBe('failed');
                        expect(sampleFilm(film, settledSceneTime(film, index)).states.b).not.toBe('failed');
                    }
                    if (beat.title.includes('crashes')) {
                        expect(beat.from).toBeUndefined();
                        expect(sampleFilm(film, settledSceneTime(film, index)).states.b).toBe('failed');
                    }
                });
            }
    });
});
