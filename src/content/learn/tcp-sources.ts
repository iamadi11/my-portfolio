/**
 * Sources for the tcp chapter, as recorded in `docs/system-design/chapters/tcp.md` ("Sources").
 * RFC 9293 was read from the published text at rfc-editor.org on 2026-10-28.
 */
import type { Source } from './web-request-sources';

export const TCP_SOURCES: Source[] = [
    {
        id: 'rfc9293',
        title: 'RFC 9293: Transmission Control Protocol (TCP) (August 2022)',
        publisher: 'IETF (W. Eddy, ed.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9293',
        read: 'published text at rfc-editor.org/rfc/rfc9293.txt, fetched 2026-10-28',
    },
];

export const TCP_SOURCE_NUMBER: Readonly<Record<string, number>> = { rfc9293: 1 };
