import { describe, expect, it } from 'vitest';

import { DB_MODELS, isDbMechanism, simulateDb, type DbMechanism } from './db-companions';
import { filmDuration, filmStarts, sampleFilm, settledSceneTime, type LessonFilmData } from './film-model';

const metric = (kind: DbMechanism, amount: number, alternative: boolean, label: string): number =>
    Number(simulateDb(kind, { amount, alternative }).metrics.find((item) => item.label === label)!.value);
const film = (kind: DbMechanism, amount: number, alternative: boolean): LessonFilmData => ({
    id: 'db-unit-fixture',
    question: kind,
    takeaway: 'test fixture',
    sourceHref: '/learn/sources',
    nodes: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, label: id, kind: 'store', x: i * 100, y: 0 })),
    links: [
        ['a', 'b'],
        ['a', 'd'],
        ['b', 'd'],
    ],
    beats: simulateDb(kind, { amount, alternative }).beats,
});

describe('database objective companions', () => {
    it('decomposes a current fact into one authority and joins without losing order rows', () => {
        expect(metric('normalization', 3, false, 'Stale order reads')).toBe(2);
        expect(metric('normalization', 3, false, 'Stored address copies')).toBe(4);
        expect(metric('normalization', 3, true, 'Stale order reads')).toBe(0);
        expect(metric('normalization', 3, true, 'Stored address copies')).toBe(1);
        expect(metric('normalization', 3, false, 'Rows updated in this run')).toBe(2);
        expect(metric('normalization', 3, true, 'Rows updated in this run')).toBe(1);
        for (let n = 1; n <= 5; n++)
            for (const alternative of [false, true]) {
                expect(metric('normalization', n, alternative, 'Result rows')).toBe(n);
                const stale = metric('normalization', n, alternative, 'Stale order reads');
                expect(stale).toBe(alternative ? 0 : n - 1);
                expect(simulateDb('normalization', { amount: n, alternative }).outcome).toBe(
                    DB_MODELS.normalization.predictions[stale === 0 ? 1 : 0]
                );
            }
        // One duplicated order was updated, so this boundary is current under both storage layouts.
        expect(simulateDb('normalization', { amount: 1, alternative: false }).outcome).toBe(
            'All order reads return the current address'
        );
    });

    it('changes contiguous range work with key order while preserving SQL result semantics', () => {
        const expectedInspections = [
            [4, 2],
            [4, 8],
            [8, 4],
            [1, 1],
        ];
        const expectedMatches = [2, 4, 4, 1];
        for (let query = 1; query <= 4; query++)
            for (const alternative of [false, true]) {
                expect(metric('compositeIndex', query, alternative, 'Index entries inspected')).toBe(
                    expectedInspections[query - 1][Number(alternative)]
                );
                expect(metric('compositeIndex', query, alternative, 'Qualifying table payload fetches')).toBe(
                    expectedMatches[query - 1]
                );
                expect(metric('compositeIndex', query, alternative, 'Result rows')).toBe(
                    expectedMatches[query - 1]
                );
                expect(
                    metric(
                        'compositeIndex',
                        query,
                        alternative,
                        'Secondary-index entries added by one insert'
                    )
                ).toBe(1);
                const final = sampleFilm(film('compositeIndex', query, alternative), 9999);
                expect(final.counts).toMatchObject({ a: 9, b: 9, d: expectedMatches[query - 1] });
            }
        expect(simulateDb('compositeIndex', { amount: 2, alternative: true }).outcome).toBe(
            'Full index scan in this model'
        );
        expect(simulateDb('compositeIndex', { amount: 3, alternative: false }).outcome).toBe(
            'Full index scan in this model'
        );
    });

    it('keeps the inserted table row and index entry at the same committed boundary', () => {
        for (const alternative of [false, true]) {
            const data = film('compositeIndex', 2, alternative);
            for (let t = 0; t <= filmDuration(data); t += 0.1) {
                const state = sampleFilm(data, t);
                expect(state.counts.a).toBe(state.counts.b);
            }
            const pending = data.beats.findIndex((beat) => beat.title === 'Stage another insert');
            expect(sampleFilm(data, settledSceneTime(data, pending)).counts).toMatchObject({ a: 8, b: 8 });
            expect(sampleFilm(data, filmDuration(data)).counts).toMatchObject({ a: 9, b: 9 });
        }
    });

    it('demonstrates disjoint-write skew and recomputes the predicate after a serializable retry', () => {
        expect(metric('writeSkew', 2, false, 'Doctors still on call')).toBe(0);
        expect(metric('writeSkew', 2, true, 'Doctors still on call')).toBe(1);
        for (let n = 2; n <= 4; n++) {
            expect(metric('writeSkew', n, false, 'Doctors still on call')).toBe(n - 2);
            expect(metric('writeSkew', n, true, 'Doctors still on call')).toBe(Math.max(1, n - 2));
            expect(metric('writeSkew', n, true, 'Serialization failures in this schedule')).toBe(1);
            expect(simulateDb('writeSkew', { amount: n, alternative: false }).outcome).toBe(
                DB_MODELS.writeSkew.predictions[n > 2 ? 1 : 0]
            );
            expect(simulateDb('writeSkew', { amount: n, alternative: true }).outcome).toBe(
                'On-call minimum preserved'
            );
        }
    });

    it('does not expose pending roster writes before their commit event arrives', () => {
        for (const alternative of [false, true]) {
            const data = film('writeSkew', 2, alternative);
            const index = data.beats.findIndex((beat) => beat.title === 'A commits its own row');
            expect(sampleFilm(data, filmStarts(data)[index] + 2.5).counts.d).toBe(2);
            expect(sampleFilm(data, settledSceneTime(data, index)).counts.d).toBe(1);
            const aborted = data.beats.findIndex((beat) => beat.title === 'Abort the conflicting B attempt');
            if (aborted >= 0) expect(sampleFilm(data, settledSceneTime(data, aborted)).counts.d).toBe(1);
        }
    });

    it('covers every bounded input with legal finite deterministic traces and declared verdicts', () => {
        expect(isDbMechanism('toString')).toBe(false);
        for (const kind of Object.keys(DB_MODELS) as DbMechanism[]) {
            expect(isDbMechanism(kind)).toBe(true);
            const spec = DB_MODELS[kind];
            for (let amount = spec.min; amount <= spec.max; amount++)
                for (const alternative of [false, true]) {
                    const input = { amount, alternative };
                    const trace = simulateDb(kind, input);
                    expect(spec.predictions).toContain(trace.outcome);
                    expect(simulateDb(kind, input)).toEqual(trace);
                    expect(trace.beats.every((beat) => !beat.lost)).toBe(true);
                    expect(
                        trace.beats.every((beat) =>
                            Object.values(beat.counts ?? {}).every(
                                (value) => Number.isFinite(value) && value >= 0
                            )
                        )
                    ).toBe(true);
                    for (const beat of trace.beats)
                        for (const endpoint of [beat.from, beat.to].filter(Boolean))
                            expect(['a', 'b', 'c', 'd']).toContain(endpoint);
                }
            expect(simulateDb(kind, { amount: NaN, alternative: false })).toEqual(
                simulateDb(kind, { amount: spec.initial, alternative: false })
            );
        }
    });
});
