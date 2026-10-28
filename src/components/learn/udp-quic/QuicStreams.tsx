'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    LEARN_MODE,
    MODE_LABEL,
    MODES,
    OUTCOME_LABEL,
    endTime,
    events,
    frameAt,
    outcomeOf,
    summary,
    type Body,
    type Frame,
    type Mode,
    type Outcome,
} from '@/lib/learn/udp-quic-model';

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
 * Two bodies on one bar. A body's screen position is its place and its
 * stream. On the wire, either stream uses the same bar. Held sits in that
 * stream's cradle. Delivered sits in that stream's far well. The transform
 * is the screen move from the rest pose to the pose at this time.
 */

const REST: Point3 = [0, 0, 0];
const MOUTH: Point3 = [82, -6, 22];
const FAR: Point3 = [198, -6, 22];
const WAIT: Point3 = [18, 20, 22];
const HELD: Record<0 | 1, Point3> = {
    0: [104, -52, 22],
    1: [104, 32, 22],
};
const WELL: Record<0 | 1, Point3> = {
    0: [258, -28, 22],
    1: [260, 12, 22],
};

const OUTCOMES: Outcome[] = ['stalls', 'passes'];

/** Screen pose of one body. The wire segment does not depend on which stream it is. */
function poseOf(body: Body): Point3 {
    if (body.place === 'sender') return body.stream === 0 ? MOUTH : WAIT;
    if (body.place === 'held') return HELD[body.stream];
    if (body.place === 'delivered') return WELL[body.stream];
    return [
        MOUTH[0] + body.along * (FAR[0] - MOUTH[0]),
        MOUTH[1] + body.along * (FAR[1] - MOUTH[1]),
        MOUTH[2] + body.along * (FAR[2] - MOUTH[2]),
    ];
}

function liveLine(frame: Frame): string {
    const line = frame.bodies
        .map((body) => {
            const name = body.stream === 0 ? 'Earlier stream' : 'Later stream';
            const where =
                body.place === 'wire'
                    ? 'on the wire'
                    : body.place === 'held'
                      ? 'held'
                      : body.place === 'delivered'
                        ? 'delivered'
                        : 'at the sender';
            return `${name} is ${where}`;
        })
        .join('. ');
    return `${line}.`;
}

type Part = { key: string; paths: ReturnType<typeof block> };

function sceneOf() {
    const base: Plan = { x: -28, y: -78, w: 384, d: 176, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 18, d: 18, r: 1 });
    const feet = [foot(-12, -64), foot(322, -64), foot(-12, 72), foot(322, 72)];
    const nameplate: Plan = { x: 156, y: 78, w: 52, d: 12, r: 1 };
    const strip: Plan = { x: 48, y: 60, w: 188, d: 8, r: 1 };
    const sender: Plan = { x: 0, y: -32, w: 78, d: 78, r: 2 };
    const bed: Plan = { x: 10, y: -18, w: 48, d: 36, r: 1 };
    const cheekL: Plan = { x: 0, y: -32, w: 8, d: 78, r: 1 };
    const cheekR: Plan = { x: 70, y: -32, w: 8, d: 78, r: 1 };
    const bay: Plan = { x: 12, y: 14, w: 36, d: 26, r: 1 };
    const trough: Plan = { x: 78, y: -10, w: 148, d: 18, r: 1 };
    const rail: Plan = { x: 78, y: -16, w: 148, d: 5, r: 0.6 };
    const saddles = [112, 178].map((x) => ({ x, y: -8, w: 16, d: 14, r: 0.6 }));
    const stops = [78, 214].map((x) => ({ x, y: -14, w: 6, d: 26, r: 0.6 }));
    const cradle0: Plan = { x: 96, y: -62, w: 40, d: 24, r: 1 };
    const cradle1: Plan = { x: 96, y: 26, w: 40, d: 24, r: 1 };
    const lip0: Plan = { x: 96, y: -62, w: 40, d: 4, r: 0.4 };
    const lip1: Plan = { x: 96, y: 46, w: 40, d: 4, r: 0.4 };
    const receiver: Plan = { x: 236, y: -44, w: 100, d: 104, r: 2 };
    const well0: Plan = { x: 250, y: -36, w: 40, d: 28, r: 1 };
    const well1: Plan = { x: 252, y: 6, w: 40, d: 28, r: 1 };
    const divider: Plan = { x: 248, y: -4, w: 68, d: 6, r: 0.6 };
    const riser: Plan = { x: 322, y: -40, w: 10, d: 96, r: 1 };
    const billet0: Plan = { x: 0, y: 0, w: 18, d: 12, r: 1.1 };
    const cap0: Plan = { x: 2, y: 2, w: 14, d: 8, r: 0.6 };
    const billet1: Plan = { x: 0, y: 0, w: 14, d: 18, r: 1.1 };
    const rib1: Plan = { x: 0, y: 7, w: 14, d: 4, r: 0.4 };
    const projection = fit(
        corners([
            { plan: base, z: 0, h: 6 },
            ...feet.map((plan) => ({ plan, z: -10, h: 10 })),
            { plan: sender, z: 6, h: 16 },
            { plan: trough, z: 16, h: 6 },
            { plan: cradle0, z: 16, h: 5 },
            { plan: cradle1, z: 16, h: 5 },
            { plan: receiver, z: 6, h: 16 },
            { plan: riser, z: 22, h: 18 },
            { plan: strip, z: 6, h: 2 },
            { plan: { x: MOUTH[0], y: MOUTH[1], w: 18, d: 12, r: 0 }, z: 22, h: 8 },
            { plan: { x: FAR[0], y: FAR[1], w: 18, d: 12, r: 0 }, z: 22, h: 8 },
            { plan: { x: HELD[0][0], y: HELD[0][1], w: 18, d: 12, r: 0 }, z: 22, h: 8 },
            { plan: { x: HELD[1][0], y: HELD[1][1], w: 14, d: 18, r: 0 }, z: 22, h: 8 },
            { plan: { x: WELL[0][0], y: WELL[0][1], w: 18, d: 12, r: 0 }, z: 22, h: 8 },
            { plan: { x: WELL[1][0], y: WELL[1][1], w: 14, d: 18, r: 0 }, z: 22, h: 8 },
            { plan: { x: WAIT[0], y: WAIT[1], w: 14, d: 18, r: 0 }, z: 22, h: 8 },
        ]),
        780,
        440
    );
    const part = (key: string, plan: Plan, z: number, height: number): Part => ({
        key,
        paths: block(plan, z, height, projection),
    });
    const ticks = topTicks(strip.x + 6, strip.x + strip.w - 6, 10, 4, strip.y, 8, [1.6, 3.2], projection);
    return {
        projection,
        ticks,
        feet: feet.map((plan) => part(`foot-${plan.x}-${plan.y}`, plan, -10, 10)),
        screws: feet.map((plan) => ({
            key: `screw-${plan.x}-${plan.y}`,
            paths: cylinder(plan.x + 9, plan.y + 9, 1.7, 6, 2.2, projection, 10, 0.3),
        })),
        base: block(base, 0, 6, projection),
        nameplate: block(nameplate, 6, 1.6, projection),
        strip: block(strip, 6, 2, projection),
        receiver: block(receiver, 6, 14, projection),
        riser: block(riser, 20, 20, projection),
        rods: [268, 300].map((x) => ({
            key: `rod-${x}`,
            paths: cylinder(x, -40, 2.2, 20, 14, projection, 12, 0.3),
        })),
        divider: block(divider, 20, 4, projection),
        wells: [well0, well1].map((plan, index) => part(`well-${index}`, plan, 20, 3)),
        cradles: [cradle0, cradle1].map((plan, index) => part(`cradle-${index}`, plan, 16, 4)),
        lips: [lip0, lip1].map((plan, index) => part(`lip-${index}`, plan, 20, 3)),
        posts: [96, 206].map((x) => ({
            key: `post-${x}`,
            paths: cylinder(x, -1, 3.2, 6, 16, projection, 12, 0.3),
        })),
        trough: block(trough, 16, 6, projection),
        rail: block(rail, 16, 4, projection),
        saddles: saddles.map((plan) => part(`saddle-${plan.x}`, plan, 14, 4)),
        stops: stops.map((plan) => part(`stop-${plan.x}`, plan, 16, 8)),
        sender: block(sender, 6, 14, projection),
        cheeks: [cheekL, cheekR].map((plan, index) => part(`cheek-${index}`, plan, 20, 10)),
        bed: block(bed, 20, 3, projection),
        bay: block(bay, 20, 3, projection),
        knob: cylinder(36, -28, 5.2, 20, 6, projection, 14, 0.4),
        pin: cylinder(36, -28, 1.6, 26, 3, projection, 10, 0.2),
        billet0: block(billet0, 0, 6, projection),
        cap0: block(cap0, 6, 2.4, projection),
        billet1: block(billet1, 0, 5, projection),
        rib1: block(rib1, 5, 2.2, projection),
    };
}

function BodyMark({ scene, body }: { scene: ReturnType<typeof sceneOf>; body: Body }): React.JSX.Element {
    const lit = body.lost;
    if (body.stream === 0) {
        return (
            <g
                data-stream={body.stream}
                data-place={body.place}
                data-along={body.along.toFixed(3)}
                data-lost="true"
                transform={place(REST, poseOf(body), scene.projection)}
            >
                <Metal paths={scene.billet0} lit={lit} part="body" />
                <Metal paths={scene.cap0} lit={lit} />
            </g>
        );
    }
    return (
        <g
            data-stream={body.stream}
            data-place={body.place}
            data-along={body.along.toFixed(3)}
            data-lost="false"
            transform={place(REST, poseOf(body), scene.projection)}
        >
            <Metal paths={scene.billet1} part="body" />
            <Metal paths={scene.rib1} />
        </g>
    );
}

export default function QuicStreams({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-quic-h' : 'fig-quic-learn';
    const [choice, setChoice] = useState<Mode>('byte');
    const [guess, setGuess] = useState<Outcome | null>(null);
    const [started, setStarted] = useState(false);
    const mode: Mode = pane === 'learn' ? LEARN_MODE : choice;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(() => (running ? events(mode) : []), [running, mode]);
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime() : 0;
    const clock = useClock({ marks, end, rate: 2.4, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(), []);
    const frame = running ? frameAt(mode, clock.t) : null;
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
    const verdict = frame ? judge(guess, outcomeOf(mode), OUTCOME_LABEL) : '';
    return (
        <figure ref={figure} className="bp-sheet ln-fig" aria-labelledby={figId} data-mode={mode}>
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn' ? 'One lost packet holds one stream' : 'Fig. 1 · One path, two bodies'}
                </span>
                <span>Teaching model, not a trace of a live connection</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="How are the two bodies ordered?"
                            options={MODES}
                            label={(option) => MODE_LABEL[option]}
                            value={choice}
                            onChange={(option) => {
                                setChoice(option);
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first, for when the run has finished"
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
                        <svg
                            className="bp-svg ln-svg iso-svg"
                            viewBox="0 0 780 440"
                            aria-hidden="true"
                            data-later-stalls={frame?.laterStalls ? 'true' : 'false'}
                        >
                            {scene.feet.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.screws.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.base} />
                            <Metal paths={scene.nameplate} />
                            <Metal paths={scene.strip} />
                            <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            <Metal paths={scene.riser} />
                            {scene.rods.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.receiver} />
                            <Metal paths={scene.divider} />
                            {scene.wells.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.cradles.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.lips.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.posts.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.saddles.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            {scene.stops.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.rail} />
                            <Metal paths={scene.trough} />
                            {scene.cheeks.map((item) => (
                                <Metal key={item.key} paths={item.paths} />
                            ))}
                            <Metal paths={scene.sender} />
                            <Metal paths={scene.bed} />
                            <Metal paths={scene.bay} />
                            <Metal paths={scene.knob} />
                            <Metal paths={scene.pin} />
                            {frame
                                ? [frame.bodies[1], frame.bodies[0]].map((body) => (
                                      <BodyMark key={body.stream} scene={scene} body={body} />
                                  ))
                                : null}
                        </svg>
                    </div>
                    {frame && step ? (
                        <>
                            <p className="m-0 mt-2" data-current-step>
                                <strong>
                                    Step {index + 1} of {story.length}.
                                </strong>{' '}
                                {step.said} {liveLine(frame)}
                            </p>
                            <Transport
                                label="Stream controls"
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
                                    {summary(mode)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose one byte stream or one stream each, predict, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        Where a body sits is its place, and which body it is is its stream. This pass ends
                        with the earlier stream held and the later stream delivered.
                    </>
                ) : (
                    <>
                        Previous and Next stop on the model&apos;s events. After the last event, the line
                        names the place of the later stream.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
