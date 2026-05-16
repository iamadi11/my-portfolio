'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';

gsap.registerPlugin(ScrollTrigger);

const HeroCanvas = dynamic(() => import('./HeroCanvas'), { ssr: false });

export default function Hero(): JSX.Element {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const cueRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const content = contentRef.current;
        if (!section || !content) return () => {};

        const delay = sessionStorage.getItem('v2_visited') ? 0.1 : 1.3;
        const items = content.querySelectorAll<HTMLElement>('[data-hero]');

        const ctx = gsap.context(() => {
            // Entrance: stagger each labelled element
            gsap.fromTo(
                items,
                { opacity: 0, y: 44 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    stagger: 0.11,
                    ease: 'power3.out',
                    delay,
                }
            );

            // Scroll cue fade in after entrance
            gsap.fromTo(cueRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: delay + 1 });

            // Fade content out as user scrolls past hero
            gsap.to(content, {
                opacity: 0,
                y: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top top',
                    end: '45% top',
                    scrub: 1.2,
                },
            });
        }, section);

        return () => ctx.revert();
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
        <section id="hero" ref={sectionRef} className="v2-hero" aria-label="Introduction">
            {/* Three.js canvas — desktop only */}
            <div className="v2-hero-canvas" aria-hidden="true">
                <HeroCanvas />
            </div>

            {/* Subtle noise overlay */}
            <div className="v2-hero-noise" aria-hidden="true" />

            {/* Hero content */}
            <div className="v2-container v2-hero-content">
                <div ref={contentRef}>
                    <p className="v2-hero-eyebrow" data-hero>
                        Frontend Engineer · Bengaluru, India
                    </p>

                    <h1 className="v2-hero-name" data-hero>
                        Aditya
                        <span className="v2-line2 v2-grad">Raj</span>
                    </h1>

                    <p className="v2-hero-sub" data-hero>
                        <strong>Frontend Engineer II</strong> at Cashfree Payments
                    </p>

                    <p className="v2-hero-desc" data-hero>
                        ~4.5 years building fast, accessible, production-grade web apps in fintech,
                        e-commerce, and enterprise. React · Next.js · TypeScript.
                    </p>

                    <div className="v2-hero-actions" data-hero>
                        <a href="#projects" className="v2-btn v2-btn-primary" onClick={scrollTo('projects')}>
                            View Projects
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path
                                    d="M7 1L7 13M7 13L13 7M7 13L1 7"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </a>
                        <a href="#contact" className="v2-btn v2-btn-ghost" onClick={scrollTo('contact')}>
                            Get In Touch
                        </a>
                    </div>
                </div>
            </div>

            {/* Scroll cue */}
            <div ref={cueRef} className="v2-scroll-cue" aria-hidden="true">
                <div className="v2-scroll-line" />
                <span>scroll</span>
            </div>
        </section>
    );
}
