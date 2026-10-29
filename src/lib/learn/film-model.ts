/** A deterministic teaching timeline. Seconds are playback time, never measured network latency. */
export type DeviceKind = 'computer' | 'server' | 'router' | 'store' | 'queue';
export type NodeState = 'idle' | 'active' | 'done' | 'failed' | 'locked';
export type FilmNode = { id: string; label: string; kind: DeviceKind; x: number; y: number };
export type FilmBeat = {
    title: string;
    caption: string;
    from?: string;
    to?: string;
    packet?: string;
    lost?: boolean;
    states?: Record<string, NodeState>;
    values?: Record<string, string>;
    counts?: Record<string, number>;
};
export type LessonFilmData = {
    id: string;
    question: string;
    takeaway: string;
    nodes: FilmNode[];
    links: [string, string][];
    beats: FilmBeat[];
    sourceHref: string;
};
export const BEAT_SECONDS = 5;
export function filmDuration(film: LessonFilmData): number {
    return film.beats.length * BEAT_SECONDS;
}
export type FilmSample = {
    index: number;
    beat: FilmBeat;
    progress: number;
    states: Record<string, NodeState>;
    values: Record<string, string>;
    counts: Record<string, number>;
    packet: { x: number; y: number; lost: boolean } | null;
};
export function sampleFilm(film: LessonFilmData, seconds: number): FilmSample {
    const t = Math.max(0, Math.min(filmDuration(film), Number.isFinite(seconds) ? seconds : 0));
    const index = Math.min(film.beats.length - 1, Math.floor(t / BEAT_SECONDS));
    const beat = film.beats[index];
    const phase = Math.min(1, (t - index * BEAT_SECONDS) / BEAT_SECONDS);
    const progress = Math.max(0, Math.min(1, (phase - 0.12) / 0.65));
    const from = film.nodes.find((n) => n.id === beat.from);
    const to = film.nodes.find((n) => n.id === beat.to);
    const travel = beat.lost ? Math.min(progress, 0.55) : progress;
    const states: Record<string, NodeState> = {};
    const values: Record<string, string> = {};
    const counts: Record<string, number> = {};
    for (let i = 0; i <= index; i++) {
        const event = film.beats[i];
        if (i === index && event.from && progress < 1) continue;
        Object.assign(states, event.states);
        Object.assign(values, event.values);
        Object.assign(counts, event.counts);
    }
    if (beat.from && progress < 1) states[beat.from] = 'active';
    return {
        index,
        beat,
        progress,
        states,
        values,
        counts,
        packet:
            from && to
                ? {
                      x: from.x + (to.x - from.x) * travel,
                      y: from.y + (to.y - from.y) * travel,
                      lost: !!beat.lost && progress >= 0.55,
                  }
                : null,
    };
}
