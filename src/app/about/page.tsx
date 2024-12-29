'use client';

import React from 'react';

import Description from '@/components/Description';
import Education from '@/components/Education';
import WorkExperience from '@/components/WorkExperience';

const About: React.FC = () => (
    <div className="flex size-full flex-col items-start justify-center gap-8 p-8">
        <Description />
        <WorkExperience />
        <Education />
    </div>
);

export default About;
