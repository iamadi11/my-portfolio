'use client';
import React, { useEffect } from 'react';

import { apiService } from '@/apiService';
import logger from '@/logger';

const Home: React.FC = () => {
    useEffect(() => {
        apiService({ url: '/api/health' }).then((response) => {
            logger.info(response);
        });
    }, []);
    return (
        <div>
            <div>Aditya Raj | Software Developer | Frontend</div>
        </div>
    );
};

export default Home;
