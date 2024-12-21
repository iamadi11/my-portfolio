import React from 'react';

import clsx from 'clsx';
import Link from 'next/link';
import { FaLinkedin } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const headerJson = {
    className: clsx('md:grid md:grid-cols-6 md:gap-12 md:px-12 md:py-4'),
    logo: {
        visible: true,
        className: clsx('md:col-span-1 md:col-start-1'),
        icon: 'LOGO',
    },
    nav: {
        visible: true,
        className: clsx('md:col-span-4 md:col-start-2 md:flex md:justify-center md:gap-8'),
        items: [
            {
                label: 'Home',
                href: '/',
            },
            {
                label: 'About',
                href: '/about',
            },
            {
                label: 'Tech Stack',
                href: '/tech-stack',
            },
            {
                label: 'Contact',
                href: '/contact',
            },
        ],
    },
    socials: {
        visible: true,
        className: clsx('md:col-span-1 md:col-start-6 md:flex md:justify-end md:gap-8'),
        items: [
            {
                label: <FaGithub size={'1.5em'} />,
                href: 'https://github.com/iamadi11',
            },
            {
                label: <FaLinkedin size={'1.5em'} />,
                href: 'https://www.linkedin.com/in/adityaraj11/',
            },
        ],
    },
};

const Header: React.FC = () => (
    <div className={clsx(headerJson.className)}>
        <div className={clsx(headerJson.logo.visible ? 'block' : 'hidden', headerJson.logo.className)}>
            {headerJson.logo.icon}
        </div>
        <div className={clsx(headerJson.nav.visible ? 'block' : 'hidden', headerJson.nav.className)}>
            {headerJson.nav.items.map((item) => (
                <Link key={item.href} href={item.href}>
                    {item.label}
                </Link>
            ))}
        </div>
        <div className={clsx(headerJson.socials.visible ? 'block' : 'hidden', headerJson.socials.className)}>
            {headerJson.socials.items.map((item) => (
                <Link key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                </Link>
            ))}
        </div>
    </div>
);

export default Header;
