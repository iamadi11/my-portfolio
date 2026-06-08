'use client';

import React from 'react';

import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const Contact: React.FC = () => {
    const prefersReducedMotion = useReducedMotion();
    const reduce = prefersReducedMotion === true;

    const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

    return (
        <div className="mx-auto flex size-full max-w-lg flex-col items-center justify-center gap-12 px-4 py-16 sm:py-20">
            <motion.header
                className="text-center"
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.35, ease }}
            >
                <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                    Get in touch
                </h1>
                <p className="mt-4 text-sm text-zinc-500 sm:text-base">
                    Phone, email, GitHub, and LinkedIn — same details as on my resume.
                </p>
            </motion.header>
            <ul
                className={clsx(
                    'w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
                    'backdrop-blur-md sm:p-8'
                )}
            >
                {[
                    {
                        href: 'tel:+917257807070',
                        icon: <FaPhoneAlt className="size-5 shrink-0" aria-hidden />,
                        label: '+91 72578 07070',
                        cls: 'text-emerald-300/90 hover:text-emerald-200',
                        extra: '',
                    },
                    {
                        href: 'mailto:adityaraj92.20@gmail.com',
                        icon: <FaEnvelope className="size-5 shrink-0" aria-hidden />,
                        label: 'adityaraj92.20@gmail.com',
                        cls: 'text-amber-200/90 hover:text-amber-100',
                        extra: 'mt-1 border-t border-white/[0.06] pt-4',
                    },
                    {
                        href: 'https://github.com/iamadi11',
                        icon: <FaGithub className="size-6 shrink-0" aria-hidden />,
                        label: 'github.com/iamadi11',
                        cls: 'text-zinc-400 hover:text-white',
                        extra: 'mt-4 border-t border-white/[0.06] pt-4',
                        target: '_blank',
                        rel: 'noopener noreferrer me',
                    },
                    {
                        href: 'https://www.linkedin.com/in/adityaraj11/',
                        icon: <FaLinkedin className="size-6 shrink-0" aria-hidden />,
                        label: 'linkedin.com/in/adityaraj11',
                        cls: 'text-sky-400/90 hover:text-sky-300',
                        extra: 'mt-4 border-t border-white/[0.06] pt-4',
                        target: '_blank',
                        rel: 'noopener noreferrer me',
                    },
                ].map(({ href, icon, label, cls, extra, target, rel }, i) => (
                    <motion.li
                        key={href}
                        className={extra}
                        initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            reduce ? { duration: 0 } : { delay: 0.1 + i * 0.07, duration: 0.35, ease }
                        }
                    >
                        <Link
                            href={href}
                            target={target}
                            rel={rel}
                            className={clsx(
                                'flex items-center gap-4 rounded-xl py-2 transition-colors hover:bg-white/[0.04]',
                                cls
                            )}
                        >
                            {icon}
                            <span className="break-all text-base font-medium text-zinc-200">{label}</span>
                        </Link>
                    </motion.li>
                ))}
            </ul>
        </div>
    );
};

export default Contact;
