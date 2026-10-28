/**
 * Sources for the dns chapter, as recorded in `docs/system-design/chapters/dns.md` ("Sources").
 * RFC 1034 was read from the published text at rfc-editor.org on 2026-10-28.
 */
import type { Source } from './web-request-sources';

export const DNS_SOURCES: Source[] = [
    {
        id: 'rfc1034',
        title: 'RFC 1034: Domain Names — Concepts and Facilities (November 1987)',
        publisher: 'IETF (P. Mockapetris)',
        url: 'https://www.rfc-editor.org/rfc/rfc1034',
        read: 'published text at rfc-editor.org, fetched 2026-10-28',
    },
];

export const DNS_SOURCE_NUMBER: Readonly<Record<string, number>> = { rfc1034: 1 };
