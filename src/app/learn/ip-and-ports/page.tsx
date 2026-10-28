import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Cite from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import HostExplorer, { type Part } from '@/components/learn/ip-and-ports/HostExplorer';
import { DemuxLabLazy, NetworkLabLazy } from '@/components/learn/ip-and-ports/LazyLabs';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import {
    IP_PORTS_SOURCE_NUMBER as SOURCE_NUMBER,
    IP_PORTS_SOURCES as SOURCES,
} from '@/content/learn/ip-and-ports-sources';

/**
 * Chapter 3, ip-and-ports: how an address and a port bring a packet to one program on one machine, and what the
 * network can do to packets on the way. Learner-facing page for `docs/system-design/chapters/ip-and-ports.md`.
 * The figures (A1–A3) carry the mechanism; the text states the rules, sources and limits beside them.
 */

export const metadata: Metadata = {
    title: 'Addresses, packets and ports',
    description:
        'System design, chapter 3: explore how an address, a protocol and a port bring a packet to one program, then break a small network and watch what UDP and TCP make of lost and reordered packets.',
    alternates: { canonical: '/learn/ip-and-ports' },
};

const TITLES: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.id, s.title]));

function C({ ids, at }: { ids: string[]; at?: string }): React.JSX.Element {
    return <Cite ids={ids} at={at} numbers={SOURCE_NUMBER} titles={TITLES} />;
}

/** What the reader sees until a figure's code has loaded (and without JavaScript). */
function Waiting({ n, title, what }: { n: number; title: string; what: string }): React.JSX.Element {
    return (
        <figure className="bp-sheet ln-fig ln-fig-wait" aria-labelledby={`fig${n}-h`}>
            <div className="ln-fig-head">
                <span id={`fig${n}-h`}>
                    Fig. {n} · {title}
                </span>
                <span>Interactive figure</span>
            </div>
            <p className="ln-frame">{what}</p>
        </figure>
    );
}

const ROLES: Record<Part, React.ReactNode> = {
    name: (
        <p className="m-0">
            <strong>What we seek.</strong> A name such as www.example.com says what we want, an address where
            it is <C ids={['rfc791']} at="§2.3" />; a lookup turns one into the other (chapter 4). Example
            names are reserved for this <C ids={['rfc2606']} at="§3" />.
        </p>
    ),
    address: (
        <p className="m-0">
            <strong>Which machine.</strong> 203.0.113.10 identifies one interface of one machine: 32 bits in
            IPv4 <C ids={['rfc791']} at="§3.1" />, 128 in IPv6 <C ids={['rfc4291']} at="§2" />. Every address
            here is reserved for examples <C ids={['rfc5737']} at="§3" />.
        </p>
    ),
    protocol: (
        <p className="m-0">
            <strong>Which transport.</strong> The IP header&rsquo;s protocol field says whether the packet is
            for TCP or UDP <C ids={['rfc791']} at="§3.1" />. Each has its own set of ports.
        </p>
    ),
    port: (
        <p className="m-0">
            <strong>Which program, within one protocol.</strong> TCP 443 is the default for https{' '}
            <C ids={['rfc9110']} at="§4.2.2" />. UDP 443 is a different port, unused here; a server that also
            speaks HTTP/3 would use it <C ids={['rfc9114']} at="§3.1" />. An address with a port is a socket{' '}
            <C ids={['rfc9293']} at="§4" />.
        </p>
    ),
    program: (
        <p className="m-0">
            <strong>Who receives it.</strong> The process that owns the socket: a web server on TCP 443, a
            metrics collector on UDP 8125 (an assumed example). Nobody owns 9000.
        </p>
    ),
};

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 3' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 3 · Stage 1, Foundations"
                    title="Addresses, packets and ports"
                    lede="Three numbers bring a packet to one program on one machine, and the network may still lose it or reorder it. Explore the parts, send packets into a server, then break a network and see what UDP and TCP make of it."
                />

                <div className="ln-prose">
                    <h2 id="goals">By the end you can</h2>
                    <ol>
                        <li>Predict which program receives a packet, or what comes back when none does.</li>
                        <li>
                            Explain why two connections from one machine to the same server port never mix.
                        </li>
                        <li>
                            Explain how loss and reordering happen, and what UDP and TCP give the application.
                        </li>
                        <li>Tell a name from an address from a port.</li>
                    </ol>
                    <h2 id="machine">One machine, several programs</h2>
                    <p>Select each part to see where it sits and what it answers.</p>
                </div>

                <HostExplorer roles={ROLES} />

                <div className="ln-prose">
                    <h2 id="demux">Which program gets the packet?</h2>
                    <p>
                        Send a packet into the server. Predict, press Run, then step: the host checks the
                        address, a firewall rule if there is one, the protocol field, then looks up the port{' '}
                        <C ids={['rfc9293']} at="§2.2" />. Try source ports 50001, 50002 and 50003 to TCP 443;
                        then UDP 443; then port 9000 with the firewall off and on.
                    </p>
                </div>

                <DemuxLabLazy
                    fallback={
                        <Waiting
                            n={2}
                            title="Which program gets this packet?"
                            what="A packet passes the server's checks one by one, and you watch where it lands. The figure loads as you reach it."
                        />
                    }
                />

                <div className="ln-prose">
                    <ul>
                        <li>
                            <strong>Two connections, one difference.</strong> A connection is named by its
                            pair of sockets <C ids={['rfc9293']} at="§3.4.1" />: 50001 and 50002 (from the
                            range kept for such ports <C ids={['rfc6335']} at="§6" />) share every other
                            number, and that is enough to keep them apart. A packet that opens a connection
                            goes to the listening socket <C ids={['rfc9293']} at="§3.9.1.1" />.
                        </li>
                        <li>
                            <strong>Nobody there.</strong> TCP answers with a reset{' '}
                            <C ids={['rfc9293']} at="§3.5.2" />; for UDP the host <em>should</em> send ICMP
                            Port Unreachable <C ids={['rfc1122']} at="§4.1.3.1" />. A firewall drops whatever
                            its rule says, used port or not, so silence proves nothing.
                        </li>
                        <li>
                            <strong>Not a user, not a tab.</strong> One connection can carry many requests{' '}
                            <C ids={['rfc9112']} at="§9.3" />, and an HTTP/3 client should avoid duplicate
                            connections to one server <C ids={['rfc9114']} at="§3.3" />, so browser tabs may
                            share one; telling their requests apart is HTTP&rsquo;s job (chapter
                            http-versions).
                        </li>
                    </ul>

                    <h2 id="packets">What happens on the way</h2>
                    <p>
                        IP carries each datagram on its own, with no acknowledgements, no retransmission and
                        nothing that keeps datagrams in order <C ids={['rfc791']} at="§1.2, §1.4" />. Break
                        the network: change a route, cut a link or slow one down, and compare what each
                        transport hands the application.
                    </p>
                </div>

                <NetworkLabLazy
                    fallback={
                        <Waiting
                            n={3}
                            title="Five datagrams through a network"
                            what="Five packets cross a small network while a route changes, a link fails or a queue builds, and you watch what the application reads. The figure loads as you reach it."
                        />
                    }
                />

                <div className="ln-prose">
                    <ul>
                        <li>
                            <strong>Order changes when paths do.</strong> After the route change, packet 2
                            takes the short path while 1 is still on the long one, and arrives first. Routing
                            changes are one way this happens <C ids={['rfc8085']} at="§3.3" />.
                        </li>
                        <li>
                            <strong>Loss happens where a packet cannot be forwarded.</strong> UDP hands the
                            gap to the application <C ids={['rfc768']} at="Introduction" />. TCP resends and
                            delivers bytes in order <C ids={['rfc9293']} at="§2.2, §3.4" />, so 4 and 5 wait
                            for 2 and 3: the last read moves from tick 15 to tick 23.
                        </li>
                        <li>
                            <strong>Congestion delays but keeps order</strong> on one first-in-first-out link
                            (a model choice). When packets arrive every 2 ticks and the link needs 3, each
                            waits longer than the last: arrivals outpace service, and the queue grows.
                        </li>
                        <li>
                            <strong>Choosing (judgement).</strong> TCP for data that must arrive whole and in
                            order and can wait; UDP for data that is useless when late, or with the
                            application&rsquo;s own recovery <C ids={['rfc8085']} at="§3.3" />.
                        </li>
                    </ul>

                    <h2 id="practice">Check yourself</h2>
                    <Question
                        n={1}
                        ask="Which part of the packet tells the host to hand it to TCP rather than UDP?"
                    >
                        <p>
                            The IP header&rsquo;s protocol field <C ids={['rfc791']} at="§3.1" />. Not the
                            port: a port means something only inside TCP or UDP, which is why TCP 443 and UDP
                            443 differ.
                        </p>
                    </Question>
                    <Question
                        n={2}
                        ask="198.51.100.7:50002 sends TCP to 203.0.113.10:443. Which connection receives it, and why not the listening socket?"
                    >
                        <p>
                            Connection 2, whose other end is 198.51.100.7:50002. Open connections are matched
                            by their pair of sockets first; the listening socket takes only new connections.
                        </p>
                    </Question>
                    <Question
                        n={3}
                        ask="A link fails and packets 2 and 3 are dropped. Over TCP, what does the application read, and when?"
                    >
                        <p>
                            1 2 3 4 5, in order, but 4 and 5 arrive early and wait until 2 and 3 are resent
                            and arrive: tick 23 in Fig. 3. Over UDP it reads 1 4 5.
                        </p>
                    </Question>

                    <h2 id="exercise">Exercise</h2>
                    <p>
                        A database listens on TCP 5432 and has one open connection, from 198.51.100.7:50010. A
                        log collector listens on UDP 514 (an assumed example). No firewall. Work through Fig.
                        2&rsquo;s stages for: (a) TCP from 198.51.100.7:50010 to 5432; (b) TCP from
                        198.51.100.7:50011 to 5432, opening a connection; (c) UDP to 5432.
                    </p>
                    <details className="ln-q">
                        <summary>Show the worked answer</summary>
                        <ol>
                            <li>(a) The database, on the open connection: the pair of sockets matches.</li>
                            <li>
                                (b) The database&rsquo;s listening socket: no connection matches 50011 and the
                                packet opens one, so TCP sets it up.
                            </li>
                            <li>
                                (c) Nobody: no UDP socket on 5432. The host should send ICMP Port Unreachable{' '}
                                <C ids={['rfc1122']} at="§4.1.3.1" />.
                            </li>
                        </ol>
                    </details>

                    <h2 id="own-words">In your own words, and elsewhere</h2>
                    <ul>
                        <li>
                            Explain how a server keeps two connections from the same laptop apart, and why
                            that does not mean each browser tab has its own connection.
                        </li>
                        <li>
                            A load balancer that spreads connections over servers must keep each
                            connection&rsquo;s packets together. Which five fields would it look at?
                        </li>
                    </ul>

                    <h2 id="sources">Sources</h2>
                    <p>
                        Each source&rsquo;s cited parts were read. The RFCs were read in their published text
                        from Ubuntu&rsquo;s doc-rfc package (January 2023 snapshot), because rfc-editor.org
                        was unreachable; their status (none is obsoleted) is as of that snapshot.
                    </p>
                    <ol className="ln-sources">
                        {SOURCES.map((s) => (
                            <li key={s.id} id={`src-${s.id}`}>
                                <a href={s.url} rel="noreferrer">
                                    {s.title}
                                </a>
                                . {s.publisher}. <span className="ln-note">Read from {s.read}.</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 4, <strong>DNS: from names to addresses</strong>, is planned and not written
                        yet. Previous: <Link href="/learn/client-server">chapter 2</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
