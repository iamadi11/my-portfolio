'use client';

import React, { useMemo, useState } from 'react';

import type { Blueprint, RecallQuestion } from '@/content/learn/academy';
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
                ? makeExperimentFilm(`${lesson.id}-experiment`, lesson.question, lesson.rule, lesson.model, {
                      amount: run.amount,
                      alternative: run.alternative,
                  })
                : null,
        [lesson, run]
    );
    return (
        <section className="al-lab" aria-labelledby="academy-lab-title">
            <p className="ln-kicker">Predict → run → explain</p>
            <h2 id="academy-lab-title">Change the mechanism</h2>
            <p>{lesson.question}</p>
            <div className="al-inputs">
                <label>
                    {spec.label}
                    <input
                        type="range"
                        min={spec.min}
                        max={spec.max}
                        value={amount}
                        onChange={(event) => {
                            setAmount(Number(event.target.value));
                            clear();
                        }}
                    />
                    <output>{amount}</output>
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
                            name={`predict-${lesson.id}`}
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
export function AcademyQuiz({
    id,
    questions,
}: {
    id: string;
    questions: RecallQuestion[];
}): React.JSX.Element {
    const [answers, setAnswers] = useState<Record<number, number>>({}),
        [submitted, setSubmitted] = useState(false),
        [reflection, setReflection] = useState('');
    const allAnswered = questions.every((_, i) => answers[i] !== undefined);
    return (
        <section className="al-lab" aria-labelledby="academy-quiz-title">
            <p className="ln-kicker">Recall, then transfer</p>
            <h2 id="academy-quiz-title">Check your reasoning</h2>
            {questions.map((question, index) => (
                <fieldset key={question.chapter}>
                    <legend>{question.prompt}</legend>
                    {question.choices.map((choice, i) => (
                        <label key={choice}>
                            <input
                                type="radio"
                                name={`recall-${id}-${index}`}
                                checked={answers[index] === i}
                                onChange={() => {
                                    setAnswers({ ...answers, [index]: i });
                                    setSubmitted(false);
                                }}
                            />
                            {choice}
                        </label>
                    ))}
                    {submitted && (
                        <p className="al-feedback" role="status">
                            <strong>
                                {answers[index] === question.correct
                                    ? 'Correct.'
                                    : 'Reconsider the assumption.'}
                            </strong>{' '}
                            {question.explanation}
                        </p>
                    )}
                </fieldset>
            ))}
            <button
                type="button"
                className="al-run"
                disabled={!allAnswered}
                onClick={() => {
                    setSubmitted(true);
                    if (questions.every((q, i) => answers[i] === q.correct)) remember('recalled', id);
                }}
            >
                Check my reasoning
            </button>
            <label className="ac-reflection">
                Transfer the idea: what would change if a dependency failed or the workload doubled?
                <textarea
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                    rows={4}
                    placeholder="Name the changed assumption, the affected state, and a tradeoff."
                />
            </label>
            {reflection.trim().length > 20 && (
                <details className="ln-watch-depth">
                    <summary>Compare with the reflection guide</summary>
                    <p>
                        A useful explanation names the requirement, tracks the affected state, predicts an
                        observable result and states a limitation. This reflection is self-assessed; the
                        course does not claim to grade an open design automatically.
                    </p>
                </details>
            )}
        </section>
    );
}
