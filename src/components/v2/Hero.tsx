'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import dynamic from 'next/dynamic';

import { navigate } from './Chrome';
import { MagBtn } from './Cinema';
import { IDENTITY } from './data';

const HeroR3F = dynamic(() => import('./HeroR3F'), { ssr: false });

const IMPACT = [
    { val: '80%', label: 'Build time saved', ctx: 'TATA 1MG', color: 'var(--v2-good)' },
    { val: '70→15%', label: 'SLA breach rate', ctx: 'TATA 1MG', color: 'var(--v2-accent)' },
    { val: '200+', label: 'Merchants enabled', ctx: 'CASHFREE', color: 'var(--v2-gold)' },
    { val: '30%', label: 'KYC drop reduced', ctx: 'CASHFREE', color: 'var(--v2-accent-2)' },
] as const;

export default function Hero(): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isReturn = !!sessionStorage.getItem('v2_visited');
        sessionStorage.setItem('v2_visited', '1');
        if (!ref.current) return () => {};
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ref.current!.querySelectorAll('[data-hero]'),
                { y: 60, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.09,
                    ease: 'power4.out',
                    delay: isReturn ? 0 : 0.5,
                }
            );
        }, ref);
        return () => ctx.revert();
    }, []);

    return (
        <section id="gm-hero" className="gm-hero" aria-label="Introduction">
            {/* R3F particle network — desktop only via CSS */}
            <div className="gm-hero-canvas" aria-hidden="true">
                <HeroR3F />
            </div>

            {/* Radial vignette so text is readable over canvas */}
            <div className="gm-hero-vignette" aria-hidden="true" />

            {/* Content layer */}
            <div className="v2-container gm-hero-layout" ref={ref}>
                {/* Left: editorial text */}
                <div className="gm-hero-text">
                    <p className="gm-hero-eyebrow v2-mono" data-hero>
                        Frontend Engineer · {IDENTITY.yearsExp}+ yrs · Bengaluru
                    </p>

                    <h1 className="gm-hero-h1 v2-display" data-hero aria-label="Build systems that scale">
                        <span className="gm-hero-h1-line">Build systems</span>
                        <br />
                        <span className="gm-hero-h1-line gm-hero-h1-accent">that scale.</span>
                    </h1>

                    <p className="gm-hero-desc" data-hero>
                        Production-grade React, Next.js, TypeScript across fintech, e-commerce, and
                        enterprise. Currently <strong>{IDENTITY.title}</strong> at{' '}
                        <strong>{IDENTITY.company}</strong>.
                    </p>

                    <div className="gm-hero-actions" data-hero>
                        <MagBtn className="v2-btn v2-btn-primary" onClick={() => navigate('/work')}>
                            See the work →
                        </MagBtn>
                        <MagBtn className="v2-btn v2-btn-ghost" onClick={() => navigate('/contact')}>
                            Get in touch
                        </MagBtn>
                    </div>
                </div>

                {/* Right: impact stats grid — desktop only */}
                <div className="gm-hero-metrics" data-hero aria-label="Engineering impact highlights">
                    {IMPACT.map((m) => (
                        <div key={m.val} className="gm-hero-metric">
                            <span className="gm-hero-metric-val v2-display" style={{ color: m.color }}>
                                {m.val}
                            </span>
                            <span className="gm-hero-metric-label">{m.label}</span>
                            <span className="gm-hero-metric-ctx v2-mono">{m.ctx}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll cue */}
            <div className="v2-scroll-cue" aria-hidden="true">
                <div className="v2-scroll-line" />
                <span className="v2-mono">SCROLL</span>
            </div>
        </section>
    );
}
