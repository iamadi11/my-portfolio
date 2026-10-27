/**
 * A sketch of the idea behind one resume line (SITE.practice.experience, Cashfree Payments): "a schema-driven ...
 * fraud rule engine that lets merchants configure transaction-blocking rules at runtime, with no redeploys."
 * Written for this site. It is NOT Cashfree's code, UI, rules or data: the fields, operators and the eight sample
 * transactions below are made up to show the idea. The form is generated from SCHEMA; nothing is hard-coded per field.
 */

export type Op = '>' | '≥' | '<' | '=' | '≠';
export type Action = 'BLOCK' | 'REVIEW';
export type Verdict = Action | 'ALLOW';

type NumberField = {
    type: 'number';
    title: string;
    short: string;
    ops: Op[];
    default: number;
    minimum: number;
};
type EnumField = { type: 'enum'; title: string; short: string; ops: Op[]; enum: string[]; default: string };
export type Field = NumberField | EnumField;

export const SCHEMA = {
    $id: 'rule.sketch',
    properties: {
        amount: {
            type: 'number',
            title: 'Amount',
            short: 'Amount',
            ops: ['>', '≥', '<'],
            default: 50000,
            minimum: 0,
        },
        country: {
            type: 'enum',
            title: 'Country',
            short: 'Country',
            ops: ['=', '≠'],
            enum: ['IN', 'US', 'GB', 'SG', 'AE'],
            default: 'IN',
        },
        attempts: {
            type: 'number',
            title: 'Attempts in 10 min',
            short: 'Tries/10 min',
            ops: ['>', '≥', '<'],
            default: 5,
            minimum: 0,
        },
        binRisk: {
            type: 'enum',
            title: 'Card BIN risk',
            short: 'BIN risk',
            ops: ['=', '≠'],
            enum: ['low', 'medium', 'high'],
            default: 'high',
        },
    } satisfies Record<string, Field>,
    actions: ['BLOCK', 'REVIEW'] as Action[],
};

export type FieldKey = keyof typeof SCHEMA.properties;
export const FIELD_KEYS = Object.keys(SCHEMA.properties) as FieldKey[];
export const field = (k: FieldKey): Field => SCHEMA.properties[k] as Field;

export type Rule = { id: number; field: FieldKey; op: Op; value: string; action: Action };
export type Tx = { id: string; amount: number; country: string; attempts: number; binRisk: string };

/** Made-up sample transactions. */
export const TXS: Tx[] = [
    { id: 'T1', amount: 1200, country: 'IN', attempts: 1, binRisk: 'low' },
    { id: 'T2', amount: 75000, country: 'IN', attempts: 1, binRisk: 'low' },
    { id: 'T3', amount: 3400, country: 'US', attempts: 7, binRisk: 'medium' },
    { id: 'T4', amount: 999, country: 'IN', attempts: 2, binRisk: 'high' },
    { id: 'T5', amount: 120000, country: 'SG', attempts: 9, binRisk: 'high' },
    { id: 'T6', amount: 15000, country: 'GB', attempts: 3, binRisk: 'medium' },
    { id: 'T7', amount: 52000, country: 'AE', attempts: 1, binRisk: 'low' },
    { id: 'T8', amount: 450, country: 'IN', attempts: 12, binRisk: 'low' },
];

export const START: Rule[] = [
    { id: 1, field: 'amount', op: '>', value: '50000', action: 'REVIEW' },
    { id: 2, field: 'attempts', op: '>', value: '5', action: 'BLOCK' },
];

const CMP: Record<Op, (x: number | string, y: number | string) => boolean> = {
    '>': (x, y) => x > y,
    '≥': (x, y) => x >= y,
    '<': (x, y) => x < y,
    '=': (x, y) => x === y,
    '≠': (x, y) => x !== y,
};

/** A number rule with an empty or invalid value matches nothing. */
function test(r: Rule, t: Tx): boolean {
    const num = field(r.field).type === 'number';
    const y = num ? Number(r.value) : r.value;
    if (num && (r.value.trim() === '' || !Number.isFinite(y))) return false;
    return CMP[r.op](t[r.field], y);
}

/** BLOCK beats REVIEW beats ALLOW; between rules of the same action, the higher one in the list wins. */
export function evaluate(rules: Rule[], t: Tx): { verdict: Verdict; rule?: Rule } {
    const hit = rules.filter((r) => test(r, t));
    const rule = hit.find((r) => r.action === 'BLOCK') ?? hit.find((r) => r.action === 'REVIEW');
    return rule ? { verdict: rule.action, rule } : { verdict: 'ALLOW' };
}
