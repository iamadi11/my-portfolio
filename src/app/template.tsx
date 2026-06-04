'use client';

import React, { useEffect, useState } from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

import Header from '@/components/Header';
import Layout from '@/components/Layout';
import SocialLinks from '@/components/SocialLinks';

const Template: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const prefersReducedMotion = useReducedMotion();
    const [scrollPct, setScrollPct] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const max = el.scrollHeight - el.clientHeight;
            setScrollPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            {/* Scroll progress — outside Layout so no stacking-context breakage */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    height: 2,
                    zIndex: 200,
                    width: `${scrollPct}%`,
                    background: 'linear-gradient(90deg, rgb(34 211 238), rgb(167 139 250))',
                    transition: 'width 0.1s linear',
                    pointerEvents: 'none',
                }}
            />
            {/* V2 entry badge */}
            <Link
                href="/v2"
                aria-label="Try the immersive V2 experience"
                className={clsx(
                    'fixed bottom-5 right-5 z-[100]',
                    'inline-flex items-center gap-1.5 rounded-full border border-white/[0.12]',
                    'bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-md',
                    'transition-all duration-200 hover:border-cyan-400/40 hover:text-cyan-300',
                    'shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                )}
            >
                <span className="size-1.5 rounded-full bg-cyan-400/70" aria-hidden />
                Try V2
            </Link>
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
                            prefersReducedMotion
                                ? { duration: 0 }
                                : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                        }
                    >
                        {children}
                    </motion.div>
                </Layout.Main>
                <Layout.Footer
                    className={clsx(
                        'size-full border-t border-white/5 bg-zinc-950/85 backdrop-blur-xl',
                        'px-2'
                    )}
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
        </>
    );
};

export default Template;
