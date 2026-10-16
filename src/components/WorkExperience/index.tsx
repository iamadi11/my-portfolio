'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

import { SITE } from '@/content/site';

type Role = {
    title: string;
    company: string;
    range: string;
    location?: string;
    bullets: string[];
    tech?: string;
};

/** Same records as the home page: one source, `SITE` in src/content/site.ts. */
const roles: Role[] = SITE.practice.experience.map((r) => ({
    title: r.role,
    company: r.org,
    range: r.period,
    location: r.location,
    bullets: r.highlights ?? [],
    tech: r.stack,
}));

const WorkExperience: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    return (
        <motion.section
            aria-labelledby="work-heading"
            className={clsx(
                'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
                'backdrop-blur-sm sm:p-8'
            )}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <h2 id="work-heading" className="mb-10 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Work experience
            </h2>
            <div className="flex flex-col gap-12">
                {roles.map((role, index) => (
                    <motion.article
                        key={`${role.company}-${role.range}`}
                        className="border-b border-white/[0.06] pb-12 last:border-0 last:pb-0"
                        initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-24px' }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : { delay: index * 0.09, duration: 0.38, ease: [0.22, 1, 0.36, 1] }
                        }
                    >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-100">{role.title}</h3>
                                <p className="mt-1 text-lg font-medium text-zinc-400">{role.company}</p>
                            </div>
                            <div>
                                <p className="text-base text-zinc-500 md:text-right">{role.range}</p>
                                {role.location && (
                                    <p className="text-sm text-zinc-600 md:text-right">{role.location}</p>
                                )}
                            </div>
                        </div>
                        {role.bullets.length > 0 && (
                            <ul className="mt-5 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-zinc-300 marker:text-cyan-500/80">
                                {role.bullets.map((b) => (
                                    <li key={b}>{b}</li>
                                ))}
                            </ul>
                        )}
                        {role.tech && (
                            <p className="mt-4 text-xs text-zinc-500">
                                <span className="font-semibold text-zinc-400">Tech:</span> {role.tech}
                            </p>
                        )}
                    </motion.article>
                ))}
            </div>
        </motion.section>
    );
};

export default WorkExperience;
