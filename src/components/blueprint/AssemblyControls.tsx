'use client';

import React, { useState } from 'react';

/** Explicit inspection is an alternative to scrubbing a long pinned scroll sequence. */
export default function AssemblyControls({ detail }: { detail: boolean }): React.JSX.Element {
    const [pose, setPose] = useState('scroll');
    return (
        <div className="asm-inspect" role="group" aria-label="Inspect the software assembly">
            <span>Inspect</span>
            {(
                [
                    ['plan', 'Plan', 2.8],
                    ['exploded', 'Separate layers', 5.3],
                    ...(detail ? [['detail', 'Close-up', 7.4]] : []),
                    ['scroll', 'Follow scroll', null],
                ] as [string, string, number | null][]
            ).map(([id, label, time]) => (
                <button
                    key={id}
                    type="button"
                    aria-pressed={pose === id}
                    onClick={(event) => {
                        setPose(id);
                        event.currentTarget
                            .closest('[data-sheet]')
                            ?.dispatchEvent(
                                new CustomEvent('bp-inspect', { bubbles: true, detail: { time } })
                            );
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
