'use client';

import React, { useEffect, useRef, useState } from 'react';

import { drive } from '@/components/round-trip/drive';
import type { Sound } from '@/components/round-trip/sound';
import { heights, itemsAt, type Trip } from '@/components/round-trip/trip';

import '@/components/round-trip/round-trip.css';

const HOPS = ['Browser', 'Wire', 'Edge', 'Services', 'Data', '200 OK'];
/** Where each hop of the route goes: the route is the shortcut from the name to the work and contact. */
const HOP_IDS = ['rt-hero', 'rt-wire', 'rt-edge', 'rt-work', 'rt-career', 'rt-contact'];
const sec = (h: number): React.CSSProperties => ({ '--h': h }) as React.CSSProperties;
const stagger = (i: number): React.CSSProperties => ({ '--i': i }) as React.CSSProperties;
const key = (r: { org: string; role: string }): string => `${r.org}-${r.role}`;

function Route({ label }: { label?: string }): React.JSX.Element {
    const list = (
        <ol className="rt-route" data-route aria-hidden={label ? undefined : true}>
            {HOPS.map((hop, r) => (
                <li key={hop} data-r={r}>
                    <a href={`#${HOP_IDS[r]}`} data-start={HOP_IDS[r]} tabIndex={label ? undefined : -1}>
                        <i />
                        <span>{hop}</span>
                    </a>
                </li>
            ))}
        </ol>
    );
    return label ? <nav aria-label={label}>{list}</nav> : list;
}

function Label({ n, zone }: { n: number; zone: string }): React.JSX.Element {
    return (
        <p className="rt-label rt-fade">
            <i />
            {zone} <em data-ms={n} />
        </p>
    );
}

function Line({ i, children }: { i: number; children: React.ReactNode }): React.JSX.Element {
    return (
        <span className="rt-ln" style={stagger(i)}>
            <span>{children}</span>
        </span>
    );
}

function Hero({ trip }: { trip: Trip }): React.JSX.Element {
    return (
        <>
            <h1 className="rt-name">
                <Line i={0}>{trip.name}</Line>
            </h1>
            <p className="rt-role">
                <Line i={1}>{trip.role}</Line>
            </p>
            <p className="rt-lede rt-fade">
                {trip.lede}
                {trip.rest && <span>: {trip.rest}</span>}
            </p>
            <p className="rt-meta rt-fade" style={stagger(1)}>
                {trip.meta}
            </p>
            <div className="rt-cue rt-fade" style={stagger(2)}>
                <button type="button" data-start="rt-wire">
                    Send a request
                </button>
                <a href={`mailto:${trip.email}`}>Email me</a>
                <span aria-hidden="true">
                    <b />
                    or scroll
                </span>
            </div>
        </>
    );
}

function Impact({ trip }: { trip: Trip }): React.JSX.Element | null {
    if (!trip.impact.length) return null;
    return (
        <>
            <Label n={1} zone="Wire" />
            <h2 className="rt-h2">
                <Line i={0}>What changed when I shipped</Line>
            </h2>
            <dl className="rt-impact">
                {trip.impact.map((m, i) => {
                    const [what, org] = m.label.split(' · ');
                    return (
                        <div key={m.label} className="rt-fade" style={stagger(i + 1)}>
                            <dt>
                                {what}
                                {org && <small>{org}</small>}
                            </dt>
                            {/* The value is read as written; the digits that count sit over it, unread. */}
                            <dd data-count>
                                <span>{m.value}</span>
                                <span className="rt-tick" aria-hidden="true" />
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </>
    );
}

function Stack({ trip }: { trip: Trip }): React.JSX.Element | null {
    if (!trip.skills.length) return null;
    return (
        <>
            <Label n={2} zone="Edge" />
            <h2 className="rt-h2">
                <Line i={0}>The stack</Line>
            </h2>
            <div className="rt-skills">
                <ul className="rt-layers">
                    {trip.skills.map((s, i) => (
                        <li key={s.group} data-skill className="rt-fade" style={stagger(i + 1)}>
                            <b>{s.group}</b>
                            <span>{s.items.split(', ').join(' · ')}</span>
                        </li>
                    ))}
                </ul>
                {/* The group the ship is passing, shown beside its name; the list rows never grow. */}
                <div className="rt-layer-items" data-skill-box aria-hidden="true">
                    {trip.skills.map((s) => (
                        <p key={s.group} data-skill-items>
                            {s.items.split(', ').join(' · ')}
                        </p>
                    ))}
                </div>
            </div>
        </>
    );
}

function Work({ trip }: { trip: Trip }): React.JSX.Element {
    return (
        <>
            <Label n={3} zone="Services" />
            <h2 className="rt-sr">Projects</h2>
            <div className="rt-stacked rt-fade">
                {trip.projects.map((p) => (
                    <article className="rt-item" data-project key={p.id}>
                        <p className="rt-meta">{[p.year, p.stack.join(' · ')].filter(Boolean).join(' · ')}</p>
                        <h3 className="rt-h3">{p.title}</h3>
                        <p className="rt-copy">{p.summary}</p>
                        <ul className="rt-links">
                            {p.links.map((l) => (
                                <li key={l.href}>
                                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                                        {l.label}
                                        <span className="rt-sr"> ({p.title})</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
            <p className="rt-count rt-fade" aria-hidden="true">
                {trip.projects.map((p) => (
                    <i key={p.id} data-dot />
                ))}
            </p>
        </>
    );
}

/** One highlight on screen; the rest, and the stack, one tap away, so the panel stays light. */
function Highlights({ items, stack }: { items: string[]; stack?: string }): React.JSX.Element {
    const [shown, more] = [items.slice(0, 1), items.slice(1)];
    return (
        <>
            <ul className="rt-bullets">
                {shown.map((h) => (
                    <li key={h}>{h}</li>
                ))}
            </ul>
            {(more.length > 0 || stack) && (
                <details className="rt-more">
                    <summary>{more.length > 0 ? `${more.length} more` : 'Stack'}</summary>
                    <ul className="rt-bullets">
                        {more.map((h) => (
                            <li key={h}>{h}</li>
                        ))}
                    </ul>
                    {stack && <p className="rt-tech">{stack.split(', ').join(' · ')}</p>}
                </details>
            )}
        </>
    );
}

function Career({ trip }: { trip: Trip }): React.JSX.Element {
    return (
        <>
            <Label n={4} zone="Data" />
            <h2 className="rt-h2 rt-h2-sm">
                <Line i={0}>Career</Line>
            </h2>
            <p className="rt-chips rt-fade" aria-hidden="true">
                {trip.records.map((r) => (
                    <span key={key(r)} data-chip>
                        {r.org}
                    </span>
                ))}
            </p>
            <div className="rt-stacked rt-fade" style={stagger(1)}>
                {trip.records.map((r) => (
                    <article className="rt-item" data-record key={key(r)}>
                        <h3 className="rt-h3 rt-h3-sm">{r.org}</h3>
                        <p className="rt-meta">
                            {[r.role, r.period, r.location].filter(Boolean).join(' · ')}
                        </p>
                        {r.highlights ? (
                            <Highlights items={r.highlights} stack={r.stack} />
                        ) : (
                            r.stack && <p className="rt-tech">{r.stack.split(', ').join(' · ')}</p>
                        )}
                    </article>
                ))}
            </div>
        </>
    );
}

function Contact({ trip }: { trip: Trip }): React.JSX.Element {
    const [copied, setCopied] = useState(false);
    const copy = async (): Promise<void> => {
        await navigator.clipboard.writeText(trip.email).catch(() => undefined);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };
    return (
        <>
            <p className="rt-label rt-fade">
                <i />
                Response
            </p>
            <h2 className="rt-ok">
                <Line i={0}>200 OK</Line>
            </h2>
            <p className="rt-done rt-fade">Round trip complete · {trip.meta}</p>
            <p className="rt-vitals" data-vitals hidden />
            <a className="rt-mail rt-fade" style={stagger(1)} href={`mailto:${trip.email}`}>
                {trip.email}
            </a>
            <div className="rt-pills rt-fade" style={stagger(2)}>
                <button type="button" onClick={copy}>
                    {copied ? 'Copied' : 'Copy email'}
                </button>
                {trip.phone && <a href={trip.phone.href}>{trip.phone.label}</a>}
                {trip.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                    </a>
                ))}
                {/* Always laid out, shown once the ship has left, so nothing shifts when it comes up. */}
                <button type="button" className="rt-again" data-again>
                    Send again
                </button>
            </div>
            <details className="rt-more rt-fade" style={stagger(3)}>
                <summary>Credits</summary>
                <p className="rt-note">
                    Ship: Intergalactic Spaceship by Dennis Haupt (3DHaupt). Portals: Sci-Fi Portal Gateway by
                    Igrium. Downtown: Osaka downtown by matousekfoto. Landmarks: Mountain Range 01 by
                    solararchitect, Snowy Volcano by Pukar Shiwakoti, Horseshoe bend by Ignazio Pillitteri,
                    Snowy Mountain and Death Valley by artfromheath (all Sketchfab, CC BY 4.0). Earth and
                    stars: NASA. Moon and ISS: NASA.
                </p>
            </details>
        </>
    );
}

function Section({
    zone,
    h,
    id,
    children,
}: {
    zone: string;
    h: number;
    id?: string;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <section className="rt-sec" id={id} data-sec data-zone={zone} style={sec(h)}>
            <div className="rt-pin">
                <div className="rt-panel">{children}</div>
            </div>
        </section>
    );
}

/** /: scrolling sends one request through a full-stack world, from the browser to the data and back. */
export default function RoundTrip({ trip }: { trip: Trip }): React.JSX.Element {
    const root = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const sound = useRef<Sound | null>(null);
    const [soundOn, setSoundOn] = useState(false);
    const hs = heights(trip);

    useEffect(() => {
        if (!root.current || !canvas.current) return undefined;
        const h = heights(trip);
        return drive(root.current, canvas.current, {
            rings: trip.projects.map((p) => p.colour),
            ringAt: itemsAt(h[3], trip.projects.length),
            recordAt: itemsAt(h[4], trip.records.length),
            skills: trip.skills,
            sound: () => sound.current,
        });
    }, [trip]);

    const loading = useRef<Promise<Sound> | null>(null);
    const toggleSound = async (): Promise<void> => {
        // The synth loads on the first switch-on, not with the page. Its context is made here, inside
        // the click, so the browser lets it play once the chunk arrives.
        if (!loading.current) {
            const ctx = new AudioContext();
            void ctx.resume();
            loading.current = import('@/components/round-trip/sound').then((m) => m.createSound(ctx));
        }
        sound.current = await loading.current;
        setSoundOn(await sound.current.toggle());
    };

    return (
        <div className="rt" ref={root}>
            <div className="rt-poster" aria-hidden="true" />
            <canvas className="rt-canvas" ref={canvas} aria-hidden="true" />
            <div className="rt-scrim" aria-hidden="true" />

            <header className="rt-hud rt-top">
                <a className="rt-brand" href="#rt-hero">
                    {trip.name}
                </a>
                <Route label="Request route" />
                <button className="rt-snd rt-tilt" type="button" data-tilt aria-pressed="false" hidden>
                    Tilt to scroll
                </button>
                <button className="rt-snd" type="button" aria-pressed={soundOn} onClick={toggleSound}>
                    Sound
                </button>
            </header>
            <div className="rt-hud rt-bottom" aria-hidden="true">
                <span className="rt-req" data-req>
                    GET /{trip.slug} <em>· 0 s</em>
                </span>
                <Route />
                <span className="rt-hint">
                    <span>Scroll to send</span>
                    <kbd>J / K</kbd>
                </span>
            </div>

            <main id="main-content">
                <Section zone="browser" h={hs[0]} id="rt-hero">
                    <Hero trip={trip} />
                </Section>
                <Section zone="wire" h={hs[1]} id="rt-wire">
                    <Impact trip={trip} />
                </Section>
                <Section zone="edge" h={hs[2]} id="rt-edge">
                    <Stack trip={trip} />
                </Section>
                <Section zone="services" h={hs[3]} id="rt-work">
                    <Work trip={trip} />
                </Section>
                <Section zone="data" h={hs[4]} id="rt-career">
                    <Career trip={trip} />
                </Section>
                <Section zone="ok" h={hs[5]} id="rt-contact">
                    <Contact trip={trip} />
                </Section>
            </main>

            {trip.projects.map((p) => (
                <div className="rt-tag" data-ring-tag key={p.id} aria-hidden="true">
                    {p.title}
                </div>
            ))}
            {/* The project title handed from the portal's flash to its panel (a copy; the h3 is the real one). */}
            <p className="rt-handoff" data-handoff aria-hidden="true" />
            {trip.records.map((r) => (
                <div className="rt-tag" data-record-tag key={key(r)} aria-hidden="true">
                    {r.org} <small>· {r.period}</small>
                </div>
            ))}
        </div>
    );
}
