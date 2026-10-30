import type { FilmBeat, LessonFilmData } from './film-model';

export type LogCrash = 'none' | 'before-commit' | 'after-commit';
export type PartitionedLogInput = {
    partitions: number;
    consumersA: number;
    recordsPerPartition: number;
    readsB: number;
    crash: LogCrash;
    reverseFetch: boolean;
};
export type LogRecord = { partition: number; offset: number; key: string };
export type LogSnapshot = {
    committedA: number[];
    committedB: number[];
    owners: (number | null)[];
    aliveA: number[];
    attemptsA: number;
    attemptsB: number;
    retained: number;
};
export type LogEvent = LogSnapshot & {
    kind: 'append' | 'process' | 'commit' | 'crash' | 'rebalance' | 'finish';
    group?: 'a' | 'b';
    partition?: number;
    offset?: number;
    consumer?: number;
};
export const PARTITIONED_LOG_DEFAULT: PartitionedLogInput = {
    partitions: 2,
    consumersA: 2,
    recordsPerPartition: 2,
    readsB: 1,
    crash: 'before-commit',
    reverseFetch: false,
};
export const LOG_PREDICTIONS = [
    'Group A repeats an already processed record',
    'Group A does not repeat a processed record',
] as const;
export const PARTITIONED_LOG_SOURCES = [
    {
        url: 'https://kafka.apache.org/41/getting-started/introduction/',
        section: 'Main Concepts and Terminology',
        read: '2026-10-30',
    },
    {
        url: 'https://kafka.apache.org/41/design/design/',
        section: 'The Consumer; Consumer Position; Message Delivery Semantics; Using Transactions',
        read: '2026-10-30',
    },
];
const bounded = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, Math.floor(Number.isFinite(value) ? value : min)));

/** Classic partition-assigned consumer groups, not Kafka share groups. Every run starts a new topic. */
export type PartitionedLogResult = {
    input: PartitionedLogInput;
    partitions: LogRecord[][];
    events: LogEvent[];
    beats: FilmBeat[];
    assignments: { phase: string; owners: (number | null)[]; aliveA: number[] }[];
    effectsA: LogRecord[];
    effectsB: LogRecord[];
    committedA: number[];
    committedB: number[];
    retained: number;
    duplicatesA: number;
    lagA: number;
    lagB: number;
    idleInitially: number;
    outcome: (typeof LOG_PREDICTIONS)[number];
};

export function simulatePartitionedLog(raw: PartitionedLogInput): PartitionedLogResult {
    const input: PartitionedLogInput = {
        partitions: bounded(raw.partitions, 1, 3),
        consumersA: bounded(raw.consumersA, 1, 4),
        recordsPerPartition: bounded(raw.recordsPerPartition, 1, 4),
        readsB: bounded(raw.readsB, 0, 4),
        crash: ['none', 'before-commit', 'after-commit'].includes(raw.crash) ? raw.crash : 'none',
        reverseFetch: !!raw.reverseFetch,
    };
    const partitions = Array.from({ length: input.partitions }, (_, p) =>
        Array.from(
            { length: input.recordsPerPartition },
            (_record, offset): LogRecord => ({ partition: p, offset, key: `account-${p}` })
        )
    );
    const committedA = Array(input.partitions).fill(0) as number[];
    const committedB = Array(input.partitions).fill(0) as number[];
    let aliveA = Array.from({ length: input.consumersA }, (_, i) => i);
    let owners: (number | null)[] = partitions.map((_, p) => p % input.consumersA);
    const assignments: { phase: string; owners: (number | null)[]; aliveA: number[] }[] = [
        { phase: 'initial', owners: [...owners], aliveA: [...aliveA] },
    ];
    const effectsA: LogRecord[] = [];
    const effectsB: LogRecord[] = [];
    const events: LogEvent[] = [];
    const beats: FilmBeat[] = [];
    let retained = 0;
    let crashed = false;
    const snapshot = (): LogSnapshot => ({
        committedA: [...committedA],
        committedB: [...committedB],
        owners: [...owners],
        aliveA: [...aliveA],
        attemptsA: effectsA.length,
        attemptsB: effectsB.length,
        retained,
    });
    const visual = () => ({
        counts: { p: retained, q: retained, a: effectsA.length, b: effectsB.length },
        values: {
            p: `${retained} appended`,
            q: `${input.partitions} partitions`,
            a: `next: ${committedA.join('/')}`,
            b: `next: ${committedB.join('/')}`,
        },
    });
    const emit = (event: Omit<LogEvent, keyof LogSnapshot>, beat: FilmBeat): void => {
        events.push({ ...event, ...snapshot() });
        beats.push({ ...beat, ...visual() });
    };
    for (let p = 0; p < input.partitions; p++) {
        retained += partitions[p].length;
        emit(
            { kind: 'append', partition: p },
            {
                title: `Append to partition P${p}`,
                caption: `Producer key account-${p} selects P${p}. Offsets 0–${input.recordsPerPartition - 1} identify records inside that partition.`,
                from: 'p',
                to: 'q',
                packet: `P${p} batch`,
                states: { p: 'active', q: 'done', a: 'idle', b: 'idle' },
            }
        );
    }
    const order = partitions.map((_, p) => p);
    if (input.reverseFetch) order.reverse();
    // One record per visited partition per round. There is no global ordering guarantee.
    while (aliveA.length > 0 && committedA.some((next) => next < input.recordsPerPartition)) {
        for (const p of order) {
            const offset = committedA[p];
            if (offset >= input.recordsPerPartition) continue;
            const consumer = owners[p]!;
            const record = partitions[p][offset];
            const repeated = effectsA.some((old) => old.partition === p && old.offset === offset);
            effectsA.push({ ...record });
            emit(
                { kind: 'process', group: 'a', partition: p, offset, consumer },
                {
                    title: `${repeated ? 'Replay' : 'Process'} P${p} offset ${offset}`,
                    caption: `Group A consumer A${consumer} ${repeated ? 'repeats' : 'processes'} this record. Its side effect exists; the committed next offset is still ${committedA[p]}.`,
                    from: 'q',
                    to: 'a',
                    packet: `P${p}@${offset}`,
                    states: { q: 'done', a: 'active' },
                }
            );
            const failHere = !crashed && consumer === 0 && input.crash !== 'none';
            if (!failHere || input.crash === 'after-commit') {
                committedA[p] = offset + 1;
                emit(
                    { kind: 'commit', group: 'a', partition: p, offset: offset + 1, consumer },
                    {
                        title: `Commit next offset ${offset + 1}`,
                        caption: `A${consumer} saves P${p} next offset ${offset + 1}. A replacement resumes there, not at the last processed offset.`,
                        from: 'a',
                        to: 'q',
                        packet: `P${p} next ${offset + 1}`,
                        states: { a: 'done', q: 'done' },
                    }
                );
            }
            if (failHere) {
                crashed = true;
                aliveA = aliveA.filter((id) => id !== 0);
                owners = owners.map((owner) => (owner === 0 ? null : owner));
                assignments.push({ phase: 'failure observed', owners: [...owners], aliveA: [...aliveA] });
                emit(
                    { kind: 'crash', group: 'a', partition: p, offset, consumer: 0 },
                    {
                        title: 'Consumer A0 crashes',
                        caption:
                            input.crash === 'before-commit'
                                ? `The effect happened, but P${p} next offset remains ${committedA[p]}. A replacement can repeat the effect.`
                                : `P${p} next offset ${committedA[p]} was saved before the crash. This record needs no replay in this run.`,
                        states: { a: aliveA.length ? 'active' : 'failed' },
                    }
                );
                owners = partitions.map((_, partition) =>
                    aliveA.length ? aliveA[partition % aliveA.length] : null
                );
                assignments.push({ phase: 'reassigned', owners: [...owners], aliveA: [...aliveA] });
                emit(
                    { kind: 'rebalance', group: 'a' },
                    {
                        title: aliveA.length
                            ? 'Reassign partition ownership'
                            : 'No consumer remains in group A',
                        caption: aliveA.length
                            ? `Each partition has one surviving owner. A consumer may own several partitions and resumes from their committed next offsets.`
                            : 'With no surviving consumer, group A stops here. Retained records wait; group B can continue independently.',
                        states: { a: aliveA.length ? 'active' : 'failed' },
                    }
                );
                break;
            }
        }
    }
    for (let offset = 0; offset < Math.min(input.readsB, input.recordsPerPartition); offset++)
        for (const p of order) {
            effectsB.push({ ...partitions[p][offset] });
            emit(
                { kind: 'process', group: 'b', partition: p, offset, consumer: 0 },
                {
                    title: `Group B reads P${p}@${offset}`,
                    caption: `B0 independently processes P${p} offset ${offset}. Group A’s offsets and side effects do not move.`,
                    from: 'q',
                    to: 'b',
                    packet: `P${p}@${offset}`,
                    states: { b: 'active', q: 'done' },
                }
            );
            committedB[p] = offset + 1;
            emit(
                { kind: 'commit', group: 'b', partition: p, offset: offset + 1, consumer: 0 },
                {
                    title: `Group B commits P${p} next ${offset + 1}`,
                    caption:
                        'Group B saves only its own position. Reading does not delete the retained record.',
                    from: 'b',
                    to: 'q',
                    packet: `P${p} next ${offset + 1}`,
                    states: { b: 'done', q: 'done' },
                }
            );
        }
    const uniqueA = new Set(effectsA.map((record) => `${record.partition}/${record.offset}`)).size;
    const duplicatesA = effectsA.length - uniqueA;
    const lagA = retained - committedA.reduce((sum, n) => sum + n, 0);
    const lagB = retained - committedB.reduce((sum, n) => sum + n, 0);
    emit(
        { kind: 'finish' },
        {
            title: 'Two groups, two positions',
            caption: `${retained} records remain retained. Group A has ${duplicatesA} repeated effect and ${lagA} uncommitted records; group B has ${lagB} unread records.`,
            states: { p: 'done', q: 'done', a: aliveA.length ? 'done' : 'failed', b: 'done' },
        }
    );
    return {
        input,
        partitions,
        events,
        beats,
        assignments,
        effectsA,
        effectsB,
        committedA: [...committedA],
        committedB: [...committedB],
        retained,
        duplicatesA,
        lagA,
        lagB,
        idleInitially: Math.max(0, input.consumersA - input.partitions),
        outcome: duplicatesA ? LOG_PREDICTIONS[0] : LOG_PREDICTIONS[1],
    };
}

export function makePartitionedLogFilm(input: PartitionedLogInput, suffix = 'learn'): LessonFilmData {
    return {
        id: `logs-streams-${suffix}`,
        question: 'How can a record be processed twice but stored only once?',
        takeaway:
            'Partitions define order; each consumer group owns its next offsets. Processing and committing are separate actions.',
        nodes: [
            { id: 'p', label: 'Producer', kind: 'computer', x: -260, y: 0 },
            { id: 'q', label: 'Broker / topic', kind: 'queue', x: -100, y: 0 },
            { id: 'a', label: 'Group A', kind: 'server', x: 100, y: 0 },
            { id: 'b', label: 'Group B', kind: 'server', x: 260, y: 0 },
        ],
        links: [
            ['p', 'q'],
            ['q', 'a'],
            ['q', 'b'],
        ],
        beats: simulatePartitionedLog(input).beats,
        sourceHref: '/learn/sources#logs-streams',
    };
}

export const PARTITIONED_LOG_QUESTIONS = [
    {
        chapter: 'logs-streams',
        prompt: 'In a classic consumer group, a topic has two partitions and four subscribed consumers. How many consumers can own a partition concurrently?',
        choices: [
            'At most two consumers; each partition has one owner in that group',
            'All four consumers can share each partition simultaneously',
        ] as [string, string],
        correct: 0,
        explanation:
            'Classic consumer groups assign each partition to one member at a time; extra members may be idle. Separate groups can independently read it. Kafka share groups are a different consumption model.',
    },
    {
        chapter: 'logs-streams',
        prompt: 'A consumer processes P0 offset 2, then crashes before committing next offset 3. The saved next offset is still 2. What can its replacement do?',
        choices: [
            'Prove the external side effect happened exactly once',
            'Read offset 2 again and repeat an unprotected side effect',
        ] as [string, string],
        correct: 1,
        explanation:
            'The replacement resumes from the saved next offset. External side effects and offset commits are separate here; deduplication or a coordinated output/offset transaction is needed for stronger guarantees.',
    },
];
