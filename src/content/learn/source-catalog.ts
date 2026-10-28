import { CLIENT_SERVER_SOURCE_NUMBER, CLIENT_SERVER_SOURCES } from './client-server-sources';
import { CLOUD_NETWORKING_SOURCE_NUMBER, CLOUD_NETWORKING_SOURCES } from './cloud-networking-sources';
import { DNS_SOURCE_NUMBER, DNS_SOURCES } from './dns-sources';
import { ESTIMATION_SOURCE_NUMBER, ESTIMATION_SOURCES } from './estimation-sources';
import { HTTP_SOURCE_NUMBER, HTTP_SOURCES } from './http-sources';
import { HTTP_VERSIONS_SOURCE_NUMBER, HTTP_VERSIONS_SOURCES } from './http-versions-sources';
import { IP_PORTS_SOURCE_NUMBER, IP_PORTS_SOURCES } from './ip-and-ports-sources';
import { LATENCY_NUMBERS_SOURCE_NUMBER, LATENCY_NUMBERS_SOURCES } from './latency-numbers-sources';
import { LATENCY_SOURCE_NUMBER, LATENCY_SOURCES } from './latency-sources';
import { PERCENTILE_SOURCE_NUMBER, PERCENTILE_SOURCES } from './percentile-sources';
import { TCP_SOURCE_NUMBER, TCP_SOURCES } from './tcp-sources';
import { TLS_SOURCE_NUMBER, TLS_SOURCES } from './tls-sources';
import { UDP_QUIC_SOURCE_NUMBER, UDP_QUIC_SOURCES } from './udp-quic-sources';
import {
    UTILISATION_QUEUEING_SOURCE_NUMBER,
    UTILISATION_QUEUEING_SOURCES,
} from './utilisation-queueing-sources';
import { SOURCE_NUMBER, SOURCES, type Source } from './web-request-sources';

/**
 * Learner-facing source lists. One page (`/learn/sources`) holds every chapter's list.
 * Numbers stay per chapter, in citation order, so a mark on a chapter matches this list.
 * The chapter spec under `docs/system-design/chapters/` remains the author record.
 */

export type SourceChapter = {
    id: string;
    title: string;
    href: string;
    /** How those sources were read. Moved off the chapter page; facts unchanged. */
    note: string;
    sources: readonly Source[];
    numbers: Readonly<Record<string, number>>;
};

export const SOURCE_CHAPTERS: readonly SourceChapter[] = [
    {
        id: 'web-request',
        title: 'What happens when you open a website',
        href: '/learn/web-request',
        note: 'The parts of each source cited in that chapter were read in the project’s public source repository (the websites were unreachable when the chapter was written); links point to the published versions. RFC 9110 and RFC 9111 section numbers were checked against the published RFC text as the HTTP Working Group publishes it (httpwg.org/specs). RFC 9846’s were checked only against the TLS Working Group’s final source file, not the published RFC, which could not be reached. MDN content is by Mozilla contributors under CC-BY-SA 2.5 and is paraphrased, not copied.',
        sources: SOURCES,
        numbers: SOURCE_NUMBER,
    },
    {
        id: 'client-server',
        title: 'Clients, servers and request–response',
        href: '/learn/client-server',
        note: 'Each source’s cited parts were read; links point to the published versions. RFC 9110, RFC 9112 and RFC 6265 were read in the published text as the HTTP Working Group publishes it (httpwg.org/specs); rfc-editor.org was unreachable. The Idempotency-Key field is an IETF Internet-Draft, read in the working group’s editor’s copy; its section numbers are from that copy. MDN content is by Mozilla contributors under CC-BY-SA 2.5 and is paraphrased, not copied.',
        sources: CLIENT_SERVER_SOURCES,
        numbers: CLIENT_SERVER_SOURCE_NUMBER,
    },
    {
        id: 'ip-and-ports',
        title: 'Addresses, packets and ports',
        href: '/learn/ip-and-ports',
        note: 'Each source’s cited parts were read. The RFCs were read in their published text from Ubuntu’s doc-rfc package (January 2023 snapshot), because rfc-editor.org was unreachable; their status (none is obsoleted) is as of that snapshot.',
        sources: IP_PORTS_SOURCES,
        numbers: IP_PORTS_SOURCE_NUMBER,
    },
    {
        id: 'dns',
        title: 'DNS: from names to addresses',
        href: '/learn/dns',
        note: 'RFC 1034 was read from the published text at rfc-editor.org on 2026-10-28. The chapter cites §3.7, §4.1 and §5.3.3 of that text.',
        sources: DNS_SOURCES,
        numbers: DNS_SOURCE_NUMBER,
    },
    {
        id: 'estimation',
        title: 'Back-of-envelope estimation',
        href: '/learn/estimation',
        note: 'The Google SRE workbook chapter Introducing Non-Abstract Large System Design was fetched from sre.google/workbook/non-abstract-design/ on 2026-10-29. The notebook inputs are assumptions. A day is 86,400 seconds, from 24×60×60.',
        sources: ESTIMATION_SOURCES,
        numbers: ESTIMATION_SOURCE_NUMBER,
    },
    {
        id: 'latency-throughput',
        title: 'Latency and throughput',
        href: '/learn/latency-throughput',
        note: 'RFC 1242 and RFC 5136 were read from the published text at rfc-editor.org on 2026-10-28. The chapter cites RFC 1242 §3.8 and §3.17, and RFC 5136 §2.2, §2.3.2, and §3.4.',
        sources: LATENCY_SOURCES,
        numbers: LATENCY_SOURCE_NUMBER,
    },
    {
        id: 'percentiles',
        title: 'Percentiles and tail latency',
        href: '/learn/percentiles',
        note: 'NIST/SEMATECH e-Handbook section 7.2.6.2 and Dean and Barroso, The Tail at Scale (CACM, February 2013) were fetched and read on 2026-10-29. The pin durations in the model are assumptions. The rank uses the handbook default estimate, which that page identifies as Hyndman and Fan R6.',
        sources: PERCENTILE_SOURCES,
        numbers: PERCENTILE_SOURCE_NUMBER,
    },
    {
        id: 'latency-numbers',
        title: 'Where time goes: memory, disk and network',
        href: '/learn/latency-numbers',
        note: 'Norvig’s Answers table was fetched from norvig.com/21-days.html on 2026-10-29. The SSD random read is Colin Scott’s script constant of 16,000 ns, read from the raw interactive_latency.html the same day. The published Scott page was fetched and its conversion omitted the script.',
        sources: LATENCY_NUMBERS_SOURCES,
        numbers: LATENCY_NUMBERS_SOURCE_NUMBER,
    },
    {
        id: 'tcp',
        title: 'TCP: reliable streams over unreliable packets',
        href: '/learn/tcp',
        note: 'RFC 9293 was read from the published text at rfc-editor.org on 2026-10-28. RFC 6298 was not read, so the resend wait in the model is an assumption.',
        sources: TCP_SOURCES,
        numbers: TCP_SOURCE_NUMBER,
    },
    {
        id: 'tls',
        title: 'TLS: encrypted, authenticated connections',
        href: '/learn/tls',
        note: 'RFC 8446 was read from the published text at rfc-editor.org on 2026-10-29. The chapter cites the sections listed in the chapter spec. RFC 6066, RFC 5280, and RFC 5116 were not read.',
        sources: TLS_SOURCES,
        numbers: TLS_SOURCE_NUMBER,
    },
    {
        id: 'http',
        title: 'HTTP: methods, status codes and headers',
        href: '/learn/http',
        note: 'RFC 9110 was read from the published text at rfc-editor.org on 2026-10-29. The chapter cites the sections listed in the chapter spec.',
        sources: HTTP_SOURCES,
        numbers: HTTP_SOURCE_NUMBER,
    },
    {
        id: 'http-versions',
        title: 'HTTP/1.1, HTTP/2 and HTTP/3',
        href: '/learn/http-versions',
        note: 'RFC 9112, RFC 9113, and RFC 9114 were read from the published text at rfc-editor.org on 2026-10-29. RFC 9000 was not fetched again for this chapter. Which carrier is lost, and the tick lengths, are assumptions.',
        sources: HTTP_VERSIONS_SOURCES,
        numbers: HTTP_VERSIONS_SOURCE_NUMBER,
    },
    {
        id: 'udp-quic',
        title: 'UDP and QUIC: when TCP is not the answer',
        href: '/learn/udp-quic',
        note: 'RFC 9000 and RFC 768 were read from the published text at rfc-editor.org on 2026-10-29. RFC 9001 and RFC 9002 were not read. The lost packet, the gap, and the flight time are assumptions.',
        sources: UDP_QUIC_SOURCES,
        numbers: UDP_QUIC_SOURCE_NUMBER,
    },
    {
        id: 'cloud-networking',
        title: 'Networks inside a cloud: VPCs, subnets and NAT',
        href: '/learn/cloud-networking',
        note: 'RFC 1918, RFC 5737, and RFC 3022 were read from the published text at rfc-editor.org on 2026-10-29. No vendor VPC document was read. Letting the documentation address in the open yard arrive, and stopping the unsolicited private packet on this wall, are this model’s rules.',
        sources: CLOUD_NETWORKING_SOURCES,
        numbers: CLOUD_NETWORKING_SOURCE_NUMBER,
    },
    {
        id: 'utilisation-queueing',
        title: "Utilisation, queues and Little's law",
        href: '/learn/utilisation-queueing',
        note: 'Little’s 1961 abstract was fetched on 2026-10-29; the proof was not in that page. Sigman’s 2009 note was fetched the same day, §1.1 and §1.2 through the FIFO M/M/1 case. Arrival rates of 5 and 9 per second, and a service rate of 10 per second, are assumptions. The row draws the rounded mean number waiting.',
        sources: UTILISATION_QUEUEING_SOURCES,
        numbers: UTILISATION_QUEUEING_SOURCE_NUMBER,
    },
];

/** Anchor for one source on `/learn/sources`. Unique across chapters: the same RFC is listed once per chapter. */
export function sourceAnchor(chapterId: string, sourceId: string): string {
    return `src-${chapterId}-${sourceId}`;
}
