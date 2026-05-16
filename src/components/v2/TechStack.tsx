'use client';

import { useReveal, useRevealScale } from './useReveal';

const GROUPS = [
    {
        label: 'Frontend',
        items: [
            'React',
            'Next.js',
            'TypeScript',
            'JavaScript',
            'Tailwind CSS',
            'Redux',
            'React Query',
            'Zustand',
            'HTML5',
            'CSS3',
            'PWA',
        ],
    },
    {
        label: 'Backend & Data',
        items: ['Node.js', 'Express.js', 'REST APIs', 'MySQL', 'MongoDB', 'Redis', 'SSIS'],
    },
    {
        label: 'Tooling & Infrastructure',
        items: [
            'Git',
            'CI/CD',
            'Webpack',
            'Turborepo',
            'Jest',
            'React Testing Library',
            'Vitest',
            'AWS',
            'Vercel',
        ],
    },
];

export default function TechStack(): JSX.Element {
    const headerRef = useReveal('.v2-tech-header-reveal', { threshold: 0.15 });
    const pillsRef = useRevealScale('.v2-tech-pill', 28);

    return (
        <section
            id="tech"
            className="v2-section"
            aria-label="Tech stack"
            style={{ background: 'rgba(255,255,255,0.015)' }}
        >
            {/* Header */}
            <div className="v2-container" ref={headerRef as React.RefObject<HTMLDivElement>}>
                <div className="v2-tech-header-reveal" style={{ marginBottom: '52px' }}>
                    <div className="v2-rule" />
                    <p className="v2-label">Tech Stack</p>
                    <h2 className="v2-h2" style={{ marginTop: '12px' }}>
                        Tools of the trade
                    </h2>
                    <p className="v2-body" style={{ marginTop: '14px', maxWidth: '440px' }}>
                        Resume-backed — every item below is something I&rsquo;ve shipped with, not just
                        listed.
                    </p>
                </div>

                <div className="v2-tech-cats" ref={pillsRef as React.RefObject<HTMLDivElement>}>
                    {GROUPS.map(({ label, items }) => (
                        <div key={label} className="v2-tech-group">
                            <h3 className="v2-tech-group-title">{label}</h3>
                            <div className="v2-tech-pills" role="list" aria-label={`${label} technologies`}>
                                {items.map((item) => (
                                    <span key={item} className="v2-tech-pill" role="listitem">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
