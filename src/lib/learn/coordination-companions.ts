import type { ExperimentInput, MechanismDefinition, Trace } from './experiment-model';
import type { FilmBeat } from './film-model';

const definition = (
    label: string,
    modes: [string, string],
    predictions: [string, string],
    roles: [string, string, string],
    initial: number,
    max: number,
    kinds: MechanismDefinition['kinds']
): MechanismDefinition => ({ label, modes, predictions, roles, min: 1, initial, max, kinds });

export const COORDINATION_MODELS = {
    causalHistory: definition(
        'Write relationship: 1 dependent, 2 independent writers',
        ['Expose each arriving write', 'Check dependencies before exposure'],
        ['Dependency observation violated', 'History allowed by shown dependencies'],
        ['Origin writes', 'Remote replica', 'Reader observations'],
        1,
        2,
        ['store', 'store', 'computer']
    ),
    discoveryWatch: definition(
        'Routing tick (registration expires at tick 3)',
        ['Reuse disconnected cached registration', 'Resync an authoritative registry snapshot'],
        ['Routes expired registration', 'Uses only live registry state'],
        ['Versioned registry', 'Client discovery cache', 'Routing decision'],
        4,
        6,
        ['store', 'store', 'router']
    ),
    vectorConflict: definition(
        'Version case: 1 concurrent edits, 2 causal successor, 3 duplicate replay',
        ['Keep one wall-clock winner', 'Retain incomparable current versions'],
        ['Concurrent version discarded', 'No concurrent version discarded'],
        ['Replica A version', 'Replica B version', 'Reconciled versions'],
        1,
        3,
        ['store', 'store', 'store']
    ),
};
export type CoordinationMechanism = keyof typeof COORDINATION_MODELS;
export const isCoordinationMechanism = (kind: string): kind is CoordinationMechanism =>
    Object.hasOwn(COORDINATION_MODELS, kind);

export const COORDINATION_SOURCES = {
    causal: {
        url: 'https://www.cs.cmu.edu/~dga/papers/cops-sosp2011.pdf',
        section: '3 causal ordering; dependency checks before exposing remote writes',
        read: '2026-10-30',
    },
    vectors: {
        url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf',
        section: '4.4 Data Versioning; componentwise clock comparison and divergent versions',
        read: '2026-10-30',
    },
    watch: {
        url: 'https://etcd.io/docs/v3.6/learning/api_guarantees/',
        section: 'Watch APIs; Lease APIs; revisions, asynchronous delivery and bounded history',
        read: '2026-10-30',
    },
    lease: {
        url: 'https://etcd.io/docs/v3.6/learning/api/',
        section: 'Lease API; expired attached keys are deleted and produce delete events',
        read: '2026-10-30',
    },
};

export type VersionVector = readonly [number, number];
export type VectorRelation = 'equal' | 'before' | 'after' | 'concurrent';
/** Component counters represent known writes, never wall-clock time. Inputs are valid two-replica vectors. */
export function compareVersionVectors(a: VersionVector, b: VersionVector): VectorRelation {
    if (a[0] === b[0] && a[1] === b[1]) return 'equal';
    if (a.every((counter, i) => counter <= b[i])) return 'before';
    if (b.every((counter, i) => counter <= a[i])) return 'after';
    return 'concurrent';
}

/** Finite illustrative histories, not a complete causal store, discovery client, lease or vector-clock service. */
export function simulateCoordination(kind: CoordinationMechanism, input: ExperimentInput): Trace {
    const spec = COORDINATION_MODELS[kind];
    const n = Math.max(
        spec.min,
        Math.min(spec.max, Math.floor(Number.isFinite(input.amount) ? input.amount : spec.initial))
    );
    const alt = input.alternative === true;
    const beats: FilmBeat[] = [];
    const add = (beat: FilmBeat): void => {
        beats.push(beat);
    };
    if (kind === 'causalHistory') {
        const dependent = n === 1;
        const gated = dependent && alt;
        const violated = dependent && !gated;
        add({
            title: 'Declare the actual dependency',
            caption: dependent
                ? 'A client reads x=1, then writes y=1 using that result. The y write depends on x=1.'
                : 'Two independent writers produce x=1 and y=1 without observing each other. No dependency between them is declared.',
            values: { a: dependent ? 'x=1 → y=1' : 'x=1 ∥ y=1', b: 'x=0; y=0' },
            counts: { a: 2, b: 0, d: 0 },
        });
        add({
            title: 'The remote replica receives y first',
            caption: gated
                ? 'The replica buffers y while its x=1 prerequisite is absent. Arrival alone does not make y visible.'
                : 'The replica exposes y=1 before x=1 arrives. Whether this is allowed depends on the declared dependency.',
            from: 'a',
            to: 'b',
            packet: 'y=1 with dependency metadata',
            values: { b: gated ? 'x=0; y buffered' : 'x=0; y=1 visible' },
            counts: { b: gated ? 0 : 1 },
        });
        add({
            title: 'A reader tries y, then x',
            caption: gated
                ? 'The y read cannot observe the dependent value yet. The model waits for its prerequisite.'
                : dependent
                  ? 'The reader sees y=1, then x=0: it observed the effect without the prerequisite. This history violates the declared causal dependency.'
                  : 'The reader sees y=1, then x=0. With independent writers, the shown causal rules do not forbid this order.',
            values: { d: gated ? 'y read pending' : 'observed y=1, then x=0' },
            counts: { d: gated ? 0 : 1 },
        });
        add({
            title: 'The prerequisite arrives later',
            caption: gated
                ? 'After x=1 arrives, the replica can expose y=1. The reader now observes y=1 and then x=1.'
                : 'Later x=1 propagation does not rewrite the reader’s earlier observations.',
            from: 'a',
            to: 'b',
            packet: 'x=1',
            values: { b: 'x=1; y=1', ...(gated ? { d: 'observed y=1, then x=1' } : {}) },
            counts: { b: 2, d: 1 },
        });
        return {
            beats,
            outcome: spec.predictions[violated ? 0 : 1],
            metrics: [
                { label: 'Declared dependency edges', value: dependent ? '1' : '0' },
                { label: 'Dependent values exposed before prerequisite', value: violated ? '1' : '0' },
                { label: 'Reads waiting for missing dependency', value: gated ? '1' : '0' },
            ],
            explanation:
                'This COPS-style visibility example checks one explicit cross-key dependency. Causally independent writes have no ordering requirement from this dependency relation. It is not a full causal store, multi-key transaction algorithm or linearizability proof. A pending dependent read assumes its missing prerequisite will eventually arrive; real systems need failure and retention policies.',
        };
    }
    if (kind === 'discoveryWatch') {
        const expired = n >= 3;
        const registryRevision = expired ? 2 : 1;
        const selected = alt ? !expired : true;
        const staleSelection = selected && expired;
        add({
            title: 'Register and watch a leased endpoint',
            caption:
                'At tick 0, endpoint A is registered at revision 1. Its lease expires at tick 3 unless renewed.',
            values: { a: 'rev1: A, lease until tick3', b: 'rev1: A', d: 'not routed' },
            counts: { a: 1, b: 1, d: 0 },
        });
        add({
            title: 'The discovery watch disconnects',
            caption:
                'The client retains revision 1 but receives no further watch events in this run. Its cached view can become stale.',
            values: { b: 'rev1: A; watch disconnected' },
        });
        add({
            title: `Inspect registry at tick ${n}`,
            caption: expired
                ? 'The unrenewed lease has expired. The registry deletes A and records revision 2; the disconnected cache has not received that deletion.'
                : 'The chosen tick is before lease expiry. The authoritative registry still contains A at revision 1.',
            values: { a: expired ? 'rev2: no endpoint' : 'rev1: A live' },
            counts: { a: expired ? 0 : 1 },
        });
        if (alt)
            add({
                title: 'Resynchronize before choosing a destination',
                caption: `Assume a successful authoritative snapshot at tick ${n}. Replace the cache with revision ${registryRevision}; a reconnect alone is not this snapshot.`,
                from: 'a',
                to: 'b',
                packet: `Snapshot revision ${registryRevision}`,
                values: { b: expired ? 'rev2: no endpoint' : 'rev1: A live' },
                counts: { b: expired ? 0 : 1 },
            });
        add({
            title: 'Make the routing decision',
            caption: selected
                ? expired
                    ? 'The stale cache still selects A, whose registration has expired. This does not prove the process is physically dead.'
                    : 'A is still registered at this tick; either policy selects a live registration in this bounded run.'
                : 'The current registry has no endpoint. Report unavailable rather than treating an expired registration as current.',
            ...(selected ? { from: 'b', to: 'd', packet: 'Selected endpoint A' } : {}),
            values: { d: selected ? 'select A' : 'no live registration' },
            counts: { d: selected ? 1 : 0 },
        });
        return {
            beats,
            outcome: spec.predictions[staleSelection ? 0 : 1],
            metrics: [
                { label: 'Routing tick', value: String(n) },
                { label: 'Registry revision', value: String(registryRevision) },
                { label: 'Client cached revision', value: String(alt ? registryRevision : 1) },
                { label: 'Expired registrations selected', value: staleSelection ? '1' : '0' },
            ],
            explanation:
                'Watch delivery is asynchronous and disconnection does not keep a local cache fresh. This model assumes successful authoritative snapshot resynchronization, exact teaching-tick lease expiry and no lease renewal. Real etcd TTL selection/expiry timing differs; watches resume only within retained history and may need a fresh snapshot after compaction. Expired registration is not proof of process death or a substitute for fencing stale actors.',
        };
    }
    const a: VersionVector = [1, 0];
    const b: VersionVector = n === 1 ? [0, 1] : n === 2 ? [1, 1] : [1, 0];
    const relation = compareVersionVectors(a, b);
    const concurrent = relation === 'concurrent';
    const retained = concurrent && alt ? 2 : 1;
    const discarded = concurrent && !alt;
    add({
        title: 'Two versions reach reconciliation',
        caption:
            n === 1
                ? 'A and B edit the same object without seeing each other. Each advances its own replica component.'
                : n === 2
                  ? 'B reads A’s version before editing, so B’s vector includes A’s known write.'
                  : 'The same version arrives twice. Both its content and vector are identical in this replay case.',
        values: { a: `vector [${a}]; title A`, b: `vector [${b}]; ${n === 3 ? 'title A' : 'title B'}` },
        counts: { a: 1, b: 1, d: 0 },
    });
    add({
        title: 'Compare known writes component by component',
        caption: concurrent
            ? 'A is ahead in one component and B in another. Neither vector dominates; the versions are causally incomparable.'
            : relation === 'before'
              ? 'Every A component is no larger than B’s, and one is smaller. A is an ancestor of B.'
              : 'The vectors are equal. This declared replay contributes no distinct version.',
        values: { d: relation === 'before' ? 'A precedes B' : relation },
    });
    add({
        title: 'Apply the declared conflict policy',
        caption: concurrent
            ? alt
                ? 'Keep both current siblings. Version metadata detects the conflict but does not merge their application meanings.'
                : 'Assume B has the greater wall-clock stamp. Choosing it alone discards A’s concurrent value, not a known ancestor.'
            : n === 2
              ? 'B includes A’s history. Both policies retain the causal successor, not a spurious conflict.'
              : 'Both policies deduplicate the identical replay.',
        from: 'b',
        to: 'd',
        packet: alt && concurrent ? 'Two siblings retained' : 'One current version',
        values: { d: retained === 2 ? 'title A + title B; unresolved' : n === 3 ? 'title A' : 'title B' },
        counts: { d: retained },
    });
    return {
        beats,
        outcome: spec.predictions[discarded ? 0 : 1],
        metrics: [
            { label: 'Incomparable version pairs', value: concurrent ? '1' : '0' },
            { label: 'Current versions retained', value: String(retained) },
            { label: 'Concurrent versions discarded', value: discarded ? '1' : '0' },
        ],
        explanation:
            'Version-vector components count known writes by replica, not milliseconds. Dominance can identify ancestry; incomparable vectors expose concurrent edits. Keeping both siblings leaves application reconciliation unresolved. The single-wall-clock-winner policy is an authored contrast, not a claim that Dynamo uses this policy. These fixed two-replica examples omit vector truncation, membership changes, storage failure and actual merge semantics.',
    };
}
