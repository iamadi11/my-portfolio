'use client';

import React, { JSX } from 'react';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaLinkedin, FaPhoneAlt } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

function HomeLogo() {
    return (
        <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className="drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]"
        >
            <defs>
                <linearGradient id="hl-bg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0.10)" />
                </linearGradient>
                <linearGradient id="hl-border" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
                    <stop offset="100%" stopColor="rgba(139,92,246,0.3)" />
                </linearGradient>
                <linearGradient id="hl-text" x1="6" y1="8" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
            <rect width="28" height="28" rx="7" fill="url(#hl-bg)" />
            <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" stroke="url(#hl-border)" strokeWidth="1" />
            <text
                x="14"
                y="19.5"
                textAnchor="middle"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
                fontWeight="800"
                fontSize="11"
                letterSpacing="-0.5"
                fill="url(#hl-text)"
            >
                AR
            </text>
        </svg>
    );
}

const headerJson = {
    tag: 'div',
    visible: true,
    className: clsx(
        'border-b border-white/5 bg-zinc-950/75 backdrop-blur-xl',
        'flex flex-row justify-between px-4 pb-3 pt-4 md:grid md:grid-cols-6 md:gap-12 md:px-10 md:py-4'
    ),
    children: [
        {
            tag: 'div',
            visible: true,
            className: clsx('md:col-span-1 md:col-start-1'),
            children: [
                {
                    tag: 'Link',
                    href: '/',
                    visible: true,
                    ariaLabel: 'Aditya Raj — home',
                    children: <HomeLogo />,
                },
            ],
        },
        {
            tag: 'div',
            visible: true,
            className: clsx(
                'flex justify-around gap-4 md:col-span-4 md:col-start-2 md:flex md:justify-center md:gap-8 md:py-0'
            ),
            children: [
                {
                    tag: 'Link',
                    visible: true,
                    href: '/',
                    children: 'Home',
                    className:
                        'rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white',
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: '/about',
                    children: 'About',
                    className:
                        'rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white',
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: '/tech-stack',
                    children: 'Tech',
                    className:
                        'rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white',
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: '/contact',
                    children: 'Contact',
                    className:
                        'rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white',
                },
            ],
        },
        {
            tag: 'div',
            visible: true,
            className: clsx(
                'hidden gap-8 py-4 md:col-span-1 md:col-start-6 md:flex md:justify-end md:gap-8 md:py-0',
                'items-center justify-end'
            ),
            children: [
                {
                    tag: 'Link',
                    visible: true,
                    href: 'tel:+917257807070',
                    ariaLabel: 'Call +91 72578 07070',
                    children: <FaPhoneAlt />,
                    className:
                        'rounded-lg p-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-cyan-200',
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: 'https://github.com/iamadi11',
                    target: '_blank',
                    rel: 'noopener noreferrer me',
                    ariaLabel: 'GitHub profile',
                    children: <FaGithub />,
                    className:
                        'rounded-lg p-2 text-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white',
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: 'https://www.linkedin.com/in/adityaraj11/',
                    target: '_blank',
                    rel: 'noopener noreferrer me',
                    ariaLabel: 'LinkedIn profile',
                    children: <FaLinkedin />,
                    className:
                        'rounded-lg p-2 text-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-sky-300',
                },
            ],
        },
    ],
};

interface Element {
    tag: string;
    className?: string;
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    ariaLabel?: string;
    children?: Element[] | string | JSX.Element;
    visible?: boolean;
}

function isInternalNavMatch(href: string, pathname: string): boolean {
    if (!href.startsWith('/')) return false;
    if (href === '/') return pathname === '/';
    return pathname === href;
}

const Header: React.FC = () => {
    const pathname = usePathname() ?? '';

    function renderTree(element: Element, key?: number): React.ReactNode {
        function renderChildContent(children?: Element[] | string | JSX.Element) {
            if (!children) return null;
            if (Array.isArray(children)) {
                return children.map((child, index) => renderTree(child, index));
            }
            return children;
        }

        if (!element.visible) return null;

        switch (element.tag) {
            case 'Image':
                return (
                    <Image
                        key={key}
                        src={element.src || ''}
                        alt={element.alt ?? 'default alt text'}
                        width={element.width}
                        height={element.height}
                        priority={element.priority}
                        className={element.className}
                    />
                );
            case 'Link': {
                const href = element.href || '';
                const isTextNavItem = typeof element.children === 'string';
                const navActive = isTextNavItem && isInternalNavMatch(href, pathname);

                return (
                    <Link
                        key={key}
                        href={href}
                        target={element.target}
                        rel={element.rel}
                        className={clsx(
                            element.className,
                            navActive && 'bg-cyan-500/10 font-semibold text-cyan-200'
                        )}
                        aria-current={navActive ? 'page' : undefined}
                        aria-label={element.ariaLabel}
                    >
                        {renderChildContent(element.children)}
                    </Link>
                );
            }
            default: {
                const Tag = element.tag as keyof JSX.IntrinsicElements;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const DynTag = Tag as any;
                return (
                    <DynTag key={key} className={clsx(element.className)}>
                        {renderChildContent(element.children)}
                    </DynTag>
                );
            }
        }
    }

    return renderTree(headerJson);
};

export default Header;
