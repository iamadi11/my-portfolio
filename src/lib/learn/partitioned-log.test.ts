import { describe, expect, it } from 'vitest';

import { filmDuration, sampleFilm, settledSceneTime } from './film-model';
import {
    PARTITIONED_LOG_DEFAULT,
    makePartitionedLogFilm,
    simulatePartitionedLog,
    type LogCrash,
} from './partitioned-log';

describe('partitioned retained log and classic consumer groups', () => {
    it('replays only the processed record whose next offset was not committed before the crash', () => {
        const before = simulatePartitionedLog(PARTITIONED_LOG_DEFAULT);
        const after = simulatePartitionedLog({ ...PARTITIONED_LOG_DEFAULT, crash: 'after-commit' });
        expect(before.duplicatesA).toBe(1);
        expect(before.effectsA.map((record) => `${record.partition}/${record.offset}`)).toEqual([
            '0/0',
            '0/0',
            '1/0',
            '0/1',
            '1/1',
        ]);
        expect(after.duplicatesA).toBe(0);
        expect(before.committedA).toEqual([2, 2]);
        expect(after.committedA).toEqual([2, 2]);
        const crash = before.events.find((event) => event.kind === 'crash')!;
        expect(crash.attemptsA).toBe(1);
        expect(crash.committedA).toEqual([0, 0]);
        expect(crash.owners).toEqual([null, 1]);
        expect(before.assignments.at(-1)?.owners).toEqual([1, 1]);
    });

    it('does not invent a replacement when the only consumer crashes', () => {
        const before = simulatePartitionedLog({ ...PARTITIONED_LOG_DEFAULT, consumersA: 1 });
        expect(before.duplicatesA).toBe(0);
        expect(before.effectsA).toHaveLength(1);
        expect(before.lagA).toBe(before.retained);
        expect(before.assignments.at(-1)?.owners).toEqual([null, null]);
        expect(before.committedB).toEqual([1, 1]);
        const after = simulatePartitionedLog({
            ...PARTITIONED_LOG_DEFAULT,
            consumersA: 1,
            crash: 'after-commit',
        });
        expect(after.lagA).toBe(after.retained - 1);
        expect(after.committedA).toEqual([1, 0]);
    });

    it('keeps separate group positions and retained storage independent', () => {
        const notReading = simulatePartitionedLog({ ...PARTITIONED_LOG_DEFAULT, readsB: 0 });
        const caughtUp = simulatePartitionedLog({ ...PARTITIONED_LOG_DEFAULT, readsB: 4 });
        expect(notReading.effectsB).toEqual([]);
        expect(caughtUp.effectsB).toHaveLength(4);
        expect(notReading.effectsA).toEqual(caughtUp.effectsA);
        expect(notReading.committedA).toEqual(caughtUp.committedA);
        expect(notReading.retained).toBe(4);
        expect(caughtUp.retained).toBe(4);
        expect(caughtUp.lagB).toBe(0);
    });

    it('shows a different legal topic-wide schedule without changing partition-local order', () => {
        const forward = simulatePartitionedLog({ ...PARTITIONED_LOG_DEFAULT, crash: 'none' });
        const reverse = simulatePartitionedLog({
            ...PARTITIONED_LOG_DEFAULT,
            crash: 'none',
            reverseFetch: true,
        });
        expect(forward.effectsA.map((record) => record.partition)).toEqual([0, 1, 0, 1]);
        expect(reverse.effectsA.map((record) => record.partition)).toEqual([1, 0, 1, 0]);
        for (const result of [forward, reverse])
            for (let partition = 0; partition < 2; partition++)
                expect(
                    result.effectsA
                        .filter((record) => record.partition === partition)
                        .map((record) => record.offset)
                ).toEqual([0, 1]);
    });

    it('preserves ownership, offsets, retention and delivery invariants across 1,440 bounded scenarios', () => {
        for (let partitions = 1; partitions <= 3; partitions++)
            for (let consumersA = 1; consumersA <= 4; consumersA++)
                for (let recordsPerPartition = 1; recordsPerPartition <= 4; recordsPerPartition++)
                    for (let readsB = 0; readsB <= 4; readsB++)
                        for (const crash of ['none', 'before-commit', 'after-commit'] as LogCrash[])
                            for (const reverseFetch of [false, true]) {
                                const run = simulatePartitionedLog({
                                    partitions,
                                    consumersA,
                                    recordsPerPartition,
                                    readsB,
                                    crash,
                                    reverseFetch,
                                });
                                expect(run.retained).toBe(partitions * recordsPerPartition);
                                expect(run.partitions.flat()).toHaveLength(run.retained);
                                expect(run.idleInitially).toBe(Math.max(0, consumersA - partitions));
                                expect(run.duplicatesA).toBe(
                                    crash === 'before-commit' && consumersA > 1 ? 1 : 0
                                );
                                expect(run.lagB).toBe(partitions * Math.max(0, recordsPerPartition - readsB));
                                if (consumersA > 1 || crash === 'none') expect(run.lagA).toBe(0);
                                for (const assignment of run.assignments) {
                                    expect(assignment.owners).toHaveLength(partitions);
                                    expect(
                                        assignment.owners.every(
                                            (owner) => owner === null || assignment.aliveA.includes(owner)
                                        )
                                    ).toBe(true);
                                }
                                for (let partition = 0; partition < partitions; partition++) {
                                    const attempted = run.effectsA
                                        .filter((record) => record.partition === partition)
                                        .map((record) => record.offset);
                                    expect(attempted).toEqual([...attempted].sort((a, b) => a - b));
                                    expect(run.partitions[partition].map((record) => record.offset)).toEqual(
                                        Array.from({ length: recordsPerPartition }, (_, i) => i)
                                    );
                                    for (const group of ['committedA', 'committedB'] as const) {
                                        let previous = 0;
                                        for (const event of run.events) {
                                            expect(event[group][partition]).toBeGreaterThanOrEqual(previous);
                                            expect(event[group][partition]).toBeLessThanOrEqual(
                                                recordsPerPartition
                                            );
                                            previous = event[group][partition];
                                        }
                                    }
                                }
                                // Only commit events advance the corresponding group's durable next position.
                                let previousA = Array(partitions).fill(0) as number[];
                                let previousB = Array(partitions).fill(0) as number[];
                                for (const event of run.events) {
                                    if (event.kind !== 'commit' || event.group !== 'a')
                                        expect(event.committedA).toEqual(previousA);
                                    if (event.kind !== 'commit' || event.group !== 'b')
                                        expect(event.committedB).toEqual(previousB);
                                    previousA = event.committedA;
                                    previousB = event.committedB;
                                }
                            }
    });

    it('renders the exact model snapshots at settled frames, including legal process-before-commit state', () => {
        const run = simulatePartitionedLog(PARTITIONED_LOG_DEFAULT);
        const film = makePartitionedLogFilm(PARTITIONED_LOG_DEFAULT);
        expect(film.beats).toEqual(run.beats);
        expect(run.events.length).toBe(film.beats.length);
        expect(film.beats.every((beat) => !beat.lost)).toBe(true);
        run.events.forEach((event, index) => {
            const frame = sampleFilm(film, settledSceneTime(film, index));
            expect(frame.counts).toEqual({
                p: event.retained,
                q: event.retained,
                a: event.attemptsA,
                b: event.attemptsB,
            });
            expect(frame.values.a).toBe(`next: ${event.committedA.join('/')}`);
            expect(frame.values.b).toBe(`next: ${event.committedB.join('/')}`);
        });
        expect(sampleFilm(film, filmDuration(film)).counts.q).toBe(run.retained);
    });

    it('normalizes malformed numeric inputs, remains finite and does not mutate its inputs', () => {
        const input = {
            ...PARTITIONED_LOG_DEFAULT,
            partitions: NaN,
            consumersA: Infinity,
            recordsPerPartition: -100,
            readsB: 999,
        };
        const first = simulatePartitionedLog(input);
        expect(first.input).toMatchObject({
            partitions: 1,
            consumersA: 1,
            recordsPerPartition: 1,
            readsB: 4,
        });
        expect(input.partitions).toBeNaN();
        expect(simulatePartitionedLog(input)).toEqual(first);
    });
});
