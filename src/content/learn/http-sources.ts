/**
 * Sources for the http chapter, as recorded in `docs/system-design/chapters/http.md` ("Sources").
 * RFC 9110 was read from the published text at rfc-editor.org on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const HTTP_SOURCES: Source[] = [
    {
        id: 'rfc9110',
        title: 'RFC 9110: HTTP Semantics (June 2022)',
        publisher: 'IETF (R. Fielding, M. Nottingham, J. Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9110',
        read: 'published text at rfc-editor.org/rfc/rfc9110.txt, fetched 2026-10-29',
    },
];

export const HTTP_SOURCE_NUMBER: Readonly<Record<string, number>> = { rfc9110: 1 };
