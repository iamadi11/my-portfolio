import React from 'react';

/** A retrieval question with its answer behind a disclosure, so the learner tries to recall it first. */
export default function Question({
    n,
    ask,
    children,
}: {
    n: number;
    ask: React.ReactNode;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div className="ln-q">
            <p>
                <strong>Q{n}.</strong> {ask}
            </p>
            <details>
                <summary>Show the answer</summary>
                {children}
            </details>
        </div>
    );
}
