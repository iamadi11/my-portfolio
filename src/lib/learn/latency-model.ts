/**
 * Teaching model for latency and throughput. One job takes the service time S.
 * The tray counts how many jobs finish inside a fixed window.
 *
 * 1. Inputs: service time S (125, 250, or 500 ms) and worker count W (1, 2, or 4).
 * 2. State: each arrival, the bed it started on, and when that bed finishes it.
 * 3. Rules: jobs arrive one at a time, at 0, 250, 500, and 750 ms. A job starts at
 *    its arrival if some bed is free then. Otherwise it is not taken. A bed that
 *    starts a job is busy for S ms. Beds do not slow each other. Nothing waits.
 * 4. Equations: a taken job finishes at arrival + S, so that job's time is S.
 *    The first job arrives at 0 onto a free bed, so the first finish is S.
 *    Completions are taken jobs whose finish is at or before 1000 ms.
 *    When one bed is busy for the whole window (completions × S = 1000), the
 *    rate is 1/S jobs per millisecond.
 * 5. Assumptions: the window, the arrival spacing, and S are assumed. No queueing
 *    delay, no contention, not a benchmark, not a link measurement.
 * 6. Outputs: firstFinishMs, completions, and for a clock time t the fraction
 *    along(job, t) and the count completionsAt(run, t).
 * 7. Boundaries: raising W does not change the first finish. The tray never
 *    exceeds the arrivals that can finish inside the window. S = 125 on one bed
 *    finishes 4 jobs, not 8, because the next job has not arrived.
 * 8. Deterministic. A tie for the free bed goes to the lowest index.
 * 9. Limits: not the frame test in RFC 1242, not link capacity in RFC 5136,
 *    not a queue (utilisation-queueing), not a percentile.
 */

export const WINDOW_MS = 1000;
export const ARRIVAL_MS = 250;
export const SERVICE_MS = [125, 250, 500] as const;
export const WORKER_COUNTS = [1, 2, 4] as const;

export type ServiceMs = (typeof SERVICE_MS)[number];
export type Workers = (typeof WORKER_COUNTS)[number];
export type Inputs = { serviceMs: ServiceMs; workers: Workers };

/** Learn plays the busy one-bed case: S equals the arrival spacing, so the bed never sits idle. */
export const LEARN_INPUTS: Inputs = { serviceMs: 250, workers: 1 };

export type Job = {
    arrivedMs: number;
    startedMs: number | null;
    finishedMs: number | null;
    worker: number | null;
};

export type Run = {
    serviceMs: ServiceMs;
    workers: Workers;
    jobs: Job[];
    /** Milliseconds from t = 0 until the first job finishes. Equals the service time. */
    firstFinishMs: number;
    /** Jobs whose finish is inside the window. */
    completions: number;
};

function isService(n: number): n is ServiceMs {
    return (SERVICE_MS as readonly number[]).includes(n);
}

function isWorkers(n: number): n is Workers {
    return (WORKER_COUNTS as readonly number[]).includes(n);
}

export function serve(inputs: Inputs): Run {
    const { serviceMs: S, workers: W } = inputs;
    if (!isService(S) || !isWorkers(W)) {
        throw new Error('serviceMs must be 125, 250, or 500; workers must be 1, 2, or 4');
    }
    const freeAt = Array.from({ length: W }, () => 0);
    const jobs: Job[] = [];
    for (let arrived = 0; arrived < WINDOW_MS; arrived += ARRIVAL_MS) {
        let worker = 0;
        for (let i = 1; i < W; i += 1) {
            if (freeAt[i] < freeAt[worker]) worker = i;
        }
        if (freeAt[worker] > arrived) {
            jobs.push({ arrivedMs: arrived, startedMs: null, finishedMs: null, worker: null });
            continue;
        }
        const finished = arrived + S;
        freeAt[worker] = finished;
        jobs.push({ arrivedMs: arrived, startedMs: arrived, finishedMs: finished, worker });
    }
    const completions = jobs.filter((job) => job.finishedMs !== null && job.finishedMs <= WINDOW_MS).length;
    return { serviceMs: S, workers: W, jobs, firstFinishMs: S, completions };
}

/**
 * Fraction of this job's service elapsed at t, from 0 at the start to 1 at the finish.
 * Null when the job never started. This is the piece's place along its bed.
 */
export function along(job: Job, t: number): number | null {
    if (job.startedMs === null || job.finishedMs === null) return null;
    if (t <= job.startedMs) return 0;
    if (t >= job.finishedMs) return 1;
    return (t - job.startedMs) / (job.finishedMs - job.startedMs);
}

/** True while the job has started and has not yet finished. At the finish instant it is in the tray. */
export function onBed(job: Job, t: number): boolean {
    return job.startedMs !== null && job.finishedMs !== null && t >= job.startedMs && t < job.finishedMs;
}

/** Jobs finished by t, and only those that finish inside the window. */
export function completionsAt(run: Run, t: number): number {
    return run.jobs.filter(
        (job) => job.finishedMs !== null && job.finishedMs <= t && job.finishedMs <= WINDOW_MS
    ).length;
}

/** Arrivals that would finish inside the window if a bed were free at that arrival. */
export function finishable(serviceMs: ServiceMs): number {
    let count = 0;
    for (let arrived = 0; arrived < WINDOW_MS; arrived += ARRIVAL_MS) {
        if (arrived + serviceMs <= WINDOW_MS) count += 1;
    }
    return count;
}

/**
 * Jobs per millisecond when one bed never sits idle. Null when the bed waits for the next
 * arrival, and null when more than one bed is in use: 1/S is the one busy bed.
 */
export function busyRate(run: Run): number | null {
    if (run.workers !== 1) return null;
    if (run.completions * run.serviceMs !== WINDOW_MS) return null;
    return 1 / run.serviceMs;
}

/** Clock marks: the start, each finish inside the window, and the window's end. */
export function marksOf(run: Run): number[] {
    const marks = new Set<number>([0, WINDOW_MS]);
    for (const job of run.jobs) {
        if (job.finishedMs !== null && job.finishedMs <= WINDOW_MS) marks.add(job.finishedMs);
    }
    return [...marks].sort((a, b) => a - b);
}

export type Call = 'sooner' | 'more' | 'same';

/** What this run does to the first finish and the tray, compared with one bed at the same S. */
export function callOf(inputs: Inputs): Call {
    const run = serve(inputs);
    const one = serve({ serviceMs: inputs.serviceMs, workers: 1 });
    if (run.firstFinishMs < inputs.serviceMs) return 'sooner';
    if (run.completions > one.completions) return 'more';
    return 'same';
}
