/**
 * Sources for the utilisation-queueing chapter, as recorded in
 * `docs/system-design/chapters/utilisation-queueing.md` ("Sources").
 * Both texts were fetched and read on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const UTILISATION_QUEUEING_SOURCES: Source[] = [
    {
        id: 'little-1961',
        title: 'A Proof for the Queuing Formula: L = λW (Operations Research, 1961)',
        publisher: 'INFORMS (John D. C. Little)',
        url: 'https://pubsonline.informs.org/doi/pdf/10.1287/opre.9.3.383',
        read: 'INFORMS article page fetched 2026-10-29 from the pdf URL; the Abstract. The proof in the paper body was not in the fetched page.',
    },
    {
        id: 'sigman-littles-law',
        title: 'Notes on Little’s Law (l = λw)',
        publisher: 'Columbia University (Karl Sigman, 2009)',
        url: 'https://www.columbia.edu/~ks20/stochastic-I/stochastic-I-LL.pdf',
        read: 'note fetched 2026-10-29; §1.1 Theorem 1.1 and §1.2 through the FIFO M/M/1 application',
    },
];

export const UTILISATION_QUEUEING_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    'little-1961': 1,
    'sigman-littles-law': 2,
};
