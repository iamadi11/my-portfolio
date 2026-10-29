import React from 'react';

import { Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { PROJECT_FILMS } from '@/content/project-films';
import { SITE } from '@/content/site';
import type { Project } from '@/content/types';
import { projectStats, type ProjectStats } from '@/lib/live';

import ProjectTour from '../ProjectTour';
import { ASSEMBLIES, generic } from './assemblies/configs';
import { drawAssembly } from './assemblies/drawing';
import './assemblies.css';

const pad2 = (v: number): string => String(v).padStart(2, '0');

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `DD MON YYYY` in UTC (CSS sets caps); nothing for a date that does not parse. */
function day(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${pad2(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Live references from the project's own repo and package; only the facts that were fetched, else nothing. */
function Ref({ stats, title }: { stats: ProjectStats; title: string }): React.JSX.Element | null {
    const { repo, npm } = stats;
    if (!repo && !npm) return null;
    const push = repo ? day(repo.pushedAt) : '';
    return (
        <dl className="asm-ref" {...win(1.4, 2.3)}>
            <dt className="asm-ref-h">
                Ref<span className="sr-only"> · public source snapshot for {title}</span>
            </dt>
            {repo ? (
                <dd>
                    GitHub · <span aria-hidden="true">★</span> {repo.stars.toLocaleString('en-IN')}
                    <span className="sr-only"> stars</span>
                    {push ? <> · Last push {push}</> : null}
                </dd>
            ) : null}
            {npm ? <dd>npm · {npm.weekly.toLocaleString('en-IN')} downloads / week</dd> : null}
        </dl>
    );
}

function Assembly({
    project,
    stats,
    i,
    total,
}: {
    project: Project;
    stats: ProjectStats;
    i: number;
    total: number;
}): React.JSX.Element {
    const s = sheet('assemblies');
    const cfg = ASSEMBLIES[project.id] ?? generic(project);
    const { svg, cam, camSm, T, len } = drawAssembly(`asm-${project.id}`, cfg, {
        dwg: `AR-${s.n}.${pad2(i + 1)}`,
        title: project.title,
        sheet: `${s.n} of ${SHEET_COUNT}`,
    });
    const hid = `asm-${project.id}-h`;
    return (
        <Scene mode="pin" T={T} len={len} lead={0.7} cam={cam} camSm={camSm} stageClassName="asm-stage">
            <article className="asm-art" aria-labelledby={hid}>
                <div className="asm-draw">
                    {svg}
                    <ol className="asm-beats" aria-hidden="true">
                        <li {...win(0, 3.3)}>Plan</li>
                        <li {...win(3.4, 6.3)}>Exploded</li>
                        {cfg.detail ? <li {...win(6.4, 8.4)}>Detail A</li> : null}
                        {cfg.section?.length ? <li {...win(8.5, 10.4)}>Section A–A</li> : null}
                        <li {...win(T - 1.5, T - 0.6)}>Sheet</li>
                    </ol>
                </div>
                <div className="asm-copy">
                    <p className="asm-idx">
                        Assembly {pad2(i + 1)} / {pad2(total)}
                        {project.year ? ` · ${project.year}` : ''}
                    </p>
                    <h3 id={hid} className="asm-h3">
                        {project.title}
                    </h3>
                    <span className="asm-rule" {...win(0, 1.4)} aria-hidden="true" />
                    <p className="asm-sum">{project.summary}</p>
                    <table className="asm-stack">
                        <caption className="sr-only">{project.title} stack</caption>
                        <thead>
                            <tr>
                                <th scope="col">Code</th>
                                <th scope="col">Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.stack.map((item, k) => (
                                <tr key={item} {...win(0.4 + k * 0.25, 1.1 + k * 0.25)}>
                                    <td>C{k + 1}</td>
                                    <td>{item}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {project.links.length ? (
                        <ul className="asm-links" {...win(1.2, 2.2)}>
                            {project.links.map((l, k) => (
                                <li key={l.href}>
                                    <a
                                        href={l.href}
                                        className={k === 0 ? 'asm-btn asm-btn-1' : 'asm-btn'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {l.label}
                                        <span className="sr-only">
                                            {' '}
                                            for {project.title} (opens in a new tab)
                                        </span>
                                        <span className="asm-arr" aria-hidden="true">
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {PROJECT_FILMS[project.id] && (
                        <ProjectTour title={project.title} film={PROJECT_FILMS[project.id]} />
                    )}
                    <p className="asm-schematic">Conceptual software assembly · spacing is schematic</p>
                    <Ref stats={stats} title={project.title} />
                    <p className="asm-cta" {...win(1.6, 2.4)}>
                        <a
                            href={`mailto:${SITE.profile.email}?subject=${encodeURIComponent(`About ${project.title}`)}`}
                        >
                            Discuss this assembly <span aria-hidden="true">→</span>
                        </a>
                    </p>
                </div>
            </article>
        </Scene>
    );
}

/** Sheet 3: one pinned scene per project. Each draws its plan, lifts its layers, then enlarges one detail. */
export default async function Assemblies(): Promise<React.JSX.Element> {
    const s = sheet('assemblies');
    const projects = SITE.projects;
    const stats = await Promise.all(projects.map(projectStats));
    return (
        <section id={s.id} aria-labelledby="assemblies-h" className="asm">
            <SheetFrame
                n={s.n}
                of={SHEET_COUNT}
                title={s.title}
                sub={`How it is built · ${projects.length} projects · plan view, exploded view, detail`}
                headingId="assemblies-h"
                className="asm-sheet"
            >
                {projects.map((p, i) => (
                    <Assembly key={p.id} project={p} stats={stats[i]} i={i} total={projects.length} />
                ))}
            </SheetFrame>
        </section>
    );
}
