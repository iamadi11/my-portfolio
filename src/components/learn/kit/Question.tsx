'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Open responses require commitment, then honest self-review; no automatic grading is inferred. */
export default function Question({
    n,
    ask,
    children,
}: {
    n: number;
    ask: React.ReactNode;
    children: React.ReactNode;
}): React.JSX.Element {
    const id = useId();
    const route = usePathname();
    const [draft, setDraft] = useState('');
    const [committed, setCommitted] = useState<string | null>(null);
    const explanation = useRef<HTMLHeadingElement>(null);
    const reasoning = useRef<HTMLTextAreaElement>(null);
    const resetting = useRef(false);
    useEffect(() => {
        if (committed !== null) explanation.current?.focus();
        else if (resetting.current) {
            reasoning.current?.focus();
            resetting.current = false;
        }
    }, [committed]);
    const [review, setReview] = useState<'matched' | 'revisit' | null>(null);
    return (
        <div className="ln-q">
            <p id={`${id}-question`}>
                <strong>Q{n}.</strong> {ask}
            </p>
            {committed === null ? (
                <>
                    <label className="ac-reflection" htmlFor={`${id}-reasoning`}>
                        Your reasoning before the explanation
                        <textarea
                            ref={reasoning}
                            id={`${id}-reasoning`}
                            aria-describedby={`${id}-question`}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={3}
                        />
                    </label>
                    <button
                        className="al-run"
                        type="button"
                        disabled={!draft.trim()}
                        onClick={() => setCommitted(draft.trim())}
                    >
                        Commit and compare
                    </button>
                </>
            ) : (
                <>
                    <p>
                        <strong>Your committed reasoning:</strong> {committed}
                    </p>
                    <div className="al-feedback">
                        <h3 ref={explanation} tabIndex={-1}>
                            Compare with the explanation
                        </h3>
                        {children}
                    </div>
                    <fieldset>
                        <legend>Self-assessment · compare your assumptions with the explanation</legend>
                        <label>
                            <input
                                type="radio"
                                name={`${id}-review`}
                                checked={review === 'matched'}
                                onChange={() => setReview('matched')}
                            />
                            My reasoning matched the key assumptions
                        </label>
                        <label>
                            <input
                                type="radio"
                                name={`${id}-review`}
                                checked={review === 'revisit'}
                                onChange={() => setReview('revisit')}
                            />
                            I need to revisit this mechanism
                        </label>
                    </fieldset>
                    {review === 'revisit' && (
                        <p role="status">
                            <Link href={`${route}?tab=explore`}>Try this chapter’s experiment</Link>: change
                            one assumption, predict the result, then explain it again.
                        </p>
                    )}
                    {review === 'matched' && (
                        <p role="status">
                            Self-review recorded for this question. Try explaining a different workload or
                            failure; this is not an automatic mastery score.
                        </p>
                    )}
                    <button
                        className="al-run"
                        type="button"
                        onClick={() => {
                            resetting.current = true;
                            setDraft('');
                            setCommitted(null);
                            setReview(null);
                        }}
                    >
                        Start a fresh response
                    </button>
                </>
            )}
            <p className="al-hint">
                Your response stays in this page’s memory. This open question is self-assessed.
            </p>
        </div>
    );
}
