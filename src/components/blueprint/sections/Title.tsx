import React from 'react';

import { Pen } from '@/components/blueprint/pen';
import { Scene, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';

import './title.css';

/*
 * Sheet 1, the hero: a technical-drawing title block in HTML (real text, visible at first paint) with a drawn
 * annotation layer on top. The annotation SVGs have no viewBox, so one user unit is one CSS pixel and lines
 * can span `100%` of whatever box they measure: the dimensions always measure the real name block at every width.
 * The clock scene (T = 3.5 s) draws, in order: frame, cell rules, centerlines, W1 under the name, note box,
 * detail circle, the overall W / H dims (desktop), the scroll cue.
 */

const T = 3.5;
const S = sheet('title');

/**
 * Horizontal dimension across the full width of its positioned box. `f` is where the measured edge is
 * (y, px; negative = above the dim line), so the extension lines run from the feature past the line.
 */
export function HDim({
    id,
    a,
    f,
    label,
    measure,
    className,
}: {
    id: string;
    a: number;
    f: number;
    label: string;
    /** Show the live width ("W = 1238 PX"); the server renders the bare label. */
    measure?: boolean;
    className?: string;
}): React.JSX.Element {
    const p = new Pen(id);
    const s = Math.sign(-f) || 1;
    p.at(a, 0.1, 0.4);
    p.mk('line', { x1: 0.4, y1: f + s * 3, x2: 0.4, y2: s * 5, class: 'ext' });
    p.mk('line', { x1: '100%', y1: f + s * 3, x2: '100%', y2: s * 5, class: 'ext' });
    p.mk('line', {
        x1: 0,
        y1: 0,
        x2: '100%',
        y2: 0,
        class: 'dl',
        'marker-start': p.arrow,
        'marker-end': p.arrow,
    });
    p.mk(
        'text',
        {
            x: '50%',
            y: s > 0 ? 14 : -5,
            class: 'dt',
            'text-anchor': 'middle',
            'data-measure': measure ? 'w' : undefined,
            'data-label': measure ? label : undefined,
        },
        label
    );
    return (
        <svg className={['bp-svg', className].filter(Boolean).join(' ')} aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** Vertical dimension down the full height of its box; the measured edge is `f` px to the left. */
function VDim({
    id,
    a,
    f,
    label,
    measure,
    className,
}: {
    id: string;
    a: number;
    f: number;
    label: string;
    /** Show the live height ("H = 734 PX"). */
    measure?: boolean;
    className?: string;
}): React.JSX.Element {
    const p = new Pen(id);
    p.at(a, 0.1, 0.4);
    p.mk('line', { x1: f + 3, y1: 0.4, x2: 5, y2: 0.4, class: 'ext' });
    p.mk('line', { x1: f + 3, y1: '100%', x2: 5, y2: '100%', class: 'ext' });
    p.mk('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: '100%',
        class: 'dl',
        'marker-start': p.arrow,
        'marker-end': p.arrow,
    });
    p.mk(
        'text',
        {
            x: 8,
            y: '50%',
            dy: 4,
            class: 'dt',
            'data-measure': measure ? 'h' : undefined,
            'data-label': measure ? label : undefined,
        },
        label
    );
    return (
        <svg className={['bp-svg', className].filter(Boolean).join(' ')} aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** The frame, drawn by the pen from its top-left corner (a % rect: always the block's real size). */
function Frame(): React.JSX.Element {
    const p = new Pen('ttl-fr');
    p.at(0, 0, 1);
    p.mk('rect', { x: 0.6, y: 0.6, width: '100%', height: '100%', rx: 15.4, class: 'border' });
    return (
        <svg className="bp-svg title-frame" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** Dash-dot centerlines through the name block (horizontal through its middle, vertical through its centre). */
function Centerlines(): React.JSX.Element {
    const h = new Pen('ttl-clh');
    h.at(1.0, 0, 0.6);
    h.mk('line', { x1: 0, y1: '50%', x2: '100%', y2: '50%', class: 'cl' });
    const v = new Pen('ttl-clv');
    v.at(1.15, 0, 0.6);
    v.mk('line', { x1: '50%', y1: 0, x2: '50%', y2: '100%', class: 'cl' });
    return (
        <>
            <svg className="bp-svg title-clh" aria-hidden="true">
                {h.render()}
            </svg>
            <svg className="bp-svg title-clv" aria-hidden="true">
                {v.render()}
            </svg>
        </>
    );
}

/** Boxed note number on the drawing, matching note 1 in the NOTES cell. */
function NoteMark(): React.JSX.Element {
    const p = new Pen('ttl-nb');
    p.at(1.9, 0.1, 0.35);
    p.nb(8, 8, 1);
    return (
        <svg className="bp-svg title-nbmark" width="16" height="16" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** Dashed detail circle around the status mark, with its leader and label. */
function Detail(): React.JSX.Element {
    const p = new Pen('ttl-dt');
    p.at(2.1, 0.12, 0.4);
    p.circle(30, 44, 3, 'dot');
    p.line(22, 44, 38, 44, 'thin');
    p.line(30, 36, 30, 52, 'thin');
    p.detailRef(30, 44, 15, 'Detail A', 16, 14);
    return (
        <svg className="bp-svg title-detail" width="64" height="72" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** Drawn arrow for the scroll cue. */
function CueArrow(): React.JSX.Element {
    const p = new Pen('ttl-cue');
    p.at(2.95, 0, 0.5);
    p.flow(6, 1, 6, 30);
    return (
        <svg className="bp-svg title-cue-ar" width="12" height="32" aria-hidden="true">
            {p.render()}
        </svg>
    );
}

/** One ruled cell of the title block: caps label, value; its right and bottom rules draw in inside [a, b]. */
function Cell({
    area,
    label,
    a,
    children,
    className,
}: {
    area: string;
    label: React.ReactNode;
    a: number;
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element {
    return (
        <div
            {...win(a, a + 0.5)}
            className={['title-cell', `title-${area}`, className].filter(Boolean).join(' ')}
        >
            <p className="title-lbl">{label}</p>
            {children}
        </div>
    );
}

function Arrow(): React.JSX.Element {
    return (
        <svg className="title-btn-ar" width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
            <path d="M0 5h12M8 1.5 12 5 8 8.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
    );
}

export default function Title(): React.JSX.Element {
    const { name, role, location, status, statement, email, links } = SITE.profile;
    return (
        <section id={S.id} aria-labelledby="title-h" className="title">
            <Scene mode="clock" T={T} className="title-in">
                <div className="title-wrap">
                    <HDim id="ttl-w" a={2.4} f={22} label="W" measure className="title-dim-w" />
                    <VDim id="ttl-h" a={2.55} f={-28} label="H" measure className="title-dim-h" />
                    <div className="title-block">
                        <Frame />
                        <Cell area="name" label="Title" a={0.3}>
                            <div className="title-namebox">
                                <Centerlines />
                                <h1 id="title-h" className="title-h1">
                                    {name}
                                </h1>
                                <NoteMark />
                                <HDim
                                    id="ttl-w1"
                                    a={1.35}
                                    f={-14}
                                    label={`W1 (REF ${name.length} CH)`}
                                    className="title-dim-w1"
                                />
                            </div>
                        </Cell>
                        <Cell area="dwg" label="Dwg no." a={0.4}>
                            <p className="title-v">AR-01</p>
                        </Cell>
                        <Cell area="sheet" label="Sheets" a={0.5}>
                            <p className="title-v">
                                {S.n} of {SHEET_COUNT}
                            </p>
                        </Cell>
                        <Cell area="role" label="Role" a={0.6}>
                            <p className="title-v title-rolev">{role}</p>
                        </Cell>
                        <Cell area="loc" label="Location" a={0.7}>
                            <p className="title-v">{location}</p>
                        </Cell>
                        {status ? (
                            <Cell area="status" label="Status" a={0.8}>
                                <p className="title-v">{status}</p>
                                <Detail />
                            </Cell>
                        ) : null}
                        <Cell area="scale" label="Scale" a={0.9}>
                            <p className="title-v">1:1</p>
                        </Cell>
                        <Cell
                            area="notes"
                            a={1.0}
                            label={
                                <>
                                    <span className="title-nh">Notes:</span> (unless otherwise specified)
                                </>
                            }
                        >
                            <div className="title-note">
                                <span className="title-nbox" aria-hidden="true">
                                    1
                                </span>
                                <p className="title-statement">{statement}</p>
                            </div>
                        </Cell>
                        <Cell area="src" label="Source" a={1.1}>
                            <p className="title-v">Resume · LinkedIn · GitHub</p>
                        </Cell>
                        <div {...win(1.2, 1.7)} className="title-cell title-act">
                            <ul className="title-actions">
                                <li>
                                    <a href={`mailto:${email}`} className="title-btn title-btn-1">
                                        Email <Arrow />
                                    </a>
                                </li>
                                {links.map((l) => (
                                    <li key={l.href}>
                                        <a href={l.href} className="title-btn" rel="me noopener">
                                            {l.label} <Arrow />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <a href="#results" className="title-cue">
                    <CueArrow />
                    <span>Scroll to draw</span>
                </a>
            </Scene>
        </section>
    );
}
