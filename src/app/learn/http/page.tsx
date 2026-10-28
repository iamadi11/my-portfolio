import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import HttpExchange from '@/components/learn/http/HttpExchange';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import { HTTP_SOURCE_NUMBER as SOURCE_NUMBER, HTTP_SOURCES as SOURCES } from '@/content/learn/http-sources';

/**
 * Chapter 7, http: one resource, one message. A request is a method, a target, and
 * header fields. A response is a status code and header fields. Learner-facing page
 * for `docs/system-design/chapters/http.md`.
 */

export const metadata: Metadata = {
    title: 'HTTP: methods, status codes and headers',
    description:
        'System design, chapter 7: one stored representation, a request of method, target, and header fields, and a response of status code and header fields.',
    alternates: { canonical: '/learn/http' },
};

const C = citeFor('http', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 7' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 7 · Stage 1, Foundations"
                    title="HTTP: methods, status codes and headers"
                    lede="One representation sits in one slot. The message that visits it is a request on the way in and a response on the way back."
                />

                <ChapterTabs
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="found">The plate stays</h2>
                                <p>
                                    Watch a GET for a target that already has a representation. The cartridge
                                    leaves the nest, sits at the slot, and comes back lit. The plate in the
                                    slot is the same one that was there at the start.
                                </p>
                            </div>
                            <HttpExchange pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A client sends a request message with a method and a request target. That
                                    request might also contain header fields. A server answers with a response
                                    message that includes a status code, and the response might also contain
                                    header fields <C ids={['rfc9110']} at="§3.4" />. Header fields are the
                                    fields sent before the content <C ids={['rfc9110']} at="§6.3" />. The
                                    method and the request target are control data, as are the status code and
                                    the protocol version on a response <C ids={['rfc9110']} at="§6.2" />.
                                </p>
                                <p>
                                    GET requests transfer of a current selected representation for the target
                                    resource. Retrieving identifiable information is usually done by a GET
                                    that can provide that information in a 200 (OK) response{' '}
                                    <C ids={['rfc9110']} at="§9.3.1" />. In a 200 response to GET, the content
                                    is a representation of the target resource{' '}
                                    <C ids={['rfc9110']} at="§15.3.1" />. GET is safe: the client does not
                                    request, and does not expect, any state change on the origin server as a
                                    result of applying it <C ids={['rfc9110']} at="§9.2.1" />.
                                </p>
                                <p>
                                    This pass is that GET, because those sections state the retrieval and the
                                    safety in so many words. A 201 (Created) means the request was fulfilled
                                    and one or more new resources were created{' '}
                                    <C ids={['rfc9110']} at="§15.3.2" />. That is a result of some requests,
                                    and it is not what this GET asks for.
                                </p>
                                <p>
                                    The press is one resource, and the message is already there. A safe method
                                    can still have a side effect the client did not request, such as a log
                                    line <C ids={['rfc9110']} at="§9.2.1" />. On this press, unchanged means
                                    the stored representation. The stops are this model&apos;s events. They
                                    are not durations from the specification.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="slot">What the slot does</h2>
                                <p>
                                    Choose GET, PUT, or POST, and whether a representation is already stored.
                                    Say the status and what happens to the plate. The press stays still until
                                    you press Run.
                                </p>
                            </div>
                            <HttpExchange pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    PUT asks that the state of the target resource be created or replaced with
                                    the state defined by the representation enclosed in the request. If a
                                    current representation is successfully modified, the origin server must
                                    send 200 (OK) or 204 (No Content). If the PUT creates a representation
                                    where none was stored, it must send 201 (Created){' '}
                                    <C ids={['rfc9110']} at="§9.3.4" />. This resource sends 200 for the
                                    successful modification. A 204 would mean the action was fulfilled and
                                    there is no content to send <C ids={['rfc9110']} at="§15.3.5" />. This
                                    press does not draw that response.
                                </p>
                                <p>
                                    POST asks the target resource to process the enclosed representation
                                    according to the resource&apos;s own semantics. Creating a new resource is
                                    one of those functions. If processing creates one or more resources, the
                                    origin server should send 201 <C ids={['rfc9110']} at="§9.3.3" />. This
                                    resource does that when the slot starts empty. When a representation is
                                    already there, this resource&apos;s processing changes it and sends 200,
                                    whose content for POST is the status of, or the results from, the action{' '}
                                    <C ids={['rfc9110']} at="§15.3.1" />. Another resource&apos;s POST can
                                    choose a different status. A 404 (Not Found) means the origin server did
                                    not find a current representation, or is not willing to disclose that one
                                    exists <C ids={['rfc9110']} at="§15.5.5" />. On this press, GET uses 404
                                    for the first of those.
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
                                ask="A representation is already in the slot. The method is GET. The cartridge is back in the nest. What is true of the plate?"
                            >
                                <p>
                                    It is the representation that was already stored. GET does not request a
                                    state change <C ids={['rfc9110']} at="§9.2.1" />. A successful retrieval
                                    is a 200, and that response&apos;s content is a representation of the
                                    target resource <C ids={['rfc9110']} at="§9.3.1" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="The slot starts empty and the method is GET. What status comes back, and what does this press mean by it?"
                            >
                                <p>
                                    404. This resource found no current representation, so nothing is stored
                                    afterward. The same status can also mean the server will not disclose that
                                    a representation exists <C ids={['rfc9110']} at="§15.5.5" />. This run
                                    uses it for the missing representation.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="The slot starts empty. PUT and POST can both come back as 201 on this press. What did each method ask for?"
                            >
                                <p>
                                    PUT asked that the target&apos;s state be created from the enclosed
                                    representation <C ids={['rfc9110']} at="§9.3.4" />. POST asked the
                                    resource to process the request, and this resource&apos;s processing
                                    created one <C ids={['rfc9110']} at="§9.3.3" />. 201 means one or more new
                                    resources were created <C ids={['rfc9110']} at="§15.3.2" />. The shared
                                    status is not the same request. The enclosed representation in a PUT is
                                    the new state. The target of a POST handles the enclosed representation by
                                    its own semantics <C ids={['rfc9110']} at="§9.3.4" />.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>Name what the request carries and what the response carries.</li>
                        <li>
                            Given the method and whether a representation is already stored, say the status
                            this resource sends and whether the plate changes.
                        </li>
                        <li>
                            Say that GET leaves the stored representation alone, that 404 here means none was
                            found, and that 201 means a new resource was created.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#http">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 8,{' '}
                        <Link href="/learn/udp-quic">
                            <strong>UDP and QUIC: when TCP is not the answer.</strong>
                        </Link>{' '}
                        Previous: <Link href="/learn/tcp">chapter 5</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
