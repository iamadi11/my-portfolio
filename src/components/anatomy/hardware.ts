/** Anatomy kit integration: MIT, wheresryan22/anatomy @1482e84 (see vendored VENDORED.md).
 * Static parts are computed once per device kind. These are schematic service enclosures, not measured machines.
 */
import type { DeviceKind } from '@/lib/learn/film-model';

import order from './order.json';
import {
    depthOf,
    dotsSvg,
    iso,
    lineSvg,
    slabOf,
    solidSvg,
    type Projection,
} from '../../../.claude/skills/anatomy/kit/iso-kit';

export const HARDWARE_PROJECTION: Projection = { origin: [0, 0], scale: 1, azimuth: 45, elevation: 30 };
type Part = {
    id: string;
    x: number;
    y: number;
    z: number;
    w: number;
    d: number;
    h: number;
    tone?: 'lo' | 'mid' | 'hi';
};
export type HardwareArt = { svg: string; parts: readonly Part[]; port: [number, number] };
function build(kind: DeviceKind): HardwareArt {
    const parts: Part[] = [];
    const add = (
        id: string,
        x: number,
        y: number,
        z: number,
        w: number,
        d: number,
        h: number,
        tone: Part['tone'] = 'mid'
    ): void => {
        parts.push({ id, x, y, z, w, d, h, tone });
    };
    // Base, four supported feet, inset service plate and four mounting pads.
    for (const x of [-43, 35]) for (const y of [-30, 22]) add(`foot-${x}-${y}`, x, y, 0, 8, 8, 5, 'lo');
    add('base', -54, -41, 5, 108, 82, 6, 'lo');
    add('service-plate', -49, -36, 11, 98, 72, 2);
    for (const x of [-44, 39]) for (const y of [-31, 26]) add(`pad-${x}-${y}`, x, y, 13, 5, 5, 1, 'hi');
    if (kind === 'computer') {
        add('stand', -9, -7, 13, 18, 16, 27);
        add('display-frame', -40, -16, 40, 80, 10, 53);
        add('display-recess', -35, -6, 45, 70, 1.2, 43, 'lo');
        add('keyboard', -34, 9, 13, 68, 22, 3, 'hi');
        for (let row = 0; row < 3; row++)
            for (let col = 0; col < 9; col++)
                add(`key-${row}-${col}`, -30 + col * 7, 12 + row * 5, 16, 5, 3.5, 1, 'hi');
        for (let row = 0; row < 4; row++)
            add(`screen-line-${row}`, -29, -4.8, 52 + row * 8, row === 3 ? 30 : 55, 0.8, 1, 'hi');
    } else if (kind === 'light') {
        add('lamp-post', -5, -5, 13, 10, 10, 35);
        add('lamp-head', -32, -15, 48, 64, 30, 31);
        add('diffuser', -29, 15, 51, 58, 1, 25, 'hi');
        for (let row = 0; row < 3; row++)
            for (let col = 0; col < 8; col++)
                add(`led-${row}-${col}`, -25 + col * 7, 16, 54 + row * 7, 4, 1, 4, 'hi');
        for (let i = 0; i < 8; i++) add(`lamp-vent-${i}`, -25 + i * 7, -10, 79, 2, 18, 0.6, 'lo');
    } else if (kind === 'queue') {
        add('tray-floor', -40, -23, 13, 80, 46, 4);
        add('back-rail', -43, -27, 13, 86, 4, 24);
        add('left-rail', -43, -23, 13, 3, 46, 24);
        add('right-rail', 40, -23, 13, 3, 46, 24);
        for (let i = 0; i < 12; i++) add(`roller-${i}`, -37 + i * 6.5, -19, 17, 2, 38, 2, 'hi');
        for (let i = 0; i < 12; i++)
            for (const y of [-22, 19]) add(`roller-bearing-${i}-${y}`, -37 + i * 6.5, y, 17, 3, 3, 3, 'lo');
        for (let i = 0; i < 8; i++)
            add(`slot-stop-${i}`, -36 + (i % 4) * 19, -22 + Math.floor(i / 4) * 42, 20, 2, 4, 8, 'lo');
    } else if (kind === 'router') {
        add('chassis', -36, -25, 13, 72, 50, 26);
        add('lid', -35, -24, 39, 70, 48, 2, 'hi');
        for (let i = 0; i < 8; i++) {
            add(`socket-${i}`, -31 + i * 8, 25, 19, 6, 2, 7, 'lo');
            add(`socket-contact-${i}`, -30 + i * 8, 27, 21, 4, 1, 1, 'hi');
        }
        for (let i = 0; i < 12; i++) add(`vent-${i}`, -28 + i * 5, -15, 41, 1.2, 22, 0.7, 'lo');
        add('antenna-left', -30, -19, 41, 3, 3, 25);
        add('antenna-right', 27, -19, 41, 3, 3, 25);
    } else {
        const bays = kind === 'store' ? 4 : 5;
        add('rear-panel', -33, -28, 13, 66, 3, 91);
        add('side-left', -34, -25, 13, 3, 51, 91);
        add('side-right', 31, -25, 13, 3, 51, 91);
        for (let row = 0; row < bays; row++) {
            const z = 14 + row * 17;
            add(`bay-floor-${row}`, -31, -25, z, 62, 51, 2);
            add(`drive-${row}`, -28, -21, z + 2, 56, 43, 11, 'hi');
            add(`drive-front-${row}`, -28, 22, z + 2, 56, 2, 11);
            add(`handle-left-${row}`, -22, 24, z + 5, 2, 3, 4, 'hi');
            add(`handle-right-${row}`, 20, 24, z + 5, 2, 3, 4, 'hi');
            add(`handle-${row}`, -20, 26, z + 6, 40, 1.5, 2, 'hi');
            add(`indicator-${row}`, 24, 24, z + 6, 2, 1.2, 2, 'hi');
        }
        add('top-cover', -34, -28, 104, 68, 56, 3, 'hi');
        for (let i = 0; i < 8; i++) add(`lid-vent-${i}`, -25 + i * 7, -18, 107, 2, 32, 0.6, 'lo');
    }
    // A visible mounted connector shared by signal paths, never the machine centre.
    add('connector-mount', -6, 35, 11, 12, 11, 2);
    add('connector-shell', -5, 39, 13, 10, 7, 6, 'lo');
    add('connector-contact', -3, 46, 15, 6, 1.2, 2, 'hi');
    const ranks = new Map(order[kind].map((id, index) => [id, index]));
    const ordered = [...parts].sort(
        (a, b) =>
            (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity) ||
            depthOf([a.x + a.w / 2, a.y + a.d / 2, a.z + a.h / 2], HARDWARE_PROJECTION) -
                depthOf([b.x + b.w / 2, b.y + b.d / 2, b.z + b.h / 2], HARDWARE_PROJECTION)
    );
    const svg = ordered
        .map(
            (part) =>
                `<g data-hardware-part="${part.id}">${solidSvg(slabOf({ x: part.x, y: part.y, w: part.w, d: part.d, r: Math.min(1.2, part.w / 5, part.d / 5) }, part.z, part.h, HARDWARE_PROJECTION, 3, 0.25), { tone: part.tone, crease: 'faint' })}</g>`
        )
        .join('');
    const screws = [
        [-46, -33, 13.4],
        [46, -33, 13.4],
        [-46, 33, 13.4],
        [46, 33, 13.4],
    ] as [number, number, number][];
    const details =
        dotsSvg(
            screws.map((point) => iso(point, HARDWARE_PROJECTION)),
            { size: 0.6, tone: 'hi' }
        ) +
        lineSvg(
            screws
                .map(([x, y, z]) => {
                    const a = iso([x - 1, y, z], HARDWARE_PROJECTION),
                        b = iso([x + 1, y, z], HARDWARE_PROJECTION);
                    return `M${a}L${b}`;
                })
                .join(''),
            { tone: 'lo' }
        );
    return { svg: svg + details, parts, port: iso([0, 47, 16], HARDWARE_PROJECTION) };
}
export const HARDWARE: Record<DeviceKind, HardwareArt> = {
    computer: build('computer'),
    server: build('server'),
    router: build('router'),
    store: build('store'),
    queue: build('queue'),
    light: build('light'),
};
