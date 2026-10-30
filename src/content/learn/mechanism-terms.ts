import type { Mechanism } from '@/lib/learn/experiment-model';

/** Short definitions beside the first use, not a prerequisite textbook. */
export const MECHANISM_TERMS: Record<Mechanism, [string, string]> = {
    tokenPurpose: [
        'Token purpose',
        'An OAuth access token grants scoped API access; an OIDC ID token reports authentication to its intended client. Recipients and validation rules differ.',
    ],
    xssContext: [
        'Safe rendering context',
        'Untrusted markup can be interpreted by an HTML sink. A plain-text sink in an ordinary element keeps that same input as text.',
    ],
    csrf: [
        'CSRF defense',
        'A session cookie alone does not prove a protected action was intended. A synchronizer token is checked against session state before a write.',
    ],
    partitionedLog: [
        'Partitioned log',
        'A retained topic orders records within each partition; classic consumer groups divide ownership and save independent next offsets.',
    ],
    loadBalance: [
        'Load balancing',
        'A routing policy chooses among application replicas using turns or observed connection load; capacity and health still constrain success.',
    ],
    sqlJoin: [
        'Join',
        'Pairing rows from tables according to a predicate such as matching customer identifiers.',
    ],
    sqlSets: [
        'UNION',
        'Combining compatible query rows with duplicate elimination, unless ALL is specified.',
    ],
    storageLayout: [
        'LSM',
        'Log-structured merge: buffer updates, flush sorted immutable runs, then merge runs through compaction.',
    ],
    httpValidation: [
        'Validator',
        'Response metadata such as an ETag that lets an origin check whether a stored representation still matches.',
    ],
    twoPhase: [
        'Prepared',
        'A participant has durably promised to await the coordinator decision before resolving its transaction.',
    ],
    uuidLayout: [
        'UUID version',
        'A generation/layout scheme identified by fixed version bits within a 128-bit identifier.',
    ],
    cacheWrite: [
        'Write-through',
        'A write path that updates the cache and backing store before acknowledging success.',
    ],
    consistencyHistory: [
        'Linearizability',
        'Operations behave as if they occurred in one order that respects completed operations before later invocations.',
    ],
    dedup: [
        'Idempotency',
        'Repeating an operation with the same identity has the same intended effect as applying it once.',
    ],
    pagination: [
        'Cursor',
        'A continuation marker based on an ordering key, rather than a count of earlier positions.',
    ],
    version: [
        'Wire compatibility',
        'Whether another version of a reader can still interpret the serialized fields.',
    ],
    bucket: [
        'Token bucket',
        'A bounded allowance that refills over time; each admitted request spends one token.',
    ],
    index: ['Index', 'An additional searchable structure that points to relevant data records.'],
    transaction: ['Atomicity', 'A group of changes commits together or none of its changes commit.'],
    isolation: [
        'Lost update',
        'Two readers start from one value, then one write overwrites the other’s intended change.',
    ],
    log: [
        'Write-ahead log',
        'A durable sequence of changes written before the affected data pages are considered durable.',
    ],
    bloom: [
        'False positive',
        'A filter says a key might exist even though an authoritative lookup finds it absent.',
    ],
    queue: [
        'Backlog',
        'Work that arrived but has not yet completed. More buffering does not create service capacity.',
    ],
    cache: [
        'Policy-fresh',
        'A stored response is reusable under its freshness policy; that does not prove the origin has not changed.',
    ],
    eviction: ['LRU', 'Least recently used: remove the item whose last access is oldest.'],
    fanout: ['Subscriber', 'An independent destination that needs its own copy of a published event.'],
    replication: [
        'Replication lag',
        'The gap between a committed change at one copy and its application at another copy.',
    ],
    quorum: [
        'Strict majority',
        'More than half of one fixed voting configuration; any two such majorities overlap.',
    ],
    merge: ['Idempotent merge', 'Applying the same remote state again does not count its changes twice.'],
    partition: ['Shard', 'One part of a dataset or workload assigned to a particular owner.'],
    hashring: [
        'Consistent hashing',
        'Assign keys to owners on an ordered token space so membership changes can move only part of the key set.',
    ],
    clock: [
        'Lamport timestamp',
        'A logical counter advanced on local and receive events to respect causal order in one direction.',
    ],
    lease: [
        'Fencing token',
        'An increasing ownership number checked by the protected resource to reject an older holder.',
    ],
    budget: ['Error budget', 'The allowed bad portion of a stated service objective and measurement window.'],
    gate: [
        'Authorization',
        'Checking whether this identity may perform this action on this particular resource.',
    ],
    copies: [
        'Authoritative fact',
        'The value a system treats as the source of truth when other copies disagree.',
    ],
    window: [
        'Watermark',
        'A source’s estimate of event-time progress, used to decide when windows may be complete.',
    ],
    unique: ['Namespace', 'A distinct owner prefix that separates otherwise identical local identifiers.'],
    retention: [
        'Retention policy',
        'The declared purposes, durations and deletion rules for data and its retained copies.',
    ],
    cost: [
        'Total cost',
        'The combined cost of resources, data movement and operation for a specified workload.',
    ],
    signals: [
        'User-facing signal',
        'A measurement of the outcome users experience, such as request success or latency.',
    ],
    trace: [
        'Critical path',
        'The chain of dependent work that determines completion time; parallel durations cannot simply be added.',
    ],
    decision: ['Decision record', 'A short record of context, alternatives, a choice and its consequences.'],
    breaker: [
        'Open circuit',
        'A caller temporarily stops sending ordinary calls after a failure policy trips.',
    ],
    health: [
        'Readiness',
        'Whether an instance should currently receive application traffic, separate from whether its process is alive.',
    ],
    identity: [
        'Authentication',
        'Validating a claimed identity through a defined credential and verification flow.',
    ],
    rotation: [
        'Credential rotation',
        'Introducing a replacement credential and retiring earlier access under an explicit policy.',
    ],
    spatial: [
        'Spatial prefilter',
        'A cheap geometric candidate test followed by the exact relationship the query requires.',
    ],
    columns: [
        'Column layout',
        'Values from the same field are stored together so a scan can skip unrelated fields.',
    ],
    embedding: [
        'Embedding',
        'Putting bounded related data inside its owning record so it can be retrieved together.',
    ],
    foreignKey: [
        'Foreign key',
        'A database constraint requiring a reference to match a key in the referenced table.',
    ],
    planner: [
        'Selectivity',
        'The fraction of rows expected to satisfy a query condition; it affects useful access paths.',
    ],
    mvcc: [
        'MVCC',
        'Multi-version concurrency control: retain versions and apply visibility rules so readers can avoid unfinished writes.',
    ],
    upload: [
        'Publication boundary',
        'The point at which readers can discover an object; partial upload bytes are not a completed file.',
    ],
    storageChoice: [
        'Invariant',
        'A property that must remain true across every allowed operation and failure.',
    ],
    session: [
        'Stateless worker',
        'A worker that does not require its private memory to serve a later request correctly.',
    ],
    proxy: [
        'Reverse proxy',
        'A server-facing ingress that receives public requests and forwards configured traffic to backend services.',
    ],
    replacement: [
        'Reconciliation',
        'A controller repeatedly compares observed state with desired state and acts on the difference.',
    ],
    scaleLag: [
        'Scaling delay',
        'The time needed to observe demand and make additional capacity ready to serve.',
    ],
    coalesce: [
        'Request coalescing',
        'Share one in-flight lookup among callers requesting the same safely reusable result.',
    ],
    redelivery: [
        'Acknowledgement',
        'A consumer’s signal that the broker can finish its delivery obligation under the chosen contract.',
    ],
    flow: [
        'Backpressure',
        'Communicating downstream capacity so upstream producers slow, wait or reject work.',
    ],
    offsets: [
        'Consumer offset',
        'A reader’s recorded position in a retained log; different readers can progress independently.',
    ],
    mapReduce: [
        'Reduce',
        'Combine partial results under a defined aggregation rule after processing separate input partitions.',
    ],
    outbox: [
        'Transactional outbox',
        'Save business changes and publication intent in one local transaction, then relay the intent.',
    ],
    uncertain: [
        'Uncertain outcome',
        'The caller lacks enough evidence to know whether the remote effect happened.',
    ],
    readQuorum: [
        'Read/write intersection',
        'Read and completed-write reply sets share a replica under the specified quorum assumptions.',
    ],
    saga: [
        'Compensation',
        'A later action that semantically repairs an earlier committed step when a workflow fails.',
    ],
    election: [
        'Election term',
        'A numbered election round in which voters follow a defined vote and log-freshness policy.',
    ],
    gossip: [
        'Gossip',
        'Peers exchange information with other peers, spreading knowledge without one broadcast coordinator.',
    ],
    bulkhead: [
        'Resource isolation',
        'Reserve separate finite capacity so one failing dependency cannot occupy every slot.',
    ],
    retry: [
        'Retry amplification',
        'Additional attempts multiply the downstream work caused by the original callers.',
    ],
    canary: [
        'Canary release',
        'Expose a limited cohort to a new version, observe it and decide whether to expand or roll back.',
    ],
    migration: [
        'Expand/contract',
        'Add compatible schema support first, transition readers and writers, then remove the obsolete form.',
    ],
    recovery: [
        'Recovery point',
        'The most recent state recoverable from surviving durable data after a failure.',
    ],
    injection: [
        'Fault hypothesis',
        'A specific predicted behavior under a bounded injected failure, checked against observations.',
    ],
    sql: [
        'Bound parameter',
        'An input value passed separately from SQL syntax so its text cannot introduce a new query clause.',
    ],
    boundaries: [
        'Deployment boundary',
        'A separation across which calls may become network requests and releases can change independently.',
    ],
    communication: [
        'Accepted vs completed',
        'Durably accepting work promises later processing under a contract; it does not say the work has finished.',
    ],
    sharedQuota: [
        'Global quota',
        'One allowance across all participating servers, rather than a full independent allowance per server.',
    ],
    feed: ['Materialized feed', 'A stored per-reader list prepared before that reader opens the feed.'],
    chat: [
        'Read receipt',
        'A protocol event distinct from server acceptance and device delivery; its precise meaning must be defined.',
    ],
    crawler: ['Frontier', 'The deduplicated, scheduled set of URLs still eligible for a crawler to fetch.'],
    prefix: ['Prefix posting list', 'A mapping from a query beginning to candidate suggestion identifiers.'],
    inverted: ['Posting list', 'The document identifiers or locations associated with a searchable term.'],
    fileVersions: [
        'Divergent versions',
        'Two edits derived from the same base without either edit observing the other.',
    ],
    segments: [
        'Media segment',
        'One independently fetchable part of a prepared stream, usually selected through a manifest.',
    ],
    consensusLog: [
        'Commit index',
        'The log position a protocol can safely apply under its commitment rules; a local append alone is not commitment.',
    ],
    partitionChoice: [
        'Network partition',
        'Communication is unavailable between groups that may still serve clients locally.',
    ],
    architecture: [
        'Durable intent',
        'A saved record of what must be attempted or reconciled even if a process crashes.',
    ],
};
