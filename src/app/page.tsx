'use client';

import React from 'react';

import DetailsCard from '@/components/DetailsCard';
import ProjectsCard from '@/components/ProjectsCard';
import TechStackCard from '@/components/TechStackCard';

export default function Page(): React.JSX.Element {
    return (
        <div className="size-full">
            <DetailsCard />
            <TechStackCard />
            <ProjectsCard />
        </div>
    );
}
