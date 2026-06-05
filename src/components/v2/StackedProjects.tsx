'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import {
    RiskEngineDiagram,
    MapsDiagram,
    RealtimeDiagram,
    SpatialDiagram,
    MCPDiagram,
    PWADiagram,
} from './ArchDiagrams';
import { navigate } from './Chrome';
import { PROJECTS } from './data';

gsap.registerPlugin(ScrollTrigger);

type DiagramFn = (p: (typeof PROJECTS)[0]) => JSX.Element;

const DIAGRAMS: DiagramFn[] = [
    (p) => <RiskEngineDiagram accent={p.accent} />,
    (p) => <MapsDiagram accent={p.accent} accent2={p.accent2} />,
    (p) => <RealtimeDiagram accent={p.accent} accent2={p.accent2} />,
    (p) => <SpatialDiagram accent={p.accent} accent2={p.accent2} />,
    (p) => <MCPDiagram accent={p.accent} accent2={p.accent2} />,
    (p) => <PWADiagram accent={p.accent} accent2={p.accent2} />,
];

const FEATURED = PROJECTS.slice(0, 4);

function ProjectCard({
    project,
    index,
    total,
}: {
    project: (typeof PROJECTS)[0];
    index: number;
    total: number;
}): JSX.Element {
    const cardRef = useRef<HTMLDivElement>(null);
    const metric = project.metrics[0];

    useEffect(() => {
        const card = cardRef.current;
        if (!card || index === total - 1) return () => {};

        /* Scale card down as the next card scrolls up behind it */
        const targetScale = 1 - (total - index - 1) * 0.04;

        const ctx = gsap.context(() => {
            gsap.to(card, {
                scale: targetScale,
                transformOrigin: 'top center',
                ease: 'none',
                scrollTrigger: {
                    trigger: card,
                    start: 'top top+=56',
                    end: 'bottom top+=56',
                    scrub: 1,
                },
            });
        }, card);

        return () => ctx.revert();
    }, [index, total]);

    const diagramFn = DIAGRAMS[index % DIAGRAMS.length];

    return (
        <div ref={cardRef} className="gm-sp-card" id={`sp-${project.id}`}>
            {/* Accent atmosphere */}
            <div
                className="gm-sp-atmosphere"
                style={{
                    background: `radial-gradient(ellipse 70% 60% at 80% 30%, ${project.accent}18, transparent 65%),radial-gradient(ellipse 50% 50% at 20% 80%, ${project.accent2}10, transparent 60%)`,
                }}
                aria-hidden="true"
            />

            {/* Glyph backdrop */}
            <div
                className="gm-sp-glyph v2-display"
                style={{ color: project.accent + '0d' }}
                aria-hidden="true"
            >
                {project.glyph}
            </div>

            <div className="gm-sp-inner">
                {/* LEFT: content */}
                <div className="gm-sp-content">
                    {/* Meta */}
                    <p className="gm-sp-kicker v2-mono">
                        <span style={{ color: project.accent }}>
                            {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
                        </span>
                        {' · '}
                        {project.company}
                        {' · '}
                        {project.year}
                    </p>

                    <h2 className="gm-sp-title v2-display">{project.title}</h2>
                    <p className="gm-sp-subtitle">{project.subtitle}</p>
                    <p className="gm-sp-summary">{project.summary}</p>

                    {/* Metrics row */}
                    <div className="gm-sp-metrics">
                        {project.metrics.map((m) => (
                            <div key={m.k} className="gm-sp-metric">
                                <span className="gm-sp-metric-v v2-display" style={{ color: project.accent }}>
                                    {m.v}
                                </span>
                                <span className="gm-sp-metric-k v2-mono">{m.k}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stack chips */}
                    <div className="gm-sp-chips">
                        {project.stack.slice(0, 5).map((s) => (
                            <span key={s} className="v2-chip">
                                {s}
                            </span>
                        ))}
                        {project.github && (
                            <a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="v2-chip gm-sp-chip-link"
                            >
                                GitHub ↗
                            </a>
                        )}
                    </div>

                    {/* CTA */}
                    <button
                        className="v2-btn v2-btn-primary gm-sp-cta"
                        onClick={() => navigate('/work/' + project.id)}
                        style={{
                            boxShadow: `0 12px 40px -12px ${project.accent}66`,
                        }}
                    >
                        Case study + live POC →
                    </button>
                </div>

                {/* RIGHT: architecture diagram */}
                <div className="gm-sp-diagram" aria-hidden="true">
                    {diagramFn(project)}
                </div>
            </div>

            {/* Bottom progress indicator */}
            <div className="gm-sp-progress v2-mono" aria-hidden="true">
                {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                {' · '}
                {project.runtime}
            </div>
        </div>
    );
}

export default function StackedProjects(): JSX.Element {
    const total = FEATURED.length;

    return (
        <section id="gm-work" className="gm-sp-section" aria-label="Selected work">
            {/* Section header — visible before first card */}
            <div className="gm-sp-header v2-container">
                <p className="v2-mono gm-section-kicker">04 / SELECTED WORK</p>
                <h2 className="v2-display gm-section-title">Systems that shipped.</h2>
                <p className="gm-section-sub">
                    Each includes a working POC. Interact with the actual system inside the case study.
                </p>
            </div>

            {/* Stacked cards — CSS sticky + GSAP scale */}
            <div className="gm-sp-stack">
                {FEATURED.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} total={total} />
                ))}
            </div>

            {/* View all */}
            <div className="gm-sp-viewall v2-container">
                <button
                    className="v2-btn v2-btn-ghost"
                    onClick={() => navigate('/work')}
                    style={{ fontSize: 13 }}
                >
                    View all {PROJECTS.length} projects →
                </button>
            </div>
        </section>
    );
}
