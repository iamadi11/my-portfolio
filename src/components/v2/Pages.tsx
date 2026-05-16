'use client';

import { useEffect, useRef } from 'react';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

import { navigate } from './Chrome';
import {
    MorphingCanvas,
    MagBtn,
    KineticTitle,
    KineticLine,
    Marquee,
    Counter,
    Reveal,
    SectionHeader,
    TechOrbit,
} from './Cinema';
import { IDENTITY, PROJECTS, EXPERIENCE, SKILLS, EDUCATION } from './data';
import { ProjectPOC } from './POCs';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   Helper components
   ============================================================ */
function FeatureCard({
    project,
    index: _index,
}: {
    project: (typeof PROJECTS)[0];
    index: number;
}): JSX.Element {
    const cardRef = useRef<HTMLDivElement>(null);

    const onEnter = () => {
        const el = cardRef.current;
        if (!el) return;
        gsap.to(el, { y: -8, duration: 0.4, ease: 'power2.out' });
        gsap.to(el, {
            boxShadow: `0 40px 80px -20px ${project.accent}66`,
            duration: 0.4,
            ease: 'power2.out',
        });
    };
    const onLeave = () => {
        const el = cardRef.current;
        if (!el) return;
        gsap.to(el, {
            y: 0,
            boxShadow: '0 4px 20px -8px rgba(0,0,0,0.6)',
            duration: 0.5,
            ease: 'power3.out',
        });
    };

    return (
        <div
            ref={cardRef}
            className="v2-feat-card"
            onClick={() => navigate('/work/' + project.id)}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/work/' + project.id)}
            aria-label={`View ${project.title}`}
        >
            {/* Thumbnail */}
            <div className="v2-feat-thumb">
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg,${project.accent}2a,${project.accent2}18)`,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(ellipse at 28% 32%,${project.accent}66,transparent 55%),radial-gradient(ellipse at 74% 72%,${project.accent2}55,transparent 55%)`,
                    }}
                />
                <div className="v2-feat-glyph" style={{ textShadow: `0 8px 40px ${project.accent}88` }}>
                    {project.glyph}
                </div>
                <div className="v2-feat-meta">
                    <span className="v2-mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                        {project.year}
                    </span>
                    <span
                        className="v2-mono"
                        style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: project.accent + '22',
                            color: project.accent,
                            border: `1px solid ${project.accent}44`,
                        }}
                    >
                        {project.runtime}
                    </span>
                </div>
                {/* Accent line */}
                <div
                    className="v2-feat-accent-bar"
                    style={{ background: `linear-gradient(90deg,${project.accent},${project.accent2})` }}
                />
            </div>

            {/* Body */}
            <div className="v2-feat-body">
                <div className="v2-feat-company v2-mono">{project.company}</div>
                <div className="v2-feat-title v2-display">{project.title}</div>
                <div className="v2-feat-subtitle">{project.subtitle}</div>
                <div className="v2-feat-chips">
                    {project.stack.slice(0, 4).map((s) => (
                        <span key={s} className="v2-chip">
                            {s}
                        </span>
                    ))}
                </div>
                <div className="v2-feat-cta v2-mono" style={{ color: project.accent }} aria-hidden="true">
                    Case study + live POC →
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   HOME PAGE  — cinematic scroll chapters
   ============================================================ */
export function PageHome(): JSX.Element {
    const heroRef = useRef<HTMLDivElement>(null);
    const heroContentRef = useRef<HTMLDivElement>(null);
    const scrollCueRef = useRef<HTMLDivElement>(null);

    const isReturning = typeof window !== 'undefined' && !!sessionStorage.getItem('v2_visited');

    useEffect(() => {
        if (typeof window !== 'undefined') sessionStorage.setItem('v2_visited', '1');

        const hero = heroRef.current;
        const content = heroContentRef.current;
        if (!hero || !content) return () => {};

        const ctx = gsap.context(() => {
            // Scroll cue fade in
            gsap.fromTo(
                scrollCueRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.8, delay: isReturning ? 0.4 : 2.2 }
            );

            // Hero content fades out and rises as user scrolls
            gsap.to(content, {
                opacity: 0,
                y: -60,
                ease: 'none',
                scrollTrigger: {
                    trigger: hero,
                    start: 'top top',
                    end: '50% top',
                    scrub: 1.5,
                },
            });
        });

        return () => ctx.revert();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const enterDelay = isReturning ? 0.05 : 0.6;

    return (
        <div className="v2-page-enter">
            {/* ── Chapter 1: Hero ── */}
            <div ref={heroRef} className="v2-hero">
                <div className="v2-hero-canvas-wrap" aria-hidden="true">
                    <MorphingCanvas speed="slow" accentRGB={[122, 162, 255]} />
                </div>
                <div className="v2-hero-vignette" aria-hidden="true" />

                <div ref={heroContentRef} className="v2-hero-content">
                    {/* Status pill */}
                    <KineticLine delay={enterDelay} className="v2-mono">
                        <span className="v2-hero-status v2-mono">
                            <span className="v2-hero-status-dot" />
                            AVAILABLE &nbsp;·&nbsp; PORTFOLIO 2026 &nbsp;·&nbsp; v2.0
                        </span>
                    </KineticLine>

                    {/* Name */}
                    <h1 className="v2-hero-name v2-display" aria-label={IDENTITY.name}>
                        <KineticTitle
                            text={IDENTITY.name + '.'}
                            delay={enterDelay + 0.1}
                            stagger={0.04}
                            duration={0.9}
                        />
                    </h1>

                    {/* Title */}
                    <KineticLine delay={enterDelay + 0.5}>
                        <p className="v2-hero-role v2-display">
                            {IDENTITY.title}
                            <span className="v2-hero-company"> · {IDENTITY.company}</span>
                        </p>
                    </KineticLine>

                    {/* Bio */}
                    <KineticLine delay={enterDelay + 0.7}>
                        <p className="v2-hero-bio">{IDENTITY.bio}</p>
                    </KineticLine>

                    {/* CTAs */}
                    <KineticLine delay={enterDelay + 0.9}>
                        <div className="v2-hero-actions">
                            <MagBtn className="v2-btn v2-btn-primary" onClick={() => navigate('/work')}>
                                View Work ↓
                            </MagBtn>
                            <MagBtn className="v2-btn" onClick={() => navigate('/about')}>
                                About
                            </MagBtn>
                            <MagBtn className="v2-btn v2-btn-ghost" onClick={() => navigate('/contact')}>
                                Contact
                            </MagBtn>
                        </div>
                    </KineticLine>

                    {/* Stats */}
                    <div className="v2-hero-stats">
                        {[
                            { to: IDENTITY.yearsExp, suf: '+ yrs', k: 'shipping' },
                            { to: PROJECTS.length, suf: '', k: 'case studies' },
                            { to: 80, suf: '%', k: 'faster builds' },
                            { to: 99.97, suf: '%', k: 'risk uptime', dec: 2 },
                        ].map((m, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <Reveal key={i} delay={(enterDelay + 1.1 + i * 0.08) * 1000}>
                                <div className="v2-hero-stat">
                                    <span className="v2-hero-stat-n v2-display">
                                        <Counter to={m.to} suffix={m.suf} decimals={m.dec || 0} />
                                    </span>
                                    <span className="v2-hero-stat-k v2-mono">{m.k}</span>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>

                {/* Scroll cue */}
                <div ref={scrollCueRef} className="v2-hero-scroll" aria-hidden="true" style={{ opacity: 0 }}>
                    <div className="v2-scroll-line" />
                    <span className="v2-mono">SCROLL</span>
                </div>
            </div>

            {/* ── Chapter 2: Marquee ── */}
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

            {/* ── Chapter 3: Featured work ── */}
            <div className="v2-container v2-chapter">
                <Reveal>
                    <SectionHeader
                        kicker="01 / SELECTED WORK"
                        title="Projects that shipped."
                        subtitle="Production systems powering fintech, e-commerce, and OSS — each with a working POC."
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

                <div className="v2-feat-grid">
                    {PROJECTS.slice(0, 3).map((p, i) => (
                        <Reveal key={p.id} delay={i * 100}>
                            <FeatureCard project={p} index={i} />
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* ── Chapter 4: Tech ecosystem ── */}
            <div className="v2-tech-chapter">
                <div className="v2-container v2-tech-chapter-inner">
                    <div className="v2-tech-chapter-text">
                        <Reveal>
                            <SectionHeader
                                kicker="02 / STACK"
                                title="The ecosystem."
                                subtitle="Deep specialization in React and its orbit — from UI to build tooling, realtime infrastructure, and performance engineering."
                            />
                        </Reveal>
                        <Reveal delay={120}>
                            <div className="v2-tech-pills">
                                {[
                                    { label: 'Frontend', color: '#7aa2ff' },
                                    { label: 'Performance', color: '#6ee7a7' },
                                    { label: 'Realtime', color: '#7ee5ff' },
                                    { label: 'Build Tooling', color: '#ffb070' },
                                    { label: 'OSS', color: '#b690ff' },
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

            {/* ── Chapter 5: CTA ── */}
            <div className="v2-container v2-chapter">
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
                                WHAT&apos;S NEXT
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
                            <div className={`v2-exp-grid-item${e.current ? 'v2-exp-grid-item-current' : ''}`}>
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
