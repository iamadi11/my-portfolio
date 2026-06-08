import { ImageResponse } from 'next/og';

export const alt = 'Aditya Raj — Frontend Engineer II at Cashfree Payments, Bengaluru';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#09090b',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Top gradient bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 5,
                        background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)',
                    }}
                />

                {/* Ambient glow top-center */}
                <div
                    style={{
                        position: 'absolute',
                        top: -160,
                        left: 160,
                        right: 160,
                        height: 480,
                        background:
                            'radial-gradient(ellipse at 50% 50%, rgba(34,211,238,0.12) 0%, transparent 70%)',
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        paddingLeft: 80,
                        paddingRight: 80,
                        gap: 0,
                    }}
                >
                    {/* Availability pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.22)',
                            borderRadius: 40,
                            padding: '8px 18px',
                            marginBottom: 28,
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                background: '#34d399',
                            }}
                        />
                        <span style={{ color: '#6ee7b7', fontSize: 18, fontWeight: 500 }}>
                            Available for opportunities
                        </span>
                    </div>

                    {/* Name */}
                    <div
                        style={{
                            fontSize: 92,
                            fontWeight: 800,
                            color: '#f4f4f5',
                            letterSpacing: '-3px',
                            lineHeight: 1,
                            marginBottom: 18,
                        }}
                    >
                        Aditya Raj
                    </div>

                    {/* Role */}
                    <div
                        style={{
                            fontSize: 32,
                            fontWeight: 600,
                            color: '#22d3ee',
                            letterSpacing: '-0.5px',
                            marginBottom: 10,
                        }}
                    >
                        Frontend Engineer II · Cashfree Payments
                    </div>

                    {/* Sub-line */}
                    <div
                        style={{
                            fontSize: 22,
                            color: '#71717a',
                            marginBottom: 40,
                        }}
                    >
                        Bengaluru · React · Next.js · TypeScript · 4.5+ yrs fintech
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 18 }}>
                        {[
                            { val: '4.5+', label: 'years exp' },
                            { val: '80%', label: 'faster builds' },
                            { val: '70→15%', label: 'SLA reduction' },
                            { val: '~M/mo', label: 'txns processed' },
                        ].map(({ val, label }) => (
                            <div
                                key={label}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 14,
                                    padding: '14px 22px',
                                    minWidth: 115,
                                }}
                            >
                                <span
                                    style={{
                                        color: '#f4f4f5',
                                        fontSize: 28,
                                        fontWeight: 700,
                                        lineHeight: 1,
                                    }}
                                >
                                    {val}
                                </span>
                                <span
                                    style={{
                                        color: '#52525b',
                                        fontSize: 13,
                                        marginTop: 5,
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom domain hint */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#3f3f46',
                        fontSize: 16,
                    }}
                >
                    <div
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            background: 'rgba(34,211,238,0.4)',
                        }}
                    />
                    github.com/iamadi11
                </div>
            </div>
        ),
        { ...size }
    );
}
