import type { ExperimentInput, MechanismDefinition, Trace } from './experiment-model';
import type { FilmBeat } from './film-model';

const define = (
    label: string,
    modes: [string, string],
    predictions: [string, string],
    roles: [string, string, string],
    initial: number,
    min: number,
    max: number,
    kinds: MechanismDefinition['kinds']
): MechanismDefinition => ({ label, modes, predictions, roles, initial, min, max, kinds });

export const DB_MODELS = {
    normalization: define(
        'Orders referencing the same current customer address',
        [
            'Duplicate current address in orders; update one copy',
            'Store one customer address; join orders to it',
        ],
        ['Some order reads return the old address', 'All order reads return the current address'],
        ['Customer profile', 'Orders', 'Read results'],
        3,
        1,
        5,
        ['store', 'store', 'queue']
    ),
    compositeIndex: define(
        'Query: 1 tenant+time range, 2 time only, 3 tenant only, 4 both equal',
        ['Index (time, tenant)', 'Index (tenant, time)'],
        ['A narrower contiguous index range', 'Full index scan in this model'],
        ['Table rows', 'Composite index', 'Query result'],
        2,
        1,
        4,
        ['store', 'store', 'queue']
    ),
    writeSkew: define(
        'Doctors initially on call (only A and B may leave)',
        [
            'Both use the same snapshot and commit disjoint row writes',
            'Serializable: abort B, then retry its whole decision',
        ],
        ['Nobody remains on call', 'On-call minimum preserved'],
        ['Transaction A', 'Transaction B', 'On-call roster'],
        2,
        2,
        4,
        ['server', 'server', 'store']
    ),
};
export type DbMechanism = keyof typeof DB_MODELS;
export const isDbMechanism = (kind: string): kind is DbMechanism => Object.hasOwn(DB_MODELS, kind);
export const DB_SOURCES = {
    join: {
        url: 'https://www.postgresql.org/docs/18/tutorial-join.html',
        section: '2.6 Joins Between Tables',
        read: '2026-10-30',
    },
    constraints: {
        url: 'https://www.postgresql.org/docs/18/ddl-constraints.html',
        section: '5.5.4 Primary Keys; 5.5.5 Foreign Keys',
        read: '2026-10-30',
    },
    composite: {
        url: 'https://www.postgresql.org/docs/18/indexes-multicolumn.html',
        section: '11.3 leading equalities/ranges; nonleading constraints; skip scan',
        read: '2026-10-30',
    },
    maintenance: {
        url: 'https://www.postgresql.org/docs/18/indexes-intro.html',
        section: '11.1 automatic index maintenance on table changes',
        read: '2026-10-30',
    },
    isolation: {
        url: 'https://www.postgresql.org/docs/18/transaction-iso.html',
        section: '13.2.2 Repeatable Read; 13.2.3 Serializable and transaction retry',
        read: '2026-10-30',
    },
};

/** Bounded worked examples; no real SQL engine, query planner or measured storage/latency costs. */
export function simulateDb(kind: DbMechanism, input: ExperimentInput): Trace {
    const spec = DB_MODELS[kind];
    const n = Math.max(
        spec.min,
        Math.min(spec.max, Math.floor(Number.isFinite(input.amount) ? input.amount : spec.initial))
    );
    const alt = input.alternative === true;
    const beats: FilmBeat[] = [];
    const metrics: Trace['metrics'] = [];
    const metric = (label: string, value: number | string): void => {
        metrics.push({ label, value: String(value) });
    };
    const add = (beat: FilmBeat): void => {
        beats.push(beat);
    };
    let result = false;
    let explanation = '';
    if (kind === 'normalization') {
        const customer = { id: 7, address: 'Old Street' };
        const orders = Array.from({ length: n }, (_, index) => ({
            id: index + 1,
            customerId: 7,
            ...(alt ? {} : { address: 'Old Street' }),
        }));
        add({
            title: 'One customer, several orders',
            caption:
                'Model the current contact address, not a historical shipping address that should remain unchanged.',
            values: {
                a: 'customer 7: Old Street',
                b: alt ? `${n} orders → customer 7` : `${n} orders each store Old Street`,
            },
            counts: { a: 1, b: n, d: 0 },
        });
        customer.address = 'New Street';
        add({
            title: 'Customer moves',
            caption:
                'Update the current contact address on customer 7. Separately stored duplicate values do not change automatically.',
            from: 'c',
            to: 'a',
            packet: 'address = New Street',
            values: { a: 'customer 7: New Street' },
        });
        if (!alt) {
            orders[0].address = customer.address;
            add({
                title: 'Update only the first duplicate',
                caption: `Order 1 gets the new contact address. ${n - 1} other order rows still carry the old copy.`,
                from: 'c',
                to: 'b',
                packet: 'update order 1 copy',
                values: { b: `1 New Street; ${n - 1} Old Street` },
            });
        } else {
            add({
                title: 'Keep the reference, not another address',
                caption:
                    'Orders retain customer_id=7. A foreign key protects the reference; the join retrieves the current profile value.',
                from: 'b',
                to: 'a',
                packet: 'JOIN customer_id = id',
                values: { b: `${n} customer_id references; no address copies` },
            });
        }
        const addresses = orders.map((order) => (alt ? customer.address : order.address!));
        const stale = addresses.filter((address) => address !== customer.address).length;
        add({
            title: 'Read each order’s current contact address',
            caption: `${n - stale} reads return New Street; ${stale} return Old Street. Derive the result from the stored facts.`,
            from: alt ? 'a' : 'b',
            to: 'd',
            packet: 'current contact results',
            values: { d: addresses.join(' | ') },
            counts: { d: addresses.length },
        });
        result = stale === 0;
        metric('Stale order reads', stale);
        metric('Stored address copies', alt ? 1 : n + 1);
        metric('Rows updated in this run', alt ? 1 : 2);
        metric('Result rows', addresses.length);
        explanation =
            'Normalize this current fact into one customer row and reconstruct reads by key. Keeping immutable historical shipping facts would be a different requirement. This example demonstrates an update anomaly, not all normal forms or a universal ban on denormalization.';
    } else if (kind === 'compositeIndex') {
        const rows = [1, 2].flatMap((tenant) =>
            [1, 2, 3, 4].map((time) => ({ tenant, time, id: `T${tenant}@${time}` }))
        );
        const leading = alt ? 'tenant' : 'time';
        const query =
            n === 1
                ? 'tenant=1 AND time>=3'
                : n === 2
                  ? 'time>=3'
                  : n === 3
                    ? 'tenant=1'
                    : 'tenant=1 AND time=2';
        const matches = rows.filter((row) =>
            n === 1
                ? row.tenant === 1 && row.time >= 3
                : n === 2
                  ? row.time >= 3
                  : n === 3
                    ? row.tenant === 1
                    : row.tenant === 1 && row.time === 2
        );
        const scanned = rows.filter((row) => {
            if (n === 4) return row.tenant === 1 && row.time === 2;
            if (leading === 'tenant') return n === 2 || (row.tenant === 1 && (n !== 1 || row.time >= 3));
            return n === 3 || row.time >= 3;
        });
        add({
            title: 'Sort the composite keys',
            caption:
                'Eight rows cover tenants 1/2 and times 1–4. Index column order defines lexicographic key order.',
            values: { a: '2 tenants × 4 times', b: alt ? '(tenant, time)' : '(time, tenant)' },
            counts: { a: rows.length, b: rows.length, d: 0 },
        });
        add({
            title: 'Declare the query',
            caption: `WHERE ${query}. This example uses one ordinary contiguous B-tree range; skip scan and other plans are omitted.`,
            from: 'c',
            to: 'b',
            packet: query,
        });
        add({
            title:
                scanned.length === rows.length
                    ? 'No leading constraint to narrow this range'
                    : 'Locate the contiguous range',
            caption: `${scanned.length} of 8 index entries are inspected. Later-key filters can reject entries without making that range smaller.`,
            values: { b: `${scanned.length}/8 entries inspected` },
        });
        add({
            title: 'Fetch the qualifying table rows',
            caption: `${matches.length} matching entries pass all index predicates. Fetch their payload from the table.`,
            from: 'b',
            to: 'a',
            packet: `${matches.length} matching row ids`,
            values: { a: `${matches.length} payload rows fetched; 8 stored` },
        });
        add({
            title: 'Return the same query result',
            caption: 'Index key order changes access work here, not which rows satisfy the SQL predicate.',
            from: 'a',
            to: 'd',
            packet: `${matches.length} result rows`,
            values: { d: matches.map((row) => row.id).join(', ') },
            counts: { d: matches.length },
        });
        add({
            title: 'Stage another insert',
            caption:
                'A new table row and its secondary-index entry are pending in one transaction; neither is committed yet.',
            values: { a: '8 committed + 1 staged row', b: '8 committed + 1 staged entry' },
        });
        add({
            title: 'Commit the row and index entry',
            caption:
                'This insert adds one table row and one entry to this index. Additional indexes add their own maintenance work.',
            values: { a: '9 stored rows', b: '9 stored entries' },
            counts: { a: 9, b: 9 },
        });
        result = scanned.length === rows.length;
        metric('Index entries inspected', scanned.length);
        metric('Qualifying table payload fetches', matches.length);
        metric('Result rows', matches.length);
        metric('Secondary-index entries added by one insert', 1);
        explanation =
            'Leading equalities and the first range constraint bound this ordinary ordered scan. A nonleading-only query is not claimed to perform a leading-key seek here. PostgreSQL can also choose skip scans or other access paths; this model does not estimate its planner, page I/O or runtime. The one-entry count is logical maintenance, not measured write cost.';
    } else {
        let onA = true;
        let onB = true;
        const extras = n - 2;
        const total = (): number => Number(onA) + Number(onB) + extras;
        const roster = (): string => `A ${onA ? 'on' : 'off'}; B ${onB ? 'on' : 'off'}; ${extras} others on`;
        add({
            title: 'Keep at least one doctor on call',
            caption: `Initially ${n} doctors are on call. A and B each may leave only if another doctor remains.`,
            values: { d: roster(), a: 'not read', b: 'not read' },
            counts: { d: total() },
        });
        add({
            title: 'A reads the roster',
            caption: `A sees ${n} doctors and decides its own row may become off call.`,
            from: 'a',
            to: 'd',
            packet: 'read on-call count',
            values: { a: `snapshot count ${n}; plan A off` },
        });
        add({
            title: 'B reads the same snapshot',
            caption: `B also sees ${n} doctors and plans to leave. Neither transaction sees the other’s pending decision.`,
            from: 'b',
            to: 'd',
            packet: 'read on-call count',
            values: { b: `snapshot count ${n}; plan B off` },
        });
        onA = false;
        add({
            title: 'A commits its own row',
            caption: 'A becomes off call. B’s earlier predicate read still came from the original snapshot.',
            from: 'a',
            to: 'd',
            packet: 'commit A off',
            values: { a: 'committed', d: roster() },
            counts: { d: total() },
        });
        let aborted = 0;
        if (alt) {
            aborted = 1;
            add({
                title: 'Abort the conflicting B attempt',
                caption:
                    'This illustrative serializable schedule rejects B’s stale decision. The application must retry the whole transaction.',
                values: { b: 'serialization failure; rolled back', d: roster() },
                counts: { d: total() },
            });
            const fresh = total();
            add({
                title: 'Retry B with a fresh read',
                caption: `The retry sees ${fresh} doctor${fresh === 1 ? '' : 's'} on call and recomputes the permission to leave.`,
                from: 'b',
                to: 'd',
                packet: 'retry entire transaction',
                values: { b: `fresh count ${fresh}` },
            });
            if (fresh > 1) onB = false;
            add({
                title: 'Commit the recomputed decision',
                caption: onB
                    ? 'B stays on call because leaving would remove the last doctor.'
                    : 'Enough doctors remain, so B may leave on this fresh attempt.',
                from: 'b',
                to: 'd',
                packet: onB ? 'commit B stays' : 'commit B off',
                values: { b: onB ? 'stays on call' : 'committed off call', d: roster() },
                counts: { d: total() },
            });
        } else {
            onB = false;
            add({
                title: 'B commits a different row',
                caption:
                    'The disjoint row writes do not conflict directly. Both decisions relied on the same stale roster predicate.',
                from: 'b',
                to: 'd',
                packet: 'commit B off',
                values: { b: 'committed', d: roster() },
                counts: { d: total() },
            });
        }
        result = total() >= 1;
        metric('Doctors still on call', total());
        metric('Serialization failures in this schedule', aborted);
        metric('Initially on call', n);
        explanation =
            'With two doctors, disjoint snapshot writes can produce write skew and violate the cross-row rule. Extra on-call doctors can preserve that rule even under the unsafe schedule; derive the verdict from the final roster. Serializable isolation rejects inconsistent execution, not every concurrent write. This is one possible abort/retry schedule, not PostgreSQL’s SSI algorithm or a claim about which transaction it must abort.';
    }
    return { beats, outcome: spec.predictions[result ? 1 : 0], explanation, metrics };
}
