'use client';

import React, { useId, useMemo, useState } from 'react';

import type { Blueprint } from '@/content/learn/academy';
import { makeExperimentFilm, MECHANISMS, simulateMechanism, type Trace } from '@/lib/learn/experiment-model';

import LessonFilm from './LessonFilm';

function remember(kind: string, id: string): void {
    try {
        localStorage.setItem(`learn-${kind}:${id}`, '1');
        window.dispatchEvent(new Event('learn-progress'));
    } catch {
        /* Optional device-local state. */
    }
}
export function AcademyLab({ lesson }: { lesson: Blueprint }): React.JSX.Element {
    const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const titleId = `academy-lab-${lesson.id}-${lesson.model}-${instance}`;
    const spec = MECHANISMS[lesson.model];
    const [amount, setAmount] = useState(spec.initial),
        [alternative, setAlternative] = useState(false),
        [guess, setGuess] = useState(''),
        [run, setRun] = useState<{ trace: Trace; amount: number; alternative: boolean; key: number } | null>(
            null
        );
    const clear = (): void => {
        setGuess('');
        setRun(null);
    };
    const film = useMemo(
        () =>
            run
                ? {
                      ...makeExperimentFilm(
                          `${lesson.id}-experiment`,
                          lesson.question,
                          lesson.rule,
                          lesson.model,
                          {
                              amount: run.amount,
                              alternative: run.alternative,
                          }
                      ),
                      id: `${lesson.id}-${lesson.model}-${instance}-experiment`,
                  }
                : null,
        [lesson, run, instance]
    );
    return (
        <section className="al-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Predict → run → explain</p>
            <h2 id={titleId}>Change the mechanism</h2>
            <p>{lesson.question}</p>
            <div className="al-inputs">
                <label htmlFor={`${titleId}-amount`}>
                    {spec.label}
                    <input
                        id={`${titleId}-amount`}
                        type="range"
                        min={spec.min}
                        max={spec.max}
                        value={amount}
                        onChange={(event) => {
                            setAmount(Number(event.target.value));
                            clear();
                        }}
                    />
                    <output htmlFor={`${titleId}-amount`}>{amount}</output>
                </label>
                <label>
                    Policy or condition
                    <select
                        value={alternative ? 'alternative' : 'baseline'}
                        onChange={(event) => {
                            setAlternative(event.target.value === 'alternative');
                            clear();
                        }}
                    >
                        {spec.modes.map((mode, index) => (
                            <option value={index ? 'alternative' : 'baseline'} key={mode}>
                                {mode}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <fieldset>
                <legend>Predict the model’s result before running</legend>
                {spec.predictions.map((prediction) => (
                    <label key={prediction}>
                        <input
                            type="radio"
                            name={`predict-${titleId}`}
                            checked={guess === prediction}
                            onChange={() => {
                                setGuess(prediction);
                                setRun(null);
                            }}
                        />
                        {prediction}
                    </label>
                ))}
            </fieldset>
            <button
                className="al-run"
                disabled={!guess}
                type="button"
                onClick={() => {
                    const trace = simulateMechanism(lesson.model, { amount, alternative });
                    setRun({ trace, amount, alternative, key: (run?.key ?? 0) + 1 });
                    remember('practiced', lesson.id);
                }}
            >
                Run experiment →
            </button>
            <button
                className="al-run"
                type="button"
                onClick={() => {
                    setAmount(spec.initial);
                    setAlternative(false);
                    clear();
                }}
            >
                Reset experiment
            </button>
            {run && film && (
                <>
                    <div className="al-feedback" role="status">
                        <strong>
                            {guess === run.trace.outcome ? 'Prediction matched.' : 'Compare your prediction.'}{' '}
                            {run.trace.outcome}.
                        </strong>
                        <p>{run.trace.explanation}</p>
                    </div>
                    <dl className="ac-metrics">
                        {run.trace.metrics.map((metric) => (
                            <div key={metric.label}>
                                <dt>{metric.label}</dt>
                                <dd>{metric.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <LessonFilm key={run.key} film={film} autoPlay trackProgress={false} />
                    <p className="ac-reflect">
                        Explain the change without the drawing: which component owned the state, and which
                        assumption changed?
                    </p>
                </>
            )}
            {!run && (
                <p className="al-hint">
                    The result and animation stay hidden until you commit to a prediction.
                </p>
            )}
            <p className="al-hint">
                Finite teaching model. Counts, costs and ticks are stated assumptions; read the chapter’s
                limits.
            </p>
        </section>
    );
}
export { default as AcademyQuiz } from './Assessment';
