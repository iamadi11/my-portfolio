'use client';

import { useEffect } from 'react';

import { drive } from './drive';

/** Mounts the scroll driver once and, in production, the offline service worker (`public/sw.js`). Renders nothing. */
export default function Driver(): null {
    useEffect(() => {
        const stop = drive();
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator)
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        return stop;
    }, []);
    return null;
}
