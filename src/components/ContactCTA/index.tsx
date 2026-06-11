'use client';

import React, { useState } from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FaEnvelope, FaHeart, FaLinkedin, FaPaperPlane } from 'react-icons/fa';

const ContactCTA: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        window.location.href = `mailto:adityaraj92.20@gmail.com?subject=Opportunity%20from%20portfolio&body=Hi%20Aditya%2C%0A%0AReaching%20out%20from%20your%20portfolio.%0A%0A----%0AFrom%3A%20${encodeURIComponent(email)}`;
        setSent(true);
        setEmail('');
    }

    return (
        <motion.section
            aria-labelledby="cta-heading"
            className="border-t border-white/5 px-4 py-16 sm:px-6 sm:py-20"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="mx-auto max-w-6xl">
                <div
                    className={clsx(
                        'relative overflow-hidden rounded-2xl border border-white/[0.08]',
                        'bg-gradient-to-br from-white/[0.04] via-cyan-500/[0.04] to-violet-500/[0.04]',
                        'px-8 py-12 text-center sm:px-12 sm:py-16',
                        'shadow-[0_0_80px_-16px_rgba(34,211,238,0.15)]'
                    )}
                >
                    {/* ambient glow behind */}
                    <div
                        className="pointer-events-none absolute inset-0 -z-10"
                        aria-hidden
                        style={{
                            background:
                                'radial-gradient(ellipse 60% 50% at 50% 120%, rgba(34,211,238,0.12), transparent 60%)',
                        }}
                    />

                    {/* availability badge */}
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5">
                        <span
                            className={clsx(
                                'size-1.5 rounded-full bg-emerald-400',
                                !reduce && 'animate-pulse'
                            )}
                            aria-hidden
                        />
                        <span className="text-xs font-medium tracking-wide text-emerald-300">
                            Open to new roles
                        </span>
                    </div>

                    <h2
                        id="cta-heading"
                        className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
                    >
                        Let&apos;s build something
                    </h2>

                    <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
                        Senior Frontend / Full-stack opportunities. 4.5+ years of production React experience
                        in fintech and e-commerce — I reply within 24 hours.
                    </p>

                    {/* inline email form — opens mailto on submit */}
                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto mt-8 flex w-full max-w-sm items-center gap-2"
                        aria-label="Contact form"
                    >
                        <div
                            className={clsx(
                                'flex flex-1 items-center gap-2 rounded-xl border px-4 py-2.5',
                                'backdrop-blur-sm transition-all duration-200',
                                'border-white/[0.10] bg-white/[0.05]',
                                'focus-within:border-cyan-400/30 focus-within:bg-white/[0.08]'
                            )}
                        >
                            <FaEnvelope className="size-3.5 shrink-0 text-zinc-500" aria-hidden />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                aria-label="Your email address"
                                autoComplete="email"
                                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                            />
                        </div>
                        <button
                            type="submit"
                            aria-label={sent ? 'Email client opened' : 'Open email to reach out'}
                            className={clsx(
                                'inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5',
                                'border-cyan-400/35 bg-gradient-to-r from-cyan-500/20 to-sky-500/15',
                                'text-sm font-semibold text-cyan-100 transition-all duration-200',
                                'hover:border-cyan-300/50 hover:from-cyan-500/30',
                                'shadow-[0_0_18px_-4px_rgba(34,211,238,0.28)]'
                            )}
                        >
                            {sent ? (
                                <span className="text-xs text-emerald-300">Sent!</span>
                            ) : (
                                <FaPaperPlane className="size-3.5" aria-hidden />
                            )}
                        </button>
                    </form>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="mailto:adityaraj92.20@gmail.com"
                            className={clsx(
                                'inline-flex items-center gap-2 rounded-xl border border-cyan-400/35',
                                'bg-gradient-to-r from-cyan-500/15 to-sky-500/10 px-6 py-3 text-sm font-semibold text-cyan-100',
                                'shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)] transition-all duration-200',
                                'hover:border-cyan-300/50 hover:from-cyan-500/25 hover:to-sky-500/15'
                            )}
                        >
                            <FaEnvelope className="size-4 shrink-0" aria-hidden />
                            Email me
                        </Link>
                        <Link
                            href="https://www.linkedin.com/in/adityaraj11/"
                            target="_blank"
                            rel="noopener noreferrer me"
                            className={clsx(
                                'border-white/12 inline-flex items-center gap-2 rounded-xl border',
                                'bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-200',
                                'transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07]'
                            )}
                        >
                            <FaLinkedin className="size-4 shrink-0" aria-hidden />
                            LinkedIn
                        </Link>
                        <Link
                            href="https://github.com/sponsors/iamadi11"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={clsx(
                                'border-white/12 inline-flex items-center gap-2 rounded-xl border',
                                'bg-white/[0.04] px-6 py-3 text-sm font-semibold text-zinc-200',
                                'transition-all duration-200 hover:border-pink-400/40 hover:bg-pink-500/[0.08] hover:text-pink-200'
                            )}
                        >
                            <FaHeart className="size-4 shrink-0" aria-hidden />
                            Sponsor
                        </Link>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default ContactCTA;
