'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

import { createPortal } from 'react-dom';

import { computeMegaPrimesAsync } from '@/lib/primes';

import type { PrimeScene } from './scene';

interface Props {
    onClose: () => void;
}

type LoadState = 'computing' | 'ready';

const COUNT_MIN = 1_000;
const COUNT_MAX = 1_000_000;
const LOG_MIN = Math.log(COUNT_MIN);
const LOG_MAX = Math.log(COUNT_MAX);

const sliderToCount = (v: number): number => Math.round(Math.exp(LOG_MIN + (v / 100) * (LOG_MAX - LOG_MIN)));

const fmt = new Intl.NumberFormat('en-US');

export default function PrimeUniverse({ onClose }: Props): React.JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<PrimeScene | null>(null);
    const [loadState, setLoadState] = useState<LoadState>('computing');
    const [sliderVal, setSliderVal] = useState(100); // 0–100 log scale; 100 = 1M

    const displayCount = useMemo(() => sliderToCount(sliderVal), [sliderVal]);

    useEffect(() => {
        let active = true;

        const run = async () => {
            const primes = await computeMegaPrimesAsync();
            if (!active || !canvasRef.current) return;
            const { buildPrimeScene } = await import('./scene');
            if (!active || !canvasRef.current) return;
            sceneRef.current = buildPrimeScene(canvasRef.current, primes);
            setLoadState('ready');
        };

        void run();

        return () => {
            active = false;
            sceneRef.current?.dispose();
            sceneRef.current = null;
        };
    }, []);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) onClose();
        },
        [onClose]
    );

    const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setSliderVal(v);
        sceneRef.current?.setCount(sliderToCount(v));
    }, []);

    return createPortal(
        <div
            className="prime-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Prime Number Universe — press Escape to close"
        >
            <canvas ref={canvasRef} className="prime-canvas" />

            {loadState === 'computing' && (
                <div className="prime-loading">
                    <div className="prime-spinner" />
                    <span>Sieving 1,000,000 primes…</span>
                </div>
            )}

            {loadState === 'ready' && (
                <>
                    <div className="prime-hud">
                        <span className="prime-hud-title">✦ Prime Universe</span>
                        <span className="prime-hud-sub">
                            Z = prime gap · color = gap size · drag + scroll
                        </span>
                    </div>

                    <button className="prime-close" onClick={onClose} aria-label="Close Prime Universe">
                        ✕
                    </button>

                    {/* Count slider */}
                    <div className="prime-controls">
                        <div className="prime-count-display">
                            <span className="prime-count-num">{fmt.format(displayCount)}</span>
                            <span className="prime-count-label">primes</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={0.5}
                            value={sliderVal}
                            onChange={handleSlider}
                            className="prime-range"
                            style={{ '--prime-progress': `${sliderVal}%` } as React.CSSProperties}
                            aria-label="Number of primes to display"
                            aria-valuemin={COUNT_MIN}
                            aria-valuemax={COUNT_MAX}
                            aria-valuenow={displayCount}
                        />
                        <div className="prime-range-ends">
                            <span>1K</span>
                            <span>1M</span>
                        </div>
                    </div>

                    <div className="prime-hint" aria-hidden="true">
                        ESC to exit · cyan = twin primes · orange = large gaps
                    </div>
                </>
            )}
        </div>,
        document.body
    );
}
