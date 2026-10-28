'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';

/**
 * Progressive enhancement for an interactive figure (references/rendering.md in the course skill): shows the
 * server-rendered `fallback` (the figure's static drawing and caption) until the figure comes within `margin` of the
 * viewport, then renders `children` (a `React.lazy` figure whose code loads only then), keeping the fallback while
 * that code loads. The figure's code is not part of the page's first-load JavaScript.
 */
export default function NearViewport({
    fallback,
    children,
    margin = '400px 0px',
}: {
    fallback: React.ReactNode;
    children: React.ReactNode;
    margin?: string;
}): React.JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const [near, setNear] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || near) return undefined;
        const io = new IntersectionObserver(
            (entries) => {
                // The newest entry wins when the figure leaves and returns between two callbacks.
                if (entries[entries.length - 1].isIntersecting) setNear(true);
            },
            { rootMargin: margin }
        );
        io.observe(el);
        return (): void => io.disconnect();
    }, [near, margin]);
    return <div ref={ref}>{near ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}</div>;
}
