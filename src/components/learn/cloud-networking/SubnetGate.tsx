'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    ARRIVAL_LABEL,
    ARRIVALS,
    LEARN_TRIP,
    TRIP_LABEL,
    TRIPS,
    arrivalOf,
    endTime,
    events,
    frameAt,
    type Arrival,
    type Frame,
    type Place,
    type Trip,
} from '@/lib/learn/cloud-networking-model';

import {
    block,
    corners,
    cylinder,
    fit,
    Metal,
    place,
    topTicks,
    type Plan,
    type Point3,
} from '../anatomy/metal';

/**
 * Two yards and one door. The open yard is lower and has no street wall.
 * The other yard is walled, with one doorway. The packet is the only thing
 * that moves: one screen translate from frameAt().place and along.
 * No word on the metal says which yard is which.
 */

const REST: Point3 = [0, 0, 0];
const SLUG: Plan = { x: 0, y: 0, w: 16, d: 11, r: 1.1 };
const BAND: Plan = { x: 2, y: 2, w: 12, d: 7, r: 0.6 };

/** Packet origin. The failed trip stops on the solid street wall, beside the door. */
const BOUNDARY_AT: Point3 = [172, 5, 18];
const PUBLIC_AT: Point3 = [52, 48, 18];
const PRIVATE_AT: Point3 = [220, 56, 18];
const NAT_AT: Point3 = [204, 16, 20];
const STREET: Record<Trip, Point3> = {
    public: [52, -18, 16],
    private: [172, -18, 16],
    nat: [204, -18, 16],
};

function station(trip: Trip, where: Place): Point3 {
    if (where === 'outside') return STREET[trip];
    if (where === 'public subnet') return PUBLIC_AT;
    if (where === 'stopped at the boundary') return BOUNDARY_AT;
    if (where === 'through the NAT') return NAT_AT;
    return PRIVATE_AT;
}

/** Screen pose of the packet. Nothing here is decided outside the frame. */
function poseOf(frame: Frame): Point3 {
    const at = station(frame.trip, frame.place);
    const from = station(frame.trip, frame.from);
    if (frame.from === frame.place || frame.along >= 1) return at;
    const along = frame.along;
    return [
        from[0] + along * (at[0] - from[0]),
        from[1] + along * (at[1] - from[1]),
        from[2] + along * (at[2] - from[2]),
    ];
}

function liveLine(frame: Frame): string {
    if (frame.from === frame.place || frame.along >= 1 - 1e-6) return '';
    if (frame.place === 'stopped at the boundary') return 'It is still short of the boundary.';
    if (frame.place === 'public subnet') return 'It is still short of the public subnet.';
    if (frame.place === 'through the NAT' && frame.from === 'outside') {
        return 'The reply is still short of the door.';
    }
    if (frame.place === 'through the NAT') return 'It is still short of the door.';
    if (frame.place === 'outside') return 'It is still short of the street.';
    return 'The reply is still short of the private subnet.';
}

type Part = { key: string; paths: ReturnType<typeof block> };

function sceneOf() {
    const base: Plan = { x: -28, y: -56, w: 400, d: 230, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 16, d: 16, r: 1 });
    const feet = [
        foot(base.x + 18, base.y + 16),
        foot(base.x + base.w - 34, base.y + 16),
        foot(base.x + 18, base.y + base.d - 32),
        foot(base.x + base.w - 34, base.y + base.d - 32),
    ];
    const street: Plan = { x: 4, y: -40, w: 320, d: 56, r: 2 };
    const openFloor: Plan = { x: 8, y: 16, w: 132, d: 120, r: 2 };
    const openLeft: Plan = { x: 8, y: 16, w: 8, d: 120, r: 1 };
    const openBack: Plan = { x: 8, y: 128, w: 132, d: 8, r: 1 };
    const divider: Plan = { x: 140, y: 16, w: 10, d: 120, r: 1 };
    const walledFloor: Plan = { x: 150, y: 24, w: 152, d: 104, r: 2 };
    const walledBack: Plan = { x: 150, y: 128, w: 160, d: 8, r: 1 };
    const walledRight: Plan = { x: 302, y: 16, w: 8, d: 120, r: 1 };
    const frontLeft: Plan = { x: 150, y: 16, w: 50, d: 8, r: 1 };
    const frontRight: Plan = { x: 224, y: 16, w: 86, d: 8, r: 1 };
    const lintel: Plan = { x: 200, y: 16, w: 24, d: 8, r: 0.6 };
    const threshold: Plan = { x: 198, y: 12, w: 28, d: 14, r: 0.4 };
    const leaf: Plan = { x: 228, y: 2, w: 6, d: 18, r: 0.4 };
    const rail: Plan = { x: 208, y: 26, w: 8, d: 36, r: 0.4 };
    const shortCab: Plan = { x: 36, y: 70, w: 32, d: 26, r: 1 };
    const shortCap: Plan = { x: 40, y: 74, w: 24, d: 18, r: 0.8 };
    const tallCab: Plan = { x: 236, y: 72, w: 32, d: 26, r: 1 };
    const tallCap: Plan = { x: 240, y: 76, w: 24, d: 18, r: 0.8 };
    const strip: Plan = { x: 12, y: -52, w: 180, d: 6, r: 0.5 };
    const plate: Plan = { x: 20, y: 148, w: 28, d: 10, r: 0.4 };
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 8 },
            ...feet.map((plan) => ({ plan, z: -8, h: 8 })),
            { plan: street, z: 8, h: 3 },
            { plan: openFloor, z: 8, h: 4 },
            { plan: openLeft, z: 12, h: 16 },
            { plan: divider, z: 12, h: 52 },
            { plan: walledBack, z: 12, h: 52 },
            { plan: walledRight, z: 12, h: 52 },
            { plan: frontLeft, z: 12, h: 52 },
            { plan: lintel, z: 36, h: 28 },
            { plan: tallCab, z: 12, h: 40 },
            { plan: shortCab, z: 12, h: 22 },
            { plan: strip, z: 8, h: 2 },
            { plan: SLUG, z: 0, h: 28 },
            { plan: { x: 40, y: -24, w: 200, d: 90, r: 0 }, z: 12, h: 24 },
        ]),
        780,
        460
    );
    const part = (key: string, plan: Plan, z: number, height: number): Part => ({
        key,
        paths: block(plan, z, height, projection),
    });
    const ticks = topTicks(strip.x + 8, strip.x + strip.w - 8, 12, 4, strip.y, 10, [1.4, 2.8], projection);
    const bolt = (key: string, x: number, y: number, z: number) => ({
        key,
        paths: cylinder(x, y, 1.5, z, 2.2, projection, 8, 0.2),
    });
    return {
        projection,
        ticks,
        feet: feet.map((plan) => part(`foot-${plan.x}-${plan.y}`, plan, -8, 8)),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}-${plan.y}`,
            paths: cylinder(plan.x + 8, plan.y + 8, 1.7, -2, 2.4, projection, 8, 0.2),
        })),
        base: block(base, 0, 8, projection),
        plate: block(plate, 8, 1.2, projection),
        strip: block(strip, 8, 2, projection),
        street: block(street, 8, 3, projection),
        openFloor: block(openFloor, 8, 4, projection),
        openLeft: block(openLeft, 12, 16, projection),
        openBack: block(openBack, 12, 16, projection),
        bayPosts: [18, 120].map((x) => ({
            key: `bay-${x}`,
            paths: cylinder(x, 20, 3.2, 12, 22, projection, 10, 0.3),
        })),
        divider: block(divider, 12, 52, projection),
        walledFloor: block(walledFloor, 8, 4, projection),
        walledBack: block(walledBack, 12, 52, projection),
        walledRight: block(walledRight, 12, 52, projection),
        frontLeft: block(frontLeft, 12, 52, projection),
        frontRight: block(frontRight, 12, 52, projection),
        lintel: block(lintel, 36, 28, projection),
        threshold: block(threshold, 12, 2, projection),
        leaf: block(leaf, 12, 24, projection),
        hinge: cylinder(224, 18, 1.6, 12, 20, projection, 8, 0.2),
        latch: block({ x: 229, y: 8, w: 3, d: 4, r: 0.3 }, 22, 3, projection),
        rail: block(rail, 12, 2, projection),
        saddles: [32, 52].map((y) => part(`saddle-${y}`, { x: 206, y, w: 12, d: 6, r: 0.4 }, 12, 3)),
        shortCab: block(shortCab, 12, 22, projection),
        shortCap: block(shortCap, 34, 3, projection),
        shortVents: [76, 84].map((y) =>
            part(`short-vent-${y}`, { x: 40, y, w: 22, d: 2.2, r: 0.3 }, 20, 1.4)
        ),
        tallCab: block(tallCab, 12, 40, projection),
        tallCap: block(tallCap, 52, 3, projection),
        tallVents: [78, 88].map((y) => part(`tall-vent-${y}`, { x: 240, y, w: 22, d: 2.2, r: 0.3 }, 28, 1.4)),
        bolts: [
            bolt('bolt-div', 145, 24, 64),
            bolt('bolt-back', 160, 132, 64),
            bolt('bolt-right', 306, 24, 64),
            bolt('bolt-front', 160, 20, 64),
        ],
        slug: block(SLUG, 0, 6, projection),
        band: block(BAND, 6, 2, projection),
        nose: cylinder(14, 5.5, 2.2, 1, 4, projection, 8, 0.2),
    };
}

export default function SubnetGate({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-vpc-h' : 'fig-vpc-learn';
    const [choice, setChoice] = useState<Trip>('public');
    const [guess, setGuess] = useState<Arrival | null>(null);
    const [started, setStarted] = useState(false);
    const trip = pane === 'learn' ? LEARN_TRIP : choice;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(() => (running ? events(trip) : []), [running, trip]);
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime(trip) : 0;
    const clock = useClock({ marks, end, rate: 2.4, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const frame = running ? frameAt(trip, clock.t) : null;
    const index = Math.max(0, clock.at);
    const step = story[index];
    const finished = frame !== null && clock.t >= end - 1e-6;
    const clear = (): void => {
        setStarted(false);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = frame ? judge(guess, arrivalOf(trip), ARRIVAL_LABEL) : '';
    const line = frame && step ? liveLine(frame) : '';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn'
                        ? 'A body from outside stops at the boundary'
                        : 'Fig. 1 · Where the body ends'}
                </span>
                <span>Teaching model, not a trace of a live network</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Where is this body going?"
                            options={TRIPS}
                            label={(option) => TRIP_LABEL[option]}
                            value={choice}
                            onChange={(option) => {
                                setChoice(option);
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first. Will it arrive?"
                                options={ARRIVALS}
                                label={(option) => ARRIVAL_LABEL[option]}
                                value={guess}
                                onChange={(option) => {
                                    setGuess(option);
                                    clear();
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
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 780 460" aria-hidden="true">
                            {scene.feet.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.screws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            <Metal paths={scene.plate} />
                            <Metal paths={scene.strip} />
                            <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            <Metal paths={scene.street} />
                            <Metal paths={scene.openFloor} part="open-yard" />
                            <Metal paths={scene.walledFloor} part="walled-yard" />
                            <Metal paths={scene.openLeft} />
                            <Metal paths={scene.openBack} />
                            {scene.bayPosts.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.divider} />
                            <Metal paths={scene.walledBack} />
                            <Metal paths={scene.walledRight} />
                            <Metal paths={scene.frontLeft} part="boundary-wall" />
                            <Metal paths={scene.frontRight} />
                            <Metal paths={scene.lintel} part="nat-door" />
                            <Metal paths={scene.threshold} />
                            <Metal paths={scene.rail} />
                            {scene.saddles.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.leaf} />
                            <Metal paths={scene.hinge} />
                            <Metal paths={scene.latch} />
                            <Metal paths={scene.shortCab} />
                            <Metal paths={scene.shortCap} />
                            {scene.shortVents.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.tallCab} />
                            <Metal paths={scene.tallCap} />
                            {scene.tallVents.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.bolts.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {frame ? (
                                <g
                                    data-place={frame.place}
                                    data-from={frame.from}
                                    data-along={frame.along.toFixed(3)}
                                    data-arrived={frame.arrived ? 'true' : 'false'}
                                    data-trip={frame.trip}
                                    transform={place(REST, poseOf(frame), scene.projection)}
                                >
                                    <Metal paths={scene.slug} lit />
                                    <Metal
                                        paths={scene.band}
                                        lit={frame.place === 'stopped at the boundary'}
                                    />
                                    <Metal paths={scene.nose} />
                                </g>
                            ) : null}
                        </svg>
                    </div>
                    {frame && step ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>
                                    Step {index + 1} of {story.length}.
                                </strong>{' '}
                                {step.said}
                                {line ? ` ${line}` : ''}
                            </p>
                            <Transport
                                label="Subnet controls"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {pane === 'lab' && finished ? (
                                <p className="m-0 mt-2" data-result>
                                    {ARRIVAL_LABEL[arrivalOf(trip)]}. {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose the destination, predict whether it arrives, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        The body is the packet. Its place is outside, the public subnet, stopped at the
                        boundary, through the NAT, or the private subnet. This run ends stopped at the
                        boundary. Four ticks for the hop is assumed. Dropping this unsolicited packet is this
                        model&apos;s rule.
                    </>
                ) : (
                    <>
                        The yards stay still until Run. You choose the destination and predict whether the
                        body arrives. The line after the last event is the model&apos;s result. Previous and
                        Next stop on the model&apos;s events.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
