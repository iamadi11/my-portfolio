import React from 'react';

import clsx from 'clsx';
import { Barlow_Condensed } from 'next/font/google';

import Behavior from '@/components/instrumented/Behavior';
import type { Link, Row, SiteContent } from '@/components/instrumented/content';
import Lens from '@/components/instrumented/Lens';
import Mark from '@/components/instrumented/Marks';
import { LocalTime, Vitals } from '@/components/instrumented/Vitals';

import '@/components/instrumented/instrumented.css';

/** Condensed technical lettering: lets the name be the graphic at 375px. Geist + Geist Mono come from the root layout. */
const display = Barlow_Condensed({
    subsets: ['latin'],
    weight: '700',
    variable: '--font-ins-display',
    display: 'swap',
});

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

const nn = (i: number): string => String(i + 1).padStart(2, '0');
const longest = (text: string): number => Math.max(...text.split(/\s+/).map((word) => word.length));
const external = (href: string): boolean => href.startsWith('http');

function SectionHead({ n, id, title }: { n: string; id: string; title: string }): React.JSX.Element {
    return (
        <div className="ins-head">
            <span className="ins-head-n">{n}</span>
            <h2 id={id}>{title}</h2>
            <span className="ins-head-rule" data-reveal aria-hidden="true" />
            <span className="ins-head-measure" data-measure="section" aria-hidden="true" />
        </div>
    );
}

function LinkKey({
    link,
    about,
    primary,
}: {
    link: Link;
    about?: string;
    primary?: boolean;
}): React.JSX.Element {
    const out = external(link.href);
    return (
        <a
            className={clsx('ins-key', primary && 'ins-key-primary')}
            href={link.href}
            target={out ? '_blank' : undefined}
            rel={out ? 'noreferrer' : undefined}
        >
            {link.label}
            {(about || out) && (
                <span className="ins-sr">
                    {about ? ` ${about}` : ''}
                    {out ? ' (opens in new tab)' : ''}
                </span>
            )}
            {out && <span aria-hidden="true"> ↗</span>}
        </a>
    );
}

function Rows({ label, rows }: { label: string; rows: Row[] }): React.JSX.Element {
    return (
        <div className="ins-experience">
            <h3 className="ins-label">{label}</h3>
            <ol>
                {rows.map((row) => (
                    <li key={`${row.org}-${row.role}-${row.period}`}>
                        <span className="ins-exp-org">{row.org}</span>
                        <span className="ins-exp-role">{row.role}</span>
                        <span className="ins-exp-period">{row.period}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
}

type Props = {
    content: SiteContent;
    /** Replaces the default hero (the name + lens). Must contain the page's h1. */
    hero?: React.ReactNode;
    /** The lens scan on load. Off when another first-screen moment owns attention. */
    intro?: boolean;
};

export default function InstrumentedSite({ content, hero, intro = true }: Props): React.JSX.Element {
    const { profile, projects, practice } = content;
    const words = profile.name.split(/\s+/);
    const year = new Date().getFullYear();

    return (
        <div
            className={clsx('ins-root', display.variable)}
            data-intro={intro ? undefined : 'off'}
            style={{ '--name-chars': longest(profile.name), '--mail-chars': profile.email.length } as CSSVars}
        >
            <Behavior />
            <header className="ins-hero" id="top">
                {hero ?? (
                    <div className="ins-wrap ins-hero-grid">
                        <p className="ins-meta">
                            <span>{profile.role}</span>
                            <span>{profile.location}</span>
                            <span>
                                <LocalTime timeZone={profile.timeZone} />
                            </span>
                            <span className="ins-avail">{profile.availability}</span>
                        </p>
                        <h1 className="ins-name">
                            {words.map((word, i) => (
                                // eslint-disable-next-line react/no-array-index-key -- static words; a name can repeat one
                                <React.Fragment key={`${word}-${i}`}>
                                    <span data-line>{word}</span>{' '}
                                </React.Fragment>
                            ))}
                        </h1>
                        <div className="ins-dim" aria-hidden="true">
                            <span className="ins-dim-line" />
                            <span className="ins-dim-value" data-measure="name" />
                        </div>
                        <p className="ins-hint">
                            <span className="ins-hint-fig">Fig. 00 — this page</span>
                            <span className="ins-hint-fine">
                                Move over the name. The lens shows the drawing underneath: boxes, type
                                metrics, contrast and target sizes, read live from the page.
                            </span>
                            <span className="ins-hint-touch">
                                Tap Inspect to see the drawing underneath: boxes, type metrics, contrast and
                                target sizes, read live from the page.
                            </span>
                        </p>
                        <div className="ins-lede">
                            <p className="ins-statement">{profile.statement}</p>
                            <div className="ins-keys">
                                <a className="ins-key ins-key-primary" href="#work">
                                    See the work
                                </a>
                                <a className="ins-key" href="#reply">
                                    Reply
                                </a>
                            </div>
                        </div>
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
                )}
            </header>

            <main id="main-content">
                <section id="work" className="ins-section" aria-labelledby="work-title">
                    <div className="ins-wrap">
                        <SectionHead n="01" id="work-title" title="Work" />
                        {projects.map((project, i) => {
                            const wide = i % 4 === 2;
                            const meta = [project.year, project.role].filter(Boolean);
                            return (
                                <article
                                    key={project.id}
                                    id={project.id}
                                    className={`ins-plate hue-${project.hue}`}
                                    aria-labelledby={`${project.id}-title`}
                                >
                                    <div
                                        className={clsx('ins-plate-art', wide && 'is-wide')}
                                        data-art={project.id}
                                    >
                                        <Mark
                                            kind={project.mark}
                                            figure={nn(i)}
                                            uid={`${project.id}-plate`}
                                            wide={wide}
                                        />
                                    </div>
                                    <div className="ins-plate-text">
                                        <span className="ins-plate-n" data-reveal aria-hidden="true">
                                            {nn(i)}
                                        </span>
                                        {meta.length > 0 && (
                                            <p className="ins-plate-meta">
                                                {meta.map((item) => (
                                                    <span key={item}>{item}</span>
                                                ))}
                                            </p>
                                        )}
                                        <h3 id={`${project.id}-title`}>{project.title}</h3>
                                        <p className="ins-plate-summary">{project.summary}</p>
                                        <ul className="ins-tags" aria-label="Stack">
                                            {project.stack.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                        <div className="ins-keys">
                                            <button
                                                type="button"
                                                className="ins-key"
                                                // eslint-disable-next-line react/no-unknown-property -- React 19 prop; plugin list predates it
                                                popoverTarget={`${project.id}-spec`}
                                                data-spec-open={project.id}
                                            >
                                                Open spec<span className="ins-sr"> for {project.title}</span>
                                            </button>
                                            {project.links.map((link, k) => (
                                                <LinkKey
                                                    key={link.href}
                                                    link={link}
                                                    about={project.title}
                                                    primary={k === 0}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div
                                        id={`${project.id}-spec`}
                                        className={`ins-sheet hue-${project.hue}`}
                                        popover="auto"
                                        tabIndex={-1}
                                        role="dialog"
                                        aria-labelledby={`${project.id}-spec-title`}
                                    >
                                        <div
                                            className={clsx('ins-sheet-art', wide && 'is-wide')}
                                            data-sheet-art={project.id}
                                        >
                                            <Mark
                                                kind={project.mark}
                                                figure={nn(i)}
                                                uid={`${project.id}-sheet`}
                                                wide={wide}
                                            />
                                        </div>
                                        <p className="ins-plate-meta">
                                            {[nn(i), ...meta].map((item) => (
                                                <span key={item}>{item}</span>
                                            ))}
                                        </p>
                                        <h3 id={`${project.id}-spec-title`}>{project.title}</h3>
                                        <p className="ins-plate-summary">{project.summary}</p>
                                        <dl className="ins-spec-list">
                                            {project.detail && (
                                                <>
                                                    <dt>Problem</dt>
                                                    <dd>{project.detail.problem}</dd>
                                                    <dt>Approach</dt>
                                                    <dd>{project.detail.approach}</dd>
                                                    <dt>Outcome</dt>
                                                    <dd>{project.detail.outcome}</dd>
                                                </>
                                            )}
                                            <dt>Stack</dt>
                                            <dd>{project.stack.join(', ')}</dd>
                                        </dl>
                                        <div className="ins-keys">
                                            {project.links.map((link, k) => (
                                                <LinkKey
                                                    key={link.href}
                                                    link={link}
                                                    about={project.title}
                                                    primary={k === 0}
                                                />
                                            ))}
                                            <button
                                                type="button"
                                                className="ins-key"
                                                // eslint-disable-next-line react/no-unknown-property -- React 19 props; plugin list predates them
                                                popoverTarget={`${project.id}-spec`}
                                                // eslint-disable-next-line react/no-unknown-property
                                                popoverTargetAction="hide"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <section id="about" className="ins-section" aria-labelledby="about-title">
                    <div className="ins-wrap">
                        <SectionHead n="02" id="about-title" title="About" />
                        <div className="ins-about">
                            <p className="ins-about-intro">{practice.intro}</p>
                            {practice.principles && (
                                <ol className="ins-principles">
                                    {practice.principles.map((item, i) => (
                                        <li key={item.title}>
                                            <span className="ins-principle-n">{nn(i)}</span>
                                            <h3>{item.title}</h3>
                                            <p>{item.text}</p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            {practice.skills && (
                                <dl className="ins-skills">
                                    {practice.skills.map((item) => (
                                        <div key={item.group}>
                                            <dt>{item.group}</dt>
                                            <dd>{item.items}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}
                            <div className="ins-history">
                                <Rows label="Experience" rows={practice.experience} />
                                {practice.education && <Rows label="Education" rows={practice.education} />}
                            </div>
                            <ul className="ins-links" aria-label="Elsewhere">
                                {profile.links.map((link) => (
                                    <li key={link.href}>
                                        <LinkKey link={link} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section id="reply" className="ins-section ins-reply" aria-labelledby="reply-title">
                    <div className="ins-wrap">
                        <SectionHead n="03" id="reply-title" title="Reply" />
                        <p className="ins-label">{profile.availability} · write to</p>
                        <a className="ins-mail" href={`mailto:${profile.email}`}>
                            {profile.email}
                        </a>
                        <div className="ins-keys">
                            <a className="ins-key ins-key-primary" href={`mailto:${profile.email}`}>
                                Write an email
                            </a>
                            <button type="button" className="ins-key" data-copy={profile.email}>
                                Copy address
                            </button>
                            {profile.phone && <LinkKey link={profile.phone} />}
                            <span className="ins-sr" role="status" data-copy-status />
                        </div>
                    </div>
                </section>
            </main>

            <footer className="ins-colophon">
                <div className="ins-wrap ins-colophon-grid">
                    <div>
                        <p className="ins-label">This page, measured in your browser</p>
                        <Vitals variant="full" />
                    </div>
                    <p className="ins-colophon-note">
                        Press Inspect to see the drawing under any screen: boxes, type sizes, contrast and
                        target sizes, read live from the page.
                    </p>
                    <p className="ins-colophon-sign">
                        © {year} {profile.name}
                    </p>
                </div>
            </footer>

            <nav className="ins-dock" aria-label="Sections">
                <a className="ins-key" href="#work">
                    Work
                </a>
                <a className="ins-key" href="#about">
                    About
                </a>
                <a className="ins-key" href="#reply">
                    Reply
                </a>
                <Lens />
                <Vitals variant="dock" />
            </nav>
        </div>
    );
}
