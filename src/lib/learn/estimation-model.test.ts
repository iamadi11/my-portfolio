import { describe, expect, it } from 'vitest';

import {
    LEARN_ASSUMPTIONS,
    LEARN_ESTIMATE,
    MAX_PLATES,
    PAN_FLOOR_Z,
    PLATE_GAP,
    PLATE_THICKNESS,
    REQUEST_PLATE,
    SCALE_TICKS,
    SECONDS_PER_DAY,
    SIZE_ASSUMPTIONS,
    STORAGE_PLATE_BYTES,
    USERS_ASSUMPTIONS,
    WIRE_PLATE_BYTES_PER_SECOND,
    assumptionLine,
    assumptionsFor,
    plateUnitLine,
    estimate,
    expectedPrediction,
    formatInteger,
    judge,
    knobLabel,
    maxPlates,
    movedQuantities,
    outcomeText,
    plateMarks,
    plateZ,
    secondsWrittenInTheWorkbook,
    stackCaption,
    stackTop,
    visiblePlates,
} from './estimation-model';

describe('estimation', () => {
    it('defines a day as 24 × 60 × 60, the same integer the workbook writes as 8.64×10^4', () => {
        expect(SECONDS_PER_DAY).toBe(24 * 60 * 60);
        expect(SECONDS_PER_DAY).toBe(86_400);
        expect(secondsWrittenInTheWorkbook()).toBe(SECONDS_PER_DAY);
        expect(secondsWrittenInTheWorkbook()).toBe(864 * 10 ** 2);
    });

    it('computes the learn notebook as 2 requests per second, 86,400,000 bytes stored, and 1,000 bytes per second', () => {
        expect(LEARN_ESTIMATE.requestsPerSecond).toBe(2);
        expect(LEARN_ESTIMATE.bytesStored).toBe(86_400_000);
        expect(LEARN_ESTIMATE.bytesPerSecond).toBe(1000);
        expect(LEARN_ESTIMATE.requestPlates).toBe(2);
        expect(LEARN_ESTIMATE.storagePlates).toBe(8);
        expect(LEARN_ESTIMATE.wirePlates).toBe(5);
        expect(LEARN_ASSUMPTIONS.daysRetained).toBe(1);
    });

    it('keeps the three products equal to the multiplications, and the plates equal to those products over the units', () => {
        const value = LEARN_ESTIMATE;
        const input = LEARN_ASSUMPTIONS;
        expect(value.requestsPerSecond).toBe(
            (input.dailyActiveUsers * input.actionsPerUserPerDay) / SECONDS_PER_DAY
        );
        expect(value.bytesPerSecond).toBe(value.requestsPerSecond * input.bytesPerObject);
        expect(value.bytesStored).toBe(
            value.requestsPerSecond * SECONDS_PER_DAY * input.bytesPerObject * input.daysRetained
        );
        expect(value.requestPlates).toBe(value.requestsPerSecond / REQUEST_PLATE);
        expect(value.storagePlates).toBe(value.bytesStored / STORAGE_PLATE_BYTES);
        expect(value.wirePlates).toBe(value.bytesPerSecond / WIRE_PLATE_BYTES_PER_SECOND);
    });

    it('uses an assumed notebook, not the workbook exercise rates or its 2 KB record', () => {
        expect(LEARN_ASSUMPTIONS.dailyActiveUsers).not.toBe(500_000);
        expect(LEARN_ASSUMPTIONS.bytesPerObject).not.toBe(2000);
        expect(LEARN_ASSUMPTIONS.bytesPerObject).not.toBe(2 * 10 ** 3);
        expect(assumptionLine(LEARN_ASSUMPTIONS)).toContain('Assumed:');
        expect(assumptionLine(LEARN_ASSUMPTIONS)).toContain('not a measurement');
        expect(plateUnitLine()).toContain('assumed');
        expect(plateUnitLine()).toContain('10,800,000');
        expect(assumptionLine(LEARN_ASSUMPTIONS)).toContain('86,400');
    });

    it('doubles every product when daily active users double, and leaves requests per second still when only the object grows', () => {
        const users = estimate(USERS_ASSUMPTIONS);
        const size = estimate(SIZE_ASSUMPTIONS);
        expect(users.requestsPerSecond).toBe(LEARN_ESTIMATE.requestsPerSecond * 2);
        expect(users.bytesStored).toBe(LEARN_ESTIMATE.bytesStored * 2);
        expect(users.bytesPerSecond).toBe(LEARN_ESTIMATE.bytesPerSecond * 2);
        expect(users.requestPlates).toBe(4);
        expect(users.storagePlates).toBe(16);
        expect(users.wirePlates).toBe(10);
        expect(size.requestsPerSecond).toBe(LEARN_ESTIMATE.requestsPerSecond);
        expect(size.requestPlates).toBe(LEARN_ESTIMATE.requestPlates);
        expect(size.bytesStored).toBe(LEARN_ESTIMATE.bytesStored * 2);
        expect(size.bytesPerSecond).toBe(LEARN_ESTIMATE.bytesPerSecond * 2);
        expect(size.storagePlates).toBe(16);
        expect(size.wirePlates).toBe(10);
        expect(maxPlates(users)).toBe(MAX_PLATES);
        expect(maxPlates(size)).toBe(MAX_PLATES);
    });

    it('names which quantities move, and which prediction matches each knob', () => {
        const users = estimate(assumptionsFor('users'));
        const size = estimate(assumptionsFor('size'));
        expect(movedQuantities(LEARN_ESTIMATE, users)).toEqual(['requests', 'stored', 'wire']);
        expect(movedQuantities(LEARN_ESTIMATE, size)).toEqual(['stored', 'wire']);
        expect(expectedPrediction('users')).toBe('all');
        expect(expectedPrediction('size')).toBe('stored-wire');
        expect(judge('all', 'users')).toContain('every stack');
        expect(judge('requests', 'users')).toContain('All three change');
        expect(judge('stored-wire', 'size')).toContain('object size');
        expect(judge('all', 'size')).toContain('request count stays');
        expect(judge(null, 'users')).toBe('');
        expect(knobLabel('users')).toContain('assumed');
        expect(knobLabel('size')).toContain('assumed');
    });

    it('sets the stack top to the plate count, and stops a pan at its own field while a taller pan is still growing', () => {
        expect(plateZ(0)).toBe(PAN_FLOOR_Z);
        expect(plateZ(1)).toBe(PAN_FLOOR_Z + PLATE_THICKNESS + PLATE_GAP);
        expect(stackTop(0)).toBe(PAN_FLOOR_Z);
        expect(stackTop(2)).toBe(plateZ(1) + PLATE_THICKNESS);
        expect(stackTop(LEARN_ESTIMATE.storagePlates)).toBe(stackTop(8));
        expect(stackTop(8) - stackTop(2)).toBe(6 * (PLATE_THICKNESS + PLATE_GAP));
        expect(visiblePlates(2, 0)).toBe(0);
        expect(visiblePlates(2, 1)).toBe(1);
        expect(visiblePlates(2, 8)).toBe(2);
        expect(visiblePlates(8, 5)).toBe(5);
        expect(visiblePlates(LEARN_ESTIMATE.requestPlates, maxPlates(LEARN_ESTIMATE))).toBe(2);
        expect(visiblePlates(LEARN_ESTIMATE.storagePlates, maxPlates(LEARN_ESTIMATE))).toBe(8);
        expect(visiblePlates(LEARN_ESTIMATE.wirePlates, maxPlates(LEARN_ESTIMATE))).toBe(5);
        expect(plateMarks(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
        expect(SCALE_TICKS).toContain(LEARN_ESTIMATE.storagePlates);
        expect(stackTop(SCALE_TICKS[1])).toBe(stackTop(LEARN_ESTIMATE.storagePlates));
    });

    it('states the computed products and the plate counts in the caption, and the outcome of each knob', () => {
        const done = stackCaption(LEARN_ESTIMATE, maxPlates(LEARN_ESTIMATE));
        expect(done).toContain('Square pan 2 of 2 plates');
        expect(done).toContain('Round pan 8 of 8 plates');
        expect(done).toContain('Long pan 5 of 5 plates');
        expect(done).toContain('2 requests per second');
        expect(done).toContain('86,400,000 bytes stored');
        expect(done).toContain('1,000 bytes per second');
        expect(stackCaption(LEARN_ESTIMATE, 1)).toContain('Square pan 1 of 2 plates');
        const users = outcomeText('users');
        expect(users).toContain('8,640');
        expect(users).toContain('17,280');
        expect(users).toContain('assumed');
        expect(users).toContain(formatInteger(estimate(USERS_ASSUMPTIONS).bytesStored));
        const size = outcomeText('size');
        expect(size).toContain('stayed 2');
        expect(size).toContain('1,000');
        expect(size).toContain('assumed');
    });

    it('rejects a non-positive input and a daily count that would need a rounded rate', () => {
        expect(() => estimate({ ...LEARN_ASSUMPTIONS, dailyActiveUsers: 0 })).toThrow(/positive/);
        expect(() => estimate({ ...LEARN_ASSUMPTIONS, actionsPerUserPerDay: -1 })).toThrow(/positive/);
        expect(() => estimate({ ...LEARN_ASSUMPTIONS, bytesPerObject: 1.5 })).toThrow(/positive/);
        expect(() => estimate({ ...LEARN_ASSUMPTIONS, daysRetained: 0 })).toThrow(/positive/);
        expect(() => estimate({ ...LEARN_ASSUMPTIONS, dailyActiveUsers: 8641 })).toThrow(/evenly/);
        expect(() => visiblePlates(-1, 0)).toThrow(/whole number/);
        expect(() => stackTop(1.2)).toThrow(/whole number/);
        expect(() => plateMarks(-1)).toThrow(/whole number/);
    });
});
