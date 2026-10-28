/**
 * Sources for the percentiles chapter, as recorded in
 * `docs/system-design/chapters/percentiles.md` ("Sources").
 * Both texts were fetched and read on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const PERCENTILE_SOURCES: Source[] = [
    {
        id: 'nist-percentile',
        title: 'NIST/SEMATECH e-Handbook of Statistical Methods, section 7.2.6.2, Percentiles',
        publisher: 'NIST / SEMATECH',
        url: 'https://www.itl.nist.gov/div898/handbook/prc/section2/prc262.htm',
        read: 'published handbook page fetched 2026-10-29 from itl.nist.gov; section 7.2.6.2',
    },
    {
        id: 'tail-at-scale',
        title: 'The Tail at Scale (Communications of the ACM, February 2013)',
        publisher: 'ACM (Jeffrey Dean and Luiz André Barroso)',
        url: 'https://cacm.acm.org/research/the-tail-at-scale/',
        read: 'CACM article page fetched 2026-10-29; the section Component-Level Variability Amplified By Scale',
    },
];

export const PERCENTILE_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    'nist-percentile': 1,
    'tail-at-scale': 2,
};
