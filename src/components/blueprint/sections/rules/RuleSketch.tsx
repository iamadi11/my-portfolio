'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';

import {
    evaluate,
    field,
    FIELD_KEYS,
    SCHEMA,
    START,
    TXS,
    type Action,
    type FieldKey,
    type Op,
    type Rule,
    type Tx,
    type Verdict,
} from './schema';

import './rules.css';

/**
 * Interactive sketch of a schema-driven rule engine (see schema.ts for what it is and is not). The rule form is
 * generated from SCHEMA; the eight made-up transactions re-evaluate on every change. "Deploys" stays 0 because
 * nothing here is ever deployed; "rule changes" counts the visitor's own edits.
 */

const fmt = new Intl.NumberFormat('en-US');

/** The schema as it would be written down: one line per field. */
const SCHEMA_TEXT = [
    '{',
    ...FIELD_KEYS.map((k) => {
        const f = field(k);
        const t = f.type === 'number' ? 'number' : `enum [${f.enum.join(', ')}]`;
        return `${k}: { ${t}, ops: [${f.ops.join(' ')}] }`;
    }),
    `action: [${SCHEMA.actions.join(', ')}]`,
    '}',
];

function fresh(id: number): Rule {
    const f = field('amount');
    return { id, field: 'amount', op: f.ops[0], value: String(f.default), action: 'REVIEW' };
}

function tally(counts: Record<string, number>): string {
    return `${counts.BLOCK} blocked, ${counts.REVIEW} review, ${counts.ALLOW} allowed`;
}

/** A labelled select; children are [value, text] pairs. */
function Pick({
    id,
    label,
    value,
    on,
    children,
}: {
    id: string;
    label: string;
    value: string;
    on: (v: string) => void;
    children: [string, string][];
}): React.JSX.Element {
    return (
        <label htmlFor={id}>
            <span className="rules-k">{label}</span>
            <select id={id} value={value} onChange={(e) => on(e.target.value)}>
                {children.map(([v, t]) => (
                    <option key={v} value={v}>
                        {t}
                    </option>
                ))}
            </select>
        </label>
    );
}

/** One rule, as a fieldset generated from the schema. */
function RuleRow({
    r,
    i,
    n,
    p,
    edit,
    setField,
    remove,
}: {
    r: Rule;
    i: number;
    n: number;
    p: string;
    edit: (id: number, patch: Partial<Rule>) => void;
    setField: (id: number, k: FieldKey) => void;
    remove: (id: number) => void;
}): React.JSX.Element {
    const f = field(r.field);
    const set = (patch: Partial<Rule>): void => edit(r.id, patch);
    return (
        <fieldset className="rules-rule">
            <legend>
                <span className="rules-box">R{r.id}</span>
                <span className="rules-sr">
                    {' '}
                    ({i + 1} of {n})
                </span>
            </legend>
            <Pick id={`${p}-f`} label="Field" value={r.field} on={(v) => setField(r.id, v as FieldKey)}>
                {FIELD_KEYS.map((k) => [k, field(k).title])}
            </Pick>
            <Pick id={`${p}-o`} label="Operator" value={r.op} on={(v) => set({ op: v as Op })}>
                {f.ops.map((o) => [o, o])}
            </Pick>
            {f.type === 'number' ? (
                <label htmlFor={`${p}-v`}>
                    <span className="rules-k">Value</span>
                    <input
                        id={`${p}-v`}
                        type="number"
                        inputMode="numeric"
                        min={f.minimum}
                        value={r.value}
                        onChange={(e) => set({ value: e.target.value })}
                    />
                </label>
            ) : (
                <Pick id={`${p}-v`} label="Value" value={r.value} on={(v) => set({ value: v })}>
                    {f.enum.map((v) => [v, v])}
                </Pick>
            )}
            <Pick id={`${p}-a`} label="Action" value={r.action} on={(v) => set({ action: v as Action })}>
                {SCHEMA.actions.map((a) => [a, a])}
            </Pick>
            <button
                type="button"
                className="rules-btn rules-del"
                onClick={() => remove(r.id)}
                aria-label={`Remove rule R${r.id}`}
            >
                Remove
            </button>
        </fieldset>
    );
}

type Result = { t: Tx; verdict: Verdict; rule?: Rule };

/** The sample transactions as a ruled table: verdict and matching rule first, then one column per schema field. */
function Results({ results }: { results: Result[] }): React.JSX.Element {
    return (
        <>
            <p className="rules-hint" aria-hidden="true">
                Table scrolls sideways →
            </p>
            <div className="rules-scroll" role="region" aria-label="Sample transactions" tabIndex={0}>
                <table className="rules-table">
                    <caption>Made-up transactions · live</caption>
                    <thead>
                        <tr>
                            <th scope="col">Tx</th>
                            <th scope="col">Result</th>
                            <th scope="col">Rule</th>
                            {FIELD_KEYS.map((k) => (
                                <th
                                    key={k}
                                    scope="col"
                                    className={field(k).type === 'number' ? 'rules-n' : ''}
                                >
                                    {field(k).short}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(({ t, verdict, rule }) => (
                            <tr key={t.id}>
                                <th scope="row">{t.id}</th>
                                <td className={`rules-v rules-v-${verdict.toLowerCase()}`}>
                                    <span>{verdict}</span>
                                </td>
                                <td>{rule ? `R${rule.id}` : '—'}</td>
                                {FIELD_KEYS.map((k) => {
                                    const v = t[k];
                                    return typeof v === 'number' ? (
                                        <td key={k} className="rules-n">
                                            {fmt.format(v)}
                                        </td>
                                    ) : (
                                        <td key={k}>{v}</td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/** The disclaimer, the schema that drives the form, and the two counters. */
function Head({ changes }: { changes: number }): React.JSX.Element {
    return (
        <>
            <p className="rules-cap">
                A sketch of the idea, written for this site: not Cashfree&apos;s code, rules or data. Sample
                transactions are made up.
            </p>

            <div className="rules-grid">
                <div className="rules-schema">
                    <p className="rules-k">Schema · drives the form</p>
                    <pre>
                        {SCHEMA_TEXT.map((l, i) => (
                            <span key={l} className={i && i < SCHEMA_TEXT.length - 1 ? 'rules-in' : ''}>
                                {l}
                            </span>
                        ))}
                    </pre>
                </div>

                <div className="rules-meter">
                    <p>
                        <span className="rules-k">Deploys</span> <span className="rules-box">0</span>
                    </p>
                    <p>
                        <span className="rules-k">Rule changes</span>{' '}
                        <span className="rules-box">{changes}</span>
                    </p>
                </div>
            </div>
        </>
    );
}

export default function RuleSketch(): React.JSX.Element {
    const uid = useId();
    const [rules, setRules] = useState<Rule[]>(START);
    const [next, setNext] = useState(START.length + 1);
    const [changes, setChanges] = useState(0);
    const [said, setSaid] = useState('');

    const results = useMemo(() => TXS.map((t) => ({ t, ...evaluate(rules, t) })), [rules]);
    const counts = useMemo(() => {
        const c: Record<string, number> = { BLOCK: 0, REVIEW: 0, ALLOW: 0 };
        results.forEach((r) => (c[r.verdict] += 1));
        return c;
    }, [results]);

    // Announce the outcome politely once the visitor pauses (not on first render).
    const summary = tally(counts);
    useEffect(() => {
        if (!changes) return undefined;
        const id = window.setTimeout(() => setSaid(summary), 450);
        return () => window.clearTimeout(id);
    }, [summary, changes]);

    const edit = (id: number, patch: Partial<Rule>): void => {
        setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
        setChanges((n) => n + 1);
    };
    const setField = (id: number, k: FieldKey): void => {
        const f = field(k);
        edit(id, { field: k, op: f.ops[0], value: String(f.default) });
    };
    const add = (): void => {
        setRules((rs) => [...rs, fresh(next)]);
        setNext((n) => n + 1);
        setChanges((n) => n + 1);
    };
    const remove = (id: number): void => {
        setRules((rs) => rs.filter((r) => r.id !== id));
        setChanges((n) => n + 1);
    };

    return (
        <div className="rules">
            <Head changes={changes} />

            <ol className="rules-list" aria-label="Rules">
                {rules.map((r, i) => (
                    <li key={r.id}>
                        <RuleRow
                            r={r}
                            i={i}
                            n={rules.length}
                            p={`${uid}-r${r.id}`}
                            edit={edit}
                            setField={setField}
                            remove={remove}
                        />
                    </li>
                ))}
            </ol>
            {rules.length ? null : <p className="rules-empty">No rules: every transaction is allowed.</p>}
            <button type="button" className="rules-btn rules-add" onClick={add}>
                + Add rule
            </button>

            <Results results={results} />
            <p className="rules-tally">
                <span className="rules-k">Total</span> {summary} · BLOCK beats REVIEW; the higher rule wins a
                tie
            </p>
            <p className="rules-sr" aria-live="polite">
                {said}
            </p>
        </div>
    );
}
