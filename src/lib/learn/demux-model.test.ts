import { describe, expect, it } from 'vitest';

import {
    demux,
    DESTS,
    FIREWALLS,
    label,
    OUTCOMES,
    PORTS,
    PROTOS,
    SOURCE_PORT,
    SOURCES,
    type Packet,
} from './demux-model';

const all: Packet[] = PROTOS.flatMap((proto) =>
    SOURCES.flatMap((source) =>
        DESTS.flatMap((dest) =>
            PORTS.flatMap((port) => FIREWALLS.map((firewall) => ({ proto, source, dest, port, firewall })))
        )
    )
);
const at = (
    proto: Packet['proto'],
    source: Packet['source'],
    port: Packet['port'],
    firewall: Packet['firewall'] = 'off'
) => demux({ proto, source, dest: 'server', port, firewall });

describe('every packet has exactly one fate (A2 invariants)', () => {
    it('covers all 72 combinations with a known outcome, a reply and steps ending in the deciding stage', () => {
        expect(all).toHaveLength(72);
        for (const p of all) {
            const d = demux(p);
            expect(OUTCOMES).toContain(d.outcome);
            expect(d.reply.length).toBeGreaterThan(0);
            expect(d.steps.at(-1)?.stage).toBe(p.dest === 'server' ? 'result' : 'address');
            const delivered = ['connection 1', 'connection 2', 'new connection', 'metrics collector'];
            expect(d.receiver !== null).toBe(delivered.includes(d.outcome));
        }
    });

    it('is deterministic', () => {
        for (const p of all) expect(demux(p)).toEqual(demux({ ...p }));
    });

    it('stages come in order: address, firewall, protocol, lookup, result', () => {
        const order = ['address', 'firewall', 'protocol', 'lookup', 'result'];
        for (const p of all) {
            const s = demux(p).steps.map((x) => order.indexOf(x.stage));
            expect(s).toEqual([...s].sort((a, b) => a - b));
            expect(new Set(s).size).toBe(s.length);
        }
    });
});

describe('the address picks the machine (objective 1)', () => {
    it('a packet for another address never reaches this server, whatever the rest', () => {
        for (const p of all.filter((x) => x.dest === 'other')) {
            expect(demux(p).outcome).toBe('another machine');
            expect(demux(p).steps).toHaveLength(1);
        }
    });
});

describe('two connections from one client (objective 2)', () => {
    it('source ports 50001 and 50002 to TCP 443 reach different connections of the same program', () => {
        expect(at('TCP', 'conn1', 443).outcome).toBe('connection 1');
        expect(at('TCP', 'conn2', 443).outcome).toBe('connection 2');
    });

    it('only the source port tells them apart', () => {
        const a = label({ proto: 'TCP', source: 'conn1', dest: 'server', port: 443, firewall: 'off' });
        const b = label({ proto: 'TCP', source: 'conn2', dest: 'server', port: 443, firewall: 'off' });
        expect(a).toBe('TCP 198.51.100.7:50001 → 203.0.113.10:443');
        expect(b).toBe('TCP 198.51.100.7:50002 → 203.0.113.10:443');
    });

    it('a port with nothing open reaches the listening socket as a new connection, set up by TCP', () => {
        const d = at('TCP', 'fresh', 443);
        expect(d.outcome).toBe('new connection');
        expect(d.steps.at(-1)?.text).toMatch(/TCP on the server sets up a new connection/);
    });

    it('source ports are in the Dynamic Ports range (RFC 6335 §6)', () => {
        for (const s of SOURCES) expect(SOURCE_PORT[s]).toBeGreaterThanOrEqual(49152);
    });
});

describe('UDP has no connections (objective 1)', () => {
    it('the collector gets the datagram whatever the source port, and the rule is labelled a model choice', () => {
        for (const s of SOURCES) {
            expect(at('UDP', s, 8125).outcome).toBe('metrics collector');
            expect(at('UDP', s, 8125).steps.find((x) => x.stage === 'lookup')?.source).toMatch(/^model:/);
        }
    });

    it('UDP 443 has nobody on this server, even though TCP 443 does', () => {
        expect(at('UDP', 'conn1', 443).outcome).toBe('icmp unreachable');
        expect(at('TCP', 'conn1', 443).outcome).toBe('connection 1');
    });
});

describe('nobody there, firewall off (objective 1)', () => {
    it('TCP answers with a reset, UDP with ICMP Port Unreachable (a SHOULD)', () => {
        for (const s of SOURCES) {
            expect(at('TCP', s, 9000).outcome).toBe('tcp reset');
            expect(at('UDP', s, 9000).outcome).toBe('icmp unreachable');
        }
        expect(at('UDP', 'conn1', 9000).steps.at(-1)?.text).toMatch(/should/i);
    });

    it('a source with an open connection to 443 sending to 9000 is told why nothing matches', () => {
        expect(at('TCP', 'conn1', 9000).steps.find((x) => x.stage === 'lookup')?.text).toMatch(
            /its open connection is to port 443, not 9000/
        );
        expect(at('TCP', 'fresh', 8125).steps.find((x) => x.stage === 'lookup')?.text).toMatch(
            /nothing is open/
        );
    });
});

describe('the firewall is a rule at the edge, before the transport (objective 1)', () => {
    it('drops what its rule does not allow, before the protocol stage, and nothing comes back', () => {
        for (const [proto, port] of [
            ['TCP', 9000],
            ['UDP', 9000],
            ['UDP', 443],
            ['TCP', 8125],
        ] as const) {
            const d = at(proto, 'conn1', port, 'on');
            expect(d.outcome).toBe('dropped by firewall');
            expect(d.reply).toBe('Nothing');
            expect(d.steps.map((s) => s.stage)).toEqual(['address', 'firewall', 'result']);
            expect(d.steps.at(-1)?.text).toMatch(/cannot tell/);
        }
    });

    it('lets allowed packets through to the same outcome as without it', () => {
        expect(at('TCP', 'conn2', 443, 'on').outcome).toBe('connection 2');
        expect(at('UDP', 'fresh', 8125, 'on').outcome).toBe('metrics collector');
        expect(at('TCP', 'conn2', 443, 'on').steps.map((s) => s.stage)).toContain('firewall');
    });

    it('is labelled as a configuration choice, not a standard', () => {
        expect(at('TCP', 'conn1', 9000, 'on').steps[1].source).toMatch(/^model: .*not a standard/);
    });
});

describe('guards against the targeted misconceptions', () => {
    it('no step says an address or port identifies a user, a request or a tab', () => {
        for (const p of all)
            for (const s of demux(p).steps) expect(s.text).not.toMatch(/\b(user|request|tab)\b/i);
    });

    it('every step names its source, or says it is a modelling choice', () => {
        for (const p of all) for (const s of demux(p).steps) expect(s.source).toMatch(/^(rfc\d+ |model: )/);
    });
});
