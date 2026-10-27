import React from 'react';

import Readers from '@/components/blueprint/Readers';
import { SHEETS } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';
import { redisConfigured } from '@/lib/redis';

import './nav.css';

/**
 * The drawing-set index: the name (back to sheet 1) and one boxed number per sheet. Titles show beside the
 * numbers from 1024 px; below that they stay in the accessible name ("Sheet 3: Assemblies"). The pen line along
 * the bottom edge is a CSS scroll-driven animation (no JS), only where supported and motion is allowed.
 */
export default function Nav(): React.JSX.Element {
    return (
        <nav aria-label="Drawing set" className="nav">
            <div className="nav-in">
                <a href="#title" className="nav-name">
                    {SITE.profile.name}
                </a>
                {/* Live readers, only when the deploy has a Redis to count with. */}
                {redisConfigured() ? <Readers /> : null}
                <ol className="nav-list">
                    {SHEETS.map((s) => (
                        <li key={s.id}>
                            <a href={`#${s.id}`} className="nav-link">
                                <span className="sr-only">Sheet </span>
                                <span className="nav-n">{s.n}</span>
                                <span className="sr-only">: </span>
                                <span className="nav-t">{s.title}</span>
                            </a>
                        </li>
                    ))}
                </ol>
            </div>
            <span className="nav-pen" aria-hidden="true" />
        </nav>
    );
}
