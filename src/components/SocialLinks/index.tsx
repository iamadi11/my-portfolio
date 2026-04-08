import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaEnvelope, FaLinkedin, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const SocialLinks: React.FC = () => (
    <div className={clsx('flex flex-row items-center justify-end gap-2')}>
        <Link
            href="tel:+917257807070"
            aria-label="Call +91 72578 07070"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-cyan-200"
        >
            <FaPhoneAlt className="size-4" aria-hidden />
        </Link>
        <Link
            href="/contact"
            aria-label="Contact"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-amber-200/90"
        >
            <FaEnvelope className="size-4" aria-hidden />
        </Link>
        <Link
            href="https://github.com/iamadi11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
            <FaGithub className="size-5" aria-hidden />
        </Link>
        <Link
            href="https://www.linkedin.com/in/adityaraj11/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-sky-300"
        >
            <FaLinkedin className="size-5" aria-hidden />
        </Link>
    </div>
);

export default SocialLinks;
