'use client';

import React from 'react';

import DetailsCard from '@/components/DetailsCard';
import ProjectsCard from '@/components/ProjectsCard';
import TechStackCard from '@/components/TechStackCard';

export default function Page(): React.JSX.Element {
    return (
        <div className="flex min-h-0 flex-col pb-10">
            <DetailsCard />
            <TechStackCard titleAs="h2" />
            <ProjectsCard />
        </div>
    );
}
