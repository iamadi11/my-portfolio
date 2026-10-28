/**
 * Sources for the latency-numbers chapter, as recorded in
 * `docs/system-design/chapters/latency-numbers.md` ("Sources").
 * Both texts were fetched and read on 2026-10-29.
 */
import type { Source } from './web-request-sources';

export const LATENCY_NUMBERS_SOURCES: Source[] = [
    {
        id: 'norvig-latency',
        title: 'Teach Yourself Programming in Ten Years, section Answers',
        publisher: 'Peter Norvig',
        url: 'https://norvig.com/21-days.html',
        read: 'norvig.com/21-days.html fetched 2026-10-29; section Answers, Approximate timing for various operations on a typical PC',
    },
    {
        id: 'scott-latency',
        title: 'Latency Numbers Every Programmer Should Know (interactive_latency.html)',
        publisher: 'Colin Scott',
        url: 'https://raw.githubusercontent.com/colin-scott/interactive_latencies/master/interactive_latency.html',
        read: 'raw interactive_latency.html fetched 2026-10-29; getSSDLatency else branch. The published page was fetched the same day and its conversion omitted the script',
    },
];

export const LATENCY_NUMBERS_SOURCE_NUMBER: Readonly<Record<string, number>> = {
    'norvig-latency': 1,
    'scott-latency': 2,
};
