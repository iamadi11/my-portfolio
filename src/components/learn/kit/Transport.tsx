'use client';

import React from 'react';

/** Play/Pause, Previous/Next event and Reset for a figure's clock (kit `useClock`). Buttons keep focus at the ends. */
export default function Transport({
    playing,
    atStart,
    atEnd,
    onPlay,
    onPause,
    onPrev,
    onNext,
    onReset,
    label,
}: {
    playing: boolean;
    atStart: boolean;
    atEnd: boolean;
    onPlay: () => void;
    onPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onReset: () => void;
    /** What the controls drive, for the group's accessible name. */
    label: string;
}): React.JSX.Element {
    return (
        <div className="ln-nav ln-transport" role="group" aria-label={label}>
            <button type="button" className="ln-btn" onClick={playing ? onPause : onPlay}>
                {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
            </button>
            <button type="button" className="ln-btn" aria-disabled={atStart} onClick={onPrev}>
                Previous
            </button>
            <button type="button" className="ln-btn" aria-disabled={atEnd} onClick={onNext}>
                Next
            </button>
            <button type="button" className="ln-btn" aria-disabled={atStart && !playing} onClick={onReset}>
                Reset
            </button>
        </div>
    );
}
