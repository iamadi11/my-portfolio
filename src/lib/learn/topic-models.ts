import type { ExperimentInput, MechanismDefinition, Trace } from './experiment-model';
import type { FilmBeat } from './film-model';

const define = (
    label: string,
    modes: [string, string],
    predictions: [string, string],
    roles: [string, string, string],
    initial = 6,
    min = 1,
    max = 8
): MechanismDefinition => ({
    label,
    modes,
    predictions,
    roles,
    initial,
    min,
    max,
    kinds: ['server', 'store', 'queue'],
});

/** Topic-specific state machines. Numbers are deliberately small teaching assumptions. */
export const TOPIC_MODELS = {
    embedding: define(
        'Line items read with one order',
        ['Separate item lookups', 'Embed order-owned items'],
        ['Several record fetches', 'One record fetch'],
        ['Order record', 'Item records', 'Fetched records']
    ),
    sqlJoin: define(
        'Orders belonging to customer 1',
        ['INNER JOIN customers to orders', 'LEFT JOIN customers to orders'],
        ['Only matching customers returned', 'Unmatched customer retained with NULL'],
        ['Customers table', 'Orders table', 'Query result'],
        3,
        1,
        6
    ),
    sqlSets: define(
        'Copies of row 1 in first query',
        ['UNION ALL', 'UNION'],
        ['Duplicate rows retained', 'Duplicate rows removed'],
        ['Query A result', 'Query B result', 'Combined result'],
        3,
        1,
        6
    ),
    storageLayout: define(
        'Key to update',
        ['B-tree leaf update', 'LSM buffer and flush'],
        ['Leaf page updated', 'Sorted run written'],
        ['WAL', 'Mutable structure', 'Durable pages / runs'],
        6,
        1,
        8
    ),
    httpValidation: define(
        'Origin representation version',
        ['Stored validator still matches', 'Stored validator differs'],
        ['304 reuses stored body', '200 replaces stored body'],
        ['Browser cache', 'Origin', 'Rendered representation'],
        6,
        2,
        8
    ),
    twoPhase: define(
        'Units reserved by participant A',
        ['Coordinator unavailable after prepare', 'Coordinator recovers durable commit decision'],
        ['Prepared participants remain waiting', 'Both participants commit'],
        ['Coordinator log', 'Participant A', 'Participant B'],
        4,
        1,
        8
    ),
    uuidLayout: define(
        'Clock rollback between generations (ms)',
        ['UUID version 4 layout', 'UUID version 7 layout'],
        ['No timestamp prefix', 'Timestamp prefix visible'],
        ['Generator', 'First identifier', 'Later identifier'],
        3,
        1,
        8
    ),
    cacheWrite: define(
        'New profile version',
        ['Cache-aside without invalidation', 'Write through database then cache'],
        ['Stale cached version returned', 'Updated cached version returned'],
        ['Application', 'Database', 'Cache'],
        6,
        2
    ),
    consistencyHistory: define(
        'Version acknowledged by writer',
        ['Read lagging replica', 'Coordinate read with completed write'],
        ['History violates linearizability', 'History respects completed write'],
        ['Writer', 'Replica group', 'Later reader'],
        6,
        2
    ),
    foreignKey: define(
        'Customer id on new order',
        ['No reference constraint', 'Enforce customer foreign key'],
        ['Order accepted', 'Order rejected'],
        ['Customers: 1, 2, 3', 'New order', 'Validation'],
        5
    ),
    planner: define(
        'Matching rows out of 8',
        ['Force index access', 'Compare illustrative costs'],
        ['Index path selected', 'Sequential path selected'],
        ['Planner', 'Index + table', 'Sequential scan'],
        6,
        1,
        8
    ),
    mvcc: define(
        'New uncommitted value',
        ['Dirty read', 'Read committed version'],
        ['Uncommitted value read', 'Committed version read'],
        ['Writer', 'Version store', 'Reader'],
        6,
        2
    ),
    upload: define(
        'Chunks needed for object',
        ['Publish metadata before upload', 'Publish after completed upload'],
        ['Dangling metadata exposed', 'Incomplete upload hidden'],
        ['Upload session', 'Object bytes', 'Published metadata'],
        4,
        2
    ),
    storageChoice: define(
        'Related rows in atomic update',
        ['Choose object bytes only', 'Choose transactional row store'],
        ['Required invariant unsupported', 'Required invariant supported'],
        ['Atomic row requirement', 'Selected storage', 'Decision record'],
        4,
        2
    ),
    session: define(
        'Items in user cart',
        ['Keep cart only in worker A', 'Use shared durable cart'],
        ['Next worker loses cart', 'Next worker reads cart'],
        ['Worker A', 'Shared cart', 'Worker B']
    ),
    proxy: define(
        'Public requests',
        ['Expose each private service', 'Route through public proxy'],
        ['Private services directly exposed', 'Private services behind boundary'],
        ['Public proxy', 'Private service', 'Ingress decisions']
    ),
    replacement: define(
        'Jobs after worker failure',
        ['No desired-state controller', 'Replace failed worker'],
        ['Capacity stays reduced', 'Capacity restored'],
        ['Controller', 'Live workers', 'Pending work']
    ),
    scaleLag: define(
        'Jobs arriving each window',
        ['Keep one worker', 'Add worker after one window'],
        ['Backlog persists', 'Backlog recovers'],
        ['Scaling controller', 'Workers', 'Backlog'],
        4,
        4,
        6
    ),
    coalesce: define(
        'Concurrent misses for same key',
        ['Every caller fetches origin', 'Share one in-flight fetch'],
        ['One origin fetch', 'Several origin fetches'],
        ['In-flight key', 'Origin fetches', 'Waiting callers'],
        6,
        2
    ),
    redelivery: define(
        'Replacement work requests after a crash',
        ['Acknowledge before processing', 'Acknowledge after durable effect'],
        ['Work lost after early ack', 'Work retained for redelivery'],
        ['Broker', 'Worker', 'Durable effects'],
        3,
        1,
        4
    ),
    flow: define(
        'Produced jobs in one window',
        ['Unbounded admission', 'Admit only available capacity'],
        ['Backlog grows', 'Excess work stays upstream'],
        ['Admission credits', 'Completed work', 'Upstream waiting'],
        6,
        4
    ),
    offsets: define(
        'Entries appended to log',
        ['Consumers share one cursor', 'Consumers keep own offsets'],
        ['Reader B skips entries', 'Reader B replays all entries'],
        ['Append-only log', 'Reader A', 'Reader B'],
        6,
        2
    ),
    mapReduce: define(
        'Input numbers, each worth 1',
        ['One worker counts everything', 'Split, count, reduce'],
        ['One map task', 'Parallel map tasks'],
        ['Map tasks', 'Partial counts', 'Reduced total'],
        6,
        2
    ),
    outbox: define(
        'Committed business changes',
        ['Database then direct publish; crash', 'Write business row + outbox atomically'],
        ['Event intent lost', 'Event intent recoverable'],
        ['Database transaction', 'Outbox rows', 'Broker delivery']
    ),
    uncertain: define(
        'Wait deadline (ticks)',
        ['Assume timeout means no commit', 'Keep outcome unknown and reconcile'],
        ['Unsafe retry assumption', 'Uncertainty preserved'],
        ['Caller deadline', 'Remote effect', 'Reconciliation'],
        3,
        1,
        8
    ),
    readQuorum: define(
        'Replies requested from 3 replicas',
        ['Return first stale reply', 'Read versions from quorum'],
        ['Stale value returned', 'Latest model version returned'],
        ['Replica A: v2', 'Replica B: v2', 'Replica C: v1'],
        2,
        2,
        3
    ),
    saga: define(
        'Units reserved for an order',
        ['No compensation after payment failure', 'Release reservation on failure'],
        ['Reservation leaked', 'Reservation compensated'],
        ['Inventory reservation', 'Payment service', 'Compensation']
    ),
    election: define(
        'Votes reachable in a 3-node term',
        ['Self-elect without majority', 'Require majority in this term'],
        ['Unsafe self-election', 'Single-majority rule respected'],
        ['Candidate A', 'Voters', 'Candidate B'],
        1,
        1,
        3
    ),
    gossip: define(
        'Gossip rounds',
        ['Repeat contact with same peer', 'Contact a new informed peer each round'],
        ['Membership reaches only two nodes', 'Membership reaches all nodes'],
        ['Node A', 'Node B', 'Node C'],
        2,
        2,
        5
    ),
    bulkhead: define(
        'Calls to failing dependency',
        ['Share pool of 4 slots', 'Isolate dependency to 2 slots'],
        ['Healthy work starved', 'Healthy capacity protected'],
        ['Dependency pool', 'Shared capacity', 'Healthy work'],
        6,
        1
    ),
    retry: define(
        'Callers with uncertain results',
        ['Retry twice immediately', 'Bound to one delayed retry'],
        ['Amplified immediate attempts', 'Bounded delayed attempts'],
        ['Retry policy', 'Downstream attempts', 'Callers']
    ),
    canary: define(
        'Request observations before rollback (at most one/user)',
        ['Release to all 8 users', 'Canary to 2 of 8 users'],
        ['All users exposed', 'Canary limits exposure'],
        ['Release router', 'New version', 'Old version'],
        2,
        1,
        4
    ),
    migration: define(
        'Old application instances',
        ['Drop old field immediately', 'Expand, backfill, switch, contract'],
        ['Old readers break', 'Both versions supported'],
        ['Old readers', 'Schema versions', 'New readers']
    ),
    recovery: define(
        'Committed version in region A',
        ['Fail over before replication catches up', 'Replicate before region failure'],
        ['Recent writes missing', 'Model writes retained'],
        ['Region A', 'Region B', 'Recovery read'],
        6,
        3
    ),
    injection: define(
        'Workers removed out of 3',
        ['No recovery automation', 'Restore desired count after observation'],
        ['Reduced service capacity', 'Service capacity restored'],
        ['Fault injector', 'Healthy workers', 'Recovery controller'],
        1,
        1,
        2
    ),
    sql: define(
        'Matching legitimate rows',
        ['Concatenate untrusted SQL', 'Bind text as one parameter'],
        ['Query structure changed', 'Input stays data'],
        ['Query parser', 'Bound data', 'Rows exposed'],
        3,
        1,
        8
    ),
    boundaries: define(
        'Calls across a feature path',
        ['Deploy each step separately', 'Keep modules within one deployment'],
        ['Network boundaries multiplied', 'Local module boundaries'],
        ['Feature entry', 'Module boundaries', 'Network hops'],
        4,
        2
    ),
    communication: define(
        'Background jobs required',
        ['Wait synchronously for all work', 'Persist work and acknowledge acceptance'],
        ['Reply waits for completion', 'Reply means accepted only'],
        ['Request handler', 'Durable queue', 'Worker']
    ),
    sharedQuota: define(
        'Requests per server (two servers)',
        ['Each server grants bucket of 3', 'Share one bucket of 3'],
        ['Global allowance exceeded', 'Global allowance preserved'],
        ['Server A', 'Shared quota', 'Server B'],
        3,
        2,
        6
    ),
    feed: define(
        'Followers of one author',
        ['Fan-out on write', 'Assemble on one reader request'],
        ['Publish pays copying cost', 'Read pays assembly cost'],
        ['Post store', 'Feed copies', 'Reader'],
        6,
        2
    ),
    chat: define(
        'Messages accepted while recipient offline',
        ['Call accepted messages read', 'Track accepted, delivered, read separately'],
        ['Receipt overstated', 'Receipt remains accepted'],
        ['Durable chat log', 'Offline recipient', 'Receipt state']
    ),
    crawler: define(
        'URLs queued for the same host',
        ['Fetch all concurrently', 'Allow one per-host slot'],
        ['Host overloaded', 'Per-host politeness preserved'],
        ['URL frontier', 'Host slots', 'Deferred URLs'],
        6,
        2
    ),
    prefix: define(
        'Prefix characters of “cart”',
        ['Scan all suggestion strings', 'Retrieve prefix posting list'],
        ['All strings inspected', 'Prefix candidates narrowed'],
        ['Prefix lookup', 'Candidate suggestions', 'Ranked results'],
        2,
        1,
        4
    ),
    inverted: define(
        'Term to search (1=red, 2=blue, 3=green)',
        ['Scan every document', 'Read term posting list'],
        ['All documents inspected', 'Posting list retrieved'],
        ['Term dictionary', 'Document ids', 'Matching documents'],
        1,
        1,
        3
    ),
    fileVersions: define(
        'Edits on device A since base version',
        ['Overwrite with last arrival', 'Keep both divergent versions'],
        ['Concurrent edit overwritten', 'Conflict preserved for resolution'],
        ['Device A branch', 'Device B branch', 'Version metadata']
    ),
    segments: define(
        'Viewers of the same segment',
        ['Fetch every copy from origin', 'Reuse versioned segment at edge'],
        ['Origin serves every viewer', 'Edge reuses segment'],
        ['Media origin', 'Edge segment cache', 'Viewers'],
        6,
        2
    ),
    consensusLog: define(
        'Reachable replicas, including leader',
        ['Acknowledge immediately after local append', 'Wait for current-term majority commit'],
        ['Acknowledgement before evidence', 'Commit evidence respected'],
        ['Leader log', 'Follower B log', 'Follower C log'],
        2,
        1,
        3
    ),
    partitionChoice: define(
        'Version written on majority side',
        ['Isolated replica serves its old copy', 'Require majority for this read'],
        ['Isolated read returns old value', 'Isolated read unavailable'],
        ['Majority side', 'Isolated replica', 'Read result'],
        6,
        3
    ),
    architecture: define(
        'Checkout requests in one window',
        ['One worker; retry external effect blindly', 'Two workers + durable operation key'],
        ['Backlog and duplicate risk', 'Capacity and effect bounded'],
        ['Admission + workers', 'Order + operation log', 'External provider'],
        6,
        4,
        6
    ),
};
export type TopicMechanism = keyof typeof TOPIC_MODELS;
const TOPIC_DEVICES: Record<TopicMechanism, MechanismDefinition['kinds']> = {
    embedding: ['store', 'store', 'queue'],
    sqlJoin: ['store', 'store', 'queue'],
    sqlSets: ['queue', 'queue', 'queue'],
    storageLayout: ['store', 'server', 'store'],
    httpValidation: ['store', 'server', 'computer'],
    twoPhase: ['store', 'store', 'store'],
    uuidLayout: ['server', 'store', 'store'],
    cacheWrite: ['server', 'store', 'store'],
    consistencyHistory: ['computer', 'store', 'computer'],
    foreignKey: ['store', 'store', 'server'],
    planner: ['server', 'store', 'store'],
    mvcc: ['server', 'store', 'computer'],
    upload: ['server', 'store', 'store'],
    storageChoice: ['computer', 'store', 'store'],
    session: ['server', 'store', 'server'],
    proxy: ['router', 'server', 'queue'],
    replacement: ['server', 'server', 'queue'],
    scaleLag: ['server', 'server', 'queue'],
    coalesce: ['server', 'server', 'queue'],
    redelivery: ['queue', 'server', 'store'],
    flow: ['router', 'server', 'queue'],
    offsets: ['store', 'server', 'server'],
    mapReduce: ['server', 'queue', 'store'],
    outbox: ['store', 'queue', 'queue'],
    uncertain: ['computer', 'server', 'server'],
    readQuorum: ['store', 'store', 'store'],
    saga: ['store', 'server', 'server'],
    election: ['server', 'server', 'server'],
    gossip: ['server', 'server', 'server'],
    bulkhead: ['queue', 'queue', 'server'],
    retry: ['router', 'server', 'computer'],
    canary: ['router', 'server', 'server'],
    migration: ['server', 'store', 'server'],
    recovery: ['store', 'store', 'computer'],
    injection: ['server', 'server', 'server'],
    sql: ['server', 'store', 'queue'],
    boundaries: ['server', 'server', 'router'],
    communication: ['server', 'queue', 'server'],
    sharedQuota: ['server', 'store', 'server'],
    feed: ['store', 'queue', 'computer'],
    chat: ['store', 'computer', 'store'],
    crawler: ['queue', 'server', 'queue'],
    prefix: ['store', 'queue', 'queue'],
    inverted: ['store', 'queue', 'queue'],
    fileVersions: ['store', 'store', 'store'],
    segments: ['store', 'store', 'computer'],
    consensusLog: ['store', 'store', 'store'],
    partitionChoice: ['store', 'store', 'computer'],
    architecture: ['router', 'store', 'server'],
};
for (const kind of Object.keys(TOPIC_MODELS) as TopicMechanism[])
    TOPIC_MODELS[kind].kinds = TOPIC_DEVICES[kind];

export function isTopicMechanism(kind: string): kind is TopicMechanism {
    return kind in TOPIC_MODELS;
}

export function simulateTopic(kind: TopicMechanism, input: ExperimentInput): Trace {
    const spec = TOPIC_MODELS[kind];
    const n = Math.max(
        spec.min,
        Math.min(spec.max, Math.floor(Number.isFinite(input.amount) ? input.amount : spec.initial))
    );
    const alt = input.alternative;
    const beats: FilmBeat[] = [];
    const metrics: Trace['metrics'] = [];
    const add = (
        title: string,
        caption: string,
        values: Record<string, string> = {},
        counts: Record<string, number> = {},
        from?: string,
        to?: string
    ): void => {
        beats.push({ title, caption, values, counts, ...(from && to ? { from, to, packet: title } : {}) });
    };
    const metric = (label: string, value: number | string): void => {
        metrics.push({ label, value: String(value) });
    };
    let result = false;
    let explanation = '';
    switch (kind) {
        case 'embedding': {
            add(
                'Define ownership',
                `One order owns ${n} bounded line items. They are always read together.`,
                { a: 'one order' },
                { b: n }
            );
            add('Retrieve order', 'Fetch the order record.', {}, { d: 1 }, 'c', 'a');
            if (!alt)
                for (let i = 1; i <= n; i++)
                    add(
                        `Fetch item ${i}`,
                        'This illustrative client performs one additional lookup per item.',
                        {},
                        { d: i + 1 },
                        'a',
                        'b'
                    );
            else
                add(
                    'Items arrive together',
                    'Embedded order-owned items arrive in the same record fetch.',
                    { a: `order + ${n} items` },
                    { d: 1 },
                    'a',
                    'c'
                );
            result = alt;
            metric('Record fetches', alt ? 1 : n + 1);
            explanation =
                'Embedding fits this bounded, co-read example. Shared independently changing entities or unbounded arrays may need references; batching can also avoid N+1 fetches.';
            break;
        }
        case 'sqlJoin': {
            add(
                'Define rows',
                `Customers: 1=Ada, 2=Ben. Orders: ${n} rows reference customer 1; none reference customer 2.`,
                { a: '1 Ada; 2 Ben', b: `${n} orders for customer 1` },
                { a: 2, b: n }
            );
            add(
                'Match join key',
                'Compare customers.id with orders.customer_id. Each matching order creates a result row.',
                {},
                {},
                'a',
                'b'
            );
            add(
                'Collect matches',
                `Customer 1 appears ${n} times, once per order. SQL does not implicitly remove these rows.`,
                { d: `${n} Ada + order rows` },
                { d: n },
                'b',
                'd'
            );
            add(
                'Handle unmatched row',
                alt
                    ? 'LEFT JOIN retains Ben with NULL order columns.'
                    : 'INNER JOIN excludes Ben because no order matches.',
                { d: `${n} matched${alt ? ' + Ben/NULL' : ''}` },
                { d: n + (alt ? 1 : 0) }
            );
            result = alt;
            metric('Result rows', n + (alt ? 1 : 0));
            explanation =
                'A join pairs rows by a predicate; a key constraint restricts stored data. They are different operations. This example uses one-to-many matches. NULL on the unmatched side is not an empty order row in the base table.';
            break;
        }
        case 'sqlSets': {
            add(
                'Two compatible queries',
                `Query A returns ${n} copies of 1. Query B returns rows 1 and 2. Both have one integer column.`,
                { a: Array(n).fill('1').join(', '), b: '1, 2' },
                { a: n, b: 2 }
            );
            add(
                'Append compatible rows',
                `There are ${n + 2} rows before any duplicate elimination.`,
                {},
                { d: n + 2 },
                'a',
                'd'
            );
            add(
                'Apply set policy',
                alt
                    ? 'UNION eliminates duplicate rows: values 1 and 2 remain.'
                    : 'UNION ALL keeps every occurrence, including repeated 1.',
                { d: alt ? '1, 2' : `${n + 1} copies of 1; one 2` },
                { d: alt ? 2 : n + 2 },
                'b',
                'd'
            );
            result = alt;
            metric('Result rows', alt ? 2 : n + 2);
            explanation =
                'Output order is unspecified without ORDER BY. UNION combines rows; a JOIN combines matching columns/rows. On these inputs INTERSECT returns 1, and A EXCEPT B returns no rows (without ALL).';
            break;
        }
        case 'storageLayout': {
            const page = n <= 4 ? 'leaf [1..4]' : 'leaf [5..8]';
            add(
                'Record recoverable update',
                `Illustrative key ${n} receives a new value. Assume its write-ahead record is durable before acknowledgment.`,
                { a: `put ${n}=new` },
                { a: 1 }
            );
            add(
                'Update mutable structure',
                alt
                    ? 'Buffer the new version in an ordered memtable; existing sorted files remain immutable.'
                    : `Locate ${page} through the B-tree and change that leaf page in memory.`,
                { b: alt ? `memtable: ${n}=new` : page },
                {},
                'a',
                'b'
            );
            add(
                'Persist data structure',
                alt
                    ? 'Flush the frozen memtable into a new sorted run. Later compaction merges runs and removes obsolete versions.'
                    : 'Write the dirty leaf page to durable storage under the recovery protocol.',
                { d: alt ? `new SST run: key ${n}` : `persist ${page}` },
                { d: 1 },
                'b',
                'd'
            );
            add(
                'Locate a later read',
                alt
                    ? 'Check the memtable and candidate sorted runs for the newest visible version. Filters and indexes can skip work.'
                    : 'Follow tree separators to the leaf containing the key.',
                { b: alt ? 'read across candidate runs' : 'root → leaf' }
            );
            result = alt;
            metric('Illustrated data writes', 1);
            explanation =
                'This is a layout/ordering example, not an I/O benchmark. B-trees can split pages; LSM designs trade buffering and sequential flushes against compaction and multiple read candidates. Both may use WAL and caches. Workload, tuning and implementation determine amplification.';
            break;
        }
        case 'httpValidation': {
            const cached = alt ? n - 1 : n;
            add(
                'Stored response needs validation',
                `Cache holds body v${cached}, ETag "v${cached}", and Cache-Control: no-cache. no-cache permits storage but requires validation before reuse.`,
                { a: `body v${cached}; ETag v${cached}`, b: `current v${n}` }
            );
            add(
                'Send conditional request',
                `Browser sends If-None-Match: "v${cached}". Validation requires a network exchange.`,
                {},
                {},
                'a',
                'b'
            );
            add(
                'Compare validator',
                alt
                    ? `The current ETag v${n} differs; return 200 with the replacement body.`
                    : 'The validator matches; return 304 with metadata and no response body.',
                { b: alt ? `200 + body v${n}` : '304; no body' },
                {},
                'b',
                'a'
            );
            add(
                'Render representation',
                alt
                    ? 'Replace the cached body and render the new version.'
                    : 'Update applicable cache metadata and render the body already stored.',
                { a: `body v${n}`, d: `render v${n}` },
                { d: 1 },
                'a',
                'd'
            );
            result = alt;
            metric('Representation bodies downloaded during validation', alt ? 1 : 0);
            explanation =
                'A 304 response is not a replacement body. no-store prohibits storage, whereas no-cache requires successful validation for reuse. This example omits intermediary caches, Vary and authorization-specific reuse rules.';
            break;
        }
        case 'twoPhase': {
            add(
                'Prepare participants',
                `A reserves ${n} units; B reserves 1. Both promise to retain prepared state pending the global decision.`,
                { b: 'prepared; locks held', d: 'prepared; locks held' },
                { b: n, d: 1 },
                'a',
                'b'
            );
            add(
                'Collect second vote',
                'B also votes prepared. Preparing is not committing either business effect.',
                { a: 'both votes yes' },
                {},
                'd',
                'a'
            );
            add(
                'Durable decision, then crash',
                'Assume the coordinator records COMMIT durably, then becomes unreachable before delivering that decision.',
                { a: 'COMMIT durable; unreachable' }
            );
            beats[beats.length - 1].states = { a: 'failed' };
            if (alt) {
                add(
                    'Recover coordinator',
                    'Recovery reads the durable decision and resends COMMIT. Participants can now finalize their prepared work.',
                    { a: 'recovered; COMMIT' },
                    {},
                    'a',
                    'b'
                );
                beats[beats.length - 1].states = { a: 'done' };
                add(
                    'Resolve both participants',
                    'Both participants commit and release their locks after learning the decision.',
                    { b: 'committed; locks released', d: 'committed; locks released' },
                    {},
                    'a',
                    'd'
                );
            } else
                add(
                    'Remain in doubt',
                    'A timeout alone cannot safely tell either prepared participant to abort: the durable global decision may be COMMIT.',
                    { b: 'waiting; locks held', d: 'waiting; locks held' }
                );
            result = alt;
            metric('Participants still prepared', alt ? 0 : 2);
            explanation =
                'This bounded two-phase-commit failure shows blocking when the decision cannot be learned. Recovery and decision delivery resolve it. A saga uses local commits plus compensating actions instead; compensation is not the same atomic rollback.';
            break;
        }
        case 'uuidLayout': {
            const uuid7 = (ms: number, suffix: string) => {
                const hex = ms.toString(16).padStart(12, '0');
                return `${hex.slice(0, 8)}-${hex.slice(8)}-7000-8000-${suffix}`;
            };
            const first = alt ? uuid7(1000, '000000000001') : 'ffffffff-ffff-4fff-8fff-ffffffffffff';
            const second = alt ? uuid7(1000 - n, '000000000002') : '00000000-0000-4000-8000-000000000001';
            add(
                'Declare illustrative fields',
                'These fixed example bits illustrate layout, not a secure UUID generator or a measured collision rate.',
                { a: alt ? 'v7: 48-bit Unix ms prefix' : 'v4: random/pseudorandom payload' }
            );
            add('Create first identifier', first, { b: first }, {}, 'a', 'b');
            add(
                'Clock moves backwards',
                `The observed clock moves from 1000 ms to ${1000 - n} ms before the next generation. No monotonic correction is assumed.`,
                { a: `clock ${1000 - n} ms` }
            );
            add('Create later identifier', second, { d: second }, {}, 'a', 'd');
            add(
                'Inspect sorting',
                alt
                    ? 'The later v7 identifier sorts first because its time prefix is smaller. Time-based layout does not establish causality.'
                    : 'v4 has no time prefix. Lexical sorting does not recover generation order.',
                { a: 'lexical order ≠ generation order' }
            );
            result = alt;
            metric('Timestamp bits in layout', alt ? 48 : 0);
            explanation =
                'Version and variant bits have fixed positions. UUIDv4 uses 122 random/pseudorandom payload bits; UUIDv7 has a 48-bit millisecond timestamp and other generation fields. Real generators need entropy and clock/monotonicity handling. Neither scheme replaces authorization or causal clocks.';
            break;
        }
        case 'cacheWrite': {
            add('Warm cache', `Database and cache both hold version ${n - 1}.`, {
                b: `v${n - 1}`,
                d: `v${n - 1}`,
            });
            add(
                'Write database',
                `Application commits version ${n} to the database.`,
                { b: `v${n}` },
                {},
                'a',
                'b'
            );
            if (alt)
                add(
                    'Write cache before acknowledging',
                    'The application updates the cache before reporting success. This is a coordinated sequence, not an atomic database/cache transaction.',
                    { d: `v${n}` },
                    {},
                    'a',
                    'd'
                );
            else
                add(
                    'Missing invalidation',
                    'The database changed but this cache-aside implementation neither deletes nor updates the old cache entry.',
                    { d: `v${n - 1}` }
                );
            add(
                'Read cache hit',
                `A later read hits version ${alt ? n : n - 1}; it does not fetch the database on a hit.`,
                { a: `read v${alt ? n : n - 1}` },
                {},
                'd',
                'a'
            );
            result = alt;
            metric('Read version', alt ? n : n - 1);
            metric('Database version', n);
            explanation =
                'Cache-aside needs explicit invalidation or expiry after a write. The write-through sequence shown waits for both writes; failure between them still needs recovery. Write-back acknowledges cache-first and delays durable storage, a different policy with loss risk unless pending writes are durable.';
            break;
        }
        case 'consistencyHistory': {
            add(
                'Initial state',
                `Both replicas start at version ${n - 1}. The network may delay replication.`,
                { b: `leader v${n - 1} · follower v${n - 1}` }
            );
            add(
                'Write completes',
                `Writer receives success for version ${n} before the other client invokes its read.`,
                { a: `write v${n} completed`, b: `leader v${n} · follower v${n - 1}` },
                {},
                'a',
                'b'
            );
            add(
                'Later read invoked',
                'This read begins after the successful write response: these operations do not overlap.',
                { d: 'read invoked after write' },
                {},
                'd',
                'b'
            );
            add(
                'Read response',
                alt
                    ? `Coordination returns v${n}. The read respects the completed write.`
                    : `The lagging follower returns v${n - 1}. No real-time-compatible order can put this read before the completed write.`,
                { d: `read v${alt ? n : n - 1}` },
                {},
                'b',
                'd'
            );
            add(
                'Replica catches up',
                `The follower eventually receives v${n}. Later convergence does not change the earlier read history.`,
                { b: `both v${n}` }
            );
            result = alt;
            metric('Observed read version', alt ? n : n - 1);
            metric('Completed write version', n);
            explanation =
                'A linearizable register must respect nonoverlapping operation order. This bounded history distinguishes that property from eventual convergence; it does not prove a full implementation linearizable. Causal consistency preserves causal dependencies, but does not impose this global real-time order on independent clients.';
            break;
        }
        case 'foreignKey': {
            const exists = n <= 3;
            add('Declared rows', 'Customer ids 1, 2 and 3 exist. A new order carries a customer_id.', {
                a: 'ids 1, 2, 3',
                b: `customer_id=${n}`,
            });
            add(
                'Attempt reference',
                `Customer ${n} ${exists ? 'exists' : 'does not exist'} in this snapshot.`,
                {},
                {},
                'b',
                'a'
            );
            result = alt && !exists;
            add(
                'Constraint decision',
                alt && !exists
                    ? 'The foreign key rejects the orphan; no order is inserted.'
                    : 'The order is inserted under the selected policy.',
                { d: alt ? 'reference checked' : 'unchecked' },
                { b: alt && !exists ? 0 : 1 }
            );
            metric('Orphan rows inserted', !exists && !alt ? 1 : 0);
            explanation = `${exists ? 'This reference is valid.' : 'This reference is missing.'} Enforcing the constraint protects both valid and invalid attempts; it does not replace unrelated business rules.`;
            break;
        }
        case 'planner': {
            const scan = 8,
                index = 2 + 2 * n,
                useScan = alt && scan < index;
            add(
                'Estimate access work',
                `8 rows exist; ${n} match. Assume scan cost=8, index traversal=2 plus 2 per matching row.`,
                { a: `matches ${n}/8` }
            );
            add(
                'Compare estimates',
                `Index cost ${index}; sequential cost ${scan}. These are invented work units.`,
                { b: String(index), d: String(scan) }
            );
            add(
                'Choose access path',
                useScan ? 'The estimated sequential path is cheaper.' : 'Use the index path in this model.',
                { a: useScan ? 'scan selected' : 'index selected' },
                {},
                'a',
                useScan ? 'd' : 'b'
            );
            result = useScan;
            metric('Selected work units', useScan ? scan : index);
            explanation =
                'A real planner estimates page IO, CPU, selectivity and other costs from statistics. This toy comparison shows why an existing index can be ignored.';
            break;
        }
        case 'mvcc': {
            add(
                'Committed base',
                'A committed version has value 1; a reader begins before the writer commits.',
                { b: 'committed v1 = 1' }
            );
            add(
                'Writer stages a change',
                `Writer creates an uncommitted version with value ${n}.`,
                { a: `pending ${n}`, b: `committed 1 | pending ${n}` },
                {},
                'a',
                'b'
            );
            add(
                'Reader chooses visibility',
                alt
                    ? 'Reader sees the committed version, not the unfinished write.'
                    : 'A dirty-read policy exposes the uncommitted version.',
                { d: String(alt ? 1 : n) },
                {},
                'b',
                'd'
            );
            add('Writer rolls back', 'The pending version disappears; the committed value stays 1.', {
                a: 'rolled back',
                b: 'committed 1',
            });
            result = alt;
            metric('Reader saw', alt ? 1 : n);
            explanation =
                'This isolates visibility, not a full MVCC implementation. Snapshots, locks, write conflicts and isolation-level rules still matter.';
            break;
        }
        case 'upload': {
            add('Reserve object key', `Object photo/42 requires ${n} chunks. The final chunk will fail.`, {
                a: 'photo/42 pending',
                d: 'not visible',
            });
            if (!alt)
                add(
                    'Publish too early',
                    'Metadata points to an object that is not yet complete.',
                    { d: 'visible → photo/42' },
                    {},
                    'a',
                    'd'
                );
            for (let i = 1; i < n; i++)
                add(
                    `Upload chunk ${i}`,
                    'Partial upload bytes are not a complete object.',
                    { b: `${i}/${n} chunks` },
                    { b: i },
                    'c',
                    'b'
                );
            add(
                'Final chunk fails',
                alt
                    ? 'Keep publication pending; clean up the incomplete upload.'
                    : 'A reader follows published metadata to missing object bytes.',
                { a: 'failed', d: alt ? 'not visible' : 'dangling reference' }
            );
            result = alt;
            metric('Dangling published references', alt ? 0 : 1);
            explanation =
                'Object completion and application metadata publication are separate boundaries. Recovery, cleanup, access controls and retry identities need explicit policies.';
            break;
        }
        case 'storageChoice': {
            add(
                'State the invariant',
                `All ${n} related row changes must commit or roll back together.`,
                { a: 'atomic related-row update' },
                { a: n }
            );
            add(
                'Match the capability',
                alt
                    ? 'Choose a transactional row store for the declared row invariant.'
                    : 'An object API writes bytes under keys; that alone does not supply the required multi-row transaction.',
                { b: alt ? 'row transaction' : 'object bytes' },
                {},
                'a',
                'b'
            );
            result = alt;
            add(
                'Record consequence',
                alt
                    ? 'The chosen capability matches this requirement. Other workloads may need other stores.'
                    : 'The required invariant needs additional coordination or another storage boundary.',
                { d: alt ? 'supported' : 'gap' }
            );
            metric('Rows requiring coordination', n);
            explanation =
                'This is a capability comparison for one requirement, not a product ranking. Access patterns, scale, operating cost and deployment guarantees remain inputs.';
            break;
        }
        case 'session': {
            add(
                'Request reaches A',
                `The user adds ${n} items through worker A.`,
                { a: `cart ${n}`, d: 'no local cart' },
                { a: n },
                'c',
                'a'
            );
            if (alt)
                add(
                    'Persist shared cart',
                    'A stores the cart behind a shared state boundary.',
                    { b: `cart ${n}` },
                    { b: n },
                    'a',
                    'b'
                );
            add(
                'Next request reaches B',
                alt ? 'B reads the shared cart by user id.' : 'B has no copy of A’s private in-memory cart.',
                { d: alt ? `cart ${n}` : 'cart missing' },
                { d: alt ? n : 0 },
                alt ? 'b' : 'c',
                'd'
            );
            result = alt;
            metric('Items visible through B', alt ? n : 0);
            explanation =
                'Interchangeable workers remove worker affinity, not application state. The shared store still needs availability, consistency and authorization decisions.';
            break;
        }
        case 'proxy': {
            add('Public entry points', `${n} requests target a private service.`, {
                b: 'private address only',
            });
            add(
                'Choose ingress',
                alt
                    ? 'The public proxy terminates ingress and forwards only configured routes.'
                    : 'Each private service is independently reachable from public clients.',
                { a: alt ? 'public ingress' : 'bypassed' },
                {},
                'c',
                alt ? 'a' : 'b'
            );
            if (alt)
                add(
                    'Forward allowed route',
                    'The proxy sends the request across the explicit private boundary.',
                    { d: `${n} routed` },
                    { d: n },
                    'a',
                    'b'
                );
            result = alt;
            metric('Direct public service paths', alt ? 0 : 1);
            explanation =
                'A reverse proxy centralizes an ingress boundary. It still needs route policy, timeouts, forwarding-header trust and resource authorization; its presence alone does not secure a service.';
            break;
        }
        case 'replacement': {
            add(
                'Desired count is two',
                'Two workers each handle 3 jobs per window.',
                { a: 'desired 2', b: '2 live' },
                { b: 2 }
            );
            add(
                'One worker disappears',
                `${n} jobs arrive after one worker fails.`,
                { b: '1 live' },
                { b: 1, d: n }
            );
            if (alt)
                add(
                    'Controller reconciles',
                    'The controller observes the missing worker and starts a replacement; assume it becomes ready next window.',
                    { a: 'reconcile', b: '2 ready' },
                    { b: 2 },
                    'a',
                    'b'
                );
            const remaining = Math.max(0, n - (alt ? 6 : 3));
            add(
                'Service window',
                `${remaining} jobs remain after the selected ready capacity is applied.`,
                {},
                { d: remaining }
            );
            result = alt;
            metric('Ready workers', alt ? 2 : 1);
            metric('Queued after recovery window', remaining);
            explanation =
                'Desired-state reconciliation replaces missing capacity after detection and startup. Placement, state recovery and startup time are omitted, not instantaneous guarantees.';
            break;
        }
        case 'scaleLag': {
            let backlog = Math.max(0, n - 3);
            add(
                'Spike before scaling',
                `${n} jobs arrive, one worker completes 3.`,
                { b: '1 worker' },
                { d: backlog, b: 1 }
            );
            add(
                'Controller observes lag',
                alt ? 'The extra worker takes one full window to become ready.' : 'No worker is added.',
                { a: alt ? 'starting worker' : 'unchanged' }
            );
            const cap = alt ? 6 : 3;
            for (let i = 2; i <= 4; i++) {
                backlog = Math.max(0, backlog + n - cap);
                add(
                    `Window ${i}`,
                    `${n} arrivals, capacity ${cap}; backlog ${backlog}.`,
                    { b: alt ? '2 workers' : '1 worker' },
                    { d: backlog, b: alt ? 2 : 1 },
                    'c',
                    'b'
                );
            }
            result = alt && backlog === 0;
            metric('Backlog after 4 windows', backlog);
            explanation =
                'Scaling reacts after observation and readiness delay. Spare capacity must exceed arrivals to drain earlier backlog; at equal arrival and service rates the backlog persists.';
            break;
        }
        case 'coalesce': {
            add(
                'One key expires',
                `${n} callers miss the same key at the same time.`,
                { a: 'key absent' },
                { d: n }
            );
            const fetches = alt ? 1 : n;
            for (let i = 1; i <= fetches; i++)
                add(
                    `Origin fetch ${i}`,
                    alt
                        ? 'One in-flight lookup is shared only because callers request the identical reusable result.'
                        : 'An independent origin lookup is issued for this caller.',
                    {},
                    { b: i },
                    'a',
                    'b'
                );
            add(
                'Complete waiting callers',
                'Every caller receives the reusable result; independent events must not be collapsed this way.',
                { d: `${n} replies` },
                { d: n },
                'b',
                'c'
            );
            result = fetches > 1;
            metric('Origin fetches', fetches);
            explanation =
                'Coalescing shares identical work. Pub/sub is different: each independent subscriber still needs delivery. Origin timeout and failed in-flight cleanup need policies.';
            break;
        }
        case 'redelivery': {
            const markWorker = (state: 'idle' | 'active' | 'done' | 'failed'): void => {
                beats[beats.length - 1].states = { b: state };
            };
            add(
                'Broker retains work',
                'The broker retains one work obligation until acknowledgment. Worker 0 is ready.',
                { a: 'one ready job', b: 'worker 0 ready', d: 'no durable effect' },
                { a: 1, b: 0, d: 0 }
            );
            markWorker('idle');
            add(
                'Deliver job 1',
                'Worker 0 receives the job. Receiving it has not saved its application effect.',
                { a: 'one unacked job', b: 'worker 0 processing' },
                { a: 1, b: 1 },
                'a',
                'b'
            );
            markWorker('active');
            if (!alt) {
                add(
                    'Early ack',
                    'The broker drops its work obligation before the application effect is saved.',
                    { a: 'acked; no pending job' },
                    { a: 0 },
                    'b',
                    'a'
                );
                markWorker('active');
            }
            add(
                'Worker 0 crashes',
                alt
                    ? 'Assume its channel closes. The unacknowledged job is requeued; no effect has been saved.'
                    : 'The acknowledged job is gone, but its effect was never saved.',
                { a: alt ? 'one requeued job' : 'empty', b: 'worker 0 crashed' },
                { a: alt ? 1 : 0, d: 0 }
            );
            markWorker('failed');
            let deliveries = 1;
            for (let i = 1; i <= n; i++) {
                if (alt || i === 1) {
                    add(
                        `Start replacement ${i}`,
                        'A live replacement starts before asking the broker for work.',
                        { b: `replacement ${i} ready` }
                    );
                    markWorker('idle');
                }
                add(
                    `Work request ${i}`,
                    'The live replacement asks whether a job is available.',
                    { b: `live worker requests work ${i}` },
                    {},
                    'b',
                    'a'
                );
                markWorker('active');
                if (alt) {
                    deliveries++;
                    add(
                        `Redeliver job 1, attempt ${i}`,
                        'The requeued job reaches a live replacement. Its durable effect is still pending.',
                        { a: 'one unacked job', b: `replacement ${i} processing` },
                        { a: 1, b: deliveries, d: 0 },
                        'a',
                        'b'
                    );
                    markWorker('active');
                    add(
                        `Replacement ${i} crashes`,
                        'It crashes before saving the effect or acknowledging. Channel closure requeues the same job again.',
                        { a: 'one requeued job', b: `replacement ${i} crashed` },
                        { a: 1, d: 0 }
                    );
                    markWorker('failed');
                } else {
                    add(
                        `Empty result ${i}`,
                        'The early acknowledgment removed the obligation. This live worker receives no job.',
                        { a: 'empty', b: 'live; no job received' },
                        { a: 0, b: deliveries, d: 0 },
                        'a',
                        'b'
                    );
                    markWorker('done');
                }
            }
            result = alt;
            metric('Replacement work requests', n);
            metric('Actual job deliveries', deliveries);
            metric('Saved durable effects', 0);
            metric('Retained work obligations', alt ? 1 : 0);
            explanation =
                'Each delivery targets a live worker. This fault run makes every receiving worker crash before durable processing; late acknowledgment preserves one obligation, not completed work. A crash after saving an effect but before ack is a separate duplicate-effect risk requiring safe reprocessing.';
            break;
        }
        case 'flow': {
            const admitted = alt ? 3 : n;
            add(
                'Capacity advertised',
                'Consumer has 3 available slots in this window.',
                { a: '3 credits' },
                { a: 3 }
            );
            add(
                'Producer offers work',
                `${n} jobs are offered.`,
                {},
                { b: admitted, d: n - admitted },
                'c',
                'a'
            );
            add(
                'Consumer completes three',
                'Admitting beyond service capacity creates a downstream backlog.',
                { b: `${Math.max(0, admitted - 3)} queued`, d: `${n - admitted} upstream` },
                { b: Math.max(0, admitted - 3), d: n - admitted },
                'a',
                'b'
            );
            result = alt;
            metric('Downstream backlog', Math.max(0, admitted - 3));
            metric('Upstream waiting', n - admitted);
            explanation =
                'Backpressure communicates capacity upstream. Upstream still needs bounded buffering, deadlines or rejection; work does not disappear.';
            break;
        }
        case 'offsets': {
            add(
                'Append entries',
                `The retained log contains offsets 1 through ${n}.`,
                { a: `1…${n}` },
                { a: n }
            );
            add(
                'Reader A advances',
                `A consumes through ${n}. The log entries remain.`,
                { b: `offset ${n}` },
                { b: n },
                'a',
                'b'
            );
            add(
                'Reader B starts',
                alt
                    ? 'B uses its own offset 0 and can replay the retained log.'
                    : 'B incorrectly shares A’s cursor and begins after all existing entries.',
                { d: alt ? 'offset 0 → replay' : 'offset inherited → skip' },
                { d: alt ? n : 0 },
                'a',
                'd'
            );
            result = alt;
            metric('Entries B can replay', alt ? n : 0);
            explanation =
                'Independent consumer positions decouple reading progress. Retention can remove older entries, and offset commit versus effect commit still affects replay safety.';
            break;
        }
        case 'mapReduce': {
            const left = Math.ceil(n / 2),
                right = Math.floor(n / 2);
            add(
                'Bounded input',
                `${n} records each contribute 1 to a total.`,
                { a: `${n} inputs` },
                { a: n }
            );
            add(
                'Map partitions',
                alt ? `Two disjoint partitions produce ${left} and ${right}.` : `One task counts all ${n}.`,
                { b: alt ? `${left} + ${right}` : String(n) },
                { b: alt ? 2 : 1 },
                'a',
                'b'
            );
            add(
                'Reduce partial results',
                'Combine disjoint partial counts once; the sum is unchanged by partitioning.',
                { d: String(n) },
                { d: n },
                'b',
                'd'
            );
            result = alt;
            metric('Map tasks', alt ? 2 : 1);
            metric('Reduced total', n);
            explanation =
                'Parallel partitioning preserves this associative count. Shuffle, skew, retries and idempotent output commits require more than this small arithmetic example.';
            break;
        }
        case 'outbox': {
            add(
                'Stage business changes',
                `${n} business changes are pending inside a local transaction; none are committed yet.`,
                { a: 'uncommitted', b: 'uncommitted' },
                { a: 0, b: 0 }
            );
            add(
                alt ? 'Commit both atomically' : 'Commit without event intent',
                alt
                    ? 'Business rows and outbox rows become durable at the same commit boundary.'
                    : 'Only business rows commit; publication intent has no durable record.',
                { a: `${n} committed`, b: alt ? `${n} pending events` : 'no durable intent' },
                { a: n, b: alt ? n : 0 }
            );
            add('Publisher crashes', 'No broker delivery has completed yet.', { d: '0 delivered' }, { d: 0 });
            add(
                'Restart relay',
                alt
                    ? 'The relay reads durable outbox intent and can retry delivery.'
                    : 'No durable publication intent identifies the missing events.',
                { b: alt ? 'recoverable' : 'missing' },
                {},
                'b',
                'd'
            );
            result = alt;
            metric('Recoverable event intents', alt ? n : 0);
            explanation =
                'This models a local atomic outbox boundary. Relay delivery can repeat; consumers still need deduplication and ordering policies.';
            break;
        }
        case 'uncertain': {
            add(
                'Send operation',
                'The remote service commits an effect at tick 1.',
                { b: 'committed at tick 1' },
                { b: 1 },
                'c',
                'b'
            );
            add(
                'Reply delayed',
                `No reply arrives before deadline tick ${n}. This does not undo the effect.`,
                { a: `timeout at ${n}`, b: 'still committed' }
            );
            add(
                'Interpret timeout',
                alt
                    ? 'Keep the outcome unknown to the caller; reconcile by stable operation identity.'
                    : 'The caller falsely concludes the effect never happened and risks repeating it.',
                { d: alt ? 'unknown → reconcile' : 'assumed absent' },
                {},
                'c',
                'd'
            );
            result = alt;
            metric('Actual committed effects before retry', 1);
            explanation =
                'A timeout is a statement about observed waiting, not remote state. Some failures are known; this example intentionally delays a successful reply past any selected deadline.';
            break;
        }
        case 'readQuorum': {
            add('Known completed write', 'Assume a completed write stored v2 on A and B; C still has v1.', {
                a: 'v2',
                b: 'v2',
                d: 'v1',
            });
            const replies = ['d', 'a', 'b'].slice(0, n);
            replies.forEach((replica, index) => {
                add(
                    `Reply ${index + 1} of ${n}`,
                    index === 0
                        ? 'C replies first with v1. Returning now can be stale.'
                        : alt
                          ? 'Include this v2 reply when choosing the newest model version.'
                          : 'This newer reply arrives after the first-reply read already returned v1.',
                    { c: alt ? `${index + 1} replies collected` : 'returned v1' },
                    { c: index + 1, [replica]: 1 },
                    replica,
                    'c'
                );
            });
            add(
                'Choose the read result',
                alt
                    ? 'Compare all requested versions; at least one contains v2.'
                    : 'Only the first reply determined the returned value.',
                { c: alt ? 'v2' : 'v1' }
            );
            result = alt;
            metric('Replies requested', n);
            metric('Replies used for result', alt ? n : 1);
            metric('Returned version', alt ? 2 : 1);
            explanation =
                'For this fixed completed write, R≥2 and W=2 intersect among N=3 replicas. Concurrent writes, sloppy quorums, version ordering and failures require more rules; quorum arithmetic alone is not linearizability.';
            break;
        }
        case 'saga': {
            add(
                'Reserve inventory',
                `${n} units are reserved by the inventory service.`,
                { a: `${n} reserved` },
                { a: n },
                'c',
                'a'
            );
            add(
                'Payment fails',
                'The unrelated payment provider rejects the charge. A local transaction cannot roll back both services.',
                { b: 'declined' },
                {},
                'a',
                'b'
            );
            add(
                'Compensate or leak',
                alt
                    ? 'Send an idempotent release command; assume it succeeds in this run.'
                    : 'Without compensation, inventory stays reserved.',
                { a: alt ? 'released' : 'still reserved', d: alt ? 'release acknowledged' : 'no action' },
                { a: alt ? 0 : n },
                'd',
                'a'
            );
            result = alt;
            metric('Units still reserved', alt ? 0 : n);
            explanation =
                'A saga uses explicit compensating actions, not distributed atomic rollback. Compensation can itself fail and needs durable retry and reconciliation.';
            break;
        }
        case 'election': {
            add('One election term', 'Three voters each grant at most one vote in this term.', {
                a: 'candidate A',
                d: 'candidate B',
                b: `${n} reachable`,
            });
            add(
                'Candidate seeks votes',
                alt
                    ? `${n} votes are reachable; two are required.`
                    : 'A candidate declares itself leader from its own vote.',
                { a: alt ? (n >= 2 ? 'majority' : 'no majority') : 'self-declared' },
                { b: n },
                'a',
                'b'
            );
            add(
                'Partition consequence',
                alt
                    ? 'Two disjoint groups cannot both contain a strict majority of the same three voters.'
                    : 'An isolated candidate can incorrectly claim authority alongside another group.',
                { d: alt ? 'no second majority' : 'split authority risk' }
            );
            result = alt;
            metric('Authorized leaders in this candidate group', alt ? (n >= 2 ? 1 : 0) : 1);
            explanation =
                'This isolates election voting within one fixed term/configuration. A real protocol also needs persistent votes, log freshness, terms and safe configuration changes.';
            break;
        }
        case 'gossip': {
            add('A learns new membership', 'Only A knows the new member in this model.', {
                a: 'knows',
                b: 'old',
                d: 'old',
            });
            for (let i = 1; i <= n; i++)
                add(
                    `Gossip round ${i}`,
                    alt && i >= 2
                        ? 'An informed peer contacts C; all three now know.'
                        : 'A contacts B; repeatedly selecting B does not inform C.',
                    { b: 'knows', d: alt && i >= 2 ? 'knows' : 'old' },
                    {},
                    alt && i >= 2 ? 'b' : 'a',
                    alt && i >= 2 ? 'd' : 'b'
                );
            result = alt;
            metric('Informed nodes', alt ? 3 : 2);
            explanation =
                'Peer selection affects dissemination. Real gossip is often randomized and eventual; this deterministic schedule is not a convergence time bound or failure proof.';
            break;
        }
        case 'bulkhead': {
            const capacity = alt ? 2 : 4,
                occupied = Math.min(n, capacity),
                available = 4 - occupied,
                rejected = n - occupied;
            add(
                'Finite pool',
                'There are 4 slots; slow calls hold slots until timeout. Calls over their pool limit are rejected without a queue.',
                { b: '4 total slots' },
                { b: 4 }
            );
            add(
                'Broken calls occupy slots',
                `${n} calls compete for ${alt ? 'an isolated pool of 2' : 'the shared pool of 4'}.`,
                { a: `${occupied} occupied; ${rejected} rejected` },
                { a: occupied },
                'c',
                'a'
            );
            add(
                'Healthy feature arrives',
                available
                    ? 'Separate capacity remains for healthy work.'
                    : 'No slot remains for unrelated healthy work.',
                { d: available ? 'can run' : 'starved' },
                { d: available },
                'c',
                'd'
            );
            result = available > 0;
            metric('Calls holding slots', occupied);
            metric('Calls rejected at pool limit', rejected);
            metric('Slots available for healthy work', available);
            explanation =
                'Resource isolation bounds one failure’s blast radius. It trades shared utilization for protected capacity and still needs queue bounds and deadlines.';
            break;
        }
        case 'retry': {
            const attempts = n * (alt ? 2 : 3);
            add(
                'Uncertain outcomes',
                `${n} callers have not received replies. Every retry adds downstream work.`,
                {},
                { d: n }
            );
            add(
                'Apply retry policy',
                alt
                    ? 'Each caller has a budget of one delayed retry.'
                    : 'Each caller immediately sends two retries.',
                { a: alt ? 'backoff + one retry' : 'two immediate retries' },
                {},
                'c',
                'a'
            );
            add(
                'Count attempts',
                `${n} original attempts plus ${attempts - n} retry attempts.`,
                { b: String(attempts) },
                { b: attempts },
                'a',
                'b'
            );
            result = alt;
            metric('Total attempts', attempts);
            explanation =
                'A retry budget bounds amplification; backoff spreads timing. Retrying side effects also requires stable operation identity and uncertainty handling.';
            break;
        }
        case 'canary': {
            const exposed = alt ? 2 : 8,
                bad = Math.min(n, exposed);
            add(
                'Eight-user rollout',
                'The new release is faulty. Assume each user issues at most one request before the stop signal; the old release serves correctly.',
                { b: 'faulty', d: 'healthy' },
                { d: 8 }
            );
            add(
                'Route release traffic',
                alt
                    ? 'Only 2 of 8 users enter the canary cohort.'
                    : 'All 8 users enter the new release cohort.',
                { a: alt ? 'canary 2/8' : 'rollout 8/8' },
                { b: exposed, d: 8 - exposed },
                'a',
                'b'
            );
            add(
                'Observe and roll back',
                `${bad} bad requests have occurred by the stop signal. Future traffic returns to old release.`,
                { a: 'rollback', d: 'old version restored' },
                { a: bad },
                'a',
                'd'
            );
            result = alt;
            metric('Users exposed to faulty version', exposed);
            metric('Bad requests before stop', bad);
            explanation =
                'Canaries limit initial exposure; they require representative cohorts, health signals and rollback compatibility. They cannot undo effects already committed.';
            break;
        }
        case 'migration': {
            add(
                'Mixed application versions',
                `${n} old instances still read field A; new instances will read field B.`,
                { a: `${n} read A`, d: 'reads B' }
            );
            add(
                alt ? 'Expand' : 'Drop too soon',
                alt
                    ? 'Add B while preserving A, then backfill B.'
                    : 'Drop A before the old instances are retired.',
                { b: alt ? 'A + B' : 'B only' },
                {},
                'c',
                'b'
            );
            add(
                'Read during overlap',
                alt
                    ? 'Both versions can read their expected fields.'
                    : 'All old instances request the removed field A.',
                { a: alt ? 'works' : 'broken', d: 'works' },
                { a: alt ? 0 : n },
                'b',
                'a'
            );
            if (alt)
                add(
                    'Contract after transition',
                    'Only after old readers and writes are retired may A be removed.',
                    { b: 'B only after retirement', a: 'retired' }
                );
            result = alt;
            metric('Broken old instances during overlap', alt ? 0 : n);
            explanation =
                'Expand/contract preserves overlap compatibility. Backfills, dual writes, validation and rollback windows need explicit operational plans.';
            break;
        }
        case 'recovery': {
            const version = alt ? n : n - 2;
            add('Primary region commits', `Region A has v${n}; region B starts at v${n - 2}.`, {
                a: `v${n}`,
                b: `v${n - 2}`,
            });
            if (alt)
                add(
                    'Replicate before disaster',
                    'Assume the final two versions become durable in region B before failure.',
                    { b: `v${n}` },
                    {},
                    'a',
                    'b'
                );
            add(
                'Region A unavailable',
                'Recover reads through region B; routing and promotion time are omitted.',
                { a: 'unavailable', d: `v${version}` },
                {},
                'b',
                'c'
            );
            result = alt;
            metric('Recent versions missing', n - version);
            explanation =
                'Recovery point depends on data that reached surviving storage. Recovery time is a separate measured target; this model does not claim zero downtime.';
            break;
        }
        case 'injection': {
            add(
                'State hypothesis',
                'Three ready workers provide 9 jobs/window. Predict recovery after removing selected workers.',
                { b: '3 ready' },
                { b: 3 }
            );
            add(
                'Inject bounded fault',
                `Remove ${n} workers in the illustrative environment.`,
                { b: `${3 - n} ready` },
                { b: 3 - n },
                'a',
                'b'
            );
            if (alt)
                add(
                    'Observe recovery action',
                    'Assume the controller detects the loss and replacement workers become ready.',
                    { b: '3 ready', d: 'recovery observed' },
                    { b: 3 },
                    'd',
                    'b'
                );
            result = alt;
            metric('Capacity after observation window', 3 * (alt ? 3 : 3 - n));
            explanation =
                'A useful fault test states a hypothesis, blast radius, stop condition and observation window. This is a deterministic simulation, not evidence from a production chaos experiment.';
            break;
        }
        case 'sql': {
            add('Untrusted input', "Input is: x' OR 1=1 -- . It must remain data, not a new query clause.", {
                a: 'WHERE name = input',
                b: 'untrusted text',
            });
            add(
                'Build query',
                alt
                    ? 'Pass the text as a bound value; it cannot introduce OR into the SQL syntax.'
                    : 'Concatenation lets the text close a quote and add an always-true clause.',
                { a: alt ? 'fixed query structure' : 'OR 1=1 introduced' },
                {},
                'b',
                'a'
            );
            add(
                'Evaluate illustrative rows',
                alt
                    ? 'No row has that exact malicious name.'
                    : 'The altered condition exposes all model rows.',
                { d: alt ? '0 rows' : `${n} rows` },
                { d: alt ? 0 : n },
                'a',
                'd'
            );
            result = alt;
            metric('Rows exposed', alt ? 0 : n);
            explanation =
                'Binding separates values from SQL grammar. Parameterized values do not safely substitute identifiers; authorization and other web defenses remain separate.';
            break;
        }
        case 'boundaries': {
            add('One feature path', `The path crosses ${n} cohesive modules.`, { b: `${n} modules` });
            add(
                'Choose deployment boundary',
                alt
                    ? 'Modules call locally within a modular application.'
                    : 'Each module becomes an independently deployed network service.',
                { d: alt ? '0 inter-service hops' : `${n - 1} inter-service hops` },
                { d: alt ? 0 : n - 1 },
                'a',
                'b'
            );
            add(
                'Record tradeoff',
                alt
                    ? 'Local deployment simplifies this path but shares release and failure boundaries.'
                    : 'Separate deployment adds network failures and operations; it can enable independent ownership and scaling.',
                { a: alt ? 'shared deployment' : 'independent deployments' }
            );
            result = alt;
            metric('Inter-service hops', alt ? 0 : n - 1);
            explanation =
                'This example counts boundary costs, not whether microservices are universally bad. Ownership, independent change, scaling and failure containment determine the choice.';
            break;
        }
        case 'communication': {
            add(
                'Request needs later work',
                `${n} jobs each take one illustrative tick on a single worker.`,
                { a: 'request received' },
                { b: n }
            );
            add(
                'Acceptance boundary',
                alt
                    ? 'Persist jobs before returning accepted; completion is a later status.'
                    : 'Keep the caller waiting until all jobs complete.',
                { a: alt ? 'accepted, not complete' : 'waiting' },
                {},
                'a',
                'b'
            );
            add(
                'Worker completes jobs',
                `The worker completes ${n} jobs over ${n} ticks in both modes.`,
                { d: 'completed', a: alt ? 'later status update' : 'reply complete' },
                { d: n },
                'b',
                'd'
            );
            result = alt;
            metric('Worker completion ticks', n);
            metric('Reply semantics', alt ? 'accepted' : 'completed');
            explanation =
                'Async changes timing and reply semantics, not the amount of work. Durability, duplicate processing, status queries and cancellation require contracts.';
            break;
        }
        case 'sharedQuota': {
            const admitted = alt ? 3 : Math.min(n, 3) * 2;
            add('One global quota', 'Two servers must share allowance 3 with no refill in this burst.', {
                b: 'global cap 3',
            });
            add(
                'Server A admits',
                `${Math.min(n, 3)} requests are admitted on A.`,
                { a: String(Math.min(n, 3)) },
                { a: Math.min(n, 3) },
                'c',
                'a'
            );
            add(
                'Server B admits',
                alt
                    ? `Only ${Math.max(0, 3 - n)} allowance remains in the shared state.`
                    : 'B independently grants its own allowance, ignoring A.',
                { d: String(alt ? Math.max(0, 3 - n) : Math.min(n, 3)) },
                { d: alt ? Math.max(0, 3 - n) : Math.min(n, 3) },
                'c',
                'd'
            );
            result = alt;
            metric('Total admitted', admitted);
            explanation =
                'This model assumes serialized shared-quota updates and no refill. Distributed partitions force a policy choice between strict enforcement and independent admission.';
            break;
        }
        case 'feed': {
            add('Persist one post', `One author has ${n} followers; one follower will open their feed.`, {
                a: 'one durable post',
            });
            add(
                'Publish path',
                alt
                    ? 'Store the post without copying it into every feed.'
                    : `Copy the post id into ${n} follower feed lists.`,
                { b: alt ? '0 feed copies' : `${n} feed copies` },
                { b: alt ? 0 : n },
                'a',
                'b'
            );
            add(
                'Read path',
                alt
                    ? 'The reader queries followed authors and assembles candidates now.'
                    : 'The reader retrieves its already materialized feed list.',
                { d: alt ? 'assemble at read' : 'read materialized list' },
                {},
                alt ? 'a' : 'b',
                'd'
            );
            result = alt;
            metric('Publish-time feed writes', alt ? 0 : n);
            metric('Readers in this scenario', 1);
            explanation =
                'These are independent follower destinations, never coalesced into one shared delivery. Real feeds combine candidate retrieval, ranking, privacy filtering and hybrid handling of large audiences.';
            break;
        }
        case 'chat': {
            add(
                'Accept into durable log',
                `${n} messages are accepted by the server while the recipient is offline.`,
                { a: `${n} accepted` },
                { a: n },
                'c',
                'a'
            );
            add(
                'Recipient unavailable',
                'There is no delivery acknowledgement and no read receipt.',
                { b: 'offline' },
                { b: 0 }
            );
            add(
                'Expose receipt',
                alt
                    ? 'Display accepted; wait for device delivery and explicit read acknowledgement.'
                    : 'The sender UI incorrectly labels server acceptance as read.',
                { d: alt ? 'accepted only' : 'incorrectly read' }
            );
            result = alt;
            metric('Actually read messages', 0);
            metric('Accepted messages', n);
            explanation =
                'Acceptance, device delivery and human read state are different protocol events. Offline storage, replay, ordering and multi-device sync need explicit definitions.';
            break;
        }
        case 'crawler': {
            add(
                'Frontier before fetch',
                `${n} eligible, deduplicated URLs target the same host. Assume robots policy has allowed these paths.`,
                { a: `${n} queued` },
                { a: n }
            );
            add(
                'Schedule per host',
                alt
                    ? 'Admit one fetch; leave remaining URLs in the frontier.'
                    : 'Launch every URL against the same host at once.',
                { b: alt ? '1 active' : `${n} active` },
                { b: alt ? 1 : n, d: alt ? n - 1 : 0 },
                'a',
                'b'
            );
            result = alt;
            metric('Concurrent fetches on host', alt ? 1 : n);
            metric('Deferred URLs', alt ? n - 1 : 0);
            explanation =
                'The slot limit is an illustrative politeness policy, not a robots requirement. Canonicalization, robots fetching, deduplication, retries and crawl traps are separate concerns.';
            break;
        }
        case 'prefix': {
            const prefix = 'cart'.slice(0, n),
                all = ['car', 'cart', 'cat', 'dog', 'care', 'card'],
                matches = all.filter((s) => s.startsWith(prefix));
            add('Normalize query', `The prefix is “${prefix}”. Six suggestions exist.`, {
                a: prefix,
                b: all.join(', '),
            });
            add(
                'Retrieve candidates',
                alt
                    ? 'A prefix posting list identifies the matching candidates.'
                    : 'Scan all six strings for the prefix.',
                { b: matches.join(', ') || 'none' },
                { b: alt ? matches.length : all.length },
                'c',
                'a'
            );
            add(
                'Rank explicitly',
                'For this teaching example, order candidates alphabetically. Real ranking is a separate policy.',
                { d: matches.sort().join(', ') },
                { d: matches.length },
                'a',
                'd'
            );
            result = alt;
            metric('Strings inspected after lookup', alt ? matches.length : all.length);
            explanation =
                'Prefix retrieval narrows candidates; it does not learn relevance. Short prefixes can still produce many candidates and need bounded results, ranking and privacy controls.';
            break;
        }
        case 'inverted': {
            const term = ['red', 'blue', 'green'][n - 1],
                posting: Record<string, number[]> = { red: [1, 3], blue: [2, 3], green: [4] };
            add('Tokenized documents', 'D1=red, D2=blue, D3=red blue, D4=green.', { b: 'D1 D2 D3 D4' });
            add('Look up term', `Search term “${term}”.`, { a: term }, {}, 'c', 'a');
            add(
                'Retrieve postings',
                alt
                    ? `${term} points to document ids ${posting[term].join(', ')}.`
                    : 'Read all four document bodies to check the term.',
                { d: posting[term].join(', ') },
                { d: posting[term].length, b: alt ? posting[term].length : 4 },
                'a',
                'b'
            );
            result = alt;
            metric('Candidate document inspections', alt ? posting[term].length : 4);
            explanation =
                'The term dictionary maps words to document-id postings. Tokenization, normalization and ranking remain explicit parts of a search system; binary numeric search is not this mechanism.';
            break;
        }
        case 'fileVersions': {
            add('Shared base version', 'Both offline devices begin from file version v1.', {
                a: 'base v1',
                b: 'base v1',
            });
            add('Concurrent edits', `A makes ${n} edits; B makes one different edit from the same base.`, {
                a: `branch A +${n}`,
                b: 'branch B +1',
            });
            add(
                'Synchronize branches',
                alt
                    ? 'Metadata retains two children of v1 and reports a conflict.'
                    : 'Last arrival overwrites the other branch, even though neither edit knew of the other.',
                { d: alt ? 'two divergent versions' : 'one winner, one lost' },
                { d: alt ? 2 : 1 },
                'a',
                'd'
            );
            result = alt;
            metric('Branches preserved', alt ? 2 : 1);
            explanation =
                'Retaining versions makes conflict visible; it does not automatically merge arbitrary file bytes. A real product needs user or domain-specific resolution, object cleanup and synchronization policy.';
            break;
        }
        case 'segments': {
            add(
                'Prepare media first',
                'Assume encoding already produced a versioned playable segment. Caching does not transcode it.',
                { a: 'segment video/v3/001' }
            );
            add(
                'First viewer fetches segment',
                'The first request fills the edge from the media origin.',
                { b: 'v3/001 cached' },
                { a: 1, d: 1 },
                'a',
                'b'
            );
            add(
                'Remaining viewers',
                alt
                    ? `${n - 1} viewers reuse the same edge object.`
                    : `${n - 1} additional requests fetch from origin.`,
                { d: `${n} viewers` },
                { a: alt ? 1 : n, d: n },
                alt ? 'b' : 'a',
                'd'
            );
            result = alt;
            metric('Origin segment transfers', alt ? 1 : n);
            explanation =
                'Versioned segment reuse reduces origin work for this one segment. Adaptive bitrate selection, manifests, access control, encoding and playback buffers are distinct mechanisms.';
            break;
        }
        case 'consensusLog': {
            add(
                'Leader appends current-term entry',
                'Assume a valid elected leader in one fixed term. Entry e1 is local and uncommitted.',
                { a: 'e1 uncommitted', b: 'empty', d: 'empty' }
            );
            if (!alt)
                add('Reply too early', 'A local append alone is not evidence of replicated commitment.', {
                    c: 'success claimed before evidence',
                });
            for (let i = 1; i < n; i++)
                add(
                    `Replicate to follower ${i}`,
                    'The follower persists the same current-term entry and acknowledges it.',
                    { [i === 1 ? 'b' : 'd']: 'e1 persisted' },
                    {},
                    'a',
                    i === 1 ? 'b' : 'd'
                );
            const committed = n >= 2;
            add(
                'Evaluate commit evidence',
                committed
                    ? 'A majority now stores the current-term entry; this leader can advance its commit index.'
                    : 'Only the leader stores the entry. A safe leader keeps it uncommitted and does not promise success.',
                {
                    a: committed ? 'e1 committed' : 'e1 uncommitted',
                    c: alt
                        ? committed
                            ? 'success after commit'
                            : 'pending / unavailable'
                        : 'early reply already sent',
                }
            );
            result = alt;
            metric('Durable replicas for entry', n);
            metric('Committed entries', committed ? 1 : 0);
            explanation =
                'This isolates Raft’s current-term majority commit boundary after a valid election. Log matching, previous-term entries, crash recovery and membership changes are outside this model.';
            break;
        }
        case 'partitionChoice': {
            add(
                'Partition divides replicas',
                `The majority side has v${n}; the isolated copy remains at v${n - 2}.`,
                { a: `v${n}`, b: `v${n - 2}` }
            );
            add(
                'Client reads isolated side',
                alt
                    ? 'The strict-majority read policy cannot obtain sufficient replies here.'
                    : 'The isolated replica answers immediately with its older version.',
                { d: alt ? 'unavailable' : `v${n - 2}` },
                {},
                'c',
                'b'
            );
            result = alt;
            metric('Isolated read version', alt ? 'no value returned' : n - 2);
            explanation =
                'During this partition, the policy chooses between answering this isolated read and preserving the declared stronger-read coordination. CAP is not a general pick-two menu; outside partitions, latency/consistency choices still need analysis (PACELC).';
            break;
        }
        case 'architecture': {
            const cap = alt ? 6 : 3,
                done = Math.min(n, cap);
            add(
                'Declare checkout requirements',
                `${n} requests arrive. Each operation must create one order and at most one external effect.`,
                { a: `${alt ? 2 : 1} workers` },
                { a: alt ? 2 : 1 }
            );
            add(
                'Admit and persist identity',
                alt
                    ? 'Save the order intent and a stable provider operation key.'
                    : 'Persist an order but retry the provider without a stable operation key.',
                { b: alt ? 'order + stable key' : 'order without provider key' },
                { b: done },
                'a',
                'b'
            );
            add(
                'Provider commits, reply delayed',
                'The external provider applies the effect; the reply is delayed past the caller deadline.',
                { d: 'effect committed' },
                {},
                'b',
                'd'
            );
            add(
                'Retry and reconcile',
                alt
                    ? 'The same provider key identifies the earlier effect. Remaining work stays durable.'
                    : 'A blind retry can apply another effect; a local order transaction cannot undo it.',
                { d: alt ? 'one effect per operation' : 'duplicate effect risk', a: `${n - done} pending` },
                { a: n - done }
            );
            result = alt;
            metric('Pending requests after service window', n - done);
            metric(
                'External effect guarantee in this model',
                alt ? 'stable-key dedup assumed' : 'not bounded'
            );
            explanation =
                'This worked design connects capacity, durable intent, external uncertainty and recovery. Stable provider deduplication is an explicit assumption; ledger invariants, security, reconciliation and measured performance remain review tasks.';
            break;
        }
    }
    return { beats, outcome: spec.predictions[result ? 1 : 0], explanation, metrics };
}
