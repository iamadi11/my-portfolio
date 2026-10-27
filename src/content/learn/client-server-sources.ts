/**
 * Sources for the client-server chapter, as recorded in `docs/system-design/chapters/client-server.md` ("Sources").
 * Only records with `via: read` that support claims appear here; the search-only rfc6265bis lead supports nothing and
 * is left out. `read` says where the text was actually read (the websites were unreachable from the authoring
 * container, so the publishers' source repositories were used).
 */
import type { Source } from './web-request-sources';

/** In order of first citation on the page, so the numbers read [1], [2], … from the top. */
export const CLIENT_SERVER_SOURCES: Source[] = [
    {
        id: 'rfc9110',
        title: 'RFC 9110: HTTP Semantics (June 2022)',
        publisher: 'IETF (Fielding, Nottingham, Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9110',
        read: 'the published text as rendered by the HTTP WG (httpwg.org/specs; httpwg/httpwg.github.io @ ce03dd5)',
    },
    {
        id: 'mdn-messages',
        title: 'HTTP messages',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'rfc6265',
        title: 'RFC 6265: HTTP State Management Mechanism (April 2011)',
        publisher: 'IETF (A. Barth)',
        url: 'https://www.rfc-editor.org/rfc/rfc6265',
        read: 'the published text as rendered by the HTTP WG (httpwg/httpwg.github.io @ ce03dd5). Only the basic Set-Cookie and Cookie exchange is used; a revision that may replace RFC 6265 could not be checked',
    },
    {
        id: 'mdn-cookies',
        title: 'Using HTTP cookies',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'pg-architecture',
        title: 'PostgreSQL documentation: Architectural Fundamentals',
        publisher: 'The PostgreSQL Global Development Group',
        url: 'https://www.postgresql.org/docs/current/tutorial-arch.html',
        read: 'postgres/postgres doc/src/sgml/start.sgml, REL_18_STABLE @ 35f60e5',
    },
    {
        id: 'mdn-http-overview',
        title: 'Overview of HTTP',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'rfc9112',
        title: 'RFC 9112: HTTP/1.1 (June 2022)',
        publisher: 'IETF (Fielding, Nottingham, Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9112',
        read: 'the published text as rendered by the HTTP WG (httpwg.org/specs; httpwg/httpwg.github.io @ ce03dd5)',
    },
    {
        id: 'mdn-sse',
        title: 'Server-sent events',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-websockets',
        title: 'WebSocket API (WebSockets)',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'idempotency-key-draft',
        title: 'The Idempotency-Key HTTP Header Field (IETF Internet-Draft, work in progress)',
        publisher: 'IETF HTTPAPI WG (Jena, Dalal, Tishkin)',
        url: 'https://github.com/ietf-wg-httpapi/idempotency',
        read: "the working group's editor's copy, ietf-wg-httpapi/idempotency @ a2cd12a (2026-10-22); section numbers from that copy",
    },
];

export const CLIENT_SERVER_SOURCE_NUMBER: Readonly<Record<string, number>> = Object.fromEntries(
    CLIENT_SERVER_SOURCES.map((s, i) => [s.id, i + 1])
);
