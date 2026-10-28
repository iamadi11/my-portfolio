/**
 * Sources for the tls chapter, as recorded in `docs/system-design/chapters/tls.md` ("Sources").
 * RFC 8446 was read from the published text at rfc-editor.org on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const TLS_SOURCES: Source[] = [
    {
        id: 'rfc8446',
        title: 'RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3 (August 2018)',
        publisher: 'IETF (E. Rescorla)',
        url: 'https://www.rfc-editor.org/rfc/rfc8446',
        read: 'published text at rfc-editor.org/rfc/rfc8446.txt, fetched 2026-10-29',
    },
];

export const TLS_SOURCE_NUMBER: Readonly<Record<string, number>> = { rfc8446: 1 };
