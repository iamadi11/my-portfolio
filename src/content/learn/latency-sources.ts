/**
 * Sources for the latency-throughput chapter, as recorded in
 * `docs/system-design/chapters/latency-throughput.md` ("Sources").
 * Both RFCs were read from the published text at rfc-editor.org on 2026-10-28.
 */
import type { Source } from './web-request-sources';

export const LATENCY_SOURCES: Source[] = [
    {
        id: 'rfc1242',
        title: 'RFC 1242: Benchmarking Terminology for Network Interconnection Devices (July 1991)',
        publisher: 'IETF (S. Bradner, editor)',
        url: 'https://www.rfc-editor.org/rfc/rfc1242',
        read: 'published text at rfc-editor.org, fetched 2026-10-28; §3.8 and §3.17',
    },
    {
        id: 'rfc5136',
        title: 'RFC 5136: Defining Network Capacity (February 2008)',
        publisher: 'IETF (P. Chimento, J. Ishac)',
        url: 'https://www.rfc-editor.org/rfc/rfc5136',
        read: 'published text at rfc-editor.org, fetched 2026-10-28; §2.2, §2.3.2, and §3.4',
    },
];

export const LATENCY_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    rfc1242: 1,
    rfc5136: 2,
};
