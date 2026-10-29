import { afterEach, expect, it, vi } from 'vitest';

import { startStaticPlayback } from './static-playback';

afterEach(() => vi.useRealTimers());
it('holds long static captions, honors speed, stops at end and cancels on pause', () => {
    vi.useFakeTimers();
    let time = 8.2;
    const done = vi.fn();
    const options = {
        marks: [8.2, 17.38, 19],
        durations: [10, 9],
        end: 19,
        rate: 2,
        read: () => time,
        tick: (t: number) => {
            time = t;
        },
        done,
        schedule: (cb: () => void, ms: number) => Number(setTimeout(cb, ms)),
        cancel: (id: number) => clearTimeout(id),
    };
    const stop = startStaticPlayback(options);
    vi.advanceTimersByTime(4999);
    expect(time).toBe(8.2);
    vi.advanceTimersByTime(1);
    expect(time).toBe(17.38);
    vi.advanceTimersByTime(4500);
    expect(time).toBe(19);
    expect(done).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    stop();
    time = 8.2;
    const pause = startStaticPlayback({ ...options, rate: 0.5 });
    vi.advanceTimersByTime(19000);
    expect(time).toBe(8.2);
    pause();
    vi.advanceTimersByTime(50000);
    expect(time).toBe(8.2);
    expect(vi.getTimerCount()).toBe(0);
});
