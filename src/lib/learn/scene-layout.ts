import { HARDWARE_PROJECTION, HARDWARE } from '@/components/anatomy/hardware';

import type { FilmNode, LessonFilmData } from './film-model';
import { iso } from '../../../.claude/skills/anatomy/kit/iso-kit';

export type ScreenPoint = [number, number];
type Rect = { left: number; right: number; top: number; bottom: number };
export const scenePoint = (x: number, y: number, z = 0): ScreenPoint => {
    const p = iso([x, y, z], HARDWARE_PROJECTION);
    return [460 + p[0], 267 + p[1]];
};
export function portPoint(node: FilmNode): ScreenPoint {
    const p = scenePoint(node.x, node.y);
    const offset = HARDWARE[node.kind].port;
    return [p[0] + offset[0], p[1] + offset[1]];
}
const footprint = (node: FilmNode): Rect => {
    const [x, y] = scenePoint(node.x, node.y);
    return { left: x - 87, right: x + 87, top: y - 125, bottom: y + 34 };
};
function blocked(a: ScreenPoint, b: ScreenPoint, rect: Rect): boolean {
    if (a[0] === b[0])
        return (
            a[0] > rect.left &&
            a[0] < rect.right &&
            Math.max(a[1], b[1]) > rect.top &&
            Math.min(a[1], b[1]) < rect.bottom
        );
    return (
        a[1] > rect.top &&
        a[1] < rect.bottom &&
        Math.max(a[0], b[0]) > rect.left &&
        Math.min(a[0], b[0]) < rect.right
    );
}
/** Orthogonal visibility-grid route outside the device silhouettes. Connector leads alone touch their own case. */
export function signalRoute(nodes: FilmNode[], from: FilmNode, to: FilmNode): ScreenPoint[] {
    const start = portPoint(from),
        finish = portPoint(to);
    const lead = (node: FilmNode): ScreenPoint => {
        const p = scenePoint(node.x, node.y);
        return [p[0] - 100, p[1] + 48];
    };
    const a = lead(from),
        b = lead(to),
        rects = nodes.map(footprint);
    const xs = [...new Set([a[0], b[0], ...rects.flatMap((r) => [r.left - 12, r.right + 12])])].sort(
        (x, y) => x - y
    );
    const ys = [...new Set([a[1], b[1], ...rects.flatMap((r) => [r.top - 12, r.bottom + 12])])].sort(
        (x, y) => x - y
    );
    const points = xs.flatMap((x) => ys.map((y) => [x, y] as ScreenPoint));
    const index = (p: ScreenPoint): number => xs.indexOf(p[0]) * ys.length + ys.indexOf(p[1]);
    const first = index(a),
        last = index(b),
        distance = new Map<number, number>([[first, 0]]),
        previous = new Map<number, number>();
    const pending = new Set([first]);
    while (pending.size) {
        let current = -1;
        for (const candidate of pending)
            if (current < 0 || distance.get(candidate)! < distance.get(current)!) current = candidate;
        pending.delete(current);
        if (current === last) break;
        const xi = Math.floor(current / ys.length),
            yi = current % ys.length;
        const neighbors = [
            [xi - 1, yi],
            [xi + 1, yi],
            [xi, yi - 1],
            [xi, yi + 1],
        ]
            .filter(([x, y]) => x >= 0 && x < xs.length && y >= 0 && y < ys.length)
            .map(([x, y]) => x * ys.length + y);
        for (const next of neighbors) {
            const p = points[current],
                q = points[next];
            if (rects.some((rect) => blocked(p, q, rect))) continue;
            const cost = distance.get(current)! + Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
            if (cost < (distance.get(next) ?? Infinity)) {
                distance.set(next, cost);
                previous.set(next, current);
                pending.add(next);
            }
        }
    }
    if (!distance.has(last))
        return [
            start,
            a,
            [a[0], Math.max(...rects.map((r) => r.bottom)) + 20],
            [b[0], Math.max(...rects.map((r) => r.bottom)) + 20],
            b,
            finish,
        ];
    const path: ScreenPoint[] = [];
    let cursor = last;
    while (cursor !== first) {
        path.unshift(points[cursor]);
        cursor = previous.get(cursor)!;
    }
    path.unshift(a);
    // Drop collinear interior points to keep the SVG small.
    const compact = path.filter(
        (p, i) =>
            i === 0 ||
            i === path.length - 1 ||
            !(
                (path[i - 1][0] === p[0] && p[0] === path[i + 1][0]) ||
                (path[i - 1][1] === p[1] && p[1] === path[i + 1][1])
            )
    );
    return [start, ...compact, finish];
}
export function routePoint(route: ScreenPoint[], progress: number): ScreenPoint {
    const lengths = route.slice(1).map((p, i) => Math.hypot(p[0] - route[i][0], p[1] - route[i][1]));
    let remaining = lengths.reduce((sum, n) => sum + n, 0) * Math.max(0, Math.min(1, progress));
    for (let i = 0; i < lengths.length; i++) {
        if (remaining <= lengths[i] || i === lengths.length - 1) {
            const f = lengths[i] ? remaining / lengths[i] : 0;
            return [
                route[i][0] + (route[i + 1][0] - route[i][0]) * f,
                route[i][1] + (route[i + 1][1] - route[i][1]) * f,
            ];
        }
        remaining -= lengths[i];
    }
    return route[0];
}
export function responsiveFilm(film: LessonFilmData, narrow = true): LessonFilmData {
    const left = narrow ? 330 : 250,
        right = narrow ? 595 : 670;
    const count = film.nodes.length;
    const positions = !narrow
        ? count === 2
            ? [
                  [250, 200],
                  [670, 200],
              ]
            : count === 3
              ? [
                    [180, 200],
                    [460, 200],
                    [740, 200],
                ]
              : [
                    [100, 200],
                    [340, 200],
                    [580, 200],
                    [820, 200],
                ]
        : count === 2
          ? [
                [left, 260],
                [right, 260],
            ]
          : count === 3
            ? [
                  [left, 135],
                  [right, 135],
                  [460, 390],
              ]
            : [
                  [left, 135],
                  [right, 135],
                  [left, 390],
                  [right, 390],
              ];
    const unit = scenePoint(1, 0),
        origin = scenePoint(0, 0),
        sx = unit[0] - origin[0],
        sy = unit[1] - origin[1];
    return {
        ...film,
        nodes: film.nodes.map((node, i) => {
            const p = positions[i] ?? [330 + (i % 2) * 265, 145 + Math.floor(i / 2) * 200];
            const diff = (p[0] - 460) / sx,
                sum = (p[1] - 267) / sy;
            return { ...node, x: (sum + diff) / 2, y: (sum - diff) / 2 };
        }),
    };
}
