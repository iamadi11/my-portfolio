'use client';

import { useEffect, useRef } from 'react';

/* Uses IntersectionObserver with .v2-root as the scroll root — works
   reliably with the fixed overflow container without needing GSAP scrollerProxy. */
export function useReveal(selector: string, options?: { threshold?: number; stagger?: number }) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = ref.current;
        if (!section) return;

        const root = document.querySelector('.v2-root') as Element | null;
        const threshold = options?.threshold ?? 0.15;
        const stagger = options?.stagger ?? 0;

        const targets = section.querySelectorAll<HTMLElement>(selector);
        if (!targets.length) return;

        // Set initial invisible state via inline style (CSS handles static layout)
        targets.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(28px)';
            el.style.transition = 'none';
        });

        let triggered = false;

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !triggered) {
                    triggered = true;
                    targets.forEach((el, i) => {
                        const delay = i * stagger;
                        setTimeout(
                            () => {
                                el.style.transition = `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
                                el.style.opacity = '1';
                                el.style.transform = 'translateY(0)';
                            },
                            delay > 0 ? 0 : 0
                        ); // All start together, CSS delay handles stagger
                        setTimeout(() => {
                            el.style.transition = '';
                        }, 800 + delay);
                    });
                    obs.disconnect();
                }
            },
            { root, threshold }
        );

        obs.observe(section);

        return () => obs.disconnect();
    }, [selector, options?.threshold, options?.stagger]);

    return ref;
}

/* Scale-in variant for pills/chips */
export function useRevealScale(selector: string, staggerMs = 30) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const section = ref.current;
        if (!section) return;

        const root = document.querySelector('.v2-root') as Element | null;
        const targets = section.querySelectorAll<HTMLElement>(selector);
        if (!targets.length) return;

        targets.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.85)';
            el.style.transition = 'none';
        });

        let triggered = false;

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !triggered) {
                    triggered = true;
                    targets.forEach((el, i) => {
                        const delay = i * staggerMs;
                        setTimeout(() => {
                            el.style.transition = `opacity 0.5s cubic-bezier(0.34,1.56,0.64,1), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)`;
                            el.style.opacity = '1';
                            el.style.transform = 'scale(1)';
                        }, delay);
                    });
                    obs.disconnect();
                }
            },
            { root, threshold: 0.1 }
        );

        obs.observe(section);

        return () => obs.disconnect();
    }, [selector, staggerMs]);

    return ref;
}
