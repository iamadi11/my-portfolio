'use client';

import React, { useEffect, useRef } from 'react';

import clsx from 'clsx';
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';

/* ---------- ambient particles (CSS-driven, compositor-only) ---------- */
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

/* ---------- skill badges floating around avatar ---------- */
const SKILL_BADGES = [
    { label: 'React', pos: 'top-2 -left-16 sm:-left-20', delay: 0.72 },
    { label: 'Next.js', pos: 'top-8 -right-16 sm:-right-20', delay: 0.88 },
    { label: 'TypeScript', pos: 'bottom-14 -left-20 sm:-left-24', delay: 1.04 },
    { label: 'Node.js', pos: 'bottom-6 -right-14 sm:-right-18', delay: 1.18 },
] as const;

/* ---------- stats data ---------- */
const STATS = [
    { label: 'yrs exp', countTo: 4.5, decimals: 1, suffix: '+', staticVal: null },
    { label: 'faster builds', countTo: 80, decimals: 0, suffix: '%', staticVal: null },
    { label: 'SLA drop', countTo: null, decimals: 0, suffix: '', staticVal: '70→15%' },
    { label: 'txns / mo', countTo: null, decimals: 0, suffix: '', staticVal: '~M' },
] as const;

/* ---------- count-up ---------- */
function CountUp({
    to,
    from = 0,
    decimals = 0,
    suffix = '',
    duration = 1.4,
}: {
    to: number;
    from?: number;
    decimals?: number;
    suffix?: string;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-20px' });
    const prefersReduced = useReducedMotion();

    useEffect(() => {
        if (!inView || !ref.current || prefersReduced) return;
        const startTime = performance.now();
        const range = to - from;
        function step(now: number) {
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            if (ref.current) ref.current.textContent = `${(from + range * eased).toFixed(decimals)}${suffix}`;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }, [inView, from, to, decimals, suffix, duration, prefersReduced]);

    return <span ref={ref}>{`${(prefersReduced ? to : from).toFixed(decimals)}${suffix}`}</span>;
}

/* ---------- magnetic wrapper ---------- */
function MagneticWrapper({ children, strength = 0.28 }: { children: React.ReactNode; strength?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const prefersReduced = useReducedMotion();
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 220, damping: 22, mass: 0.4 });
    const sy = useSpring(my, { stiffness: 220, damping: 22, mass: 0.4 });

    function onMove(e: React.MouseEvent) {
        if (!ref.current || prefersReduced) return;
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
                'relative mx-auto max-w-6xl overflow-visible px-4 py-14 sm:px-6 sm:py-20',
                'md:py-28 lg:py-32'
            )}
        >
            {/* ambient particles */}
            {!reduce &&
                PARTICLES.map((p, i) => (
                    <span
                        key={i}
                        aria-hidden
                        className="hero-particle"
                        style={{
                            top: `${p.top}%`,
                            left: `${p.left}%`,
                            width: p.size,
                            height: p.size,
                            ['--p-dur' as string]: `${p.dur}s`,
                            ['--p-delay' as string]: `${p.delay}s`,
                        }}
                    />
                ))}

            {/* ── background layers ── */}
            {/* dot grid */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                    maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse 85% 85% at 50% 50%, black 30%, transparent 100%)',
                }}
            />
            {/* cyan left glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 -z-10 size-full"
                style={{
                    background:
                        'radial-gradient(ellipse 60% 55% at 18% 42%, rgba(34,211,238,0.14), transparent 68%)',
                }}
            />
            {/* violet right glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 -z-10 size-full"
                style={{
                    background:
                        'radial-gradient(ellipse 50% 50% at 82% 55%, rgba(139,92,246,0.11), transparent 68%)',
                }}
            />
            {/* top beam */}
            {!reduce && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-px -translate-x-1/2"
                    style={{
                        background:
                            'linear-gradient(to bottom, transparent, rgba(34,211,238,0.3) 50%, transparent)',
                        filter: 'blur(18px)',
                    }}
                />
            )}

            <div
                className={clsx(
                    'flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:justify-between lg:gap-20'
                )}
            >
                {/* ── left: text ── */}
                <motion.div
                    className="max-w-xl text-center lg:max-w-2xl lg:text-left"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {/* availability badge */}
                    <motion.div
                        variants={item}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-1.5 shadow-[0_0_18px_-4px_rgba(52,211,153,0.35)]"
                    >
                        <span
                            className={clsx(
                                'size-1.5 rounded-full bg-emerald-400',
                                !reduce && 'animate-pulse'
                            )}
                            aria-hidden
                        />
                        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                            Open to opportunities
                        </span>
                    </motion.div>

                    {/* name blur-reveal */}
                    <h1 id="hero-title" className="mt-1 font-extrabold tracking-tight">
                        <span className="flex flex-wrap justify-center gap-x-4 lg:justify-start">
                            {['Aditya', 'Raj'].map((word, i) => (
                                <motion.span
                                    key={word}
                                    className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-5xl text-transparent sm:text-6xl lg:text-7xl"
                                    style={{ textShadow: '0 0 60px rgba(34,211,238,0.12)' }}
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
                                                  ease: [0.22, 1, 0.36, 1] as [
                                                      number,
                                                      number,
                                                      number,
                                                      number,
                                                  ],
                                              }
                                    }
                                >
                                    {word}
                                </motion.span>
                            ))}
                        </span>
                    </h1>

                    {/* title chip + location */}
                    <motion.p
                        variants={item}
                        className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 lg:justify-start"
                    >
                        <span className="rounded border border-cyan-400/25 bg-cyan-400/[0.08] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-cyan-400">
                            SDE
                        </span>
                        <span className="text-lg font-semibold text-white sm:text-xl">
                            Software Development Engineer
                        </span>
                        <span className="text-zinc-500">·</span>
                        <span className="text-zinc-400">Bengaluru</span>
                    </motion.p>

                    {/* tagline with metric highlights */}
                    <motion.p
                        variants={item}
                        className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base"
                    >
                        4.5+ years shipping production-grade React apps in fintech, e-commerce, and
                        enterprise. Cut build times <span className="font-medium text-zinc-200">80%</span>,
                        reduced SLA breaches <span className="font-medium text-zinc-200">70% → 15%</span>, and
                        built systems processing{' '}
                        <span className="font-medium text-zinc-200">millions of txns</span> monthly.
                    </motion.p>

                    {/* stats — horizontal row with dividers */}
                    <motion.div
                        variants={item}
                        className="mt-8 flex items-center justify-center divide-x divide-white/[0.07] lg:justify-start"
                    >
                        {STATS.map(({ label, countTo, decimals, suffix, staticVal }, i) => (
                            <motion.div
                                key={label}
                                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : {
                                              delay: 0.52 + i * 0.07,
                                              duration: 0.4,
                                              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                                          }
                                }
                                className="cursor-default px-4 first:pl-0 last:pr-0 sm:px-5"
                            >
                                <div className="text-xl font-bold tabular-nums text-white sm:text-2xl">
                                    {staticVal ? (
                                        staticVal
                                    ) : (
                                        <CountUp
                                            to={countTo!}
                                            decimals={decimals}
                                            suffix={suffix}
                                            duration={1.4 + i * 0.1}
                                        />
                                    )}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                    {label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                        variants={item}
                        className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
                    >
                        <MagneticWrapper strength={0.32}>
                            <Link
                                href="/contact"
                                className={clsx(
                                    'inline-flex items-center justify-center rounded-xl border border-cyan-400/40',
                                    'bg-gradient-to-r from-cyan-500/20 to-sky-500/15 px-6 py-3 text-sm font-semibold text-cyan-100',
                                    'shadow-[0_0_28px_-4px_rgba(34,211,238,0.45)] transition-all duration-200',
                                    'hover:border-cyan-300/60 hover:from-cyan-500/30 hover:shadow-[0_0_44px_-4px_rgba(34,211,238,0.65)]'
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
                                    'inline-flex items-center justify-center rounded-xl border border-white/10',
                                    'bg-white/[0.05] px-5 py-3 text-sm font-semibold text-zinc-300',
                                    'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] hover:text-white'
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
                                    'inline-flex items-center justify-center rounded-xl border border-white/10',
                                    'bg-white/[0.05] px-5 py-3 text-sm font-semibold text-zinc-300',
                                    'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.09] hover:text-white'
                                )}
                            >
                                LinkedIn
                            </Link>
                        </MagneticWrapper>
                    </motion.div>
                </motion.div>

                {/* ── right: avatar + floating badges ── */}
                <div className="relative shrink-0">
                    {/* outer glow disc */}
                    {!reduce && (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 65%)',
                                transform: 'scale(2)',
                                filter: 'blur(24px)',
                            }}
                        />
                    )}

                    {/* spinning conic ring */}
                    {!reduce && (
                        <div
                            aria-hidden
                            className="avatar-spin-ring absolute -inset-2 rounded-full"
                            style={{
                                background:
                                    'conic-gradient(from 0deg, transparent 55%, rgba(34,211,238,0.7) 72%, rgba(139,92,246,0.6) 85%, transparent 100%)',
                            }}
                        />
                    )}

                    {/* soft blur halo */}
                    {!reduce && (
                        <div
                            aria-hidden
                            className="absolute -inset-2 rounded-full"
                            style={{
                                background:
                                    'conic-gradient(from 0deg, transparent 55%, rgba(34,211,238,0.24) 72%, rgba(139,92,246,0.2) 85%, transparent 100%)',
                                filter: 'blur(9px)',
                            }}
                        />
                    )}

                    {/* avatar */}
                    <motion.div
                        className={clsx(
                            'relative size-44 overflow-hidden rounded-full sm:size-52',
                            'ring-2 ring-cyan-400/30 ring-offset-4 ring-offset-zinc-950',
                            'shadow-[0_0_80px_-8px_rgba(34,211,238,0.55)]'
                        )}
                        initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 340, damping: 24, delay: 0.12 }
                        }
                    >
                        <Image
                            src="/profile_pic.png"
                            alt="Aditya Raj — Software Development Engineer, Bengaluru"
                            fill
                            priority
                            fetchPriority="high"
                            className="object-cover"
                            sizes="(max-width: 1024px) 192px, 224px"
                        />
                    </motion.div>

                    {/* floating skill badges */}
                    {SKILL_BADGES.map(({ label, pos, delay }) => (
                        <motion.span
                            key={label}
                            aria-hidden
                            className={clsx(
                                'absolute hidden items-center gap-1.5 rounded-full sm:inline-flex',
                                'border border-white/[0.10] bg-zinc-900/85 px-2.5 py-1 backdrop-blur-sm',
                                'text-[11px] font-semibold text-zinc-300',
                                'shadow-[0_4px_20px_rgba(0,0,0,0.45)]',
                                pos
                            )}
                            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={
                                reduce
                                    ? { duration: 0 }
                                    : {
                                          delay,
                                          duration: 0.42,
                                          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                                      }
                            }
                        >
                            <span className="size-1.5 rounded-full bg-cyan-400/80" aria-hidden />
                            {label}
                        </motion.span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default DetailsCard;
