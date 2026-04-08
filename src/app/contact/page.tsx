'use client';

import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaLinkedin, FaMailBulk, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const Contact: React.FC = () => (
    <div className="flex size-full flex-col items-center justify-center gap-10 px-4 py-10">
        <div className="max-w-lg text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">Get in touch</h1>
            <p className="mt-3 text-sm text-gray-400 md:text-base">
                Phone, email, GitHub, and LinkedIn — same details as on my resume.
            </p>
        </div>
        <ul
            className={clsx(
                'flex w-full max-w-md flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left',
                'md:max-w-lg'
            )}
        >
            <li>
                <Link
                    href="tel:+917257807070"
                    className="flex items-center gap-4 text-green-300 transition-colors hover:text-green-200"
                >
                    <FaPhoneAlt className="size-5 shrink-0" aria-hidden />
                    <span className="text-base font-medium text-gray-200">+91 72578 07070</span>
                </Link>
            </li>
            <li>
                <Link
                    href="mailto:adityaraj92.20@gmail.com"
                    className="flex items-center gap-4 text-orange-200 transition-colors hover:text-orange-100"
                >
                    <FaMailBulk className="size-5 shrink-0" aria-hidden />
                    <span className="break-all text-base font-medium text-gray-200">
                        adityaraj92.20@gmail.com
                    </span>
                </Link>
            </li>
            <li>
                <Link
                    href="https://github.com/iamadi11"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-gray-300 transition-colors hover:text-gray-100"
                >
                    <FaGithub className="size-6 shrink-0" aria-hidden />
                    <span className="text-base font-medium text-gray-200">github.com/iamadi11</span>
                </Link>
            </li>
            <li>
                <Link
                    href="https://www.linkedin.com/in/adityaraj11/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-blue-400 transition-colors hover:text-blue-300"
                >
                    <FaLinkedin className="size-6 shrink-0" aria-hidden />
                    <span className="break-all text-base font-medium text-gray-200">
                        linkedin.com/in/adityaraj11
                    </span>
                </Link>
            </li>
        </ul>
    </div>
);

export default Contact;
