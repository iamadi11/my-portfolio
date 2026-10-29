'use client';

import React, { useMemo } from 'react';

import { type FilmNode, type LessonFilmData, sampleFilm } from '@/lib/learn/film-model';

type Point = [number, number, number];
// Fixed isometric projection: geometry is a teaching model, not measured infrastructure.
const project = ([x, y, z]: Point): [number, number] => [460 + (x - y) * 0.91, 267 + (x + y) * 0.36 - z];
const path = (points: Point[]): string =>
    points.map((p, i) => `${i ? 'L' : 'M'}${project(p).join(',')}`).join(' ') + 'Z';
function Block({
    x,
    y,
    z = 0,
    w,
    d,
    h,
    tone = '',
}: {
    x: number;
    y: number;
    z?: number;
    w: number;
    d: number;
    h: number;
    tone?: string;
}) {
    return (
        <g className={`lf-solid ${tone}`}>
            <path
                className="lf-face-left"
                d={path([
                    [x, y + d, z],
                    [x + w, y + d, z],
                    [x + w, y + d, z + h],
                    [x, y + d, z + h],
                ])}
            />
            <path
                className="lf-face-right"
                d={path([
                    [x + w, y, z],
                    [x + w, y + d, z],
                    [x + w, y + d, z + h],
                    [x + w, y, z + h],
                ])}
            />
            <path
                className="lf-face-top"
                d={path([
                    [x, y, z + h],
                    [x + w, y, z + h],
                    [x + w, y + d, z + h],
                    [x, y + d, z + h],
                ])}
            />
        </g>
    );
}
const Device = React.memo(
    ({ node, state, value, count }: { node: FilmNode; state: string; value?: string; count?: number }) => {
        const { x, y, kind } = node;
        const [lx, ly] = project([x, y, 0]);
        return (
            <g data-device={node.id} data-state={state} className="lf-device">
                <ellipse cx={lx} cy={ly + 15} rx="79" ry="22" className="lf-shadow" />
                <Block x={x - 55} y={y - 41} z={0} w={110} d={82} h={8} tone="lf-plinth" />
                {kind === 'computer' ? (
                    <>
                        <Block x={x - 34} y={y - 19} z={9} w={68} d={42} h={5} />
                        <Block x={x - 5} y={y - 8} z={14} w={10} d={9} h={20} />
                        <Block x={x - 40} y={y - 18} z={34} w={80} d={9} h={58} tone="lf-screen" />
                        {[0, 1, 2].map((row) => (
                            <Block
                                key={row}
                                x={x - 30}
                                y={y - 8}
                                z={49 + row * 10}
                                w={row === 2 ? 34 : 58}
                                d={1}
                                h={3}
                                tone="lf-detail"
                            />
                        ))}
                        <Block x={x - 33} y={y + 11} z={14} w={65} d={14} h={3} />
                        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                            <Block
                                key={k}
                                x={x - 27 + k * 8}
                                y={y + 14}
                                z={17}
                                w={4}
                                d={7}
                                h={1}
                                tone="lf-detail"
                            />
                        ))}
                    </>
                ) : kind === 'store' ? (
                    <>
                        {[0, 1, 2].map((k) => (
                            <g key={k}>
                                <Block x={x - 30} y={y - 27} z={12 + k * 22} w={60} d={54} h={18} />
                                <Block
                                    x={x - 22}
                                    y={y + 27}
                                    z={17 + k * 22}
                                    w={44}
                                    d={1}
                                    h={3}
                                    tone="lf-detail"
                                />
                            </g>
                        ))}
                    </>
                ) : kind === 'queue' ? (
                    <>
                        <Block x={x - 43} y={y - 21} z={12} w={86} d={42} h={9} />
                        <Block x={x - 45} y={y - 24} z={12} w={4} d={48} h={25} />
                        <Block x={x + 41} y={y - 24} z={12} w={4} d={48} h={25} />
                        {Array.from({ length: Math.min(8, count ?? 0) }, (_, k) => (
                            <Block
                                key={k}
                                x={x - 34 + (k % 4) * 18}
                                y={y - 12 + Math.floor(k / 4) * 21}
                                z={23}
                                w={13}
                                d={14}
                                h={14}
                                tone="lf-data"
                            />
                        ))}
                    </>
                ) : kind === 'router' ? (
                    <>
                        <Block x={x - 34} y={y - 25} z={11} w={68} d={50} h={26} />
                        {[0, 1, 2, 3].map((k) => (
                            <Block
                                key={k}
                                x={x - 25 + k * 14}
                                y={y + 25}
                                z={20}
                                w={8}
                                d={2}
                                h={7}
                                tone="lf-detail"
                            />
                        ))}
                        <Block x={x - 28} y={y - 20} z={37} w={3} d={3} h={26} />
                        <Block x={x + 23} y={y - 20} z={37} w={3} d={3} h={26} />
                    </>
                ) : (
                    <>
                        <Block x={x - 29} y={y - 26} z={10} w={58} d={52} h={89} />
                        {[0, 1, 2, 3].map((k) => (
                            <g key={k}>
                                <Block
                                    x={x - 24}
                                    y={y + 26}
                                    z={20 + k * 18}
                                    w={48}
                                    d={2}
                                    h={12}
                                    tone="lf-rack"
                                />
                                <Block
                                    x={x + 14}
                                    y={y + 29}
                                    z={24 + k * 18}
                                    w={4}
                                    d={1}
                                    h={3}
                                    tone="lf-detail"
                                />
                            </g>
                        ))}
                        <Block x={x - 22} y={y - 20} z={99} w={44} d={36} h={2} tone="lf-vent" />
                    </>
                )}
                {kind === 'store' &&
                    count !== undefined &&
                    Array.from({ length: Math.min(5, count) }, (_, i) => (
                        <Block
                            key={`record-${i}`}
                            x={x - 26 + i * 10}
                            y={y - 9}
                            z={81}
                            w={7}
                            d={19}
                            h={12}
                            tone="lf-data"
                        />
                    ))}
                {state === 'locked' && (
                    <g transform={`translate(${lx + 44} ${ly - 62})`} className="lf-lock">
                        <path d="M-5 0v-5a5 5 0 0 1 10 0v5" />
                        <rect x="-8" y="0" width="16" height="12" rx="2" />
                        <circle cx="0" cy="5" r="1" />
                    </g>
                )}
                {count !== undefined && (
                    <g className="lf-count-label" transform={`translate(${lx} ${ly - 115})`}>
                        <text textAnchor="middle">
                            {count}
                            {count > (kind === 'queue' ? 8 : 5) ? ' total · abbreviated' : ''}
                        </text>
                    </g>
                )}
                <g className="lf-node-label" transform={`translate(${lx} ${ly + 49})`}>
                    <text textAnchor="middle">{node.label}</text>
                    {value && (
                        <text textAnchor="middle" y="22" className="lf-value">
                            {value}
                        </text>
                    )}
                    {state === 'failed' && (
                        <text textAnchor="middle" y={value ? 44 : 22} className="lf-value">
                            × interrupted
                        </text>
                    )}
                    {state === 'locked' && (
                        <text textAnchor="middle" y={value ? 44 : 22} className="lf-value">
                            protected channel
                        </text>
                    )}
                </g>
            </g>
        );
    }
);
Device.displayName = 'Device';

function SceneView({ film, time, narrow = false }: { film: LessonFilmData; time: number; narrow?: boolean }) {
    const { beat, packet, states, values, counts } = sampleFilm(film, time);
    const nodes = [...film.nodes].sort((a, b) => a.x + a.y - (b.x + b.y));
    return (
        <svg
            className={`lf-scene ${narrow ? 'lf-scene-mobile' : 'lf-scene-desktop'}`}
            viewBox={narrow ? '220 0 480 460' : '0 0 920 460'}
            aria-hidden="true"
            focusable="false"
        >
            <g className="lf-grid">
                {Array.from({ length: 13 }, (_, i) => {
                    const a = project([-360 + i * 60, -260, 0]);
                    const b = project([-360 + i * 60, 240, 0]);
                    return <path key={`x${i}`} d={`M${a}L${b}`} />;
                })}
                {Array.from({ length: 10 }, (_, i) => {
                    const a = project([-360, -260 + i * 55, 0]);
                    const b = project([360, -260 + i * 55, 0]);
                    return <path key={`y${i}`} d={`M${a}L${b}`} />;
                })}
            </g>
            {film.links.map(([a, b]) => {
                const from = film.nodes.find((n) => n.id === a)!;
                const to = film.nodes.find((n) => n.id === b)!;
                const p = project([from.x, from.y, 9]);
                const q = project([to.x, to.y, 9]);
                const active = (beat.from === a && beat.to === b) || (beat.from === b && beat.to === a);
                return (
                    <g key={`${a}-${b}`} className={`lf-cable ${active ? 'lf-cable-active' : ''}`}>
                        <path className="lf-cable-bed" d={`M${p}L${q}`} />
                        <path d={`M${p}L${q}`} />
                    </g>
                );
            })}
            {nodes.map((node) => (
                <Device
                    key={node.id}
                    node={node}
                    state={states[node.id] ?? 'idle'}
                    value={values[node.id]}
                    count={counts[node.id]}
                />
            ))}
            {packet && (
                <g className={`lf-packet ${packet.lost ? 'lf-packet-lost' : ''}`}>
                    <Block x={packet.x - 9} y={packet.y - 7} z={30} w={18} d={14} h={13} tone="lf-data" />
                    <g transform={`translate(${project([packet.x, packet.y, 72]).join(' ')})`}>
                        <rect x="-96" y="-19" width="192" height="30" rx="15" />
                        <text textAnchor="middle" y="1">
                            {packet.lost ? '× message lost' : beat.packet}
                        </text>
                    </g>
                </g>
            )}
        </svg>
    );
}

export default function Scene({ film, time }: { film: LessonFilmData; time: number }): React.JSX.Element {
    const positions = useMemo(
        () =>
            film.nodes.length === 2
                ? [
                      [330, 245],
                      [595, 245],
                  ]
                : film.nodes.length === 3
                  ? [
                        [330, 160],
                        [595, 160],
                        [465, 350],
                    ]
                  : [
                        [330, 145],
                        [595, 145],
                        [330, 345],
                        [595, 345],
                    ],
        [film.nodes.length]
    );
    const narrowFilm = useMemo(
        () => ({
            ...film,
            nodes: film.nodes.map((node, i) => {
                const [px, py] = positions[i];
                const diff = (px - 460) / 0.91;
                const sum = (py - 267) / 0.36;
                return { ...node, x: (sum + diff) / 2, y: (sum - diff) / 2 };
            }),
        }),
        [film, positions]
    );
    return (
        <>
            <SceneView film={film} time={time} />
            <SceneView film={narrowFilm} time={time} narrow />
        </>
    );
}
