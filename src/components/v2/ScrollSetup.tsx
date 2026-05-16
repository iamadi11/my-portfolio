'use client';

/* GSAP ScrollTrigger requires scrollerProxy() for non-window scrollers.
   v2-root is position:fixed;overflow-y:auto — we must proxy its scroll
   so ScrollTrigger can correctly compute trigger positions. */
import { useLayoutEffect } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollSetup(): null {
    useLayoutEffect(() => {
        const el = document.querySelector('.v2-root') as HTMLElement;
        if (!el) return () => {};

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

        const onScroll = () => ScrollTrigger.update();
        el.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            el.removeEventListener('scroll', onScroll);
            ScrollTrigger.defaults({ scroller: undefined });
            ScrollTrigger.killAll();
            ScrollTrigger.clearScrollMemory();
        };
    }, []);

    return null;
}
