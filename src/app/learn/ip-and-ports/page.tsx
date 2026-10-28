import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Cite from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import DatagramLab from '@/components/learn/ip-and-ports/DatagramLab';
import DemuxLab from '@/components/learn/ip-and-ports/DemuxLab';
import HostDrawing from '@/components/learn/ip-and-ports/HostDrawing';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import {
    IP_PORTS_SOURCE_NUMBER as SOURCE_NUMBER,
    IP_PORTS_SOURCES as SOURCES,
} from '@/content/learn/ip-and-ports-sources';

/**
 * Chapter 3, ip-and-ports: how an address and a port bring a packet to one program on one machine, and what can
 * happen to packets on the way. Learner-facing text for `docs/system-design/chapters/ip-and-ports.md`. The figures
 * (assets A1–A3) carry the mechanism; the text names and qualifies what they show. Factual claims cite a source that
 * was read; judgements are labelled.
 */

export const metadata: Metadata = {
    title: 'Addresses, packets and ports',
    description:
        'System design, chapter 3: how an IP address and a port bring a packet to one program on one machine, and why packets can be lost, duplicated or reordered — with UDP and TCP compared.',
    alternates: { canonical: '/learn/ip-and-ports' },
};

const TITLES: Record<string, string> = Object.fromEntries(SOURCES.map((s) => [s.id, s.title]));

function C({ ids, at }: { ids: string[]; at?: string }): React.JSX.Element {
    return <Cite ids={ids} at={at} numbers={SOURCE_NUMBER} titles={TITLES} />;
}

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 3' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 3 · Stage 1, Foundations"
                    title="Addresses, packets and ports"
                    lede="A server machine runs several programs, and packets arrive for all of them. Build packets below and watch which program gets each one, then see what the network can do to packets on the way."
                />

                <div className="ln-prose">
                    <h2 id="goals">By the end you can</h2>
                    <ol>
                        <li>
                            Predict which program on a machine receives a packet, from its address, protocol
                            and port, or what comes back when none does.
                        </li>
                        <li>
                            Explain why two connections from the same machine to the same server port stay
                            separate.
                        </li>
                        <li>
                            Say why packets can be lost, duplicated or reordered, and what an application
                            reads over UDP and over TCP when they are.
                        </li>
                        <li>Tell a name from an address from a port.</li>
                    </ol>

                    <h2 id="machine">One machine, several programs</h2>
                    <p>
                        A <strong>name</strong> says what we seek, an <strong>address</strong> where it is{' '}
                        <C ids={['rfc791']} at="§2.3" />. An IP address identifies a machine&rsquo;s{' '}
                        <strong>interface</strong>, its connection to a network: 32 bits in IPv4{' '}
                        <C ids={['rfc791']} at="§3.1" />, 128 bits in IPv6 <C ids={['rfc4291']} at="§2" />.
                        Inside the machine, a <strong>port</strong>, a number within TCP or within UDP, picks
                        the program. Every address and name on this page is reserved for examples{' '}
                        <C ids={['rfc5737']} at="§3" /> <C ids={['rfc2606']} at="§3" />.
                    </p>
                </div>

                <figure className="bp-sheet ln-fig" aria-labelledby="fig1-h">
                    <div className="ln-fig-head">
                        <span id="fig1-h">Fig. 1 · Name, address, port, program</span>
                        <span>A picture of the idea, not a real host</span>
                    </div>
                    <div className="ln-fig-grid">
                        <HostDrawing />
                        <dl className="ln-out">
                            <div>
                                <dt>Name www.example.com</dt>
                                <dd>what we seek</dd>
                            </div>
                            <div>
                                <dt>Address 203.0.113.10</dt>
                                <dd>where it is: which machine</dd>
                            </div>
                            <div>
                                <dt>TCP or UDP</dt>
                                <dd>which transport</dd>
                            </div>
                            <div>
                                <dt>Port 443, 8125</dt>
                                <dd>which program</dd>
                            </div>
                            <div>
                                <dt>Port 9000</dt>
                                <dd>nobody</dd>
                            </div>
                        </dl>
                    </div>
                    <figcaption className="ln-label mt-4">
                        One server. Its web server waits on TCP port 443, the default for https{' '}
                        <C ids={['rfc9110']} at="§4.2.2" />; a metrics collector on UDP port 8125 (an assumed
                        example). TCP 443 and UDP 443 are different ports: each protocol has its own numbers.
                        This server offers nothing on UDP 443; a server that also speaks HTTP/3, which runs
                        over UDP, would <C ids={['rfc9114']} at="§3.1" /> (chapter udp-quic).
                    </figcaption>
                </figure>

                <div className="ln-prose">
                    <h2 id="demux">Which program gets the packet?</h2>
                    <p>
                        A packet carries five things the host needs: the protocol, and a source and
                        destination address and port. The host reads them in stages: the address (is it for
                        me?), the IP header&rsquo;s protocol field (TCP or UDP?){' '}
                        <C ids={['rfc791']} at="§3.1" />, then a lookup inside that protocol{' '}
                        <C ids={['rfc9293']} at="§2.2" />. Try source port 50001, then 50002, then 50003, all
                        to TCP 443; then UDP 443; then port 9000 with the firewall off and on.
                    </p>
                </div>

                <DemuxLab />

                <div className="ln-prose">
                    <p>
                        <strong>What the steps showed.</strong> A TCP connection is named by a pair of
                        sockets, an address with a port at each end <C ids={['rfc9293']} at="§3.4.1, §4" />.
                        Connections 1 and 2 share the client&rsquo;s address and the server&rsquo;s address
                        and port; only their source ports differ (50001, 50002, from the range kept for this{' '}
                        <C ids={['rfc6335']} at="§6" />
                        ), and that is enough to keep them apart. A packet that opens a connection reaches the
                        program&rsquo;s <strong>listening</strong> socket{' '}
                        <C ids={['rfc9293']} at="§3.9.1.1" />, and TCP sets the new connection up before the
                        program gets it (chapter tcp). UDP has no connections: in this model the program on
                        the port gets every datagram, whatever its source port.
                    </p>
                    <p>
                        <strong>Nobody there.</strong> TCP answers a packet for a connection that does not
                        exist with a reset <C ids={['rfc9293']} at="§3.5.2" />; for UDP, the host{' '}
                        <em>should</em> send back ICMP Port Unreachable <C ids={['rfc1122']} at="§4.1.3.1" />.
                        A firewall, if there is one, acts first, at the edge: it drops whatever its rule says,
                        used port or not, and sends nothing back. So no answer proves nothing, and an answer
                        only shows what the rule let through.
                    </p>
                    <p>
                        <strong>Not a user, not a request, not a tab.</strong> An address and port name an
                        interface and an endpoint. Users, sessions and requests live higher up, in chapters 1
                        and 2. One connection can carry many HTTP requests one after another{' '}
                        <C ids={['rfc9112']} at="§9.3" />, and an HTTP/3 client should avoid opening several
                        connections with the same settings to one server <C ids={['rfc9114']} at="§3.3" />, so
                        two browser tabs may well share one connection; telling their requests apart is then
                        HTTP&rsquo;s job (chapter http-versions).
                    </p>

                    <h2 id="packets">What happens on the way</h2>
                    <p>
                        IP carries each datagram on its own, with no acknowledgements, no retransmission and
                        nothing that keeps them in order <C ids={['rfc791']} at="§1.2, §1.4" />. UDP adds
                        ports but no guarantees <C ids={['rfc768']} at="Introduction" />: a datagram can be
                        lost, arrive twice, or arrive after later ones, for example when routes change{' '}
                        <C ids={['rfc8085']} at="§3.3" />. TCP numbers every byte, resends what is lost, and
                        hands the application an in-order stream <C ids={['rfc9293']} at="§2.2, §3.4" />. The
                        network still loses, delays and copies packets under TCP; TCP recovers in the two end
                        hosts. Predict first, then compare UDP with TCP for the same event.
                    </p>
                </div>

                <DatagramLab />

                <div className="ln-prose">
                    <p>
                        <strong>The trade.</strong> With datagram 3 lost, UDP hands over 1 2 4 5 by tick 6;
                        TCP hands over all five, in order, but 4 and 5 wait in the host until 3 is resent, so
                        the last read moves to tick 11. Order and completeness cost waiting after a gap. An
                        application on UDP that needs order or completeness has to build it itself{' '}
                        <C ids={['rfc8085']} at="§3.3" />.
                    </p>
                    <p>
                        <strong>Choosing (judgement).</strong> TCP suits data that must arrive whole and in
                        order and can wait: pages, files, database queries. UDP suits data that is useless
                        when late, or applications with their own recovery. Picking UDP &ldquo;for
                        speed&rdquo; without a plan for loss, repeats and order moves the problem, it does not
                        remove it.
                    </p>

                    <h2 id="practice">Check yourself</h2>
                    <Question
                        n={1}
                        ask="Which part of the packet tells the host to hand it to TCP rather than UDP?"
                    >
                        <p>
                            The IP header&rsquo;s protocol field <C ids={['rfc791']} at="§3.1" />. Not the
                            port: a port means something only inside TCP or UDP, which is why TCP 443 and UDP
                            443 are different.
                        </p>
                    </Question>
                    <Question
                        n={2}
                        ask="198.51.100.7:50002 sends TCP to 203.0.113.10:443. Which connection receives it, and why not the listening socket?"
                    >
                        <p>
                            The connection whose other end is 198.51.100.7:50002 (connection 2 in Fig. 2). The
                            listener takes only new connections; an open connection is matched by its pair of
                            sockets first.
                        </p>
                    </Question>
                    <Question
                        n={3}
                        ask="Datagram 3 of 5 is lost, over TCP. What does the application read, and what does it cost?"
                    >
                        <p>
                            1 2 3 4 5, in order. The cost is time: 4 and 5 arrive but wait until 3 is resent.
                            &ldquo;1 2 4 5&rdquo; is what UDP gives.
                        </p>
                    </Question>

                    <h2 id="exercise">Exercise</h2>
                    <p>
                        A database server listens on TCP 5432 and has one open connection, from
                        198.51.100.7:50010. A log collector listens on UDP 514 (an assumed example). No
                        firewall. Where do these go: (a) TCP from 198.51.100.7:50010 to port 5432; (b) TCP
                        from 198.51.100.7:50011 to port 5432, opening a new connection; (c) UDP to port 5432?
                        Work through the stages of Fig. 2 for each.
                    </p>
                    <details className="ln-q">
                        <summary>Show the worked answer</summary>
                        <ol>
                            <li>
                                (a) The database, on the existing connection: the pair of sockets matches.
                            </li>
                            <li>
                                (b) The database&rsquo;s listening socket: no open connection matches 50011,
                                the packet opens one, and TCP sets it up. (Had it claimed to belong to a
                                connection that does not exist, TCP would answer with a reset{' '}
                                <C ids={['rfc9293']} at="§3.5.2" />
                                .)
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
                            Explain to a friend how a server keeps two connections from the same laptop apart,
                            and why that does not mean each browser tab has its own connection.
                        </li>
                        <li>
                            A load balancer that spreads connections over several servers has to recognise
                            which packets belong to which connection. Which five fields would it look at?
                        </li>
                    </ul>

                    <h2 id="sources">Sources</h2>
                    <p>
                        Each source&rsquo;s cited parts were read. The RFCs were read in their published text
                        from Ubuntu&rsquo;s doc-rfc package (January 2023 snapshot), because rfc-editor.org
                        was unreachable; their status (none is obsoleted) is as of that snapshot. Links point
                        to the published versions.
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
