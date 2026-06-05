'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TimelineNode {
    year: string;
    company: string;
    role: string;
    detail: string;
    color: string;
    current?: boolean;
}

const NODES: TimelineNode[] = [
    {
        year: '2017',
        company: 'IIIT Lucknow',
        role: 'B.Tech — Information Technology',
        detail: 'CGPA 8.14/10. Built the foundation across data structures, algorithms, and distributed systems before entering production engineering.',
        color: 'var(--v2-accent-3)',
    },
    {
        year: '2021',
        company: 'Tata 1mg',
        role: 'Software Development Engineer I',
        detail: 'Google Maps polygon delivery zones across 20+ cities enabling 1-hour delivery. Centralized PDF microservice. Cash Collection portal for 500+ riders.',
        color: 'var(--v2-good)',
    },
    {
        year: '2023',
        company: 'Tata 1mg',
        role: 'Software Development Engineer II',
        detail: 'Build time 15 → 3 min (80%). SLA breach rate 70 → 15%. Offline-first PWA for warehouse inventory. Turborepo monorepo cutting CI from 22 → 8 min.',
        color: 'var(--v2-accent)',
    },
    {
        year: '2024',
        company: 'Moresand Technologies',
        role: 'Software Engineer',
        detail: 'Migrated legacy Backbone.js / .NET BFF to React + Node.js — 3× faster feature delivery. PWA with offline access for field teams. 50% faster repeat visits.',
        color: 'var(--v2-accent-2)',
    },
    {
        year: '2025',
        company: 'Cashfree Payments',
        role: 'Frontend Engineer II',
        detail: 'Schema-driven fraud rule engine. 200+ merchants self-configure rules — zero frontend deploys. Cashmere design system. 30% reduction in KYC session drops.',
        color: 'var(--v2-gold)',
        current: true,
    },
];

export default function CareerTimeline(): JSX.Element {
    const sectionRef = useRef<HTMLElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return () => {};

        const ctx = gsap.context(() => {
            // Animate the center spine
            if (lineRef.current) {
                gsap.fromTo(
                    lineRef.current,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        ease: 'none',
                        transformOrigin: 'top center',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 75%',
                            end: 'bottom 25%',
                            scrub: 1.2,
                        },
                    }
                );
            }

            // Stagger each node
            const nodes = section.querySelectorAll<HTMLElement>('.gm-tl-node');
            nodes.forEach((node, i) => {
                const isRight = i % 2 !== 0;
                gsap.fromTo(
                    node,
                    { x: isRight ? 48 : -48, opacity: 0 },
                    {
                        x: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: node,
                            start: 'top 80%',
                            toggleActions: 'play none none none',
                        },
                    }
                );
            });
        }, section);

        return () => ctx.revert();
    }, []);

    return (
        <section id="gm-journey" ref={sectionRef} className="gm-timeline-section" aria-label="Career journey">
            <div className="v2-container">
                <p className="v2-mono gm-section-kicker">03 / CAREER JOURNEY</p>
                <h2 className="v2-display gm-section-title">Five years of systems.</h2>
                <p className="gm-section-sub">
                    Each role built on the last — from drawing polygons on a map to architecting rule engines
                    processing millions of transactions.
                </p>
            </div>

            <div className="gm-timeline-body">
                {/* Center spine */}
                <div className="gm-tl-spine" ref={lineRef} aria-hidden="true" />

                {NODES.map((node, i) => (
                    <div
                        key={node.year + node.company}
                        className={`gm-tl-node${i % 2 !== 0 ? 'gm-tl-node-right' : ''}`}
                        role="article"
                        aria-label={`${node.year}: ${node.company}`}
                    >
                        {/* Dot connector */}
                        <div
                            className="gm-tl-dot"
                            style={{
                                borderColor: node.color,
                                background: node.current ? node.color : 'var(--v2-bg)',
                                boxShadow: node.current ? `0 0 16px ${node.color}66` : 'none',
                            }}
                            aria-hidden="true"
                        />

                        {/* Card */}
                        <div className="gm-tl-card">
                            <div className="gm-tl-year v2-mono" style={{ color: node.color }}>
                                {node.year}
                                {node.current && <span className="gm-tl-now-badge"> · NOW</span>}
                            </div>
                            <h3 className="gm-tl-company v2-display">{node.company}</h3>
                            <div className="gm-tl-role">{node.role}</div>
                            <p className="gm-tl-detail">{node.detail}</p>
                            {node.current && (
                                <div className="gm-tl-current-pill v2-mono">● currently here</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
