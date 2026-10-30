import { describe, expect, it, vi } from 'vitest';

import { BLUEPRINTS, COMPANION_MODELS, recallFor } from '@/content/learn/academy';

import { makeExperimentFilm, MECHANISMS, simulateMechanism } from './experiment-model';
import { filmDuration, sampleFilm } from './film-model';

vi.mock('server-only', () => ({}));
const metric = (kind: 'bulkhead' | 'readQuorum', amount: number, alternative: boolean, label: string) =>
    simulateMechanism(kind, { amount, alternative }).metrics.find((item) => item.label === label)?.value;

describe('objective and experiment correspondence', () => {
    it('bases healthy-work admission on actual free slots, including underload without isolation', () => {
        expect(MECHANISMS.bulkhead.min).toBe(1);
        expect(metric('bulkhead', 1, false, 'Slots available for healthy work')).toBe('3');
        expect(simulateMechanism('bulkhead', { amount: 1, alternative: false }).outcome).toBe(
            'Healthy capacity protected'
        );
        expect(simulateMechanism('bulkhead', { amount: 4, alternative: false }).outcome).toBe(
            'Healthy work starved'
        );
        expect(metric('bulkhead', 8, true, 'Calls holding slots')).toBe('2');
        expect(metric('bulkhead', 8, true, 'Calls rejected at pool limit')).toBe('6');
        for (let amount = 1; amount <= 8; amount++) {
            for (const alternative of [false, true]) {
                const occupied = Number(metric('bulkhead', amount, alternative, 'Calls holding slots'));
                const rejected = Number(
                    metric('bulkhead', amount, alternative, 'Calls rejected at pool limit')
                );
                expect(occupied + rejected).toBe(amount);
            }
        }
    });
    it('renders the actual requested replica replies and preserves the stale first-reply counterexample', () => {
        for (const alternative of [false, true])
            for (const amount of [2, 3]) {
                const film = makeExperimentFilm('quorum-reads', 'Q', 'R', 'readQuorum', {
                    amount,
                    alternative,
                });
                expect(film.beats.filter((beat) => beat.from).length).toBe(amount);
                expect(metric('readQuorum', amount, alternative, 'Replies used for result')).toBe(
                    String(alternative ? amount : 1)
                );
                expect(sampleFilm(film, filmDuration(film)).values.c).toBe(alternative ? 'v2' : 'v1');
            }
    });
    it('assesses companion mechanisms instead of counting their drawings as objective coverage', () => {
        for (const [id, companions] of Object.entries(COMPANION_MODELS)) {
            const lesson = BLUEPRINTS.find((item) => item.id === id)!;
            const questions = recallFor(lesson);
            expect(questions).toHaveLength(1 + companions.length);
            expect(new Set(questions.map((question) => question.prompt)).size).toBe(questions.length);
            expect(questions.every((question) => question.chapter === id)).toBe(true);
        }
    });
});
