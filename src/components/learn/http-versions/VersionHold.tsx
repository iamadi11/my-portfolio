'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Choice from '@/components/learn/kit/Choice';
import { revealAfterRender } from '@/components/learn/kit/reveal';
import Transport from '@/components/learn/kit/Transport';
import { useClock } from '@/components/learn/kit/useClock';
import { verdict as judge } from '@/components/learn/kit/verdict';
import {
    HOLD_LABEL,
    LEARN_VERSION,
    LOST,
    VERSION_LABEL,
    VERSIONS,
    endTime,
    events,
    frameAt,
    heldCount,
    summary,
    type Body,
    type Frame,
    type Hold,
    type Version,
} from '@/lib/learn/http-versions-model';

import {
    block,
    corners,
    cylinder,
    fit,
    iso,
    Metal,
    place,
    topTicks,
    type Plan,
    type Point3,
} from '../anatomy/metal';

const GUESSES = ['1', '2', '3'] as const;
type Guess = (typeof GUESSES)[number];

const GUESS_LABEL: Record<Guess, string> = {
    '1': HOLD_LABEL[1],
    '2': HOLD_LABEL[2],
    '3': HOLD_LABEL[3],
};

function guessOf(hold: Hold): Guess {
    if (hold === 1) return '1';
    if (hold === 2) return '2';
    return '3';
}

/**
 * Three response bodies on a return press. The earliest is an open
 * channel, the middle is a solid block, and the latest carries a rib.
 * A body's screen position is its place. HTTP/1.1 queues them on one
 * trough. HTTP/2 sets them on one beam with a lock across it. HTTP/3
 * gives each its own rail. The transform is the screen move from the
 * rest pose to the pose at this time.
 */

const REST: Point3 = [0, 0, 0];
const LANE = [-42, 0, 42] as const;
const Z = 22;
const WAIT_X = 18;
const MOUTH_X = 86;
const FAR_X = 204;
const DOCK_X = 268;
const HOLD_Y = 78;

const ROLE = ['Earliest response', 'Middle response', 'Latest response'] as const;

const WHERE: Record<Body['place'], string> = {
    waiting: 'waiting',
    wire: 'on the wire',
    held: 'held',
    delivered: 'delivered',
};

/** Screen pose of one response. On HTTP/1.1 the wire is the single trough. */
function poseOf(version: Version, body: Body): Point3 {
    const lane = LANE[body.id];
    if (body.place === 'waiting') return [WAIT_X, lane, Z];
    if (body.place === 'held') return [100 + body.id * 34, HOLD_Y, Z];
    const y = version === 'h1' ? LANE[1] : lane;
    if (body.place === 'delivered') return [DOCK_X, y, Z];
    return [MOUTH_X + body.along * (FAR_X - MOUTH_X), y, Z];
}

function liveLine(frame: Frame): string {
    const line = frame.bodies.map((body) => `${ROLE[body.id]} is ${WHERE[body.place]}`).join('. ');
    return `${line}.`;
}

type Pending =
    | { key: string; kind: 'block'; plan: Plan; z: number; h: number; part?: string }
    | {
          key: string;
          kind: 'cyl';
          cx: number;
          cy: number;
          radius: number;
          z: number;
          h: number;
          steps: number;
          bevel: number;
      };

function sceneOf(version: Version) {
    const pending: Pending[] = [];
    const boxes: { plan: Plan; z: number; h: number }[] = [];
    const slab = (key: string, plan: Plan, z: number, h: number, part?: string): void => {
        pending.push({ key, kind: 'block', plan, z, h, part });
        boxes.push({ plan, z, h });
    };
    const peg = (
        key: string,
        cx: number,
        cy: number,
        radius: number,
        z: number,
        h: number,
        steps: number,
        bevel: number
    ): void => {
        pending.push({ key, kind: 'cyl', cx, cy, radius, z, h, steps, bevel });
        boxes.push({
            plan: { x: cx - radius, y: cy - radius, w: radius * 2, d: radius * 2, r: radius },
            z,
            h,
        });
    };

    const base: Plan = { x: -32, y: -84, w: 410, d: 230, r: 6 };
    const foot = (x: number, y: number): Plan => ({ x, y, w: 18, d: 18, r: 1 });
    const feet = [foot(-16, -70), foot(340, -70), foot(-16, 124), foot(340, 124)];
    slab('base', base, 0, 6);
    for (const plan of feet) {
        slab(`foot-${plan.x}-${plan.y}`, plan, -10, 10);
        peg(`screw-${plan.x}-${plan.y}`, plan.x + 9, plan.y + 9, 1.7, 6, 2.2, 10, 0.3);
    }
    const nameplate: Plan = { x: 168, y: 132, w: 52, d: 12, r: 1 };
    const strip: Plan = { x: 48, y: 116, w: 196, d: 8, r: 1 };
    slab('nameplate', nameplate, 6, 1.6);
    slab('strip', strip, 6, 2);

    const server: Plan = { x: -8, y: -60, w: 80, d: 132, r: 2 };
    slab('server', server, 6, 14, 'server');
    slab('cheek-l', { x: -8, y: -60, w: 8, d: 132, r: 1 }, 20, 10);
    slab('cheek-r', { x: 64, y: -60, w: 8, d: 132, r: 1 }, 20, 10);
    slab('back', { x: -8, y: -60, w: 80, d: 8, r: 1 }, 20, 16);
    slab('bed', { x: 4, y: -48, w: 56, d: 108, r: 1 }, 20, 3);
    LANE.forEach((y, index) => {
        slab(`pocket-${index}`, { x: 12, y: y - 3, w: 34, d: 18, r: 1 }, 20, 3);
    });
    peg('knob', 28, -48, 5.2, 23, 6, 14, 0.4);
    peg('pin', 28, -48, 1.6, 29, 3, 10, 0.2);
    peg('post-a', 74, -36, 3, 6, 18, 12, 0.3);
    peg('post-b', 74, 36, 3, 6, 18, 12, 0.3);

    if (version === 'h1') {
        slab('trough', { x: 78, y: -8, w: 156, d: 24, r: 1 }, 16, 5, 'carrier');
        slab('rail', { x: 78, y: -12, w: 156, d: 5, r: 0.6 }, 16, 3);
        for (const x of [118, 176]) {
            slab(`saddle-${x}`, { x, y: -6, w: 16, d: 18, r: 0.6 }, 14, 4);
            slab(`link-${x}`, { x: x + 2, y: 0, w: 8, d: 8, r: 0.4 }, 21, 3);
        }
        for (const x of [78, 222]) slab(`stop-${x}`, { x, y: -12, w: 6, d: 30, r: 0.6 }, 16, 8);
        peg('guide-a', 96, 4, 2.4, 16, 10, 10, 0.2);
        peg('guide-b', 210, 4, 2.4, 16, 10, 10, 0.2);
    } else if (version === 'h2') {
        slab('beam', { x: 78, y: -54, w: 156, d: 116, r: 1 }, 14, 4, 'carrier');
        slab('lock', { x: 148, y: -58, w: 14, d: 124, r: 1 }, 18, 5);
        LANE.forEach((y, index) => {
            slab(`pad-${index}`, { x: 90, y: y - 3, w: 128, d: 16, r: 0.6 }, 18, 2);
        });
        slab('stop-near', { x: 78, y: -58, w: 6, d: 124, r: 0.6 }, 18, 8);
        slab('stop-far', { x: 226, y: -58, w: 6, d: 124, r: 0.6 }, 18, 8);
        peg('clamp-a', 155, -54, 2.6, 23, 6, 10, 0.2);
        peg('clamp-b', 155, 62, 2.6, 23, 6, 10, 0.2);
    } else {
        LANE.forEach((y, index) => {
            slab(
                `rail-${index}`,
                { x: 78, y: y - 6, w: 156, d: 18, r: 1 },
                16,
                5,
                index === 1 ? 'carrier' : undefined
            );
            slab(`shoe-${index}`, { x: 146, y: y - 2, w: 18, d: 10, r: 0.5 }, 21, 3);
            slab(`stop-${index}`, { x: 78, y: y - 8, w: 6, d: 22, r: 0.5 }, 16, 8);
            peg(`guide-${index}`, 96, y + 3, 2.2, 16, 10, 10, 0.2);
        });
    }

    slab('client', { x: 248, y: -60, w: 108, d: 132, r: 2 }, 6, 14, 'client');
    slab('riser', { x: 342, y: -56, w: 10, d: 124, r: 1 }, 20, 20);
    peg('rod-a', 276, -56, 2.2, 20, 14, 12, 0.3);
    peg('rod-b', 320, -56, 2.2, 20, 14, 12, 0.3);
    LANE.forEach((y, index) => {
        slab(`seat-${index}`, { x: 258, y: y - 4, w: 42, d: 20, r: 1 }, 20, 3);
    });
    slab('div-a', { x: 256, y: -16, w: 72, d: 6, r: 0.5 }, 20, 4);
    slab('div-b', { x: 256, y: 26, w: 72, d: 6, r: 0.5 }, 20, 4);
    slab('lip', { x: 248, y: 66, w: 108, d: 6, r: 0.5 }, 20, 4);

    for (const [index, x] of [100, 134, 168].entries()) {
        slab(`fork-${index}`, { x, y: HOLD_Y - 4, w: 28, d: 20, r: 1 }, 16, 4);
        slab(`fork-lip-${index}`, { x, y: HOLD_Y + 12, w: 28, d: 4, r: 0.4 }, 20, 3);
    }

    for (const id of [0, 1, 2] as const) {
        for (const place of ['waiting', 'wire', 'held', 'delivered'] as const) {
            for (const along of place === 'wire' ? [0, 1] : [0]) {
                const body: Body = { id, place, along, lost: id === LOST };
                const [x, y, z] = poseOf(version, body);
                boxes.push({ plan: { x, y, w: 18, d: 14, r: 0 }, z, h: 10 });
            }
        }
    }

    const projection = fit(corners(boxes), 780, 500);
    const solids = pending.map((item) => {
        if (item.kind === 'cyl') {
            return {
                key: item.key,
                paths: cylinder(
                    item.cx,
                    item.cy,
                    item.radius,
                    item.z,
                    item.h,
                    projection,
                    item.steps,
                    item.bevel
                ),
            };
        }
        return {
            key: item.key,
            part: item.part,
            paths: block(item.plan, item.z, item.h, projection),
        };
    });
    const channel: Plan = { x: 0, y: 0, w: 18, d: 12, r: 0.8 };
    const wall = (x: number): Plan => ({ x, y: 0, w: 3.2, d: 12, r: 0.4 });
    const cube: Plan = { x: 0, y: 0, w: 14, d: 14, r: 1 };
    const ribbed: Plan = { x: 0, y: 0, w: 16, d: 13, r: 0.8 };
    const rib: Plan = { x: 1.2, y: 5, w: 13.6, d: 3.2, r: 0.4 };
    return {
        projection,
        solids,
        ticks: topTicks(strip.x + 6, strip.x + strip.w - 6, 10, 4, strip.y, 8, [1.6, 3.2], projection),
        channel: block(channel, 0, 3, projection),
        channelL: block(wall(0), 3, 6, projection),
        channelR: block(wall(14.8), 3, 6, projection),
        cube: block(cube, 0, 9, projection),
        ribbed: block(ribbed, 0, 6, projection),
        rib: block(rib, 6, 3.2, projection),
    };
}

type Scene = ReturnType<typeof sceneOf>;

function BodyMark({
    scene,
    version,
    body,
}: {
    scene: Scene;
    version: Version;
    body: Body;
}): React.JSX.Element {
    const lit = body.lost;
    const transform = place(REST, poseOf(version, body), scene.projection);
    const mark =
        body.id === 0 ? (
            <>
                <Metal paths={scene.channel} lit={lit} part="body" />
                <Metal paths={scene.channelL} lit={lit} />
                <Metal paths={scene.channelR} lit={lit} />
            </>
        ) : body.id === 1 ? (
            <Metal paths={scene.cube} lit={lit} part="body" />
        ) : (
            <>
                <Metal paths={scene.ribbed} lit={lit} part="body" />
                <Metal paths={scene.rib} lit={lit} />
            </>
        );
    return (
        <g
            data-body={body.id}
            data-place={body.place}
            data-along={body.along.toFixed(3)}
            data-lost={lit ? 'true' : 'false'}
            transform={transform}
        >
            {mark}
        </g>
    );
}

export default function VersionHold({ pane = 'lab' }: { pane?: 'learn' | 'lab' }): React.JSX.Element {
    const figId = pane === 'lab' ? 'fig-hver-h' : 'fig-hver-learn';
    const [choice, setChoice] = useState<Version>('h1');
    const [guess, setGuess] = useState<Guess | null>(null);
    const [started, setStarted] = useState(false);
    const version: Version = pane === 'learn' ? LEARN_VERSION : choice;
    const running = pane === 'learn' || started;
    const result = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    const story = useMemo(() => (running ? events(version) : []), [running, version]);
    const marks = useMemo(() => (story.length ? story.map((event) => event.t) : [0]), [story]);
    const end = story.length ? endTime(version) : 0;
    const clock = useClock({ marks, end, rate: 2, target: figure });
    const { restart } = clock;
    useEffect(() => {
        if (pane !== 'learn') return undefined;
        restart();
        return undefined;
    }, [pane, restart]);
    const scene = useMemo(() => sceneOf(version), [version]);
    const frame = running ? frameAt(version, clock.t) : null;
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
    const verdict = frame ? judge(guess, guessOf(heldCount(version)), GUESS_LABEL) : '';
    const ordered = frame
        ? [...frame.bodies].sort((a, b) => {
              const ay = iso(poseOf(version, a), scene.projection)[1];
              const by = iso(poseOf(version, b), scene.projection)[1];
              return ay - by;
          })
        : [];
    return (
        <figure
            ref={figure}
            className="bp-sheet ln-fig"
            aria-labelledby={figId}
            data-version={version}
            data-held={frame ? String(frame.held) : undefined}
        >
            <div className="ln-fig-head">
                <span id={figId}>
                    {pane === 'learn'
                        ? 'One lost packet holds one response'
                        : 'Fig. 1 · Three responses, one lost carrier'}
                </span>
                <span>Teaching model, not a trace of a live connection</span>
            </div>
            <div className={pane === 'lab' ? 'ln-fig-grid' : 'ln-fig-grid ln-fig-grid-one'}>
                {pane === 'lab' ? (
                    <div className="ln-controls">
                        <Choice
                            legend="Which version carries the three responses?"
                            options={VERSIONS}
                            label={(option) => VERSION_LABEL[option]}
                            value={choice}
                            onChange={(option) => {
                                setChoice(option);
                                clear();
                            }}
                        />
                        <div className="ln-predict">
                            <Choice
                                legend="Predict first, for when the run has finished"
                                options={GUESSES}
                                label={(hold) => GUESS_LABEL[hold]}
                                value={guess}
                                onChange={(hold) => {
                                    setGuess(hold);
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
                        <svg className="bp-svg ln-svg iso-svg" viewBox="0 0 780 500" aria-hidden="true">
                            {scene.solids.map((item) => (
                                <Metal
                                    key={item.key}
                                    paths={item.paths}
                                    part={'part' in item ? item.part : undefined}
                                />
                            ))}
                            <path className="iso-line" data-tone="lo" d={scene.ticks.minor} />
                            <path className="iso-line" data-tone="mid" d={scene.ticks.major} />
                            {ordered.map((body) => (
                                <BodyMark key={body.id} scene={scene} version={version} body={body} />
                            ))}
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
                                label="Response controls"
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
                                    {summary(version)} {verdict}
                                </p>
                            ) : null}
                        </>
                    ) : (
                        <p className="ln-frame">
                            Choose HTTP/1.1, HTTP/2, or HTTP/3, predict how many stay held, then press Run.
                        </p>
                    )}
                </div>
            </div>
            <figcaption className="ln-label mt-4">
                {pane === 'learn' ? (
                    <>
                        Where a body sits is its place. This pass ends with one response held and the other
                        two delivered.
                    </>
                ) : (
                    <>
                        Previous and Next stop on the model&apos;s events. After the last event, the line
                        names how many responses stay held.
                    </>
                )}
            </figcaption>
        </figure>
    );
}
