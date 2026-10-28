import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import SubnetGate from '@/components/learn/cloud-networking/SubnetGate';
import CourseShell from '@/components/learn/CourseShell';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import {
    CLOUD_NETWORKING_SOURCE_NUMBER as SOURCE_NUMBER,
    CLOUD_NETWORKING_SOURCES as SOURCES,
} from '@/content/learn/cloud-networking-sources';
import {
    HOP,
    NAT_ADDRESS,
    OUTSIDE_ADDRESS,
    PRIVATE_ADDRESS,
    PUBLIC_ADDRESS,
} from '@/lib/learn/cloud-networking-model';

/**
 * Chapter 10, cloud-networking: one packet body, and which yard it is allowed
 * to enter. Learner-facing page for `docs/system-design/chapters/cloud-networking.md`.
 */

export const metadata: Metadata = {
    title: 'Public and private subnets',
    description:
        'System design, chapter 10: a packet from outside can reach the public subnet, the same kind of packet stops at the private boundary, and a private machine reaches outside only through one NAT door.',
    alternates: { canonical: '/learn/cloud-networking' },
};

const C = citeFor('cloud-networking', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 10' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 10 · Stage 1, Foundations"
                    title="Public and private subnets"
                    lede="A packet from the street can reach the machine in the open yard. The same kind of packet, aimed at the machine behind the wall, stops. A machine behind the wall reaches the street only through one door, and the reply comes back through that door."
                />

                <ChapterTabs
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="stop">The body that does not go in</h2>
                                <p>
                                    Watch the body. It leaves the street aimed at the machine behind the wall.
                                    It stops. It does not go in.
                                </p>
                            </div>
                            <SubnetGate pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    The machine behind the wall is {PRIVATE_ADDRESS}. That address sits in
                                    192.168.0.0/16, one of three blocks reserved for private internets:
                                    10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16{' '}
                                    <C ids={['rfc1918']} at="§3" />. A private host can communicate with other
                                    hosts inside the enterprise. It cannot have IP connectivity to a host
                                    outside the enterprise, though it can still reach external services
                                    through a mediating gateway <C ids={['rfc1918']} at="§3" />. Because
                                    private addresses have no global meaning, packets with a private source or
                                    destination should not be forwarded across inter-enterprise links{' '}
                                    <C ids={['rfc1918']} at="§3" />.
                                </p>
                                <p>
                                    This run draws that as one stop. The body aimed at {PRIVATE_ADDRESS} ends
                                    stopped at the boundary. Routers that connect an enterprise to an outside
                                    network should filter packets and routes at both ends of the link{' '}
                                    <C ids={['rfc1918']} at="§5" />. The memo does not name this one wall as
                                    the only place a filter can sit. Stopping here is this model&apos;s rule.
                                    One way to lay the network out is to plan public subnets where outside
                                    connectivity is needed, and to keep public and private subnets on separate
                                    media <C ids={['rfc1918']} at="§5" />. The open yard and the walled yard
                                    are those two subnets in this picture.
                                </p>
                                <p>
                                    The machine in the open yard is {PUBLIC_ADDRESS} (TEST-NET-1). The host on
                                    the street is {OUTSIDE_ADDRESS} (TEST-NET-3). The door&apos;s outside
                                    address, used when a private machine goes out, is {NAT_ADDRESS}{' '}
                                    (TEST-NET-2). Those three blocks are for documentation{' '}
                                    <C ids={['rfc5737']} at="§3" />. They should not appear on the public
                                    Internet <C ids={['rfc5737']} at="§4" />. A public host uses globally
                                    unique space from a registry <C ids={['rfc1918']} at="§3" />. This page
                                    has no registry address, so the open yard uses TEST-NET-1, and the model
                                    lets a body aimed at it arrive. That arrival is the model&apos;s rule
                                    about the open yard, not a claim that TEST-NET-1 is routed. The hop is{' '}
                                    {HOP} ticks. That duration is assumed.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="trips">Three trips</h2>
                                <p>
                                    Choose the public machine, the private machine, or the private machine
                                    going out through NAT. Say whether the body arrives. The yards stay still
                                    until you press Run.
                                </p>
                            </div>
                            <SubnetGate pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    A public host can have IP connectivity to public hosts outside the
                                    enterprise <C ids={['rfc1918']} at="§3" />. In this model the body aimed
                                    at {PUBLIC_ADDRESS} ends in the public subnet. The same kind of body aimed
                                    at {PRIVATE_ADDRESS} still stops at the boundary.
                                </p>
                                <p>
                                    Traditional NAT lets hosts on a private network reach hosts outside, in
                                    most cases. Sessions are uni-directional, outbound from the private
                                    network. A session the other way may be allowed with a static address map
                                    for a chosen host <C ids={['rfc3022']} at="§2" />. This model has no
                                    static map, so the unsolicited body still stops. That drop is the
                                    model&apos;s rule. On the way out, Basic NAT translates the source
                                    address, and packets on the return path go through the same kind of
                                    translation <C ids={['rfc3022']} at="§2.1" />. Every request and response
                                    of a session has to pass the same NAT router{' '}
                                    <C ids={['rfc3022']} at="§1" />. This picture has one door. The reply ends
                                    in the private subnet. The door&apos;s outside address here is{' '}
                                    {NAT_ADDRESS}, a documentation address, not an address from the examples
                                    in that RFC. NAPT, which also translates a port{' '}
                                    <C ids={['rfc3022']} at="§2.2" />, is not drawn. A private host talking to
                                    another host inside the same enterprise <C ids={['rfc1918']} at="§3" /> is
                                    not drawn either. Each hop is {HOP} ticks, assumed.
                                </p>
                            </div>
                        </>
                    }
                    quiz={
                        <>
                            <div className="ln-prose">
                                <h2>Check yourself</h2>
                                <p>Answer before you open the explanation.</p>
                            </div>
                            <Question
                                n={1}
                                ask={`The body has stopped against the wall and has not gone through the door. Did it arrive at ${PRIVATE_ADDRESS}?`}
                            >
                                <p>
                                    No. Its place is stopped at the boundary. Packets with a private
                                    destination should not be forwarded across inter-enterprise links{' '}
                                    <C ids={['rfc1918']} at="§3" />. This model stops this one at the
                                    boundary. A static map can allow an inbound session{' '}
                                    <C ids={['rfc3022']} at="§2" />, and this run does not draw one, so the
                                    stop is not a proof that every inbound packet is dropped.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="The private machine sends a body out through the door. Where does the reply come back?"
                            >
                                <p>
                                    Through the same NAT door, into the private subnet. Requests and responses
                                    of a session have to use the same NAT router{' '}
                                    <C ids={['rfc3022']} at="§1" />. On a return path, the translation is the
                                    same kind as on the way out <C ids={['rfc3022']} at="§2.1" />.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask={`The body aimed at ${PUBLIC_ADDRESS} has finished. Where is it?`}
                            >
                                <p>
                                    In the public subnet. It arrived. {PUBLIC_ADDRESS} is TEST-NET-1, a
                                    documentation address <C ids={['rfc5737']} at="§3" />, used here as the
                                    open yard&apos;s machine. A public host can have connectivity to public
                                    hosts outside the enterprise <C ids={['rfc1918']} at="§3" />. The arrival
                                    is this model&apos;s rule about that yard. {PUBLIC_ADDRESS} is not a claim
                                    that TEST-NET-1 is routed on the Internet <C ids={['rfc5737']} at="§4" />.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Point at the body and say whether it is outside, in the public subnet, stopped at
                            the boundary, through the NAT, or in the private subnet.
                        </li>
                        <li>
                            Say that, in this model, an unsolicited body from outside reaches the public
                            machine and stops at the boundary of the private machine.
                        </li>
                        <li>
                            Say that a private machine reaches the outside only through the one NAT door, and
                            that the reply comes back through that door.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#cloud-networking">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 11, <Link href="/learn/latency-throughput">Latency and throughput</Link>.
                        Previous:
                        <Link href="/learn/ip-and-ports">chapter 3</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
