'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

import Header from '@/components/Header';
import Layout from '@/components/Layout';
import SocialLinks from '@/components/SocialLinks';

const Template: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <Layout>
            <Layout.Header>
                <Header />
            </Layout.Header>
            <Layout.Main>
                <motion.div
                    className="size-full"
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                        prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                    }
                >
                    {children}
                </motion.div>
            </Layout.Main>
            <Layout.Footer className={clsx('px-2', 'size-full backdrop-blur-sm')}>
                <div className="flex items-center justify-between px-6 py-3">
                    <div>© 2026 Aditya Raj</div>
                    <div className="md:hidden">
                        <SocialLinks />
                    </div>
                </div>
            </Layout.Footer>
        </Layout>
    );
};

export default Template;
