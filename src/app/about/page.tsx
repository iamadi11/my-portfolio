'use client';

import React from 'react';

import Description from '@/components/Description';
import Education from '@/components/Education';
import WorkExperience from '@/components/WorkExperience';

const About: React.FC = () => (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12 sm:px-6 lg:gap-12 lg:py-16">
        <Description />
        <WorkExperience />
        <Education />
    </div>
);

export default About;
