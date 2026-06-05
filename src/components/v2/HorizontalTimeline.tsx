'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Chapter {
    year: string;
    company: string;
    role: string;
    location: string;
    color: string;
    bullets: string[];
    current?: boolean;
}

const CHAPTERS: Chapter[] = [
    {
        year: '2017 – 2021',
        company: 'IIIT Lucknow',
        role: 'B.Tech — Information Technology',
        location: 'Lucknow',
        color: 'var(--v2-accent-3)',
        bullets: [
            'CGPA 8.14 / 10',
            'Data structures, distributed systems, algorithms',
            'Foundation before production engineering',
        ],
    },
    {
        year: '2021 – 2023',
        company: 'Tata 1mg',
        role: 'Software Development Engineer I',
        location: 'Gurugram',
        color: 'var(--v2-good)',
        bullets: [
            'Google Maps polygon delivery zones — 20+ cities, 1-hour delivery enabled',
            'Centralized PDF microservice retiring 5+ team-specific implementations',
            'Cash Collection portal — automated 15+ hrs/week manual reconciliation for 500+ riders',
        ],
    },
    {
        year: '2023 – 2024',
        company: 'Tata 1mg',
        role: 'Software Development Engineer II',
        location: 'Gurugram',
        color: 'var(--v2-accent)',
        bullets: [
            'Build time 15 → 3 min (80%) via Webpack 5 + Turborepo remote cache',
            'SLA breach rate 70 → 15% — WebPush + Redis + SSE pipeline, median alert 4 min → 8 s',
            'Offline-first PWA for warehouse inventory — 45% fewer data-loss incidents',
        ],
    },
    {
        year: '2024 – 2025',
        company: 'Moresand Technologies',
        role: 'Software Engineer',
        location: 'Bengaluru',
        color: 'var(--v2-accent-2)',
        bullets: [
            'Backbone.js / .NET BFF → React + Node.js migration — 3× faster feature delivery',
            'PWA service-worker pre-cache + React Query — 50% faster repeat visits',
            'Offline access for field teams in low-connectivity environments',
        ],
    },
    {
        year: '2025 – 2026',
        company: 'Cashfree Payments',
        role: 'Frontend Engineer II',
        location: 'Bengaluru',
        color: 'var(--v2-gold)',
        current: true,
        bullets: [
            'Schema-driven fraud rule engine — 200+ merchants self-configure, zero frontend deploys',
            'Cashmere: React design system with Storybook, Figma token sync, CLI scaffolding',
            'Video KYC reconnection state machine — 30% drop-rate reduction',
        ],
    },
];

export default function HorizontalTimeline(): JSX.Element {
    const sectionRef = useRef<HTMLElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const sticky = stickyRef.current;
        const track = trackRef.current;
        if (!section || !sticky || !track) return () => {};

        const ctx = gsap.context(() => {
            const getAmount = () => track.scrollWidth - sticky.clientWidth;

            gsap.to(track, {
                x: () => -getAmount(),
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top top+=56',
                    end: () => `+=${getAmount()}`,
                    scrub: 1.5,
                    invalidateOnRefresh: true,
                },
            });

            // Reveal header elements
            const header = section.querySelector<HTMLDivElement>('.gm-htl-header');
            if (header) {
                gsap.fromTo(
                    header.children,
                    { y: 32, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        stagger: 0.1,
                        duration: 0.7,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: header, start: 'top 82%', once: true },
                    }
                );
            }
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <section id="gm-journey" ref={sectionRef} className="gm-htl-section" aria-label="Career journey">
            {/* Sticky container that holds the horizontal track */}
            <div className="gm-htl-sticky" ref={stickyRef}>
                {/* Section header — visible at entry */}
                <div className="gm-htl-header">
                    <p className="v2-mono gm-section-kicker">03 / CAREER JOURNEY</p>
                    <h2 className="v2-display gm-section-title">Five years of systems.</h2>
                    <p className="gm-htl-hint v2-mono" aria-hidden="true">
                        scroll →
                    </p>
                </div>

                {/* Horizontal track */}
                <div className="gm-htl-track" ref={trackRef} role="list">
                    {CHAPTERS.map((ch, i) => (
                        <article
                            key={ch.year + ch.company}
                            className="gm-htl-card"
                            role="listitem"
                            aria-label={`${ch.year}: ${ch.company}`}
                        >
                            {/* Accent top line */}
                            <div
                                className="gm-htl-accent-line"
                                style={{ background: ch.color }}
                                aria-hidden="true"
                            />

                            {/* Chapter number */}
                            <div className="gm-htl-num v2-mono" style={{ color: ch.color }}>
                                {String(i + 1).padStart(2, '0')}
                            </div>

                            {/* Year */}
                            <div className="gm-htl-year v2-mono" style={{ color: ch.color }}>
                                {ch.year}
                                {ch.current && <span className="gm-htl-now"> · current</span>}
                            </div>

                            {/* Company */}
                            <h3 className="gm-htl-company v2-display">{ch.company}</h3>

                            {/* Role + location */}
                            <div className="gm-htl-meta">
                                <span className="gm-htl-role">{ch.role}</span>
                                <span className="gm-htl-sep" aria-hidden="true">
                                    {' '}
                                    ·{' '}
                                </span>
                                <span className="gm-htl-loc v2-mono">{ch.location}</span>
                            </div>

                            {/* Bullets */}
                            <ul className="gm-htl-bullets">
                                {ch.bullets.map((b) => (
                                    <li key={b}>{b}</li>
                                ))}
                            </ul>

                            {/* Current badge */}
                            {ch.current && <div className="gm-htl-badge v2-mono">● currently here</div>}
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
