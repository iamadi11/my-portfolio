import React from 'react';

import Host from '@/components/host/Host';
import type { HostConfig, Script } from '@/components/host/script';
import type { SiteContent } from '@/components/instrumented/content';
import { LocalTime } from '@/components/instrumented/Vitals';

import '@/components/host/host.css';

const nn = (i: number): string => String(i + 1).padStart(2, '0');

/** First screen for the host: name and practice in HTML, the portrait and Start key in <Host>. */
export default function HostHero({
    content,
    host,
    script,
    avatar,
}: {
    content: SiteContent;
    host: HostConfig;
    script: Script;
    avatar?: string;
}): React.JSX.Element {
    const { profile, projects } = content;
    return (
        <div className="ins-wrap host-grid">
            <p className="ins-meta">
                <span>{profile.role}</span>
                <span>{profile.location}</span>
                <span>
                    <LocalTime timeZone={profile.timeZone} />
                </span>
                <span className="ins-avail">{profile.availability}</span>
            </p>
            <h1 className="ins-name host-name">
                {profile.name.split(/\s+/).map((word, i) => (
                    // eslint-disable-next-line react/no-array-index-key -- static words; a name can repeat one
                    <React.Fragment key={`${word}-${i}`}>
                        <span data-line>{word}</span>{' '}
                    </React.Fragment>
                ))}
            </h1>
            <p className="ins-statement host-statement">{profile.statement}</p>
            <Host script={script} host={host} name={profile.name} avatar={avatar} />
            <nav className="ins-index" aria-label="Projects">
                <ol>
                    {projects.map((project, i) => (
                        <li key={project.id}>
                            <a href={`#${project.id}`}>
                                <span className="ins-index-n">{nn(i)}</span>
                                <span className="ins-index-title">{project.title}</span>
                                <span className="ins-index-year">{project.year}</span>
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
}
