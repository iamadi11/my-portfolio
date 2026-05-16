'use client';

import { useReveal } from './useReveal';

const ROLES = [
    {
        role: 'Frontend Engineer II',
        company: 'Cashfree Payments',
        period: 'Mar 2025 – Present',
        location: 'Bengaluru',
        bullets: [
            'Own & maintain Risk WebApp platform serving enterprise merchants processing millions of transactions/month.',
            'Architected configurable rule engine for real-time transaction blocking & flagging based on amount, velocity, and risk signals.',
            'Enhanced Video KYC platform reliability with robust reconnection flows — 30% fewer failed sessions.',
        ],
    },
    {
        role: 'Software Engineer',
        company: 'Moresand Technologies',
        period: 'Aug 2024 – Mar 2025',
        location: 'Bengaluru',
        bullets: [
            'Led migration of legacy back-office to React-based architecture with improved test coverage, enabling 3× faster feature development.',
            'Implemented PWA architecture with offline capabilities, improving page load time by 50%.',
        ],
    },
    {
        role: 'Software Development Engineer I → II',
        company: 'Tata 1mg',
        period: 'Dec 2021 – Jul 2024',
        location: 'Gurugram',
        bullets: [
            'Engineered polygon-based serviceability engine using React and Google Maps API, enabling 15-min and 1-hour delivery zones.',
            'Architected centralized Node.js microservice for invoice PDF generation, reducing code duplication by 60%.',
            'Implemented PWA for inventory management, reducing manual errors by 45%.',
            'Implemented real-time notifications via WebPush, Redis, and SSE — SLA breaches from 70% to 15%.',
            'Optimized frontend build pipeline — build time from 15 min to 3 min (80% reduction).',
            'Consolidated repositories into monorepo architecture with Turborepo, reducing deployment time by 30%.',
        ],
    },
];

export default function Experience(): JSX.Element {
    const ref = useReveal('.v2-exp-reveal', { threshold: 0.08, stagger: 120 });

    return (
        <section
            id="experience"
            ref={ref as React.RefObject<HTMLElement>}
            className="v2-section"
            aria-label="Work experience"
            style={{ background: 'rgba(255,255,255,0.015)' }}
        >
            <div className="v2-container">
                {/* Header */}
                <div className="v2-exp-reveal" style={{ marginBottom: '56px' }}>
                    <div className="v2-rule" />
                    <p className="v2-label">Experience</p>
                    <h2 className="v2-h2" style={{ marginTop: '12px' }}>
                        Where I&rsquo;ve worked
                    </h2>
                </div>

                {/* Layout: left dates / right items */}
                <div className="v2-exp-grid">
                    {/* Left column: timeline dates */}
                    <div className="v2-exp-timeline" aria-hidden="true">
                        {ROLES.map(({ period, company }) => (
                            <div key={company} style={{ marginBottom: '56px' }} className="v2-exp-reveal">
                                <div className="v2-exp-date">{period}</div>
                                <div className="v2-exp-company">{company}</div>
                            </div>
                        ))}
                    </div>

                    {/* Right column: role details */}
                    <div className="v2-exp-items">
                        {ROLES.map(({ role, company, location, bullets }) => (
                            <article key={company} className="v2-exp-item v2-exp-reveal">
                                <h3 className="v2-exp-role">{role}</h3>
                                <div className="v2-exp-meta">
                                    <span>
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx="6"
                                                cy="6"
                                                r="5"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                            />
                                            <circle cx="6" cy="6" r="2" fill="currentColor" />
                                        </svg>
                                        {company}
                                    </span>
                                    <span>
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M6 1C4.07 1 2.5 2.57 2.5 4.5c0 2.63 3.5 6.5 3.5 6.5s3.5-3.87 3.5-6.5C9.5 2.57 7.93 1 6 1zm0 4.75a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"
                                                fill="currentColor"
                                                opacity="0.6"
                                            />
                                        </svg>
                                        {location}
                                    </span>
                                </div>
                                <ul className="v2-exp-bullets" aria-label={`${role} responsibilities`}>
                                    {bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
