'use client';

import React, { useRef, useState } from 'react';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

import { journalEvent, newJournal } from '@/lib/mutation-bench';

gsap.registerPlugin(useGSAP);

export default function MutationBench({ art }: { art: React.ReactNode }): React.JSX.Element {
    const [journal, setJournal] = useState(newJournal);
    const scope = useRef<HTMLDivElement>(null);
    useGSAP(
        () => {
            const media = gsap.matchMedia();
            media.add('(prefers-reduced-motion: no-preference)', () => {
                gsap.fromTo(
                    '.bench-ledger li',
                    { y: 8, opacity: 0.3 },
                    { y: 0, opacity: 1, stagger: 0.045, duration: 0.35, ease: 'power2.out' }
                );
            });
            return () => media.revert();
        },
        { scope, dependencies: [journal], revertOnUpdate: true }
    );
    return (
        <div ref={scope} className="mutation-bench">
            <div className="bench-heading">
                <span>Experiment 01 / Eidos</span>
                <span className="bench-network" data-online={journal.online}>
                    {journal.online ? 'Connected' : 'Offline'}
                </span>
            </div>
            <h2>
                When the network stops,
                <br />
                the intent should stay.
            </h2>
            <div className="bench-object">
                {art}
                <div className="bench-counter">
                    <strong>{journal.pending.length.toString().padStart(2, '0')}</strong>
                    <span>pending writes</span>
                </div>
            </div>
            <div className="bench-controls">
                <button
                    type="button"
                    disabled={journal.next > 6}
                    onClick={() => setJournal((s) => journalEvent(s, 'write'))}
                >
                    Add a write +
                </button>
                <button type="button" onClick={() => setJournal((s) => journalEvent(s, 'network'))}>
                    {journal.online ? 'Disconnect' : 'Reconnect & replay'} →
                </button>
                <button type="button" onClick={() => setJournal((s) => journalEvent(s, 'reset'))}>
                    Reset
                </button>
            </div>
            <p className="bench-feedback" role="status">
                {journal.next === 1
                    ? 'Start offline. Add a write, then reconnect.'
                    : journal.pending.length
                      ? `${journal.pending.length} pending. Reconnect to replay the same operation identities.`
                      : `${journal.accepted.length} accepted in this illustration. Disconnect to try another interruption.`}
            </p>
            <ol className="bench-ledger" aria-label="Operation journal">
                {Array.from({ length: journal.next - 1 }, (_, i) => i + 1).map((id) => (
                    <li key={id}>
                        <span>W{String(id).padStart(2, '0')}</span>
                        <span>{journal.pending.includes(id) ? 'Pending' : 'Accepted'}</span>
                    </li>
                ))}
            </ol>
            <p className="bench-boundary">
                Interactive illustration · memory only. Eidos stores queued mutations in IndexedDB;
                server-side deduplication needs a matching API contract.
            </p>
            <a className="bench-source" href="https://github.com/sweidos/eidos">
                Inspect Eidos source ↗
            </a>
        </div>
    );
}
