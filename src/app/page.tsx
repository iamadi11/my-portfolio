'use client';

import React, { lazy, Suspense } from 'react';

import ContactCTA from '@/components/ContactCTA';
import DetailsCard from '@/components/DetailsCard';
import ProjectsCard from '@/components/ProjectsCard';
import TechStackCard from '@/components/TechStackCard';
import WorkExperiencePreview from '@/components/WorkExperiencePreview';
import { usePrimeEasterEgg } from '@/hooks/usePrimeEasterEgg';

const PrimeUniverse = lazy(() => import('@/components/PrimeUniverse'));

export default function Page(): React.JSX.Element {
    const [primeOpen, closePrime] = usePrimeEasterEgg();

    return (
        <div className="flex min-h-0 flex-col pb-10">
            <DetailsCard />
            <WorkExperiencePreview />
            <ProjectsCard />
            <TechStackCard titleAs="h2" />
            <ContactCTA />

            {/* Easter egg — only mounted (and Three.js loaded) when triggered */}
            {primeOpen && (
                <Suspense fallback={null}>
                    <PrimeUniverse onClose={closePrime} />
                </Suspense>
            )}
        </div>
    );
}
