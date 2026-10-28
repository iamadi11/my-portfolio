import React from 'react';

import Arrowhead from '@/components/learn/kit/Arrowhead';
import { SERVER } from '@/lib/learn/demux-model';

/**
 * Fig. 1 of the ip-and-ports chapter (asset A1): a name, and the server machine it leads to. The name is what we
 * seek; the address names the machine's interface (where it is); inside, the protocol lanes; on them, ports leading to programs. A picture of the idea, not a real host: the
 * caption and the definition list next to it carry the same content in text, so the drawing is aria-hidden.
 */
export default function HostDrawing(): React.JSX.Element {
    return (
        <svg className="bp-svg ln-svg" viewBox="0 0 340 360" aria-hidden="true">
            <defs>
                <Arrowhead id="fig1-arrow" />
            </defs>
            {/* The name: what we seek. A lookup (DNS, chapter 4) turns it into the address. */}
            <rect x={98} y={4} width={144} height={26} rx={13} className="nb" />
            <text x={170} y={22} textAnchor="middle" className="dts">
                www.example.com
            </text>
            <line x1={170} y1={30} x2={170} y2={86} className="thin ln-skip" markerEnd="url(#fig1-arrow)" />
            <text x={178} y={52} className="sl">
                name → address
            </text>
            <text x={178} y={68} className="sl">
                (dns, chapter 4)
            </text>
            <rect x={14} y={100} width={312} height={250} rx={6} className="obj" />
            <rect x={110} y={88} width={120} height={26} rx={3} className="nb" />
            <text x={170} y={106} textAnchor="middle" className="dts">
                {SERVER}
            </text>
            {/* The address's size, beside its tab. */}
            <text x={238} y={98} className="dts">
                32 bits
            </text>
            <text x={238} y={114} className="dts">
                IPv6: 128
            </text>
            <text x={26} y={130} className="sl">
                address: which machine
            </text>
            {(
                [
                    { x: 28, proto: 'TCP', port: '443', prog: ['web', 'server'] },
                    { x: 178, proto: 'UDP', port: '8125', prog: ['metrics', 'collector'] },
                ] as const
            ).map((l) => (
                <g key={l.proto}>
                    <rect x={l.x} y={142} width={134} height={196} rx={4} className="well" />
                    <text x={l.x + 67} y={164} textAnchor="middle" className="vt">
                        {l.proto}
                    </text>
                    <rect x={l.x + 37} y={178} width={60} height={26} rx={3} className="nb" />
                    <text x={l.x + 67} y={196} textAnchor="middle" className="dts">
                        {l.port}
                    </text>
                    <line x1={l.x + 67} y1={204} x2={l.x + 67} y2={230} className="thin" />
                    <rect x={l.x + 17} y={230} width={100} height={44} rx={4} className="obj" />
                    <text x={l.x + 67} y={248} textAnchor="middle" className="sl">
                        {l.prog[0]}
                    </text>
                    <text x={l.x + 67} y={264} textAnchor="middle" className="sl">
                        {l.prog[1]}
                    </text>
                    <rect x={l.x + 37} y={292} width={60} height={26} rx={3} className="slot" />
                    <text x={l.x + 67} y={310} textAnchor="middle" className="dts">
                        9000
                    </text>
                    <text x={l.x + 67} y={332} textAnchor="middle" className="sl">
                        nobody
                    </text>
                </g>
            ))}
        </svg>
    );
}
