import React from 'react';

import ContactCTA from '@/components/ContactCTA';
import DetailsCard from '@/components/DetailsCard';
import PrimeEasterEgg from '@/components/PrimeEasterEgg';
import ProjectsCard from '@/components/ProjectsCard';
import TechStackCard from '@/components/TechStackCard';
import WorkExperiencePreview from '@/components/WorkExperiencePreview';

export default function Page(): React.JSX.Element {
    return (
        <div className="flex min-h-0 flex-col pb-10">
            <DetailsCard />
            <WorkExperiencePreview />
            <ProjectsCard />
            <TechStackCard titleAs="h2" />
            <ContactCTA />
            <PrimeEasterEgg />
        </div>
    );
}
