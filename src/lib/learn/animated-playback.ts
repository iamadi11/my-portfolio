import { gsap } from 'gsap';

/** Clock state must survive context cleanup; revert is for DOM style restoration, not lesson time. */
export function createAnimatedPlayback(
    context: gsap.Context,
    {
        start,
        end,
        rate,
        tick,
        done,
    }: {
        start: number;
        end: number;
        rate: number;
        tick: (time: number) => void;
        done: () => void;
    }
): { timeline: gsap.core.Timeline; dispose: () => void } {
    const cursor = { time: start };
    let timeline!: gsap.core.Timeline;
    context.ignore(() => {
        timeline = gsap.timeline({ onComplete: done }).to(cursor, {
            time: end,
            duration: Math.max(0.001, (end - start) / Math.max(0.1, rate)),
            ease: 'none',
            onUpdate: () => tick(cursor.time),
        });
    });
    return { timeline, dispose: () => timeline.kill() };
}
