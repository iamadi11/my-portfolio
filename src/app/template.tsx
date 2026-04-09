'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

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
                    className="flex min-h-0 min-w-0 flex-1 flex-col"
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                        prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                    }
                >
                    {children}
                </motion.div>
            </Layout.Main>
            <Layout.Footer
                className={clsx('size-full border-t border-white/5 bg-zinc-950/85 backdrop-blur-xl', 'px-2')}
            >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-8">
                    <p className="text-sm text-zinc-500">© 2026 Aditya Raj</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <nav aria-label="Site utilities" className="flex items-center gap-4 text-xs">
                            <Link
                                href="/sitemap.xml"
                                className="text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
                            >
                                Sitemap
                            </Link>
                            <Link
                                href="/llms.txt"
                                className="text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
                                title="Summary for AI and research crawlers"
                            >
                                llms.txt
                            </Link>
                        </nav>
                        <div className="md:hidden">
                            <SocialLinks />
                        </div>
                    </div>
                </div>
            </Layout.Footer>
        </Layout>
    );
};

export default Template;
