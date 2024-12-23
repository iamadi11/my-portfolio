import React from 'react';

import DetailsCard from '@/components/DetailsCard';
import TechStackCard from '@/components/TechStackCard';

const Home: React.FC = () => (
    <div className="size-full">
        <DetailsCard />
        <TechStackCard />
    </div>
);

export default Home;
