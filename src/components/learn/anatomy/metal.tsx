import React from 'react';

import {
    cylinder,
    fitProjection,
    iso,
    slabOf,
    topTicks,
    type Plan,
    type Point3,
    type Projection,
    type SolidPaths,
} from '../../../../.claude/skills/anatomy/kit/iso-kit';

export { cylinder, iso, topTicks };
export type { Plan, Point3, Projection };

/** One Anatomy solid. No client hooks, so a server chapter can paint it. */
export function Metal({
    paths,
    part,
    lit = false,
    kind,
}: {
    paths: SolidPaths;
    part?: string;
    lit?: boolean;
    kind?: string;
}): React.JSX.Element {
    return (
        <g className="iso-solid" data-part={part} data-lit={lit ? '' : undefined} data-kind={kind}>
            <path className="iso-fill" d={paths.fill} />
            {paths.shades.map((d, shade) =>
                d ? <path key={d.slice(0, 32)} className="iso-shade" data-shade={shade} d={d} /> : null
            )}
            <path className="iso-top" d={paths.top} />
            {paths.crease ? (
                <path className="iso-line iso-crease" data-tone="faint" d={paths.crease} />
            ) : null}
            <path className="iso-line iso-edge" data-tone={lit ? 'lit' : 'hi'} d={paths.outline} />
        </g>
    );
}

export function fit(points: Point3[], width: number, height: number): Projection {
    return fitProjection(points, width, height, { pad: 32, azimuth: 52, elevation: 34 });
}

export function block(plan: Plan, z: number, height: number, projection: Projection): SolidPaths {
    return slabOf(plan, z, height, projection, 6, 0.8);
}

/** Screen move from a rest pose to a world pose. The group's geometry stays at rest. */
export function place(rest: Point3, at: Point3, projection: Projection): string {
    const from = iso(rest, projection);
    const to = iso(at, projection);
    return `translate(${(to[0] - from[0]).toFixed(2)} ${(to[1] - from[1]).toFixed(2)})`;
}

export function corners(plans: { plan: Plan; z: number; h: number }[]): Point3[] {
    const out: Point3[] = [];
    for (const { plan, z, h } of plans) {
        out.push([plan.x, plan.y, z], [plan.x + plan.w, plan.y + plan.d, z + h]);
    }
    return out;
}
