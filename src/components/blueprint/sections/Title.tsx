import React from 'react';

import Link from 'next/link';

import { HARDWARE } from '@/components/anatomy/hardware';
import { Pen } from '@/components/blueprint/pen';
import { SITE } from '@/content/site';

import MutationBench from '../MutationBench';
import '@/components/anatomy/hardware.css';
import './title.css';

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

export default function Title(): React.JSX.Element {
    const { name, role, location, statement, email, links } = SITE.profile;
    return (
        <section id="title" aria-labelledby="title-h" className="workbench-hero">
            <div className="workbench-intro">
                <p className="workbench-eyebrow">Independent work · production experience</p>
                <h1 id="title-h">
                    {name}
                    <span>
                        Software, taken
                        <br />
                        apart.
                    </span>
                </h1>
                <p className="workbench-role">
                    {role} · {location}
                </p>
                <p className="workbench-statement">{statement}</p>
                <div className="workbench-actions">
                    <a href="#assemblies">Explore projects ↗</a>
                    <a href="#revisions">Experience →</a>
                </div>
                <div className="workbench-links">
                    <a href={`mailto:${email}`}>Email</a>
                    {links.map((link) => (
                        <a key={link.href} href={link.href} rel="me noopener">
                            {link.label} ↗
                        </a>
                    ))}
                    <Link href="/learn" prefetch={false}>
                        System design course ↗
                    </Link>
                </div>
            </div>
            <MutationBench
                art={
                    <svg
                        viewBox="-115 -155 230 205"
                        className="workbench-machine an-hardware"
                        role="img"
                        aria-label="Schematic journal enclosure with supported paper feed, storage bay and ports"
                    >
                        <g dangerouslySetInnerHTML={{ __html: HARDWARE.queue.svg }} />
                    </svg>
                }
            />
            <p className="workbench-footnote">
                01 / The workbench <span>Explore the mechanism. Then inspect the source.</span>
            </p>
        </section>
    );
}
