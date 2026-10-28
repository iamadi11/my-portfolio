/**
 * Teaching model for one server and the row of jobs waiting for it.
 *
 * Little's 1961 abstract: L is the mean number of units in the system, W is the
 * mean time a unit spends in the system, 1/λ is the mean time between arrivals,
 * and L = λW when those means are finite. Sigman, Notes on Little's Law, §1.1
 * Theorem 1.1: if the arrival rate λ and the average sojourn w exist and are
 * finite, then the time-average number in the system l exists and l = λw.
 * §1.2 applies that to the waiting line as Q = λd. For a FIFO M/M/1 queue with
 * ρ = λ/μ below 1, §1.2 gives l = ρ/(1−ρ) and w = (1/μ)/(1−ρ), and reads the
 * sojourn as (1 + l) mean service times, the extra one being the job's own
 * service. The delay before service on this page is that sojourn minus one
 * mean service time. The row count rounds the mean number waiting. It is not
 * a sample from a simulation and not a measurement.
 *
 * 1. Inputs: an arrival rate below the service rate. The figure uses 5 or 9
 *    arrivals per second. The service rate stays 10 per second.
 * 2. State: utilisation, the two means in Little's relation, the mean delay
 *    before service, the mean number waiting, and the whole jobs in the row.
 * 3. Rules: steady state only while arrivals are slower than service. The
 *    sojourn is the M/M/1 formula. The number in the system is the arrival
 *    rate times that sojourn. The row count rounds the mean number waiting.
 * 4. Equations: ρ = λ/μ. W = 1/(μ − λ) = (1/μ)/(1 − ρ). L = λW. Service time
 *    is 1/μ. Delay before service d = W − 1/μ. Mean number waiting Q = λd.
 *    Jobs in the row = round(Q) to six decimal places, then to the nearest
 *    integer. Half rounds away from zero.
 * 5. Assumptions: 10 jobs finished per second, and the taught arrivals of 5
 *    and 9 per second. The learn sweep moves the arrival rate from 5 to 9.
 *    None of these rates was measured for this page.
 * 6. Outputs: the station fields, including `present`, the jobs in the row.
 * 7. Boundaries: at the low rate the row shows 1 job (mean waiting 0.5). At
 *    the high rate it shows 8 (mean waiting 8.1). An arrival rate at or above
 *    the service rate has no steady mean here.
 * 8. Deterministic. The same rates always return the same means.
 * 9. Limits: one server, Poisson arrivals, exponential service, infinite room,
 *    first-come first-served, and ρ below 1. Not a simulation. Not a trace.
 *    Little's relation does not by itself choose W. A second server or a
 *    finite row that turns jobs away is a different model.
 */

export const SERVICE_PER_S = 10;
export const LOW_ARRIVAL_PER_S = 5;
export const HIGH_ARRIVAL_PER_S = 9;

export const LOADS = ['low', 'high'] as const;
export type Load = (typeof LOADS)[number];
export type Call = 'short' | 'sharp';

export type Station = {
    /** λ, jobs per second. Assumed when it is one of the taught rates. */
    arrivalPerS: number;
    /** μ, jobs per second. Assumed. */
    servicePerS: number;
    /** ρ = λ/μ. Dimensionless. */
    utilisation: number;
    /** L, mean number of jobs in the system. */
    meanInSystem: number;
    /** W, mean seconds a job spends in the system. */
    timeInSystemS: number;
    /** 1/μ, mean seconds of service. */
    serviceTimeS: number;
    /** d = W − 1/μ, mean seconds waiting before service. */
    waitS: number;
    /** Q = λd, mean number of jobs waiting. */
    meanWaiting: number;
    /**
     * Whole jobs standing in the row. This is the moving mark: round(Q).
     * Deleting these jobs deletes the lesson.
     */
    present: number;
};

/** Nearest whole job. 0.5 becomes 1. A value that prints as 8.1 becomes 8. */
export function jobsPresent(meanWaiting: number): number {
    if (!Number.isFinite(meanWaiting) || meanWaiting < 0) {
        throw new Error('mean waiting must be a non-negative number');
    }
    return Math.round(Number(meanWaiting.toFixed(6)));
}

export function station(arrivalPerS: number, servicePerS: number = SERVICE_PER_S): Station {
    if (!Number.isFinite(arrivalPerS) || !Number.isFinite(servicePerS)) {
        throw new Error('rates must be finite');
    }
    if (servicePerS <= 0 || arrivalPerS <= 0) {
        throw new Error('rates must be positive');
    }
    if (arrivalPerS >= servicePerS) {
        throw new Error('steady state needs the arrival rate below the service rate');
    }
    const utilisation = arrivalPerS / servicePerS;
    const meanInSystem = utilisation / (1 - utilisation);
    const timeInSystemS = meanInSystem / arrivalPerS;
    const serviceTimeS = 1 / servicePerS;
    const waitS = timeInSystemS - serviceTimeS;
    const meanWaiting = arrivalPerS * waitS;
    return {
        arrivalPerS,
        servicePerS,
        utilisation,
        meanInSystem,
        timeInSystemS,
        serviceTimeS,
        waitS,
        meanWaiting,
        present: jobsPresent(meanWaiting),
    };
}

/** Learn clock. 0 is 5 arrivals per second. 1 is 9. Both ends are assumed. */
export function arrivalOf(u: number): number {
    if (!Number.isFinite(u) || u < 0 || u > 1) throw new Error('u is from 0 to 1');
    return LOW_ARRIVAL_PER_S + u * (HIGH_ARRIVAL_PER_S - LOW_ARRIVAL_PER_S);
}

export function loadArrival(load: Load): number {
    return load === 'low' ? LOW_ARRIVAL_PER_S : HIGH_ARRIVAL_PER_S;
}

/** The short row is the low rate. The sharp growth is the high rate. */
export function callOf(load: Load): Call {
    return load === 'low' ? 'short' : 'sharp';
}

/** Clock stops. The learn run and a high lab visit the short row, then the long one. */
export function marksOf(learn: boolean, load: Load): number[] {
    return learn || load === 'high' ? [0, 1] : [0];
}

export function endOf(learn: boolean, load: Load): number {
    return learn || load === 'high' ? 1 : 0;
}

export function formatMean(value: number): string {
    const rounded = Math.round(value * 1000) / 1000;
    return String(rounded);
}

export function formatSeconds(seconds: number): string {
    return `${formatMean(seconds)} s`;
}

export function formatUtil(utilisation: number): string {
    return formatMean(utilisation);
}
