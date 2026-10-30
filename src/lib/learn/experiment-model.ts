import type { FilmBeat, FilmNode, LessonFilmData } from './film-model';
import {
    LOAD_BALANCING_DEFAULT,
    ROUTING_PREDICTIONS,
    makeLoadBalancingFilm,
    simulateLoadBalancer,
} from './load-balancing';
import {
    PARTITIONED_LOG_DEFAULT,
    LOG_PREDICTIONS,
    makePartitionedLogFilm,
    simulatePartitionedLog,
} from './partitioned-log';
import {
    SECURITY_MODELS,
    isSecurityMechanism,
    simulateSecurity,
    type SecurityMechanism,
} from './security-models';
import { TOPIC_MODELS, isTopicMechanism, simulateTopic, type TopicMechanism } from './topic-models';

export type Mechanism =
    | TopicMechanism
    | SecurityMechanism
    | 'partitionedLog'
    | 'loadBalance'
    | 'dedup'
    | 'pagination'
    | 'version'
    | 'bucket'
    | 'index'
    | 'transaction'
    | 'isolation'
    | 'log'
    | 'bloom'
    | 'queue'
    | 'cache'
    | 'eviction'
    | 'fanout'
    | 'replication'
    | 'quorum'
    | 'merge'
    | 'partition'
    | 'hashring'
    | 'clock'
    | 'lease'
    | 'budget'
    | 'gate'
    | 'copies'
    | 'window'
    | 'unique'
    | 'retention'
    | 'cost'
    | 'signals'
    | 'trace'
    | 'decision'
    | 'breaker'
    | 'health'
    | 'identity'
    | 'rotation'
    | 'spatial'
    | 'columns';
export type ExperimentInput = { amount: number; alternative: boolean };
export type Trace = {
    beats: FilmBeat[];
    outcome: string;
    explanation: string;
    metrics: { label: string; value: string }[];
};
export type MechanismDefinition = {
    label: string;
    min: number;
    max: number;
    initial: number;
    modes: [string, string];
    predictions: [string, string];
    roles: [string, string, string];
    kinds: [FilmNode['kind'], FilmNode['kind'], FilmNode['kind']];
};
const def = (
    label: string,
    modes: [string, string],
    predictions: [string, string],
    roles: [string, string, string],
    initial = 6,
    min = 1,
    max = 8
): MechanismDefinition => ({
    label,
    min,
    max,
    initial,
    modes,
    predictions,
    roles,
    kinds: ['router', 'store', 'store'],
});
export const MECHANISMS: Record<Mechanism, MechanismDefinition> = {
    ...TOPIC_MODELS,
    ...SECURITY_MODELS,
    partitionedLog: def(
        'Records per partition',
        ['Crash before committing offset', 'Crash after committing offset'],
        [...LOG_PREDICTIONS],
        ['Topic partitions', 'Consumer group A', 'Consumer group B'],
        2,
        1,
        4
    ),
    loadBalance: def(
        'Requests arriving',
        ['Round robin', 'Least active connections'],
        [...ROUTING_PREDICTIONS],
        ['Server A', 'Server B', 'Server C'],
        9,
        1,
        12
    ),
    dedup: def(
        'Delivery attempts',
        ['No operation key', 'Reuse one durable key'],
        ['One effect', 'Repeated effects'],
        ['Operation keys', 'Saved effects', 'Reply'],
        4
    ),
    pagination: def(
        'Previously returned row id',
        ['Offset after deletion', 'Continue after last key'],
        ['One row skipped', 'No row skipped'],
        ['Ordered rows', 'Next page', 'Last key'],
        4,
        2,
        7
    ),
    version: def(
        'Proposed new field number',
        ['Add a new field', 'Reuse old field 1'],
        ['Old meaning preserved', 'Old meaning overwritten'],
        ['New schema', 'Old reader', 'Field meanings'],
        4,
        2
    ),
    bucket: def(
        'Requests in this burst',
        ['One burst', 'One refill between requests'],
        ['All admitted', 'Some rejected'],
        ['Available tokens', 'Admitted requests', 'Rejected requests']
    ),
    index: def(
        'Sorted records to search',
        ['Sequential scan', 'Binary search proxy'],
        ['All rows inspected', 'Candidates narrowed'],
        ['Search steps', 'Candidate records', 'Matching record']
    ),
    transaction: def(
        'Starting balance in each account',
        ['Separate writes; crash midway', 'Atomic group; crash midway'],
        ['Total preserved', 'Partial transfer'],
        ['Account A', 'Account B', 'Transfer log'],
        6,
        3
    ),
    isolation: def(
        'Starting counter value',
        ['Unprotected read-modify-write', 'Serialize both increments'],
        ['One increment lost', 'Both increments kept'],
        ['Writer A', 'Writer B', 'Stored counter']
    ),
    log: def(
        'Committed log entries',
        ['Crash before page update', 'Replay the durable log'],
        ['Page behind log', 'Page recovered'],
        ['Durable log', 'Data page', 'Recovery']
    ),
    bloom: def(
        'Key to look up',
        ['Check filter first', 'Read authoritative set directly'],
        ['Origin lookup required', 'Origin lookup skipped'],
        ['Bit filter', 'Authoritative set', 'Membership result'],
        7
    ),
    queue: def(
        'Jobs arriving in one window',
        ['One worker; 3 jobs per window', 'Two workers; 6 jobs per window'],
        ['Backlog remains', 'Backlog drained'],
        ['Pending jobs', 'Completed jobs', 'Workers']
    ),
    cache: def(
        'Age of cached copy (ticks)',
        ['Reuse if policy-fresh', 'Invalidate before reading'],
        ['Older copy returned', 'Current copy returned'],
        ['Cached version', 'Origin version', 'Returned version'],
        2,
        0
    ),
    eviction: def(
        'New key number',
        ['Exact LRU cache', 'Keep every key'],
        ['Bounded cache', 'Memory limit exceeded'],
        ['Cache slots', 'Origin store', 'New key'],
        4,
        4
    ),
    fanout: def(
        'Independent subscribers',
        ['Deliver to one subscriber only', 'Deliver to every subscriber'],
        ['Some subscribers missed', 'Every subscriber received'],
        ['Event publisher', 'Delivery copies', 'Subscriber receipts'],
        6,
        2
    ),
    replication: def(
        'Leader version',
        ['Follower trails by 2 versions', 'Wait for follower to catch up'],
        ['Older replica read', 'Current replica read'],
        ['Leader', 'Follower', 'Read result'],
        6,
        3
    ),
    quorum: def(
        'Reachable voters out of 3',
        ['Use reachable voters', 'Partition leaves only one reachable'],
        ['Majority available', 'Majority unavailable'],
        ['Voter A', 'Voter B', 'Voter C'],
        3,
        1,
        3
    ),
    merge: def(
        'Replica A increments',
        ['Add duplicated component totals', 'Merge components with max'],
        ['Duplicate counted', 'Idempotent merge'],
        ['Replica A', 'Replica B', 'Merged counter']
    ),
    partition: def(
        'Keys or requests to route',
        ['Even modulo placement', 'Every request hits one hot key'],
        ['Load within per-shard capacity', 'Hot shard'],
        ['Shard A', 'Shard B', 'Shard C']
    ),
    hashring: def(
        'Keys in the teaching ring',
        ['Original 3 tokens', 'Add token 50'],
        ['No ownership changes', 'Only a subset moves'],
        ['Token 33', 'Token 66', 'Token 99']
    ),
    clock: def(
        'Sender logical time',
        ['Order by a skewed wall clock', 'Apply Lamport receive rule'],
        ['Wall-clock order ambiguous', 'Causal timestamp advanced'],
        ['Sender clock', 'Receiver clock', 'Observation']
    ),
    lease: def(
        'Incoming fencing token',
        ['Accept without token check', 'Reject tokens older than 3'],
        ['Write accepted', 'Stale write rejected'],
        ['Protected resource', 'Latest token', 'Delayed write'],
        2
    ),
    budget: def(
        'Bad requests out of 100',
        ['95% objective', '99% objective'],
        ['Within error budget', 'Budget exceeded'],
        ['Allowed failures', 'Observed failures', 'Remaining budget'],
        4,
        0
    ),
    gate: def(
        'Requests for another user’s resource',
        ['Check sign-in only', 'Check identity and resource permission'],
        ['Unauthorized exposure', 'Access denied'],
        ['Policy check', 'Protected resource', 'Denied requests']
    ),
    copies: def(
        'Copies holding one shared fact',
        ['Update one duplicate', 'Update all declared copies'],
        ['Stale copies remain', 'Copies agree'],
        ['Copies', 'Updated copies', 'Stale copies']
    ),
    window: def(
        'Event-time watermark before event 3 arrives',
        ['No late corrections after close', 'Accept a late correction'],
        ['Two events counted', 'Three events counted'],
        ['Arriving events', 'Window aggregate', 'Late events'],
        8,
        3,
        10
    ),
    unique: def(
        'Local counter on both nodes',
        ['Use local counter alone', 'Namespace by distinct node ids'],
        ['Identifier collision', 'Distinct identifiers'],
        ['Node 1', 'Node 2', 'Generated IDs']
    ),
    retention: def(
        'Age of retained record (ticks)',
        ['Delete primary copy only', 'Propagate deletion to two backups'],
        ['Retained copies remain', 'All modelled copies deleted'],
        ['Primary copy', 'Backup copies', 'Deletion work'],
        6
    ),
    cost: def(
        'Work units in this example',
        ['Plan A: 10 + 2 per unit', 'Plan B: 15 + 2 per pair'],
        ['Plan A cheaper', 'Plan B cheaper'],
        ['Compute work', 'Fixed cost', 'Illustrative total'],
        8
    ),
    signals: def(
        'Failed requests out of 100',
        ['Inspect CPU alone', 'Inspect user request errors'],
        ['User symptom hidden', 'User errors visible'],
        ['CPU snapshot', 'User errors', 'Observed signal'],
        4,
        1
    ),
    trace: def(
        'Duration of parallel child A (ticks)',
        ['Sum overlapping child spans', 'Take the parallel critical path'],
        ['Overcounted latency', 'Critical path respected'],
        ['Child A', 'Child B: 3 ticks', 'Request duration'],
        6
    ),
    breaker: def(
        'Calls during a failing period',
        ['Keep calling', 'Open after two failures'],
        ['Failure load continues', 'Calls bounded by breaker'],
        ['Circuit state', 'Failing dependency', 'Rejected locally']
    ),
    health: def(
        'Incoming requests',
        ['Route to a running but unready process', 'Honor readiness and route to a ready process'],
        ['Unready host receives traffic', 'Traffic sent to ready host'],
        ['Unready host', 'Ready host', 'Failed requests']
    ),
    identity: def(
        'Credential age (ticks)',
        ['Ignore expiry', 'Check expiry at tick 3'],
        ['Expired credential accepted', 'Expired credential rejected'],
        ['Credential validator', 'Identity result', 'Rejected requests'],
        6,
        4
    ),
    rotation: def(
        'Incoming credential generation',
        ['Trust retired generations', 'Reject generations older than 3'],
        ['Retired credential accepted', 'Retired credential rejected'],
        ['Credential policy', 'Active generation', 'Retired credential'],
        2,
        1,
        2
    ),
    spatial: def(
        'Search radius (coordinate units)',
        ['Accept every bounding-box candidate', 'Check exact Euclidean distance'],
        ['False candidate retained', 'Exact matches only'],
        ['Bounding-box index', 'Candidate places', 'Exact results'],
        4,
        1,
        6
    ),
    columns: def(
        'Columns per stored record',
        ['Read all columns', 'Read one selected column'],
        ['Unrelated cells read', 'Only selected column read'],
        ['Stored columns', 'Cells read', 'Selected column'],
        6,
        2
    ),
    decision: def(
        'Required units of capacity',
        ['Cheap plan: capacity 3', 'Larger plan: capacity 8'],
        ['Requirement met', 'Requirement missed'],
        ['Requirement', 'Chosen capacity', 'Unserved work']
    ),
};

/** Finite, discrete teaching models. No live network, random output or benchmark claims. */
export function simulateMechanism(kind: Mechanism, input: ExperimentInput): Trace {
    if (isTopicMechanism(kind)) return simulateTopic(kind, input);
    if (isSecurityMechanism(kind)) return simulateSecurity(kind, input);
    const spec = MECHANISMS[kind];
    const n = Math.max(
        spec.min,
        Math.min(spec.max, Math.floor(Number.isFinite(input.amount) ? input.amount : spec.initial))
    );
    const alt = input.alternative;
    if (kind === 'partitionedLog') {
        const run = simulatePartitionedLog({
            ...PARTITIONED_LOG_DEFAULT,
            recordsPerPartition: n,
            crash: alt ? 'after-commit' : 'before-commit',
        });
        return {
            beats: run.beats,
            outcome: run.outcome,
            explanation:
                'Classic groups divide partition ownership and save independent next offsets. Processing before committing can repeat an effect after reassignment; reading does not delete records. No cross-partition total order is implied.',
            metrics: [
                { label: 'Retained records', value: String(run.retained) },
                { label: 'Repeated effects in group A', value: String(run.duplicatesA) },
                { label: 'Group B unread records', value: String(run.lagB) },
            ],
        };
    }
    if (kind === 'loadBalance') {
        const run = simulateLoadBalancer({
            ...LOAD_BALANCING_DEFAULT,
            requests: n,
            policy: alt ? 'least-connections' : 'round-robin',
        });
        return {
            beats: run.beats,
            outcome: run.outcome,
            explanation:
                'A takes six ticks; B/C take one, with one active connection per server. Round robin takes turns; least-connections compares current active connections. Routing does not create capacity.',
            metrics: [
                { label: 'Accepted requests', value: String(run.accepted) },
                { label: 'Capacity rejections', value: String(run.rejected) },
                { label: 'Connection failures', value: String(run.failed) },
            ],
        };
    }
    const beats: FilmBeat[] = [];
    const add = (
        title: string,
        caption: string,
        counts: Record<string, number> = {},
        values: Record<string, string> = {},
        from?: string,
        to?: string,
        outcomeNote = false
    ): void => {
        beats.push({
            title,
            caption,
            counts,
            values,
            ...(from && to ? { from, to, packet: outcomeNote ? `${title} · see outcome` : title } : {}),
        });
    };
    let outcome = '',
        explanation = '';
    const metrics: Trace['metrics'] = [];
    const metric = (label: string, value: number | string): void => {
        metrics.push({ label, value: String(value) });
    };
    switch (kind) {
        case 'dedup': {
            add('Before any delivery', 'The durable effect store begins empty.', { b: 0, a: 0 });
            for (let i = 1; i <= n; i++) {
                const effects = alt ? 1 : i;
                add(
                    `Attempt ${i}`,
                    alt && i > 1
                        ? 'The same key reuses an existing operation. No additional effect is created.'
                        : 'This attempt applies one effect.',
                    { a: alt ? 1 : 0, b: effects },
                    { b: `${effects} saved effects` },
                    'c',
                    'a'
                );
            }
            const effects = alt ? 1 : n;
            outcome = effects === 1 ? 'One effect' : 'Repeated effects';
            explanation = `${n} deliveries produced ${effects} effects in this model. Durable key handling must be coordinated with the effect.`;
            metric('Delivery attempts', n);
            metric('Saved effects', effects);
            break;
        }
        case 'queue': {
            const capacity = alt ? 6 : 3,
                done = Math.min(n, capacity);
            add('Arrival burst', `${n} jobs arrive in one illustrative service window.`, {
                a: n,
                b: 0,
                d: alt ? 2 : 1,
            });
            for (let i = 1; i <= done; i++)
                add(
                    `Complete job ${i}`,
                    'One job leaves the queue only when the model completes it.',
                    { a: n - i, b: i },
                    {},
                    'a',
                    'b'
                );
            outcome = n > capacity ? 'Backlog remains' : 'Backlog drained';
            explanation = `${done} jobs complete and ${n - done} remain. This is a finite window, not a steady-state latency formula.`;
            metric('Completed jobs', done);
            metric('Queued jobs', n - done);
            break;
        }
        case 'bucket': {
            let tokens = 3,
                accepted = 0,
                rejected = 0;
            add('Initial tokens', 'The bucket starts with three tokens.', { a: tokens, b: 0, d: 0 });
            for (let i = 1; i <= n; i++) {
                if (alt && i > 1) tokens = Math.min(3, tokens + 1);
                const allowed = tokens > 0;
                if (allowed) {
                    tokens--;
                    accepted++;
                } else rejected++;
                add(
                    `Request ${i}`,
                    allowed
                        ? 'Spend one available token to admit this request.'
                        : 'No token remains, so this burst request is rejected.',
                    { a: tokens, b: accepted, d: rejected },
                    { a: `${tokens} tokens` },
                    'c',
                    allowed ? 'b' : 'a',
                    !allowed
                );
            }
            outcome = rejected ? 'Some rejected' : 'All admitted';
            explanation = `${accepted} admitted, ${rejected} rejected. The refill schedule and capacity are explicit teaching assumptions.`;
            metric('Admitted', accepted);
            metric('Rejected', rejected);
            break;
        }
        case 'cache': {
            const reuse = !alt && n < 3,
                version = reuse ? 1 : 2;
            add(
                'Two stored versions',
                'The origin is version 2; the cache still holds version 1.',
                {},
                { a: 'v1', b: 'v2' }
            );
            add(
                alt ? 'Invalidate' : 'Check freshness',
                alt
                    ? 'Discard the cached copy before fetching.'
                    : `A cached copy aged ${n} ticks is policy-fresh only while its age is below 3.`,
                {},
                { a: alt ? 'invalidated' : `age ${n}` },
                'c',
                'a'
            );
            add(
                'Read result',
                reuse
                    ? 'The policy permits an older copy; policy-fresh does not mean the newest origin version.'
                    : 'The origin supplies version 2.',
                { d: version },
                { d: `v${version}` },
                reuse ? 'a' : 'b',
                'c'
            );
            outcome = reuse ? 'Older copy returned' : 'Current copy returned';
            explanation = `Returned version ${version}. This example distinguishes cache policy from latest-value semantics.`;
            metric('Returned version', version);
            metric('Origin reads', reuse ? 0 : 1);
            break;
        }
        case 'replication': {
            const follower = alt ? n : n - 2;
            add(
                'Leader commits',
                `The leader's illustrative version is ${n}.`,
                { a: n, b: n - 2 },
                { a: `v${n}`, b: `v${n - 2}` },
                'c',
                'a'
            );
            add(
                alt ? 'Wait for catch-up' : 'Propagation is pending',
                alt
                    ? 'The follower applies the remaining versions before this read.'
                    : 'The asynchronous follower has not applied the final two versions.',
                { a: n, b: follower },
                { a: `v${n}`, b: `v${follower}` },
                'a',
                'b',
                !alt
            );
            add(
                'Read from follower',
                `The chosen read sees version ${follower}.`,
                { d: follower },
                { d: `v${follower}` },
                'b',
                'c'
            );
            outcome = alt ? 'Current replica read' : 'Older replica read';
            explanation = `Leader v${n}, follower v${follower}. Waiting for this follower is an assumption, not a proof of global linearizability.`;
            metric('Version gap', n - follower);
            metric('Read version', follower);
            break;
        }
        case 'quorum': {
            const available = alt ? 1 : n;
            add(
                'Three-voter configuration',
                'This example requires two of three voters, a strict majority.',
                { c: 0 },
                { c: 'need 2 of 3' }
            );
            for (let i = 0; i < available; i++)
                add(
                    `Vote ${i + 1}`,
                    'One reachable configured voter responds.',
                    { c: i + 1 },
                    { c: `${i + 1} acknowledgments` },
                    ['a', 'b', 'd'][i],
                    'c'
                );
            outcome = available >= 2 ? 'Majority available' : 'Majority unavailable';
            explanation = `${available} voters reachable; two required. Raft also needs term, log and commit rules not simulated by this vote counter.`;
            metric('Reachable voters', available);
            metric('Required majority', 2);
            break;
        }
        case 'index': {
            let inspected = 0,
                lo = 1;
            const hi = n;
            add('Search for the last key', `The sorted teaching dataset contains keys 1 through ${n}.`, {
                b: n,
                a: 0,
            });
            if (alt) {
                while (lo <= hi) {
                    const mid = Math.floor((lo + hi) / 2);
                    inspected++;
                    add(
                        `Compare key ${mid}`,
                        'Discard candidates that cannot contain the target key.',
                        { a: inspected, b: hi - lo + 1 },
                        { a: `compare ${mid}`, b: `${lo}…${hi}` },
                        'a',
                        'b'
                    );
                    if (mid === n) break;
                    lo = mid + 1;
                }
            } else
                for (let i = 1; i <= n; i++) {
                    inspected++;
                    add(
                        `Inspect row ${i}`,
                        'The sequential scan examines the next record.',
                        { a: inspected, b: n - i + 1 },
                        { a: `row ${i}` },
                        'a',
                        'b'
                    );
                }
            outcome = inspected < n ? 'Candidates narrowed' : 'All rows inspected';
            explanation = `${inspected} comparisons for ${n} records. Binary search is a proxy for narrowing, not a PostgreSQL B-tree implementation or query-cost model.`;
            metric('Records', n);
            metric('Comparisons', inspected);
            break;
        }
        case 'transaction': {
            add(
                'Before transfer',
                'Two accounts each start with the same illustrative balance.',
                { a: n, b: n },
                { a: String(n), b: String(n) }
            );
            add(
                'Debit is attempted',
                'Subtract three from account A before attempting the corresponding credit.',
                { a: n - 3, b: n },
                { a: String(n - 3), b: String(n) },
                'a',
                'b',
                true
            );
            const left = alt ? n : n - 3;
            add(
                alt ? 'Rollback both changes' : 'Separate debit survives',
                alt
                    ? 'The atomic group fails and restores the pre-transaction state.'
                    : 'The independent debit remains after a crash before credit.',
                { a: left, b: n },
                { a: String(left), b: String(n) }
            );
            outcome = alt ? 'Total preserved' : 'Partial transfer';
            explanation = `Initial total ${2 * n}; final total ${left + n}. Atomicity groups these local writes, not an unrelated external provider.`;
            metric('Initial total', 2 * n);
            metric('Final total', left + n);
            break;
        }
        case 'isolation': {
            add(
                'Two writers start',
                'Both operations intend to increment one counter.',
                { d: n },
                { d: String(n) }
            );
            add(
                'First increment',
                `The first writer stores ${n + 1}.`,
                { d: n + 1 },
                { d: String(n + 1) },
                'a',
                'd'
            );
            const final = n + (alt ? 2 : 1);
            add(
                'Second increment',
                alt
                    ? 'The second operation reads the committed newer value before incrementing.'
                    : 'The second writer stores a value computed from its earlier stale read.',
                { d: final },
                { d: String(final) },
                'b',
                'd'
            );
            outcome = alt ? 'Both increments kept' : 'One increment lost';
            explanation = `Start ${n}, intended ${n + 2}, observed ${final}. This isolates a lost-update example, not every database isolation level.`;
            metric('Intended counter', n + 2);
            metric('Observed counter', final);
            break;
        }
        case 'partition': {
            const loads = [0, 0, 0];
            add('Empty shards', 'Each shard can handle two requests in this teaching window.', {
                a: 0,
                b: 0,
                d: 0,
            });
            for (let i = 0; i < n; i++) {
                const k = alt ? 0 : i % 3;
                loads[k]++;
                add(
                    `Route request ${i + 1}`,
                    alt
                        ? 'The popular key keeps selecting shard A.'
                        : 'Modulo placement selects the next shard for this synthetic key sequence.',
                    { a: loads[0], b: loads[1], d: loads[2] },
                    {},
                    'c',
                    ['a', 'b', 'd'][k]
                );
            }
            const hot = Math.max(...loads) > 2;
            outcome = hot ? 'Hot shard' : 'Load within per-shard capacity';
            explanation = `Shard loads ${loads.join(', ')}. This assumes equal request cost and does not simulate network partitioning.`;
            metric('Highest shard load', Math.max(...loads));
            metric('Capacity per shard', 2);
            break;
        }
        case 'log': {
            add(
                'Append durable records',
                `${n} committed records are assumed durable before the data page changes.`,
                { a: n, b: 0 },
                { a: `${n} durable records`, b: '0 applied' },
                'c',
                'a'
            );
            add(
                'Crash before page update',
                'The page remains behind; recovery can consult the durable log.',
                { a: n, b: 0 },
                { b: 'page behind' }
            );
            add(
                alt ? 'Replay' : 'Inspect without replay',
                alt
                    ? 'Apply the logged committed changes to rebuild the page.'
                    : 'Without replay, the page remains behind the log.',
                { a: n, b: alt ? n : 0 },
                { b: `${alt ? n : 0} applied` },
                'a',
                'b',
                !alt
            );
            outcome = alt ? 'Page recovered' : 'Page behind log';
            explanation = `Log entries ${n}, applied page updates ${alt ? n : 0}. Real durability also depends on storage and flush guarantees.`;
            metric('Durable log records', n);
            metric('Applied page updates', alt ? n : 0);
            break;
        }
        case 'pagination': {
            const data = Array.from({ length: 10 }, (_, i) => i + 1).filter((v) => v !== 1);
            const page = alt ? data.filter((v) => v > n).slice(0, 3) : data.slice(n, n + 3);
            const skip = !page.includes(n + 1);
            add(
                'Earlier page ended',
                `The client previously received rows through id ${n}.`,
                { a: 10 },
                { d: `last id ${n}` }
            );
            add(
                'Delete an earlier row',
                'Row 1 is removed before the next page is fetched.',
                { a: 9 },
                { a: 'row 1 deleted' }
            );
            add(
                'Fetch next page',
                alt
                    ? 'Continue after the stable last key.'
                    : 'Apply the previous numeric offset to a shifted collection.',
                { b: page.length },
                { b: page.join(', ') },
                'a',
                'b'
            );
            outcome = skip ? 'One row skipped' : 'No row skipped';
            explanation = `Next ids: ${page.join(', ')}. The diagram abbreviates the ten-row collection; this is not a snapshot-isolation guarantee.`;
            metric('Next row ids', page.join(', '));
            metric('Expected next id', n + 1);
            break;
        }
        case 'bloom': {
            const present = [2, 4, 6].includes(n),
                positive = n % 2 === 0,
                lookup = alt || positive;
            add(
                'Constructed one-hash filter',
                'Keys 2, 4 and 6 set their positions under key modulo 4.',
                {},
                { a: 'bits 0 and 2', b: 'keys 2,4,6' }
            );
            add(
                'Query filter',
                positive
                    ? 'Every required bit is set: membership is possible.'
                    : 'A required bit is absent: the key cannot be in this constructed set.',
                {},
                { a: positive ? 'possibly present' : 'definitely absent' },
                'c',
                'a'
            );
            add(
                'Check authoritative membership',
                lookup
                    ? 'A possible match or direct lookup is checked against the actual set.'
                    : 'The negative filter result safely skips this origin lookup.',
                { b: lookup ? 1 : 0 },
                { d: present ? 'present' : 'absent' },
                'a',
                'b',
                !lookup
            );
            outcome = lookup ? 'Origin lookup required' : 'Origin lookup skipped';
            explanation = `Key ${n} is ${present ? 'present' : 'absent'}; ${lookup ? 1 : 0} origin lookups. Key 8 demonstrates a false positive, not a false negative.`;
            metric('Origin reads', lookup ? 1 : 0);
            metric('Actual membership', present ? 'present' : 'absent');
            break;
        }
        case 'hashring': {
            const keys = [10, 20, 35, 45, 60, 70, 90, 95].slice(0, n),
                old = [33, 66, 99],
                next = alt ? [33, 50, 66, 99] : old;
            const owner = (k: number, t: number[]) => t.find((v) => v >= k) ?? t[0];
            const moved = keys.filter((k) => owner(k, old) !== owner(k, next));
            add(
                'Original ring',
                'Each key belongs to its next token on the circular order.',
                {},
                { a: 'token 33', b: 'token 66', d: 'token 99' }
            );
            add(
                'Change membership',
                alt ? 'Insert token 50 between tokens 33 and 66.' : 'Keep the existing three-token ring.',
                { c: alt ? 1 : 0 },
                { c: alt ? 'new token 50' : 'unchanged membership' }
            );
            add(
                'Measure reassignment',
                `${moved.length} of ${n} illustrative keys change owner.`,
                { c: moved.length },
                { c: moved.join(', ') || 'no moved keys' }
            );
            outcome = moved.length ? 'Only a subset moves' : 'No ownership changes';
            explanation = `Moved keys: ${moved.join(', ') || 'none'}. These fixed keys illustrate range reassignment; virtual nodes and hot-key mitigation are omitted.`;
            metric('Moved keys', moved.length);
            metric('Total keys', n);
            break;
        }
        case 'merge': {
            const total = n + (alt ? 2 : 4);
            add(
                'Independent components',
                `Replica A records ${n}; replica B records 2 increments.`,
                { a: n, b: 2 },
                { a: `[${n},0]`, b: '[0,2]' }
            );
            add(
                'Receive B twice',
                'Replay the same replica-B state twice.',
                { a: n, b: 2 },
                { b: 'duplicate state message' },
                'b',
                'a'
            );
            add(
                'Merge components',
                alt
                    ? 'Componentwise maximum retains the same contribution on replay.'
                    : 'Adding the same component again double-counts B.',
                { d: total },
                { d: String(total) }
            );
            outcome = alt ? 'Idempotent merge' : 'Duplicate counted';
            explanation = `Expected ${n + 2}, observed ${total}. This is a grow-only counter; arbitrary edits and deletes require other rules.`;
            metric('Expected total', n + 2);
            metric('Merged total', total);
            break;
        }
        case 'lease': {
            const denied = alt && n < 3;
            add(
                'Newer owner is known',
                'The protected resource already remembers fencing token 3.',
                {},
                { a: 'latest token 3' }
            );
            add(
                'Old worker resumes',
                `A delayed operation arrives with token ${n}.`,
                {},
                { c: `incoming token ${n}` },
                'c',
                'a',
                denied
            );
            outcome = denied ? 'Stale write rejected' : 'Write accepted';
            explanation = denied
                ? 'The resource rejects the older token; expiration alone would not stop this resumed worker.'
                : 'The operation is accepted in this model. Without fencing, an older token can overwrite newer work.';
            metric('Incoming token', n);
            metric('Latest token', 3);
            break;
        }
        case 'budget': {
            const allowed = alt ? 1 : 5,
                remaining = allowed - n;
            add('Define the window', `Assume 100 requests and an allowed bad-request count of ${allowed}.`, {
                a: allowed,
            });
            add(
                'Observe bad requests',
                `${n} of the 100 requests are bad in this example.`,
                { b: n },
                { b: `${n}/100` },
                'c',
                'b'
            );
            add(
                'Compare with objective',
                remaining < 0
                    ? 'The observed failures exceed the allowed count.'
                    : 'The observed failures stay within the allowed count.',
                { d: Math.max(0, remaining) },
                { d: `${remaining} remaining` }
            );
            outcome = remaining < 0 ? 'Budget exceeded' : 'Within error budget';
            explanation = `Allowed ${allowed}, observed ${n}, remaining ${remaining}. Window and SLI definitions must match the actual objective.`;
            metric('Allowed failures', allowed);
            metric('Remaining budget', remaining);
            break;
        }
        case 'gate': {
            add(
                'Signed-in caller',
                'The caller is authenticated but requests another user’s private resource.',
                {},
                { c: 'identity known', b: 'different owner' }
            );
            add(
                'Evaluate resource policy',
                alt
                    ? 'The policy checks this identity against this resource and denies the operation.'
                    : 'A broken policy checks sign-in alone and exposes the resource.',
                { b: alt ? 0 : n, d: alt ? n : 0 },
                { a: alt ? 'denied' : 'incorrectly allowed' },
                'c',
                'b',
                alt
            );
            outcome = alt ? 'Access denied' : 'Unauthorized exposure';
            explanation = `${alt ? 0 : n} unauthorized results exposed. The example isolates authorization; it is not an authentication protocol implementation.`;
            metric('Unauthorized exposures', alt ? 0 : n);
            metric('Denied requests', alt ? n : 0);
            break;
        }
        case 'version': {
            add(
                'Old contract',
                'An old reader interprets field 1 as the original meaning.',
                {},
                { b: 'field 1: old meaning' }
            );
            add(
                'Evolve the schema',
                alt
                    ? 'Reuse field 1 for a different meaning.'
                    : `Add the new meaning under field ${n}; preserve field 1.`,
                {},
                { a: alt ? 'field 1 reused' : `new field ${n}` },
                'c',
                'a'
            );
            outcome = alt ? 'Old meaning overwritten' : 'Old meaning preserved';
            explanation =
                'This field-map example illustrates compatibility discipline; actual codecs have additional type and wire-format rules.';
            metric('Original field number', 1);
            metric('New field number', alt ? 1 : n);
            break;
        }
        case 'eviction': {
            const order = [1, 3, 2];
            const final = alt ? [...order, n] : [3, 2, n];
            add(
                'Recency order',
                'Keys 1, 3 and 2 are stored from least to most recently used.',
                { a: 3 },
                { a: '1 → 3 → 2' }
            );
            add(
                'Insert a new key',
                alt
                    ? 'Keeping every key exceeds the three-slot limit.'
                    : 'Evict key 1, the least recently used entry.',
                { a: final.length },
                { a: final.join(' → ') },
                'c',
                'a'
            );
            outcome = alt ? 'Memory limit exceeded' : 'Bounded cache';
            explanation = `${final.length} entries remain with a limit of 3. This is exact toy LRU; Redis policies can use sampling.`;
            metric('Stored entries', final.length);
            metric('Slot limit', 3);
            break;
        }
        case 'fanout': {
            const delivered = alt ? n : 1;
            add('One published event', `${n} independent subscribers each need their own delivery.`, {
                a: 1,
                b: 0,
                d: 0,
            });
            for (let i = 1; i <= delivered; i++)
                add(
                    `Deliver to subscriber ${i}`,
                    'This copy serves one independent destination; it cannot stand in for another subscriber’s copy.',
                    { b: i, d: i },
                    { d: `${i}/${n} receipts` },
                    'a',
                    'b'
                );
            outcome = alt ? 'Every subscriber received' : 'Some subscribers missed';
            explanation = `${delivered} of ${n} subscribers received the event. Delivery to independent subscribers is different from coalescing identical cache misses.`;
            metric('Delivered subscriptions', delivered);
            metric('Missing subscriptions', n - delivered);
            break;
        }
        case 'copies': {
            const stale = alt ? 0 : n - 1;
            add('Duplicated fact', `The same fact is stored in ${n} declared copies.`, { a: n, b: 0 });
            add(
                'Apply one update',
                alt
                    ? 'Propagate the update to every declared copy.'
                    : 'Update only one copy and leave the others unchanged.',
                { a: n, b: alt ? n : 1, d: stale },
                { d: `${stale} stale copies` },
                'a',
                'b'
            );
            outcome = stale ? 'Stale copies remain' : 'Copies agree';
            explanation = `${stale} copies retain old data. Normalising the authority avoids this particular duplicate-update obligation.`;
            metric('Stale copies', stale);
            break;
        }
        case 'window': {
            const late = n >= 5,
                count = late && !alt ? 2 : 3;
            add(
                'Define event-time window',
                'Count events with event timestamps in [0, 5). Events at event times 1 and 2 have arrived.',
                { b: 2 },
                { a: 'window [0, 5)', b: 'count 2' }
            );
            add(
                'Source emits watermark',
                `The source’s event-time watermark advances to ${n}. It is an estimate of event-time progress, not the current processing clock.`,
                {},
                { a: `watermark ${n}` }
            );
            add(
                'Event-time 3 arrives',
                late
                    ? 'Its timestamp belongs to the window, but it arrives after the watermark passed the window end.'
                    : 'Its timestamp belongs to the still-open window.',
                {},
                { d: 'event time 3' },
                'c',
                'a'
            );
            add(
                'Apply late-data policy',
                late && !alt
                    ? 'The zero-allowed-lateness policy drops this late contribution.'
                    : late
                      ? 'The correction policy emits an updated window count.'
                      : 'The open window includes the contribution.',
                { b: count },
                { b: `count ${count}` }
            );
            outcome = count === 3 ? 'Three events counted' : 'Two events counted';
            explanation = `${count} events counted. Watermarks estimate event-time progress; they do not prove completeness. The two policies have different allowed-lateness/update behavior.`;
            metric('Counted events', count);
            break;
        }
        case 'unique': {
            const a = alt ? `1:${n}` : String(n),
                b = alt ? `2:${n}` : String(n);
            add(
                'Two generators',
                'Both nodes have reached the same local counter value.',
                {},
                { a: `counter ${n}`, b: `counter ${n}` }
            );
            add(
                'Generate IDs',
                alt
                    ? 'Combine the distinct node namespace with its local counter.'
                    : 'Both nodes expose the local counter without a namespace.',
                {},
                { a, b }
            );
            outcome = alt ? 'Distinct identifiers' : 'Identifier collision';
            explanation = `IDs ${a} and ${b}. This namespaced counter is a teaching example, not a UUID implementation.`;
            metric('ID pair', `${a}, ${b}`);
            break;
        }
        case 'retention': {
            const due = n >= 3,
                primary = due ? 0 : 1,
                backups = due && alt ? 0 : 2;
            add('Three retained copies', 'One primary and two backup copies exist in the model.', {
                a: 1,
                b: 2,
            });
            add(
                'Check declared retention',
                `Assume a retention deadline of 3 ticks; the record age is ${n}.`,
                { a: primary, b: backups },
                { a: `${primary} primary`, b: `${backups} backups` }
            );
            outcome = primary + backups === 0 ? 'All modelled copies deleted' : 'Retained copies remain';
            explanation = `${primary + backups} copies remain. Real retention policy must also account for derived data and applicable obligations.`;
            metric('Remaining copies', primary + backups);
            break;
        }
        case 'clock': {
            const recv = alt ? Math.max(3, n) + 1 : 3 - n;
            add(
                'A send precedes a receive',
                `Sender logical timestamp ${n}; receiver starts at 3.`,
                {},
                { a: String(n), b: '3' }
            );
            add(
                'Assign receive timestamp',
                alt
                    ? 'Set the receive clock to max(local, received) plus one.'
                    : 'A skewed wall-clock reading can run behind the send timestamp.',
                {},
                { b: String(recv) },
                'a',
                'b'
            );
            outcome = alt ? 'Causal timestamp advanced' : 'Wall-clock order ambiguous';
            explanation = `Receive timestamp ${recv}. Lamport ordering is a one-way implication: a lower timestamp alone does not establish causality.`;
            metric('Receive timestamp', recv);
            break;
        }
        case 'cost': {
            const a = 10 + 2 * n,
                b = 15 + 2 * Math.ceil(n / 2);
            add(
                'State pricing assumptions',
                'Plan A has fixed cost 10 and cost 2 per unit; plan B has fixed cost 15 and cost 2 per pair.'
            );
            add(
                'Compute selected plan',
                `The selected plan costs ${alt ? b : a} illustrative cost units.`,
                { a: n },
                { d: String(alt ? b : a) },
                'c',
                'a'
            );
            outcome = a <= b ? 'Plan A cheaper' : 'Plan B cheaper';
            explanation = `A=${a}, B=${b}. These are invented cost units for comparison, not provider prices; the selected plan need not be the cheaper one.`;
            metric('Plan A cost units', a);
            metric('Plan B cost units', b);
            break;
        }
        case 'signals': {
            add(
                'Apparently normal host',
                'The CPU snapshot is 10 percent while some user requests fail.',
                {},
                { a: 'CPU 10%' }
            );
            add(
                'Choose the observation',
                alt
                    ? `Request telemetry reveals ${n} failures out of 100.`
                    : 'CPU alone does not expose this user-visible failure.',
                { b: n },
                { d: alt ? `${n}/100 bad requests` : 'CPU only' }
            );
            outcome = alt ? 'User errors visible' : 'User symptom hidden';
            explanation =
                'The signals describe different phenomena. No dashboard metric proves the absence of every user-facing problem.';
            metric('Observed failures', alt ? n : 'not observed');
            break;
        }
        case 'trace': {
            const sum = n + 3,
                critical = Math.max(n, 3);
            add(
                'Parallel child spans',
                'Child A and child B both start at the same illustrative tick.',
                { a: n, b: 3 },
                { a: `${n} ticks`, b: '3 ticks' }
            );
            add(
                'Combine durations',
                alt
                    ? 'The parallel critical path ends when the longer child ends.'
                    : 'Adding overlapping intervals counts shared wall-clock time more than once.',
                {},
                { d: `${alt ? critical : sum} ticks` }
            );
            outcome = alt ? 'Critical path respected' : 'Overcounted latency';
            explanation = `Child sum ${sum}; parallel wall time ${critical}. Parent overhead and gaps are deliberately omitted.`;
            metric('Computed duration ticks', alt ? critical : sum);
            metric('Actual model wall ticks', critical);
            break;
        }
        case 'breaker': {
            const sent = alt ? Math.min(n, 2) : n;
            add('Failing dependency', 'Every downstream call fails during this bounded example.');
            for (let i = 1; i <= sent; i++)
                add(
                    `Failed call ${i}`,
                    'The caller records a failure.',
                    { b: i },
                    { a: alt && i === 2 ? 'open' : 'closed' },
                    'c',
                    'b',
                    true
                );
            add(
                'Admission decision',
                alt
                    ? 'After two failures, remaining calls are rejected locally.'
                    : 'The caller continues sending work to the failing dependency.',
                { b: sent, d: n - sent }
            );
            outcome = alt ? 'Calls bounded by breaker' : 'Failure load continues';
            explanation = `${sent} downstream attempts, ${n - sent} local rejections. Recovery probing and real thresholds are omitted.`;
            metric('Downstream attempts', sent);
            metric('Local rejections', n - sent);
            break;
        }
        case 'health': {
            add(
                'Running is not ready',
                'Host A runs but fails readiness; host B is ready.',
                {},
                { a: 'running, not ready', b: 'ready' }
            );
            add(
                'Route incoming work',
                alt
                    ? 'The router respects readiness and selects host B.'
                    : 'The router sends work to the unready host.',
                { a: alt ? 0 : n, b: alt ? n : 0, d: alt ? 0 : n },
                {},
                'c',
                alt ? 'b' : 'a',
                !alt
            );
            outcome = alt ? 'Traffic sent to ready host' : 'Unready host receives traffic';
            explanation = `${alt ? 0 : n} requests fail in this example. Probes are imperfect observations, not proof of all application invariants.`;
            metric('Failed requests', alt ? 0 : n);
            break;
        }
        case 'identity': {
            add(
                'Credential presented',
                `Assume a verified credential that expired at age 3; its current age is ${n}.`,
                {},
                { a: `age ${n}, expiry 3` }
            );
            add(
                'Validate expiry',
                alt
                    ? 'Reject the expired credential before accepting the identity claim.'
                    : 'The broken validator ignores the credential expiry.',
                { d: alt ? 1 : 0 },
                { b: alt ? 'rejected' : 'incorrectly accepted' },
                'c',
                'a',
                alt
            );
            outcome = alt ? 'Expired credential rejected' : 'Expired credential accepted';
            explanation =
                'This example isolates expiry validation. It does not implement signatures, OAuth or the rest of a credential validation flow.';
            metric('Expired credentials accepted', alt ? 0 : 1);
            break;
        }
        case 'rotation': {
            add(
                'Active credential policy',
                'Only generation 3 is active in this teaching policy.',
                {},
                { b: 'active generation 3' }
            );
            add(
                'Retired credential used',
                `A request presents retired generation ${n}.`,
                {},
                { d: `generation ${n}` },
                'c',
                'a',
                alt
            );
            outcome = alt ? 'Retired credential rejected' : 'Retired credential accepted';
            explanation =
                'Rejecting a retired credential limits continued use after rotation. Actual key lifecycles and data re-encryption require further policy.';
            metric('Retired credentials accepted', alt ? 0 : 1);
            break;
        }
        case 'spatial': {
            const points = [
                [0, 0],
                [1, 1],
                [3, 4],
                [5, 5],
            ];
            const candidates = points.filter(([x, y]) => Math.abs(x) <= n && Math.abs(y) <= n),
                matches = candidates.filter(([x, y]) => Math.hypot(x, y) <= n);
            add(
                'Spatial prefilter',
                `The square bounding region has half-width ${n}.`,
                { b: candidates.length },
                { b: `${candidates.length} candidates` },
                'c',
                'a'
            );
            add(
                'Apply distance rule',
                alt
                    ? 'Check each candidate against the actual circular radius.'
                    : 'Incorrectly treat every square candidate as a circular match.',
                { d: alt ? matches.length : candidates.length },
                { d: `${alt ? matches.length : candidates.length} results` },
                'a',
                'd'
            );
            const falsePositive = !alt && candidates.length > matches.length;
            outcome = falsePositive ? 'False candidate retained' : 'Exact matches only';
            explanation = `${candidates.length} box candidates; ${matches.length} true circle matches. These are Cartesian coordinates, not geographic lat/lon distances.`;
            metric('Box candidates', candidates.length);
            metric('True matches', matches.length);
            break;
        }
        case 'columns': {
            const cells = alt ? 4 : 4 * n;
            add(
                'Four illustrative records',
                `Each record holds ${n} columns; the query needs one column.`,
                { a: n },
                { a: `4 rows × ${n} columns` }
            );
            add(
                'Read cells',
                alt
                    ? 'Read the selected column across the four records.'
                    : 'Read all columns even though only one is needed.',
                { b: cells },
                { b: `${cells} cells read` },
                'a',
                'b'
            );
            outcome = alt ? 'Only selected column read' : 'Unrelated cells read';
            explanation = `${cells} cells read. Object marks abbreviate quantities above eight; labels state the full count. Compression and block IO are omitted.`;
            metric('Cells read', cells);
            break;
        }
        case 'decision': {
            const capacity = alt ? 8 : 3;
            add('Record the requirement', `The scenario needs capacity ${n}.`, { a: n });
            add(
                'Choose a plan',
                `The selected plan supplies capacity ${capacity}.`,
                { b: capacity, d: Math.max(0, n - capacity) },
                { b: `capacity ${capacity}` }
            );
            outcome = capacity >= n ? 'Requirement met' : 'Requirement missed';
            explanation = `Need ${n}, capacity ${capacity}. Record the cost and operational tradeoff before choosing a plan.`;
            metric('Capacity shortfall', Math.max(0, n - capacity));
            break;
        }
    }
    return { beats, outcome, explanation, metrics };
}

export function makeExperimentFilm(
    id: string,
    question: string,
    rule: string,
    kind: Mechanism,
    input: ExperimentInput
): LessonFilmData {
    if (kind === 'partitionedLog')
        return {
            ...makePartitionedLogFilm({
                ...PARTITIONED_LOG_DEFAULT,
                recordsPerPartition: Number.isFinite(input.amount)
                    ? input.amount
                    : MECHANISMS.partitionedLog.initial,
                crash: input.alternative ? 'after-commit' : 'before-commit',
            }),
            id,
            question,
            takeaway: rule,
        };
    if (kind === 'loadBalance')
        return {
            ...makeLoadBalancingFilm({
                ...LOAD_BALANCING_DEFAULT,
                requests: Number.isFinite(input.amount) ? input.amount : MECHANISMS.loadBalance.initial,
                policy: input.alternative ? 'least-connections' : 'round-robin',
            }),
            id,
            question,
            takeaway: rule,
        };
    const spec = MECHANISMS[kind],
        trace = simulateMechanism(kind, input);
    const nodes: FilmNode[] = [
        {
            id: 'c',
            label: kind === 'quorum' ? 'Coordinator' : 'Your input',
            kind: 'computer',
            x: -265,
            y: 30,
        },
        {
            id: 'a',
            label: spec.roles[0],
            kind: kind === 'queue' || kind === 'bucket' || kind === 'eviction' ? 'queue' : spec.kinds[0],
            x: -60,
            y: -130,
        },
        {
            id: 'b',
            label: spec.roles[1],
            kind: kind === 'fanout' || kind === 'pagination' || kind === 'index' ? 'queue' : spec.kinds[1],
            x: 175,
            y: 45,
        },
        { id: 'd', label: spec.roles[2], kind: spec.kinds[2], x: 280, y: -130 },
    ];
    return {
        id,
        question,
        takeaway: rule,
        nodes,
        links: Array.from(
            new Map(
                trace.beats
                    .filter((beat) => beat.from && beat.to)
                    .map((beat) => [`${beat.from}-${beat.to}`, [beat.from!, beat.to!] as [string, string]])
            ).values()
        ),
        beats: trace.beats,
        sourceHref: `/learn/sources#${id.replace(/-experiment$/, '')}`,
    };
}
