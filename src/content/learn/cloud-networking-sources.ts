/**
 * Sources for the cloud-networking chapter, as recorded in
 * `docs/system-design/chapters/cloud-networking.md` ("Sources").
 * RFC 1918, RFC 3022, and RFC 5737 were read from the published text at
 * rfc-editor.org on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const CLOUD_NETWORKING_SOURCES: Source[] = [
    {
        id: 'rfc1918',
        title: 'RFC 1918: Address Allocation for Private Internets (February 1996)',
        publisher: 'IETF (Rekhter, Moskowitz, Karrenberg, de Groot, Lear)',
        url: 'https://www.rfc-editor.org/rfc/rfc1918',
        read: 'published text at rfc-editor.org/rfc/rfc1918.txt, fetched 2026-10-29',
    },
    {
        id: 'rfc5737',
        title: 'RFC 5737: IPv4 Address Blocks Reserved for Documentation (January 2010)',
        publisher: 'IETF (Arkko, Cotton, Vegoda)',
        url: 'https://www.rfc-editor.org/rfc/rfc5737',
        read: 'published text at rfc-editor.org/rfc/rfc5737.txt, fetched 2026-10-29',
    },
    {
        id: 'rfc3022',
        title: 'RFC 3022: Traditional IP Network Address Translator (Traditional NAT) (January 2001)',
        publisher: 'IETF (Srisuresh, Egevang)',
        url: 'https://www.rfc-editor.org/rfc/rfc3022',
        read: 'published text at rfc-editor.org/rfc/rfc3022.txt, fetched 2026-10-29',
    },
];

export const CLOUD_NETWORKING_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    rfc1918: 1,
    rfc5737: 2,
    rfc3022: 3,
};
