'use client';

import React, { useEffect, useRef, useState } from 'react';

import { drive } from '@/components/round-trip/drive';
import { createSound, type Sound } from '@/components/round-trip/sound';
import { heights, itemsAt, type Trip } from '@/components/round-trip/trip';

import '@/components/round-trip/round-trip.css';

const HOPS = ['Browser', 'Wire', 'Edge', 'Services', 'Data', '200 OK'];
const nn = (i: number): string => String(i + 1).padStart(2, '0');
const sec = (h: number): React.CSSProperties => ({ '--h': h }) as React.CSSProperties;
const stagger = (i: number): React.CSSProperties => ({ '--i': i }) as React.CSSProperties;
const key = (r: { org: string; role: string }): string => `${r.org}-${r.role}`;

function Route({ label }: { label?: string }): React.JSX.Element {
    return (
        <ol className="rt-route" data-route aria-label={label} aria-hidden={label ? undefined : true}>
            {HOPS.map((hop, r) => (
                <li key={hop} data-r={r}>
                    <i />
                    <span>{hop}</span>
                </li>
            ))}
        </ol>
    );
}

function Label({ n, zone }: { n: number; zone: string }): React.JSX.Element {
    return (
        <p className="rt-label rt-fade">
            <i />
            {nn(n - 1)} · {zone} <em data-ms={n} />
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
            <p className="rt-kicker">
                <Line i={0}>{trip.role}</Line>
            </p>
            <h1 className="rt-name">
                <Line i={0}>{trip.name}</Line>
            </h1>
            <p className="rt-lede rt-fade">{trip.statement}</p>
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
                {trip.impact.map((m, i) => (
                    <div key={m.label} className="rt-fade" style={stagger(i + 1)}>
                        <dt>{m.label}</dt>
                        <dd>{m.value}</dd>
                    </div>
                ))}
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
            <ul className="rt-layers">
                {trip.skills.map((s, i) => (
                    <li key={s.group} data-skill className="rt-fade" style={stagger(i + 1)}>
                        <b>{s.group}</b>
                        <span>{s.items.split(', ').join(' · ')}</span>
                    </li>
                ))}
            </ul>
        </>
    );
}

function Work({ trip }: { trip: Trip }): React.JSX.Element {
    return (
        <>
            <Label n={3} zone="Services" />
            <h2 className="rt-sr">Projects</h2>
            <div className="rt-stacked rt-fade">
                {trip.projects.map((p, k) => (
                    <article className="rt-item" data-project key={p.id}>
                        <p className="rt-meta">
                            {[`${nn(k)} / ${nn(trip.projects.length - 1)}`, p.year, p.stack.join(' · ')]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
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

function Career({ trip }: { trip: Trip }): React.JSX.Element {
    return (
        <>
            <Label n={4} zone="Data" />
            <h2 className="rt-h2 rt-h2-sm">
                <Line i={0}>SELECT * FROM career</Line>
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
                        {r.highlights && (
                            <ul className="rt-bullets">
                                {r.highlights.map((h) => (
                                    <li key={h}>{h}</li>
                                ))}
                            </ul>
                        )}
                        {r.stack && <p className="rt-tech">{r.stack.split(', ').join(' · ')}</p>}
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
                {nn(4)} · Response
            </p>
            <h2 className="rt-ok">
                <Line i={0}>200 OK</Line>
            </h2>
            <p className="rt-done rt-fade">Round trip complete · {trip.meta}</p>
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
            </div>
            <p className="rt-note rt-fade" style={stagger(3)}>
                Every shape on this page is generated in code.
            </p>
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
            sound: () => sound.current,
        });
    }, [trip]);

    const toggleSound = async (): Promise<void> => {
        sound.current ??= createSound();
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
                <button className="rt-snd" type="button" data-tilt hidden aria-label="Tilt to steer">
                    Tilt
                </button>
                <button className="rt-snd" type="button" aria-pressed={soundOn} onClick={toggleSound}>
                    {soundOn ? 'Sound on' : 'Sound off'}
                </button>
            </header>
            <div className="rt-hud rt-bottom" aria-hidden="true">
                <span className="rt-req" data-req>
                    GET /{trip.slug} <em>· 0 ms</em>
                </span>
                <Route />
                <span className="rt-hint">Scroll to send</span>
            </div>

            <main id="main-content">
                <Section zone="browser" h={hs[0]} id="rt-hero">
                    <Hero trip={trip} />
                </Section>
                <Section zone="wire" h={hs[1]} id="rt-wire">
                    <Impact trip={trip} />
                </Section>
                <Section zone="edge" h={hs[2]}>
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

            {trip.projects.map((p, k) => (
                <div className="rt-tag" data-ring-tag key={p.id} aria-hidden="true">
                    {p.title} <small>· svc-{nn(k)}</small>
                </div>
            ))}
            {trip.records.map((r) => (
                <div className="rt-tag" data-record-tag key={key(r)} aria-hidden="true">
                    {r.org} <small>· {r.period}</small>
                </div>
            ))}
        </div>
    );
}
