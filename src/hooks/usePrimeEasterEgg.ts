'use client';

import { useEffect, useState } from 'react';

/**
 * Listens for Ctrl+Shift+P (or Cmd+Shift+P on Mac).
 * Returns [isOpen, close] — does NOT conflict with browser print shortcut
 * because we call preventDefault() only when Shift is also held.
 */
export function usePrimeEasterEgg(): [boolean, () => void] {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // Trigger: Ctrl+Shift+P  (Windows/Linux) or Cmd+Shift+P (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const close = () => setIsOpen(false);

    return [isOpen, close];
}
