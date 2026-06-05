'use client';

/**
 * ImpactOpening — the first thing visitors see.
 *
 * Philosophy: Lead with OUTCOMES, not identity.
 * Each metric fills the screen alone — one at a time — before
 * the headline and identity appear.
 *
 * Animation: GSAP ScrollTrigger sequential beats.
 * Each trigger div (hidden, full-height) paces the reveal.
 * CSS sticky keeps the visual anchored while triggers scroll past.
 */

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BEATS = [
    {
        num: '80%',
        verb: 'faster builds.',
        detail: 'Webpack 5 persistent cache + Turborepo remote · 15 min → 3 min',
        attr: 'TATA 1MG · 2023',
        color: 'var(--v2-good)',
    },
    {
        num: '70→15%',
        verb: 'SLA breach rate.',
        detail: 'WebPush + Redis pub/sub + SSE · median alert 4 min → 8 s',
        attr: 'TATA 1MG · 2023',
        color: 'var(--v2-accent)',
    },
    {
        num: '200+',
        verb: 'merchants unblocked.',
        detail: 'Schema-driven fraud rule engine · zero frontend deploys per rule change',
        attr: 'CASHFREE · 2025',
        color: 'var(--v2-gold)',
    },
    {
        num: '30%',
        verb: 'fewer KYC drops.',
        detail: 'Reconnection state machine with exponential backoff · low-bandwidth mobile',
        attr: 'CASHFREE · 2025',
        color: 'var(--v2-accent-2)',
    },
] as const;

export default function ImpactOpening(): JSX.Element {
    const outerRef = useRef<HTMLElement>(null);
    const beatsRef = useRef<(HTMLDivElement | null)[]>([]);
    const triggerRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const outer = outerRef.current;
        if (!outer) return () => {};

        const ctx = gsap.context(() => {
            // Set all beats invisible
            beatsRef.current.forEach((b) => {
                if (b) gsap.set(b, { opacity: 0, y: 48 });
            });

            // Each trigger div sequentially fades in the corresponding beat
            triggerRefs.current.forEach((trig, i) => {
                if (!trig || !beatsRef.current[i]) return;
                const beat = beatsRef.current[i]!;
                const prev = beatsRef.current[i - 1];

                ScrollTrigger.create({
                    trigger: trig,
                    start: 'top 70%',
                    onEnter: () => {
                        // Fade out previous beat
                        if (prev) gsap.to(prev, { opacity: 0, y: -36, duration: 0.45, ease: 'power3.in' });
                        // Fade in current beat
                        gsap.fromTo(
                            beat,
                            { opacity: 0, y: 48 },
                            { opacity: 1, y: 0, duration: 0.65, ease: 'power4.out' }
                        );
                    },
                    onLeaveBack: () => {
                        // Going back: restore previous, hide current
                        gsap.to(beat, { opacity: 0, y: 48, duration: 0.4, ease: 'power3.in' });
                        if (prev)
                            gsap.fromTo(
                                prev,
                                { opacity: 0, y: -36 },
                                { opacity: 1, y: 0, duration: 0.55, ease: 'power4.out' }
                            );
                    },
                });
            });

            // Show first beat when section enters view
            ScrollTrigger.create({
                trigger: outer,
                start: 'top 80%',
                once: true,
                onEnter: () => {
                    if (beatsRef.current[0]) {
                        gsap.to(beatsRef.current[0], {
                            opacity: 1,
                            y: 0,
                            duration: 0.8,
                            ease: 'power4.out',
                            delay: 0.15,
                        });
                    }
                },
            });
        }, outer);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={outerRef} className="gm-io-outer" aria-label="Engineering impact metrics">
            {/* Sticky visual — stays in place while triggers scroll past */}
            <div className="gm-io-sticky">
                {/* Background grid mark */}
                <div className="gm-io-grid" aria-hidden="true" />

                {/* All beats overlaid, GSAP fades between them */}
                {BEATS.map((beat, i) => (
                    <div
                        key={beat.num}
                        ref={(el) => {
                            beatsRef.current[i] = el;
                        }}
                        className="gm-io-beat"
                        aria-label={`${beat.num} ${beat.verb} ${beat.attr}`}
                    >
                        <div className="gm-io-beat-inner">
                            <div className="gm-io-num v2-display" style={{ color: beat.color }}>
                                {beat.num}
                            </div>
                            <div className="gm-io-verb v2-display">{beat.verb}</div>
                            <div className="gm-io-detail v2-mono">{beat.detail}</div>
                            <div className="gm-io-attr v2-mono">{beat.attr}</div>
                        </div>

                        {/* Subtle accent circle */}
                        <div
                            className="gm-io-accent-circle"
                            style={{ background: beat.color }}
                            aria-hidden="true"
                        />
                    </div>
                ))}

                {/* Scroll hint */}
                <div className="gm-io-scroll-hint v2-mono" aria-hidden="true">
                    scroll for context ↓
                </div>
            </div>

            {/* Hidden scroll-pace trigger divs */}
            {BEATS.map((beat, i) => (
                <div
                    key={'t' + beat.num}
                    ref={(el) => {
                        triggerRefs.current[i] = el;
                    }}
                    className="gm-io-trigger"
                    aria-hidden="true"
                />
            ))}
        </section>
    );
}
