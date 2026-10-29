import { afterEach, describe, expect, it, vi } from 'vitest';

type Timeline = {
    options: { onUpdate: () => void };
    playing: boolean;
    cursor: { time: number };
    values: { time: number };
    to: (cursor: { time: number }, values: { time: number }) => Timeline;
    play: () => Timeline;
    pause: () => Timeline;
};
type Trigger = {
    animation?: Timeline;
    start: () => number;
    end: () => number;
    onToggle: (self: { isActive: boolean }) => void;
};
type Owner = { timelines: Timeline[]; triggers: Trigger[] };
// Exercise our lifecycle and frame projection with a deterministic GSAP/ScrollTrigger boundary.
// Actual scroll/plugin integration is checked in the browser.
const engine = vi.hoisted(() => ({
    owners: new Set<Owner>(),
    current: null as Owner | null,
}));
vi.mock('gsap', () => ({
    gsap: {
        registerPlugin: () => {},
        context: (fn: () => void) => {
            const owner = { timelines: [] as Timeline[], triggers: [] as Trigger[] };
            engine.current = owner;
            engine.owners.add(owner);
            fn();
            engine.current = null;
            return { revert: () => engine.owners.delete(owner) };
        },
        timeline: (options: Timeline['options']) => {
            const timeline: Timeline = {
                cursor: { time: 0 },
                values: { time: 0 },
                options,
                playing: false,
                to(cursor: { time: number }, values: { time: number }) {
                    this.cursor = cursor;
                    this.values = values;
                    return this;
                },
                play() {
                    this.playing = true;
                    return this;
                },
                pause() {
                    this.playing = false;
                    return this;
                },
            };
            engine.current!.timelines.push(timeline);
            return timeline;
        },
    },
}));
vi.mock('gsap/ScrollTrigger', () => ({
    ScrollTrigger: {
        create: (options: Trigger) => {
            engine.current!.triggers.push(options);
        },
        maxScroll: () => 1200,
        refresh: () => {
            for (const owner of engine.owners)
                for (const trigger of owner.triggers) {
                    if (trigger.animation) {
                        const timeline = trigger.animation;
                        const progress = Math.max(
                            0,
                            Math.min(
                                1,
                                (window.scrollY - trigger.start()) / (trigger.end() - trigger.start())
                            )
                        );
                        timeline.cursor.time = timeline.values.time * progress;
                        timeline.options.onUpdate();
                    } else trigger.onToggle({ isActive: true });
                }
        },
    },
}));

import { drive } from './drive';

afterEach(() => {
    vi.unstubAllGlobals();
    engine.owners.clear();
});
function harness(reduced: boolean, mode = 'pin') {
    const events = new Map<string, Set<() => void>>();
    const emit = (key: string): void => events.get(key)?.forEach((fn) => fn());
    const on = (key: string, fn: () => void): void => {
        if (!events.has(key)) events.set(key, new Set());
        events.get(key)!.add(fn);
    };
    const off = (key: string, fn: () => void): void => {
        events.get(key)?.delete(fn);
    };
    const classes = new Set<string>();
    const styles = new Map<string, string>();
    const sceneRef: { current?: unknown } = {};
    const reg = {
        parentElement: { closest: () => sceneRef.current },
        getAttribute: (key: string) => (key === 'data-k' ? 'f' : key === 'data-w' ? '0 1' : null),
        style: { opacity: '' },
    };
    let transform = '';
    const camera = {
        ownerSVGElement: { viewBox: { baseVal: { width: 1000, height: 1000 } } },
        setAttribute: (_key: string, value: string) => {
            transform = value;
        },
    };
    const attrs: Record<string, string> = {
        'data-t': '1',
        'data-mode': mode,
        'data-cam': '[[0,500,500,1],[1,500,500,1]]',
        'data-cam-sm': '[[0,250,250,2],[1,250,250,2]]',
        'data-cam-still': '[500,500,1]',
    };
    const root = {
        getAttribute: (key: string) => attrs[key] ?? null,
        hasAttribute: (key: string) => key in attrs,
        querySelectorAll: () => [reg],
        querySelector: () => camera,
        style: { setProperty: (key: string, value: string) => styles.set(key, value) },
        getBoundingClientRect: () => ({ top: -1200, height: 2000 }),
    };
    sceneRef.current = root;
    const media = (key: string, matches: boolean) => ({
        matches,
        addEventListener: (_type: string, fn: () => void) => on(key, fn),
        removeEventListener: (_type: string, fn: () => void) => off(key, fn),
    });
    const motion = media('motion', reduced),
        small = media('small', true);
    const frames = new Map<number, FrameRequestCallback>();
    let next = 0;
    const doc = {
        hidden: false,
        addEventListener: on,
        removeEventListener: off,
        querySelectorAll: (query: string) => (query === '[data-sheet]' ? [root] : []),
        documentElement: {
            classList: {
                add: (...names: string[]) => names.forEach((n) => classes.add(n)),
                remove: (...names: string[]) => names.forEach((n) => classes.delete(n)),
                toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name)),
            },
            scrollHeight: 2000,
        },
    };
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', {
        innerHeight: 800,
        scrollY: 1200,
        matchMedia: (query: string) => (query.includes('reduced') ? motion : small),
        addEventListener: on,
        removeEventListener: off,
    });
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(private cb: (entries: unknown[]) => void) {}
            observe(target: unknown): void {
                this.cb([{ target, isIntersecting: true }]);
            }
            disconnect(): void {}
        }
    );
    vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
        frames.set(++next, fn);
        return next;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    const flush = (): void => {
        const work = [...frames.values()];
        frames.clear();
        work.forEach((fn) => fn(100));
    };
    return { motion, small, emit, classes, frames, flush, reg, doc, getTransform: () => transform, events };
}
describe('portfolio motion lifecycle', () => {
    it('responds to preference changes, finishes still drawings and cleans up listeners/classes', () => {
        const h = harness(false);
        const stop = drive();
        h.flush();
        expect(h.classes.has('bp-live')).toBe(true);
        expect(h.getTransform()).toContain('scale(2.0000)');
        h.motion.matches = true;
        h.emit('motion');
        expect(h.frames.size).toBe(0);
        expect(h.classes.has('bp-still')).toBe(true);
        expect(h.reg.style.opacity).toBe('1');
        expect(h.getTransform()).toBe('translate(0.00 0.00) scale(1.0000)');
        h.emit('scroll');
        expect(h.frames.size).toBe(0);
        h.motion.matches = false;
        h.emit('motion');
        h.flush();
        expect(h.getTransform()).toContain('scale(2.0000)');
        stop();
        expect(h.classes.size).toBe(0);
        expect(engine.owners.size).toBe(0);
        expect(h.frames.size).toBe(0);
        expect([...h.events.values()].every((listeners) => listeners.size === 0)).toBe(true);
    });
    it('changes print composition even if the mobile scene has already reached the same end time', () => {
        const h = harness(false);
        const stop = drive();
        h.flush();
        expect(h.getTransform()).toContain('scale(2.0000)');
        h.emit('beforeprint');
        expect(h.getTransform()).toContain('scale(1.0000)');
        h.emit('afterprint');
        h.flush();
        expect(h.getTransform()).toContain('scale(2.0000)');
        stop();
    });
    it('still mode retains resize and print handling without starting an animation loop', () => {
        const h = harness(true);
        const stop = drive();
        h.small.matches = false;
        h.emit('small');
        h.emit('resize');
        h.emit('beforeprint');
        h.emit('afterprint');
        expect(h.frames.size).toBe(0);
        expect(h.reg.style.opacity).toBe('1');
        expect(h.getTransform()).toContain('scale(1.0000)');
        stop();
    });
});

it('pauses offscreen/hidden clock scenes and releases only its own context', () => {
    const h = harness(false, 'clock');
    const stop = drive();
    const owner = [...engine.owners][0];
    const timeline = owner.timelines[0];
    expect(timeline.playing).toBe(true);
    h.doc.hidden = true;
    h.emit('visibilitychange');
    expect(timeline.playing).toBe(false);
    h.doc.hidden = false;
    h.emit('visibilitychange');
    expect(timeline.playing).toBe(true);
    owner.triggers[0].onToggle({ isActive: false });
    expect(timeline.playing).toBe(false);
    h.emit('visibilitychange');
    expect(timeline.playing).toBe(false);
    stop();
    expect(engine.owners.size).toBe(0);
});
