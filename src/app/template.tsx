'use client';
import React from 'react';

import clsx from 'clsx';

import Header from '@/components/Header';
import Layout from '@/components/Layout';
import SocialLinks from '@/components/SocialLinks';

const Template: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Layout>
        <Layout.Header>
            <Header />
        </Layout.Header>
        {/* <Layout.Sidebar>
                            <div>My Sidebar</div>
                        </Layout.Sidebar> */}
        <Layout.Main>{children}</Layout.Main>
        <Layout.Footer className={clsx('px-2', 'size-full backdrop-blur-sm')}>
            <div className="flex items-center justify-between px-6 py-2">
                <div>© 2021 Aditya</div>
                <div className="md:hidden">
                    <SocialLinks />
                </div>
            </div>
        </Layout.Footer>
    </Layout>
);

export default Template;
