import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaLinkedin, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const SocialLinks: React.FC = () => (
    <div className={clsx('flex flex-row items-center justify-end gap-4')}>
        <Link href="tel:+919667967979" className="text-md text-gray-300 transition-colors hover:text-white">
            <FaPhoneAlt />
        </Link>
        <Link
            href="https://github.com/iamadi11"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl text-gray-300 transition-colors hover:text-white"
        >
            <FaGithub />
        </Link>
        <Link
            href="https://www.linkedin.com/in/adityaraj11/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl text-gray-300 transition-colors hover:text-white"
        >
            <FaLinkedin />
        </Link>
    </div>
);

export default SocialLinks;
