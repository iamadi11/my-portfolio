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
        <div className={clsx('flex flex-row flex-wrap items-center justify-center gap-8')}>
            <Link
                href="tel:+917257807070"
                className="text-2xl text-green-300 transition-transform duration-200 hover:scale-110 hover:text-green-400"
                aria-label="Call"
            >
                <FaPhoneAlt />
            </Link>
            <Link
                href="mailto:adityaraj92.20@gmail.com"
                className="text-2xl text-orange-200 transition-transform duration-200 hover:scale-110 hover:text-orange-300"
                aria-label="Email"
            >
                <FaMailBulk />
            </Link>
            <Link
                href="https://github.com/iamadi11"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-gray-300 transition-transform duration-200 hover:scale-110 hover:text-gray-200"
                aria-label="GitHub"
            >
                <FaGithub />
            </Link>
            <Link
                href="https://www.linkedin.com/in/adityaraj11/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-blue-500 transition-transform duration-200 hover:scale-110 hover:text-blue-600"
                aria-label="LinkedIn"
            >
                <FaLinkedin />
            </Link>
        </div>
    </div>
);

export default Contact;
