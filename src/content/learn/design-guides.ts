import type { FilmBeat, LessonFilmData } from '@/lib/learn/film-model';

export type DesignGuide = {
    requirement: string;
    workload: { daily: number; bytes: number; peak: number };
    roles: [string, string, string];
    write: string;
    read: string;
    failure: string;
    tradeoff: string;
    challenge: string;
};
/** Invented product exercises, not claims about a company's production architecture. */
export const DESIGN_GUIDES: Record<string, DesignGuide> = {
    'case-url-shortener': {
        requirement:
            'Create a stable short key and redirect to its stored destination. A successful creation must survive a service restart.',
        workload: { daily: 864000, bytes: 500, peak: 10 },
        roles: ['Redirect API', 'Key → target store', 'Lookup cache'],
        write: 'Validate the destination, allocate a collision-checked key and persist its mapping before reporting creation.',
        read: 'Resolve key through cache, then authoritative mapping store on miss; return the configured redirect response.',
        failure:
            'Lose the cache: mappings remain durable. A hot link can overload the fallback store, so bound misses and share safe lookups.',
        tradeoff:
            'Caching lowers repeated lookup work but expiration and abusive destination policy still need ownership.',
        challenge:
            'Change a previously public destination to blocked. How do existing cached redirects stop being served?',
    },
    'case-rate-limiter': {
        requirement:
            'Two API servers must enforce one global burst allowance of three requests for an account.',
        workload: { daily: 8640000, bytes: 100, peak: 5 },
        roles: ['Admission API', 'Shared quota state', 'Protected service'],
        write: 'Identify the quota key and atomically spend from one allowance before forwarding admitted work.',
        read: 'Return admission or rejection plus contract-appropriate retry information; rejected requests do not consume protected work.',
        failure:
            'Partition one server from quota state. Strict enforcement can reject useful traffic; local allowances need a bounded overshoot policy.',
        tradeoff:
            'Central coordination improves exactness but adds a dependency and network cost to admission.',
        challenge:
            'Keep serving during quota-store failure while bounding overshoot. State the exact allowance each server may spend.',
    },
    'case-news-feed': {
        requirement:
            'Publish posts and show a reader a ranked feed of permitted followed accounts. Deletion and privacy changes must have a policy.',
        workload: { daily: 8640000, bytes: 1000, peak: 8 },
        roles: ['Publish + feed API', 'Durable posts', 'Per-reader feed index'],
        write: 'Save one post, then optionally materialize its id into follower feed indexes through durable asynchronous work.',
        read: 'Retrieve candidate post ids, fetch permitted current content and rank a bounded page. A feed index is not the content authority.',
        failure:
            'A large author creates enormous publish fan-out; queues grow. Route that author through read-time candidate assembly or a stated hybrid.',
        tradeoff:
            'Write-time fan-out spends storage and publishing work to simplify reads; read-time assembly reverses that work placement.',
        challenge:
            'An author has ten million followers. Which writes must finish before acknowledging publication?',
    },
    'case-chat': {
        requirement:
            'Accept messages durably, retain them for an offline recipient and distinguish acceptance, device delivery and read receipts.',
        workload: { daily: 8640000, bytes: 1000, peak: 5 },
        roles: ['Chat gateway', 'Conversation log', 'Recipient device'],
        write: 'Assign conversation-scoped identity and sequence, persist accepted content, then attempt delivery.',
        read: 'Reconnect from acknowledged progress and replay permitted messages. Deduplicate messages when acknowledgements were lost.',
        failure:
            'A socket disconnects after server persistence but before sender reply. Reuse message identity to reconcile acceptance.',
        tradeoff:
            'Conversation-scoped order simplifies discussion history; a global total order costs more coordination and is usually unnecessary for this exercise.',
        challenge:
            'The same user has two devices, one offline. Define exactly which event changes a message from delivered to read.',
    },
    'case-notifications': {
        requirement:
            'Deliver a saved notification intent through a chosen channel, with bounded retries and visible delivery status.',
        workload: { daily: 864000, bytes: 2000, peak: 10 },
        roles: ['Notification API', 'Delivery work log', 'Channel provider'],
        write: 'Save recipient, channel, policy and operation identity before making retryable provider attempts.',
        read: 'Expose pending, provider-accepted or failed status. Provider acceptance does not prove human attention.',
        failure:
            'Provider applies the send but its reply is delayed. Reconcile under that provider’s deduplication contract instead of blindly repeating.',
        tradeoff:
            'Retrying improves eventual delivery but can duplicate messages when provider idempotency is unavailable; cap attempts and surface uncertainty.',
        challenge: 'The provider has no idempotency API. Which delivery guarantee can you honestly offer?',
    },
    'case-web-crawler': {
        requirement:
            'Fetch eligible public URLs while respecting a declared per-host schedule and robots policy, without revisiting duplicates indefinitely.',
        workload: { daily: 864000, bytes: 50000, peak: 3 },
        roles: ['Scheduler + fetcher', 'Durable URL frontier', 'Remote host'],
        write: 'Canonicalize discovered URLs, deduplicate and save eligible work with host identity and next-fetch time.',
        read: 'Scheduler selects a host with an available slot, fetches one URL and saves parsed links and result metadata.',
        failure:
            'An endless calendar creates infinitely many unique URLs. Bound exploration, retry counts, response sizes and host concurrency.',
        tradeoff:
            'Aggressive parallelism improves crawl throughput but can overwhelm a host; fairness and freshness goals need explicit priorities.',
        challenge:
            'One host returns 429 for every request. Show how its frontier stops consuming all worker capacity.',
    },
    'case-search-autocomplete': {
        requirement:
            'Return a bounded list of useful, permitted suggestions for an incomplete query, with explicit update and ranking rules.',
        workload: { daily: 86400000, bytes: 200, peak: 5 },
        roles: ['Suggestion API', 'Prefix index', 'Ranking + policy'],
        write: 'Normalize approved source phrases, build prefix candidates and publish an index version under a stated freshness budget.',
        read: 'Retrieve a bounded candidate set by prefix, apply policy and ranking, then return suggestions.',
        failure:
            'A one-character prefix matches too many entries. Bound retrieval and rank before sending a large result; avoid exposing private queries.',
        tradeoff: 'Precomputing prefixes speeds reads at the cost of storage, update work and staleness.',
        challenge:
            'A newly prohibited phrase exists in an older index version. Where is the final enforcement boundary?',
    },
    'case-file-storage': {
        requirement:
            'Synchronize durable files across devices and preserve enough version history to expose concurrent offline edits.',
        workload: { daily: 86400, bytes: 1000000, peak: 4 },
        roles: ['Sync API', 'Version metadata', 'Object bytes'],
        write: 'Upload a complete immutable object, then publish a metadata version with its parent version and access rules.',
        read: 'Compare known versions, fetch authorized missing objects and acknowledge synchronization progress.',
        failure:
            'Two devices edit the same base offline. Preserve divergent versions or invoke a declared merge policy; arrival time is not causal knowledge.',
        tradeoff:
            'Keeping versions avoids silent overwrite but costs storage and requires conflict resolution and cleanup policy.',
        challenge:
            'Metadata publication fails after object completion. How is the unreferenced object reclaimed safely?',
    },
    'case-video-streaming': {
        requirement:
            'Play prepared media through independently fetchable segments and select variants compatible with available bandwidth.',
        workload: { daily: 8640000, bytes: 1000000, peak: 10 },
        roles: ['Playback API', 'Prepared media origin', 'Edge segment cache'],
        write: 'Upload source, encode declared variants, package manifests and segments, then publish the playable version.',
        read: 'Authorize playback, fetch a manifest and retrieve selected segments through edge caches; the player buffers and may switch variants.',
        failure:
            'A segment misses at many edges. Protect origin capacity and measure startup and rebuffering; a CDN cannot generate a missing encoding.',
        tradeoff: 'More variants improve adaptation options but increase encoding and storage cost.',
        challenge:
            'A viewer’s bandwidth halves mid-playback. Which component changes variant, and what bytes were already buffered?',
    },
    'case-proximity': {
        requirement:
            'Find permitted places within a stated radius and coordinate system, with exact distance verification after candidate retrieval.',
        workload: { daily: 8640000, bytes: 500, peak: 5 },
        roles: ['Nearby API', 'Spatial index + records', 'Exact distance filter'],
        write: 'Validate coordinates and coordinate system; update the authoritative place and its spatial access path.',
        read: 'Use a bounding-region access path, then check the actual distance and policy before ranking returned places.',
        failure:
            'Bounding-box corners lie outside the circle. Skipping exact distance checks returns false matches.',
        tradeoff:
            'Candidate filtering saves expensive checks, but dense regions can still create large candidate sets.',
        challenge:
            'Replace the flat teaching coordinates with latitude/longitude. Which units and distance function must change?',
    },
    'case-payments': {
        requirement:
            'A checkout retry must identify one intended payment and preserve a reconcilable ledger when provider outcomes are uncertain.',
        workload: { daily: 864000, bytes: 2000, peak: 10 },
        roles: ['Checkout API', 'Ledger + durable intent', 'Payment provider'],
        write: 'Validate the operation, atomically save local intent and ledger constraints, then call the provider under its stable operation identity.',
        read: 'Return known status or pending uncertainty; reconcile by operation identity and durable provider evidence.',
        failure:
            'Provider commits but reply is lost. A local transaction cannot roll back that provider effect; reconcile before another charge attempt.',
        tradeoff:
            'Synchronous confirmation improves immediate feedback but couples latency and availability to the provider; pending states need product support.',
        challenge:
            'A webhook repeats after reconciliation. Which uniqueness invariant prevents a second ledger transition?',
    },
    capstone: {
        requirement:
            'Design a paid learning platform: browse a course, enroll once per confirmed purchase and resume progress across devices.',
        workload: { daily: 864000, bytes: 2000, peak: 10 },
        roles: ['Learning + checkout API', 'Enrollment + operation log', 'Payment provider'],
        write: 'Persist purchase intent with stable identity, reconcile provider confirmation, enforce one enrollment per confirmed purchase and record progress separately.',
        read: 'Authorize the learner, read durable enrollment and progress, then serve versioned lesson content through a suitable cache.',
        failure:
            'Payment succeeds during a reply timeout while a worker restarts. Recovery must grant the paid enrollment once, or expose an explicit pending state.',
        tradeoff:
            'Choose where correctness needs coordination and where cached or delayed data is acceptable. Defend the cost, freshness and recovery consequences.',
        challenge:
            'Peak traffic doubles during a regional outage. Revise the capacity estimate, recovery point, admission policy and learner-visible promises.',
    },
};
const DESIGN_FAULTS: Record<string, FilmBeat> = {
    'case-url-shortener': {
        title: 'Cache disappears',
        caption: DESIGN_GUIDES['case-url-shortener'].failure,
        states: { d: 'failed' },
        values: { d: 'unavailable', b: 'durable mappings retained' },
    },
    'case-rate-limiter': {
        title: 'Quota store unreachable',
        caption: DESIGN_GUIDES['case-rate-limiter'].failure,
        states: { b: 'failed' },
        values: { b: 'unreachable', a: 'strict policy rejects admission' },
    },
    'case-news-feed': {
        title: 'Large-audience post',
        caption: DESIGN_GUIDES['case-news-feed'].failure,
        states: { d: 'active' },
        values: { d: 'pending fan-out grows', b: 'post already durable' },
    },
    'case-chat': {
        title: 'Acceptance reply lost',
        caption: DESIGN_GUIDES['case-chat'].failure,
        from: 'a',
        to: 'c',
        packet: 'Acceptance reply',
        lost: true,
        values: { b: 'message durable', c: 'outcome unknown' },
    },
    'case-notifications': {
        title: 'Provider reply delayed',
        caption: DESIGN_GUIDES['case-notifications'].failure,
        values: { d: 'send applied, reply pending', b: 'reconciliation required' },
    },
    'case-web-crawler': {
        title: 'Crawl frontier trap',
        caption: DESIGN_GUIDES['case-web-crawler'].failure,
        states: { b: 'active' },
        values: { b: 'new URLs keep arriving', a: 'enforce exploration bound' },
    },
    'case-search-autocomplete': {
        title: 'Broad prefix',
        caption: DESIGN_GUIDES['case-search-autocomplete'].failure,
        values: { b: 'too many candidates', d: 'bounded policy + ranking required' },
    },
    'case-file-storage': {
        title: 'Offline divergence',
        caption: DESIGN_GUIDES['case-file-storage'].failure,
        values: { b: 'same parent, two versions', d: 'preserve both objects' },
    },
    'case-video-streaming': {
        title: 'Concurrent edge misses',
        caption: DESIGN_GUIDES['case-video-streaming'].failure,
        states: { b: 'active' },
        values: { d: 'segment absent', b: 'origin work grows' },
    },
    'case-proximity': {
        title: 'Box corner is outside circle',
        caption: DESIGN_GUIDES['case-proximity'].failure,
        values: { b: 'box candidate', d: 'exact predicate rejects corner' },
    },
    'case-payments': {
        title: 'Provider reply lost',
        caption: DESIGN_GUIDES['case-payments'].failure,
        from: 'd',
        to: 'a',
        packet: 'Provider confirmation',
        lost: true,
        values: { d: 'effect committed', a: 'pending reconciliation' },
    },
    capstone: {
        title: 'Worker restarts during timeout',
        caption: DESIGN_GUIDES.capstone.failure,
        states: { a: 'failed' },
        values: { d: 'payment committed', b: 'durable intent survives', a: 'restart → reconcile' },
    },
};
export function designFilm(id: string, guide: DesignGuide): LessonFilmData {
    const nodes: LessonFilmData['nodes'] = [
        { id: 'c', label: 'User', kind: 'computer', x: -265, y: 30 },
        { id: 'a', label: guide.roles[0], kind: 'server', x: -60, y: -130 },
        { id: 'b', label: guide.roles[1], kind: 'store', x: 175, y: 45 },
        { id: 'd', label: guide.roles[2], kind: id === 'case-chat' ? 'computer' : 'server', x: 280, y: -130 },
    ];
    return {
        id: `${id}-design`,
        question: 'Follow the complete design',
        takeaway: guide.tradeoff,
        nodes,
        links: [
            ['c', 'a'],
            ['a', 'b'],
            ['a', 'd'],
            ['d', 'a'],
        ],
        sourceHref: `/learn/sources#${id}`,
        beats: [
            {
                title: 'Start with the promise',
                caption: guide.requirement,
                values: { a: 'requirement before technology' },
            },
            {
                title: 'Write path',
                caption: guide.write,
                from: 'a',
                to: 'b',
                packet: 'Persist authority',
                values: { b: 'durable authority' },
            },
            {
                title: 'Read path',
                caption: guide.read,
                from: 'b',
                to: 'a',
                packet: 'Read under policy',
                values: { a: 'authorized response' },
            },
            DESIGN_FAULTS[id],
            {
                title: 'Defend the tradeoff',
                caption: guide.tradeoff,
                values: { a: 'explicit policy', c: 'stated guarantee' },
            },
        ],
    };
}
