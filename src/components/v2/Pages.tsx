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
import CareerTimeline from './CareerTimeline';
import { navigate } from './Chrome';
import { MagBtn, Marquee, Reveal, SectionHeader, TechOrbit } from './Cinema';
import { CinematicUniverse } from './CinematicUniverse';
import { IDENTITY, PROJECTS, EXPERIENCE, SKILLS, EDUCATION } from './data';
import Hero from './Hero';
import { ProjectPOC } from './POCs';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   ANIMATED COUNTER — scroll-triggered number reveal
   ============================================================ */
function AnimatedNumber({ target, accent }: { target: string; accent?: string }): JSX.Element {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return () => {};
        // Skip complex strings (arrows / slashes)
        if (target.includes('→') || target.includes('/')) {
            el.textContent = target;
            return () => {};
        }
        const num = parseFloat(target.replace(/[^0-9.]/g, ''));
        const suffix = target.replace(/[0-9.]/g, '').trim();
        if (isNaN(num)) {
            el.textContent = target;
            return () => {};
        }

        const obj = { val: 0 };
        const ctx = gsap.context(() => {
            gsap.to(obj, {
                val: num,
                duration: 2.0,
                ease: 'power2.out',
                onUpdate() {
                    el.textContent = Math.round(obj.val) + suffix;
                },
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            });
        });
        return () => ctx.revert();
    }, [target]);

    return (
        <span ref={ref} className="v2-impact-num v2-display" style={accent ? { color: accent } : undefined}>
            {target}
        </span>
    );
}

const IMPACT_ITEMS = [
    {
        num: '80%',
        label: 'Build time reduction',
        attr: 'TATA 1MG · 2023',
        accent: 'var(--v2-good)',
        detail: 'Webpack 5 persistent cache + Turborepo remote: 15 min → 3 min',
    },
    {
        num: '70→15%',
        label: 'SLA breach rate',
        attr: 'TATA 1MG · 2023',
        accent: 'var(--v2-accent)',
        detail: 'Redis pub/sub fanout → SSE dashboards + WebPush mobile. Median alert: 4 min → 8 s',
    },
    {
        num: '~M/mo',
        label: 'Transactions processed',
        attr: 'CASHFREE · 2025',
        accent: 'var(--v2-gold)',
        detail: 'Configurable fraud rule engine · <120 ms p99 decision latency',
    },
    {
        num: '50%',
        label: 'Faster repeat visits',
        attr: 'MORESAND · 2024',
        accent: 'var(--v2-accent-2)',
        detail: 'PWA service-worker pre-cache + React Query stale-while-revalidate',
    },
] as const;

const PRINCIPLES = [
    {
        title: 'Performance is observable.',
        body: "I don't optimize blindly. I instrument, measure, then fix. Every win has a before and after number attached. At Tata 1mg that number was build time: 15 minutes to 3. The measurement came first.",
    },
    {
        title: 'Systems outlast solutions.',
        body: 'Point fixes become tech debt the moment requirements change. At Cashfree, I built a rule engine so merchants could configure transaction blocking without touching code — zero frontend deploys for new rules.',
    },
    {
        title: 'Ship first. Sharpen always.',
        body: 'Perfect is the enemy of shipped. I bias toward delivery: get it in front of users, measure impact, iterate. The Video KYC reconnection flow shipped in a week. Three iterations later it had 30% fewer session drops.',
    },
];

/* HeroR replaced by Hero (./Hero.tsx) — imported above */

function ImpactR(): JSX.Element {
    return (
        <section id="gm-impact" className="v2-impact-section" aria-labelledby="impact-heading">
            <div className="v2-container">
                <Reveal>
                    <SectionHeader
                        kicker="01 / ENGINEERING IMPACT"
                        title="Outcomes first."
                        subtitle="Every metric was earned by shipping, measuring, and iterating — not reported."
                    />
                </Reveal>
                <div className="v2-impact-grid">
                    {IMPACT_ITEMS.map((item, i) => (
                        <Reveal key={item.num + item.attr} delay={i * 75}>
                            <div className="v2-impact-cell">
                                <AnimatedNumber target={item.num} accent={item.accent} />
                                <span className="v2-impact-label">{item.label}</span>
                                <span className="v2-impact-attr v2-mono">{item.attr}</span>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--v2-ink-3)',
                                        marginTop: 8,
                                        lineHeight: 1.55,
                                    }}
                                >
                                    {item.detail}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CaseStudyCard({ project, index }: { project: (typeof PROJECTS)[0]; index: number }): JSX.Element {
    const num = String(index + 1).padStart(2, '0');
    const metric = project.metrics[0];

    return (
        <div
            className="v2-case-card"
            onClick={() => navigate('/work/' + project.id)}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/work/' + project.id)}
            role="button"
            tabIndex={0}
            aria-label={`Case study: ${project.title}`}
        >
            <div className="v2-case-num v2-mono">{num}</div>
            <div className="v2-case-body">
                <p className="v2-case-kicker v2-mono">
                    {project.company} · {project.year}
                </p>
                <h3 className="v2-case-title v2-display">{project.title}</h3>
                <p className="v2-case-desc">{project.summary}</p>
                <div className="v2-case-chips">
                    {project.stack.slice(0, 4).map((s) => (
                        <span key={s} className="v2-chip">
                            {s}
                        </span>
                    ))}
                </div>
            </div>
            <div className="v2-case-metric">
                <span className="v2-case-metric-v v2-display" style={{ color: project.accent }}>
                    {metric.v}
                </span>
                <span className="v2-case-metric-k v2-mono">{metric.k}</span>
                <span className="v2-case-cta v2-mono">case study + poc →</span>
            </div>
        </div>
    );
}

function PhilosophyR(): JSX.Element {
    return (
        <section id="gm-philosophy" className="v2-philosophy-section" aria-labelledby="philosophy-heading">
            <div className="v2-container">
                <Reveal>
                    <SectionHeader
                        kicker="03 / HOW I THINK"
                        title="Engineering principles."
                        subtitle="Not values. Actual decision frameworks from production systems."
                    />
                </Reveal>
                <div className="v2-philosophy-list">
                    {PRINCIPLES.map((p, i) => (
                        <Reveal key={p.title} delay={i * 80}>
                            <div className="v2-philosophy-item">
                                <div
                                    className="v2-philosophy-num v2-mono"
                                    style={{ color: 'var(--v2-accent)' }}
                                >
                                    0{i + 1}
                                </div>
                                <div>
                                    <h3 className="v2-philosophy-title v2-display">{p.title}</h3>
                                    <p className="v2-philosophy-body">{p.body}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function PageHome(): JSX.Element {
    return (
        <div className="v2-page-enter">
            {/* 1: God Mode hero — R3F particle network + editorial text */}
            <Hero />

            {/* 2: Tech marquee strip */}
            <Marquee
                items={[
                    'React',
                    'Next.js',
                    'TypeScript',
                    'PWA',
                    'Performance',
                    'Realtime',
                    'Zustand',
                    'Redis',
                    'Webpack',
                    'Turborepo',
                    'Google Maps',
                    'Node.js',
                ]}
            />

            {/* 3: Engineering impact — animated counter numbers */}
            <ImpactR />

            {/* 4: Career journey — scroll-driven horizontal timeline */}
            <CareerTimeline />

            {/* 5: Selected work — case study cards */}
            <div id="gm-work" className="v2-container v2-chapter">
                <Reveal>
                    <SectionHeader
                        kicker="04 / SELECTED WORK"
                        title="Systems that shipped."
                        subtitle="Each includes a working POC — interact with the actual system inside the case study."
                        right={
                            <button
                                className="v2-btn v2-btn-ghost"
                                onClick={() => navigate('/work')}
                                style={{ fontSize: 12, flexShrink: 0 }}
                            >
                                all projects →
                            </button>
                        }
                    />
                </Reveal>
                <div className="v2-case-grid">
                    {PROJECTS.slice(0, 3).map((p, i) => (
                        <Reveal key={p.id} delay={i * 70}>
                            <CaseStudyCard project={p} index={i} />
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* 6: Engineering philosophy */}
            <PhilosophyR />

            {/* 7: Tech ecosystem */}
            <div className="v2-tech-chapter">
                <div className="v2-container v2-tech-chapter-inner">
                    <div className="v2-tech-chapter-text">
                        <Reveal>
                            <SectionHeader
                                kicker="05 / STACK"
                                title="The ecosystem."
                                subtitle="Deep specialization in React and its orbit — from UI to build tooling, realtime, and performance."
                            />
                        </Reveal>
                        <Reveal delay={100}>
                            <div className="v2-tech-pills">
                                {[
                                    { label: 'Frontend', color: 'var(--v2-accent)' },
                                    { label: 'Performance', color: 'var(--v2-good)' },
                                    { label: 'Realtime', color: 'var(--v2-accent-3)' },
                                    { label: 'Build', color: 'var(--v2-gold)' },
                                    { label: 'OSS', color: 'var(--v2-accent-2)' },
                                ].map((tag) => (
                                    <span
                                        key={tag.label}
                                        className="v2-tech-pill v2-mono"
                                        style={{ '--pill-color': tag.color } as React.CSSProperties}
                                    >
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                    <Reveal delay={60}>
                        <div className="v2-orbit-wrap" aria-label="Technology orbit">
                            <TechOrbit />
                        </div>
                    </Reveal>
                </div>
            </div>

            {/* 8: CTA */}
            <div id="gm-contact" className="v2-container v2-chapter">
                <Reveal>
                    <div className="v2-cta-banner">
                        <div>
                            <div
                                className="v2-mono"
                                style={{
                                    fontSize: 11,
                                    color: 'var(--v2-accent)',
                                    letterSpacing: '0.18em',
                                    marginBottom: 8,
                                }}
                            >
                                06 / CONTACT
                            </div>
                            <h3
                                className="v2-display"
                                style={{
                                    fontSize: 'clamp(26px,4vw,40px)',
                                    fontWeight: 700,
                                    margin: 0,
                                    letterSpacing: '-0.025em',
                                    color: 'var(--v2-ink)',
                                }}
                            >
                                Let&apos;s build something.
                            </h3>
                            <p style={{ color: 'var(--v2-ink-2)', marginTop: 8, fontSize: 14 }}>
                                Open to senior frontend roles, contracts, and complex UI systems.
                            </p>
                        </div>
                        <button className="v2-btn v2-btn-primary" onClick={() => navigate('/contact')}>
                            Get in touch →
                        </button>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

/* ============================================================
   WORK PAGE — cinematic full-viewport project scenes
   ============================================================ */

/* Per-project GSAP choreography — each scene has a distinct motion personality */
function buildSceneTimeline(tl: gsap.core.Timeline, q: (selector: string) => Element[], idx: number): void {
    /* Shared: scene atmosphere materialises */
    tl.fromTo(q('.v2-ps-bg'), { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0);

    switch (idx % 6) {
        case 0: {
            /* Risk Engine — authority, precision wipe.
               Kicker clips in L→R, title rises with rotateX depth,
               metrics pop with spring, summary descends as curtain. */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
                { clipPath: 'inset(0 0% 0 0)', duration: 0.65, ease: 'power4.out' },
                0.1
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { y: 56, rotateX: -18, opacity: 0, transformPerspective: 900 },
                    { y: 0, rotateX: 0, opacity: 1, duration: 1.0, ease: 'power4.out' },
                    0.35
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { x: -28, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
                    0.7
                )
                .fromTo(
                    q('.v2-ps-metric'),
                    { y: 28, opacity: 0, scale: 0.88 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.1 },
                    0.9
                )
                .fromTo(
                    q('.v2-ps-summary'),
                    { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
                    { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.out' },
                    1.15
                )
                .fromTo(
                    q('.v2-ps-chip'),
                    { y: 14, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.42, ease: 'power2.out', stagger: 0.05 },
                    1.4
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
                    1.62
                );
            break;
        }
        case 1: {
            /* Serviceability Maps — spatial, expansive.
               Everything slides in from far right — directional motion
               matching the glyph side. Letter-spacing collapses on title. */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { x: 48, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
                0.1
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { x: 80, opacity: 0 },
                    { x: 0, opacity: 1, duration: 1.1, ease: 'expo.out' },
                    0.28
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { x: 40, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                    0.65
                )
                .fromTo(
                    q('.v2-ps-metric'),
                    { x: 28, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: 0.1 },
                    0.9
                )
                .fromTo(
                    q('.v2-ps-summary'),
                    { y: 22, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' },
                    1.15
                )
                .fromTo(
                    q('.v2-ps-chip'),
                    { scale: 0.82, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.38, ease: 'back.out(1.7)', stagger: 0.055 },
                    1.38
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { x: 28, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
                    1.6
                );
            break;
        }
        case 2: {
            /* Realtime Notifications — urgency, snappy.
               Title skews in with overshoot. Metrics pop simultaneously
               (not staggered — they all arrive at once like a signal burst). */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { y: -24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
                0.05
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { y: 42, skewX: 3, opacity: 0 },
                    { y: 0, skewX: 0, opacity: 1, duration: 0.72, ease: 'back.out(1.3)' },
                    0.22
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
                    0.56
                )
                /* All metrics at once — urgency, not a slow reveal */
                .fromTo(
                    q('.v2-ps-metric'),
                    { scale: 1.1, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.36, ease: 'power2.out', stagger: 0.06 },
                    0.72
                )
                .fromTo(
                    q('.v2-ps-summary'),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.48, ease: 'power3.out' },
                    0.92
                )
                .fromTo(
                    q('.v2-ps-chip'),
                    { y: 12, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.32, ease: 'power2.out', stagger: 0.04 },
                    1.1
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
                    1.28
                );
            break;
        }
        case 3: {
            /* Spatial — deliberate, measured precision.
               Slow long durations. Each layer settles before the next arrives.
               Feels like a tool loading, not performing. */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { opacity: 0 },
                { opacity: 1, duration: 0.55, ease: 'power1.inOut' },
                0.2
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { y: 36, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1.3, ease: 'power2.out' },
                    0.4
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out' },
                    0.9
                )
                /* Wide stagger — each metric arrives individually */
                .fromTo(
                    q('.v2-ps-metric'),
                    { y: 24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.2 },
                    1.05
                )
                .fromTo(
                    q('.v2-ps-summary'),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.85, ease: 'power2.out' },
                    1.6
                )
                .fromTo(
                    q('.v2-ps-chip'),
                    { opacity: 0 },
                    { opacity: 1, duration: 0.55, ease: 'power1.out', stagger: 0.09 },
                    1.88
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { opacity: 0, y: 12 },
                    { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
                    2.1
                );
            break;
        }
        case 4: {
            /* MCP UI — modular, constructed.
               Everything builds from the bottom in blocks.
               Chips appear one by one like protocol packets. */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.44, ease: 'power3.out' },
                0.08
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { y: 64, rotateX: -10, opacity: 0, transformPerspective: 700 },
                    { y: 0, rotateX: 0, opacity: 1, duration: 0.9, ease: 'power4.out' },
                    0.26
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { y: 28, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
                    0.68
                )
                .fromTo(
                    q('.v2-ps-metric'),
                    { y: 36, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.58, ease: 'power3.out', stagger: 0.13 },
                    0.86
                )
                .fromTo(
                    q('.v2-ps-summary'),
                    { y: 24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
                    1.18
                )
                /* Chips protocol-style: one by one with longer stagger */
                .fromTo(
                    q('.v2-ps-chip'),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.38, ease: 'back.out(1.4)', stagger: 0.08 },
                    1.38
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { y: 24, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
                    1.72
                );
            break;
        }
        case 5: {
            /* PWA & Build — performance, one fast sweep.
               Kicker and title arrive together in a single compressed burst.
               Secondary content settles at normal pace — fast then slow. */
            tl.fromTo(
                q('.v2-ps-kicker'),
                { x: -32, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.38, ease: 'power3.out' },
                0
            )
                .fromTo(
                    q('.v2-ps-title'),
                    { y: 52, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.72, ease: 'power4.inOut' },
                    0.1
                )
                .fromTo(
                    q('.v2-ps-subtitle'),
                    { y: 22, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.42, ease: 'power3.out' },
                    0.46
                )
                .fromTo(
                    q('.v2-ps-metric'),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.36, ease: 'power3.out', stagger: 0.06 },
                    0.62
                )
                /* Settle — slower than the burst */
                .fromTo(
                    q('.v2-ps-summary'),
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out' },
                    0.88
                )
                .fromTo(
                    q('.v2-ps-chip'),
                    { y: 14, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.34, ease: 'power2.out', stagger: 0.045 },
                    1.06
                )
                .fromTo(
                    q('.v2-ps-cta-btn'),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.46, ease: 'power3.out' },
                    1.28
                );
            break;
        }
    }
}

const DIAGRAMS = [
    (p: (typeof PROJECTS)[0]) => <RiskEngineDiagram accent={p.accent} />,
    (p: (typeof PROJECTS)[0]) => <MapsDiagram accent={p.accent} accent2={p.accent2} />,
    (p: (typeof PROJECTS)[0]) => <RealtimeDiagram accent={p.accent} accent2={p.accent2} />,
    (p: (typeof PROJECTS)[0]) => <SpatialDiagram accent={p.accent} accent2={p.accent2} />,
    (p: (typeof PROJECTS)[0]) => <MCPDiagram accent={p.accent} accent2={p.accent2} />,
    (p: (typeof PROJECTS)[0]) => <PWADiagram accent={p.accent} accent2={p.accent2} />,
];

function ProjectScene({
    project,
    index,
    total,
}: {
    project: (typeof PROJECTS)[0];
    index: number;
    total: number;
}): JSX.Element {
    const sceneRef = useRef<HTMLElement>(null);
    const isLeft = index % 2 === 0;
    const num = `${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`;

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return () => {};

        const ctx = gsap.context(() => {
            const q = gsap.utils.selector(scene);

            /* ── Depth parallax: backdrop glyph moves at 0.4× scroll speed ── */
            gsap.fromTo(
                q('.v2-ps-glyph'),
                { y: 70 },
                {
                    y: -70,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: scene,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 2.8,
                    },
                }
            );

            /* ── Ghost number parallax: faster layer, subtle opacity shift ── */
            gsap.fromTo(
                q('.v2-ps-ghost'),
                { y: 40, opacity: 0 },
                {
                    y: -50,
                    opacity: 0.028,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: scene,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1.6,
                    },
                }
            );

            /* ── Cinematic entry timeline ── */
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: scene,
                    start: 'top 78%',
                    toggleActions: 'play none none none',
                },
            });

            buildSceneTimeline(tl, q, index);
        }, scene);

        return () => ctx.revert();
    }, [index]);

    return (
        <section
            ref={sceneRef}
            className={`v2-project-scene ${isLeft ? 'v2-ps-left' : 'v2-ps-right'}`}
            id={`scene-${project.id}`}
        >
            {/* Accent atmosphere */}
            <div
                className="v2-ps-bg"
                style={{
                    background: `radial-gradient(ellipse 65% 55% at ${isLeft ? '78% 32%' : '22% 32%'}, ${project.accent}14, transparent),radial-gradient(ellipse 50% 45% at ${isLeft ? '25% 78%' : '75% 78%'}, ${project.accent2}0a, transparent)`,
                }}
            />

            {/* Parallax backdrop glyph */}
            <div
                className={`v2-ps-glyph v2-display ${isLeft ? 'v2-ps-glyph-right' : 'v2-ps-glyph-left'}`}
                aria-hidden="true"
                style={{ color: project.accent }}
            >
                {project.glyph}
            </div>

            {/* Ghost section number — deeper parallax layer */}
            <div className="v2-ps-ghost v2-display" aria-hidden="true" style={{ opacity: 0 }}>
                {String(index + 1).padStart(2, '0')}
            </div>

            {/* Architecture diagram — floated on the opposite side */}
            <div className="v2-ps-diagram" aria-hidden="true">
                {DIAGRAMS[index % DIAGRAMS.length](project)}
            </div>

            {/* Content */}
            <div className="v2-ps-inner">
                <p className="v2-ps-kicker v2-mono">
                    <span style={{ color: project.accent }}>{num}</span>
                    {' · '}
                    {project.company}
                    {' · '}
                    {project.year}
                </p>

                <h2 className="v2-ps-title">{project.title}</h2>
                <p className="v2-ps-subtitle">{project.subtitle}</p>

                <div className="v2-ps-metrics">
                    {project.metrics.map((m) => (
                        <div key={m.k} className="v2-ps-metric">
                            <div className="v2-ps-metric-v" style={{ color: project.accent }}>
                                {m.v}
                            </div>
                            <div className="v2-ps-metric-k">{m.k}</div>
                        </div>
                    ))}
                </div>

                <p className="v2-ps-summary">{project.summary}</p>

                <div className="v2-ps-chips">
                    {project.stack.map((s) => (
                        <span key={s} className="v2-chip v2-ps-chip">
                            {s}
                        </span>
                    ))}
                    {project.github && (
                        <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="v2-chip v2-ps-chip-link v2-ps-chip"
                        >
                            GitHub ↗
                        </a>
                    )}
                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="v2-chip v2-ps-chip-link v2-ps-chip"
                        >
                            Demo ↗
                        </a>
                    )}
                </div>

                <div className="v2-ps-cta">
                    <MagBtn
                        className="v2-btn v2-btn-primary v2-ps-cta-btn"
                        onClick={() => navigate('/work/' + project.id)}
                        style={{ fontSize: 13 }}
                    >
                        Case study + live POC →
                    </MagBtn>
                </div>
            </div>
        </section>
    );
}

export function PageWork(): JSX.Element {
    return (
        <div className="v2-page-enter v2-work-scenes">
            <CinematicUniverse />
            {/* Header */}
            <div className="v2-work-scenes-header">
                <div className="v2-sec-label-line">Work · Case Studies</div>
                <h1
                    className="v2-display"
                    style={{
                        fontSize: 'clamp(34px,6vw,60px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                        color: 'var(--v2-ink)',
                    }}
                >
                    Selected projects.
                </h1>
                <p
                    style={{
                        fontSize: 15,
                        color: 'var(--v2-ink-2)',
                        marginTop: 8,
                        maxWidth: 440,
                        lineHeight: 1.55,
                    }}
                >
                    Each ships with a working POC — interact with the actual system inside the case study.
                </p>
            </div>

            {/* Cinematic scenes */}
            {PROJECTS.map((p, i) => (
                <ProjectScene key={p.id} project={p} index={i} total={PROJECTS.length} />
            ))}
        </div>
    );
}

/* ============================================================
   PROJECT DETAIL PAGE
   ============================================================ */
export function PageProject({ id }: { id?: string }): JSX.Element {
    const project = PROJECTS.find((p) => p.id === id);
    const bandRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const band = bandRef.current;
        if (!band) return () => {};
        const ctx = gsap.context(() => {
            const items = band.querySelectorAll('[data-band-item]');
            gsap.fromTo(
                items,
                { opacity: 0, y: 32 },
                { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.09, delay: 0.1 }
            );
        }, band);
        return () => ctx.revert();
    }, [id]);

    if (!project) {
        return (
            <div className="v2-container" style={{ paddingTop: 120, textAlign: 'center' }}>
                <h2 className="v2-display">Project not found</h2>
                <button className="v2-btn" onClick={() => navigate('/work')} style={{ marginTop: 16 }}>
                    ← back to work
                </button>
            </div>
        );
    }

    const idx = PROJECTS.findIndex((p) => p.id === id);
    const next = PROJECTS[(idx + 1) % PROJECTS.length];

    return (
        <div className="v2-page-enter">
            {/* Hero band */}
            <div
                ref={bandRef}
                className="v2-project-band"
                style={{ background: `linear-gradient(135deg,${project.accent}1e,${project.accent2}14)` }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(ellipse at 18% 28%,${project.accent}33,transparent 55%),radial-gradient(ellipse at 82% 72%,${project.accent2}2a,transparent 55%)`,
                    }}
                    aria-hidden="true"
                />

                {/* Glyph backdrop */}
                <div
                    className="v2-project-glyph-bg v2-display"
                    aria-hidden="true"
                    style={{ color: project.accent + '12' }}
                >
                    {project.glyph}
                </div>

                <div className="v2-project-band-content">
                    <button
                        data-band-item
                        className="v2-btn v2-btn-ghost"
                        onClick={() => navigate('/work')}
                        style={{ marginBottom: 22, fontSize: 12 }}
                    >
                        ← work
                    </button>

                    <div
                        data-band-item
                        className="v2-mono"
                        style={{
                            fontSize: 11,
                            letterSpacing: '0.18em',
                            color: project.accent,
                            marginBottom: 12,
                        }}
                    >
                        {project.glyph} · {project.year} · {project.runtime}
                    </div>

                    <h1 data-band-item className="v2-project-h1">
                        {project.title}
                    </h1>

                    <div
                        data-band-item
                        style={{
                            fontSize: 'clamp(15px,2.2vw,20px)',
                            color: 'var(--v2-ink-2)',
                            marginTop: 12,
                        }}
                    >
                        {project.subtitle}{' '}
                        <span style={{ color: 'var(--v2-ink-3)' }}>· {project.company}</span>
                    </div>

                    <p
                        data-band-item
                        style={{
                            maxWidth: 680,
                            marginTop: 18,
                            color: 'var(--v2-ink-2)',
                            fontSize: 15,
                            lineHeight: 1.6,
                        }}
                    >
                        {project.summary}
                    </p>

                    <div data-band-item style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
                        {project.stack.map((s) => (
                            <span key={s} className="v2-chip">
                                {s}
                            </span>
                        ))}
                    </div>

                    {/* External links */}
                    {(project.github || project.demo) && (
                        <div data-band-item style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                            {project.github && (
                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="v2-btn v2-btn-ghost"
                                    style={{ fontSize: 12 }}
                                >
                                    ↗ GitHub
                                </a>
                            )}
                            {project.demo && (
                                <a
                                    href={project.demo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="v2-btn v2-btn-primary"
                                    style={{ fontSize: 12 }}
                                >
                                    ↗ Live demo
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="v2-metrics-grid">
                {project.metrics.map((m, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Reveal key={i} delay={i * 100}>
                        <div className="v2-metric-card">
                            <div className="v2-metric-v" style={{ color: project.accent }}>
                                {m.v}
                            </div>
                            <div className="v2-metric-k">{m.k}</div>
                        </div>
                    </Reveal>
                ))}
            </div>

            {/* POC */}
            <div className="v2-container" style={{ paddingTop: 56 }}>
                <SectionHeader
                    kicker="LIVE · POC"
                    title="Try it yourself"
                    subtitle="A working slice of the actual system. Real interactions, real logic."
                />
                <div className="v2-poc-outer">
                    <ProjectPOC pocKey={project.pocKey} />
                </div>
            </div>

            {/* Timeline */}
            <div className="v2-container" style={{ paddingTop: 64, paddingBottom: 80 }}>
                <SectionHeader kicker="CASE STUDY" title="From problem to impact" />
                <div style={{ marginTop: 12 }}>
                    {project.timeline.map((tl, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Reveal key={i} delay={i * 80}>
                            <div className="v2-timeline-row">
                                <div className="v2-timeline-num v2-mono" style={{ color: project.accent }}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div>
                                    <div className="v2-timeline-title">{tl.t}</div>
                                    <p className="v2-timeline-body">{tl.body}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>

                {/* Next project */}
                <Reveal>
                    <div
                        className="v2-next-proj"
                        style={{ background: `linear-gradient(135deg,${next.accent}14,${next.accent2}14)` }}
                        onClick={() => navigate('/work/' + next.id)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate('/work/' + next.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Next project: ${next.title}`}
                        onMouseEnter={(e) => {
                            gsap.to(e.currentTarget, {
                                x: 6,
                                boxShadow: `0 24px 60px -20px ${next.accent}55`,
                                duration: 0.4,
                            });
                        }}
                        onMouseLeave={(e) => {
                            gsap.to(e.currentTarget, { x: 0, boxShadow: 'none', duration: 0.5 });
                        }}
                    >
                        <div>
                            <div
                                className="v2-mono"
                                style={{
                                    fontSize: 11,
                                    color: next.accent,
                                    letterSpacing: '0.18em',
                                    marginBottom: 8,
                                }}
                            >
                                NEXT PROJECT →
                            </div>
                            <div
                                className="v2-display"
                                style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em',
                                    color: 'var(--v2-ink)',
                                }}
                            >
                                {next.title}
                            </div>
                            <div style={{ color: 'var(--v2-ink-2)', fontSize: 14, marginTop: 4 }}>
                                {next.subtitle}
                            </div>
                        </div>
                        <div
                            className="v2-display"
                            style={{ fontSize: 56, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}
                            aria-hidden="true"
                        >
                            {next.glyph}
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

/* ============================================================
   ABOUT PAGE
   ============================================================ */
export function PageAbout(): JSX.Element {
    return (
        <div className="v2-page-enter v2-container" style={{ paddingBottom: 80 }}>
            <SectionHeader kicker="ABOUT" title="A frontend engineer who ships." subtitle={IDENTITY.bio} />

            {/* Experience — editorial grid layout */}
            <div style={{ marginTop: 48 }}>
                <div className="v2-sec-label-line">Experience · {IDENTITY.yearsExp}+ Years</div>
                <h2
                    className="v2-display"
                    style={{
                        fontSize: 'clamp(34px,6vw,60px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                        color: 'var(--v2-ink)',
                    }}
                >
                    Where I&apos;ve worked.
                </h2>
                <div className="v2-exp-grid">
                    {EXPERIENCE.map((e, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Reveal key={i} delay={i * 60}>
                            <div
                                className={`v2-exp-grid-item ${e.current ? 'v2-exp-grid-item-current' : ''}`}
                            >
                                <div className="v2-exp-grid-left">
                                    <div className="v2-exp-grid-date">{e.range}</div>
                                    <div className="v2-exp-grid-loc">{e.location}</div>
                                </div>
                                <div className="v2-exp-grid-right">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div className="v2-exp-grid-role">{e.role}</div>
                                        {e.current && <span className="v2-exp-current-badge">● current</span>}
                                    </div>
                                    <div className="v2-exp-grid-company">{e.company}</div>
                                    <ul className="v2-exp-grid-bullets">
                                        {e.bullets.map((b, j) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <li key={j}>{b}</li>
                                        ))}
                                    </ul>
                                    <div className="v2-exp-grid-tech">
                                        {e.tech.map((t) => (
                                            <span key={t} className="v2-chip">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Skills matrix */}
            <div style={{ marginTop: 64 }}>
                <SectionHeader kicker="STACK" title="The tools I reach for" />
                <div className="v2-skill-grid">
                    {SKILLS.map((g) => (
                        <Reveal key={g.group}>
                            <div className="v2-skill-card">
                                <div
                                    className="v2-mono"
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--v2-ink-3)',
                                        letterSpacing: '0.16em',
                                        marginBottom: 10,
                                    }}
                                >
                                    {g.group.toUpperCase()}
                                </div>
                                {g.items.map(([n, lvl]) => (
                                    <div key={n} className="v2-skill-bar-row">
                                        <span style={{ fontSize: 13, color: 'var(--v2-ink)' }}>{n}</span>
                                        <div style={{ display: 'flex', gap: 3 }}>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: 12,
                                                        height: 4,
                                                        borderRadius: 2,
                                                        background:
                                                            i <= lvl
                                                                ? 'var(--v2-accent)'
                                                                : 'rgba(255,255,255,0.07)',
                                                        boxShadow:
                                                            i <= lvl ? '0 0 6px var(--v2-accent)' : 'none',
                                                        transition: 'background 0.3s, box-shadow 0.3s',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div style={{ marginTop: 56 }}>
                <SectionHeader kicker="EDUCATION" title="Where it started" />
                <Reveal>
                    <div className="v2-edu-card">
                        <div
                            className="v2-display"
                            style={{ fontSize: 22, fontWeight: 600, color: 'var(--v2-ink)' }}
                        >
                            {EDUCATION.school}
                        </div>
                        <div style={{ color: 'var(--v2-ink-2)', fontSize: 14, marginTop: 4 }}>
                            {EDUCATION.degree}
                        </div>
                        <div
                            className="v2-mono"
                            style={{ fontSize: 11, color: 'var(--v2-ink-3)', marginTop: 8 }}
                        >
                            {EDUCATION.range} · CGPA {EDUCATION.cgpa}
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}

/* ============================================================
   CONTACT PAGE — big email + card grid
   ============================================================ */
export function PageContact(): JSX.Element {
    const links = [
        { label: 'Email', value: IDENTITY.email, href: 'mailto:' + IDENTITY.email },
        { label: 'LinkedIn', value: 'linkedin.com/in/adityaraj11', href: IDENTITY.linkedin },
        { label: 'GitHub', value: 'github.com/' + IDENTITY.handle, href: IDENTITY.github },
        { label: 'Phone', value: IDENTITY.phone, href: 'tel:' + IDENTITY.phone.replace(/\s/g, '') },
    ];

    return (
        <div className="v2-page-enter v2-container" style={{ paddingBottom: 80 }}>
            <Reveal>
                <div className="v2-sec-label-line">Contact</div>
                <h1
                    className="v2-display"
                    style={{
                        fontSize: 'clamp(36px,6vw,56px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                        color: 'var(--v2-ink)',
                    }}
                >
                    Let&apos;s build
                    <br />
                    something.
                </h1>
                <p
                    style={{
                        fontSize: 15,
                        color: 'var(--v2-ink-2)',
                        marginTop: 12,
                        maxWidth: 420,
                        lineHeight: 1.55,
                    }}
                >
                    Open to senior frontend roles, contracts, and complex frontend systems. Bengaluru —
                    remote-friendly.
                </p>
            </Reveal>

            <Reveal delay={100}>
                <a href={'mailto:' + IDENTITY.email} className="v2-contact-email-big v2-mono">
                    {IDENTITY.email}
                </a>
            </Reveal>

            <div className="v2-contact-card-grid">
                {links.map((c, i) => (
                    <Reveal key={c.label} delay={150 + i * 40}>
                        <a
                            href={c.href}
                            target={
                                c.href.startsWith('mailto') || c.href.startsWith('tel') ? undefined : '_blank'
                            }
                            rel="noopener noreferrer"
                            className="v2-contact-info-card"
                        >
                            <div className="v2-contact-info-label">{c.label}</div>
                            <div className="v2-contact-info-value">{c.value}</div>
                        </a>
                    </Reveal>
                ))}
            </div>

            <Reveal delay={350}>
                <div className="v2-contact-footer-line">
                    <div
                        className="v2-mono"
                        style={{ fontSize: 10, color: 'var(--v2-ink-4)', letterSpacing: '0.18em' }}
                    >
                        © 2026 ADITYA RAJ · BUILT WITH INTENT
                    </div>
                </div>
            </Reveal>
        </div>
    );
}
