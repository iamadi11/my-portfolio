'use client';

import { useReveal } from './useReveal';

const SOCIAL = [
    {
        label: 'GitHub',
        href: 'https://github.com/iamadi11',
        icon: (
            <svg width="15" height="15" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.5 0C2.91 0 0 2.98 0 6.66c0 2.94 1.87 5.44 4.47 6.32.33.06.45-.14.45-.32v-1.12c-1.82.4-2.2-.89-2.2-.89-.3-.77-.73-1-.73-1-.6-.41.04-.4.04-.4.66.05 1.01.69 1.01.69.58 1.03 1.53.73 1.9.56.06-.43.23-.73.41-.89-1.45-.17-2.98-.74-2.98-3.3 0-.73.25-1.32.67-1.79-.07-.16-.29-.85.06-1.77 0 0 .55-.18 1.8.68A6.15 6.15 0 016.5 3.3c.56 0 1.12.08 1.65.23 1.25-.86 1.8-.68 1.8-.68.35.92.13 1.61.06 1.77.42.47.67 1.06.67 1.79 0 2.57-1.53 3.13-2.99 3.3.24.21.45.62.45 1.25v1.85c0 .18.12.39.46.32A6.67 6.67 0 0013 6.66C13 2.98 10.09 0 6.5 0z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/adityaraj11/',
        icon: (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path
                    d="M3.33 5H1V14h2.33V5zM2.17 4a1.17 1.17 0 100-2.34A1.17 1.17 0 002.17 4zM14 14h-2.33V9.5c0-.87-.02-2-1.22-2-1.22 0-1.41.95-1.41 1.93V14H6.71V5H9v1.23h.03c.33-.62 1.13-1.27 2.32-1.27C14 5 14 7.49 14 9.7V14z"
                    fill="currentColor"
                />
            </svg>
        ),
    },
    {
        label: 'Email',
        href: 'mailto:adityaraj92.20@gmail.com',
        icon: (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path
                    d="M1 3.5A1.5 1.5 0 012.5 2h10A1.5 1.5 0 0114 3.5v8a1.5 1.5 0 01-1.5 1.5h-10A1.5 1.5 0 011 11.5v-8zm1.5-.5a.5.5 0 00-.5.5v.6l5.5 3.52L13 4.1V3.5a.5.5 0 00-.5-.5h-10zM13 5.4l-4.75 3.04a.5.5 0 01-.5 0L3 5.4V11.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V5.4z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
];

export default function Contact() {
    const ref = useReveal('.v2-contact-animate', { threshold: 0.12, stagger: 100 });

    return (
        <section
            id="contact"
            ref={ref as React.RefObject<HTMLElement>}
            className="v2-section"
            aria-label="Contact"
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(34,211,238,0.07), transparent 70%)',
                    pointerEvents: 'none',
                }}
            />
            <div className="v2-container">
                <div className="v2-contact-wrap">
                    <div className="v2-contact-animate">
                        <div className="v2-rule" style={{ margin: '0 auto 20px' }} />
                        <p className="v2-label">Contact</p>
                    </div>

                    <h2 className="v2-h2 v2-contact-animate" style={{ marginTop: '16px', lineHeight: 1.1 }}>
                        Let&rsquo;s build something.
                    </h2>

                    <p className="v2-body v2-contact-animate" style={{ marginTop: '16px' }}>
                        Open to senior frontend roles and contracts. Based in Bengaluru — can work remotely.
                    </p>

                    <a
                        href="mailto:adityaraj92.20@gmail.com"
                        className="v2-contact-email v2-contact-animate"
                        aria-label="Email Aditya Raj"
                    >
                        adityaraj92.20@gmail.com
                    </a>

                    <div className="v2-social-row v2-contact-animate">
                        {SOCIAL.map(({ label, href, icon }) => (
                            <a
                                key={label}
                                href={href}
                                target={href.startsWith('mailto') ? undefined : '_blank'}
                                rel={href.startsWith('mailto') ? undefined : 'noreferrer'}
                                className="v2-social-a"
                                aria-label={label}
                            >
                                {icon}
                                {label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
