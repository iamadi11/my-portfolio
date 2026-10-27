import { describe, expect, it } from 'vitest';

import {
    CONNECTIONS,
    demux,
    DESTS,
    OUTCOMES,
    PORTS,
    PROTOS,
    SOURCE_PORT,
    SOURCES,
    UNUSED,
    label,
    type Packet,
} from './demux-model';

const all: Packet[] = PROTOS.flatMap((proto) =>
    SOURCES.flatMap((source) =>
        DESTS.flatMap((dest) =>
            PORTS.flatMap((port) => UNUSED.map((unused) => ({ proto, source, dest, port, unused })))
        )
    )
);
const tcp = (source: Packet['source'], port: Packet['port'], unused: Packet['unused'] = 'rfc') =>
    demux({ proto: 'TCP', source, dest: 'server', port, unused });
const udp = (source: Packet['source'], port: Packet['port'], unused: Packet['unused'] = 'rfc') =>
    demux({ proto: 'UDP', source, dest: 'server', port, unused });

describe('every packet has exactly one fate (A2 invariants)', () => {
    it('covers all 72 combinations with a known outcome, a reply and steps ending in the deciding stage', () => {
        expect(all).toHaveLength(72);
        for (const p of all) {
            const d = demux(p);
            expect(OUTCOMES).toContain(d.outcome);
            expect(d.reply.length).toBeGreaterThan(0);
            expect(d.steps.length).toBeGreaterThan(0);
            expect(d.steps.at(-1)?.stage).toBe(p.dest === 'server' ? 'result' : 'address');
            // A receiver exists exactly when a program gets the packet.
            const delivered = ['connection A', 'connection B', 'new connection', 'metrics collector'];
            expect(d.receiver !== null).toBe(delivered.includes(d.outcome));
        }
    });

    it('is deterministic', () => {
        for (const p of all) expect(demux(p)).toEqual(demux({ ...p }));
    });

    it('stages come in order: address, protocol, lookup, result', () => {
        const order = ['address', 'protocol', 'lookup', 'result'];
        for (const p of all) {
            const s = demux(p).steps.map((x) => order.indexOf(x.stage));
            expect(s).toEqual([...s].sort((a, b) => a - b));
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

describe('two tabs, two connections (objective 2)', () => {
    it('tab 1 and tab 2 to TCP 443 reach different connections of the same program', () => {
        expect(tcp('tab1', 443).outcome).toBe('connection A');
        expect(tcp('tab2', 443).outcome).toBe('connection B');
        expect(CONNECTIONS.map((c) => c.program)).toEqual(['web server', 'web server']);
    });

    it('only the source port tells them apart', () => {
        const a = label({ proto: 'TCP', source: 'tab1', dest: 'server', port: 443, unused: 'rfc' });
        const b = label({ proto: 'TCP', source: 'tab2', dest: 'server', port: 443, unused: 'rfc' });
        expect(a).toBe('TCP 198.51.100.7:50001 → 203.0.113.10:443');
        expect(b).toBe('TCP 198.51.100.7:50002 → 203.0.113.10:443');
    });

    it('a new tab goes to the listener as a new connection', () => {
        expect(tcp('newTab', 443).outcome).toBe('new connection');
    });

    it('source ports are in the Dynamic Ports range (RFC 6335 §6)', () => {
        for (const s of SOURCES) expect(SOURCE_PORT[s]).toBeGreaterThanOrEqual(49152);
    });
});

describe('UDP has no connections (objective 1)', () => {
    it('the collector gets the datagram whatever the source port', () => {
        for (const s of SOURCES) expect(udp(s, 8125).outcome).toBe('metrics collector');
    });

    it('UDP 443 has nobody, even though TCP 443 does', () => {
        expect(udp('tab1', 443).outcome).toBe('icmp unreachable');
        expect(tcp('tab1', 443).outcome).toBe('connection A');
    });
});

describe('unused ports: the answer depends on the host (objective 1)', () => {
    it('TCP answers with a reset, UDP with ICMP Port Unreachable, when the host follows the RFCs', () => {
        for (const s of SOURCES) {
            expect(tcp(s, 9000).outcome).toBe('tcp reset');
            expect(udp(s, 9000).outcome).toBe('icmp unreachable');
        }
        expect(tcp('tab1', 8125).outcome).toBe('tcp reset');
        expect(tcp('newTab', 8125).outcome).toBe('tcp reset');
    });

    it('a firewall drops both silently, and the result says the sender cannot tell why', () => {
        for (const d of [tcp('tab1', 9000, 'firewall'), udp('tab1', 9000, 'firewall')]) {
            expect(d.outcome).toBe('dropped silently');
            expect(d.reply).toBe('Nothing');
            expect(d.steps.at(-1)?.text).toMatch(/cannot tell/);
        }
    });

    it('the firewall variant changes nothing for ports in use', () => {
        expect(tcp('tab1', 443, 'firewall').outcome).toBe('connection A');
        expect(udp('tab2', 8125, 'firewall').outcome).toBe('metrics collector');
    });

    it('the ICMP reply is described as a SHOULD, not a guarantee', () => {
        expect(udp('tab1', 9000).steps.at(-1)?.text).toMatch(/should/i);
    });
});

describe('guards against the targeted misconceptions', () => {
    it('no step says an address or port identifies a user or a request', () => {
        for (const p of all)
            for (const s of demux(p).steps) expect(s.text).not.toMatch(/\b(user|request)\b/i);
    });

    it('every step names its source', () => {
        for (const p of all) for (const s of demux(p).steps) expect(s.source).toMatch(/^(rfc\d+ |judgement)/);
    });
});
