'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

import { SITE } from '@/content/site';

const Education: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;
    const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

    return (
        <motion.section
            aria-labelledby="education-heading"
            className={clsx(
                'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
                'backdrop-blur-sm sm:p-8'
            )}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease }}
        >
            <h2
                id="education-heading"
                className="mb-8 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
                Education
            </h2>
            {(SITE.practice.education ?? []).map((e) => (
                <div key={e.org} className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
                    <div>
                        <h3 className="text-xl font-semibold text-zinc-100">{e.org}</h3>
                        <p className="mt-2 text-lg font-medium text-zinc-400">
                            {[e.role, ...(e.highlights ?? [])].join(' — ')}
                        </p>
                    </div>
                    <div>
                        <p className="text-base text-zinc-500 md:text-right">{e.period}</p>
                        {e.location && <p className="text-sm text-zinc-600 md:text-right">{e.location}</p>}
                    </div>
                </div>
            ))}
        </motion.section>
    );
};

export default Education;
