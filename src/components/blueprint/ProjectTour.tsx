'use client';

import React, { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import type { LessonFilmData } from '@/lib/learn/film-model';
import './project-tour.css';

const LessonFilm = dynamic(() => import('@/components/learn/film/LessonFilm'), {
    ssr: false,
    loading: () => <p role="status">Loading walkthrough…</p>,
});
export default function ProjectTour({
    title,
    film,
}: {
    title: string;
    film: LessonFilmData;
}): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        if (open) dialog.current?.showModal();
        else dialog.current?.close();
    }, [open]);
    return (
        <>
            <button
                type="button"
                className="asm-btn project-tour-open"
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
            >
                Watch how it works<span className="sr-only"> · {title}</span>
                <span aria-hidden="true"> ↗</span>
            </button>
            <dialog
                ref={dialog}
                className="project-tour-dialog"
                aria-label={`${title} walkthrough`}
                onClose={() => setOpen(false)}
            >
                {open && (
                    <>
                        <header>
                            <p>{title} · architecture walkthrough</p>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close walkthrough"
                            >
                                Close ×
                            </button>
                        </header>
                        <LessonFilm film={film} trackProgress={false} />
                        <p className="project-tour-note">
                            Conceptual workflow checked against the linked public source. Timing and hardware
                            shapes are illustrative. Use scene steps or the transcript to inspect the
                            sequence.
                        </p>
                    </>
                )}
            </dialog>
        </>
    );
}
