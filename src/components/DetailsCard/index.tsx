'use client';

import React, { useRef } from 'react';

import clsx from 'clsx';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

/* ---------- deterministic ambient particles ---------- */
const PARTICLES = [
    { top: 12, left: 5, dur: 5.8, delay: 0, size: 2 },
    { top: 25, left: 18, dur: 7.2, delay: 1.1, size: 1.5 },
    { top: 8, left: 35, dur: 6.4, delay: 2.3, size: 2.5 },
    { top: 40, left: 48, dur: 8.1, delay: 0.7, size: 1 },
    { top: 65, left: 12, dur: 5.5, delay: 3.2, size: 2 },
    { top: 72, left: 28, dur: 7.8, delay: 1.5, size: 1.5 },
    { top: 55, left: 62, dur: 6.2, delay: 0.4, size: 2 },
    { top: 18, left: 72, dur: 9.0, delay: 2.8, size: 1 },
    { top: 85, left: 80, dur: 5.9, delay: 1.9, size: 2.5 },
    { top: 45, left: 90, dur: 7.5, delay: 0.2, size: 1.5 },
    { top: 30, left: 95, dur: 6.8, delay: 3.5, size: 1 },
    { top: 78, left: 55, dur: 8.3, delay: 2.1, size: 2 },
    { top: 92, left: 38, dur: 5.4, delay: 1.7, size: 1.5 },
    { top: 60, left: 75, dur: 7.0, delay: 0.9, size: 2.5 },
];

/* ---------- magnetic wrapper ---------- */
function MagneticWrapper({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 220, damping: 22, mass: 0.4 });
    const sy = useSpring(my, { stiffness: 220, damping: 22, mass: 0.4 });

    function onMove(e: React.MouseEvent) {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * strength);
        my.set((e.clientY - (r.top + r.height / 2)) * strength);
    }
    function onLeave() {
        mx.set(0);
        my.set(0);
    }

    return (
        <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ x: sx, y: sy }}>
            {children}
        </motion.div>
    );
}

/* ---------- main component ---------- */
const DetailsCard: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    const container = {
        hidden: { opacity: reduce ? 1 : 0 },
        show: {
            opacity: 1,
            transition: reduce ? { duration: 0 } : { staggerChildren: 0.09, delayChildren: 0.04 },
        },
    };

    const item = {
        hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 16 },
        show: {
            opacity: 1,
            y: 0,
            transition: reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 360, damping: 30 },
        },
    };

    return (
        <section
            aria-labelledby="hero-title"
            className={clsx(
                'relative mx-auto max-w-6xl overflow-hidden px-4 py-14 sm:px-6 sm:py-20',
                'md:py-24 lg:py-28'
            )}
        >
            {/* ambient floating particles */}
            {!reduce &&
                PARTICLES.map((p, i) => (
                    <motion.span
                        key={i}
                        aria-hidden
                        className="pointer-events-none absolute rounded-full bg-cyan-400/25"
                        style={{
                            top: `${p.top}%`,
                            left: `${p.left}%`,
                            width: p.size,
                            height: p.size,
                        }}
                        animate={{ y: [0, -28, 0], opacity: [0, 0.45, 0] }}
                        transition={{
                            duration: p.dur,
                            delay: p.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}

            {/* radial ambient glow behind name */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 -z-10 size-full"
                style={{
                    background:
                        'radial-gradient(ellipse 55% 40% at 30% 45%, rgba(34,211,238,0.07), transparent 70%)',
                }}
            />

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
                    {/* Availability badge */}
                    <motion.div
                        variants={item}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5"
                    >
                        <span
                            className={clsx(
                                'size-1.5 rounded-full bg-emerald-400',
                                !reduce && 'animate-pulse'
                            )}
                            aria-hidden
                        />
                        <span className="text-xs font-medium tracking-wide text-emerald-300">
                            Available for opportunities
                        </span>
                    </motion.div>

                    {/* blur-reveal name — each word independent */}
                    <h1 id="hero-title" className="mt-1 font-extrabold tracking-tight">
                        <span className="flex flex-wrap justify-center gap-x-4 lg:justify-start">
                            {['Aditya', 'Raj'].map((word, i) => (
                                <motion.span
                                    key={word}
                                    className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-4xl text-transparent sm:text-5xl lg:text-6xl"
                                    initial={
                                        reduce ? { opacity: 1 } : { opacity: 0, filter: 'blur(14px)', y: 22 }
                                    }
                                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                    transition={
                                        reduce
                                            ? { duration: 0 }
                                            : {
                                                  delay: 0.08 + i * 0.18,
                                                  duration: 0.7,
                                                  ease: [0.22, 1, 0.36, 1],
                                              }
                                    }
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                    </h1>

                    <motion.p variants={item} className="mt-4 text-pretty text-lg text-zinc-300 sm:text-xl">
                        <span className="font-semibold text-white">Frontend Engineer II</span>{' '}
                        <span className="text-zinc-400">at</span>{' '}
                        <span className="font-medium text-zinc-200">Cashfree Payments</span>
                        <span className="text-zinc-500"> · Bengaluru</span>
                    </motion.p>

                    <motion.p
                        variants={item}
                        className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base"
                    >
                        4.5+ years shipping production-grade React apps in fintech, e-commerce, and
                        enterprise. Cut build times 80%, reduced SLA breaches from 70% to 15%, and built
                        systems processing millions of transactions monthly.
                    </motion.p>

                    {/* Impact stats strip — glow on hover */}
                    <motion.div
                        variants={item}
                        className="mt-6 grid grid-cols-2 justify-center gap-2 sm:flex sm:flex-wrap sm:gap-2.5 lg:justify-start"
                    >
                        {[
                            { val: '4.5+', label: 'years exp' },
                            { val: '80%', label: 'faster builds' },
                            { val: '70→15%', label: 'SLA reduction' },
                            { val: '~M/mo', label: 'txns processed' },
                        ].map(({ val, label }, i) => (
                            <motion.div
                                key={label}
                                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : { delay: 0.5 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }
                                }
                                whileHover={
                                    reduce
                                        ? {}
                                        : {
                                              borderColor: 'rgba(34,211,238,0.22)',
                                              backgroundColor: 'rgba(34,211,238,0.04)',
                                              transition: { duration: 0.18 },
                                          }
                                }
                                className="cursor-default rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-center sm:text-left"
                            >
                                <div className="text-base font-bold tabular-nums text-zinc-100">{val}</div>
                                <div className="mt-0.5 text-[11px] leading-tight text-zinc-500">{label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        variants={item}
                        className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                    >
                        {/* primary magnetic CTA */}
                        <MagneticWrapper strength={0.32}>
                            <Link
                                href="/contact"
                                className={clsx(
                                    'inline-flex items-center justify-center rounded-xl border border-cyan-400/35',
                                    'bg-gradient-to-r from-cyan-500/15 to-sky-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-100',
                                    'shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)] transition-all duration-200',
                                    'hover:border-cyan-300/50 hover:from-cyan-500/25 hover:to-sky-500/15 hover:shadow-[0_0_36px_-4px_rgba(34,211,238,0.55)]'
                                )}
                            >
                                Get in touch
                            </Link>
                        </MagneticWrapper>

                        <MagneticWrapper strength={0.22}>
                            <Link
                                href="https://github.com/iamadi11"
                                target="_blank"
                                rel="noopener noreferrer me"
                                className={clsx(
                                    'border-white/12 inline-flex items-center justify-center rounded-xl border',
                                    'bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200',
                                    'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]'
                                )}
                            >
                                GitHub
                            </Link>
                        </MagneticWrapper>

                        <MagneticWrapper strength={0.22}>
                            <Link
                                href="https://www.linkedin.com/in/adityaraj11/"
                                target="_blank"
                                rel="noopener noreferrer me"
                                className={clsx(
                                    'border-white/12 inline-flex items-center justify-center rounded-xl border',
                                    'bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-zinc-200',
                                    'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]'
                                )}
                            >
                                LinkedIn
                            </Link>
                        </MagneticWrapper>
                    </motion.div>
                </motion.div>

                {/* avatar with rotating glow ring */}
                <div className="relative shrink-0">
                    {/* spinning conic ring */}
                    {!reduce && (
                        <motion.div
                            aria-hidden
                            className="absolute -inset-2 rounded-full"
                            style={{
                                background:
                                    'conic-gradient(from 0deg, transparent 60%, rgba(34,211,238,0.55) 75%, rgba(139,92,246,0.45) 85%, transparent 100%)',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                        />
                    )}

                    {/* soft blur behind ring so it doesn't clip */}
                    {!reduce && (
                        <div
                            aria-hidden
                            className="absolute -inset-2 rounded-full"
                            style={{
                                background:
                                    'conic-gradient(from 0deg, transparent 60%, rgba(34,211,238,0.18) 75%, rgba(139,92,246,0.15) 85%, transparent 100%)',
                                filter: 'blur(6px)',
                            }}
                        />
                    )}

                    <motion.div
                        className={clsx(
                            'relative size-40 overflow-hidden rounded-full sm:size-48',
                            'ring-2 ring-cyan-400/30 ring-offset-4 ring-offset-zinc-950',
                            'shadow-[0_0_60px_-8px_rgba(34,211,238,0.45)]'
                        )}
                        initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 340, damping: 24, delay: 0.12 }
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
            </div>
        </section>
    );
};

export default DetailsCard;
