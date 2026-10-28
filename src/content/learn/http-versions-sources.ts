/**
 * Sources for the http-versions chapter, as recorded in
 * `docs/system-design/chapters/http-versions.md` ("Sources").
 * RFC 9112, RFC 9113, and RFC 9114 were read from the published text
 * at rfc-editor.org on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const HTTP_VERSIONS_SOURCES: Source[] = [
    {
        id: 'rfc9114',
        title: 'RFC 9114: HTTP/3 (June 2022)',
        publisher: 'IETF (M. Bishop, ed.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9114',
        read: 'published text at rfc-editor.org/rfc/rfc9114.txt, fetched 2026-10-29',
    },
    {
        id: 'rfc9112',
        title: 'RFC 9112: HTTP/1.1 (June 2022)',
        publisher: 'IETF (R. Fielding, M. Nottingham, J. Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9112',
        read: 'published text at rfc-editor.org/rfc/rfc9112.txt, fetched 2026-10-29',
    },
    {
        id: 'rfc9113',
        title: 'RFC 9113: HTTP/2 (June 2022)',
        publisher: 'IETF (M. Thomson, C. Benfield, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9113',
        read: 'published text at rfc-editor.org/rfc/rfc9113.txt, fetched 2026-10-29',
    },
];

export const HTTP_VERSIONS_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    rfc9114: 1,
    rfc9112: 2,
    rfc9113: 3,
};
