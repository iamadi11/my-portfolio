'use client';

import { useReveal } from './useReveal';

const STATS = [
    { n: '4.5+', l: 'Years experience' },
    { n: '3', l: 'Companies' },
    { n: '30+', l: 'Technologies' },
    { n: 'B.Tech', l: 'IIIT Lucknow' },
];

export default function About(): JSX.Element {
    const ref = useReveal('.v2-about-animate', { threshold: 0.12, stagger: 90 });

    return (
        <section
            id="about"
            ref={ref as React.RefObject<HTMLElement>}
            className="v2-section"
            aria-label="About Aditya Raj"
        >
            <div className="v2-container">
                {/* Header */}
                <div className="v2-about-animate" style={{ marginBottom: '48px' }}>
                    <div className="v2-rule" />
                    <p className="v2-label">About</p>
                </div>

                <div className="v2-about-grid">
                    {/* Left: narrative */}
                    <div>
                        <p className="v2-about-lead v2-about-animate">
                            Frontend Engineer focused on performance, accessibility, and shipping at scale.
                        </p>

                        <p className="v2-body v2-about-animate" style={{ marginBottom: '20px' }}>
                            I&rsquo;ve spent the last 4.5+ years building production web apps across fintech
                            (Cashfree Payments), enterprise (Moresand Technologies), and e-commerce &amp;
                            healthcare (Tata 1mg). My stack is React and Next.js, with TypeScript throughout
                            and a deep bias toward measurable outcomes over clever abstractions.
                        </p>
                        <p className="v2-body v2-about-animate">
                            Outside of work I build developer tools and UI experiments—spatial, mcp-ui-poc,
                            and mouse-follow are recent examples. I studied Information Technology at IIIT
                            Lucknow (CGPA 8.14/10) and currently live in Bengaluru.
                        </p>
                    </div>

                    {/* Right: stats */}
                    <div className="v2-about-animate">
                        <div className="v2-stats" role="list" aria-label="Career highlights">
                            {STATS.map(({ n, l }) => (
                                <div key={l} className="v2-stat" role="listitem">
                                    <span className="v2-stat-n">{n}</span>
                                    <span className="v2-stat-l">{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
