import { describe, expect, it } from 'vitest';

import {
    ARRIVAL_MS,
    LEARN_INPUTS,
    WINDOW_MS,
    along,
    busyRate,
    callOf,
    completionsAt,
    finishable,
    marksOf,
    onBed,
    serve,
    type Inputs,
    type ServiceMs,
    type Workers,
} from './latency-model';

const services = [125, 250, 500] as const;
const workers = [1, 2, 4] as const;
const cases: Inputs[] = services.flatMap((serviceMs) =>
    workers.map((count) => ({ serviceMs, workers: count }))
);

describe('latency and throughput', () => {
    it.each(cases)('same inputs, same run (%j)', (inputs) => {
        expect(serve(inputs)).toEqual(serve(inputs));
    });

    it('jobs arrive one at a time', () => {
        const run = serve(LEARN_INPUTS);
        expect(run.jobs.map((job) => job.arrivedMs)).toEqual([0, 250, 500, 750]);
        expect(ARRIVAL_MS).toBe(250);
        expect(WINDOW_MS).toBe(1000);
    });

    it('W=1 and a busy bed: the first finish is S and the rate is 1/S', () => {
        const run = serve({ serviceMs: 250, workers: 1 });
        const job = run.jobs[0];
        expect(run.firstFinishMs).toBe(250);
        expect(run.completions).toBe(4);
        expect(run.completions).toBe(WINDOW_MS / 250);
        expect(busyRate(run)).toBe(1 / 250);
        expect(along(job, 0)).toBe(0);
        expect(along(job, 125)).toBe(0.5);
        expect(along(job, 250)).toBe(1);
        expect(onBed(job, 125)).toBe(true);
        expect(onBed(job, 250)).toBe(false);
        expect(completionsAt(run, 125)).toBe(0);
        expect(completionsAt(run, 250)).toBe(1);
        expect(completionsAt(run, 1000)).toBe(4);
        expect(marksOf(run)).toEqual([0, 250, 500, 750, 1000]);
        for (const taken of run.jobs) {
            expect(taken.startedMs).toBe(taken.arrivedMs);
            expect(taken.finishedMs).toBe((taken.arrivedMs ?? 0) + 250);
        }
    });

    it('W=1 and a slower bed stays busy: throughput is still 1/S', () => {
        const run = serve({ serviceMs: 500, workers: 1 });
        expect(run.firstFinishMs).toBe(500);
        expect(run.completions).toBe(2);
        expect(busyRate(run)).toBe(1 / 500);
        const skipped = run.jobs.find((job) => job.arrivedMs === 250);
        expect(skipped?.startedMs).toBeNull();
        expect(along(skipped ?? run.jobs[0], 100)).toBeNull();
        for (const job of run.jobs) {
            if (job.startedMs === null) continue;
            expect(job.startedMs).toBe(job.arrivedMs);
            expect(job.finishedMs).toBe(job.arrivedMs + 500);
        }
    });

    it('W=1 and a faster bed does not finish jobs that have not arrived', () => {
        const run = serve({ serviceMs: 125, workers: 1 });
        expect(run.firstFinishMs).toBe(125);
        expect(run.completions).toBe(4);
        expect(busyRate(run)).toBeNull();
        expect(run.completions).toBe(finishable(125));
        expect(run.completions).not.toBe(WINDOW_MS / 125);
    });

    it('W>1 keeps one job at S and raises the tray until arrivals limit it', () => {
        const one = serve({ serviceMs: 500, workers: 1 });
        const two = serve({ serviceMs: 500, workers: 2 });
        const four = serve({ serviceMs: 500, workers: 4 });
        expect(one.firstFinishMs).toBe(500);
        expect(two.firstFinishMs).toBe(500);
        expect(four.firstFinishMs).toBe(500);
        expect(one.completions).toBe(2);
        expect(two.completions).toBe(3);
        expect(four.completions).toBe(3);
        expect(four.completions).toBe(finishable(500));
        expect(two.completions).toBeGreaterThan(one.completions);
        expect(callOf({ serviceMs: 500, workers: 4 })).toBe('more');
        expect(callOf({ serviceMs: 500, workers: 1 })).toBe('same');
        for (const run of [two, four]) {
            for (const job of run.jobs) {
                if (job.startedMs === null) continue;
                expect(job.finishedMs! - job.startedMs).toBe(500);
            }
        }
    });

    it('extra beds do not beat the arrivals when one bed already keeps up', () => {
        for (const serviceMs of [125, 250] as const) {
            const one = serve({ serviceMs, workers: 1 });
            const four = serve({ serviceMs, workers: 4 });
            expect(four.firstFinishMs).toBe(serviceMs);
            expect(four.completions).toBe(one.completions);
            expect(four.completions).toBeLessThanOrEqual(finishable(serviceMs));
            expect(callOf({ serviceMs, workers: 4 })).toBe('same');
        }
    });

    it('rejects a service time or a worker count outside the model', () => {
        expect(() => serve({ serviceMs: 100 as ServiceMs, workers: 1 })).toThrow(/serviceMs/);
        expect(() => serve({ serviceMs: 250, workers: 3 as Workers })).toThrow(/workers/);
    });
});
