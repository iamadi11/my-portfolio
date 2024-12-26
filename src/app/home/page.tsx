'use client';

import React from 'react';

import DetailsCard from '@/components/DetailsCard';
import ProjectsCard from '@/components/ProjectsCard';
import TechStackCard from '@/components/TechStackCard';

const Home: React.FC = () => (
    <div className="size-full">
        <DetailsCard />
        <TechStackCard />
        <ProjectsCard />
    </div>
);

export default Home;
