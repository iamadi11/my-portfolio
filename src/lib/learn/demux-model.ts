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
/** The client's source port: two with an open TCP connection to the server's port 443, one with nothing open. */
export type Source = 'conn1' | 'conn2' | 'fresh';
export type Dest = 'server' | 'other';
export type Firewall = 'off' | 'on';

export const PROTOS: Proto[] = ['TCP', 'UDP'];
export const SOURCES: Source[] = ['conn1', 'conn2', 'fresh'];
export const DESTS: Dest[] = ['server', 'other'];
export const PORTS = [443, 8125, 9000] as const;
export type Port = (typeof PORTS)[number];
export const FIREWALLS: Firewall[] = ['off', 'on'];

/** Source ports from the Dynamic Ports range, 49152–65535 (RFC 6335 §6). */
export const SOURCE_PORT: Record<Source, number> = { conn1: 50001, conn2: 50002, fresh: 50003 };

export type Packet = { proto: Proto; source: Source; dest: Dest; port: Port; firewall: Firewall };

/** Programs waiting on a port: a TCP listening socket takes new connections, a UDP socket takes datagrams. */
const LISTENERS: { proto: Proto; port: Port; program: string }[] = [
    { proto: 'TCP', port: 443, program: 'web server' },
    { proto: 'UDP', port: 8125, program: 'metrics collector' },
];

/** The firewall's rule when it is on: let in what the server offers, drop everything else. */
const FIREWALL_ALLOWS: { proto: Proto; port: Port }[] = [
    { proto: 'TCP', port: 443 },
    { proto: 'UDP', port: 8125 },
];

/** Open TCP connections, each named by its pair of sockets (RFC 9293 §3.4.1). */
const CONNECTIONS: { name: 'connection 1' | 'connection 2'; local: number; remotePort: number }[] = [
    { name: 'connection 1', local: 443, remotePort: SOURCE_PORT.conn1 },
    { name: 'connection 2', local: 443, remotePort: SOURCE_PORT.conn2 },
];

export type Outcome =
    | 'connection 1'
    | 'connection 2'
    | 'new connection'
    | 'metrics collector'
    | 'tcp reset'
    | 'icmp unreachable'
    | 'dropped by firewall'
    | 'another machine';

/** In the order the prediction lists them. */
export const OUTCOMES: Outcome[] = [
    'connection 1',
    'connection 2',
    'new connection',
    'metrics collector',
    'tcp reset',
    'icmp unreachable',
    'dropped by firewall',
    'another machine',
];

export type Stage = 'address' | 'firewall' | 'protocol' | 'lookup' | 'result';

/** One stage of the host's decision, in words, with the rule's source (or "model:" for a modelling choice). */
export type Step = { stage: Stage; text: string; source: string };

export type Delivery = {
    outcome: Outcome;
    /** The program that receives the packet, or null. */
    receiver: string | null;
    /** What the sender gets back. */
    reply: string;
    steps: Step[];
};

const FIREWALL_SOURCE = 'model: a typical firewall rule (configuration, not a standard)';

/** The packet's five fields as the learner reads them, e.g. "TCP 198.51.100.7:50001 → 203.0.113.10:443". */
export function label(p: Packet): string {
    return `${p.proto} ${CLIENT}:${SOURCE_PORT[p.source]} → ${p.dest === 'server' ? SERVER : OTHER}:${p.port}`;
}

/** TCP's lookup: an open connection by socket pair first, then a listening socket for a new connection. */
function tcp(p: Packet, steps: Step[]): Delivery {
    const from = `${CLIENT}:${SOURCE_PORT[p.source]}`;
    const conn = CONNECTIONS.find((c) => c.local === p.port && c.remotePort === SOURCE_PORT[p.source]);
    if (conn) {
        steps.push({
            stage: 'lookup',
            text: `TCP looks for an open connection with this pair of sockets, ${SERVER}:${p.port} and ${from}, and finds ${conn.name}.`,
            source: 'rfc9293 §3.4.1',
        });
        steps.push({
            stage: 'result',
            text: `The web server receives it on ${conn.name}. The other connection has a different source port, so it is a different pair of sockets.`,
            source: 'rfc9293 §3.4.1',
        });
        return {
            outcome: conn.name,
            receiver: `web server, ${conn.name}`,
            reply: `The web server's answer, on ${conn.name}`,
            steps,
        };
    }
    const listener = LISTENERS.find((l) => l.proto === 'TCP' && l.port === p.port);
    if (listener && p.source === 'fresh') {
        steps.push({
            stage: 'lookup',
            text: `No open connection matches ${from}, but the ${listener.program} has a listening socket on TCP ${p.port}, and this packet opens a connection.`,
            source: 'rfc9293 §3.9.1.1',
        });
        steps.push({
            stage: 'result',
            text: `TCP on the server sets up a new connection for the ${listener.program}'s listening socket, with its own pair of sockets; the program gets it once it is set up (how: the TCP chapter).`,
            source: 'rfc9293 §3.4.1 (pair of sockets); the set-up is the TCP chapter',
        });
        return {
            outcome: 'new connection',
            receiver: `${listener.program} (new connection)`,
            reply: 'The next step of setting up the connection',
            steps,
        };
    }
    const open =
        p.source === 'fresh'
            ? 'nothing is open from it'
            : `its open connection is to port 443, not ${p.port}`;
    steps.push({
        stage: 'lookup',
        text: `No open connection matches ${from} (${open}), and nobody listens on TCP ${p.port}.`,
        source: 'rfc9293 §3.5.2',
    });
    steps.push({
        stage: 'result',
        text: 'Nobody receives it. TCP sends a reset (RST) back: the connection does not exist.',
        source: 'rfc9293 §3.5.2',
    });
    return { outcome: 'tcp reset', receiver: null, reply: 'A TCP reset (RST)', steps };
}

/** UDP's lookup: a socket on the port, or nobody. */
function udp(p: Packet, steps: Step[]): Delivery {
    const socket = LISTENERS.find((l) => l.proto === 'UDP' && l.port === p.port);
    if (socket) {
        steps.push({
            stage: 'lookup',
            text: `UDP finds the ${socket.program}'s socket on port ${p.port}. It has no connections, so in this model it takes datagrams from any source port.`,
            source: 'model: an unconnected UDP socket',
        });
        steps.push({
            stage: 'result',
            text: `The ${socket.program} receives the datagram. Nothing goes back unless the program answers.`,
            source: 'rfc768 Introduction',
        });
        return {
            outcome: 'metrics collector',
            receiver: socket.program,
            reply: 'Nothing (UDP sends no acknowledgement)',
            steps,
        };
    }
    steps.push({
        stage: 'lookup',
        text: `No program has a UDP socket on port ${p.port}.`,
        source: 'rfc1122 §4.1.3.1',
    });
    steps.push({
        stage: 'result',
        text: 'Nobody receives it. The host should send ICMP Port Unreachable back (a SHOULD, not a MUST).',
        source: 'rfc1122 §4.1.3.1',
    });
    return { outcome: 'icmp unreachable', receiver: null, reply: 'ICMP Port Unreachable', steps };
}

/**
 * Where the packet goes. Stages in order: the destination address selects the host; a firewall, if on, applies its
 * rule at the host's edge; the IP header's protocol field selects the transport; the transport looks the port up;
 * the result. Steps stop at the stage that decides.
 */
export function demux(p: Packet): Delivery {
    if (p.dest !== 'server')
        return {
            outcome: 'another machine',
            receiver: null,
            reply: `Whatever ${OTHER} answers`,
            steps: [
                {
                    stage: 'address',
                    text: `The destination address is ${OTHER}, not ${SERVER}: the network delivers it to that machine, so this server never sees it.`,
                    source: 'rfc791 §3.1',
                },
            ],
        };
    const steps: Step[] = [
        {
            stage: 'address',
            text: `The destination address ${SERVER} is this server's, so the packet is for this machine.`,
            source: 'rfc791 §3.1',
        },
    ];
    if (p.firewall === 'on') {
        const allowed = FIREWALL_ALLOWS.some((a) => a.proto === p.proto && a.port === p.port);
        steps.push({
            stage: 'firewall',
            text: allowed
                ? `The firewall's rule allows ${p.proto} ${p.port}, so the packet goes on into the host.`
                : `The firewall's rule allows only TCP 443 and UDP 8125, so it drops this ${p.proto} ${p.port} packet before TCP or UDP sees it.`,
            source: FIREWALL_SOURCE,
        });
        if (!allowed) {
            steps.push({
                stage: 'result',
                text: 'Nobody receives it and nothing comes back. The sender cannot tell this from a lost packet, so silence proves nothing about what is listening.',
                source: FIREWALL_SOURCE,
            });
            return { outcome: 'dropped by firewall', receiver: null, reply: 'Nothing', steps };
        }
    }
    steps.push({
        stage: 'protocol',
        text: `The IP header's protocol field says ${p.proto}, so the host hands the packet to ${p.proto}. Ports mean something only inside ${p.proto}.`,
        source: 'rfc791 §3.1',
    });
    return p.proto === 'TCP' ? tcp(p, steps) : udp(p, steps);
}
