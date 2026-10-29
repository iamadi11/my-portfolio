'use client';

import React, { useState } from 'react';

const FIELDS = [
    ['requirements', 'Requirements', 'Who uses this, which actions matter, and what must remain true?'],
    ['estimate', 'Workload estimate', 'State users, requests per second, object sizes and peak assumptions.'],
    [
        'paths',
        'Read and write paths',
        'Follow a request through each component. Identify the durable authority.',
    ],
    [
        'failure',
        'Failure and recovery',
        'Lose a dependency, delay a reply or repeat a request. What does the caller observe?',
    ],
    [
        'tradeoff',
        'Defended decision',
        'Compare alternatives, name the cost and state when your choice stops working.',
    ],
] as const;
export default function DesignWorksheet({
    question,
    challenge,
}: {
    question: string;
    challenge?: string;
}): React.JSX.Element {
    const [entries, setEntries] = useState<Record<string, string>>({});
    const ready = FIELDS.every(([id]) => (entries[id] ?? '').trim().length >= 20);
    return (
        <section className="ac-design" aria-labelledby="design-title">
            <p className="ln-kicker">Design studio · self-assessed</p>
            <h2 id="design-title">Defend a system, not a component list</h2>
            <p>{question}</p>
            {challenge && (
                <p>
                    <strong>Design challenge:</strong> {challenge}
                </p>
            )}
            {FIELDS.map(([id, title, hint]) => (
                <label key={id}>
                    {title}
                    <span>{hint}</span>
                    <textarea
                        rows={3}
                        value={entries[id] ?? ''}
                        onChange={(event) => setEntries({ ...entries, [id]: event.target.value })}
                    />
                </label>
            ))}
            {ready ? (
                <details className="ln-watch-depth">
                    <summary>Challenge this design</summary>
                    <ul>
                        <li>Can each claimed guarantee be traced to the component that enforces it?</li>
                        <li>Does the workload fit the chosen capacity, and what saturates first?</li>
                        <li>Could an uncertain response produce a duplicate effect?</li>
                        <li>Which assumption would make a simpler design better?</li>
                    </ul>
                    <p>These prompts support your review; they do not certify the design.</p>
                </details>
            ) : (
                <p className="al-hint">
                    Write a concrete answer in each area to reveal the challenge rubric. This draft stays in
                    memory and is not uploaded.
                </p>
            )}
        </section>
    );
}
