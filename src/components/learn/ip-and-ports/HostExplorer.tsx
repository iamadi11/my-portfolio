import React from 'react';

import { SERVER } from '@/lib/learn/demux-model';

import { block, corners, fit, Metal } from '../anatomy/metal';

/**
 * Fig. 1 of the ip-and-ports chapter (asset A1, pattern `explore`): select a part (name, address, protocol, port,
 * program) to see it drawn heavy in the host and read its role. Native radio buttons and CSS `:has()` only: no
 * JavaScript, so it works before anything loads. A picture of the idea, not a real host.
 */

export type Part = 'name' | 'address' | 'protocol' | 'port' | 'program';
const PARTS: { id: Part; label: string }[] = [
    { id: 'name', label: 'Name' },
    { id: 'address', label: 'Address' },
    { id: 'protocol', label: 'Protocol' },
    { id: 'port', label: 'Port' },
    { id: 'program', label: 'Program' },
];

function Drawing(): React.JSX.Element {
    const name = { plan: { x: 48, y: 78, w: 70, d: 16, r: 2 }, z: 28, h: 4 };
    const address = { plan: { x: 36, y: -8, w: 94, d: 14, r: 1 }, z: 22, h: 5 };
    const chassis = { plan: { x: 8, y: -36, w: 150, d: 108, r: 4 }, z: 0, h: 22 };
    const bays = [0, 1].map((i) => ({
        plan: { x: 22 + i * 62, y: -22, w: 52, d: 78, r: 2 },
        z: 22,
        h: 8,
    }));
    const ports = bays.map((bay) => ({
        plan: { x: bay.plan.x + 12, y: bay.plan.y + 46, w: 28, d: 14, r: 1 },
        z: 30,
        h: 6,
    }));
    const programs = bays.map((bay) => ({
        plan: { x: bay.plan.x + 8, y: bay.plan.y + 8, w: 36, d: 28, r: 1 },
        z: 30,
        h: 8,
    }));
    const empty = { plan: { x: 108, y: -28, w: 36, d: 16, r: 1 }, z: 22, h: 3 };
    const screws = [
        { x: 14, y: 64 },
        { x: 140, y: 64 },
        { x: 14, y: -28 },
        { x: 140, y: -28 },
    ].map((p) => ({ plan: { x: p.x, y: p.y, w: 6, d: 6, r: 3 }, z: 22, h: 2 }));
    const projection = fit(
        corners([name, address, chassis, ...bays, ...ports, ...programs, empty, ...screws]),
        720,
        420
    );
    const draw = (spec: { plan: typeof chassis.plan; z: number; h: number }, part?: string) => (
        <Metal
            key={part ?? `${spec.plan.x}-${spec.plan.y}`}
            part={part}
            paths={block(spec.plan, spec.z, spec.h, projection)}
        />
    );
    return (
        <div className="iso" data-theme="light">
            <svg className="iso-svg" viewBox="0 0 720 420" aria-hidden="true">
                <title>{`Host ${SERVER}. Name, address, protocol, port, program. The selected part is drawn heavy.`}</title>
                {screws.map((screw) => draw(screw))}
                {draw(chassis)}
                {draw(name, 'name')}
                {draw(address, 'address')}
                {bays.map((bay) => (
                    <Metal
                        key={`bay-${bay.plan.x}`}
                        part="protocol"
                        paths={block(bay.plan, bay.z, bay.h, projection)}
                    />
                ))}
                {ports.map((port) => (
                    <Metal
                        key={`port-${port.plan.x}`}
                        part="port"
                        paths={block(port.plan, port.z, port.h, projection)}
                    />
                ))}
                {programs.map((program) => (
                    <Metal
                        key={`prog-${program.plan.x}`}
                        part="program"
                        paths={block(program.plan, program.z, program.h, projection)}
                    />
                ))}
                {draw(empty)}
            </svg>
        </div>
    );
}

/** `roles` holds each part's role text (with citations), written by the page. */
export default function HostExplorer({ roles }: { roles: Record<Part, React.ReactNode> }): React.JSX.Element {
    return (
        <figure className="bp-sheet ln-fig ln-explore" aria-labelledby="fig1-h">
            <div className="ln-fig-head">
                <span id="fig1-h">Fig. 1 · Name, address, protocol, port, program</span>
                <span>A picture of the idea, not a real host</span>
            </div>
            <div className="ln-fig-grid">
                <div className="ln-controls">
                    <fieldset>
                        <legend>Select a part</legend>
                        <div className="ln-seg">
                            {PARTS.map((p, i) => (
                                <label key={p.id}>
                                    <input
                                        type="radio"
                                        name="fig1-part"
                                        value={p.id}
                                        defaultChecked={i === 0}
                                        aria-describedby={`fig1-role-${p.id}`}
                                    />
                                    {p.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    {PARTS.map((p) => (
                        <div key={p.id} id={`fig1-role-${p.id}`} className="ln-role" data-part={p.id}>
                            {roles[p.id]}
                        </div>
                    ))}
                </div>
                <Drawing />
            </div>
        </figure>
    );
}
