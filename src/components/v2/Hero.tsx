'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import dynamic from 'next/dynamic';

import { navigate } from './Chrome';
import { MagBtn } from './Cinema';
import { IDENTITY } from './data';
import TextScramble from './TextScramble';

const HeroScene3D = dynamic(() => import('./HeroScene3D'), { ssr: false });

/**
 * Hero — IDENTITY after IMPACT.
 * By the time visitors reach this section they've seen the numbers.
 * Now they get the statement + the 3D scene.
 * Zero prose. One headline. Two CTAs.
 */
export default function Hero(): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isReturn = !!sessionStorage.getItem('v2_visited');
        sessionStorage.setItem('v2_visited', '1');
        if (!ref.current) return () => {};
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ref.current!.querySelectorAll('[data-hero]'),
                { y: 56, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.1,
                    stagger: 0.1,
                    ease: 'power4.out',
                    delay: isReturn ? 0 : 0.35,
                }
            );
        }, ref);
        return () => ctx.revert();
    }, []);

    return (
        <section id="gm-hero" className="gm-hero" aria-label="Introduction">
            {/* Full-bleed 3D — takes ALL the space */}
            <div className="gm-hero-canvas" aria-hidden="true">
                <HeroScene3D />
            </div>

            {/* Very light vignette — just enough to read text */}
            <div className="gm-hero-vignette" aria-hidden="true" />

            {/* Minimal text overlay — bottom-left anchor */}
            <div className="gm-hero-overlay" ref={ref}>
                <p className="gm-hero-eyebrow v2-mono" data-hero>
                    {IDENTITY.title} · {IDENTITY.company}
                </p>

                <h1 className="gm-hero-h1 v2-display" data-hero aria-label="Build systems that scale">
                    <TextScramble text="Build systems" delay={400} duration={800} />
                    <br />
                    <TextScramble
                        text="that scale."
                        className="gm-hero-h1-accent"
                        delay={700}
                        duration={600}
                    />
                </h1>

                <div className="gm-hero-actions" data-hero>
                    <MagBtn className="v2-btn v2-btn-primary" onClick={() => navigate('/work')}>
                        See the work →
                    </MagBtn>
                    <MagBtn className="v2-btn v2-btn-ghost" onClick={() => navigate('/contact')}>
                        Get in touch
                    </MagBtn>
                </div>
            </div>

            <div className="v2-scroll-cue" aria-hidden="true">
                <div className="v2-scroll-line" />
                <span className="v2-mono">scroll</span>
            </div>
        </section>
    );
}
