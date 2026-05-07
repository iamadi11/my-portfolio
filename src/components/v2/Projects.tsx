'use client';

import { useReveal } from './useReveal';

const PROJECTS = [
    {
        num: '01',
        title: 'spatial',
        desc: 'Client-side UI performance optimizer. Detects layout thrash, long tasks, and render bottlenecks at dev time — zero runtime overhead in production. TypeScript strict, Vitest tested.',
        tags: ['TypeScript', 'Vitest', 'Performance', 'DevTools'],
        github: 'https://github.com/iamadi11/spatial',
        demo: 'https://spatial-zeta.vercel.app/',
    },
    {
        num: '02',
        title: 'mcp-ui-poc',
        desc: "Dynamic MCP UI generator. Reads an MCP server's tool schema at runtime and renders a fully functional UI — no hardcoded forms. Full-stack: React + Vite (client) + Node/Express (server).",
        tags: ['React', 'Vite', 'Node.js', 'Express', 'MCP'],
        github: 'https://github.com/iamadi11/mcp-ui-poc',
        demo: 'https://mcp-ui-poc.vercel.app/',
    },
    {
        num: '03',
        title: 'mouse-follow',
        desc: 'Smooth, springy cursor-follow component for React. Configurable spring physics, hover states, and ripple effects. Zero dependencies beyond React.',
        tags: ['React', 'CSS', 'Animation', 'Component'],
        github: 'https://github.com/iamadi11/mouse-follow',
        demo: 'https://mouse-follow-demo.vercel.app/',
    },
];

const ExternalIcon = () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path
            d="M2 9L9 2M9 2H4M9 2V7"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const GithubIcon = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 0C2.91 0 0 2.98 0 6.66c0 2.94 1.87 5.44 4.47 6.32.33.06.45-.14.45-.32v-1.12c-1.82.4-2.2-.89-2.2-.89-.3-.77-.73-1-.73-1-.6-.41.04-.4.04-.4.66.05 1.01.69 1.01.69.58 1.03 1.53.73 1.9.56.06-.43.23-.73.41-.89-1.45-.17-2.98-.74-2.98-3.3 0-.73.25-1.32.67-1.79-.07-.16-.29-.85.06-1.77 0 0 .55-.18 1.8.68A6.15 6.15 0 016.5 3.3c.56 0 1.12.08 1.65.23 1.25-.86 1.8-.68 1.8-.68.35.92.13 1.61.06 1.77.42.47.67 1.06.67 1.79 0 2.57-1.53 3.13-2.99 3.3.24.21.45.62.45 1.25v1.85c0 .18.12.39.46.32A6.67 6.67 0 0013 6.66C13 2.98 10.09 0 6.5 0z"
            fill="currentColor"
        />
    </svg>
);

export default function Projects() {
    const ref = useReveal('.v2-proj-reveal', { threshold: 0.08, stagger: 100 });

    return (
        <section
            id="projects"
            ref={ref as React.RefObject<HTMLElement>}
            className="v2-section"
            aria-label="Projects"
        >
            <div className="v2-container">
                {/* Header */}
                <div className="v2-proj-reveal" style={{ marginBottom: '52px' }}>
                    <div className="v2-rule" />
                    <p className="v2-label">Projects</p>
                    <h2 className="v2-h2" style={{ marginTop: '12px' }}>
                        Things I&rsquo;ve shipped
                    </h2>
                    <p className="v2-body" style={{ marginTop: '14px', maxWidth: '480px' }}>
                        Open-source tools and experiments — each with a real GitHub URL and a reason to exist.
                    </p>
                </div>

                {/* Cards */}
                <div className="v2-proj-grid">
                    {PROJECTS.map(({ num, title, desc, tags, github, demo }) => (
                        <article key={title} className="v2-proj-card v2-proj-reveal">
                            <div className="v2-proj-num">{num}</div>
                            <h3 className="v2-proj-title">{title}</h3>
                            <p className="v2-proj-desc">{desc}</p>
                            <div className="v2-proj-tags" aria-label="Technologies used">
                                {tags.map((t) => (
                                    <span key={t} className="v2-proj-tag">
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div className="v2-proj-links">
                                <a
                                    href={github}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="v2-proj-link"
                                    aria-label={`View ${title} source on GitHub`}
                                >
                                    <GithubIcon /> GitHub
                                </a>
                                <a
                                    href={demo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="v2-proj-link"
                                    aria-label={`View ${title} live demo`}
                                >
                                    <ExternalIcon /> Live demo
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
