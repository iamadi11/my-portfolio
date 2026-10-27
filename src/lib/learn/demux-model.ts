/**
 * Teaching model for the ip-and-ports chapter, asset A2 (docs/system-design/chapters/ip-and-ports.md, "Asset plan"):
 * how one host hands an arriving packet to a program. A pure function of the packet; the figure only reads it. A
 * teaching model, not a benchmark: the server runs exactly the programs in `LISTENERS` and `CONNECTIONS`, has one
 * address, and nothing (NAT, proxies, load balancers) sits between the hosts. Addresses are from the documentation
 * blocks of RFC 5737.
 */

export const SERVER = '203.0.113.10';
const CLIENT = '198.51.100.7';
export const OTHER = '192.0.2.20';

export type Proto = 'TCP' | 'UDP';
export type Source = 'tab1' | 'tab2' | 'newTab';
export type Dest = 'server' | 'other';
/** What the server does with a packet for a port nobody uses: what the RFCs ask, or a firewall that drops it. */
export type Unused = 'rfc' | 'firewall';

export const PROTOS: Proto[] = ['TCP', 'UDP'];
export const SOURCES: Source[] = ['tab1', 'tab2', 'newTab'];
export const DESTS: Dest[] = ['server', 'other'];
export const PORTS = [443, 8125, 9000] as const;
export type Port = (typeof PORTS)[number];
export const UNUSED: Unused[] = ['rfc', 'firewall'];

/** Source ports from the Dynamic Ports range, 49152–65535 (RFC 6335 §6). */
export const SOURCE_PORT: Record<Source, number> = { tab1: 50001, tab2: 50002, newTab: 50003 };

export type Packet = { proto: Proto; source: Source; dest: Dest; port: Port; unused: Unused };

/** Programs waiting on a port: TCP listeners take new connections, a UDP socket takes every datagram. */
const LISTENERS: { proto: Proto; port: Port; program: string }[] = [
    { proto: 'TCP', port: 443, program: 'web server' },
    { proto: 'UDP', port: 8125, program: 'metrics collector' },
];

/** Open TCP connections, each named by its pair of sockets (RFC 9293 §3.4.1). Tab 1 and tab 2 each have one. */
export const CONNECTIONS: { name: string; local: number; remotePort: number; program: string }[] = [
    { name: 'connection A', local: 443, remotePort: SOURCE_PORT.tab1, program: 'web server' },
    { name: 'connection B', local: 443, remotePort: SOURCE_PORT.tab2, program: 'web server' },
];

export type Outcome =
    | 'connection A'
    | 'connection B'
    | 'new connection'
    | 'metrics collector'
    | 'tcp reset'
    | 'icmp unreachable'
    | 'dropped silently'
    | 'another machine';

/** In the order the prediction lists them. */
export const OUTCOMES: Outcome[] = [
    'connection A',
    'connection B',
    'new connection',
    'metrics collector',
    'tcp reset',
    'icmp unreachable',
    'dropped silently',
    'another machine',
];

export type Stage = 'address' | 'protocol' | 'lookup' | 'result';

/** One stage of the host's decision, in words, with the rule's source. */
export type Step = { stage: Stage; text: string; source: string };

export type Delivery = {
    outcome: Outcome;
    /** The program that receives the packet, or null. */
    receiver: string | null;
    /** What the sender gets back. */
    reply: string;
    steps: Step[];
};

/** The packet's five fields as the learner reads them, e.g. "TCP 198.51.100.7:50001 → 203.0.113.10:443". */
export function label(p: Packet): string {
    return `${p.proto} ${CLIENT}:${SOURCE_PORT[p.source]} → ${p.dest === 'server' ? SERVER : OTHER}:${p.port}`;
}

/**
 * Where the packet goes. Stages in order: the destination address selects the host; the IP header's protocol field
 * selects the transport; the transport looks the port up (TCP: open connections by socket pair first, then a
 * listener for a new connection; UDP: a socket on the port, whatever the source port); the result. Steps stop at the
 * stage that decides.
 */
export function demux(p: Packet): Delivery {
    const steps: Step[] = [];
    if (p.dest !== 'server') {
        steps.push({
            stage: 'address',
            text: `The destination address is ${OTHER}, not ${SERVER}: the network delivers it to that machine, so this server never sees it.`,
            source: 'rfc791 §3.1',
        });
        return { outcome: 'another machine', receiver: null, reply: `Whatever ${OTHER} answers`, steps };
    }
    steps.push({
        stage: 'address',
        text: `The destination address ${SERVER} is this server's, so the packet is for this machine.`,
        source: 'rfc791 §3.1',
    });
    steps.push({
        stage: 'protocol',
        text: `The IP header's protocol field says ${p.proto}, so the host hands the packet to ${p.proto}. Ports mean something only inside ${p.proto}.`,
        source: 'rfc791 §3.1',
    });
    const from = `${CLIENT}:${SOURCE_PORT[p.source]}`;
    const unusedPort = (rule: string, reply: string, source: string): Delivery => {
        const silent = p.unused === 'firewall';
        steps.push({
            stage: 'lookup',
            text: `${p.proto} finds nothing for port ${p.port}: ${rule}`,
            source,
        });
        steps.push({
            stage: 'result',
            text: silent
                ? 'A firewall drops the packet and sends nothing back. The sender cannot tell this from a lost packet.'
                : `Nobody receives it. ${reply}`,
            source: silent ? 'judgement: common firewall behaviour' : source,
        });
        return {
            outcome: silent ? 'dropped silently' : p.proto === 'TCP' ? 'tcp reset' : 'icmp unreachable',
            receiver: null,
            reply: silent ? 'Nothing' : p.proto === 'TCP' ? 'A TCP reset (RST)' : 'ICMP Port Unreachable',
            steps,
        };
    };
    if (p.proto === 'TCP') {
        const conn = CONNECTIONS.find((c) => c.local === p.port && c.remotePort === SOURCE_PORT[p.source]);
        if (conn) {
            steps.push({
                stage: 'lookup',
                text: `TCP looks for an open connection with this pair of sockets, ${SERVER}:${p.port} and ${from}, and finds ${conn.name}.`,
                source: 'rfc9293 §3.4.1',
            });
            steps.push({
                stage: 'result',
                text: `The ${conn.program} receives it on ${conn.name}. Another tab's connection has a different source port, so it is a different pair of sockets.`,
                source: 'rfc9293 §3.4.1',
            });
            return {
                outcome: conn.name as Outcome,
                receiver: `${conn.program}, ${conn.name}`,
                reply: `The ${conn.program}'s answer, on ${conn.name}`,
                steps,
            };
        }
        const listener = LISTENERS.find((l) => l.proto === 'TCP' && l.port === p.port);
        if (listener && p.source === 'newTab') {
            steps.push({
                stage: 'lookup',
                text: `No open connection matches ${from}, but the ${listener.program} is listening on TCP ${p.port}.`,
                source: 'rfc9293 §3.9.1.1',
            });
            steps.push({
                stage: 'result',
                text: `The ${listener.program} receives the opening packet of a new connection, which will get its own pair of sockets.`,
                source: 'rfc9293 §3.4.1',
            });
            return {
                outcome: 'new connection',
                receiver: `${listener.program} (listening)`,
                reply: 'The start of a new connection',
                steps,
            };
        }
        return unusedPort(
            listener
                ? `no open connection matches ${from} (this tab's connection is to another port).`
                : 'no open connection and nobody listening.',
            'TCP sends a reset (RST) back: the connection does not exist.',
            'rfc9293 §3.5.2'
        );
    }
    const udp = LISTENERS.find((l) => l.proto === 'UDP' && l.port === p.port);
    if (udp) {
        steps.push({
            stage: 'lookup',
            text: `UDP finds the ${udp.program} on port ${p.port}. UDP has no connections, so the source port does not matter.`,
            source: 'rfc768 Fields',
        });
        steps.push({
            stage: 'result',
            text: `The ${udp.program} receives the datagram. Nothing goes back unless the program answers.`,
            source: 'rfc768 Fields',
        });
        return {
            outcome: 'metrics collector',
            receiver: udp.program,
            reply: 'Nothing (UDP sends no acknowledgement)',
            steps,
        };
    }
    return unusedPort(
        'no program has a UDP socket on it.',
        'The host should send ICMP Port Unreachable back (a SHOULD, not a MUST).',
        'rfc1122 §4.1.3.1'
    );
}
