'use client';

import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const Contact: React.FC = () => (
    <div className="mx-auto flex size-full max-w-lg flex-col items-center justify-center gap-12 px-4 py-16 sm:py-20">
        <header className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Get in touch
            </h1>
            <p className="mt-4 text-sm text-zinc-500 sm:text-base">
                Phone, email, GitHub, and LinkedIn — same details as on my resume.
            </p>
        </header>
        <ul
            className={clsx(
                'w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]',
                'backdrop-blur-md sm:p-8'
            )}
        >
            <li>
                <Link
                    href="tel:+917257807070"
                    className="flex items-center gap-4 rounded-xl py-2 text-emerald-300/90 transition-colors hover:bg-white/[0.04] hover:text-emerald-200"
                >
                    <FaPhoneAlt className="size-5 shrink-0" aria-hidden />
                    <span className="text-base font-medium text-zinc-200">+91 72578 07070</span>
                </Link>
            </li>
            <li className="mt-1 border-t border-white/[0.06] pt-4">
                <Link
                    href="mailto:adityaraj92.20@gmail.com"
                    className="flex items-center gap-4 rounded-xl py-2 text-amber-200/90 transition-colors hover:bg-white/[0.04] hover:text-amber-100"
                >
                    <FaEnvelope className="size-5 shrink-0" aria-hidden />
                    <span className="break-all text-base font-medium text-zinc-200">
                        adityaraj92.20@gmail.com
                    </span>
                </Link>
            </li>
            <li className="mt-4 border-t border-white/[0.06] pt-4">
                <Link
                    href="https://github.com/iamadi11"
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="flex items-center gap-4 rounded-xl py-2 text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                    <FaGithub className="size-6 shrink-0" aria-hidden />
                    <span className="text-base font-medium text-zinc-200">github.com/iamadi11</span>
                </Link>
            </li>
            <li className="mt-4 border-t border-white/[0.06] pt-4">
                <Link
                    href="https://www.linkedin.com/in/adityaraj11/"
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="flex items-center gap-4 rounded-xl py-2 text-sky-400/90 transition-colors hover:bg-white/[0.04] hover:text-sky-300"
                >
                    <FaLinkedin className="size-6 shrink-0" aria-hidden />
                    <span className="break-all text-base font-medium text-zinc-200">
                        linkedin.com/in/adityaraj11
                    </span>
                </Link>
            </li>
        </ul>
    </div>
);

export default Contact;
