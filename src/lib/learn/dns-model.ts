/**
 * Teaching model for the dns chapter. A stub asks a resolver. The resolver returns a stored
 * answer, or walks one server per zone: root, then the TLD, then the authoritative server.
 * Each of those answers from local data with either a referral or the final result
 * (RFC 1034 §4.1, §5.3.3). Not a trace of a real resolver.
 *
 * 1. Inputs: `cached` (an address is already stored), `exists` (the authoritative zone has the name).
 *    `exists` is used only on a cache miss. A stored answer is returned first (§5.3.3 step 1).
 * 2. State: the query's place, and how many servers have been asked.
 * 3. Rules: cache hit visits only the computer and the resolver. A miss asks root, then the TLD,
 *    then the authoritative server, in that order. The last server returns the address or a name error.
 * 4. Equations: queries = 0 if cached, else 3. One query per server visited.
 * 5. Assumptions: one name, one server per zone, no second try, no CNAME, no TTL clock, no packet loss.
 *    The address is the documentation address this course already uses, scripted as the zone's answer.
 * 6. Outputs: the steps, the query count, the address or null, the places visited.
 * 7. Boundaries: cached ignores `exists`. Miss plus missing name ends in a name error.
 * 8. Deterministic.
 * 9. Limits: not the wire format (RFC 1035), not DNSSEC, not a measured lookup.
 */

export const EXAMPLE_NAME = 'www.example.com';
/** Documentation address already used in chapter 3. The zone file in this model is scripted to return it. */
export const EXAMPLE_ADDRESS = '203.0.113.10';

export type Place = 'client' | 'resolver' | 'root' | 'tld' | 'auth';
export type Kind = 'ask' | 'cache-hit' | 'referral' | 'answer' | 'name-error';

export type Step = { at: Place; kind: Kind; said: string };
export type Inputs = { cached: boolean; exists: boolean };
export type Run = { steps: Step[]; queries: number; address: string | null; visits: Place[] };

const SERVERS: Place[] = ['root', 'tld', 'auth'];

export function resolve({ cached, exists }: Inputs): Run {
    if (cached) {
        const steps: Step[] = [
            { at: 'client', kind: 'ask', said: 'The computer asks its resolver for the name.' },
            {
                at: 'resolver',
                kind: 'cache-hit',
                said: 'The resolver already has the address, so it does not ask the other servers.',
            },
            {
                at: 'client',
                kind: 'answer',
                said: `The address ${EXAMPLE_ADDRESS} comes back. The other machines were not visited.`,
            },
        ];
        return { steps, queries: 0, address: EXAMPLE_ADDRESS, visits: ['client', 'resolver'] };
    }
    const steps: Step[] = [
        { at: 'client', kind: 'ask', said: 'The computer asks its resolver for the name.' },
        {
            at: 'resolver',
            kind: 'ask',
            said: 'Nothing is stored for this name, so the resolver starts at the root.',
        },
        {
            at: 'root',
            kind: 'referral',
            said: 'The root does not have the address. It points at the servers for com.',
        },
        {
            at: 'tld',
            kind: 'referral',
            said: 'The com server does not have the address. It points at the servers for example.com.',
        },
    ];
    if (exists) {
        steps.push(
            {
                at: 'auth',
                kind: 'answer',
                said: `The example.com server has the address ${EXAMPLE_ADDRESS}.`,
            },
            { at: 'client', kind: 'answer', said: 'That address comes back to the computer.' }
        );
    } else {
        steps.push(
            {
                at: 'auth',
                kind: 'name-error',
                said: 'The example.com server says this name is not in the zone.',
            },
            { at: 'client', kind: 'name-error', said: 'No address comes back.' }
        );
    }
    return {
        steps,
        queries: SERVERS.length,
        address: exists ? EXAMPLE_ADDRESS : null,
        visits: ['client', 'resolver', ...SERVERS],
    };
}

/** How many servers have been asked by this step, inclusive. */
export function queriesAt(run: Run, index: number): number {
    return run.steps.slice(0, index + 1).filter((s) => SERVERS.includes(s.at)).length;
}

export type Outcome = 'stored' | 'walk' | 'missing';

export function outcomeOf(run: Run): Outcome {
    if (run.queries === 0) return 'stored';
    return run.address ? 'walk' : 'missing';
}
