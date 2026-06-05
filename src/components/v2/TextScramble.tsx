'use client';

import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$@!%^&*';

interface TextScrambleProps {
    text: string;
    className?: string;
    /** ms before scramble starts */
    delay?: number;
    /** ms total scramble duration */
    duration?: number;
}

/**
 * Characters scramble through random glyphs then resolve to final text.
 * Communicates: technical precision, engineered experience.
 * Respects prefers-reduced-motion.
 */
export default function TextScramble({
    text,
    className,
    delay = 0,
    duration = 1200,
}: TextScrambleProps): JSX.Element {
    const [display, setDisplay] = useState(text);
    const rafRef = useRef(0);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const timer = setTimeout(() => {
            const len = text.length;
            const msPerChar = duration / len;
            let start = 0;

            const tick = (ts: number) => {
                if (!start) start = ts;
                const elapsed = ts - start;
                const resolved = Math.min(Math.floor(elapsed / msPerChar), len);

                setDisplay(
                    text
                        .split('')
                        .map((ch, i) => {
                            if (i < resolved) return ch;
                            if (ch === ' ') return ' ';
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join('')
                );

                if (resolved < len) {
                    rafRef.current = requestAnimationFrame(tick);
                } else {
                    setDisplay(text);
                }
            };

            rafRef.current = requestAnimationFrame(tick);
        }, delay);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(rafRef.current);
        };
    }, [text, delay, duration]);

    return (
        <span className={className} aria-label={text}>
            {display}
        </span>
    );
}
