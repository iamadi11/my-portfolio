'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';

const Description: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;
    const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

    return (
        <motion.section
            aria-labelledby="about-intro-heading"
            className={clsx(
                'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
                'backdrop-blur-sm sm:p-8'
            )}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease }}
        >
            <h1
                id="about-intro-heading"
                className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
                About
            </h1>
            <p className="text-base leading-relaxed text-zinc-300 sm:text-lg">
                <span className="font-semibold text-zinc-100">Frontend Engineer II at Cashfree Payments</span>{' '}
                (Bengaluru). Frontend engineer with ~4.5+ years building scalable web apps in fintech,
                e-commerce, and enterprise; strong React, Next.js, and TypeScript; performance and production
                systems focus.
            </p>
        </motion.section>
    );
};

export default Description;
