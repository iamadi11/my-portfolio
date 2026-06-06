'use client';

import { useEffect, useRef, useState } from 'react';

const GOLD = '#c9a227';
const MUTED_COLOR = 'rgba(92,77,48,0.8)';

// Procedurally generated ambient — Web Audio API, zero copyright
// Architecture: pink noise + 3 sine drones + crystal shimmer
function buildAmbient(ctx: AudioContext): { master: GainNode; shimmer: GainNode } {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Pink noise buffer (Paul Kellet algorithm)
    const SR = ctx.sampleRate;
    const buf = ctx.createBuffer(1, SR * 6, SR);
    const d = buf.getChannelData(0);
    let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
    for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 160;
    nFilter.Q.value = 0.4;
    const nGain = ctx.createGain();
    nGain.gain.value = 0.22;
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(master);
    noise.start();

    // Drones: 40Hz (sub), 80Hz (bass), 160Hz (mid warmth)
    ([40, 80, 160] as const).forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.value = [0.55, 0.3, 0.1][i];
        osc.connect(g);
        g.connect(master);
        osc.start();
    });

    // Crystal shimmer: 880Hz sparkle, scene-modulated externally
    const shimmerOsc = ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.value = 880;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmerOsc.start();

    return { master, shimmer: shimmerGain };
}

export function useSoundEngine(progress: React.MutableRefObject<number>): {
    muted: boolean;
    toggleMute: () => void;
} {
    const ctxRef = useRef<AudioContext | null>(null);
    const masterRef = useRef<GainNode | null>(null);
    const shimmerRef = useRef<GainNode | null>(null);
    const [muted, setMuted] = useState(true);

    useEffect(() => {
        if (muted) {
            masterRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.6);
            return undefined;
        }
        if (!ctxRef.current) {
            const ctx = new AudioContext();
            ctxRef.current = ctx;
            const { master, shimmer } = buildAmbient(ctx);
            masterRef.current = master;
            shimmerRef.current = shimmer;
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') ctx.resume();
        masterRef.current?.gain.setTargetAtTime(0.16, ctx.currentTime, 0.8);

        // Scene-aware shimmer: active in tesseract zone only
        let raf: number;
        const tick = () => {
            const p = progress.current;
            const inTesseract = p < 0.28 ? 1 - p / 0.28 : 0;
            shimmerRef.current?.gain.setTargetAtTime(inTesseract * 0.04, ctx.currentTime, 0.4);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [muted, progress]);

    useEffect(
        () => () => {
            ctxRef.current?.close();
        },
        []
    );

    return { muted, toggleMute: () => setMuted((m) => !m) };
}

export function SoundToggle({ muted, onToggle }: { muted: boolean; onToggle: () => void }): JSX.Element {
    return (
        <button
            onClick={onToggle}
            aria-label={muted ? 'Unmute ambient sound' : 'Mute ambient sound'}
            title={muted ? 'Play ambient' : 'Mute'}
            style={{
                position: 'fixed',
                bottom: 28,
                left: 22,
                zIndex: 30,
                background: 'rgba(6,4,12,0.72)',
                border: `1px solid ${muted ? 'rgba(201,162,39,0.14)' : 'rgba(201,162,39,0.42)'}`,
                borderRadius: 3,
                padding: '6px 11px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.2em',
                color: muted ? MUTED_COLOR : GOLD,
                textTransform: 'uppercase',
                transition: 'color 0.4s, border-color 0.4s',
                backdropFilter: 'blur(8px)',
            }}
        >
            <span style={{ fontSize: 11, lineHeight: 1 }}>{muted ? '○' : '◉'}</span>
            {muted ? 'SOUND' : 'AMBIENT'}
        </button>
    );
}
