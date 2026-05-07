'use client';

import { useEffect, useRef, useState } from 'react';

interface Section {
    id: string;
    label: string;
}

export default function SideNav({ sections }: { sections: Section[] }) {
    const [active, setActive] = useState(sections[0]?.id ?? '');
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const root = document.querySelector('.v2-root') ?? undefined;
        const observers = sections.map(({ id }) => {
            const el = document.getElementById(id);
            if (!el) return null;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) setActive(id);
                },
                { root, threshold: 0.4 }
            );
            obs.observe(el);
            return obs;
        });

        return () => {
            observers.forEach((o) => o?.disconnect());
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [sections]);

    const scrollTo = (id: string) => {
        const target = document.getElementById(id);
        const container = document.querySelector('.v2-root');
        if (target && container) {
            container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        } else {
            target?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className="v2-sidenav" aria-label="Section navigation" role="navigation">
            {sections.map(({ id, label }) => (
                <button
                    key={id}
                    className={`v2-dot${active === id ? 'v2-dot-active' : ''}`}
                    onClick={() => scrollTo(id)}
                    aria-label={`Go to ${label}`}
                    title={label}
                >
                    <span className="v2-dot-tip">{label}</span>
                </button>
            ))}
        </nav>
    );
}
