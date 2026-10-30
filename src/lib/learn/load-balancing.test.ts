import { describe, expect, it } from 'vitest';

import { filmDuration, sampleFilm, settledSceneTime } from './film-model';
import {
    LOAD_BALANCING_DEFAULT,
    makeLoadBalancingFilm,
    simulateLoadBalancer,
    type BackendCondition,
    type RoutingPolicy,
} from './load-balancing';

describe('replica routing, not storage shard ownership', () => {
    it('round robin rotates among eligible replicas; least-connections observes unfinished work', () => {
        const rr = simulateLoadBalancer(LOAD_BALANCING_DEFAULT);
        const least = simulateLoadBalancer({ ...LOAD_BALANCING_DEFAULT, policy: 'least-connections' });
        expect(rr.events.map((event) => event.target)).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2]);
        expect(rr.events[3]).toMatchObject({
            target: 0,
            activeBefore: [1, 0, 0],
            outcome: 'capacity-rejected',
        });
        expect(least.events[3]).toMatchObject({ activeBefore: [1, 0, 0], outcome: 'accepted' });
        expect(least.events[3].target).not.toBe(0);
        expect(rr.rejected).toBe(1);
        expect(least.rejected).toBe(0);
    });

    it('completes a request before routing another at its finish tick', () => {
        const run = simulateLoadBalancer({ ...LOAD_BALANCING_DEFAULT, serviceA: 1 });
        expect(run.rejected).toBe(0);
        expect(run.events.every((event) => event.activeBefore.every((count) => count === 0))).toBe(true);
    });

    it('does not invent capacity for a simultaneous burst under either policy', () => {
        for (const policy of ['round-robin', 'least-connections'] as RoutingPolicy[]) {
            const run = simulateLoadBalancer({
                ...LOAD_BALANCING_DEFAULT,
                requests: 12,
                spacing: 0,
                capacity: 2,
                policy,
            });
            expect(run.accepted).toBe(6);
            expect(run.rejected).toBe(6);
            expect(run.failed).toBe(0);
            expect(run.completed).toBe(6);
        }
    });

    it('distinguishes an undiscovered connection failure from an already excluded backend', () => {
        const unseen = simulateLoadBalancer({ ...LOAD_BALANCING_DEFAULT, condition: 'undetected-failure' });
        expect(unseen.failed).toBe(1);
        expect(unseen.events[0]).toMatchObject({ target: 0, outcome: 'connection-failed', finish: null });
        expect(unseen.events.slice(1).every((event) => event.target !== 0)).toBe(true);
        const excluded = simulateLoadBalancer({ ...LOAD_BALANCING_DEFAULT, condition: 'excluded' });
        expect(excluded.failed).toBe(0);
        expect(excluded.assigned[0]).toBe(0);
        expect(excluded.events.every((event) => event.target !== 0)).toBe(true);
        // A healthy replica's capacity rejection does not turn it into a failed component.
        const healthy = simulateLoadBalancer(LOAD_BALANCING_DEFAULT);
        expect(healthy.events[3].outcome).toBe('capacity-rejected');
        expect(healthy.events[6].target).toBe(0);
        expect(healthy.events[6].outcome).toBe('accepted');
    });

    it('keeps conservation, occupancy and finish times correct throughout the bounded input space', () => {
        for (let requests = 1; requests <= 12; requests++)
            for (let spacing = 0; spacing <= 3; spacing++)
                for (let serviceA = 1; serviceA <= 8; serviceA++)
                    for (let capacity = 1; capacity <= 4; capacity++)
                        for (const policy of ['round-robin', 'least-connections'] as RoutingPolicy[])
                            for (const condition of [
                                'healthy',
                                'undetected-failure',
                                'excluded',
                            ] as BackendCondition[]) {
                                const run = simulateLoadBalancer({
                                    requests,
                                    spacing,
                                    serviceA,
                                    capacity,
                                    policy,
                                    condition,
                                });
                                expect(run.accepted + run.rejected + run.failed).toBe(requests);
                                expect(run.assigned.reduce((sum, n) => sum + n, 0)).toBe(requests);
                                expect(run.completed).toBe(run.accepted);
                                for (let i = 0; i < run.events.length; i++) {
                                    const event = run.events[i];
                                    const actual = [0, 1, 2].map(
                                        (server) =>
                                            run.events
                                                .slice(0, i)
                                                .filter(
                                                    (previous) =>
                                                        previous.target === server &&
                                                        previous.finish !== null &&
                                                        previous.finish > event.tick
                                                ).length
                                    );
                                    expect(event.activeBefore).toEqual(actual);
                                    expect(event.activeBefore.every((n) => n <= capacity)).toBe(true);
                                    if (event.outcome === 'accepted') {
                                        expect(event.activeBefore[event.target]).toBeLessThan(capacity);
                                        expect(event.finish).toBe(
                                            event.tick + (event.target === 0 ? serviceA : 1)
                                        );
                                    } else expect(event.finish).toBeNull();
                                    if (policy === 'least-connections') {
                                        const excludeA =
                                            condition === 'excluded' ||
                                            (condition === 'undetected-failure' && i > 0);
                                        const eligible = actual.filter(
                                            (_, server) => !(server === 0 && excludeA)
                                        );
                                        expect(event.activeBefore[event.target]).toBe(Math.min(...eligible));
                                    }
                                }
                            }
    });

    it('samples the same model trace, keeps committed arrivals legal and never depicts refusal as packet loss', () => {
        for (const condition of ['healthy', 'undetected-failure', 'excluded'] as BackendCondition[]) {
            const input = { ...LOAD_BALANCING_DEFAULT, condition };
            const run = simulateLoadBalancer(input);
            const film = makeLoadBalancingFilm(input);
            expect(film.beats).toEqual(run.beats);
            expect(film.beats.every((beat) => !beat.lost)).toBe(true);
            expect(sampleFilm(film, filmDuration(film)).counts).toEqual({ a: 0, b: 0, c: 0 });
            film.beats.forEach((beat, index) => {
                expect(sampleFilm(film, settledSceneTime(film, index)).counts).toEqual(beat.counts);
                for (const endpoint of [beat.from, beat.to].filter(Boolean))
                    expect(film.nodes.some((node) => node.id === endpoint)).toBe(true);
            });
            expect(sampleFilm(film, filmDuration(film)).states.a).toBe(
                condition === 'healthy' ? 'done' : 'failed'
            );
        }
    });

    it('clamps malformed numerical inputs and replays without mutating the caller', () => {
        const input = {
            ...LOAD_BALANCING_DEFAULT,
            requests: NaN,
            spacing: -10,
            serviceA: Infinity,
            capacity: 999,
        };
        const first = simulateLoadBalancer(input);
        expect(first.input).toMatchObject({ requests: 1, spacing: 0, serviceA: 1, capacity: 4 });
        expect(input.requests).toBeNaN();
        expect(simulateLoadBalancer(input)).toEqual(first);
    });
});
