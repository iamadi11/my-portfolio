import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ContractPlate from '@/components/learn/api-design/ContractPlate';
import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import {
    API_DESIGN_SOURCE_NUMBER as SOURCE_NUMBER,
    API_DESIGN_SOURCES as SOURCES,
} from '@/content/learn/api-design-sources';
import {
    CONTRACT_METHOD,
    CONTRACT_TARGET,
    NAMED_ERROR,
    NOT_FOUND,
    SUCCESS_STATUS,
} from '@/lib/learn/api-design-model';

/**
 * Chapter 16, API design: one caller and one contract plate. A call that matches
 * is accepted and the body seats. A call that breaks a promised part is refused.
 * Learner-facing page for `docs/system-design/chapters/api-design.md`.
 */

export const metadata: Metadata = {
    title: 'API design: contracts between programs',
    description:
        'System design, chapter 16: one caller and one contract plate. A call that matches the promised method, target, and status is accepted. A call that breaks a promised part is refused, and the caller sees that refusal.',
    alternates: { canonical: '/learn/api-design' },
};

const C = citeFor('api-design', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell crumbs={[{ label: 'Chapter 16' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 16 · Stage 2, APIs and data modelling"
                    title="API design: contracts between programs"
                    lede="One caller, one contract. A call the plate stands behind is accepted, and the caller can see the body seated. A call that breaks a promised part is refused, and the caller sees that, not a success."
                />

                <ChapterTabs
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="one-plate">One caller, one plate</h2>
                                <p>
                                    A caller offers one call. The plate is what that caller can rely on: the
                                    method {CONTRACT_METHOD}, the teaching target {CONTRACT_TARGET}, and the
                                    client error {NAMED_ERROR} when the method is not {CONTRACT_METHOD}. This
                                    run matches. A current representation is found, so the status is{' '}
                                    {SUCCESS_STATUS}. Watch the body leave the caller and seat.
                                </p>
                            </div>
                            <ContractPlate pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    A request message has a method and a request target, and it may have
                                    header fields. A response message includes a status code, and it may have
                                    header fields and content <C ids={['rfc9110']} at="§3.4" />. Request
                                    control data includes the method and the request target. Response control
                                    data includes the status code <C ids={['rfc9110']} at="§6.2" />. The
                                    client looks at the status code to see whether its intention was carried
                                    out <C ids={['rfc9110']} at="§1.3" />.
                                </p>
                                <p>
                                    The method is the primary source of request semantics, and it says what
                                    the client expects if the request succeeds <C ids={['rfc9110']} at="§9.1" />.
                                    The target of a request is a resource <C ids={['rfc9110']} at="§3.1" />.
                                    The request target is how the caller identifies it{' '}
                                    <C ids={['rfc9110']} at="§7.1" />. {CONTRACT_TARGET} is a teaching label
                                    for that target, not a company&apos;s API and not a product URI.{' '}
                                    {CONTRACT_METHOD} asks for a current representation, and a retrieval that
                                    can provide it is usually a {SUCCESS_STATUS}{' '}
                                    <C ids={['rfc9110']} at="§9.3.1" />. For {CONTRACT_METHOD}, the content of
                                    a {SUCCESS_STATUS} response is a representation of the target resource, and{' '}
                                    {SUCCESS_STATUS} means the request succeeded{' '}
                                    <C ids={['rfc9110']} at="§15.3.1" />. The 2xx class means the request was
                                    received, understood, and accepted <C ids={['rfc9110']} at="§15.3" />.
                                </p>
                                <p>
                                    A resource cannot treat a request in a way that disagrees with the method{' '}
                                    <C ids={['rfc9110']} at="§3.1" />. This plate allows only {CONTRACT_METHOD}.
                                    A method the server recognizes but the resource does not allow should be
                                    answered {NAMED_ERROR} <C ids={['rfc9110']} at="§9.1" />. {NAMED_ERROR}{' '}
                                    means that method is known by the origin server and not supported by the
                                    target resource. The response must include an Allow field listing the
                                    methods the resource supports now <C ids={['rfc9110']} at="§15.5.6" />.
                                    That field is not drawn. {NAMED_ERROR} is a 4xx client error: the request
                                    was not fulfilled <C ids={['rfc9110']} at="§15" />. A caller has to read
                                    the status by the semantics defined for it{' '}
                                    <C ids={['rfc9110']} at="§2.4" />, including the class, which is the first
                                    digit <C ids={['rfc9110']} at="§15" />. This run assumes the representation
                                    is current. It is not a measurement.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="match-or-break">Match or break</h2>
                                <p>
                                    The plate still promises {CONTRACT_METHOD} on {CONTRACT_TARGET}, and it
                                    still names {NAMED_ERROR} when the method is not {CONTRACT_METHOD}. Choose
                                    the matching call, or the call that sends POST to the same target. Predict
                                    whether the body is accepted or refused, then press Run. The body stays
                                    with the caller until you do.
                                </p>
                            </div>
                            <ContractPlate pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    POST is one of the methods the specification lists{' '}
                                    <C ids={['rfc9110']} at="§9.1" />. This plate does not allow it, so the
                                    answer it assigns is {NAMED_ERROR} rather than {SUCCESS_STATUS}. A
                                    different target is not this run. If this plate were asked for a target it
                                    does not provide, the assigned status would be {NOT_FOUND}, which means no
                                    current representation was found, or the server will not say that one
                                    exists <C ids={['rfc9110']} at="§15.5.5" />. Header values, including the
                                    Allow list a {NAMED_ERROR} response has to carry, stay off the metal.
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
                                ask={`This plate promises ${CONTRACT_METHOD} on the teaching target ${CONTRACT_TARGET}, and ${NAMED_ERROR} when the method is not allowed. A caller sends POST to ${CONTRACT_TARGET}. What status can the caller rely on, and is the body seated?`}
                            >
                                <p>
                                    The status is {NAMED_ERROR}, not {SUCCESS_STATUS}. The body is not seated.
                                    POST is a method this plate does not allow, so the promised method does not
                                    hold. {NAMED_ERROR} means the method is known and not supported by the
                                    target resource. The caller sees the body off the seat.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask={`Why is status ${SUCCESS_STATUS} on that POST not something this caller can rely on?`}
                            >
                                <p>
                                    {SUCCESS_STATUS} means the request succeeded. The 2xx class means the
                                    request was accepted. This plate does not assign {SUCCESS_STATUS} when the
                                    method is not {CONTRACT_METHOD}. A caller that treats the POST as a success
                                    is using a status the plate does not give. The body stays off the seat so
                                    that success is not what the caller sees.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask={`${CONTRACT_METHOD} on ${CONTRACT_TARGET} finds a current representation. What status does the caller rely on, and what does the body do?`}
                            >
                                <p>
                                    The status is {SUCCESS_STATUS}. {CONTRACT_METHOD} asks to transfer a
                                    current representation, and the content of that {SUCCESS_STATUS} is a
                                    representation of the target. The body seats, and the caller can see it
                                    there. This assumes the representation is current. {CONTRACT_TARGET} is a
                                    teaching label, not a product.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Name what this plate promises: method {CONTRACT_METHOD}, teaching target{' '}
                            {CONTRACT_TARGET}, status {SUCCESS_STATUS} when that call matches, and status{' '}
                            {NAMED_ERROR} when the method is not allowed.
                        </li>
                        <li>
                            Predict that a matching call seats the body, and that POST on {CONTRACT_TARGET}{' '}
                            leaves the body unseated with status {NAMED_ERROR}, not {SUCCESS_STATUS}.
                        </li>
                        <li>
                            Say that the body&apos;s place is accepted or refused, and that {CONTRACT_TARGET}{' '}
                            is a teaching label rather than a company&apos;s API.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#api-design">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 17, <strong>Resource-oriented HTTP APIs (REST)</strong>, is planned and not
                        written. Previous:{' '}
                        <Link href="/learn/utilisation-queueing">
                            Utilisation, queues and Little’s law
                        </Link>
                        . <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
