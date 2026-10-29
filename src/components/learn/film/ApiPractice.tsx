'use client';

import React, { useMemo, useRef, useState } from 'react';

import { useClock } from '@/components/learn/kit/useClock';
import type { ApiLesson } from '@/content/learn/api-lessons';
import { experiment, type ExperimentResult } from '@/lib/learn/api-experiment';
import { type LessonFilmData } from '@/lib/learn/film-model';

import Scene from './Scene';

export function ApiLab({ lesson, film }: { lesson: ApiLesson; film: LessonFilmData }): React.JSX.Element {
    const target = useRef<HTMLElement>(null);
    const marks = useMemo(() => [0, 5], []);
    const clock = useClock({ marks, end: 5, target, rate: 1.5 });
    const [variant, setVariant] = useState(lesson.variants[0][0]);
    const [amount, setAmount] = useState(3);
    const [guess, setGuess] = useState('');
    const [result, setResult] = useState<ExperimentResult | null>(null);
    const clear = () => {
        clock.reset();
        setGuess('');
        setResult(null);
    };
    const run = () => {
        setResult(experiment(lesson.id, variant, amount));
        clock.restart();
    };
    const resultFilm: LessonFilmData = result
        ? {
              ...film,
              nodes: film.nodes.map((node) =>
                  lesson.id === 'rest' && node.id === 'd' && variant === 'POST'
                      ? { ...node, label: 'Notes collection' }
                      : node
              ),
              beats: [
                  {
                      title: 'Your experiment',
                      caption: result.reason,
                      from: lesson.id === 'realtime' && variant === 'feed' ? 's' : 'c',
                      to: lesson.id === 'realtime' && variant === 'feed' ? 'c' : 's',
                      packet: result.value,
                      lost: result.failed,
                      states: {
                          s: result.failed ? 'failed' : 'done',
                          d: 'done',
                          c: result.failed ? 'failed' : 'done',
                      },
                      values: { s: result.value },
                      counts: { d: result.count, p: result.count },
                  },
              ],
          }
        : film;
    return (
        <section ref={target} className="al-lab" aria-labelledby="experiment-title">
            <p className="ln-kicker">Change one thing. Predict. Run.</p>
            <h2 id="experiment-title">Try the mechanism yourself</h2>
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
                            name={`guess-${lesson.id}`}
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
            <div className="al-result-scene">
                <Scene film={resultFilm} time={result ? (clock.reduced ? 5 : clock.t) : 0} />
            </div>
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
    const [choice, setChoice] = useState<number | null>(null);
    return (
        <section className="al-lab" aria-labelledby="quiz-title">
            <p className="ln-kicker">Make the idea stick</p>
            <h2 id="quiz-title">Use what you learned</h2>
            <fieldset>
                <legend>{lesson.question}</legend>
                {lesson.choices.map((text, i) => (
                    <label key={text}>
                        <input
                            type="radio"
                            name={`quiz-${lesson.id}`}
                            checked={choice === i}
                            onChange={() => setChoice(i)}
                        />
                        {text}
                    </label>
                ))}
            </fieldset>
            {choice !== null && (
                <p className="al-feedback" role="status">
                    <strong>{choice === lesson.correct ? 'Correct.' : 'Try that assumption again.'}</strong>{' '}
                    {lesson.explanation}
                </p>
            )}
        </section>
    );
}
