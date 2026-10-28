'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    FIRST_SETTLE,
    LEARN_LOST,
    OUTCOME_LABEL,
    SEGMENT_COUNT,
    endTime,
    events,
    frameAt,
    outcomeOf,
    settle,
    type Body,
    type Outcome,
    type Place,
} from '@/lib/learn/tcp-model';

import { block, corners, cylinder, fit, Metal, place, type Plan, type Point3 } from '../anatomy/metal';

/**
 * One sender, one receiver, one cable. Each cartridge is a segment. Its place on the
 * bench is frameAt().place / along / drop. A lamp, and the cartridge once it is in the
 * tray, lights only when that segment's `read` flag is true.
 */

const REST: Point3 = [0, 0, 0];
const SLUG: Plan = { x: 0, y: 0, w: 11, d: 8, r: 1.2 };
const WIRE_X0 = 78;
const WIRE_X1 = 208;
const WIRE_Y = -4;
const CABLE_Z = 22;
const FLOOR_Z = 5;
const FALL_Y = 22;

const LOST_OPTIONS = ['none', '1', '2', '3', '4', '5'] as const;
type LostOption = (typeof LOST_OPTIONS)[number];
const OUTCOMES: Outcome[] = ['straight', 'holds', 'tail'];
const DRAW: Place[] = ['sender', 'wire', 'receiver', 'lost'];

function toLost(option: LostOption): number | null {
    return option === 'none' ? null : Number(option);
}

function fromLost(lost: number | null): LostOption {
    return lost === null ? 'none' : (String(lost) as LostOption);
}

function bay(segment: number): Point3 {
    return [50, -18 + (segment - 1) * 9, 23];
}

function well(segment: number): Point3 {
    return [232 + (segment - 1) * 16, -8, 22];
}

/** Screen pose of one cartridge. Nothing here is decided outside the body fields. */
function poseOf(body: Body): Point3 {
    if (body.place === 'sender') return bay(body.segment);
    if (body.place === 'receiver') return well(body.segment);
    const x = WIRE_X0 + body.along * (WIRE_X1 - WIRE_X0);
    const y = WIRE_Y + body.drop * (FALL_Y - WIRE_Y);
    const z = CABLE_Z + body.drop * (FLOOR_Z - CABLE_Z);
    return [x, y, z];
}

function holding(held: number[]): string {
    if (held.length === 0) return 'Holding nothing.';
    if (held.length === 1) return `Holding segment ${held[0]}.`;
    const last = held[held.length - 1];
    return `Holding segments ${held.slice(0, -1).join(', ')} and ${last}.`;
}

type Part = { key: string; paths: ReturnType<typeof block> };

function sceneOf() {
    const base: Plan = { x: -28, y: -48, w: 368, d: 112, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 14, d: 14, r: 1 });
    const feet = [
        foot(base.x + 14, base.y + 12),
        foot(base.x + base.w - 28, base.y + 12),
        foot(base.x + 14, base.y + base.d - 26),
        foot(base.x + base.w - 28, base.y + base.d - 26),
    ];
    const sender: Plan = { x: 0, y: -30, w: 74, d: 64, r: 2 };
    const bed: Plan = { x: 6, y: -24, w: 56, d: 52, r: 1 };
    const gland: Plan = { x: 64, y: -14, w: 16, d: 18, r: 1 };
    const cable: Plan = { x: 82, y: -8, w: 136, d: 8, r: 1 };
    const saddles = [118, 164].map((x) => ({ x, y: -7, w: 12, d: 6, r: 0.6 }));
    const receiver: Plan = { x: 222, y: -30, w: 110, d: 58, r: 2 };
    const riser: Plan = { x: 320, y: -24, w: 8, d: 42, r: 1 };
    const rail: Plan = { x: 228, y: 18, w: 96, d: 6, r: 1 };
    const wells = Array.from({ length: SEGMENT_COUNT }, (_, index) => ({
        x: 230 + index * 16,
        y: -14,
        w: 13,
        d: 18,
        r: 1,
    }));
    const pips = Array.from({ length: SEGMENT_COUNT }, (_, index) => ({
        x: 232 + index * 16,
        y: 10,
        w: 9,
        d: 6,
        r: 0.6,
    }));
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 5 },
            ...feet.map((plan) => ({ plan, z: -6, h: 6 })),
            { plan: sender, z: 5, h: 14 },
            { plan: bed, z: 19, h: 4 },
            { plan: gland, z: 12, h: 12 },
            { plan: cable, z: 19, h: 3 },
            { plan: receiver, z: 5, h: 14 },
            { plan: riser, z: 19, h: 16 },
            { plan: SLUG, z: 0, h: 28 },
            { plan: { x: WIRE_X0, y: -8, w: WIRE_X1 - WIRE_X0, d: FALL_Y + 12, r: 0 }, z: 0, h: 28 },
        ]),
        780,
        400
    );
    const part = (key: string, plan: Plan, z: number, height: number): Part => ({
        key,
        paths: block(plan, z, height, projection),
    });
    return {
        projection,
        feet: feet.map((plan) => part(`foot-${plan.x}`, plan, -6, 6)),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}`,
            paths: cylinder(plan.x + 7, plan.y + 7, 1.6, 0, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 5, projection),
        sender: block(sender, 5, 14, projection),
        bed: block(bed, 19, 4, projection),
        pin: cylinder(28, -10, 2.8, 23, 4, projection, 12, 0.3),
        knob: cylinder(34, -30, 5, 19, 6, projection, 14, 0.4),
        gland: block(gland, 12, 12, projection),
        posts: [90, 200].map((x) => ({
            key: `post-${x}`,
            paths: cylinder(x, -4, 3.4, 5, 14, projection, 12, 0.3),
        })),
        cable: block(cable, 19, 3, projection),
        saddles: saddles.map((plan) => part(`saddle-${plan.x}`, plan, 14, 5)),
        receiver: block(receiver, 5, 14, projection),
        riser: block(riser, 19, 16, projection),
        rail: block(rail, 19, 3, projection),
        wells: wells.map((plan, index) => part(`well-${index + 1}`, plan, 19, 3)),
        pips: pips.map((plan, index) => part(`pip-${index + 1}`, plan, 19, 6)),
        slug: block(SLUG, 0, 5, projection),
    };
}

export default function TcpStream({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-tcp-h' : 'fig-tcp-learn';
    const [choice, setChoice] = useState<number | null>(LEARN_LOST);
    const [guess, setGuess] = useState<Outcome | null>(null);
    const [started, setStarted] = useState(false);
    const lost = pane === 'learn' ? LEARN_LOST : choice;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(() => (running ? events(lost) : []), [running, lost]);
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime(lost) : 0;
    const clock = useClock({ marks, end, rate: 6, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const frame = running ? frameAt(lost, clock.t) : null;
    const index = Math.max(0, clock.at);
    const step = story[index];
    const finished = frame !== null && clock.t >= end - 1e-6;
    const bodies = frame
        ? [...frame.bodies].sort((a, b) => DRAW.indexOf(a.place) - DRAW.indexOf(b.place))
        : [];
    const clear = (): void => {
        setStarted(false);
        clock.reset();
    };
    const go = (): void => {
        setStarted(true);
        clock.restart();
        revealAfterRender(() => result.current);
    };
    const verdict = frame ? judge(guess, outcomeOf(lost), OUTCOME_LABEL) : '';
    const settled = running ? settle(lost) : null;
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'A missing segment comes again' : 'Fig. 1 · Which segment falls'}
                </span>
                <span>Teaching model, not a trace of a live connection</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Which segment's first copy falls off the wire?"
                            options={LOST_OPTIONS}
                            label={(option) => (option === 'none' ? 'None' : `Segment ${option}`)}
                            value={fromLost(choice)}
                            onChange={(option) => {
                                setChoice(toLost(option));
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first, for the moment every first trip has finished"
                                options={OUTCOMES}
                                label={(outcome) => OUTCOME_LABEL[outcome]}
                                value={guess}
                                onChange={(outcome) => {
                                    setGuess(outcome);
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
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 780 400" aria-hidden="true">
                            {scene.feet.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.screws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            {scene.saddles.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.posts.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.cable} />
                            <Metal paths={scene.sender} />
                            <Metal paths={scene.bed} />
                            <Metal paths={scene.pin} />
                            <Metal paths={scene.knob} />
                            <Metal paths={scene.gland} />
                            <Metal paths={scene.receiver} />
                            <Metal paths={scene.riser} />
                            {scene.wells.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.rail} />
                            {scene.pips.map((item, pip) => (
                                <Metal
                                    key={item.key}
                                    paths={item.paths}
                                    lit={frame !== null && pip < frame.readCount}
                                />
                            ))}
                            {bodies.map((body) => (
                                <g
                                    key={`${body.segment}-${body.copy}`}
                                    data-segment={body.segment}
                                    data-copy={body.copy}
                                    data-place={body.place}
                                    data-read={body.read ? 'true' : 'false'}
                                    transform={place(REST, poseOf(body), scene.projection)}
                                >
                                    <Metal paths={scene.slug} lit={body.read} />
                                </g>
                            ))}
                        </svg>
                    </div>
                    {frame && step ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>
                                    Step {index + 1} of {story.length}.
                                </strong>{' '}
                                {step.said} Application has read {frame.readCount} of {SEGMENT_COUNT}.{' '}
                                {holding(frame.held)}
                            </p>
                            <Transport
                                label="Segment controls"
                                playing={clock.playing}
                                atStart={clock.t <= 0}
                                atEnd={clock.t >= end - 1e-6}
                                onPlay={clock.play}
                                onPause={clock.pause}
                                onPrev={clock.prev}
                                onNext={clock.next}
                                onReset={clock.reset}
                            />
                            {pane === 'lab' && finished && settled ? (
                                <p className="m-0 mt-2" data-result>
                                    At {FIRST_SETTLE} ticks, the application had read {settled.readCount} of{' '}
                                    {SEGMENT_COUNT}. {holding(settled.held)} {OUTCOME_LABEL[outcomeOf(lost)]}.{' '}
                                    {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">Choose which segment is lost, predict, then press Run.</p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        The cartridge is one segment. Where it sits is the model&apos;s place: on the sender,
                        on the cable, on the floor, or in the tray. The cartridge and its lamp light only when
                        the application has read those bytes. One tick is an assumed unit, not a measured
                        round trip.
                    </>
                ) : (
                    <>
                        The run stays empty until Run. Previous and Next stop on the model&apos;s events. The
                        line after the last event judges the prediction against the moment every first trip
                        has finished, which is before any resend.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
