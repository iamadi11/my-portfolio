/**
 * Teaching model for one back-of-envelope estimate. Three products, each a
 * multiplication of labelled assumptions. The pans of the scale hold plates.
 * A pan's plate count is that product divided by the pan's plate unit, so the
 * stack height is the model field.
 *
 * Method read from the Google SRE workbook, chapter 12, "Introducing
 * Non-Abstract Large System Design" (https://sre.google/workbook/non-abstract-design/,
 * fetched 2026-10-29): state the assumptions, then multiply. A 24-hour volume
 * is a rate, times 8.64×10^4 seconds/day, times bytes per record. Bytes on the
 * wire are a rate times bytes per record. This file does not copy that
 * exercise's rates or its record size. Those stay in the source note.
 *
 * 1. Inputs: daily active users, actions per user per day, bytes per object,
 *    days retained. Every one of them is assumed. The plate units are assumed
 *    too. None of them was measured for this page.
 * 2. State: the three products and the three plate counts.
 * 3. Rules: requests in a day, divided by the seconds in a day, are requests
 *    per second. Bytes stored are that rate, times the seconds in a day, times
 *    the bytes in one object, times the days retained. Bytes per second are
 *    the rate times the bytes in one object.
 * 4. Equations: requestsPerSecond = users × actions / SECONDS_PER_DAY.
 *    bytesStored = requestsPerSecond × SECONDS_PER_DAY × bytesPerObject × days.
 *    bytesPerSecond = requestsPerSecond × bytesPerObject.
 *    plates = product / plate unit, exact, no rounding.
 * 5. Assumptions: the notebook below is not a company. A day is 24×60×60
 *    seconds. That is the definition used here, not a measurement. The workbook
 *    writes the same count as 8.64×10^4 seconds/day for a 24-hour period.
 *    8.64×10^4 = 864×10^2 = 86,400.
 * 6. Outputs: requests per second, bytes stored, bytes per second, and the
 *    plate count of each pan.
 * 7. Boundaries: inputs are positive whole numbers. The day's requests must
 *    divide SECONDS_PER_DAY, and each product must divide its plate unit, so
 *    a plate is never a rounded stand-in. A non-positive input is rejected.
 * 8. Deterministic. Same assumptions, same products.
 * 9. Limits: not a trace of a running service. Not the workbook's AdWords
 *    rates. Not a disk's IOPS, not a machine count, not a queue, and not
 *    Little's law. Days retained is 1 in the published cases, one 24-hour
 *    period, the span that chapter multiplies. The plate units exist so the
 *    pans can hold an integer stack. They are not disk sizes.
 */

export const SECONDS_PER_DAY = 24 * 60 * 60;

/** 8.64×10^4 as the integer 864×10^2. The workbook writes 8.64×10^4 seconds/day. */
export function secondsWrittenInTheWorkbook(): number {
    return 864 * 10 ** 2;
}

/** Assumed instrument units. One plate stands for this much of that product. */
export const REQUEST_PLATE = 1;
export const STORAGE_PLATE_BYTES = 10_800_000;
export const WIRE_PLATE_BYTES_PER_SECOND = 200;

/** World height of one plate, and the gap between plates. The pan floor is z. */
export const PLATE_THICKNESS = 3;
export const PLATE_GAP = 0.5;
export const PAN_FLOOR_Z = 16;

/** Tick ledges on the back post, in plates. The top tick is the tallest stack this scale holds. */
export const SCALE_TICKS = [4, 8, 12, 16] as const;
export const MAX_PLATES = 16;

export interface Assumptions {
    dailyActiveUsers: number;
    actionsPerUserPerDay: number;
    bytesPerObject: number;
    daysRetained: number;
}

/** A class notebook. Not a company, and not the workbook's exercise. */
export const LEARN_ASSUMPTIONS: Assumptions = {
    dailyActiveUsers: 8640,
    actionsPerUserPerDay: 20,
    bytesPerObject: 500,
    daysRetained: 1,
};

export const USERS_ASSUMPTIONS: Assumptions = { ...LEARN_ASSUMPTIONS, dailyActiveUsers: 17_280 };
export const SIZE_ASSUMPTIONS: Assumptions = { ...LEARN_ASSUMPTIONS, bytesPerObject: 1000 };

export interface Estimate {
    requestsPerSecond: number;
    bytesStored: number;
    bytesPerSecond: number;
    requestPlates: number;
    storagePlates: number;
    wirePlates: number;
}

export const KNOBS = ['users', 'size'] as const;
export type Knob = (typeof KNOBS)[number];

export const PREDICTIONS = ['requests', 'stored', 'wire', 'stored-wire', 'all'] as const;
export type PredictionId = (typeof PREDICTIONS)[number];

export type QuantityId = 'requests' | 'stored' | 'wire';

function positiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive whole number`);
    }
}

function divideExact(numerator: number, denominator: number, name: string): number {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) {
        throw new Error(`${name} must divide evenly`);
    }
    if (numerator % denominator !== 0) {
        throw new Error(`${name} must divide evenly`);
    }
    return numerator / denominator;
}

export function assumptionsFor(knob: Knob): Assumptions {
    return knob === 'users' ? USERS_ASSUMPTIONS : SIZE_ASSUMPTIONS;
}

export function estimate(input: Assumptions): Estimate {
    positiveInteger(input.dailyActiveUsers, 'daily active users');
    positiveInteger(input.actionsPerUserPerDay, 'actions per user per day');
    positiveInteger(input.bytesPerObject, 'bytes per object');
    positiveInteger(input.daysRetained, 'days retained');
    const requestsPerDay = input.dailyActiveUsers * input.actionsPerUserPerDay;
    const requestsPerSecond = divideExact(requestsPerDay, SECONDS_PER_DAY, 'requests in a day');
    const bytesPerSecond = requestsPerSecond * input.bytesPerObject;
    const bytesStored = bytesPerSecond * SECONDS_PER_DAY * input.daysRetained;
    return {
        requestsPerSecond,
        bytesStored,
        bytesPerSecond,
        requestPlates: divideExact(requestsPerSecond, REQUEST_PLATE, 'request plates'),
        storagePlates: divideExact(bytesStored, STORAGE_PLATE_BYTES, 'storage plates'),
        wirePlates: divideExact(bytesPerSecond, WIRE_PLATE_BYTES_PER_SECOND, 'wire plates'),
    };
}

export const LEARN_ESTIMATE = estimate(LEARN_ASSUMPTIONS);

export function maxPlates(value: Estimate): number {
    return Math.max(value.requestPlates, value.storagePlates, value.wirePlates);
}

export function plateMarks(end: number): number[] {
    if (!Number.isInteger(end) || end < 0) throw new Error('plate step must be a whole number');
    return Array.from({ length: end + 1 }, (_, index) => index);
}

/** Plates drawn for one pan. The count stops at the model field. */
export function visiblePlates(field: number, step: number): number {
    if (!Number.isInteger(field) || field < 0) throw new Error('plate field must be a whole number');
    if (!Number.isInteger(step) || step < 0) throw new Error('plate step must be a whole number');
    return Math.min(step, field);
}

/** Bottom of plate `index` (0 is the lowest plate on the pan). */
export function plateZ(index: number): number {
    if (!Number.isInteger(index) || index < 0) throw new Error('plate index must be a whole number');
    return PAN_FLOOR_Z + index * (PLATE_THICKNESS + PLATE_GAP);
}

/** Top of a stack of `count` plates. An empty pan stays at the floor. */
export function stackTop(count: number): number {
    if (!Number.isInteger(count) || count < 0) throw new Error('plate count must be a whole number');
    if (count === 0) return PAN_FLOOR_Z;
    return plateZ(count - 1) + PLATE_THICKNESS;
}

export function movedQuantities(before: Estimate, after: Estimate): QuantityId[] {
    const moved: QuantityId[] = [];
    if (before.requestsPerSecond !== after.requestsPerSecond) moved.push('requests');
    if (before.bytesStored !== after.bytesStored) moved.push('stored');
    if (before.bytesPerSecond !== after.bytesPerSecond) moved.push('wire');
    return moved;
}

export function expectedPrediction(knob: Knob): PredictionId {
    return knob === 'users' ? 'all' : 'stored-wire';
}

const PREDICTION_LABEL: Record<PredictionId, string> = {
    requests: 'Only requests per second',
    stored: 'Only bytes stored',
    wire: 'Only bytes per second',
    'stored-wire': 'Bytes stored and bytes per second',
    all: 'All three',
};

export function predictionLabel(id: PredictionId): string {
    return PREDICTION_LABEL[id];
}

export function knobLabel(knob: Knob): string {
    if (knob === 'users') return 'Daily active users, 8,640 to 17,280, assumed';
    return 'Object size, 500 bytes to 1,000, assumed';
}

export function formatInteger(value: number): string {
    const sign = value < 0 ? '-' : '';
    const digits = Math.abs(Math.trunc(value)).toString();
    return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function plateUnitLine(): string {
    return `Plate units, assumed: ${formatInteger(REQUEST_PLATE)} request per second, ${formatInteger(STORAGE_PLATE_BYTES)} bytes, and ${formatInteger(WIRE_PLATE_BYTES_PER_SECOND)} bytes per second. Each plate count is that product divided by its unit.`;
}

export function assumptionLine(input: Assumptions): string {
    const days = input.daysRetained === 1 ? '1 day' : `${formatInteger(input.daysRetained)} days`;
    return `Assumed: ${formatInteger(input.dailyActiveUsers)} daily active users, ${formatInteger(input.actionsPerUserPerDay)} actions per user per day, ${formatInteger(input.bytesPerObject)} bytes per object, kept ${days}. A day is ${formatInteger(SECONDS_PER_DAY)} seconds, from 24 × 60 × 60, not a measurement.`;
}

export function stackCaption(value: Estimate, step: number): string {
    const requests = visiblePlates(value.requestPlates, step);
    const stored = visiblePlates(value.storagePlates, step);
    const wire = visiblePlates(value.wirePlates, step);
    return `Square pan ${requests} of ${value.requestPlates} plates. Round pan ${stored} of ${value.storagePlates} plates. Long pan ${wire} of ${value.wirePlates} plates. Computed: ${formatInteger(value.requestsPerSecond)} requests per second, ${formatInteger(value.bytesStored)} bytes stored, ${formatInteger(value.bytesPerSecond)} bytes per second.`;
}

export function outcomeText(knob: Knob): string {
    const before = LEARN_ESTIMATE;
    const after = estimate(assumptionsFor(knob));
    if (knob === 'users') {
        return `Daily active users changed from ${formatInteger(LEARN_ASSUMPTIONS.dailyActiveUsers)} to ${formatInteger(USERS_ASSUMPTIONS.dailyActiveUsers)}, both assumed. Requests per second went from ${formatInteger(before.requestsPerSecond)} to ${formatInteger(after.requestsPerSecond)}, because the actions in a day doubled and the day is still ${formatInteger(SECONDS_PER_DAY)} seconds. Bytes stored went from ${formatInteger(before.bytesStored)} to ${formatInteger(after.bytesStored)}, and bytes per second from ${formatInteger(before.bytesPerSecond)} to ${formatInteger(after.bytesPerSecond)}. The object stayed ${formatInteger(LEARN_ASSUMPTIONS.bytesPerObject)} bytes, assumed.`;
    }
    return `Object size changed from ${formatInteger(LEARN_ASSUMPTIONS.bytesPerObject)} bytes to ${formatInteger(SIZE_ASSUMPTIONS.bytesPerObject)} bytes, both assumed. Requests per second stayed ${formatInteger(after.requestsPerSecond)}: the object size is not in that quotient. Bytes stored went from ${formatInteger(before.bytesStored)} to ${formatInteger(after.bytesStored)}, and bytes per second from ${formatInteger(before.bytesPerSecond)} to ${formatInteger(after.bytesPerSecond)}.`;
}

export function judge(guess: PredictionId | null, knob: Knob): string {
    if (guess === null) return '';
    const right = expectedPrediction(knob);
    if (guess === right) {
        return knob === 'users'
            ? 'All three products include the actions in a day, and that count includes the users, so every stack changes height.'
            : 'Requests per second do not include the object size. Bytes stored and bytes per second do, so those two stacks change height.';
    }
    return knob === 'users'
        ? 'All three change. Each product multiplies by the actions in a day, and that count multiplies by the users.'
        : 'The request count stays. Only the products that multiply by the object size change height.';
}
