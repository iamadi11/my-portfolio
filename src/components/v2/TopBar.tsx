'use client';

import { useEffect, useState } from 'react';

export default function TopBar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const root = document.querySelector('.v2-root') ?? window;
        const onScroll = () => {
            const el = document.querySelector('.v2-root');
            setScrolled((el?.scrollTop ?? window.scrollY) > 40);
        };
        root.addEventListener('scroll', onScroll, { passive: true });
        return () => root.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        const target = document.getElementById(id);
        const container = document.querySelector('.v2-root');
        if (target && container) {
            container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        } else {
            target?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className={`v2-topbar${scrolled ? 'v2-scrolled' : ''}`} role="banner">
            <a href="#hero" className="v2-topbar-logo" onClick={scrollTo('hero')}>
                AR<span>.</span>
            </a>
            <nav aria-label="Primary navigation">
                <ul className="v2-topbar-nav">
                    {[
                        { id: 'about', label: 'About' },
                        { id: 'experience', label: 'Work' },
                        { id: 'projects', label: 'Projects' },
                        { id: 'tech', label: 'Tech' },
                    ].map(({ id, label }) => (
                        <li key={id}>
                            <a href={`#${id}`} onClick={scrollTo(id)}>
                                {label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <a href="#contact" className="v2-btn v2-btn-primary v2-topbar-cta" onClick={scrollTo('contact')}>
                Contact
            </a>
        </header>
    );
}
