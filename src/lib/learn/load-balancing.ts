import type { FilmBeat, LessonFilmData } from './film-model';

export type RoutingPolicy = 'round-robin' | 'least-connections';
export type BackendCondition = 'healthy' | 'undetected-failure' | 'excluded';
export type LoadBalancingInput = {
    requests: number;
    /** One simulated tick is a teaching unit, not a measured second. */
    spacing: number;
    serviceA: number;
    capacity: number;
    policy: RoutingPolicy;
    condition: BackendCondition;
};
export type RoutingEvent = {
    request: number;
    tick: number;
    activeBefore: [number, number, number];
    target: number;
    outcome: 'accepted' | 'capacity-rejected' | 'connection-failed';
    finish: number | null;
};
export const LOAD_BALANCING_DEFAULT: LoadBalancingInput = {
    requests: 9,
    spacing: 1,
    serviceA: 6,
    capacity: 1,
    policy: 'round-robin',
    condition: 'healthy',
};
export const ROUTING_PREDICTIONS = [
    'All requests accepted',
    'At least one request rejected or failed',
] as const;
export const ROUTING_SOURCES = [
    {
        url: 'https://nginx.org/en/docs/http/load_balancing.html',
        section: 'Load balancing methods; Least connected load balancing; Health checks',
        read: '2026-10-30',
    },
];

const bounded = (n: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, Math.floor(Number.isFinite(n) ? n : min)));

/**
 * One request occupies one connection until its assumed finish tick. B/C take one tick.
 * At the same tick, completions happen before arrivals; arrivals are routed in request order.
 * Equal least-connection counts use a rotating tie break. All replicas have equal weights.
 * No request queue/retry, recovery, sticky sessions, keepalive, multiplexing or network delay.
 * A first refused connection excludes A for the remaining run (simplified passive detection).
 */
export function simulateLoadBalancer(raw: LoadBalancingInput): {
    input: LoadBalancingInput;
    events: RoutingEvent[];
    accepted: number;
    rejected: number;
    failed: number;
    completed: number;
    assigned: [number, number, number];
    outcome: (typeof ROUTING_PREDICTIONS)[number];
    beats: FilmBeat[];
} {
    const input: LoadBalancingInput = {
        requests: bounded(raw.requests, 1, 12),
        spacing: bounded(raw.spacing, 0, 3),
        serviceA: bounded(raw.serviceA, 1, 8),
        capacity: bounded(raw.capacity, 1, 4),
        policy: raw.policy === 'least-connections' ? raw.policy : 'round-robin',
        condition: ['healthy', 'undetected-failure', 'excluded'].includes(raw.condition)
            ? raw.condition
            : 'healthy',
    };
    const endings: number[][] = [[], [], []];
    const assigned: [number, number, number] = [0, 0, 0];
    const events: RoutingEvent[] = [];
    const beats: FilmBeat[] = [];
    let cursor = 0;
    let excludeA = input.condition === 'excluded';
    let accepted = 0;
    let rejected = 0;
    let failed = 0;
    let completed = 0;
    const nodeIds = ['a', 'b', 'c'];
    const snapshot = (tick: number): { counts: Record<string, number>; values: Record<string, string> } => ({
        counts: Object.fromEntries(nodeIds.map((id, i) => [id, endings[i].filter((n) => n > tick).length])),
        values: {
            r: `${accepted} accepted · ${rejected + failed} refused`,
            ...Object.fromEntries(
                nodeIds.map((id, i) => [
                    id,
                    `${endings[i].filter((n) => n > tick).length}/${input.capacity} active`,
                ])
            ),
        },
    });
    beats.push({
        title: 'Three replicas, one application',
        caption: `A takes ${input.serviceA} ticks per request; B/C take one. Each admits at most ${input.capacity} active connections.`,
        states: { r: 'active', a: excludeA ? 'failed' : 'idle', b: 'idle', c: 'idle' },
        ...snapshot(0),
    });
    for (let index = 0; index < input.requests; index++) {
        const tick = index * input.spacing;
        const newlyCompleted = endings.flat().filter((finish) => finish <= tick).length - completed;
        if (newlyCompleted > 0) {
            completed += newlyCompleted;
            beats.push({
                title: `Tick ${tick}: connections finish`,
                caption: `${newlyCompleted} earlier request${newlyCompleted === 1 ? '' : 's'} finished. Released slots are available before the next arrival.`,
                states: { a: excludeA ? 'failed' : 'idle', b: 'idle', c: 'idle' },
                ...snapshot(tick),
            });
        }
        const activeBefore = endings.map((times) => times.filter((finish) => finish > tick).length) as [
            number,
            number,
            number,
        ];
        const eligible = [0, 1, 2].filter((i) => !(i === 0 && excludeA));
        let candidates = eligible;
        if (input.policy === 'least-connections') {
            const minimum = Math.min(...eligible.map((i) => activeBefore[i]));
            candidates = eligible.filter((i) => activeBefore[i] === minimum);
        }
        const target = [...candidates].sort((a, b) => ((a - cursor + 3) % 3) - ((b - cursor + 3) % 3))[0];
        cursor = (target + 1) % 3;
        assigned[target]++;
        let outcome: RoutingEvent['outcome'] = 'accepted';
        let finish: number | null = null;
        if (target === 0 && input.condition === 'undetected-failure') {
            failed++;
            excludeA = true;
            outcome = 'connection-failed';
        } else if (activeBefore[target] >= input.capacity) {
            rejected++;
            outcome = 'capacity-rejected';
        } else {
            accepted++;
            finish = tick + (target === 0 ? input.serviceA : 1);
            endings[target].push(finish);
        }
        events.push({ request: index + 1, tick, activeBefore, target, outcome, finish });
        const name = String.fromCharCode(65 + target);
        beats.push({
            title: `Request ${index + 1} → server ${name}`,
            caption:
                outcome === 'accepted'
                    ? `Tick ${tick}: ${name} accepts the request. Its connection stays active until tick ${finish}.`
                    : outcome === 'capacity-rejected'
                      ? `Tick ${tick}: ${name} is at its connection limit and rejects this attempt. No retry or queue is assumed.`
                      : `Tick ${tick}: A refuses the connection. Passive detection excludes it for the rest of this run; this request fails.`,
            from: 'r',
            to: nodeIds[target],
            packet: `Request ${index + 1}`,
            states: {
                a: excludeA ? 'failed' : 'idle',
                b: 'idle',
                c: 'idle',
                [nodeIds[target]]: outcome === 'connection-failed' ? 'failed' : 'active',
            },
            ...snapshot(tick),
        });
    }
    const finalTick = Math.max(0, ...endings.flat());
    completed = endings.flat().length;
    beats.push({
        title: 'Let admitted work finish',
        caption: `By tick ${finalTick}, ${completed} requests completed; ${rejected} were capacity-rejected and ${failed} failed to connect. Routing does not create capacity.`,
        states: { r: 'done', a: excludeA ? 'failed' : 'done', b: 'done', c: 'done' },
        ...snapshot(finalTick),
    });
    return {
        input,
        events,
        accepted,
        rejected,
        failed,
        completed,
        assigned,
        beats,
        outcome: rejected + failed === 0 ? ROUTING_PREDICTIONS[0] : ROUTING_PREDICTIONS[1],
    };
}

export function makeLoadBalancingFilm(input: LoadBalancingInput, suffix = 'learn'): LessonFilmData {
    const result = simulateLoadBalancer(input);
    return {
        id: `load-balancing-${suffix}-${result.input.policy}`,
        question: 'Which replica should receive the next request?',
        takeaway:
            'A routing policy chooses a replica; observed load, capacity and health determine what happens next.',
        nodes: [
            { id: 'r', label: 'Load balancer', kind: 'router', x: -240, y: 0 },
            ...['A', 'B', 'C'].map((name, i) => ({
                id: name.toLowerCase(),
                label: `Server ${name}`,
                kind: 'server' as const,
                x: i * 130,
                y: 0,
            })),
        ],
        links: [
            ['r', 'a'],
            ['r', 'b'],
            ['r', 'c'],
        ],
        beats: result.beats,
        sourceHref: '/learn/sources#load-balancing',
    };
}

export const LOAD_BALANCING_QUESTIONS = [
    {
        chapter: 'load-balancing',
        prompt: 'A handles a long request while B/C finish theirs. Which observation guides least-connections routing?',
        choices: [
            'The number of active connections on each eligible replica',
            'The storage shard that owns the client key',
        ] as [string, string],
        correct: 0,
        explanation:
            'Least-connections compares active connections, not storage-key ownership. This model uses one connection per request; multiplexed workloads need more care.',
    },
    {
        chapter: 'load-balancing',
        prompt: 'A has failed, but the balancer has not observed the failure. What can happen to the next request routed to A?',
        choices: [
            'It must succeed because other replicas are healthy',
            'It can fail before passive health detection excludes A',
        ] as [string, string],
        correct: 1,
        explanation:
            'Detection takes evidence. This model marks A unavailable after one connection failure; real thresholds, timeouts and retry policies are configuration dependent.',
    },
];
