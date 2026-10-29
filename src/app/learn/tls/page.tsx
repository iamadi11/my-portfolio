import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import ChapterTabs from '@/components/learn/ChapterTabs';
import { citeFor } from '@/components/learn/Cite';
import CourseShell from '@/components/learn/CourseShell';
import LessonFilm from '@/components/learn/film/LessonFilm';
import ChapterHeader from '@/components/learn/kit/ChapterHeader';
import Question from '@/components/learn/kit/Question';
import TlsHandshake from '@/components/learn/tls/TlsHandshake';
import { LESSON_FILMS } from '@/content/learn/films';
import { TLS_SOURCE_NUMBER as SOURCE_NUMBER, TLS_SOURCES as SOURCES } from '@/content/learn/tls-sources';
import { FLIGHT, REST } from '@/lib/learn/tls-model';

/**
 * Chapter 6, tls: application bytes are not what travels until the handshake
 * has finished. After that, the body on the wire is sealed. Learner-facing page
 * for `docs/system-design/chapters/tls.md`.
 */

export const metadata: Metadata = {
    title: 'TLS: encrypted, authenticated connections',
    description:
        'System design, chapter 6: handshake bodies travel as steps the other side can read, and the application body leaves only after that, sealed, with the plaintext inside the receiver.',
    alternates: { canonical: '/learn/tls' },
};

const C = citeFor('tls', SOURCES, SOURCE_NUMBER);

export default function Page(): React.JSX.Element {
    return (
        <CourseShell chapterId="tls" crumbs={[{ label: 'Chapter 6' }]}>
            <article aria-labelledby="ch-h">
                <ChapterHeader
                    kicker="Chapter 6 · Stage 1, Foundations"
                    title="TLS: encrypted, authenticated connections"
                    lede="The cartridge crosses open, as a handshake step. After the finished step arrives, the next body leaves with the lid on, and the application's byte shows up only inside the far machine."
                />

                <ChapterTabs
                    film={<LessonFilm film={LESSON_FILMS['tls']} />}
                    learn={
                        <>
                            <div className="ln-prose">
                                <h2 id="open">Open, then sealed</h2>
                                <p>
                                    Watch the cartridge. The client&apos;s hello, the server&apos;s hello, and
                                    the finished step travel with no lid. The machine that receives each one
                                    can read it as a step. Then one body leaves with the lid on. The plunger
                                    on the near machine drops when that machine checks the server. This run
                                    checks.
                                </p>
                            </div>
                            <TlsHandshake pane="learn" />
                            <div className="ln-prose">
                                <p>
                                    TLS is for a channel that is meant to stop eavesdropping, tampering, and
                                    message forgery. The server side is authenticated. The client side is
                                    optional. After the channel is up, data on it is visible only to the two
                                    ends, and a change by someone else is detected{' '}
                                    <C ids={['rfc8446']} at="§1" />. The handshake picks the version and the
                                    algorithms, authenticates, and establishes shared keying material. Once it
                                    is complete, the peers use those keys to protect application traffic{' '}
                                    <C ids={['rfc8446']} at="§2" />.
                                </p>
                                <p>
                                    Application data must not be sent before the Finished message, except the
                                    early data this picture does not draw <C ids={['rfc8446']} at="§2" />.
                                    While record protection is off, a plaintext record is written on the wire.
                                    Application data records are always protected, and they must not be
                                    written unprotected <C ids={['rfc8446']} at="§5.1" />. Protection turns a
                                    plaintext record into ciphertext. Opening it yields the plaintext, or a
                                    failure <C ids={['rfc8446']} at="§5.2" />.
                                </p>
                                <p>
                                    This picture uses four bodies, {FLIGHT} ticks on the wire, and {REST}{' '}
                                    ticks of rest before the next body leaves. Those durations are assumed. A
                                    full handshake also sends encrypted extensions and, when a certificate is
                                    used, a certificate and a certificate verify, and each side sends Finished{' '}
                                    <C ids={['rfc8446']} at="§2" />. The client&apos;s hello and the
                                    server&apos;s hello are the key exchange, and everything after that phase
                                    is encrypted. This run still draws the finished step with the lid off. In
                                    the full flow that message is already protected with handshake keys{' '}
                                    <C ids={['rfc8446']} at="§2" />. The key schedule is not in the run.
                                </p>
                            </div>
                        </>
                    }
                    lab={
                        <>
                            <div className="ln-prose">
                                <h2 id="name">The name check</h2>
                                <p>
                                    Leave the check on, or skip it. Say which outcome you expect once the
                                    sealed body has arrived. The bench stays still until you press Run.
                                    Skipping the check does not change the flights.
                                </p>
                            </div>
                            <TlsHandshake pane="lab" />
                            <div className="ln-prose">
                                <p>
                                    The server side is supposed to be authenticated{' '}
                                    <C ids={['rfc8446']} at="§1" />. Implementations are responsible for
                                    verifying certificates <C ids={['rfc8446']} at="Appendix C.2" />. The
                                    server name guides which certificate is chosen, and clients should send
                                    that name when it applies <C ids={['rfc8446']} at="§4.4.2.2" />. How a
                                    certificate chain is validated is outside this specification{' '}
                                    <C ids={['rfc8446']} at="§4.4.2.4" />. Using a key from a certificate
                                    without checking the chain or its contents leaves no protection against an
                                    active attacker in the middle, and applications must not do that unless
                                    they have configured something else{' '}
                                    <C ids={['rfc8446']} at="Appendix C.5" />. In this model the sealed body
                                    still arrives. The outcome says the name was not checked. The flight is{' '}
                                    {FLIGHT} ticks and the rest is {REST} ticks. Both are assumed.
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
                                ask="The lid is on and the cartridge is still on the cable. Where is the application's byte?"
                            >
                                <p>
                                    Inside neither machine yet. The body on the wire is the seal. The byte is
                                    drawn only after that body reaches the far pocket. Application data
                                    records are always protected <C ids={['rfc8446']} at="§5.1" />.
                                </p>
                            </Question>
                            <Question
                                n={2}
                                ask="The server's hello has just reached the client. Has the application body left?"
                            >
                                <p>
                                    No. This model still has to send the finished step, and the application
                                    body leaves only after that step arrives. Application data must not go out
                                    before Finished, apart from early data this chapter does not draw{' '}
                                    <C ids={['rfc8446']} at="§2" />.
                                </p>
                            </Question>
                            <Question
                                n={3}
                                ask="The check is skipped, and the sealed body has arrived. What is true of the byte and of the name?"
                            >
                                <p>
                                    The byte is inside the receiver, and the name was not checked. Sealing
                                    still happened. A connection that uses a certificate key without
                                    validating the chain or its contents has no protection against an active
                                    attacker in the middle <C ids={['rfc8446']} at="Appendix C.5" />.
                                </p>
                            </Question>
                        </>
                    }
                />

                <div className="ln-prose">
                    <h2>By the end you can</h2>
                    <ol>
                        <li>
                            Point at the cartridge and say whether that body is a handshake step or sealed.
                        </li>
                        <li>
                            Say that a sealed body on the wire is not the application&apos;s byte, and that
                            the byte is only inside the receiver.
                        </li>
                        <li>
                            Say that skipping the name check still delivers the sealed body, and that the
                            outcome says the name was not checked.
                        </li>
                    </ol>
                    <p>
                        Sources for this chapter are on the{' '}
                        <Link href="/learn/sources#tls">sources page</Link>.
                    </p>
                </div>

                <aside className="bp-sheet ln-next" aria-label="Next chapter">
                    <p className="ln-kicker">Next in the course</p>
                    <p>
                        Chapter 7,{' '}
                        <Link href="/learn/http">
                            <strong>HTTP: methods, status codes and headers.</strong>
                        </Link>{' '}
                        Previous:
                        <Link href="/learn/tcp">chapter 5</Link>.{' '}
                        <Link href="/learn">See the whole course</Link>.
                    </p>
                </aside>
            </article>
        </CourseShell>
    );
}
