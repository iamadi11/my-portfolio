'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    EXAMPLE_ADDRESS,
    EXAMPLE_NAME,
    outcomeOf,
    queriesAt,
    resolve,
    type Inputs,
    type Outcome,
    type Place,
    type Run,
} from '@/lib/learn/dns-model';

import {
    block,
    corners,
    cylinder,
    fit,
    Metal,
    place,
    type Plan,
    type Point3,
    type Projection,
} from '../anatomy/metal';

/**
 * One packet visits a computer, then a slotted machine, then three racks.
 * The packet's place is the step's `at`. The glass lights only when `kind` is `answer`.
 * Base: plate, feet, screws. Computer: case, screen, keys. Resolver: chassis, slot, tray.
 * Racks: a short vent grille, a medium open bay, a tall cabinet with a drawer.
 */

const LEARN: Inputs = { cached: false, exists: true };
const DEFAULT: Inputs = { cached: false, exists: true };

const PACKET: Plan = { x: -7, y: -4.5, w: 14, d: 9, r: 1 };
const REST: Point3 = [PACKET.x, PACKET.y, 0];

const OUTCOME_LABEL: Record<Outcome, string> = {
    stored: 'Address, and the three servers are never asked',
    walk: 'Address, after the three servers',
    missing: 'No address',
};
const OUTCOMES: Outcome[] = ['stored', 'walk', 'missing'];

type Drawn = { key: string; paths: ReturnType<typeof block> };

function push(into: Drawn[], key: string, plan: Plan, z: number, h: number, projection: Projection): void {
    into.push({ key, paths: block(plan, z, h, projection) });
}

function sceneOf(): {
    projection: Projection;
    feet: Drawn[];
    screws: Drawn[];
    base: ReturnType<typeof block>;
    parts: Drawn[];
    body: Drawn[];
    seats: Record<Place, Point3>;
} {
    const base: Plan = { x: -52, y: -26, w: 392, d: 88, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 12, d: 12, r: 1 });
    const feet = [
        foot(base.x + 14, base.y + 10),
        foot(base.x + base.w - 26, base.y + 10),
        foot(base.x + 14, base.y + base.d - 22),
        foot(base.x + base.w - 26, base.y + base.d - 22),
    ];
    const deck: Plan = { x: -36, y: -2, w: 48, d: 32, r: 3 };
    const screen: Plan = { x: -30, y: 0, w: 36, d: 4.5, r: 1 };
    const glass: Plan = { x: -25, y: 3.6, w: 26, d: 2.2, r: 0.4 };
    const hinge: Plan = { x: -28, y: 2, w: 32, d: 6, r: 0.8 };
    const keys: Plan = { x: -32, y: 34, w: 40, d: 14, r: 1 };
    const pad: Plan = { x: -14, y: 18, w: 14, d: 9, r: 1.2 };
    const resolver: Plan = { x: 54, y: 10, w: 24, d: 20, r: 2 };
    const recess: Plan = { x: 58, y: 24, w: 16, d: 5, r: 0 };
    const jaw = (z: number): { plan: Plan; z: number } => ({
        plan: { x: 58.6, y: 28, w: 13, d: 4.4, r: 0.4 },
        z,
    });
    const lowerJaw = jaw(7.5);
    const upperJaw = jaw(16);
    const tray: Plan = { x: 60, y: 32, w: 12, d: 11, r: 0.8 };
    const root: Plan = { x: 108, y: -6, w: 34, d: 26, r: 1.5 };
    const rootCap: Plan = { x: 106, y: -8, w: 38, d: 30, r: 1 };
    const tld: Plan = { x: 196, y: -8, w: 32, d: 28, r: 1.5 };
    const tldCap: Plan = { x: 194, y: -10, w: 36, d: 32, r: 1 };
    const auth: Plan = { x: 282, y: -10, w: 36, d: 30, r: 1.5 };
    const authCap: Plan = { x: 280, y: -12, w: 40, d: 34, r: 1 };
    const drawer: Plan = { x: 286, y: 16, w: 28, d: 26, r: 0.8 };
    const seats: Record<Place, Point3> = {
        client: [-19, 7.5, 13],
        resolver: [59, 13.5, 20],
        root: [115, 1.5, 32],
        tld: [203, -0.5, 48],
        auth: [291, -2.5, 60],
    };
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 5 },
            ...feet.map((plan) => ({ plan, z: -6, h: 6 })),
            { plan: deck, z: 5, h: 8 },
            { plan: screen, z: 13, h: 24 },
            { plan: glass, z: 17, h: 16 },
            { plan: keys, z: 5, h: 6 },
            { plan: resolver, z: 5, h: 15 },
            { plan: tray, z: 5, h: 3 },
            { plan: root, z: 5, h: 24 },
            { plan: rootCap, z: 29, h: 3 },
            { plan: tld, z: 5, h: 40 },
            { plan: tldCap, z: 45, h: 3 },
            { plan: auth, z: 5, h: 52 },
            { plan: authCap, z: 57, h: 3 },
            { plan: drawer, z: 7, h: 14 },
            { plan: { x: screen.x, y: screen.y, w: 0, d: 0, r: 0 }, z: 37, h: 0 },
            { plan: { x: 291, y: -2.5, w: 14, d: 9, r: 1 }, z: 60, h: 7 },
        ]),
        720,
        380
    );
    const parts: Drawn[] = [];
    push(parts, 'deck', deck, 5, 8, projection);
    push(parts, 'screen', screen, 13, 24, projection);
    push(parts, 'hinge', hinge, 11, 4, projection);
    push(parts, 'client-glass', glass, 17, 16, projection);
    push(parts, 'pad', pad, 13, 1.4, projection);
    push(parts, 'keys', keys, 5, 3, projection);
    for (let row = 0; row < 2; row += 1) {
        for (let i = 0; i < 6; i += 1) {
            push(
                parts,
                `key-${row}-${i}`,
                { x: -30 + i * 6.2, y: 35.5 + row * 4.8, w: 4.6, d: 3.4, r: 0.5 },
                8,
                2.2,
                projection
            );
        }
    }
    push(parts, 'space', { x: -22, y: 44.6, w: 20, d: 2.8, r: 0.4 }, 8, 2, projection);
    push(parts, 'resolver', resolver, 5, 15, projection);
    push(parts, 'recess', recess, 10.2, 6, projection);
    push(parts, 'cheek-l', { x: 56, y: 28, w: 2.6, d: 4.4, r: 0.3 }, 7.5, 11.5, projection);
    push(parts, 'cheek-r', { x: 71.6, y: 28, w: 2.6, d: 4.4, r: 0.3 }, 7.5, 11.5, projection);
    push(parts, 'jaw-lo', lowerJaw.plan, lowerJaw.z, 3, projection);
    push(parts, 'jaw-hi', upperJaw.plan, upperJaw.z, 3, projection);
    push(parts, 'tray', tray, 5, 2.4, projection);
    push(parts, 'root', root, 5, 24, projection);
    push(parts, 'root-post-l', { x: root.x, y: 16, w: 3, d: 5, r: 0.3 }, 5, 24, projection);
    push(parts, 'root-post-r', { x: root.x + root.w - 3, y: 16, w: 3, d: 5, r: 0.3 }, 5, 24, projection);
    push(parts, 'root-cap', rootCap, 29, 3, projection);
    for (let i = 0; i < 3; i += 1) {
        push(
            parts,
            `root-vent-${i}`,
            { x: root.x + 4, y: 18, w: root.w - 8, d: 3.6, r: 0.2 },
            9 + i * 7,
            3.4,
            projection
        );
    }
    push(parts, 'tld', tld, 5, 40, projection);
    for (let i = 0; i < 3; i += 1) {
        push(
            parts,
            `tld-vent-${i}`,
            { x: tld.x + tld.w - 1.6, y: tld.y + 6, w: 3.6, d: 12, r: 0.2 },
            [15, 30, 39][i] ?? 15,
            3.6,
            projection
        );
    }
    push(parts, 'tld-post-l', { x: tld.x, y: 16, w: 3, d: 5, r: 0.3 }, 5, 40, projection);
    push(parts, 'tld-post-r', { x: tld.x + tld.w - 3, y: 16, w: 3, d: 5, r: 0.3 }, 5, 40, projection);
    push(parts, 'tld-cap', tldCap, 45, 3, projection);
    push(parts, 'tld-shelf-lo', { x: tld.x + 4, y: 17, w: tld.w - 8, d: 4, r: 0.3 }, 10, 3, projection);
    push(parts, 'tld-shelf', { x: tld.x + 4, y: 17, w: tld.w - 8, d: 4, r: 0.3 }, 24, 3, projection);
    push(parts, 'auth', auth, 5, 52, projection);
    push(parts, 'auth-post-l', { x: auth.x, y: 16, w: 3, d: 5, r: 0.3 }, 5, 52, projection);
    push(parts, 'auth-post-r', { x: auth.x + auth.w - 3, y: 16, w: 3, d: 5, r: 0.3 }, 5, 52, projection);
    push(parts, 'auth-cap', authCap, 57, 3, projection);
    for (let i = 0; i < 3; i += 1) {
        push(
            parts,
            `auth-vent-${i}`,
            { x: auth.x + 4, y: 18, w: auth.w - 8, d: 3.6, r: 0.2 },
            30 + i * 8,
            3.4,
            projection
        );
    }
    push(parts, 'drawer', drawer, 7, 14, projection);
    push(
        parts,
        'drawer-pull',
        { x: drawer.x + 8, y: drawer.y + drawer.d - 0.4, w: 12, d: 2.6, r: 0.4 },
        12,
        2.4,
        projection
    );
    const body: Drawn[] = [];
    push(body, 'packet', PACKET, 0, 4, projection);
    push(body, 'flap', { x: -5, y: -3.2, w: 10, d: 4.2, r: 0.4 }, 4, 2, projection);
    return {
        projection,
        feet: feet.map((plan) => ({
            key: `foot-${plan.x}-${plan.y}`,
            paths: block(plan, -6, 6, projection),
        })),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}-${plan.y}`,
            paths: cylinder(plan.x + 6, plan.y + 6, 1.5, 5, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 5, projection),
        parts,
        body,
        seats,
    };
}

export default function DnsWalk({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-dns-h' : 'fig-dns-learn';
    const [inputs, setInputs] = useState<Inputs>(pane === 'learn' ? LEARN : DEFAULT);
    const [guess, setGuess] = useState<Outcome | null>(null);
    const [run, setRun] = useState<Run | null>(() => (pane === 'learn' ? resolve(LEARN) : null));
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const steps = run?.steps;
    const end = Math.max(0, (steps?.length ?? 1) - 1);
    const marks = useMemo(() => (steps ? steps.map((_, i) => i) : [0]), [steps]);
    const clock = useClock({ marks, end, rate: 0.55, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const index = run ? Math.max(0, clock.at) : 0;
    const step = steps?.[index];
    const asked = run ? queriesAt(run, index) : 0;
    const finished = run !== null && clock.t >= end - 1e-6;
    const set = (patch: Partial<Inputs>): void => {
        setInputs((x) => ({ ...x, ...patch }));
        setRun(null);
        clock.reset();
    };
    const go = (): void => {
        setRun(resolve(inputs));
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = run ? judge(guess, outcomeOf(run), OUTCOME_LABEL) : '';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'A name is not an address' : 'Fig. 1 · Where the query goes'}
                </span>
                <span>Teaching model, not a lookup on the internet</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Does the resolver already have the address stored?"
                            options={['yes', 'no'] as const}
                            label={(v) => (v === 'yes' ? 'Stored' : 'Not stored')}
                            value={inputs.cached ? 'yes' : 'no'}
                            onChange={(v) => set({ cached: v === 'yes' })}
                        />
                        <Choice
                            legend="Is the name in the last server's zone?"
                            options={['yes', 'no'] as const}
                            label={(v) => (v === 'yes' ? 'Yes' : 'No')}
                            value={inputs.exists ? 'yes' : 'no'}
                            onChange={(v) => set({ exists: v === 'yes' })}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first"
                                options={OUTCOMES}
                                label={(o) => OUTCOME_LABEL[o]}
                                value={guess}
                                onChange={(o) => {
                                    setGuess(o);
                                    setRun(null);
                                    clock.reset();
                                }}
                            />
                        </div>
                        <button type="button" className="ln-btn" onClick={go}>
                            Run
                        </button>
                    </div>
                ) : null}
                <div ref={result}>
                    <div className="iso" data-theme="light">
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 720 380" aria-hidden="true">
                            {scene.feet.map((f) => (
                                <Metal key={f.key} paths={f.paths} />
                            ))}
                            {scene.screws.map((s) => (
                                <Metal key={s.key} paths={s.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            {scene.parts.map((part) => (
                                <Metal
                                    key={part.key}
                                    paths={part.paths}
                                    lit={part.key === 'client-glass' && step?.kind === 'answer'}
                                />
                            ))}
                            {run && step ? (
                                <g transform={place(REST, scene.seats[step.at], scene.projection)}>
                                    {scene.body.map((part) => (
                                        <Metal key={part.key} paths={part.paths} />
                                    ))}
                                </g>
                            ) : null}
                        </svg>
                    </div>
                    {run && step ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>
                                    Step {index + 1} of {run.steps.length}.
                                </strong>{' '}
                                {step.said} Servers asked so far: {asked}.
                            </p>
                            <Transport
                                label="Query controls"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {finished ? (
                                <p className="m-0 mt-2" data-result>
                                    {OUTCOME_LABEL[outcomeOf(run)]}. {verdict} Name {EXAMPLE_NAME}.
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose what the resolver has stored, predict, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {EXAMPLE_ADDRESS} is a documentation address scripted as this zone&apos;s answer, not a lookup
                this page made. One server per zone. No second try, no alias, no expiry clock.
            </figcaption>
        </figure>
    );
}
