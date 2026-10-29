'use client';

import React, { useId, useMemo } from 'react';

import { HARDWARE } from '@/components/anatomy/hardware';
import { sampleFilm, type FilmNode, type LessonFilmData } from '@/lib/learn/film-model';
import { scenePoint, signalRoute, routePoint, responsiveFilm } from '@/lib/learn/scene-layout';
import '@/components/anatomy/hardware.css';

const Device = React.memo(
    ({
        node,
        state,
        value,
        count,
        focused,
        asset,
    }: {
        node: FilmNode;
        state: string;
        value?: string;
        count?: number;
        focused: boolean;
        asset: string;
    }) => {
        const [x, y] = scenePoint(node.x, node.y);
        const markLimit = node.kind === 'queue' ? 8 : 5;
        return (
            <g
                data-device={node.id}
                data-state={state}
                data-focused={focused}
                className="lf-device"
                transform={`translate(${x} ${y})`}
            >
                <ellipse cx="0" cy="18" rx="80" ry="22" className="lf-shadow" />
                <use href={`#${asset}`} className="an-instance" />
                {count !== undefined &&
                    node.kind === 'queue' &&
                    Array.from({ length: Math.min(markLimit, count) }, (_, i) => {
                        const p = scenePoint(-29 + (i % 4) * 18, -9 + Math.floor(i / 4) * 23, 29);
                        return (
                            <rect
                                key={i}
                                x={p[0] - 460 - 5}
                                y={p[1] - 267 - 7}
                                width="11"
                                height="11"
                                rx="2"
                                className="lf-quantity-mark"
                            />
                        );
                    })}
                {count !== undefined && (
                    <text y="-137" textAnchor="middle" className="lf-count-label">
                        {count}
                        {count > markLimit ? ' total · abbreviated' : ''}
                    </text>
                )}
                {state === 'failed' && (
                    <g className="lf-status-icon">
                        <circle cx="61" cy="-54" r="11" />
                        <path d="m56-59 10 10m0-10-10 10" />
                    </g>
                )}
                <g className="lf-node-label" transform="translate(0 75)">
                    <text textAnchor="middle">{node.label}</text>
                    {value && (
                        <text textAnchor="middle" y="21" className="lf-value">
                            {value.length > 31 ? `${value.slice(0, 28)}…` : value}
                        </text>
                    )}
                    {(state === 'failed' || state === 'locked') && (
                        <text textAnchor="middle" y={value ? 41 : 21} className="lf-value">
                            {state === 'failed' ? '× interrupted' : 'protected channel'}
                        </text>
                    )}
                </g>
            </g>
        );
    }
);
Device.displayName = 'AnatomyDevice';
function SceneView({
    film,
    time,
    narrow = false,
    assets,
}: {
    film: LessonFilmData;
    time: number;
    narrow?: boolean;
    assets: Record<string, string>;
}): React.JSX.Element {
    const state = sampleFilm(film, time),
        { beat } = state;
    const cables = useMemo(
        () =>
            film.links.map(([a, b]) => ({
                a,
                b,
                route: signalRoute(
                    film.nodes,
                    film.nodes.find((n) => n.id === a)!,
                    film.nodes.find((n) => n.id === b)!
                ),
            })),
        [film]
    );
    const current = cables.find(
        (c) => (c.a === beat.from && c.b === beat.to) || (c.b === beat.from && c.a === beat.to)
    );
    const route = current && (current.a === beat.from ? current.route : [...current.route].reverse());
    const progress = beat.lost ? Math.min(state.progress, 0.55) : state.progress;
    const packet = route && state.packet ? routePoint(route, progress) : null;
    const focused = state.progress < 1 ? beat.from : beat.to;
    const nodes = useMemo(() => [...film.nodes].sort((a, b) => a.x + a.y - b.x - b.y), [film]);
    return (
        <svg
            className={`lf-scene ${narrow ? 'lf-scene-mobile' : 'lf-scene-desktop'}`}
            viewBox={narrow ? '218 -12 484 530' : '0 -12 920 360'}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <pattern
                    id={`${film.id}-${narrow ? 'n' : 'w'}-grid`}
                    width="42"
                    height="22"
                    patternUnits="userSpaceOnUse"
                >
                    <path d="M0 11 21 0 42 11 21 22Z" className="lf-grid-tile" />
                </pattern>
            </defs>
            <rect
                x="0"
                y="-12"
                width="920"
                height={narrow ? 530 : 360}
                fill={`url(#${film.id}-${narrow ? 'n' : 'w'}-grid)`}
                opacity=".32"
            />
            {cables.map((c) => (
                <g key={`${c.a}-${c.b}`} className={`lf-cable ${c === current ? 'lf-cable-active' : ''}`}>
                    <path
                        className="lf-cable-bed"
                        d={c.route.map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' ')}
                    />
                    <path d={c.route.map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' ')} />
                </g>
            ))}
            {nodes.map((node) => (
                <Device
                    key={node.id}
                    node={node}
                    state={state.states[node.id] ?? 'idle'}
                    value={state.values[node.id]}
                    count={state.counts[node.id]}
                    focused={focused === node.id}
                    asset={assets[node.kind]}
                />
            ))}
            {packet && (
                <g
                    className={`lf-packet ${state.packet?.lost ? 'lf-packet-lost' : ''}`}
                    transform={`translate(${packet})`}
                >
                    <path d="M-7 -6 0 -10 7 -6 7 3 0 7 -7 3Z" className="lf-message-body" />
                    <path d="m-7-6 7 4 7-4M0-2v9" className="lf-message-edge" />
                    <g transform="translate(0 -25)">
                        <rect x="-82" y="-17" width="164" height="27" rx="13" />
                        <text textAnchor="middle" y="1">
                            {state.packet?.lost ? '× message lost' : (beat.packet ?? 'Message').slice(0, 25)}
                        </text>
                    </g>
                </g>
            )}
        </svg>
    );
}
export default function Scene({ film, time }: { film: LessonFilmData; time: number }): React.JSX.Element {
    const base = useId();
    const assets = useMemo(
        () =>
            Object.fromEntries(
                [...new Set(film.nodes.map((node) => node.kind))].map((kind) => [kind, `${base}-${kind}`])
            ),
        [base, film]
    );
    const narrow = useMemo(() => responsiveFilm(film), [film]);
    const wide = useMemo(() => responsiveFilm(film, false), [film]);
    return (
        <>
            <svg className="lf-assets" width="0" height="0" aria-hidden="true" focusable="false">
                <defs>
                    {Object.entries(assets).map(([kind, id]) => (
                        <symbol
                            key={kind}
                            id={id}
                            className="an-hardware"
                            overflow="visible"
                            dangerouslySetInnerHTML={{ __html: HARDWARE[kind as keyof typeof HARDWARE].svg }}
                        />
                    ))}
                </defs>
            </svg>
            <SceneView assets={assets} film={wide} time={time} />
            <SceneView assets={assets} film={narrow} time={time} narrow />
        </>
    );
}
