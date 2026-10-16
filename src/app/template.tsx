'use client';

import React from 'react';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

/** Loaded only where it renders, so / never downloads its animation library. */
const SiteChrome = dynamic(() => import('@/components/SiteChrome'));

const Template: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    if (pathname === '/') return <>{children}</>;
    return <SiteChrome>{children}</SiteChrome>;
};

export default Template;
