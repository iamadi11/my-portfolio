'use client';

import React from 'react';

import clsx from 'clsx';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.04 },
    },
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
    },
};

const DetailsCard: React.FC = () => (
    <div
        className={clsx(
            'm-8 flex flex-col items-center gap-8 p-8',
            'md:flex-row md:justify-evenly md:gap-12'
        )}
    >
        <motion.div className="text-center md:text-left" variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="text-xl font-semibold text-gray-400">
                Hello <span className="inline-block origin-[70%_70%] animate-wave">👋</span>,
            </motion.div>

            <motion.div variants={item} className="text-3xl font-extrabold text-white">
                I&apos;m
            </motion.div>
            <motion.div
                variants={item}
                className="inline-block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-4xl font-extrabold text-transparent"
            >
                Aditya Raj
            </motion.div>
            <motion.div variants={item} className="mt-2 text-lg text-gray-300">
                <span className="font-semibold text-white">Senior Frontend Engineer</span>
                <span className="text-gray-400"> — React, Next.js, TypeScript</span>
            </motion.div>
            <motion.div variants={item} className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
                Production web apps in fintech and enterprise: performance, clear architecture, and shipping
                reliably at scale.
            </motion.div>
            <motion.div variants={item} className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link
                    href="https://github.com/iamadi11"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/20"
                >
                    GitHub
                </Link>
                <Link
                    href="/contact"
                    className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-white/25 hover:bg-white/10"
                >
                    Contact
                </Link>
            </motion.div>
        </motion.div>
        <motion.div
            className="md:min-h-50 md:min-w-50 relative min-h-40 min-w-40 overflow-hidden rounded-full border-4 border-cyan-400 shadow-md"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28, delay: 0.12 }}
        >
            <Image
                src="/profile_pic.jpg"
                alt="Aditya Raj"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
            />
        </motion.div>
    </div>
);

export default DetailsCard;
