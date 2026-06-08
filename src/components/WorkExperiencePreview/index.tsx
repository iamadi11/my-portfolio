'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';

const roles = [
    {
        title: 'Frontend Engineer II',
        company: 'Cashfree Payments',
        range: 'Mar 2025 – Present',
        highlight:
            'Own Risk WebApp serving enterprise merchants — millions of transactions/month. Built configurable rule engine for real-time transaction blocking; reduced Video KYC failure rate 30%.',
        tech: 'React · TypeScript · Zustand · Semantic UI',
        current: true,
    },
    {
        title: 'Software Engineer',
        company: 'Moresand Technologies',
        range: 'Aug 2024 – Mar 2025',
        highlight:
            'Led legacy back-office migration to React; enabled 3× faster feature delivery. PWA offline architecture cut page load time 50%.',
        tech: 'React · Next.js · React Query · Tailwind · Node.js',
        current: false,
    },
    {
        title: 'SDE I → II',
        company: 'Tata 1mg',
        range: 'Dec 2021 – Jul 2024',
        highlight:
            'Built polygon serviceability engine for 15-min delivery zones. Real-time push notifications cut SLA breaches 70→15%. Turborepo monorepo cut build time 80% (15 min → 3 min).',
        tech: 'React · Node.js · Redis · Turborepo · Google Maps API',
        current: false,
    },
];

const WorkExperiencePreview: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    return (
        <motion.section
            aria-labelledby="exp-preview-heading"
            className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="flex items-end justify-between">
                    <div>
                        <h2
                            id="exp-preview-heading"
                            className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
                        >
                            Experience
                        </h2>
                        <p className="mt-3 text-sm text-zinc-500 sm:text-base">
                            4.5+ years · fintech, e-commerce, enterprise
                        </p>
                    </div>
                    <Link
                        href="/about"
                        className="hidden text-sm text-zinc-500 transition-colors duration-200 hover:text-cyan-300 sm:block"
                    >
                        Full details →
                    </Link>
                </div>

                <div className="relative mt-12">
                    {/* vertical rail */}
                    <div className="absolute inset-y-2 left-[6px] w-px bg-white/[0.07]" aria-hidden />

                    <div className="flex flex-col gap-7">
                        {roles.map((role, index) => (
                            <motion.div
                                key={role.company}
                                className="relative flex gap-5"
                                initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-24px' }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : {
                                              delay: index * 0.08,
                                              duration: 0.38,
                                              ease: [0.22, 1, 0.36, 1],
                                          }
                                }
                            >
                                {/* dot */}
                                <div className="relative z-10 mt-[18px] flex size-[13px] shrink-0 items-center justify-center">
                                    <div
                                        className={clsx(
                                            'size-[11px] rounded-full border',
                                            role.current
                                                ? 'border-cyan-400/70 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.45)]'
                                                : 'border-white/[0.18] bg-zinc-800'
                                        )}
                                    />
                                    {role.current && !reduce && (
                                        <span
                                            className="absolute size-[11px] animate-ping rounded-full bg-cyan-400/25"
                                            aria-hidden
                                        />
                                    )}
                                </div>

                                {/* card */}
                                <div
                                    className={clsx(
                                        'relative flex-1 overflow-hidden rounded-xl border p-5',
                                        'cursor-default backdrop-blur-md transition-all duration-200',
                                        role.current
                                            ? 'border-cyan-500/20 bg-cyan-500/[0.04] hover:border-cyan-500/30 hover:bg-cyan-500/[0.07]'
                                            : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.13] hover:bg-white/[0.05]'
                                    )}
                                >
                                    {/* left accent bar */}
                                    <div
                                        aria-hidden
                                        className={clsx(
                                            'absolute inset-y-0 left-0 w-[3px] rounded-r-full',
                                            role.current
                                                ? 'bg-gradient-to-b from-cyan-400/80 via-cyan-400/40 to-transparent'
                                                : 'bg-gradient-to-b from-white/[0.12] to-transparent'
                                        )}
                                    />
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-zinc-100 sm:text-base">
                                                {role.title}
                                            </h3>
                                            <p className="mt-0.5 text-sm font-semibold text-zinc-300">
                                                {role.company}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-500">
                                            {role.range}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                                        {role.highlight}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {role.tech.split(' · ').map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 sm:hidden">
                    <Link
                        href="/about"
                        className="text-sm text-zinc-500 transition-colors duration-200 hover:text-cyan-300"
                    >
                        Full details →
                    </Link>
                </div>
            </div>
        </motion.section>
    );
};

export default WorkExperiencePreview;
