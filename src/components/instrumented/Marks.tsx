import React from 'react';

import type { Mark as MarkKind } from '@/components/instrumented/content';

/**
 * Technical plates for projects. Static SVG laid out for its frame: 480 wide for 4:3, 640 for 16:9.
 * CSS draws them in and runs them only while on screen.
 */

const H = 360;
const r1 = (n: number): number => Math.round(n * 10) / 10;

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;
type Props = { w: number; uid: string };

function Orbit({ w }: Props): React.JSX.Element {
    const cx = w / 2;
    const cy = 168;
    const dial = 132;
    const ticks = Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2;
        const inner = dial + 4;
        const outer = dial + (i % 6 === 0 ? 16 : 9);
        const [c, s] = [Math.cos(a), Math.sin(a)];
        return `M${r1(cx + c * inner)} ${r1(cy + s * inner)}L${r1(cx + c * outer)} ${r1(cy + s * outer)}`;
    }).join('');
    const spin = (d: string): CSSVars => ({ '--d': d, transformOrigin: `${cx}px ${cy}px` });
    return (
        <>
            <path className="m-faint" d={`M48 ${cy}H${w - 48}M${cx} 20V316`} />
            <path className="m-ink" d={ticks} />
            <circle className="m-ink" cx={cx} cy={cy} r={dial} />
            <circle className="m-dash" cx={cx} cy={cy} r={92} />
            <circle className="m-ink" cx={cx} cy={cy} r={52} />
            <circle className="m-accent-fill" cx={cx} cy={cy} r={10} />
            <circle className="m-accent" cx={cx} cy={cy} r={19} />
            <g className="m-spin" style={spin('38s')}>
                <path className="m-accent" d={`M${cx} ${cy}L${cx + dial} ${cy}`} />
                <circle className="m-accent-fill" cx={cx + dial} cy={cy} r={6} />
            </g>
            <g className="m-spin m-rev" style={spin('22s')}>
                <circle className="m-node" cx={cx} cy={cy - 92} r={6} />
            </g>
            <g className="m-spin" style={spin('12s')}>
                <circle className="m-node-ink" cx={cx - 52} cy={cy} r={4} />
            </g>
            <path className="m-ink" d={`M${cx - 65} ${cy - 65}L${cx - 104} ${cy - 104}H${cx - 176}`} />
            <text className="m-label" x={cx - 176} y={cy - 110}>
                r 92 · 22s
            </text>
        </>
    );
}

const ROUTE: Array<[number, number]> = [
    [0, 4],
    [1, 4],
    [1, 2],
    [3, 2],
    [3, 1],
    [5, 1],
    [5, 3],
    [7, 3],
    [7, 0],
];

function Lattice({ w }: Props): React.JSX.Element {
    const step = 50;
    const cols = Math.floor((w - 100) / step) + 1;
    const left = (w - (cols - 1) * step) / 2;
    const shift = Math.floor((cols - 8) / 2);
    const gx = (i: number): number => left + (i + shift) * step;
    const gy = (j: number): number => 64 + j * step;
    const grid = [
        ...Array.from({ length: 5 }, (_, j) => `M${left} ${gy(j)}H${left + (cols - 1) * step}`),
        ...Array.from({ length: cols }, (_, i) => `M${left + i * step} ${gy(0)}V${gy(4)}`),
    ].join('');
    const route = ROUTE.map(([i, j], k) => `${k ? 'L' : 'M'}${gx(i)} ${gy(j)}`).join('');
    return (
        <>
            <path className="m-faint" d={grid} />
            {Array.from({ length: cols * 5 }, (_, k) => {
                const i = (k % cols) - shift;
                const j = Math.floor(k / cols);
                const hot = ROUTE.some(([ri, rj]) => ri === i && rj === j);
                return (
                    <rect
                        key={k}
                        className={hot ? 'm-accent-fill' : 'm-node'}
                        x={gx(i) - 4}
                        y={gy(j) - 4}
                        width={8}
                        height={8}
                    />
                );
            })}
            <path className="m-accent m-route" d={route} pathLength={1} data-draw />
            <path className="m-packet" d={route} pathLength={1} />
            <circle className="m-accent" cx={gx(0)} cy={gy(4)} r={13} />
            <circle className="m-accent" cx={gx(7)} cy={gy(0)} r={13} />
            <text className="m-label" x={gx(0) - 4} y={gy(4) + 32}>
                in
            </text>
            <text className="m-label" x={gx(7) - 6} y={gy(0) - 22}>
                out
            </text>
            <text className="m-label" x={gx(3) + 8} y={gy(2) + 22}>
                8 hops
            </text>
        </>
    );
}

const CHANNELS = [
    { amp: 7, len: 120 },
    { amp: 13, len: 80 },
    { amp: 22, len: 160 },
    { amp: 12, len: 64 },
    { amp: 8, len: 100 },
    { amp: 17, len: 140 },
];

function Wave({ w, uid }: Props): React.JSX.Element {
    const right = w - 40;
    const head = Math.round(w * 0.62);
    return (
        <>
            <defs>
                <clipPath id={`${uid}-clip`}>
                    <rect x={40} y={30} width={right - 40} height={300} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${uid}-clip)`}>
                {CHANNELS.map(({ amp, len }, k) => {
                    const y0 = 70 + k * 42;
                    const points: string[] = [];
                    for (let x = 40; x <= right + len; x += 4) {
                        points.push(`${x} ${r1(y0 + Math.sin(((x - 40) / len) * Math.PI * 2) * amp)}`);
                    }
                    return (
                        <path
                            key={y0}
                            className={k === 2 ? 'm-accent m-flow m-thick' : 'm-ink m-flow'}
                            d={`M${points.join('L')}`}
                            style={{ '--l': len, '--d': `${r1(len / 22)}s` } as CSSVars}
                        />
                    );
                })}
            </g>
            {CHANNELS.map((c, k) => (
                <text key={c.len} className="m-label" x={6} y={70 + k * 42 + 3}>
                    ch{k + 1}
                </text>
            ))}
            <path className="m-faint" d={`M40 30V330M${right} 30V330`} />
            <path className="m-accent m-dashed" d={`M${head} 30V330`} />
            <rect className="m-accent-fill" x={head} y={30} width={66} height={18} />
            <text className="m-label m-on-accent" x={head + 6} y={43}>
                t + 0.24
            </text>
        </>
    );
}

function Stack({ w }: Props): React.JSX.Element {
    const cx = w / 2;
    const sw = 132;
    const sh = 66;
    const depth = 10;
    const layers = [248, 196, 144, 92];
    const rhombus = (y: number): string =>
        `M${cx} ${y - sh}L${cx + sw} ${y}L${cx} ${y + sh}L${cx - sw} ${y}Z`;
    const sides = (y: number): string =>
        `M${cx - sw} ${y}L${cx} ${y + sh}L${cx + sw} ${y}L${cx + sw} ${y + depth}L${cx} ${y + sh + depth}L${cx - sw} ${y + depth}Z`;
    return (
        <>
            <path
                className="m-dash"
                d={`M${cx - sw} ${layers[3]}V${layers[0]}M${cx + sw} ${layers[3]}V${layers[0]}M${cx} ${layers[3] + sh}V${layers[0] + sh}`}
            />
            {layers.map((y, k) => {
                const top = k === layers.length - 1;
                return (
                    <g
                        key={y}
                        className="m-layer"
                        style={{ '--dy': `${-(k + 1) * 3}px`, '--delay': `${-k * 0.9}s` } as CSSVars}
                    >
                        <path className="m-side" d={sides(y)} />
                        <path className={top ? 'm-top m-top-accent' : 'm-top'} d={rhombus(y)} />
                        {top && (
                            <path
                                className="m-accent"
                                d={`M${cx - sw / 2} ${y - sh / 2}L${cx + sw / 2} ${y + sh / 2}M${cx + sw / 2} ${y - sh / 2}L${cx - sw / 2} ${y + sh / 2}`}
                            />
                        )}
                        <path className="m-ink" d={`M${cx + sw} ${y}H${cx + sw + 40}`} />
                        <text className="m-label" x={cx + sw + 46} y={y + 4}>
                            L{k + 1}
                        </text>
                    </g>
                );
            })}
        </>
    );
}

const DRAWINGS: Record<MarkKind, (props: Props) => React.JSX.Element> = {
    orbit: Orbit,
    lattice: Lattice,
    wave: Wave,
    stack: Stack,
};

export default function Mark({
    kind,
    figure,
    uid,
    wide = false,
}: {
    kind: MarkKind;
    figure: string;
    uid: string;
    wide?: boolean;
}): React.JSX.Element {
    const Drawing = DRAWINGS[kind];
    const w = wide ? 640 : 480;
    return (
        <svg
            className="ins-mark"
            viewBox={`0 0 ${w} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
        >
            <path
                className="m-ink"
                d={`M12 28V12H28M${w - 28} 12H${w - 12}V28M${w - 12} ${H - 28}V${H - 12}H${w - 28}M28 ${H - 12}H12V${H - 28}`}
            />
            <Drawing w={w} uid={uid} />
            <text className="m-label" x={20} y={H - 20}>
                FIG. {figure} · {kind.toUpperCase()}
            </text>
            <path
                className="m-ink"
                d={`M${w - 120} ${H - 24}H${w - 24}M${w - 120} ${H - 28}V${H - 20}M${w - 24} ${H - 28}V${H - 20}`}
            />
        </svg>
    );
}
