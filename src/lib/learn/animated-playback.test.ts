import { gsap } from 'gsap';
import { expect, it, vi } from 'vitest';

import { createAnimatedPlayback } from './animated-playback';

it('preserves public lesson time when GSAP context cleans up on pause or speed change', () => {
    let time = 0;
    let playback!: ReturnType<typeof createAnimatedPlayback>;
    const context = gsap.context((self) => {
        playback = createAnimatedPlayback(self, {
            start: 0,
            end: 20,
            rate: 1,
            tick: (t) => {
                time = t;
            },
            done: vi.fn(),
        });
        playback.timeline.pause().time(7);
        return playback.dispose;
    });
    expect(time).toBe(7);
    context.revert();
    expect(time).toBe(7);
    expect(playback.timeline.parent).toBeNull();
    const resumed = gsap.context((self) => {
        playback = createAnimatedPlayback(self, {
            start: time,
            end: 20,
            rate: 2,
            tick: (t) => {
                time = t;
            },
            done: vi.fn(),
        });
        playback.timeline.pause().time(1);
        return playback.dispose;
    });
    expect(time).toBe(9);
    resumed.revert();
    expect(time).toBe(9);
});
