'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useClock } from '@/components/learn/kit/useClock';
import {
    filmDuration,
    beatDuration,
    type LessonFilmData,
    sampleFilm,
    paceFilm,
    settledSceneTime,
} from '@/lib/learn/film-model';

import Scene from './Scene';
import './film.css';

export default function LessonFilm({
    film: sourceFilm,
    autoPlay = false,
    trackProgress = true,
}: {
    film: LessonFilmData;
    autoPlay?: boolean;
    trackProgress?: boolean;
}): React.JSX.Element {
    const film = useMemo(() => paceFilm(sourceFilm), [sourceFilm]);
    const target = useRef<HTMLElement>(null);
    const [speed, setSpeed] = useState(1);
    const [reviewed, setReviewed] = useState(false);
    const [stepMode, setStepMode] = useState(false);
    const marks = useMemo(
        () => film.beats.map((_, i) => settledSceneTime(film, i)).concat(filmDuration(film)),
        [film]
    );
    const stepDurations = useMemo(() => film.beats.map(beatDuration), [film]);
    const clock = useClock({ marks, end: filmDuration(film), rate: speed, target, stepMode, stepDurations });
    const { index, beat } = sampleFilm(film, clock.t);
    const pause = clock.pause;
    useEffect(() => {
        const hidden = () => {
            if (document.hidden) pause();
        };
        document.addEventListener('visibilitychange', hidden);
        return () => document.removeEventListener('visibilitychange', hidden);
    }, [pause]);
    const restart = clock.restart;
    useEffect(() => {
        if (autoPlay) restart();
    }, [autoPlay, restart]);
    const recordView = (): void => {
        setReviewed(true);
        try {
            localStorage.setItem(`learn-watched:${film.id}`, '1');
            window.dispatchEvent(new Event('learn-progress'));
        } catch {
            /* Optional local progress. */
        }
    };
    const latestTime = useRef(clock.t);
    latestTime.current = clock.t;
    const seek = clock.seek;
    useEffect(() => {
        if (clock.reduced) seek(settledSceneTime(film, sampleFilm(film, latestTime.current).index));
    }, [clock.reduced, seek, film]);
    const scene = (i: number): void => seek(settledSceneTime(film, i));
    const stateTime = clock.t;
    const state = sampleFilm(film, stateTime);
    return (
        <section
            ref={target}
            className="lf-player"
            aria-label={`Visual lesson: ${film.question}`}
            data-film={film.id}
        >
            <div className="lf-topline">
                <span className="lf-eyebrow">WATCH THE SYSTEM</span>
                <span>{filmDuration(film)} sec · 3D explainer</span>
            </div>
            <h2 className="lf-question">{film.question}</h2>
            <div className="lf-stage">
                <Scene film={film} time={stateTime} />
                <span className="lf-projection">ISOMETRIC · TEACHING MODEL</span>
            </div>
            <div className="lf-caption" aria-live="polite" aria-atomic="true">
                <span className="lf-beat-number">
                    {String(index + 1).padStart(2, '0')}
                    <span> / {String(film.beats.length).padStart(2, '0')}</span>
                </span>
                <div>
                    <h3>{beat.title}</h3>
                    <p>{beat.caption}</p>
                </div>
            </div>
            <div className="lf-timeline">
                <label className="sr-only" htmlFor={`seek-${film.id}`}>
                    Lesson timeline
                </label>
                <input
                    id={`seek-${film.id}`}
                    type="range"
                    min="0"
                    max={filmDuration(film)}
                    step="0.1"
                    value={clock.t}
                    onChange={(e) => {
                        const to = Number(e.target.value);
                        clock.seek(
                            clock.reduced && to < filmDuration(film)
                                ? settledSceneTime(film, sampleFilm(film, to).index)
                                : to
                        );
                    }}
                    aria-valuetext={`Scene ${index + 1}: ${beat.title}`}
                />
            </div>
            <div className="lf-transport">
                <div className="lf-main-controls">
                    <button
                        type="button"
                        className="lf-play"
                        onClick={clock.playing ? clock.pause : clock.play}
                    >
                        {clock.playing ? 'Ⅱ Pause' : clock.t >= filmDuration(film) ? '↻ Replay' : '▶ Play'}
                    </button>
                    <button type="button" aria-label="Previous scene" onClick={() => scene(index - 1)}>
                        ←
                    </button>
                    <button
                        type="button"
                        aria-label="Next scene"
                        onClick={() =>
                            index === film.beats.length - 1
                                ? clock.seek(filmDuration(film))
                                : scene(index + 1)
                        }
                    >
                        →
                    </button>
                    <button
                        type="button"
                        aria-label="Restart lesson"
                        onClick={() => clock.seek(clock.reduced ? settledSceneTime(film, 0) : 0)}
                    >
                        ↺
                    </button>
                </div>
                <label className="lf-speed">
                    <span className="sr-only">Playback speed</span>
                    <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                        <option value="0.5">0.5×</option>
                        <option value="1">1× speed</option>
                        <option value="1.5">1.5×</option>
                        <option value="2">2×</option>
                    </select>
                </label>
            </div>
            <nav className="lf-beats" aria-label="Lesson scenes">
                {film.beats.map((b, i) => (
                    <button
                        key={b.title}
                        type="button"
                        aria-current={i === index ? 'step' : undefined}
                        onClick={() => scene(i)}
                    >
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        {b.title}
                    </button>
                ))}
            </nav>
            {trackProgress && clock.t >= filmDuration(film) && (
                <p className="lf-complete" role="status">
                    Final frame reached. Watching is separate from practice.{' '}
                    <button type="button" onClick={recordView} disabled={reviewed}>
                        {reviewed ? 'Example marked viewed' : 'Mark this example viewed'}
                    </button>
                </p>
            )}
            <dl className="lf-state-summary" aria-label="Current model state">
                {film.nodes
                    .filter(
                        (node) => state.values[node.id] !== undefined || state.counts[node.id] !== undefined
                    )
                    .map((node) => (
                        <div key={node.id}>
                            <dt>{node.label}</dt>
                            <dd>
                                {state.values[node.id] ?? String(state.counts[node.id])}
                                {state.values[node.id] !== undefined && state.counts[node.id] !== undefined
                                    ? ` · ${state.counts[node.id]} total`
                                    : ''}
                            </dd>
                        </div>
                    ))}
            </dl>
            <div className="lf-footnote">
                <button
                    type="button"
                    className="lf-step-mode"
                    aria-pressed={stepMode}
                    onClick={() => {
                        clock.pause();
                        setStepMode(!stepMode);
                    }}
                >
                    {stepMode ? 'Step mode on' : 'Use static step mode'}
                </button>
                <span>
                    {clock.reduced ? 'Reduced motion · static scene steps. ' : ' '}Illustrative geometry and
                    playback timing.
                </span>
                <a href={film.sourceHref}>Sources ↗</a>
            </div>
            <details className="lf-transcript">
                <summary>Read the transcript & takeaway</summary>
                <ol>
                    {film.beats.map((b) => (
                        <li key={b.title}>
                            <strong>{b.title}.</strong> {b.caption}
                        </li>
                    ))}
                </ol>
                <p>
                    <strong>Takeaway:</strong> {film.takeaway}
                </p>
            </details>
        </section>
    );
}
