import { describe, expect, it } from 'vitest';

import {
    CACHE_DEFAULT,
    CACHE_PATTERNS,
    CACHE_PREDICTIONS,
    cacheContents,
    makeCacheFilm,
    simulateCache,
    type CacheInput,
} from './cache-lab';
import { filmDuration, filmStarts, sampleFilm, settledSceneTime } from './film-model';

describe('cache reuse, expiration, eviction and origin versions', () => {
    it('separates a hit from a current version and changes only invalidation in the worked comparison', () => {
        const lost = simulateCache(CACHE_DEFAULT);
        const delivered = simulateCache({ ...CACHE_DEFAULT, invalidation: 'deliver' });
        expect(lost.reads[4]).toMatchObject({
            key: 'A',
            tick: 4,
            status: 'hit',
            version: 1,
            originVersion: 2,
            stale: true,
        });
        expect(delivered.reads[4]).toMatchObject({
            key: 'A',
            tick: 4,
            status: 'miss',
            version: 2,
            originVersion: 2,
            stale: false,
        });
        expect(lost.metrics.staleReads).toBe(1);
        expect(delivered.metrics.staleReads).toBe(0);
        expect(delivered.reads[4].totals.originLoads).toBe(lost.reads[4].totals.originLoads + 1);
        // The earlier refill also expires later; per-request work shifts, but both full runs make 7 loads.
        expect(delivered.metrics.originLoads).toBe(7);
        expect(lost.metrics.originLoads).toBe(7);
        expect(lost.outcome).toBe(CACHE_PREDICTIONS[1]);
        expect(delivered.outcome).toBe(CACHE_PREDICTIONS[0]);
    });

    it('uses read recency for LRU and insertion order for FIFO', () => {
        const input = { ...CACHE_DEFAULT, ttl: 8, originWrite: false };
        const lru = simulateCache({ ...input, eviction: 'lru' });
        const fifo = simulateCache({ ...input, eviction: 'fifo' });
        expect(lru.reads[3]).toMatchObject({ key: 'C', evicted: 'B' });
        expect(fifo.reads[3]).toMatchObject({ key: 'C', evicted: 'A' });
        expect(lru.reads[4].status).toBe('hit');
        expect(fifo.reads[4].status).toBe('miss');
    });

    it('distinguishes exact frequency from recency and resets frequency when an entry is replaced', () => {
        const input = { ...CACHE_DEFAULT, pattern: 'frequency' as const, ttl: 8, originWrite: false };
        const lru = simulateCache({ ...input, eviction: 'lru' });
        const lfu = simulateCache({ ...input, eviction: 'lfu' });
        // A,A,B,C: A is older than B, but A has been read twice.
        expect(lru.reads[3].evicted).toBe('A');
        expect(lfu.reads[3].evicted).toBe('B');
        expect(lfu.reads[3].after.find((entry) => entry.key === 'A')?.uses).toBe(2);
        expect(lfu.reads[5].after.find((entry) => entry.key === 'B')?.uses).toBe(1);
        const tie = simulateCache({ ...CACHE_DEFAULT, eviction: 'lfu', originWrite: false, ttl: 8 });
        expect(tie.reads[1].after.map((entry) => entry.key)).toEqual(['A', 'B']);
    });

    it('expires at the boundary, never extends TTL on a hit, and accounts for idle gaps', () => {
        const hit = simulateCache({ ...CACHE_DEFAULT, originWrite: false });
        expect(hit.reads[2].status).toBe('hit');
        expect(hit.reads[2].after.find((entry) => entry.key === 'A')?.expiresAt).toBe(6);
        const expired = simulateCache({ ...CACHE_DEFAULT, ttl: 2, originWrite: false });
        expect(expired.reads[2]).toMatchObject({ key: 'A', tick: 2, status: 'miss' });
        expect(expired.events).toContainEqual(
            expect.objectContaining({ kind: 'expire', tick: 2, keys: ['A'] })
        );
        const gap = simulateCache({ ...CACHE_DEFAULT, ttl: 3, pattern: 'burst', originWrite: false });
        expect(gap.reads[6]).toMatchObject({ key: 'A', tick: 6, status: 'miss' });
        expect(gap.reads[6].before).toEqual([]);
    });

    it('models storage bypass without inventing hits, entries or a Redis command', () => {
        const run = simulateCache({ ...CACHE_DEFAULT, ttl: 0 });
        expect(run.metrics).toMatchObject({
            hits: 0,
            misses: 10,
            originLoads: 10,
            staleReads: 0,
            evictions: 0,
            expirations: 0,
        });
        expect(run.reads.every((read) => read.status === 'bypass' && read.after.length === 0)).toBe(true);
        expect(run.finalCache).toEqual([]);
        expect(run.outcome).toBe(CACHE_PREDICTIONS[0]);
    });

    it('does not imply a lost invalidation always creates stale reads', () => {
        const noWrite = simulateCache({ ...CACHE_DEFAULT, originWrite: false });
        const alreadyEvicted = simulateCache({ ...CACHE_DEFAULT, ttl: 8, eviction: 'fifo' });
        expect(noWrite.metrics.staleReads).toBe(0);
        expect(noWrite.events.some((event) => event.kind === 'write')).toBe(false);
        expect(alreadyEvicted.reads[4]).toMatchObject({ key: 'A', status: 'miss', version: 2 });
        expect(alreadyEvicted.metrics.staleReads).toBe(0);
    });

    it('preserves conservation, capacity and version invariants throughout all 1728 bounded configurations', () => {
        for (let capacity = 1; capacity <= 4; capacity++)
            for (let ttl = 0; ttl <= 8; ttl++)
                for (const eviction of ['lru', 'fifo', 'lfu'] as const)
                    for (const pattern of Object.keys(CACHE_PATTERNS) as CacheInput['pattern'][])
                        for (const originWrite of [false, true])
                            for (const invalidation of ['deliver', 'drop'] as const) {
                                const input = { capacity, ttl, eviction, pattern, originWrite, invalidation };
                                const run = simulateCache(input);
                                expect(run.metrics.hits + run.metrics.misses).toBe(run.reads.length);
                                expect(run.metrics.originLoads).toBe(run.metrics.misses);
                                expect(run.metrics.staleReads).toBe(
                                    run.reads.filter((read) => read.stale).length
                                );
                                expect(run.metrics.evictions).toBe(
                                    run.reads.filter((read) => read.evicted !== null).length
                                );
                                expect(run.metrics.expirations).toBe(
                                    run.events.reduce(
                                        (sum, event) =>
                                            sum + (event.kind === 'expire' ? event.keys.length : 0),
                                        0
                                    )
                                );
                                expect(
                                    run.events.every(
                                        (event, i) => i === 0 || event.tick >= run.events[i - 1].tick
                                    )
                                ).toBe(true);
                                for (const read of run.reads) {
                                    expect(read.after.length).toBeLessThanOrEqual(capacity);
                                    expect(new Set(read.after.map((entry) => entry.key)).size).toBe(
                                        read.after.length
                                    );
                                    expect(read.before.every((entry) => entry.expiresAt > read.tick)).toBe(
                                        true
                                    );
                                    expect(read.after.every((entry) => entry.expiresAt > read.tick)).toBe(
                                        true
                                    );
                                    expect(read.version).toBeLessThanOrEqual(read.originVersion);
                                    expect(read.stale).toBe(read.version < read.originVersion);
                                    expect(read.totals.hits + read.totals.misses).toBe(read.request);
                                    if (read.status === 'hit')
                                        expect(
                                            read.before.find((entry) => entry.key === read.key)?.version
                                        ).toBe(read.version);
                                    else expect(read.version).toBe(read.originVersion);
                                }
                                if (!originWrite || invalidation === 'deliver')
                                    expect(run.metrics.staleReads).toBe(0);
                                expect(simulateCache(input)).toEqual(run);
                            }
    });

    it('commits visible responses only after arrival and derives state/counts from the actual trace', () => {
        for (const input of [
            CACHE_DEFAULT,
            { ...CACHE_DEFAULT, invalidation: 'deliver' as const },
            { ...CACHE_DEFAULT, ttl: 0 },
            { ...CACHE_DEFAULT, pattern: 'burst' as const, ttl: 3 },
            {
                ...CACHE_DEFAULT,
                pattern: 'frequency' as const,
                eviction: 'lfu' as const,
                ttl: 8,
                originWrite: false,
            },
        ]) {
            const run = simulateCache(input);
            const film = makeCacheFilm(input);
            const starts = filmStarts(film);
            for (const read of run.reads) {
                const index = film.beats.findIndex(
                    (beat) => beat.title === `Read ${read.request}: return ${read.key} v${read.version}`
                );
                expect(index).toBeGreaterThan(0);
                expect(sampleFilm(film, starts[index]).counts.c).toBe(read.request - 1);
                const settled = sampleFilm(film, settledSceneTime(film, index));
                expect(settled.counts).toMatchObject({
                    c: read.request,
                    k: read.after.length,
                    o: read.totals.originLoads,
                });
                expect(settled.values.k).toBe(cacheContents(read.after));
                expect(settled.values.c).toBe(
                    `${read.key} v${read.version}${read.stale ? ' · older version' : ' · current'}`
                );
            }
            const final = sampleFilm(film, filmDuration(film));
            expect(final.counts).toEqual({
                c: 10,
                k: run.finalCache.length,
                o: run.metrics.originLoads,
                w: input.originWrite ? 1 : 0,
            });
            expect(film.beats.filter((beat) => beat.lost)).toHaveLength(
                input.originWrite && input.invalidation === 'drop' ? 1 : 0
            );
            expect(Object.values(final.states)).not.toContain('failed');
            for (const beat of film.beats) {
                expect(beat.caption.trim().split(/\s+/).length).toBeLessThanOrEqual(25);
                for (const endpoint of [beat.from, beat.to].filter(Boolean))
                    expect(film.nodes.some((node) => node.id === endpoint)).toBe(true);
            }
        }
    });

    it('clamps malformed numeric inputs and does not mutate the caller', () => {
        const input = { ...CACHE_DEFAULT, ttl: NaN, capacity: Infinity };
        expect(simulateCache(input).input).toMatchObject({ ttl: 0, capacity: 1 });
        expect(input.ttl).toBeNaN();
        expect(input.capacity).toBe(Infinity);
    });
});
