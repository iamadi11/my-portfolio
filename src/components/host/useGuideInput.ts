import { useCallback, useEffect, useRef, useState } from 'react';

type Result = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type Recognition = {
    lang: string;
    interimResults: boolean;
    onresult: ((event: { results: ArrayLike<Result> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start(): void;
    stop(): void;
};
type RecognitionCtor = new () => Recognition;

const recognizer = (): RecognitionCtor | undefined => {
    const w = window as unknown as {
        SpeechRecognition?: RecognitionCtor;
        webkitSpeechRecognition?: RecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export type Listen = { canListen: boolean; listening: boolean; toggle: () => void };

/** Push-to-talk with the browser's speech recognition (Chrome, Edge, Safari). Absent elsewhere. */
export function useListen(on: {
    onStart: () => void;
    onHeard: (text: string) => void;
    onFinal: (text: string) => void;
    onEnd: () => void;
}): Listen {
    const [canListen, setCanListen] = useState(false);
    const [listening, setListening] = useState(false);
    const rec = useRef<Recognition | null>(null);
    const latest = useRef(on);
    latest.current = on;

    useEffect(() => {
        setCanListen(Boolean(recognizer()));
        return () => rec.current?.stop();
    }, []);

    const toggle = useCallback((): void => {
        const Ctor = recognizer();
        if (listening || !Ctor) {
            rec.current?.stop();
            return;
        }
        latest.current.onStart();
        const r = new Ctor();
        r.lang = 'en-US';
        r.interimResults = true;
        r.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const heard = result[0]?.transcript ?? '';
            latest.current.onHeard(heard);
            if (result.isFinal) latest.current.onFinal(heard);
        };
        r.onend = () => {
            setListening(false);
            latest.current.onEnd();
        };
        r.onerror = r.onend;
        rec.current = r;
        setListening(true);
        r.start();
    }, [listening]);

    return { canListen, listening, toggle };
}

const READING_KEYS = new Set(['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ']);

/** Reading the page yourself pauses the tour; it never fights your scroll. Esc pauses too. */
export function usePauseOnReading(active: boolean, pause: () => void): void {
    useEffect(() => {
        if (!active) return undefined;
        const onKey = (event: KeyboardEvent): void => {
            const typing = (event.target as HTMLElement).closest('input, textarea');
            if (event.key === 'Escape' || (READING_KEYS.has(event.key) && !typing)) pause();
        };
        window.addEventListener('wheel', pause, { passive: true });
        window.addEventListener('touchmove', pause, { passive: true });
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('wheel', pause);
            window.removeEventListener('touchmove', pause);
            window.removeEventListener('keydown', onKey);
        };
    }, [active, pause]);
}
