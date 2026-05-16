'use client';

import { useEffect, useRef, useState } from 'react';

export default function Loader(): JSX.Element | null {
    const [visible, setVisible] = useState(true);
    const [ready, setReady] = useState(false);
    const progRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Skip loader if already visited this session
        if (sessionStorage.getItem('v2_visited')) {
            setVisible(false);
            return () => {};
        }

        // Trigger monogram appear
        const t1 = setTimeout(() => setReady(true), 60);

        // Fill progress bar
        const t2 = setTimeout(() => {
            if (progRef.current) progRef.current.style.width = '100%';
        }, 120);

        // Slide up and hide
        const t3 = setTimeout(() => {
            const el = rootRef.current;
            if (el) {
                el.style.transition = 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1)';
                el.style.transform = 'translateY(-100%)';
            }
        }, 1100);

        const t4 = setTimeout(() => {
            setVisible(false);
            sessionStorage.setItem('v2_visited', '1');
        }, 1780);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, []);

    if (!visible) return null;

    return (
        <div ref={rootRef} className={`v2-loader${ready ? 'v2-loader-ready' : ''}`} aria-hidden="true">
            <div className="v2-loader-mono">
                <span className="v2-grad">AR</span>
            </div>
            <div className="v2-loader-bar">
                <div ref={progRef} className="v2-loader-prog" />
            </div>
        </div>
    );
}
