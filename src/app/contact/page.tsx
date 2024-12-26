'use client';

import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaLinkedin, FaMailBulk, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const Contact: React.FC = () => (
    <div className="flex size-full flex-col items-center justify-center gap-8 bg-black py-8">
        <div className="text-center text-5xl">
            <div className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-4xl font-extrabold text-transparent">
                If you have any questions, feel free to reach out:
            </div>
        </div>
        <div className={clsx('flex flex-row items-center justify-center gap-8')}>
            <Link
                href="tel:+919667967979"
                className="text-2xl text-green-300 transition-transform duration-200 hover:scale-150 hover:text-green-400"
            >
                <FaPhoneAlt />
            </Link>
            <Link
                href="mailto:adityaiiitl@gmail.com"
                className="text-2xl text-orange-200 transition-transform duration-200 hover:scale-150 hover:text-orange-300"
            >
                <FaMailBulk />
            </Link>
            <Link
                href="https://github.com/iamadi11"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-gray-300 transition-transform duration-200 hover:scale-150 hover:text-gray-200"
            >
                <FaGithub />
            </Link>
            <Link
                href="https://www.linkedin.com/in/adityaraj11/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl text-blue-500 transition-transform duration-200 hover:scale-150 hover:text-blue-600"
            >
                <FaLinkedin />
            </Link>
        </div>
    </div>
);

export default Contact;
