import React from 'react';

import { SERVER } from '@/lib/learn/demux-model';

/**
 * Fig. 1 of the ip-and-ports chapter (asset A1): one server machine. The address names the machine's interface;
 * inside, the protocol lanes; on them, ports leading to programs. A picture of the idea, not a real host: the
 * caption and the definition list next to it carry the same content in text, so the drawing is aria-hidden.
 */
export default function HostDrawing(): React.JSX.Element {
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 300" aria-hidden="true">
            {/* Dimension line over the address tab: its size. */}
            <line x1={110} y1={14} x2={230} y2={14} className="dl" />
            <line x1={110} y1={8} x2={110} y2={26} className="ext" />
            <line x1={230} y1={8} x2={230} y2={26} className="ext" />
            <text x={170} y={10} textAnchor="middle" className="sl">
                32 bits (IPv6: 128)
            </text>
            <rect x={14} y={40} width={312} height={250} rx={6} className="obj" />
            <rect x={110} y={28} width={120} height={26} rx={3} className="nb" />
            <text x={170} y={46} textAnchor="middle" className="dts">
                {SERVER}
            </text>
            <text x={26} y={70} className="sl">
                address: which machine
            </text>
            {(
                [
                    { x: 28, proto: 'TCP', port: '443', prog: ['web', 'server'] },
                    { x: 178, proto: 'UDP', port: '8125', prog: ['metrics', 'collector'] },
                ] as const
            ).map((l) => (
                <g key={l.proto}>
                    <rect x={l.x} y={82} width={134} height={196} rx={4} className="well" />
                    <text x={l.x + 67} y={104} textAnchor="middle" className="vt">
                        {l.proto}
                    </text>
                    <rect x={l.x + 37} y={118} width={60} height={26} rx={3} className="nb" />
                    <text x={l.x + 67} y={136} textAnchor="middle" className="dts">
                        {l.port}
                    </text>
                    <line x1={l.x + 67} y1={144} x2={l.x + 67} y2={170} className="thin" />
                    <rect x={l.x + 17} y={170} width={100} height={44} rx={4} className="obj" />
                    <text x={l.x + 67} y={188} textAnchor="middle" className="sl">
                        {l.prog[0]}
                    </text>
                    <text x={l.x + 67} y={204} textAnchor="middle" className="sl">
                        {l.prog[1]}
                    </text>
                    <rect x={l.x + 37} y={232} width={60} height={26} rx={3} className="slot" />
                    <text x={l.x + 67} y={250} textAnchor="middle" className="dts">
                        9000
                    </text>
                    <text x={l.x + 67} y={272} textAnchor="middle" className="sl">
                        nobody
                    </text>
                </g>
            ))}
        </svg>
    );
}
