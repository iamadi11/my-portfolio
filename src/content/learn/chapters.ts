import academyLessons from './academy-lessons.json';

/**
 * Chapters that have a page. Titles, order and status come from `docs/system-design/CURRICULUM.md`
 * (`@/lib/learn/curriculum`); this only says which ids are built, so the course index links them and lists the rest
 * as planned.
 */
export const CHAPTER_ROUTES: Readonly<Record<string, string>> = {
    'web-request': '/learn/web-request',
    'client-server': '/learn/client-server',
    'ip-and-ports': '/learn/ip-and-ports',
    dns: '/learn/dns',
    tcp: '/learn/tcp',
    tls: '/learn/tls',
    'latency-throughput': '/learn/latency-throughput',
    percentiles: '/learn/percentiles',
    'latency-numbers': '/learn/latency-numbers',
    estimation: '/learn/estimation',
    'utilisation-queueing': '/learn/utilisation-queueing',
    'api-design': '/learn/api-design',
    rest: '/learn/rest',
    rpc: '/learn/rpc',
    graphql: '/learn/graphql',
    realtime: '/learn/realtime',
    http: '/learn/http',
    'udp-quic': '/learn/udp-quic',
    'http-versions': '/learn/http-versions',
    'cloud-networking': '/learn/cloud-networking',
    ...Object.fromEntries(academyLessons.map((lesson) => [lesson.id, `/learn/${lesson.id}`])),
};
