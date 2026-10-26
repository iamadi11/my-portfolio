import React from 'react';

import { Scene, SheetFrame, win } from '@/components/blueprint/scene';
import { SHEET_COUNT, sheet } from '@/components/blueprint/sheets';
import { SITE } from '@/content/site';

import { HDim } from './Title';

import './contact.css';

/*
 * Sheet 6, last on the page: the closing title-block strip. One bold element (the email, set large in caps, with
 * a dimension drawing under it), then ruled cells for every channel and the colophon. Flow scene, T = 1: an
 * element at fraction f of the section's height draws around f. The driver forces the scene to its end when the
 * page is scrolled to the bottom, so the last rules always complete.
 */

const S = sheet('contact');

/** `https://github.com/iamadi11` → `github.com/iamadi11` (the link text says where it goes). */
function bare(href: string): string {
    return href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function Cell({
    label,
    a,
    children,
}: {
    label: string;
    a: number;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <div {...win(a, a + 0.25)} className="contact-cell">
            <p className="contact-lbl">{label}</p>
            <p className="contact-v">{children}</p>
        </div>
    );
}

export default function Contact(): React.JSX.Element {
    const { name, email, phone, links, location } = SITE.profile;
    return (
        <section id={S.id} aria-labelledby="contact-h" className="contact">
            <Scene mode="flow" T={1} className="contact-in">
                <SheetFrame
                    n={S.n}
                    of={SHEET_COUNT}
                    title={S.title}
                    headingId="contact-h"
                    className="contact-sheet"
                >
                    <div className="contact-cta">
                        <p className="contact-lbl">Email</p>
                        <div className="contact-mailbox">
                            <a href={`mailto:${email}`} className="contact-mail">
                                {email.split('@')[0]}
                                <wbr />@{email.split('@')[1]}
                            </a>
                            <HDim
                                id="ct-w"
                                a={0.18}
                                f={-12}
                                label={`W (REF ${email.length} CH)`}
                                className="contact-dim"
                            />
                        </div>
                    </div>
                    <div className="contact-strip">
                        <div {...win(0.3, 0.55)} className="contact-strip-rule" aria-hidden="true" />
                        {phone ? (
                            <Cell label="Phone" a={0.36}>
                                <a href={phone.href}>{phone.label}</a>
                            </Cell>
                        ) : null}
                        {links.map((l, i) => (
                            <Cell key={l.href} label={l.label} a={0.42 + i * 0.06}>
                                <a href={l.href} rel="me noopener">
                                    {bare(l.href)
                                        .split('/')
                                        .map((part, j) => (
                                            <React.Fragment key={part}>
                                                {j ? '/' : null}
                                                {j ? <wbr /> : null}
                                                {part}
                                            </React.Fragment>
                                        ))}
                                </a>
                            </Cell>
                        ))}
                        <Cell label="Location" a={0.42 + links.length * 0.06}>
                            {location}
                        </Cell>
                    </div>
                    <div {...win(0.6, 0.85)} className="contact-colophon">
                        <p>
                            © 2026 {name} · <a href="/sitemap.xml">Sitemap</a> ·{' '}
                            <a href="/llms.txt">llms.txt</a>
                        </p>
                        <p>
                            Drawing style after Apple&rsquo;s dimensional drawings, via{' '}
                            <a href="https://github.com/enesozturk/dimensional-drawing" rel="noopener">
                                enesozturk/dimensional-drawing
                            </a>{' '}
                            (MIT)
                        </p>
                    </div>
                </SheetFrame>
            </Scene>
        </section>
    );
}
