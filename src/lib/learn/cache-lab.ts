import type { FilmBeat, LessonFilmData } from './film-model';

export type CacheInput = {
    capacity: number;
    /** Teaching ticks from insertion, not sliding expiration. Zero explicitly bypasses storage. */
    ttl: number;
    eviction: 'lru' | 'fifo' | 'lfu';
    pattern: 'hot-set' | 'scan' | 'burst' | 'frequency';
    originWrite: boolean;
    invalidation: 'deliver' | 'drop';
};
export type CacheEntry = { key: string; version: number; expiresAt: number; uses: number; lastRead: number };
export type CacheMetrics = {
    hits: number;
    misses: number;
    staleReads: number;
    originLoads: number;
    evictions: number;
    expirations: number;
};
export type CacheRead = {
    kind: 'read';
    request: number;
    tick: number;
    key: string;
    status: 'hit' | 'miss' | 'bypass';
    version: number;
    originVersion: number;
    stale: boolean;
    evicted: string | null;
    before: CacheEntry[];
    after: CacheEntry[];
    totals: CacheMetrics;
};
export type CacheEvent =
    | CacheRead
    | { kind: 'expire'; tick: number; keys: string[]; after: CacheEntry[] }
    | {
          kind: 'write';
          tick: number;
          before: CacheEntry[];
          after: CacheEntry[];
          invalidation: CacheInput['invalidation'];
      };

export const CACHE_DEFAULT: CacheInput = {
    capacity: 2,
    ttl: 6,
    eviction: 'lru',
    pattern: 'hot-set',
    originWrite: true,
    invalidation: 'drop',
};
export function cacheDefaults(chapterId: string): CacheInput {
    return chapterId === 'eviction'
        ? { ...CACHE_DEFAULT, pattern: 'frequency', originWrite: false, ttl: 8 }
        : { ...CACHE_DEFAULT };
}
/** Assumed total per-read costs, not a latency benchmark or a tail-latency estimate. */
export function assumedCacheMean(
    metrics: Pick<CacheMetrics, 'hits' | 'misses'>,
    hitMs = 5,
    missMs = 100
): number | null {
    const total = metrics.hits + metrics.misses;
    return total ? (metrics.hits * hitMs + metrics.misses * missMs) / total : null;
}
export const CACHE_PATTERNS = {
    'hot-set': {
        label: 'Hot A with B/C competing',
        keys: ['A', 'B', 'A', 'C', 'A', 'B', 'A', 'C', 'A', 'B'],
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    scan: {
        label: 'Repeated scan across A/B/C/D',
        keys: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'],
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    burst: {
        label: 'Short burst, idle gap, second burst',
        keys: ['A', 'B', 'A', 'C', 'A', 'B', 'A', 'B', 'A', 'C'],
        ticks: [0, 0, 1, 1, 2, 2, 6, 6, 7, 7],
    },
    frequency: {
        label: 'Frequent A, then more recent B',
        keys: ['A', 'A', 'B', 'C', 'A', 'B', 'A', 'C', 'B', 'D'],
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
} as const;
export const CACHE_PREDICTIONS = [
    'Every read returns the current version',
    'At least one read returns an older version',
] as const;
export const CACHE_SOURCES = [
    {
        url: 'https://www.rfc-editor.org/rfc/rfc9111.html',
        section: '§4.2 Freshness; §4.4 Invalidating Stored Responses',
        read: '2026-10-30',
    },
    {
        url: 'https://redis.io/docs/latest/develop/reference/eviction/',
        section: 'Eviction policies; Approximated LRU algorithm; LFU eviction',
        read: '2026-10-30',
    },
    {
        url: 'https://redis.io/docs/latest/develop/clients/client-side-caching/',
        section: 'Updating the cache when the data changes',
        read: '2026-10-30',
    },
];
const bounded = (n: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, Math.floor(Number.isFinite(n) ? n : min)));

/**
 * A synchronous logical cache layer, initially empty. Equal-size entries, exact LRU/FIFO/LFU, serial reads;
 * entries expire before an event at expiresAt. Hits never extend TTL. At tick 4 a writer may change A to v2,
 * then attempt invalidation before any read at that tick. Lost invalidation leaves a healthy cache unchanged.
 * No concurrent fills, request coalescing, validators, background refresh, write-back or simulated latency.
 * LFU counts reads since insertion, breaking equal-frequency ties by least recent read; no aging/decay.
 * "Stale" means older than the current origin version, not RFC 9111's separate expiration terminology.
 */
export function simulateCache(raw: CacheInput): {
    input: CacheInput;
    events: CacheEvent[];
    reads: CacheRead[];
    metrics: CacheMetrics;
    finalCache: CacheEntry[];
    outcome: (typeof CACHE_PREDICTIONS)[number];
    explanation: string;
} {
    const input: CacheInput = {
        capacity: bounded(raw.capacity, 1, 4),
        ttl: bounded(raw.ttl, 0, 8),
        eviction: raw.eviction === 'fifo' || raw.eviction === 'lfu' ? raw.eviction : 'lru',
        pattern: Object.hasOwn(CACHE_PATTERNS, raw.pattern) ? raw.pattern : 'hot-set',
        originWrite: raw.originWrite === true,
        invalidation: raw.invalidation === 'deliver' ? 'deliver' : 'drop',
    };
    const cache = new Map<string, CacheEntry>();
    const snapshot = (): CacheEntry[] => {
        const entries = [...cache.values()].map((entry) => ({ ...entry }));
        return input.eviction === 'lfu'
            ? entries.sort((a, b) => a.uses - b.uses || a.lastRead - b.lastRead)
            : entries;
    };
    const events: CacheEvent[] = [],
        reads: CacheRead[] = [];
    const metrics: CacheMetrics = {
        hits: 0,
        misses: 0,
        staleReads: 0,
        originLoads: 0,
        evictions: 0,
        expirations: 0,
    };
    let originA = 1;
    let written = false;
    const expire = (tick: number): void => {
        const keys = [...cache.values()].filter((entry) => entry.expiresAt <= tick).map((entry) => entry.key);
        if (!keys.length) return;
        keys.forEach((key) => cache.delete(key));
        metrics.expirations += keys.length;
        events.push({ kind: 'expire', tick, keys, after: snapshot() });
    };
    const pattern = CACHE_PATTERNS[input.pattern];
    pattern.keys.forEach((key, index) => {
        const tick = pattern.ticks[index];
        if (input.originWrite && !written && tick >= 4) {
            expire(4);
            const before = snapshot();
            originA = 2;
            written = true;
            if (input.invalidation === 'deliver') cache.delete('A');
            events.push({
                kind: 'write',
                tick: 4,
                before,
                after: snapshot(),
                invalidation: input.invalidation,
            });
        }
        expire(tick);
        const before = snapshot();
        const originVersion = key === 'A' ? originA : 1;
        const cached = cache.get(key);
        let evicted: string | null = null;
        const version = cached?.version ?? originVersion;
        if (cached) {
            metrics.hits++;
            cached.uses++;
            cached.lastRead = index;
            if (input.eviction === 'lru') {
                cache.delete(key);
                cache.set(key, cached);
            }
        } else {
            metrics.misses++;
            metrics.originLoads++;
            if (input.ttl > 0) {
                if (cache.size === input.capacity) {
                    evicted = snapshot()[0].key;
                    cache.delete(evicted);
                    metrics.evictions++;
                }
                cache.set(key, { key, version, expiresAt: tick + input.ttl, uses: 1, lastRead: index });
            }
        }
        const stale = version < originVersion;
        if (stale) metrics.staleReads++;
        const event: CacheRead = {
            kind: 'read',
            request: index + 1,
            tick,
            key,
            status: cached ? 'hit' : input.ttl === 0 ? 'bypass' : 'miss',
            version,
            originVersion,
            stale,
            evicted,
            before,
            after: snapshot(),
            totals: { ...metrics },
        };
        reads.push(event);
        events.push(event);
    });
    return {
        input,
        events,
        reads,
        metrics,
        finalCache: snapshot(),
        outcome: CACHE_PREDICTIONS[metrics.staleReads > 0 ? 1 : 0],
        explanation:
            input.ttl === 0
                ? 'Storage is bypassed, so every read loads the current origin version. There are no retained copies to reuse.'
                : !input.originWrite
                  ? 'The origin never changes in this run. Misses still cost origin work, but retained versions cannot become older than the unchanged origin.'
                  : metrics.staleReads > 0
                    ? 'The invalidation was lost while A v1 remained unexpired. A hit reused that copy after the origin changed to v2.'
                    : input.invalidation === 'deliver'
                      ? 'Delivered invalidation removes A before later reads in this serial model. A miss then fills the cache with the current version.'
                      : 'The invalidation was lost, but A was evicted or expired before its next read. No older version was returned in this particular workload.',
    };
}

/** Eviction candidate first; LFU uses exact counts with a least-recent-read tie break. */
export const cacheContents = (entries: readonly CacheEntry[]): string =>
    entries.map((entry) => `${entry.key}:v${entry.version} exp${entry.expiresAt}`).join(' · ') || 'empty';

export function makeCacheFilm(
    input: CacheInput,
    suffix = 'learn',
    chapterId = 'caching-basics'
): LessonFilmData {
    const run = simulateCache(input);
    const beats: FilmBeat[] = [
        {
            title: 'Start with an empty cache',
            caption: `Ten reads share ${run.input.capacity} cache slots. Entries live ${run.input.ttl} ticks from insertion; zero means storage is bypassed.`,
            counts: { c: 0, k: 0, o: 0, w: 0 },
            values: { k: 'empty', o: 'A v1 · other keys v1', w: 'no write yet' },
        },
    ];
    let originA = 1;
    for (const event of run.events) {
        if (event.kind === 'expire') {
            beats.push({
                title: `Tick ${event.tick}: expire ${event.keys.join('/')}`,
                caption: `At tick ${event.tick}, ${event.keys.join(', ')} expires before the next operation. Reading a cached entry never extends its lifetime.`,
                values: { k: cacheContents(event.after) },
                counts: { k: event.after.length },
            });
        } else if (event.kind === 'write') {
            originA = 2;
            beats.push({
                title: 'Tick 4: update the origin',
                caption:
                    'A separate writer changes A from v1 to v2. Existing cache entries do not change themselves.',
                from: 'w',
                to: 'o',
                packet: 'Write A v2',
                states: { o: 'done', w: 'done' },
                values: { o: 'A v2 · other keys v1', w: 'A v2 written' },
                counts: { w: 1 },
            });
            beats.push({
                title:
                    event.invalidation === 'deliver'
                        ? 'Invalidate A in the cache'
                        : 'The invalidation is lost',
                caption:
                    event.invalidation === 'deliver'
                        ? 'The invalidation arrives and removes A if present. The next read must fetch it again.'
                        : 'The invalidation message is dropped. A healthy cache may retain the old version until expiration or eviction.',
                from: 'o',
                to: 'k',
                packet: 'Invalidate A',
                lost: event.invalidation === 'drop',
                values: { k: cacheContents(event.after) },
                counts: { k: event.after.length },
                states: { k: 'idle', o: 'done' },
            });
        } else {
            beats.push({
                title: `Read ${event.request}: look up ${event.key}`,
                caption: `Tick ${event.tick}: the reader asks for ${event.key}. ${event.status === 'hit' ? 'An unexpired entry is available.' : event.status === 'bypass' ? 'Cache storage is bypassed.' : 'No unexpired entry is available.'}`,
                from: 'c',
                to: 'k',
                packet: `Read ${event.key}`,
                values: { c: `${event.key} pending`, k: cacheContents(event.before) },
                counts: { k: event.before.length },
                states: { k: 'active', c: 'active' },
            });
            if (event.status !== 'hit') {
                beats.push({
                    title: `Read ${event.request}: load from origin`,
                    caption: `The cache layer fetches current ${event.key} v${event.version}. This adds one origin load.`,
                    from: 'k',
                    to: 'o',
                    packet: `Fetch ${event.key}`,
                    counts: { o: event.totals.originLoads },
                    values: { o: `A v${originA} · other keys v1` },
                    states: { o: 'active' },
                });
                beats.push({
                    title: `Read ${event.request}: ${event.status === 'bypass' ? 'bypass storage' : 'fill the cache'}`,
                    caption:
                        event.status === 'bypass'
                            ? 'The current value returns through the cache layer without being stored.'
                            : `${event.evicted ? `Evict ${event.evicted}; ` : ''}store ${event.key} v${event.version} until tick ${event.tick + run.input.ttl}. ${run.input.eviction === 'lru' ? 'Least recently read is evicted next.' : run.input.eviction === 'lfu' ? 'Lowest frequency is evicted next; ties use oldest read.' : 'Earliest inserted is evicted next.'}`,
                    from: 'o',
                    to: 'k',
                    packet: `${event.key} v${event.version}`,
                    values: { k: cacheContents(event.after) },
                    counts: { k: event.after.length },
                    states: { k: 'done', o: 'done' },
                });
            }
            beats.push({
                title: `Read ${event.request}: return ${event.key} v${event.version}`,
                caption: event.stale
                    ? `The reader receives ${event.key} v${event.version}, but the origin now holds v${event.originVersion}. An unexpired entry can contain older data.`
                    : `The reader receives ${event.key} v${event.version}. It matches the origin in this serial run.`,
                from: 'k',
                to: 'c',
                packet: `${event.key} v${event.version}`,
                values: {
                    c: `${event.key} v${event.version}${event.stale ? ' · older version' : ' · current'}`,
                    k: cacheContents(event.after),
                },
                counts: { c: event.request, k: event.after.length },
                states: { c: 'done', k: 'done' },
            });
        }
    }
    beats.push({
        title: 'Count reuse and correctness separately',
        caption: `${run.metrics.hits} hits, ${run.metrics.misses} misses and ${run.metrics.originLoads} origin loads. ${run.metrics.staleReads} reads returned older versions. A hit alone does not establish correctness.`,
        values: {
            c: `${run.reads.length} reads · ${run.metrics.staleReads} older`,
            k: cacheContents(run.finalCache),
        },
        counts: { c: run.reads.length, k: run.finalCache.length, o: run.metrics.originLoads },
    });
    return {
        id: `${chapterId}-cache-${suffix}`,
        question: 'Can a fast cache hit still show old data?',
        takeaway:
            'Capacity, replacement, expiration and invalidation make separate tradeoffs. Track origin work and returned versions, not only hit rate.',
        nodes: [
            { id: 'c', label: 'Reader', kind: 'computer', x: -240, y: 0 },
            { id: 'k', label: 'Cache layer', kind: 'store', x: -70, y: 0 },
            { id: 'o', label: 'Origin data', kind: 'store', x: 100, y: 0 },
            { id: 'w', label: 'Writer', kind: 'computer', x: 270, y: 0 },
        ],
        links: [
            ['c', 'k'],
            ['k', 'o'],
            ['w', 'o'],
        ],
        beats,
        sourceHref: `/learn/sources#${chapterId}`,
    };
}

export const CACHE_QUESTIONS = [
    {
        chapter: 'caching-basics',
        prompt: 'Assume 80% hits at a total cost of 5 ms and 20% misses at a total cost of 100 ms. What is the expected mean?',
        choices: [
            '24 ms; this average says nothing about the tail',
            '5 ms; the most common outcome is the mean',
        ] as [string, string],
        correct: 0,
        explanation:
            '0.8 × 5 + 0.2 × 100 = 24 ms. Miss cost is the total miss path here. These are assumed costs; the mean cannot establish p99.',
    },
    {
        chapter: 'eviction',
        prompt: 'Two slots, no expiry: A, A, B, then C. Which first eviction follows?',
        choices: ['LRU evicts A; LFU evicts B', 'Both policies must evict the same key'] as [string, string],
        correct: 0,
        explanation:
            'A has two uses but B is more recent. LRU chooses A; this exact LFU model chooses B. Real Redis policies are approximate and LFU uses decay.',
    },
    {
        chapter: 'caching-basics',
        prompt: 'A cached profile has three TTL ticks left. Another writer changes the origin but its invalidation is lost. What can a cache hit return?',
        choices: [
            'The older cached version, even before its TTL expires',
            'It must return the new origin version because it is a hit',
        ] as [string, string],
        correct: 0,
        explanation:
            'TTL permits reuse for a period; it does not prove the origin has not changed. Invalidation, refresh or a shorter lifetime changes the tradeoff.',
    },
    {
        chapter: 'caching-basics',
        prompt: 'With two slots and no expiration, read A, B, A, then C. Which replacement decision follows?',
        choices: ['Both LRU and FIFO evict B', 'LRU evicts B; FIFO evicts A'] as [string, string],
        correct: 1,
        explanation:
            'LRU remembers the second read of A. FIFO keeps insertion order, so A is still oldest. Neither policy changes the origin data.',
    },
    {
        chapter: 'caching-basics',
        prompt: 'In this serial model, set TTL to zero so storage is bypassed. What happens to ten reads?',
        choices: [
            'All ten load from the origin; none are cache hits',
            'The cache serves all ten without any origin work',
        ] as [string, string],
        correct: 0,
        explanation:
            'Zero explicitly means bypass in this model. There is no retained entry to reuse. This is a teaching control, not Redis EX 0 syntax.',
    },
];

export const EVICTION_PREDICTIONS = [
    'First capacity eviction: A',
    'First capacity eviction: B',
    'First capacity eviction: C',
    'First capacity eviction: D',
    'First capacity eviction: none',
] as const;
export function firstEvictionPrediction(reads: readonly CacheRead[]): string {
    return `First capacity eviction: ${reads.find((read) => read.evicted)?.evicted ?? 'none'}`;
}
