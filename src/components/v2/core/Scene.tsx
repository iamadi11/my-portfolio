'use client';

import React from 'react';

import { useJourney } from './JourneyProvider';

type SceneProps = {
    id: string;
    label: string;
    className?: string;
    children: React.ReactNode;
};

/**
 * Layer A wrapper. Children are server-rendered semantic content passed
 * through from the page (RSC children survive inside a client component),
 * so every fact stays in the DOM regardless of JS. Registration only wires
 * the element into the journey scroll registry.
 */
export function Scene({ id, label, className, children }: SceneProps): React.JSX.Element {
    const ref = React.useRef<HTMLElement>(null);
    const { register } = useJourney();

    React.useEffect(() => {
        if (!ref.current) return undefined;
        return register(id, ref.current);
    }, [id, register]);

    return (
        <section ref={ref} id={id} aria-label={label} className={className}>
            {children}
        </section>
    );
}
