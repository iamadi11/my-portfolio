'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import type { ChatState } from 'gaussian-splat-renderer-for-lam';
import { createPortal } from 'react-dom';

import { createVoice, type Voice } from '@/components/host/audio';
import Avatar, { type Face } from '@/components/host/Avatar';
import { ambience, mouth } from '@/components/host/face';
import GuideCard from '@/components/host/GuideCard';
import { Icon, ICON } from '@/components/host/icons';
import { type HostConfig, type Line, match, type Script } from '@/components/host/script';
import { useListen, usePauseOnReading } from '@/components/host/useGuideInput';

type Phase = 'portrait' | 'loading' | 'scanning' | 'live' | 'flat';
type Caption = { who: 'host' | 'you'; text: string };

const SCAN_MS = 1500;

/** What the frame's tag says, per phase. */
function frameTag(phase: Phase, three: boolean, docked: boolean, progress: number): string {
    if (phase === 'loading') return `Building 3D · ${Math.round(progress * 100)}%`;
    if (phase === 'scanning') return 'Converting 2D → 3D';
    if (phase === 'live')
        return docked ? 'FIG. 00 · 2D · the 3D me is in the corner' : 'FIG. 00 · 3D · drag to turn';
    if (!three) return 'FIG. 00 · photo';
    return phase === 'flat' ? 'FIG. 00 · 2D · 3D unavailable here' : 'FIG. 00 · 2D · photo';
}

function startLabel(phase: Phase, three: boolean, touring: boolean): string {
    if (phase === 'portrait') return three ? 'Start · meet me in 3D' : 'Start the tour';
    if (phase === 'loading' || phase === 'scanning') return 'Building 3D…';
    return touring ? 'Guide is talking' : 'Resume the tour';
}

/** The page section the guide talks about: scroll there and mark it. */
function show(target: string | undefined, reduce: boolean): void {
    if (!target) return;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    document.querySelectorAll('.is-guided').forEach((node) => node.classList.remove('is-guided'));
    if (target === 'top') {
        window.scrollTo({ top: 0, behavior });
        return;
    }
    const el = document.getElementById(target);
    el?.scrollIntoView({ behavior, block: 'start' });
    el?.classList.add('is-guided');
}

/**
 * The guide: your portrait, a Start key, and (when an avatar export is deployed) the 3D head
 * it becomes. It narrates the page section by section and answers questions from the content,
 * with pre-rendered voice and lip-sync. Without WebGL or an avatar it still talks, as the photo.
 */
export default function Host({
    script,
    host,
    name,
    avatar,
}: {
    script: Script;
    host: HostConfig;
    name: string;
    /** Avatar ZIP that exists on the server, or undefined: then the guide stays a photo and says so. */
    avatar?: string;
}): React.JSX.Element {
    const [phase, setPhase] = useState<Phase>('portrait');
    const [progress, setProgress] = useState(0);
    const [docked, setDocked] = useState(false);
    const [touring, setTouring] = useState(false);
    const [step, setStep] = useState(-1);
    const [caption, setCaption] = useState<Caption | null>(null);
    const [muted, setMuted] = useState(false);
    const [question, setQuestion] = useState('');
    const [root, setRoot] = useState<HTMLElement | null>(null);
    const [stage, setStage] = useState<HTMLDivElement | null>(null);
    const [port, setPort] = useState<HTMLDivElement | null>(null);

    const frame = useRef<HTMLDivElement>(null);
    const voice = useRef<Voice | null>(null);
    const chat = useRef<ChatState>('Idle');
    const live = useRef(ambience());
    const tour = useRef({ playing: false, index: -1 });
    const reduce = useRef(false);
    const three = Boolean(avatar);

    useEffect(() => {
        setRoot(document.querySelector<HTMLElement>('.ins-root'));
        reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        return () => voice.current?.close();
    }, []);

    const face = useCallback((): Face => {
        const now = voice.current?.now();
        return { ...live.current(performance.now(), !!now), ...(now ? mouth(now.visemes, now.ms) : {}) };
    }, []);
    const state = useCallback((): ChatState => chat.current, []);

    // The porthole flies in from the frame. Transform only: nothing on the page moves.
    useLayoutEffect(() => {
        if (!docked || !port || !frame.current || reduce.current) return;
        const first = frame.current.getBoundingClientRect();
        const last = port.getBoundingClientRect();
        const from = `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`;
        port.animate(
            [
                { transformOrigin: '0 0', transform: from, borderRadius: '6px' },
                { transformOrigin: '0 0', transform: 'none' },
            ],
            { duration: 760, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        );
    }, [docked, port]);

    /* ---------- speaking, the tour, and answers ---------- */

    const say = useCallback((line: Line, then?: () => void): void => {
        setCaption({ who: 'host', text: line.text });
        chat.current = 'Responding';
        void voice.current?.play(line, () => {
            chat.current = 'Idle';
            then?.();
        });
    }, []);

    const play = useCallback(
        (index: number): void => {
            const next = script.tour[index];
            tour.current.index = index;
            tour.current.playing = Boolean(next);
            setStep(index);
            setTouring(Boolean(next));
            if (!next) return;
            if (next.target !== 'top') setDocked(true);
            show(next.target, reduce.current);
            voice.current?.prefetch(script.tour.slice(index + 1, index + 3).map((s) => s.line));
            say(next.line, () => {
                if (tour.current.playing && tour.current.index === index)
                    window.setTimeout(() => play(index + 1), 650);
            });
        },
        [script.tour, say]
    );

    const pause = useCallback((): void => {
        tour.current.playing = false;
        setTouring(false);
        voice.current?.stop();
        chat.current = 'Idle';
    }, []);

    const resume = useCallback((): void => play(Math.max(0, tour.current.index)), [play]);
    const next = useCallback((): void => play(tour.current.index + 1), [play]);

    const ask = useCallback(
        (text: string): void => {
            const q = text.trim();
            if (!q) return;
            pause();
            setQuestion('');
            setCaption({ who: 'you', text: q });
            chat.current = 'Thinking';
            const intent = match(q, script.intents);
            window.setTimeout(() => {
                setDocked(true);
                show(intent?.target, reduce.current);
                say(intent?.line ?? script.fallback);
            }, 380);
        },
        [script.intents, script.fallback, pause, say]
    );

    const listen = useListen({
        onStart: () => {
            pause();
            chat.current = 'Listening';
        },
        onHeard: setQuestion,
        onFinal: ask,
        onEnd: () => {
            if (chat.current === 'Listening') chat.current = 'Idle';
        },
    });

    usePauseOnReading(touring, pause);

    /* ---------- Start: 2D → 3D ---------- */

    const start = useCallback((): void => {
        // Created inside the click, so the browser lets it make sound.
        voice.current = createVoice();
        voice.current.prefetch(script.tour.slice(0, 2).map((s) => s.line));
        if (!three) {
            voice.current.swell(0.6);
            setPhase('flat');
            play(0);
            return;
        }
        voice.current.swell(reduce.current ? 0.6 : SCAN_MS / 1000 + 1.2);
        setPhase('loading');
    }, [three, script.tour, play]);

    const ready = useCallback((): void => {
        // Splats stream in for a moment after load; scan only once the head is drawn.
        const settle = reduce.current ? 0 : 600;
        window.setTimeout(() => setPhase('scanning'), settle);
        window.setTimeout(
            () => {
                setPhase('live');
                voice.current?.chime();
                play(0);
            },
            reduce.current ? 0 : settle + SCAN_MS
        );
    }, [play]);

    const failed = useCallback((): void => {
        setPhase('flat');
        play(0);
    }, [play]);

    // A head that never arrives should not hold the tour hostage.
    useEffect(() => {
        if (phase !== 'loading') return undefined;
        const id = window.setTimeout(failed, 25_000);
        return () => window.clearTimeout(id);
    }, [phase, failed]);

    useEffect(() => {
        voice.current?.setMuted(muted);
    }, [muted]);

    const started = phase !== 'portrait';
    const talking = phase === 'live' || phase === 'flat';

    return (
        <>
            <div
                ref={frame}
                className={clsx('host-frame', `is-${phase}`, docked && 'is-away')}
                style={{ '--progress': progress } as React.CSSProperties}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- static portrait, sized by the frame; the LCP image */}
                <img
                    className="host-photo"
                    src={host.portrait}
                    alt={`Portrait of ${name}`}
                    width={1254}
                    height={1254}
                    fetchPriority="high"
                />
                <div ref={setStage} className={clsx('host-stage', `is-${phase}`)} aria-hidden="true" />
                <span className="host-scan" aria-hidden="true" />
                <span className="host-tag" aria-hidden="true">
                    {frameTag(phase, three, docked, progress)}
                </span>
            </div>

            <div className="host-actions">
                <button
                    type="button"
                    className={clsx('ins-key ins-key-primary host-start', !started && 'is-calling')}
                    onClick={started ? resume : start}
                    onPointerEnter={() => avatar && void fetch(avatar).catch(() => undefined)}
                >
                    <Icon d={ICON.play} />
                    {startLabel(phase, three, touring)}
                </button>
                <a className="ins-key" href="#work">
                    Skip to work
                </a>
                <p className="host-note">
                    {three
                        ? 'Sound on. 3D model generated from one photo; synthetic voice. Answers come from this page only.'
                        : 'Sound on. Synthetic voice. Answers come from this page only.'}
                </p>
            </div>

            {avatar && started && phase !== 'flat' && (
                <Avatar
                    src={avatar}
                    mount={docked && port ? port : stage}
                    face={face}
                    state={state}
                    onProgress={setProgress}
                    onReady={ready}
                    onError={failed}
                />
            )}

            {root &&
                started &&
                createPortal(
                    <>
                        {docked && (
                            <div
                                ref={setPort}
                                className={clsx('host-port', `is-${phase}`)}
                                aria-hidden="true"
                            >
                                {phase === 'flat' && (
                                    // eslint-disable-next-line @next/next/no-img-element -- same portrait, docked
                                    <img className="host-photo" src={host.portrait} alt="" />
                                )}
                            </div>
                        )}
                        {talking && (
                            <GuideCard
                                firstName={name.split(' ')[0]}
                                caption={caption}
                                docked={docked}
                                touring={touring}
                                step={step}
                                total={script.tour.length}
                                muted={muted}
                                question={question}
                                prompts={script.prompts}
                                listen={listen}
                                onToggleTour={touring ? pause : resume}
                                onNext={next}
                                onMute={() => setMuted((m) => !m)}
                                onQuestion={setQuestion}
                                onAsk={ask}
                            />
                        )}
                    </>,
                    root
                )}
        </>
    );
}
