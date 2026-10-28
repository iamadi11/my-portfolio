/**
 * Sources for the estimation chapter, as recorded in
 * `docs/system-design/chapters/estimation.md` ("Sources").
 * The workbook chapter was fetched and read on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const ESTIMATION_SOURCES: Source[] = [
    {
        id: 'sre-nalsd',
        title: 'Introducing Non-Abstract Large System Design',
        publisher:
            'Google SRE workbook, chapter 12 (Virji, Youngman, Robertson, Thorne, Rensin, Egyed, with Bondi)',
        url: 'https://sre.google/workbook/non-abstract-design/',
        read: 'sre.google/workbook/non-abstract-design/ fetched 2026-10-29; What Is NALSD, Why Non-Abstract, AdWords Example (Initial Requirements, One Machine Calculations, LogJoiner Calculations, Multidatacenter Calculations)',
    },
];

export const ESTIMATION_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    'sre-nalsd': 1,
};
