/** A deterministic teaching timeline. Seconds are playback time, never measured network latency. */
export type DeviceKind = 'computer' | 'server' | 'router' | 'store' | 'queue' | 'light';
export type NodeState = 'idle' | 'active' | 'done' | 'failed' | 'locked';
export type FilmNode = { id: string; label: string; kind: DeviceKind; x: number; y: number };
export type FilmBeat = {
    title: string;
    /** Playback seconds, never measured system latency. */
    duration?: number;
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
export function beatDuration(beat: FilmBeat): number {
    return beat.duration && Number.isFinite(beat.duration)
        ? Math.max(BEAT_SECONDS, beat.duration)
        : BEAT_SECONDS;
}
export function filmDuration(film: LessonFilmData): number {
    return film.beats.reduce((sum, beat) => sum + beatDuration(beat), 0);
}
export function filmStarts(film: LessonFilmData): number[] {
    let time = 0;
    return film.beats.map((beat) => {
        const start = time;
        time += beatDuration(beat);
        return start;
    });
}
export function settledSceneTime(film: LessonFilmData, index: number): number {
    const i = Math.max(0, Math.min(film.beats.length - 1, index));
    return filmStarts(film)[i] + beatDuration(film.beats[i]) * 0.82;
}
/** Slow enough to read the caption; this is a production pacing heuristic, not a learner-study result. */
export function paceFilm(film: LessonFilmData): LessonFilmData {
    return {
        ...film,
        beats: film.beats.map((beat) => ({
            ...beat,
            duration: Math.max(
                beatDuration(beat),
                Math.ceil(beat.caption.trim().split(/\s+/).length / 2.5) + 2
            ),
        })),
    };
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
    const starts = filmStarts(film);
    const index = starts.reduce((last, start, i) => (start <= t ? i : last), 0);
    const beat = film.beats[index];
    const phase = Math.min(1, (t - starts[index]) / beatDuration(beat));
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
