import React from 'react';

import { Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';
import type { Project } from '@/content/types';

import { ASSEMBLIES, generic } from './assemblies/configs';
import { drawAssembly, T } from './assemblies/drawing';
import './assemblies.css';

const pad2 = (v: number): string => String(v).padStart(2, '0');

function Assembly({ project, i, total }: { project: Project; i: number; total: number }): React.JSX.Element {
    const s = sheet('assemblies');
    const cfg = ASSEMBLIES[project.id] ?? generic(project);
    const { svg, cam, camSm } = drawAssembly(`asm-${project.id}`, cfg, {
        dwg: `AR-${s.n}.${pad2(i + 1)}`,
        title: project.title,
        sheet: `${s.n} of ${SHEET_COUNT}`,
    });
    const hid = `asm-${project.id}-h`;
    return (
        <Scene mode="pin" T={T} len={2.3} lead={0.7} cam={cam} camSm={camSm} stageClassName="asm-stage">
            <article className="asm-art" aria-labelledby={hid}>
                <div className="asm-draw">
                    {svg}
                    <ol className="asm-beats" aria-hidden="true">
                        <li {...win(0, 3.3)}>Plan</li>
                        <li {...win(3.4, 6.3)}>Exploded</li>
                        {cfg.detail ? <li {...win(6.4, 8.4)}>Detail A</li> : null}
                        <li {...win(8.5, 9.4)}>Sheet</li>
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
                </div>
            </article>
        </Scene>
    );
}

/** Sheet 3: one pinned scene per project. Each draws its plan, lifts its layers, then enlarges one detail. */
export default function Assemblies(): React.JSX.Element {
    const s = sheet('assemblies');
    const projects = SITE.projects;
    return (
        <section id={s.id} aria-labelledby="assemblies-h" className="asm">
            <SheetFrame
                n={s.n}
                of={SHEET_COUNT}
                title={s.title}
                sub={`${projects.length} projects · plan view, exploded view, detail`}
                headingId="assemblies-h"
                className="asm-sheet"
            >
                {projects.map((p, i) => (
                    <Assembly key={p.id} project={p} i={i} total={projects.length} />
                ))}
            </SheetFrame>
        </section>
    );
}
