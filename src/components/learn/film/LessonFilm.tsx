'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useClock } from '@/components/learn/kit/useClock';
import { BEAT_SECONDS, filmDuration, type LessonFilmData, sampleFilm } from '@/lib/learn/film-model';

import Scene from './Scene';
import './film.css';

export default function LessonFilm({ film }: { film: LessonFilmData }): React.JSX.Element {
    const target = useRef<HTMLElement>(null);
    const [speed, setSpeed] = useState(1);
    const [completed, setCompleted] = useState(false);
    const marks = useMemo(
        () => film.beats.map((_, i) => i * BEAT_SECONDS).concat(filmDuration(film)),
        [film]
    );
    const clock = useClock({ marks, end: filmDuration(film), rate: speed, target });
    const { index, beat } = sampleFilm(film, clock.t);
    const pause = clock.pause;
    useEffect(() => {
        const hidden = () => {
            if (document.hidden) pause();
        };
        document.addEventListener('visibilitychange', hidden);
        return () => document.removeEventListener('visibilitychange', hidden);
    }, [pause]);
    useEffect(() => {
        if (clock.t < filmDuration(film)) return;
        setCompleted(true);
        try {
            localStorage.setItem(`learn-watched:${film.id}`, '1');
            window.dispatchEvent(new Event('learn-progress'));
        } catch {
            /* Reading still works without storage. */
        }
    }, [clock.t, film]);
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
                <Scene
                    film={film}
                    time={
                        clock.reduced ? Math.min(filmDuration(film), clock.t + BEAT_SECONDS * 0.8) : clock.t
                    }
                />
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
                    onChange={(e) => clock.seek(Number(e.target.value))}
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
                    <button type="button" aria-label="Previous scene" onClick={clock.prev}>
                        ←
                    </button>
                    <button type="button" aria-label="Next scene" onClick={clock.next}>
                        →
                    </button>
                    <button type="button" aria-label="Restart lesson" onClick={clock.reset}>
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
                        onClick={() => clock.seek(i * BEAT_SECONDS)}
                    >
                        <span>{String(i + 1).padStart(2, '0')}</span>
                        {b.title}
                    </button>
                ))}
            </nav>
            {completed && (
                <p className="lf-complete" role="status">
                    Film complete. Try the Interactive Lab to test your understanding.
                </p>
            )}
            <div className="lf-footnote">
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
