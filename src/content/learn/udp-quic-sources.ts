/**
 * Sources for the udp-quic chapter, as recorded in `docs/system-design/chapters/udp-quic.md` ("Sources").
 * RFC 9000 and RFC 768 were read from the published text at rfc-editor.org on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const UDP_QUIC_SOURCES: Source[] = [
    {
        id: 'rfc9000',
        title: 'RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport (May 2021)',
        publisher: 'IETF (J. Iyengar, M. Thomson, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9000',
        read: 'published text at rfc-editor.org/rfc/rfc9000.txt, fetched 2026-10-29',
    },
    {
        id: 'rfc768',
        title: 'RFC 768: User Datagram Protocol (28 August 1980)',
        publisher: 'IETF (J. Postel)',
        url: 'https://www.rfc-editor.org/rfc/rfc768',
        read: 'published text at rfc-editor.org/rfc/rfc768.txt, fetched 2026-10-29',
    },
];

export const UDP_QUIC_SOURCE_NUMBER: Readonly<Record<string, number>> = { rfc9000: 1, rfc768: 2 };
