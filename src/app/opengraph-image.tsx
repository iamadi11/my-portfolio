import React from 'react';

import { ImageResponse } from 'next/og';

import { SHEET_COUNT } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';

const { profile } = SITE;

export const alt = `${profile.name}, ${profile.role}, ${profile.location}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#111111';
const INK_2 = '#4a4a4a';
const INK_3 = '#6b6b6b';
const LINE = '1.2px solid #111111';

/** One ruled cell of the title block: small caps label over its value. */
function Cell({
    label,
    value,
    grow = 1,
    last = false,
}: {
    label: string;
    value: string;
    grow?: number;
    last?: boolean;
}): React.JSX.Element {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: grow,
                flexBasis: 0,
                padding: '18px 24px',
                borderRight: last ? 'none' : LINE,
            }}
        >
            <div style={{ fontSize: 15, letterSpacing: 3, color: INK_3, textTransform: 'uppercase' }}>
                {label}
            </div>
            <div
                style={{
                    marginTop: 8,
                    fontSize: 26,
                    color: INK,
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default function OGImage(): ImageResponse {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    background: '#ffffff',
                    padding: 40,
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        border: LINE,
                        borderRadius: 16,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ display: 'flex', flexGrow: 1, borderBottom: LINE }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                flexGrow: 1,
                                padding: '32px 36px',
                                borderRight: LINE,
                            }}
                        >
                            <div style={{ fontSize: 16, letterSpacing: 4, color: INK_3 }}>TITLE BLOCK</div>
                            <div
                                style={{
                                    marginTop: 14,
                                    fontSize: 92,
                                    fontWeight: 700,
                                    letterSpacing: 10,
                                    color: INK,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}
                            >
                                {profile.name}
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                width: 220,
                                padding: '28px 24px',
                                fontSize: 16,
                                letterSpacing: 3,
                                color: INK_2,
                            }}
                        >
                            <div style={{ display: 'flex' }}>DWG NO. AR-01</div>
                            <div style={{ display: 'flex' }}>REV A</div>
                            <div style={{ display: 'flex' }}>{`SHEET 1 OF ${SHEET_COUNT}`}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: LINE }}>
                        <Cell label="Role" value={profile.role} grow={2.6} />
                        <Cell label="Location" value={profile.location} last={!profile.status} />
                        {profile.status ? <Cell label="Status" value={profile.status} last /> : null}
                    </div>
                    <div style={{ display: 'flex', padding: '22px 24px' }}>
                        <div style={{ fontSize: 22, lineHeight: 1.45, color: INK_2 }}>
                            {profile.statement}
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
