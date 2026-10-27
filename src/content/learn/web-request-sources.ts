/**
 * Sources for the web-request chapter, as recorded in `docs/system-design/chapters/web-request.md` ("Sources"). Only
 * records with `via: read` that support claims appear here; the RFC 1034 / RFC 9293 leads support nothing and are
 * left out. `read` says where the text was actually read (the websites were unreachable from the authoring
 * container, so each project's public source repository was used).
 */
/** In order of first citation on the page, so the numbers read [1], [2], … from the top. */
export type Source = { id: string; title: string; publisher: string; url: string; read: string };

export const SOURCES: Source[] = [
    {
        id: 'rfc9110',
        title: 'RFC 9110: HTTP Semantics (June 2022)',
        publisher: 'IETF (Fielding, Nottingham, Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9110',
        read: 'httpwg/http-core rfc9110.xml @ bde37f6',
    },
    {
        id: 'mdn-url',
        title: 'What is a URL?',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-dns',
        title: 'DNS (glossary)',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/DNS',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'rfc9846',
        title: 'RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3 (July 2026; obsoletes RFC 8446)',
        publisher: 'IETF (E. Rescorla)',
        url: 'https://www.rfc-editor.org/rfc/rfc9846',
        read: 'tlswg/tls13-spec rfc9846.md @ c728b4e; section numbers from that file',
    },
    {
        id: 'mdn-http-overview',
        title: 'Overview of HTTP',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-tcp-handshake',
        title: 'TCP handshake (glossary)',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/TCP_handshake',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-rtt',
        title: 'Round Trip Time (RTT) (glossary)',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Round_Trip_Time',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-how-browsers-work',
        title: 'Populating the page: how browsers work',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work',
        read: 'mdn/content @ bd7387a. Its TLS round-trip counts describe older TLS and are not used here.',
    },
    {
        id: 'rfc9111',
        title: 'RFC 9111: HTTP Caching (June 2022)',
        publisher: 'IETF (Fielding, Nottingham, Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9111',
        read: 'httpwg/http-core rfc9111.xml @ bde37f6',
    },
    {
        id: 'mdn-crp',
        title: 'Critical rendering path',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'navtiming-2',
        title: 'Navigation Timing Level 2 (Editor’s Draft)',
        publisher: 'W3C Web Performance Working Group',
        url: 'https://w3c.github.io/navigation-timing/',
        read: 'w3c/navigation-timing @ 245fee2',
    },
    {
        id: 'mdn-nav-timing',
        title: 'Navigation timing',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing',
        read: 'mdn/content @ bd7387a',
    },
    {
        id: 'mdn-prt',
        title: 'PerformanceResourceTiming',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming',
        read: 'mdn/content @ bd7387a. Its "TCP = connectEnd − connectStart" shortcut includes TLS on https pages.',
    },
    {
        id: 'fetch',
        title: 'Fetch Standard: record connection timing info; clamp and coarsen connection timing info',
        publisher: 'WHATWG',
        url: 'https://fetch.spec.whatwg.org/',
        read: 'whatwg/fetch @ 59afe34',
    },
    {
        id: 'mdn-caching',
        title: 'HTTP caching',
        publisher: 'MDN Web Docs',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching',
        read: 'mdn/content @ bd7387a',
    },
];

export const SOURCE_NUMBER: Readonly<Record<string, number>> = Object.fromEntries(
    SOURCES.map((s, i) => [s.id, i + 1])
);
