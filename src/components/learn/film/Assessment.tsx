'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

import Link from 'next/link';

import type { RecallQuestion } from '@/content/learn/academy';
import { gradeAssessment, type AssessmentResult } from '@/lib/learn/assessment';

function remember(id: string): void {
    try {
        localStorage.setItem(`learn-recalled:${id}`, '1');
        window.dispatchEvent(new Event('learn-progress'));
    } catch {
        /* Optional device-local progress. */
    }
}
export default function Assessment({
    id,
    questions,
}: {
    id: string;
    questions: RecallQuestion[];
}): React.JSX.Element {
    const instance = useId();
    const titleId = `academy-assessment-${instance}`;
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [reflection, setReflection] = useState('');
    const summary = useRef<HTMLHeadingElement>(null);
    const firstChoice = useRef<HTMLInputElement>(null);
    const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
    useEffect(() => {
        if (result) summary.current?.focus();
    }, [result]);
    const reset = (): void => {
        setAnswers({});
        setResult(null);
        setReflection('');
        firstChoice.current?.focus();
    };
    return (
        <section className="al-lab" aria-labelledby={titleId}>
            <p className="ln-kicker">Recall, then transfer</p>
            <h2 id={titleId}>Check your reasoning</h2>
            <p>
                Commit to every answer, then compare your reasoning with the model. Missed scenarios determine
                the suggested practice below.
            </p>
            {result && (
                <div className="al-feedback">
                    <h3 ref={summary} tabIndex={-1}>
                        {result.correct} of {result.total} answers matched
                    </h3>
                    <p>
                        {result.revisits.length
                            ? 'Review the assumptions behind the missed scenarios, then try another attempt.'
                            : 'All answers matched in this attempt. Use the transfer task to challenge the idea under a new assumption.'}{' '}
                        This score covers these questions; the open design response is self-assessed.
                    </p>
                </div>
            )}
            {questions.map((question, index) => {
                const feedback = result?.items[index];
                return (
                    <fieldset key={`${question.chapter}-${question.prompt}`}>
                        <legend>
                            {index + 1}. {question.prompt}
                        </legend>
                        {question.choices.map((choice, i) => (
                            <label key={choice}>
                                <input
                                    ref={index === 0 && i === 0 ? firstChoice : undefined}
                                    type="radio"
                                    name={`recall-${id}-${instance}-${index}`}
                                    checked={answers[index] === i}
                                    onChange={() => {
                                        setAnswers({ ...answers, [index]: i });
                                        setResult(null);
                                    }}
                                />
                                {choice}
                            </label>
                        ))}
                        {feedback && (
                            <div className="al-feedback">
                                <p>
                                    <strong>
                                        {feedback.matched ? 'Correct.' : 'Revisit this assumption.'}
                                    </strong>
                                </p>
                                <p>Your answer: {feedback.selected}</p>
                                {!feedback.matched && <p>Model result: {feedback.expected}</p>}
                                <p>{feedback.explanation}</p>
                            </div>
                        )}
                    </fieldset>
                );
            })}
            {questions.length === 0 && <p>No scored questions are available for this chapter.</p>}
            <div className="lf-main-controls">
                <button
                    type="button"
                    className="al-run"
                    disabled={!allAnswered || result !== null}
                    onClick={() => {
                        const attempt = gradeAssessment(questions, answers);
                        if (!attempt) return;
                        setResult(attempt);
                        if (attempt.correct === attempt.total) remember(id);
                    }}
                >
                    Check my reasoning
                </button>
                <button type="button" className="al-run" onClick={reset}>
                    Start a fresh attempt
                </button>
            </div>
            {result && result.revisits.length > 0 && (
                <aside className="ln-watch-depth" aria-label="Practice based on this attempt">
                    <h3>Revisit the missed mechanisms</h3>
                    <p>These links come only from the answers you missed in this attempt.</p>
                    <ul>
                        {result.revisits.map((revisit) => (
                            <li key={revisit.chapter}>
                                <Link href={revisit.learnHref}>{revisit.chapter.replace(/-/g, ' ')}</Link>
                                {' · '}
                                {revisit.missed} missed {revisit.missed === 1 ? 'scenario' : 'scenarios'}
                                {' · '}
                                <Link href={revisit.experimentHref}>Try its experiment</Link>
                            </li>
                        ))}
                    </ul>
                    <p>
                        Change one input, predict its result, and explain the rule before returning to this
                        assessment.
                    </p>
                </aside>
            )}
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
