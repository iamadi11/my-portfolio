import 'server-only';

import type { LessonFilmData } from '@/lib/learn/film-model';

/** Topic-specific scripts; the server sends only the requested film to the player. */
export const LESSON_FILMS: Record<string, LessonFilmData> = {
    'web-request': {
        id: 'web-request',
        question: 'What happens after you press Enter?',
        takeaway: 'A page load is a chain of work. Reusing earlier work can shorten the chain.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'r',
                label: 'DNS resolver',
                kind: 'router',
                x: -70,
                y: -135,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
        ],
        links: [
            ['c', 'r'],
            ['c', 's'],
        ],
        beats: [
            {
                title: 'Start with a name',
                caption:
                    'Your browser has a website name. It needs a destination before it can send the request.',
                states: {
                    c: 'active',
                },
            },
            {
                title: 'Find the address',
                caption: 'DNS looks up an address for the name. Watch the query visit the resolver.',
                from: 'c',
                to: 'r',
                packet: 'name?',
                values: {
                    r: '203.0.113.10',
                },
            },
            {
                title: 'Connect securely',
                caption:
                    'A new HTTPS connection needs transport and security setup. These are separate from asking for the page.',
                from: 'c',
                to: 's',
                packet: 'connect',
                states: {
                    s: 'locked',
                },
            },
            {
                title: 'Ask for the page',
                caption: 'The request reaches the server. The server prepares a response.',
                from: 'c',
                to: 's',
                packet: 'GET /',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Receive the page',
                caption:
                    'The response returns. Cached DNS information and a reusable connection can avoid some earlier work.',
                from: 's',
                to: 'c',
                packet: 'HTML',
                states: {
                    c: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#web-request',
    },
    'client-server': {
        id: 'client-server',
        question: 'Did the server do the work if the reply vanished?',
        takeaway: 'A missing reply does not prove the operation failed.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
            {
                id: 'd',
                label: 'Data store',
                kind: 'store',
                x: 290,
                y: -125,
            },
        ],
        links: [
            ['c', 's'],
            ['s', 'd'],
        ],
        beats: [
            {
                title: 'Two separate programs',
                caption: 'A client asks for work. A server receives the request and runs it.',
                states: {
                    c: 'active',
                },
            },
            {
                title: 'Create an order',
                caption: 'The client sends a request that asks the server to create an order.',
                from: 'c',
                to: 's',
                packet: 'POST',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Save the result',
                caption:
                    'The server saves the new order. That change exists even before the client sees a reply.',
                from: 's',
                to: 'd',
                packet: 'order',
                counts: {
                    d: 1,
                },
                values: {
                    d: '1 order',
                },
            },
            {
                title: 'Lose the reply',
                caption: 'The response disappears in transit. The saved order stays in the data store.',
                from: 's',
                to: 'c',
                packet: 'reply',
                lost: true,
                counts: {
                    d: 1,
                },
                values: {
                    d: '1 order',
                },
            },
            {
                title: 'Uncertainty is real',
                caption:
                    'The client cannot distinguish a lost request from a lost reply. A safe retry needs an explicit design.',
                states: {
                    c: 'failed',
                    d: 'done',
                },
                counts: {
                    d: 1,
                },
            },
        ],
        sourceHref: '/learn/sources#client-server',
    },
    'ip-and-ports': {
        id: 'ip-and-ports',
        question: 'How does a packet reach the right program?',
        takeaway:
            'The address identifies the destination host; transport and port help select its receiving endpoint.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'r',
                label: 'Network router',
                kind: 'router',
                x: -70,
                y: -100,
            },
            {
                id: 's',
                label: 'TCP port 443',
                kind: 'server',
                x: 175,
                y: -60,
            },
            {
                id: 'u',
                label: 'UDP port 8125',
                kind: 'server',
                x: 180,
                y: 130,
            },
        ],
        links: [
            ['c', 'r'],
            ['r', 's'],
            ['r', 'u'],
        ],
        beats: [
            {
                title: 'An envelope with fields',
                caption: 'A packet carries a destination address. Transport headers also carry ports.',
                values: {
                    c: '203.0.113.10',
                },
            },
            {
                title: 'Route to the host',
                caption: 'The network uses the destination IP address to forward the packet toward its host.',
                from: 'c',
                to: 'r',
                packet: 'IP address',
            },
            {
                title: 'Choose an endpoint',
                caption:
                    'This example uses TCP and destination port 443. It does not go to the UDP endpoint.',
                from: 'r',
                to: 's',
                packet: 'TCP :443',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'A different transport',
                caption:
                    'A UDP datagram for port 8125 selects a different endpoint. A port number alone is not the complete address.',
                from: 'r',
                to: 'u',
                packet: 'UDP :8125',
                states: {
                    u: 'active',
                },
            },
            {
                title: 'Nobody listening',
                caption:
                    'A host can receive a packet even when no program is listening on the requested port.',
                states: {
                    s: 'failed',
                },
                values: {
                    s: ':9000 empty',
                },
            },
        ],
        sourceHref: '/learn/sources#ip-and-ports',
    },
    dns: {
        id: 'dns',
        question: 'How does a name become an address?',
        takeaway: 'DNS follows a hierarchy; cached answers can shorten later lookups.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'r',
                label: 'Resolver',
                kind: 'router',
                x: -105,
                y: 90,
            },
            {
                id: 't',
                label: 'DNS hierarchy',
                kind: 'server',
                x: 115,
                y: -130,
            },
            {
                id: 'a',
                label: 'Authoritative DNS',
                kind: 'server',
                x: 270,
                y: 75,
            },
        ],
        links: [
            ['c', 'r'],
            ['r', 't'],
            ['r', 'a'],
        ],
        beats: [
            {
                title: 'Ask a resolver',
                caption: 'The browser needs an address for a name. A resolver works out the answer.',
                from: 'c',
                to: 'r',
                packet: 'example.com?',
            },
            {
                title: 'Find who knows',
                caption:
                    'When the answer is not cached, the resolver follows referrals through the DNS hierarchy.',
                from: 'r',
                to: 't',
                packet: 'referral?',
                states: {
                    t: 'active',
                },
            },
            {
                title: 'Reach the authority',
                caption: 'The authoritative server provides records for its zone.',
                from: 'r',
                to: 'a',
                packet: 'address?',
                states: {
                    a: 'active',
                },
            },
            {
                title: 'Return the record',
                caption: 'The resolver returns the answer and may cache it for its permitted lifetime.',
                from: 'a',
                to: 'r',
                packet: 'A record',
                states: {
                    r: 'done',
                },
            },
            {
                title: 'Use the cache',
                caption: 'A later lookup can use an unexpired cached record without repeating the full walk.',
                from: 'r',
                to: 'c',
                packet: 'cached A',
                states: {
                    c: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#dns',
    },
    tcp: {
        id: 'tcp',
        question: 'What if packets arrive with a gap?',
        takeaway: 'TCP exposes an ordered byte stream; later bytes wait behind missing bytes.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'q',
                label: 'Receive buffer',
                kind: 'queue',
                x: -30,
                y: 50,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
        ],
        links: [
            ['c', 'q'],
            ['q', 's'],
        ],
        beats: [
            {
                title: 'Split the stream',
                caption:
                    'TCP carries bytes in segments. Sequence numbers identify their place in the byte stream.',
                counts: {
                    c: 3,
                },
            },
            {
                title: 'Receive later bytes',
                caption: 'A later segment arrives before the missing one. The receiver can buffer it.',
                from: 'c',
                to: 'q',
                packet: 'bytes 3–4',
                counts: {
                    q: 2,
                },
                states: {
                    q: 'active',
                },
            },
            {
                title: 'Hold the gap',
                caption: 'The application does not receive later bytes as if the missing bytes had arrived.',
                states: {
                    s: 'idle',
                },
                values: {
                    q: 'gap at 1–2',
                },
                counts: {
                    q: 2,
                },
            },
            {
                title: 'Retransmit missing bytes',
                caption: 'A retransmission fills the gap. The receiver can now assemble a continuous prefix.',
                from: 'c',
                to: 'q',
                packet: 'bytes 1–2',
                counts: {
                    q: 4,
                },
            },
            {
                title: 'Deliver in order',
                caption:
                    'The application receives the ordered bytes. Arrival order and delivery order can differ.',
                from: 'q',
                to: 's',
                packet: '1 2 3 4',
                states: {
                    s: 'done',
                },
                counts: {
                    q: 0,
                },
            },
        ],
        sourceHref: '/learn/sources#tcp',
    },
    tls: {
        id: 'tls',
        question: 'How can a browser trust a secure connection?',
        takeaway:
            'TLS authenticates the peer and protects application data; it does not make the application itself trustworthy.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'e',
                label: 'Network observer',
                kind: 'router',
                x: -50,
                y: 150,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
        ],
        links: [
            ['c', 's'],
            ['c', 'e'],
        ],
        beats: [
            {
                title: 'Agree on protection',
                caption:
                    'The client begins a handshake, offering supported parameters and key exchange information.',
                from: 'c',
                to: 's',
                packet: 'ClientHello',
            },
            {
                title: 'Prove the server identity',
                caption:
                    'The server sends authentication information. The browser checks the certificate and handshake proof.',
                from: 's',
                to: 'c',
                packet: 'identity',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Derive traffic keys',
                caption: 'Both ends derive keys. These keys protect the following application data.',
                states: {
                    c: 'locked',
                    s: 'locked',
                },
            },
            {
                title: 'Send encrypted data',
                caption:
                    'An observer on the network sees encrypted traffic rather than the plaintext application message.',
                from: 'c',
                to: 's',
                packet: 'ciphertext',
                states: {
                    c: 'locked',
                    s: 'locked',
                },
                values: {
                    e: 'not plaintext',
                },
            },
            {
                title: 'Know the boundary',
                caption:
                    'A secure channel to a malicious service is still a secure channel to a malicious service.',
                states: {
                    s: 'locked',
                },
                values: {
                    s: 'channel ≠ trust',
                },
            },
        ],
        sourceHref: '/learn/sources#tls',
    },
    http: {
        id: 'http',
        question: 'What does the server promise in a response?',
        takeaway: 'Method, target, headers and status make the exchange meaningful.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
            {
                id: 'd',
                label: 'Resource /notes/7',
                kind: 'store',
                x: 300,
                y: -135,
            },
        ],
        links: [
            ['c', 's'],
            ['s', 'd'],
        ],
        beats: [
            {
                title: 'Name an action and target',
                caption: 'The method tells the intended operation. The target identifies the resource.',
                from: 'c',
                to: 's',
                packet: 'GET /notes/7',
            },
            {
                title: 'Read the representation',
                caption:
                    'A successful GET retrieves a representation; it is not a command to create another note.',
                from: 's',
                to: 'd',
                packet: 'read',
                states: {
                    d: 'active',
                },
            },
            {
                title: 'Respond with meaning',
                caption: 'The response includes a status and may include headers and a body.',
                from: 's',
                to: 'c',
                packet: '200 OK',
                states: {
                    c: 'done',
                },
            },
            {
                title: 'A missing resource',
                caption:
                    'This example assigns 404 when the target cannot be found. That differs from a broken server.',
                from: 's',
                to: 'c',
                packet: '404',
                states: {
                    d: 'failed',
                },
            },
            {
                title: 'A disallowed method',
                caption:
                    'For a known resource, a method that is not allowed receives 405 and an Allow header.',
                from: 's',
                to: 'c',
                packet: '405 + Allow',
                states: { d: 'done' },
                values: {
                    s: 'method mismatch',
                },
            },
        ],
        sourceHref: '/learn/sources#http',
    },
    'udp-quic': {
        id: 'udp-quic',
        question: 'Can one lost stream leave another moving?',
        takeaway:
            'QUIC has reliable streams over UDP; loss in one stream need not block ordered delivery in another.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'a',
                label: 'QUIC stream A',
                kind: 'queue',
                x: 145,
                y: -130,
            },
            {
                id: 'b',
                label: 'QUIC stream B',
                kind: 'queue',
                x: 145,
                y: 130,
            },
        ],
        links: [
            ['c', 'a'],
            ['c', 'b'],
        ],
        beats: [
            {
                title: 'Separate streams',
                caption: 'QUIC carries distinct reliable byte streams inside a connection.',
                states: {
                    a: 'active',
                    b: 'active',
                },
            },
            {
                title: 'Lose bytes from A',
                caption: 'A packet carrying some of stream A is lost. Those missing bytes need recovery.',
                from: 'c',
                to: 'a',
                packet: 'A: missing',
                lost: true,
                values: {
                    a: 'waiting',
                },
            },
            {
                title: 'B still arrives',
                caption: 'Data for stream B can be delivered when its own ordered bytes are available.',
                from: 'c',
                to: 'b',
                packet: 'B: data',
                states: {
                    b: 'done',
                },
                counts: {
                    b: 3,
                },
            },
            {
                title: 'Repair A',
                caption: 'Recovery supplies missing data for A. Reliability has not been removed.',
                from: 'c',
                to: 'a',
                packet: 'A: retry',
                states: {
                    a: 'done',
                },
                values: { a: 'bytes delivered' },
                counts: {
                    a: 3,
                },
            },
            {
                title: 'Share the network',
                caption:
                    'Streams still share connection-level resources and congestion control. Independence does not mean unlimited bandwidth.',
                states: {
                    a: 'done',
                    b: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#udp-quic',
    },
    'http-versions': {
        id: 'http-versions',
        question: 'Why can one missing packet delay several requests?',
        takeaway: 'HTTP/2 multiplexes over one TCP stream; HTTP/3 uses QUIC streams.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'a',
                label: 'TCP connection',
                kind: 'queue',
                x: 120,
                y: -120,
            },
            {
                id: 'b',
                label: 'QUIC streams',
                kind: 'queue',
                x: 120,
                y: 130,
            },
        ],
        links: [
            ['c', 'a'],
            ['c', 'b'],
        ],
        beats: [
            {
                title: 'Multiple responses',
                caption: 'A browser often fetches several resources. How they share a connection matters.',
                counts: {
                    c: 3,
                },
            },
            {
                title: 'HTTP/1.1 tradeoff',
                caption:
                    'HTTP/1.1 responses on one connection keep their order. Browsers may use several connections.',
                from: 'c',
                to: 'a',
                packet: 'responses',
                values: {
                    a: 'ordered replies',
                },
            },
            {
                title: 'HTTP/2 multiplexes',
                caption:
                    'HTTP/2 interleaves frames, but a gap in the underlying TCP byte stream can hold up delivery.',
                from: 'c',
                to: 'a',
                packet: 'TCP gap',
                lost: true,
                states: {
                    a: 'failed',
                },
                counts: {
                    a: 3,
                },
            },
            {
                title: 'HTTP/3 separates streams',
                caption: 'QUIC can deliver another stream while one stream waits for missing bytes.',
                from: 'c',
                to: 'b',
                packet: 'stream B',
                states: {
                    b: 'done',
                },
                counts: {
                    b: 2,
                },
            },
            {
                title: 'Choose the right claim',
                caption:
                    'HTTP/3 reduces this transport-level blocking; it cannot remove all delay or shared network limits.',
                values: {
                    b: 'not zero latency',
                },
            },
        ],
        sourceHref: '/learn/sources#http-versions',
    },
    'cloud-networking': {
        id: 'cloud-networking',
        question: 'How does a private server reach the internet?',
        takeaway: 'Routing chooses a next hop; NAT rewrites addresses. Neither replaces security policy.',
        nodes: [
            {
                id: 'c',
                label: 'Private app',
                kind: 'server',
                x: -250,
                y: 40,
            },
            {
                id: 'r',
                label: 'NAT gateway',
                kind: 'router',
                x: -50,
                y: -80,
            },
            {
                id: 's',
                label: 'Public service',
                kind: 'server',
                x: 230,
                y: 35,
            },
        ],
        links: [
            ['c', 'r'],
            ['r', 's'],
        ],
        beats: [
            {
                title: 'Start inside a private network',
                caption:
                    'A private address belongs inside the network. This example app has no public address.',
                values: {
                    c: '10.0.1.5',
                },
            },
            {
                title: 'Follow the route',
                caption: 'The subnet route sends outbound traffic toward a NAT gateway.',
                from: 'c',
                to: 'r',
                packet: 'outbound',
            },
            {
                title: 'Translate the source',
                caption: 'NAT substitutes a public source address and tracks the mapping.',
                from: 'r',
                to: 's',
                packet: 'public source',
                states: {
                    r: 'active',
                },
            },
            {
                title: 'Map the reply back',
                caption: 'The gateway uses its mapping to send the returning reply to the private app.',
                from: 's',
                to: 'r',
                packet: 'reply',
                states: {
                    r: 'done',
                },
            },
            {
                title: 'Keep policies separate',
                caption:
                    'A valid route and NAT mapping do not guarantee that firewall rules allow the traffic.',
                from: 'r',
                to: 'c',
                packet: 'mapped reply',
                states: {
                    c: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#cloud-networking',
    },
    'latency-throughput': {
        id: 'latency-throughput',
        question: 'Is finishing one request faster the same as serving more?',
        takeaway:
            'Latency measures time per operation; throughput measures completed operations per unit time.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'q',
                label: 'Waiting requests',
                kind: 'queue',
                x: -45,
                y: 65,
            },
            {
                id: 's',
                label: 'Worker',
                kind: 'server',
                x: 215,
                y: -35,
            },
        ],
        links: [
            ['c', 'q'],
            ['q', 's'],
        ],
        beats: [
            {
                title: 'Time one request',
                caption: 'Latency asks how long this request takes from start to finish.',
                from: 'c',
                to: 's',
                packet: 'request 1',
            },
            {
                title: 'Count completions',
                caption: 'Throughput asks how many requests finish in a time window.',
                counts: {
                    s: 3,
                },
                values: {
                    s: '3 completions',
                },
            },
            {
                title: 'Add more arrivals',
                caption: 'More incoming work can accumulate in a queue without increasing completions.',
                from: 'c',
                to: 'q',
                packet: 'arrivals',
                counts: {
                    q: 5,
                },
            },
            {
                title: 'Queueing adds delay',
                caption: 'A request waits before service begins. That wait contributes to its latency.',
                from: 'q',
                to: 's',
                packet: 'next request',
                counts: {
                    q: 4,
                },
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Measure both',
                caption: 'A system can have high throughput while some requests wait a long time.',
                counts: {
                    q: 4,
                    s: 3,
                },
                values: {
                    q: 'waiting',
                    s: 'completing',
                },
            },
        ],
        sourceHref: '/learn/sources#latency-throughput',
    },
    percentiles: {
        id: 'percentiles',
        question: 'Whose experience does an average hide?',
        takeaway:
            'A percentile describes a position in a sorted set; the slow tail still represents real requests.',
        nodes: [
            {
                id: 'c',
                label: 'Requests',
                kind: 'computer',
                x: -245,
                y: 20,
            },
            {
                id: 'q',
                label: 'Sorted durations',
                kind: 'queue',
                x: 5,
                y: 40,
            },
            {
                id: 's',
                label: 'Slowest request',
                kind: 'server',
                x: 245,
                y: -45,
            },
        ],
        links: [
            ['c', 'q'],
            ['q', 's'],
        ],
        beats: [
            {
                title: 'Collect individual times',
                caption: 'Each request has its own duration. Keep the individual measurements.',
                counts: {
                    c: 5,
                },
            },
            {
                title: 'Sort the sample',
                caption: 'Order the observed durations from fastest to slowest.',
                from: 'c',
                to: 'q',
                packet: '10 10 10 10 90',
                counts: {
                    q: 5,
                },
            },
            {
                title: 'Find the middle',
                caption:
                    'In this illustrative sample the median is 10 ms. It says little about the slowest request.',
                values: {
                    q: 'median: 10 ms',
                },
                counts: {
                    q: 5,
                },
            },
            {
                title: 'Inspect the tail',
                caption:
                    'One request took 90 ms. An average of 26 ms hides how different that experience was.',
                from: 'q',
                to: 's',
                packet: '90 ms',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'State the convention',
                caption:
                    'Percentile estimators differ. This course names its rank convention before computing a percentile.',
                values: {
                    q: 'sample ≠ population',
                },
            },
        ],
        sourceHref: '/learn/sources#percentiles',
    },
    'latency-numbers': {
        id: 'latency-numbers',
        question: 'Why can a small remote read feel slow?',
        takeaway:
            'Work includes access, transfer and waiting. Distance and bytes can matter as much as CPU work.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'm',
                label: 'Memory',
                kind: 'store',
                x: -110,
                y: -80,
            },
            {
                id: 'd',
                label: 'Disk',
                kind: 'store',
                x: 50,
                y: 100,
            },
            {
                id: 's',
                label: 'Remote host',
                kind: 'server',
                x: 270,
                y: -60,
            },
        ],
        links: [
            ['c', 'm'],
            ['c', 'd'],
            ['c', 's'],
        ],
        beats: [
            {
                title: 'Choose where the data lives',
                caption: 'A read can hit local memory, local storage or a remote machine.',
                states: {
                    c: 'active',
                },
            },
            {
                title: 'Local memory',
                caption: 'A local memory access avoids a network round trip. Exact costs depend on hardware.',
                from: 'c',
                to: 'm',
                packet: 'read',
                states: {
                    m: 'done',
                },
            },
            {
                title: 'Local storage',
                caption:
                    'Storage access introduces different access and transfer costs. Caching can change the path.',
                from: 'c',
                to: 'd',
                packet: 'read',
                states: {
                    d: 'active',
                },
            },
            {
                title: 'Across the network',
                caption: 'A remote read also pays for the network path and the remote work.',
                from: 'c',
                to: 's',
                packet: 'remote read',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Use measured inputs',
                caption:
                    'The animation timing is illustrative. Use measured access delay, bandwidth and size for a real estimate.',
                values: {
                    c: 'measure, then estimate',
                },
            },
        ],
        sourceHref: '/learn/sources#latency-numbers',
    },
    estimation: {
        id: 'estimation',
        question: 'How much work does one million requests a day imply?',
        takeaway: 'Keep units visible and separate an average from a peak.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'q',
                label: 'Requests per second',
                kind: 'queue',
                x: -15,
                y: 45,
            },
            {
                id: 's',
                label: 'Capacity estimate',
                kind: 'server',
                x: 245,
                y: -40,
            },
        ],
        links: [
            ['c', 'q'],
            ['q', 's'],
        ],
        beats: [
            {
                title: 'Start with an assumption',
                caption:
                    'Assume one million requests per day. This is an example workload, not a production measurement.',
                values: {
                    c: '1,000,000 / day',
                },
            },
            {
                title: 'Convert the time unit',
                caption: 'One day has 86,400 seconds. Divide requests per day by seconds per day.',
                from: 'c',
                to: 'q',
                packet: '÷ 86,400',
            },
            {
                title: 'Find the average',
                caption: 'The average is about 11.6 requests per second. Keep the unit in the answer.',
                values: {
                    q: '≈11.6 requests/s',
                },
            },
            {
                title: 'Allow for peaks',
                caption:
                    'Assume a peak ten times the average. The corresponding peak is about 116 requests per second.',
                from: 'q',
                to: 's',
                packet: '× 10 assumed',
                values: {
                    s: '≈116 requests/s',
                },
            },
            {
                title: 'Ask what is missing',
                caption:
                    'Real sizing also needs request cost, bytes, storage, availability requirements and measured headroom.',
                values: {
                    s: 'estimate ≠ guarantee',
                },
            },
        ],
        sourceHref: '/learn/sources#estimation',
    },
    'utilisation-queueing': {
        id: 'utilisation-queueing',
        question: 'Why does a busy service suddenly feel much slower?',
        takeaway: 'As arrivals approach service capacity, waiting can dominate.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'q',
                label: 'Queue',
                kind: 'queue',
                x: -5,
                y: 75,
            },
            {
                id: 's',
                label: 'One worker',
                kind: 'server',
                x: 230,
                y: -70,
            },
        ],
        links: [
            ['c', 'q'],
            ['q', 's'],
        ],
        beats: [
            {
                title: 'A worker has a limit',
                caption: 'This teaching example has one worker and a finite service rate.',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Work starts to collect',
                caption: 'When arrivals temporarily exceed departures, waiting work accumulates.',
                from: 'c',
                to: 'q',
                packet: 'arrivals',
                counts: {
                    q: 4,
                },
            },
            {
                title: 'Use spare capacity',
                caption: 'The worker drains work when service can keep up.',
                from: 'q',
                to: 's',
                packet: 'next job',
                counts: {
                    q: 3,
                },
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Do not confuse busy with stable',
                caption: 'Sustained arrivals above capacity keep growing this unbounded teaching queue.',
                counts: {
                    q: 8,
                },
                states: {
                    q: 'failed',
                },
                values: {
                    q: 'growing backlog',
                },
            },
            {
                title: 'Apply the right assumptions',
                caption:
                    'Little’s law relates long-run averages in a stable system: work in system equals arrival rate times time in system.',
                values: {
                    q: 'L = λ × W',
                },
            },
        ],
        sourceHref: '/learn/sources#utilisation-queueing',
    },
    'api-design': {
        id: 'api-design',
        question: 'How can two programs agree without sharing code?',
        takeaway: 'An API is a contract: callers rely on documented inputs, outputs and errors.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'r',
                label: 'API contract',
                kind: 'router',
                x: -10,
                y: 25,
            },
            {
                id: 's',
                label: 'App server',
                kind: 'server',
                x: 190,
                y: 35,
            },
        ],
        links: [
            ['c', 'r'],
            ['r', 's'],
        ],
        beats: [
            {
                title: 'Agree before calling',
                caption:
                    'An application programming interface, or API, specifies how one program can use another.',
                states: {
                    r: 'active',
                },
            },
            {
                title: 'Send a matching call',
                caption: 'The client supplies the promised method and target.',
                from: 'c',
                to: 'r',
                packet: 'GET /items/7',
                states: {
                    r: 'done',
                },
            },
            {
                title: 'Execute the operation',
                caption: 'The service handles the call according to its contract.',
                from: 'r',
                to: 's',
                packet: 'read item',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Return a documented result',
                caption: 'The caller can distinguish success from a documented error.',
                from: 's',
                to: 'c',
                packet: '200 + item',
                states: {
                    c: 'done',
                },
            },
            {
                title: 'Reject a mismatched method',
                caption: 'A disallowed method does not silently become a successful read.',
                from: 'r',
                to: 'c',
                packet: '405',
                states: {
                    r: 'failed',
                },
            },
        ],
        sourceHref: '/learn/sources#api-design',
    },
    rest: {
        id: 'rest',
        question: 'How do you change a note without inventing a new endpoint for every action?',
        takeaway: 'Model resources and use HTTP method semantics consistently.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 's',
                label: 'Notes API',
                kind: 'server',
                x: 80,
                y: 50,
            },
            {
                id: 'd',
                label: 'Resource /notes/7',
                kind: 'store',
                x: 280,
                y: -100,
            },
        ],
        links: [
            ['c', 's'],
            ['s', 'd'],
        ],
        beats: [
            {
                title: 'Name the resource',
                caption: 'A URI identifies the note. A representation is data describing its current state.',
                values: {
                    d: '/notes/7',
                },
            },
            {
                title: 'Read with GET',
                caption:
                    'GET requests the current representation. Reading must not be the operation that creates a second note.',
                from: 'c',
                to: 's',
                packet: 'GET /notes/7',
                states: {
                    d: 'done',
                },
            },
            {
                title: 'Replace with PUT',
                caption:
                    'PUT requests that this resource be created or replaced with the supplied representation.',
                from: 's',
                to: 'd',
                packet: 'PUT → new text',
                values: {
                    d: 'new text',
                },
            },
            {
                title: 'Repeat the same PUT',
                caption: 'Repeating an identical PUT has the same intended effect as sending it once.',
                from: 's',
                to: 'd',
                packet: 'PUT → new text',
                values: {
                    d: 'new text',
                },
            },
            {
                title: 'Respect the boundary',
                caption:
                    'Noun-shaped URLs alone do not satisfy all REST constraints. This film isolates resource and method semantics.',
                states: {
                    d: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#rest',
    },
    rpc: {
        id: 'rpc',
        question: 'What really happens when you call a function on another machine?',
        takeaway:
            'A remote call crosses a network and can fail even when a local function call would succeed.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 'r',
                label: 'Generated client stub',
                kind: 'router',
                x: -75,
                y: 80,
            },
            {
                id: 's',
                label: 'Inventory service',
                kind: 'server',
                x: 165,
                y: -50,
            },
            {
                id: 'd',
                label: 'Data store',
                kind: 'store',
                x: 290,
                y: -125,
            },
        ],
        links: [
            ['c', 'r'],
            ['r', 's'],
            ['s', 'd'],
        ],
        beats: [
            {
                title: 'Define the service',
                caption:
                    'A gRPC service definition names callable methods and the request and response types.',
                values: {
                    s: 'GetStock(Item)',
                },
            },
            {
                title: 'Call the stub',
                caption: 'Generated client code turns a typed call into a message for the remote service.',
                from: 'c',
                to: 'r',
                packet: 'GetStock(7)',
            },
            {
                title: 'Cross the network',
                caption:
                    'The serialized request reaches the service implementation. This boundary introduces network failure.',
                from: 'r',
                to: 's',
                packet: 'request bytes',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Return a typed response',
                caption:
                    'A unary call returns one response. Streaming methods can instead exchange sequences of messages.',
                from: 's',
                to: 'c',
                packet: 'Stock { count: 3 }',
                counts: {
                    d: 3,
                },
            },
            {
                title: 'Another call times out',
                caption:
                    'A deadline bounds how long the caller waits; expiration does not prove that no server-side work happened.',
                states: {
                    c: 'failed',
                },
                values: {
                    c: 'deadline exceeded',
                },
            },
        ],
        sourceHref: '/learn/sources#rpc',
    },
    graphql: {
        id: 'graphql',
        question: 'Can a screen ask for exactly the fields it needs?',
        takeaway: 'The query selects fields; the server still controls the schema and performs the work.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 's',
                label: 'GraphQL executor',
                kind: 'server',
                x: 0,
                y: 30,
            },
            {
                id: 'd',
                label: 'User data',
                kind: 'store',
                x: 250,
                y: -120,
            },
            {
                id: 'p',
                label: 'Posts data',
                kind: 'store',
                x: 250,
                y: 130,
            },
        ],
        links: [
            ['c', 's'],
            ['s', 'd'],
            ['s', 'p'],
        ],
        beats: [
            {
                title: 'Describe this screen',
                caption: 'The screen needs a user’s name and post titles, not every available field.',
                values: {
                    c: 'name + titles',
                },
            },
            {
                title: 'Send a shaped query',
                caption: 'The query selects nested fields from the schema.',
                from: 'c',
                to: 's',
                packet: 'user { name posts }',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'Resolve the user',
                caption: 'A resolver obtains the selected user fields.',
                from: 's',
                to: 'd',
                packet: 'name',
                states: {
                    d: 'done',
                },
            },
            {
                title: 'Resolve related data',
                caption:
                    'Nested fields can cause more backend work. One client request does not guarantee one database query.',
                from: 's',
                to: 'p',
                packet: 'post titles',
                counts: {
                    p: 3,
                },
            },
            {
                title: 'Return the selected shape',
                caption:
                    'The response follows the selected fields. Authorization and query cost still need server-side controls.',
                from: 's',
                to: 'c',
                packet: 'name + titles',
                states: {
                    c: 'done',
                },
            },
        ],
        sourceHref: '/learn/sources#graphql',
    },
    realtime: {
        id: 'realtime',
        question: 'How does a screen learn about a change without refreshing?',
        takeaway: 'Choose the direction of communication before choosing a realtime transport.',
        nodes: [
            {
                id: 'c',
                label: 'Your browser',
                kind: 'computer',
                x: -265,
                y: 30,
            },
            {
                id: 's',
                label: 'Update service',
                kind: 'server',
                x: 100,
                y: 15,
            },
            {
                id: 'd',
                label: 'New event',
                kind: 'store',
                x: 285,
                y: -115,
            },
        ],
        links: [
            ['c', 's'],
            ['s', 'd'],
        ],
        beats: [
            {
                title: 'Polling asks again',
                caption:
                    'With polling, the client repeatedly requests the latest state. An update can wait until the next poll.',
                from: 'c',
                to: 's',
                packet: 'anything new?',
            },
            {
                title: 'A change happens',
                caption: 'The server receives a new event after the previous poll has finished.',
                from: 'd',
                to: 's',
                packet: 'new update',
                states: {
                    s: 'active',
                },
            },
            {
                title: 'SSE pushes to the client',
                caption: 'Server-sent events carry a stream of server-to-client events over HTTP.',
                from: 's',
                to: 'c',
                packet: 'data: update',
                states: {
                    c: 'done',
                },
            },
            {
                title: 'WebSocket goes both ways',
                caption: 'After connection setup, either endpoint can send WebSocket messages.',
                from: 'c',
                to: 's',
                packet: 'client message',
                states: {
                    s: 'done',
                },
            },
            {
                title: 'Plan reconnects',
                caption:
                    'Connections can break. Application recovery still needs a policy for missed or repeated events.',
                states: {
                    c: 'failed',
                },
                values: {
                    c: 'reconnect + recover',
                },
            },
        ],
        sourceHref: '/learn/sources#realtime',
    },
};
