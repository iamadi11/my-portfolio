import React from 'react';

import { SITE } from '@/content/site';

import { Lettering } from './lettering';

/** Camera key: scene time, centre x, centre y (SVG units), zoom. */
export type CamKey = [number, number, number, number];

type SceneProps = {
    /** `pin`: `len` viewport heights tall with a sticky stage; `flow`: normal height; `clock`: plays once on view. */
    mode: 'pin' | 'flow' | 'clock';
    /** Scene length in scene-time units (the windows used with `Pen.at` and `win`). */
    T: number;
    /** Pin only: section height in viewport heights (≥ 1.5 reads well). */
    len?: number;
    /** Pin only: start the pen this many viewport heights before the stage pins, so it never scrolls in blank. */
    lead?: number;
    /** Camera keys for the `.bp-cam` group inside (see `Pen.render({ cam: true })`); `camSm` for ≤ 640 px. */
    cam?: CamKey[];
    camSm?: CamKey[];
    className?: string;
    stageClassName?: string;
    id?: string;
    'aria-labelledby'?: string;
    children: React.ReactNode;
};

/** One unit the driver runs. Section semantics (id, heading) belong to whoever renders it. */
export function Scene({
    mode,
    T,
    len = 2,
    lead,
    cam,
    camSm,
    className,
    stageClassName,
    children,
    ...rest
}: SceneProps): React.JSX.Element {
    const data = {
        'data-sheet': '',
        'data-mode': mode,
        'data-t': T,
        'data-lead': lead,
        'data-cam': cam ? JSON.stringify(cam) : undefined,
        'data-cam-sm': camSm ? JSON.stringify(camSm) : undefined,
    };
    if (mode === 'pin')
        return (
            <div
                {...data}
                {...rest}
                className={['bp-pin', className].filter(Boolean).join(' ')}
                style={{ '--len': len } as React.CSSProperties}
            >
                <div className={['bp-stage', stageClassName].filter(Boolean).join(' ')}>{children}</div>
            </div>
        );
    return (
        <div {...data} {...rest} className={className}>
            {children}
        </div>
    );
}

/** Props for an HTML element that animates inside [a, b]: CSS reads `--e` (0 → 1). Use with `.bp-v` styles. */
export function win(a: number, b: number): { 'data-k': 'v'; 'data-w': string } {
    return { 'data-k': 'v', 'data-w': `${a} ${b}` };
}

/**
 * The paper: rounded sheet border, sheet number and title (the section's h2), and the footer identity line the
 * original puts under every sheet (`SHEET n OF N | TITLE` left, name right). The title is lettered by the pen
 * (`Lettering`); the h2 still holds the plain title text.
 */
export function SheetFrame({
    n,
    of,
    title,
    sub,
    headingId,
    children,
    className,
}: {
    n: number;
    of: number;
    title: string;
    sub?: string;
    headingId: string;
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element {
    return (
        <div className={['bp-sheet', className].filter(Boolean).join(' ')}>
            <header className="bp-sheet-head">
                <span className="bp-nbox" aria-hidden="true">
                    {n}
                </span>
                <Lettering as="h2" id={headingId} className="bp-h2" text={title} />
                {sub ? <p className="bp-sub">{sub}</p> : null}
            </header>
            {children}
            <footer className="bp-sheet-foot" aria-hidden="true">
                <span>
                    Sheet {n} of {of} | {title}
                </span>
                <span>
                    {SITE.profile.name} · {SITE.profile.role}
                </span>
            </footer>
        </div>
    );
}
