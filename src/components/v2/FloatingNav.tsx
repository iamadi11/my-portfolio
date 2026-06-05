'use client';

import { useEffect, useState } from 'react';

interface NavDot {
    id: string;
    label: string;
}

const ALL_DOTS: NavDot[] = [
    { id: 'gm-hero', label: 'Intro' },
    { id: 'gm-impact', label: 'Impact' },
    { id: 'gm-journey', label: 'Journey' },
    { id: 'gm-work', label: 'Work' },
    { id: 'gm-philosophy', label: 'Thinking' },
    { id: 'gm-contact', label: 'Contact' },
];

export default function FloatingNav(): JSX.Element {
    const [active, setActive] = useState<string>('gm-hero');
    const [dots, setDots] = useState<NavDot[]>([]);

    useEffect(() => {
        const visible = ALL_DOTS.filter(({ id }) => !!document.getElementById(id));
        setDots(visible);

        const scroller = document.querySelector<HTMLElement>('.v2-root');
        if (!scroller || !visible.length) return () => {};

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setActive(e.target.id);
                });
            },
            { root: scroller, rootMargin: '-35% 0px -55% 0px', threshold: 0 }
        );

        visible.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollTo = (id: string) => {
        const scroller = document.querySelector<HTMLElement>('.v2-root');
        const target = document.getElementById(id);
        if (!scroller || !target) return;
        scroller.scrollTo({ top: target.offsetTop - 56, behavior: 'smooth' });
    };

    if (!dots.length) return <></>;

    return (
        <nav className="gm-floatnav" aria-label="Page sections">
            {dots.map(({ id, label }) => (
                <button
                    key={id}
                    className={`gm-floatnav-item${active === id ? 'is-active' : ''}`}
                    onClick={() => scrollTo(id)}
                    aria-label={`Go to ${label}`}
                    aria-current={active === id ? 'true' : undefined}
                >
                    <span className="gm-floatnav-label v2-mono" aria-hidden="true">
                        {label}
                    </span>
                    <span className="gm-floatnav-pip" aria-hidden="true" />
                </button>
            ))}
        </nav>
    );
}
