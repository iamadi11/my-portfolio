import { describe, expect, it } from 'vitest';

import {
    HIGH_ARRIVAL_PER_S,
    LOW_ARRIVAL_PER_S,
    SERVICE_PER_S,
    arrivalOf,
    callOf,
    jobsPresent,
    loadArrival,
    station,
} from './utilisation-queueing-model';

describe('utilisation and Little’s law', () => {
    it('at 5 arrivals per second, L equals the arrival rate times the time in the system', () => {
        const low = station(LOW_ARRIVAL_PER_S);
        expect(low.servicePerS).toBe(SERVICE_PER_S);
        expect(low.utilisation).toBeCloseTo(0.5, 8);
        expect(low.meanInSystem).toBeCloseTo(1, 8);
        expect(low.timeInSystemS).toBeCloseTo(0.2, 8);
        expect(low.serviceTimeS).toBeCloseTo(0.1, 8);
        expect(low.waitS).toBeCloseTo(0.1, 8);
        expect(low.meanWaiting).toBeCloseTo(0.5, 8);
        expect(low.present).toBe(1);
        expect(low.meanInSystem).toBeCloseTo(low.arrivalPerS * low.timeInSystemS, 8);
        expect(low.meanWaiting).toBeCloseTo(low.arrivalPerS * low.waitS, 8);
    });

    it('at 9 arrivals per second, L equals the arrival rate times the time in the system', () => {
        const high = station(HIGH_ARRIVAL_PER_S);
        expect(high.utilisation).toBeCloseTo(0.9, 8);
        expect(high.meanInSystem).toBeCloseTo(9, 8);
        expect(high.timeInSystemS).toBeCloseTo(1, 8);
        expect(high.waitS).toBeCloseTo(0.9, 8);
        expect(high.meanWaiting).toBeCloseTo(8.1, 8);
        expect(high.present).toBe(8);
        expect(high.meanInSystem).toBeCloseTo(high.arrivalPerS * high.timeInSystemS, 8);
        expect(high.meanWaiting).toBeCloseTo(high.arrivalPerS * high.waitS, 8);
    });

    it('matches the M/M/1 sojourn (1/μ) / (1 − ρ) and 1 / (μ − λ)', () => {
        for (const arrival of [LOW_ARRIVAL_PER_S, HIGH_ARRIVAL_PER_S]) {
            const got = station(arrival);
            const rho = arrival / SERVICE_PER_S;
            expect(got.timeInSystemS).toBeCloseTo(1 / SERVICE_PER_S / (1 - rho), 8);
            expect(got.timeInSystemS).toBeCloseTo(1 / (SERVICE_PER_S - arrival), 8);
            expect(got.meanInSystem).toBeCloseTo(rho / (1 - rho), 8);
        }
    });

    it('the wait at high utilisation is larger, and the learn row grows from 1 job to 8', () => {
        const low = station(arrivalOf(0));
        const high = station(arrivalOf(1));
        expect(low.arrivalPerS).toBe(LOW_ARRIVAL_PER_S);
        expect(high.arrivalPerS).toBe(HIGH_ARRIVAL_PER_S);
        expect(high.timeInSystemS).toBeGreaterThan(low.timeInSystemS);
        expect(high.waitS).toBeGreaterThan(low.waitS);
        expect(high.meanWaiting).toBeGreaterThan(low.meanWaiting);
        expect(low.present).toBe(1);
        expect(high.present).toBe(8);
        expect(high.present).toBeGreaterThan(low.present);
    });

    it('halfway along the learn sweep the row is still short', () => {
        const mid = station(arrivalOf(0.5));
        expect(mid.arrivalPerS).toBeCloseTo(7, 8);
        expect(mid.utilisation).toBeCloseTo(0.7, 8);
        expect(mid.meanInSystem).toBeCloseTo(mid.arrivalPerS * mid.timeInSystemS, 8);
        expect(mid.present).toBe(2);
        expect(mid.present).toBeGreaterThan(station(arrivalOf(0)).present);
        expect(station(arrivalOf(1)).present).toBeGreaterThan(mid.present);
    });

    it('rounds a mean of 0.5 jobs waiting to 1 and a mean of 8.1 to 8', () => {
        expect(jobsPresent(0.5)).toBe(1);
        expect(jobsPresent(8.1)).toBe(8);
        expect(jobsPresent(0)).toBe(0);
    });

    it('has no steady mean when arrivals are at or above the service rate', () => {
        expect(() => station(SERVICE_PER_S)).toThrow(/arrival rate below the service rate/);
        expect(() => station(SERVICE_PER_S + 1)).toThrow(/arrival rate below the service rate/);
        expect(() => station(0)).toThrow(/positive/);
        expect(() => arrivalOf(-0.1)).toThrow(/0 to 1/);
    });

    it('calls the low rate a short wait and the high rate a sharp growth', () => {
        expect(loadArrival('low')).toBe(LOW_ARRIVAL_PER_S);
        expect(loadArrival('high')).toBe(HIGH_ARRIVAL_PER_S);
        expect(callOf('low')).toBe('short');
        expect(callOf('high')).toBe('sharp');
        expect(station(loadArrival('high')).waitS).toBeGreaterThan(station(loadArrival('low')).waitS);
    });
});
