/**
 * Sources for the ip-and-ports chapter, as recorded in `docs/system-design/chapters/ip-and-ports.md` ("Sources").
 * The RFCs were read in the published text from Ubuntu's doc-rfc package (20230121), because rfc-editor.org was
 * unreachable from the authoring container; their status is as of that snapshot.
 */
import type { Source } from './web-request-sources';

const PKG = 'the published text in Ubuntu’s doc-rfc package (20230121)';

/** In order of first citation on the page, so the numbers read [1], [2], … from the top. */
export const IP_PORTS_SOURCES: Source[] = [
    {
        id: 'rfc791',
        title: 'RFC 791: Internet Protocol (September 1981)',
        publisher: 'IETF (J. Postel, ed.)',
        url: 'https://www.rfc-editor.org/rfc/rfc791',
        read: PKG,
    },
    {
        id: 'rfc4291',
        title: 'RFC 4291: IP Version 6 Addressing Architecture (February 2006)',
        publisher: 'IETF (R. Hinden, S. Deering)',
        url: 'https://www.rfc-editor.org/rfc/rfc4291',
        read: PKG,
    },
    {
        id: 'rfc5737',
        title: 'RFC 5737: IPv4 Address Blocks Reserved for Documentation (January 2010)',
        publisher: 'IETF (J. Arkko, M. Cotton, L. Vegoda)',
        url: 'https://www.rfc-editor.org/rfc/rfc5737',
        read: PKG,
    },
    {
        id: 'rfc9293',
        title: 'RFC 9293: Transmission Control Protocol (TCP) (August 2022)',
        publisher: 'IETF (W. Eddy, ed.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9293',
        read: PKG,
    },
    {
        id: 'rfc768',
        title: 'RFC 768: User Datagram Protocol (August 1980)',
        publisher: 'IETF (J. Postel)',
        url: 'https://www.rfc-editor.org/rfc/rfc768',
        read: PKG,
    },
    {
        id: 'rfc9110',
        title: 'RFC 9110: HTTP Semantics (June 2022)',
        publisher: 'IETF (Fielding, Nottingham, Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9110',
        read: 'the published text as rendered by the HTTP WG (httpwg/httpwg.github.io @ ce03dd5)',
    },
    {
        id: 'rfc6335',
        title: 'RFC 6335: IANA Procedures for the Service Name and Transport Protocol Port Number Registry (August 2011)',
        publisher: 'IETF (M. Cotton, L. Eggert, J. Touch, M. Westerlund, S. Cheshire)',
        url: 'https://www.rfc-editor.org/rfc/rfc6335',
        read: PKG,
    },
    {
        id: 'rfc1122',
        title: 'RFC 1122: Requirements for Internet Hosts — Communication Layers (October 1989)',
        publisher: 'IETF (R. Braden, ed.)',
        url: 'https://www.rfc-editor.org/rfc/rfc1122',
        read: PKG,
    },
    {
        id: 'rfc8085',
        title: 'RFC 8085: UDP Usage Guidelines (March 2017)',
        publisher: 'IETF (L. Eggert, G. Fairhurst, G. Shepherd)',
        url: 'https://www.rfc-editor.org/rfc/rfc8085',
        read: PKG,
    },
];

export const IP_PORTS_SOURCE_NUMBER: Readonly<Record<string, number>> = Object.fromEntries(
    IP_PORTS_SOURCES.map((s, i) => [s.id, i + 1])
);
