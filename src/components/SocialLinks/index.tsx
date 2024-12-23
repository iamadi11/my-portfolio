import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaLinkedin } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const SocialLinks: React.FC = () => (
    <div className={clsx('flex justify-end gap-4')}>
        <Link
            href="https://github.com/iamadi11"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400"
        >
            <FaGithub size="1.5em" />
        </Link>
        <Link
            href="https://www.linkedin.com/in/adityaraj11/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400"
        >
            <FaLinkedin size="1.5em" />
        </Link>
    </div>
);

export default SocialLinks;
