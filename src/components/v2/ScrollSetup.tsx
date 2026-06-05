'use client';

/* GSAP ScrollTrigger proxy for .v2-root (position:fixed; overflow-y:auto).
   Lenis drives smooth wheel interpolation; GSAP ticker syncs via raf. */

import { useLayoutEffect } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSetup(): null {
    useLayoutEffect(() => {
        const el = document.querySelector<HTMLElement>('.v2-root');
        if (!el) return () => {};

        /* Smooth scroll driver for .v2-root */
        const lenis = new Lenis({
            wrapper: el,
            lerp: 0.09,
            smoothWheel: true,
        });

        /* Tell GSAP how to read/set scroll on the custom container */
        ScrollTrigger.scrollerProxy(el, {
            scrollTop(value?: number) {
                if (arguments.length && value !== undefined) {
                    el.scrollTop = value;
                }
                return el.scrollTop;
            },
            getBoundingClientRect() {
                return { top: 0, left: 0, width: el.clientWidth, height: el.clientHeight };
            },
        });

        ScrollTrigger.defaults({ scroller: el });

        /* Lenis → GSAP ticker sync */
        lenis.on('scroll', ScrollTrigger.update);
        const rafCb = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(rafCb);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(rafCb);
            lenis.destroy();
            ScrollTrigger.defaults({ scroller: undefined });
            ScrollTrigger.killAll();
            ScrollTrigger.clearScrollMemory();
        };
    }, []);

    return null;
}
