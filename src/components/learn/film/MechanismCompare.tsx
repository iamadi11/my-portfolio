'use client';

import React, { useState } from 'react';

import type { LessonFilmData } from '@/lib/learn/film-model';

import LessonFilm from './LessonFilm';

type Example = {
    film: LessonFilmData;
    outcome: string;
    explanation: string;
    metrics: { label: string; value: string }[];
};
export default function MechanismCompare({
    modes,
    examples,
    bundled = false,
}: {
    modes: [string, string];
    bundled?: boolean;
    examples: [Example, Example];
}): React.JSX.Element {
    const [choice, setChoice] = useState(0);
    const example = examples[choice];
    return (
        <section className="mc-compare" aria-label="Compare worked examples">
            <div className="mc-intro">
                <p className="ln-kicker">
                    {bundled ? 'One workload · two design bundles' : 'One input · two conditions'}
                </p>
                <p>
                    {bundled
                        ? 'B changes both worker capacity and provider-key recovery. Compare their separate effects; this is not an isolated policy experiment.'
                        : 'Follow the state. Compare what changes and what stays true.'}
                </p>
            </div>
            <div className="mc-options" role="group" aria-label="Worked example condition">
                {modes.map((mode, i) => (
                    <button type="button" key={mode} aria-pressed={choice === i} onClick={() => setChoice(i)}>
                        <span>{i ? 'B' : 'A'}</span>
                        {mode}
                    </button>
                ))}
            </div>
            <LessonFilm key={choice} film={example.film} />
            <details className="ln-watch-depth">
                <summary>Explain this result · {example.outcome}</summary>
                <p>{example.explanation}</p>
                <dl className="ac-metrics">
                    {example.metrics.map((metric) => (
                        <div key={metric.label}>
                            <dt>{metric.label}</dt>
                            <dd>{metric.value}</dd>
                        </div>
                    ))}
                </dl>
            </details>
        </section>
    );
}
