/** Discrete event playback: reading holds use the same beat durations and rate as the animated clock. */
export function startStaticPlayback({
    marks,
    durations,
    end,
    rate,
    read,
    tick,
    done,
    schedule,
    cancel,
}: {
    marks: number[];
    durations: number[];
    end: number;
    rate: number;
    read: () => number;
    tick: (time: number) => void;
    done: () => void;
    schedule: (callback: () => void, milliseconds: number) => number;
    cancel: (timer: number) => void;
}): () => void {
    let timer = 0;
    const advance = (): void => {
        const time = read();
        const index = marks.reduce((last, mark, i) => (mark <= time + 1e-6 ? i : last), -1);
        const next = marks[index + 1];
        if (next === undefined) {
            done();
            return;
        }
        const seconds = durations[Math.max(0, index)] ?? Math.max(0.9, next - time);
        timer = schedule(
            () => {
                tick(next);
                if (next >= end) done();
                else advance();
            },
            (seconds * 1000) / Math.max(0.1, rate)
        );
    };
    advance();
    return () => cancel(timer);
}
