/**
 * Sources for the api-design chapter, as recorded in
 * `docs/system-design/chapters/api-design.md` ("Sources").
 * The text was fetched and read on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const API_DESIGN_SOURCES: Source[] = [
    {
        id: 'rfc9110',
        title: 'RFC 9110: HTTP Semantics (June 2022)',
        publisher: 'IETF (R. Fielding, M. Nottingham, J. Reschke, eds.)',
        url: 'https://www.rfc-editor.org/rfc/rfc9110',
        read: 'rfc-editor.org/rfc/rfc9110.txt fetched 2026-10-29. Read §1.1, §1.2, §1.3, §2.4, §3.1, §3.2, §3.3, §3.4, §3.5 (opening), §6.2, §6.3, §6.4 (opening), §7.1, §7.2 (opening), §9.1, §9.2.1 (through the safe/unsafe distinction), §9.3.1, §15 (introduction), §15.1, §15.2 (opening), §15.3, §15.3.1, §15.3.2 (opening), §15.5, §15.5.1, §15.5.2, §15.5.3, §15.5.4, §15.5.5, §15.5.6, §15.5.7 (opening). Section numbers are from that file.',
    },
];

export const API_DESIGN_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    rfc9110: 1,
};
