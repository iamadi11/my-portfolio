'use client';

import React from 'react';

import { useMotionValue, type MotionValue } from 'motion/react';

export type SceneRange = { start: number; end: number };

type JourneyContextValue = {
    scrollProgress: MotionValue<number>;
    register: (id: string, el: HTMLElement) => () => void;
    getRange: (id: string) => SceneRange | undefined;
    /** Bumped after each range measurement so derived values can recompute. */
    version: number;
};

const JourneyContext = React.createContext<JourneyContextValue | null>(null);

export function useJourney(): JourneyContextValue {
    const ctx = React.useContext(JourneyContext);
    if (!ctx) {
        throw new Error('useJourney must be used within JourneyProvider');
    }
    return ctx;
}

/**
 * The site Layout scrolls an inner `<main overflow-y-auto>`, not the window,
 * so progress is tracked on the nearest scrollable ancestor of the first
 * registered scene (falling back to the document).
 */
function getScrollParent(el: HTMLElement): HTMLElement {
    let node = el.parentElement;
    while (node) {
        const { overflowY } = getComputedStyle(node);
        if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }
    return document.scrollingElement as HTMLElement;
}

/**
 * Owns the single scroll progress value (0–1 across the scroll container) and
 * the scene registry. Scene ranges use viewport-traversal semantics: a scene's
 * range starts when its top reaches the viewport bottom and ends when its
 * bottom passes the viewport top — so a scene fully on screen at load (the
 * hero) is already mid-range and visible without any scrolling. Range bounds
 * may exceed [0, 1]; consumers clamp. All scene animation derives from this
 * one MotionValue — scenes never attach their own scroll listeners.
 */
export function JourneyProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const scrollProgress = useMotionValue(0);
    const containerRef = React.useRef<HTMLElement | null>(null);
    const elementsRef = React.useRef(new Map<string, HTMLElement>());
    const rangesRef = React.useRef(new Map<string, SceneRange>());
    const observerRef = React.useRef<ResizeObserver | null>(null);
    const frameRef = React.useRef(0);
    const [version, setVersion] = React.useState(0);

    const measure = React.useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const isDoc = container === document.scrollingElement;
        const viewport = container.clientHeight;
        const scrollable = container.scrollHeight - viewport;
        if (scrollable <= 0 || viewport <= 0) return;
        const containerTop = isDoc ? 0 : container.getBoundingClientRect().top;
        rangesRef.current = new Map(
            Array.from(elementsRef.current, ([id, el]) => {
                const rect = el.getBoundingClientRect();
                const top = rect.top + container.scrollTop - containerTop;
                return [
                    id,
                    {
                        start: (top - viewport) / scrollable,
                        end: (top + rect.height) / scrollable,
                    },
                ];
            })
        );
        scrollProgress.set(container.scrollTop / scrollable);
        setVersion((v) => v + 1);
    }, [scrollProgress]);

    const scheduleMeasure = React.useCallback(() => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(measure);
    }, [measure]);

    const register = React.useCallback(
        (id: string, el: HTMLElement) => {
            elementsRef.current.set(id, el);
            containerRef.current ??= getScrollParent(el);
            observerRef.current?.observe(el);
            scheduleMeasure();
            return () => {
                elementsRef.current.delete(id);
                rangesRef.current.delete(id);
                observerRef.current?.unobserve(el);
            };
        },
        [scheduleMeasure]
    );

    const getRange = React.useCallback((id: string) => rangesRef.current.get(id), []);

    // Child effects run before this parent effect, so scenes are registered
    // and the scroll container is already discovered by the time this runs.
    React.useEffect(() => {
        const container = containerRef.current ?? (document.scrollingElement as HTMLElement);
        containerRef.current = container;
        const isDoc = container === document.scrollingElement;
        const scrollTarget: EventTarget = isDoc ? window : container;

        const onScroll = (): void => {
            const scrollable = container.scrollHeight - container.clientHeight;
            if (scrollable > 0) scrollProgress.set(container.scrollTop / scrollable);
        };

        const observer = new ResizeObserver(scheduleMeasure);
        observerRef.current = observer;
        observer.observe(container);
        elementsRef.current.forEach((el) => observer.observe(el));

        scrollTarget.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', scheduleMeasure);
        scheduleMeasure();

        return () => {
            scrollTarget.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', scheduleMeasure);
            observer.disconnect();
            observerRef.current = null;
            cancelAnimationFrame(frameRef.current);
        };
    }, [scrollProgress, scheduleMeasure]);

    const value = React.useMemo(
        () => ({ scrollProgress, register, getRange, version }),
        [scrollProgress, register, getRange, version]
    );

    return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
