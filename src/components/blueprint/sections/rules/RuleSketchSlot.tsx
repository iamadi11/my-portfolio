'use client';

import React, { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

/** Loads the rule-engine sketch only once its <details> is first opened, so `/` ships none of it up front. */
const RuleSketch = dynamic(() => import('./RuleSketch'), {
    ssr: false,
    loading: () => <p className="rev-sketch-wait">Loading sketch…</p>,
});

export default function RuleSketchSlot(): React.JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const d = ref.current?.closest('details');
        if (!d) {
            setOpen(true);
            return undefined;
        }
        const on = (): void => {
            if (d.open) setOpen(true);
        };
        on();
        d.addEventListener('toggle', on);
        return () => d.removeEventListener('toggle', on);
    }, []);
    return <div ref={ref}>{open ? <RuleSketch /> : null}</div>;
}
