'use client';

import { useState } from 'react';

import { navigate } from './Chrome';
import { CinematicHero, Marquee, Counter, Reveal, SectionHeader } from './Cinema';
import { IDENTITY, PROJECTS, EXPERIENCE, SKILLS, EDUCATION } from './data';
import { ProjectPOC } from './POCs';

/* ============================================================
   HOME PAGE
   ============================================================ */
export function PageHome() {
    return (
        <div className="v2-page-enter">
            {/* Hero */}
            <div className="v2-hero">
                <div className="v2-hero-canvas-wrap">
                    <CinematicHero />
                </div>
                <div className="v2-hero-vignette" />
                <div className="v2-hero-content">
                    <div
                        className="v2-mono"
                        style={{
                            fontSize: 11,
                            letterSpacing: '0.2em',
                            color: 'var(--v2-ink-3)',
                            marginBottom: 18,
                        }}
                    >
                        <span style={{ color: 'var(--v2-good)' }}>● AVAILABLE</span> &nbsp;·&nbsp; PORTFOLIO
                        2026 &nbsp;·&nbsp; v2.0
                    </div>
                    <h1
                        className="v2-display"
                        style={{
                            fontSize: 'clamp(40px,9vw,96px)',
                            fontWeight: 700,
                            lineHeight: 0.95,
                            letterSpacing: '-0.04em',
                            margin: 0,
                            color: '#fff',
                        }}
                    >
                        {IDENTITY.name}.
                    </h1>
                    <h2
                        className="v2-display"
                        style={{
                            fontSize: 'clamp(22px,4vw,40px)',
                            fontWeight: 500,
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            margin: '8px 0 0',
                            color: 'var(--v2-ink-2)',
                        }}
                    >
                        {IDENTITY.title}{' '}
                        <span style={{ color: 'var(--v2-ink-3)' }}>· {IDENTITY.company}</span>
                    </h2>
                    <p
                        style={{
                            fontSize: 'clamp(15px,2vw,18px)',
                            color: 'var(--v2-ink-2)',
                            marginTop: 22,
                            maxWidth: 600,
                            lineHeight: 1.55,
                        }}
                    >
                        {IDENTITY.bio}
                    </p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                        <button className="v2-btn v2-btn-primary" onClick={() => navigate('/work')}>
                            ▶ Explore work
                        </button>
                        <button className="v2-btn" onClick={() => navigate('/about')}>
                            About
                        </button>
                        <button className="v2-btn v2-btn-ghost" onClick={() => navigate('/contact')}>
                            Contact
                        </button>
                    </div>

                    <div className="v2-hero-stats">
                        {[
                            { to: IDENTITY.yearsExp, suf: '+ yrs', k: 'shipping' },
                            { to: PROJECTS.length, suf: '', k: 'case studies' },
                            { to: 80, suf: '%', k: 'faster builds' },
                            { to: 99.97, suf: '%', k: 'risk uptime', dec: 2 },
                        ].map((m, i) => (
                            <div key={i} className="v2-hero-stat">
                                <span className="v2-hero-stat-n v2-display">
                                    <Counter to={m.to} suffix={m.suf} decimals={m.dec || 0} />
                                </span>
                                <span className="v2-hero-stat-k v2-mono">{m.k}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="v2-hero-scroll">
                    SCROLL
                    <span>↓</span>
                </div>
            </div>

            {/* Marquee */}
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

            {/* Featured projects */}
            <div className="v2-container" style={{ paddingTop: 64, paddingBottom: 48 }}>
                <Reveal>
                    <SectionHeader
                        kicker="01 / FEATURED"
                        title="Selected work"
                        subtitle="Production systems and open source. Each ships with an interactive POC."
                        right={
                            <button
                                className="v2-btn v2-btn-ghost"
                                onClick={() => navigate('/work')}
                                style={{ fontSize: 12 }}
                            >
                                view all →
                            </button>
                        }
                    />
                </Reveal>
                <div className="v2-feat-grid">
                    {PROJECTS.slice(0, 3).map((p, i) => (
                        <Reveal key={p.id} delay={i * 80}>
                            <FeatureCard project={p} />
                        </Reveal>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="v2-container" style={{ paddingTop: 24, paddingBottom: 80 }}>
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
                                NEXT
                            </div>
                            <h3
                                className="v2-display"
                                style={{
                                    fontSize: 'clamp(28px,4vw,40px)',
                                    fontWeight: 700,
                                    margin: 0,
                                    letterSpacing: '-0.025em',
                                    color: 'var(--v2-ink)',
                                }}
                            >
                                Let&apos;s build something.
                            </h3>
                            <p style={{ color: 'var(--v2-ink-2)', marginTop: 8, fontSize: 14 }}>
                                Open to senior frontend roles, contracts, complex frontend systems.
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

function FeatureCard({ project }: { project: (typeof PROJECTS)[0] }) {
    return (
        <div
            className="v2-feat-card"
            onClick={() => navigate('/work/' + project.id)}
            style={{ boxShadow: `0 4px 20px -8px rgba(0,0,0,0.6)` }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 30px 70px -20px ${project.accent}55`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px -8px rgba(0,0,0,0.6)`;
            }}
        >
            <div style={{ aspectRatio: '16/10', position: 'relative', overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg,${project.accent}33,${project.accent2}22)`,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(circle at 30% 30%,${project.accent}66,transparent 50%),radial-gradient(circle at 75% 70%,${project.accent2}55,transparent 50%)`,
                    }}
                />
                <div
                    className="v2-display"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%,-50%)',
                        fontSize: 'clamp(48px,8vw,96px)',
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        color: 'rgba(255,255,255,0.92)',
                        textShadow: `0 8px 30px ${project.accent}88`,
                    }}
                >
                    {project.glyph}
                </div>
                <div
                    className="v2-mono"
                    style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.7)',
                    }}
                >
                    {project.year} · {project.runtime}
                </div>
            </div>
            <div style={{ padding: 16 }}>
                <div
                    className="v2-display"
                    style={{
                        fontSize: 20,
                        fontWeight: 600,
                        letterSpacing: '-0.015em',
                        color: 'var(--v2-ink)',
                    }}
                >
                    {project.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--v2-ink-2)', marginTop: 4 }}>{project.subtitle}</div>
                <div className="v2-mono" style={{ fontSize: 11, color: 'var(--v2-ink-3)', marginTop: 10 }}>
                    {project.company} →
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   WORK PAGE
   ============================================================ */
export function PageWork() {
    const [filter, setFilter] = useState<'all' | 'work' | 'oss'>('all');
    const filtered =
        filter === 'all'
            ? PROJECTS
            : filter === 'oss'
              ? PROJECTS.filter((p) => p.company.startsWith('OSS'))
              : PROJECTS.filter((p) => !p.company.startsWith('OSS'));

    return (
        <div className="v2-page-enter v2-container" style={{ paddingBottom: 80 }}>
            <SectionHeader
                kicker="WORK · CASE STUDIES"
                title="Selected projects"
                subtitle="Each project ships with a working POC — interact with the actual system below the case study."
                right={
                    <div style={{ display: 'flex', gap: 6 }}>
                        {(
                            [
                                ['all', 'All'],
                                ['work', 'Work'],
                                ['oss', 'OSS'],
                            ] as [string, string][]
                        ).map(([k, l]) => (
                            <button
                                key={k}
                                className="v2-btn v2-btn-ghost"
                                onClick={() => setFilter(k as typeof filter)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    borderColor: filter === k ? 'var(--v2-accent)' : 'var(--v2-line)',
                                    background: filter === k ? 'rgba(122,162,255,0.1)' : 'transparent',
                                    color: filter === k ? 'var(--v2-accent)' : 'var(--v2-ink-2)',
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                }
            />
            <div className="v2-work-grid">
                {filtered.map((p, i) => (
                    <Reveal key={p.id} delay={i * 60}>
                        <ProjectCard project={p} />
                    </Reveal>
                ))}
            </div>
        </div>
    );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[0] }) {
    return (
        <div
            className="v2-proj-card"
            onClick={() => navigate('/work/' + project.id)}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 30px 60px -20px ${project.accent}55`;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            <div
                className="v2-proj-thumb"
                style={{ background: `linear-gradient(135deg,${project.accent}22,${project.accent2}22)` }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(circle at 30% 30%,${project.accent}55,transparent 60%),radial-gradient(circle at 75% 70%,${project.accent2}44,transparent 60%)`,
                    }}
                />
                <div className="v2-proj-glyph" style={{ textShadow: `0 8px 30px ${project.accent}88` }}>
                    {project.glyph}
                </div>
                <div className="v2-proj-year-tag">
                    {project.year} · {project.runtime}
                </div>
            </div>
            <div className="v2-proj-body">
                <div className="v2-proj-title">{project.title}</div>
                <div className="v2-proj-subtitle">{project.subtitle}</div>
                <div className="v2-proj-chips">
                    {project.stack.slice(0, 4).map((s) => (
                        <span key={s} className="v2-chip">
                            {s}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   PROJECT DETAIL PAGE
   ============================================================ */
export function PageProject({ id }: { id?: string }) {
    const project = PROJECTS.find((p) => p.id === id);

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
                className="v2-project-band"
                style={{ background: `linear-gradient(135deg,${project.accent}22,${project.accent2}18)` }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `radial-gradient(circle at 20% 30%,${project.accent}33,transparent 50%),radial-gradient(circle at 80% 70%,${project.accent2}33,transparent 50%)`,
                    }}
                />
                <div className="v2-project-band-content">
                    <button
                        className="v2-btn v2-btn-ghost"
                        onClick={() => navigate('/work')}
                        style={{ marginBottom: 22, fontSize: 12 }}
                    >
                        ← work
                    </button>
                    <div
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
                    <h1 className="v2-project-h1">{project.title}</h1>
                    <div
                        style={{
                            fontSize: 'clamp(16px,2.4vw,22px)',
                            color: 'var(--v2-ink-2)',
                            marginTop: 12,
                        }}
                    >
                        {project.subtitle}{' '}
                        <span style={{ color: 'var(--v2-ink-3)' }}>· {project.company}</span>
                    </div>
                    <p
                        style={{
                            maxWidth: 680,
                            marginTop: 18,
                            color: 'var(--v2-ink-2)',
                            fontSize: 15,
                            lineHeight: 1.55,
                        }}
                    >
                        {project.summary}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
                        {project.stack.map((s) => (
                            <span key={s} className="v2-chip">
                                {s}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="v2-metrics-grid">
                {project.metrics.map((m, i) => (
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
                        style={{ background: `linear-gradient(135deg,${next.accent}18,${next.accent2}18)` }}
                        onClick={() => navigate('/work/' + next.id)}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow =
                                `0 20px 60px -20px ${next.accent}55`;
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
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
export function PageAbout() {
    return (
        <div className="v2-page-enter v2-container" style={{ paddingBottom: 80 }}>
            <SectionHeader kicker="ABOUT" title="A frontend engineer who ships." subtitle={IDENTITY.bio} />

            {/* Experience timeline */}
            <div style={{ marginTop: 48 }}>
                <div
                    className="v2-mono"
                    style={{
                        fontSize: 11,
                        color: 'var(--v2-ink-3)',
                        letterSpacing: '0.18em',
                        marginBottom: 18,
                    }}
                >
                    EXPERIENCE · {IDENTITY.yearsExp}+ YEARS
                </div>
                <div className="v2-exp-timeline">
                    <div className="v2-exp-spine" />
                    {EXPERIENCE.map((e, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div style={{ position: 'relative', paddingBottom: 32 }}>
                                <div
                                    className="v2-exp-dot"
                                    style={{ background: e.color, boxShadow: `0 0 16px ${e.color}88` }}
                                >
                                    {e.current && (
                                        <div className="v2-exp-dot-ring" style={{ borderColor: e.color }} />
                                    )}
                                </div>
                                <div
                                    className="v2-mono"
                                    style={{ fontSize: 11, color: e.color, letterSpacing: '0.1em' }}
                                >
                                    {e.range} · {e.location}
                                </div>
                                <div
                                    className="v2-display"
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 600,
                                        letterSpacing: '-0.015em',
                                        marginTop: 4,
                                        color: 'var(--v2-ink)',
                                    }}
                                >
                                    {e.role}
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--v2-ink-2)' }}>{e.company}</div>
                                <ul
                                    style={{
                                        marginTop: 12,
                                        paddingLeft: 18,
                                        color: 'var(--v2-ink-2)',
                                        fontSize: 14,
                                        lineHeight: 1.65,
                                    }}
                                >
                                    {e.bullets.map((b, j) => (
                                        <li key={j} style={{ marginBottom: 4 }}>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                                    {e.tech.map((t) => (
                                        <span key={t} className="v2-chip">
                                            {t}
                                        </span>
                                    ))}
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
                        <div key={g.group} className="v2-skill-card">
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
                                <div
                                    key={n}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 80px',
                                        gap: 10,
                                        alignItems: 'center',
                                        padding: '4px 0',
                                    }}
                                >
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
                                                            : 'rgba(255,255,255,0.08)',
                                                    boxShadow: i <= lvl ? '0 0 6px var(--v2-accent)' : 'none',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div style={{ marginTop: 56 }}>
                <SectionHeader kicker="EDUCATION" title="Where it started" />
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
                    <div className="v2-mono" style={{ fontSize: 11, color: 'var(--v2-ink-3)', marginTop: 8 }}>
                        {EDUCATION.range} · CGPA {EDUCATION.cgpa}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   CONTACT PAGE
   ============================================================ */
export function PageContact() {
    const [form, setForm] = useState({ name: '', email: '', msg: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.msg) return;
        setStatus('sending');
        setTimeout(() => setStatus('sent'), 1200);
    };

    if (status === 'sent') {
        return (
            <div
                className="v2-page-enter v2-container"
                style={{ paddingTop: 40, paddingBottom: 100, maxWidth: 600 }}
            >
                <div
                    className="v2-display"
                    style={{ fontSize: 64, marginBottom: 16, color: 'var(--v2-ink)' }}
                >
                    ✓
                </div>
                <h2
                    className="v2-display"
                    style={{
                        fontSize: 36,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: 'var(--v2-ink)',
                    }}
                >
                    Message sent.
                </h2>
                <p style={{ color: 'var(--v2-ink-2)', fontSize: 15, marginTop: 12, lineHeight: 1.6 }}>
                    Got it — I&apos;ll get back to you within 48 hours via {form.email}.
                </p>
                <button
                    className="v2-btn"
                    onClick={() => {
                        setStatus('idle');
                        setForm({ name: '', email: '', msg: '' });
                    }}
                    style={{ marginTop: 24 }}
                >
                    ← back
                </button>
            </div>
        );
    }

    return (
        <div className="v2-page-enter v2-container" style={{ paddingBottom: 80 }}>
            <SectionHeader
                kicker="CONTACT"
                title="Let's talk."
                subtitle="Senior frontend roles, contracts, or interesting frontend systems."
            />

            <div style={{ marginTop: 32 }}>
                <div className="v2-contact-links-grid">
                    {[
                        { label: 'Email', value: IDENTITY.email, href: 'mailto:' + IDENTITY.email },
                        { label: 'LinkedIn', value: 'linkedin.com/in/adityaraj11', href: IDENTITY.linkedin },
                        { label: 'GitHub', value: 'github.com/' + IDENTITY.handle, href: IDENTITY.github },
                        {
                            label: 'Phone',
                            value: IDENTITY.phone,
                            href: 'tel:' + IDENTITY.phone.replace(/\s/g, ''),
                        },
                    ].map((c) => (
                        <a
                            key={c.label}
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="v2-contact-link-card"
                        >
                            <div
                                className="v2-mono"
                                style={{ fontSize: 10, color: 'var(--v2-ink-3)', letterSpacing: '0.14em' }}
                            >
                                {c.label.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 14, marginTop: 4 }}>{c.value}</div>
                        </a>
                    ))}
                </div>

                <form onSubmit={submit} className="v2-form-wrap">
                    <div
                        className="v2-mono"
                        style={{
                            fontSize: 11,
                            color: 'var(--v2-accent)',
                            letterSpacing: '0.16em',
                            marginBottom: 16,
                        }}
                    >
                        SEND A MESSAGE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Field label="Your name">
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="v2-field-input"
                                placeholder="Jane Doe"
                            />
                        </Field>
                        <Field label="Email">
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                className="v2-field-input"
                                placeholder="jane@company.com"
                            />
                        </Field>
                        <Field label="Message">
                            <textarea
                                value={form.msg}
                                onChange={(e) => setForm({ ...form, msg: e.target.value })}
                                required
                                rows={5}
                                className="v2-field-input"
                                style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                                placeholder="What are you building?"
                            />
                        </Field>
                        <button
                            type="submit"
                            className="v2-btn v2-btn-primary"
                            disabled={status === 'sending'}
                            style={{ marginTop: 8, fontSize: 13 }}
                        >
                            {status === 'sending' ? '⟳ sending…' : 'Send message →'}
                        </button>
                        <div
                            className="v2-mono"
                            style={{
                                fontSize: 10,
                                color: 'var(--v2-ink-3)',
                                textAlign: 'center',
                                marginTop: 4,
                            }}
                        >
                            response within 48h
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
                className="v2-mono"
                style={{ fontSize: 10, color: 'var(--v2-ink-3)', letterSpacing: '0.14em' }}
            >
                {label.toUpperCase()}
            </span>
            {children}
        </label>
    );
}
