'use client';

import React, { useId, useMemo, useState } from 'react';

import type { ApiLesson } from '@/content/learn/api-lessons';
import { experiment, type ExperimentResult } from '@/lib/learn/api-experiment';
import { apiExperimentFilm } from '@/lib/learn/api-experiment-film';
import { type LessonFilmData } from '@/lib/learn/film-model';

import Assessment from './Assessment';
import LessonFilm from './LessonFilm';
import Scene from './Scene';

export function ApiLab({ lesson, film }: { lesson: ApiLesson; film: LessonFilmData }): React.JSX.Element {
    const titleId = useId();
    const [variant, setVariant] = useState(lesson.variants[0][0]);
    const [amount, setAmount] = useState(3);
    const [guess, setGuess] = useState('');
    const [runNumber, setRunNumber] = useState(0);
    const [result, setResult] = useState<ExperimentResult | null>(null);
    const clear = () => {
        setGuess('');
        setResult(null);
    };
    const run = () => {
        setRunNumber((n) => n + 1);
        setResult(experiment(lesson.id, variant, amount));
    };
    const resultFilm = useMemo(
        () => (result ? apiExperimentFilm(film, lesson.id, variant, result) : null),
        [film, lesson.id, variant, result]
    );
    return (
        <section className="al-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Change one thing. Predict. Run.</p>
            <h2 id={titleId}>Try the mechanism yourself</h2>
            <div className="al-inputs">
                <label>
                    {lesson.inputLabel}
                    <select
                        value={variant}
                        onChange={(e) => {
                            setVariant(e.target.value);
                            clear();
                        }}
                    >
                        {lesson.variants.map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                {lesson.amountLabel && (
                    <label>
                        {lesson.amountLabel}
                        <input
                            type="range"
                            min="2"
                            max="5"
                            value={amount}
                            onChange={(e) => {
                                setAmount(Number(e.target.value));
                                clear();
                            }}
                        />
                        <output>{amount}</output>
                    </label>
                )}
            </div>
            <fieldset>
                <legend>Predict the outcome</legend>
                {lesson.answers.map((answer) => (
                    <label key={answer}>
                        <input
                            type="radio"
                            name={`guess-${titleId}`}
                            checked={guess === answer}
                            onChange={() => {
                                setGuess(answer);
                                setResult(null);
                            }}
                        />
                        {answer}
                    </label>
                ))}
            </fieldset>
            <button className="al-run" type="button" disabled={!guess} onClick={run}>
                Run experiment →
            </button>
            <button
                className="al-run"
                type="button"
                onClick={() => {
                    setVariant(lesson.variants[0][0]);
                    setAmount(3);
                    clear();
                }}
            >
                Reset experiment
            </button>
            {resultFilm ? (
                <LessonFilm key={runNumber} film={resultFilm} autoPlay trackProgress={false} />
            ) : (
                <div className="al-result-scene">
                    <Scene film={film} time={0} />
                </div>
            )}
            {result ? (
                <div className="al-feedback" role="status">
                    <strong>
                        {guess === result.answer ? 'Prediction matched.' : 'A different outcome.'}{' '}
                        {result.answer}.
                    </strong>
                    <p>{result.reason}</p>
                </div>
            ) : (
                <p className="al-hint">Commit to a prediction to reveal the result.</p>
            )}
            <p className="al-hint">Semantic teaching model. Example counts and times are assumptions.</p>
        </section>
    );
}
export function ApiQuiz({ lesson }: { lesson: ApiLesson }): React.JSX.Element {
    return (
        <Assessment
            id={lesson.id}
            questions={[
                {
                    chapter: lesson.id,
                    prompt: lesson.question,
                    choices: [lesson.choices[0], lesson.choices[1]],
                    correct: lesson.correct,
                    explanation: lesson.explanation,
                },
            ]}
        />
    );
}
