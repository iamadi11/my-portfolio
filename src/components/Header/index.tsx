/* eslint-disable no-use-before-define */
import React, { JSX } from 'react';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { FaLinkedin } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa6';

const headerJson = {
    tag: 'div',
    visible: true,
    className: clsx('md:grid md:grid-cols-6 md:gap-12 md:px-12 md:py-4'),
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
                    children: [
                        {
                            tag: 'Image',
                            visible: true,
                            src: '/favicon-32x32.png',
                            alt: 'Logo',
                            width: 24,
                            height: 24,
                            className: 'animate-pulse drop-shadow-custom',
                        },
                    ],
                },
            ],
        },
        {
            tag: 'div',
            visible: true,
            className: clsx('md:col-span-4 md:col-start-2 md:flex md:justify-center md:gap-8'),
            children: [
                { tag: 'Link', visible: true, href: '/', children: 'Home' },
                { tag: 'Link', visible: true, href: '/about', children: 'About' },
                { tag: 'Link', visible: true, href: '/tech-stack', children: 'Tech Stack' },
                { tag: 'Link', visible: true, href: '/contact', children: 'Contact' },
            ],
        },
        {
            tag: 'div',
            visible: true,
            className: clsx('md:col-span-1 md:col-start-6 md:flex md:justify-end md:gap-8'),
            children: [
                {
                    tag: 'Link',
                    visible: true,
                    href: 'https://github.com/iamadi11',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: <FaGithub size="1.5em" />,
                },
                {
                    tag: 'Link',
                    visible: true,
                    href: 'https://www.linkedin.com/in/adityaraj11/',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    children: <FaLinkedin size="1.5em" />,
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
    href?: string;
    target?: string;
    rel?: string;
    children?: Element[] | string | JSX.Element;
    visible?: boolean;
}

const renderImage = (element: Element, key?: number) => (
    <Image
        key={key}
        src={element.src || ''}
        alt={element.alt || 'default alt text'}
        width={element.width}
        height={element.height}
        className={element.className}
    />
);

const renderLink = (element: Element, key?: number) => (
    <Link
        key={key}
        href={element.href || ''}
        target={element.target}
        rel={element.rel}
        className={clsx(element.className)}
    >
        {renderChildren(element.children)}
    </Link>
);

const renderChildren = (children?: Element[] | string | JSX.Element) => {
    if (!children) return null;
    if (Array.isArray(children)) {
        return children.map((child, index) => renderElement(child, index));
    }
    return children;
};

const renderElement = (element: Element, key?: number): React.ReactNode => {
    if (!element.visible) return null;

    switch (element.tag) {
        case 'Image':
            return renderImage(element, key);
        case 'Link':
            return renderLink(element, key);
        default: {
            const Tag = element.tag as keyof JSX.IntrinsicElements;
            return (
                <Tag key={key} className={clsx(element.className)}>
                    {renderChildren(element.children)}
                </Tag>
            );
        }
    }
};

const Header: React.FC = () => renderElement(headerJson);

export default Header;
