'use client';

import React, { lazy, Suspense } from 'react';

import { usePrimeEasterEgg } from '@/hooks/usePrimeEasterEgg';

const PrimeUniverse = lazy(() => import('@/components/PrimeUniverse'));

export default function PrimeEasterEgg(): React.JSX.Element | null {
    const [primeOpen, closePrime] = usePrimeEasterEgg();

    if (!primeOpen) return null;

    return (
        <Suspense fallback={null}>
            <PrimeUniverse onClose={closePrime} />
        </Suspense>
    );
}
