import React from 'react';

export const ICON = {
    play: 'M6 4.5v11l9-5.5z',
    pause: 'M6 4.5v11M14 4.5v11',
    next: 'M5 4.5l7 5.5-7 5.5zM15 4.5v11',
    sound: 'M3.5 7.5h3l4-3.5v12l-4-3.5h-3zM14 7a4 4 0 0 1 0 6M16.5 5a7 7 0 0 1 0 10',
    muted: 'M3.5 7.5h3l4-3.5v12l-4-3.5h-3zM13.5 7.5l5 5M18.5 7.5l-5 5',
    mic: 'M10 3a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0v-4A2.5 2.5 0 0 1 10 3zM5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v3',
    send: 'M3.5 10h12M11 5.5l4.5 4.5-4.5 4.5',
};

/** Decorative 20×20 stroke icon; the button around it carries the label. */
export function Icon({ d }: { d: string }): React.JSX.Element {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d={d} />
        </svg>
    );
}
