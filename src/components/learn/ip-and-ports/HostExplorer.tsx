import React from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import { SERVER } from '@/lib/learn/demux-model';

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
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 360" aria-hidden="true">
            <defs>
                <Arrowhead id="fig1-arrow" />
            </defs>
            <g className="ln-part" data-part="name">
                <rect x={98} y={4} width={144} height={26} rx={13} className="nb" />
                <text x={170} y={22} textAnchor="middle" className="dts">
                    www.example.com
                </text>
            </g>
            <line x1={170} y1={30} x2={170} y2={86} className="thin ln-skip" markerEnd="url(#fig1-arrow)" />
            <text x={162} y={52} textAnchor="end" className="sl">
                name → address
            </text>
            <text x={162} y={68} textAnchor="end" className="sl">
                (dns, chapter 4)
            </text>
            <rect x={14} y={100} width={312} height={250} rx={6} className="obj" />
            <g className="ln-part" data-part="address">
                <rect x={110} y={88} width={120} height={26} rx={3} className="nb" />
                <text x={170} y={106} textAnchor="middle" className="dts">
                    {SERVER}
                </text>
            </g>
            <text x={238} y={66} className="dts">
                32 bits
            </text>
            <text x={238} y={82} className="dts">
                (IPv6: 128)
            </text>
            {(
                [
                    { x: 28, proto: 'TCP', port: '443', prog: ['web', 'server'] },
                    { x: 178, proto: 'UDP', port: '8125', prog: ['metrics', 'collector'] },
                ] as const
            ).map((l) => (
                <g key={l.proto}>
                    <rect
                        x={l.x}
                        y={130}
                        width={134}
                        height={208}
                        rx={4}
                        className="well ln-part"
                        data-part="protocol"
                    />
                    <text x={l.x + 67} y={154} textAnchor="middle" className="vt">
                        {l.proto}
                    </text>
                    <rect
                        x={l.x + 37}
                        y={170}
                        width={60}
                        height={26}
                        rx={3}
                        className="nb ln-part"
                        data-part="port"
                    />
                    <text x={l.x + 67} y={188} textAnchor="middle" className="dts">
                        {l.port}
                    </text>
                    <line x1={l.x + 67} y1={196} x2={l.x + 67} y2={222} className="thin" />
                    <rect
                        x={l.x + 17}
                        y={222}
                        width={100}
                        height={44}
                        rx={4}
                        className="obj ln-part"
                        data-part="program"
                    />
                    <text x={l.x + 67} y={240} textAnchor="middle" className="sl">
                        {l.prog[0]}
                    </text>
                    <text x={l.x + 67} y={256} textAnchor="middle" className="sl">
                        {l.prog[1]}
                    </text>
                    <rect x={l.x + 37} y={286} width={60} height={26} rx={3} className="slot" />
                    <text x={l.x + 67} y={304} textAnchor="middle" className="dts">
                        9000
                    </text>
                    <text x={l.x + 67} y={326} textAnchor="middle" className="sl">
                        nobody
                    </text>
                </g>
            ))}
        </svg>
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
