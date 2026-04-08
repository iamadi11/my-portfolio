'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

const DetailsCard: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    const container = {
        hidden: { opacity: reduce ? 1 : 0 },
        show: {
            opacity: 1,
            transition: reduce ? { duration: 0 } : { staggerChildren: 0.08, delayChildren: 0.06 },
        },
    };

    const item = {
        hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 14 },
        show: {
            opacity: 1,
            y: 0,
            transition: reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 32 },
        },
    };

    return (
        <section
            aria-labelledby="hero-title"
            className={clsx('relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20', 'md:py-24 lg:py-28')}
        >
            <div
                className={clsx(
                    'flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16'
                )}
            >
                <motion.div
                    className="max-w-xl text-center lg:max-w-2xl lg:text-left"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    <motion.p variants={item} className="text-lg font-medium text-zinc-400 sm:text-xl">
                        Hello{' '}
                        <span
                            className={clsx('inline-block origin-[70%_70%]', !reduce && 'animate-wave')}
                            aria-hidden
                        >
                            👋
                        </span>
                    </motion.p>

                    <motion.h1
                        id="hero-title"
                        variants={item}
                        className="mt-3 text-balance font-extrabold tracking-tight"
                    >
                        <span className="block text-2xl text-zinc-500 sm:text-3xl">I&apos;m</span>
                        <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-4xl text-transparent sm:text-5xl lg:text-6xl">
                            Aditya Raj
                        </span>
                    </motion.h1>

                    <motion.p variants={item} className="mt-4 text-pretty text-lg text-zinc-300 sm:text-xl">
                        <span className="font-semibold text-white">Frontend Engineer II</span>{' '}
                        <span className="text-zinc-400">at</span>{' '}
                        <span className="font-medium text-zinc-200">Cashfree Payments</span>
                        <span className="text-zinc-500"> — React, Next.js, TypeScript</span>
                    </motion.p>

                    <motion.p variants={item} className="mt-2 text-sm text-zinc-500 sm:text-base">
                        Bengaluru, Karnataka
                    </motion.p>

                    <motion.p
                        variants={item}
                        className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base"
                    >
                        Frontend engineer with ~4.5+ years building scalable web apps in fintech, e-commerce,
                        and enterprise; strong React, Next.js, and TypeScript; performance and production
                        systems focus.
                    </motion.p>

                    <motion.div
                        variants={item}
                        className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                    >
                        <Link
                            href="/contact"
                            className={clsx(
                                'inline-flex items-center justify-center rounded-xl border border-cyan-400/35',
                                'bg-gradient-to-r from-cyan-500/15 to-sky-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100',
                                'shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)] transition-all duration-200',
                                'hover:border-cyan-300/50 hover:from-cyan-500/25 hover:to-sky-500/15'
                            )}
                        >
                            Contact
                        </Link>
                        <Link
                            href="https://github.com/iamadi11"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx(
                                'border-white/12 inline-flex items-center justify-center rounded-xl border',
                                'bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200',
                                'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]'
                            )}
                        >
                            GitHub
                        </Link>
                        <Link
                            href="https://www.linkedin.com/in/adityaraj11/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx(
                                'border-white/12 inline-flex items-center justify-center rounded-xl border',
                                'bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200',
                                'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]'
                            )}
                        >
                            LinkedIn
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    className={clsx(
                        'relative size-40 shrink-0 overflow-hidden rounded-full sm:size-48',
                        'ring-2 ring-cyan-400/40 ring-offset-4 ring-offset-zinc-950',
                        'shadow-[0_0_60px_-8px_rgba(34,211,238,0.45)]'
                    )}
                    initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                        reduce ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 26, delay: 0.1 }
                    }
                >
                    <Image
                        src="/profile_pic.png"
                        alt="Aditya Raj — Frontend Engineer II, Bengaluru"
                        fill
                        priority
                        fetchPriority="high"
                        className="object-cover"
                        sizes="(max-width: 1024px) 192px, 224px"
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default DetailsCard;
